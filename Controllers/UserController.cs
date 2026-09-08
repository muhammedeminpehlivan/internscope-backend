using InternScope.Common;
using InternScope.DTOs.User;
using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[Authorize]
[ApiController]
[Route("user")]
public class UserController : ApiControllerBase
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;

    public UserController(IUserService userService, IConfiguration configuration)
    {
        _userService = userService;
        _configuration = configuration;
    }

    [HttpPost("send-verification-email")]
    public async Task<IActionResult> SendVerificationEmail([FromBody] string studentEmail)
    {
        var result = await _userService.SendVerificationEmailAsync(GetUserId(), studentEmail);
        return result.ToActionResult("Doğrulama maili gönderildi.");
    }

    // Maildeki linkten gelinir. Tarayıcıda JSON göstermek yerine kullanıcıyı
    // frontend profil sayfasına yönlendiriyoruz; sonuç query param ile bildiriliyor
    // (frontend `emailVerified` değerine göre toast/badge gösterir).
    [AllowAnonymous]
    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        var frontendUrl = _configuration["Frontend:BaseUrl"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("Frontend:BaseUrl konfigürasyonu eksik.");

        var result = await _userService.VerifyEmailAsync(token);
        var status = result.IsSuccess ? "success" : "failed";

        return Redirect($"{frontendUrl}/profile?emailVerified={status}");
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
