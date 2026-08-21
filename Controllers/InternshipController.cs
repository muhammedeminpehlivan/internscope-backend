using InternScope.DTOs.Internship;
using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("internship")]
public class InternshipController : ControllerBase
{
    private readonly InternshipService _internshipService;

    public InternshipController(InternshipService internshipService)
    {
        _internshipService = internshipService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InternshipInputModel input)
    {
        var userIdClaim = HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null) return Unauthorized();

        try
        {
            var userId = Guid.Parse(userIdClaim);
            var internshipId = await _internshipService.CreateInternshipAsync(userId, input);

            return Ok(new
            {
                id = internshipId,
                message = "Staj değerlendirmeniz alındı. Admin onayından sonra yayınlanacaktır."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }


    }


    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] InternshipInputModel input)
    {
        var userIdClaim = HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        try
        {
            var userId = Guid.Parse(userIdClaim);
            await _internshipService.UpdateAsync(userId, id, input);
            return Ok(new { message = "Düzenlemeniz alındı. Admin onayına kadar eski haliniz yayında kalacak." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
        var userIdClaim = HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null) return Unauthorized();

        var userId = Guid.Parse(userIdClaim);
        var list = await _internshipService.GetMyInternshipsAsync(userId);
        return Ok(list);
    }



    [HttpPost("{id}/sgk")]
    public async Task<IActionResult> UploadSgk(Guid id, IFormFile file, [FromForm] string verificationCode)
    {
        var userIdClaim = HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        try
        {
            var userId = Guid.Parse(userIdClaim);
            await _internshipService.UploadSgkAsync(userId, id, file, verificationCode);
            return Ok(new { message = "SGK belgesi ve doğrulama kodu yüklendi. Admin onayı bekleniyor." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}