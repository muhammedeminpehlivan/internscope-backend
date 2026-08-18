using AutoMapper;
using InternScope.DTOs.Auth;
using InternScope.Entities;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly IMapper _mapper;

    public AuthService(AppDbContext context, TokenService tokenService, IMapper mapper)
    {
        _context = context;
        _tokenService = tokenService;
        _mapper = mapper;
    }

    public async Task<AuthOutputModel> HandleLinkedInLoginAsync(AuthInputModel input)
    {
        var existingUser = _context.Users.FirstOrDefault(u => u.LinkedInId == input.LinkedInId);

        if (existingUser == null)
        {
            var newUser = new User
            {
                LinkedInId = input.LinkedInId,
                FullName = input.FullName,
                Email = input.Email,
                ProfilePictureUrl = input.ProfilePictureUrl,
                IsEmailVerified = false,
                Role = UserRole.Student
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var outputModel = _mapper.Map<AuthOutputModel>(newUser);
            outputModel.Token = _tokenService.GenerateToken(newUser);
            return outputModel;
        }

        var output = _mapper.Map<AuthOutputModel>(existingUser);
        output.Token = _tokenService.GenerateToken(existingUser);
        return output;
    }
}