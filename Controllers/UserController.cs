using InternScope.DTOs.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
[Authorize]
[ApiController]
[Route("user")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
        _userService = userService;
    }


        
    [HttpPost("send-verification-email")]
    public async Task<IActionResult> SendVerificationEmail([FromBody] string studentEmail)
    {
        var userIdClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        try
        {
            var userId = Guid.Parse(userIdClaim);
            await _userService.SendVerificationEmailAsync(userId, studentEmail);
            return Ok(new { message = "Doğrulama maili gönderildi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [AllowAnonymous]
    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        var result = await _userService.VerifyEmailAsync(token);
        if (!result) return BadRequest(new { message = "Geçersiz veya süresi dolmuş token." });

        return Ok(new { message = "Mail başarıyla doğrulandı!" });
    }
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null) return Unauthorized();

        var userId = Guid.Parse(userIdClaim);
        var user = await _userService.GetByIdAsync(userId);

        if (user == null) return NotFound();

        return Ok(new
        {
            id = user.Id,
            fullName = user.FullName,
            email = user.Email,
            studentEmail = user.StudentEmail,
            isEmailVerified = user.IsEmailVerified,
            profilePictureUrl = user.ProfilePictureUrl,
            role = user.Role.ToString(),
            universityId = user.UniversityId,
            universityName = user.University?.Name,
            departmentId = user.DepartmentId,
            departmentName = user.Department?.Name
        });
    }

    // Öğrenci okul/bölüm bilgisini kendisi girer/günceller.
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileInputModel input)
    {
        var userIdClaim = HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (userIdClaim == null) return Unauthorized();

        try
        {
            var userId = Guid.Parse(userIdClaim);
            var user = await _userService.UpdateProfileAsync(userId, input.UniversityId, input.DepartmentId);

            return Ok(new
            {
                universityId = user.UniversityId,
                universityName = user.University?.Name,
                departmentId = user.DepartmentId,
                departmentName = user.Department?.Name
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}