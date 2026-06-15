using ChatScroll.Core.Interfaces;

namespace ChatScroll.Infrastructure.Repositories.Mock;

/// <summary>
/// In-memory mock of DynamoDB chat message storage.
/// Production: AWSSDK.DynamoDBv2 with AmazonDynamoDBClient writing to chatscroll-messages table.
/// </summary>
public class MockDynamoDbChatRepository : IDynamoDbChatRepository
{
    private readonly List<DynamoDbChatMessage> _messages = new();

    public Task SaveMessageAsync(Guid conversationId, string role, string content, Guid userId)
    {
        var msg = new DynamoDbChatMessage(
            ConversationId: conversationId,
            SortKey: $"{DateTime.UtcNow:yyyyMMddHHmmssfff}#{Guid.NewGuid():N}",
            Role: role,
            Content: content,
            UserId: userId,
            Timestamp: DateTime.UtcNow,
            Ttl: DateTimeOffset.UtcNow.AddDays(90).ToUnixTimeSeconds()
        );
        _messages.Add(msg);
        return Task.CompletedTask;
    }

    public Task<IEnumerable<DynamoDbChatMessage>> GetConversationAsync(Guid conversationId, Guid userId) =>
        Task.FromResult(_messages
            .Where(m => m.ConversationId == conversationId && m.UserId == userId)
            .OrderBy(m => m.Timestamp)
            .AsEnumerable());
}
