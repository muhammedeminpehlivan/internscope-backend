namespace InternScope.Entities
{
    public class InternshipScore : BaseEntity
    {
        public Guid InternshipId { get; set; }
        public int LearningScore { get; set; }
        public int MentoringScore { get; set; }
        public int TechInfraScore { get; set; }
        public int WorkEnvironmentScore { get; set; }
        public int SalaryScore { get; set; }
        public bool WouldRecommend { get; set; }
        public string? AdditionalTips { get; set; }

        public Internship Internship { get; set; } = null!;
    }
}
