namespace InternScope.Entities;

public class InternshipAnswer : BaseEntity
{
    public Guid InternshipId { get; set; }
    public Guid QuestionId { get; set; }
    public string AnswerText { get; set; } = null!;

    public Internship Internship { get; set; } = null!;
    public Question Question { get; set; } = null!;
}
