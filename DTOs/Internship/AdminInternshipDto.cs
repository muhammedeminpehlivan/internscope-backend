using InternScope.Entities;

namespace InternScope.DTOs.Internship;

public class AdminInternshipOutputModel
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = null!;
    public string UniversityName { get; set; } = null!;
    public string DepartmentName { get; set; } = null!;
    public string RealAuthorName { get; set; } = null!;
    public string AuthorEmail { get; set; } = null!;
    public bool IsAnonymous { get; set; }
    public bool IsSgkVerified { get; set; }
    public string Status { get; set; } = null!;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public ScoreOutputModel Scores { get; set; } = null!;
    public InterviewOutputModel Interview { get; set; } = null!;
    public string? SgkDocumentUrl { get; set; }
    public string? SgkVerificationCode { get; set; }
    public bool HasPendingChanges { get; set; }
    public StudentYear StudentYear { get; set; }
    public string Term { get; set; } = null!;
    public int? StipendMin { get; set; }
    public int? StipendMax { get; set; }
    public string Currency { get; set; } = null!;
    public bool ReturnOfferReceived { get; set; }
}

public class PendingChangeReviewModel
{
    public AdminInternshipOutputModel Current { get; set; } = null!;
    public InternshipInputModel? Proposed { get; set; }
    // Yalnızca gerçekten değişen alanlar; admin "şu alan X'ten Y'ye değişmiş"
    // şeklinde görebilsin diye eski/yeni değerler isimlere çözülmüş hâlde gelir.
    public List<PendingFieldChange> Changes { get; set; } = new();
}

// Bekleyen bir düzenlemede tek bir alanın eski ve yeni değeri.
public class PendingFieldChange
{
    public string Field { get; set; } = null!;   // teknik alan adı (frontend anahtarı)
    public string Label { get; set; } = null!;    // kullanıcıya gösterilecek Türkçe etiket
    public string? OldValue { get; set; }         // mevcut (yayındaki) değer
    public string? NewValue { get; set; }         // önerilen yeni değer
}

// Red endpoint'i opsiyonel gövde alır: { "reason": "..." } ya da boş.
public class RejectInputModel
{
    public string? Reason { get; set; }
}
