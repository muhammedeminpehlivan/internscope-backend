using InternScope.DTOs.Auth;

namespace InternScope.Services;

public interface IAuthService
{
    Task<AuthOutputModel> HandleLinkedInLoginAsync(AuthInputModel input);
}
