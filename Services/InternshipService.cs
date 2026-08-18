using AutoMapper;

using InternScope.DTOs.Internship;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;
using AutoMapper.QueryableExtensions;

namespace InternScope.Services
{
    public class InternshipService
    {
        private readonly AppDbContext _context;
        private readonly CompanyService _companyService;
        private readonly IMapper _mapper;

        public InternshipService(AppDbContext context, CompanyService companyService, IMapper mapper)
        {
            _context = context;
            _companyService = companyService;
            _mapper = mapper;
        }

        public async Task<Guid> CreateInternshipAsync(Guid userId, InternshipInputModel input)
        {
            // 1. Kullanıcı mail doğrulaması yaptı mı? (iş kuralı)
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");
            if (!user.IsEmailVerified)
                throw new Exception("Staj değerlendirmesi girmek için önce öğrenci mailinizi doğrulamalısınız.");

            // 2. Firmayı bul veya oluştur
            var company = await _companyService.GetOrCreateCompanyAsync(input.CompanyName);

            // 3. Staj kaydını oluştur
            var internship = new Internship
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CompanyId = company.Id,
                UniversityId = input.UniversityId,
                DepartmentId = input.DepartmentId,
                CompanyDepartment = input.CompanyDepartment,
                StartDate = input.StartDate,
                EndDate = input.EndDate,
                IsAnonymous = input.IsAnonymous,
                IsSgkVerified = false,             // SGK yükleme ayrı adım
                Status = InternshipStatus.Pending, // admin onayı bekleyecek
                CreatedAt = DateTime.UtcNow
            };

            // 4. Puanları bağla (AutoMapper: input -> entity)
            var score = _mapper.Map<InternshipScore>(input.Scores);
            score.Id = Guid.NewGuid();
            score.InternshipId = internship.Id;
            score.CreatedAt = DateTime.UtcNow;

            // 5. Mülakat sürecini bağla
            var interview = _mapper.Map<InterviewProcess>(input.Interview);
            interview.Id = Guid.NewGuid();
            interview.InternshipId = internship.Id;
            interview.CreatedAt = DateTime.UtcNow;

            // 6. Hepsini kaydet
            _context.Internships.Add(internship);
            _context.InternshipScores.Add(score);
            _context.InterviewProcesses.Add(interview);
            await _context.SaveChangesAsync();

            return internship.Id;
        }

        // Sadece onaylanmış stajları getir (herkese açık)
        public async Task<List<InternshipOutputModel>> GetApprovedInternshipsAsync()
        {
            return await _context.Internships
                .Where(i => i.Status == InternshipStatus.Approved)
                .OrderByDescending(i => i.CreatedAt)
                .ProjectTo<InternshipOutputModel>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        // Kullanıcının kendi stajları (her durumda)
        public async Task<List<InternshipOutputModel>> GetMyInternshipsAsync(Guid userId)
        {
            return await _context.Internships
                .Where(i => i.UserId == userId)
                .OrderByDescending(i => i.CreatedAt)
                .ProjectTo<InternshipOutputModel>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

    }



}