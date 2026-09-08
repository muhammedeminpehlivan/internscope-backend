using InternScope.Entities;

namespace InternScope.Services;

public interface ITokenService
{
    string GenerateToken(User user);
}
