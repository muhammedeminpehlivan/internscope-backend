using InternScope.Entities;

namespace InternScope.DTOs.Internship
{
    public class InternshipInputModel
    {
        public required string CompanyName { get; set; }
        public Guid UniversityId { get; set; }
        public Guid DepartmentId { get; set; }
        public required string CompanyDepartment { get; set; }
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public bool IsAnonymous { get; set; }
        public InternshipTerm Term { get; set; }
        public int? StipendMin { get; set; }
        public int? StipendMax { get; set; }
        public string Currency { get; set; } = "TRY";
        public bool ReturnOfferReceived { get; set; }

        public required ScoreInputModel Scores { get; set; }
        public required InterviewInputModel Interview { get; set; }
        public Guid CityId { get; set; }
    }

    // Value type alanlar bilerek nullable: "seçilmedi" (null) ile "0 seçildi" ayrışsın.
    // Zorunluluk + aralık kontrolü InternshipInputValidator'da.
    public class ScoreInputModel
    {
        public int? LearningScore { get; set; }
        public int? MentoringScore { get; set; }
        public int? TechInfraScore { get; set; }
        public int? WorkEnvironmentScore { get; set; }
        public int? SalaryScore { get; set; }
        public bool? WouldRecommend { get; set; }
        public string? AdditionalTips { get; set; }
    }

    public class InterviewInputModel
    {
        public ApplicationMethod? ApplicationMethod { get; set; }
        public int? StageCount { get; set; }
        public string? Description { get; set; }
    }

    public class InternshipOutputModel
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = null!;
        public string UniversityName { get; set; } = null!;
        public string DepartmentName { get; set; } = null!;
        public string CompanyDepartment { get; set; } = null!;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public bool IsAnonymous { get; set; }
        public bool IsSgkVerified { get; set; }
        public string Status { get; set; } = null!;
        // Sadece reddedilen stajlarda dolu; admin gerekçe yazmadıysa null.
        public string? RejectionReason { get; set; }
        // Staj onaylıyken yapılan düzenleme reddedilirse dolu. Staj Approved kalır,
        // kullanıcı "değişikliğin şu sebeple reddedildi" mesajını görür.
        public string? ChangeRejectionReason { get; set; }
        public string Term { get; set; } = null!;
        public int? StipendMin { get; set; }
        public int? StipendMax { get; set; }
        public string Currency { get; set; } = null!;
        public bool ReturnOfferReceived { get; set; }
        public string CityName { get; set; } = null!;

        // Anonim ise "Anonim Kullanıcı", değilse gerçek ad
        public string AuthorName { get; set; } = null!;
        // Anonim ise null, değilse LinkedIn profil resmi
        public string? AuthorProfilePictureUrl { get; set; }
        // Anonim ise null, değilse kullanıcının girdiği LinkedIn profil URL'i
        public string? AuthorLinkedInProfileUrl { get; set; }

        public ScoreOutputModel Scores { get; set; } = null!;
        public InterviewOutputModel Interview { get; set; } = null!;
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
        public string ApplicationMethod { get; set; } = null!;
        public int StageCount { get; set; }
        public string? Description { get; set; }
    }
}
