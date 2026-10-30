// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import type { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { workingSetKeysChirho, intakeImageRelPathChirho } from '../intake-config-chirho.ts';
import { LINE_PADDING_BOTTOM_PX_CHIRHO } from '../page-geometry-chirho.ts';

export interface StatementChirho { sql: string; params?: (string | number | null)[] }
export interface SourcePageChirho {
  volume_number_chirho: number; page_number_chirho: number; french_text_chirho: string;
  image_rel_path_chirho: string; image_sha256_chirho: string; image_bytes_chirho: number;
  image_width_chirho: number; image_height_chirho: number; line_count_chirho: number;
  geometry_version_chirho: number; status_chirho: string;
}
export type LineChirho = [number, number, number, number, number, string, number];
export type SegmentChirho = [number, number, number | null, number | null, number, number, string, string];
export interface PagePayloadChirho {
  page_chirho: [number, number, string, string];
  lines_chirho: LineChirho[];
  segments_chirho: SegmentChirho[];
}
export const VOLUME_PAGES_CHIRHO = [812, 1106, 1418, 990, 1009] as const;
export function sha256Chirho(valueChirho: string | Uint8Array): string {
  return createHash('sha256').update(valueChirho).digest('hex');
}
export function pageKeyChirho(pageChirho: Pick<SourcePageChirho, 'volume_number_chirho' | 'page_number_chirho'>): string {
  return `${pageChirho.volume_number_chirho}:${pageChirho.page_number_chirho}`;
}
export function imageKeyChirho(volumeChirho: number, pageChirho: number): string {
  return `vol-${volumeChirho}-chirho/page-${String(pageChirho).padStart(4, '0')}-chirho/full-page-chirho.png`;
}
export function boundedLineChirho(lineChirho: LineChirho, imageWidthChirho: number, imageHeightChirho: number): LineChirho {
  checkChirho(lineChirho.slice(0, 5).every(valueChirho => typeof valueChirho === 'number' && Number.isFinite(valueChirho) && valueChirho >= 0) && lineChirho[4] > 0 &&
    lineChirho[1] + lineChirho[3] <= imageWidthChirho && lineChirho[2] < imageHeightChirho &&
    lineChirho[2] + lineChirho[4] <= imageHeightChirho + LINE_PADDING_BOTTOM_PX_CHIRHO, 'Invalid line geometry');
  // Intake deliberately pads below ink. Intersect ONLY that known padding
  // with the actual image, never shift text or scale a coordinate-space error.
  return [lineChirho[0], lineChirho[1], lineChirho[2], lineChirho[3], Math.min(lineChirho[4], imageHeightChirho - lineChirho[2]), lineChirho[5], lineChirho[6]];
}
function checkChirho(valueChirho: unknown, messageChirho: string): asserts valueChirho {
  if (!valueChirho) throw new Error(messageChirho);
}
export function sourcePagesChirho(dbChirho: Database): SourcePageChirho[] {
  const pagesChirho = dbChirho.query<SourcePageChirho, []>(`SELECT volume_number_chirho,page_number_chirho,
    coalesce(french_text_chirho,'') AS french_text_chirho,image_rel_path_chirho,image_sha256_chirho,image_bytes_chirho,
    image_width_chirho,image_height_chirho,line_count_chirho,geometry_version_chirho,status_chirho
    FROM intake_pages_chirho ORDER BY volume_number_chirho,page_number_chirho`).all();
  const keysChirho = workingSetKeysChirho();
  const seenChirho = new Set<string>();
  for (const pageChirho of pagesChirho) {
    const keyChirho = pageKeyChirho(pageChirho);
    checkChirho(!keysChirho.has(keyChirho) && !seenChirho.has(keyChirho), `Protected/duplicate source page ${keyChirho}`);
    checkChirho(Number.isInteger(pageChirho.volume_number_chirho) && pageChirho.volume_number_chirho >= 1 && pageChirho.volume_number_chirho <= 5 &&
      Number.isInteger(pageChirho.page_number_chirho) && pageChirho.page_number_chirho >= 1 && pageChirho.page_number_chirho <= VOLUME_PAGES_CHIRHO[pageChirho.volume_number_chirho - 1]!, `Invalid page ${keyChirho}`);
    checkChirho(pageChirho.status_chirho === 'lines-extracted-chirho' && pageChirho.geometry_version_chirho === 3, `Incomplete/old geometry ${keyChirho}`);
    checkChirho(pageChirho.image_rel_path_chirho === intakeImageRelPathChirho(pageChirho.volume_number_chirho, pageChirho.page_number_chirho) && /^[a-f0-9]{64}$/.test(pageChirho.image_sha256_chirho), `Invalid image ${keyChirho}`);
    checkChirho([pageChirho.image_width_chirho, pageChirho.image_height_chirho, pageChirho.image_bytes_chirho].every(valueChirho => Number.isSafeInteger(valueChirho) && valueChirho > 0), `Invalid image size ${keyChirho}`);
    seenChirho.add(keyChirho);
  }
  for (let volumeChirho = 1; volumeChirho <= 5; volumeChirho++) {
    for (let pageChirho = 1; pageChirho <= VOLUME_PAGES_CHIRHO[volumeChirho - 1]!; pageChirho++) {
      checkChirho(keysChirho.has(`${volumeChirho}:${pageChirho}`) || seenChirho.has(`${volumeChirho}:${pageChirho}`), `Missing source ${volumeChirho}:${pageChirho}`);
    }
  }
  return pagesChirho;
}

// Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-publish-workflow-chirho.md.
// Project only fields consumed by the reader. Do not copy word JSON, machine
// confidence, accepted text, events, or certification state into production.
export function payloadChirho(dbChirho: Database, pageChirho: SourcePageChirho): PagePayloadChirho {
  const argsChirho = [pageChirho.volume_number_chirho, pageChirho.page_number_chirho];
  const markerChirho = dbChirho.query<{drafts_version_chirho: number; segment_count_chirho: number}, number[]>(
    'SELECT drafts_version_chirho,segment_count_chirho FROM intake_page_drafts_chirho WHERE volume_number_chirho=? AND page_number_chirho=?').get(...argsChirho);
  const segmentRowsChirho = dbChirho.query<{
    line_index_chirho: number; segment_index_chirho: number; word_start_index_chirho: number | null; word_end_index_chirho: number | null;
    x_min_px_chirho: number; width_px_chirho: number; pdftotext_chirho: string; script_type_chirho: string;
  }, number[]>('SELECT * FROM intake_segments_chirho WHERE volume_number_chirho=? AND page_number_chirho=? ORDER BY line_index_chirho,segment_index_chirho').all(...argsChirho);
  const segmentsChirho: SegmentChirho[] = segmentRowsChirho.map(rowChirho => [rowChirho.line_index_chirho, rowChirho.segment_index_chirho,
    rowChirho.word_start_index_chirho, rowChirho.word_end_index_chirho, rowChirho.x_min_px_chirho, rowChirho.width_px_chirho, rowChirho.pdftotext_chirho.normalize('NFC'), rowChirho.script_type_chirho]);
  const countsChirho = new Map<number, number>();
  for (const segmentChirho of segmentsChirho) countsChirho.set(segmentChirho[0], (countsChirho.get(segmentChirho[0]) ?? 0) + 1);
  const linesChirho: LineChirho[] = dbChirho.query<{
    line_index_chirho: number; x_min_chirho: number; y_min_chirho: number; width_chirho: number; height_chirho: number; pdftotext_chirho: string;
  }, number[]>('SELECT * FROM intake_lines_chirho WHERE volume_number_chirho=? AND page_number_chirho=? ORDER BY line_index_chirho').all(...argsChirho)
    .map(rowChirho => [rowChirho.line_index_chirho, rowChirho.x_min_chirho, rowChirho.y_min_chirho, rowChirho.width_chirho, rowChirho.height_chirho,
      rowChirho.pdftotext_chirho.normalize('NFC'), countsChirho.get(rowChirho.line_index_chirho) ?? 0] as LineChirho);
  checkChirho(markerChirho?.drafts_version_chirho === 2 && markerChirho.segment_count_chirho === segmentsChirho.length && pageChirho.line_count_chirho === linesChirho.length, `Incomplete drafts ${pageKeyChirho(pageChirho)}`);
  return geometryPayloadChirho({page_chirho: [pageChirho.volume_number_chirho, pageChirho.page_number_chirho, pageChirho.french_text_chirho.normalize('NFC'), imageKeyChirho(...argsChirho as [number, number])], lines_chirho: linesChirho, segments_chirho: segmentsChirho}, pageChirho.image_width_chirho, pageChirho.image_height_chirho);
}

