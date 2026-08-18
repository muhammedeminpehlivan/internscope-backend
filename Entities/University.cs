namespace InternScope.Entities
{
    public class University : BaseEntity
    {
        public string Name { get; set; }

        public ICollection<Internship> Internships { get; set; }
    }
}
