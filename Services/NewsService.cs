using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.DTOs.News;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

public class NewsService : INewsService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public NewsService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    // Anasayfa haber listesi — her zaman DB'den (cache) okur, dış kaynağa gitmez.
    // Haber yoksa boş liste döner; asla exception fırlatmaz.
    public async Task<PagedResult<NewsItemOutputModel>> GetAsync(string? query, int page, int pageSize)
    {
        // Güvenli sınırlar — hatalı/aşırı değerler frontend'i ya da DB'yi zorlamasın.
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;

        var q = _context.NewsArticles.AsQueryable();

        var term = query?.Trim();
        if (!string.IsNullOrEmpty(term))
        {
            // Postgres ILIKE — büyük/küçük harf duyarsız başlık + özet araması.
            var pattern = $"%{term}%";
            q = q.Where(n => EF.Functions.ILike(n.Title, pattern)
                || (n.Summary != null && EF.Functions.ILike(n.Summary, pattern)));
        }

        var totalCount = await q.CountAsync();

        var items = await q
            .OrderByDescending(n => n.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<NewsItemOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();

        return new PagedResult<NewsItemOutputModel>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<NewsItemOutputModel?> GetByIdAsync(Guid id)
    {
        return await _context.NewsArticles
            .Where(n => n.Id == id)
            .ProjectTo<NewsItemOutputModel>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }
}
