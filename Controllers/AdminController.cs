using InternScope.Common;
using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;
    private readonly CommentService _commentService;

    public AdminController(AdminService adminService, CommentService commentService)
    {
        _adminService = adminService;
        _commentService = commentService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var list = await _adminService.GetPendingAsync();
        return Ok(list);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id, [FromQuery] bool verifySgk = false)
    {
        var result = await _adminService.ApproveAsync(id, verifySgk);
        return result.ToActionResult(verifySgk
            ? "Staj onaylandı ve SGK doğrulandı — kesinleşmiş staj. ✓"
            : "Staj onaylandı.");
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id)
    {
        var result = await _adminService.RejectAsync(id);
        return result.ToActionResult("Staj reddedildi.");
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var list = await _adminService.GetAllAsync(status);
        return Ok(list);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _adminService.DeleteAsync(id);
        return result.ToActionResult("Staj kalıcı olarak silindi.");
    }

    [HttpGet("pending-changes")]
    public async Task<IActionResult> GetPendingChanges()
    {
        var list = await _adminService.GetPendingChangesAsync();
        return Ok(list);
    }

    [HttpPut("{id}/approve-changes")]
    public async Task<IActionResult> ApproveChanges(Guid id)
    {
        var result = await _adminService.ApprovePendingChangesAsync(id);
        return result.ToActionResult("Düzenleme onaylandı, staj güncellendi.");
    }

    [HttpPut("{id}/reject-changes")]
    public async Task<IActionResult> RejectChanges(Guid id)
    {
        var result = await _adminService.RejectPendingChangesAsync(id);
        return result.ToActionResult("Düzenleme reddedildi, eski hali korundu.");
    }

    [HttpGet("reported-comments")]
    public async Task<IActionResult> GetReportedComments()
    {
        var list = await _commentService.GetReportedCommentsAsync();
        return Ok(list);
    }

    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid commentId)
    {
        var result = await _commentService.AdminDeleteCommentAsync(commentId);
        return result.ToActionResult("Yorum silindi.");
    }

    [HttpPut("comments/{commentId}/dismiss-reports")]
    public async Task<IActionResult> DismissReports(Guid commentId)
    {
        await _commentService.AdminDismissReportsAsync(commentId);
        return Ok(new { message = "Şikayetler kapatıldı, yorum yayında kalıyor." });
    }
}
