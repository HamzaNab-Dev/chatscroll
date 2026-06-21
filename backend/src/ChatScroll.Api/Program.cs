using Amazon;
using Amazon.DynamoDBv2;
using ChatScroll.Core.Interfaces;
using ChatScroll.Infrastructure.Data;
using ChatScroll.Infrastructure.Repositories.Aurora;
using ChatScroll.Infrastructure.Repositories.DynamoDB;
using ChatScroll.Infrastructure.Repositories.Mock;
using ChatScroll.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Serilog;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .MinimumLevel.Information()
    .CreateLogger();

// Required for Npgsql to handle DateTime <-> timestamptz correctly without NodaTime
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ChatScroll API",
        Version = "v1",
        Description = "Backend API for ChatScroll — Personal AI Knowledge Management"
    });
});

// Configure CORS
const string CorsPolicy = "ChatScrollCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        var allowedOrigins = new List<string>
        {
            "http://localhost:3000",
            "https://localhost:3000",
        };

        var vercelUrl = Environment.GetEnvironmentVariable("VERCEL_FRONTEND_URL");
        if (!string.IsNullOrEmpty(vercelUrl))
        {
            allowedOrigins.Add(vercelUrl);
            allowedOrigins.Add("https://chatscroll.vercel.app");
        }

        policy.WithOrigins(allowedOrigins.ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// AI Service
// ─────────────────────────────────────────────────────────────────────────────
var geminiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");

if (!string.IsNullOrEmpty(geminiKey))
{
    Log.Information("Gemini API key found — registering GeminiAiService");
    builder.Services.AddSingleton<IAiService>(_ => new GeminiAiService(geminiKey));
}
else
{
    Log.Information("No AI key found — using MockAiService");
    builder.Services.AddScoped<IAiService, MockAiService>();
}

// ─────────────────────────────────────────────────────────────────────────────
// Aurora PostgreSQL — auto-switches between real and mock
// Real when: ConnectionStrings__Aurora is set and is not localhost
// ─────────────────────────────────────────────────────────────────────────────
var auroraConnStr =
    builder.Configuration.GetConnectionString("Aurora") ??
    Environment.GetEnvironmentVariable("ConnectionStrings__Aurora");

var useAurora = !string.IsNullOrWhiteSpace(auroraConnStr) &&
                !auroraConnStr.Contains("localhost", StringComparison.OrdinalIgnoreCase);

if (useAurora)
{
    builder.Services.AddDbContext<ChatScrollDbContext>(options =>
        options.UseNpgsql(auroraConnStr, npgsql =>
        {
            npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
        }));

    builder.Services.AddScoped<IFolderRepository, AuroraFolderRepository>();
    builder.Services.AddScoped<INoteRepository, AuroraNoteRepository>();
    builder.Services.AddScoped<IConversationRepository, AuroraConversationRepository>();

    Log.Information("Aurora PostgreSQL registered");
}
else
{
    builder.Services.AddScoped<IFolderRepository, MockFolderRepository>();
    builder.Services.AddScoped<INoteRepository, MockNoteRepository>();
    builder.Services.AddScoped<IConversationRepository, MockConversationRepository>();

    Log.Information("Mock repositories registered (no Aurora connection string)");
}

// ─────────────────────────────────────────────────────────────────────────────
// DynamoDB — auto-switches between real and mock
// Real when: running on ECS (AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) or explicit AWS creds
// ─────────────────────────────────────────────────────────────────────────────
var onEcs = !string.IsNullOrEmpty(
    Environment.GetEnvironmentVariable("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI"));
var hasAwsKeys = !string.IsNullOrEmpty(
    Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID"));

if (onEcs || hasAwsKeys)
{
    builder.Services.AddSingleton<IAmazonDynamoDB>(
        _ => new AmazonDynamoDBClient(RegionEndpoint.USEast1));
    builder.Services.AddSingleton<IDynamoDbChatRepository, DynamoDbChatRepository>();
    Log.Information("DynamoDB registered (table: chatscroll-messages)");
}
else
{
    builder.Services.AddScoped<IDynamoDbChatRepository, MockDynamoDbChatRepository>();
    Log.Information("Mock DynamoDB registered (no AWS credentials detected)");
}

// ─────────────────────────────────────────────────────────────────────────────
// JWT Authentication (Cognito)
// ─────────────────────────────────────────────────────────────────────────────
var cognitoRegion = builder.Configuration["AWS:Region"] ?? "us-east-1";
var userPoolId = builder.Configuration["AWS:CognitoUserPoolId"] ?? "";

if (!string.IsNullOrEmpty(userPoolId))
{
    builder.Services.AddAuthentication("Bearer")
        .AddJwtBearer("Bearer", options =>
        {
            options.Authority = $"https://cognito-idp.{cognitoRegion}.amazonaws.com/{userPoolId}";
            options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                ValidateIssuer = true,
                ValidateAudience = false,
                ValidIssuer = $"https://cognito-idp.{cognitoRegion}.amazonaws.com/{userPoolId}",
            };
        });
    builder.Services.AddAuthorization();
    Log.Information("Cognito JWT auth configured for pool: {PoolId}", userPoolId);
}
else
{
    Log.Information("No Cognito config — auth bypassed for local development");
    builder.Services.AddAuthentication();
    builder.Services.AddAuthorization();
}

var app = builder.Build();

// Auto-seed the mock user in Aurora so folder/note creation works without real auth
if (useAurora)
{
    using var scope = app.Services.CreateScope();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ChatScrollDbContext>();
        var mockId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        if (!await db.Users.AnyAsync(u => u.Id == mockId))
        {
            db.Users.Add(new ChatScroll.Core.Entities.User
            {
                Id = mockId,
                CognitoSub = "dev-user",
                Email = "dev@chatscroll.local",
                DisplayName = "Dev User",
                Plan = "pro",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
            Log.Information("Seeded mock user {Id}", mockId);
        }
    }
    catch (Exception ex)
    {
        Log.Warning("Could not seed mock user: {Error}", ex.Message);
    }
}

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ChatScroll API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseSerilogRequestLogging();
app.UseCors(CorsPolicy);
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

Log.Information("ChatScroll API starting — Aurora:{AuroraMode} DynamoDB:{DynMode}",
    useAurora ? "real" : "mock",
    (onEcs || hasAwsKeys) ? "real" : "mock");

app.Run();
