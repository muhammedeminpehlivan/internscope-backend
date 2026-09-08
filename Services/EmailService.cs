using System.Net.Http.Json;

namespace InternScope.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    // Brevo (eski adı Sendinblue) transactional email HTTP API'si üzerinden mail gönderir.
    // SMTP yerine HTTP (443) kullanılıyor — Render giden SMTP portlarını (587/465/25)
    // bloklar, HTTP API bu engeli aşar.
    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var apiKey = _configuration["Brevo:ApiKey"]
            ?? throw new InvalidOperationException("Brevo:ApiKey yapılandırması eksik.");
        var senderEmail = _configuration["Brevo:SenderEmail"]
            ?? throw new InvalidOperationException("Brevo:SenderEmail yapılandırması eksik.");
        var senderName = _configuration["Brevo:SenderName"] ?? "StajIn";

        var payload = new
        {
            sender = new { name = senderName, email = senderEmail },
            to = new[] { new { email = toEmail } },
            subject,
            htmlContent = body
        };

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
        request.Headers.Add("api-key", apiKey);
        request.Headers.Add("accept", "application/json");
        request.Content = JsonContent.Create(payload);

        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Brevo mail gönderimi başarısız: {Status} — {Body}", (int)response.StatusCode, errorBody);
            throw new InvalidOperationException($"Mail gönderilemedi (Brevo {(int)response.StatusCode}).");
        }

        _logger.LogInformation("Mail gönderildi: {Email}", toEmail);
    }
}
