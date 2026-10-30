// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { classifyPageChirho } from '../../../classify-french-chirho.ts';
import { PROJECT_ROOT_CHIRHO } from '../../../config-chirho.ts';
import { pageLineBboxesChirho } from '../../page-geometry-chirho.ts';
import { draftLineSegmentsChirho, DRAFT_GAP_THRESHOLD_PX_CHIRHO } from '../../draft-segments-chirho.ts';
import { pngSizeChirho } from '../../intake-runner-chirho.ts';
import { INTAKE_ROOT_DIR_CHIRHO } from '../../intake-config-chirho.ts';
import { r2Chirho, BUCKET_CHIRHO, queryChirho } from '../cloud-chirho.ts';
import { geometryPayloadChirho, imageKeyChirho, sha256Chirho, type LineChirho, type SegmentChirho } from '../source-chirho.ts';
import { digestChirho, verifyExistingChirho, type TableSnapshotChirho } from '../verify-chirho.ts';
import { LEGACY_PAGE_NUMBERS_CHIRHO, legacyStatementsChirho, type LegacyEntryChirho } from './model-chirho.ts';

export const LEGACY_ROOT_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO,'publish-chirho/legacy-2026-10-30-chirho');
export const LEGACY_MANIFEST_CHIRHO = join(LEGACY_ROOT_CHIRHO,'manifest-chirho.json');
export const PRIOR_ROOT_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO,'publish-chirho/2026-10-30-chirho');
export interface LegacyManifestChirho { created_at_chirho:string; entries_chirho:LegacyEntryChirho[]; witness_sha256_chirho:string; original_counts_chirho:Record<string,unknown>[]; sha256_chirho:string }
export async function witnessHashChirho(): Promise<string> {
  const rootChirho = process.env.HOTTP_CANONICAL_ROOT_CHIRHO ?? PROJECT_ROOT_CHIRHO;
  return sha256Chirho(new Uint8Array(await Bun.file(join(rootChirho,'app-chirho/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/49ceeca0eaefb053fcb1e6ce1b9fafdd48db3f7f681331272cb804b7ff40dbee.sqlite')).arrayBuffer()));
}
export async function savePrivateChirho(pathChirho:string, valueChirho:unknown):Promise<void>{await Bun.write(pathChirho,JSON.stringify(valueChirho,null,2)+'\n');chmodSync(pathChirho,0o600);}
export async function originalRowsChirho():Promise<TableSnapshotChirho[]>{return await Bun.file(join(PRIOR_ROOT_CHIRHO,'existing-rows-chirho.json')).json() as TableSnapshotChirho[];}
export async function legacyCountsChirho():Promise<Record<string,unknown>[]> {
  return (await queryChirho([{sql:`SELECT 'pages-chirho' AS table_chirho,count(*) AS count_chirho FROM pages_chirho UNION ALL SELECT 'lines-chirho',count(*) FROM scanlines_chirho UNION ALL SELECT 'segments-chirho',count(*) FROM segments_chirho UNION ALL SELECT 'events-chirho',count(*) FROM events_chirho UNION ALL SELECT 'words-chirho',count(*) FROM words_chirho`}]))[0]!.results;
}
export async function loadManifestChirho():Promise<LegacyManifestChirho>{
  const manifestChirho=await Bun.file(LEGACY_MANIFEST_CHIRHO).json() as LegacyManifestChirho;
  const {sha256_chirho:shaChirho,...unsignedChirho}=manifestChirho;
  if(digestChirho(unsignedChirho)!==shaChirho || manifestChirho.entries_chirho.length!==21 || manifestChirho.entries_chirho.some((entryChirho,indexChirho)=>entryChirho.payload_chirho.page_chirho[1]!==LEGACY_PAGE_NUMBERS_CHIRHO[indexChirho] || digestChirho(entryChirho.payload_chirho)!==entryChirho.payload_sha256_chirho))throw new Error('Legacy manifest integrity failure');
  if(manifestChirho.witness_sha256_chirho!==await witnessHashChirho())throw new Error('Protected witness changed');
  return manifestChirho;
}

