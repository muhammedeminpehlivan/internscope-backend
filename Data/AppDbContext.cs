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
    public DbSet<CommentReaction> CommentReactions { get; set; }
    public DbSet<CommentReport> CommentReports { get; set; }
    public DbSet<NewsArticle> NewsArticles { get; set; }
    public DbSet<Notification> Notifications { get; set; }

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

        // Yorum cevapları: self-reference, yorumlar soft-delete olduğu için cascade gerekmez
        modelBuilder.Entity<InternshipComment>(b =>
        {
            b.HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Bir kullanıcı aynı yoruma sadece bir reaction verebilir
        modelBuilder.Entity<CommentReaction>(b =>
        {
            b.HasIndex(r => new { r.CommentId, r.UserId }).IsUnique();
        });

        // Aynı haber (SourceUrl) iki kez eklenmesin + tarihe göre listeleme hızlı olsun
        modelBuilder.Entity<NewsArticle>(b =>
        {
            b.HasIndex(n => n.SourceUrl).IsUnique();
            b.HasIndex(n => n.PublishedAt);
        });

        // Zil ikonu sorgusu: kullanıcının (okunmamış) bildirimleri, en yeni önce
        modelBuilder.Entity<Notification>(b =>
        {
            b.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
        });

        // Bir kullanıcı aynı yorumu sadece bir kez şikayet edebilir
        modelBuilder.Entity<CommentReport>(b =>
        {
            b.HasIndex(r => new { r.CommentId, r.ReportedByUserId }).IsUnique();

            // FK'yi açıkça bağla: "ReportedBy" navigation'ı için EF konvansiyonu "ReportedById" arar,
            // bulamayınca gölge bir kolon üretiyordu ve o kolon boş kaldığı için şikayet INSERT'i patlıyordu.
            b.HasOne(r => r.ReportedBy)
                .WithMany()
                .HasForeignKey(r => r.ReportedByUserId);
        });
    }
}
