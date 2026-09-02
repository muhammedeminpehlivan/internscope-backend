
using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.DTOs;
using InternScope.DTOs.Internship;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;



namespace InternScope.Services;

public class CompanyService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public CompanyService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    // Firma adını alır. Varsa mevcut firmayı döner, yoksa oluşturup döner.
    // Name kolonunda ci_collation var — == karşılaştırması case-insensitive.
    public async Task<Company> GetOrCreateCompanyAsync(string companyName)
    {
        var normalizedName = companyName.Trim();

        var existing = await _context.Companies
            .FirstOrDefaultAsync(c => c.Name == normalizedName);

        if (existing != null)
            return existing;

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Slug = GenerateSlug(normalizedName),
            CreatedAt = DateTime.UtcNow
        };

        _context.Companies.Add(company);

        try
        {
            await _context.SaveChangesAsync();
            return company;
        }
        catch (DbUpdateException)
        {
            // Race: başka istek aynı anda yazdı → unique index tetiklendi. Yeniden oku.
            _context.Entry(company).State = EntityState.Detached;
            return await _context.Companies
                .FirstAsync(c => c.Name == normalizedName);
        }
    }

    // Staj formu autocomplete — girilen metinle başlayan mevcut firmalar.
    // Name kolonunda ci_collation var → StartsWith case-insensitive çalışır.
    public async Task<List<CompanySuggestionOutputModel>> SearchAsync(string query)
    {
        var q = (query ?? string.Empty).Trim();
        if (q.Length < 2)
            return new List<CompanySuggestionOutputModel>();

        return await _context.Companies
            .Where(c => c.Name.StartsWith(q))
            .OrderBy(c => c.Name)
            .Take(10)
            .Select(c => new CompanySuggestionOutputModel
            {
                Name = c.Name,
                Slug = c.Slug
            })
            .ToListAsync();
    }

    // "Arçelik A.Ş." -> "arcelik-as"
    private string GenerateSlug(string name)
    {
        var slug = name.ToLower().Trim();

        // Türkçe karakterleri çevir
        slug = slug
            .Replace("ç", "c").Replace("ğ", "g").Replace("ı", "i")
            .Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");

        // Harf ve rakam dışındaki her şeyi tireye çevir
        var chars = slug.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray();
        slug = new string(chars);

        // Ardışık tireleri teke indir, baştaki/sondaki tireleri sil
        while (slug.Contains("--"))
            slug = slug.Replace("--", "-");

        return slug.Trim('-');
    }

    // Keşfet — tüm firmalar + ortalama puan + yorum sayısı (sadece onaylı stajlar sayılır)
    public async Task<List<CompanyListOutputModel>> GetAllAsync()
    {
        var data = await _context.Companies
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Slug,
                Scores = c.Internships
                    .Where(i => i.Status == InternshipStatus.Approved && i.Score != null)
                    .Select(i => new
                    {
                        i.Score.LearningScore,
                        i.Score.MentoringScore,
                        i.Score.TechInfraScore,
                        i.Score.WorkEnvironmentScore,
                        i.Score.SalaryScore
                    }).ToList()
            })
            .ToListAsync();

        return data.Select(c => new CompanyListOutputModel
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            ReviewCount = c.Scores.Count,
            AverageScore = c.Scores.Any()
                ? c.Scores.Average(s => (s.LearningScore + s.MentoringScore + s.TechInfraScore
                    + s.WorkEnvironmentScore + s.SalaryScore) / 5.0)
                : 0
        }).ToList();
    }

    // Firma detayı — slug ile, kategori ortalamaları + o firmanın onaylı değerlendirmeleri
    public async Task<CompanyDetailOutputModel?> GetBySlugAsync(string slug)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Slug == slug);
        if (company == null) return null;

        var approvedQuery = _context.Internships
            .Where(i => i.CompanyId == company.Id && i.Status == InternshipStatus.Approved);

        // Değerlendirme listesi (anonimlik korunuyor — InternshipOutputModel)
        var reviews = await approvedQuery
            .OrderByDescending(i => i.CreatedAt)
            .ProjectTo<InternshipOutputModel>(_mapper.ConfigurationProvider)
            .ToListAsync();

        // Kategori ortalamaları için puanları çek
        var scores = await approvedQuery
            .Where(i => i.Score != null)
            .Select(i => i.Score)
            .ToListAsync();

        var averages = new CategoryAverages
        {
            Learning = scores.Any() ? scores.Average(s => s.LearningScore) : 0,
            Mentoring = scores.Any() ? scores.Average(s => s.MentoringScore) : 0,
            TechInfra = scores.Any() ? scores.Average(s => s.TechInfraScore) : 0,
            WorkEnvironment = scores.Any() ? scores.Average(s => s.WorkEnvironmentScore) : 0,
            Salary = scores.Any() ? scores.Average(s => s.SalaryScore) : 0
        };

        var returnOfferCount = await approvedQuery
            .Where(i => i.ReturnOfferReceived)
            .CountAsync();

        // Bu firmada staj yapanların üniversite dağılımı — en çok gönderen ilk 5.
        var universityBreakdown = await approvedQuery
            .GroupBy(i => i.University.Name)
            .Select(g => new UniversityBreakdownOutputModel
            {
                UniversityName = g.Key,
                InternCount = g.Count()
            })
            .OrderByDescending(x => x.InternCount)
            .Take(5)
            .ToListAsync();

        return new CompanyDetailOutputModel
        {
            Id = company.Id,
            Name = company.Name,
            Slug = company.Slug,
            ReviewCount = reviews.Count,
            CategoryAverages = averages,
            ReturnOfferCount = returnOfferCount,
            ReturnOfferRate = reviews.Count > 0
                ? Math.Round((double)returnOfferCount / reviews.Count * 100, 1)
                : 0,
            UniversityBreakdown = universityBreakdown,
            AverageScore = scores.Any()
                ? (averages.Learning + averages.Mentoring + averages.TechInfra
                   + averages.WorkEnvironment + averages.Salary) / 5.0
                : 0,
            Reviews = reviews
        };
    }
}
