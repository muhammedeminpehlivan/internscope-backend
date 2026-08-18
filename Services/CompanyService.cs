
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services
{
    public class CompanyService
    {
        private readonly AppDbContext _context;

        public CompanyService(AppDbContext context)
        {
            _context = context;
        }

        // Firma adını alır. Varsa mevcut firmayı döner, yoksa oluşturup döner.
        public async Task<Company> GetOrCreateCompanyAsync(string companyName)
        {
            var normalizedName = companyName.Trim();

            // Aynı isimde firma var mı? (büyük/küçük harf duyarsız)
            var existing = await _context.Companies
                .FirstOrDefaultAsync(c => c.Name.ToLower() == normalizedName.ToLower());

            if (existing != null)
                return existing;

            // Yoksa yeni firma oluştur
            var company = new Company
            {
                Id = Guid.NewGuid(),
                Name = normalizedName,
                Slug = GenerateSlug(normalizedName),
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return company;
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
    }
}