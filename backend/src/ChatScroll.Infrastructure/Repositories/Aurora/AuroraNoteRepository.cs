using System.Globalization;
using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;
using ChatScroll.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ChatScroll.Infrastructure.Repositories.Aurora;

public class AuroraNoteRepository : INoteRepository
{
    private readonly ChatScrollDbContext _db;
    private readonly IAiService _aiService;

    public AuroraNoteRepository(ChatScrollDbContext db, IAiService aiService)
    {
        _db = db;
        _aiService = aiService;
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

        // Mode 1: tsvector full-text search (DB trigger keeps search_vector current)
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

        if (tsResults.Count >= 3)
            return tsResults;

        // Fallback: ILIKE on title + content (handles unindexed or new notes)
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

        if (merged.Count >= 3)
            return merged;

        // Mode 2: pgvector cosine similarity — pads results when text search is weak
        var embedding = await _aiService.GenerateEmbeddingAsync(query);
        if (embedding.Length == 0)
            return merged;

        var vecStr = '[' + string.Join(",",
            embedding.Select(f => f.ToString("G6", CultureInfo.InvariantCulture))) + ']';

        // vecStr is built from a float[] so no injection risk; cast handled by PostgreSQL
        var vectorResults = await _db.Notes
            .FromSqlInterpolated($"""
                SELECT id, user_id, folder_id, conversation_id, title, original_question, original_answer,
                       clean_content, tags, code_language, view_count, last_viewed_at, created_at, updated_at
                FROM notes
                WHERE user_id = {userId} AND embedding IS NOT NULL
                ORDER BY embedding <=> {vecStr}::vector
                LIMIT 10
                """)
            .AsNoTracking()
            .ToListAsync();

        foreach (var vr in vectorResults)
            if (!merged.Any(n => n.Id == vr.Id))
                merged.Add(vr);

        return merged;
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

        if (tsResults.Count >= 3)
            return tsResults;

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

    private async Task TrySaveEmbeddingAsync(Guid noteId, string text)
    {
        try
        {
            var embedding = await _aiService.GenerateEmbeddingAsync(text);
            if (embedding.Length == 0) return;

            var vecStr = '[' + string.Join(",",
                embedding.Select(f => f.ToString("G6", CultureInfo.InvariantCulture))) + ']';

            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE notes SET embedding = {vecStr}::vector WHERE id = {noteId}");
        }
        catch
        {
            // Embedding is optional — don't fail note creation
        }
    }
}
