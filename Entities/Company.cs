namespace InternScope.Entities
{
    public class Company : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;

        public ICollection<Internship> Internships { get; set; } = null!;
    }
}
