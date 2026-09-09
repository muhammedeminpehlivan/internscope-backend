namespace InternScope.Entities
{
    public class Internship : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid CompanyId { get; set; }
        public Guid UniversityId { get; set; }
        public Guid DepartmentId { get; set; }
        public string CompanyDepartment { get; set; } = null!;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public bool IsAnonymous { get; set; }
        public bool IsSgkVerified { get; set; }
        public string? SgkDocumentUrl { get; set; }
        public InternshipStatus Status { get; set; }
        // Admin reddederken opsiyonel olarak girdiği gerekçe. Kullanıcı "stajlarım"
        // ekranında reddedilen kaydında bunu görür. Kayıt tekrar Pending'e dönünce temizlenir.
        public string? RejectionReason { get; set; }
        public bool HasPendingChanges { get; set; }
        public string? PendingChangesJson { get; set; }
        // Onaylı bir stajın düzenlemesi admin tarafından reddedilince girilen gerekçe.
        // Staj Approved kalır (eski hali yayında); kullanıcı bu mesajı görür.
        // Yeni bir düzenleme yapılınca veya değişiklik onaylanınca temizlenir.
        public string? ChangeRejectionReason { get; set; }
        public InternshipTerm Term { get; set; }
        public int? StipendMin { get; set; }
        public int? StipendMax { get; set; }
        public string? Currency { get; set; } = "TRY";
        public bool ReturnOfferReceived { get; set; }
        public string? SgkVerificationCode { get; set; }
        public Guid CityId { get; set; }

        // Navigation Properties
        public User User { get; set; } = null!;
        public Company Company { get; set; } = null!;
        public University University { get; set; } = null!;
        public Department Department { get; set; } = null!;
        public InternshipScore Score { get; set; } = null!;
        public InterviewProcess InterviewProcess { get; set; } = null!;
        public ICollection<InternshipAnswer> Answers { get; set; } = null!;
        public City City { get; set; } = null!;
    }

    public enum InternshipStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public enum InternshipTerm
    {
        ShortTerm,
        LongTerm
    }
}
