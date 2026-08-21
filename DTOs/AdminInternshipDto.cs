using InternScope.DTOs.Internship;

namespace InternScope.DTOs
{
    public class AdminInternshipOutputModel
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; }
        public string UniversityName { get; set; }
        public string DepartmentName { get; set; }
        public string RealAuthorName { get; set; }   
        public string AuthorEmail { get; set; }
        public bool IsAnonymous { get; set; }
        public bool IsSgkVerified { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public ScoreOutputModel Scores { get; set; }
        public InterviewOutputModel Interview { get; set; }
        public string SgkDocumentUrl { get; set; }
        public string SgkVerificationCode { get; set; }
    }
}