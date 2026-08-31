using InternScope.Common;
using InternScope.DTOs.Comment;
using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("internship/{internshipId}/comments")]
public class CommentController : ControllerBase
{
    private readonly CommentService _commentService;

    public CommentController(CommentService commentService)
    {
        _commentService = commentService;
    }

    private Guid GetUserId() => Guid.Parse(
        HttpContext.User.Claims.First(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(Guid internshipId)
    {
        var userId = HttpContext.User.Identity?.IsAuthenticated == true ? GetUserId() : (Guid?)null;
        var comments = await _commentService.GetCommentsAsync(internshipId, userId);
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
public class ReactionController : ControllerBase
{
    private readonly ReactionService _reactionService;

    public ReactionController(ReactionService reactionService)
    {
        _reactionService = reactionService;
    }

    private Guid GetUserId() => Guid.Parse(
        HttpContext.User.Claims.First(c => c.Type == "sub" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value);

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetReactions(Guid internshipId)
    {
        var userId = HttpContext.User.Identity?.IsAuthenticated == true ? GetUserId() : (Guid?)null;
        var summary = await _reactionService.GetSummaryAsync(internshipId, userId);
        return Ok(summary);
    }

    [HttpPost]
    public async Task<IActionResult> React(Guid internshipId, [FromBody] ReactionInputModel input)
    {
        var result = await _reactionService.UpsertReactionAsync(GetUserId(), internshipId, input.IsPositive);
        return result.ToActionResult();
    }
}
