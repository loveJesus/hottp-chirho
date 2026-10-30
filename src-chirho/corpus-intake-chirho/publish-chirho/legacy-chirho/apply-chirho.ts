// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { join } from 'node:path';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { queryChirho, r2Chirho, BUCKET_CHIRHO } from '../cloud-chirho.ts';
import { imageKeyChirho } from '../source-chirho.ts';
import { digestChirho, remotePayloadsChirho, verifyExistingChirho } from '../verify-chirho.ts';
import { legacyStatementsChirho } from './model-chirho.ts';
import { LEGACY_ROOT_CHIRHO, loadManifestChirho, originalRowsChirho, savePrivateChirho, witnessHashChirho, legacyCountsChirho } from './prepare-chirho.ts';

// Workflow: legacy-reader-workflow-chirho.md. All 21 pages form one bounded
// transaction. No retry of an unknown write: the next invocation reconciles
// every complete payload and refuses partial/changed/reviewed children.
const modeChirho=process.argv[2];
if(!['apply-chirho','verify-chirho'].includes(modeChirho??''))throw new Error('Specify apply-chirho or verify-chirho');
const manifestChirho=await loadManifestChirho(),originalChirho=await originalRowsChirho();
await verifyExistingChirho(originalChirho);
const expectedPagesChirho=new Map(manifestChirho.entries_chirho.map(entryChirho=>[Number(entryChirho.original_page_chirho.page_number_chirho),entryChirho.original_page_chirho]));
const pendingChirho=[];
let reconciledChirho=0;
const clientChirho=r2Chirho();
for(let offsetChirho=0;offsetChirho<manifestChirho.entries_chirho.length;offsetChirho+=7){
  const entriesChirho=manifestChirho.entries_chirho.slice(offsetChirho,offsetChirho+7);
  const storedChirho=await remotePayloadsChirho(5,entriesChirho.map(entryChirho=>entryChirho.payload_chirho.page_chirho[1]),expectedPagesChirho);
  for(const entryChirho of entriesChirho){
    const numberChirho=entryChirho.payload_chirho.page_chirho[1],payloadChirho=storedChirho.get(numberChirho);
    if(!payloadChirho)throw new Error('Original legacy page disappeared');
    const objectChirho=await clientChirho.send(new HeadObjectCommand({Bucket:BUCKET_CHIRHO,Key:imageKeyChirho(5,numberChirho)}));
    if(objectChirho.ContentLength!==entryChirho.image_bytes_chirho || objectChirho.ETag?.replaceAll('"','')!==entryChirho.image_md5_chirho)throw new Error(`Source scan changed 5:${numberChirho}`);
    if(!payloadChirho.lines_chirho.length && !payloadChirho.segments_chirho.length){
      if(modeChirho==='verify-chirho')throw new Error(`Missing reader rows 5:${numberChirho}`);
      pendingChirho.push(entryChirho);
    }else if(digestChirho(payloadChirho)!==entryChirho.payload_sha256_chirho)throw new Error(`Existing reader data differs 5:${numberChirho}; do not replace it`);
    else reconciledChirho++;
  }
}
clientChirho.destroy();
if(pendingChirho.length){
  const batchChirho=pendingChirho.flatMap(legacyStatementsChirho);
  if(Buffer.byteLength(JSON.stringify(batchChirho))>2*1024*1024)throw new Error('Legacy batch exceeds 2 MiB');
  await queryChirho(batchChirho);
}
for(let offsetChirho=0;offsetChirho<manifestChirho.entries_chirho.length;offsetChirho+=7){
  const entriesChirho=manifestChirho.entries_chirho.slice(offsetChirho,offsetChirho+7);
  const storedChirho=await remotePayloadsChirho(5,entriesChirho.map(entryChirho=>entryChirho.payload_chirho.page_chirho[1]),expectedPagesChirho);
  for(const entryChirho of entriesChirho)if(digestChirho(storedChirho.get(entryChirho.payload_chirho.page_chirho[1]))!==entryChirho.payload_sha256_chirho)throw new Error('Legacy post-append payload differs');
}
const countsChirho=await legacyCountsChirho();
const lineCountChirho=manifestChirho.entries_chirho.reduce((sumChirho,entryChirho)=>sumChirho+entryChirho.payload_chirho.lines_chirho.length,0);
const segmentCountChirho=manifestChirho.entries_chirho.reduce((sumChirho,entryChirho)=>sumChirho+entryChirho.payload_chirho.segments_chirho.length,0);
for(const rowChirho of countsChirho){
  const beforeChirho=manifestChirho.original_counts_chirho.find(beforeChirho=>beforeChirho.table_chirho===rowChirho.table_chirho)!;
  const deltaChirho=rowChirho.table_chirho==='lines-chirho'?lineCountChirho:rowChirho.table_chirho==='segments-chirho'?segmentCountChirho:0;
  if(rowChirho.count_chirho!==Number(beforeChirho.count_chirho)+deltaChirho)throw new Error(`Unexpected global row-count change ${rowChirho.table_chirho}`);
}
const preservedChirho=await verifyExistingChirho(originalChirho);
const receiptChirho={verified_at_chirho:new Date().toISOString(),manifest_sha256_chirho:manifestChirho.sha256_chirho,appended_pages_chirho:pendingChirho.length,reconciled_pages_chirho:reconciledChirho,
  pages_with_reader_lines_chirho:21,new_lines_chirho:lineCountChirho,new_segments_chirho:segmentCountChirho,complete_pending_payloads_verified_chirho:21,counts_chirho:countsChirho,
  original_rows_preserved_chirho:preservedChirho,witness_sha256_chirho:await witnessHashChirho(),r2_objects_written_chirho:0,source_scans_verified_chirho:21,
  scope_chirho:'New machine reader lines/segments only. Original pages, reviews, events, words, snapshots, certification and station packets are unchanged.'};
await savePrivateChirho(join(LEGACY_ROOT_CHIRHO,`${modeChirho}-receipt-chirho.json`),receiptChirho);console.log(JSON.stringify(receiptChirho));
