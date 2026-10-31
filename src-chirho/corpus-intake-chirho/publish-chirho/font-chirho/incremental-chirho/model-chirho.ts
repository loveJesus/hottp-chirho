// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { getTableColumns } from '../../../../../app-chirho/node_modules/drizzle-orm';
import { pagesChirho, scanlinesChirho, segmentsChirho, eventsChirho } from '../../../../../app-chirho/src/lib/server-chirho/schema-d1-chirho.ts';
import { digestChirho } from '../../verify-chirho.ts';
import { sameFontStateChirho } from '../apply-chirho.ts';
import { fontStatementsChirho, fontAuditChirho, expectedFontStateChirho, FONT_EVENT_CHIRHO, FONT_ACTOR_CHIRHO, type FontEntryChirho, type FontRowChirho, type FontTargetChirho } from '../model-chirho.ts';
import type { StatementChirho } from '../../source-chirho.ts';
export const GREEK_VERSION_CHIRHO = 'vol5-greek-components-20261030-chirho';
export interface GreekPatchChirho {
    page_number_chirho: number;
    targets_chirho: FontTargetChirho[];
    prior_events_chirho: FontRowChirho[];
}
export interface GreekContextChirho {
    parent_chirho: FontEntryChirho;
    parent_manifest_sha256_chirho: string;
}
const columnsChirho = (tableChirho: typeof pagesChirho | typeof scanlinesChirho | typeof segmentsChirho | typeof eventsChirho) => Object.values(getTableColumns(tableChirho)).map(columnChirho => columnChirho.name);
export function greekEntryChirho(patchChirho: GreekPatchChirho, contextChirho: GreekContextChirho): FontEntryChirho {
    const parentChirho = contextChirho.parent_chirho;
    if (patchChirho.page_number_chirho !== parentChirho.page_number_chirho || !/^[a-f0-9]{64}$/.test(contextChirho.parent_manifest_sha256_chirho))
        throw new Error('Greek parent identity differs');
    const previousGlyphsChirho = new Set(parentChirho.targets_chirho.flatMap(targetChirho => targetChirho.glyph_seqs_chirho));
    const segmentsChirho = new Map(parentChirho.before_chirho.segments_chirho.map(segmentChirho => [segmentChirho.id_chirho, segmentChirho]));
    if (patchChirho.targets_chirho.some(targetChirho => segmentsChirho.get(targetChirho.id_chirho)?.script_type_chirho !== 'greek-chirho'))
        throw new Error('Incremental release is Greek-only');
    if (patchChirho.targets_chirho.some(targetChirho => targetChirho.glyph_seqs_chirho.some(seqChirho => previousGlyphsChirho.has(seqChirho))))
        throw new Error('Greek patch overlaps prior glyph coverage');
    const historyChirho = patchChirho.prior_events_chirho;
    if (parentChirho.targets_chirho.length) {
        const eventChirho = historyChirho[0];
        if (historyChirho.length !== 1 || !eventChirho || eventChirho.page_id_chirho !== parentChirho.before_chirho.page_chirho.id_chirho || eventChirho.event_type_chirho !== FONT_EVENT_CHIRHO || eventChirho.aggregate_type_chirho !== 'page-chirho' || eventChirho.reviewer_chirho !== FONT_ACTOR_CHIRHO || eventChirho.word_id_chirho !== null || eventChirho.scanline_id_chirho !== null || eventChirho.payload_json_chirho !== fontAuditChirho(parentChirho, contextChirho.parent_manifest_sha256_chirho) || !Number.isSafeInteger(eventChirho.seq_chirho) || Number(eventChirho.seq_chirho) <= 0)
            throw new Error('Prior machine audit is missing, changed or not the known release');
    }
    else if (historyChirho.length)
        throw new Error('New review/audit activity on an untargeted parent page');
    return { ...parentChirho, before_chirho: expectedFontStateChirho(parentChirho), targets_chirho: patchChirho.targets_chirho };
}
export function greekAuditChirho(patchChirho: GreekPatchChirho, contextChirho: GreekContextChirho, manifestHashChirho: string): string {
    const entryChirho = greekEntryChirho(patchChirho, contextChirho);
    return JSON.stringify({ ...JSON.parse(fontAuditChirho(entryChirho, manifestHashChirho)), source_chirho: GREEK_VERSION_CHIRHO, parent_manifest_sha256_chirho: contextChirho.parent_manifest_sha256_chirho, prior_events_sha256_chirho: digestChirho(patchChirho.prior_events_chirho) });
}
function rowMatchChirho(aliasChirho: string, fieldsChirho: string[], pathChirho = ''): string {
    return fieldsChirho.map(columnChirho => `${aliasChirho}.${columnChirho} IS json_extract(j_chirho.value,'$${pathChirho}.${columnChirho}')`).join(' AND ');
}
// Workflow: font-drafts-workflow-chirho.md. Exact prior projection/history CAS,
// followed by the original publisher's bounded target UPDATE and assertion.
// Previously published OCR fields are NOT update targets and cannot be cleared.
export function greekStatementsChirho(patchChirho: GreekPatchChirho, contextChirho: GreekContextChirho, manifestHashChirho: string): StatementChirho[] {
    const entryChirho = greekEntryChirho(patchChirho, contextChirho), baseChirho = fontStatementsChirho(entryChirho, manifestHashChirho), beforeChirho = entryChirho.before_chirho;
    const pageFieldsChirho = columnsChirho(pagesChirho), lineFieldsChirho = columnsChirho(scanlinesChirho), segmentFieldsChirho = columnsChirho(segmentsChirho), eventFieldsChirho = columnsChirho(eventsChirho);
    for (const eventChirho of patchChirho.prior_events_chirho)
        if (Object.keys(eventChirho).length !== eventFieldsChirho.length || eventFieldsChirho.some(fieldChirho => !(fieldChirho in eventChirho)))
            throw new Error('Incomplete prior audit row');
    const valuesChirho = [JSON.stringify(beforeChirho.lines_chirho), JSON.stringify(beforeChirho.segments_chirho), JSON.stringify(patchChirho.prior_events_chirho)];
    if (valuesChirho.reduce((sumChirho, valueChirho) => sumChirho + Buffer.byteLength(valueChirho), 0) > 512 * 1024 || beforeChirho.lines_chirho.length > 512 || beforeChirho.segments_chirho.length > 2048)
        throw new Error('Greek page exceeds bounded guard');
    const pageIdChirho = Number(beforeChirho.page_chirho.id_chirho);
    const guardChirho: StatementChirho = { sql: `SELECT json(CASE WHEN EXISTS(SELECT 1 FROM pages_chirho p_chirho WHERE ${pageFieldsChirho.map(fieldChirho => `p_chirho.${fieldChirho} IS ?`).join(' AND ')}
    AND NOT EXISTS(SELECT 1 FROM snippets_chirho n_chirho WHERE n_chirho.page_id_chirho=p_chirho.id_chirho)
    AND NOT EXISTS(SELECT 1 FROM page_snapshots_chirho q_chirho WHERE q_chirho.page_id_chirho=p_chirho.id_chirho)
    AND NOT EXISTS(SELECT 1 FROM scanlines_chirho l_chirho JOIN words_chirho w_chirho ON w_chirho.scanline_id_chirho=l_chirho.id_chirho WHERE l_chirho.page_id_chirho=p_chirho.id_chirho))
    AND (SELECT count(*) FROM scanlines_chirho WHERE page_id_chirho=?)=?
    AND (SELECT count(*) FROM json_each(?) j_chirho JOIN scanlines_chirho l_chirho ON l_chirho.id_chirho=json_extract(j_chirho.value,'$.id_chirho') WHERE ${rowMatchChirho('l_chirho', lineFieldsChirho)})=?
    AND (SELECT count(*) FROM scanlines_chirho l_chirho JOIN segments_chirho s_chirho ON s_chirho.scanline_id_chirho=l_chirho.id_chirho WHERE l_chirho.page_id_chirho=?)=?
    AND (SELECT count(*) FROM json_each(?) j_chirho JOIN segments_chirho s_chirho ON s_chirho.id_chirho=json_extract(j_chirho.value,'$.id_chirho') WHERE ${rowMatchChirho('s_chirho', segmentFieldsChirho)})=?
    AND (SELECT count(*) FROM events_chirho WHERE page_id_chirho=?)=?
    AND (SELECT count(*) FROM json_each(?) j_chirho JOIN events_chirho e_chirho ON e_chirho.seq_chirho=json_extract(j_chirho.value,'$.seq_chirho') WHERE ${rowMatchChirho('e_chirho', eventFieldsChirho)})=?
    THEN 'null' ELSE 'greek-source-or-history-conflict-chirho' END) AS guard_chirho`, params: [...pageFieldsChirho.map(fieldChirho => beforeChirho.page_chirho[fieldChirho]!), pageIdChirho, beforeChirho.lines_chirho.length, valuesChirho[0]!, beforeChirho.lines_chirho.length, pageIdChirho, beforeChirho.segments_chirho.length, valuesChirho[1]!, beforeChirho.segments_chirho.length, pageIdChirho, patchChirho.prior_events_chirho.length, valuesChirho[2]!, patchChirho.prior_events_chirho.length] };
    return [guardChirho, baseChirho[1]!, baseChirho[2]!, { sql: baseChirho[3]!.sql, params: [pageIdChirho, FONT_EVENT_CHIRHO, greekAuditChirho(patchChirho, contextChirho, manifestHashChirho), FONT_ACTOR_CHIRHO] }];
}
export function greekStateMatchesChirho(patchChirho: GreekPatchChirho, contextChirho: GreekContextChirho, valueChirho: FontEntryChirho['before_chirho'], afterChirho: boolean): boolean {
    const entryChirho = greekEntryChirho(patchChirho, contextChirho);
    return sameFontStateChirho(afterChirho ? expectedFontStateChirho(entryChirho) : entryChirho.before_chirho, valueChirho);
}
