namespace InternScope.DTOs.User
{
    // Öğrencinin profilinde okul/bölüm güncellemesi
    public class UpdateProfileInputModel
    {
        public Guid? UniversityId { get; set; }
        public Guid? DepartmentId { get; set; }
    }
}
