// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { openLocalD1ReadonlyChirho } from '../../d1-audit-fingerprint-chirho.ts';
import { INTAKE_ROOT_DIR_CHIRHO, INTAKE_DB_PATH_CHIRHO } from '../intake-config-chirho.ts';
import { PROJECT_ROOT_CHIRHO } from '../../config-chirho.ts';
import { sourcePagesChirho, payloadChirho, checkedImageChirho, pageKeyChirho, imageKeyChirho, statementsChirho, sha256Chirho, type StatementChirho } from './source-chirho.ts';
import { r2Chirho, putImageChirho, queryChirho, imageInventoryChirho } from './cloud-chirho.ts';
import { captureExistingChirho, verifyExistingChirho, digestChirho, remotePayloadsChirho, type TableSnapshotChirho } from './verify-chirho.ts';

const OUTPUT_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO, 'publish-chirho', '2026-10-30-chirho');
const MANIFEST_CHIRHO = join(OUTPUT_CHIRHO, 'manifest-chirho.json');
const BASELINE_CHIRHO = join(OUTPUT_CHIRHO, 'existing-rows-chirho.json');
const WITNESS_CHIRHO = join(PROJECT_ROOT_CHIRHO, 'app-chirho/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/49ceeca0eaefb053fcb1e6ce1b9fafdd48db3f7f681331272cb804b7ff40dbee.sqlite');
interface EntryChirho { key_chirho: string; sha256_chirho: string; image_sha256_chirho: string; image_md5_chirho: string; bytes_chirho: number; lines_chirho: number; segments_chirho: number }
interface ManifestChirho { created_at_chirho: string; witness_sha256_chirho: string; baseline_sha256_chirho: string; pages_chirho: EntryChirho[] }
async function saveChirho(pathChirho: string, valueChirho: unknown): Promise<void> {
  await Bun.write(pathChirho, JSON.stringify(valueChirho, null, 2) + '\n'); chmodSync(pathChirho, 0o600);
}
async function witnessHashChirho(): Promise<string> { return sha256Chirho(new Uint8Array(await Bun.file(WITNESS_CHIRHO).arrayBuffer())); }
const dbChirho = openLocalD1ReadonlyChirho(INTAKE_DB_PATH_CHIRHO);
const pagesChirho = sourcePagesChirho(dbChirho);
const commandChirho = process.argv[2];
mkdirSync(OUTPUT_CHIRHO, {recursive: true, mode: 0o700});

// Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-publish-workflow-chirho.md.
if (commandChirho === 'prepare-chirho') {
  if (await Bun.file(MANIFEST_CHIRHO).exists() || await Bun.file(BASELINE_CHIRHO).exists()) throw new Error('Baseline exists; never replace the recovery record');
  const baselineChirho = await captureExistingChirho();
  const existingPagesChirho = baselineChirho.find(tableChirho => tableChirho.table_chirho === 'pages_chirho')!.rows_chirho;
  const existingKeysChirho = new Set(existingPagesChirho.map(rowChirho => `${rowChirho.volume_number_chirho}:${rowChirho.page_number_chirho}`));
  if (pagesChirho.some(pageChirho => existingKeysChirho.has(pageKeyChirho(pageChirho)))) throw new Error('Target overlaps existing production page; resolve before creating a manifest');
  const entriesChirho: EntryChirho[] = [];
  for (let offsetChirho = 0; offsetChirho < pagesChirho.length; offsetChirho += 8) {
    const chunkChirho = await Promise.all(pagesChirho.slice(offsetChirho, offsetChirho + 8).map(async pageChirho => {
      const payloadValueChirho = payloadChirho(dbChirho, pageChirho);
      const imageChirho = await checkedImageChirho(INTAKE_ROOT_DIR_CHIRHO, pageChirho);
      return {key_chirho: pageKeyChirho(pageChirho), sha256_chirho: digestChirho(payloadValueChirho), image_sha256_chirho: pageChirho.image_sha256_chirho,
        image_md5_chirho: createHash('md5').update(imageChirho).digest('hex'), bytes_chirho: imageChirho.byteLength, lines_chirho: payloadValueChirho.lines_chirho.length, segments_chirho: payloadValueChirho.segments_chirho.length};
    }));
    entriesChirho.push(...chunkChirho);
    if (offsetChirho % 400 === 0) console.log(`Checked ${entriesChirho.length}/${pagesChirho.length} source pages`);
  }
  await saveChirho(BASELINE_CHIRHO, baselineChirho);
  const manifestChirho: ManifestChirho = {created_at_chirho: new Date().toISOString(), witness_sha256_chirho: await witnessHashChirho(), baseline_sha256_chirho: digestChirho(baselineChirho), pages_chirho: entriesChirho};
  await saveChirho(MANIFEST_CHIRHO, manifestChirho);
  console.log(JSON.stringify({manifest_chirho: MANIFEST_CHIRHO, sha256_chirho: digestChirho(manifestChirho), existing_pages_chirho: existingPagesChirho.length, new_pages_chirho: entriesChirho.length,
    lines_chirho: entriesChirho.reduce((sumChirho, entryChirho) => sumChirho + entryChirho.lines_chirho, 0), segments_chirho: entriesChirho.reduce((sumChirho, entryChirho) => sumChirho + entryChirho.segments_chirho, 0), bytes_chirho: entriesChirho.reduce((sumChirho, entryChirho) => sumChirho + entryChirho.bytes_chirho, 0)}));
} else if (commandChirho === 'apply-chirho' || commandChirho === 'verify-chirho') {
  const volumeChirho = Number(process.argv[3]);
  if (!Number.isInteger(volumeChirho) || volumeChirho < 1 || volumeChirho > 5) throw new Error('Specify one volume 1..5');
  const manifestChirho = await Bun.file(MANIFEST_CHIRHO).json() as ManifestChirho;
  const baselineChirho = await Bun.file(BASELINE_CHIRHO).json() as TableSnapshotChirho[];
  if (manifestChirho.baseline_sha256_chirho !== digestChirho(baselineChirho) || manifestChirho.witness_sha256_chirho !== await witnessHashChirho()) throw new Error('Recovery record or protected local witness changed');
  await verifyExistingChirho(baselineChirho);
  const entriesChirho = new Map(manifestChirho.pages_chirho.map(entryChirho => [entryChirho.key_chirho, entryChirho]));
  const selectedChirho = pagesChirho.filter(pageChirho => pageChirho.volume_number_chirho === volumeChirho);
  const cloudChirho = r2Chirho();
  const existingChirho = new Set((await queryChirho([{sql: 'SELECT page_number_chirho FROM pages_chirho WHERE volume_number_chirho=?', params: [volumeChirho]}]))[0]!.results.map(rowChirho => Number(rowChirho.page_number_chirho)));
  let insertedChirho = 0, resumedChirho = 0;
  for (let offsetChirho = 0; offsetChirho < selectedChirho.length; offsetChirho += 8) {
    const chunkChirho = selectedChirho.slice(offsetChirho, offsetChirho + 8);
    const storedExistingChirho = await remotePayloadsChirho(volumeChirho, chunkChirho.filter(pageChirho => existingChirho.has(pageChirho.page_number_chirho)).map(pageChirho => pageChirho.page_number_chirho));
    const batchChirho: StatementChirho[] = [];
    await Promise.all(chunkChirho.map(async pageChirho => {
      const expectedChirho = entriesChirho.get(pageKeyChirho(pageChirho));
      const valueChirho = payloadChirho(dbChirho, pageChirho);
      if (!expectedChirho || expectedChirho.sha256_chirho !== digestChirho(valueChirho) || expectedChirho.image_sha256_chirho !== pageChirho.image_sha256_chirho) throw new Error('Source differs from dry-run manifest');
      if (existingChirho.has(pageChirho.page_number_chirho)) {
        const storedChirho = storedExistingChirho.get(pageChirho.page_number_chirho);
        if (digestChirho(storedChirho) !== expectedChirho.sha256_chirho) throw new Error(`Existing page differs: ${pageKeyChirho(pageChirho)}; no retry/overwrite allowed`);
        resumedChirho++;
      } else {
        if (commandChirho === 'verify-chirho') throw new Error(`Page missing: ${pageKeyChirho(pageChirho)}`);
        const imageChirho = await checkedImageChirho(INTAKE_ROOT_DIR_CHIRHO, pageChirho);
        await putImageChirho(cloudChirho, imageKeyChirho(volumeChirho, pageChirho.page_number_chirho), imageChirho, pageChirho.image_sha256_chirho);
        batchChirho.push(...statementsChirho(valueChirho));
      }
    }));
    if (batchChirho.length) {
      if (Buffer.byteLength(JSON.stringify(batchChirho)) > 2 * 1024 * 1024) throw new Error('D1 request exceeds bounded batch size');
      // No automatic retry: if the response is lost, rerun this command. It
      // reconciles committed complete pages before sending any new INSERT.
      await queryChirho(batchChirho);
      insertedChirho += batchChirho.length / 3;
      const storedNewChirho = await remotePayloadsChirho(volumeChirho, chunkChirho.filter(pageChirho => !existingChirho.has(pageChirho.page_number_chirho)).map(pageChirho => pageChirho.page_number_chirho));
      for (const pageChirho of chunkChirho) {
        if (!existingChirho.has(pageChirho.page_number_chirho)) {
          const storedChirho = storedNewChirho.get(pageChirho.page_number_chirho);
          if (digestChirho(storedChirho) !== entriesChirho.get(pageKeyChirho(pageChirho))!.sha256_chirho) throw new Error(`Post-write verification failed ${pageKeyChirho(pageChirho)}`);
        }
      }
    }
    if (offsetChirho % 80 === 0 || offsetChirho + 8 >= selectedChirho.length) console.log(`Vol ${volumeChirho}: ${Math.min(offsetChirho + 8, selectedChirho.length)}/${selectedChirho.length}; inserted ${insertedChirho}, reconciled ${resumedChirho}`);
  }
  const inventoryChirho = await imageInventoryChirho(cloudChirho, volumeChirho);
  for (const pageChirho of selectedChirho) {
    const expectedChirho = entriesChirho.get(pageKeyChirho(pageChirho))!;
    const objectChirho = inventoryChirho.get(imageKeyChirho(volumeChirho, pageChirho.page_number_chirho));
    if (objectChirho?.bytes_chirho !== expectedChirho.bytes_chirho || objectChirho.etag_chirho.replaceAll('"','') !== expectedChirho.image_md5_chirho) throw new Error(`Missing/different remote image ${pageKeyChirho(pageChirho)}`);
  }
  const protectedChirho = await verifyExistingChirho(baselineChirho);
  const countsChirho = (await queryChirho([{sql: `SELECT p.volume_number_chirho,count(DISTINCT p.id_chirho) AS pages_chirho,count(DISTINCT l.id_chirho) AS lines_chirho,count(s.id_chirho) AS segments_chirho
    FROM pages_chirho p LEFT JOIN scanlines_chirho l ON l.page_id_chirho=p.id_chirho LEFT JOIN segments_chirho s ON s.scanline_id_chirho=l.id_chirho WHERE p.volume_number_chirho=? GROUP BY p.volume_number_chirho`, params: [volumeChirho]}]))[0]!.results;
  const receiptChirho = {verified_at_chirho: new Date().toISOString(), volume_chirho: volumeChirho, manifest_sha256_chirho: digestChirho(manifestChirho), source_pages_verified_chirho: selectedChirho.length,
    inserted_pages_chirho: insertedChirho, reconciled_pages_chirho: resumedChirho, source_rows_and_trust_fields_verified_chirho: true, image_hashes_verified_chirho: selectedChirho.length,
    counts_chirho: countsChirho, protected_tables_chirho: protectedChirho, witness_sha256_chirho: await witnessHashChirho()};
  await saveChirho(join(OUTPUT_CHIRHO, `volume-${volumeChirho}-${commandChirho}.json`), receiptChirho);
  console.log(JSON.stringify(receiptChirho));
  cloudChirho.destroy();
} else throw new Error('Usage: bun run-chirho.ts prepare-chirho | apply-chirho VOLUME | verify-chirho VOLUME');
dbChirho.close();
