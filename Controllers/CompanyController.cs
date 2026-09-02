using InternScope.Services;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

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

    // Staj formu — şirket adı yazarken eşleşen mevcut firmaları öner
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var suggestions = await _companyService.SearchAsync(q);
        return Ok(suggestions);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var detail = await _companyService.GetBySlugAsync(slug);
        if (detail == null) return NotFound(new { message = "Şirket bulunamadı." });
        return Ok(detail);
    }
}