// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { apiChirho, queryChirho } from './cloud-chirho.ts';
import { statementsChirho, imageKeyChirho, type PagePayloadChirho } from './source-chirho.ts';
import { INTAKE_ROOT_DIR_CHIRHO } from '../intake-config-chirho.ts';
import { join } from 'node:path';
import { chmodSync } from 'node:fs';

const createdChirho = await apiChirho('d1/database', 'POST', {name:'hottp-intake-proof-20261030-chirho'}) as {uuid: string; name: string};
if (!/^[a-f0-9-]{36}$/.test(createdChirho.uuid) || createdChirho.name !== 'hottp-intake-proof-20261030-chirho') throw new Error('Unexpected disposable database identity');
const idChirho = createdChirho.uuid;
console.log(`Disposable remote proof DB: ${idChirho}`);
const schemaChirho = (await queryChirho([{sql:"SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('pages_chirho','scanlines_chirho','segments_chirho') ORDER BY CASE name WHEN 'pages_chirho' THEN 1 WHEN 'scanlines_chirho' THEN 2 ELSE 3 END"}]))[0]!.results;
if (schemaChirho.length !== 3) throw new Error('Missing production schema');
await queryChirho(schemaChirho.map(rowChirho => ({sql: String(rowChirho.sql)})), idChirho);
const payloadChirho: PagePayloadChirho = {page_chirho: [1, 1, 'Disposable test only', imageKeyChirho(1,1)], lines_chirho: [[0,0,0,100,20,'Test',1]], segments_chirho:[[0,0,0,0,0,100,'Test','french-chirho']]};
let failedChirho = false;
try { await queryChirho([...statementsChirho(payloadChirho), {sql:'INSERT INTO segments_chirho(scanline_id_chirho,segment_index_chirho) SELECT id_chirho,0 FROM scanlines_chirho'}], idChirho); }
catch { failedChirho = true; }
const afterFailureChirho = (await queryChirho([{sql:'SELECT (SELECT count(*) FROM pages_chirho) AS pages_chirho,(SELECT count(*) FROM scanlines_chirho) AS lines_chirho,(SELECT count(*) FROM segments_chirho) AS segments_chirho'}], idChirho))[0]!.results[0]!;
if (!failedChirho || Object.values(afterFailureChirho).some(valueChirho => valueChirho !== 0)) throw new Error(`Remote batch rollback failed: ${JSON.stringify(afterFailureChirho)}`);
await queryChirho(statementsChirho(payloadChirho), idChirho);
let duplicateRefusedChirho = false;
try { await queryChirho(statementsChirho(payloadChirho), idChirho); } catch { duplicateRefusedChirho = true; }
const afterSuccessChirho = (await queryChirho([{sql:"SELECT (SELECT count(*) FROM pages_chirho) AS pages_chirho,(SELECT count(*) FROM scanlines_chirho) AS lines_chirho,(SELECT count(*) FROM segments_chirho) AS segments_chirho,(SELECT count(*) FROM segments_chirho WHERE status_chirho!='pending-chirho' OR accepted_text_chirho IS NOT NULL) AS trusted_chirho"}], idChirho))[0]!.results[0]!;
if (!duplicateRefusedChirho || JSON.stringify(afterSuccessChirho) !== JSON.stringify({pages_chirho:1,lines_chirho:1,segments_chirho:1,trusted_chirho:0})) throw new Error('Remote idempotence/trust test failed');
// Exact database created by this invocation only; never delete production.
await apiChirho(`d1/database/${idChirho}`, 'DELETE');
const receiptChirho = {verified_at_chirho:new Date().toISOString(), database_chirho:idChirho, deleted_disposable_database_chirho:true, copied_production_ddl_chirho:true, rollback_chirho:afterFailureChirho, duplicate_refused_chirho:duplicateRefusedChirho, clean_retry_chirho:afterSuccessChirho};
const pathChirho = join(INTAKE_ROOT_DIR_CHIRHO,'publish-chirho/2026-10-30-chirho/remote-proof-chirho.json');
await Bun.write(pathChirho,JSON.stringify(receiptChirho,null,2)+'\n'); chmodSync(pathChirho,0o600);
console.log(JSON.stringify(receiptChirho));
