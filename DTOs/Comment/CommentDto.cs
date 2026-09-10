namespace InternScope.DTOs.Comment
{
    public class CommentInputModel
    {
        public required string Content { get; set; }
    }

    public class CommentOutputModel
    {
        public Guid Id { get; set; }
        public string Content { get; set; } = null!;
        public string AuthorName { get; set; } = null!;
        public string? AuthorProfilePictureUrl { get; set; }
        public string? AuthorLinkedInProfileUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsOwn { get; set; }
        public bool IsEdited { get; set; } // yorum düzenlendiyse true → frontend "(düzenlendi)" gösterebilir
        public int ReportCount { get; set; }
        public int Upvotes { get; set; }
        public int Downvotes { get; set; }
        public bool? UserReaction { get; set; } // null=yok, true=like, false=dislike
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
        public string Content { get; set; } = null!;
        public string AuthorName { get; set; } = null!;
        public string AuthorEmail { get; set; } = null!;
        public int ReportCount { get; set; }
        public DateTime FirstReportedAt { get; set; }
    }
}
