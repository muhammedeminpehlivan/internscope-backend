using InternScope.Common;
using InternScope.DTOs;
using InternScope.Entities;

namespace InternScope.Services;

public interface INotificationService
{
    // Notify* metotları bildirimi sadece context'e ekler, kaydetmez: çağıran servisin
    // SaveChangesAsync'i ile aynı anda yazılır (işlem başarısızsa bildirim de oluşmaz).
    void Notify(Guid userId, NotificationType type, string message, Guid? internshipId = null, Guid? commentId = null);
    Task NotifyAdminsAsync(NotificationType type, string message, Guid? internshipId = null, Guid? commentId = null);

    Task<List<NotificationOutputModel>> GetMyNotificationsAsync(Guid userId, bool unreadOnly);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<Result> MarkAsReadAsync(Guid userId, Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
}
