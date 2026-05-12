-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Migration: Pass A line-approval columns + index gaps surfaced by audit.

-- Page-level line-approval tracking (set by Pass B reviewer)
ALTER TABLE pages_chirho ADD COLUMN lines_approved_at_chirho TEXT;
ALTER TABLE pages_chirho ADD COLUMN lines_rejection_note_chirho TEXT;

-- Composite UNIQUE for snippets — covers WHERE page_id ORDER BY snippet_index
-- (mirrors what scanlines/segments already get from their UNIQUE composites)
CREATE UNIQUE INDEX IF NOT EXISTS idx_snippets_page_idx_chirho
  ON snippets_chirho(page_id_chirho, snippet_index_chirho);

-- Pass B index page filters by (volume, approval state). IS NULL filtering on
-- the trailing column still uses the index for narrowing down by volume first.
CREATE INDEX IF NOT EXISTS idx_pages_vol_approved_chirho
  ON pages_chirho(volume_number_chirho, lines_approved_at_chirho);
