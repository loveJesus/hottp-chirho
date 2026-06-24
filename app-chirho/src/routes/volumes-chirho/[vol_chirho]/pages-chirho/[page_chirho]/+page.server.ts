// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Page-level overview: full page image + list of non-French segments grouped
 * by line. Single JOIN of scanlines × segments, filtered to non-French; we
 * group results in app code, no N+1 loop.
 */

import type { PageServerLoad } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { parseRequiredPositiveIntParamChirho } from "$lib/server-chirho/query-params-chirho";
import {
  pagesChirho,
  scanlinesChirho,
  segmentsChirho,
  pageSnapshotsChirho,
  eventsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq, and, ne, gt, sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";

export interface NonFrenchSegmentChirho {
  segmentIdChirho: number;
  scanlineIdChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  scriptTypeChirho: string | null;
  acceptedTextChirho: string | null;
  ocrTextChirho: string | null;
  xMinPxChirho: number | null;
  widthPxChirho: number | null;
  statusChirho: string;
  imageR2KeyChirho: string | null;
  scanlineImageR2KeyChirho: string | null;
  scanlineXMinChirho: number | null;
  scanlineWidthChirho: number | null;
  scanlineYMinChirho: number | null;
  scanlineHeightChirho: number | null;
}

export const load: PageServerLoad = async ({ params, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const volumeNumChirho = parseRequiredPositiveIntParamChirho(params.vol_chirho, "vol_chirho");
  const pageNumChirho = parseRequiredPositiveIntParamChirho(params.page_chirho, "page_chirho");

  const pageRowsChirho = await dbChirho
    .select()
    .from(pagesChirho)
    .where(
      and(
        eq(pagesChirho.volumeNumberChirho, volumeNumChirho),
        eq(pagesChirho.pageNumberChirho, pageNumChirho)
      )
    )
    .limit(1);
  if (pageRowsChirho.length === 0) error(404, "Page not found");
  const pageDataChirho = pageRowsChirho[0]!;

  // ONE JOIN — pulls every non-French segment + its parent scanline metadata.
  // Indexed via idx_scanlines_page_chirho + idx_segments_scanline_chirho.
  const nonFrenchRowsChirho: NonFrenchSegmentChirho[] = await dbChirho
    .select({
      segmentIdChirho: segmentsChirho.idChirho,
      scanlineIdChirho: segmentsChirho.scanlineIdChirho,
      lineIndexChirho: scanlinesChirho.lineIndexChirho,
      segmentIndexChirho: segmentsChirho.segmentIndexChirho,
      scriptTypeChirho: segmentsChirho.scriptTypeChirho,
      acceptedTextChirho: segmentsChirho.acceptedTextChirho,
      ocrTextChirho: segmentsChirho.ocrTextChirho,
      xMinPxChirho: segmentsChirho.xMinPxChirho,
      widthPxChirho: segmentsChirho.widthPxChirho,
      statusChirho: segmentsChirho.statusChirho,
      imageR2KeyChirho: segmentsChirho.imageR2KeyChirho,
      canonicalSourceChirho: segmentsChirho.canonicalSourceChirho,
      canonicalConfidenceChirho: segmentsChirho.canonicalConfidenceChirho,
      canonicalReferenceChirho: segmentsChirho.canonicalReferenceChirho,
      canonicalDistanceChirho: segmentsChirho.canonicalDistanceChirho,
      scanlineImageR2KeyChirho: scanlinesChirho.imageR2KeyChirho,
      scanlineXMinChirho: scanlinesChirho.xMinChirho,
      scanlineWidthChirho: scanlinesChirho.widthChirho,
      scanlineYMinChirho: scanlinesChirho.yMinChirho,
      scanlineHeightChirho: scanlinesChirho.heightChirho,
    })
    .from(segmentsChirho)
    .innerJoin(
      scanlinesChirho,
      eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho)
    )
    .where(
      and(
        eq(scanlinesChirho.pageIdChirho, pageDataChirho.idChirho),
        ne(segmentsChirho.scriptTypeChirho, "french-chirho")
      )
    )
    .orderBy(scanlinesChirho.lineIndexChirho, segmentsChirho.segmentIndexChirho);

  // Cheap nav lookup — two index seeks via idx_pages_volume_chirho.
  const navRowsChirho = await dbChirho
    .select({
      prevChirho: sql<number | null>`(
        SELECT page_number_chirho FROM pages_chirho
        WHERE volume_number_chirho = ${volumeNumChirho}
          AND page_number_chirho < ${pageNumChirho}
        ORDER BY page_number_chirho DESC
        LIMIT 1
      )`,
      nextChirho: sql<number | null>`(
        SELECT page_number_chirho FROM pages_chirho
        WHERE volume_number_chirho = ${volumeNumChirho}
          AND page_number_chirho > ${pageNumChirho}
        ORDER BY page_number_chirho ASC
        LIMIT 1
      )`,
    })
    .from(sql`(SELECT 1)`)
    .limit(1);

  const fullPageR2KeyChirho = `vol-${volumeNumChirho}-chirho/page-${String(pageNumChirho).padStart(4, "0")}-chirho/full-page-chirho.png`;

  // Event-sourced editor underlay: ONE snapshot row read + the small tail of
  // events since that snapshot. The snapshot embeds every scanline + word +
  // segment + canonical reference, so the editor doesn't pay for N×words D1
  // row-reads per page render. Snapshot BODY lives on R2 (D1 statement-size
  // limit forbids the multi-hundred-KB JSON); D1 stores only the key.
  const snapshotMetaRowsChirho = await dbChirho
    .select({
      idChirho: pageSnapshotsChirho.idChirho,
      snapshotSeqChirho: pageSnapshotsChirho.snapshotSeqChirho,
      underlayR2KeyChirho: pageSnapshotsChirho.underlayR2KeyChirho,
      underlayJsonChirho: pageSnapshotsChirho.underlayJsonChirho,
    })
    .from(pageSnapshotsChirho)
    .where(eq(pageSnapshotsChirho.pageIdChirho, pageDataChirho.idChirho))
    .limit(1);
  const snapshotMetaChirho = snapshotMetaRowsChirho[0] ?? null;
  let snapshotChirho: { snapshotSeqChirho: number; underlayJsonChirho: string } | null = null;
  if (snapshotMetaChirho) {
    let underlayJsonChirho = snapshotMetaChirho.underlayJsonChirho ?? "";
    // Fetch full JSON from R2 if the D1 row is just a pointer.
    if ((!underlayJsonChirho || underlayJsonChirho.length === 0) && snapshotMetaChirho.underlayR2KeyChirho) {
      const r2ObjectChirho = await platform!.env.R2_CHIRHO.get(snapshotMetaChirho.underlayR2KeyChirho);
      if (r2ObjectChirho) {
        underlayJsonChirho = await r2ObjectChirho.text();
      }
    }
    snapshotChirho = {
      snapshotSeqChirho: snapshotMetaChirho.snapshotSeqChirho,
      underlayJsonChirho,
    };
  }
  const snapshotSeqChirho = snapshotChirho?.snapshotSeqChirho ?? 0;

  const eventTailChirho = await dbChirho
    .select()
    .from(eventsChirho)
    .where(
      and(
        eq(eventsChirho.pageIdChirho, pageDataChirho.idChirho),
        gt(eventsChirho.seqChirho, snapshotSeqChirho),
      ),
    )
    .orderBy(eventsChirho.seqChirho)
    .limit(2000);

  return {
    volumeNumberChirho: volumeNumChirho,
    pageNumberChirho: pageNumChirho,
    pageDataChirho,
    nonFrenchSegmentsChirho: nonFrenchRowsChirho,
    fullPageR2KeyChirho,
    prevPageChirho: navRowsChirho[0]?.prevChirho ?? null,
    nextPageChirho: navRowsChirho[0]?.nextChirho ?? null,
    reconstructedTextChirho: pageDataChirho.reconstructedTextChirho ?? "",
    snapshotChirho,
    eventTailChirho,
  };
};
