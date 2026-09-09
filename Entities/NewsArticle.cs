namespace InternScope.Entities;

// Dış RSS kaynaklarından çekilip cache'lenen haber. Kullanıcı isteği hiçbir zaman
// dış kaynağa gitmez; her şey bu tablodan okunur. Telif gereği sadece başlık +
// kısa özet + orijinal kaynağa link tutulur, tam içerik saklanmaz.
public class NewsArticle : BaseEntity
{
    public string Title { get; set; } = null!;
    public string? Summary { get; set; }
    public string Category { get; set; } = null!;
    public DateTime PublishedAt { get; set; }   // Haberin kaynaktaki yayın tarihi (UTC)
    public string? ImageUrl { get; set; }
    public string SourceName { get; set; } = null!;
    public string SourceUrl { get; set; } = null!; // Orijinal habere link — dedup için unique
}
