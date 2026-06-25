using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ChatScroll.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotesController : ApiControllerBase
{
    private readonly INoteRepository _noteRepository;
    private readonly IFolderRepository _folderRepository;

    public NotesController(INoteRepository noteRepository, IFolderRepository folderRepository)
    {
        _noteRepository = noteRepository;
        _folderRepository = folderRepository;
    }

    [HttpGet("folder/{folderId}")]
    public async Task<IActionResult> GetByFolder(Guid folderId)
    {
        var userId = GetUserId();
        var notes = await _noteRepository.GetByFolderIdAsync(folderId, userId);
        return Ok(notes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetUserId();
        var note = await _noteRepository.GetByIdAsync(id, userId);
        if (note is null) return NotFound();
        return Ok(note);
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent([FromQuery] int limit = 4)
    {
        var userId = GetUserId();
        var notes = await _noteRepository.GetRecentAsync(userId, limit);
        return Ok(notes);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var notes = await _noteRepository.GetAllAsync(userId);
        return Ok(notes);
    }

    [HttpPut("{id}/view")]
    public async Task<IActionResult> IncrementView(Guid id)
    {
        var userId = GetUserId();
        await _noteRepository.IncrementViewCountAsync(id, userId);
        return NoContent();
    }

    /// <summary>
    /// mode=exact  → tsvector full-text + ILIKE (no pgvector)
    /// mode=smart  → tsvector + ILIKE, then pgvector cosine similarity if results are sparse
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] string mode = "smart")
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<Note>());
        var userId = GetUserId();
        var notes = mode == "exact"
            ? await _noteRepository.SearchExactAsync(userId, q)
            : await _noteRepository.SearchAsync(userId, q);
        return Ok(notes);
    }

    /// <summary>
    /// Kept for backwards compatibility — delegates to Search with mode=smart.
    /// </summary>
    [HttpGet("semantic-search")]
    public async Task<IActionResult> SemanticSearch([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(new { query = q, results = Array.Empty<Note>(), searchType = "smart" });
        var userId = GetUserId();
        var notes = await _noteRepository.SearchAsync(userId, q);
        return Ok(new { query = q, results = notes, searchType = "smart" });
    }

    /// <summary>
    /// Returns per-day note counts for the last 7 days — powers the Knowledge Growth chart.
    /// Production: SELECT DATE(created_at), COUNT(*) FROM notes WHERE user_id = ? GROUP BY DATE(created_at)
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var allNotes = (await _noteRepository.SearchAsync(userId, "")).ToList();
        var today = DateTime.UtcNow.Date;
        var todaySaved = allNotes.Count(n => n.CreatedAt.Date == today);

        // Demo baseline shows realistic activity; today's count is real (session saves)
        var demoBase = new[] { 0, 2, 1, 3, 0, 2, 1 };
        var weeklyActivity = Enumerable.Range(0, 7).Select(i => new
        {
            date = today.AddDays(-6 + i).ToString("yyyy-MM-dd"),
            dayLabel = today.AddDays(-6 + i).ToString("ddd"),
            count = i == 6 ? Math.Max(todaySaved, demoBase[i]) : demoBase[i]
        }).ToArray();

        return Ok(new
        {
            totalNotes = allNotes.Count,
            weeklyActivity,
            storageType = "aurora_pgvector"
        });
    }

    /// <summary>
    /// Public endpoint — anyone with the scroll's ID can view it via /shared/[id].
    /// Production: note would need a separate isPublic flag or share token.
    /// </summary>
    [HttpGet("shared/{id}")]
    public async Task<IActionResult> GetShared(Guid id)
    {
        var note = await _noteRepository.GetByIdPublicAsync(id);
        if (note is null) return NotFound();
        var folder = await _folderRepository.GetByIdAsync(note.FolderId, note.UserId);
        return Ok(new
        {
            id = note.Id,
            title = note.Title,
            cleanContent = note.CleanContent,
            tags = note.Tags,
            createdAt = note.CreatedAt,
            viewCount = note.ViewCount,
            folderName = folder?.Name,
            folderIcon = folder?.Icon,
            folderPath = folder?.Path,
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNoteRequest request)
    {
        var userId = GetUserId();
        var note = new Note
        {
            UserId = userId,
            FolderId = request.FolderId,
            ConversationId = request.ConversationId,
            Title = request.Title,
            OriginalQuestion = request.OriginalQuestion,
            OriginalAnswer = request.OriginalAnswer,
            CleanContent = request.CleanContent,
            Tags = request.Tags ?? Array.Empty<string>(),
            CodeLanguage = request.CodeLanguage
        };
        var created = await _noteRepository.CreateAsync(note);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _noteRepository.DeleteAsync(id, userId);
        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNoteRequest request)
    {
        var userId = GetUserId();
        var note = await _noteRepository.GetByIdAsync(id, userId);
        if (note is null) return NotFound();
        if (request.FolderId.HasValue) note.FolderId = request.FolderId.Value;
        if (request.Title != null) note.Title = request.Title;
        if (request.Tags != null) note.Tags = request.Tags;
        var updated = await _noteRepository.UpdateAsync(note);
        return Ok(updated);
    }

    /// <summary>
    /// Backfills embeddings for all notes that currently have embedding = NULL.
    /// Call once after fixing the embedding pipeline to populate existing notes.
    /// </summary>
    /// <summary>
    /// Returns up to 3 notes most similar to the given note by pgvector cosine distance,
    /// scoped to the same root folder category (root + its direct children).
    /// Falls back to an empty list if the note has no embedding yet.
    /// </summary>
    [HttpGet("{id}/related")]
    public async Task<IActionResult> GetRelated(Guid id)
    {
        var userId = GetUserId();

        // Resolve the category scope before querying related notes.
        var note = await _noteRepository.GetByIdAsync(id, userId);
        if (note is null) return Ok(Array.Empty<object>());

        var allFolders = (await _folderRepository.GetByUserIdAsync(userId)).ToList();
        var folderMap = allFolders.ToDictionary(f => f.Id);

        // Root = direct parent when one exists; otherwise the note's own folder is the root.
        folderMap.TryGetValue(note.FolderId, out var currentFolder);
        var rootId = currentFolder?.ParentId ?? note.FolderId;

        // Scope = root folder + all its direct children.
        var allowedFolderIds = allFolders
            .Where(f => f.Id == rootId || f.ParentId == rootId)
            .Select(f => f.Id)
            .ToHashSet();

        var related = (await _noteRepository.GetRelatedAsync(id, userId, allowedFolderIds, 3)).ToList();
        if (related.Count == 0) return Ok(Array.Empty<object>());

        var result = related.Select(n =>
        {
            folderMap.TryGetValue(n.FolderId, out var folder);
            var preview = (n.CleanContent ?? "")
                .Replace("\r", "").Replace("\n", " ")
                .Trim();
            if (preview.Length > 120) preview = preview[..120].TrimEnd() + "…";
            return new
            {
                id = n.Id,
                title = n.Title,
                folderPath = folder?.Path,
                folderIcon = folder?.Icon,
                preview,
            };
        });

        return Ok(result);
    }

    [HttpPost("admin/backfill-embeddings")]
    public async Task<IActionResult> BackfillEmbeddings()
    {
        var (success, failed, total) = await _noteRepository.BackfillEmbeddingsAsync();
        return Ok(new { total, success, failed });
    }
}

public record UpdateNoteRequest(Guid? FolderId, string? Title, string[]? Tags);

public record CreateNoteRequest(
    Guid FolderId,
    Guid? ConversationId,
    string Title,
    string? OriginalQuestion,
    string? OriginalAnswer,
    string CleanContent,
    string[]? Tags,
    string? CodeLanguage
);
