using Microsoft.EntityFrameworkCore;
using InternScope.Entities;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<University> Universities { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Internship> Internships { get; set; }
    public DbSet<InternshipScore> InternshipScores { get; set; }
    public DbSet<InterviewProcess> InterviewProcesses { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<InternshipAnswer> InternshipAnswers { get; set; }
}