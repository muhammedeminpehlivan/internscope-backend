using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.DTOs;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

public class UniversityService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public UniversityService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<UniversityOutputModel>> GetAllAsync()
    {
        return await _context.Universities
            .OrderBy(u => u.Name)
            .ProjectTo<UniversityOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }
}
