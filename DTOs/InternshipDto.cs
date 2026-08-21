

using InternScope.Entities;

namespace InternScope.DTOs.Internship
{
    public class InternshipInputModel
    {
        public string CompanyName { get; set; }
        public Guid UniversityId { get; set; }
        public Guid DepartmentId { get; set; }
        public string CompanyDepartment { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public bool IsAnonymous { get; set; }
        public InternshipTerm Term { get; set; }
        public int? StipendMin { get; set; }
        public int? StipendMax { get; set; }
        public string Currency { get; set; } = "TRY";
        public bool ReturnOfferReceived { get; set; }

        public ScoreInputModel Scores { get; set; }
        public InterviewInputModel Interview { get; set; }
        public Guid CityId { get; set; }
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
        public string? Description { get; set; }
    }



    public class InternshipOutputModel
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; }
        public string UniversityName { get; set; }
        public string DepartmentName { get; set; }
        public string CompanyDepartment { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public bool IsAnonymous { get; set; }
        public bool IsSgkVerified { get; set; }
        public string Status { get; set; }
        public string Term { get; set; }
        public int? StipendMin { get; set; }
        public int? StipendMax { get; set; }
        public string Currency { get; set; }
        public bool ReturnOfferReceived { get; set; }
        public string CityName { get; set; }

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
        public string? Description { get; set; }
    }




}

