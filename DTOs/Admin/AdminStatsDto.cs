namespace InternScope.DTOs.Admin;

// Admin dashboard'u için tek seferde dönen özet
public class AdminStatsOutputModel
{
    public PendingStatsModel Pending { get; set; } = null!;
    public TotalStatsModel Totals { get; set; } = null!;
    public LastWeekStatsModel LastWeek { get; set; } = null!;
    public List<WeeklyCountModel> WeeklyInternships { get; set; } = [];
    public List<ReportedUserModel> TopReportedUsers { get; set; } = [];
}

// Admin'in aksiyon alması gereken işler
public class PendingStatsModel
{
    public int Internships { get; set; }       // onay bekleyen değerlendirmeler
    public int InternshipChanges { get; set; } // onaylı stajlarda bekleyen düzenlemeler
    public int ReportedComments { get; set; }  // açık şikayeti olan yorumlar
}

public class TotalStatsModel
{
    public int Users { get; set; }
    public int ApprovedInternships { get; set; }
    public int Companies { get; set; }
    public int Comments { get; set; }
}

// Son 7 gün + karşılaştırma için önceki 7 gün
public class LastWeekStatsModel
{
    public int NewInternships { get; set; }
    public int NewInternshipsPreviousWeek { get; set; }
    public int NewUsers { get; set; }
    public int NewComments { get; set; }
}

// Pazartesi başlangıçlı takvim haftası; son eleman içinde bulunulan (yarım) hafta
public class WeeklyCountModel
{
    public DateOnly WeekStart { get; set; }
    public int Count { get; set; }
}

public class ReportedUserModel
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int TotalReports { get; set; }       // yorumlarına gelen tüm şikayetler
    public int OpenReports { get; set; }        // henüz incelenmemiş olanlar
    public int ReportedCommentCount { get; set; } // şikayet alan farklı yorum sayısı
}
