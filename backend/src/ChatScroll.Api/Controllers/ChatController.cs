using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ApiControllerBase
{
    private readonly IAiService _aiService;
    private readonly INoteRepository _noteRepository;
    private readonly IFolderRepository _folderRepository;
    private readonly IDynamoDbChatRepository _dynamoDb;
    private readonly IConversationRepository _conversationRepository;

    public ChatController(
        IAiService aiService,
        INoteRepository noteRepository,
        IFolderRepository folderRepository,
        IDynamoDbChatRepository dynamoDb,
        IConversationRepository conversationRepository)
    {
        _aiService = aiService;
        _noteRepository = noteRepository;
        _folderRepository = folderRepository;
        _dynamoDb = dynamoDb;
        _conversationRepository = conversationRepository;
    }

    [HttpGet("ai-status")]
    public IActionResult GetAiStatus([FromServices] IAiService aiService)
    {
        var serviceType = aiService.GetType().Name;
        return Ok(new
        {
            aiService = serviceType,
            isRealAi = serviceType is "GeminiAiService" or "AnthropicAiService",
            model = serviceType switch
            {
                "GeminiAiService" => "gemini-2.5-flash",
                "AnthropicAiService" => "claude-opus-4-8",
                _ => "mock"
            },
            status = "ready"
        });
    }

    [HttpGet("ai-debug")]
    public async Task<IActionResult> AiDebug(
        [FromServices] IAiService aiService,
        [FromServices] IWebHostEnvironment env)
    {
        var serviceType = aiService.GetType().Name;

        var info = new Dictionary<string, object?>
        {
            ["environmentName"]           = env.EnvironmentName,
            ["isProduction"]              = env.IsProduction(),
            ["aspnetcoreEnvironmentVar"]  = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "(not set)",
            ["aiServiceRegistered"]       = serviceType,
            ["isRealAiService"]           = serviceType is "GeminiAiService" or "AnthropicAiService",
            ["geminiApiKey"]              = string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GEMINI_API_KEY")) ? "(not set)" : "***set***",
            ["anthropicApiKey"]           = string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")) ? "(not set)" : "***set***",
        };

        if (serviceType is "GeminiAiService" or "AnthropicAiService")
        {
            try
            {
                var response = await aiService.ChatAsync("Reply with exactly the word PONG and nothing else.", "");
                info["aiCallResult"] = "success";
                info["aiResponse"]   = response[..Math.Min(200, response.Length)];
            }
            catch (Exception ex)
            {
                info["aiCallResult"]  = "FAILED";
                info["aiErrorType"]   = ex.GetType().FullName;
                info["aiErrorMessage"] = ex.Message;
                info["aiInnerError"]  = ex.InnerException?.Message;
            }
        }
        else
        {
            info["aiCallResult"] = "skipped — MockAiService is registered";
        }

        return Ok(info);
    }

    [HttpGet("preview")]
    public async Task<IActionResult> Preview([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { error = "Question is required" });

        var answer = await _aiService.ChatAsync(q, "");
        var folderSuggestion = await _aiService.SuggestFolderAsync(q, answer, new[] { "general" });
        var cleanNote = answer;

        return Ok(new ChatMessageResponse(
            Answer: answer,
            FolderSuggestion: folderSuggestion,
            CleanNote: cleanNote,
            IsAlreadyKnown: false,
            AlreadyKnownMessage: null,
            SimilarNoteId: null,
            SimilarNoteTitle: null,
            SimilarNoteDate: null
        ));
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
    {
        var conversationId = request.ConversationId ?? Guid.NewGuid();
        var isGuest = request.IsGuest;
        var userId = GetUserId();

        // Only persist turns for authenticated users — guests must never write to another user's account.
        if (!isGuest)
        {
            await _dynamoDb.SaveMessageAsync(conversationId, "user", request.Message, userId);
        }

        var answer = await _aiService.ChatAsync(request.Message, request.ConversationHistory ?? "");

        if (!isGuest)
        {
            await _dynamoDb.SaveMessageAsync(conversationId, "assistant", answer, userId);

            // Update conversation in Aurora: create if missing, bump updatedAt, auto-set title
            try
            {
                var conversation = await _conversationRepository.GetByIdAsync(conversationId, userId);
                if (conversation is null)
                {
                    conversation = await _conversationRepository.CreateAsync(new Conversation
                    {
                        Id = conversationId,
                        UserId = userId,
                        Title = request.Message.Length > 45
                            ? request.Message[..45] + "..."
                            : request.Message,
                        MessageCount = 2
                    });
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(conversation.Title) || conversation.Title == "New Chat")
                    {
                        conversation.Title = request.Message.Length > 45
                            ? request.Message[..45] + "..."
                            : request.Message;
                    }
                    conversation.MessageCount += 2;
                    await _conversationRepository.UpdateAsync(conversation);
                }
            }
            catch (Exception ex)
            {
                Log.Warning("Failed to update conversation {Id} in Aurora: {Error}", conversationId, ex.Message);
            }
        }

        // If the AI call itself failed, skip all follow-up AI calls — return immediately without save prompt
        if (answer.StartsWith("GEMINI_ERROR:"))
        {
            return Ok(new ChatMessageResponse(
                Answer: answer,
                FolderSuggestion: new FolderSuggestion("general", "General", "", false),
                CleanNote: "",
                IsAlreadyKnown: false,
                AlreadyKnownMessage: null,
                SimilarNoteId: null,
                SimilarNoteTitle: null,
                SimilarNoteDate: null
            ));
        }

        // Duplicate detection and folder suggestion are only meaningful for authenticated users
        // who have a library. Guests get a clean response without any cross-contamination.
        if (isGuest)
        {
            var guestFolderSuggestion = await _aiService.SuggestFolderAsync(request.Message, answer, new[] { "general" });
            var guestCleanNote = answer;
            return Ok(new ChatMessageResponse(
                Answer: answer,
                FolderSuggestion: guestFolderSuggestion,
                CleanNote: guestCleanNote,
                IsAlreadyKnown: false,
                AlreadyKnownMessage: null,
                SimilarNoteId: null,
                SimilarNoteTitle: null,
                SimilarNoteDate: null
            ));
        }

        // Semantic duplicate detection — search first 30 chars as heuristic keyword match
        var searchTerm = request.Message[..Math.Min(30, request.Message.Length)];
        var existingNotes = (await _noteRepository.SearchAsync(userId, searchTerm)).ToList();
        var (isAlreadyKnown, matchingTitle) = await _aiService.IsAlreadyKnownAsync(
            request.Message, existingNotes.Select(n => n.Title));

        // Use the title the AI identified to find the correct note, not just the first search result
        Note? matchingNote = null;
        if (isAlreadyKnown)
        {
            matchingNote = matchingTitle != null
                ? existingNotes.FirstOrDefault(n => string.Equals(n.Title, matchingTitle, StringComparison.OrdinalIgnoreCase))
                  ?? existingNotes.FirstOrDefault()
                : existingNotes.FirstOrDefault();
        }

        // Use real user folder paths instead of hardcoded values
        var userFolders = await _folderRepository.GetByUserIdAsync(userId);
        var folderPaths = userFolders.Select(f => f.Path).ToArray();
        if (folderPaths.Length == 0) folderPaths = new[] { "general" };

        var folderSuggestion = await _aiService.SuggestFolderAsync(request.Message, answer, folderPaths);
        var cleanNote = answer;

        return Ok(new ChatMessageResponse(
            Answer: answer,
            FolderSuggestion: folderSuggestion,
            CleanNote: cleanNote,
            IsAlreadyKnown: isAlreadyKnown,
            AlreadyKnownMessage: isAlreadyKnown ? "💡 You've saved something similar before!" : null,
            SimilarNoteId: matchingNote?.Id.ToString(),
            SimilarNoteTitle: matchingNote?.Title,
            SimilarNoteDate: matchingNote?.CreatedAt.ToString("MMMM d, yyyy")
        ));
    }
}

public record ChatMessageRequest(
    string Message,
    string? ConversationHistory,
    Guid? ConversationId,
    bool IsGuest = false
);

public record ChatMessageResponse(
    string Answer,
    FolderSuggestion FolderSuggestion,
    string CleanNote,
    bool IsAlreadyKnown,
    string? AlreadyKnownMessage,
    string? SimilarNoteId,
    string? SimilarNoteTitle,
    string? SimilarNoteDate
);
