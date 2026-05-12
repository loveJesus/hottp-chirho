-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Migration: known_words_chirho — dynamic French-acceptance dictionary that
-- supplements the static Hunspell `fr` dict with project-specific entries the
-- agent (or a human) confirms as French during review (proper nouns, OCR-fix
-- whitelists, scholarly loanwords).
--
-- volume_number_chirho = 0 means GLOBAL (applies to every volume).
-- Non-zero values scope an entry to one volume so e.g. vol-2 author names
-- don't leak into vol-5 acceptance.

CREATE TABLE IF NOT EXISTS known_words_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  word_chirho TEXT NOT NULL,
  category_chirho TEXT NOT NULL DEFAULT 'unknown-chirho',
  volume_number_chirho INTEGER NOT NULL DEFAULT 0,
  added_at_chirho TEXT NOT NULL DEFAULT (datetime('now')),
  added_by_chirho TEXT,
  notes_chirho TEXT
);

-- Composite uniqueness: same word can exist once globally and/or once per volume,
-- but never duplicated within the same scope.
CREATE UNIQUE INDEX IF NOT EXISTS idx_known_words_word_vol_chirho
  ON known_words_chirho(word_chirho, volume_number_chirho);

-- Fast lookup by word alone when iterating Pass C candidates.
CREATE INDEX IF NOT EXISTS idx_known_words_word_chirho
  ON known_words_chirho(word_chirho);

-- Retrieval by category (e.g. "show me all proper nouns the agent has confirmed").
CREATE INDEX IF NOT EXISTS idx_known_words_cat_chirho
  ON known_words_chirho(category_chirho, volume_number_chirho);
