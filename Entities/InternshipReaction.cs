namespace InternScope.Entities;

public class InternshipReaction : BaseEntity
{
    public Guid InternshipId { get; set; }
    public Guid UserId { get; set; }
    public bool IsPositive { get; set; } // true = upvote, false = downvote

    public Internship Internship { get; set; } = null!;
    public User User { get; set; } = null!;
}
