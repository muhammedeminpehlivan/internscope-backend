using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.Common;
using InternScope.DTOs.Admin;
using InternScope.DTOs.Internship;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace InternScope.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IInternshipService _internshipService;
    private readonly ILogger<AdminService> _logger;
    private readonly INotificationService _notificationService;

    public AdminService(AppDbContext context, IMapper mapper, IInternshipService internshipService, ILogger<AdminService> logger,
        INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _internshipService = internshipService;
        _logger = logger;
        _notificationService = notificationService;
    }

    private const int WeeklyChartWeeks = 8;
    private const int TopReportedUserCount = 10;

    public async Task<AdminStatsOutputModel> GetStatsAsync()
    {
        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);
        var twoWeeksAgo = now.AddDays(-14);

        // DbContext aynı anda tek sorgu çalıştırabildiği için sorgular sırayla
        var pending = new PendingStatsModel
        {
            Internships = await _context.Internships.CountAsync(i => i.Status == InternshipStatus.Pending),
            InternshipChanges = await _context.Internships.CountAsync(i => i.HasPendingChanges),
            ReportedComments = await _context.InternshipComments
                .CountAsync(c => !c.IsDeleted && c.Reports.Any(r => !r.IsReviewed))
        };

        var totals = new TotalStatsModel
        {
            Users = await _context.Users.CountAsync(),
            ApprovedInternships = await _context.Internships.CountAsync(i => i.Status == InternshipStatus.Approved),
            Companies = await _context.Companies.CountAsync(),
            Comments = await _context.InternshipComments.CountAsync(c => !c.IsDeleted)
        };

        var lastWeek = new LastWeekStatsModel
        {
            NewInternships = await _context.Internships.CountAsync(i => i.CreatedAt >= weekAgo),
            NewInternshipsPreviousWeek = await _context.Internships
                .CountAsync(i => i.CreatedAt >= twoWeeksAgo && i.CreatedAt < weekAgo),
            NewUsers = await _context.Users.CountAsync(u => u.CreatedAt >= weekAgo),
            NewComments = await _context.InternshipComments.CountAsync(c => c.CreatedAt >= weekAgo)
        };

        return new AdminStatsOutputModel
        {
            Pending = pending,
            Totals = totals,
            LastWeek = lastWeek,
            WeeklyInternships = await GetWeeklyInternshipCountsAsync(now),
            TopReportedUsers = await GetTopReportedUsersAsync()
        };
    }

    // Son N takvim haftasında gönderilen değerlendirme sayısı (durumdan bağımsız: reddedilenler dahil).
    // Boş haftalar da 0 ile döner ki grafik kopuk olmasın.
    private async Task<List<WeeklyCountModel>> GetWeeklyInternshipCountsAsync(DateTime now)
    {
        var today = DateOnly.FromDateTime(now);
        var thisMonday = today.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var firstMonday = thisMonday.AddDays(-7 * (WeeklyChartWeeks - 1));
        var from = firstMonday.ToDateTime(TimeOnly.MinValue);

        // Veri küçük (en fazla birkaç haftalık kayıt tarihi): haftalara bellekte bölmek SQL'de
        // tarih fonksiyonlarıyla uğraşmaktan daha basit
        var dates = await _context.Internships
            .Where(i => i.CreatedAt >= from)
            .Select(i => i.CreatedAt)
            .ToListAsync();

        return Enumerable.Range(0, WeeklyChartWeeks)
            .Select(w =>
            {
                var start = firstMonday.AddDays(7 * w);
                var end = start.AddDays(7);
                return new WeeklyCountModel
                {
                    WeekStart = start,
                    Count = dates.Count(d => DateOnly.FromDateTime(d) >= start && DateOnly.FromDateTime(d) < end)
                };
            })
            .ToList();
    }

    // Yorumları en çok şikayet alan kullanıcılar (kapatılmış şikayetler dahil; açık olanlar ayrıca gösterilir)
    private async Task<List<ReportedUserModel>> GetTopReportedUsersAsync()
    {
        var top = await _context.CommentReports
            .GroupBy(r => r.Comment.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalReports = g.Count(),
                OpenReports = g.Count(r => !r.IsReviewed),
                ReportedCommentCount = g.Select(r => r.CommentId).Distinct().Count()
            })
            .OrderByDescending(x => x.TotalReports)
            .ThenByDescending(x => x.OpenReports)
            .Take(TopReportedUserCount)
            .ToListAsync();

        var userIds = top.Select(x => x.UserId).ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => new { u.FullName, u.Email });

        return top
            .Where(x => users.ContainsKey(x.UserId))
            .Select(x => new ReportedUserModel
            {
                UserId = x.UserId,
                FullName = users[x.UserId].FullName,
                Email = users[x.UserId].Email,
                TotalReports = x.TotalReports,
                OpenReports = x.OpenReports,
                ReportedCommentCount = x.ReportedCommentCount
            })
            .ToList();
    }

    public async Task<List<AdminInternshipOutputModel>> GetPendingAsync()
    {
        return await _context.Internships
            .Where(i => i.Status == InternshipStatus.Pending)
            .OrderBy(i => i.CreatedAt)
            .ProjectTo<AdminInternshipOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<Result> ApproveAsync(Guid id, bool verifySgk)
    {
        var internship = await _context.Internships.FindAsync(id);
        if (internship == null) return Error.NotFound("Staj bulunamadı.");

        if (verifySgk && string.IsNullOrEmpty(internship.SgkDocumentUrl))
            return Error.Validation("SGK belgesi yüklenmemiş, belgeli onay yapılamaz.");

        var wasApproved = internship.Status == InternshipStatus.Approved;
        internship.Status = InternshipStatus.Approved;
        if (verifySgk) internship.IsSgkVerified = true;
        internship.UpdatedAt = DateTime.UtcNow;

        // Zaten onaylıysa (ör. sonradan SGK doğrulaması) tekrar "onaylandı" bildirimi gitmesin
        if (!wasApproved)
        {
            var companyName = await GetCompanyNameAsync(internship.CompanyId);
            var sgkNote = verifySgk ? " SGK belgeniz de doğrulandı." : "";
            _notificationService.Notify(internship.UserId, NotificationType.InternshipApproved,
                $"{companyName} staj değerlendirmeniz onaylandı ve yayına alındı.{sgkNote}", internship.Id);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Staj onaylandı: {InternshipId} (SGK={VerifySgk})", id, verifySgk);
        return Result.Success();
    }

    public async Task<Result> RejectAsync(Guid id, string? reason)
    {
        var internship = await _context.Internships.FindAsync(id);
        if (internship == null) return Error.NotFound("Staj bulunamadı.");

        internship.Status = InternshipStatus.Rejected;
        internship.RejectionReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        internship.UpdatedAt = DateTime.UtcNow;

        var companyName = await GetCompanyNameAsync(internship.CompanyId);
        _notificationService.Notify(internship.UserId, NotificationType.InternshipRejected,
            $"{companyName} staj değerlendirmeniz reddedildi.{ReasonText(internship.RejectionReason)} Düzenleyip tekrar gönderebilirsiniz.",
            internship.Id);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Staj reddedildi: {InternshipId} (gerekçe: {HasReason})", id, internship.RejectionReason != null);
        return Result.Success();
    }

    public async Task<List<AdminInternshipOutputModel>> GetAllAsync(string? status)
    {
        var query = _context.Internships.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InternshipStatus>(status, true, out var parsed))
            query = query.Where(i => i.Status == parsed);

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .ProjectTo<AdminInternshipOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<Result> DeleteAsync(Guid id)
    {
        var internship = await _context.Internships
            .Include(i => i.Score)
            .Include(i => i.InterviewProcess)
            .Include(i => i.Answers)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (internship == null) return Error.NotFound("Staj bulunamadı.");

        if (internship.Score != null) _context.InternshipScores.Remove(internship.Score);
        if (internship.InterviewProcess != null) _context.InterviewProcesses.Remove(internship.InterviewProcess);
        if (internship.Answers?.Any() == true) _context.InternshipAnswers.RemoveRange(internship.Answers);

        _context.Internships.Remove(internship);
        await _context.SaveChangesAsync();

        _logger.LogWarning("Staj kalıcı silindi: {InternshipId}", id);
        return Result.Success();
    }

    public async Task<List<PendingChangeReviewModel>> GetPendingChangesAsync()
    {
        var internships = await _context.Internships
            .Where(i => i.HasPendingChanges)
            .Include(i => i.Company)
            .Include(i => i.University)
            .Include(i => i.Department)
            .Include(i => i.City)
            .Include(i => i.User)
            .Include(i => i.Score)
            .Include(i => i.InterviewProcess)
            .OrderBy(i => i.UpdatedAt)
            .ToListAsync();

        // Önerilen değerlerdeki Id'leri (şehir/üniversite/bölüm) okunur isme çevirmek için.
        var universityNames = await _context.Universities.ToDictionaryAsync(u => u.Id, u => u.Name);
        var departmentNames = await _context.Departments.ToDictionaryAsync(d => d.Id, d => d.Name);
        var cityNames = await _context.Cities.ToDictionaryAsync(c => c.Id, c => c.Name);

        var result = new List<PendingChangeReviewModel>();
        foreach (var internship in internships)
        {
            if (internship.PendingChangesJson == null) continue;

            var proposed = JsonSerializer.Deserialize<InternshipInputModel>(internship.PendingChangesJson);
            if (proposed == null) continue;

            result.Add(new PendingChangeReviewModel
            {
                Current = _mapper.Map<AdminInternshipOutputModel>(internship),
                Proposed = proposed,
                Changes = BuildChanges(internship, proposed, universityNames, departmentNames, cityNames)
            });
        }

        return result;
    }

    // Mevcut staj ile önerilen düzenlemeyi alan alan kıyaslar; yalnızca gerçekten
    // değişen alanları eski/yeni değerleriyle döndürür. Id'ler okunur isme çevrilir.
    private static List<PendingFieldChange> BuildChanges(
        Internship current,
        InternshipInputModel proposed,
        IReadOnlyDictionary<Guid, string> universityNames,
        IReadOnlyDictionary<Guid, string> departmentNames,
        IReadOnlyDictionary<Guid, string> cityNames)
    {
        var changes = new List<PendingFieldChange>();

        void Add(string field, string label, string? oldVal, string? newVal)
        {
            if (!string.Equals(oldVal, newVal, StringComparison.Ordinal))
                changes.Add(new PendingFieldChange
                {
                    Field = field,
                    Label = label,
                    OldValue = oldVal,
                    NewValue = newVal
                });
        }

        Add("companyName", "Şirket", current.Company?.Name, proposed.CompanyName);
        Add("university", "Üniversite",
            current.University?.Name, universityNames.GetValueOrDefault(proposed.UniversityId));
        Add("department", "Bölüm",
            current.Department?.Name, departmentNames.GetValueOrDefault(proposed.DepartmentId));
        Add("companyDepartment", "Birim / Departman", current.CompanyDepartment, proposed.CompanyDepartment);
        Add("city", "Şehir",
            current.City?.Name, cityNames.GetValueOrDefault(proposed.CityId));
        Add("startDate", "Başlangıç Tarihi",
            current.StartDate.ToString("dd.MM.yyyy"), proposed.StartDate.ToString("dd.MM.yyyy"));
        Add("endDate", "Bitiş Tarihi",
            current.EndDate.ToString("dd.MM.yyyy"), proposed.EndDate.ToString("dd.MM.yyyy"));
        Add("studentYear", "Sınıf", StudentYearLabel(current.StudentYear), StudentYearLabel(proposed.StudentYear));
        Add("term", "Staj Dönemi", TermLabel(current.Term), TermLabel(proposed.Term));
        Add("isAnonymous", "Anonim", BoolLabel(current.IsAnonymous), BoolLabel(proposed.IsAnonymous));
        Add("returnOfferReceived", "Geri Dönüş Teklifi",
            BoolLabel(current.ReturnOfferReceived), BoolLabel(proposed.ReturnOfferReceived));
        Add("stipendMin", "Asgari Burs", current.StipendMin?.ToString(), proposed.StipendMin?.ToString());
        Add("stipendMax", "Azami Burs", current.StipendMax?.ToString(), proposed.StipendMax?.ToString());
        Add("currency", "Para Birimi", current.Currency, proposed.Currency);

        if (current.Score != null)
        {
            Add("learningScore", "Öğrenme Puanı",
                current.Score.LearningScore.ToString(), proposed.Scores?.LearningScore?.ToString());
            Add("mentoringScore", "Mentorluk Puanı",
                current.Score.MentoringScore.ToString(), proposed.Scores?.MentoringScore?.ToString());
            Add("techInfraScore", "Teknik Altyapı Puanı",
                current.Score.TechInfraScore.ToString(), proposed.Scores?.TechInfraScore?.ToString());
            Add("workEnvironmentScore", "Çalışma Ortamı Puanı",
                current.Score.WorkEnvironmentScore.ToString(), proposed.Scores?.WorkEnvironmentScore?.ToString());
            Add("salaryScore", "Maaş Puanı",
                current.Score.SalaryScore.ToString(), proposed.Scores?.SalaryScore?.ToString());
            Add("wouldRecommend", "Tavsiye Eder",
                BoolLabel(current.Score.WouldRecommend),
                proposed.Scores?.WouldRecommend is { } rec ? BoolLabel(rec) : null);
            Add("additionalTips", "Ek Tavsiyeler", current.Score.AdditionalTips, proposed.Scores?.AdditionalTips);
        }

        if (current.InterviewProcess != null)
        {
            Add("applicationMethod", "Başvuru Yöntemi",
                ApplicationMethodLabel(current.InterviewProcess.ApplicationMethod),
                proposed.Interview?.ApplicationMethod is { } m ? ApplicationMethodLabel(m) : null);
            Add("stageCount", "Aşama Sayısı",
                current.InterviewProcess.StageCount.ToString(), proposed.Interview?.StageCount?.ToString());
            Add("interviewDescription", "Mülakat Açıklaması",
                current.InterviewProcess.Description, proposed.Interview?.Description);
        }

        return changes;
    }

    private static string BoolLabel(bool value) => value ? "Evet" : "Hayır";

    private static string StudentYearLabel(StudentYear year) => year switch
    {
        StudentYear.FirstYear => "1. Sınıf",
        StudentYear.SecondYear => "2. Sınıf",
        StudentYear.ThirdYear => "3. Sınıf",
        StudentYear.FourthYear => "4. Sınıf",
        StudentYear.Graduate => "Mezun",
        _ => year.ToString()
    };

    private static string TermLabel(InternshipTerm term) => term switch
    {
        InternshipTerm.ShortTerm => "Kısa Dönem",
        InternshipTerm.LongTerm => "Uzun Dönem",
        _ => term.ToString()
    };

    private static string ApplicationMethodLabel(ApplicationMethod method) => method switch
    {
        ApplicationMethod.KariyerKapisi => "Kariyer Kapısı",
        ApplicationMethod.Iskur => "İŞKUR",
        ApplicationMethod.LinkedIn => "LinkedIn",
        ApplicationMethod.KariyerNet => "Kariyer.net",
        ApplicationMethod.Youthall => "Youthall",
        ApplicationMethod.ToptalentCo => "toptalent.co",
        ApplicationMethod.IndeedTurkiye => "Indeed Türkiye",
        ApplicationMethod.CompanyWebsite => "Şirket Web Sitesi",
        ApplicationMethod.Reference => "Referans",
        ApplicationMethod.InternshipFair => "Staj Fuarı",
        ApplicationMethod.Other => "Diğer",
        _ => method.ToString()
    };

    public async Task<Result> ApprovePendingChangesAsync(Guid id)
    {
        var internship = await _context.Internships
            .Include(i => i.Score)
            .Include(i => i.InterviewProcess)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (internship == null) return Error.NotFound("Staj bulunamadı.");
        if (!internship.HasPendingChanges || internship.PendingChangesJson == null)
            return Error.Validation("Bekleyen değişiklik yok.");

        var changes = JsonSerializer.Deserialize<InternshipInputModel>(internship.PendingChangesJson);
        await _internshipService.ApplyInputAsync(internship, changes!);

        internship.HasPendingChanges = false;
        internship.PendingChangesJson = null;
        internship.ChangeRejectionReason = null; // önceki red gerekçesi varsa temizle
        internship.UpdatedAt = DateTime.UtcNow;

        // Düzenleme şirketi değiştirmiş olabilir: yeni şirket adı (henüz kaydedilmemiş olsa da) kullanılır
        var companyName = await GetCompanyNameAsync(internship.CompanyId);
        _notificationService.Notify(internship.UserId, NotificationType.InternshipChangesApproved,
            $"{companyName} stajınızdaki düzenlemeler onaylandı ve yayına alındı.", internship.Id);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Bekleyen değişiklik onaylandı: {InternshipId}", id);
        return Result.Success();
    }

    public async Task<Result> RejectPendingChangesAsync(Guid id, string? reason)
    {
        var internship = await _context.Internships.FindAsync(id);
        if (internship == null) return Error.NotFound("Staj bulunamadı.");
        if (!internship.HasPendingChanges) return Error.Validation("Bekleyen değişiklik yok.");

        // Değişikliği çöpe at; staj eski onaylı haliyle yayında kalır.
        internship.HasPendingChanges = false;
        internship.PendingChangesJson = null;
        internship.ChangeRejectionReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        internship.UpdatedAt = DateTime.UtcNow;

        var companyName = await GetCompanyNameAsync(internship.CompanyId);
        _notificationService.Notify(internship.UserId, NotificationType.InternshipChangesRejected,
            $"{companyName} stajınızdaki düzenlemeler reddedildi, eski hali yayında kalmaya devam ediyor.{ReasonText(internship.ChangeRejectionReason)}",
            internship.Id);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Bekleyen değişiklik reddedildi: {InternshipId} (gerekçe: {HasReason})", id, internship.ChangeRejectionReason != null);
        return Result.Success();
    }

    // FindAsync önce takip edilen (henüz kaydedilmemiş) kayıtlara bakar: düzenlemeyle yeni açılan şirket de bulunur
    private async Task<string> GetCompanyNameAsync(Guid companyId)
        => (await _context.Companies.FindAsync(companyId))?.Name ?? "Bir";

    private static string ReasonText(string? reason)
        => reason == null ? "" : $" Gerekçe: {reason.TrimEnd('.', ' ')}.";
}
