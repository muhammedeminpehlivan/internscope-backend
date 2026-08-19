using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("company")]
public class CompanyController : ControllerBase
{
    private readonly CompanyService _companyService;

    public CompanyController(CompanyService companyService)
    {
        _companyService = companyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _companyService.GetAllAsync();
        return Ok(list);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var detail = await _companyService.GetBySlugAsync(slug);
        if (detail == null) return NotFound(new { message = "Şirket bulunamadı." });
        return Ok(detail);
    }
}