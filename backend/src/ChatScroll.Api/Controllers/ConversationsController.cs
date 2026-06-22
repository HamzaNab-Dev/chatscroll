using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ApiControllerBase
{
    private readonly IConversationRepository _repository;
    private readonly IDynamoDbChatRepository _dynamoDb;

    public ConversationsController(IConversationRepository repository, IDynamoDbChatRepository dynamoDb)
    {
        _repository = repository;
        _dynamoDb = dynamoDb;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var conversations = await _repository.GetByUserIdAsync(userId);
        return Ok(conversations
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new
            {
                id = c.Id,
                title = c.Title ?? "New Chat",
                messageCount = c.MessageCount,
                updatedAt = c.UpdatedAt
            }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateConversationRequest request)
    {
        var userId = GetUserId();
        var conversation = await _repository.CreateAsync(new Conversation
        {
            UserId = userId,
            Title = request.Title
        });
        return Ok(new
        {
            id = conversation.Id,
            title = conversation.Title ?? "New Chat",
            messageCount = 0,
            updatedAt = conversation.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _repository.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpPatch("{id}/title")]
    public async Task<IActionResult> UpdateTitle(Guid id, [FromBody] UpdateTitleRequest request)
    {
        var userId = GetUserId();
        var conversation = await _repository.GetByIdAsync(id, userId);
        if (conversation is null) return NotFound();
        conversation.Title = request.Title;
        conversation.MessageCount = request.MessageCount ?? conversation.MessageCount;
        await _repository.UpdateAsync(conversation);
        return NoContent();
    }

    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(Guid id)
    {
        var userId = GetUserId();
        var messages = await _dynamoDb.GetConversationAsync(id, userId);
        return Ok(messages.Select(m => new
        {
            role = m.Role,
            content = m.Content,
            timestamp = m.Timestamp
        }));
    }
}

public record CreateConversationRequest(string? Title);
public record UpdateTitleRequest(string Title, int? MessageCount);
