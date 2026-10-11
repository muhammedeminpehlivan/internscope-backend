namespace InternScope.Entities;

public class CommentReport : BaseEntity
{
    public Guid CommentId { get; set; }
    public Guid ReportedByUserId { get; set; }
    public bool IsReviewed { get; set; } = false;
    public ReportReason Reason { get; set; } = ReportReason.Other;
    public string? Note { get; set; } // kullanıcının opsiyonel açıklaması

    public InternshipComment Comment { get; set; } = null!;
    public User ReportedBy { get; set; } = null!;
}

// int değerler sabit: mevcut şikayetler migration'da 0 (Other) olarak kalır
public enum ReportReason
{
    Other = 0,
    Profanity = 1,      // küfür
    Spam = 2,
    Harassment = 3,     // hakaret / kişiyi hedef alma
    Misinformation = 4  // yanlış / yanıltıcı bilgi
}
