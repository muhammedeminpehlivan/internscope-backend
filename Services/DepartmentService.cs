using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.DTOs;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

public class DepartmentService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public DepartmentService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<DepartmentOutputModel>> GetAllAsync()
    {
        return await _context.Departments
            .OrderBy(d => d.Name)
            .ProjectTo<DepartmentOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }
    // Name kolonunda ci_collation var — == case-insensitive.
    public async Task<Department> GetOrCreateByNameAsync(string name)
    {
        var normalized = name.Trim();
        var existing = await _context.Departments
            .FirstOrDefaultAsync(d => d.Name == normalized);
        if (existing != null) return existing;

        var department = new Department
        {
            Id = Guid.NewGuid(),
            Name = normalized,
            CreatedAt = DateTime.UtcNow
        };
        _context.Departments.Add(department);

        try
        {
            await _context.SaveChangesAsync();
            return department;
        }
        catch (DbUpdateException)
        {
            _context.Entry(department).State = EntityState.Detached;
            return await _context.Departments
                .FirstAsync(d => d.Name == normalized);
        }
    }



}
