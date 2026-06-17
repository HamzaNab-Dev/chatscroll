using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly INoteRepository _noteRepository;
    private readonly IFolderRepository _folderRepository;
    private readonly IDynamoDbChatRepository _dynamoDb;
    private static readonly Guid MockUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public ChatController(
        IAiService aiService,
        INoteRepository noteRepository,
        IFolderRepository folderRepository,
        IDynamoDbChatRepository dynamoDb)
    {
        _aiService = aiService;
        _noteRepository = noteRepository;
        _folderRepository = folderRepository;
        _dynamoDb = dynamoDb;
    }

    [HttpGet("ai-status")]
    public IActionResult GetAiStatus([FromServices] IAiService aiService)
    {
        var serviceType = aiService.GetType().Name;
        return Ok(new
        {
            aiService = serviceType,
            isRealAi = serviceType == "BedrockAiService",
            model = serviceType == "BedrockAiService" ? "anthropic.claude-sonnet-4-20250514-v1:0" : "mock",
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
            ["isBedrockService"]          = serviceType == "BedrockAiService",
            ["containerCredentialsUri"]   = Environment.GetEnvironmentVariable("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI") ?? "(not set)",
            ["awsAccessKeyId"]            = string.IsNullOrEmpty(Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID")) ? "(not set)" : "***set***",
        };

        if (serviceType == "BedrockAiService")
        {
            try
            {
                var response = await aiService.ChatAsync("Reply with exactly the word PONG and nothing else.", "");
                info["bedrockCallResult"] = "success";
                info["bedrockResponse"]   = response[..Math.Min(200, response.Length)];
            }
            catch (Exception ex)
            {
                info["bedrockCallResult"]  = "FAILED";
                info["bedrockErrorType"]   = ex.GetType().FullName;
                info["bedrockErrorMessage"] = ex.Message;
                info["bedrockInnerError"]  = ex.InnerException?.Message;
            }
        }
        else
        {
            info["bedrockCallResult"] = "skipped — MockAiService is registered";
        }

        return Ok(info);
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] ChatMessageRequest request)
    {
        var conversationId = request.ConversationId ?? Guid.NewGuid();

        // Persist user turn to DynamoDB chat history (90-day TTL)
        await _dynamoDb.SaveMessageAsync(conversationId, "user", request.Message, MockUserId);

        var answer = await _aiService.ChatAsync(request.Message, request.ConversationHistory ?? "");

        // Persist assistant turn
        await _dynamoDb.SaveMessageAsync(conversationId, "assistant", answer, MockUserId);

        // Semantic duplicate detection — search first 30 chars as heuristic keyword match
        // Production: replace SearchAsync with pgvector cosine similarity on the full question embedding
        var searchTerm = request.Message[..Math.Min(30, request.Message.Length)];
        var existingNotes = (await _noteRepository.SearchAsync(MockUserId, searchTerm)).ToList();
        var isAlreadyKnown = await _aiService.IsAlreadyKnownAsync(
            request.Message, existingNotes.Select(n => n.Title));

        var matchingNote = isAlreadyKnown ? existingNotes.FirstOrDefault() : null;

        // Use real user folder paths instead of hardcoded values
        var userFolders = await _folderRepository.GetByUserIdAsync(MockUserId);
        var folderPaths = userFolders.Select(f => f.Path).ToArray();
        if (folderPaths.Length == 0) folderPaths = new[] { "general" };

        var folderSuggestion = await _aiService.SuggestFolderAsync(request.Message, answer, folderPaths);
        var cleanNote = await _aiService.RewriteAsNoteAsync(request.Message, answer);

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
    Guid? ConversationId
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
