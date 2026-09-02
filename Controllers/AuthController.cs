using AutoMapper;
using InternScope.DTOs.Auth;
using InternScope.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;


    public AuthController(AuthService authService, IMapper mapper, IConfiguration configuration)
    {
        _authService = authService;
        _mapper = mapper;
        _configuration = configuration;
    }

        [HttpGet("login")]
    public IActionResult Login()
    {
        return Challenge(new AuthenticationProperties
        {
            RedirectUri = "/auth/success"
        }, "LinkedIn");
    }

    [HttpGet("success")]
    public async Task<IActionResult> Success()
    {
        var authResult = await HttpContext.AuthenticateAsync("Cookies");
        if (!authResult.Succeeded) return Unauthorized();

        var claims = authResult.Principal.Claims;

        var linkedInId = claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        var fullName = claims.FirstOrDefault(c => c.Type == "name")?.Value;
        var email = claims.FirstOrDefault(c => c.Type == "email")?.Value;
        var picture = claims.FirstOrDefault(c => c.Type == "picture")?.Value;

        if (linkedInId == null) return Unauthorized();

        var input = new AuthInputModel
        {
            LinkedInId = linkedInId,
            FullName = fullName,
            Email = email,
            ProfilePictureUrl = picture
        };

        var result = await _authService.HandleLinkedInLoginAsync(input);
        var frontendUrl = _configuration["Frontend:BaseUrl"];
        // Token'ı fragment (#) olarak veriyoruz: browser history/referer/proxy log'larına gitmez.
        // Frontend `location.hash`'ten okuyup localStorage/state'e almalı.
        return Redirect($"{frontendUrl}/auth/callback#token={result.Token}");
    }
}