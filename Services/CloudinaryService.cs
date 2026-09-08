using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using InternScope.Exceptions;

namespace InternScope.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(IConfiguration config, ILogger<CloudinaryService> logger)
    {
        var account = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]);
        _cloudinary = new Cloudinary(account);
        _logger = logger;
    }

    public async Task<string> UploadSgkDocumentAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new AppException("Dosya boş.");

        _logger.LogInformation("SGK belgesi yükleniyor: {FileName} ({Size} bytes)", file.FileName, file.Length);

        using var stream = file.OpenReadStream();
        var uploadParams = new RawUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "sgk-documents"
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        if (result.Error != null)
            throw new AppException("Yükleme hatası: " + result.Error.Message);

        return result.SecureUrl.ToString();
    }
}
