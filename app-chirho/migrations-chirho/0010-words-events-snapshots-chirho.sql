-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16

-- Event-sourced word editor:
--   words_chirho            : per-word row with bbox + OCR underlay + projection columns
--   events_chirho           : append-only audit log of human/AI actions
--   page_snapshots_chirho   : per-page self-contained JSON underlay (cheap hot-path read)

-- =================== words_chirho ===================
CREATE TABLE IF NOT EXISTS words_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  scanline_id_chirho INTEGER NOT NULL REFERENCES scanlines_chirho(id_chirho),
  word_index_chirho INTEGER NOT NULL,

  -- Bounding box (page-image pixel coords)
  x_min_chirho REAL,
  y_min_chirho REAL,
  x_max_chirho REAL,
  y_max_chirho REAL,

  -- OCR underlay (set by pipeline, never rewritten once is_human_confirmed=1)
  original_ocr_text_chirho TEXT,
  original_ocr_script_chirho TEXT,

  -- Projection columns (derived from event replay)
  current_text_chirho TEXT,
  current_script_chirho TEXT,
  -- 'ocr-chirho' | 'human-chirho' | 'vision-chirho' | 'canonical-chirho'
  current_source_chirho TEXT DEFAULT 'ocr-chirho',
  is_human_confirmed_chirho INTEGER NOT NULL DEFAULT 0,
  pending_script_flag_chirho INTEGER NOT NULL DEFAULT 0,
  last_event_seq_chirho INTEGER NOT NULL DEFAULT 0,

  created_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(scanline_id_chirho, word_index_chirho)
);

CREATE INDEX IF NOT EXISTS words_scanline_chirho
  ON words_chirho(scanline_id_chirho, word_index_chirho);

-- Partial index: pipeline guard hot path ("which words must I leave alone")
CREATE INDEX IF NOT EXISTS words_human_confirmed_chirho
  ON words_chirho(scanline_id_chirho)
  WHERE is_human_confirmed_chirho = 1;

-- Partial index: vision queue ("which words still need script-flag resolution")
CREATE INDEX IF NOT EXISTS words_pending_script_chirho
  ON words_chirho(scanline_id_chirho)
  WHERE pending_script_flag_chirho = 1;

-- =================== events_chirho ===================
CREATE TABLE IF NOT EXISTS events_chirho (
  seq_chirho INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Denormalized for index-narrowed reads (editor's hot path)
  page_id_chirho INTEGER NOT NULL REFERENCES pages_chirho(id_chirho),
  scanline_id_chirho INTEGER REFERENCES scanlines_chirho(id_chirho),
  word_id_chirho INTEGER REFERENCES words_chirho(id_chirho),

  -- 'word-chirho' | 'scanline-chirho' | 'page-chirho'
  aggregate_type_chirho TEXT NOT NULL,

  -- 'word-text-corrected-chirho' | 'word-script-flagged-chirho' |
  -- 'word-script-set-chirho'     | 'word-verified-chirho'       |
  -- 'word-vision-applied-chirho' | 'scanline-needs-ai-review-chirho' |
  -- 'scanline-verified-chirho'   | 'page-completed-chirho'
  event_type_chirho TEXT NOT NULL,

  payload_json_chirho TEXT NOT NULL,
  reviewer_chirho TEXT,
  created_at_chirho TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Editor hot path: load all events for a page since snapshot
CREATE INDEX IF NOT EXISTS events_page_seq_chirho
  ON events_chirho(page_id_chirho, seq_chirho);

-- Per-word history panel (only events that target a specific word)
CREATE INDEX IF NOT EXISTS events_word_seq_chirho
  ON events_chirho(word_id_chirho, seq_chirho)
  WHERE word_id_chirho IS NOT NULL;

-- Per-scanline history panel
CREATE INDEX IF NOT EXISTS events_scanline_seq_chirho
  ON events_chirho(scanline_id_chirho, seq_chirho)
  WHERE scanline_id_chirho IS NOT NULL;

-- Type-scoped queues (open needs-ai-review, vision queue, etc.)
CREATE INDEX IF NOT EXISTS events_type_seq_chirho
  ON events_chirho(event_type_chirho, seq_chirho);

-- =================== page_snapshots_chirho ===================
CREATE TABLE IF NOT EXISTS page_snapshots_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id_chirho INTEGER NOT NULL UNIQUE REFERENCES pages_chirho(id_chirho),

  -- Highest events_chirho.seq_chirho at the moment this snapshot was built.
  -- Editor merges snapshot + (events WHERE seq > snapshot_seq).
  snapshot_seq_chirho INTEGER NOT NULL DEFAULT 0,

  -- Self-contained per-page underlay: scanlines + words + bboxes + OCR + canonical matches.
  underlay_json_chirho TEXT NOT NULL,

  built_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at_chirho TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS page_snapshots_updated_chirho
  ON page_snapshots_chirho(updated_at_chirho);
