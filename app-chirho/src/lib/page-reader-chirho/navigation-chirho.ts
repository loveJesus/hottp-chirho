// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import type { ReadingTokenChirho } from './model-chirho';

// Workflow: spec-chirho/workflows-chirho/page-reading-workflow-chirho.md.
// Search is page-local and reads stored text only, never drafts or hidden records.
export function searchTextChirho(textChirho: string): string {
  return textChirho.normalize('NFD').replace(/\p{M}/gu, '').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, '').toLowerCase().trim();
}

export function matchingReadingsChirho(tokensChirho: ReadingTokenChirho[], queryChirho: string): ReadingTokenChirho[] {
  const needleChirho = searchTextChirho(queryChirho);
  return needleChirho ? tokensChirho.filter((tokenChirho) => searchTextChirho(tokenChirho.textChirho).includes(needleChirho)) : [];
}

export function nextMatchChirho(matchesChirho: ReadingTokenChirho[], selectedKeyChirho: string | null, directionChirho: 1 | -1): ReadingTokenChirho | null {
  if (!matchesChirho.length) return null;
  const indexChirho = matchesChirho.findIndex((tokenChirho) => tokenChirho.keyChirho === selectedKeyChirho);
  const nextIndexChirho = indexChirho < 0 ? (directionChirho === 1 ? 0 : matchesChirho.length - 1) : (indexChirho + directionChirho + matchesChirho.length) % matchesChirho.length;
  return matchesChirho[nextIndexChirho];
}

export function readingTargetChirho(hashChirho: string): { keyChirho: string; fingerprintChirho: string } | null {
  if (hashChirho.length > 160) return null;
  const matchChirho = /^#reading-chirho=((?:word|segment)-([1-9]\d*)-chirho)&source-chirho=([a-f0-9]{64})$/.exec(hashChirho);
  return matchChirho && Number.isSafeInteger(Number(matchChirho[2])) ? { keyChirho: matchChirho[1], fingerprintChirho: matchChirho[3] } : null;
}

async function sourceFingerprintChirho(pathChirho: string, tokenChirho: ReadingTokenChirho): Promise<string> {
  const boxChirho = tokenChirho.boxChirho;
  const sourceChirho = JSON.stringify([pathChirho, tokenChirho.keyChirho, tokenChirho.lineIndexChirho, tokenChirho.textChirho, tokenChirho.scriptChirho,
    boxChirho ? [boxChirho.xChirho, boxChirho.yChirho, boxChirho.widthChirho, boxChirho.heightChirho] : null]);
  const bytesChirho = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sourceChirho));
  return [...new Uint8Array(bytesChirho)].map((byteChirho) => byteChirho.toString(16).padStart(2, '0')).join('');
}

export async function readingLinkChirho(pageUrlChirho: string, tokenChirho: ReadingTokenChirho): Promise<string> {
  const urlChirho = new URL(pageUrlChirho);
  const hashChirho = `#reading-chirho=${tokenChirho.keyChirho}&source-chirho=${await sourceFingerprintChirho(urlChirho.pathname, tokenChirho)}`;
  if (!readingTargetChirho(hashChirho)) throw new Error('This reading has no shareable identity.');
  urlChirho.search = ''; // Never copy diagnostics, credentials, search terms, or draft contents.
  urlChirho.username = ''; urlChirho.password = '';
  urlChirho.hash = hashChirho;
  return urlChirho.href;
}

export async function linkedReadingChirho(pageUrlChirho: string, tokensChirho: ReadingTokenChirho[]): Promise<ReadingTokenChirho | null> {
  const urlChirho = new URL(pageUrlChirho), targetChirho = readingTargetChirho(urlChirho.hash);
  const tokenChirho = targetChirho && tokensChirho.find((candidateChirho) => candidateChirho.keyChirho === targetChirho.keyChirho);
  return tokenChirho && await sourceFingerprintChirho(urlChirho.pathname, tokenChirho) === targetChirho!.fingerprintChirho ? tokenChirho : null;
}
