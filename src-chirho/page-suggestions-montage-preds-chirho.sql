-- For God so loved the world that he gave his only begotten Son,
-- that whoever believes in him should not perish but have eternal life. John 3:16
--
-- Export the per-page CRNN suggestions (the gated, high-confidence reads the
-- editor surfaces) into the preds-JSON shape that make_ocr_montage_chirho.py
-- --kind heldout consumes, so we can eyeball "how well does the app read the
-- pages I click" against WLC-gold. Honest gold: when the verdict is `exact`
-- the read IS the verified WLC word (use it); otherwise fall back to the
-- WLC-canonical reconstruction (current_text_chirho, source canonical-chirho).
-- crop_chirho already names a file under workspace-chirho/hebrew-corpus-chirho/,
-- which is exactly where the montage resolves crops — no re-cropping needed.
--
-- Regenerate (against the local prod-clone D1) + render:
--   DB=app-chirho/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
--   sqlite3 -noheader "$DB" < src-chirho/page-suggestions-montage-preds-chirho.sql \
--     > /tmp/page-suggestions-preds-chirho.json
--   workspace-chirho/classifier-venv-chirho/bin/python3 \
--     src-chirho/make_ocr_montage_chirho.py --kind heldout \
--     --preds /tmp/page-suggestions-preds-chirho.json \
--     --out workspace-chirho/word-ocr-chirho/montage-pp148-152-chirho.png \
--     --cols 6 --max 48 --title "CRNN suggestions in the app ..."
--
-- Idempotent + page-agnostic: as more pages load suggestions, this picks them
-- up automatically (page-ordered, reading order within each line).

SELECT json_object('predsChirho', json_group_array(json(record_json_chirho)))
FROM (
  SELECT json_object(
    'cropChirho',    o_chirho.crop_chirho,
    'predChirho',    o_chirho.suggested_text_chirho,
    'goldChirho',    CASE WHEN o_chirho.wlc_verdict_chirho = 'exact'
                          THEN o_chirho.suggested_text_chirho
                          ELSE w_chirho.current_text_chirho END,
    'correctChirho', json(CASE WHEN o_chirho.wlc_verdict_chirho = 'exact'
                               THEN 'true' ELSE 'false' END)
  ) AS record_json_chirho
  FROM ocr_suggestions_chirho AS o_chirho
  JOIN words_chirho AS w_chirho ON w_chirho.id_chirho = o_chirho.word_id_chirho
  JOIN pages_chirho AS p_chirho ON p_chirho.id_chirho = o_chirho.page_id_chirho
  ORDER BY p_chirho.page_number_chirho,
           w_chirho.scanline_id_chirho,
           w_chirho.word_index_chirho
);
