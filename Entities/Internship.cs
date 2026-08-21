namespace InternScope.Entities
{
    public class Internship : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid CompanyId { get; set; }
        public Guid UniversityId { get; set; }
        public Guid DepartmentId { get; set; }
        public string CompanyDepartment { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsAnonymous { get; set; }
        public bool IsSgkVerified { get; set; }
        public string? SgkDocumentUrl { get; set; }
        public InternshipStatus Status { get; set; }

        // Navigation Properties
        public User User { get; set; }
        public Company Company { get; set; }
        public University University { get; set; }
        public Department Department { get; set; }
        public InternshipScore Score { get; set; }
        public InterviewProcess InterviewProcess { get; set; }
        public ICollection<InternshipAnswer> Answers { get; set; }
        public string? SgkVerificationCode { get; set; }
    }

    public enum InternshipStatus
    {
        Pending,
        Approved,
        Rejected
    }
}
