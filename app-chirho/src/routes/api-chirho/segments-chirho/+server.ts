// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  segmentsChirho,
  scanlinesChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq } from "drizzle-orm";

/** Get segments for a scanline */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const scanlineIdChirho = url.searchParams.get("scanline-id-chirho");
  const pageIdChirho = url.searchParams.get("page-id-chirho");

  if (scanlineIdChirho) {
    // Get segments for a specific scanline
    const resultChirho = await dbChirho
      .select()
      .from(segmentsChirho)
      .where(
        eq(segmentsChirho.scanlineIdChirho, parseInt(scanlineIdChirho, 10))
      )
      .orderBy(segmentsChirho.segmentIndexChirho);

    return json(resultChirho);
  }

  if (pageIdChirho) {
    // ONE JOIN: scanlines on this page → their segments. No N+1 loop.
    // Indexed by idx_scanlines_page_chirho + idx_segments_scanline_chirho.
    const allSegmentsChirho = await dbChirho
      .select({
        idChirho: segmentsChirho.idChirho,
        scanlineIdChirho: segmentsChirho.scanlineIdChirho,
        segmentIndexChirho: segmentsChirho.segmentIndexChirho,
        wordStartIndexChirho: segmentsChirho.wordStartIndexChirho,
        wordEndIndexChirho: segmentsChirho.wordEndIndexChirho,
        xMinPxChirho: segmentsChirho.xMinPxChirho,
        widthPxChirho: segmentsChirho.widthPxChirho,
        pdftotextChirho: segmentsChirho.pdftotextChirho,
        ocrTextChirho: segmentsChirho.ocrTextChirho,
        acceptedTextChirho: segmentsChirho.acceptedTextChirho,
        scriptTypeChirho: segmentsChirho.scriptTypeChirho,
        imageR2KeyChirho: segmentsChirho.imageR2KeyChirho,
        statusChirho: segmentsChirho.statusChirho,
      })
      .from(segmentsChirho)
      .innerJoin(
        scanlinesChirho,
        eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho)
      )
      .where(eq(scanlinesChirho.pageIdChirho, parseInt(pageIdChirho, 10)))
      .orderBy(scanlinesChirho.lineIndexChirho, segmentsChirho.segmentIndexChirho);

    return json(allSegmentsChirho);
  }

  return json({ errorChirho: "Missing scanline-id-chirho or page-id-chirho" }, { status: 400 });
};

/** Update a segment (accept text, adjust boundaries) */
export const PATCH: RequestHandler = async ({ request, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const bodyChirho = (await request.json()) as {
    segmentIdChirho?: number;
    acceptedTextChirho?: string;
    statusChirho?: string;
    wordStartIndexChirho?: number;
    wordEndIndexChirho?: number;
    xMinPxChirho?: number;
    widthPxChirho?: number;
  };

  const { segmentIdChirho } = bodyChirho;

  if (!segmentIdChirho) {
    return json(
      { errorChirho: "Missing segmentIdChirho" },
      { status: 400 }
    );
  }

  const updateDataChirho: Record<string, unknown> = {};

  if (bodyChirho.acceptedTextChirho !== undefined) {
    updateDataChirho.acceptedTextChirho = bodyChirho.acceptedTextChirho;
  }
  if (bodyChirho.statusChirho) {
    updateDataChirho.statusChirho = bodyChirho.statusChirho;
  }
  if (bodyChirho.wordStartIndexChirho !== undefined) {
    updateDataChirho.wordStartIndexChirho = bodyChirho.wordStartIndexChirho;
  }
  if (bodyChirho.wordEndIndexChirho !== undefined) {
    updateDataChirho.wordEndIndexChirho = bodyChirho.wordEndIndexChirho;
  }
  if (bodyChirho.xMinPxChirho !== undefined) {
    updateDataChirho.xMinPxChirho = bodyChirho.xMinPxChirho;
  }
  if (bodyChirho.widthPxChirho !== undefined) {
    updateDataChirho.widthPxChirho = bodyChirho.widthPxChirho;
  }

  if (Object.keys(updateDataChirho).length > 0) {
    await dbChirho
      .update(segmentsChirho)
      .set(updateDataChirho)
      .where(eq(segmentsChirho.idChirho, segmentIdChirho));
  }

  return json({ successChirho: true });
};
