// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Per-volume page list. Real-time non-French segment counts via two indexed
 * aggregations — no per-page loops, no full-volume table scan.
 */

import type { PageServerLoad } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  pagesChirho,
  scanlinesChirho,
  segmentsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { count, eq, sql, ne, and } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const volumeNumChirho = parseInt(params.vol_chirho, 10);

  const pageRowsChirho = await dbChirho
    .select()
    .from(pagesChirho)
    .where(eq(pagesChirho.volumeNumberChirho, volumeNumChirho))
    .orderBy(pagesChirho.pageNumberChirho);

  // Aggregate non-French segment counts per page in one indexed JOIN — uses
  // idx_scanlines_page_chirho + idx_segments_scanline_chirho.
  const nonFrenchCountsChirho = await dbChirho
    .select({
      pageIdChirho: scanlinesChirho.pageIdChirho,
      nonFrenchCountChirho: count(segmentsChirho.idChirho),
    })
    .from(segmentsChirho)
    .innerJoin(scanlinesChirho, eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho))
    .innerJoin(pagesChirho, eq(pagesChirho.idChirho, scanlinesChirho.pageIdChirho))
    .where(
      and(
        eq(pagesChirho.volumeNumberChirho, volumeNumChirho),
        ne(segmentsChirho.scriptTypeChirho, "french-chirho")
      )
    )
    .groupBy(scanlinesChirho.pageIdChirho);

  const totalSegmentCountsChirho = await dbChirho
    .select({
      pageIdChirho: scanlinesChirho.pageIdChirho,
      segmentCountChirho: count(segmentsChirho.idChirho),
    })
    .from(segmentsChirho)
    .innerJoin(scanlinesChirho, eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho))
    .innerJoin(pagesChirho, eq(pagesChirho.idChirho, scanlinesChirho.pageIdChirho))
    .where(eq(pagesChirho.volumeNumberChirho, volumeNumChirho))
    .groupBy(scanlinesChirho.pageIdChirho);

  const nonFrenchByPageChirho = new Map(
    nonFrenchCountsChirho.map((rChirho) => [rChirho.pageIdChirho, rChirho.nonFrenchCountChirho])
  );
  const totalSegByPageChirho = new Map(
    totalSegmentCountsChirho.map((rChirho) => [rChirho.pageIdChirho, rChirho.segmentCountChirho])
  );

  const enrichedPagesChirho = pageRowsChirho.map((pChirho) => ({
    ...pChirho,
    nonFrenchSegmentCountChirho: nonFrenchByPageChirho.get(pChirho.idChirho) ?? 0,
    totalSegmentCountChirho: totalSegByPageChirho.get(pChirho.idChirho) ?? 0,
  }));

  return {
    volumeNumberChirho: volumeNumChirho,
    pagesChirho: enrichedPagesChirho,
  };
};

const _CHECK_SQL_CHIRHO: typeof sql = sql; // keep import live for future server-side raw SQL
void _CHECK_SQL_CHIRHO;
