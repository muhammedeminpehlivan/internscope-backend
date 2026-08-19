using InternScope.DTOs;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services
{
    public class StatisticsService
    {
        private readonly AppDbContext _context;

        public StatisticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<UniversityStatOutputModel>> GetUniversityStatsAsync()
        {
            var data = await _context.Internships
                .Where(i => i.Status == InternshipStatus.Approved && i.Score != null)
                .Select(i => new
                {
                    Name = i.University.Name,
                    i.Score.LearningScore,
                    i.Score.MentoringScore,
                    i.Score.TechInfraScore,
                    i.Score.WorkEnvironmentScore,
                    i.Score.SalaryScore
                })
                .ToListAsync();

            return data
                .GroupBy(x => x.Name)
                .Select(g => new UniversityStatOutputModel
                {
                    UniversityName = g.Key,
                    ReviewCount = g.Count(),
                    AverageScore = g.Average(x => (x.LearningScore + x.MentoringScore + x.TechInfraScore
                        + x.WorkEnvironmentScore + x.SalaryScore) / 5.0)
                })
                .OrderByDescending(s => s.AverageScore)
                .ToList();
        }

        public async Task<List<DepartmentStatOutputModel>> GetDepartmentStatsAsync()
        {
            var data = await _context.Internships
                .Where(i => i.Status == InternshipStatus.Approved && i.Score != null)
                .Select(i => new
                {
                    Name = i.Department.Name,
                    i.Score.LearningScore,
                    i.Score.MentoringScore,
                    i.Score.TechInfraScore,
                    i.Score.WorkEnvironmentScore,
                    i.Score.SalaryScore
                })
                .ToListAsync();

            return data
                .GroupBy(x => x.Name)
                .Select(g => new DepartmentStatOutputModel
                {
                    DepartmentName = g.Key,
                    ReviewCount = g.Count(),
                    AverageScore = g.Average(x => (x.LearningScore + x.MentoringScore + x.TechInfraScore
                        + x.WorkEnvironmentScore + x.SalaryScore) / 5.0)
                })
                .OrderByDescending(s => s.AverageScore)
                .ToList();
        }

        public async Task<OverallStatOutputModel> GetOverallAsync()
        {
            var scores = await _context.Internships
                .Where(i => i.Status == InternshipStatus.Approved && i.Score != null)
                .Select(i => new
                {
                    i.Score.LearningScore,
                    i.Score.MentoringScore,
                    i.Score.TechInfraScore,
                    i.Score.WorkEnvironmentScore,
                    i.Score.SalaryScore
                })
                .ToListAsync();

            return new OverallStatOutputModel
            {
                TotalApprovedReviews = scores.Count,
                TotalCompanies = await _context.Companies.CountAsync(),
                TotalUniversities = await _context.Universities.CountAsync(),
                OverallAverageScore = scores.Any()
                    ? scores.Average(x => (x.LearningScore + x.MentoringScore + x.TechInfraScore
                        + x.WorkEnvironmentScore + x.SalaryScore) / 5.0)
                    : 0
            };
        }
    }
}