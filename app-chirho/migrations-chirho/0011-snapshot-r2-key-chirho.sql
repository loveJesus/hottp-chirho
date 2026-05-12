-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16

-- D1 caps single statements around ~100KB; per-page snapshots exceed that.
-- Move the bulky JSON to R2 and keep only the key on D1.

ALTER TABLE page_snapshots_chirho ADD COLUMN underlay_r2_key_chirho TEXT;
CREATE INDEX IF NOT EXISTS page_snapshots_r2_chirho
  ON page_snapshots_chirho(underlay_r2_key_chirho);
