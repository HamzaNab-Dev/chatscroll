using System.Text;
using System.Text.Json;
using ChatScroll.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace ChatScroll.Infrastructure.Services;

public class GeminiAiService : IAiService
{
    private readonly HttpClient _httpClient = new();
    private readonly string _apiKey;
    private readonly ILogger<GeminiAiService> _logger;

    private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public GeminiAiService(string apiKey, ILogger<GeminiAiService> logger)
    {
        _apiKey = apiKey;
        _logger = logger;
    }

    public async Task<string> ChatAsync(string message, string conversationHistory)
    {
        try
        {
            var systemPrompt = """
                You are ChatScroll AI — a concise, smart assistant.

                STRICT RULES:
                - Maximum 150 words for conceptual questions
                - Maximum 250 words for technical questions
                - Give ONE code example maximum, only if essential
                - NEVER show the same concept in multiple programming languages
                - Use bullet points, not paragraphs
                - Be direct — no phrases like 'That's a fantastic question!'
                - No motivational intros or summaries at the end
                - If asked about principles/concepts: list them with 1-2 line explanations only
                - User can ask for more detail if they want it
                """;

            var userContent = string.IsNullOrEmpty(conversationHistory)
                ? message
                : $"Previous context:\n{conversationHistory}\n\n{message}";

            return await CallGeminiAsync(userContent, systemPrompt);
        }
        catch (HttpRequestException ex) when (ex.Message.Contains("429"))
        {
            return "GEMINI_ERROR: The AI is temporarily rate-limited. Please wait a few seconds and try again.";
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
                ChatScroll is a general-purpose knowledge library — topics include programming, medicine, finance, math, science, cooking, hobbies, languages, history, and anything else.

                Question: {{question}}
                Answer: {{answer[..Math.Min(500, answer.Length)]}}

                Existing folders (use ONLY as hints — do NOT force the topic into an existing folder if it doesn't fit):
                {{folderList}}

                Respond ONLY with valid JSON in this exact format, no other text:
                {
                  "suggestedPath": "medicine.antibiotics",
                  "suggestedName": "Antibiotics",
                  "reasoning": "Question is about a medication",
                  "isNewFolder": true
                }

                Rules:
                - Base the folder on the TOPIC OF THE QUESTION, not the topic of the answer
                - If the topic matches an existing folder exactly, use that folder path
                - If the question fits under an existing folder but is a specific sub-topic, suggest "existing_folder.subtopic" (e.g. "programming.docker")
                - If you need a catch-all subfolder under an existing folder (no specific subtopic fits), use path "existing_folder.general" with name exactly "General"
                - You MAY suggest a new top-level folder (e.g. "medicine", "finance", "cooking", "fitness") when nothing existing fits
                - Use lowercase with underscores for spaces, dots as separators (ltree format)
                - Keep paths max 3 levels deep
                - isNewFolder = true when the path does not appear in the existing folders list
                """;

            var responseText = await CallGeminiAsync(prompt);
            var json = ExtractJson(responseText);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var suggestedPath = root.GetProperty("suggestedPath").GetString() ?? "general";
            var suggestedName = root.GetProperty("suggestedName").GetString() ?? "General";

            // Root-level folders (no dot = single segment) must not be prefixed with "General"
            // e.g. "General Programming" → "Programming"
            if (!suggestedPath.Contains('.') &&
                suggestedName.StartsWith("General ", StringComparison.OrdinalIgnoreCase))
            {
                suggestedName = suggestedName[8..].Trim();
            }

            return new FolderSuggestion(
                SuggestedPath: suggestedPath,
                SuggestedName: suggestedName,
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

    public async Task<(bool IsKnown, string? MatchingTitle)> IsAlreadyKnownAsync(string question, IEnumerable<string> existingNoteTitles)
    {
        try
        {
            var titles = existingNoteTitles.ToList();
            if (!titles.Any()) return (false, null);

            var titleList = string.Join("\n", titles.Take(20).Select((t, i) => $"{i + 1}. {t}"));

            var prompt = $$"""
                Does this new question ask about EXACTLY the same specific concept as one of the existing note titles below?

                New question: {{question}}

                Existing note titles:
                {{titleList}}

                STRICT RULES — only return isAlreadyKnown=true when:
                - The question and the note title address the SAME specific concept (e.g. "async/await in C#" matches "How does async/await work in C#?")
                - Do NOT match if one is a broader parent topic of the other (e.g. "SOLID principles" does NOT match "what is OOP?" — they are related but different topics)
                - Do NOT match on shared keywords alone (e.g. "What is pgvector?" and "What is a vector?" are different topics)

                Respond ONLY with valid JSON:
                {"isAlreadyKnown": true, "matchingTitle": "exact title from the list above"}
                or
                {"isAlreadyKnown": false, "matchingTitle": null}
                """;

            var responseText = await CallGeminiAsync(prompt);
            var json = ExtractJson(responseText);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var isKnown = root.GetProperty("isAlreadyKnown").GetBoolean();
            var matchingTitle = root.TryGetProperty("matchingTitle", out var mt) && mt.ValueKind == JsonValueKind.String
                ? mt.GetString()
                : null;
            return (isKnown, matchingTitle);
        }
        catch
        {
            return (false, null);
        }
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text, string taskType = "RETRIEVAL_DOCUMENT")
    {
        if (string.IsNullOrWhiteSpace(text)) return Array.Empty<float>();

        try
        {
            // gemini-embedding-001 produces 3072-dim vectors; Aurora column must be vector(3072)
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={_apiKey}";
            _logger.LogInformation("Gemini embedding request: {Url} taskType={TaskType}",
                url.Replace(_apiKey, "[REDACTED]"), taskType);

            var body = JsonSerializer.Serialize(new
            {
                model = "models/gemini-embedding-001",
                content = new { parts = new[] { new { text } } },
                taskType,
                outputDimensionality = 3072
            });

            var response = await _httpClient.PostAsync(url,
                new StringContent(body, Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini embedding API returned {StatusCode}: {ErrorBody}",
                    (int)response.StatusCode, errorBody);
                return Array.Empty<float>();
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            return doc.RootElement
                .GetProperty("embedding")
                .GetProperty("values")
                .EnumerateArray()
                .Select(v => v.GetSingle())
                .ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embedding for text: {TextPreview}",
                text.Length > 50 ? text[..50] : text);
            return Array.Empty<float>();
        }
    }

    private async Task<string> CallGeminiAsync(string userMessage, string systemInstruction = "")
    {
        var contents = new[] { new { role = "user", parts = new[] { new { text = userMessage } } } };
        var generationConfig = new { maxOutputTokens = 8192, temperature = 0.7 };

        var json = !string.IsNullOrEmpty(systemInstruction)
            ? JsonSerializer.Serialize(new
            {
                systemInstruction = new { parts = new[] { new { text = systemInstruction } } },
                contents,
                generationConfig
            })
            : JsonSerializer.Serialize(new { contents, generationConfig });

        // Retry with exponential backoff on 429 rate-limit responses
        const int maxAttempts = 3;
        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            var requestContent = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{BaseUrl}?key={_apiKey}", requestContent);

            if ((int)response.StatusCode == 429 && attempt < maxAttempts - 1)
            {
                // 2s then 4s backoff
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt + 1)));
                continue;
            }

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

        throw new HttpRequestException("429 Too Many Requests — rate limit exceeded after retries.");
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
