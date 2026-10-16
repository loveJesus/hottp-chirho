// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import { MAX_DRAFT_FILE_BYTES_CHIRHO, pageDraftDownloadChirho, parseDraftDownloadChirho, readDraftFileChirho, mergeDraftBackupChirho } from '../../../app-chirho/src/lib/page-reader-chirho/drafts-chirho/file-backup-chirho';
import { draftMatchesSourceChirho, editDraftChirho, writePageDraftsChirho, readPageDraftsChirho, type PageDraftsChirho } from '../../../app-chirho/src/lib/page-reader-chirho/drafts-chirho/session-store-chirho';
import type { ReadingTokenChirho } from '../../../app-chirho/src/lib/page-reader-chirho/model-chirho';

function tokenChirho(idChirho = 12): ReadingTokenChirho {
  return { keyChirho: `word-${idChirho}-chirho`, kindChirho: 'word-chirho', idChirho, scanlineIdChirho: 2,
    lineIndexChirho: 1, textChirho: 'יהוה', scriptChirho: 'hebrew-chirho', confirmedChirho: false, flaggedChirho: false,
    boxChirho: { xChirho: 20, yChirho: 30, widthChirho: 40, heightChirho: 15 } };
}
function pageChirho(): PageDraftsChirho {
  return { pageIdChirho: 1, imageKeyChirho: 'pages/page-1-chirho.png', selectedKeyChirho: 'word-12-chirho',
    draftsChirho: [editDraftChirho(tokenChirho(), undefined, { textChirho: 'שָׁלוֹם e\u0301' })!] };
}
function readChirho(valueChirho: unknown): PageDraftsChirho { return parseDraftDownloadChirho(JSON.stringify(valueChirho)); }

describe('local reading backup file boundary', () => {
  test('download round trip preserves raw multilingual source, draft, selection and box', () => {
    const pageDraftsChirho = pageChirho();
    pageDraftsChirho.draftsChirho.push(editDraftChirho(tokenChirho(13), undefined, { boxChirho: { ...tokenChirho().boxChirho!, xChirho: 25 } })!);
    const downloadChirho = pageDraftDownloadChirho(pageDraftsChirho);
    expect(downloadChirho.approved_chirho).toBe(false);
    expect(readChirho(downloadChirho)).toEqual(pageDraftsChirho);
    expect(readChirho(downloadChirho).draftsChirho[0].textChirho).toContain('e\u0301');
  });
  test('older downloads without selection restore without guessing a selected key', () => {
    const { selected_key_chirho: _selectionChirho, ...oldChirho } = pageDraftDownloadChirho(pageChirho());
    expect(readChirho(oldChirho)).toEqual({ ...pageChirho(), selectedKeyChirho: null });
  });
  test('broken JSON, non-objects, repair proposals and approval claims are refused', () => {
    expect(() => parseDraftDownloadChirho('{broken')).toThrow();
    const backupChirho = pageDraftDownloadChirho(pageChirho());
    for (const badChirho of [null, [], 'text', {}, { ...backupChirho, approved_chirho: true },
      { ...backupChirho, kind_chirho: 'unsubmitted-page-repair-draft-chirho' }]) expect(() => readChirho(badChirho)).toThrow();
  });
  test('IDs, coordinates, strings, duplicate identities and prototype-shaped keys are validated', () => {
    const backupChirho = pageDraftDownloadChirho(pageChirho()), draftChirho = pageChirho().draftsChirho[0];
    for (const sourceChirho of [{ ...draftChirho.sourceChirho, idChirho: -1 }, { ...draftChirho.sourceChirho, keyChirho: '__proto__' },
      { ...draftChirho.sourceChirho, scanlineIdChirho: Number.MAX_SAFE_INTEGER + 1 },
      { ...draftChirho.sourceChirho, textChirho: 'x'.repeat(8193) },
      { ...draftChirho.sourceChirho, boxChirho: { ...draftChirho.boxChirho, widthChirho: -1 } }]) {
      expect(() => readChirho({ ...backupChirho, drafts_chirho: [{ ...draftChirho, sourceChirho }] })).toThrow();
    }
    for (const changesChirho of [{ page_id_chirho: '1' }, { selected_key_chirho: {} },
      { drafts_chirho: [draftChirho, draftChirho] }, { drafts_chirho: [{ ...draftChirho, textChirho: 'x'.repeat(8193) }] },
      { drafts_chirho: [{ ...draftChirho, boxChirho: { ...draftChirho.boxChirho, xChirho: Infinity } }] }]) {
      expect(() => readChirho({ ...backupChirho, ...changesChirho })).toThrow();
    }
  });
  test('oversized files are refused before reading bytes, including UTF-8 byte expansion', async () => {
    let readCountChirho = 0;
    await expect(readDraftFileChirho({ size: MAX_DRAFT_FILE_BYTES_CHIRHO + 1, text: async () => { readCountChirho++; return ''; } })).rejects.toThrow('limit');
    expect(readCountChirho).toBe(0);
    expect(() => parseDraftDownloadChirho('א'.repeat(MAX_DRAFT_FILE_BYTES_CHIRHO / 2 + 1))).toThrow('limit');
    await expect(readDraftFileChirho({ size: 12, text: async () => { throw new Error('unreadable file'); } })).rejects.toThrow('unreadable');
  });
  test('unknown fields at every level are discarded and cannot wedge the tab backup', () => {
    const inputChirho = pageChirho(), draftChirho = inputChirho.draftsChirho[0];
    const restoredChirho = readChirho({ ...pageDraftDownloadChirho(inputChirho), extra_chirho: 'x'.repeat(300000), drafts_chirho: [{
      ...draftChirho, extra_chirho: 'x'.repeat(300000), boxChirho: { ...draftChirho.boxChirho!, extra_chirho: 'x'.repeat(300000) },
      sourceChirho: { ...draftChirho.sourceChirho, extra_chirho: 'x'.repeat(300000),
        boxChirho: { ...draftChirho.sourceChirho.boxChirho!, extra_chirho: 'x'.repeat(300000) } },
    }] });
    expect(restoredChirho).toEqual(inputChirho);
    let storedChirho: string | null = null;
    const storageChirho = { getItem: () => storedChirho, setItem: (_keyChirho: string, valueChirho: string) => { storedChirho = valueChirho; }, removeItem: () => { storedChirho = null; } };
    writePageDraftsChirho(storageChirho, restoredChirho);
    expect(readPageDraftsChirho(storageChirho, inputChirho.pageIdChirho)).toEqual(inputChirho);
  });
});

