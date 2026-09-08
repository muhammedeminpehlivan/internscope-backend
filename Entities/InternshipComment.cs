namespace InternScope.Entities;

public class InternshipComment : BaseEntity
{
    public Guid InternshipId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = null!;
    public bool IsDeleted { get; set; } = false;

    public Internship Internship { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<CommentReport> Reports { get; set; } = null!;
}
