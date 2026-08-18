namespace InternScope.Entities
{
    public class InternshipAnswer : BaseEntity
    {
        public Guid InternshipId { get; set; }
        public Guid QuestionId { get; set; }
        public string AnswerText { get; set; }

        // Navigation Property
        public Internship Internship { get; set; }
        public Question Question { get; set; }
    }
}
