namespace ChatScroll.Core.Entities;

public class QuestionHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public Guid? MatchedNoteId { get; set; }
    public DateTime AskedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public Note? MatchedNote { get; set; }
}
