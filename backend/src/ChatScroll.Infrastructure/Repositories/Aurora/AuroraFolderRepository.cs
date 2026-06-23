using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using ChatScroll.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatScroll.Infrastructure.Repositories.Aurora;

public class AuroraFolderRepository : IFolderRepository
{
    private readonly ChatScrollDbContext _db;

    public AuroraFolderRepository(ChatScrollDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Folder>> GetByUserIdAsync(Guid userId)
    {
        var folders = await _db.Folders
            .Where(f => f.UserId == userId)
            .AsNoTracking()
            .OrderBy(f => f.Path)
            .ToListAsync();

        // Compute NoteCount from the notes table rather than maintaining the denormalised column
        var noteCounts = await _db.Notes
            .Where(n => n.UserId == userId)
            .GroupBy(n => n.FolderId)
            .Select(g => new { FolderId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.FolderId, x => x.Count);

        foreach (var folder in folders)
            folder.NoteCount = noteCounts.GetValueOrDefault(folder.Id, 0);

        return folders;
    }

    public async Task<Folder?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Folders
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
    }

    public async Task<Folder> CreateAsync(Folder folder)
    {
        await _db.EnsureUserExistsAsync(folder.UserId);

        folder.Id = Guid.NewGuid();
        folder.CreatedAt = DateTime.UtcNow;
        folder.UpdatedAt = DateTime.UtcNow;
        folder.NoteCount = 0;

        if (folder.ParentId.HasValue)
        {
            var parent = await _db.Folders.FindAsync(folder.ParentId.Value);
            folder.Path = parent != null
                ? $"{parent.Path}.{Slugify(folder.Name)}"
                : Slugify(folder.Name);
        }
        else
        {
            folder.Path = Slugify(folder.Name);
        }

        _db.Folders.Add(folder);
        await _db.SaveChangesAsync();
        return folder;
    }

    public async Task<Folder> UpdateAsync(Folder folder)
    {
        folder.UpdatedAt = DateTime.UtcNow;
        _db.Folders.Update(folder);
        await _db.SaveChangesAsync();
        return folder;
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var folder = await _db.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);
        if (folder is null) return;

        _db.Folders.Remove(folder);
        await _db.SaveChangesAsync();
    }

    private static string Slugify(string name) =>
        name.ToLowerInvariant()
            .Replace(" ", "_")
            .Replace("-", "_")
            .Replace(".", "_");
}
