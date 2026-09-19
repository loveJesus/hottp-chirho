// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { sameBoxChirho, type BoxChirho, type ReadingTokenChirho } from '../model-chirho';

export interface ReadingDraftChirho {
  sourceChirho: ReadingTokenChirho;
  textChirho: string;
  boxChirho: BoxChirho | null;
}
export interface PageDraftsChirho {
  pageIdChirho: number;
  imageKeyChirho: string;
  selectedKeyChirho: string | null;
  draftsChirho: ReadingDraftChirho[];
}
interface ShelfChirho { versionChirho: 1; pagesChirho: PageDraftsChirho[] }
export interface TabStorageChirho { getItem(keyChirho: string): string | null; setItem(keyChirho: string, valueChirho: string): void; removeItem(keyChirho: string): void }
export const DRAFT_STORAGE_KEY_CHIRHO = 'hottp-page-drafts-v1-chirho';
export const MAX_STORAGE_CHARS_CHIRHO = 262144;
export const MAX_DRAFT_PAGES_CHIRHO = 8;
export const MAX_PAGE_DRAFTS_CHIRHO = 200;
const MAX_TEXT_CHARS_CHIRHO = 8192;

function recordChirho(valueChirho: unknown): valueChirho is Record<string, unknown> {
  return valueChirho !== null && typeof valueChirho === 'object' && !Array.isArray(valueChirho);
}
function textChirho(valueChirho: unknown, maximumChirho = MAX_TEXT_CHARS_CHIRHO): valueChirho is string {
  return typeof valueChirho === 'string' && valueChirho.length <= maximumChirho;
}
function idChirho(valueChirho: unknown): boolean { return Number.isSafeInteger(valueChirho) && Number(valueChirho) > 0; }
function validBoxChirho(valueChirho: unknown): boolean {
  return valueChirho === null || recordChirho(valueChirho) &&
    ['xChirho', 'yChirho', 'widthChirho', 'heightChirho'].every((keyChirho) => typeof valueChirho[keyChirho] === 'number' && Number.isFinite(valueChirho[keyChirho])) &&
    Number(valueChirho.xChirho) >= 0 && Number(valueChirho.yChirho) >= 0 && Number(valueChirho.widthChirho) > 0 && Number(valueChirho.heightChirho) > 0;
}
function validDraftChirho(valueChirho: unknown): valueChirho is ReadingDraftChirho {
  if (!recordChirho(valueChirho) || !recordChirho(valueChirho.sourceChirho)) return false;
  const sourceChirho = valueChirho.sourceChirho;
  const kindChirho = sourceChirho.kindChirho;
  return (kindChirho === 'word-chirho' || kindChirho === 'segment-chirho') && idChirho(sourceChirho.idChirho) && idChirho(sourceChirho.scanlineIdChirho) &&
    sourceChirho.keyChirho === `${kindChirho.replace('-chirho', '')}-${sourceChirho.idChirho}-chirho` &&
    Number.isSafeInteger(sourceChirho.lineIndexChirho) && Number(sourceChirho.lineIndexChirho) >= 0 &&
    textChirho(sourceChirho.textChirho) && textChirho(sourceChirho.scriptChirho, 80) &&
    typeof sourceChirho.confirmedChirho === 'boolean' && typeof sourceChirho.flaggedChirho === 'boolean' &&
    validBoxChirho(sourceChirho.boxChirho) && textChirho(valueChirho.textChirho) && validBoxChirho(valueChirho.boxChirho);
}
function validPageChirho(valueChirho: unknown): valueChirho is PageDraftsChirho {
  return recordChirho(valueChirho) && idChirho(valueChirho.pageIdChirho) && textChirho(valueChirho.imageKeyChirho, 2048) &&
    (valueChirho.selectedKeyChirho === null || textChirho(valueChirho.selectedKeyChirho, 100)) &&
    Array.isArray(valueChirho.draftsChirho) && valueChirho.draftsChirho.length <= MAX_PAGE_DRAFTS_CHIRHO && valueChirho.draftsChirho.every(validDraftChirho) &&
    new Set(valueChirho.draftsChirho.map((draftChirho) => draftChirho.sourceChirho.keyChirho)).size === valueChirho.draftsChirho.length;
}
function readShelfChirho(storageChirho: TabStorageChirho): ShelfChirho {
  const rawChirho = storageChirho.getItem(DRAFT_STORAGE_KEY_CHIRHO);
  if (!rawChirho) return { versionChirho: 1, pagesChirho: [] };
  if (rawChirho.length > MAX_STORAGE_CHARS_CHIRHO) throw new Error('Tab backup exceeds its size limit. Existing backup was not overwritten.');
  let parsedChirho: unknown;
  try { parsedChirho = JSON.parse(rawChirho); } catch { throw new Error('Tab backup is unreadable. Existing backup was not overwritten.'); }
  if (!recordChirho(parsedChirho) || parsedChirho.versionChirho !== 1 || !Array.isArray(parsedChirho.pagesChirho) ||
    parsedChirho.pagesChirho.length > MAX_DRAFT_PAGES_CHIRHO || !parsedChirho.pagesChirho.every(validPageChirho) ||
    new Set(parsedChirho.pagesChirho.map((pageChirho) => pageChirho.pageIdChirho)).size !== parsedChirho.pagesChirho.length) {
    throw new Error('Tab backup has an unsupported format. Existing backup was not overwritten.');
  }
  return { versionChirho: 1, pagesChirho: parsedChirho.pagesChirho };
}
export function readPageDraftsChirho(storageChirho: TabStorageChirho, pageIdChirho: number): PageDraftsChirho | null {
  return readShelfChirho(storageChirho).pagesChirho.find((pageChirho) => pageChirho.pageIdChirho === pageIdChirho) ?? null;
}

