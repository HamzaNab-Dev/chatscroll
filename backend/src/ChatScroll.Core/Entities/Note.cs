namespace ChatScroll.Core.Entities;

public class Note
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid FolderId { get; set; }
    public Guid? ConversationId { get; set; }

    // Content
    public string Title { get; set; } = string.Empty;
    public string? OriginalQuestion { get; set; }
    public string? OriginalAnswer { get; set; }
    public string CleanContent { get; set; } = string.Empty;

    // Search & metadata
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string? CodeLanguage { get; set; }

    // Stats
    public int ViewCount { get; set; } = 0;
    public DateTime? LastViewedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Folder Folder { get; set; } = null!;
    public Conversation? Conversation { get; set; }
}


