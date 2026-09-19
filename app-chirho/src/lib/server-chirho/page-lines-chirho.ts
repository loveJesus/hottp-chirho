// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { eq, sql } from 'drizzle-orm';
import { eventsChirho, scanlinesChirho, segmentsChirho } from './schema-d1-chirho';
import type { getDbChirho } from './db-chirho';
import { latestSegmentReceiptChirho, reviewStateSqlChirho } from './review-chirho/reading-evidence-chirho';
import type { ReviewStateChirho } from '$lib/page-reader-chirho/model-chirho';

export type SegmentRowChirho = typeof segmentsChirho.$inferSelect & { reviewStateChirho?: ReviewStateChirho };
export type ScanlineRowChirho = typeof scanlinesChirho.$inferSelect;
export interface PageLineChirho {
  scanlineChirho: ScanlineRowChirho;
  segmentsChirho: SegmentRowChirho[];
}

// Workflow: spec-chirho/workflows-chirho/page-reading-workflow-chirho.md.
// One page-indexed join; no per-line queries or corpus-wide scan.
export async function loadPageLinesChirho(dbChirho: ReturnType<typeof getDbChirho>, pageIdChirho: number): Promise<PageLineChirho[]> {
  const reviewStateChirho = reviewStateSqlChirho({
    kindChirho: 'segment-chirho', idChirho: sql`${segmentsChirho.idChirho}`, pageChirho: sql`${scanlinesChirho.pageIdChirho}`, lineChirho: sql`${scanlinesChirho.idChirho}`,
    textChirho: sql`coalesce(${segmentsChirho.acceptedTextChirho}, ${segmentsChirho.ocrTextChirho}, ${segmentsChirho.pdftotextChirho}, '')`,
    scriptChirho: sql`coalesce(${segmentsChirho.scriptTypeChirho}, 'unknown-chirho')`, confirmedChirho: sql`(${segmentsChirho.statusChirho} = 'human-confirmed-chirho')`,
    xChirho: sql`${scanlinesChirho.xMinChirho} + ${segmentsChirho.xMinPxChirho}`, yChirho: sql`${scanlinesChirho.yMinChirho}`, widthChirho: sql`${segmentsChirho.widthPxChirho}`, heightChirho: sql`${scanlinesChirho.heightChirho}`,
  });
  const rowsChirho = await dbChirho.select({ scanlineChirho: scanlinesChirho, segmentChirho: segmentsChirho, reviewStateChirho })
    .from(scanlinesChirho)
    .leftJoin(segmentsChirho, eq(segmentsChirho.scanlineIdChirho, scanlinesChirho.idChirho))
    .leftJoin(eventsChirho, eq(eventsChirho.seqChirho, latestSegmentReceiptChirho(sql`${segmentsChirho.idChirho}`, sql`${scanlinesChirho.pageIdChirho}`)))
    .where(eq(scanlinesChirho.pageIdChirho, pageIdChirho))
    .orderBy(scanlinesChirho.lineIndexChirho, segmentsChirho.segmentIndexChirho);
  const linesChirho = new Map<number, PageLineChirho>();
  for (const rowChirho of rowsChirho) {
    let lineChirho = linesChirho.get(rowChirho.scanlineChirho.idChirho);
    if (!lineChirho) {
      lineChirho = { scanlineChirho: rowChirho.scanlineChirho, segmentsChirho: [] };
      linesChirho.set(rowChirho.scanlineChirho.idChirho, lineChirho);
    }
    if (rowChirho.segmentChirho) lineChirho.segmentsChirho.push({ ...rowChirho.segmentChirho, reviewStateChirho: rowChirho.reviewStateChirho });
  }
  return [...linesChirho.values()];
}
