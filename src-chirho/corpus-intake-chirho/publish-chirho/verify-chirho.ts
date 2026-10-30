// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { queryChirho, type ResultChirho } from './cloud-chirho.ts';
import { sha256Chirho, type PagePayloadChirho, type LineChirho, type SegmentChirho, type StatementChirho } from './source-chirho.ts';

export interface TableSnapshotChirho { table_chirho: string; key_chirho: string; rows_chirho: Record<string, unknown>[]; sha256_chirho: string }
export function digestChirho(rowsChirho: unknown): string { return sha256Chirho(JSON.stringify(rowsChirho)); }
export function sameStoredRowChirho(expectedChirho: Record<string, unknown>, actualChirho: Record<string, unknown>): boolean {
  return Object.keys(expectedChirho).length === Object.keys(actualChirho).length && Object.keys(expectedChirho).every(keyChirho => expectedChirho[keyChirho] === actualChirho[keyChirho]);
}
function identifierChirho(valueChirho: string): string {
  if (!/^[a-z0-9_]+$/.test(valueChirho)) throw new Error('Unsafe SQL identifier');
  return valueChirho;
}
export async function captureExistingChirho(): Promise<TableSnapshotChirho[]> {
  const tablesChirho = (await queryChirho([{sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"}]))[0]!.results;
  const snapshotsChirho: TableSnapshotChirho[] = [];
  for (const tableChirho of tablesChirho) {
    const nameChirho = identifierChirho(String(tableChirho.name));
    const infoChirho = (await queryChirho([{sql: `PRAGMA table_info(${nameChirho})`}]))[0]!.results;
    const keysChirho = infoChirho.filter(rowChirho => Number(rowChirho.pk) > 0);
    if (keysChirho.length !== 1) throw new Error(`Need one primary key to snapshot ${nameChirho}`);
    const keyChirho = identifierChirho(String(keysChirho[0]!.name));
    const rowsChirho: Record<string, unknown>[] = [];
    let cursorChirho: string | number | null = null;
    while (true) {
      const nextChirho = (await queryChirho([{sql: `SELECT * FROM ${nameChirho} ${cursorChirho === null ? '' : `WHERE ${keyChirho}>?`} ORDER BY ${keyChirho} LIMIT 500`, params: cursorChirho === null ? [] : [cursorChirho]}]))[0]!.results;
      rowsChirho.push(...nextChirho);
      if (nextChirho.length < 500) break;
      cursorChirho = nextChirho.at(-1)![keyChirho] as string | number;
    }
    snapshotsChirho.push({table_chirho: nameChirho, key_chirho: keyChirho, rows_chirho: rowsChirho, sha256_chirho: digestChirho(rowsChirho)});
  }
  return snapshotsChirho;
}
export async function verifyExistingChirho(snapshotsChirho: TableSnapshotChirho[]): Promise<{table_chirho: string; rows_chirho: number; sha256_chirho: string}[]> {
  const resultChirho = [];
  for (const snapshotChirho of snapshotsChirho) {
    const rowsChirho: Record<string, unknown>[] = [];
    for (let offsetChirho = 0; offsetChirho < snapshotChirho.rows_chirho.length; offsetChirho += 300) {
      const keysChirho = snapshotChirho.rows_chirho.slice(offsetChirho, offsetChirho + 300).map(rowChirho => rowChirho[snapshotChirho.key_chirho]);
      rowsChirho.push(...(await queryChirho([{sql: `SELECT * FROM ${identifierChirho(snapshotChirho.table_chirho)} WHERE ${identifierChirho(snapshotChirho.key_chirho)} IN (SELECT value FROM json_each(?)) ORDER BY ${identifierChirho(snapshotChirho.key_chirho)}`, params: [JSON.stringify(keysChirho)]}]))[0]!.results);
    }
    // API object property order is not a data guarantee. Canonicalize by the
    // baseline's column order before hashing the full, untruncated row values.
    const canonicalChirho = rowsChirho.map(rowChirho => Object.fromEntries(Object.keys(snapshotChirho.rows_chirho[0] ?? {}).map(keyChirho => [keyChirho, rowChirho[keyChirho]])));
    if (digestChirho(canonicalChirho) !== snapshotChirho.sha256_chirho) throw new Error(`Existing rows changed in ${snapshotChirho.table_chirho}; stop, do not restore over live work`);
    resultChirho.push({table_chirho: snapshotChirho.table_chirho, rows_chirho: rowsChirho.length, sha256_chirho: snapshotChirho.sha256_chirho});
  }
  return resultChirho;
}

// Compare actual stored text, geometry, coordinate mapping and trust fields,
// not just row counts. All queries are bounded to one page and indexed joins.
function readStatementsChirho(volumeChirho: number, pageChirho: number): StatementChirho[] {
  return [
    {sql: 'SELECT * FROM pages_chirho WHERE volume_number_chirho=? AND page_number_chirho=?', params: [volumeChirho, pageChirho]},
    {sql: `SELECT l.* FROM scanlines_chirho l JOIN pages_chirho p ON p.id_chirho=l.page_id_chirho
      WHERE p.volume_number_chirho=? AND p.page_number_chirho=? ORDER BY l.line_index_chirho`, params: [volumeChirho, pageChirho]},
    {sql: `SELECT s.*,l.line_index_chirho FROM segments_chirho s JOIN scanlines_chirho l ON l.id_chirho=s.scanline_id_chirho JOIN pages_chirho p ON p.id_chirho=l.page_id_chirho
      WHERE p.volume_number_chirho=? AND p.page_number_chirho=? ORDER BY l.line_index_chirho,s.segment_index_chirho`, params: [volumeChirho, pageChirho]},
  ];
}
function projectResultsChirho(volumeChirho: number, pageChirho: number, resultsChirho: ResultChirho[], expectedPageChirho?: Record<string, unknown>): PagePayloadChirho | null {
  const [pageResultChirho, linesResultChirho, segmentsResultChirho] = resultsChirho;
  const pageRowChirho = pageResultChirho!.results[0];
  if (!pageRowChirho) return null;
  const pendingChirho = (rowChirho: Record<string, unknown>): boolean => rowChirho.status_chirho === 'pending-chirho';
  const pageMatchesChirho = expectedPageChirho ? sameStoredRowChirho(expectedPageChirho, pageRowChirho) :
    pendingChirho(pageRowChirho) && pageRowChirho.reconstructed_text_chirho == null && pageRowChirho.lines_approved_at_chirho == null && pageRowChirho.vision_text_chirho == null;
  if (!pageMatchesChirho ||
    linesResultChirho!.results.some(rowChirho => !pendingChirho(rowChirho) || rowChirho.reconstructed_text_chirho != null || rowChirho.image_r2_key_chirho != null || rowChirho.words_json_chirho != null) ||
    segmentsResultChirho!.results.some(rowChirho => !pendingChirho(rowChirho) || rowChirho.accepted_text_chirho != null || rowChirho.ocr_text_chirho != null || rowChirho.canonical_source_chirho != null || rowChirho.canonical_reference_chirho != null || rowChirho.image_r2_key_chirho != null)) {
    throw new Error(`Page ${volumeChirho}:${pageChirho} has unexpected/reviewed state; never replace it`);
  }
  return {page_chirho: [volumeChirho, pageChirho, String(pageRowChirho.french_text_chirho), String(pageRowChirho.image_path_chirho)],
    lines_chirho: linesResultChirho!.results.map(rowChirho => [rowChirho.line_index_chirho, rowChirho.x_min_chirho, rowChirho.y_min_chirho, rowChirho.width_chirho, rowChirho.height_chirho, rowChirho.pdftotext_chirho, rowChirho.segment_count_chirho] as LineChirho),
    segments_chirho: segmentsResultChirho!.results.map(rowChirho => [rowChirho.line_index_chirho, rowChirho.segment_index_chirho, rowChirho.word_start_index_chirho, rowChirho.word_end_index_chirho, rowChirho.x_min_px_chirho, rowChirho.width_px_chirho, rowChirho.pdftotext_chirho, rowChirho.script_type_chirho] as SegmentChirho)};
}
export async function remotePayloadsChirho(volumeChirho: number, pagesChirho: number[], expectedPagesChirho?: ReadonlyMap<number, Record<string, unknown>>): Promise<Map<number, PagePayloadChirho | null>> {
  if (pagesChirho.length > 8) throw new Error('Verification window exceeds eight pages');
  if (!pagesChirho.length) return new Map();
  const resultsChirho = await queryChirho(pagesChirho.flatMap(pageChirho => readStatementsChirho(volumeChirho, pageChirho)));
  if (expectedPagesChirho && pagesChirho.some(pageChirho => !expectedPagesChirho.has(pageChirho))) throw new Error('Missing original page baseline');
  return new Map(pagesChirho.map((pageChirho, indexChirho) => [pageChirho, projectResultsChirho(volumeChirho, pageChirho, resultsChirho.slice(indexChirho * 3, indexChirho * 3 + 3), expectedPagesChirho?.get(pageChirho))]));
}
