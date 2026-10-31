// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { test, expect } from 'bun:test';
import { fixtureFontChirho, executeFontChirho } from '../test-fixture-chirho.ts';
import { fontStatementsChirho, expectedFontStateChirho, type FontRowChirho } from '../model-chirho.ts';
import { greekStatementsChirho, greekEntryChirho, greekAuditChirho, type GreekPatchChirho, type GreekContextChirho } from './model-chirho.ts';
function fixtureGreekChirho() {
    const { db_chirho: dbChirho, entry_chirho: parentChirho } = fixtureFontChirho();
    dbChirho.exec("INSERT INTO segments_chirho(scanline_id_chirho,segment_index_chirho,x_min_px_chirho,width_px_chirho,pdftotext_chirho,script_type_chirho) VALUES(1,2,80,20,'held font codes','greek-chirho'); UPDATE scanlines_chirho SET segment_count_chirho=3");
    parentChirho.before_chirho.lines_chirho = dbChirho.query('SELECT * FROM scanlines_chirho').all() as FontRowChirho[];
    parentChirho.before_chirho.segments_chirho = dbChirho.query('SELECT * FROM segments_chirho ORDER BY id_chirho').all() as FontRowChirho[];
    const parentHashChirho = 'd'.repeat(64);
    executeFontChirho(dbChirho, fontStatementsChirho(parentChirho, parentHashChirho));
    const patchChirho: GreekPatchChirho = { page_number_chirho: 56, targets_chirho: [{ id_chirho: 3, text_chirho: 'ἑαυτοῦ', glyph_seqs_chirho: [7, 8, 9] }], prior_events_chirho: dbChirho.query('SELECT * FROM events_chirho').all() as FontRowChirho[] };
    const contextChirho: GreekContextChirho = { parent_chirho: parentChirho, parent_manifest_sha256_chirho: parentHashChirho };
    return { dbChirho, patchChirho, contextChirho };
}
test('incremental patch adds only NULL Greek OCR, retaining old OCR/raw/status and the original audit', () => {
    const { dbChirho, patchChirho, contextChirho } = fixtureGreekChirho(), oldEventChirho = patchChirho.prior_events_chirho[0];
    executeFontChirho(dbChirho, greekStatementsChirho(patchChirho, contextChirho, 'e'.repeat(64)));
    const afterChirho = expectedFontStateChirho(greekEntryChirho(patchChirho, contextChirho));
    expect(dbChirho.query('SELECT * FROM segments_chirho ORDER BY id_chirho').all()).toEqual(afterChirho.segments_chirho);
    expect(dbChirho.query('SELECT * FROM pages_chirho').get()).toEqual(afterChirho.page_chirho);
    const eventsChirho = dbChirho.query('SELECT * FROM events_chirho ORDER BY seq_chirho').all() as FontRowChirho[];
    expect(eventsChirho.length).toBe(2);
    expect(eventsChirho[0]).toEqual(oldEventChirho);
    expect(eventsChirho[1]!.payload_json_chirho).toBe(greekAuditChirho(patchChirho, contextChirho, 'e'.repeat(64)));
    expect(eventsChirho[1]!.reviewer_chirho).toBe('font-decoder-chirho');
    expect(JSON.parse(String(eventsChirho[1]!.payload_json_chirho)).approved_chirho).toBe(false);
    dbChirho.close();
});
test('any previous OCR/source/geometry or history change refuses atomically', () => {
    for (const sqlChirho of ["UPDATE segments_chirho SET ocr_text_chirho='different earlier draft' WHERE id_chirho=1", "UPDATE segments_chirho SET pdftotext_chirho='different raw' WHERE id_chirho=3", "UPDATE segments_chirho SET accepted_text_chirho='reviewed' WHERE id_chirho=3", "UPDATE segments_chirho SET status_chirho='human-confirmed-chirho' WHERE id_chirho=2", "UPDATE segments_chirho SET x_min_px_chirho=1 WHERE id_chirho=1", "UPDATE scanlines_chirho SET y_min_chirho=21", "UPDATE pages_chirho SET image_path_chirho='changed scan'", "UPDATE events_chirho SET payload_json_chirho='{}'", "DELETE FROM events_chirho", "INSERT INTO events_chirho(page_id_chirho,aggregate_type_chirho,event_type_chirho,payload_json_chirho) VALUES(1,'page-chirho','page-completed-chirho','{}')"]) {
        const { dbChirho, patchChirho, contextChirho } = fixtureGreekChirho();
        dbChirho.exec(sqlChirho);
        const beforeChirho = dbChirho.serialize();
        expect(() => executeFontChirho(dbChirho, greekStatementsChirho(patchChirho, contextChirho, 'e'.repeat(64)))).toThrow();
        expect(dbChirho.serialize()).toEqual(beforeChirho);
        dbChirho.close();
    }
});
test('caller cannot target existing OCR, another script, overlap glyphs or counterfeit parent audit', () => {
    const { dbChirho, patchChirho, contextChirho } = fixtureGreekChirho();
    for (const changeChirho of [(pChirho: GreekPatchChirho) => { pChirho.targets_chirho[0]!.id_chirho = 2; }, (pChirho: GreekPatchChirho) => { pChirho.targets_chirho[0]!.id_chirho = 1; }, (pChirho: GreekPatchChirho) => { pChirho.targets_chirho[0]!.glyph_seqs_chirho = [1]; }, (pChirho: GreekPatchChirho) => { pChirho.prior_events_chirho[0]!.payload_json_chirho = '{}'; }, (pChirho: GreekPatchChirho) => { pChirho.prior_events_chirho = []; }]) {
        const valueChirho = structuredClone(patchChirho);
        changeChirho(valueChirho);
        expect(() => greekStatementsChirho(valueChirho, contextChirho, 'e'.repeat(64))).toThrow();
    }
    dbChirho.close();
});
test('partial ignored UPDATE or late audit error cannot leave new OCR or a stray event', () => {
    for (const sqlChirho of ["CREATE TRIGGER ignore_greek_chirho BEFORE UPDATE ON segments_chirho WHEN NEW.id_chirho=3 BEGIN SELECT RAISE(IGNORE); END", "CREATE TRIGGER abort_greek_chirho BEFORE INSERT ON events_chirho BEGIN SELECT RAISE(ABORT,'audit refused'); END"]) {
        const { dbChirho, patchChirho, contextChirho } = fixtureGreekChirho();
        dbChirho.exec(sqlChirho);
        const beforeChirho = dbChirho.serialize();
        expect(() => executeFontChirho(dbChirho, greekStatementsChirho(patchChirho, contextChirho, 'e'.repeat(64)))).toThrow();
        expect(dbChirho.serialize()).toEqual(beforeChirho);
        dbChirho.close();
    }
});
test('repeat is a refusal, not an overwrite or second audit', () => {
    const { dbChirho, patchChirho, contextChirho } = fixtureGreekChirho();
    executeFontChirho(dbChirho, greekStatementsChirho(patchChirho, contextChirho, 'e'.repeat(64)));
    const beforeChirho = dbChirho.serialize();
    expect(() => executeFontChirho(dbChirho, greekStatementsChirho(patchChirho, contextChirho, 'e'.repeat(64)))).toThrow();
    expect(dbChirho.serialize()).toEqual(beforeChirho);
    dbChirho.close();
});
