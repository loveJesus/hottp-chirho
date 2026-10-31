// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_ROOT_CHIRHO } from '../../../config-chirho.ts';
import type { FontEntryChirho, FontRowChirho } from './model-chirho.ts';
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
export function executeFontChirho(dbChirho: Database, statementsChirho: StatementChirho[]): void {
    dbChirho.transaction(() => {
        for (const statementChirho of statementsChirho)
            dbChirho.query(statementChirho.sql).run(...(statementChirho.params ?? []));
    })();
}
