// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  pagesChirho,
  scanlinesChirho,
  segmentsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq, and } from "drizzle-orm";

/**
 * Assemble full page text from accepted scanlines.
 *
 * For each scanline, we reconstruct the line text from its segments:
 * - French segments: use pdftotext (original text is fine)
 * - Non-French segments: use accepted_text > ocr_text > pdftotext
 *
 * Lines are joined with newlines to form the full page text.
 */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const volumeChirho = url.searchParams.get("volume-chirho");
  const pageChirho = url.searchParams.get("page-chirho");

  if (!volumeChirho || !pageChirho) {
    return json(
      { errorChirho: "Missing volume-chirho or page-chirho" },
      { status: 400 }
    );
  }

  const volumeNumChirho = parseInt(volumeChirho, 10);
  const pageNumChirho = parseInt(pageChirho, 10);

  // Find the page
  const pageResultChirho = await dbChirho
    .select()
    .from(pagesChirho)
    .where(
      and(
        eq(pagesChirho.volumeNumberChirho, volumeNumChirho),
        eq(pagesChirho.pageNumberChirho, pageNumChirho)
      )
    )
    .limit(1);

  if (pageResultChirho.length === 0) {
    return json({ errorChirho: "Page not found" }, { status: 404 });
  }

  const pageDataChirho = pageResultChirho[0]!;

  // ONE JOIN to fetch every scanline + segment for this page in one round-trip.
  // Indexed by idx_scanlines_page_chirho + idx_segments_scanline_chirho.
  type JoinedRowChirho = {
    scanlineIdChirho: number;
    lineIndexChirho: number;
    pdftotextChirho: string | null;
    segScriptTypeChirho: string | null;
    segPdftotextChirho: string | null;
    segOcrTextChirho: string | null;
    segAcceptedTextChirho: string | null;
    segIndexChirho: number | null;
  };
  const joinedRowsChirho: JoinedRowChirho[] = await dbChirho
    .select({
      scanlineIdChirho: scanlinesChirho.idChirho,
      lineIndexChirho: scanlinesChirho.lineIndexChirho,
      pdftotextChirho: scanlinesChirho.pdftotextChirho,
      segScriptTypeChirho: segmentsChirho.scriptTypeChirho,
      segPdftotextChirho: segmentsChirho.pdftotextChirho,
      segOcrTextChirho: segmentsChirho.ocrTextChirho,
      segAcceptedTextChirho: segmentsChirho.acceptedTextChirho,
      segIndexChirho: segmentsChirho.segmentIndexChirho,
    })
    .from(scanlinesChirho)
    .leftJoin(
      segmentsChirho,
      eq(segmentsChirho.scanlineIdChirho, scanlinesChirho.idChirho)
    )
    .where(eq(scanlinesChirho.pageIdChirho, pageDataChirho.idChirho))
    .orderBy(scanlinesChirho.lineIndexChirho, segmentsChirho.segmentIndexChirho);

  // Group rows by scanline in memory and assemble per-line text.
  const linesMapChirho = new Map<
    number,
    { lineIndexChirho: number; pdftotextChirho: string | null; segmentTextsChirho: string[] }
  >();
  for (const rowChirho of joinedRowsChirho) {
    let bucketChirho = linesMapChirho.get(rowChirho.scanlineIdChirho);
    if (!bucketChirho) {
      bucketChirho = {
        lineIndexChirho: rowChirho.lineIndexChirho,
        pdftotextChirho: rowChirho.pdftotextChirho,
        segmentTextsChirho: [],
      };
      linesMapChirho.set(rowChirho.scanlineIdChirho, bucketChirho);
    }
    if (rowChirho.segIndexChirho !== null) {
      const textChirho =
        rowChirho.segScriptTypeChirho === "french-chirho"
          ? rowChirho.segPdftotextChirho ?? ""
          : rowChirho.segAcceptedTextChirho ??
            rowChirho.segOcrTextChirho ??
            rowChirho.segPdftotextChirho ??
            "";
      bucketChirho.segmentTextsChirho.push(textChirho);
    }
  }

  const reconstructedLinesChirho: string[] = [];
  const sortedLinesChirho = [...linesMapChirho.values()].sort(
    (aChirho, bChirho) => aChirho.lineIndexChirho - bChirho.lineIndexChirho
  );
  for (const bucketChirho of sortedLinesChirho) {
    if (bucketChirho.segmentTextsChirho.length === 0) {
      reconstructedLinesChirho.push(bucketChirho.pdftotextChirho ?? "");
    } else {
      reconstructedLinesChirho.push(bucketChirho.segmentTextsChirho.join(" "));
    }
  }

  const fullTextChirho = reconstructedLinesChirho.join("\n");

  // Optionally save to page record
  if (fullTextChirho.length > 0) {
    await dbChirho
      .update(pagesChirho)
      .set({ reconstructedTextChirho: fullTextChirho })
      .where(eq(pagesChirho.idChirho, pageDataChirho.idChirho));
  }

  return json({
    volumeNumberChirho: volumeNumChirho,
    pageNumberChirho: pageNumChirho,
    reconstructedTextChirho: fullTextChirho,
    lineCountChirho: reconstructedLinesChirho.length,
  });
};
