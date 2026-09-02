using InternScope.Common;
using InternScope.DTOs.Internship;
using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[Authorize]
[ApiController]
[Route("internship")]
public class InternshipController : ApiControllerBase
{
    private readonly InternshipService _internshipService;

    public InternshipController(InternshipService internshipService)
    {
        _internshipService = internshipService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InternshipInputModel input)
    {
        var result = await _internshipService.CreateInternshipAsync(GetUserId(), input);
        if (result.IsFailure) return result.Error!.ToActionResult();

        return Ok(new { id = result.Value, message = "Staj değerlendirmeniz alındı. Admin onayından sonra yayınlanacaktır." });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] InternshipInputModel input)
    {
        var result = await _internshipService.UpdateAsync(GetUserId(), id, input);
        return result.ToActionResult("Düzenlemeniz alındı. Admin onayına kadar eski haliniz yayında kalacak.");
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetApproved()
    {
        var list = await _internshipService.GetApprovedInternshipsAsync();
        return Ok(list);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var list = await _internshipService.GetMyInternshipsAsync(GetUserId());
        return Ok(list);
    }

    [HttpPost("{id}/sgk")]
    public async Task<IActionResult> UploadSgk(Guid id, IFormFile file, [FromForm] string verificationCode)
    {
        var result = await _internshipService.UploadSgkAsync(GetUserId(), id, file, verificationCode);
        return result.ToActionResult("SGK belgesi ve doğrulama kodu yüklendi. Admin onayı bekleniyor.");
    }
}
