namespace InternScope.DTOs.News;

public class NewsItemOutputModel
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Summary { get; set; }
    public string Category { get; set; } = null!;
    public DateTime PublishedAt { get; set; }
    public string? ImageUrl { get; set; }
    public string SourceName { get; set; } = null!;
    public string SourceUrl { get; set; } = null!;
}

// Frontendci'nin beklediği sayfalı sonuç zarfı: { items, page, pageSize, totalCount }
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
}
