namespace InternScope.Entities
{
    public class Company : BaseEntity
    {
        public string Name { get; set; }
        public string Slug { get; set; } // 

        public ICollection<Internship> Internships { get; set; }
    }
}
