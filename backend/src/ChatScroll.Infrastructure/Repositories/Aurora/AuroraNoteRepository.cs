using System.Globalization;
using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using ChatScroll.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChatScroll.Infrastructure.Repositories.Aurora;

public class AuroraNoteRepository : INoteRepository
{
    private readonly ChatScrollDbContext _db;
    private readonly IAiService _aiService;
    private readonly ILogger<AuroraNoteRepository> _logger;

    public AuroraNoteRepository(ChatScrollDbContext db, IAiService aiService, ILogger<AuroraNoteRepository> logger)
    {
        _db = db;
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<IEnumerable<Note>> GetAllAsync(Guid userId)
    {
        return await _db.Notes
            .Where(n => n.UserId == userId)
            .AsNoTracking()
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Note>> GetByFolderIdAsync(Guid folderId, Guid userId)
    {
        return await _db.Notes
            .Where(n => n.FolderId == folderId && n.UserId == userId)
            .AsNoTracking()
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Note?> GetByIdAsync(Guid id, Guid userId)
    {
        return await _db.Notes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
    }

    public async Task<IEnumerable<Note>> GetRecentAsync(Guid userId, int limit)
    {
        return await _db.Notes
            .Where(n => n.UserId == userId)
            .AsNoTracking()
            .OrderByDescending(n => n.UpdatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<IEnumerable<Note>> SearchAsync(Guid userId, string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return await GetAllAsync(userId);

        // Run text search and embedding generation in parallel
        var textTask = SearchExactAsync(userId, query);
        var embeddingTask = _aiService.GenerateEmbeddingAsync(query, "RETRIEVAL_QUERY");

        var textResults = await textTask;
        var embedding = await embeddingTask;

        if (embedding.Length == 0)
            return textResults;

        var vecStr = '[' + string.Join(",",
            embedding.Select(f => f.ToString("G6", CultureInfo.InvariantCulture))) + ']';

        // Only include notes whose cosine similarity exceeds 0.4 (1 - distance > 0.4).
        // Results are ordered best-match-first (ascending distance = descending similarity).
        var vectorResults = await _db.Notes
            .FromSqlInterpolated($"""
                SELECT id, user_id, folder_id, conversation_id, title, original_question, original_answer,
                       clean_content, tags, code_language, view_count, last_viewed_at, created_at, updated_at
                FROM notes
                WHERE user_id = {userId}
                  AND embedding IS NOT NULL
                  AND 1 - (embedding <=> {vecStr}::vector) > 0.4
                ORDER BY embedding <=> {vecStr}::vector
                LIMIT 5
                """)
            .AsNoTracking()
            .ToListAsync();

        // Semantic results lead (already ranked by similarity); text-only results trail.
        var semanticIds = vectorResults.Select(n => n.Id).ToHashSet();
        return vectorResults
            .Concat(textResults.Where(n => !semanticIds.Contains(n.Id)))
            .Take(10)
            .ToList();
    }

    public async Task<IEnumerable<Note>> SearchExactAsync(Guid userId, string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return await GetAllAsync(userId);

        var tsResults = await _db.Notes
            .FromSqlInterpolated($"""
                SELECT id, user_id, folder_id, conversation_id, title, original_question, original_answer,
                       clean_content, tags, code_language, view_count, last_viewed_at, created_at, updated_at
                FROM notes
                WHERE user_id = {userId}
                  AND search_vector @@ plainto_tsquery('english', {query})
                ORDER BY ts_rank(search_vector, plainto_tsquery('english', {query})) DESC
                """)
            .AsNoTracking()
            .ToListAsync();

        var likePattern = $"%{query}%";
        var likeResults = await _db.Notes
            .Where(n => n.UserId == userId &&
                   (EF.Functions.ILike(n.Title, likePattern) ||
                    EF.Functions.ILike(n.CleanContent, likePattern)))
            .AsNoTracking()
            .OrderByDescending(n => n.UpdatedAt)
            .ToListAsync();

        var merged = tsResults.ToList();
        foreach (var r in likeResults)
            if (!merged.Any(n => n.Id == r.Id))
                merged.Add(r);

        return merged;
    }

    public async Task<Note> CreateAsync(Note note)
    {
        note.Id = Guid.NewGuid();
        note.CreatedAt = DateTime.UtcNow;
        note.UpdatedAt = DateTime.UtcNow;

        _db.Notes.Add(note);
        await _db.SaveChangesAsync();

        // Persist embedding synchronously — returns immediately when Gemini not configured
        await TrySaveEmbeddingAsync(note.Id, $"{note.Title} {note.CleanContent}");

        return note;
    }

    public async Task<Note> UpdateAsync(Note note)
    {
        note.UpdatedAt = DateTime.UtcNow;
        _db.Notes.Update(note);
        await _db.SaveChangesAsync();
        return note;
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var note = await _db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (note is null) return;

        _db.Notes.Remove(note);
        await _db.SaveChangesAsync();
    }

    public async Task IncrementViewCountAsync(Guid id, Guid userId)
    {
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE notes SET view_count = view_count + 1, last_viewed_at = NOW() WHERE id = {id} AND user_id = {userId}");
    }

    public async Task<(int success, int failed, int total)> BackfillEmbeddingsAsync()
    {
        // Note entity has no Embedding property — use raw SQL to find notes without one
        var notesWithoutEmbeddings = await _db.Notes
            .FromSqlInterpolated($"""
                SELECT id, user_id, folder_id, conversation_id, title, original_question, original_answer,
                       clean_content, tags, code_language, view_count, last_viewed_at, created_at, updated_at
                FROM notes
                WHERE embedding IS NULL
                """)
            .AsNoTracking()
            .ToListAsync();

        int success = 0, failed = 0;

        foreach (var note in notesWithoutEmbeddings)
        {
            try
            {
                var text = $"{note.Title} {note.CleanContent}";
                var embedding = await _aiService.GenerateEmbeddingAsync(text, "RETRIEVAL_DOCUMENT");

                if (embedding.Length == 0)
                {
                    failed++;
                    continue;
                }

                var vecStr = '[' + string.Join(",",
                    embedding.Select(f => f.ToString("G6", CultureInfo.InvariantCulture))) + ']';

                await _db.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE notes SET embedding = {vecStr}::vector WHERE id = {note.Id}");

                success++;
                _logger.LogInformation("Backfilled embedding for note {NoteId} ({Title})", note.Id, note.Title);
            }
            catch (Exception ex)
            {
                failed++;
                _logger.LogError(ex, "Failed to backfill embedding for note {NoteId}", note.Id);
            }
        }

        return (success, failed, notesWithoutEmbeddings.Count);
    }

    private async Task TrySaveEmbeddingAsync(Guid noteId, string text)
    {
        try
        {
            var embedding = await _aiService.GenerateEmbeddingAsync(text, "RETRIEVAL_DOCUMENT");
            if (embedding.Length == 0) return;

            var vecStr = '[' + string.Join(",",
                embedding.Select(f => f.ToString("G6", CultureInfo.InvariantCulture))) + ']';

            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE notes SET embedding = {vecStr}::vector WHERE id = {noteId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save embedding for note {NoteId}", noteId);
        }
    }
}
