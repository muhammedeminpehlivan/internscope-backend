using InternScope.Common;
using InternScope.DTOs.Comment;
using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[Authorize]
[ApiController]
[Route("internship/{internshipId}/comments")]
public class CommentController : ApiControllerBase
{
    private readonly ICommentService _commentService;

    public CommentController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(Guid internshipId)
    {
        var comments = await _commentService.GetCommentsAsync(internshipId, GetUserIdOrNull());
        return Ok(comments);
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(Guid internshipId, [FromBody] CommentInputModel input)
    {
        var result = await _commentService.AddCommentAsync(GetUserId(), internshipId, input.Content);
        return result.ToActionResult();
    }

    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid internshipId, Guid commentId)
    {
        var result = await _commentService.DeleteCommentAsync(GetUserId(), commentId);
        return result.ToActionResult("Yorum silindi.");
    }

    [HttpPost("{commentId}/report")]
    public async Task<IActionResult> ReportComment(Guid internshipId, Guid commentId)
    {
        var result = await _commentService.ReportCommentAsync(GetUserId(), commentId);
        return result.ToActionResult("Şikayetiniz iletildi.");
    }
}

[Authorize]
[ApiController]
[Route("internship/{internshipId}/reactions")]
public class ReactionController : ApiControllerBase
{
    private readonly IReactionService _reactionService;

    public ReactionController(IReactionService reactionService)
    {
        _reactionService = reactionService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetReactions(Guid internshipId)
    {
        var summary = await _reactionService.GetSummaryAsync(internshipId, GetUserIdOrNull());
        return Ok(summary);
    }

    [HttpPost]
    public async Task<IActionResult> React(Guid internshipId, [FromBody] ReactionInputModel input)
    {
        var result = await _reactionService.UpsertReactionAsync(GetUserId(), internshipId, input.IsPositive);
        return result.ToActionResult();
    }
}
