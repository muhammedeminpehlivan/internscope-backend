using InternScope.Common;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<UserService> _logger;

    public UserService(AppDbContext context, IEmailService emailService, IConfiguration configuration, ILogger<UserService> logger)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch { return false; }
    }

    public async Task<Result> SendVerificationEmailAsync(Guid userId, string studentEmail)
    {
        studentEmail = studentEmail.Trim().ToLower();

        if (!IsValidEmail(studentEmail))
            return Error.Validation("Geçerli bir e-posta adresi girin.");

        if (!studentEmail.EndsWith(".edu.tr"))
            return Error.Validation("Lütfen geçerli bir öğrenci maili (.edu.tr) girin.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Error.NotFound("Kullanıcı bulunamadı.");

        if (user.IsEmailVerified)
            return Error.Conflict("Mailiniz zaten doğrulanmış.");

        var emailTaken = await _context.Users
            .Where(u => u.Id != userId && u.StudentEmail == studentEmail && u.IsEmailVerified)
            .AnyAsync();
        if (emailTaken)
            return Error.Conflict("Bu öğrenci maili başka bir hesapta kullanılıyor.");

        var token = Guid.NewGuid().ToString();
        user.StudentEmail = studentEmail;
        user.EmailVerificationToken = token;
        user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
        await _context.SaveChangesAsync();

        var backendUrl = _configuration["Backend:BaseUrl"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("Backend:BaseUrl konfigürasyonu eksik.");
        var verificationLink = $"{backendUrl}/user/verify-email?token={token}";

        var body = $@"
            <h2>StajIn - Mail Doğrulama</h2>
            <p>Merhaba {user.FullName},</p>
            <p>Öğrenci mailini doğrulamak için aşağıdaki butona tıkla:</p>
            <a href='{verificationLink}' style='background:#0A66C2;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;'>
                Mailimi Doğrula
            </a>
            <p>Bu link 24 saat geçerlidir.</p>
        ";

        _logger.LogInformation("Doğrulama maili gönderiliyor: {Email}", studentEmail);
        await _emailService.SendEmailAsync(studentEmail, "StajIn - Mail Doğrulama", body);
        return Result.Success();
    }

    public async Task<Result> VerifyEmailAsync(string token)
    {
        var user = _context.Users.FirstOrDefault(u => u.EmailVerificationToken == token);

        if (user == null || user.EmailVerificationTokenExpiry < DateTime.UtcNow)
            return Error.Validation("Geçersiz veya süresi dolmuş token.");

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Mail doğrulandı: UserId={UserId}", user.Id);
        return Result.Success();
    }

    public async Task<User?> GetByIdAsync(Guid userId)
    {
        return await _context.Users
            .Include(u => u.University)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<Result<User>> UpdateProfileAsync(Guid userId, Guid? universityId, Guid? departmentId, string? linkedInProfileUrl)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Error.NotFound("Kullanıcı bulunamadı.");

        if (universityId.HasValue)
        {
            var exists = await _context.Universities.AnyAsync(u => u.Id == universityId.Value);
            if (!exists) return Error.NotFound("Seçilen üniversite bulunamadı.");
        }

        if (departmentId.HasValue)
        {
            var exists = await _context.Departments.AnyAsync(d => d.Id == departmentId.Value);
            if (!exists) return Error.NotFound("Seçilen bölüm bulunamadı.");
        }

        user.UniversityId = universityId;
        user.DepartmentId = departmentId;
        user.LinkedInProfileUrl = linkedInProfileUrl?.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(userId))!;
    }
}
