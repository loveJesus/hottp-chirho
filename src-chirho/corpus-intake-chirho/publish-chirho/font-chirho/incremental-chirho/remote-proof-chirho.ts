// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { join } from 'node:path';
import { apiChirho, queryChirho, DATABASE_ID_CHIRHO } from '../../cloud-chirho.ts';
import { fontStatementsChirho, expectedFontStateChirho, type FontRowChirho } from '../model-chirho.ts';
import { sameFontStateChirho } from '../apply-chirho.ts';
import { savePrivateChirho } from '../../legacy-chirho/prepare-chirho.ts';
import { loadGreekManifestChirho, GREEK_ROOT_CHIRHO } from './prepare-chirho.ts';
import { greekStatementsChirho, greekEntryChirho } from './model-chirho.ts';
import { greekHistoryMatchesChirho } from './apply-chirho.ts';
// Actual D1 grammar, index-plan and transactional carry-over proof. The new
// disposable database is seeded with unreviewed book rows, never credentials.
const { manifestChirho, contextsChirho } = await loadGreekManifestChirho();
const patchChirho = structuredClone(manifestChirho.patches_chirho.find(patchChirho => patchChirho.page_number_chirho === 500)!);
const contextChirho = contextsChirho.get(500)!, parentChirho = contextChirho.parent_chirho;
if (!patchChirho.targets_chirho.length || !parentChirho.targets_chirho.length)
    throw new Error('Proof needs both old and new drafts');
const nameChirho = `hottp-greek-proof-${crypto.randomUUID().slice(0, 8)}-chirho`, createdChirho = await apiChirho('d1/database', 'POST', { name: nameChirho }) as {
    uuid: string;
    name: string;
}, idChirho = createdChirho.uuid;
if (!/^[a-f0-9-]{36}$/.test(idChirho) || idChirho === DATABASE_ID_CHIRHO || createdChirho.name !== nameChirho)
    throw new Error('Unsafe Greek proof target');
