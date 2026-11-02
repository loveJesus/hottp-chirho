// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { Database } from 'bun:sqlite';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getTableColumns } from '../../../app-chirho/node_modules/drizzle-orm';
import { pagesChirho, scanlinesChirho, segmentsChirho } from '../../../app-chirho/src/lib/server-chirho/schema-d1-chirho';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { remoteFontPagesChirho } from '../../../src-chirho/corpus-intake-chirho/publish-chirho/font-chirho/prepare-chirho';
import { r2Chirho, BUCKET_CHIRHO } from '../../../src-chirho/corpus-intake-chirho/publish-chirho/cloud-chirho';
import { imageKeyChirho } from '../../../src-chirho/corpus-intake-chirho/publish-chirho/source-chirho';
import { witnessHashChirho } from '../../../src-chirho/corpus-intake-chirho/publish-chirho/legacy-chirho/prepare-chirho';

const rootChirho = process.argv[2], canonicalChirho = process.env.HOTTP_CANONICAL_ROOT_CHIRHO;
if (!rootChirho || !/^\/private\/tmp\/hottp-print-inspector-chirho-[A-Za-z0-9]+$/.test(rootChirho) || !canonicalChirho) throw new Error('Owned fixture root and canonical source required');
const witnessChirho = join(canonicalChirho, 'app-chirho/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/49ceeca0eaefb053fcb1e6ce1b9fafdd48db3f7f681331272cb804b7ff40dbee.sqlite');
const copyChirho = join(rootChirho, 'state/v3/d1/miniflare-D1DatabaseObject/49ceeca0eaefb053fcb1e6ce1b9fafdd48db3f7f681331272cb804b7ff40dbee.sqlite');
if (await Bun.file(copyChirho).exists()) throw new Error('Fixture already exists');
const beforeChirho = await witnessHashChirho();
mkdirSync(dirname(copyChirho), { recursive: true });
copyFileSync(witnessChirho, copyChirho);
if (statSync(witnessChirho).ino === statSync(copyChirho).ino) throw new Error('Not a physical copy');
const dbChirho = new Database(copyChirho), nativeChirho = (await remoteFontPagesChirho([500])).get(500)!;
dbChirho.exec('PRAGMA foreign_keys=ON');
function insertChirho(tableChirho: typeof pagesChirho | typeof scanlinesChirho | typeof segmentsChirho, nameChirho: string, rowsChirho: Record<string, unknown>[]): void {
  const fieldsChirho = Object.values(getTableColumns(tableChirho)).map((fieldChirho) => fieldChirho.name);
  const statementChirho = dbChirho.query('INSERT INTO ' + nameChirho + '(' + fieldsChirho.join(',') + ') VALUES(' + fieldsChirho.map(() => '?').join(',') + ')');
  for (const rowChirho of rowsChirho) statementChirho.run(...fieldsChirho.map((fieldChirho) => rowChirho[fieldChirho] as string | number | null));
}
dbChirho.transaction(() => {
  insertChirho(pagesChirho, 'pages_chirho', [nativeChirho.page_chirho]);
  insertChirho(scanlinesChirho, 'scanlines_chirho', nativeChirho.lines_chirho);
  insertChirho(segmentsChirho, 'segments_chirho', nativeChirho.segments_chirho);
})();
dbChirho.exec('PRAGMA wal_checkpoint(TRUNCATE)');
dbChirho.close();
const clientChirho = r2Chirho();
try {
  for (const [volumeChirho, pageChirho] of [[3, 151], [5, 148], [5, 500]]) {
    const keyChirho = imageKeyChirho(volumeChirho!, pageChirho!), fileChirho = join(rootChirho, 'image-' + volumeChirho + '-' + pageChirho + '-chirho.png');
    const objectChirho = await clientChirho.send(new GetObjectCommand({ Bucket: BUCKET_CHIRHO, Key: keyChirho }));
    await Bun.write(fileChirho, await objectChirho.Body!.transformToByteArray());
    const childChirho = Bun.spawn(['rtk', 'proxy', 'node', join(canonicalChirho, 'app-chirho/node_modules/wrangler/bin/wrangler.js'), 'r2', 'object', 'put',
      BUCKET_CHIRHO + '/' + keyChirho, '--file', fileChirho, '--local', '--persist-to', join(rootChirho, 'state'),
      '--config', join(rootChirho, 'tree-chirho/app-chirho/wrangler-chirho.toml'), '--content-type', 'image/png'], { stdout: 'pipe', stderr: 'pipe' });
    const [outputChirho, errorChirho, exitChirho] = await Promise.all([new Response(childChirho.stdout).text(), new Response(childChirho.stderr).text(), childChirho.exited]);
    if (exitChirho !== 0) throw new Error('Local-only R2 seed failed: ' + outputChirho + errorChirho);
  }
} finally { clientChirho.destroy(); }
if (await witnessHashChirho() !== beforeChirho) throw new Error('Protected witness changed');
console.log(JSON.stringify({ copied_fixture_chirho: copyChirho, witness_sha256_chirho: beforeChirho, source_pages_chirho: ['3:151', '5:148', '5:500'], production_rows_written_chirho: 0, remote_r2_writes_chirho: 0 }));
