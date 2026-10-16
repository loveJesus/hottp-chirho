// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { validPageDraftsChirho, type PageDraftsChirho } from './session-store-chirho';
import { REVIEW_STATES_CHIRHO, type BoxChirho } from '../model-chirho';

export const MAX_DRAFT_FILE_BYTES_CHIRHO = 4 * 1024 * 1024;

export interface DraftRestoreChirho {
  pageChirho: PageDraftsChirho;
  addedKeysChirho: string[];
  keptCountChirho: number;
}

// Workflow: page-reading-workflow-chirho.md. Preserve the original source,
// including conflicts; a download is local work, never review authority.
export function pageDraftDownloadChirho(pageChirho: PageDraftsChirho) {
  return {
    kind_chirho: 'unsubmitted-reading-backup-chirho', approved_chirho: false,
    page_id_chirho: pageChirho.pageIdChirho, image_key_chirho: pageChirho.imageKeyChirho,
    selected_key_chirho: pageChirho.selectedKeyChirho, drafts_chirho: pageChirho.draftsChirho,
  };
}

export function parseDraftDownloadChirho(rawChirho: string): PageDraftsChirho {
  if (rawChirho.length > MAX_DRAFT_FILE_BYTES_CHIRHO || new TextEncoder().encode(rawChirho).byteLength > MAX_DRAFT_FILE_BYTES_CHIRHO) {
    throw new Error('Draft backup exceeds the 4 MB file limit. Nothing was restored.');
  }
  let parsedChirho: unknown;
  try { parsedChirho = JSON.parse(rawChirho); } catch { throw new Error('This file is not readable JSON. Choose a downloaded reading backup.'); }
  if (!parsedChirho || typeof parsedChirho !== 'object' || Array.isArray(parsedChirho)) throw new Error('This is not a reading backup.');
  const recordChirho = parsedChirho as Record<string, unknown>;
  if (recordChirho.kind_chirho !== 'unsubmitted-reading-backup-chirho' || recordChirho.approved_chirho !== false) {
    throw new Error('Choose a reading backup from Download all drafts, not a repair proposal or approved record.');
  }
  const pageChirho = { pageIdChirho: recordChirho.page_id_chirho, imageKeyChirho: recordChirho.image_key_chirho,
    selectedKeyChirho: recordChirho.selected_key_chirho === undefined ? null : recordChirho.selected_key_chirho,
    draftsChirho: recordChirho.drafts_chirho };
  if (!validPageDraftsChirho(pageChirho)) throw new Error('This backup has invalid or oversized draft entries. Nothing was restored.');
  // A valid known shape does not make unrelated JSON fields trustworthy. Keep
  // only the bounded draft fields so extras cannot fill/wedge the tab shelf.
  return { ...pageChirho, draftsChirho: pageChirho.draftsChirho.map((draftChirho) => {
    const sourceChirho = draftChirho.sourceChirho;
    const reviewStateChirho = sourceChirho.reviewStateChirho;
    return { textChirho: draftChirho.textChirho, boxChirho: copyBoxChirho(draftChirho.boxChirho), sourceChirho: {
      keyChirho: sourceChirho.keyChirho, kindChirho: sourceChirho.kindChirho, idChirho: sourceChirho.idChirho,
      scanlineIdChirho: sourceChirho.scanlineIdChirho, lineIndexChirho: sourceChirho.lineIndexChirho,
      textChirho: sourceChirho.textChirho, scriptChirho: sourceChirho.scriptChirho,
      confirmedChirho: sourceChirho.confirmedChirho, flaggedChirho: sourceChirho.flaggedChirho,
      boxChirho: copyBoxChirho(sourceChirho.boxChirho),
      ...(reviewStateChirho && REVIEW_STATES_CHIRHO.includes(reviewStateChirho)
        ? { reviewStateChirho } : {}),
    } };
  }) };
}

function copyBoxChirho(boxChirho: BoxChirho | null): BoxChirho | null {
  return boxChirho && { xChirho: boxChirho.xChirho, yChirho: boxChirho.yChirho, widthChirho: boxChirho.widthChirho, heightChirho: boxChirho.heightChirho };
}

export async function readDraftFileChirho(fileChirho: Pick<File, 'size' | 'text'>): Promise<PageDraftsChirho> {
  if (fileChirho.size > MAX_DRAFT_FILE_BYTES_CHIRHO) throw new Error('Draft backup exceeds the 4 MB file limit. Nothing was read or restored.');
  return parseDraftDownloadChirho(await fileChirho.text());
}

// Workflow: page-reading-workflow-chirho.md. Merge at the explicit restore
// click, not file selection time. Existing edits always win; no source rebase.
export function mergeDraftBackupChirho(currentChirho: PageDraftsChirho, incomingChirho: PageDraftsChirho): DraftRestoreChirho {
  if (!validPageDraftsChirho(currentChirho) || !validPageDraftsChirho(incomingChirho)) throw new Error('Drafts exceed the restore limits. Existing drafts are unchanged.');
  if (incomingChirho.pageIdChirho !== currentChirho.pageIdChirho) throw new Error('This backup belongs to a different page. Open its original page before restoring.');
  if (incomingChirho.imageKeyChirho !== currentChirho.imageKeyChirho) throw new Error('The source image differs from this backup. Keep the file for comparison; nothing was restored.');
  const keysChirho = new Set(currentChirho.draftsChirho.map((draftChirho) => draftChirho.sourceChirho.keyChirho));
  const addedChirho = incomingChirho.draftsChirho.filter((draftChirho) => !keysChirho.has(draftChirho.sourceChirho.keyChirho));
  const pageChirho: PageDraftsChirho = { ...currentChirho, draftsChirho: [...currentChirho.draftsChirho, ...addedChirho] };
  if (!validPageDraftsChirho(pageChirho)) throw new Error('Restoring would exceed 200 drafts on this page. Nothing was replaced or removed.');
  return { pageChirho, addedKeysChirho: addedChirho.map((draftChirho) => draftChirho.sourceChirho.keyChirho),
    keptCountChirho: incomingChirho.draftsChirho.length - addedChirho.length };
}
