namespace ChatScroll.Core.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CognitoSub { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Plan { get; set; } = "free"; // free, pro, business
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Folder> Folders { get; set; } = new List<Folder>();
    public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
