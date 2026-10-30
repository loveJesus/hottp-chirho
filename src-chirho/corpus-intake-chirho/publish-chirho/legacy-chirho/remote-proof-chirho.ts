// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { join } from 'node:path';
import { apiChirho,queryChirho,DATABASE_ID_CHIRHO } from '../cloud-chirho.ts';
import { sameStoredRowChirho } from '../verify-chirho.ts';
import { legacyStatementsChirho } from './model-chirho.ts';
import { loadManifestChirho,LEGACY_ROOT_CHIRHO,savePrivateChirho } from './prepare-chirho.ts';

// Actual REST guard/transaction proof on a throwaway D1 only. No production
// writes occur here; production contributes table definitions, not live rows.
const createdChirho=await apiChirho('d1/database','POST',{name:'hottp-legacy-proof-20261030-chirho'}) as {uuid:string;name:string};
if(!/^[a-f0-9-]{36}$/.test(createdChirho.uuid) || createdChirho.uuid===DATABASE_ID_CHIRHO || createdChirho.name!=='hottp-legacy-proof-20261030-chirho')throw new Error('Unexpected disposable database');
const idChirho=createdChirho.uuid;
console.log(`Disposable remote legacy proof DB: ${idChirho}`);
const checksChirho:string[]=[];
try{
  const schemaChirho=(await queryChirho([{sql:"SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('pages_chirho','scanlines_chirho','segments_chirho','words_chirho','events_chirho','snippets_chirho','page_snapshots_chirho')"}]))[0]!.results;
  if(schemaChirho.length!==7)throw new Error('Missing production DDL');await queryChirho(schemaChirho.map(rowChirho=>({sql:String(rowChirho.sql)})),idChirho);
  const manifestChirho=await loadManifestChirho(),entryChirho=structuredClone(manifestChirho.entries_chirho[0]!);
  // Synthetic page metadata, with the real geometry projection. The schema
  // has the same fields as production, without copying reviewer identities.
  entryChirho.original_page_chirho.french_text_chirho='Disposable source text';entryChirho.payload_chirho.page_chirho[2]='Disposable source text';
  const columnsChirho=Object.keys(entryChirho.original_page_chirho);
  await queryChirho([{sql:`INSERT INTO pages_chirho(${columnsChirho.join(',')}) VALUES(${columnsChirho.map(()=>'?').join(',')})`,params:columnsChirho.map(columnChirho=>entryChirho.original_page_chirho[columnChirho]!)}],idChirho);
  const noChildrenChirho=async()=>{
    const valueChirho=(await queryChirho([{sql:'SELECT (SELECT count(*) FROM scanlines_chirho) AS lines_chirho,(SELECT count(*) FROM segments_chirho) AS segments_chirho'}],idChirho))[0]!.results[0]!;
    if(valueChirho.lines_chirho!==0 || valueChirho.segments_chirho!==0)throw new Error('Remote failure committed child rows');
  };
  const mustRefuseChirho=async(batchChirho:ReturnType<typeof legacyStatementsChirho>,labelChirho:string)=>{
    let refusedChirho=false;try{await queryChirho(batchChirho,idChirho);}catch{refusedChirho=true;}
    if(!refusedChirho)throw new Error(`Remote negative control passed unexpectedly: ${labelChirho}`);checksChirho.push(labelChirho);
  };
  await queryChirho([{sql:"UPDATE pages_chirho SET french_text_chirho='Changed in flight'"}],idChirho);
  await mustRefuseChirho(legacyStatementsChirho(entryChirho),'changed page source refuses');await noChildrenChirho();
  await queryChirho([{sql:'UPDATE pages_chirho SET french_text_chirho=?',params:['Disposable source text']},{sql:"INSERT INTO events_chirho(page_id_chirho,aggregate_type_chirho,event_type_chirho,payload_json_chirho) VALUES(?,'page-chirho','page-completed-chirho','{}')",params:[Number(entryChirho.original_page_chirho.id_chirho)]}],idChirho);
  await mustRefuseChirho(legacyStatementsChirho(entryChirho),'new review event refuses');await noChildrenChirho();
  await queryChirho([{sql:'DELETE FROM events_chirho WHERE page_id_chirho=?',params:[Number(entryChirho.original_page_chirho.id_chirho)]}],idChirho);
  const brokenChirho=structuredClone(entryChirho);brokenChirho.payload_chirho.segments_chirho.push(brokenChirho.payload_chirho.segments_chirho[0]!);
  await mustRefuseChirho(legacyStatementsChirho(brokenChirho),'late duplicate segment rolls back all new lines');await noChildrenChirho();
  await queryChirho(legacyStatementsChirho(entryChirho),idChirho);
  const afterChirho=(await queryChirho([{sql:'SELECT * FROM pages_chirho'}],idChirho))[0]!.results[0]!;
  if(!sameStoredRowChirho(entryChirho.original_page_chirho,afterChirho))throw new Error('Legacy page metadata changed');checksChirho.push('original complete page row preserved');
  const finalChirho=(await queryChirho([{sql:"SELECT (SELECT count(*) FROM scanlines_chirho) AS lines_chirho,(SELECT count(*) FROM segments_chirho) AS segments_chirho,(SELECT count(*) FROM segments_chirho WHERE accepted_text_chirho IS NOT NULL OR ocr_text_chirho IS NOT NULL OR status_chirho!='pending-chirho') AS promoted_chirho"}],idChirho))[0]!.results[0]!;
  if(finalChirho.lines_chirho!==entryChirho.payload_chirho.lines_chirho.length || finalChirho.segments_chirho!==entryChirho.payload_chirho.segments_chirho.length || finalChirho.promoted_chirho!==0)throw new Error('Incorrect remote clean retry');checksChirho.push('clean retry creates pending rows only');
  await mustRefuseChirho(legacyStatementsChirho(entryChirho),'repeated append refuses without replacement');
  await savePrivateChirho(join(LEGACY_ROOT_CHIRHO,'remote-proof-chirho.json'),{verified_at_chirho:new Date().toISOString(),database_chirho:idChirho,checks_chirho:checksChirho,counts_chirho:finalChirho,production_rows_written_chirho:0});
  console.log(JSON.stringify({checks_chirho:checksChirho,counts_chirho:finalChirho}));
}finally{
  await apiChirho(`d1/database/${idChirho}`,'DELETE');console.log(`Deleted disposable remote proof DB ${idChirho}`);
}
