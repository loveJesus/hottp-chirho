// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { Database } from 'bun:sqlite';
import { copyFileSync,mkdirSync,statSync } from 'node:fs';
import { join,dirname } from 'node:path';
import { PROJECT_ROOT_CHIRHO } from '../../../config-chirho.ts';
import { imageKeyChirho } from '../source-chirho.ts';
import { legacyStatementsChirho } from './model-chirho.ts';
import { loadManifestChirho,LEGACY_ROOT_CHIRHO,witnessHashChirho,savePrivateChirho } from './prepare-chirho.ts';

// Workflow: legacy-reader-workflow-chirho.md. A physical copy, never a link.
const stateChirho=process.argv[2];
if(!stateChirho || !/^\/private\/tmp\/hottp-legacy-reader-chirho-[A-Za-z0-9]+\/state\/v3$/.test(stateChirho))throw new Error('An owned disposable legacy-reader persistence directory is required');
const canonicalRootChirho=process.env.HOTTP_CANONICAL_ROOT_CHIRHO??PROJECT_ROOT_CHIRHO;
const relativeChirho='d1/miniflare-D1DatabaseObject/49ceeca0eaefb053fcb1e6ce1b9fafdd48db3f7f681331272cb804b7ff40dbee.sqlite';
const sourceChirho=join(canonicalRootChirho,'app-chirho/.wrangler/state/v3',relativeChirho),copyChirho=join(stateChirho,relativeChirho);
if(await Bun.file(copyChirho).exists())throw new Error('Fixture already exists; do not replace a live test store');
const beforeChirho=await witnessHashChirho();mkdirSync(join(stateChirho,'d1/miniflare-D1DatabaseObject'),{recursive:true});copyFileSync(sourceChirho,copyChirho);
if(statSync(sourceChirho).ino===statSync(copyChirho).ino)throw new Error('Fixture is not a separate file');
const manifestChirho=await loadManifestChirho(),dbChirho=new Database(copyChirho);
dbChirho.exec('PRAGMA foreign_keys=ON');dbChirho.transaction(()=>{for(const entryChirho of manifestChirho.entries_chirho)for(const statementChirho of legacyStatementsChirho(entryChirho))dbChirho.query(statementChirho.sql).run(...(statementChirho.params??[]));})();
dbChirho.exec('PRAGMA wal_checkpoint(TRUNCATE)');dbChirho.close();
for(const entryChirho of manifestChirho.entries_chirho){
  const numberChirho=entryChirho.payload_chirho.page_chirho[1];
  // Wrangler appends /v3 to --persist-to; platformProxy takes /v3 itself.
  // Its local R2 transfer implementation requires the Node runtime.
  const commandChirho=['rtk','proxy','node',join(PROJECT_ROOT_CHIRHO,'app-chirho/node_modules/wrangler/bin/wrangler.js'),'r2','object','put',`hottp-chirho/${imageKeyChirho(5,numberChirho)}`,
    '--file',join(LEGACY_ROOT_CHIRHO,'images-chirho',`page-${numberChirho}-chirho.png`),'--local','--persist-to',dirname(stateChirho),'--config',join(PROJECT_ROOT_CHIRHO,'app-chirho/wrangler-chirho.toml'),'--content-type','image/png'];
  const childChirho=Bun.spawn(commandChirho,{stdout:'pipe',stderr:'pipe'}),[outChirho,errorChirho,exitChirho]=await Promise.all([new Response(childChirho.stdout).text(),new Response(childChirho.stderr).text(),childChirho.exited]);
  if(exitChirho!==0)throw new Error(`Local R2 seed failed (${exitChirho}): ${outChirho} ${errorChirho}`);
}
const afterChirho=await witnessHashChirho();if(beforeChirho!==afterChirho)throw new Error('Protected witness changed during fixture setup');
const receiptChirho={created_at_chirho:new Date().toISOString(),physical_database_copy_chirho:true,local_images_chirho:21,witness_sha256_chirho:afterChirho,fixture_path_chirho:copyChirho};
await savePrivateChirho(join(LEGACY_ROOT_CHIRHO,'fixture-receipt-chirho.json'),receiptChirho);console.log(JSON.stringify(receiptChirho));
