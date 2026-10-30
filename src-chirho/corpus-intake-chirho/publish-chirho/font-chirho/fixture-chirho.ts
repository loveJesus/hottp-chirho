// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { Database } from 'bun:sqlite';
import { join, dirname } from 'node:path';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { PROJECT_ROOT_CHIRHO } from '../../../config-chirho.ts';
import { statementsChirho, imageKeyChirho } from '../source-chirho.ts';
import { legacyStatementsChirho } from '../legacy-chirho/model-chirho.ts';
import { loadManifestChirho as legacyManifestChirho, LEGACY_ROOT_CHIRHO, witnessHashChirho, savePrivateChirho } from '../legacy-chirho/prepare-chirho.ts';
import { FONT_INPUT_CHIRHO, type FontSourceChirho } from './source-chirho.ts';
import { readLinesChirho } from './prepare-chirho.ts';
import { loadFontManifestChirho } from './apply-chirho.ts';
import { fontStatementsChirho, type FontEntryChirho, type FontRowChirho } from './model-chirho.ts';
const modeChirho = process.argv[2], stateChirho = process.argv[3];
if (!['setup-chirho', 'decode-chirho'].includes(modeChirho ?? '') || !stateChirho || !/^\/private\/tmp\/hottp-font-reader-chirho-[A-Za-z0-9]+\/state\/v3$/.test(stateChirho))
    throw new Error('Owned disposable font-reader fixture path required');
