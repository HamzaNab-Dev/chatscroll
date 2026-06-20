using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using ChatScroll.Core.Interfaces;

namespace ChatScroll.Infrastructure.Repositories.DynamoDB;

/// <summary>
/// Real DynamoDB implementation.
/// Table: chatscroll-messages
/// PK: conversationId (String)  SK: timestamp (String) — format yyyyMMddHHmmssfff#messageId
/// TTL attribute: ttl (Number, Unix seconds) — 90-day retention
/// </summary>
public class DynamoDbChatRepository : IDynamoDbChatRepository
{
    private const string TableName = "chatscroll-messages";

    private readonly IAmazonDynamoDB _client;

    public DynamoDbChatRepository(IAmazonDynamoDB client)
    {
        _client = client;
    }

    public async Task SaveMessageAsync(Guid conversationId, string role, string content, Guid userId)
    {
        var messageId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var sortKey = $"{now:yyyyMMddHHmmssfff}#{messageId:N}";
        var ttl = DateTimeOffset.UtcNow.AddDays(90).ToUnixTimeSeconds();

        await _client.PutItemAsync(new PutItemRequest
        {
            TableName = TableName,
            Item = new Dictionary<string, AttributeValue>
            {
                ["conversationId"] = new AttributeValue { S = conversationId.ToString() },
                ["timestamp"] = new AttributeValue { S = sortKey },
                ["userId"] = new AttributeValue { S = userId.ToString() },
                ["role"] = new AttributeValue { S = role },
                ["content"] = new AttributeValue { S = content },
                ["createdAt"] = new AttributeValue { S = now.ToString("O") },
                ["ttl"] = new AttributeValue { N = ttl.ToString() }
            }
        });
    }

    public async Task<IEnumerable<DynamoDbChatMessage>> GetConversationAsync(Guid conversationId, Guid userId)
    {
        var response = await _client.QueryAsync(new QueryRequest
        {
            TableName = TableName,
            KeyConditionExpression = "conversationId = :cid",
            FilterExpression = "userId = :uid",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":cid"] = new AttributeValue { S = conversationId.ToString() },
                [":uid"] = new AttributeValue { S = userId.ToString() }
            },
            ScanIndexForward = true // oldest-first (ascending sort key)
        });

        return response.Items.Select(MapItem);
    }

    private static DynamoDbChatMessage MapItem(Dictionary<string, AttributeValue> item)
    {
        DateTime timestamp;
        if (item.TryGetValue("createdAt", out var ca))
        {
            timestamp = DateTime.Parse(ca.S, null, System.Globalization.DateTimeStyles.RoundtripKind);
        }
        else
        {
            timestamp = ParseTimestampFromSortKey(item["timestamp"].S);
        }

        return new DynamoDbChatMessage(
            ConversationId: Guid.Parse(item["conversationId"].S),
            SortKey: item["timestamp"].S,
            Role: item["role"].S,
            Content: item["content"].S,
            UserId: Guid.Parse(item["userId"].S),
            Timestamp: timestamp,
            Ttl: item.TryGetValue("ttl", out var ttlAttr) ? long.Parse(ttlAttr.N) : 0
        );
    }

    private static DateTime ParseTimestampFromSortKey(string sortKey)
    {
        // Format: yyyyMMddHHmmssfff#guid
        var part = sortKey.Split('#')[0];
        if (DateTime.TryParseExact(part, "yyyyMMddHHmmssfff",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var dt))
        {
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }
        return DateTime.UtcNow;
    }
}
