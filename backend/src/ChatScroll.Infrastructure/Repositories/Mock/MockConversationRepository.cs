using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;

namespace ChatScroll.Infrastructure.Repositories.Mock;

public class MockConversationRepository : IConversationRepository
{
    private static readonly List<Conversation> _conversations = new();

    public Task<IEnumerable<Conversation>> GetByUserIdAsync(Guid userId) =>
        Task.FromResult(_conversations.Where(c => c.UserId == userId));

    public Task<Conversation?> GetByIdAsync(Guid id, Guid userId) =>
        Task.FromResult(_conversations.FirstOrDefault(c => c.Id == id && c.UserId == userId));

    public Task<Conversation> CreateAsync(Conversation conversation)
    {
        conversation.Id = Guid.NewGuid();
        conversation.CreatedAt = DateTime.UtcNow;
        conversation.UpdatedAt = DateTime.UtcNow;
        _conversations.Add(conversation);
        return Task.FromResult(conversation);
    }

    public Task<Conversation> UpdateAsync(Conversation conversation)
    {
        var existing = _conversations.FirstOrDefault(c => c.Id == conversation.Id);
        if (existing != null)
        {
            existing.Title = conversation.Title;
            existing.MessageCount = conversation.MessageCount;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        return Task.FromResult(conversation);
    }
}