// Workflow: legacy-reader-workflow-chirho.md. Read the served scans; never
// replace them or copy accepted text/geometry from the certification corpus.
async function prepareLegacyChirho():Promise<void>{
  if(await Bun.file(LEGACY_MANIFEST_CHIRHO).exists())throw new Error('Frozen manifest already exists');
  mkdirSync(join(LEGACY_ROOT_CHIRHO,'images-chirho'),{recursive:true,mode:0o700});
  const baselineChirho=await originalRowsChirho();await verifyExistingChirho(baselineChirho);
  const pagesChirho=(await queryChirho([{sql:'SELECT * FROM pages_chirho WHERE volume_number_chirho=5 AND page_number_chirho BETWEEN 50 AND 70 ORDER BY page_number_chirho'}]))[0]!.results as LegacyEntryChirho['original_page_chirho'][];
  if(pagesChirho.length!==21 || pagesChirho.some((pageChirho,indexChirho)=>pageChirho.page_number_chirho!==LEGACY_PAGE_NUMBERS_CHIRHO[indexChirho]))throw new Error('Legacy page set differs');
  const clientChirho=r2Chirho(),entriesChirho:LegacyEntryChirho[]=[];
  try{
    for(const pageChirho of pagesChirho){
      const numberChirho=Number(pageChirho.page_number_chirho),keyChirho=imageKeyChirho(5,numberChirho);
      const objectChirho=await clientChirho.send(new GetObjectCommand({Bucket:BUCKET_CHIRHO,Key:keyChirho}));
      if(!objectChirho.Body)throw new Error(`Missing source scan ${numberChirho}`);
      const imageChirho=await objectChirho.Body.transformToByteArray(),{widthChirho,heightChirho}=pngSizeChirho(imageChirho);
      const md5Chirho=createHash('md5').update(imageChirho).digest('hex');
      if(objectChirho.ETag?.replaceAll('"','')!==md5Chirho)throw new Error('Served scan hash mismatch');
      const pathChirho=join(LEGACY_ROOT_CHIRHO,'images-chirho',`page-${numberChirho}-chirho.png`);await Bun.write(pathChirho,imageChirho);
      const geometryChirho=await pageLineBboxesChirho(5,numberChirho,pathChirho);
      const verdictsChirho=await classifyPageChirho(geometryChirho.map((lineChirho,indexChirho)=>({lineIndexChirho:indexChirho,wordsChirho:lineChirho.wordsChirho})),new Set<string>());
      const segmentsChirho:SegmentChirho[]=[];
      const linesChirho:LineChirho[]=geometryChirho.map((lineChirho,indexChirho)=>{
        const reasonsChirho=verdictsChirho.filter(verdictChirho=>verdictChirho.lineIndexChirho===indexChirho).sort((aChirho,bChirho)=>aChirho.wordIndexChirho-bChirho.wordIndexChirho).map(verdictChirho=>verdictChirho.reasonChirho);
        const draftsChirho=draftLineSegmentsChirho({xMinChirho:lineChirho.xMinChirho,widthChirho:lineChirho.xMaxChirho-lineChirho.xMinChirho,wordsChirho:lineChirho.wordsChirho},reasonsChirho,DRAFT_GAP_THRESHOLD_PX_CHIRHO);
        segmentsChirho.push(...draftsChirho.map(draftChirho=>[indexChirho,draftChirho.segmentIndexChirho,draftChirho.wordStartIndexChirho,draftChirho.wordEndIndexChirho,draftChirho.xMinPxChirho,draftChirho.widthPxChirho,draftChirho.machineTextChirho.normalize('NFC'),draftChirho.scriptChirho] as SegmentChirho));
        return[indexChirho,lineChirho.xMinChirho,lineChirho.yMinChirho,lineChirho.xMaxChirho-lineChirho.xMinChirho,lineChirho.yMaxChirho-lineChirho.yMinChirho,lineChirho.textChirho.normalize('NFC'),draftsChirho.length];
      });
      const payloadChirho=geometryPayloadChirho({page_chirho:[5,numberChirho,String(pageChirho.french_text_chirho),String(pageChirho.image_path_chirho)],lines_chirho:linesChirho,segments_chirho:segmentsChirho},widthChirho,heightChirho);
      const entryChirho:LegacyEntryChirho={original_page_chirho:pageChirho,payload_chirho:payloadChirho,payload_sha256_chirho:digestChirho(payloadChirho),image_sha256_chirho:sha256Chirho(imageChirho),image_md5_chirho:md5Chirho,image_width_chirho:widthChirho,image_height_chirho:heightChirho,image_bytes_chirho:imageChirho.byteLength};
      // The first statement is a SELECT-only source and emptiness guard.
      await queryChirho([legacyStatementsChirho(entryChirho)[0]!]);entriesChirho.push(entryChirho);
      console.log(`Prepared 5:${numberChirho}: ${linesChirho.length} lines, ${segmentsChirho.length} unverified segments`);
    }
  }finally{clientChirho.destroy();}
  const valueChirho={created_at_chirho:new Date().toISOString(),entries_chirho:entriesChirho,witness_sha256_chirho:await witnessHashChirho(),original_counts_chirho:await legacyCountsChirho()};
  await savePrivateChirho(LEGACY_MANIFEST_CHIRHO,{...valueChirho,sha256_chirho:digestChirho(valueChirho)});
  console.log(JSON.stringify({manifest_sha256_chirho:digestChirho(valueChirho),pages_chirho:entriesChirho.length,lines_chirho:entriesChirho.reduce((sumChirho,entryChirho)=>sumChirho+entryChirho.payload_chirho.lines_chirho.length,0),segments_chirho:entriesChirho.reduce((sumChirho,entryChirho)=>sumChirho+entryChirho.payload_chirho.segments_chirho.length,0)}));
}
if(import.meta.main)await prepareLegacyChirho();