describe('non-destructive explicit restore', () => {
  test('current edits and selection win collisions; repeated import is idempotent', () => {
    const currentChirho = pageChirho(), incomingChirho = pageChirho();
    currentChirho.draftsChirho[0].textChirho = 'newer edit';
    incomingChirho.draftsChirho.push(editDraftChirho(tokenChirho(13), undefined, { textChirho: 'second draft' })!);
    const beforeChirho = JSON.stringify([currentChirho, incomingChirho]);
    const mergedChirho = mergeDraftBackupChirho(currentChirho, incomingChirho);
    expect(mergedChirho.addedKeysChirho).toEqual(['word-13-chirho']);
    expect(mergedChirho.keptCountChirho).toBe(1);
    expect(mergedChirho.pageChirho.draftsChirho[0].textChirho).toBe('newer edit');
    expect(mergedChirho.pageChirho.selectedKeyChirho).toBe(currentChirho.selectedKeyChirho);
    expect(JSON.stringify([currentChirho, incomingChirho])).toBe(beforeChirho);
    const againChirho = mergeDraftBackupChirho(mergedChirho.pageChirho, incomingChirho);
    expect(againChirho.addedKeysChirho).toEqual([]);
    expect(againChirho.pageChirho).toEqual(mergedChirho.pageChirho);
  });
  test('wrong page or source image fails without modifying either set of drafts', () => {
    const currentChirho = pageChirho();
    for (const incomingChirho of [{ ...pageChirho(), pageIdChirho: 2 }, { ...pageChirho(), imageKeyChirho: 'new-image-chirho.png' }]) {
      const beforeChirho = JSON.stringify([currentChirho, incomingChirho]);
      expect(() => mergeDraftBackupChirho(currentChirho, incomingChirho)).toThrow();
      expect(JSON.stringify([currentChirho, incomingChirho])).toBe(beforeChirho);
    }
  });
  test('stale source and missing records stay stale; imports never rebase a draft', () => {
    const incomingChirho = pageChirho();
    incomingChirho.draftsChirho[0].sourceChirho.textChirho = 'older reading';
    const mergedChirho = mergeDraftBackupChirho({ ...pageChirho(), draftsChirho: [] }, readChirho(pageDraftDownloadChirho(incomingChirho)));
    const draftChirho = mergedChirho.pageChirho.draftsChirho[0];
    expect(draftChirho.sourceChirho.textChirho).toBe('older reading');
    expect(draftMatchesSourceChirho(draftChirho, tokenChirho())).toBe(false);
    expect(draftMatchesSourceChirho(draftChirho, undefined)).toBe(false);
  });
  test('overflow refuses the entire merge, not just the last draft', () => {
    const currentChirho = { ...pageChirho(), draftsChirho: Array.from({ length: 200 }, (_unusedChirho, indexChirho) =>
      editDraftChirho(tokenChirho(indexChirho + 100), undefined, { textChirho: 'existing' })!) };
    const beforeChirho = JSON.stringify(currentChirho);
    expect(() => mergeDraftBackupChirho(currentChirho, pageChirho())).toThrow('200');
    expect(JSON.stringify(currentChirho)).toBe(beforeChirho);
    expect(() => readChirho(pageDraftDownloadChirho({ ...currentChirho, draftsChirho: [...currentChirho.draftsChirho, pageChirho().draftsChirho[0]] }))).toThrow();
  });
});
