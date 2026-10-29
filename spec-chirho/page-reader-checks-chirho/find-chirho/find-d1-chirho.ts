// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { after, before, describe, it } from 'node:test';
import assertChirho from 'node:assert/strict';
import { readFile as readFileChirho } from 'node:fs/promises';
import { Miniflare } from '../../../app-chirho/node_modules/miniflare';
import { drizzle } from '../../../app-chirho/node_modules/drizzle-orm/d1';
import * as schemaChirho from '../../../app-chirho/src/lib/server-chirho/schema-d1-chirho';
import type { DbChirho } from '../../../app-chirho/src/lib/server-chirho/db-chirho';
import {
  FIND_PAGE_LIMIT_CHIRHO, FIND_SEGMENT_CAP_CHIRHO, findReferencePagesChirho, pageExistsChirho,
  parseFindQueryChirho, type FindQueryChirho,
} from '../../../app-chirho/src/lib/server-chirho/catalog-chirho/find-chirho';

// Bundle with Bun --target=node --packages=external into app-chirho/.svelte-kit/,
// then node --test from the worktree root. Fixture is in-memory only.
describe('bounded reference search on real local D1 with the paired partial index', () => {
  const runtimeChirho = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("fixture-chirho"); } };',
    compatibilityDate: '2025-02-21', d1Databases: ['DB_CHIRHO'] });
  let d1Chirho: D1Database, dbChirho: DbChirho;
  const queriesChirho: { sqlChirho: string; paramsChirho: unknown[] }[] = [];
  const sqlChirho = async (statementChirho: string, ...paramsChirho: unknown[]) => d1Chirho.prepare(statementChirho).bind(...paramsChirho).run();
  const referenceChirho = (textChirho: string) => {
    const parsedChirho = parseFindQueryChirho(textChirho);
    if (!parsedChirho || parsedChirho.kindChirho !== 'reference-chirho') throw new Error(`fixture query must parse as a reference: ${textChirho}`);
    return parsedChirho as Extract<FindQueryChirho, { kindChirho: 'reference-chirho' }>;
  };
  const findChirho = (textChirho: string) => findReferencePagesChirho(dbChirho, referenceChirho(textChirho));
  const seedPageChirho = async (volumeChirho: number, pageChirho: number, referencesChirho: (string | null)[]) => {
    await sqlChirho('insert into pages_chirho(volume_number_chirho,page_number_chirho) values (?,?)', volumeChirho, pageChirho);
    const pageIdChirho = (await d1Chirho.prepare('select id_chirho from pages_chirho where volume_number_chirho=? and page_number_chirho=?')
      .bind(volumeChirho, pageChirho).first<{ id_chirho: number }>())!.id_chirho;
    await sqlChirho('insert into scanlines_chirho(page_id_chirho,line_index_chirho) values (?,1)', pageIdChirho);
    const scanlineIdChirho = (await d1Chirho.prepare('select id_chirho from scanlines_chirho where page_id_chirho=?')
      .bind(pageIdChirho).first<{ id_chirho: number }>())!.id_chirho;
    for (const [indexChirho, refChirho] of referencesChirho.entries()) {
      await sqlChirho('insert into segments_chirho(scanline_id_chirho,segment_index_chirho,script_type_chirho,canonical_reference_chirho) values (?,?,?,?)',
        scanlineIdChirho, indexChirho, 'hebrew-chirho', refChirho);
    }
    return scanlineIdChirho;
  };

  after(async () => { await runtimeChirho.dispose(); });

  before(async () => {
    d1Chirho = await runtimeChirho.getD1Database('DB_CHIRHO') as unknown as D1Database;
    dbChirho = drizzle(d1Chirho, { schema: schemaChirho, logger: { logQuery(queryChirho, paramsChirho) { queriesChirho.push({ sqlChirho: queryChirho, paramsChirho }); } } });
    for (const pathChirho of ['app-chirho/migrations-chirho/0001-init-chirho.sql', 'app-chirho/migrations-chirho/0001-scanlines-chirho.sql',
      'app-chirho/migrations-chirho/0002-pass1-chirho.sql', 'app-chirho/migrations-chirho/0009-segments-canonical-chirho.sql',
      'app-chirho/src/lib/server-chirho/catalog-chirho/reference-index-chirho.sql']) {
      const sourceChirho = (await readFileChirho(pathChirho, 'utf8')).replace(/--[^\n]*/g, '');
      for (const statementChirho of sourceChirho.split(';').filter((partChirho) => partChirho.trim())) await sqlChirho(statementChirho);
    }
    await seedPageChirho(3, 10, ['Isaiah 8:12', 'Isaiah 8:12', 'Isaiah 8:12', 'Isaiah 8:14', null, null]);
    await seedPageChirho(3, 20, ['Isaiah 8:12', 'II Samuel 7:4', 'II Samuel 7:4', 'Isaiah 81:1']);
    await seedPageChirho(1, 151, ['Psalms 22:17']);
    // Bulk unreferenced segments so the optimizer has a real reason to pick the
    // partial index over a table scan, and a capped book for the refusal case.
    const bulkScanlineChirho = await seedPageChirho(5, 148, []);
    await sqlChirho("with recursive n_chirho(v_chirho) as (select 1 union all select v_chirho+1 from n_chirho where v_chirho<3000) insert into segments_chirho(scanline_id_chirho,segment_index_chirho,script_type_chirho) select ?,v_chirho+100,'french-chirho' from n_chirho", bulkScanlineChirho);
    const jobScanlineChirho = await seedPageChirho(5, 149, []);
    await sqlChirho("with recursive n_chirho(v_chirho) as (select 1 union all select v_chirho+1 from n_chirho where v_chirho<?) insert into segments_chirho(scanline_id_chirho,segment_index_chirho,script_type_chirho,canonical_reference_chirho) select ?,v_chirho+100,'hebrew-chirho','Job 1:1' from n_chirho", FIND_SEGMENT_CAP_CHIRHO + 100, jobScanlineChirho);
    for (let pageChirho = 1; pageChirho <= FIND_PAGE_LIMIT_CHIRHO + 1; pageChirho++) await seedPageChirho(4, pageChirho, ['Psalms 1:1']);
  });

  it('finds a verse with per-page counts in volume, page order', async () => {
    const resultChirho = await findChirho('Isaiah 8:12');
    assertChirho.deepEqual(resultChirho, { refusedChirho: null, segmentCountChirho: 4, pagesChirho: [
      { volumeNumberChirho: 3, pageNumberChirho: 10, segmentCountChirho: 3 },
      { volumeNumberChirho: 3, pageNumberChirho: 20, segmentCountChirho: 1 } ] });
  });

  it('finds a chapter without bleeding into same-prefix higher chapters', async () => {
    const resultChirho = await findChirho('Isaiah 8');
    assertChirho.deepEqual(resultChirho, { refusedChirho: null, segmentCountChirho: 5, pagesChirho: [
      { volumeNumberChirho: 3, pageNumberChirho: 10, segmentCountChirho: 4 },
      { volumeNumberChirho: 3, pageNumberChirho: 20, segmentCountChirho: 1 } ] });
    const chapter81Chirho = await findChirho('Isaiah 81:1');
    assertChirho.equal(chapter81Chirho.refusedChirho, null);
    assertChirho.deepEqual(!chapter81Chirho.refusedChirho && chapter81Chirho.pagesChirho,
      [{ volumeNumberChirho: 3, pageNumberChirho: 20, segmentCountChirho: 1 }]);
  });

  it('finds a whole book across volumes and an absent book cleanly', async () => {
    const samuelChirho = await findChirho('2 Sam');
    assertChirho.deepEqual(!samuelChirho.refusedChirho && samuelChirho.pagesChirho,
      [{ volumeNumberChirho: 3, pageNumberChirho: 20, segmentCountChirho: 2 }]);
    const absentChirho = await findChirho('Genesis');
    assertChirho.deepEqual(absentChirho, { refusedChirho: null, segmentCountChirho: 0, pagesChirho: [] });
  });

  it('refuses whole, never truncates, past the segment cap and the page cap', async () => {
    const cappedChirho = await findChirho('Job');
    assertChirho.ok(cappedChirho.refusedChirho?.includes(`${FIND_SEGMENT_CAP_CHIRHO + 100} segments`));
    const wideChirho = await findChirho('Psalms 1:1');
    assertChirho.ok(wideChirho.refusedChirho?.includes(`${FIND_PAGE_LIMIT_CHIRHO} loaded pages`));
  });

  it('answers page existence for the volume:page jump', async () => {
    assertChirho.equal(await pageExistsChirho(dbChirho, 3, 10), true);
    assertChirho.equal(await pageExistsChirho(dbChirho, 3, 11), false);
  });

  it('plans both find queries through the partial covering reference index, never a segment scan', async () => {
    queriesChirho.length = 0;
    await findChirho('Isaiah 8:12');
    await findChirho('Isaiah 8');
    assertChirho.ok(queriesChirho.length >= 3, 'count and group queries were captured');
    for (const capturedChirho of queriesChirho) {
      const planChirho = await d1Chirho.prepare(`explain query plan ${capturedChirho.sqlChirho}`)
        .bind(...(capturedChirho.paramsChirho as (string | number)[])).all<{ detail: string }>();
      const detailChirho = planChirho.results.map((rowChirho) => rowChirho.detail).join(' | ');
      assertChirho.ok(/USING COVERING INDEX idx_segments_canonical_reference_chirho/.test(detailChirho),
        `segments access must seek the partial index: ${detailChirho}`);
      assertChirho.ok(!/SCAN segments_chirho(?! USING)/.test(detailChirho), `no segment table scan: ${detailChirho}`);
    }
  });
});
