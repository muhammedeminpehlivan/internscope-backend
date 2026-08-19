using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;

    public AdminController(AdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var list = await _adminService.GetPendingAsync();
        return Ok(list);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var ok = await _adminService.ApproveAsync(id);
        if (!ok) return NotFound(new { message = "Staj bulunamadı." });
        return Ok(new { message = "Staj onaylandı." });
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(Guid id)
    {
        var ok = await _adminService.RejectAsync(id);
        if (!ok) return NotFound(new { message = "Staj bulunamadı." });
        return Ok(new { message = "Staj reddedildi." });
    }
}