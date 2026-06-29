using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;

namespace ChatScroll.Infrastructure.Repositories.Mock;

public class MockFolderRepository : IFolderRepository
{
    internal static readonly List<Folder> _folders = new()
    {
        new Folder
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "Programming",
            Path = "programming",
            Icon = "💻",
            Color = "#3B82F6",
            NoteCount = 0
        },
        new Folder
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = ".NET",
            Path = "programming.dotnet",
            Icon = "🔷",
            Color = "#8B5CF6",
            ParentId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            NoteCount = 0
        },
        new Folder
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "Medicine",
            Path = "medicine",
            Icon = "🏥",
            Color = "#10B981",
            NoteCount = 0
        }
    };

    public Task<IEnumerable<Folder>> GetByUserIdAsync(Guid userId)
    {
        var result = _folders.Where(f => f.UserId == userId).ToList();
        // Each folder gets its own direct note count only — the frontend aggregates for display
        foreach (var folder in result)
            folder.NoteCount = MockNoteRepository._notes.Count(n => n.FolderId == folder.Id && n.UserId == userId);
        return Task.FromResult(result.AsEnumerable());
    }

    public Task<Folder?> GetByIdAsync(Guid id, Guid userId) =>
        Task.FromResult(_folders.FirstOrDefault(f => f.Id == id && f.UserId == userId));

    public Task<Folder> CreateAsync(Folder folder)
    {
        folder.Id = Guid.NewGuid();
        folder.CreatedAt = DateTime.UtcNow;
        folder.UpdatedAt = DateTime.UtcNow;
        _folders.Add(folder);
        return Task.FromResult(folder);
    }

    public Task<Folder> UpdateAsync(Folder folder)
    {
        var existing = _folders.FirstOrDefault(f => f.Id == folder.Id);
        if (existing != null)
        {
            existing.Name = folder.Name;
            existing.Icon = folder.Icon;
            existing.Color = folder.Color;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        return Task.FromResult(folder);
    }

    public Task DeleteAsync(Guid id, Guid userId)
    {
        var folder = _folders.FirstOrDefault(f => f.Id == id && f.UserId == userId);
        if (folder != null) _folders.Remove(folder);
        return Task.CompletedTask;
    }

    public Task<bool> HasChildrenAsync(Guid id, Guid userId) =>
        Task.FromResult(_folders.Any(f => f.ParentId == id && f.UserId == userId));
}
