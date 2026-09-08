namespace InternScope.Services;

public interface ICloudinaryService
{
    Task<string> UploadSgkDocumentAsync(IFormFile file);
}
