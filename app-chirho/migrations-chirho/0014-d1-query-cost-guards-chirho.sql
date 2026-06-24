-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

-- Keep OCR suggestion reads bounded to a page, and let page+bucket filters return
-- highest-confidence rows without scanning the whole bucket across the corpus.
CREATE INDEX IF NOT EXISTS idx_ocr_suggestions_page_conf_chirho
  ON ocr_suggestions_chirho(page_id_chirho, confidence_chirho DESC);

CREATE INDEX IF NOT EXISTS idx_ocr_suggestions_page_bucket_conf_chirho
  ON ocr_suggestions_chirho(page_id_chirho, bucket_chirho, confidence_chirho DESC);

-- Known-word volume-only paging should not depend on the broader
-- (volume,status,added_at) index when status is not selected.
CREATE INDEX IF NOT EXISTS idx_known_words_vol_addedat_chirho
  ON known_words_chirho(volume_number_chirho, added_at_chirho DESC);
