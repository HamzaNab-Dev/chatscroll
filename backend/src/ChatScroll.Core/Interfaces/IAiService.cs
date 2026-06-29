namespace ChatScroll.Core.Interfaces;

public interface IAiService
{
    Task<string> ChatAsync(string message, string conversationHistory, CancellationToken cancellationToken = default);
    Task<FolderSuggestion> SuggestFolderAsync(string question, string answer, IEnumerable<string> existingFolders);
    Task<string> RewriteAsNoteAsync(string question, string answer);
    Task<(bool IsKnown, string? MatchingTitle)> IsAlreadyKnownAsync(string question, IEnumerable<string> existingNoteTitles);
    Task<float[]> GenerateEmbeddingAsync(string text, string taskType = "RETRIEVAL_DOCUMENT");
}

public record FolderSuggestion(
    string SuggestedPath,
    string SuggestedName,
    string Reasoning,
    bool IsNewFolder
);
