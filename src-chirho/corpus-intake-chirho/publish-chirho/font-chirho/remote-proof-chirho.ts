// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { join } from 'node:path';
import { apiChirho, queryChirho, DATABASE_ID_CHIRHO } from '../cloud-chirho.ts';
import { savePrivateChirho } from '../legacy-chirho/prepare-chirho.ts';
import { FONT_ROOT_CHIRHO } from './source-chirho.ts';
import { loadFontManifestChirho, sameFontStateChirho } from './apply-chirho.ts';
import { fontStatementsChirho, expectedFontStateChirho, FONT_ACTOR_CHIRHO, FONT_EVENT_CHIRHO, type FontRowChirho } from './model-chirho.ts';
// Test actual D1 batches with production DDL, in a new disposable DB only.
// No reviewer data/credentials are copied; no production row is written.
const { manifest_chirho: manifestChirho, entries_chirho: entriesChirho } = await loadFontManifestChirho();
const entryChirho = structuredClone(entriesChirho.find(valueChirho => valueChirho.page_number_chirho === 56)!);
const nameChirho = `hottp-font-proof-${crypto.randomUUID().slice(0, 8)}-chirho`;
const createdChirho = await apiChirho('d1/database', 'POST', { name: nameChirho }) as {
    uuid: string;
    name: string;
};
const idChirho = createdChirho.uuid;
if (!/^[a-f0-9-]{36}$/.test(idChirho) || idChirho === DATABASE_ID_CHIRHO || createdChirho.name !== nameChirho)
    throw new Error('Unsafe remote font proof target');
