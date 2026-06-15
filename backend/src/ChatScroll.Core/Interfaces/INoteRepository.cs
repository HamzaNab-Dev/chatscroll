using ChatScroll.Core.Entities;

namespace ChatScroll.Core.Interfaces;

public interface INoteRepository
{
    Task<IEnumerable<Note>> GetByFolderIdAsync(Guid folderId, Guid userId);
    Task<Note?> GetByIdAsync(Guid id, Guid userId);
    Task<IEnumerable<Note>> SearchAsync(Guid userId, string query);
    Task<Note> CreateAsync(Note note);
    Task<Note> UpdateAsync(Note note);
    Task DeleteAsync(Guid id, Guid userId);
}
