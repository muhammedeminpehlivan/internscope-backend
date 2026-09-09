using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[ApiController]
[Route("news")]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;

    public NewsController(INewsService newsService)
    {
        _newsService = newsService;
    }

    // GET /news?query=staj&page=1&pageSize=10
    // Anasayfa haber akışı — herkese açık, cache'lenmiş DB'den okur.
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? query,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _newsService.GetAsync(query, page, pageSize);
        return Ok(result);
    }

    // GET /news/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _newsService.GetByIdAsync(id);
        if (item == null) return NotFound(new { message = "Haber bulunamadı." });
        return Ok(item);
    }
}
