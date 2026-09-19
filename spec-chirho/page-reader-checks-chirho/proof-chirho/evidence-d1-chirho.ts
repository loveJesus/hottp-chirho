// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { after, before, beforeEach, describe, it } from 'node:test';
import assertChirho from 'node:assert/strict';
import { readFile as readFileChirho } from 'node:fs/promises';
import { Miniflare } from '../../../app-chirho/node_modules/miniflare';
import { drizzle } from '../../../app-chirho/node_modules/drizzle-orm/d1';
import * as schemaChirho from '../../../app-chirho/src/lib/server-chirho/schema-d1-chirho';
import type { DbChirho } from '../../../app-chirho/src/lib/server-chirho/db-chirho';
import { loadPageWordsChirho } from '../../../app-chirho/src/lib/server-chirho/review-chirho/reading-evidence-chirho';
import { loadPageLinesChirho } from '../../../app-chirho/src/lib/server-chirho/page-lines-chirho';
import { confirmReadingChirho, type ConfirmationChirho } from '../../../app-chirho/src/lib/server-chirho/review-chirho/confirm-reading-chirho';
import { readingLinesChirho, isReviewConfirmedChirho, needsAttentionChirho } from '../../../app-chirho/src/lib/page-reader-chirho/model-chirho';

// The schema and queries are real; only the records and D1 instance are disposable.
describe('current reader state and indexed confirmation evidence', () => {
  const runtimeChirho = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("fixture-chirho"); } };', compatibilityDate: '2025-02-21', d1Databases: ['DB_CHIRHO'] });
  let d1Chirho: D1Database, dbChirho: DbChirho;
  const queriesChirho: { sqlChirho: string; paramsChirho: unknown[] }[] = [];
  const bodyChirho: ConfirmationChirho = { page_id_chirho: 1, scanline_id_chirho: 1, record_id_chirho: 1, kind_chirho: 'word-chirho', text_chirho: 'print-chirho', observed_event_seq_chirho: 0,
    expected_chirho: { text_chirho: 'print-chirho', script_chirho: 'hebrew-chirho', confirmed_chirho: false, box_chirho: { x_chirho: 10, y_chirho: 20, width_chirho: 30, height_chirho: 40 } } };
  const sqlChirho = async (queryChirho: string, ...paramsChirho: unknown[]) => d1Chirho.prepare(queryChirho).bind(...paramsChirho).run();
  const wordsChirho = () => loadPageWordsChirho(dbChirho, 1);
  const segmentsChirho = async () => (await loadPageLinesChirho(dbChirho, 1))[0]!.segmentsChirho;
  const eventCountChirho = () => d1Chirho.prepare('select count(*) total_chirho from events_chirho').first('total_chirho');
  const receiptChirho = async (kindChirho: 'word-chirho' | 'segment-chirho' = 'word-chirho', confirmedChirho = false) => confirmReadingChirho(dbChirho,
    { ...bodyChirho, kind_chirho: kindChirho, expected_chirho: { ...bodyChirho.expected_chirho, confirmed_chirho: confirmedChirho } }, 'shared-reviewer-chirho');

  before(async () => {
    d1Chirho = await runtimeChirho.getD1Database('DB_CHIRHO') as unknown as D1Database;
    dbChirho = drizzle(d1Chirho, { schema: schemaChirho, logger: { logQuery(queryChirho, paramsChirho) { queriesChirho.push({ sqlChirho: queryChirho, paramsChirho }); } } });
    for (const pathChirho of [
      'app-chirho/migrations-chirho/0001-init-chirho.sql', 'app-chirho/migrations-chirho/0001-scanlines-chirho.sql',
      'app-chirho/migrations-chirho/0008-scanlines-width-height-chirho.sql', 'app-chirho/migrations-chirho/0009-segments-canonical-chirho.sql',
      'app-chirho/migrations-chirho/0010-words-events-snapshots-chirho.sql',
      'app-chirho/src/lib/server-chirho/review-chirho/reading-evidence-index-chirho.sql',
    ]) {
      const sourceChirho = (await readFileChirho(pathChirho, 'utf8')).replace(/--[^\n]*/g, '');
      for (const statementChirho of sourceChirho.split(';').filter((partChirho) => partChirho.trim())) await sqlChirho(statementChirho);
    }
  });
  after(async () => runtimeChirho.dispose());
  beforeEach(async () => {
    for (const tableChirho of ['page_snapshots_chirho', 'events_chirho', 'words_chirho', 'segments_chirho', 'scanlines_chirho', 'pages_chirho']) await sqlChirho(`delete from ${tableChirho}`);
    await sqlChirho('insert into pages_chirho(id_chirho,volume_number_chirho,page_number_chirho) values(1,1,148),(2,2,148)');
    await sqlChirho('insert into scanlines_chirho(id_chirho,page_id_chirho,line_index_chirho,x_min_chirho,y_min_chirho,width_chirho,height_chirho) values(1,1,1,10,20,30,40),(2,2,1,10,20,30,40)');
    await sqlChirho("insert into words_chirho(id_chirho,scanline_id_chirho,word_index_chirho,x_min_chirho,y_min_chirho,x_max_chirho,y_max_chirho,current_text_chirho,current_script_chirho) values(1,1,0,10,20,40,60,'print-chirho','hebrew-chirho')");
    await sqlChirho("insert into segments_chirho(id_chirho,scanline_id_chirho,segment_index_chirho,x_min_px_chirho,width_px_chirho,ocr_text_chirho,script_type_chirho) values(1,1,0,0,30,'print-chirho','hebrew-chirho')");
    queriesChirho.length = 0;
  });

  it('machine events cannot change raw CAS or confer human review; fresh confirmation saves', async () => {
    await sqlChirho("insert into events_chirho(page_id_chirho,scanline_id_chirho,word_id_chirho,aggregate_type_chirho,event_type_chirho,reviewer_chirho,payload_json_chirho) values(1,1,1,'word-chirho','word-text-corrected-chirho','canonical-recon-chirho',?)", JSON.stringify({ newTextChirho: 'print-chirho' }));
    const [wordChirho] = await wordsChirho();
    assertChirho.equal(wordChirho!.isHumanConfirmedChirho, 0);
    assertChirho.equal(wordChirho!.reviewStateChirho, 'machine-chirho');
    await assertChirho.rejects(confirmReadingChirho(dbChirho, { ...bodyChirho, expected_chirho: { ...bodyChirho.expected_chirho, confirmed_chirho: true } }, 'shared-reviewer-chirho'), { status: 409 });
    await receiptChirho();
    assertChirho.equal((await wordsChirho())[0]!.reviewStateChirho, 'recorded-chirho');
    assertChirho.equal(await eventCountChirho(), 2);
  });

  it('legacy word and segment flags stay unverified and can be re-confirmed with their raw true state', async () => {
    await sqlChirho('update words_chirho set is_human_confirmed_chirho=1');
    await sqlChirho("update segments_chirho set status_chirho='human-confirmed-chirho'");
    assertChirho.equal((await wordsChirho())[0]!.reviewStateChirho, 'unattributed-chirho');
    assertChirho.equal((await segmentsChirho())[0]!.reviewStateChirho, 'unattributed-chirho');
    const beforeChirho = await eventCountChirho();
    for (const tokenChirho of readingLinesChirho(await loadPageLinesChirho(dbChirho, 1), await wordsChirho()).flatMap((lineChirho) => lineChirho.tokensChirho)) {
      assertChirho.equal(isReviewConfirmedChirho(tokenChirho), false);
      assertChirho.equal(needsAttentionChirho(tokenChirho), true);
    }
    assertChirho.equal(await eventCountChirho(), beforeChirho, 'reads do not migrate legacy flags');
    await receiptChirho('word-chirho', true);
    await receiptChirho('segment-chirho', true);
    assertChirho.equal((await wordsChirho())[0]!.reviewStateChirho, 'recorded-chirho');
    assertChirho.equal((await segmentsChirho())[0]!.reviewStateChirho, 'recorded-chirho');
  });

  it('anonymous activity and malformed or falsely attributed receipts never grant review', async () => {
    const seqChirho = await receiptChirho();
    await sqlChirho("update events_chirho set reviewer_chirho='anon-chirho' where seq_chirho=?", seqChirho);
    assertChirho.equal((await wordsChirho())[0]!.reviewStateChirho, 'anonymous-chirho');
    for (const actorChirho of ['canonical-recon-chirho', 'vision-batch-opus-chirho', 'arbitrary-chirho', null]) {
      await sqlChirho('update events_chirho set reviewer_chirho=? where seq_chirho=?', actorChirho, seqChirho);
      assertChirho.notEqual((await wordsChirho())[0]!.reviewStateChirho, 'recorded-chirho');
    }
    await sqlChirho("update events_chirho set reviewer_chirho='shared-reviewer-chirho',payload_json_chirho='{broken' where seq_chirho=?", seqChirho);
    assertChirho.equal((await wordsChirho())[0]!.reviewStateChirho, 'unattributed-chirho');
  });

  it('every receipt trust field must match the current source, including raw geometry and scope', async () => {
    for (const kindChirho of ['word-chirho', 'segment-chirho'] as const) {
      const seqChirho = await receiptChirho(kindChirho);
      const payloadChirho = JSON.parse(await d1Chirho.prepare('select payload_json_chirho from events_chirho where seq_chirho=?').bind(seqChirho).first('payload_json_chirho') as string);
      const stateChirho = async () => kindChirho === 'word-chirho' ? (await wordsChirho())[0]!.reviewStateChirho : (await segmentsChirho())[0]!.reviewStateChirho;
      for (const pathChirho of [ ['sourceChirho'], ['reviewerScopeChirho'], ['newTextChirho'], ['expectedSourceChirho', 'script_chirho'],
        ...['x_chirho', 'y_chirho', 'width_chirho', 'height_chirho'].map((keyChirho) => ['expectedSourceChirho', 'box_chirho', keyChirho]),
        ...(kindChirho === 'segment-chirho' ? [['segmentIdChirho']] : []),
      ]) {
        const changedChirho = structuredClone(payloadChirho);
        let targetChirho = changedChirho;
        for (const keyChirho of pathChirho.slice(0, -1)) targetChirho = targetChirho[keyChirho];
        delete targetChirho[pathChirho.at(-1)!];
        await sqlChirho('update events_chirho set payload_json_chirho=? where seq_chirho=?', JSON.stringify(changedChirho), seqChirho);
        assertChirho.notEqual(await stateChirho(), 'recorded-chirho', `${kindChirho} missing ${pathChirho.join('.')}`);
      }
      await sqlChirho('update events_chirho set payload_json_chirho=? where seq_chirho=?', JSON.stringify(payloadChirho), seqChirho);
      for (const [columnChirho, wrongChirho, originalChirho] of [['page_id_chirho', 2, 1], ['scanline_id_chirho', 2, 1], ['aggregate_type_chirho', 'page-chirho', kindChirho], ['event_type_chirho', 'word-script-flagged-chirho', kindChirho === 'word-chirho' ? 'word-verified-chirho' : 'segment-reading-confirmed-chirho']] as const) {
        await sqlChirho(`update events_chirho set ${columnChirho}=? where seq_chirho=?`, wrongChirho, seqChirho);
        assertChirho.notEqual(await stateChirho(), 'recorded-chirho', columnChirho);
        await sqlChirho(`update events_chirho set ${columnChirho}=? where seq_chirho=?`, originalChirho, seqChirho);
      }
      assertChirho.equal(await stateChirho(), 'recorded-chirho');
    }
  });

  it('post-receipt text, script, geometry or raw status drift revokes the badge; stale saves still fail', async () => {
    await receiptChirho();
    for (const [columnChirho, wrongChirho, originalChirho] of [['current_text_chirho', 'changed-chirho', 'print-chirho'], ['current_script_chirho', 'greek-chirho', 'hebrew-chirho'], ['x_max_chirho', 41, 40], ['is_human_confirmed_chirho', 0, 1], ['last_event_seq_chirho', 0, -1]] as const) {
      const originalValueChirho = originalChirho === -1 ? await d1Chirho.prepare('select last_event_seq_chirho from words_chirho where id_chirho=1').first('last_event_seq_chirho') : originalChirho;
      await sqlChirho(`update words_chirho set ${columnChirho}=? where id_chirho=1`, wrongChirho);
      assertChirho.notEqual((await wordsChirho())[0]!.reviewStateChirho, 'recorded-chirho', columnChirho);
      await sqlChirho(`update words_chirho set ${columnChirho}=? where id_chirho=1`, originalValueChirho);
    }
    await assertChirho.rejects(receiptChirho('word-chirho', true), { status: 409 });
    assertChirho.equal(await eventCountChirho(), 1);
    await sqlChirho('update words_chirho set pending_script_flag_chirho=1');
    // Force a word target instead of the non-French segment in this fixture.
    await sqlChirho("update segments_chirho set script_type_chirho='french-chirho'");
    const tokenChirho = readingLinesChirho(await loadPageLinesChirho(dbChirho, 1), await wordsChirho())[0]!.tokensChirho[0]!;
    assertChirho.equal(isReviewConfirmedChirho(tokenChirho), false);
    assertChirho.equal(needsAttentionChirho(tokenChirho), true);
  });

  it('old receipts survive advanced snapshots and unrelated history; reads stay indexed and page-scoped', async () => {
    await receiptChirho(); await receiptChirho('segment-chirho');
    await sqlChirho("with recursive n_chirho(v_chirho) as (select 1 union all select v_chirho+1 from n_chirho where v_chirho<2100) insert into events_chirho(page_id_chirho,aggregate_type_chirho,event_type_chirho,payload_json_chirho) select 1,'page-chirho','fixture-chirho','{}' from n_chirho");
    await sqlChirho("insert into page_snapshots_chirho(page_id_chirho,snapshot_seq_chirho,underlay_json_chirho) values(1,999999,'{stale')");
    queriesChirho.length = 0;
    assertChirho.equal((await wordsChirho())[0]!.reviewStateChirho, 'recorded-chirho');
    assertChirho.equal((await segmentsChirho())[0]!.reviewStateChirho, 'recorded-chirho');
    assertChirho.equal(queriesChirho.length, 2, 'one SQL read per current row family, not per history item');
    const plansChirho: string[] = [];
    for (const queryChirho of queriesChirho) {
      const planChirho = await d1Chirho.prepare('explain query plan ' + queryChirho.sqlChirho).bind(...queryChirho.paramsChirho).all<{ detail: string }>();
      const detailsChirho = planChirho.results.map((rowChirho) => rowChirho.detail).join('\n');
      assertChirho.match(detailsChirho, /SEARCH scanlines_chirho USING INDEX|SEARCH scanlines_chirho USING COVERING INDEX/);
      assertChirho.doesNotMatch(detailsChirho, /SCAN receipt_chirho/);
      plansChirho.push(detailsChirho);
    }
    assertChirho.match(plansChirho[0]!, /events_word_seq_chirho/);
    assertChirho.match(plansChirho[1]!, /events_segment_receipt_chirho/);
    assertChirho.deepEqual(await loadPageWordsChirho(dbChirho, 2), []);
    const [wordChirho] = await wordsChirho();
    assertChirho.ok(!('payloadJsonChirho' in wordChirho!) && !('reviewerChirho' in wordChirho!), 'raw receipts and identities are not sent with reader rows');
  });
});
