// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Read endpoint for machine OCR suggestions (CRNN+CTC word reader).
 *
 *   GET /api-chirho/ocr-suggestions-chirho?page-id-chirho=N[&bucket-chirho=AUTO]
 *
 * Returns the CRNN suggestions for a page, highest-confidence first, so the
 * editor can surface a one-click "accept OCR" on each word. Suggestions are
 * read-only here; accepting one is a separate word-text-corrected-chirho
 * event (POST /api-chirho/events-chirho) — a machine read never auto-writes
 * words_chirho. Indexed by page via idx ocr_suggestions_page_chirho.
 */

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { ocrSuggestionsChirho } from "$lib/server-chirho/schema-d1-chirho";
import { eq, and, desc } from "drizzle-orm";

export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const pageIdParamChirho = url.searchParams.get("page-id-chirho");
  if (!pageIdParamChirho) error(400, "page-id-chirho required");
  const pageIdChirho = parseInt(pageIdParamChirho, 10);
  if (Number.isNaN(pageIdChirho)) error(400, "page-id-chirho must be a number");
  const bucketChirho = url.searchParams.get("bucket-chirho");

  const whereChirho = bucketChirho
    ? and(
        eq(ocrSuggestionsChirho.pageIdChirho, pageIdChirho),
        eq(ocrSuggestionsChirho.bucketChirho, bucketChirho),
      )
    : eq(ocrSuggestionsChirho.pageIdChirho, pageIdChirho);

  const rowsChirho = await dbChirho
    .select({
      idChirho: ocrSuggestionsChirho.idChirho,
      wordIdChirho: ocrSuggestionsChirho.wordIdChirho,
      suggestedTextChirho: ocrSuggestionsChirho.suggestedTextChirho,
      suggestedScriptChirho: ocrSuggestionsChirho.suggestedScriptChirho,
      confidenceChirho: ocrSuggestionsChirho.confidenceChirho,
      wlcVerdictChirho: ocrSuggestionsChirho.wlcVerdictChirho,
      bucketChirho: ocrSuggestionsChirho.bucketChirho,
      acceptedChirho: ocrSuggestionsChirho.acceptedChirho,
    })
    .from(ocrSuggestionsChirho)
    .where(whereChirho)
    .orderBy(desc(ocrSuggestionsChirho.confidenceChirho));

  return json({ suggestionsChirho: rowsChirho });
};
