namespace InternScope.DTOs
{
    public class UniversityStatOutputModel
    {
        public string UniversityName { get; set; }
        public int ReviewCount { get; set; }
        public double AverageScore { get; set; }
    }

    public class DepartmentStatOutputModel
    {
        public string DepartmentName { get; set; }
        public int ReviewCount { get; set; }
        public double AverageScore { get; set; }
    }

    public class OverallStatOutputModel
    {
        public int TotalApprovedReviews { get; set; }
        public int TotalCompanies { get; set; }
        public int TotalUniversities { get; set; }
        public double OverallAverageScore { get; set; }
    }
}