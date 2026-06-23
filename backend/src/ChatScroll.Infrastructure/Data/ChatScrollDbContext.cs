using ChatScroll.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatScroll.Infrastructure.Data;

public class ChatScrollDbContext : DbContext
{
    public ChatScrollDbContext(DbContextOptions<ChatScrollDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<QuestionHistory> QuestionHistories => Set<QuestionHistory>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.HasPostgresExtension("uuid-ossp")
          .HasPostgresExtension("ltree")
          .HasPostgresExtension("pg_trgm")
          .HasPostgresExtension("vector");

        // ── users ──────────────────────────────────────────────────────────────────
        mb.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.CognitoSub).HasColumnName("cognito_sub").IsRequired();
            e.Property(x => x.Email).HasColumnName("email").IsRequired();
            e.Property(x => x.DisplayName).HasColumnName("display_name").IsRequired();
            e.Property(x => x.AvatarUrl).HasColumnName("avatar_url");
            e.Property(x => x.Plan).HasColumnName("plan").HasDefaultValue("free");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        // ── folders ────────────────────────────────────────────────────────────────
        mb.Entity<Folder>(e =>
        {
            e.ToTable("folders");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            // ltree stored as plain string — Npgsql serialises/deserialises transparently
            e.Property(x => x.Path).HasColumnName("path").HasColumnType("ltree").IsRequired();
            e.Property(x => x.Icon).HasColumnName("icon");
            e.Property(x => x.Color).HasColumnName("color");
            e.Property(x => x.ParentId).HasColumnName("parent_id");
            e.Property(x => x.NoteCount).HasColumnName("note_count").HasDefaultValue(0);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.User).WithMany(u => u.Folders)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Parent).WithMany(f => f.Children)
                .HasForeignKey(x => x.ParentId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        // ── notes ──────────────────────────────────────────────────────────────────
        mb.Entity<Note>(e =>
        {
            e.ToTable("notes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.FolderId).HasColumnName("folder_id");
            e.Property(x => x.ConversationId).HasColumnName("conversation_id");
            e.Property(x => x.Title).HasColumnName("title").IsRequired();
            e.Property(x => x.OriginalQuestion).HasColumnName("original_question");
            e.Property(x => x.OriginalAnswer).HasColumnName("original_answer");
            e.Property(x => x.CleanContent).HasColumnName("clean_content").IsRequired();
            // Npgsql maps string[] ↔ text[] natively
            e.Property(x => x.Tags).HasColumnName("tags").HasColumnType("text[]");
            e.Property(x => x.CodeLanguage).HasColumnName("code_language");
            e.Property(x => x.ViewCount).HasColumnName("view_count").HasDefaultValue(0);
            e.Property(x => x.LastViewedAt).HasColumnName("last_viewed_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            // search_vector and embedding are DB-managed (trigger + raw SQL); not tracked by EF
            e.HasOne(x => x.User).WithMany(u => u.Notes)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Folder).WithMany(f => f.Notes)
                .HasForeignKey(x => x.FolderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Conversation).WithMany(c => c.Notes)
                .HasForeignKey(x => x.ConversationId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        // ── conversations ──────────────────────────────────────────────────────────
        mb.Entity<Conversation>(e =>
        {
            e.ToTable("conversations");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Title).HasColumnName("title");
            e.Property(x => x.SuggestedFolder).HasColumnName("suggested_folder").HasColumnType("ltree");
            e.Property(x => x.MessageCount).HasColumnName("message_count").HasDefaultValue(0);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.User).WithMany(u => u.Conversations)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── question_history ───────────────────────────────────────────────────────
        mb.Entity<QuestionHistory>(e =>
        {
            e.ToTable("question_history");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.QuestionText).HasColumnName("question_text").IsRequired();
            e.Property(x => x.MatchedNoteId).HasColumnName("matched_note_id");
            e.Property(x => x.AskedAt).HasColumnName("asked_at");
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.MatchedNote).WithMany()
                .HasForeignKey(x => x.MatchedNoteId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });
    }

    /// <summary>
    /// Upserts a minimal user row so foreign-key constraints on conversations, folders, and notes
    /// are satisfied for browser-generated UUIDs. Uses ON CONFLICT DO NOTHING — safe under
    /// concurrent requests for the same new user.
    /// </summary>
    public async Task EnsureUserExistsAsync(Guid userId)
    {
        var email = $"{userId}@anonymous.chatscroll.app";
        await Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO users (id, cognito_sub, email, display_name, plan, created_at, updated_at)
            VALUES ({userId}, '', {email}, 'Anonymous User', 'free', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
            """);
    }
}
