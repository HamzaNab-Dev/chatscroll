using ChatScroll.Core.Entities;

namespace ChatScroll.Core.Interfaces;

public interface IConversationRepository
{
    Task<IEnumerable<Conversation>> GetByUserIdAsync(Guid userId);
    Task<Conversation?> GetByIdAsync(Guid id, Guid userId);
    Task<Conversation> CreateAsync(Conversation conversation);
    Task<Conversation> UpdateAsync(Conversation conversation);
    Task DeleteAsync(Guid id, Guid userId);
}
