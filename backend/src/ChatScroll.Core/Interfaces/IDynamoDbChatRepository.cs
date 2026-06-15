namespace ChatScroll.Core.Interfaces;

/// <summary>
/// DynamoDB table: chatscroll-messages
/// PK: conversationId (string)  SK: timestamp#messageId (string)
/// TTL attribute: ttl (number, Unix timestamp) — 90 days for free users
/// GSI: userId-timestamp-index for per-user history queries
/// </summary>
public interface IDynamoDbChatRepository
{
    Task SaveMessageAsync(Guid conversationId, string role, string content, Guid userId);
    Task<IEnumerable<DynamoDbChatMessage>> GetConversationAsync(Guid conversationId, Guid userId);
}

public record DynamoDbChatMessage(
    Guid ConversationId,
    string SortKey,
    string Role,
    string Content,
    Guid UserId,
    DateTime Timestamp,
    long Ttl
);
