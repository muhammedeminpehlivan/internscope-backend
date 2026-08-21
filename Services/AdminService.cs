using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.DTOs;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services
{
    public class AdminService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public AdminService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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
    }
}