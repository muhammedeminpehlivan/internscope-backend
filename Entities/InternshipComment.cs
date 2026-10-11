namespace InternScope.Entities;

public class InternshipComment : BaseEntity
{
    public Guid InternshipId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = null!;
    public bool IsDeleted { get; set; } = false;
    // Şikayet eşiği aşılınca otomatik gizlenir; admin şikayetleri kapatırsa tekrar görünür
    public bool IsHidden { get; set; } = false;
    public Guid? ParentCommentId { get; set; } // null = ana yorum, dolu = bir yoruma cevap

    public Internship Internship { get; set; } = null!;
    public User User { get; set; } = null!;
    public InternshipComment? ParentComment { get; set; }
    public ICollection<InternshipComment> Replies { get; set; } = null!;
    public ICollection<CommentReport> Reports { get; set; } = null!;
    public ICollection<CommentReaction> Reactions { get; set; } = null!;
}
