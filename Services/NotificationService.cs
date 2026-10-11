using InternScope.Common;
using InternScope.DTOs;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

public class NotificationService : INotificationService
{
    private const int MaxListCount = 50;

    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public void Notify(Guid userId, NotificationType type, string message, Guid? internshipId = null, Guid? commentId = null)
    {
        _context.Notifications.Add(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Message = message,
            InternshipId = internshipId,
            CommentId = commentId,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task NotifyAdminsAsync(NotificationType type, string message, Guid? internshipId = null, Guid? commentId = null)
    {
        var adminIds = await _context.Users
            .Where(u => u.Role == UserRole.Admin)
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var adminId in adminIds)
            Notify(adminId, type, message, internshipId, commentId);
    }

    public async Task<List<NotificationOutputModel>> GetMyNotificationsAsync(Guid userId, bool unreadOnly)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && (!unreadOnly || !n.IsRead))
            .OrderByDescending(n => n.CreatedAt)
            .Take(MaxListCount)
            .Select(n => new NotificationOutputModel
            {
                Id = n.Id,
                Type = n.Type,
                Message = n.Message,
                IsRead = n.IsRead,
                InternshipId = n.InternshipId,
                CommentId = n.CommentId,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
        => await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

    public async Task<Result> MarkAsReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notification == null)
            return Error.NotFound("Bildirim bulunamadı.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return Result.Success();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.UpdatedAt, DateTime.UtcNow));
    }
}
