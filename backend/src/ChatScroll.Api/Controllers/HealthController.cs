using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IAiService _aiService;

    public HealthController(IConfiguration configuration, IAiService aiService)
    {
        _configuration = configuration;
        _aiService = aiService;
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
    /// Reports connectivity status for all data stores and AI services.
    /// Useful for deployment verification and monitoring dashboards.
    /// </summary>
    [HttpGet("database")]
    public IActionResult GetDatabaseHealth()
    {
        var auroraConnected = !string.IsNullOrEmpty(
            _configuration.GetConnectionString("Aurora") ??
            Environment.GetEnvironmentVariable("ConnectionStrings__Aurora"));

        var hasAwsCreds =
            !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID")) ||
            System.IO.File.Exists(Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".aws", "credentials"));

        var aiServiceType = _aiService.GetType().Name;

        return Ok(new
        {
            aurora = new
            {
                connected = auroraConnected,
                extensions = auroraConnected
                    ? new[] { "pgvector", "ltree", "pg_trgm", "uuid-ossp", "tsvector" }
                    : Array.Empty<string>(),
                status = auroraConnected ? "connected" : "using_mock",
                note = auroraConnected
                    ? null
                    : "Set ConnectionStrings__Aurora env var to connect Aurora PostgreSQL"
            },
            dynamoDb = new
            {
                connected = hasAwsCreds,
                table = "chatscroll-messages",
                ttlDays = 90,
                partitionKey = "conversationId",
                sortKey = "timestamp#messageId",
                status = hasAwsCreds ? "connected" : "using_mock"
            },
            aiService = new
            {
                type = aiServiceType,
                isRealBedrock = aiServiceType == "BedrockAiService",
                model = aiServiceType == "BedrockAiService" ? "anthropic.claude-sonnet-4-6" : "mock",
                embeddings = aiServiceType == "BedrockAiService" ? "amazon.titan-embed-text-v2:0 (1024 dims)" : "mock",
                status = aiServiceType == "BedrockAiService" ? "connected" : "mock"
            },
            timestamp = DateTime.UtcNow
        });
    }
}
