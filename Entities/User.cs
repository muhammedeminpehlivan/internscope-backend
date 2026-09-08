namespace InternScope.Entities;

public class User : BaseEntity
{
    public string LinkedInId { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public bool IsEmailVerified { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public UserRole Role { get; set; }
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
    public string? StudentEmail { get; set; }
    public string? LinkedInProfileUrl { get; set; }

    // Öğrencinin okulu ve bölümü (profil). Manuel girilebilir ya da
    // ilk staj kaydından otomatik doldurulabilir.
    public Guid? UniversityId { get; set; }
    public Guid? DepartmentId { get; set; }

    public University? University { get; set; }
    public Department? Department { get; set; }

    public ICollection<Internship> Internships { get; set; } = null!;
}

public enum UserRole
{
    Student,
    Admin
}
