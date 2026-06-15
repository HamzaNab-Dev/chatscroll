namespace ChatScroll.Core.Entities;

public class Conversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string? Title { get; set; }
    public string? SuggestedFolder { get; set; }
    public int MessageCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
