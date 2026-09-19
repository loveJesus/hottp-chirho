// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { after as afterAll, before as beforeAll, describe, it as test } from 'node:test';
import assertChirho from 'node:assert/strict';
import { remoteFixtureChirho } from './remote-d1-fixture-chirho';
import { Miniflare } from '../../app-chirho/node_modules/miniflare';
import { getDbChirho } from '../../app-chirho/src/lib/server-chirho/db-chirho';
import { confirmReadingChirho, parseConfirmationChirho, type ConfirmationChirho } from '../../app-chirho/src/lib/server-chirho/review-chirho/confirm-reading-chirho';

describe('atomic confirmation on real ephemeral D1', () => {
  const runtimeChirho = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("fixture-chirho"); } };', compatibilityDate: '2025-02-21', d1Databases: ['DB_CHIRHO'] });
  let d1Chirho: D1Database;
  let dbChirho: ReturnType<typeof getDbChirho>;
  let remoteChirho: Awaited<ReturnType<typeof remoteFixtureChirho>> | undefined;
  const originalChirho: ConfirmationChirho = { page_id_chirho: 1, scanline_id_chirho: 1, record_id_chirho: 1, kind_chirho: 'word-chirho', text_chirho: 'corrected-chirho', observed_event_seq_chirho: 0,
    expected_chirho: { text_chirho: 'original-chirho', script_chirho: 'latin-chirho', confirmed_chirho: false, box_chirho: { x_chirho: 10, y_chirho: 20, width_chirho: 30, height_chirho: 40 } } };
  beforeAll(async () => {
    if (process.env.HOTTP_REMOTE_D1_SMOKE_CHIRHO === 'create-disposable-chirho') remoteChirho = await remoteFixtureChirho();
    d1Chirho = remoteChirho?.dbChirho ?? await runtimeChirho.getD1Database('DB_CHIRHO') as unknown as D1Database; dbChirho = getDbChirho(d1Chirho);
    for (const statementChirho of [
      'CREATE TABLE scanlines_chirho(id_chirho INTEGER PRIMARY KEY,page_id_chirho INTEGER,x_min_chirho REAL,y_min_chirho REAL,height_chirho REAL)',
      'CREATE TABLE words_chirho(id_chirho INTEGER PRIMARY KEY,scanline_id_chirho INTEGER,current_text_chirho TEXT,original_ocr_text_chirho TEXT,current_script_chirho TEXT,current_source_chirho TEXT,is_human_confirmed_chirho INTEGER,last_event_seq_chirho INTEGER,x_min_chirho REAL,y_min_chirho REAL,x_max_chirho REAL,y_max_chirho REAL)',
      'CREATE TABLE segments_chirho(id_chirho INTEGER PRIMARY KEY,scanline_id_chirho INTEGER,accepted_text_chirho TEXT,ocr_text_chirho TEXT,pdftotext_chirho TEXT,script_type_chirho TEXT,status_chirho TEXT,x_min_px_chirho REAL,width_px_chirho REAL)',
      "CREATE TABLE events_chirho(seq_chirho INTEGER PRIMARY KEY AUTOINCREMENT,page_id_chirho INTEGER,scanline_id_chirho INTEGER,word_id_chirho INTEGER,aggregate_type_chirho TEXT,event_type_chirho TEXT,payload_json_chirho TEXT,reviewer_chirho TEXT,created_at_chirho TEXT DEFAULT (datetime('now')))",
      'INSERT INTO scanlines_chirho VALUES(1,1,10,20,40)',
      "INSERT INTO words_chirho VALUES(1,1,'original-chirho',null,'latin-chirho','ocr-chirho',0,0,10,20,40,60)",
      "INSERT INTO words_chirho VALUES(2,1,'original-chirho',null,'latin-chirho','ocr-chirho',0,0,10,20,40,60)",
      "INSERT INTO segments_chirho VALUES(1,1,null,'original-chirho',null,'latin-chirho','pending-chirho',0,30)",
    ]) await d1Chirho.prepare(statementChirho).run();
  });
  afterAll(async () => { try { await remoteChirho?.disposeChirho(); } finally { await runtimeChirho.dispose(); } });
  test('reject malformed, missing geometry and oversized text at boundary', () => {
    for (const badChirho of [null, {}, { ...originalChirho, page_id_chirho: -1 }, { ...originalChirho, text_chirho: 'x'.repeat(8193) }, { ...originalChirho, expected_chirho: { ...originalChirho.expected_chirho, box_chirho: null } }]) assertChirho.throws(() => parseConfirmationChirho(badChirho));
    assertChirho.deepEqual(parseConfirmationChirho(originalChirho), originalChirho);
  });
  test('wrong page, text, script, status or box cause no audit or projection mutation', async () => {
    for (const bodyChirho of [{ ...originalChirho, page_id_chirho: 2 }, ...[
      { text_chirho: 'stale-chirho' }, { script_chirho: 'hebrew-chirho' }, { confirmed_chirho: true }, { box_chirho: { ...originalChirho.expected_chirho.box_chirho, width_chirho: 31 } },
    ].map((patchChirho) => ({ ...originalChirho, expected_chirho: { ...originalChirho.expected_chirho, ...patchChirho } }))]) {
      await assertChirho.rejects(confirmReadingChirho(dbChirho, bodyChirho, 'fixture-reviewer-chirho'), { status: 409 });
    }
    assertChirho.equal(await d1Chirho.prepare('SELECT count(*) AS total_chirho FROM events_chirho').first('total_chirho'), 0);
    assertChirho.equal(await d1Chirho.prepare('SELECT current_text_chirho FROM words_chirho WHERE id_chirho=1').first('current_text_chirho'), 'original-chirho');
  });
  test('racing word confirmations produce one winner, one audit, one matching projection', async () => {
    const resultsChirho = await Promise.allSettled([confirmReadingChirho(dbChirho, originalChirho, 'fixture-reviewer-chirho'), confirmReadingChirho(dbChirho, { ...originalChirho, text_chirho: 'rival-chirho' }, 'fixture-reviewer-chirho')]);
    assertChirho.equal(resultsChirho.filter((resultChirho) => resultChirho.status === 'fulfilled').length, 1);
    const wordChirho = await d1Chirho.prepare('SELECT current_text_chirho,last_event_seq_chirho,is_human_confirmed_chirho FROM words_chirho WHERE id_chirho=1').first();
    const eventChirho = await d1Chirho.prepare('SELECT seq_chirho,payload_json_chirho,reviewer_chirho FROM events_chirho').first();
    assertChirho.equal(wordChirho!.last_event_seq_chirho, eventChirho!.seq_chirho);
    assertChirho.equal(wordChirho!.current_text_chirho, JSON.parse(eventChirho!.payload_json_chirho as string).newTextChirho);
    assertChirho.equal(wordChirho!.is_human_confirmed_chirho, 1);
    assertChirho.equal(eventChirho!.reviewer_chirho, 'fixture-reviewer-chirho');
  });
  test('projection SQL failure rolls back the inserted audit event', async () => {
    await d1Chirho.prepare("CREATE TRIGGER fail_projection_chirho BEFORE UPDATE ON words_chirho WHEN NEW.id_chirho=2 BEGIN SELECT RAISE(ABORT,'fixture failure'); END").run();
    const beforeChirho = await d1Chirho.prepare('SELECT count(*) AS total_chirho FROM events_chirho').first('total_chirho');
    await assertChirho.rejects(confirmReadingChirho(dbChirho, { ...originalChirho, record_id_chirho: 2 }, 'fixture-reviewer-chirho'));
    assertChirho.equal(await d1Chirho.prepare('SELECT count(*) AS total_chirho FROM events_chirho').first('total_chirho'), beforeChirho);
    assertChirho.equal(await d1Chirho.prepare('SELECT current_text_chirho FROM words_chirho WHERE id_chirho=2').first('current_text_chirho'), 'original-chirho');
  });
  test('segment confirmation is audited, geometry unchanged, repeat with old cursor refused', async () => {
    const bodyChirho = { ...originalChirho, kind_chirho: 'segment-chirho' as const };
    const seqChirho = await confirmReadingChirho(dbChirho, bodyChirho, 'fixture-reviewer-chirho');
    const rowChirho = await d1Chirho.prepare('SELECT accepted_text_chirho,status_chirho,width_px_chirho FROM segments_chirho WHERE id_chirho=1').first();
    assertChirho.deepEqual(rowChirho, { accepted_text_chirho: 'corrected-chirho', status_chirho: 'human-confirmed-chirho', width_px_chirho: 30 });
    assertChirho.equal(await d1Chirho.prepare('SELECT event_type_chirho FROM events_chirho WHERE seq_chirho=?').bind(seqChirho).first('event_type_chirho'), 'segment-reading-confirmed-chirho');
    await assertChirho.rejects(confirmReadingChirho(dbChirho, { ...bodyChirho, expected_chirho: { ...bodyChirho.expected_chirho, text_chirho: 'corrected-chirho', confirmed_chirho: true } }, 'fixture-reviewer-chirho'), { status: 409 });
  });
  test('zero-row ignored projection also rolls back its audit insert', async () => {
    await d1Chirho.prepare('DROP TRIGGER fail_projection_chirho').run();
    await d1Chirho.prepare('CREATE TRIGGER ignore_projection_chirho BEFORE UPDATE ON words_chirho WHEN NEW.id_chirho=2 BEGIN SELECT RAISE(IGNORE); END').run();
    const beforeChirho = await d1Chirho.prepare('SELECT count(*) AS total_chirho FROM events_chirho').first('total_chirho');
    await assertChirho.rejects(confirmReadingChirho(dbChirho, { ...originalChirho, record_id_chirho: 2 }, 'fixture-reviewer-chirho'));
    assertChirho.equal(await d1Chirho.prepare('SELECT count(*) AS total_chirho FROM events_chirho').first('total_chirho'), beforeChirho);
  });
  test('only proposed text is NFC-normalized, and empty confirmations are refused', () => {
    const valueChirho = parseConfirmationChirho({ ...originalChirho, text_chirho: 'e\u0301', expected_chirho: { ...originalChirho.expected_chirho, text_chirho: 'e\u0301' } });
    assertChirho.equal(valueChirho.text_chirho, 'é');
    assertChirho.equal(valueChirho.expected_chirho.text_chirho, 'e\u0301');
    assertChirho.throws(() => parseConfirmationChirho({ ...originalChirho, text_chirho: '  ' }));
  });
});
