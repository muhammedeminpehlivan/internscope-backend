using AutoMapper;
using AutoMapper.QueryableExtensions;
using InternScope.Common;
using InternScope.DTOs.Comment;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

public class CommentService : ICommentService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IContentFilter _contentFilter;
    private readonly INotificationService _notificationService;

    // Aynı kullanıcının aynı yere aynı metni bu süre içinde tekrar göndermesi spam sayılır
    private static readonly TimeSpan DuplicateWindow = TimeSpan.FromMinutes(10);

    // Bu kadar farklı kişiden açık şikayet alan yorum, admin bakana kadar otomatik gizlenir
    private const int AutoHideReportThreshold = 5;

    public CommentService(AppDbContext context, IMapper mapper, IContentFilter contentFilter,
        INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _contentFilter = contentFilter;
        _notificationService = notificationService;
    }

    public async Task<Result<CommentOutputModel>> AddCommentAsync(Guid userId, Guid internshipId, string content)
    {
        var internshipExists = await _context.Internships
            .AnyAsync(i => i.Id == internshipId && i.Status == InternshipStatus.Approved);
        if (!internshipExists)
            return Error.NotFound("Staj bulunamadı.");

        return await CreateCommentAsync(userId, internshipId, null, content);
    }

    public async Task<Result<CommentOutputModel>> AddReplyAsync(Guid userId, Guid internshipId, Guid parentCommentId, string content)
    {
        var parent = await _context.InternshipComments
            .FirstOrDefaultAsync(c => c.Id == parentCommentId && c.InternshipId == internshipId && !c.IsDeleted && !c.IsHidden);
        if (parent == null)
            return Error.NotFound("Cevap verilecek yorum bulunamadı.");

        // Tek seviye: bir cevaba cevap verilirse ana yoruma bağlanır
        var rootId = parent.ParentCommentId ?? parent.Id;

        return await CreateCommentAsync(userId, internshipId, rootId, content);
    }

    // Yorum ve cevap için ortak kayıt: içerik filtresi + tekrar (spam) kontrolü
    private async Task<Result<CommentOutputModel>> CreateCommentAsync(Guid userId, Guid internshipId, Guid? parentCommentId, string content)
    {
        var cleanContent = _contentFilter.Sanitize(content, removeLinks: true);

        var since = DateTime.UtcNow - DuplicateWindow;
        var isDuplicate = await _context.InternshipComments.AnyAsync(c =>
            c.UserId == userId &&
            c.InternshipId == internshipId &&
            c.ParentCommentId == parentCommentId &&
            c.Content == cleanContent &&
            !c.IsDeleted &&
            c.CreatedAt > since);
        if (isDuplicate)
            return Error.Conflict("Bu yorumu kısa süre önce zaten gönderdiniz.");

        var comment = new InternshipComment
        {
            Id = Guid.NewGuid(),
            InternshipId = internshipId,
            UserId = userId,
            ParentCommentId = parentCommentId,
            Content = cleanContent,
            CreatedAt = DateTime.UtcNow
        };

        _context.InternshipComments.Add(comment);
        await _context.SaveChangesAsync();

        // Mapping için User navigation'ını yükle
        await _context.Entry(comment).Reference(c => c.User).LoadAsync();
        comment.Reports = [];
        comment.Reactions = [];

        var output = _mapper.Map<CommentOutputModel>(comment);
        output.IsOwn = true;
        return output;
    }

    public async Task<List<CommentOutputModel>> GetCommentsAsync(Guid internshipId, Guid? requestingUserId)
    {
        // Gizlenen (şikayet eşiğini aşan) yorumları sadece sahibi görür, IsHidden=true ile
        var viewerId = requestingUserId ?? Guid.Empty;
        var all = await _context.InternshipComments
            .Where(c => c.InternshipId == internshipId && !c.IsDeleted && (!c.IsHidden || c.UserId == viewerId))
            .OrderBy(c => c.CreatedAt)
            .ProjectTo<CommentOutputModel>(_mapper.ConfigurationProvider, new { requestingUserId = requestingUserId ?? Guid.Empty })
            .ToListAsync();

        // Ana yorumlar + altlarında cevapları. Ana yorumu silinmiş/gizlenmiş cevaplar gösterilmez.
        var roots = all.Where(c => c.ParentCommentId == null).ToList();
        var rootsById = roots.ToDictionary(c => c.Id);
        foreach (var reply in all.Where(c => c.ParentCommentId != null))
        {
            if (rootsById.TryGetValue(reply.ParentCommentId!.Value, out var root))
                root.Replies.Add(reply);
        }

        return roots;
    }

    public async Task<Result<CommentOutputModel>> UpdateCommentAsync(Guid userId, Guid commentId, string content)
    {
        var comment = await _context.InternshipComments.FindAsync(commentId);
        if (comment == null || comment.IsDeleted)
            return Error.NotFound("Yorum bulunamadı.");
        if (comment.UserId != userId)
            return Error.Forbidden("Bu yorumu düzenleme yetkiniz yok.");

        comment.Content = _contentFilter.Sanitize(content, removeLinks: true);
        comment.UpdatedAt = DateTime.UtcNow; // IsEdited çıktısı buna göre hesaplanır
        await _context.SaveChangesAsync();

        // Güncel çıktıyı (reaksiyon sayıları + IsOwn + IsEdited) projeksiyonla döndür
        return await _context.InternshipComments
            .Where(c => c.Id == commentId)
            .ProjectTo<CommentOutputModel>(_mapper.ConfigurationProvider, new { requestingUserId = userId })
            .FirstAsync();
    }

    public async Task<Result> DeleteCommentAsync(Guid userId, Guid commentId)
    {
        var comment = await _context.InternshipComments.FindAsync(commentId);
        if (comment == null || comment.IsDeleted)
            return Error.NotFound("Yorum bulunamadı.");
        if (comment.UserId != userId)
            return Error.Forbidden("Bu yorumu silme yetkiniz yok.");

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> ReportCommentAsync(Guid reportedByUserId, Guid commentId, ReportReason reason, string? note)
    {
        var comment = await _context.InternshipComments.FindAsync(commentId);
        if (comment == null || comment.IsDeleted)
            return Error.NotFound("Yorum bulunamadı.");
        if (comment.UserId == reportedByUserId)
            return Error.Validation("Kendi yorumunuzu şikayet edemezsiniz.");

        var alreadyReported = await _context.CommentReports
            .AnyAsync(r => r.CommentId == commentId && r.ReportedByUserId == reportedByUserId);
        if (alreadyReported)
            return Error.Conflict("Bu yorumu zaten şikayet ettiniz.");

        var openReportsBefore = await _context.CommentReports
            .CountAsync(r => r.CommentId == commentId && !r.IsReviewed);

        _context.CommentReports.Add(new CommentReport
        {
            Id = Guid.NewGuid(),
            CommentId = commentId,
            ReportedByUserId = reportedByUserId,
            Reason = reason,
            Note = string.IsNullOrWhiteSpace(note) ? null : _contentFilter.Sanitize(note),
            CreatedAt = DateTime.UtcNow
        });

        var companyName = await GetCompanyNameAsync(comment.InternshipId);

        // Admin'lere her şikayette değil, yorum ilk kez şikayet listesine düştüğünde haber ver
        if (openReportsBefore == 0)
            await _notificationService.NotifyAdminsAsync(NotificationType.CommentReported,
                $"{companyName} stajındaki bir yorum şikayet edildi: \"{Snippet(comment.Content)}\"",
                comment.InternshipId, comment.Id);

        // Eşik aşıldı: admin bakana kadar gizle. UpdatedAt'e dokunmuyoruz, yoksa "(düzenlendi)" görünür.
        if (!comment.IsHidden && openReportsBefore + 1 >= AutoHideReportThreshold)
        {
            comment.IsHidden = true;

            _notificationService.Notify(comment.UserId, NotificationType.CommentHidden,
                $"{companyName} stajındaki yorumunuz çok sayıda şikayet aldığı için incelemeye alındı ve geçici olarak gizlendi.",
                comment.InternshipId, comment.Id);
            await _notificationService.NotifyAdminsAsync(NotificationType.CommentAutoHidden,
                $"{companyName} stajındaki bir yorum {AutoHideReportThreshold} şikayete ulaştı ve otomatik gizlendi: \"{Snippet(comment.Content)}\"",
                comment.InternshipId, comment.Id);
        }

        await _context.SaveChangesAsync();
        return Result.Success();
    }

    // Admin: şikayet edilen yorumları getir (bağlam + sebepler ile)
    public async Task<List<ReportedCommentOutputModel>> GetReportedCommentsAsync()
    {
        var comments = await _context.InternshipComments
            .Where(c => !c.IsDeleted && c.Reports.Any(r => !r.IsReviewed))
            .Select(c => new ReportedCommentOutputModel
            {
                CommentId = c.Id,
                InternshipId = c.InternshipId,
                CompanyName = c.Internship.Company.Name,
                CompanyDepartment = c.Internship.CompanyDepartment,
                Content = c.Content,
                CommentCreatedAt = c.CreatedAt,
                AuthorName = c.User.FullName,
                AuthorEmail = c.User.Email,
                IsHidden = c.IsHidden,
                ParentCommentId = c.ParentCommentId,
                ParentContent = c.ParentComment != null ? c.ParentComment.Content : null,
                ParentAuthorName = c.ParentComment != null ? c.ParentComment.User.FullName : null,
                ReportCount = c.Reports.Count(r => !r.IsReviewed),
                FirstReportedAt = c.Reports.Where(r => !r.IsReviewed).Min(r => r.CreatedAt)
            })
            .OrderByDescending(c => c.IsHidden) // otomatik gizlenenler önce: acil
            .ThenByDescending(c => c.ReportCount)
            .ToListAsync();

        // Sebep dağılımı ve notlar ayrı sorguda: alt sorguda GroupBy her zaman SQL'e çevrilemiyor
        var commentIds = comments.Select(c => c.CommentId).ToList();
        var reports = await _context.CommentReports
            .Where(r => commentIds.Contains(r.CommentId) && !r.IsReviewed)
            .Select(r => new { r.CommentId, r.Reason, r.Note, r.CreatedAt })
            .ToListAsync();
        var reportsByComment = reports.ToLookup(r => r.CommentId);

        foreach (var c in comments)
        {
            var commentReports = reportsByComment[c.CommentId].ToList();
            c.Reasons = commentReports
                .GroupBy(r => r.Reason)
                .Select(g => new ReportReasonCountModel { Reason = g.Key, Count = g.Count() })
                .OrderByDescending(r => r.Count)
                .ToList();
            c.Notes = commentReports
                .Where(r => r.Note != null)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => r.Note!)
                .ToList();
        }

        return comments;
    }

    // Admin: yorumu sil — açık şikayetler kapanır, yorum sahibine bildirim gider
    public async Task<Result> AdminDeleteCommentAsync(Guid commentId)
    {
        var comment = await _context.InternshipComments.FindAsync(commentId);
        if (comment == null || comment.IsDeleted)
            return Error.NotFound("Yorum bulunamadı.");

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;
        await CloseOpenReportsAsync(commentId);

        var companyName = await GetCompanyNameAsync(comment.InternshipId);
        _notificationService.Notify(comment.UserId, NotificationType.CommentRemoved,
            $"{companyName} stajındaki \"{Snippet(comment.Content)}\" yorumunuz topluluk kurallarına aykırı bulunduğu için kaldırıldı.",
            comment.InternshipId, comment.Id);

        await _context.SaveChangesAsync();
        return Result.Success();
    }

    // Admin: şikayeti reddet (yorum kalır, şikayet kapatılır, otomatik gizlendiyse tekrar görünür)
    public async Task<Result> AdminDismissReportsAsync(Guid commentId)
    {
        var comment = await _context.InternshipComments.FindAsync(commentId);
        if (comment == null || comment.IsDeleted)
            return Error.NotFound("Yorum bulunamadı.");

        comment.IsHidden = false;
        await CloseOpenReportsAsync(commentId);
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    private async Task CloseOpenReportsAsync(Guid commentId)
    {
        var reports = await _context.CommentReports
            .Where(r => r.CommentId == commentId && !r.IsReviewed)
            .ToListAsync();

        foreach (var r in reports)
        {
            r.IsReviewed = true;
            r.UpdatedAt = DateTime.UtcNow;
        }
    }

    private async Task<string> GetCompanyNameAsync(Guid internshipId)
        => await _context.Internships
            .Where(i => i.Id == internshipId)
            .Select(i => i.Company.Name)
            .FirstOrDefaultAsync() ?? "Bir";

    // Bildirim metinleri için yorumun kısa hali
    private static string Snippet(string content, int maxLength = 60)
        => content.Length <= maxLength ? content : content[..maxLength].TrimEnd() + "…";
}
