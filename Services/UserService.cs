using InternScope.Entities;

public class UserService
{
    private readonly AppDbContext _context;
    private readonly EmailService _emailService;

    public UserService(AppDbContext context, EmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }


    public async Task SendVerificationEmailAsync(Guid userId, string studentEmail)
    {
        Console.WriteLine($"[UserService] userId: {userId}");
        Console.WriteLine($"[UserService] studentEmail: {studentEmail}");

        if (!studentEmail.EndsWith(".edu.tr"))
            throw new Exception("Lütfen geçerli bir öğrenci maili girin.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return;

        var token = Guid.NewGuid().ToString();

        user.StudentEmail = studentEmail;
        user.EmailVerificationToken = token;
        user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);

        await _context.SaveChangesAsync();

        var verificationLink = $"https://localhost:7134/user/verify-email?token={token}";

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