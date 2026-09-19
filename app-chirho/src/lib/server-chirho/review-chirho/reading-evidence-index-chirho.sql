-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
-- Paired schema prerequisite for reading-evidence-chirho.ts. Index only, no
-- content/status migration. Prod was seeded outside migration tracking; apply
-- this exact DDL before release, never replay old migrations. Kept beside its
-- query because the inherited flat migration history is already at 15 entries.
CREATE INDEX IF NOT EXISTS events_segment_receipt_chirho
ON events_chirho (
  page_id_chirho,
  (CASE WHEN json_valid(payload_json_chirho) THEN json_extract(payload_json_chirho, '$.segmentIdChirho') END),
  seq_chirho DESC
)
WHERE event_type_chirho = 'segment-reading-confirmed-chirho'
  AND aggregate_type_chirho = 'segment-chirho';
