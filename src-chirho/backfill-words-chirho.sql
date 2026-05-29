-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16

-- One-shot backfill: explode each scanline's words_json_chirho into words_chirho rows.
-- Re-runnable: INSERT OR IGNORE on UNIQUE(scanline_id_chirho, word_index_chirho).
-- current_text_chirho seeded to original OCR; is_human_confirmed_chirho=0.

INSERT OR IGNORE INTO words_chirho (
  scanline_id_chirho,
  word_index_chirho,
  x_min_chirho,
  y_min_chirho,
  x_max_chirho,
  y_max_chirho,
  original_ocr_text_chirho,
  original_ocr_script_chirho,
  current_text_chirho,
  current_script_chirho,
  current_source_chirho,
  is_human_confirmed_chirho,
  pending_script_flag_chirho,
  last_event_seq_chirho
)
SELECT
  s.id_chirho                                         AS scanline_id_chirho,
  je.key                                              AS word_index_chirho,
  CAST(json_extract(je.value, '$.xMinChirho') AS REAL) AS x_min_chirho,
  CAST(json_extract(je.value, '$.yMinChirho') AS REAL) AS y_min_chirho,
  CAST(json_extract(je.value, '$.xMaxChirho') AS REAL) AS x_max_chirho,
  CAST(json_extract(je.value, '$.yMaxChirho') AS REAL) AS y_max_chirho,
  json_extract(je.value, '$.textChirho')              AS original_ocr_text_chirho,
  COALESCE(
    json_extract(je.value, '$.scriptHintChirho'),
    'latin-chirho'
  )                                                    AS original_ocr_script_chirho,
  json_extract(je.value, '$.textChirho')              AS current_text_chirho,
  COALESCE(
    json_extract(je.value, '$.scriptHintChirho'),
    'latin-chirho'
  )                                                    AS current_script_chirho,
  'ocr-chirho'                                         AS current_source_chirho,
  0                                                    AS is_human_confirmed_chirho,
  0                                                    AS pending_script_flag_chirho,
  0                                                    AS last_event_seq_chirho
FROM scanlines_chirho s,
     json_each(s.words_json_chirho) je
WHERE s.words_json_chirho IS NOT NULL
  AND json_valid(s.words_json_chirho);
