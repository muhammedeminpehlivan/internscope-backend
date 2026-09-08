using InternScope.DTOs;

namespace InternScope.Services;

public interface IStatisticsService
{
    Task<List<UniversityStatOutputModel>> GetUniversityStatsAsync();
    Task<List<DepartmentStatOutputModel>> GetDepartmentStatsAsync();
    Task<OverallStatOutputModel> GetOverallAsync();
    Task<List<ApplicationMethodStatOutputModel>> GetApplicationMethodStatsAsync();
}
