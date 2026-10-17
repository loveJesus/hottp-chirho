// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { count, sql } from 'drizzle-orm';
import type { DbChirho } from '../db-chirho';
import { pagesChirho } from '../schema-d1-chirho';

// Workflow: page-reading-workflow-chirho.md. One pass over pages_chirho, so the
// cost is bounded by the number of pages; lines and segments, which grow far
// faster, are never read here. Per-page segment counts live in the volume windows.
export async function loadVolumeSummariesChirho(dbChirho: DbChirho) {
  const rowsChirho = await dbChirho.select({
    volumeNumberChirho: pagesChirho.volumeNumberChirho,
    totalPagesChirho: count(pagesChirho.idChirho),
    approvedPagesChirho: sql<number>`sum(case when ${pagesChirho.linesApprovedAtChirho} is not null then 1 else 0 end)`.mapWith(Number),
  }).from(pagesChirho).groupBy(pagesChirho.volumeNumberChirho).orderBy(pagesChirho.volumeNumberChirho);
  return rowsChirho.map((rowChirho) => ({ ...rowChirho, approvedPagesChirho: rowChirho.approvedPagesChirho ?? 0 }));
}
