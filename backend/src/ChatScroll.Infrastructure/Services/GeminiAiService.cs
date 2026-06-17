using System.Text;
using System.Text.Json;
using ChatScroll.Core.Interfaces;

namespace ChatScroll.Infrastructure.Services;

public class GeminiAiService : IAiService
{
    private readonly HttpClient _httpClient = new();
    private readonly string _apiKey;

    private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public GeminiAiService(string apiKey)
    {
        _apiKey = apiKey;
    }

    public async Task<string> ChatAsync(string message, string conversationHistory)
    {
        try
        {
            var systemPrompt = """
                You are ChatScroll's AI assistant — a knowledgeable, helpful AI that gives clear,
                accurate answers. You help users learn and build their personal knowledge base.

                Guidelines:
                - Give thorough but concise answers
                - Use markdown formatting (headers, code blocks, bullet points)
                - For code questions, always include practical examples
                - Be friendly and encouraging
                """;

            var fullMessage = string.IsNullOrEmpty(conversationHistory)
                ? $"{systemPrompt}\n\n{message}"
                : $"{systemPrompt}\n\nPrevious context:\n{conversationHistory}\n\n{message}";

            return await CallGeminiAsync(fullMessage);
        }
        catch (Exception ex)
        {
            return $"GEMINI_ERROR: {ex.GetType().Name}: {ex.Message}";
        }
    }

    public async Task<FolderSuggestion> SuggestFolderAsync(
        string question,
        string answer,
        IEnumerable<string> existingFolders)
    {
        try
        {
            var folderList = string.Join(", ", existingFolders);

            var prompt = $$"""
                Analyze this Q&A and suggest the best folder path to save it in.

                Question: {{question}}
                Answer: {{answer[..Math.Min(500, answer.Length)]}}

                Existing folders: {{folderList}}

                Respond ONLY with valid JSON in this exact format, no other text:
                {
                  "suggestedPath": "programming.dotnet.ef_core",
                  "suggestedName": "Entity Framework Core",
                  "reasoning": "This is about EF Core which is a .NET technology",
                  "isNewFolder": false
                }

                Rules:
                - Use lowercase with dots as separators (ltree format)
                - Use existing folders when they fit
                - Create a new specific subfolder when needed
                - Keep paths max 3 levels deep
                - isNewFolder = true if you're suggesting a folder that doesn't exist yet
                """;

            var responseText = await CallGeminiAsync(prompt);
            var json = ExtractJson(responseText);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            return new FolderSuggestion(
                SuggestedPath: root.GetProperty("suggestedPath").GetString() ?? "general",
                SuggestedName: root.GetProperty("suggestedName").GetString() ?? "General",
                Reasoning: root.GetProperty("reasoning").GetString() ?? "",
                IsNewFolder: root.GetProperty("isNewFolder").GetBoolean()
            );
        }
        catch
        {
            return new FolderSuggestion("general", "General", "Could not determine folder", true);
        }
    }

    public async Task<string> RewriteAsNoteAsync(string question, string answer)
    {
        try
        {
            var prompt = $"""
                Convert this Q&A into a clean, well-structured knowledge note in Markdown.

                Original Question: {question}
                Original Answer: {answer}

                Create a clean note that:
                - Has a clear, concise title as H2 heading
                - Is written as reference material (not conversational)
                - Preserves all code examples with proper code blocks and language tags
                - Uses bullet points for lists
                - Includes a "Key Points" section if helpful
                - Is evergreen — useful to read again in 6 months
                - Maximum 400 words

                Return ONLY the markdown note, no preamble.
                """;

            return await CallGeminiAsync(prompt);
        }
        catch (Exception ex)
        {
            return $"## {question}\n\n{answer}\n\n> Note rewrite failed: {ex.Message}";
        }
    }

    public async Task<bool> IsAlreadyKnownAsync(string question, IEnumerable<string> existingNoteTitles)
    {
        try
        {
            var titles = existingNoteTitles.ToList();
            if (!titles.Any()) return false;

            var titleList = string.Join("\n", titles.Take(20).Select((t, i) => $"{i + 1}. {t}"));

            var prompt = $$"""
                Does this new question cover the same topic as any existing note?

                New question: {{question}}

                Existing note titles:
                {{titleList}}

                Respond ONLY with valid JSON:
                {"isAlreadyKnown": true, "matchingTitle": "LINQ Joins in EF Core"}
                or
                {"isAlreadyKnown": false, "matchingTitle": null}
                """;

            var responseText = await CallGeminiAsync(prompt);
            var json = ExtractJson(responseText);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("isAlreadyKnown").GetBoolean();
        }
        catch
        {
            return false;
        }
    }

    public Task<float[]> GenerateEmbeddingAsync(string text)
    {
        return Task.FromResult(Array.Empty<float>());
    }

    private async Task<string> CallGeminiAsync(string userMessage)
    {
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = userMessage } }
                }
            },
            generationConfig = new
            {
                maxOutputTokens = 2048,
                temperature = 0.7
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{BaseUrl}?key={_apiKey}", content);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);

        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;
    }

    private static string ExtractJson(string text)
    {
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start >= 0 && end > start)
            return text[start..(end + 1)];
        return text;
    }
}
