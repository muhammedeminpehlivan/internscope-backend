namespace InternScope.Entities;

// Uygulama içi bildirim (zil ikonu). Kalıcı; kullanıcı okudukça IsRead işaretlenir.
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = null!;
    public bool IsRead { get; set; }

    // Frontend'in bildirime tıklanınca ilgili yere gidebilmesi için (opsiyonel)
    public Guid? InternshipId { get; set; }
    public Guid? CommentId { get; set; }

    public User User { get; set; } = null!;
}

public enum NotificationType
{
    CommentRemoved,  // yorumun admin tarafından kaldırıldı
    CommentHidden,   // yorumun şikayetler nedeniyle otomatik gizlendi
    CommentReported, // (admin) bir yorum yeni şikayet aldı
    CommentAutoHidden // (admin) bir yorum şikayet eşiğini geçip gizlendi
}
