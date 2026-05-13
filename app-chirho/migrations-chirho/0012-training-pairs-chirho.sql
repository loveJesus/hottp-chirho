-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16

-- Training-pairs table for the script-classifier CNN and downstream Kraken
-- fine-tuning. Each row is a labeled (image_crop, ground_truth_text,
-- ground_truth_script) example. Sources are tagged so we can weight or
-- filter (e.g. only canonical-recon pairs for highest-confidence training).

CREATE TABLE IF NOT EXISTS training_pairs_chirho (
  id_chirho                   INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Identity of the source word — lets us re-derive the crop from page image
  -- if the cached crop file is ever lost, and lets us link back to events.
  word_id_chirho              INTEGER NOT NULL,
  scanline_id_chirho          INTEGER NOT NULL,
  page_id_chirho              INTEGER NOT NULL,
  vol_chirho                  INTEGER NOT NULL,
  page_num_chirho             INTEGER NOT NULL,
  line_idx_chirho             INTEGER NOT NULL,
  word_idx_chirho             INTEGER NOT NULL,

  -- Bbox of the word in page-image pixel coords (matches words_chirho).
  x_min_chirho                INTEGER NOT NULL,
  y_min_chirho                INTEGER NOT NULL,
  x_max_chirho                INTEGER NOT NULL,
  y_max_chirho                INTEGER NOT NULL,

  -- Filesystem path to the cropped PNG (under workspace-chirho/training-pairs-chirho/).
  -- Decoupled from vision-batches dirs so future re-crops can use a tighter
  -- bbox or different normalization without breaking the link.
  crop_path_chirho            TEXT NOT NULL,

  -- Ground-truth labels.
  text_chirho                 TEXT NOT NULL,
  script_chirho               TEXT NOT NULL,

  -- Where the label came from. Influences training weight / trust:
  --   'canonical-recon-chirho' — WLC/BHS lookup via reconstruct-text pass
  --   'opus-vision-chirho'     — Opus per-word batch (>=0.9 cert applied tier)
  --   'human-chirho'           — confirmed in the editor by a reviewer
  source_chirho               TEXT NOT NULL,

  -- For opus-vision-chirho rows: the model's self-reported certainty (0.0-1.0).
  -- Null for canonical / human rows.
  certainty_chirho            REAL,

  -- What the original tesseract said before correction. Useful for analysis
  -- (which classes of OCR errors recur most?) and for stratified sampling.
  tesseract_was_chirho        TEXT,

  created_at_chirho           TEXT NOT NULL DEFAULT (datetime('now')),

  -- Prevent duplicates if the ETL is re-run.
  UNIQUE(word_id_chirho, source_chirho)
);

CREATE INDEX IF NOT EXISTS training_pairs_script_chirho      ON training_pairs_chirho(script_chirho);
CREATE INDEX IF NOT EXISTS training_pairs_source_chirho      ON training_pairs_chirho(source_chirho);
CREATE INDEX IF NOT EXISTS training_pairs_vol_page_chirho    ON training_pairs_chirho(vol_chirho, page_num_chirho);
