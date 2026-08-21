using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.DTOs;
using InternScope.DTOs.Internship;
using InternScope.Entities;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services
{
    public class AdminService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly InternshipService _internshipService;

        public AdminService(AppDbContext context, IMapper mapper, InternshipService internshipService   )
        {
            _context = context;
            _mapper = mapper;
            _internshipService = internshipService;
        }

        public async Task<List<AdminInternshipOutputModel>> GetPendingAsync()
        {
            return await _context.Internships
                .Where(i => i.Status == InternshipStatus.Pending)
                .OrderBy(i => i.CreatedAt)
                .ProjectTo<AdminInternshipOutputModel>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        public async Task<bool> ApproveAsync(Guid id, bool verifySgk)
        {
            var internship = await _context.Internships.FindAsync(id);
            if (internship == null) return false;

            internship.Status = InternshipStatus.Approved;

            if (verifySgk)
            {
                if (string.IsNullOrEmpty(internship.SgkDocumentUrl))
                    throw new Exception("SGK belgesi yüklenmemiş, belgeli onay yapılamaz.");
                internship.IsSgkVerified = true;
            }

            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RejectAsync(Guid id)
        {
            var internship = await _context.Internships.FindAsync(id);
            if (internship == null) return false;
            internship.Status = InternshipStatus.Rejected;
            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
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

        public async Task<bool> DeleteAsync(Guid id)
        {
            var internship = await _context.Internships
                .Include(i => i.Score)
                .Include(i => i.InterviewProcess)
                .Include(i => i.Answers)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (internship == null) return false;

            // Bağlı kayıtları da sil (yoksa FK hatası verir)
            if (internship.Score != null)
                _context.InternshipScores.Remove(internship.Score);
            if (internship.InterviewProcess != null)
                _context.InterviewProcesses.Remove(internship.InterviewProcess);
            if (internship.Answers != null && internship.Answers.Any())
                _context.InternshipAnswers.RemoveRange(internship.Answers);

            _context.Internships.Remove(internship);
            await _context.SaveChangesAsync();
            return true;
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



        public async Task<bool> ApprovePendingChangesAsync(Guid id)
        {
            var internship = await _context.Internships
                .Include(i => i.Score)
                .Include(i => i.InterviewProcess)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (internship == null) return false;
            if (!internship.HasPendingChanges || internship.PendingChangesJson == null)
                throw new Exception("Bekleyen değişiklik yok.");

            var changes = JsonSerializer.Deserialize<InternshipInputModel>(internship.PendingChangesJson);
            await _internshipService.ApplyInputAsync(internship, changes);

            internship.HasPendingChanges = false;
            internship.PendingChangesJson = null;
            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RejectPendingChangesAsync(Guid id)
        {
            var internship = await _context.Internships.FindAsync(id);
            if (internship == null) return false;

            internship.HasPendingChanges = false;
            internship.PendingChangesJson = null;   // değişikliği at, eski hali kalır
            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}