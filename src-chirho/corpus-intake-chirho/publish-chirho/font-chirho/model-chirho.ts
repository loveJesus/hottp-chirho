// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { getTableColumns } from '../../../../app-chirho/node_modules/drizzle-orm';
import { pagesChirho, scanlinesChirho, segmentsChirho } from '../../../../app-chirho/src/lib/server-chirho/schema-d1-chirho.ts';
import type { StatementChirho } from '../source-chirho.ts';
import { digestChirho } from '../verify-chirho.ts';
export type FontRowChirho = Record<string, string | number | null>;
export interface FontBeforeChirho {
    page_chirho: FontRowChirho;
    lines_chirho: FontRowChirho[];
    segments_chirho: FontRowChirho[];
}
export interface FontTargetChirho {
    id_chirho: number;
    text_chirho: string;
    glyph_seqs_chirho: number[];
}
export interface FontEntryChirho {
    page_number_chirho: number;
    before_chirho: FontBeforeChirho;
    targets_chirho: FontTargetChirho[];
    payload_sha256_chirho: string;
    image_sha256_chirho: string;
    pdf_sha256_chirho: string;
    held_chirho: Record<string, number>;
}
export const FONT_VERSION_CHIRHO = 'vol5-font-drafts-20261030-chirho';
export const FONT_EVENT_CHIRHO = 'page-machine-font-decoded-chirho';
export const FONT_ACTOR_CHIRHO = 'font-decoder-chirho';
const pageColumnsChirho = Object.values(getTableColumns(pagesChirho)).map(columnChirho => columnChirho.name);
const lineColumnsChirho = Object.values(getTableColumns(scanlinesChirho)).map(columnChirho => columnChirho.name);
const segmentColumnsChirho = Object.values(getTableColumns(segmentsChirho)).map(columnChirho => columnChirho.name);
function exactColumnsChirho(rowChirho: FontRowChirho, columnsChirho: string[]): void {
    if (Object.keys(rowChirho).length !== columnsChirho.length || columnsChirho.some(columnChirho => !(columnChirho in rowChirho)))
        throw new Error('Incomplete/changed font baseline schema');
}
export function fontAuditChirho(entryChirho: FontEntryChirho, manifestHashChirho: string): string {
    return JSON.stringify({ source_chirho: FONT_VERSION_CHIRHO, manifest_sha256_chirho: manifestHashChirho, pdf_sha256_chirho: entryChirho.pdf_sha256_chirho, image_sha256_chirho: entryChirho.image_sha256_chirho, payload_sha256_chirho: entryChirho.payload_sha256_chirho,
        target_sha256_chirho: digestChirho(entryChirho.targets_chirho), segments_chirho: entryChirho.targets_chirho.length, approved_chirho: false, scope_chirho: 'machine-draft-only-chirho' });
}
// Workflow: font-drafts-workflow-chirho.md. A single atomic page batch owns
// both the OCR projection and its machine-only audit. SQL errors roll back
// even a late failure or a trigger that silently ignores an UPDATE.
export function fontStatementsChirho(entryChirho: FontEntryChirho, manifestHashChirho: string): StatementChirho[] {
    const beforeChirho = entryChirho.before_chirho, pageChirho = beforeChirho.page_chirho;
    exactColumnsChirho(pageChirho, pageColumnsChirho);
    if (pageChirho.volume_number_chirho !== 5 || pageChirho.page_number_chirho !== entryChirho.page_number_chirho || !Number.isSafeInteger(pageChirho.id_chirho) || Number(pageChirho.id_chirho) <= 0 || entryChirho.page_number_chirho < 1 || entryChirho.page_number_chirho > 1009 || (entryChirho.page_number_chirho >= 148 && entryChirho.page_number_chirho <= 152) || pageChirho.lines_approved_at_chirho !== null || !['pending-chirho', 'vision-done-chirho', 'ocr-done-chirho'].includes(String(pageChirho.status_chirho)))
        throw new Error('Outside unreviewed font scope');
    if (!entryChirho.targets_chirho.length || entryChirho.targets_chirho.length > 512 || ![manifestHashChirho, entryChirho.pdf_sha256_chirho, entryChirho.image_sha256_chirho, entryChirho.payload_sha256_chirho].every(hashChirho => /^[a-f0-9]{64}$/.test(hashChirho)))
        throw new Error('Invalid font manifest/target bounds');
    const linesChirho = new Map(beforeChirho.lines_chirho.map(lineChirho => [lineChirho.id_chirho, lineChirho]));
    const segmentsChirho = new Map(beforeChirho.segments_chirho.map(segmentChirho => [segmentChirho.id_chirho, segmentChirho]));
    const usedChirho = new Set<number>(), glyphsChirho = new Set<number>();
    const targetsChirho = entryChirho.targets_chirho.map(targetChirho => {
        const segmentChirho = segmentsChirho.get(targetChirho.id_chirho), lineChirho = segmentChirho && linesChirho.get(segmentChirho.scanline_id_chirho);
        if (!segmentChirho || !lineChirho)
            throw new Error('Font target has no source parent');
        exactColumnsChirho(segmentChirho, segmentColumnsChirho);
        exactColumnsChirho(lineChirho, lineColumnsChirho);
        if (usedChirho.has(targetChirho.id_chirho) || lineChirho.page_id_chirho !== pageChirho.id_chirho || lineChirho.status_chirho !== 'pending-chirho' || lineChirho.reconstructed_text_chirho !== null || segmentChirho.status_chirho !== 'pending-chirho' || segmentChirho.accepted_text_chirho !== null || segmentChirho.ocr_text_chirho !== null || segmentChirho.canonical_source_chirho !== null || !['hebrew-chirho', 'greek-chirho'].includes(String(segmentChirho.script_type_chirho)))
            throw new Error('Reviewed, duplicate or non-font target');
        if (typeof targetChirho.text_chirho !== 'string' || !targetChirho.text_chirho.trim() || targetChirho.text_chirho.length > 8192 || targetChirho.text_chirho !== targetChirho.text_chirho.normalize('NFC') || targetChirho.text_chirho.includes('�') || targetChirho.text_chirho === segmentChirho.pdftotext_chirho || !targetChirho.glyph_seqs_chirho.length || targetChirho.glyph_seqs_chirho.some(seqChirho => !Number.isSafeInteger(seqChirho) || seqChirho < 0 || glyphsChirho.has(seqChirho)))
            throw new Error('Unusable/incomplete Unicode draft');
        usedChirho.add(targetChirho.id_chirho);
        for (const seqChirho of targetChirho.glyph_seqs_chirho) {
            if (glyphsChirho.has(seqChirho))
                throw new Error('Duplicate glyph coverage');
            glyphsChirho.add(seqChirho);
        }
        return { segment_chirho: segmentChirho, line_chirho: lineChirho, text_chirho: targetChirho.text_chirho };
    });
    const jsonChirho = JSON.stringify(targetsChirho);
    if (Buffer.byteLength(jsonChirho) > 512 * 1024)
        throw new Error('Font page exceeds bounded batch');
    const matchesChirho = [...segmentColumnsChirho.map(columnChirho => `s_chirho.${columnChirho} IS json_extract(j_chirho.value,'$.segment_chirho.${columnChirho}')`), ...lineColumnsChirho.map(columnChirho => `l_chirho.${columnChirho} IS json_extract(j_chirho.value,'$.line_chirho.${columnChirho}')`)].join(' AND ');
    const pageMatchChirho = pageColumnsChirho.map(columnChirho => `p_chirho.${columnChirho} IS ?`).join(' AND ');
    return [
        { sql: `SELECT json(CASE WHEN EXISTS(SELECT 1 FROM pages_chirho p_chirho WHERE ${pageMatchChirho}
      AND NOT EXISTS(SELECT 1 FROM events_chirho e_chirho WHERE e_chirho.page_id_chirho=p_chirho.id_chirho)
      AND NOT EXISTS(SELECT 1 FROM snippets_chirho n_chirho WHERE n_chirho.page_id_chirho=p_chirho.id_chirho)
      AND NOT EXISTS(SELECT 1 FROM page_snapshots_chirho q_chirho WHERE q_chirho.page_id_chirho=p_chirho.id_chirho)
      AND NOT EXISTS(SELECT 1 FROM scanlines_chirho a_chirho JOIN words_chirho w_chirho ON w_chirho.scanline_id_chirho=a_chirho.id_chirho WHERE a_chirho.page_id_chirho=p_chirho.id_chirho)
      AND NOT EXISTS(SELECT 1 FROM scanlines_chirho a_chirho LEFT JOIN segments_chirho b_chirho ON b_chirho.scanline_id_chirho=a_chirho.id_chirho WHERE a_chirho.page_id_chirho=p_chirho.id_chirho AND (a_chirho.status_chirho!='pending-chirho' OR a_chirho.reconstructed_text_chirho IS NOT NULL OR b_chirho.status_chirho!='pending-chirho' OR b_chirho.accepted_text_chirho IS NOT NULL OR b_chirho.ocr_text_chirho IS NOT NULL OR b_chirho.canonical_source_chirho IS NOT NULL)))
      AND (SELECT count(*) FROM json_each(?) j_chirho JOIN segments_chirho s_chirho ON s_chirho.id_chirho=json_extract(j_chirho.value,'$.segment_chirho.id_chirho') JOIN scanlines_chirho l_chirho ON l_chirho.id_chirho=s_chirho.scanline_id_chirho WHERE ${matchesChirho})=? THEN 'null' ELSE 'font-source-conflict-chirho' END) AS guard_chirho`, params: [...pageColumnsChirho.map(columnChirho => pageChirho[columnChirho]!), jsonChirho, targetsChirho.length] },
        { sql: `UPDATE segments_chirho SET ocr_text_chirho=(SELECT json_extract(j_chirho.value,'$.text_chirho') FROM json_each(?) j_chirho WHERE json_extract(j_chirho.value,'$.segment_chirho.id_chirho')=segments_chirho.id_chirho) WHERE id_chirho IN(SELECT json_extract(j_chirho.value,'$.segment_chirho.id_chirho') FROM json_each(?) j_chirho)`, params: [jsonChirho, jsonChirho] },
        { sql: `SELECT json(CASE WHEN changes()=? THEN 'null' ELSE 'font-projection-missing-chirho' END) AS guard_chirho`, params: [targetsChirho.length] },
        { sql: `INSERT INTO events_chirho(page_id_chirho,aggregate_type_chirho,event_type_chirho,payload_json_chirho,reviewer_chirho) VALUES(?,'page-chirho',?,?,?)`, params: [Number(pageChirho.id_chirho), FONT_EVENT_CHIRHO, fontAuditChirho(entryChirho, manifestHashChirho), FONT_ACTOR_CHIRHO] },
    ];
}
export function expectedFontStateChirho(entryChirho: FontEntryChirho): FontBeforeChirho {
    const copyChirho = structuredClone(entryChirho.before_chirho), targetsChirho = new Map(entryChirho.targets_chirho.map(targetChirho => [targetChirho.id_chirho, targetChirho.text_chirho]));
    for (const segmentChirho of copyChirho.segments_chirho)
        if (targetsChirho.has(Number(segmentChirho.id_chirho)))
            segmentChirho.ocr_text_chirho = targetsChirho.get(Number(segmentChirho.id_chirho))!;
    return copyChirho;
}