const canonicalRootChirho = process.env.HOTTP_CANONICAL_ROOT_CHIRHO ?? PROJECT_ROOT_CHIRHO;
const relativeChirho = 'd1/miniflare-D1DatabaseObject/49ceeca0eaefb053fcb1e6ce1b9fafdd48db3f7f681331272cb804b7ff40dbee.sqlite';
const sourceChirho = join(canonicalRootChirho, 'app-chirho/.wrangler/state/v3', relativeChirho), copyChirho = join(stateChirho, relativeChirho), fixtureChirho = join(dirname(dirname(stateChirho)), 'font-local-fixture-chirho.json');
const beforeChirho = await witnessHashChirho();
if (modeChirho === 'setup-chirho') {
    if (await Bun.file(copyChirho).exists())
        throw new Error('Fixture already exists');
    mkdirSync(dirname(copyChirho), { recursive: true });
    copyFileSync(sourceChirho, copyChirho);
    if (statSync(sourceChirho).ino === statSync(copyChirho).ino)
        throw new Error('Fixture is not a physical copy');
    const { manifest_chirho: manifestChirho, entries_chirho: entriesChirho } = await loadFontManifestChirho(), sourcesChirho = await readLinesChirho<FontSourceChirho>(FONT_INPUT_CHIRHO), legacyChirho = await legacyManifestChirho(), dbChirho = new Database(copyChirho);
    const fixtureEntriesChirho: FontEntryChirho[] = [];
    dbChirho.exec('PRAGMA foreign_keys=ON');
    for (const numberChirho of [56, 500]) {
        const valueChirho = sourcesChirho.find(valueChirho => valueChirho.payload_chirho.page_chirho[1] === numberChirho)!, legacyEntryChirho = legacyChirho.entries_chirho.find(valueChirho => valueChirho.payload_chirho.page_chirho[1] === numberChirho);
        const batchChirho = legacyEntryChirho ? legacyStatementsChirho(legacyEntryChirho) : statementsChirho(valueChirho.payload_chirho);
        dbChirho.transaction(() => { for (const statementChirho of batchChirho)
            dbChirho.query(statementChirho.sql).run(...(statementChirho.params ?? [])); })();
        const pageChirho = dbChirho.query('SELECT * FROM pages_chirho WHERE volume_number_chirho=5 AND page_number_chirho=?').get(numberChirho) as FontRowChirho;
        const linesChirho = dbChirho.query('SELECT * FROM scanlines_chirho WHERE page_id_chirho=? ORDER BY line_index_chirho').all(Number(pageChirho.id_chirho)) as FontRowChirho[];
        const segmentsChirho = dbChirho.query('SELECT s_chirho.* FROM scanlines_chirho l_chirho JOIN segments_chirho s_chirho ON s_chirho.scanline_id_chirho=l_chirho.id_chirho WHERE l_chirho.page_id_chirho=? ORDER BY l_chirho.line_index_chirho,s_chirho.segment_index_chirho').all(Number(pageChirho.id_chirho)) as FontRowChirho[];
        const entryChirho = structuredClone(entriesChirho.find(valueChirho => valueChirho.page_number_chirho === numberChirho)!);
        const originalLinesChirho = new Map(entryChirho.before_chirho.lines_chirho.map(valueChirho => [valueChirho.id_chirho, valueChirho.line_index_chirho]));
        const originalsChirho = new Map(entryChirho.before_chirho.segments_chirho.map(valueChirho => [valueChirho.id_chirho, `${originalLinesChirho.get(valueChirho.scanline_id_chirho)}:${valueChirho.segment_index_chirho}`]));
        const lineIndicesChirho = new Map(linesChirho.map(valueChirho => [valueChirho.id_chirho, valueChirho.line_index_chirho]));
        const localIdsChirho = new Map(segmentsChirho.map(valueChirho => [`${lineIndicesChirho.get(valueChirho.scanline_id_chirho)}:${valueChirho.segment_index_chirho}`, valueChirho.id_chirho]));
        for (const targetChirho of entryChirho.targets_chirho)
            targetChirho.id_chirho = Number(localIdsChirho.get(originalsChirho.get(targetChirho.id_chirho)!));
        entryChirho.before_chirho = { page_chirho: pageChirho, lines_chirho: linesChirho, segments_chirho: segmentsChirho };
        fixtureEntriesChirho.push(entryChirho);
        const imageChirho = numberChirho === 56 ? join(LEGACY_ROOT_CHIRHO, 'images-chirho/page-56-chirho.png') : join(canonicalRootChirho, 'workspace-chirho/corpus-intake-chirho/pages-chirho/vol-5-chirho/0500-chirho/page-0500-chirho.png');
        const childChirho = Bun.spawn(['rtk', 'proxy', 'node', join(PROJECT_ROOT_CHIRHO, 'app-chirho/node_modules/wrangler/bin/wrangler.js'), 'r2', 'object', 'put', `hottp-chirho/${imageKeyChirho(5, numberChirho)}`, '--file', imageChirho, '--local', '--persist-to', dirname(stateChirho), '--config', join(PROJECT_ROOT_CHIRHO, 'app-chirho/wrangler-chirho.toml'), '--content-type', 'image/png'], { stdout: 'pipe', stderr: 'pipe' });
        const [outputChirho, errorChirho, exitChirho] = await Promise.all([new Response(childChirho.stdout).text(), new Response(childChirho.stderr).text(), childChirho.exited]);
        if (exitChirho !== 0)
            throw new Error(`Local image seed failed ${outputChirho} ${errorChirho}`);
    }
    dbChirho.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    dbChirho.close();
    await savePrivateChirho(fixtureChirho, { entries_chirho: fixtureEntriesChirho, manifest_sha256_chirho: manifestChirho.sha256_chirho, witness_sha256_chirho: beforeChirho });
}
else {
    const valueChirho = await Bun.file(fixtureChirho).json() as {
        entries_chirho: FontEntryChirho[];
        manifest_sha256_chirho: string;
        witness_sha256_chirho: string;
    };
    if (valueChirho.witness_sha256_chirho !== beforeChirho)
        throw new Error('Protected witness changed');
    const dbChirho = new Database(copyChirho);
    dbChirho.transaction(() => { for (const entryChirho of valueChirho.entries_chirho)
        for (const statementChirho of fontStatementsChirho(entryChirho, valueChirho.manifest_sha256_chirho))
            dbChirho.query(statementChirho.sql).run(...(statementChirho.params ?? [])); })();
    dbChirho.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    dbChirho.close();
}
if (await witnessHashChirho() !== beforeChirho)
    throw new Error('Protected witness changed during fixture work');
console.log(JSON.stringify({ mode_chirho: modeChirho, fixture_chirho: fixtureChirho, witness_sha256_chirho: beforeChirho, production_writes_chirho: 0 }));
