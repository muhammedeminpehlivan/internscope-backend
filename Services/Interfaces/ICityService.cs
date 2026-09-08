using InternScope.DTOs;

namespace InternScope.Services;

public interface ICityService
{
    Task<List<CityOutputModel>> GetAllAsync();
}
