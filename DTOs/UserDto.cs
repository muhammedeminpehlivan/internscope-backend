namespace InternScope.DTOs.User
{
    // Öğrencinin profilinde okul/bölüm ve LinkedIn URL güncellemesi
    public class UpdateProfileInputModel
    {
        public Guid? UniversityId { get; set; }
        public Guid? DepartmentId { get; set; }
        public string? LinkedInProfileUrl { get; set; }
    }
}
