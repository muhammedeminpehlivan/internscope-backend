namespace InternScope.Entities;

public class Question : BaseEntity
{
    public string QuestionText { get; set; } = null!;
    public int OrderIndex { get; set; }
    public bool IsActive { get; set; }

    public ICollection<InternshipAnswer> Answers { get; set; } = null!;
}
