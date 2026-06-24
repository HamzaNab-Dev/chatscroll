using ChatScroll.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ApiControllerBase
{
    private readonly ChatScrollDbContext _db;

    public UsersController(ChatScrollDbContext db) => _db = db;

    /// <summary>
    /// Returns the current user's profile and live Aurora counts.
    /// Creates or upgrades the user row from Cognito JWT claims on first call.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var (userId, email, displayName) = GetCallerInfo();
        await _db.EnsureUserExistsAsync(userId, email, displayName);

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        var totalScrolls       = await _db.Notes.CountAsync(n => n.UserId == userId);
        var totalFolders       = await _db.Folders.CountAsync(f => f.UserId == userId);
        var totalConversations = await _db.Conversations.CountAsync(c => c.UserId == userId);

        return Ok(new
        {
            id                 = user.Id,
            email              = user.Email,
            displayName        = user.DisplayName,
            plan               = user.Plan,
            createdAt          = user.CreatedAt,
            totalScrolls,
            totalFolders,
            totalConversations,
        });
    }

    /// <summary>Updates display name in Aurora.</summary>
    [HttpPatch("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return BadRequest(new { error = "displayName is required." });

        var userId = GetUserId();
        var user   = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

        user.DisplayName = request.DisplayName.Trim();
        user.UpdatedAt   = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { id = user.Id, displayName = user.DisplayName });
    }

    /// <summary>
    /// Re-parents all data from an anonymous browser session to the authenticated Cognito account.
    /// Requires a valid JWT. Only operates on placeholder rows whose email ends in
    /// @anonymous.chatscroll.app. Runs once per browser — caller removes cs_user_id from
    /// localStorage on success.
    /// </summary>
    [HttpPost("me/migrate-anonymous")]
    public async Task<IActionResult> MigrateAnonymous([FromBody] MigrateAnonymousRequest request)
    {
        // Require a real Cognito JWT — anonymous sessions cannot call this
        var auth = Request.Headers["Authorization"].FirstOrDefault();
        if (auth is null || !auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { error = "Authentication required." });

        if (!Guid.TryParse(request.AnonymousUserId, out var anonId))
            return BadRequest(new { error = "Invalid anonymousUserId." });

        var cognitoId = GetUserId();

        // Guard: never migrate a user onto themselves
        if (anonId == cognitoId)
            return Ok(new { migrated = false, recordsMigrated = 0 });

        // Security: only migrate genuine anonymous placeholder rows
        var anonUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == anonId);
        if (anonUser is null)
            return Ok(new { migrated = false, recordsMigrated = 0 });
        if (!anonUser.Email.EndsWith("@anonymous.chatscroll.app", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Target user is not an anonymous account." });

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var folders       = await _db.Database.ExecuteSqlInterpolatedAsync($"UPDATE folders          SET user_id = {cognitoId} WHERE user_id = {anonId}");
            var notes         = await _db.Database.ExecuteSqlInterpolatedAsync($"UPDATE notes            SET user_id = {cognitoId} WHERE user_id = {anonId}");
            var conversations = await _db.Database.ExecuteSqlInterpolatedAsync($"UPDATE conversations    SET user_id = {cognitoId} WHERE user_id = {anonId}");
            var history       = await _db.Database.ExecuteSqlInterpolatedAsync($"UPDATE question_history SET user_id = {cognitoId} WHERE user_id = {anonId}");
            await _db.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM users WHERE id = {anonId}");
            await tx.CommitAsync();
            return Ok(new { migrated = true, recordsMigrated = folders + notes + conversations + history });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}

public record UpdateMeRequest(string? DisplayName);
public record MigrateAnonymousRequest(string? AnonymousUserId);
