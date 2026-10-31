// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { join } from 'node:path';
import { INTAKE_ROOT_DIR_CHIRHO } from '../../../intake-config-chirho.ts';
import { queryChirho } from '../../cloud-chirho.ts';
import { digestChirho } from '../../verify-chirho.ts';
import { savePrivateChirho, witnessHashChirho } from '../../legacy-chirho/prepare-chirho.ts';
import { loadFontManifestChirho, sameFontStateChirho } from '../apply-chirho.ts';
import { readLinesChirho, remoteFontPagesChirho, fontCountsChirho, type DecodedPageChirho } from '../prepare-chirho.ts';
import { expectedFontStateChirho, type FontRowChirho } from '../model-chirho.ts';
import { greekStatementsChirho, greekEntryChirho, type GreekPatchChirho, type GreekContextChirho } from './model-chirho.ts';
export const GREEK_ROOT_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO, 'greek-completion-chirho');
export const GREEK_DECODE_CHIRHO = join(GREEK_ROOT_CHIRHO, 'decoded-pages-chirho.jsonl');
export const GREEK_MANIFEST_CHIRHO = join(GREEK_ROOT_CHIRHO, 'manifest-chirho.json');
export interface GreekManifestChirho {
    created_at_chirho: string;
    parent_manifest_sha256_chirho: string;
    decode_sha256_chirho: string;
    witness_sha256_chirho: string;
    patches_chirho: GreekPatchChirho[];
    candidate_pages_chirho: number;
    new_drafts_chirho: number;
    preserved_drafts_chirho: number;
    held_chirho: Record<string, number>;
    baseline_counts_chirho: FontRowChirho[];
    sha256_chirho: string;
}
export async function fileHashGreekChirho(pathChirho: string): Promise<string> { return new Bun.CryptoHasher('sha256').update(await Bun.file(pathChirho).arrayBuffer()).digest('hex'); }
export async function historiesGreekChirho(pageIdsChirho: number[]): Promise<Map<number, FontRowChirho[]>> {
    if (!pageIdsChirho.length || pageIdsChirho.length > 8 || pageIdsChirho.some(idChirho => !Number.isSafeInteger(idChirho) || idChirho < 1))
        throw new Error('Unbounded Greek history read');
    const outChirho = new Map(pageIdsChirho.map(idChirho => [idChirho, [] as FontRowChirho[]]));
    const rowsChirho = (await queryChirho([{ sql: `SELECT * FROM events_chirho WHERE page_id_chirho IN(${pageIdsChirho.map(() => '?').join(',')}) ORDER BY page_id_chirho,seq_chirho`, params: pageIdsChirho }]))[0]!.results as FontRowChirho[];
    for (const rowChirho of rowsChirho)
        outChirho.get(Number(rowChirho.page_id_chirho))!.push(rowChirho);
    return outChirho;
}
export async function loadGreekManifestChirho() {
    const valueChirho = await Bun.file(GREEK_MANIFEST_CHIRHO).json() as GreekManifestChirho, { sha256_chirho: hashChirho, ...unsignedChirho } = valueChirho;
    const parentChirho = await loadFontManifestChirho();
    if (digestChirho(unsignedChirho) !== hashChirho || valueChirho.parent_manifest_sha256_chirho !== parentChirho.manifest_chirho.sha256_chirho || valueChirho.decode_sha256_chirho !== await fileHashGreekChirho(GREEK_DECODE_CHIRHO) || valueChirho.witness_sha256_chirho !== await witnessHashChirho() || valueChirho.patches_chirho.length !== 1004 || new Set(valueChirho.patches_chirho.map(patchChirho => patchChirho.page_number_chirho)).size !== 1004)
        throw new Error('Greek manifest or parent integrity differs');
    if (valueChirho.patches_chirho.reduce((sumChirho, patchChirho) => sumChirho + patchChirho.targets_chirho.length, 0) !== valueChirho.new_drafts_chirho || valueChirho.patches_chirho.filter(patchChirho => patchChirho.targets_chirho.length).length !== valueChirho.candidate_pages_chirho)
        throw new Error('Greek target counts differ');
    const contextsChirho = new Map<number, GreekContextChirho>(parentChirho.entries_chirho.map(entryChirho => [entryChirho.page_number_chirho, { parent_chirho: entryChirho, parent_manifest_sha256_chirho: valueChirho.parent_manifest_sha256_chirho }]));
    for (const patchChirho of valueChirho.patches_chirho) {
        const contextChirho = contextsChirho.get(patchChirho.page_number_chirho);
        if (!contextChirho)
            throw new Error('Out-of-scope Greek page');
        if (patchChirho.targets_chirho.length)
            greekStatementsChirho(patchChirho, contextChirho, hashChirho);
        else
            greekEntryChirho(patchChirho, contextChirho);
    }
    return { manifestChirho: valueChirho, contextsChirho };
}
// Workflow: font-drafts-workflow-chirho.md. Compact child manifest references
// its immutable parent; do not duplicate the growing full-row corpus snapshot.
async function prepareGreekChirho(): Promise<void> {
    if (await Bun.file(GREEK_MANIFEST_CHIRHO).exists())
        throw new Error('Frozen Greek manifest already exists');
    const { manifest_chirho: parentManifestChirho, entries_chirho: parentsChirho } = await loadFontManifestChirho();
    const decodedChirho = await readLinesChirho<DecodedPageChirho>(GREEK_DECODE_CHIRHO);
    if (decodedChirho.length !== 1004)
        throw new Error('Incomplete Greek decode');
    const patchesChirho: GreekPatchChirho[] = [], heldChirho: Record<string, number> = {};
    let newChirho = 0, pagesChirho = 0, preservedChirho = 0;
    for (let offsetChirho = 0; offsetChirho < parentsChirho.length; offsetChirho += 8) {
        const windowChirho = parentsChirho.slice(offsetChirho, offsetChirho + 8), storedChirho = await remoteFontPagesChirho(windowChirho.map(parentChirho => parentChirho.page_number_chirho));
        const historyChirho = await historiesGreekChirho(windowChirho.map(parentChirho => Number(parentChirho.before_chirho.page_chirho.id_chirho)));
        const guardsChirho = [];
        for (let indexChirho = 0; indexChirho < windowChirho.length; indexChirho++) {
            const parentChirho = windowChirho[indexChirho]!, decodeChirho = decodedChirho[offsetChirho + indexChirho]!, expectedChirho = expectedFontStateChirho(parentChirho);
            if (decodeChirho.page_chirho !== parentChirho.page_number_chirho || decodeChirho.payload_sha256_chirho !== parentChirho.payload_sha256_chirho || decodeChirho.pdf_sha256_chirho !== parentChirho.pdf_sha256_chirho || !sameFontStateChirho(expectedChirho, storedChirho.get(parentChirho.page_number_chirho)!))
                throw new Error(`Greek parent/source changed 5:${parentChirho.page_number_chirho}; keep reviewed/current data`);
            const lineIdsChirho = new Map(expectedChirho.lines_chirho.map(lineChirho => [lineChirho.line_index_chirho, lineChirho.id_chirho]));
            const segmentsChirho = new Map(expectedChirho.segments_chirho.map(segmentChirho => [`${segmentChirho.scanline_id_chirho}:${segmentChirho.segment_index_chirho}`, segmentChirho]));
            const oldGlyphsChirho = new Set(parentChirho.targets_chirho.flatMap(targetChirho => targetChirho.glyph_seqs_chirho));
            const patchChirho: GreekPatchChirho = { page_number_chirho: parentChirho.page_number_chirho, prior_events_chirho: historyChirho.get(Number(expectedChirho.page_chirho.id_chirho))!, targets_chirho: [] };
            for (const proposalChirho of decodeChirho.proposals_chirho) {
                const segmentChirho = segmentsChirho.get(`${lineIdsChirho.get(proposalChirho.line_index_chirho)}:${proposalChirho.segment_index_chirho}`);
                if (!segmentChirho)
                    throw new Error('Greek proposal lost its source identity');
                if (segmentChirho.ocr_text_chirho !== null) {
                    if (segmentChirho.ocr_text_chirho !== proposalChirho.text_chirho)
                        throw new Error('New mapping disagrees with a published draft; needs a separate correction, not replacement');
                    preservedChirho++;
                    continue;
                }
                if (proposalChirho.script_chirho !== 'greek-chirho')
                    throw new Error('Unexpected non-Greek addition');
                if (proposalChirho.glyph_seqs_chirho.some(seqChirho => oldGlyphsChirho.has(seqChirho))) {
                    heldChirho['prior-glyph-overlap-chirho'] = (heldChirho['prior-glyph-overlap-chirho'] ?? 0) + 1;
                    continue;
                }
                patchChirho.targets_chirho.push({ id_chirho: Number(segmentChirho.id_chirho), text_chirho: proposalChirho.text_chirho, glyph_seqs_chirho: proposalChirho.glyph_seqs_chirho });
            }
            const contextChirho = { parent_chirho: parentChirho, parent_manifest_sha256_chirho: parentManifestChirho.sha256_chirho };
            if (patchChirho.targets_chirho.length) {
                guardsChirho.push(greekStatementsChirho(patchChirho, contextChirho, '0'.repeat(64))[0]!);
                pagesChirho++;
                newChirho += patchChirho.targets_chirho.length;
            }
            else
                greekEntryChirho(patchChirho, contextChirho);
            patchesChirho.push(patchChirho);
            for (const [reasonChirho, countChirho] of Object.entries(decodeChirho.held_chirho))
                heldChirho[reasonChirho] = (heldChirho[reasonChirho] ?? 0) + countChirho;
        }
        if (guardsChirho.length) {
            const resultsChirho = await queryChirho(guardsChirho);
            if (resultsChirho.some(resultChirho => resultChirho.meta.rows_written !== 0))
                throw new Error('Unexpected write during Greek preparation');
        }
        if (offsetChirho % 80 === 0)
            console.log(`Prepared Greek ${offsetChirho + windowChirho.length}/1004`);
    }
    if (preservedChirho !== parentManifestChirho.targets_chirho)
        throw new Error('Some previously published draft was not reproduced');
    const unsignedChirho = { created_at_chirho: new Date().toISOString(), parent_manifest_sha256_chirho: parentManifestChirho.sha256_chirho, decode_sha256_chirho: await fileHashGreekChirho(GREEK_DECODE_CHIRHO), witness_sha256_chirho: await witnessHashChirho(), patches_chirho: patchesChirho, candidate_pages_chirho: pagesChirho, new_drafts_chirho: newChirho, preserved_drafts_chirho: preservedChirho, held_chirho: heldChirho, baseline_counts_chirho: await fontCountsChirho() };
    await savePrivateChirho(GREEK_MANIFEST_CHIRHO, { ...unsignedChirho, sha256_chirho: digestChirho(unsignedChirho) });
    console.log(JSON.stringify({ manifest_sha256_chirho: digestChirho(unsignedChirho), new_drafts_chirho: newChirho, pages_chirho: pagesChirho, preserved_chirho: preservedChirho, held_chirho: heldChirho }));
}
if (import.meta.main)
    await prepareGreekChirho();
