// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { error } from '@sveltejs/kit';

export async function boundedTextChirho(requestChirho: Request, limitChirho: number): Promise<string> {
  const readerChirho = requestChirho.body?.getReader();
  if (!readerChirho) error(400, 'A request body is required.');
  const chunksChirho: Uint8Array[] = [];
  let sizeChirho = 0;
  try {
    for (;;) {
      const chunkChirho = await readerChirho.read();
      if (chunkChirho.done) break;
      sizeChirho += chunkChirho.value.byteLength;
      if (sizeChirho > limitChirho) { await readerChirho.cancel(); error(413, 'Request too large. No changes saved.'); }
      chunksChirho.push(chunkChirho.value);
    }
  } finally { readerChirho.releaseLock(); }
  const bytesChirho = new Uint8Array(sizeChirho);
  let offsetChirho = 0;
  for (const chunkChirho of chunksChirho) { bytesChirho.set(chunkChirho, offsetChirho); offsetChirho += chunkChirho.byteLength; }
  return new TextDecoder().decode(bytesChirho);
}
