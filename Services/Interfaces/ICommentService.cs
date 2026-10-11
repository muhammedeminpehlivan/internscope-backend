using InternScope.Common;
using InternScope.DTOs.Comment;
using InternScope.Entities;

namespace InternScope.Services;

public interface ICommentService
{
    Task<Result<CommentOutputModel>> AddCommentAsync(Guid userId, Guid internshipId, string content);
    Task<Result<CommentOutputModel>> AddReplyAsync(Guid userId, Guid internshipId, Guid parentCommentId, string content);
    Task<List<CommentOutputModel>> GetCommentsAsync(Guid internshipId, Guid? requestingUserId);
    Task<Result<CommentOutputModel>> UpdateCommentAsync(Guid userId, Guid commentId, string content);
    Task<Result> DeleteCommentAsync(Guid userId, Guid commentId);
    Task<Result> ReportCommentAsync(Guid reportedByUserId, Guid commentId, ReportReason reason, string? note);
    Task<List<ReportedCommentOutputModel>> GetReportedCommentsAsync();
    Task<Result> AdminDeleteCommentAsync(Guid commentId);
    Task<Result> AdminDismissReportsAsync(Guid commentId);
}
