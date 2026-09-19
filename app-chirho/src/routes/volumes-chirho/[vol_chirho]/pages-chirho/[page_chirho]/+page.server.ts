// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Full-page reading workspace plus optional advanced word/language tools.
 * One indexed scanline/segment JOIN includes French context and empty lines;
 * current word rows carry raw CAS state and matching review evidence. Only
 * advanced legacy tools consume the snapshot/event tail.
 */

import type { PageServerLoad } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { loadPageLinesChirho } from "$lib/server-chirho/page-lines-chirho";
import { loadPageWordsChirho } from "$lib/server-chirho/review-chirho/reading-evidence-chirho";
import { parseRequiredPositiveIntParamChirho } from "$lib/server-chirho/query-params-chirho";
import {
  pagesChirho,
  pageSnapshotsChirho,
  eventsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq, and, gt, sql } from "drizzle-orm";
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

export const load: PageServerLoad = async ({ params, platform, locals, url }) => {
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

  // Capture the cursor BEFORE current records. Concurrent changes can then
  // conservatively reject a save, never authorize a stale read via a newer tail.
  const cursorRowsChirho = await dbChirho.select({ seqChirho: sql<number>`coalesce(max(${eventsChirho.seqChirho}), 0)` }).from(eventsChirho).where(eq(eventsChirho.pageIdChirho, pageDataChirho.idChirho));
  const observedEventSeqChirho = cursorRowsChirho[0]?.seqChirho ?? 0;

  // Include French context and lines without segments. Keep the legacy
  // non-French projection for the advanced tools without another query.
  const readerLinesChirho = await loadPageLinesChirho(dbChirho, pageDataChirho.idChirho);
  const readerWordsChirho = await loadPageWordsChirho(dbChirho, pageDataChirho.idChirho);
  const nonFrenchRowsChirho: NonFrenchSegmentChirho[] = readerLinesChirho.flatMap(({ scanlineChirho, segmentsChirho }) =>
    segmentsChirho.filter((segmentChirho) => segmentChirho.scriptTypeChirho !== "french-chirho").map((segmentChirho) => ({
      ...segmentChirho,
      segmentIdChirho: segmentChirho.idChirho,
      lineIndexChirho: scanlineChirho.lineIndexChirho,
      scanlineImageR2KeyChirho: scanlineChirho.imageR2KeyChirho,
      scanlineXMinChirho: scanlineChirho.xMinChirho,
      scanlineWidthChirho: scanlineChirho.widthChirho,
      scanlineYMinChirho: scanlineChirho.yMinChirho,
      scanlineHeightChirho: scanlineChirho.heightChirho,
    })));

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
  const legacyToolsChirho = volumeNumChirho !== 5 && url.searchParams.get('view-chirho') === 'tools-chirho';
  const snapshotMetaRowsChirho = legacyToolsChirho ? await dbChirho
    .select({
      idChirho: pageSnapshotsChirho.idChirho,
      snapshotSeqChirho: pageSnapshotsChirho.snapshotSeqChirho,
      underlayR2KeyChirho: pageSnapshotsChirho.underlayR2KeyChirho,
      underlayJsonChirho: pageSnapshotsChirho.underlayJsonChirho,
    })
    .from(pageSnapshotsChirho)
    .where(eq(pageSnapshotsChirho.pageIdChirho, pageDataChirho.idChirho))
    .limit(1) : [];
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

  const eventTailChirho = legacyToolsChirho ? await dbChirho
    .select()
    .from(eventsChirho)
    .where(
      and(
        eq(eventsChirho.pageIdChirho, pageDataChirho.idChirho),
        gt(eventsChirho.seqChirho, snapshotSeqChirho),
      ),
    )
    .orderBy(eventsChirho.seqChirho)
    .limit(2001) : [];

  return {
    volumeNumberChirho: volumeNumChirho,
    pageNumberChirho: pageNumChirho,
    pageDataChirho,
    readerLinesChirho,
    readerWordsChirho,
    nonFrenchSegmentsChirho: nonFrenchRowsChirho,
    fullPageR2KeyChirho,
    prevPageChirho: navRowsChirho[0]?.prevChirho ?? null,
    nextPageChirho: navRowsChirho[0]?.nextChirho ?? null,
    reconstructedTextChirho: pageDataChirho.reconstructedTextChirho ?? "",
    snapshotChirho,
    eventTailChirho: eventTailChirho.slice(0, 2000),
    eventTailCompleteChirho: eventTailChirho.length <= 2000,
    observedEventSeqChirho,
    signedInChirho: !!locals.reviewerChirho,
  };
};
