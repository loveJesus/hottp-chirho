-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Migration: indexes for SvelteKit view query patterns.
--
-- The viewer/editor exposes these queries that we want to keep cheap on D1
-- (D1 bills per row read, so unindexed scans get expensive fast):
--
--   1. Volume index: aggregate page+segment counts per volume
--      → covered by idx_pages_volume_chirho + idx_segments_scanline_chirho
--
--   2. Page list per volume, ordered by page number, with status filter
--      → UNIQUE(volume_number_chirho, page_number_chirho) handles ordering;
--        adding (volume_number_chirho, status_chirho) for status-filtered
--        page lists ("show all approved pages in vol 2")
--
--   3. Page detail: load scanlines + segments via JOIN
--      → idx_scanlines_page_chirho + idx_segments_scanline_chirho already cover
--
--   4. known_words manager: list-filter-by-status, paginate by added_at DESC
--      → adding (status_chirho, added_at_chirho) for "latest N flagged"
--      → adding (volume_number_chirho, status_chirho, added_at_chirho) for vol-scoped
--
--   5. Flag-and-rescan: find scanlines whose words_json mentions a flagged word
--      → linear scan (LIKE on JSON text) — accept slowness; rescans are rare.
--        If we ever need fast rescans, add a derived scanline_words_chirho table.

CREATE INDEX IF NOT EXISTS idx_pages_vol_status_chirho
  ON pages_chirho(volume_number_chirho, status_chirho);

CREATE INDEX IF NOT EXISTS idx_known_words_status_addedat_chirho
  ON known_words_chirho(status_chirho, added_at_chirho);

CREATE INDEX IF NOT EXISTS idx_known_words_vol_status_addedat_chirho
  ON known_words_chirho(volume_number_chirho, status_chirho, added_at_chirho);
