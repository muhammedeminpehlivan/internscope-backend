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

    [HttpGet("all")]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var list = await _adminService.GetAllAsync(status);
        return Ok(list);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)    
    {
        var ok = await _adminService.DeleteAsync(id);
        if (!ok) return NotFound(new { message = "Staj bulunamadı." });
        return Ok(new { message = "Staj kalıcı olarak silindi." });
    }
}