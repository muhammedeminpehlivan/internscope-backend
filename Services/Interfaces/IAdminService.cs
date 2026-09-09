using InternScope.Common;
using InternScope.DTOs.Internship;

namespace InternScope.Services;

public interface IAdminService
{
    Task<List<AdminInternshipOutputModel>> GetPendingAsync();
    Task<Result> ApproveAsync(Guid id, bool verifySgk);
    Task<Result> RejectAsync(Guid id, string? reason);
    Task<List<AdminInternshipOutputModel>> GetAllAsync(string? status);
    Task<Result> DeleteAsync(Guid id);
    Task<List<PendingChangeReviewModel>> GetPendingChangesAsync();
    Task<Result> ApprovePendingChangesAsync(Guid id);
    Task<Result> RejectPendingChangesAsync(Guid id, string? reason);
}
