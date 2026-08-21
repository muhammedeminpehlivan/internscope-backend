using AutoMapper;

using InternScope.DTOs.Internship;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;
using AutoMapper.QueryableExtensions;
using System.Text.Json;

namespace InternScope.Services
{
    public class InternshipService
    {
        private readonly AppDbContext _context;
        private readonly CompanyService _companyService;
        private readonly DepartmentService _departmentService;
        private readonly CloudinaryService _cloudinaryService;
        private readonly IMapper _mapper;

        public InternshipService(AppDbContext context, CompanyService companyService, IMapper mapper, DepartmentService departmentService, CloudinaryService cloudinaryService)
        {
            _context = context;
            _companyService = companyService;
            _mapper = mapper;
            _departmentService = departmentService;
            _cloudinaryService = cloudinaryService;
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
            var department = await _departmentService.GetOrCreateByNameAsync(input.DepartmentName);

            // 3. Staj kaydını oluştur
            var internship = new Internship
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CompanyId = company.Id,
                UniversityId = input.UniversityId,
                DepartmentId = department.Id,
                CompanyDepartment = input.CompanyDepartment,
                StartDate = input.StartDate,
                EndDate = input.EndDate,
                IsAnonymous = input.IsAnonymous,
                Term = input.Term,
                StipendMin = input.StipendMin,
                StipendMax = input.StipendMax,
                Currency = string.IsNullOrWhiteSpace(input.Currency) ? "TRY" : input.Currency,
                ReturnOfferReceived = input.ReturnOfferReceived,
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

        public async Task UploadSgkAsync(Guid userId, Guid internshipId, IFormFile file, string verificationCode)
        {
            var internship = await _context.Internships.FindAsync(internshipId);
            if (internship == null)
                throw new Exception("Staj bulunamadı.");
            if (internship.UserId != userId)
                throw new Exception("Bu staj size ait değil.");
            if (string.IsNullOrWhiteSpace(verificationCode))
                throw new Exception("Belge doğrulama kodu gerekli.");

            var url = await _cloudinaryService.UploadSgkDocumentAsync(file);
            internship.SgkDocumentUrl = url;
            internship.SgkVerificationCode = verificationCode.Trim();
            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // Kullanıcı stajını düzenler
        public async Task UpdateAsync(Guid userId, Guid internshipId, InternshipInputModel input)
        {
            var internship = await _context.Internships
                .Include(i => i.Score)
                .Include(i => i.InterviewProcess)
                .FirstOrDefaultAsync(i => i.Id == internshipId);

            if (internship == null)
                throw new Exception("Staj bulunamadı.");
            if (internship.UserId != userId)
                throw new Exception("Bu staj size ait değil.");

            if (internship.Status == InternshipStatus.Approved)
            {
                // Onaylı → canlı hali dursun, değişikliği beklet
                internship.PendingChangesJson = JsonSerializer.Serialize(input);
                internship.HasPendingChanges = true;
            }
            else
            {
                // Pending/Rejected → zaten yayında değil, direkt uygula + tekrar onaya
                await ApplyInputAsync(internship, input);
                internship.Status = InternshipStatus.Pending;
            }

            internship.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // Ortak: bir InternshipInputModel'i mevcut stajın üstüne uygular
        public async Task ApplyInputAsync(Internship internship, InternshipInputModel input)
        {
            var company = await _companyService.GetOrCreateCompanyAsync(input.CompanyName);
            var department = await _departmentService.GetOrCreateByNameAsync(input.DepartmentName);

            internship.CompanyId = company.Id;
            internship.UniversityId = input.UniversityId;
            internship.DepartmentId = department.Id;
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



}