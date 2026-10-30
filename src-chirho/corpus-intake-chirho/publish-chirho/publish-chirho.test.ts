// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { test, expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_ROOT_CHIRHO } from '../../config-chirho.ts';
import { statementsChirho, imageKeyChirho, sha256Chirho, boundedLineChirho, type PagePayloadChirho, type StatementChirho } from './source-chirho.ts';

export function fixturePayloadChirho(pageChirho = 1): PagePayloadChirho {
  return {page_chirho: [1, pageChirho, "Machine draft: l'ancien texte עברית", imageKeyChirho(1, pageChirho)],
    lines_chirho: [[0, 10, 20, 100, 24, 'Texte אב', 2], [1, 10, 50, 100, 24, 'Suite', 1]],
    segments_chirho: [[0, 0, 0, 0, 0, 60, 'Texte', 'french-chirho'], [0, 1, 1, 1, 60, 40, 'אב', 'hebrew-chirho'], [1, 0, 0, 0, 0, 100, 'Suite', 'french-chirho']]};
}
function fixtureDbChirho(): Database {
  const dbChirho = new Database(':memory:');
  dbChirho.exec('PRAGMA foreign_keys=ON');
  for (const migrationChirho of ['0001-init-chirho.sql', '0001-scanlines-chirho.sql']) dbChirho.exec(readFileSync(join(PROJECT_ROOT_CHIRHO, 'app-chirho/migrations-chirho', migrationChirho), 'utf8'));
  // Production was seeded outside migrations and uses width/height, as does
  // the current typed schema. The separate remote proof copies actual DDL.
  dbChirho.exec('ALTER TABLE scanlines_chirho RENAME COLUMN x_max_chirho TO width_chirho; ALTER TABLE scanlines_chirho RENAME COLUMN y_max_chirho TO height_chirho');
  return dbChirho;
}
function applyChirho(dbChirho: Database, batchChirho: StatementChirho[]): void {
  dbChirho.transaction(() => { for (const statementChirho of batchChirho) dbChirho.query(statementChirho.sql).run(...(statementChirho.params ?? [])); })();
}
test('inserts only drafts and maps generated IDs by volume/page and line coordinates', () => {
  const dbChirho = fixtureDbChirho();
  dbChirho.exec("INSERT INTO pages_chirho(id_chirho,volume_number_chirho,page_number_chirho,french_text_chirho) VALUES(123,2,99,'Existing'); INSERT INTO scanlines_chirho(id_chirho,page_id_chirho,line_index_chirho) VALUES(456,123,0)");
  applyChirho(dbChirho, statementsChirho(fixturePayloadChirho()));
  expect(dbChirho.query('SELECT count(*) AS n_chirho FROM segments_chirho').get()).toEqual({n_chirho: 3});
  expect(dbChirho.query('SELECT french_text_chirho,status_chirho FROM pages_chirho WHERE volume_number_chirho=1').get()).toEqual({french_text_chirho: fixturePayloadChirho().page_chirho[2],status_chirho:'pending-chirho'});
  expect(dbChirho.query("SELECT count(*) AS n_chirho FROM segments_chirho WHERE accepted_text_chirho IS NOT NULL OR ocr_text_chirho IS NOT NULL OR status_chirho!='pending-chirho'").get()).toEqual({n_chirho:0});
  expect(dbChirho.query('SELECT count(*) AS n_chirho FROM segments_chirho WHERE scanline_id_chirho=456').get()).toEqual({n_chirho:0});
  dbChirho.close();
});
test('duplicate existing page aborts the whole batch, preserving its review and unrelated rows', () => {
  const dbChirho = fixtureDbChirho();
  applyChirho(dbChirho, statementsChirho(fixturePayloadChirho(2)));
  dbChirho.exec("UPDATE segments_chirho SET accepted_text_chirho='Reviewed',status_chirho='human-confirmed-chirho' WHERE segment_index_chirho=1");
  const beforeChirho = dbChirho.serialize();
  expect(() => applyChirho(dbChirho, [...statementsChirho(fixturePayloadChirho(1)), ...statementsChirho(fixturePayloadChirho(2))])).toThrow();
  expect(dbChirho.query('SELECT page_number_chirho FROM pages_chirho').all()).toEqual([{page_number_chirho:2}]);
  expect(dbChirho.query("SELECT accepted_text_chirho FROM segments_chirho WHERE segment_index_chirho=1").get()).toEqual({accepted_text_chirho:'Reviewed'});
  expect(dbChirho.serialize()).toEqual(beforeChirho);
  dbChirho.close();
});
test('late segment failure rolls back the new page and all scanlines; a clean retry works', () => {
  const dbChirho = fixtureDbChirho();
  const brokenChirho = fixturePayloadChirho();
  brokenChirho.segments_chirho.push(brokenChirho.segments_chirho[0]!);
  expect(() => applyChirho(dbChirho, statementsChirho(brokenChirho))).toThrow();
  expect(dbChirho.query('SELECT count(*) AS n_chirho FROM pages_chirho').get()).toEqual({n_chirho:0});
  expect(dbChirho.query('SELECT count(*) AS n_chirho FROM scanlines_chirho').get()).toEqual({n_chirho:0});
  applyChirho(dbChirho, statementsChirho(fixturePayloadChirho()));
  expect(dbChirho.query('SELECT count(*) AS n_chirho FROM segments_chirho').get()).toEqual({n_chirho:3});
  dbChirho.close();
});
test('SQL metacharacters remain text and zero-width machine fragments are not fabricated or lost', () => {
  const dbChirho = fixtureDbChirho();
  const payloadChirho = fixturePayloadChirho();
  payloadChirho.segments_chirho[0]![5] = 0;
  payloadChirho.segments_chirho[0]![6] = "'); DROP TABLE pages_chirho; --";
  applyChirho(dbChirho, statementsChirho(payloadChirho));
  expect(dbChirho.query('SELECT width_px_chirho,pdftotext_chirho FROM segments_chirho ORDER BY id_chirho LIMIT 1').get()).toEqual({width_px_chirho:0,pdftotext_chirho:payloadChirho.segments_chirho[0]![6]});
  expect(sha256Chirho(JSON.stringify(payloadChirho))).toHaveLength(64);
  dbChirho.close();
});
test('only documented bottom padding is clamped; unit errors and off-image ink are refused', () => {
  expect(boundedLineChirho([0,0,80,100,32,'Text',1],100,100)[4]).toBe(20);
  expect(() => boundedLineChirho([0,0,80,100,33,'Text',1],100,100)).toThrow();
  expect(() => boundedLineChirho([0,0,80,101,20,'Text',1],100,100)).toThrow();
  expect(boundedLineChirho([0,0,80,0,20,'Mark',1],100,100)[3]).toBe(0);
});
