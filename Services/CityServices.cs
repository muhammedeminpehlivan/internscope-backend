using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.DTOs;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services
{
    public class CityService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public CityService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<CityOutputModel>> GetAllAsync()
        {
            return await _context.Cities
                .OrderBy(c => c.Name)
                .ProjectTo<CityOutputModel>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }
    }
}