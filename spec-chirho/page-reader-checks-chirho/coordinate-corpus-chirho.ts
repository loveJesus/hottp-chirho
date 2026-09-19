// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Read-only, bounded geometry preflight. Pass an isolated DB snapshot path.
import { Database } from 'bun:sqlite';
import { boxFitsSpaceChirho, coordinateSpaceChirho } from '../../app-chirho/src/lib/page-reader-chirho/coordinate-space-chirho';
const pathChirho = process.argv[2];
if (!pathChirho?.startsWith('/tmp/hottp-reader-release-chirho-')) throw new Error('Use an isolated release snapshot, not the witness database.');
const dbChirho = new Database(pathChirho, { readonly: true });
const pagesChirho = dbChirho.query<{ id_chirho: number; volume_number_chirho: number; page_number_chirho: number }, []>('SELECT id_chirho,volume_number_chirho,page_number_chirho FROM pages_chirho WHERE EXISTS(SELECT 1 FROM scanlines_chirho WHERE page_id_chirho=pages_chirho.id_chirho) ORDER BY volume_number_chirho,page_number_chirho LIMIT 100').all();
if (pagesChirho.length === 100) throw new Error('Scope limit reached; explicitly review a larger scope.');
const resultsChirho = [];
try {
  for (const pageChirho of pagesChirho) {
    const rowsChirho = dbChirho.query<{ xChirho: number; yChirho: number; widthChirho: number; heightChirho: number }, [number, number]>(`
      SELECT w.x_min_chirho AS xChirho,w.y_min_chirho AS yChirho,w.x_max_chirho-w.x_min_chirho AS widthChirho,w.y_max_chirho-w.y_min_chirho AS heightChirho
      FROM words_chirho w JOIN scanlines_chirho l ON w.scanline_id_chirho=l.id_chirho WHERE l.page_id_chirho=? AND w.x_min_chirho IS NOT NULL
      UNION ALL SELECT l.x_min_chirho+s.x_min_px_chirho,l.y_min_chirho,s.width_px_chirho,l.height_chirho
      FROM segments_chirho s JOIN scanlines_chirho l ON s.scanline_id_chirho=l.id_chirho WHERE l.page_id_chirho=? AND s.x_min_px_chirho IS NOT NULL AND s.width_px_chirho IS NOT NULL
    `).all(pageChirho.id_chirho, pageChirho.id_chirho);
    const keyChirho = `vol-${pageChirho.volume_number_chirho}-chirho/page-${String(pageChirho.page_number_chirho).padStart(4, '0')}-chirho/full-page-chirho.png`;
    const responseChirho = await fetch(`https://hottp-chirho.bible.systems/api-chirho/images-chirho?key-chirho=${encodeURIComponent(keyChirho)}`);
    if (!responseChirho.ok || !responseChirho.body) throw new Error(`Missing source ${keyChirho}: ${responseChirho.status}`);
    const readerChirho = responseChirho.body.getReader();
    let bytesChirho = Buffer.alloc(0);
    try { while (bytesChirho.length < 24) { const chunkChirho = await readerChirho.read(); if (chunkChirho.done) break; bytesChirho = Buffer.concat([bytesChirho, Buffer.from(chunkChirho.value)]); } } finally { await readerChirho.cancel(); }
    if (bytesChirho.length < 24 || bytesChirho.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error(`Not a PNG: ${keyChirho}`);
    const widthChirho = bytesChirho.readUInt32BE(16), heightChirho = bytesChirho.readUInt32BE(20);
    const spaceChirho = coordinateSpaceChirho(pageChirho.volume_number_chirho, rowsChirho, widthChirho, heightChirho);
    if (!spaceChirho.validChirho) throw new Error(`Unmapped source extent: ${keyChirho}`);
    resultsChirho.push({ volume_chirho: pageChirho.volume_number_chirho, page_chirho: pageChirho.page_number_chirho, boxes_chirho: rowsChirho.length, held_boxes_chirho: rowsChirho.filter((boxChirho) => !boxFitsSpaceChirho(boxChirho, spaceChirho.widthChirho, spaceChirho.heightChirho)).length, calibrated_chirho: spaceChirho.calibratedChirho, width_chirho: widthChirho, height_chirho: heightChirho });
  }
} finally { dbChirho.close(); }
console.log(JSON.stringify({ pages_chirho: resultsChirho.length, results_chirho: resultsChirho }, null, 2));
