using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace InternScope.Services
{
    public class CloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var account = new Account(
                config["Cloudinary:CloudName"],
                config["Cloudinary:ApiKey"],
                config["Cloudinary:ApiSecret"]);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadSgkDocumentAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new Exception("Dosya boş.");

            using var stream = file.OpenReadStream();
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "sgk-documents"
            };
            var result = await _cloudinary.UploadAsync(uploadParams);
            if (result.Error != null)
                throw new Exception("Yükleme hatası: " + result.Error.Message);

            return result.SecureUrl.ToString();
        }
    }
}