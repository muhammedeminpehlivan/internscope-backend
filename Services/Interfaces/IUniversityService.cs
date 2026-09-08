using InternScope.DTOs;

namespace InternScope.Services;

public interface IUniversityService
{
    Task<List<UniversityOutputModel>> GetAllAsync();
}
