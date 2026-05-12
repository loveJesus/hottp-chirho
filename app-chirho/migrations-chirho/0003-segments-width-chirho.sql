-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Migration: rename segments_chirho.x_max_px_chirho -> width_px_chirho.
--
-- segments_chirho is currently empty (Pass 3 has not run yet) so the rename is a
-- pure rename of an unused column. After this migration:
--   - segments_chirho.width_px_chirho holds the span width in line-local px.
--   - segments_chirho.x_min_px_chirho still holds the span left edge in line-local px.
-- This matches the agent JSON shape produced by Pass C and the ImageMagick
-- "-crop WxH+X+Y" arity used by Pass E re-OCR.

ALTER TABLE segments_chirho RENAME COLUMN x_max_px_chirho TO width_px_chirho;
