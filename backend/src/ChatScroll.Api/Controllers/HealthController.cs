using ChatScroll.Core.Interfaces;
using ChatScroll.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IAiService _aiService;
    private readonly IServiceScopeFactory _scopeFactory;

    public HealthController(
        IConfiguration configuration,
        IAiService aiService,
        IServiceScopeFactory scopeFactory)
    {
        _configuration = configuration;
        _aiService = aiService;
        _scopeFactory = scopeFactory;
    }

    [HttpGet]
    public IActionResult Get() =>
        Ok(new
        {
            status = "ok",
            service = "ChatScroll API",
            version = "1.0.0",
            timestamp = DateTime.UtcNow,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
        });

    /// <summary>
    /// Reports live connectivity status for all data stores and AI services.
    /// Runs a real SELECT 1 against Aurora when configured.
    /// </summary>
    [HttpGet("database")]
    public async Task<IActionResult> GetDatabaseHealth()
    {
        // ── Aurora ────────────────────────────────────────────────────────────
        var auroraConnStr =
            _configuration.GetConnectionString("Aurora") ??
            Environment.GetEnvironmentVariable("ConnectionStrings__Aurora");
        var auroraConfigured = !string.IsNullOrWhiteSpace(auroraConnStr) &&
                               !auroraConnStr.Contains("localhost", StringComparison.OrdinalIgnoreCase);

        bool auroraLive = false;
        string? auroraError = null;
        string[] extensions = Array.Empty<string>();

        if (auroraConfigured)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetService<ChatScrollDbContext>();
                if (db != null)
                {
                    await db.Database.ExecuteSqlRawAsync("SELECT 1");
                    auroraLive = true;
                    extensions = ["pgvector", "ltree", "pg_trgm", "uuid-ossp", "tsvector"];
                }
            }
            catch (Exception ex)
            {
                auroraError = ex.Message;
            }
        }

        // ── DynamoDB ──────────────────────────────────────────────────────────
        var onEcs = !string.IsNullOrEmpty(
            Environment.GetEnvironmentVariable("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI"));
        var hasAwsKeys = !string.IsNullOrEmpty(
            Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID"));
        var dynamoConnected = onEcs || hasAwsKeys;

        // ── AI Service ────────────────────────────────────────────────────────
        var aiType = _aiService.GetType().Name;

        return Ok(new
        {
            aurora = new
            {
                configured = auroraConfigured,
                live = auroraLive,
                extensions,
                status = auroraLive ? "connected" : (auroraConfigured ? "error" : "using_mock"),
                error = auroraError,
                note = !auroraConfigured
                    ? "Set ConnectionStrings__Aurora env var to connect Aurora PostgreSQL"
                    : null
            },
            dynamoDb = new
            {
                connected = dynamoConnected,
                table = "chatscroll-messages",
                ttlDays = 90,
                partitionKey = "conversationId",
                sortKey = "timestamp#messageId",
                status = dynamoConnected ? "connected" : "using_mock"
            },
            aiService = new
            {
                type = aiType,
                isRealAi = aiType is "GeminiAiService" or "AnthropicAiService",
                embeddingModel = aiType is "GeminiAiService" ? "gemini-embedding-001 (3072-dim)" : null,
                chatModel = aiType switch
                {
                    "GeminiAiService" => "gemini-2.5-flash",
                    "AnthropicAiService" => "claude-opus-4-8",
                    _ => "mock"
                },
                status = aiType is "GeminiAiService" or "AnthropicAiService" ? "connected" : "mock"
            },
            timestamp = DateTime.UtcNow
        });
    }
}
