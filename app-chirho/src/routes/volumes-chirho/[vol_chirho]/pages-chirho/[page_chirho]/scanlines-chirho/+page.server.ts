// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Page editor / line review server load.
 *
 * Single JOIN query loads page + all its scanlines + all their segments — no
 * N+1 loops. D1 bills per row read so we want exactly one query that touches
 * the rows we need (≤ ~70 lines × ≤ ~10 segments = ~700 rows worst-case for
 * the densest pilot pages).
 */

import type { PageServerLoad } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  pagesChirho,
  scanlinesChirho,
  segmentsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq, and, sql } from "drizzle-orm";
import { error } from "@sveltejs/kit";

type SegmentRowChirho = typeof segmentsChirho.$inferSelect;
type ScanlineRowChirho = typeof scanlinesChirho.$inferSelect;

export const load: PageServerLoad = async ({ params, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const volumeNumChirho = parseInt(params.vol_chirho, 10);
  const pageNumChirho = parseInt(params.page_chirho, 10);

  // Page lookup. Indexed by UNIQUE(volume_number_chirho, page_number_chirho).
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

  // ONE JOIN to fetch all scanlines + all segments in a single round-trip.
  // Indexed by idx_scanlines_page_chirho + idx_segments_scanline_chirho.
  const joinedRowsChirho = await dbChirho
    .select({
      scanlineChirho: scanlinesChirho,
      segmentChirho: segmentsChirho,
    })
    .from(scanlinesChirho)
    .leftJoin(
      segmentsChirho,
      eq(segmentsChirho.scanlineIdChirho, scanlinesChirho.idChirho)
    )
    .where(eq(scanlinesChirho.pageIdChirho, pageDataChirho.idChirho))
    .orderBy(scanlinesChirho.lineIndexChirho, segmentsChirho.segmentIndexChirho);

  // Group in app code (free) instead of issuing N queries (expensive).
  const scanlinesResultChirho: ScanlineRowChirho[] = [];
  const segmentsByLineChirho: Record<number, SegmentRowChirho[]> = {};
  const seenScanlineIdsChirho = new Set<number>();

  for (const rowChirho of joinedRowsChirho) {
    const sChirho = rowChirho.scanlineChirho;
    if (!seenScanlineIdsChirho.has(sChirho.idChirho)) {
      seenScanlineIdsChirho.add(sChirho.idChirho);
      scanlinesResultChirho.push(sChirho);
      segmentsByLineChirho[sChirho.idChirho] = [];
    }
    if (rowChirho.segmentChirho) {
      segmentsByLineChirho[sChirho.idChirho]!.push(rowChirho.segmentChirho);
    }
  }

  // Prev / next page nav — only 2 page numbers needed (cheap), via indexed scan.
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

  return {
    volumeNumberChirho: volumeNumChirho,
    pageNumberChirho: pageNumChirho,
    pageDataChirho,
    scanlinesChirho: scanlinesResultChirho,
    segmentsByLineChirho,
    fullPageR2KeyChirho,
    prevPageChirho: navRowsChirho[0]?.prevChirho ?? null,
    nextPageChirho: navRowsChirho[0]?.nextChirho ?? null,
  };
};
