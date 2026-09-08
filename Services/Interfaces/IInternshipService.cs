using InternScope.Common;
using InternScope.DTOs.Internship;
using InternScope.Entities;

namespace InternScope.Services;

public interface IInternshipService
{
    Task<Result<Guid>> CreateInternshipAsync(Guid userId, InternshipInputModel input);
    Task<List<InternshipOutputModel>> GetApprovedInternshipsAsync();
    Task<List<InternshipOutputModel>> GetMyInternshipsAsync(Guid userId);
    Task<Result> UploadSgkAsync(Guid userId, Guid internshipId, IFormFile file, string verificationCode);
    Task<Result> UpdateAsync(Guid userId, Guid internshipId, InternshipInputModel input);
    Task<Result> DeleteAsync(Guid userId, Guid internshipId);
    Task ApplyInputAsync(Internship internship, InternshipInputModel input);
}
