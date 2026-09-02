using InternScope.Common;
using InternScope.DTOs.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[Authorize]
[ApiController]
[Route("user")]
public class UserController : ApiControllerBase
{
    private readonly UserService _userService;

    public UserController(UserService userService)
    {
        _userService = userService;
    }

    [HttpPost("send-verification-email")]
    public async Task<IActionResult> SendVerificationEmail([FromBody] string studentEmail)
    {
        var result = await _userService.SendVerificationEmailAsync(GetUserId(), studentEmail);
        return result.ToActionResult("Doğrulama maili gönderildi.");
    }

    [AllowAnonymous]
    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        var result = await _userService.VerifyEmailAsync(token);
        return result.ToActionResult("Mail başarıyla doğrulandı!");
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var user = await _userService.GetByIdAsync(GetUserId());
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
            departmentName = user.Department?.Name,
            linkedInProfileUrl = user.LinkedInProfileUrl
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileInputModel input)
    {
        var result = await _userService.UpdateProfileAsync(GetUserId(), input.UniversityId, input.DepartmentId, input.LinkedInProfileUrl);
        if (result.IsFailure) return result.Error!.ToActionResult();

        var user = result.Value!;
        return Ok(new
        {
            universityId = user.UniversityId,
            universityName = user.University?.Name,
            departmentId = user.DepartmentId,
            departmentName = user.Department?.Name,
            linkedInProfileUrl = user.LinkedInProfileUrl
        });
    }
}
