-- ============================================
-- ChatScroll Aurora PostgreSQL Schema v1
-- AWS H0 Hackathon 2026
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_sub     VARCHAR(255) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    plan            VARCHAR(20) DEFAULT 'free',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Folders (hierarchical with ltree)
CREATE TABLE IF NOT EXISTS folders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    path            LTREE NOT NULL,
    icon            VARCHAR(10),
    color           VARCHAR(7),
    parent_id       UUID REFERENCES folders(id) ON DELETE CASCADE,
    note_count      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, path)
);

CREATE INDEX IF NOT EXISTS idx_folders_path_gist ON folders USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    suggested_folder LTREE,
    message_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);

-- Notes (the core of ChatScroll)
CREATE TABLE IF NOT EXISTS notes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id           UUID NOT NULL REFERENCES folders(id),
    conversation_id     UUID REFERENCES conversations(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    original_question   TEXT,
    original_answer     TEXT,
    clean_content       TEXT NOT NULL,
    embedding           VECTOR(1024),
    search_vector       TSVECTOR,
    tags                TEXT[] DEFAULT '{}',
    code_language       VARCHAR(50),
    view_count          INTEGER DEFAULT 0,
    last_viewed_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_embedding ON notes USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_notes_title_trgm ON notes USING GIN(title gin_trgm_ops);

-- Auto-update search vector trigger
CREATE OR REPLACE FUNCTION update_note_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.clean_content, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_search_update
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_note_search_vector();

-- Question history (for "already know this" detector)
CREATE TABLE IF NOT EXISTS question_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_text       TEXT NOT NULL,
    question_embedding  VECTOR(1024),
    matched_note_id     UUID REFERENCES notes(id) ON DELETE SET NULL,
    asked_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qhistory_embedding ON question_history
    USING ivfflat(question_embedding vector_cosine_ops);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50),
    entity_type     VARCHAR(50),
    entity_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_user_time ON activity_log(user_id, created_at DESC);
