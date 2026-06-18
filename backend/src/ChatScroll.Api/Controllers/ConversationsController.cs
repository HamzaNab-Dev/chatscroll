using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly IConversationRepository _repository;
    private static readonly Guid MockUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public ConversationsController(IConversationRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var conversations = await _repository.GetByUserIdAsync(MockUserId);
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
        var conversation = await _repository.CreateAsync(new Conversation
        {
            UserId = MockUserId,
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

    [HttpPatch("{id}/title")]
    public async Task<IActionResult> UpdateTitle(Guid id, [FromBody] UpdateTitleRequest request)
    {
        var conversation = await _repository.GetByIdAsync(id, MockUserId);
        if (conversation is null) return NotFound();
        conversation.Title = request.Title;
        conversation.MessageCount = request.MessageCount ?? conversation.MessageCount;
        await _repository.UpdateAsync(conversation);
        return NoContent();
    }

    [HttpGet("{id}/messages")]
    public IActionResult GetMessages(Guid id)
    {
        // Messages are stored client-side in sessionStorage for the mock implementation
        return Ok(Array.Empty<object>());
    }
}

public record CreateConversationRequest(string? Title);
public record UpdateTitleRequest(string Title, int? MessageCount);
