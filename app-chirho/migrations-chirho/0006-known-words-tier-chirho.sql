-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Migration: tier status + provenance for known_words_chirho.
--
-- Three tiers via status_chirho:
--   agent-pending-chirho   — auto-added by Pass C agent verdict; not yet human-reviewed
--   human-confirmed-chirho — Pass D reviewer approved
--   flagged-chirho         — suspected wrong; should NOT be auto-accepted; rescan target
--
-- Provenance fields (source_page_id_chirho, source_line_index_chirho) let us
-- trace back where the agent first saw the word, so a "rescan" workflow can
-- find every other line in the volume that uses it and re-classify on demand.

ALTER TABLE known_words_chirho ADD COLUMN status_chirho TEXT NOT NULL DEFAULT 'agent-pending-chirho';
ALTER TABLE known_words_chirho ADD COLUMN source_page_id_chirho INTEGER;
ALTER TABLE known_words_chirho ADD COLUMN source_line_index_chirho INTEGER;
ALTER TABLE known_words_chirho ADD COLUMN confirmed_at_chirho TEXT;
ALTER TABLE known_words_chirho ADD COLUMN confirmed_by_chirho TEXT;

CREATE INDEX IF NOT EXISTS idx_known_words_status_chirho
  ON known_words_chirho(status_chirho, volume_number_chirho);
