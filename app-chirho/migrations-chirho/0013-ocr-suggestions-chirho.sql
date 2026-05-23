-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16

-- Machine OCR suggestions from the CRNN+CTC word reader. One row per
-- (word, model): a suggested reading + confidence + WLC verdict + triage
-- bucket. The editor surfaces high-confidence WLC-exact suggestions for
-- one-click accept; accepting one emits the normal
-- word-text-corrected-chirho event, so the event log + words_chirho
-- projection are unchanged. Kept SEPARATE from words_chirho so a machine
-- suggestion never auto-overwrites a human / canonical reading — it is
-- only ever applied through an explicit reviewer action.

CREATE TABLE IF NOT EXISTS ocr_suggestions_chirho (
  id_chirho                INTEGER PRIMARY KEY AUTOINCREMENT,

  -- The word this suggestion is for (page-image bbox match at load time).
  word_id_chirho           INTEGER NOT NULL,
  page_id_chirho           INTEGER NOT NULL,

  -- The model's reading + declared script.
  suggested_text_chirho    TEXT NOT NULL,
  suggested_script_chirho  TEXT NOT NULL DEFAULT 'hebrew-chirho',

  -- Mean max-softmax over emitted CTC steps, in [0,1].
  confidence_chirho        REAL NOT NULL,

  -- WLC-membership of the reading: 'exact' | 'substr' | 'ABSENT'.
  wlc_verdict_chirho       TEXT NOT NULL,

  -- Triage bucket: 'AUTO' (auto-accept tier) | 'REVIEW' | 'REJECT'.
  bucket_chirho            TEXT NOT NULL,

  -- Which model produced it (lets newer models supersede older suggestions).
  model_chirho             TEXT NOT NULL,

  -- Provenance: the corpus crop filename the read came from.
  crop_chirho              TEXT,

  -- 1 once a reviewer has accepted it (then a word-text-corrected event
  -- carries the actual write to words_chirho).
  accepted_chirho          INTEGER NOT NULL DEFAULT 0,

  created_at_chirho        TEXT NOT NULL DEFAULT (datetime('now')),

  -- Idempotent re-load: one suggestion per word per model.
  UNIQUE(word_id_chirho, model_chirho)
);

CREATE INDEX IF NOT EXISTS ocr_suggestions_page_chirho
  ON ocr_suggestions_chirho(page_id_chirho);
CREATE INDEX IF NOT EXISTS ocr_suggestions_bucket_chirho
  ON ocr_suggestions_chirho(bucket_chirho);
CREATE INDEX IF NOT EXISTS ocr_suggestions_word_chirho
  ON ocr_suggestions_chirho(word_id_chirho);
