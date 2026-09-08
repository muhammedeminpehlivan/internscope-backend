using InternScope.Common;
using InternScope.Entities;

namespace InternScope.Services;

public interface IUserService
{
    Task<Result> SendVerificationEmailAsync(Guid userId, string studentEmail);
    Task<Result> VerifyEmailAsync(string token);
    Task<User?> GetByIdAsync(Guid userId);
    Task<Result<User>> UpdateProfileAsync(Guid userId, Guid? universityId, Guid? departmentId, string? linkedInProfileUrl);
}
