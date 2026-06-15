namespace ChatScroll.Core.Entities;

public class Folder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty; // ltree path e.g. "programming.dotnet"
    public string? Icon { get; set; } // emoji
    public string? Color { get; set; } // hex color
    public Guid? ParentId { get; set; }
    public int NoteCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Folder? Parent { get; set; }
    public ICollection<Folder> Children { get; set; } = new List<Folder>();
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