console.log(`Disposable font proof D1: ${idChirho}`);
const checksChirho: string[] = [];
try {
    const schemaChirho = (await queryChirho([{ sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name IN('pages_chirho','scanlines_chirho','segments_chirho','words_chirho','events_chirho','snippets_chirho','page_snapshots_chirho')" }]))[0]!.results;
    if (schemaChirho.length !== 7)
        throw new Error('Missing production DDL');
    await queryChirho(schemaChirho.map(rowChirho => ({ sql: String(rowChirho.sql) })), idChirho);
    for (const [tableChirho, rowsChirho] of [['pages_chirho', [entryChirho.before_chirho.page_chirho]], ['scanlines_chirho', entryChirho.before_chirho.lines_chirho], ['segments_chirho', entryChirho.before_chirho.segments_chirho]] as const) {
        const columnsChirho = Object.keys(rowsChirho[0]!);
        await queryChirho([{ sql: `INSERT INTO ${tableChirho}(${columnsChirho.join(',')}) SELECT ${columnsChirho.map(columnChirho => `json_extract(value,'$.${columnChirho}')`).join(',')} FROM json_each(?)`, params: [JSON.stringify(rowsChirho)] }], idChirho);
    }
    const stateChirho = async () => { const rowsChirho = await queryChirho([{ sql: 'SELECT * FROM pages_chirho' }, { sql: 'SELECT * FROM scanlines_chirho ORDER BY line_index_chirho' }, { sql: 'SELECT s_chirho.* FROM segments_chirho s_chirho JOIN scanlines_chirho l_chirho ON l_chirho.id_chirho=s_chirho.scanline_id_chirho ORDER BY l_chirho.line_index_chirho,s_chirho.segment_index_chirho' }], idChirho); return { page_chirho: rowsChirho[0]!.results[0] as FontRowChirho, lines_chirho: rowsChirho[1]!.results as FontRowChirho[], segments_chirho: rowsChirho[2]!.results as FontRowChirho[] }; };
    const noWritesChirho = async () => { if (!sameFontStateChirho(entryChirho.before_chirho, await stateChirho()) || (await queryChirho([{ sql: 'SELECT count(*) AS count_chirho FROM events_chirho' }], idChirho))[0]!.results[0]!.count_chirho !== 0)
        throw new Error('Remote failed batch committed a draft or audit'); };
    const refusedChirho = async (labelChirho: string) => { let failedChirho = false; try {
        await queryChirho(fontStatementsChirho(entryChirho, manifestChirho.sha256_chirho), idChirho);
    }
    catch {
        failedChirho = true;
    } if (!failedChirho)
        throw new Error(`Remote negative control did not refuse: ${labelChirho}`); checksChirho.push(labelChirho); };
    await queryChirho([{ sql: `CREATE TRIGGER ignore_font_chirho BEFORE UPDATE ON segments_chirho WHEN NEW.id_chirho=${entryChirho.targets_chirho[0]!.id_chirho} BEGIN SELECT RAISE(IGNORE); END` }], idChirho);
    await refusedChirho('ignored update rolls back every OCR write and the audit');
    await noWritesChirho();
    await queryChirho([{ sql: 'DROP TRIGGER ignore_font_chirho' }], idChirho);
    await queryChirho([{ sql: "CREATE TRIGGER abort_audit_chirho BEFORE INSERT ON events_chirho BEGIN SELECT RAISE(ABORT,'font audit failure'); END" }], idChirho);
    await refusedChirho('late audit failure rolls back every OCR write');
    await noWritesChirho();
    await queryChirho([{ sql: 'DROP TRIGGER abort_audit_chirho' }], idChirho);
    await queryChirho([{ sql: "UPDATE segments_chirho SET pdftotext_chirho='changed source' WHERE id_chirho=?", params: [entryChirho.targets_chirho[0]!.id_chirho] }], idChirho);
    await refusedChirho('changed raw source refuses before OCR update');
    await queryChirho([{ sql: 'UPDATE segments_chirho SET pdftotext_chirho=? WHERE id_chirho=?', params: [entryChirho.before_chirho.segments_chirho.find(segmentChirho => segmentChirho.id_chirho === entryChirho.targets_chirho[0]!.id_chirho)!.pdftotext_chirho!, entryChirho.targets_chirho[0]!.id_chirho] }], idChirho);
    await noWritesChirho();
    await queryChirho(fontStatementsChirho(entryChirho, manifestChirho.sha256_chirho), idChirho);
    if (!sameFontStateChirho(expectedFontStateChirho(entryChirho), await stateChirho()))
        throw new Error('Remote projection changed non-OCR fields');
    checksChirho.push('clean atomic batch changes only expected OCR fields');
    const eventsChirho = (await queryChirho([{ sql: 'SELECT * FROM events_chirho' }], idChirho))[0]!.results;
    if (eventsChirho.length !== 1 || eventsChirho[0]!.event_type_chirho !== FONT_EVENT_CHIRHO || eventsChirho[0]!.reviewer_chirho !== FONT_ACTOR_CHIRHO || JSON.parse(String(eventsChirho[0]!.payload_json_chirho)).approved_chirho !== false)
        throw new Error('Bad remote machine audit');
    checksChirho.push('one machine-only unapproved audit, no human receipt');
    await refusedChirho('repeat refuses instead of overwriting/duplicating');
    if (!sameFontStateChirho(expectedFontStateChirho(entryChirho), await stateChirho()))
        throw new Error('Repeat changed OCR projection');
    await savePrivateChirho(join(FONT_ROOT_CHIRHO, 'remote-proof-chirho.json'), { verified_at_chirho: new Date().toISOString(), manifest_sha256_chirho: manifestChirho.sha256_chirho, checks_chirho: checksChirho, production_rows_written_chirho: 0 });
    console.log(JSON.stringify({ checks_chirho: checksChirho }));
}
finally {
    const currentChirho = await apiChirho(`d1/database/${idChirho}`) as {
        uuid: string;
        name: string;
    };
    if (currentChirho.uuid !== idChirho || currentChirho.name !== nameChirho)
        throw new Error('Disposable font DB identity changed; refusing cleanup');
    await apiChirho(`d1/database/${idChirho}`, 'DELETE');
    console.log(`Removed synthetic-only font proof D1 ${idChirho}`);
}
