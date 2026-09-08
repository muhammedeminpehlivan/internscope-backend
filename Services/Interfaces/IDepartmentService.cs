using InternScope.DTOs;
using InternScope.Entities;

namespace InternScope.Services;

public interface IDepartmentService
{
    Task<List<DepartmentOutputModel>> GetAllAsync();
    Task<Department> GetOrCreateByNameAsync(string name);
}
