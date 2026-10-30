// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { join } from 'node:path';
import { chmodSync } from 'node:fs';
import { apiChirho, queryChirho, r2Chirho, imageInventoryChirho, DATABASE_ID_CHIRHO } from './cloud-chirho.ts';
import { VOLUME_PAGES_CHIRHO, imageKeyChirho, sha256Chirho } from './source-chirho.ts';
import { digestChirho, verifyExistingChirho, type TableSnapshotChirho } from './verify-chirho.ts';
import { INTAKE_ROOT_DIR_CHIRHO } from '../intake-config-chirho.ts';
import { PROJECT_ROOT_CHIRHO } from '../../config-chirho.ts';

// Read-only production close-out, independent of an uploader's exit code.
// Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-publish-workflow-chirho.md.
const rootChirho = join(INTAKE_ROOT_DIR_CHIRHO,'publish-chirho/2026-10-30-chirho');
const baselineChirho = await Bun.file(join(rootChirho,'existing-rows-chirho.json')).json() as TableSnapshotChirho[];
const manifestChirho = await Bun.file(join(rootChirho,'manifest-chirho.json')).json() as {
  baseline_sha256_chirho:string; witness_sha256_chirho:string;
  pages_chirho:{key_chirho:string; image_md5_chirho:string; bytes_chirho:number; lines_chirho:number; segments_chirho:number}[];
};
if (manifestChirho.baseline_sha256_chirho !== digestChirho(baselineChirho)) throw new Error('Baseline integrity failure');
const protectedRowsChirho = await verifyExistingChirho(baselineChirho);
const baselinePagesChirho = baselineChirho.find(tableChirho=>tableChirho.table_chirho==='pages_chirho')!.rows_chirho;
const idsChirho = JSON.stringify(baselinePagesChirho.map(rowChirho=>rowChirho.id_chirho));
const countsChirho = (await queryChirho([{sql:`SELECT p.volume_number_chirho,count(DISTINCT p.id_chirho) AS pages_chirho,count(DISTINCT l.id_chirho) AS lines_chirho,count(s.id_chirho) AS segments_chirho
  FROM pages_chirho p LEFT JOIN scanlines_chirho l ON l.page_id_chirho=p.id_chirho LEFT JOIN segments_chirho s ON s.scanline_id_chirho=l.id_chirho GROUP BY p.volume_number_chirho ORDER BY p.volume_number_chirho`}]))[0]!.results;
