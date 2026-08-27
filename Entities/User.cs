namespace InternScope.Entities
{
    public class User : BaseEntity
    {
        public string LinkedInId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public bool IsEmailVerified { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public UserRole Role { get; set; }
        public string? EmailVerificationToken { get; set; }
        public DateTime? EmailVerificationTokenExpiry { get; set; }
        public string? StudentEmail { get; set; }

        // Öğrencinin okulu ve bölümü (profil). Manuel girilebilir ya da
        // ilk staj kaydından otomatik doldurulabilir.
        public Guid? UniversityId { get; set; }
        public Guid? DepartmentId { get; set; }


        public University? University { get; set; }
        public Department? Department { get; set; }

        public ICollection<Internship> Internships { get; set; }
    }

    public enum UserRole
    {
        Student,
        Admin
    }
}
