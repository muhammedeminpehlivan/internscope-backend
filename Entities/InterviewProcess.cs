namespace InternScope.Entities
{
    public class InterviewProcess : BaseEntity
    {
        public Guid InternshipId { get; set; }
        public ApplicationMethod ApplicationMethod { get; set; }
        public int StageCount { get; set; }
        public int? DurationDays { get; set; }
        public DifficultyLevel DifficultyLevel { get; set; }
        public string? Description { get; set; }

        // Navigation Property
        public Internship Internship { get; set; }
    }

    public enum ApplicationMethod
    {
        LinkedIn,
        CareerSite,
        Reference,
        InternshipFair,
        Other
    }

    public enum DifficultyLevel
    {
        Easy,
        Medium,
        Hard
    }
}
