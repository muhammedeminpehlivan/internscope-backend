namespace InternScope.Entities;

public class CommentReport : BaseEntity
{
    public Guid CommentId { get; set; }
    public Guid ReportedByUserId { get; set; }
    public bool IsReviewed { get; set; } = false;

    public InternshipComment Comment { get; set; } = null!;
    public User ReportedBy { get; set; } = null!;
}