console.log(`Disposable incremental Greek D1: ${idChirho}`);
const checksChirho: string[] = [];
try {
    const schemaChirho = (await queryChirho([{ sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name IN('pages_chirho','scanlines_chirho','segments_chirho','events_chirho','words_chirho','snippets_chirho','page_snapshots_chirho')" }, { sql: "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL AND tbl_name IN('pages_chirho','scanlines_chirho','segments_chirho','events_chirho','words_chirho','snippets_chirho','page_snapshots_chirho')" }])).flatMap(resultChirho => resultChirho.results);
    await queryChirho(schemaChirho.map(rowChirho => ({ sql: String(rowChirho.sql) })), idChirho);
    for (const [tableChirho, rowsChirho] of [['pages_chirho', [parentChirho.before_chirho.page_chirho]], ['scanlines_chirho', parentChirho.before_chirho.lines_chirho], ['segments_chirho', parentChirho.before_chirho.segments_chirho]] as const) {
        const columnsChirho = Object.keys(rowsChirho[0]!);
        await queryChirho([{ sql: `INSERT INTO ${tableChirho}(${columnsChirho.join(',')}) SELECT ${columnsChirho.map(columnChirho => `json_extract(value,'$.${columnChirho}')`).join(',')} FROM json_each(?)`, params: [JSON.stringify(rowsChirho)] }], idChirho);
    }
    await queryChirho(fontStatementsChirho(parentChirho, contextChirho.parent_manifest_sha256_chirho), idChirho);
    patchChirho.prior_events_chirho = (await queryChirho([{ sql: 'SELECT * FROM events_chirho ORDER BY seq_chirho' }], idChirho))[0]!.results as FontRowChirho[];
    const stateChirho = async () => { const resultsChirho = await queryChirho([{ sql: 'SELECT * FROM pages_chirho' }, { sql: 'SELECT * FROM scanlines_chirho ORDER BY line_index_chirho' }, { sql: 'SELECT s_chirho.* FROM scanlines_chirho l_chirho JOIN segments_chirho s_chirho ON s_chirho.scanline_id_chirho=l_chirho.id_chirho ORDER BY l_chirho.line_index_chirho,s_chirho.segment_index_chirho' }, { sql: 'SELECT * FROM events_chirho ORDER BY seq_chirho' }], idChirho); return { projectionChirho: { page_chirho: resultsChirho[0]!.results[0] as FontRowChirho, lines_chirho: resultsChirho[1]!.results as FontRowChirho[], segments_chirho: resultsChirho[2]!.results as FontRowChirho[] }, eventsChirho: resultsChirho[3]!.results as FontRowChirho[] }; };
    const unchangedChirho = async () => { const valueChirho = await stateChirho(); if (!sameFontStateChirho(expectedFontStateChirho(parentChirho), valueChirho.projectionChirho) || !greekHistoryMatchesChirho(patchChirho, contextChirho, valueChirho.eventsChirho, manifestChirho.sha256_chirho, false))
        throw new Error('Remote failed patch changed a prior row or audit'); };
    const refusedChirho = async (labelChirho: string) => { let refusedChirho = false; try {
        await queryChirho(greekStatementsChirho(patchChirho, contextChirho, manifestChirho.sha256_chirho), idChirho);
    }
    catch {
        refusedChirho = true;
    } if (!refusedChirho)
        throw new Error('Remote negative control unexpectedly passed: ' + labelChirho); checksChirho.push(labelChirho); };
    const guardChirho = greekStatementsChirho(patchChirho, contextChirho, manifestChirho.sha256_chirho)[0]!;
    const planChirho = (await queryChirho([{ sql: 'EXPLAIN QUERY PLAN ' + guardChirho.sql, params: guardChirho.params ?? [] }], idChirho))[0]!.results.map(rowChirho => String(rowChirho.detail));
    if (!planChirho.some(detailChirho => detailChirho.includes('idx_scanlines_page_chirho')) || !planChirho.some(detailChirho => detailChirho.includes('idx_segments_scanline_chirho')) || planChirho.some(detailChirho => /SCAN (?:p_chirho|l_chirho|s_chirho|e_chirho|w_chirho|n_chirho|q_chirho)(?:\s|$)/.test(detailChirho)))
        throw new Error('Greek guard lost its page/PK index bounds');
    checksChirho.push('actual D1 guard plan stays page-index/primary-key bounded');
    await queryChirho([{ sql: `CREATE TRIGGER ignore_greek_chirho BEFORE UPDATE ON segments_chirho WHEN NEW.id_chirho=${patchChirho.targets_chirho[0]!.id_chirho} BEGIN SELECT RAISE(IGNORE); END` }], idChirho);
    await refusedChirho('ignored update rolls back the entire new patch and audit');
    await unchangedChirho();
    await queryChirho([{ sql: 'DROP TRIGGER ignore_greek_chirho' }], idChirho);
    await queryChirho([{ sql: "CREATE TRIGGER abort_greek_chirho BEFORE INSERT ON events_chirho BEGIN SELECT RAISE(ABORT,'Greek audit failure'); END" }], idChirho);
    await refusedChirho('late audit failure preserves all prior OCR/history');
    await unchangedChirho();
    await queryChirho([{ sql: 'DROP TRIGGER abort_greek_chirho' }], idChirho);
    const oldTargetChirho = parentChirho.targets_chirho[0]!;
    await queryChirho([{ sql: "UPDATE segments_chirho SET ocr_text_chirho='changed prior draft' WHERE id_chirho=?", params: [oldTargetChirho.id_chirho] }], idChirho);
    await refusedChirho('changed earlier OCR refuses the new patch');
    await queryChirho([{ sql: 'UPDATE segments_chirho SET ocr_text_chirho=? WHERE id_chirho=?', params: [oldTargetChirho.text_chirho, oldTargetChirho.id_chirho] }], idChirho);
    await unchangedChirho();
    await queryChirho([{ sql: "UPDATE events_chirho SET payload_json_chirho='{}'" }], idChirho);
    await refusedChirho('changed prior audit refuses the new patch');
    await queryChirho([{ sql: 'UPDATE events_chirho SET payload_json_chirho=?', params: [String(patchChirho.prior_events_chirho[0]!.payload_json_chirho)] }], idChirho);
    await unchangedChirho();
    await queryChirho(greekStatementsChirho(patchChirho, contextChirho, manifestChirho.sha256_chirho), idChirho);
    const afterChirho = await stateChirho();
    if (!sameFontStateChirho(expectedFontStateChirho(greekEntryChirho(patchChirho, contextChirho)), afterChirho.projectionChirho) || !greekHistoryMatchesChirho(patchChirho, contextChirho, afterChirho.eventsChirho, manifestChirho.sha256_chirho, true))
        throw new Error('Remote incremental success differs from exact expected state');
    checksChirho.push('successful append preserves old fields/audit and adds only new OCR plus one machine audit');
    await refusedChirho('repeat refuses without replacement or a second new audit');
    const repeatChirho = await stateChirho();
    if (!sameFontStateChirho(afterChirho.projectionChirho, repeatChirho.projectionChirho) || JSON.stringify(afterChirho.eventsChirho) !== JSON.stringify(repeatChirho.eventsChirho))
        throw new Error('Refused repeat changed state');
    await savePrivateChirho(join(GREEK_ROOT_CHIRHO, 'remote-proof-chirho.json'), { verified_at_chirho: new Date().toISOString(), manifest_sha256_chirho: manifestChirho.sha256_chirho, checks_chirho: checksChirho, guard_plan_chirho: planChirho, production_rows_written_chirho: 0 });
    console.log(JSON.stringify({ checks_chirho: checksChirho }));
}
finally {
    const currentChirho = await apiChirho(`d1/database/${idChirho}`) as {
        uuid: string;
        name: string;
    };
    if (currentChirho.uuid !== idChirho || currentChirho.name !== nameChirho)
        throw new Error('Disposable Greek DB identity mismatch');
    await apiChirho(`d1/database/${idChirho}`, 'DELETE');
    console.log(`Removed synthetic-only Greek proof D1 ${idChirho}`);
}
