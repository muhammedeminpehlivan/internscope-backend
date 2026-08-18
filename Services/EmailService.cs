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
            
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Mail:SenderName"],
                _configuration["Mail:SenderEmail"]
            ));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _configuration["Mail:Host"],
                int.Parse(_configuration["Mail:Port"]),
                MailKit.Security.SecureSocketOptions.StartTls
            );
            await client.AuthenticateAsync(
                _configuration["Mail:SenderEmail"],
                _configuration["Mail:Password"]
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