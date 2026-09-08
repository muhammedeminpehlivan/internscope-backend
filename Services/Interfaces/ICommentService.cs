using InternScope.Common;
using InternScope.DTOs.Comment;

namespace InternScope.Services;

public interface ICommentService
{
    Task<Result<CommentOutputModel>> AddCommentAsync(Guid userId, Guid internshipId, string content);
    Task<List<CommentOutputModel>> GetCommentsAsync(Guid internshipId, Guid? requestingUserId);
    Task<Result> DeleteCommentAsync(Guid userId, Guid commentId);
    Task<Result> ReportCommentAsync(Guid reportedByUserId, Guid commentId);
    Task<List<ReportedCommentOutputModel>> GetReportedCommentsAsync();
    Task<Result> AdminDeleteCommentAsync(Guid commentId);
    Task AdminDismissReportsAsync(Guid commentId);
}
