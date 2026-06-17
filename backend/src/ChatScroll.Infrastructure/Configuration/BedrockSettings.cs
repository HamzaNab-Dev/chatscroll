namespace ChatScroll.Infrastructure.Configuration;

public class BedrockSettings
{
    public string Region { get; set; } = "us-east-1";
    public string ClaudeModelId { get; set; } = "amazon.titan-text-premier-v1:0";
    public string TitanModelId { get; set; } = "amazon.titan-embed-text-v2:0";
    public int MaxTokens { get; set; } = 2048;
}
