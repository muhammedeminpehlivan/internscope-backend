using InternScope.DTOs.Internship;

namespace InternScope.DTOs
{
    // Keşfet ekranı — grid liste
    public class CompanyListOutputModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public double AverageScore { get; set; }
        public int ReviewCount { get; set; }
    }

    // Kategori ortalamaları
    public class CategoryAverages
    {
        public double Learning { get; set; }
        public double Mentoring { get; set; }
        public double TechInfra { get; set; }
        public double WorkEnvironment { get; set; }
        public double Salary { get; set; }
    }

    // Şirket detay sayfası
    public class CompanyDetailOutputModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public double AverageScore { get; set; }
        public int ReviewCount { get; set; }
        public CategoryAverages CategoryAverages { get; set; } = null!;
        public double ReturnOfferRate { get; set; }
        public int ReturnOfferCount { get; set; }
        public List<InternshipOutputModel> Reviews { get; set; } = null!;
    }
}
