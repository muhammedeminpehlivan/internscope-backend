

using InternScope.Entities;

namespace InternScope.DTOs.Internship
{
    public class InternshipInputModel
    {
        public string CompanyName { get; set; }        
        public Guid UniversityId { get; set; }
        public Guid DepartmentId { get; set; }
        public string CompanyDepartment { get; set; }  
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsAnonymous { get; set; }

        public ScoreInputModel Scores { get; set; }
        public InterviewInputModel Interview { get; set; }
    }

    public class ScoreInputModel
    {
        public int LearningScore { get; set; }
        public int MentoringScore { get; set; }
        public int TechInfraScore { get; set; }
        public int WorkEnvironmentScore { get; set; }
        public int SalaryScore { get; set; }
        public bool WouldRecommend { get; set; }
        public string? AdditionalTips { get; set; }
    }

    public class InterviewInputModel
    {
        public ApplicationMethod ApplicationMethod { get; set; }
        public int StageCount { get; set; }
        public int? DurationDays { get; set; }
        public DifficultyLevel DifficultyLevel { get; set; }
        public string? Description { get; set; }
    }



    public class InternshipOutputModel
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; }
        public string UniversityName { get; set; }
        public string DepartmentName { get; set; }
        public string CompanyDepartment { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsAnonymous { get; set; }
        public bool IsSgkVerified { get; set; }
        public string Status { get; set; }

        // Anonim ise "Anonim Kullanıcı", değilse gerçek ad
        public string AuthorName { get; set; }

        public ScoreOutputModel Scores { get; set; }
        public InterviewOutputModel Interview { get; set; }
    }

    public class ScoreOutputModel
    {
        public int LearningScore { get; set; }
        public int MentoringScore { get; set; }
        public int TechInfraScore { get; set; }
        public int WorkEnvironmentScore { get; set; }
        public int SalaryScore { get; set; }
        public bool WouldRecommend { get; set; }
        public string? AdditionalTips { get; set; }
    }

    public class InterviewOutputModel
    {
        public string ApplicationMethod { get; set; }
        public int StageCount { get; set; }
        public int? DurationDays { get; set; }
        public string DifficultyLevel { get; set; }
        public string? Description { get; set; }
    }
}

