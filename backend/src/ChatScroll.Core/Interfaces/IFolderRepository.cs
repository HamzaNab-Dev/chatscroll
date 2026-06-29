using ChatScroll.Core.Entities;

namespace ChatScroll.Core.Interfaces;

public interface IFolderRepository
{
    Task<IEnumerable<Folder>> GetByUserIdAsync(Guid userId);
    Task<Folder?> GetByIdAsync(Guid id, Guid userId);
    Task<Folder> CreateAsync(Folder folder);
    Task<Folder> UpdateAsync(Folder folder);
    Task DeleteAsync(Guid id, Guid userId);
    Task<bool> HasChildrenAsync(Guid id, Guid userId);
}
