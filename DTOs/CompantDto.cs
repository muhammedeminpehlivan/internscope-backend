using InternScope.DTOs.Internship;

namespace InternScope.DTOs
{
    // Keşfet ekranı — grid liste
    public class CompanyListOutputModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
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
        public string Name { get; set; }
        public string Slug { get; set; }
        public double AverageScore { get; set; }
        public int ReviewCount { get; set; }
        public CategoryAverages CategoryAverages { get; set; }
        public List<InternshipOutputModel> Reviews { get; set; }
    }
}