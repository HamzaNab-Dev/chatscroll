using Amazon.BedrockRuntime;
using Amazon.Runtime;
using ChatScroll.Core.Interfaces;
using ChatScroll.Infrastructure.Repositories.Mock;
using ChatScroll.Infrastructure.Services;
using Microsoft.OpenApi.Models;
using Serilog;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .MinimumLevel.Information()
    .CreateLogger();

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

// ─────────────────────────────────────────
// Service Registration — Smart fallback
// Uses real AWS services when credentials available
// Falls back to mock for local development
// ─────────────────────────────────────────

var awsRegion = builder.Configuration["AWS:Region"] ?? "us-east-1";

// In Production (ECS Fargate) the task IAM role provides credentials automatically
// via the instance metadata service — no env vars are set by the platform.
// Use ASPNETCORE_ENVIRONMENT as the switch: Production → Bedrock, Development → Mock.
var isProduction = builder.Environment.IsProduction();

builder.Services.AddScoped<IFolderRepository, MockFolderRepository>();
builder.Services.AddScoped<INoteRepository, MockNoteRepository>();
builder.Services.AddScoped<IConversationRepository, MockConversationRepository>();
// DynamoDB chat history — mock locally, real AWSSDK.DynamoDBv2 in production when hasAwsCredentials
builder.Services.AddScoped<IDynamoDbChatRepository, MockDynamoDbChatRepository>();

if (isProduction)
{
    Log.Information("Production environment detected — registering BedrockAiService");
    builder.Services.AddSingleton<AmazonBedrockRuntimeClient>(_ =>
        new AmazonBedrockRuntimeClient(
            FallbackCredentialsFactory.GetCredentials(),
            new AmazonBedrockRuntimeConfig { RegionEndpoint = Amazon.RegionEndpoint.USEast1 }
        ));
    builder.Services.AddScoped<IAiService, BedrockAiService>();
}
else
{
    Log.Information("Development environment — registering MockAiService");
    builder.Services.AddScoped<IAiService, MockAiService>();
}

// ─────────────────────────────────────────
// JWT Authentication (Cognito)
// ─────────────────────────────────────────
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

Log.Information("ChatScroll API starting...");

app.Run();
