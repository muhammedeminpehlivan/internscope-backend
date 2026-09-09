using InternScope.Common;
using InternScope.DTOs.Comment;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services;

public class ReactionService : IReactionService
{
    private readonly AppDbContext _context;

    public ReactionService(AppDbContext context)
    {
        _context = context;
    }

    // Aynı tepkiye tekrar basarsa kaldırır (toggle), farklı tepkiye basarsa değiştirir
    public async Task<Result<ReactionSummaryModel>> UpsertReactionAsync(Guid userId, Guid commentId, bool isPositive)
    {
        var commentExists = await _context.InternshipComments
            .AnyAsync(c => c.Id == commentId && !c.IsDeleted);
        if (!commentExists)
            return Error.NotFound("Yorum bulunamadı.");

        var existing = await _context.CommentReactions
            .FirstOrDefaultAsync(r => r.CommentId == commentId && r.UserId == userId);

        if (existing != null)
        {
            if (existing.IsPositive == isPositive)
                _context.CommentReactions.Remove(existing); // toggle: aynıysa kaldır
            else
                existing.IsPositive = isPositive; // farklıysa değiştir
        }
        else
        {
            _context.CommentReactions.Add(new CommentReaction
            {
                Id = Guid.NewGuid(),
                CommentId = commentId,
                UserId = userId,
                IsPositive = isPositive,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return await GetSummaryAsync(commentId, userId);
    }

    public async Task<ReactionSummaryModel> GetSummaryAsync(Guid commentId, Guid? userId)
    {
        var reactions = await _context.CommentReactions
            .Where(r => r.CommentId == commentId)
            .ToListAsync();

        return new ReactionSummaryModel
        {
            Upvotes = reactions.Count(r => r.IsPositive),
            Downvotes = reactions.Count(r => !r.IsPositive),
            UserReaction = userId.HasValue
                ? reactions.FirstOrDefault(r => r.UserId == userId.Value)?.IsPositive
                : null
        };
    }
}
