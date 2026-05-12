-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16

CREATE TABLE IF NOT EXISTS pages_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  volume_number_chirho INTEGER NOT NULL,
  page_number_chirho INTEGER NOT NULL,
  french_text_chirho TEXT,
  image_path_chirho TEXT,
  snippet_count_chirho INTEGER DEFAULT 0,
  status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
  created_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(volume_number_chirho, page_number_chirho)
);

CREATE TABLE IF NOT EXISTS snippets_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id_chirho INTEGER NOT NULL REFERENCES pages_chirho(id_chirho),
  snippet_index_chirho INTEGER NOT NULL,
  x_min_chirho REAL,
  y_min_chirho REAL,
  x_max_chirho REAL,
  y_max_chirho REAL,
  garbled_text_chirho TEXT,
  image_path_chirho TEXT,
  r2_key_chirho TEXT,
  suggested_text_chirho TEXT,
  accepted_text_chirho TEXT,
  script_type_chirho TEXT DEFAULT 'unknown-chirho',
  status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
  created_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at_chirho TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  snippet_id_chirho INTEGER NOT NULL REFERENCES snippets_chirho(id_chirho),
  reviewer_chirho TEXT NOT NULL,
  action_chirho TEXT NOT NULL,
  previous_text_chirho TEXT,
  new_text_chirho TEXT,
  created_at_chirho TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snippets_page_chirho ON snippets_chirho(page_id_chirho);
CREATE INDEX IF NOT EXISTS idx_snippets_status_chirho ON snippets_chirho(status_chirho);
CREATE INDEX IF NOT EXISTS idx_pages_volume_chirho ON pages_chirho(volume_number_chirho);
CREATE INDEX IF NOT EXISTS idx_reviews_snippet_chirho ON reviews_chirho(snippet_id_chirho);
