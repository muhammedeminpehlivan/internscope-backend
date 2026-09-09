namespace InternScope.Entities;

public class CommentReaction : BaseEntity
{
    public Guid CommentId { get; set; }
    public Guid UserId { get; set; }
    public bool IsPositive { get; set; } // true = like, false = dislike

    public InternshipComment Comment { get; set; } = null!;
    public User User { get; set; } = null!;
}
