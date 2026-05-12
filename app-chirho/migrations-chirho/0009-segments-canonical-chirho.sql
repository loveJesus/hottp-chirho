-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16

-- Add canonical-source + confidence tracking so the page editor can color-code
-- segments by how trustworthy their accepted_text is (BHS/LXX exact match vs
-- agent guess vs human-confirmed).

ALTER TABLE segments_chirho ADD COLUMN canonical_source_chirho TEXT;
ALTER TABLE segments_chirho ADD COLUMN canonical_confidence_chirho TEXT;
ALTER TABLE segments_chirho ADD COLUMN canonical_reference_chirho TEXT;
ALTER TABLE segments_chirho ADD COLUMN canonical_distance_chirho INTEGER;

CREATE INDEX IF NOT EXISTS segments_canonical_conf_chirho
  ON segments_chirho (canonical_confidence_chirho);
