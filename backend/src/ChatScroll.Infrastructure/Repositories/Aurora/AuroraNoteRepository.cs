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

    public async Task<Note?> GetByIdPublicAsync(Guid id)
    {
        return await _db.Notes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id);
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

        // Step 1: Get the single best-match note (low threshold — ensures we always find a #1)
        var topResults = await _db.Notes
            .FromSqlInterpolated($"""
                SELECT id, user_id, folder_id, conversation_id, title, original_question, original_answer,
                       clean_content, tags, code_language, view_count, last_viewed_at, created_at, updated_at
                FROM notes
                WHERE user_id = {userId}
                  AND embedding IS NOT NULL
                  AND 1 - (embedding <=> {vecStr}::vector) > 0.5
                ORDER BY embedding <=> {vecStr}::vector
                LIMIT 1
                """)
            .AsNoTracking()
            .ToListAsync();

        if (topResults.Count == 0)
            return textResults;

        var topNote = topResults[0];

        // Step 2: Determine the root folder of the #1 result
        var userFolders = await _db.Folders
            .Where(f => f.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var topFolder = userFolders.FirstOrDefault(f => f.Id == topNote.FolderId);
        if (topFolder == null)
            return new[] { topNote }; // folder was deleted; return just the top result

        var rootSegment = topFolder.Path.Split('.')[0];

        // All folder IDs that belong to the same root subtree
        var rootFolderIds = userFolders
            .Where(f => f.Path == rootSegment || f.Path.StartsWith(rootSegment + '.'))
            .Select(f => f.Id)
            .ToHashSet();

        // Step 3: Get additional candidates with a higher similarity threshold (0.65)
        var topNoteId = topNote.Id;
        var candidates = await _db.Notes
            .FromSqlInterpolated($"""
                SELECT id, user_id, folder_id, conversation_id, title, original_question, original_answer,
                       clean_content, tags, code_language, view_count, last_viewed_at, created_at, updated_at
                FROM notes
                WHERE user_id = {userId}
                  AND embedding IS NOT NULL
                  AND id != {topNoteId}
                  AND 1 - (embedding <=> {vecStr}::vector) > 0.65
                ORDER BY embedding <=> {vecStr}::vector
                LIMIT 10
                """)
            .AsNoTracking()
            .ToListAsync();

        // Step 4: Keep only candidates within the same root folder subtree
        var scoped = candidates.Where(n => rootFolderIds.Contains(n.FolderId)).ToList();

        var results = new List<Note>(capacity: scoped.Count + 1) { topNote };
        results.AddRange(scoped.Take(9));
        return results;
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

    public async Task<IEnumerable<Note>> GetRelatedAsync(Guid noteId, Guid userId, IReadOnlyCollection<Guid> allowedFolderIds, int limit = 3)
    {
        if (allowedFolderIds.Count == 0) return Enumerable.Empty<Note>();

        var folderArray = allowedFolderIds.ToArray();
        // CTE fetches the source embedding once; cross-joining with a zero-row CTE
        // (note not found or no embedding) naturally returns zero rows — no error thrown.
        return await _db.Notes
            .FromSqlInterpolated($"""
                WITH cur AS (
                    SELECT embedding FROM notes WHERE id = {noteId} AND user_id = {userId}
                )
                SELECT n.id, n.user_id, n.folder_id, n.conversation_id, n.title, n.original_question, n.original_answer,
                       n.clean_content, n.tags, n.code_language, n.view_count, n.last_viewed_at, n.created_at, n.updated_at
                FROM notes n, cur
                WHERE n.user_id = {userId}
                  AND n.id != {noteId}
                  AND n.embedding IS NOT NULL
                  AND cur.embedding IS NOT NULL
                  AND n.folder_id = ANY({folderArray})
                ORDER BY n.embedding <=> cur.embedding
                LIMIT {limit}
                """)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Note> CreateAsync(Note note)
    {
        await _db.EnsureUserExistsAsync(note.UserId);

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
