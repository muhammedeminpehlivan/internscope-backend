using InternScope.DTOs.News;

namespace InternScope.Services;

public interface INewsService
{
    Task<PagedResult<NewsItemOutputModel>> GetAsync(string? query, int page, int pageSize);
    Task<NewsItemOutputModel?> GetByIdAsync(Guid id);
}
