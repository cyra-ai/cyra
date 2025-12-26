-- Single persistent conversation session database schema

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'thought')),
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  metadata TEXT,
  memory_type TEXT NOT NULL DEFAULT 'short-term' CHECK (memory_type IN ('short-term', 'long-term')),
  is_summarized INTEGER DEFAULT 0
);

-- Index for efficient timestamp queries
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_memory_type ON messages(memory_type);
CREATE INDEX IF NOT EXISTS idx_messages_summarized ON messages(is_summarized);

CREATE TABLE IF NOT EXISTS message_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_message_id INTEGER NOT NULL,
  end_message_id INTEGER NOT NULL,
  summary TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (start_message_id) REFERENCES messages(id),
  FOREIGN KEY (end_message_id) REFERENCES messages(id)
);

CREATE INDEX IF NOT EXISTS idx_summaries_range ON message_summaries(start_message_id, end_message_id);

CREATE TABLE IF NOT EXISTS message_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL UNIQUE,
  embedding TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Index for efficient embedding lookups
CREATE INDEX IF NOT EXISTS idx_embeddings_message_id ON message_embeddings(message_id);
