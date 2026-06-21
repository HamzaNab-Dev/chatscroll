using ChatScroll.Core.Entities;
using ChatScroll.Core.Interfaces;

namespace ChatScroll.Infrastructure.Repositories.Mock;

public class MockNoteRepository : INoteRepository
{
    internal static readonly List<Note> _notes = new()
    {
        new Note
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            FolderId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Title = "SOLID Principles in Software Design",
            OriginalQuestion = "What are SOLID principles in software design?",
            CleanContent = "## SOLID Principles\n\n**S** — Single Responsibility: A class should have one reason to change.\n\n**O** — Open/Closed: Open for extension, closed for modification.\n\n**L** — Liskov Substitution: Subtypes must be substitutable for their base types.\n\n**I** — Interface Segregation: Prefer small, focused interfaces over large ones.\n\n**D** — Dependency Inversion: Depend on abstractions, not concretions.\n\n```csharp\n// Dependency Inversion example\npublic class OrderService\n{\n    private readonly IPaymentProcessor _processor;\n    public OrderService(IPaymentProcessor processor) => _processor = processor;\n}\n```",
            Tags = new[] { "solid", "oop", "design-patterns", "architecture" },
            CodeLanguage = "csharp"
        },
        new Note
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            FolderId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Title = "LINQ Joins in EF Core",
            OriginalQuestion = "How do I write a LINQ join in Entity Framework Core?",
            CleanContent = "## LINQ Joins in EF Core\n\nUse `.Join()` or navigation properties.\n\n```csharp\nvar result = context.Orders\n    .Join(context.Customers,\n        o => o.CustomerId,\n        c => c.Id,\n        (o, c) => new { o, c })\n    .ToList();\n```\n\n**Tip:** Prefer navigation properties over explicit joins when possible.",
            Tags = new[] { "linq", "ef-core", "dotnet", "database" },
            CodeLanguage = "csharp"
        },
        new Note
        {
            Id = Guid.NewGuid(),
            UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            FolderId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Title = "Metformin Side Effects",
            OriginalQuestion = "What are the common side effects of Metformin?",
            CleanContent = "## Metformin Side Effects\n\n**Common:**\n- Nausea and vomiting\n- Diarrhea (especially when starting)\n- Stomach upset\n\n**Take with food** to reduce GI side effects.\n\n**Serious (rare):** Lactic acidosis — seek immediate care if muscle pain + difficulty breathing.",
            Tags = new[] { "medicine", "diabetes", "medication" }
        }
    };

    public Task<IEnumerable<Note>> GetByFolderIdAsync(Guid folderId, Guid userId) =>
        Task.FromResult(_notes.Where(n => n.FolderId == folderId && n.UserId == userId));

    public Task<Note?> GetByIdAsync(Guid id, Guid userId) =>
        Task.FromResult(_notes.FirstOrDefault(n => n.Id == id && n.UserId == userId));

    public Task<IEnumerable<Note>> SearchAsync(Guid userId, string query) =>
        Task.FromResult(_notes.Where(n =>
            n.UserId == userId &&
            (n.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
             n.CleanContent.Contains(query, StringComparison.OrdinalIgnoreCase) ||
             n.Tags.Any(t => t.Contains(query, StringComparison.OrdinalIgnoreCase)))));

    public Task<IEnumerable<Note>> SearchExactAsync(Guid userId, string query) =>
        Task.FromResult(_notes.Where(n =>
            n.UserId == userId &&
            (string.IsNullOrWhiteSpace(query) ||
             n.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
             n.CleanContent.Contains(query, StringComparison.OrdinalIgnoreCase) ||
             n.Tags.Any(t => t.Contains(query, StringComparison.OrdinalIgnoreCase)))));

    public Task<IEnumerable<Note>> GetRecentAsync(Guid userId, int limit) =>
        Task.FromResult(_notes
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .AsEnumerable());

    public Task<IEnumerable<Note>> GetAllAsync(Guid userId) =>
        Task.FromResult(_notes
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .AsEnumerable());

    public Task<Note> CreateAsync(Note note)
    {
        note.Id = Guid.NewGuid();
        note.CreatedAt = DateTime.UtcNow;
        note.UpdatedAt = DateTime.UtcNow;
        _notes.Add(note);
        return Task.FromResult(note);
    }

    public Task<Note> UpdateAsync(Note note)
    {
        var existing = _notes.FirstOrDefault(n => n.Id == note.Id);
        if (existing != null)
        {
            existing.Title = note.Title;
            existing.CleanContent = note.CleanContent;
            existing.Tags = note.Tags;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        return Task.FromResult(note);
    }

    public Task DeleteAsync(Guid id, Guid userId)
    {
        var note = _notes.FirstOrDefault(n => n.Id == id && n.UserId == userId);
        if (note != null) _notes.Remove(note);
        return Task.CompletedTask;
    }

    public Task IncrementViewCountAsync(Guid id, Guid userId)
    {
        var note = _notes.FirstOrDefault(n => n.Id == id && n.UserId == userId);
        if (note != null)
        {
            note.ViewCount++;
            note.LastViewedAt = DateTime.UtcNow;
        }
        return Task.CompletedTask;
    }

    public Task<(int success, int failed, int total)> BackfillEmbeddingsAsync() =>
        Task.FromResult((0, 0, 0));
}
