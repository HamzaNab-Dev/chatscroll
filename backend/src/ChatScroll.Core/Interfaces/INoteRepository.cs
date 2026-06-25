using ChatScroll.Core.Entities;

namespace ChatScroll.Core.Interfaces;

public interface INoteRepository
{
    Task<IEnumerable<Note>> GetByFolderIdAsync(Guid folderId, Guid userId);
    Task<Note?> GetByIdAsync(Guid id, Guid userId);
    Task<Note?> GetByIdPublicAsync(Guid id);
    Task<IEnumerable<Note>> SearchAsync(Guid userId, string query);
    Task<IEnumerable<Note>> SearchExactAsync(Guid userId, string query);
    Task<IEnumerable<Note>> GetRecentAsync(Guid userId, int limit);
    Task<IEnumerable<Note>> GetAllAsync(Guid userId);
    Task<Note> CreateAsync(Note note);
    Task<Note> UpdateAsync(Note note);
    Task DeleteAsync(Guid id, Guid userId);
    Task IncrementViewCountAsync(Guid id, Guid userId);
    Task<IEnumerable<Note>> GetRelatedAsync(Guid noteId, Guid userId, IReadOnlyCollection<Guid> allowedFolderIds, int limit = 3);
    Task<(int success, int failed, int total)> BackfillEmbeddingsAsync();
}
