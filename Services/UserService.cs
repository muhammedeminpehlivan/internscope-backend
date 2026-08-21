using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

public class UserService
{
    private readonly AppDbContext _context;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;

    public UserService(AppDbContext context, EmailService emailService, IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
    }
    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }


    public async Task SendVerificationEmailAsync(Guid userId, string studentEmail)
    {
        studentEmail = studentEmail.Trim().ToLower();

        // 1. Format kontrolü (gerçek mail formatı mı?)
        if (!IsValidEmail(studentEmail))
            throw new Exception("Geçerli bir e-posta adresi girin.");

        // 2. .edu.tr kontrolü (öğrenci maili mi?)
        if (!studentEmail.EndsWith(".edu.tr"))
            throw new Exception("Lütfen geçerli bir öğrenci maili (.edu.tr) girin.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new Exception("Kullanıcı bulunamadı.");

        // 3. Zaten doğrulanmış mı?
        if (user.IsEmailVerified)
            throw new Exception("Mailiniz zaten doğrulanmış.");

        // 4. Bu öğrenci maili başka biri tarafından kullanılıyor mu?
        // .NET 10'da System.Linq.AsyncEnumerable.AnyAsync ile çakışmayı engellemek için Where→AnyAsync
        var emailTaken = await _context.Users
            .Where(u => u.Id != userId && u.StudentEmail == studentEmail && u.IsEmailVerified)
            .AnyAsync();
        if (emailTaken)
            throw new Exception("Bu öğrenci maili başka bir hesapta kullanılıyor.");

        var token = Guid.NewGuid().ToString();
        user.StudentEmail = studentEmail;
        user.EmailVerificationToken = token;
        user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
        await _context.SaveChangesAsync();

        var backendUrl = _configuration["Backend:BaseUrl"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("Backend:BaseUrl konfigürasyonu eksik.");
        var verificationLink = $"{backendUrl}/user/verify-email?token={token}";

        var body = $@"
            <h2>InternScope - Mail Doğrulama</h2>
            <p>Merhaba {user.FullName},</p>
            <p>Öğrenci mailini doğrulamak için aşağıdaki butona tıkla:</p>
            <a href='{verificationLink}' style='background:#0A66C2;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;'>
                Mailimi Doğrula
            </a>
            <p>Bu link 24 saat geçerlidir.</p>
        ";

        await _emailService.SendEmailAsync(studentEmail, "InternScope - Mail Doğrulama", body);
    }

    public async Task<bool> VerifyEmailAsync(string token)
    {
        var user = _context.Users.FirstOrDefault(u => u.EmailVerificationToken == token);

        if (user == null) return false;
        if (user.EmailVerificationTokenExpiry < DateTime.UtcNow) return false;

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;

        await _context.SaveChangesAsync();
        return true;
    }
    public async Task<User?> GetByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }

}