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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Case-insensitive collation (Postgres) — Name/Slug/Email eşleştirmeleri için
        modelBuilder.HasCollation("ci_collation", locale: "und-u-ks-level2", provider: "icu", deterministic: false);

        modelBuilder.Entity<Company>(b =>
        {
            b.Property(c => c.Name).UseCollation("ci_collation");
            b.HasIndex(c => c.Name).IsUnique();
            b.HasIndex(c => c.Slug).IsUnique();
        });

        modelBuilder.Entity<Department>(b =>
        {
            b.Property(d => d.Name).UseCollation("ci_collation");
            b.HasIndex(d => d.Name).IsUnique();
        });

        modelBuilder.Entity<University>(b =>
        {
            b.HasIndex(u => u.Name).IsUnique();
        });

        modelBuilder.Entity<User>(b =>
        {
            b.HasIndex(u => u.LinkedInId).IsUnique();
            b.Property(u => u.StudentEmail).UseCollation("ci_collation");
        });

        // Sık kullanılan sorgu: Status = Approved order by CreatedAt desc
        modelBuilder.Entity<Internship>(b =>
        {
            b.HasIndex(i => new { i.Status, i.CreatedAt });
        });
    }
}
