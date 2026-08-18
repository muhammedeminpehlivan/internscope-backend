namespace InternScope.Entities
{
    public class Question : BaseEntity
    {
        public string QuestionText { get; set; }
        public int OrderIndex { get; set; }
        public bool IsActive { get; set; }

        // Navigation Property
        public ICollection<InternshipAnswer> Answers { get; set; }
    }
}
