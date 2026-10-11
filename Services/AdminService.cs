using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.Common;
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

    public AdminService(AppDbContext context, IMapper mapper, IInternshipService internshipService, ILogger<AdminService> logger)
    {
        _context = context;
        _mapper = mapper;
        _internshipService = internshipService;
        _logger = logger;
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

        internship.Status = InternshipStatus.Approved;
        if (verifySgk) internship.IsSgkVerified = true;
        internship.UpdatedAt = DateTime.UtcNow;
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
        await _context.SaveChangesAsync();

        _logger.LogInformation("Bekleyen değişiklik reddedildi: {InternshipId} (gerekçe: {HasReason})", id, internship.ChangeRejectionReason != null);
        return Result.Success();
    }
}
