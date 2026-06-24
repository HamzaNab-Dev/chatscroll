using ChatScroll.Core.Interfaces;

namespace ChatScroll.Infrastructure.Repositories.Mock;

public class MockAiService : IAiService
{
    private static readonly string[] _mockResponses =
    {
        "Great question! Here's a detailed explanation...\n\nThis is a mock AI response for local development. In production, this will be powered by Amazon Bedrock with Claude Sonnet 4.6.\n\nThe real AI will provide accurate, helpful answers and suggest the best folder to save this knowledge.",
        "That's an interesting topic. Let me explain...\n\nThis mock response simulates what Claude via Amazon Bedrock will return. The actual implementation uses pgvector embeddings stored in Aurora PostgreSQL to detect similar questions you've asked before.",
        "Here's what you need to know...\n\nIn the real app, Amazon Bedrock analyzes your question and previous knowledge to give you a personalized answer. It also rewrites the answer as a clean, structured note for your knowledge tree."
    };

    private static readonly Random _random = new();

    public Task<string> ChatAsync(string message, string conversationHistory)
    {
        var response = _mockResponses[_random.Next(_mockResponses.Length)];
        return Task.FromResult(response);
    }

    public Task<FolderSuggestion> SuggestFolderAsync(
        string question,
        string answer,
        IEnumerable<string> existingFolders)
    {
        var q = question.ToLower();
        var suggestion = q.Contains("code") || q.Contains("programming") ||
                         q.Contains(".net") || q.Contains("c#") || q.Contains("linq")
            ? new FolderSuggestion("programming.dotnet", ".NET", "Question is about .NET programming", false)
            : q.Contains("medicine") || q.Contains("drug") || q.Contains("medication")
            ? new FolderSuggestion("medicine", "Medicine", "Question is about medical topics", false)
            : new FolderSuggestion("notes", "Notes", "General knowledge question", true);

        return Task.FromResult(suggestion);
    }

    public Task<string> RewriteAsNoteAsync(string question, string answer)
    {
        var title = question.Length > 50 ? question[..50] + "..." : question;
        var note = $"## {title}\n\n{answer}\n\n---\n*Saved from ChatScroll*";
        return Task.FromResult(note);
    }

    public Task<(bool IsKnown, string? MatchingTitle)> IsAlreadyKnownAsync(string question, IEnumerable<string> existingNoteTitles)
    {
        var prefix = question[..Math.Min(20, question.Length)];
        var match = existingNoteTitles.FirstOrDefault(t =>
            t.Contains(prefix, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult((match is not null, match));
    }

    public Task<float[]> GenerateEmbeddingAsync(string text, string taskType = "RETRIEVAL_DOCUMENT") =>
        Task.FromResult(new float[3072]);
}
