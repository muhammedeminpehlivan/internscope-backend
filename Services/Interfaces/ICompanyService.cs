using InternScope.DTOs;
using InternScope.Entities;

namespace InternScope.Services;

public interface ICompanyService
{
    Task<Company> GetOrCreateCompanyAsync(string companyName);
    Task<List<CompanySuggestionOutputModel>> SearchAsync(string query);
    Task<List<CompanyListOutputModel>> GetAllAsync();
    Task<CompanyDetailOutputModel?> GetBySlugAsync(string slug);
}
