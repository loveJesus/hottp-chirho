// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { join } from 'node:path';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { r2Chirho, BUCKET_CHIRHO, queryChirho } from '../cloud-chirho.ts';
import { imageKeyChirho } from '../source-chirho.ts';
import { digestChirho, sameStoredRowChirho, verifyExistingChirho } from '../verify-chirho.ts';
import { originalRowsChirho, savePrivateChirho, witnessHashChirho, loadManifestChirho as legacyManifestChirho } from '../legacy-chirho/prepare-chirho.ts';
import { FONT_ROOT_CHIRHO, FONT_INPUT_CHIRHO, FONT_OUTPUT_CHIRHO } from './source-chirho.ts';
import { FONT_MANIFEST_CHIRHO, FONT_ENTRIES_CHIRHO, readLinesChirho, remoteFontPagesChirho, fontCountsChirho, type FontManifestChirho } from './prepare-chirho.ts';
import { fontStatementsChirho, expectedFontStateChirho, fontAuditChirho, FONT_ACTOR_CHIRHO, FONT_EVENT_CHIRHO, type FontEntryChirho, type FontBeforeChirho } from './model-chirho.ts';
export async function loadFontManifestChirho(): Promise<{
    manifest_chirho: FontManifestChirho;
    entries_chirho: FontEntryChirho[];
}> {
    const manifestChirho = await Bun.file(FONT_MANIFEST_CHIRHO).json() as FontManifestChirho;
    const { sha256_chirho: hashChirho, ...unsignedChirho } = manifestChirho;
    if (digestChirho(unsignedChirho) !== hashChirho || manifestChirho.pages_chirho !== 1004 || manifestChirho.witness_sha256_chirho !== await witnessHashChirho())
        throw new Error('Font manifest or protected witness differs');
    for (const [fileChirho, expectedChirho] of [[FONT_ENTRIES_CHIRHO, manifestChirho.entries_sha256_chirho], [FONT_INPUT_CHIRHO, manifestChirho.source_sha256_chirho], [FONT_OUTPUT_CHIRHO, manifestChirho.decode_sha256_chirho]])
        if (new Bun.CryptoHasher('sha256').update(await Bun.file(fileChirho!).arrayBuffer()).digest('hex') !== expectedChirho)
            throw new Error('Frozen font input changed');
    const entriesChirho = await readLinesChirho<FontEntryChirho>(FONT_ENTRIES_CHIRHO);
    if (entriesChirho.length !== 1004 || new Set(entriesChirho.map(entryChirho => entryChirho.page_number_chirho)).size !== 1004 || entriesChirho.reduce((sumChirho, entryChirho) => sumChirho + entryChirho.targets_chirho.length, 0) !== manifestChirho.targets_chirho)
        throw new Error('Incomplete/duplicate font manifest');
    for (const entryChirho of entriesChirho)
        if (entryChirho.targets_chirho.length)
            fontStatementsChirho(entryChirho, hashChirho);
    return { manifest_chirho: manifestChirho, entries_chirho: entriesChirho };
}
export function sameFontStateChirho(expectedChirho: FontBeforeChirho, actualChirho: FontBeforeChirho): boolean {
    return sameStoredRowChirho(expectedChirho.page_chirho, actualChirho.page_chirho) && (['lines_chirho', 'segments_chirho'] as const).every(keyChirho => expectedChirho[keyChirho].length === actualChirho[keyChirho].length && expectedChirho[keyChirho].every((rowChirho, indexChirho) => sameStoredRowChirho(rowChirho, actualChirho[keyChirho][indexChirho]!)));
}
async function auditMatchChirho(entryChirho: FontEntryChirho, manifestHashChirho: string): Promise<boolean> {
    const rowsChirho = (await queryChirho([{ sql: 'SELECT * FROM events_chirho WHERE page_id_chirho=? ORDER BY seq_chirho', params: [Number(entryChirho.before_chirho.page_chirho.id_chirho)] }]))[0]!.results;
    return rowsChirho.length === 1 && rowsChirho[0]!.event_type_chirho === FONT_EVENT_CHIRHO && rowsChirho[0]!.aggregate_type_chirho === 'page-chirho' && rowsChirho[0]!.reviewer_chirho === FONT_ACTOR_CHIRHO && rowsChirho[0]!.word_id_chirho === null && rowsChirho[0]!.scanline_id_chirho === null && rowsChirho[0]!.payload_json_chirho === fontAuditChirho(entryChirho, manifestHashChirho);
}
// Workflow: font-drafts-workflow-chirho.md. Reconcile an uncertain prior call
// by BOTH its exact projection and audit, never by a count or blind retry.
async function applyFontsChirho(): Promise<void> {
    const modeChirho = process.argv[2];
    if (!['apply-chirho', 'verify-chirho'].includes(modeChirho ?? ''))
        throw new Error('Specify apply-chirho or verify-chirho');
    const { manifest_chirho: manifestChirho, entries_chirho: entriesChirho } = await loadFontManifestChirho();
    const originalsChirho = await originalRowsChirho();
    await verifyExistingChirho(originalsChirho);
    const legacyChirho = await legacyManifestChirho(), oldImagesChirho = new Map(legacyChirho.entries_chirho.map(entryChirho => [entryChirho.payload_chirho.page_chirho[1], entryChirho]));
    const clientChirho = r2Chirho();
    let appliedChirho = 0, reconciledChirho = 0, untouchedChirho = 0;
    try {
        for (let offsetChirho = 0; offsetChirho < entriesChirho.length; offsetChirho += 8) {
            const windowChirho = entriesChirho.slice(offsetChirho, offsetChirho + 8), remoteChirho = await remoteFontPagesChirho(windowChirho.map(entryChirho => entryChirho.page_number_chirho));
            const completedChirho = await Promise.allSettled(windowChirho.map(async (entryChirho) => {
                const numberChirho = entryChirho.page_number_chirho, currentChirho = remoteChirho.get(numberChirho)!;
                if (!entryChirho.targets_chirho.length) {
                    if (!sameFontStateChirho(entryChirho.before_chirho, currentChirho))
                        throw new Error(`Untargeted source changed 5:${numberChirho}`);
                    untouchedChirho++;
                    return;
                }
                const headChirho = await clientChirho.send(new HeadObjectCommand({ Bucket: BUCKET_CHIRHO, Key: imageKeyChirho(5, numberChirho) })), oldChirho = oldImagesChirho.get(numberChirho);
                if (oldChirho ? headChirho.ContentLength !== oldChirho.image_bytes_chirho || headChirho.ETag?.replaceAll('"', '') !== oldChirho.image_md5_chirho : headChirho.Metadata?.sha256_chirho !== entryChirho.image_sha256_chirho)
                    throw new Error(`Source scan changed 5:${numberChirho}`);
                const expectedChirho = expectedFontStateChirho(entryChirho);
                if (sameFontStateChirho(expectedChirho, currentChirho)) {
                    if (!await auditMatchChirho(entryChirho, manifestChirho.sha256_chirho))
                        throw new Error(`OCR draft exists without its exact audit 5:${numberChirho}`);
                    reconciledChirho++;
                }
                else if (modeChirho === 'apply-chirho' && sameFontStateChirho(entryChirho.before_chirho, currentChirho)) {
                    await queryChirho(fontStatementsChirho(entryChirho, manifestChirho.sha256_chirho));
                    const afterChirho = (await remoteFontPagesChirho([numberChirho])).get(numberChirho)!;
                    if (!sameFontStateChirho(expectedChirho, afterChirho) || !await auditMatchChirho(entryChirho, manifestChirho.sha256_chirho))
                        throw new Error(`Font readback differs 5:${numberChirho}; reconcile before retry`);
                    appliedChirho++;
                }
                else
                    throw new Error(`Font page missing/changed/reviewed 5:${numberChirho}; do not replace it`);
            }));
            const failuresChirho = completedChirho.filter(resultChirho => resultChirho.status === 'rejected');
            if (failuresChirho.length)
                throw new AggregateError(failuresChirho.map(resultChirho => (resultChirho as PromiseRejectedResult).reason), 'Font page window stopped; all in-flight requests settled. Reconcile before retry.');
            if (offsetChirho % 80 === 0)
                console.log(`Verified ${offsetChirho + windowChirho.length}/1004 font pages (${appliedChirho} applied, ${reconciledChirho} reconciled)`);
        }
    }
    finally {
        clientChirho.destroy();
    }
    const countsChirho = await fontCountsChirho();
    for (const rowChirho of countsChirho) {
        const beforeChirho = manifestChirho.baseline_counts_chirho.find(valueChirho => valueChirho.table_chirho === rowChirho.table_chirho)!;
        if (rowChirho.count_chirho !== Number(beforeChirho.count_chirho) + (rowChirho.table_chirho === 'events-chirho' ? manifestChirho.candidate_pages_chirho : 0))
            throw new Error(`Unexpected font row-count change ${rowChirho.table_chirho}`);
    }
    const receiptChirho = { verified_at_chirho: new Date().toISOString(), manifest_sha256_chirho: manifestChirho.sha256_chirho, pages_verified_chirho: 1004, applied_pages_chirho: appliedChirho, reconciled_pages_chirho: reconciledChirho, untouched_pages_chirho: untouchedChirho, ocr_drafts_chirho: manifestChirho.targets_chirho, script_counts_chirho: manifestChirho.script_counts_chirho, held_chirho: manifestChirho.held_chirho, counts_chirho: countsChirho, original_rows_preserved_chirho: await verifyExistingChirho(originalsChirho), witness_sha256_chirho: await witnessHashChirho(), r2_writes_chirho: 0, human_confirmations_chirho: 0, worker_deploy_chirho: false };
    await savePrivateChirho(join(FONT_ROOT_CHIRHO, `${modeChirho}-receipt-chirho.json`), receiptChirho);
    console.log(JSON.stringify(receiptChirho));
}
if (import.meta.main)
    await applyFontsChirho();
