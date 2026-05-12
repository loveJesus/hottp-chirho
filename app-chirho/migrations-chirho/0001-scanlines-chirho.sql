-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Migration: Add scanline-based pipeline tables

-- Add reconstructed_text_chirho to pages
ALTER TABLE pages_chirho ADD COLUMN reconstructed_text_chirho TEXT;

-- Scanlines table
CREATE TABLE IF NOT EXISTS scanlines_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id_chirho INTEGER NOT NULL REFERENCES pages_chirho(id_chirho),
  line_index_chirho INTEGER NOT NULL,
  x_min_chirho REAL,
  y_min_chirho REAL,
  x_max_chirho REAL,
  y_max_chirho REAL,
  pdftotext_chirho TEXT,
  reconstructed_text_chirho TEXT,
  image_r2_key_chirho TEXT,
  words_json_chirho TEXT,
  segment_count_chirho INTEGER DEFAULT 0,
  status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
  UNIQUE(page_id_chirho, line_index_chirho)
);

-- Segments table
CREATE TABLE IF NOT EXISTS segments_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  scanline_id_chirho INTEGER NOT NULL REFERENCES scanlines_chirho(id_chirho),
  segment_index_chirho INTEGER NOT NULL,
  word_start_index_chirho INTEGER,
  word_end_index_chirho INTEGER,
  x_min_px_chirho REAL,
  width_px_chirho REAL,
  pdftotext_chirho TEXT,
  ocr_text_chirho TEXT,
  accepted_text_chirho TEXT,
  script_type_chirho TEXT DEFAULT 'unknown-chirho',
  image_r2_key_chirho TEXT,
  status_chirho TEXT NOT NULL DEFAULT 'pending-chirho',
  UNIQUE(scanline_id_chirho, segment_index_chirho)
);

-- Volume profiles table
CREATE TABLE IF NOT EXISTS volume_profiles_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  volume_number_chirho INTEGER NOT NULL UNIQUE,
  profile_name_chirho TEXT,
  garbled_threshold_chirho REAL DEFAULT 0.4,
  detection_strategy_chirho TEXT DEFAULT 'garbled-score-chirho',
  font_hints_json_chirho TEXT,
  notes_chirho TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scanlines_page_chirho ON scanlines_chirho(page_id_chirho);
CREATE INDEX IF NOT EXISTS idx_segments_scanline_chirho ON segments_chirho(scanline_id_chirho);
