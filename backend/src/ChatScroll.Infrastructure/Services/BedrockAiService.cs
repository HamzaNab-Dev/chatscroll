using System.Text;
using System.Text.Json;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using ChatScroll.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace ChatScroll.Infrastructure.Services;

public class BedrockAiService : IAiService
{
    private readonly AmazonBedrockRuntimeClient _bedrockClient;
    private readonly ILogger<BedrockAiService> _logger;

    private const string ClaudeModelId = "anthropic.claude-sonnet-4-6";
    private const string TitanEmbeddingModelId = "amazon.titan-embed-text-v2:0";

    public BedrockAiService(
        AmazonBedrockRuntimeClient bedrockClient,
        ILogger<BedrockAiService> logger)
    {
        _bedrockClient = bedrockClient;
        _logger = logger;
    }

    // ─────────────────────────────────────────
    // CHAT
    // ─────────────────────────────────────────
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
                ? message
                : $"Previous context:\n{conversationHistory}\n\n{message}";

            return await InvokeClaudeAsync(fullMessage, systemPrompt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bedrock chat failed for message: {Message}", message[..Math.Min(50, message.Length)]);
            return $"BEDROCK_ERROR: {ex.GetType().Name}: {ex.Message}";
        }
    }

    // ─────────────────────────────────────────
    // FOLDER SUGGESTION
    // ─────────────────────────────────────────
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

            var responseText = await InvokeClaudeAsync(prompt);
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Folder suggestion failed");
            return new FolderSuggestion("general", "General", "Could not determine folder", true);
        }
    }

    // ─────────────────────────────────────────
    // NOTE REWRITER
    // ─────────────────────────────────────────
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

            return await InvokeClaudeAsync(prompt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Note rewrite failed");
            return $"## {question}\n\n{answer}";
        }
    }

    // ─────────────────────────────────────────
    // ALREADY KNOWN DETECTOR
    // ─────────────────────────────────────────
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

            var responseText = await InvokeClaudeAsync(prompt);
            var json = ExtractJson(responseText);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("isAlreadyKnown").GetBoolean();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Already known check failed");
            return false;
        }
    }

    // ─────────────────────────────────────────
    // TITAN EMBEDDINGS
    // ─────────────────────────────────────────
    public async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        try
        {
            var requestBody = new
            {
                inputText = text[..Math.Min(8000, text.Length)],
                dimensions = 1024,
                normalize = true
            };

            var bodyJson = JsonSerializer.Serialize(requestBody);
            var request = new InvokeModelRequest
            {
                ModelId = TitanEmbeddingModelId,
                ContentType = "application/json",
                Accept = "application/json",
                Body = new MemoryStream(Encoding.UTF8.GetBytes(bodyJson))
            };

            var response = await _bedrockClient.InvokeModelAsync(request);
            var responseBody = await new StreamReader(response.Body).ReadToEndAsync();
            using var doc = JsonDocument.Parse(responseBody);

            var embeddingArray = doc.RootElement.GetProperty("embedding");
            return embeddingArray.EnumerateArray()
                .Select(e => e.GetSingle())
                .ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Embedding generation failed");
            return Array.Empty<float>();
        }
    }

    // ─────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────
    private async Task<string> InvokeClaudeAsync(string userMessage, string systemPrompt = "")
    {
        var request = new ConverseRequest
        {
            ModelId = ClaudeModelId,
            Messages = new List<Message>
            {
                new Message
                {
                    Role = ConversationRole.User,
                    Content = new List<ContentBlock>
                    {
                        new ContentBlock { Text = userMessage }
                    }
                }
            },
            InferenceConfig = new InferenceConfiguration
            {
                MaxTokens = 2048,
                Temperature = 0.7F
            }
        };

        if (!string.IsNullOrEmpty(systemPrompt))
        {
            request.System = new List<SystemContentBlock>
            {
                new SystemContentBlock { Text = systemPrompt }
            };
        }

        var response = await _bedrockClient.ConverseAsync(request);
        return response.Output.Message.Content[0].Text;
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
