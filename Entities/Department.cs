namespace InternScope.Entities
{
    public class Department : BaseEntity
    {
        public string Name { get; set; }

       
        public ICollection<Internship> Internships { get; set; }
    }
}
