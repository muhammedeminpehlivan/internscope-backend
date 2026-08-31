using InternScope.DTOs.Internship;

namespace InternScope.DTOs
{
    public class AdminInternshipOutputModel
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = null!;
        public string UniversityName { get; set; } = null!;
        public string DepartmentName { get; set; } = null!;
        public string RealAuthorName { get; set; } = null!;
        public string AuthorEmail { get; set; } = null!;
        public bool IsAnonymous { get; set; }
        public bool IsSgkVerified { get; set; }
        public string Status { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public ScoreOutputModel Scores { get; set; } = null!;
        public InterviewOutputModel Interview { get; set; } = null!;
        public string? SgkDocumentUrl { get; set; }
        public string? SgkVerificationCode { get; set; }
        public bool HasPendingChanges { get; set; }
        public string Term { get; set; } = null!;
        public int? StipendMin { get; set; }
        public int? StipendMax { get; set; }
        public string Currency { get; set; } = null!;
        public bool ReturnOfferReceived { get; set; }
    }

    public class PendingChangeReviewModel
    {
        public AdminInternshipOutputModel Current { get; set; } = null!;
        public InternshipInputModel? Proposed { get; set; }
    }
}
