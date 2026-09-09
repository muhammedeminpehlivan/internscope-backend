using System.Net;
using System.ServiceModel.Syndication;
using System.Text.RegularExpressions;
using System.Xml;
using InternScope.Entities;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

// appsettings > News:Feeds içindeki her satır (zengin yapılandırma).
public class NewsFeedConfig
{
    public string Url { get; set; } = null!;
    public string SourceName { get; set; } = "Haber";
    public string Category { get; set; } = "Genel";
}

// Belirli aralıklarla RSS kaynaklarını çekip DB'ye upsert eden arka plan servisi.
// Kullanıcı istekleri asla dış kaynağa gitmez; hep DB'den okunur (Render'ın geçici
// diskine değil, kalıcı Postgres'e yazar). Her feed kendi try/catch'inde — bir
// kaynak patlasa bile diğerleri ve uygulama etkilenmez.
public class NewsBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NewsBackgroundService> _logger;

    public NewsBackgroundService(
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<NewsBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Render'da NEWS_REFRESH_MINUTES env var'ıyla; yoksa appsettings; yoksa 60 dk.
        var minutes = _configuration.GetValue<int?>("NEWS_REFRESH_MINUTES")
            ?? _configuration.GetValue<int?>("News:RefreshIntervalMinutes")
            ?? 60;
        var interval = TimeSpan.FromMinutes(minutes < 1 ? 60 : minutes);

        // Açılışta bir kez, sonra her interval'de tekrar çek.
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RefreshAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                // Tüm döngüyü koruyan son savunma — servis asla çökmesin.
                _logger.LogError(ex, "Haber çekimi genel hata verdi.");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break; // uygulama kapanıyor
            }
        }
    }

    private async Task RefreshAsync(CancellationToken ct)
    {
        var feeds = ResolveFeeds();
        if (feeds.Count == 0)
        {
            _logger.LogWarning("Haber kaynağı yok — NEWS_RSS_URLS veya News:Feeds boş.");
            return;
        }

        var maxPerFeed = _configuration.GetValue<int?>("News:MaxItemsPerFeed") ?? 25;
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(20);
        // Bazı kaynaklar (Google News dahil) User-Agent olmadan 403 döndürebiliyor.
        client.DefaultRequestHeaders.UserAgent.ParseAdd("InternScope/1.0 (+https://internscope)");

        var candidates = new List<NewsArticle>();

        foreach (var feed in feeds)
        {
            if (string.IsNullOrWhiteSpace(feed.Url)) continue;
            try
            {
                candidates.AddRange(await FetchFeedAsync(client, feed, maxPerFeed, ct));
            }
            catch (Exception ex)
            {
                // Bir kaynak hatalıysa atla, diğerlerine devam.
                _logger.LogWarning(ex, "RSS kaynağı çekilemedi: {Source} ({Url})", feed.SourceName, feed.Url);
            }
        }

        if (candidates.Count == 0) return;

        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Dedup: aynı SourceUrl'e sahip haber (RSS guid link olarak kullanılır) zaten varsa ekleme.
        var incomingUrls = candidates.Select(c => c.SourceUrl).Distinct().ToList();
        var existingUrls = await context.NewsArticles
            .Where(n => incomingUrls.Contains(n.SourceUrl))
            .Select(n => n.SourceUrl)
            .ToListAsync(ct);
        var existingSet = existingUrls.ToHashSet();

        var toInsert = candidates
            .GroupBy(c => c.SourceUrl)
            .Where(g => !existingSet.Contains(g.Key))
            .Select(g => g.First())
            .ToList();

        if (toInsert.Count == 0)
        {
            _logger.LogInformation("Haber çekimi tamam — yeni haber yok.");
            return;
        }

        context.NewsArticles.AddRange(toInsert);
        await context.SaveChangesAsync(ct);
        _logger.LogInformation("Haber çekimi tamam — {Count} yeni haber eklendi.", toInsert.Count);
    }

    // Öncelik: NEWS_RSS_URLS env var (virgülle ayrılmış URL listesi, Render için).
    // Yoksa appsettings > News:Feeds (zengin: SourceName + Category).
    private List<NewsFeedConfig> ResolveFeeds()
    {
        var envUrls = _configuration["NEWS_RSS_URLS"];
        if (!string.IsNullOrWhiteSpace(envUrls))
        {
            return envUrls
                .Split(new[] { ',', ';', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(url => new NewsFeedConfig
                {
                    Url = url,
                    SourceName = "Haber",              // item bazında Google News source'u ile ezilebilir
                    Category = DeriveCategory(url)     // URL'deki ?q=staj → "Staj"
                })
                .ToList();
        }

        return _configuration.GetSection("News:Feeds").Get<List<NewsFeedConfig>>() ?? new();
    }

    // Google News arama URL'sindeki ?q=... parametresinden kategori üretir.
    private static string DeriveCategory(string url)
    {
        try
        {
            var uri = new Uri(url);
            var q = QueryHelpers.ParseQuery(uri.Query);
            if (q.TryGetValue("q", out var value) && !string.IsNullOrWhiteSpace(value))
            {
                var term = value.ToString().Trim();
                return char.ToUpper(term[0]) + term[1..];
            }
        }
        catch { /* URL parse edilemezse genel kategori */ }
        return "Genel";
    }

    private async Task<List<NewsArticle>> FetchFeedAsync(HttpClient client, NewsFeedConfig feed, int maxPerFeed, CancellationToken ct)
    {
        var result = new List<NewsArticle>();

        await using var stream = await client.GetStreamAsync(feed.Url, ct);
        using var xmlReader = XmlReader.Create(stream);
        var syndication = SyndicationFeed.Load(xmlReader);
        if (syndication == null) return result;

        foreach (var item in syndication.Items.Take(maxPerFeed))
        {
            var sourceUrl = item.Links.FirstOrDefault(l => l.RelationshipType is null or "alternate")?.Uri?.ToString()
                ?? item.Links.FirstOrDefault()?.Uri?.ToString()
                ?? item.Id;
            if (string.IsNullOrWhiteSpace(sourceUrl)) continue;

            var title = item.Title?.Text?.Trim();
            if (string.IsNullOrWhiteSpace(title)) continue;

            var publishedAt = item.PublishDate != default
                ? item.PublishDate.UtcDateTime
                : (item.LastUpdatedTime != default ? item.LastUpdatedTime.UtcDateTime : DateTime.UtcNow);

            result.Add(new NewsArticle
            {
                Id = Guid.NewGuid(),
                Title = Truncate(title, 300),
                // Telif: tam metin değil, kısa özet + kaynağa link tutuyoruz.
                Summary = Truncate(StripHtml((item.Summary?.Text) ?? ContentText(item)), 400),
                Category = string.IsNullOrWhiteSpace(feed.Category) ? "Genel" : feed.Category,
                PublishedAt = publishedAt,
                ImageUrl = ExtractImage(item),
                // Google News item'ları gerçek yayıncıyı <source> ile verir; varsa onu kullan.
                SourceName = ExtractSourceName(item) ?? feed.SourceName,
                SourceUrl = sourceUrl,
                CreatedAt = DateTime.UtcNow
            });
        }

        return result;
    }

    private static string? ContentText(SyndicationItem item)
        => item.Content is TextSyndicationContent tc ? tc.Text : null;

    // Google News RSS'de her haberin gerçek yayıncısı <source>Yayıncı</source> ile gelir.
    private static string? ExtractSourceName(SyndicationItem item)
    {
        foreach (var ext in item.ElementExtensions)
        {
            if (ext.OuterName == "source")
            {
                var text = ext.GetObject<XmlElement>().InnerText?.Trim();
                if (!string.IsNullOrWhiteSpace(text)) return text;
            }
        }
        return null;
    }

    // RSS item'da görsel: önce enclosure, sonra media:content/thumbnail, sonra içerikteki ilk <img>.
    private static string? ExtractImage(SyndicationItem item)
    {
        var enclosure = item.Links.FirstOrDefault(l =>
            l.RelationshipType == "enclosure" && (l.MediaType?.StartsWith("image") ?? false));
        if (enclosure?.Uri != null) return enclosure.Uri.ToString();

        foreach (var ext in item.ElementExtensions)
        {
            if (ext.OuterName is "content" or "thumbnail") // media:content / media:thumbnail
            {
                var el = ext.GetObject<XmlElement>();
                var url = el.GetAttribute("url");
                if (!string.IsNullOrWhiteSpace(url)) return url;
            }
        }

        var html = (item.Summary?.Text) ?? ContentText(item);
        if (!string.IsNullOrEmpty(html))
        {
            var m = Regex.Match(html, "<img[^>]+src=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase);
            if (m.Success) return m.Groups[1].Value;
        }

        return null;
    }

    private static string StripHtml(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var noTags = Regex.Replace(input, "<.*?>", string.Empty);
        return WebUtility.HtmlDecode(noTags).Trim();
    }

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..max].TrimEnd() + "…";
}
