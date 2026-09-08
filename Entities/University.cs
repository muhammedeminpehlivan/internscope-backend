namespace InternScope.Entities;

public class University : BaseEntity
{
    public string Name { get; set; } = null!;

    public ICollection<Internship> Internships { get; set; } = null!;
}
