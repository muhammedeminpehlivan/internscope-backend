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

    public CommentService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<CommentOutputModel>> AddCommentAsync(Guid userId, Guid internshipId, string content)
    {
        var internshipExists = await _context.Internships
            .AnyAsync(i => i.Id == internshipId && i.Status == InternshipStatus.Approved);
        if (!internshipExists)
            return Error.NotFound("Staj bulunamadı.");

        var comment = new InternshipComment
        {
            Id = Guid.NewGuid(),
            InternshipId = internshipId,
            UserId = userId,
            Content = content.Trim(),
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
        var list = await _context.InternshipComments
            .Where(c => c.InternshipId == internshipId && !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .ProjectTo<CommentOutputModel>(_mapper.ConfigurationProvider, new { requestingUserId = requestingUserId ?? Guid.Empty })
            .ToListAsync();

        return list;
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

    public async Task<Result> ReportCommentAsync(Guid reportedByUserId, Guid commentId)
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

        _context.CommentReports.Add(new CommentReport
        {
            Id = Guid.NewGuid(),
            CommentId = commentId,
            ReportedByUserId = reportedByUserId,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    // Admin: şikayet edilen yorumları getir
    public async Task<List<ReportedCommentOutputModel>> GetReportedCommentsAsync()
    {
        return await _context.InternshipComments
            .Where(c => !c.IsDeleted && c.Reports.Any(r => !r.IsReviewed))
            .Select(c => new ReportedCommentOutputModel
            {
                CommentId = c.Id,
                InternshipId = c.InternshipId,
                Content = c.Content,
                AuthorName = c.User.FullName,
                AuthorEmail = c.User.Email,
                ReportCount = c.Reports.Count(r => !r.IsReviewed),
                FirstReportedAt = c.Reports.Min(r => r.CreatedAt)
            })
            .OrderByDescending(c => c.ReportCount)
            .ToListAsync();
    }

    // Admin: yorumu sil
    public async Task<Result> AdminDeleteCommentAsync(Guid commentId)
    {
        var comment = await _context.InternshipComments.FindAsync(commentId);
        if (comment == null || comment.IsDeleted)
            return Error.NotFound("Yorum bulunamadı.");

        comment.IsDeleted = true;
        comment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    // Admin: şikayeti reddet (yorum kalır, şikayet kapatılır)
    public async Task AdminDismissReportsAsync(Guid commentId)
    {
        var reports = await _context.CommentReports
            .Where(r => r.CommentId == commentId && !r.IsReviewed)
            .ToListAsync();

        foreach (var r in reports)
        {
            r.IsReviewed = true;
            r.UpdatedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
    }
}
