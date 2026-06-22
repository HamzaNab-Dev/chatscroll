using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using ChatScroll.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatScroll.Infrastructure.Repositories.Aurora;

public class AuroraConversationRepository : IConversationRepository
{
    private readonly ChatScrollDbContext _db;

    public AuroraConversationRepository(ChatScrollDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Conversation>> GetByUserIdAsync(Guid userId)
    {
        return await _db.Conversations
            .Where(c => c.UserId == userId)
            .AsNoTracking()
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Conversation?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Conversations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
    }

    public async Task<Conversation> CreateAsync(Conversation conversation)
    {
        if (conversation.Id == Guid.Empty)
            conversation.Id = Guid.NewGuid();
        conversation.CreatedAt = DateTime.UtcNow;
        conversation.UpdatedAt = DateTime.UtcNow;

        _db.Conversations.Add(conversation);
        await _db.SaveChangesAsync();
        return conversation;
    }

    public async Task<Conversation> UpdateAsync(Conversation conversation)
    {
        conversation.UpdatedAt = DateTime.UtcNow;
        _db.Conversations.Update(conversation);
        await _db.SaveChangesAsync();
        return conversation;
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var conv = await _db.Conversations
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (conv is not null)
        {
            _db.Conversations.Remove(conv);
            await _db.SaveChangesAsync();
        }
    }
}
