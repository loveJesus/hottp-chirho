// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { createReadStream, chmodSync } from 'node:fs';
import type { StatementChirho } from '../source-chirho.ts';
import { queryChirho } from '../cloud-chirho.ts';
import { digestChirho } from '../verify-chirho.ts';
import { savePrivateChirho, witnessHashChirho } from '../legacy-chirho/prepare-chirho.ts';
import { FONT_ROOT_CHIRHO, FONT_INPUT_CHIRHO, FONT_OUTPUT_CHIRHO, type FontSourceChirho } from './source-chirho.ts';
import { fontStatementsChirho, type FontEntryChirho, type FontBeforeChirho, type FontRowChirho } from './model-chirho.ts';
export const FONT_MANIFEST_CHIRHO = join(FONT_ROOT_CHIRHO, 'manifest-chirho.json');
export const FONT_ENTRIES_CHIRHO = join(FONT_ROOT_CHIRHO, 'entries-chirho.jsonl');
export interface DecodedPageChirho {
    page_chirho: number;
    pdf_sha256_chirho: string;
    payload_sha256_chirho: string;
    proposals_chirho: {
        line_index_chirho: number;
        segment_index_chirho: number;
        text_chirho: string;
        glyph_seqs_chirho: number[];
        script_chirho: string;
    }[];
    held_chirho: Record<string, number>;
}
export interface FontManifestChirho {
    created_at_chirho: string;
    entries_sha256_chirho: string;
    source_sha256_chirho: string;
    decode_sha256_chirho: string;
    witness_sha256_chirho: string;
    pages_chirho: number;
    candidate_pages_chirho: number;
    targets_chirho: number;
    script_counts_chirho: Record<string, number>;
    held_chirho: Record<string, number>;
    baseline_counts_chirho: FontRowChirho[];
    sha256_chirho: string;
}
export async function readLinesChirho<TChirho>(pathChirho: string): Promise<TChirho[]> {
    const outChirho: TChirho[] = [];
    for await (const lineChirho of createInterface({ input: createReadStream(pathChirho), crlfDelay: Infinity })) {
        if (lineChirho)
            outChirho.push(JSON.parse(lineChirho) as TChirho);
        if (outChirho.length > 1004)
            throw new Error('Font input exceeds volume bound');
    }
    return outChirho;
}
export async function fontCountsChirho(): Promise<FontRowChirho[]> { return (await queryChirho([{ sql: "SELECT 'pages-chirho' AS table_chirho,count(*) AS count_chirho FROM pages_chirho UNION ALL SELECT 'lines-chirho',count(*) FROM scanlines_chirho UNION ALL SELECT 'segments-chirho',count(*) FROM segments_chirho UNION ALL SELECT 'events-chirho',count(*) FROM events_chirho UNION ALL SELECT 'words-chirho',count(*) FROM words_chirho" }, { sql: "SELECT 'shared-events-chirho' AS table_chirho,count(*) AS count_chirho FROM events_chirho WHERE reviewer_chirho='shared-reviewer-chirho'" }])).flatMap(resultChirho => resultChirho.results) as FontRowChirho[]; }
export async function remoteFontPagesChirho(numbersChirho: number[]): Promise<Map<number, FontBeforeChirho>> {
    if (numbersChirho.length < 1 || numbersChirho.length > 8 || numbersChirho.some(numberChirho => !Number.isSafeInteger(numberChirho) || numberChirho < 1 || numberChirho > 1009 || (numberChirho >= 148 && numberChirho <= 152)))
        throw new Error('Out-of-scope font page read');
    const placeholdersChirho = numbersChirho.map(() => '?').join(',');
    const resultChirho = await queryChirho([
        { sql: `SELECT * FROM pages_chirho WHERE volume_number_chirho=5 AND page_number_chirho IN(${placeholdersChirho}) ORDER BY page_number_chirho`, params: numbersChirho },
        { sql: `SELECT l_chirho.*,p_chirho.page_number_chirho AS font_page_chirho FROM pages_chirho p_chirho JOIN scanlines_chirho l_chirho ON l_chirho.page_id_chirho=p_chirho.id_chirho WHERE p_chirho.volume_number_chirho=5 AND p_chirho.page_number_chirho IN(${placeholdersChirho}) ORDER BY p_chirho.page_number_chirho,l_chirho.line_index_chirho`, params: numbersChirho },
        { sql: `SELECT s_chirho.*,p_chirho.page_number_chirho AS font_page_chirho FROM pages_chirho p_chirho JOIN scanlines_chirho l_chirho ON l_chirho.page_id_chirho=p_chirho.id_chirho JOIN segments_chirho s_chirho ON s_chirho.scanline_id_chirho=l_chirho.id_chirho WHERE p_chirho.volume_number_chirho=5 AND p_chirho.page_number_chirho IN(${placeholdersChirho}) ORDER BY p_chirho.page_number_chirho,l_chirho.line_index_chirho,s_chirho.segment_index_chirho`, params: numbersChirho }
    ]);
    const outChirho = new Map<number, FontBeforeChirho>();
    for (const rowChirho of resultChirho[0]!.results as FontRowChirho[])
        outChirho.set(Number(rowChirho.page_number_chirho), { page_chirho: rowChirho, lines_chirho: [], segments_chirho: [] });
    for (const [indexChirho, keyChirho] of [[1, 'lines_chirho'], [2, 'segments_chirho']] as const)
        for (const rowChirho of resultChirho[indexChirho]!.results) {
            const { font_page_chirho: numberChirho, ...valueChirho } = rowChirho;
            const pageChirho = outChirho.get(Number(numberChirho));
            if (!pageChirho)
                throw new Error('Missing font page parent');
            pageChirho[keyChirho].push(valueChirho as FontRowChirho);
        }
    if (outChirho.size !== numbersChirho.length)
        throw new Error('Missing font source page');
    return outChirho;
}
function sourceMatchChirho(sourceChirho: FontSourceChirho, beforeChirho: FontBeforeChirho): void {
    const payloadChirho = sourceChirho.payload_chirho, linesChirho = new Map(beforeChirho.lines_chirho.map(lineChirho => [lineChirho.id_chirho, lineChirho.line_index_chirho]));
    const remoteLinesChirho = beforeChirho.lines_chirho.map(lineChirho => [lineChirho.line_index_chirho, lineChirho.x_min_chirho, lineChirho.y_min_chirho, lineChirho.width_chirho, lineChirho.height_chirho, lineChirho.pdftotext_chirho, lineChirho.segment_count_chirho]);
    const remoteSegmentsChirho = beforeChirho.segments_chirho.map(segmentChirho => [linesChirho.get(segmentChirho.scanline_id_chirho), segmentChirho.segment_index_chirho, segmentChirho.word_start_index_chirho, segmentChirho.word_end_index_chirho, segmentChirho.x_min_px_chirho, segmentChirho.width_px_chirho, segmentChirho.pdftotext_chirho, segmentChirho.script_type_chirho]);
    if (beforeChirho.page_chirho.image_path_chirho !== payloadChirho.page_chirho[3] || digestChirho(remoteLinesChirho) !== digestChirho(payloadChirho.lines_chirho) || digestChirho(remoteSegmentsChirho) !== digestChirho(payloadChirho.segments_chirho))
        throw new Error(`Hosted source differs 5:${payloadChirho.page_chirho[1]}`);
}
// Workflow: font-drafts-workflow-chirho.md. Read-only preparation. Full raw
// rows are retained privately so verification covers every field, not counts.
async function prepareFontsChirho(): Promise<void> {
    if (await Bun.file(FONT_MANIFEST_CHIRHO).exists() || await Bun.file(FONT_ENTRIES_CHIRHO).exists())
        throw new Error('Frozen font manifest already exists');
    const sourcesChirho = await readLinesChirho<FontSourceChirho>(FONT_INPUT_CHIRHO), decodedChirho = await readLinesChirho<DecodedPageChirho>(FONT_OUTPUT_CHIRHO);
    if (sourcesChirho.length !== 1004 || decodedChirho.length !== 1004)
        throw new Error('Incomplete font dry run');
    const heldChirho: Record<string, number> = {}, scriptsChirho: Record<string, number> = {};
    let targetsChirho = 0, candidatePagesChirho = 0;
    const writerChirho = Bun.file(FONT_ENTRIES_CHIRHO).writer();
    try {
        for (let offsetChirho = 0; offsetChirho < sourcesChirho.length; offsetChirho += 8) {
            const windowChirho = sourcesChirho.slice(offsetChirho, offsetChirho + 8), remoteChirho = await remoteFontPagesChirho(windowChirho.map(sourceChirho => sourceChirho.payload_chirho.page_chirho[1]));
            const guardsChirho: StatementChirho[] = [];
            for (let indexChirho = 0; indexChirho < windowChirho.length; indexChirho++) {
                const sourceChirho = windowChirho[indexChirho]!, decodeChirho = decodedChirho[offsetChirho + indexChirho]!, numberChirho = sourceChirho.payload_chirho.page_chirho[1], beforeChirho = remoteChirho.get(numberChirho)!;
                if (decodeChirho.page_chirho !== numberChirho || decodeChirho.payload_sha256_chirho !== digestChirho(sourceChirho.payload_chirho) || sourceChirho.payload_sha256_chirho !== decodeChirho.payload_sha256_chirho)
                    throw new Error('Font source/decode order or hash differs');
                sourceMatchChirho(sourceChirho, beforeChirho);
                const lineIdsChirho = new Map(beforeChirho.lines_chirho.map(lineChirho => [lineChirho.line_index_chirho, lineChirho.id_chirho]));
                const segmentsChirho = new Map(beforeChirho.segments_chirho.map(segmentChirho => [`${segmentChirho.scanline_id_chirho}:${segmentChirho.segment_index_chirho}`, segmentChirho]));
                const entryChirho: FontEntryChirho = { page_number_chirho: numberChirho, before_chirho: beforeChirho, targets_chirho: decodeChirho.proposals_chirho.map(proposalChirho => { const segmentChirho = segmentsChirho.get(`${lineIdsChirho.get(proposalChirho.line_index_chirho)}:${proposalChirho.segment_index_chirho}`); if (!segmentChirho || segmentChirho.script_type_chirho !== proposalChirho.script_chirho)
                        throw new Error('Font proposal identity differs'); return { id_chirho: Number(segmentChirho.id_chirho), text_chirho: proposalChirho.text_chirho, glyph_seqs_chirho: proposalChirho.glyph_seqs_chirho }; }), payload_sha256_chirho: sourceChirho.payload_sha256_chirho, image_sha256_chirho: sourceChirho.image_sha256_chirho, pdf_sha256_chirho: decodeChirho.pdf_sha256_chirho, held_chirho: decodeChirho.held_chirho };
                if (entryChirho.targets_chirho.length) {
                    const statementsChirho = fontStatementsChirho(entryChirho, '0'.repeat(64));
                    guardsChirho.push(statementsChirho[0]!);
                    candidatePagesChirho++;
                    targetsChirho += entryChirho.targets_chirho.length;
                    for (const proposalChirho of decodeChirho.proposals_chirho)
                        scriptsChirho[proposalChirho.script_chirho] = (scriptsChirho[proposalChirho.script_chirho] ?? 0) + 1;
                }
                for (const [reasonChirho, countChirho] of Object.entries(decodeChirho.held_chirho))
                    heldChirho[reasonChirho] = (heldChirho[reasonChirho] ?? 0) + countChirho;
                writerChirho.write(JSON.stringify(entryChirho) + '\n');
            }
            if (guardsChirho.length) await queryChirho(guardsChirho);
            if (offsetChirho % 80 === 0)
                console.log(`Prepared ${offsetChirho + windowChirho.length}/1004 font pages`);
        }
    }
    finally {
        await writerChirho.end();
        chmodSync(FONT_ENTRIES_CHIRHO, 0o600);
    }
    const unsignedChirho = { created_at_chirho: new Date().toISOString(), entries_sha256_chirho: new Bun.CryptoHasher('sha256').update(await Bun.file(FONT_ENTRIES_CHIRHO).arrayBuffer()).digest('hex'), source_sha256_chirho: new Bun.CryptoHasher('sha256').update(await Bun.file(FONT_INPUT_CHIRHO).arrayBuffer()).digest('hex'), decode_sha256_chirho: new Bun.CryptoHasher('sha256').update(await Bun.file(FONT_OUTPUT_CHIRHO).arrayBuffer()).digest('hex'), witness_sha256_chirho: await witnessHashChirho(), pages_chirho: 1004, candidate_pages_chirho: candidatePagesChirho, targets_chirho: targetsChirho, script_counts_chirho: scriptsChirho, held_chirho: heldChirho, baseline_counts_chirho: await fontCountsChirho() };
    await savePrivateChirho(FONT_MANIFEST_CHIRHO, { ...unsignedChirho, sha256_chirho: digestChirho(unsignedChirho) });
    console.log(JSON.stringify(unsignedChirho));
}
if (import.meta.main)
    await prepareFontsChirho();
