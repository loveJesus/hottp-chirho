// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { test,expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_ROOT_CHIRHO } from '../../../config-chirho.ts';
import { geometryPayloadChirho,type StatementChirho } from '../source-chirho.ts';
import { digestChirho } from '../verify-chirho.ts';
import { legacyStatementsChirho,type LegacyEntryChirho } from './model-chirho.ts';

function fixtureChirho():{db_chirho:Database;entry_chirho:LegacyEntryChirho}{
  const dbChirho=new Database(':memory:');dbChirho.exec('PRAGMA foreign_keys=ON');
  for(const nameChirho of ['0001-init-chirho.sql','0001-scanlines-chirho.sql','0002-pass1-chirho.sql','0010-words-events-snapshots-chirho.sql'])dbChirho.exec(readFileSync(join(PROJECT_ROOT_CHIRHO,'app-chirho/migrations-chirho',nameChirho),'utf8'));
  // Match the production seed's extra vision column, absent from migrations.
  dbChirho.exec('ALTER TABLE scanlines_chirho RENAME COLUMN x_max_chirho TO width_chirho; ALTER TABLE scanlines_chirho RENAME COLUMN y_max_chirho TO height_chirho; ALTER TABLE pages_chirho ADD COLUMN vision_text_chirho TEXT');
  dbChirho.run("INSERT INTO pages_chirho(volume_number_chirho,page_number_chirho,french_text_chirho,status_chirho,vision_text_chirho) VALUES(5,50,'Original page text','vision-done-chirho','Legacy machine hint')");
  const pageChirho=dbChirho.query('SELECT * FROM pages_chirho').get() as LegacyEntryChirho['original_page_chirho'];
  const payloadChirho={page_chirho:[5,50,'Original page text','null'] as [number,number,string,string],lines_chirho:[[0,10,20,100,20,'Draft אב',2] as [number,number,number,number,number,string,number]],segments_chirho:[[0,0,0,0,0,60,'Draft','french-chirho'],[0,1,1,1,60,40,'אב','hebrew-chirho']] as LegacyEntryChirho['payload_chirho']['segments_chirho']};
  return{db_chirho:dbChirho,entry_chirho:{original_page_chirho:pageChirho,payload_chirho:payloadChirho,payload_sha256_chirho:digestChirho(payloadChirho),image_sha256_chirho:'a'.repeat(64),image_md5_chirho:'b'.repeat(32),image_width_chirho:2480,image_height_chirho:3509,image_bytes_chirho:1000}};
}
function executeChirho(dbChirho:Database,statementsChirho:StatementChirho[]):void{dbChirho.transaction(()=>{for(const statementChirho of statementsChirho)dbChirho.query(statementChirho.sql).run(...(statementChirho.params??[]));})();}
function childCountsChirho(dbChirho:Database):unknown{return dbChirho.query('SELECT (SELECT count(*) FROM scanlines_chirho) AS lines_chirho,(SELECT count(*) FROM segments_chirho) AS segments_chirho').get();}
test('adds only pending readers while preserving the complete legacy page row',()=>{
  const {db_chirho:dbChirho,entry_chirho:entryChirho}=fixtureChirho();executeChirho(dbChirho,legacyStatementsChirho(entryChirho));
  expect(dbChirho.query('SELECT * FROM pages_chirho').get()).toEqual(entryChirho.original_page_chirho);
  expect(childCountsChirho(dbChirho)).toEqual({lines_chirho:1,segments_chirho:2});
  expect(dbChirho.query("SELECT count(*) AS promoted_chirho FROM segments_chirho WHERE status_chirho!='pending-chirho' OR accepted_text_chirho IS NOT NULL OR ocr_text_chirho IS NOT NULL").get()).toEqual({promoted_chirho:0});dbChirho.close();
});
test('any changed page source or metadata aborts before child inserts',()=>{
  for(const columnChirho of ['french_text_chirho','status_chirho','vision_text_chirho','image_path_chirho','reconstructed_text_chirho','lines_approved_at_chirho','updated_at_chirho']){
    const {db_chirho:dbChirho,entry_chirho:entryChirho}=fixtureChirho();dbChirho.run(`UPDATE pages_chirho SET ${columnChirho}=?`,['Changed']);
    expect(()=>executeChirho(dbChirho,legacyStatementsChirho(entryChirho))).toThrow();expect(childCountsChirho(dbChirho)).toEqual({lines_chirho:0,segments_chirho:0});dbChirho.close();
  }
});
test('existing lines, review events, snippets or snapshots hold the entire append',()=>{
  for(const sqlChirho of ["INSERT INTO scanlines_chirho(page_id_chirho,line_index_chirho) VALUES(1,0)","INSERT INTO events_chirho(page_id_chirho,aggregate_type_chirho,event_type_chirho,payload_json_chirho) VALUES(1,'page-chirho','page-completed-chirho','{}')","INSERT INTO snippets_chirho(page_id_chirho,snippet_index_chirho) VALUES(1,0)","INSERT INTO page_snapshots_chirho(page_id_chirho,underlay_json_chirho) VALUES(1,'{}')"]){
    const {db_chirho:dbChirho,entry_chirho:entryChirho}=fixtureChirho();dbChirho.exec(sqlChirho);const beforeChirho=dbChirho.serialize();
    expect(()=>executeChirho(dbChirho,legacyStatementsChirho(entryChirho))).toThrow();expect(dbChirho.serialize()).toEqual(beforeChirho);dbChirho.close();
  }
});
test('duplicate or late failure never leaves extra or partial readers',()=>{
  const {db_chirho:dbChirho,entry_chirho:entryChirho}=fixtureChirho();const brokenChirho=structuredClone(entryChirho);brokenChirho.payload_chirho.segments_chirho.push(brokenChirho.payload_chirho.segments_chirho[0]!);
  expect(()=>executeChirho(dbChirho,legacyStatementsChirho(brokenChirho))).toThrow();expect(childCountsChirho(dbChirho)).toEqual({lines_chirho:0,segments_chirho:0});
  executeChirho(dbChirho,legacyStatementsChirho(entryChirho));const beforeChirho=dbChirho.serialize();expect(()=>executeChirho(dbChirho,legacyStatementsChirho(entryChirho))).toThrow();expect(dbChirho.serialize()).toEqual(beforeChirho);dbChirho.close();
});
test('cannot target another volume, nonpilot page, wrong page coordinates or partial CAS',()=>{
  const {db_chirho:dbChirho,entry_chirho:entryChirho}=fixtureChirho();
  for(const [volumeChirho,pageChirho] of [[1,50],[5,49],[5,71],[5,51]]){const badChirho=structuredClone(entryChirho);badChirho.payload_chirho.page_chirho[0]=volumeChirho!;badChirho.payload_chirho.page_chirho[1]=pageChirho!;expect(()=>legacyStatementsChirho(badChirho)).toThrow();}
  const badChirho=structuredClone(entryChirho);delete badChirho.original_page_chirho.vision_text_chirho;expect(()=>legacyStatementsChirho(badChirho)).toThrow();dbChirho.close();
});
test('shared geometry validation is pure and refuses false parent/count identities',()=>{
  const {db_chirho:dbChirho,entry_chirho:entryChirho}=fixtureChirho();const inputChirho=structuredClone(entryChirho.payload_chirho),beforeChirho=digestChirho(inputChirho);
  expect(geometryPayloadChirho(inputChirho,2480,3509)).toEqual(inputChirho);expect(digestChirho(inputChirho)).toBe(beforeChirho);
  const duplicateChirho=structuredClone(inputChirho);duplicateChirho.segments_chirho.push(duplicateChirho.segments_chirho[0]!);expect(()=>geometryPayloadChirho(duplicateChirho,2480,3509)).toThrow();
  const missingChirho=structuredClone(inputChirho);missingChirho.segments_chirho[0]![0]=99;expect(()=>geometryPayloadChirho(missingChirho,2480,3509)).toThrow();
  const countChirho=structuredClone(inputChirho);countChirho.lines_chirho[0]![6]=1;expect(()=>geometryPayloadChirho(countChirho,2480,3509)).toThrow();dbChirho.close();
});
