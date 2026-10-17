// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { and, asc, count, desc, eq, gt, gte, inArray, lt, sql } from 'drizzle-orm';
import type { DbChirho } from '../db-chirho';
import { pagesChirho, scanlinesChirho, segmentsChirho } from '../schema-d1-chirho';
import { PAGE_WINDOW_CHIRHO, type PageWindowChirho } from './request-chirho';

// Workflow: page-reading-workflow-chirho.md. Narrow index-ordered window first;
// the LEFT JOIN then visits only those pages' lines and segments, never a volume.
export async function loadVolumeWindowChirho(dbChirho: DbChirho, volumeChirho: number, windowChirho: PageWindowChirho) {
  const reverseChirho = windowChirho.beforeChirho !== null;
  const rowsChirho = await dbChirho.select({ idChirho: pagesChirho.idChirho,
    pageNumberChirho: pagesChirho.pageNumberChirho, statusChirho: pagesChirho.statusChirho })
    .from(pagesChirho).where(and(eq(pagesChirho.volumeNumberChirho, volumeChirho),
      reverseChirho ? lt(pagesChirho.pageNumberChirho, windowChirho.beforeChirho!) : gte(pagesChirho.pageNumberChirho, windowChirho.fromChirho)))
    .orderBy(reverseChirho ? desc(pagesChirho.pageNumberChirho) : asc(pagesChirho.pageNumberChirho)).limit(PAGE_WINDOW_CHIRHO + 1);
  const visibleChirho = rowsChirho.slice(0, PAGE_WINDOW_CHIRHO);
  if (reverseChirho) visibleChirho.reverse();
  const firstChirho = visibleChirho[0]?.pageNumberChirho ?? null;
  const lastChirho = visibleChirho.at(-1)?.pageNumberChirho ?? null;
  if (firstChirho === null || lastChirho === null) return { pagesChirho: [], previousBeforeChirho: null, nextFromChirho: null };

  const countsChirho = await dbChirho.select({ pageIdChirho: scanlinesChirho.pageIdChirho,
    totalSegmentCountChirho: count(segmentsChirho.idChirho),
    nonFrenchSegmentCountChirho: sql<number>`sum(case when ${segmentsChirho.scriptTypeChirho} <> 'french-chirho' then 1 else 0 end)`.mapWith(Number) })
    .from(scanlinesChirho).leftJoin(segmentsChirho, eq(segmentsChirho.scanlineIdChirho, scanlinesChirho.idChirho))
    .where(inArray(scanlinesChirho.pageIdChirho, visibleChirho.map((pageChirho) => pageChirho.idChirho)))
    .groupBy(scanlinesChirho.pageIdChirho);
  const byPageChirho = new Map(countsChirho.map((rowChirho) => [rowChirho.pageIdChirho, rowChirho]));
  // The overfetch proves one side. A single index seek proves the other side,
  // including sparse, empty-line and not-yet-loaded pages without a total scan.
  const oppositeChirho = await dbChirho.select({ pageNumberChirho: pagesChirho.pageNumberChirho }).from(pagesChirho)
    .where(and(eq(pagesChirho.volumeNumberChirho, volumeChirho), reverseChirho ? gt(pagesChirho.pageNumberChirho, lastChirho) : lt(pagesChirho.pageNumberChirho, firstChirho)))
    .orderBy(reverseChirho ? asc(pagesChirho.pageNumberChirho) : desc(pagesChirho.pageNumberChirho)).limit(1);
  return {
    pagesChirho: visibleChirho.map((pageChirho) => ({ ...pageChirho,
      totalSegmentCountChirho: byPageChirho.get(pageChirho.idChirho)?.totalSegmentCountChirho ?? 0,
      nonFrenchSegmentCountChirho: byPageChirho.get(pageChirho.idChirho)?.nonFrenchSegmentCountChirho ?? 0 })),
    previousBeforeChirho: (reverseChirho ? rowsChirho.length > PAGE_WINDOW_CHIRHO : oppositeChirho.length > 0) ? firstChirho : null,
    nextFromChirho: reverseChirho ? oppositeChirho[0]?.pageNumberChirho ?? null : rowsChirho[PAGE_WINDOW_CHIRHO]?.pageNumberChirho ?? null,
  };
}
