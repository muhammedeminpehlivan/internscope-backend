using InternScope.Common;
using InternScope.DTOs.Comment;
using InternScope.Entities;
using Microsoft.EntityFrameworkCore;

namespace InternScope.Services
{
    public class ReactionService
    {
        private readonly AppDbContext _context;

        public ReactionService(AppDbContext context)
        {
            _context = context;
        }

        // Aynı tepkiye tekrar basarsa kaldırır (toggle), farklı tepkiye basarsa değiştirir
        public async Task<Result<ReactionSummaryModel>> UpsertReactionAsync(Guid userId, Guid internshipId, bool isPositive)
        {
            var internshipExists = await _context.Internships
                .AnyAsync(i => i.Id == internshipId && i.Status == InternshipStatus.Approved);
            if (!internshipExists)
                return Error.NotFound("Staj bulunamadı.");

            var existing = await _context.InternshipReactions
                .FirstOrDefaultAsync(r => r.InternshipId == internshipId && r.UserId == userId);

            if (existing != null)
            {
                if (existing.IsPositive == isPositive)
                    _context.InternshipReactions.Remove(existing); // toggle: aynıysa kaldır
                else
                    existing.IsPositive = isPositive; // farklıysa değiştir
            }
            else
            {
                _context.InternshipReactions.Add(new InternshipReaction
                {
                    Id = Guid.NewGuid(),
                    InternshipId = internshipId,
                    UserId = userId,
                    IsPositive = isPositive,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return await GetSummaryAsync(internshipId, userId);
        }

        public async Task<ReactionSummaryModel> GetSummaryAsync(Guid internshipId, Guid? userId)
        {
            var reactions = await _context.InternshipReactions
                .Where(r => r.InternshipId == internshipId)
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
}
