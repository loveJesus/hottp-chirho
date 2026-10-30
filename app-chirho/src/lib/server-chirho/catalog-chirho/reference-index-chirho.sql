-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
-- Paired DDL for find-chirho.ts, beside its query like review-chirho's
-- reading-evidence-index-chirho.sql (the inherited flat migration directory is
-- full and production was seeded outside migration tracking — do not replay the
-- historical migration set on production).
--
-- Partial covering index for reference search: most segments carry no
-- canonical reference (236 of 1,925 today; the same shape is expected at full
-- corpus scale), so the index holds only referenced rows. Both find queries
-- state canonical_reference_chirho IS NOT NULL so SQLite accepts the partial
-- index; scanline_id_chirho makes the segment side covering.
--
-- Applied in the subsequent 2026-10-30 reader-password release. The Phase-5
-- pre-deploy gate confirms on production, read-only, that EXPLAIN QUERY PLAN
-- matches the local proof in
-- spec-chirho/page-reader-checks-chirho/find-chirho/find-d1-chirho.ts before
-- any full-corpus load. Without the index the queries stay correct but scan.
CREATE INDEX IF NOT EXISTS idx_segments_canonical_reference_chirho
  ON segments_chirho (canonical_reference_chirho, scanline_id_chirho)
  WHERE canonical_reference_chirho IS NOT NULL;
