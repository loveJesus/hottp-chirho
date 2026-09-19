// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { eq } from 'drizzle-orm';
import { scanlinesChirho, segmentsChirho } from './schema-d1-chirho';
import type { getDbChirho } from './db-chirho';

export type SegmentRowChirho = typeof segmentsChirho.$inferSelect;
export type ScanlineRowChirho = typeof scanlinesChirho.$inferSelect;
export interface PageLineChirho {
  scanlineChirho: ScanlineRowChirho;
  segmentsChirho: SegmentRowChirho[];
}

// Workflow: spec-chirho/workflows-chirho/page-reading-workflow-chirho.md.
// One page-indexed join; no per-line queries or corpus-wide scan.
export async function loadPageLinesChirho(dbChirho: ReturnType<typeof getDbChirho>, pageIdChirho: number): Promise<PageLineChirho[]> {
  const rowsChirho = await dbChirho.select({ scanlineChirho: scanlinesChirho, segmentChirho: segmentsChirho })
    .from(scanlinesChirho)
    .leftJoin(segmentsChirho, eq(segmentsChirho.scanlineIdChirho, scanlinesChirho.idChirho))
    .where(eq(scanlinesChirho.pageIdChirho, pageIdChirho))
    .orderBy(scanlinesChirho.lineIndexChirho, segmentsChirho.segmentIndexChirho);
  const linesChirho = new Map<number, PageLineChirho>();
  for (const rowChirho of rowsChirho) {
    let lineChirho = linesChirho.get(rowChirho.scanlineChirho.idChirho);
    if (!lineChirho) {
      lineChirho = { scanlineChirho: rowChirho.scanlineChirho, segmentsChirho: [] };
      linesChirho.set(rowChirho.scanlineChirho.idChirho, lineChirho);
    }
    if (rowChirho.segmentChirho) lineChirho.segmentsChirho.push(rowChirho.segmentChirho);
  }
  return [...linesChirho.values()];
}
