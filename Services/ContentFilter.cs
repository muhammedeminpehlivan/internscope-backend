using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace InternScope.Services;

// Yorum ve değerlendirme metinleri için basit küfür/spam filtresi.
// Küfür bulunca isteği reddetmez; ilgili kelimeyi aynı uzunlukta *** ile değiştirir.
// Kelime listesi Data/profanity-tr.json'dan bir kez yüklenir (singleton).
public partial class ContentFilter : IContentFilter
{
    private const string LinkPlaceholder = "[link kaldırıldı]";
    private const int MaxRepeat = 3; // "!!!!!!!!" → "!!!"

    private readonly HashSet<string> _exactWords;
    private readonly string[] _prefixes;
    private readonly string[] _safeWords;

    public ContentFilter(ILogger<ContentFilter> logger)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "profanity-tr.json");
        var list = File.Exists(path)
            ? JsonSerializer.Deserialize<WordList>(File.ReadAllText(path), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            : null;

        if (list == null)
            logger.LogWarning("Küfür listesi bulunamadı ({Path}); filtre sadece link/tekrar temizliği yapacak.", path);

        // Liste de metinle aynı normalizasyondan geçer; böylece "şerefsiz" ve "serefsiz" aynı kayıt olur.
        _exactWords = (list?.ExactWords ?? []).Select(Normalize).Where(w => w.Length > 0).ToHashSet();
        _prefixes = (list?.Prefixes ?? []).Select(Normalize).Where(w => w.Length > 0).ToArray();
        _safeWords = (list?.SafeWords ?? []).Select(Normalize).Where(w => w.Length > 0).ToArray();
    }

    public string Sanitize(string text, bool removeLinks = false)
    {
        if (string.IsNullOrWhiteSpace(text))
            return text;

        var result = text.Trim();
        if (removeLinks)
            result = LinkRegex().Replace(result, LinkPlaceholder);
        result = RepeatRegex().Replace(result, m => new string(m.Value[0], MaxRepeat));
        return Censor(result);
    }

    private string Censor(string text)
    {
        var sb = new StringBuilder(text);
        var tokens = TokenRegex().Matches(text); // boşlukla ayrılmış parçalar
        var normalized = tokens.Select(t => Normalize(t.Value)).ToArray();

        for (var i = 0; i < tokens.Count; i++)
        {
            // "a.m.k" gibi noktalı yazımlar: parçanın tamamı normalize edilince yakalanır
            if (IsProfane(normalized[i]))
            {
                Mask(sb, tokens[i].Index, tokens[i].Length);
                continue;
            }

            // "güzel,amk" gibi noktalama ile yapışık kelimeler: alt parçalara tek tek bak
            foreach (Match part in WordRegex().Matches(tokens[i].Value))
            {
                if (IsProfane(Normalize(part.Value)))
                    Mask(sb, tokens[i].Index + part.Index, part.Length);
            }
        }

        // "a m k" gibi harf harf ayrık yazımlar: art arda gelen tek harfli parçaları birleştir.
        // En az 3 harf: "o c# kullanıyor" gibi 2 harfli tesadüfler sansürlenmesin.
        for (var i = 0; i < tokens.Count;)
        {
            if (normalized[i].Length != 1) { i++; continue; }

            var end = i;
            var joined = new StringBuilder();
            while (end < tokens.Count && normalized[end].Length == 1)
                joined.Append(normalized[end++]);

            if (end - i >= 3 && IsProfane(CollapseRepeats(joined.ToString())))
                for (var k = i; k < end; k++)
                    Mask(sb, tokens[k].Index, tokens[k].Length);

            i = end;
        }

        return sb.ToString();
    }

    private bool IsProfane(string word)
    {
        if (word.Length == 0)
            return false;
        if (_exactWords.Contains(word))
            return true;
        if (_safeWords.Any(word.StartsWith))
            return false;
        return _prefixes.Any(word.StartsWith);
    }

    // Harf/rakam karakterlerini * yapar, noktalama kalır: "amk," → "***,"
    private static void Mask(StringBuilder sb, int start, int length)
    {
        for (var i = start; i < start + length; i++)
            if (char.IsLetterOrDigit(sb[i]) || sb[i] is '@' or '$')
                sb[i] = '*';
    }

    // Kültürden bağımsız normalizasyon: küçük harf + Türkçe karakter sadeleştirme +
    // leet çevirisi + harf dışı karakterleri atma + tekrar eden harfleri teke indirme.
    private static string Normalize(string input)
    {
        // Hiç harf içermeyen parçalar (ör. "2024", "100₺") leet çevirisiyle kelimeye dönüşmesin
        if (!input.Any(char.IsLetter))
            return string.Empty;

        var sb = new StringBuilder(input.Length);
        foreach (var c in input)
        {
            var mapped = c switch
            {
                'I' or 'İ' or 'ı' or 'î' or 'Î' or '1' => 'i',
                'Ş' or 'ş' or '$' or '5' => 's',
                'Ç' or 'ç' => 'c',
                'Ğ' or 'ğ' => 'g',
                'Ü' or 'ü' or 'û' or 'Û' => 'u',
                'Ö' or 'ö' or '0' => 'o',
                'Â' or 'â' or '@' or '4' => 'a',
                '3' => 'e',
                '7' => 't',
                _ => char.ToLowerInvariant(c)
            };

            if (char.IsLetter(mapped))
                sb.Append(mapped);
        }

        return CollapseRepeats(sb.ToString());
    }

    private static string CollapseRepeats(string s)
    {
        var sb = new StringBuilder(s.Length);
        foreach (var c in s)
            if (sb.Length == 0 || sb[^1] != c)
                sb.Append(c);
        return sb.ToString();
    }

    [GeneratedRegex(@"\S+")]
    private static partial Regex TokenRegex();

    [GeneratedRegex(@"[\p{L}\p{N}@$]+")]
    private static partial Regex WordRegex();

    [GeneratedRegex(@"(https?://|www\.)\S+", RegexOptions.IgnoreCase)]
    private static partial Regex LinkRegex();

    // Aynı karakterin 4+ kez tekrarı (rakamlar hariç: "10000 TL" bozulmasın)
    [GeneratedRegex(@"([^\d])\1{3,}")]
    private static partial Regex RepeatRegex();

    private sealed class WordList
    {
        public List<string>? ExactWords { get; set; }
        public List<string>? Prefixes { get; set; }
        public List<string>? SafeWords { get; set; }
    }
}
