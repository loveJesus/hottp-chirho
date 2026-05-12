-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Migration: rename scanlines_chirho.x_max_chirho → width_chirho,
--                  scanlines_chirho.y_max_chirho → height_chirho.
-- Same reason as segments_chirho width rename: width/height invariants are
-- always > 0, ImageMagick crop syntax wants width, and the page editor's
-- overlay positioning is cleaner with (x, y, w, h) instead of (xMin, yMin,
-- xMax, yMax).

ALTER TABLE scanlines_chirho ADD COLUMN width_chirho REAL;
ALTER TABLE scanlines_chirho ADD COLUMN height_chirho REAL;

UPDATE scanlines_chirho
   SET width_chirho = x_max_chirho - x_min_chirho
 WHERE x_max_chirho IS NOT NULL AND x_min_chirho IS NOT NULL;

UPDATE scanlines_chirho
   SET height_chirho = y_max_chirho - y_min_chirho
 WHERE y_max_chirho IS NOT NULL AND y_min_chirho IS NOT NULL;

ALTER TABLE scanlines_chirho DROP COLUMN x_max_chirho;
ALTER TABLE scanlines_chirho DROP COLUMN y_max_chirho;
