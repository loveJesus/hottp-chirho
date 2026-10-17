// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { after, before, describe, it } from 'node:test';
import assertChirho from 'node:assert/strict';
import { readFile as readFileChirho } from 'node:fs/promises';
import { Miniflare } from '../../../../app-chirho/node_modules/miniflare';
import { drizzle } from '../../../../app-chirho/node_modules/drizzle-orm/d1';
import * as schemaChirho from '../../../../app-chirho/src/lib/server-chirho/schema-d1-chirho';
import type { DbChirho } from '../../../../app-chirho/src/lib/server-chirho/db-chirho';
import { loadVolumeWindowChirho } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/volume-chirho';
import { exportPageRangeChirho } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/export-chirho';
import { EXPORT_BYTES_CHIRHO, EXPORT_FIELD_BYTES_CHIRHO, PAGE_WINDOW_CHIRHO } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/request-chirho';

// Bundle with Bun --target=node --packages=external into app-chirho/.svelte-kit/,
// then node --test from the worktree root. Optional persistence is fixture-only.
describe('bounded catalog on real local D1 at full-volume scale', () => {
  const fixturePathChirho = process.env.HOTTP_SCALE_FIXTURE_CHIRHO;
  if (fixturePathChirho && !fixturePathChirho.startsWith('/private/tmp/hottp-reader-scale-chirho-')) throw new Error('Fixture persistence must be inside the owned temporary scale workspace.');
  const runtimeChirho = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("fixture-chirho"); } };',
    compatibilityDate: '2025-02-21', d1Databases: ['DB_CHIRHO'], d1Persist: fixturePathChirho ?? false });
  let d1Chirho: D1Database, dbChirho: DbChirho;
  const queriesChirho: { sqlChirho: string; paramsChirho: unknown[] }[] = [];
  const sqlChirho = async (statementChirho: string, ...paramsChirho: unknown[]) => d1Chirho.prepare(statementChirho).bind(...paramsChirho).run();
  const windowChirho = (volumeChirho: number, fromChirho = 1, beforeChirho: number | null = null) => loadVolumeWindowChirho(dbChirho, volumeChirho, { fromChirho, beforeChirho });
  const exportChirho = (fromChirho: number, toChirho: number, volumeChirho = 3) => exportPageRangeChirho(dbChirho, { volumeChirho, fromChirho, toChirho });
  const numbersChirho = (resultChirho: Awaited<ReturnType<typeof windowChirho>>) => resultChirho.pagesChirho.map((pageChirho) => pageChirho.pageNumberChirho);

  before(async () => {
    d1Chirho = await runtimeChirho.getD1Database('DB_CHIRHO') as unknown as D1Database;
    dbChirho = drizzle(d1Chirho, { schema: schemaChirho, logger: { logQuery(queryChirho, paramsChirho) { queriesChirho.push({ sqlChirho: queryChirho, paramsChirho }); } } });
    for (const pathChirho of ['app-chirho/migrations-chirho/0001-init-chirho.sql', 'app-chirho/migrations-chirho/0001-scanlines-chirho.sql']) {
      const sourceChirho = (await readFileChirho(pathChirho, 'utf8')).replace(/--[^\n]*/g, '');
      for (const statementChirho of sourceChirho.split(';').filter((partChirho) => partChirho.trim())) await sqlChirho(statementChirho);
    }
    await sqlChirho("with recursive n_chirho(v_chirho) as (select 1 union all select v_chirho+1 from n_chirho where v_chirho<1418) insert into pages_chirho(volume_number_chirho,page_number_chirho,french_text_chirho) select 3,v_chirho,replace(hex(zeroblob(2500)),'0','F') from n_chirho");
    await sqlChirho("with recursive n_chirho(v_chirho) as (select 1 union all select v_chirho+1 from n_chirho where v_chirho<40) insert into scanlines_chirho(page_id_chirho,line_index_chirho) select p_chirho.id_chirho,n_chirho.v_chirho from pages_chirho p_chirho cross join n_chirho where p_chirho.volume_number_chirho=3");
    await sqlChirho("with n_chirho(v_chirho) as (values(0),(1),(2),(3)) insert into segments_chirho(scanline_id_chirho,segment_index_chirho,script_type_chirho) select l_chirho.id_chirho,n_chirho.v_chirho,case n_chirho.v_chirho when 0 then 'french-chirho' when 1 then 'hebrew-chirho' when 2 then 'unknown-chirho' else 'greek-chirho' end from scanlines_chirho l_chirho cross join n_chirho where n_chirho.v_chirho<3 or l_chirho.line_index_chirho<=10");
    await sqlChirho("with recursive n_chirho(v_chirho) as (select 1 union all select v_chirho+1 from n_chirho where v_chirho<53) insert into pages_chirho(volume_number_chirho,page_number_chirho) select 6,v_chirho*3 from n_chirho");
    await sqlChirho('insert into scanlines_chirho(page_id_chirho,line_index_chirho) select id_chirho,1 from pages_chirho where volume_number_chirho=6 and page_number_chirho=3');
    await sqlChirho('update pages_chirho set reconstructed_text_chirho=? where volume_number_chirho=3 and page_number_chirho=1', 'שָׁלוֹם · ἔκρυσις · é\n');
    await sqlChirho('update pages_chirho set reconstructed_text_chirho=?,french_text_chirho=? where volume_number_chirho=3 and page_number_chirho=2', '   ', 'French fallback é\n');
  });
  after(async () => runtimeChirho.dispose());

  it('returns 24 narrow rows with exact visible counts and indexed seeks, not a volume aggregation', async () => {
    assertChirho.equal(await d1Chirho.prepare('select count(*) from segments_chirho').first('count(*)'), 184340);
    queriesChirho.length = 0;
    const resultChirho = await windowChirho(3, 701);
    assertChirho.deepEqual(numbersChirho(resultChirho), Array.from({ length: 24 }, (_, indexChirho) => 701 + indexChirho));
    assertChirho.equal(resultChirho.previousBeforeChirho, 701); assertChirho.equal(resultChirho.nextFromChirho, 725);
    for (const pageChirho of resultChirho.pagesChirho) {
      assertChirho.equal(pageChirho.totalSegmentCountChirho, 130); assertChirho.equal(pageChirho.nonFrenchSegmentCountChirho, 90);
      assertChirho.deepEqual(Object.keys(pageChirho).sort(), ['idChirho', 'nonFrenchSegmentCountChirho', 'pageNumberChirho', 'statusChirho', 'totalSegmentCountChirho'].sort());
    }
    assertChirho.ok(Buffer.byteLength(JSON.stringify(resultChirho)) < 6000);
    const capturedChirho = [...queriesChirho];
    assertChirho.equal(capturedChirho.length, 3);
    const evidenceChirho = [];
    for (const queryChirho of capturedChirho) {
      const planChirho = await d1Chirho.prepare('explain query plan ' + queryChirho.sqlChirho).bind(...queryChirho.paramsChirho).all<{ detail: string }>();
      const detailsChirho = planChirho.results.map((rowChirho) => rowChirho.detail).join('\n');
      assertChirho.doesNotMatch(detailsChirho, /SCAN (?:pages_chirho|scanlines_chirho|segments_chirho)/);
      if (queryChirho.sqlChirho.includes('left join')) {
        assertChirho.match(detailsChirho, /SEARCH scanlines_chirho USING (?:COVERING )?INDEX.*page_id_chirho=/);
        assertChirho.match(detailsChirho, /SEARCH segments_chirho USING (?:COVERING )?INDEX.*scanline_id_chirho=/);
        assertChirho.equal(queryChirho.paramsChirho.length, PAGE_WINDOW_CHIRHO);
      } else {
        assertChirho.match(detailsChirho, /SEARCH pages_chirho USING (?:COVERING )?INDEX.*volume_number_chirho=.*page_number_chirho/);
        assertChirho.doesNotMatch(detailsChirho, /TEMP B-TREE/);
      }
      const rerunChirho = await d1Chirho.prepare(queryChirho.sqlChirho).bind(...queryChirho.paramsChirho).all();
      evidenceChirho.push({ planChirho: detailsChirho, rowsReadChirho: rerunChirho.meta.rows_read, rowsReturnedChirho: rerunChirho.results.length });
    }
    const unboundedChirho = await d1Chirho.prepare('select count(s_chirho.id_chirho) from segments_chirho s_chirho join scanlines_chirho l_chirho on l_chirho.id_chirho=s_chirho.scanline_id_chirho join pages_chirho p_chirho on p_chirho.id_chirho=l_chirho.page_id_chirho where p_chirho.volume_number_chirho=3').all();
    assertChirho.ok(evidenceChirho.every((itemChirho) => itemChirho.rowsReadChirho > 0), 'runtime must report measured row reads for this performance proof');
    assertChirho.ok(evidenceChirho.reduce((sumChirho, itemChirho) => sumChirho + itemChirho.rowsReadChirho, 0) < unboundedChirho.meta.rows_read / 10);
    console.log(JSON.stringify({ boundedQueriesChirho: evidenceChirho, negativeControlRowsReadChirho: unboundedChirho.meta.rows_read }));
  });

  it('walks all 1418 pages with bounded windows and an exact last partial window', async () => {
    const collectedChirho: number[] = [];
    let fromChirho: number | null = 1;
    while (fromChirho !== null) {
      const resultChirho = await windowChirho(3, fromChirho);
      assertChirho.ok(resultChirho.pagesChirho.length <= PAGE_WINDOW_CHIRHO);
      collectedChirho.push(...numbersChirho(resultChirho));
      fromChirho = resultChirho.nextFromChirho;
    }
    assertChirho.deepEqual(collectedChirho, Array.from({ length: 1418 }, (_, indexChirho) => indexChirho + 1));
  });

  it('traverses sparse numbers in both directions without duplicates or lost pages; gaps jump forward', async () => {
    let resultChirho = await windowChirho(6), collectedChirho: number[] = [], previousChirho: number[] = [];
    assertChirho.equal(resultChirho.previousBeforeChirho, null);
    for (;;) {
      const currentChirho = numbersChirho(resultChirho); collectedChirho.push(...currentChirho);
      assertChirho.ok(resultChirho.pagesChirho.every((pageChirho) => pageChirho.totalSegmentCountChirho === 0));
      if (resultChirho.previousBeforeChirho !== null) assertChirho.deepEqual(numbersChirho(await windowChirho(6, 1, resultChirho.previousBeforeChirho)), previousChirho);
      if (resultChirho.nextFromChirho === null) break;
      previousChirho = currentChirho; resultChirho = await windowChirho(6, resultChirho.nextFromChirho);
    }
    assertChirho.deepEqual(collectedChirho, Array.from({ length: 53 }, (_, indexChirho) => (indexChirho + 1) * 3));
    assertChirho.equal(numbersChirho(await windowChirho(6, 7))[0], 9);
    assertChirho.equal((await windowChirho(6, 160)).pagesChirho.length, 0);
    assertChirho.equal((await windowChirho(6, 1, 3)).pagesChirho.length, 0);
    queriesChirho.length = 0;
    assertChirho.equal((await windowChirho(88)).pagesChirho.length, 0);
    assertChirho.equal(queriesChirho.length, 1, 'empty volume performs no segment aggregation');
  });

  it('preserves UTF-8 and legacy fallback in a clearly scoped unverified download', async () => {
    const responseChirho = await exportChirho(1, 2), bodyChirho = await responseChirho.text();
    assertChirho.match(bodyChirho, /שָׁלוֹם · ἔκρυσις · é/);
    assertChirho.match(bodyChirho, /French fallback é/); assertChirho.match(bodyChirho, /needs-review-chirho/);
    assertChirho.match(bodyChirho, /unverified-export-chirho/); assertChirho.match(bodyChirho, /not a complete volume/);
    assertChirho.equal(responseChirho.headers.get('x-missing-reconstructed-pages-chirho'), '1');
    assertChirho.equal(responseChirho.headers.get('x-exported-pages-chirho'), '2');
    assertChirho.equal(responseChirho.headers.get('cache-control'), 'private, no-store');
    assertChirho.match(responseChirho.headers.get('content-disposition')!, /pages-1-2/);
    assertChirho.ok(Buffer.byteLength(bodyChirho) < EXPORT_BYTES_CHIRHO);
  });

  it('refuses excessive page counts and empty ranges instead of silently truncating', async () => {
    await assertChirho.rejects(exportChirho(1, 1418), { status: 413 });
    await assertChirho.rejects(exportChirho(1500, 1600), { status: 404 });
    await assertChirho.rejects(exportChirho(1, 24, 88), { status: 404 });
    const responseChirho = await exportChirho(1410, 2000);
    assertChirho.equal(responseChirho.headers.get('x-exported-pages-chirho'), '9');
  });

  it('refuses large fields at the SQL boundary and enforces the final UTF-8 byte cap', async () => {
    try {
      await sqlChirho('update pages_chirho set reconstructed_text_chirho=? where volume_number_chirho=3 and page_number_chirho=3', 'ש'.repeat(EXPORT_FIELD_BYTES_CHIRHO / 2 + 1));
      queriesChirho.length = 0;
      await assertChirho.rejects(exportChirho(3, 3), { status: 413 });
      const queryChirho = queriesChirho.at(-1)!;
      const resultChirho = await d1Chirho.prepare(queryChirho.sqlChirho).bind(...queryChirho.paramsChirho).all();
      assertChirho.ok(JSON.stringify(resultChirho.results).length < 6000, 'oversized text never crosses from D1 into JS');
      await sqlChirho('update pages_chirho set reconstructed_text_chirho=? where volume_number_chirho=3 and page_number_chirho between 3 and 26', 'ש'.repeat(EXPORT_FIELD_BYTES_CHIRHO / 2));
      await assertChirho.rejects(exportChirho(3, 26), { status: 413 });
      assertChirho.equal((await exportChirho(3, 3)).headers.get('x-exported-pages-chirho'), '1');
    } finally { await sqlChirho('update pages_chirho set reconstructed_text_chirho=null where volume_number_chirho=3 and page_number_chirho between 3 and 26'); }
  });

  it('does not refuse small reconstructed text just because the unused French field is large', async () => {
    try {
      await sqlChirho('update pages_chirho set reconstructed_text_chirho=?,french_text_chirho=? where volume_number_chirho=3 and page_number_chirho=3', 'Chosen text שָׁלוֹם', 'F'.repeat(EXPORT_FIELD_BYTES_CHIRHO + 1));
      assertChirho.match(await (await exportChirho(3, 3)).text(), /Chosen text שָׁלוֹם/);
      await sqlChirho('update pages_chirho set reconstructed_text_chirho=null where volume_number_chirho=3 and page_number_chirho=3');
      await assertChirho.rejects(exportChirho(3, 3), { status: 413 });
    } finally { await sqlChirho('update pages_chirho set reconstructed_text_chirho=null,french_text_chirho=? where volume_number_chirho=3 and page_number_chirho=3', 'F'.repeat(5000)); }
  });
});
