// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { openLocalD1ReadonlyChirho } from '../../../../src-chirho/d1-audit-fingerprint-chirho';
import { drizzle as drizzleChirho } from '../../../../app-chirho/node_modules/drizzle-orm/bun-sqlite';
import type { DbChirho } from '../../../../app-chirho/src/lib/server-chirho/db-chirho';
import { loadVolumeWindowChirho } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/volume-chirho';
import { loadVolumeSummariesChirho } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/home-chirho';
import { exportPageRangeChirho } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/export-chirho';
import { findReferencePagesChirho, parseFindQueryChirho } from '../../../../app-chirho/src/lib/server-chirho/catalog-chirho/find-chirho';

// Workflow: page-reading-workflow-chirho.md. Capture the actual generated SQL
// using an owned copied DB, then EXPLAIN it remotely. No remote content writes.
const copyChirho = process.env.HOTTP_READER_PREFLIGHT_COPY_CHIRHO;
if (!copyChirho?.startsWith('/private/tmp/hottp-password-chirho-')) throw new Error('An owned disposable reader copy is required.');
const localChirho = openLocalD1ReadonlyChirho(copyChirho);
const queriesChirho: { label_chirho: string; sql_chirho: string; params_chirho: unknown[] }[] = [];
let labelChirho = '';
const dbChirho = drizzleChirho(localChirho, { logger: { logQuery(sqlChirho, paramsChirho) {
  queriesChirho.push({ label_chirho: labelChirho, sql_chirho: sqlChirho, params_chirho: paramsChirho });
} } }) as unknown as DbChirho;
try {
  labelChirho = 'forward-chirho'; await loadVolumeWindowChirho(dbChirho, 3, { fromChirho: 148, beforeChirho: null });
  labelChirho = 'backward-chirho'; await loadVolumeWindowChirho(dbChirho, 3, { fromChirho: 1, beforeChirho: 152 });
  labelChirho = 'home-chirho'; await loadVolumeSummariesChirho(dbChirho);
  labelChirho = 'export-chirho'; await exportPageRangeChirho(dbChirho, { volumeChirho: 3, fromChirho: 148, toChirho: 152 });
  const referenceChirho = localChirho.query<{ reference_chirho: string }, []>('select canonical_reference_chirho as reference_chirho from segments_chirho where canonical_reference_chirho is not null limit 1').get();
  const parsedChirho = referenceChirho && parseFindQueryChirho(referenceChirho.reference_chirho);
  if (!parsedChirho || parsedChirho.kindChirho !== 'reference-chirho') throw new Error('No parseable copied reference for the plan proof.');
  labelChirho = 'verse-chirho'; await findReferencePagesChirho(dbChirho, parsedChirho);
  labelChirho = 'chapter-chirho'; await findReferencePagesChirho(dbChirho, { ...parsedChirho, verseChirho: null });
} finally { localChirho.close(); }
const accountChirho = process.env.CLOUDFLARE_GLOBAL_API_MAIN_ACCOUNT_ID_CHIRHO;
const emailChirho = process.env.CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO;
const keyChirho = process.env.CLOUDFLARE_GLOBAL_API_KEY_CHIRHO;
if (!accountChirho || !emailChirho || !keyChirho) throw new Error('Cloudflare read credentials are required.');
const plansChirho = [];
for (const queryChirho of queriesChirho) {
  if (!queryChirho.sql_chirho.startsWith('select ') || queryChirho.sql_chirho.includes(';')) throw new Error('Only generated SELECT plans may run.');
  const responseChirho = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountChirho + '/d1/database/873a8eda-1551-4ee7-9e3b-9b281b6c1635/query', {
    method: 'POST', headers: { 'X-Auth-Email': emailChirho, 'X-Auth-Key': keyChirho, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: 'EXPLAIN QUERY PLAN ' + queryChirho.sql_chirho, params: queryChirho.params_chirho }),
  });
  const payloadChirho = await responseChirho.json() as { success: boolean; errors?: unknown; result: { results: { detail: string }[]; meta: { rows_written: number } }[] };
  if (!responseChirho.ok || !payloadChirho.success) throw new Error('Remote plan refused: ' + JSON.stringify(payloadChirho.errors));
  const resultChirho = payloadChirho.result[0]!, planChirho = resultChirho.results.map((rowChirho) => rowChirho.detail).join(' | ');
  if (resultChirho.meta.rows_written !== 0) throw new Error('EXPLAIN unexpectedly reported writes.');
  if (queryChirho.label_chirho === 'home-chirho') {
    if (!planChirho.includes('COVERING INDEX idx_pages_vol_approved_chirho')) throw new Error('Home must use its covering page index: ' + planChirho);
  } else if (['verse-chirho', 'chapter-chirho'].includes(queryChirho.label_chirho)) {
    if (!planChirho.includes('COVERING INDEX idx_segments_canonical_reference_chirho')) throw new Error('Reference search must use its paired index: ' + planChirho);
  } else {
    if (/SCAN (?:pages_chirho|scanlines_chirho|segments_chirho)/.test(planChirho)) throw new Error('Unbounded table scan: ' + planChirho);
    if (/TEMP B-TREE FOR ORDER BY/.test(planChirho)) throw new Error('Page ordering must use its index: ' + planChirho);
  }
  plansChirho.push({ label_chirho: queryChirho.label_chirho, plan_chirho: planChirho, rows_written_chirho: resultChirho.meta.rows_written });
}
console.log(JSON.stringify({ query_count_chirho: plansChirho.length, plans_chirho: plansChirho }));
