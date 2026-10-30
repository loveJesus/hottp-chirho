// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { test, expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_ROOT_CHIRHO } from '../../../config-chirho.ts';
import { fontStatementsChirho, expectedFontStateChirho, FONT_ACTOR_CHIRHO, FONT_EVENT_CHIRHO, type FontEntryChirho, type FontRowChirho } from './model-chirho.ts';
import type { StatementChirho } from '../source-chirho.ts';
export function fixtureFontChirho(): {
    db_chirho: Database;
    entry_chirho: FontEntryChirho;
} {
    const dbChirho = new Database(':memory:');
    dbChirho.exec('PRAGMA foreign_keys=ON');
    for (const nameChirho of ['0001-init-chirho.sql', '0001-scanlines-chirho.sql', '0002-pass1-chirho.sql', '0010-words-events-snapshots-chirho.sql', '0008-scanlines-width-height-chirho.sql', '0009-segments-canonical-chirho.sql'])
        dbChirho.exec(readFileSync(join(PROJECT_ROOT_CHIRHO, 'app-chirho/migrations-chirho', nameChirho), 'utf8'));
    dbChirho.exec('ALTER TABLE pages_chirho ADD COLUMN vision_text_chirho TEXT');
    dbChirho.run("INSERT INTO pages_chirho(volume_number_chirho,page_number_chirho,image_path_chirho,french_text_chirho) VALUES(5,56,'scan-key-chirho','raw page text')");
    dbChirho.run("INSERT INTO scanlines_chirho(page_id_chirho,line_index_chirho,x_min_chirho,y_min_chirho,width_chirho,height_chirho,pdftotext_chirho,segment_count_chirho) VALUES(1,0,10,20,100,30,'raw line',2)");
    dbChirho.run("INSERT INTO segments_chirho(scanline_id_chirho,segment_index_chirho,x_min_px_chirho,width_px_chirho,pdftotext_chirho,script_type_chirho) VALUES(1,0,0,50,'raw codes','hebrew-chirho'),(1,1,50,50,'other raw','greek-chirho')");
    const entryChirho: FontEntryChirho = { page_number_chirho: 56, before_chirho: { page_chirho: dbChirho.query('SELECT * FROM pages_chirho').get() as FontRowChirho, lines_chirho: dbChirho.query('SELECT * FROM scanlines_chirho').all() as FontRowChirho[], segments_chirho: dbChirho.query('SELECT * FROM segments_chirho').all() as FontRowChirho[] }, targets_chirho: [{ id_chirho: 1, text_chirho: 'כִּי־אָדָם', glyph_seqs_chirho: [1, 2, 3] }, { id_chirho: 2, text_chirho: 'γεννᾶται', glyph_seqs_chirho: [4, 5, 6] }], payload_sha256_chirho: 'a'.repeat(64), image_sha256_chirho: 'b'.repeat(64), pdf_sha256_chirho: 'c'.repeat(64), held_chirho: {} };
    return { db_chirho: dbChirho, entry_chirho: entryChirho };
}
export function executeFontChirho(dbChirho: Database, statementsChirho: StatementChirho[]): void { dbChirho.transaction(() => { for (const statementChirho of statementsChirho)
    dbChirho.query(statementChirho.sql).run(...(statementChirho.params ?? [])); })(); }
