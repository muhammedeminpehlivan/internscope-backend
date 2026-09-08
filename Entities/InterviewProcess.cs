namespace InternScope.Entities;

public class InterviewProcess : BaseEntity
{
    public Guid InternshipId { get; set; }
    public ApplicationMethod ApplicationMethod { get; set; }
    public int StageCount { get; set; }
    public string? Description { get; set; }

    public Internship Internship { get; set; } = null!;
}

public enum ApplicationMethod
{
    KariyerKapisi,    // Kariyer Kapısı (Ulusal Staj Programı)
    Iskur,            // İŞKUR
    LinkedIn,
    KariyerNet,       // Kariyer.net
    Youthall,
    ToptalentCo,      // toptalent.co
    IndeedTurkiye,    // Indeed Türkiye
    CompanyWebsite,   // Şirketin kendi web sitesi
    Reference,        // Referans / tanıdık
    InternshipFair,   // Staj fuarı
    Other             // Diğer
}
