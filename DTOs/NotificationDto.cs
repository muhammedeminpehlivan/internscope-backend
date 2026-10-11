using InternScope.Entities;

namespace InternScope.DTOs;

public class NotificationOutputModel
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = null!;
    public bool IsRead { get; set; }
    public Guid? InternshipId { get; set; }
    public Guid? CommentId { get; set; }
    public DateTime CreatedAt { get; set; }
}
