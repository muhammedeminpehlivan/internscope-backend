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

        public async Task<bool> ApproveAsync(Guid id)
        {
            var internship = await _context.Internships.FindAsync(id);
            if (internship == null) return false;
            internship.Status = InternshipStatus.Approved;
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
    }
}