const baselineLineVolumesChirho = new Map<number,number>();
for (const rowChirho of baselineChirho.find(tableChirho=>tableChirho.table_chirho==='scanlines_chirho')!.rows_chirho) {
  const pageChirho=baselinePagesChirho.find(pageChirho=>pageChirho.id_chirho===rowChirho.page_id_chirho)!;
  baselineLineVolumesChirho.set(Number(rowChirho.id_chirho),Number(pageChirho.volume_number_chirho));
}
if (countsChirho.length !== 5) throw new Error('Unexpected volume set');
for (const rowChirho of countsChirho) {
  const volumeChirho=Number(rowChirho.volume_number_chirho);
  const entriesChirho=manifestChirho.pages_chirho.filter(pageChirho=>pageChirho.key_chirho.startsWith(`${volumeChirho}:`));
  const expectedLinesChirho=entriesChirho.reduce((sumChirho,pageChirho)=>sumChirho+pageChirho.lines_chirho,0)+[...baselineLineVolumesChirho.values()].filter(valueChirho=>valueChirho===volumeChirho).length;
  const expectedSegmentsChirho=entriesChirho.reduce((sumChirho,pageChirho)=>sumChirho+pageChirho.segments_chirho,0)+baselineChirho.find(tableChirho=>tableChirho.table_chirho==='segments_chirho')!.rows_chirho.filter(segmentChirho=>baselineLineVolumesChirho.get(Number(segmentChirho.scanline_id_chirho))===volumeChirho).length;
  if(rowChirho.pages_chirho!==VOLUME_PAGES_CHIRHO[volumeChirho-1] || rowChirho.lines_chirho!==expectedLinesChirho || rowChirho.segments_chirho!==expectedSegmentsChirho) throw new Error(`Volume ${volumeChirho} counts differ from source plus preserved baseline`);
}
const trustChirho = (await queryChirho([
  {sql:`SELECT count(*) AS pages_chirho,sum(status_chirho!='pending-chirho' OR reconstructed_text_chirho IS NOT NULL OR vision_text_chirho IS NOT NULL OR lines_approved_at_chirho IS NOT NULL) AS promoted_chirho FROM pages_chirho WHERE id_chirho NOT IN (SELECT value FROM json_each(?))`,params:[idsChirho]},
  {sql:`SELECT count(*) AS lines_chirho,sum(l.status_chirho!='pending-chirho' OR l.reconstructed_text_chirho IS NOT NULL OR l.words_json_chirho IS NOT NULL OR l.image_r2_key_chirho IS NOT NULL) AS promoted_chirho FROM scanlines_chirho l WHERE l.page_id_chirho NOT IN (SELECT value FROM json_each(?))`,params:[idsChirho]},
  {sql:`SELECT count(*) AS segments_chirho,sum(s.width_px_chirho=0) AS zero_width_chirho,sum(s.status_chirho!='pending-chirho' OR s.accepted_text_chirho IS NOT NULL OR s.ocr_text_chirho IS NOT NULL OR s.canonical_source_chirho IS NOT NULL OR s.canonical_confidence_chirho IS NOT NULL OR s.canonical_reference_chirho IS NOT NULL OR s.canonical_distance_chirho IS NOT NULL OR s.image_r2_key_chirho IS NOT NULL) AS promoted_chirho FROM segments_chirho s JOIN scanlines_chirho l ON l.id_chirho=s.scanline_id_chirho WHERE l.page_id_chirho NOT IN (SELECT value FROM json_each(?))`,params:[idsChirho]},
])).map(resultChirho=>resultChirho.results[0]!);
if (trustChirho[0]!.pages_chirho!==5289 || trustChirho[1]!.lines_chirho!==232644 || trustChirho[2]!.segments_chirho!==693530 || trustChirho.some(rowChirho=>rowChirho.promoted_chirho!==0)) throw new Error('New corpus count or trust failure');
const nonGrowingChirho=baselineChirho.filter(tableChirho=>!['pages_chirho','scanlines_chirho','segments_chirho'].includes(tableChirho.table_chirho));
for (const tableChirho of nonGrowingChirho) if(!/^[a-z0-9_]+$/.test(tableChirho.table_chirho))throw new Error('Unsafe table');
const untouchedCountsChirho=await queryChirho(nonGrowingChirho.map(tableChirho=>({sql:`SELECT count(*) AS count_chirho FROM ${tableChirho.table_chirho}`})));
for(let indexChirho=0;indexChirho<nonGrowingChirho.length;indexChirho++) if(untouchedCountsChirho[indexChirho]!.results[0]!.count_chirho!==nonGrowingChirho[indexChirho]!.rows_chirho.length)throw new Error(`Unrelated table grew: ${nonGrowingChirho[indexChirho]!.table_chirho}`);
const clientChirho=r2Chirho(), imagesChirho=[];
for(let volumeChirho=1;volumeChirho<=5;volumeChirho++){
  const inventoryChirho=await imageInventoryChirho(clientChirho,volumeChirho);
  if(inventoryChirho.size!==VOLUME_PAGES_CHIRHO[volumeChirho-1])throw new Error(`Incomplete/extra volume ${volumeChirho} images`);
  for(let pageChirho=1;pageChirho<=VOLUME_PAGES_CHIRHO[volumeChirho-1]!;pageChirho++)if(!inventoryChirho.has(imageKeyChirho(volumeChirho,pageChirho)))throw new Error('Missing page image');
  for(const entryChirho of manifestChirho.pages_chirho.filter(entryChirho=>entryChirho.key_chirho.startsWith(`${volumeChirho}:`))){
    const objectChirho=inventoryChirho.get(imageKeyChirho(volumeChirho,Number(entryChirho.key_chirho.split(':')[1])))!;
    if(objectChirho.bytes_chirho!==entryChirho.bytes_chirho || objectChirho.etag_chirho.replaceAll('"','')!==entryChirho.image_md5_chirho)throw new Error('Image integrity failure');
  }
  imagesChirho.push({volume_chirho:volumeChirho,images_chirho:inventoryChirho.size,bytes_chirho:[...inventoryChirho.values()].reduce((sumChirho,objectChirho)=>sumChirho+objectChirho.bytes_chirho,0)});
}
clientChirho.destroy();
const witnessChirho=sha256Chirho(new Uint8Array(await Bun.file(join(PROJECT_ROOT_CHIRHO,'app-chirho/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/49ceeca0eaefb053fcb1e6ce1b9fafdd48db3f7f681331272cb804b7ff40dbee.sqlite')).arrayBuffer()));
if(witnessChirho!==manifestChirho.witness_sha256_chirho)throw new Error('Protected witness changed');
const databaseChirho=await apiChirho(`d1/database/${DATABASE_ID_CHIRHO}`) as {file_size:number};
const deploymentChirho=await apiChirho('workers/scripts/hottp-chirho/deployments') as {deployments:{id:string;versions:{version_id:string;percentage:number}[]}[]};
const receiptChirho={verified_at_chirho:new Date().toISOString(),source_commit_chirho:'c371006',manifest_sha256_chirho:digestChirho(manifestChirho),
  counts_chirho:countsChirho,new_corpus_chirho:trustChirho,images_chirho:imagesChirho,protected_tables_chirho:protectedRowsChirho,
  unrelated_table_counts_unchanged_chirho:true,witness_sha256_chirho:witnessChirho,d1_file_bytes_chirho:databaseChirho.file_size,
  active_deployment_chirho:deploymentChirho.deployments[0]!.id,active_versions_chirho:deploymentChirho.deployments[0]!.versions,
  scope_chirho:'Complete page scans; new text remains machine drafts. No certification, model, reviewer-event or station changes.',
  limitations_chirho:['OCR is unverified, including vol-5 legacy-font text.','186 zero-width draft fragments have no confirmable box.','21 pre-existing vol-5 pilot pages (50-70) have scans and stored French text but no reader scanlines; preserved unchanged.','Biblical-reference coverage and printed-folio mapping are not completed by uploading scans.']};
const outputChirho=join(rootChirho,'final-proof-chirho.json');await Bun.write(outputChirho,JSON.stringify(receiptChirho,null,2)+'\n');chmodSync(outputChirho,0o600);console.log(JSON.stringify(receiptChirho));