// Shared by new-page intake and the append-only legacy-reader foundation.
// Return fresh tuples; validating a download must not mutate its baseline.
export function geometryPayloadChirho(valueChirho: PagePayloadChirho, widthChirho: number, heightChirho: number): PagePayloadChirho {
  const linesChirho = valueChirho.lines_chirho.map(lineChirho => boundedLineChirho(lineChirho, widthChirho, heightChirho));
  const segmentsChirho = valueChirho.segments_chirho.map(segmentChirho => [...segmentChirho] as SegmentChirho);
  const lineMapChirho = new Map(linesChirho.map(lineChirho => [lineChirho[0], lineChirho]));
  checkChirho(lineMapChirho.size === linesChirho.length, 'Duplicate line coordinates');
  const segmentKeysChirho = new Set<string>();
  const countsChirho = new Map<number, number>();
  for (const segmentChirho of segmentsChirho) {
    const lineChirho = lineMapChirho.get(segmentChirho[0]);
    // Eighteen PDF font-layer marks have no measurable line width; the draft
    // segmenter used a 1px placeholder. Retain the text, not a fabricated box.
    if (lineChirho?.[3] === 0 && segmentChirho[4] === 0 && segmentChirho[5] === 1) segmentChirho[5] = 0;
    // Zero-width OCR runs remain visible as text but cannot be confirmed; do
    // not invent a positive box or silently drop a word to make a check green.
    checkChirho(lineChirho && Number.isInteger(segmentChirho[1]) && segmentChirho[1] >= 0 && Number.isFinite(segmentChirho[4]) && Number.isFinite(segmentChirho[5]) &&
      segmentChirho[4] >= 0 && segmentChirho[5] >= 0 && segmentChirho[4] + segmentChirho[5] <= lineChirho[3], `Out-of-line segment ${valueChirho.page_chirho[0]}:${valueChirho.page_chirho[1]}:${segmentChirho[0]}:${segmentChirho[1]}`);
    const keyChirho = `${segmentChirho[0]}:${segmentChirho[1]}`;
    checkChirho(!segmentKeysChirho.has(keyChirho), 'Duplicate segment coordinates'); segmentKeysChirho.add(keyChirho);
    countsChirho.set(segmentChirho[0], (countsChirho.get(segmentChirho[0]) ?? 0) + 1);
  }
  checkChirho(linesChirho.every(lineChirho => lineChirho[6] === (countsChirho.get(lineChirho[0]) ?? 0)), 'Segment count mismatch');
  return {page_chirho: [...valueChirho.page_chirho], lines_chirho: linesChirho, segments_chirho: segmentsChirho};
}

export async function checkedImageChirho(rootChirho: string, pageChirho: SourcePageChirho): Promise<Uint8Array> {
  const pathChirho = resolve(rootChirho, pageChirho.image_rel_path_chirho);
  checkChirho(pathChirho.startsWith(resolve(rootChirho) + sep), 'Image escaped intake root');
  const imageChirho = new Uint8Array(await Bun.file(pathChirho).arrayBuffer());
  checkChirho(imageChirho.byteLength === pageChirho.image_bytes_chirho && sha256Chirho(imageChirho) === pageChirho.image_sha256_chirho, `Image hash mismatch ${pageKeyChirho(pageChirho)}`);
  const viewChirho = new DataView(imageChirho.buffer, imageChirho.byteOffset, imageChirho.byteLength);
  checkChirho(Buffer.from(imageChirho.subarray(0, 8)).toString('hex') === '89504e470d0a1a0a' && viewChirho.getUint32(16) === pageChirho.image_width_chirho && viewChirho.getUint32(20) === pageChirho.image_height_chirho, `Image dimensions mismatch ${pageKeyChirho(pageChirho)}`);
  return imageChirho;
}

// Every page's statements MUST be submitted together in an atomic D1 batch.
// Plain INSERT deliberately fails on a duplicate (volume,page); never replace
// a page, add to someone else's page, or assume local autoincrement IDs match.
export function statementsChirho(payloadChirho: PagePayloadChirho): StatementChirho[] {
  const [volumeChirho, pageChirho, textChirho, imageChirho] = payloadChirho.page_chirho;
  return [
    { sql: `INSERT INTO pages_chirho(volume_number_chirho,page_number_chirho,french_text_chirho,image_path_chirho,status_chirho)
      VALUES(?,?,?,?,'pending-chirho')`, params: [volumeChirho, pageChirho, textChirho, imageChirho] },
    { sql: `INSERT INTO scanlines_chirho(page_id_chirho,line_index_chirho,x_min_chirho,y_min_chirho,width_chirho,height_chirho,pdftotext_chirho,segment_count_chirho,status_chirho)
      SELECT p.id_chirho,json_extract(j.value,'$[0]'),json_extract(j.value,'$[1]'),json_extract(j.value,'$[2]'),json_extract(j.value,'$[3]'),json_extract(j.value,'$[4]'),json_extract(j.value,'$[5]'),json_extract(j.value,'$[6]'),'pending-chirho'
      FROM json_each(?) j JOIN pages_chirho p ON p.volume_number_chirho=? AND p.page_number_chirho=?`, params: [JSON.stringify(payloadChirho.lines_chirho), volumeChirho, pageChirho] },
    { sql: `INSERT INTO segments_chirho(scanline_id_chirho,segment_index_chirho,word_start_index_chirho,word_end_index_chirho,x_min_px_chirho,width_px_chirho,pdftotext_chirho,script_type_chirho,status_chirho)
      SELECT l.id_chirho,json_extract(j.value,'$[1]'),json_extract(j.value,'$[2]'),json_extract(j.value,'$[3]'),json_extract(j.value,'$[4]'),json_extract(j.value,'$[5]'),json_extract(j.value,'$[6]'),json_extract(j.value,'$[7]'),'pending-chirho'
      FROM json_each(?) j JOIN pages_chirho p ON p.volume_number_chirho=? AND p.page_number_chirho=?
      JOIN scanlines_chirho l ON l.page_id_chirho=p.id_chirho AND l.line_index_chirho=json_extract(j.value,'$[0]')`, params: [JSON.stringify(payloadChirho.segments_chirho), volumeChirho, pageChirho] },
  ];
}
