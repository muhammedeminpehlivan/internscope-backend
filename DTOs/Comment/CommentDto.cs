using InternScope.Entities;

namespace InternScope.DTOs.Comment
{
    public class CommentInputModel
    {
        public required string Content { get; set; }
    }

    public class CommentOutputModel
    {
        public Guid Id { get; set; }
        public Guid? ParentCommentId { get; set; } // cevapsa bağlı olduğu ana yorum
        public string Content { get; set; } = null!;
        public string AuthorName { get; set; } = null!;
        public string? AuthorProfilePictureUrl { get; set; }
        public string? AuthorLinkedInProfileUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsOwn { get; set; }
        public bool IsEdited { get; set; } // yorum düzenlendiyse true → frontend "(düzenlendi)" gösterebilir
        public bool IsHidden { get; set; } // şikayetler nedeniyle gizli; sadece yorum sahibi görür ("incelemede")
        public bool HasReported { get; set; } // giriş yapan kullanıcı bu yorumu şikayet etti mi (buton pasif olsun)
        public int Upvotes { get; set; }
        public int Downvotes { get; set; }
        public bool? UserReaction { get; set; } // null=yok, true=like, false=dislike
        public List<CommentOutputModel> Replies { get; set; } = []; // sadece ana yorumlarda dolu (tek seviye)
    }

    public class ReportInputModel
    {
        public ReportReason Reason { get; set; } = ReportReason.Other;
        public string? Note { get; set; }
    }

    public class ReactionInputModel
    {
        public bool IsPositive { get; set; }
    }

    public class ReactionSummaryModel
    {
        public int Upvotes { get; set; }
        public int Downvotes { get; set; }
        public bool? UserReaction { get; set; } // null=yok, true=upvote, false=downvote
    }

    public class ReportedCommentOutputModel
    {
        public Guid CommentId { get; set; }
        public Guid InternshipId { get; set; }
        public string CompanyName { get; set; } = null!;
        public string CompanyDepartment { get; set; } = null!;
        public string Content { get; set; } = null!;
        public DateTime CommentCreatedAt { get; set; }
        public string AuthorName { get; set; } = null!;
        public string AuthorEmail { get; set; } = null!;
        public bool IsHidden { get; set; } // eşik aşıldığı için otomatik gizlenmiş
        // Cevapsa: hangi yoruma yazıldığı (bağlam için)
        public Guid? ParentCommentId { get; set; }
        public string? ParentContent { get; set; }
        public string? ParentAuthorName { get; set; }
        public int ReportCount { get; set; }
        public DateTime FirstReportedAt { get; set; }
        public List<ReportReasonCountModel> Reasons { get; set; } = [];
        public List<string> Notes { get; set; } = []; // kullanıcıların yazdığı açıklamalar (en yeni önce)
    }

    public class ReportReasonCountModel
    {
        public ReportReason Reason { get; set; }
        public int Count { get; set; }
    }
}