function stateChirho(dbChirho: Database) { return { page_chirho: dbChirho.query('SELECT * FROM pages_chirho').get(), lines_chirho: dbChirho.query('SELECT * FROM scanlines_chirho').all(), segments_chirho: dbChirho.query('SELECT * FROM segments_chirho').all() }; }
test('font batch changes only OCR draft text with one explicitly machine audit, never accepted/status/raw/page fields', () => {
    const { db_chirho: dbChirho, entry_chirho: entryChirho } = fixtureFontChirho(), beforeChirho = structuredClone(entryChirho);
    executeFontChirho(dbChirho, fontStatementsChirho(entryChirho, 'd'.repeat(64)));
    expect(stateChirho(dbChirho)).toEqual(expectedFontStateChirho(entryChirho));
    expect(entryChirho).toEqual(beforeChirho);
    const eventsChirho = dbChirho.query('SELECT * FROM events_chirho').all() as FontRowChirho[];
    expect(eventsChirho.length).toBe(1);
    expect(eventsChirho[0]!.reviewer_chirho).toBe(FONT_ACTOR_CHIRHO);
    expect(eventsChirho[0]!.event_type_chirho).toBe(FONT_EVENT_CHIRHO);
    expect(eventsChirho[0]!.word_id_chirho).toBeNull();
    expect(eventsChirho[0]!.scanline_id_chirho).toBeNull();
    expect(JSON.parse(String(eventsChirho[0]!.payload_json_chirho)).approved_chirho).toBe(false);
    dbChirho.close();
});
test('stale raw text, parent, box, script, status, OCR or accepted reading refuses without any write', () => {
    for (const sqlChirho of ["UPDATE segments_chirho SET pdftotext_chirho='changed' WHERE id_chirho=1", "UPDATE segments_chirho SET x_min_px_chirho=1 WHERE id_chirho=1", "UPDATE segments_chirho SET script_type_chirho='unknown-chirho' WHERE id_chirho=1", "UPDATE segments_chirho SET status_chirho='human-confirmed-chirho' WHERE id_chirho=1", "UPDATE segments_chirho SET ocr_text_chirho='other' WHERE id_chirho=1", "UPDATE segments_chirho SET accepted_text_chirho='reviewed' WHERE id_chirho=1", "UPDATE scanlines_chirho SET y_min_chirho=21", "UPDATE scanlines_chirho SET reconstructed_text_chirho='reviewed line'", "UPDATE pages_chirho SET image_path_chirho='changed'", "UPDATE pages_chirho SET lines_approved_at_chirho='today'"]) {
        const { db_chirho: dbChirho, entry_chirho: entryChirho } = fixtureFontChirho();
        dbChirho.exec(sqlChirho);
        const beforeChirho = dbChirho.serialize();
        expect(() => executeFontChirho(dbChirho, fontStatementsChirho(entryChirho, 'd'.repeat(64)))).toThrow();
        expect(dbChirho.serialize()).toEqual(beforeChirho);
        dbChirho.close();
    }
});
test('any event, word, snippet or snapshot activity blocks the page, including a new review on a nontarget segment', () => {
    for (const sqlChirho of ["INSERT INTO events_chirho(page_id_chirho,aggregate_type_chirho,event_type_chirho,payload_json_chirho) VALUES(1,'page-chirho','page-completed-chirho','{}')", "INSERT INTO snippets_chirho(page_id_chirho,snippet_index_chirho) VALUES(1,0)", "INSERT INTO page_snapshots_chirho(page_id_chirho,underlay_json_chirho) VALUES(1,'{}')", "INSERT INTO words_chirho(scanline_id_chirho,word_index_chirho) VALUES(1,0)", "INSERT INTO segments_chirho(scanline_id_chirho,segment_index_chirho,accepted_text_chirho) VALUES(1,2,'reviewed')"]) {
        const { db_chirho: dbChirho, entry_chirho: entryChirho } = fixtureFontChirho();
        dbChirho.exec(sqlChirho);
        const beforeChirho = dbChirho.serialize();
        expect(() => executeFontChirho(dbChirho, fontStatementsChirho(entryChirho, 'd'.repeat(64)))).toThrow();
        expect(dbChirho.serialize()).toEqual(beforeChirho);
        dbChirho.close();
    }
});
test('ignored projection and late audit failure roll back all draft writes', () => {
    for (const triggerChirho of ["CREATE TRIGGER ignore_font_chirho BEFORE UPDATE ON segments_chirho WHEN NEW.id_chirho=2 BEGIN SELECT RAISE(IGNORE); END", "CREATE TRIGGER fail_audit_chirho BEFORE INSERT ON events_chirho BEGIN SELECT RAISE(ABORT,'audit failure'); END"]) {
        const { db_chirho: dbChirho, entry_chirho: entryChirho } = fixtureFontChirho();
        dbChirho.exec(triggerChirho);
        const beforeChirho = dbChirho.serialize();
        expect(() => executeFontChirho(dbChirho, fontStatementsChirho(entryChirho, 'd'.repeat(64)))).toThrow();
        expect(dbChirho.serialize()).toEqual(beforeChirho);
        dbChirho.close();
    }
});
test('repeat refuses rather than duplicating an audit or replacing a draft', () => {
    const { db_chirho: dbChirho, entry_chirho: entryChirho } = fixtureFontChirho();
    executeFontChirho(dbChirho, fontStatementsChirho(entryChirho, 'd'.repeat(64)));
    const beforeChirho = dbChirho.serialize();
    expect(() => executeFontChirho(dbChirho, fontStatementsChirho(entryChirho, 'd'.repeat(64)))).toThrow();
    expect(dbChirho.serialize()).toEqual(beforeChirho);
    dbChirho.close();
});
test('protected pages, partial baseline, duplicate ids/coverage and untrusted Unicode refuse before SQL', () => {
    const { db_chirho: dbChirho, entry_chirho: entryChirho } = fixtureFontChirho();
    const mutateChirho = [(valueChirho: FontEntryChirho) => { valueChirho.page_number_chirho = 148; valueChirho.before_chirho.page_chirho.page_number_chirho = 148; }, (valueChirho: FontEntryChirho) => { delete valueChirho.before_chirho.page_chirho.vision_text_chirho; }, (valueChirho: FontEntryChirho) => { valueChirho.targets_chirho.push(valueChirho.targets_chirho[0]!); }, (valueChirho: FontEntryChirho) => { valueChirho.targets_chirho[0]!.text_chirho = ''; }, (valueChirho: FontEntryChirho) => { valueChirho.targets_chirho[0]!.text_chirho = '�'; }, (valueChirho: FontEntryChirho) => { valueChirho.targets_chirho[0]!.glyph_seqs_chirho = [4]; }, (valueChirho: FontEntryChirho) => { valueChirho.targets_chirho[0]!.glyph_seqs_chirho = [1, 1]; }];
    for (const mutationChirho of mutateChirho) {
        const valueChirho = structuredClone(entryChirho);
        mutationChirho(valueChirho);
        expect(() => fontStatementsChirho(valueChirho, 'd'.repeat(64))).toThrow();
    }
    dbChirho.close();
});
