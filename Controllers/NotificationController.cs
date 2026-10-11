using InternScope.Common;
using InternScope.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternScope.Controllers;

[Authorize]
[ApiController]
[Route("notification")]
public class NotificationController : ApiControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    // Son 50 bildirim (en yeni önce). ?unreadOnly=true ile sadece okunmamışlar.
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] bool unreadOnly = false)
    {
        var list = await _notificationService.GetMyNotificationsAsync(GetUserId(), unreadOnly);
        return Ok(list);
    }

    // Zil ikonundaki rozet için
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _notificationService.GetUnreadCountAsync(GetUserId());
        return Ok(new { count });
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var result = await _notificationService.MarkAsReadAsync(GetUserId(), id);
        return result.ToActionResult("Bildirim okundu olarak işaretlendi.");
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(GetUserId());
        return Ok(new { message = "Tüm bildirimler okundu olarak işaretlendi." });
    }
}
