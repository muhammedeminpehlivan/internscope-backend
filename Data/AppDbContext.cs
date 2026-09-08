using Microsoft.EntityFrameworkCore;
using InternScope.Entities;

namespace InternScope.Data;

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
    public DbSet<City> Cities { get; set; }
    public DbSet<InternshipComment> InternshipComments { get; set; }
    public DbSet<InternshipReaction> InternshipReactions { get; set; }
    public DbSet<CommentReport> CommentReports { get; set; }

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

            b.HasOne(u => u.University)
                .WithMany()
                .HasForeignKey(u => u.UniversityId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(u => u.Department)
                .WithMany()
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Sık kullanılan sorgu: Status = Approved order by CreatedAt desc
        modelBuilder.Entity<Internship>(b =>
        {
            b.HasIndex(i => new { i.Status, i.CreatedAt });
        });

        // Bir kullanıcı aynı staja sadece bir reaction verebilir
        modelBuilder.Entity<InternshipReaction>(b =>
        {
            b.HasIndex(r => new { r.InternshipId, r.UserId }).IsUnique();
        });

        // Bir kullanıcı aynı yorumu sadece bir kez şikayet edebilir
        modelBuilder.Entity<CommentReport>(b =>
        {
            b.HasIndex(r => new { r.CommentId, r.ReportedByUserId }).IsUnique();
        });
    }
}
