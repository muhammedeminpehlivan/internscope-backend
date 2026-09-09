using InternScope.Common;
using InternScope.DTOs.Comment;

namespace InternScope.Services;

public interface IReactionService
{
    Task<Result<ReactionSummaryModel>> UpsertReactionAsync(Guid userId, Guid commentId, bool isPositive);
    Task<ReactionSummaryModel> GetSummaryAsync(Guid commentId, Guid? userId);
}