// Workflow: page-reading-workflow-chirho.md. Bounded session-only backup;
// no eviction, network, canonical write or implicit conflict resolution.
export function writePageDraftsChirho(storageChirho: TabStorageChirho, pageChirho: PageDraftsChirho): void {
  if (!validPageChirho(pageChirho)) throw new Error('This page exceeds the draft backup limits. Export your drafts before leaving.');
  const shelfChirho = readShelfChirho(storageChirho);
  const pagesChirho = shelfChirho.pagesChirho.filter((storedChirho) => storedChirho.pageIdChirho !== pageChirho.pageIdChirho);
  if (pageChirho.draftsChirho.length) pagesChirho.push(pageChirho);
  if (pagesChirho.length > MAX_DRAFT_PAGES_CHIRHO) throw new Error('Tab backup holds eight unfinished pages. Export or finish one before backing up another.');
  const rawChirho = JSON.stringify({ versionChirho: 1, pagesChirho });
  if (rawChirho.length > MAX_STORAGE_CHARS_CHIRHO) throw new Error('Tab backup is full. Your current edits remain here; export them before leaving.');
  if (!pagesChirho.length) storageChirho.removeItem(DRAFT_STORAGE_KEY_CHIRHO);
  else storageChirho.setItem(DRAFT_STORAGE_KEY_CHIRHO, rawChirho);
  if (storageChirho.getItem(DRAFT_STORAGE_KEY_CHIRHO) !== (pagesChirho.length ? rawChirho : null)) throw new Error('The browser did not retain the tab backup. Export drafts before leaving.');
}

export function draftMatchesSourceChirho(draftChirho: ReadingDraftChirho, tokenChirho: ReadingTokenChirho | undefined): boolean {
  const sourceChirho = draftChirho.sourceChirho;
  return !!tokenChirho && sourceChirho.keyChirho === tokenChirho.keyChirho && sourceChirho.kindChirho === tokenChirho.kindChirho &&
    sourceChirho.idChirho === tokenChirho.idChirho && sourceChirho.scanlineIdChirho === tokenChirho.scanlineIdChirho &&
    sourceChirho.lineIndexChirho === tokenChirho.lineIndexChirho && sourceChirho.textChirho === tokenChirho.textChirho &&
    sourceChirho.scriptChirho === tokenChirho.scriptChirho && sameBoxChirho(sourceChirho.boxChirho, tokenChirho.boxChirho);
}
export function editDraftChirho(tokenChirho: ReadingTokenChirho, previousChirho: ReadingDraftChirho | undefined, changesChirho: { textChirho?: string; boxChirho?: BoxChirho }): ReadingDraftChirho | null {
  const draftChirho: ReadingDraftChirho = { sourceChirho: previousChirho?.sourceChirho ?? { ...tokenChirho, boxChirho: tokenChirho.boxChirho ? { ...tokenChirho.boxChirho } : null },
    textChirho: changesChirho.textChirho ?? previousChirho?.textChirho ?? tokenChirho.textChirho,
    boxChirho: changesChirho.boxChirho ?? previousChirho?.boxChirho ?? tokenChirho.boxChirho };
  return draftChirho.textChirho === draftChirho.sourceChirho.textChirho && sameBoxChirho(draftChirho.boxChirho, draftChirho.sourceChirho.boxChirho) ? null : draftChirho;
}
