// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Volume index page — show all 5 volumes with progress badges.
 *
 * Two indexed aggregations only — no per-volume followups, no per-page loops.
 *   - pages_chirho: GROUP BY volume_number_chirho (uses idx_pages_volume_chirho)
 *   - segments_chirho via JOIN to scanlines_chirho via JOIN to pages_chirho
 *     (uses idx_segments_scanline_chirho + idx_scanlines_page_chirho)
 */

import type { PageServerLoad } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  pagesChirho,
  scanlinesChirho,
  segmentsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { count, eq, sql } from "drizzle-orm";

export const load: PageServerLoad = async ({ platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const pageStatsChirho = await dbChirho
    .select({
      volumeNumberChirho: pagesChirho.volumeNumberChirho,
      totalPagesChirho: count(pagesChirho.idChirho),
      approvedPagesChirho: sql<number>`SUM(CASE WHEN ${pagesChirho.linesApprovedAtChirho} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(pagesChirho)
    .groupBy(pagesChirho.volumeNumberChirho)
    .orderBy(pagesChirho.volumeNumberChirho);

  const segmentStatsChirho = await dbChirho
    .select({
      volumeNumberChirho: pagesChirho.volumeNumberChirho,
      totalSegmentsChirho: count(segmentsChirho.idChirho),
      nonFrenchSegmentsChirho: sql<number>`SUM(CASE WHEN ${segmentsChirho.scriptTypeChirho} <> 'french-chirho' THEN 1 ELSE 0 END)`,
    })
    .from(segmentsChirho)
    .innerJoin(scanlinesChirho, eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho))
    .innerJoin(pagesChirho, eq(pagesChirho.idChirho, scanlinesChirho.pageIdChirho))
    .groupBy(pagesChirho.volumeNumberChirho);

  const summariesChirho = pageStatsChirho.map((volChirho) => {
    const segInfoChirho = segmentStatsChirho.find(
      (sChirho) => sChirho.volumeNumberChirho === volChirho.volumeNumberChirho
    );
    return {
      volumeNumberChirho: volChirho.volumeNumberChirho,
      totalPagesChirho: volChirho.totalPagesChirho,
      approvedPagesChirho: Number(volChirho.approvedPagesChirho ?? 0),
      totalSegmentsChirho: segInfoChirho?.totalSegmentsChirho ?? 0,
      nonFrenchSegmentsChirho: Number(segInfoChirho?.nonFrenchSegmentsChirho ?? 0),
    };
  });

  return { volumesChirho: summariesChirho };
};
