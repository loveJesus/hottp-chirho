// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { Database } from 'bun:sqlite';
import { join } from 'node:path';
import { mkdirSync, chmodSync } from 'node:fs';
import { INTAKE_DB_PATH_CHIRHO, INTAKE_ROOT_DIR_CHIRHO } from '../../intake-config-chirho.ts';
import { sourcePagesChirho, payloadChirho, type PagePayloadChirho } from '../source-chirho.ts';
import { digestChirho } from '../verify-chirho.ts';
import { loadManifestChirho as legacyManifestChirho } from '../legacy-chirho/prepare-chirho.ts';
export const FONT_ROOT_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO, 'font-decode-chirho');
export const FONT_INPUT_CHIRHO = join(FONT_ROOT_CHIRHO, 'source-pages-chirho.jsonl');
export const FONT_OUTPUT_CHIRHO = join(FONT_ROOT_CHIRHO, 'decoded-pages-chirho.jsonl');
export interface FontSourceChirho {
    payload_chirho: PagePayloadChirho;
    payload_sha256_chirho: string;
    image_sha256_chirho: string;
    image_width_chirho: number;
    image_height_chirho: number;
}
// Workflow: font-drafts-workflow-chirho.md. Reuse the frozen source projection,
// not a new parser or a mutable hosted guess. Pages 148–152 remain excluded.
async function sourceFontPagesChirho(): Promise<void> {
    if (await Bun.file(FONT_INPUT_CHIRHO).exists())
        throw new Error('Frozen font input already exists');
    mkdirSync(FONT_ROOT_CHIRHO, { recursive: true, mode: 0o700 });
    const dbChirho = new Database(INTAKE_DB_PATH_CHIRHO, { readonly: true });
    const oldChirho = await legacyManifestChirho();
    const priorChirho = await Bun.file(join(INTAKE_ROOT_DIR_CHIRHO, 'publish-chirho/2026-10-30-chirho/manifest-chirho.json')).json();
    const frozenChirho = new Map<string, string>(priorChirho.pages_chirho.map((pageChirho: {
        key_chirho: string;
        sha256_chirho: string;
    }) => [pageChirho.key_chirho, pageChirho.sha256_chirho]));
    const sourcesChirho = new Map<number, FontSourceChirho>();
    for (const pageChirho of sourcePagesChirho(dbChirho).filter(pageChirho => pageChirho.volume_number_chirho === 5)) {
        const valueChirho = payloadChirho(dbChirho, pageChirho), hashChirho = digestChirho(valueChirho);
        if (frozenChirho.get(`5:${pageChirho.page_number_chirho}`) !== hashChirho)
            throw new Error('Original source payload changed');
        sourcesChirho.set(pageChirho.page_number_chirho, { payload_chirho: valueChirho, payload_sha256_chirho: hashChirho, image_sha256_chirho: pageChirho.image_sha256_chirho, image_width_chirho: pageChirho.image_width_chirho, image_height_chirho: pageChirho.image_height_chirho });
    }
    dbChirho.close();
    for (const entryChirho of oldChirho.entries_chirho)
        sourcesChirho.set(entryChirho.payload_chirho.page_chirho[1], { payload_chirho: entryChirho.payload_chirho, payload_sha256_chirho: entryChirho.payload_sha256_chirho, image_sha256_chirho: entryChirho.image_sha256_chirho, image_width_chirho: entryChirho.image_width_chirho, image_height_chirho: entryChirho.image_height_chirho });
    if (sourcesChirho.size !== 1004 || [...sourcesChirho.keys()].some(pageChirho => pageChirho >= 148 && pageChirho <= 152))
        throw new Error('Font page scope differs');
    const writerChirho = Bun.file(FONT_INPUT_CHIRHO).writer();
    for (const [, valueChirho] of [...sourcesChirho].sort((aChirho, bChirho) => aChirho[0] - bChirho[0]))
        writerChirho.write(JSON.stringify(valueChirho) + '\n');
    await writerChirho.end();
    chmodSync(FONT_INPUT_CHIRHO, 0o600);
    console.log(JSON.stringify({ pages_chirho: sourcesChirho.size, source_chirho: FONT_INPUT_CHIRHO }));
}
if (import.meta.main)
    await sourceFontPagesChirho();
