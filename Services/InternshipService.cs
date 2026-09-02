using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.Common;
using InternScope.DTOs.Internship;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace InternScope.Services;

public class InternshipService
{
    private readonly AppDbContext _context;
    private readonly CompanyService _companyService;
    private readonly DepartmentService _departmentService;
    private readonly CloudinaryService _cloudinaryService;
    private readonly IMapper _mapper;
    private readonly ILogger<InternshipService> _logger;

    public InternshipService(AppDbContext context, CompanyService companyService, IMapper mapper,
        DepartmentService departmentService, CloudinaryService cloudinaryService, ILogger<InternshipService> logger)
    {
        _context = context;
        _companyService = companyService;
        _mapper = mapper;
        _departmentService = departmentService;
        _cloudinaryService = cloudinaryService;
        _logger = logger;
    }

    public async Task<Result<Guid>> CreateInternshipAsync(Guid userId, InternshipInputModel input)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return Error.NotFound("Kullanıcı bulunamadı.");
        if (!user.IsEmailVerified)
            return Error.Validation("Staj değerlendirmesi girmek için önce öğrenci mailinizi doğrulamalısınız.");

        var company = await _companyService.GetOrCreateCompanyAsync(input.CompanyName);

        var internship = new Internship
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CompanyId = company.Id,
            UniversityId = input.UniversityId,
            DepartmentId = input.DepartmentId,
            CityId = input.CityId,
            CompanyDepartment = input.CompanyDepartment,
            StartDate = input.StartDate,
            EndDate = input.EndDate,
            IsAnonymous = input.IsAnonymous,
            Term = input.Term,
            StipendMin = input.StipendMin,
            StipendMax = input.StipendMax,
            Currency = string.IsNullOrWhiteSpace(input.Currency) ? "TRY" : input.Currency,
            ReturnOfferReceived = input.ReturnOfferReceived,
            IsSgkVerified = false,
            Status = InternshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var score = _mapper.Map<InternshipScore>(input.Scores);
        score.Id = Guid.NewGuid();
        score.InternshipId = internship.Id;
        score.CreatedAt = DateTime.UtcNow;

        var interview = _mapper.Map<InterviewProcess>(input.Interview);
        interview.Id = Guid.NewGuid();
        interview.InternshipId = internship.Id;
        interview.CreatedAt = DateTime.UtcNow;

        if (user.UniversityId == null) user.UniversityId = input.UniversityId;
        if (user.DepartmentId == null) user.DepartmentId = input.DepartmentId;

        _context.Internships.Add(internship);
        _context.InternshipScores.Add(score);
        _context.InterviewProcesses.Add(interview);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Staj değerlendirmesi oluşturuldu: {InternshipId} — UserId={UserId}", internship.Id, userId);
        return internship.Id;
    }

    public async Task<List<InternshipOutputModel>> GetApprovedInternshipsAsync()
    {
        return await _context.Internships
            .Where(i => i.Status == InternshipStatus.Approved)
            .OrderByDescending(i => i.CreatedAt)
            .ProjectTo<InternshipOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<List<InternshipOutputModel>> GetMyInternshipsAsync(Guid userId)
    {
        return await _context.Internships
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .ProjectTo<InternshipOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<Result> UploadSgkAsync(Guid userId, Guid internshipId, IFormFile file, string verificationCode)
    {
        var internship = await _context.Internships.FindAsync(internshipId);
        if (internship == null)
            return Error.NotFound("Staj bulunamadı.");
        if (internship.UserId != userId)
            return Error.Forbidden("Bu staj size ait değil.");
        if (string.IsNullOrWhiteSpace(verificationCode))
            return Error.Validation("Belge doğrulama kodu gerekli.");

        var url = await _cloudinaryService.UploadSgkDocumentAsync(file);
        internship.SgkDocumentUrl = url;
        internship.SgkVerificationCode = verificationCode.Trim();
        internship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("SGK belgesi yüklendi: {InternshipId}", internshipId);
        return Result.Success();
    }

    public async Task<Result> UpdateAsync(Guid userId, Guid internshipId, InternshipInputModel input)
    {
        var internship = await _context.Internships
            .Include(i => i.Score)
            .Include(i => i.InterviewProcess)
            .FirstOrDefaultAsync(i => i.Id == internshipId);

        if (internship == null)
            return Error.NotFound("Staj bulunamadı.");
        if (internship.UserId != userId)
            return Error.Forbidden("Bu staj size ait değil.");

        if (internship.Status == InternshipStatus.Approved)
        {
            internship.PendingChangesJson = JsonSerializer.Serialize(input);
            internship.HasPendingChanges = true;
        }
        else
        {
            await ApplyInputAsync(internship, input);
            internship.Status = InternshipStatus.Pending;
        }

        internship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    public async Task ApplyInputAsync(Internship internship, InternshipInputModel input)
    {
        var company = await _companyService.GetOrCreateCompanyAsync(input.CompanyName);

        internship.CompanyId = company.Id;
        internship.UniversityId = input.UniversityId;
        internship.DepartmentId = input.DepartmentId;
        internship.CityId = input.CityId;
        internship.CompanyDepartment = input.CompanyDepartment;
        internship.StartDate = input.StartDate;
        internship.EndDate = input.EndDate;
        internship.IsAnonymous = input.IsAnonymous;
        internship.Term = input.Term;
        internship.StipendMin = input.StipendMin;
        internship.StipendMax = input.StipendMax;
        internship.Currency = string.IsNullOrWhiteSpace(input.Currency) ? "TRY" : input.Currency;
        internship.ReturnOfferReceived = input.ReturnOfferReceived;

        if (internship.Score != null)
        {
            internship.Score.LearningScore = input.Scores.LearningScore;
            internship.Score.MentoringScore = input.Scores.MentoringScore;
            internship.Score.TechInfraScore = input.Scores.TechInfraScore;
            internship.Score.WorkEnvironmentScore = input.Scores.WorkEnvironmentScore;
            internship.Score.SalaryScore = input.Scores.SalaryScore;
            internship.Score.WouldRecommend = input.Scores.WouldRecommend;
            internship.Score.AdditionalTips = input.Scores.AdditionalTips;
        }

        if (internship.InterviewProcess != null)
        {
            internship.InterviewProcess.ApplicationMethod = input.Interview.ApplicationMethod;
            internship.InterviewProcess.StageCount = input.Interview.StageCount;
            internship.InterviewProcess.Description = input.Interview.Description;
        }
    }
}
