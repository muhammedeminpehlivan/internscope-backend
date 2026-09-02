using MailKit.Net.Smtp;
using MimeKit;

public class EmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }


    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var senderEmail = _configuration["Mail:SenderEmail"]
                ?? throw new InvalidOperationException("Mail:SenderEmail yapılandırması eksik.");
            var host = _configuration["Mail:Host"]
                ?? throw new InvalidOperationException("Mail:Host yapılandırması eksik.");
            var password = _configuration["Mail:Password"]
                ?? throw new InvalidOperationException("Mail:Password yapılandırması eksik.");
            var port = int.TryParse(_configuration["Mail:Port"], out var p) ? p : 587;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Mail:SenderName"],
                senderEmail
            ));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            await client.ConnectAsync(
                host,
                port,
                MailKit.Security.SecureSocketOptions.StartTls
            );
            await client.AuthenticateAsync(
                senderEmail,
                password
            );
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Mail gönderme hatası: {ex.Message}");
            throw;
        }
    }
}