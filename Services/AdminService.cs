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
        var currentList = await _context.Internships
            .Where(i => i.HasPendingChanges)
            .OrderBy(i => i.UpdatedAt)
            .ProjectTo<AdminInternshipOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();

        var jsonMap = await _context.Internships
            .Where(i => i.HasPendingChanges)
            .Select(i => new { i.Id, i.PendingChangesJson })
            .ToDictionaryAsync(x => x.Id, x => x.PendingChangesJson);

        return currentList.Select(c => new PendingChangeReviewModel
        {
            Current = c,
            Proposed = jsonMap.TryGetValue(c.Id, out var json) && json != null
                ? JsonSerializer.Deserialize<InternshipInputModel>(json)
                : null
        }).ToList();
    }

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
        internship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Bekleyen değişiklik onaylandı: {InternshipId}", id);
        return Result.Success();
    }

    public async Task<Result> RejectPendingChangesAsync(Guid id)
    {
        var internship = await _context.Internships.FindAsync(id);
        if (internship == null) return Error.NotFound("Staj bulunamadı.");

        internship.HasPendingChanges = false;
        internship.PendingChangesJson = null;
        internship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Bekleyen değişiklik reddedildi: {InternshipId}", id);
        return Result.Success();
    }
}
