// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import { DRAFT_STORAGE_KEY_CHIRHO, MAX_STORAGE_CHARS_CHIRHO, readPageDraftsChirho, writePageDraftsChirho,
  editDraftChirho, draftMatchesSourceChirho, type PageDraftsChirho, type TabStorageChirho } from '../../app-chirho/src/lib/page-reader-chirho/drafts-chirho/session-store-chirho';
import type { ReadingTokenChirho } from '../../app-chirho/src/lib/page-reader-chirho/model-chirho';

function storageChirho(): TabStorageChirho {
  const valuesChirho = new Map<string, string>();
  return { getItem: (keyChirho) => valuesChirho.get(keyChirho) ?? null,
    setItem: (keyChirho, valueChirho) => { valuesChirho.set(keyChirho, valueChirho); }, removeItem: (keyChirho) => { valuesChirho.delete(keyChirho); } };
}
function tokenChirho(): ReadingTokenChirho {
  return { keyChirho: 'word-12-chirho', kindChirho: 'word-chirho', idChirho: 12, scanlineIdChirho: 2,
    lineIndexChirho: 1, textChirho: 'יהוה', scriptChirho: 'hebrew-chirho', confirmedChirho: false, flaggedChirho: false,
    boxChirho: { xChirho: 20, yChirho: 30, widthChirho: 40, heightChirho: 15 } };
}
function pageChirho(idChirho = 1): PageDraftsChirho {
  return { pageIdChirho: idChirho, imageKeyChirho: `page-${idChirho}-chirho.png`, selectedKeyChirho: 'word-12-chirho',
    draftsChirho: [editDraftChirho(tokenChirho(), undefined, { textChirho: 'draft' })!] };
}
describe('tab-local draft lifecycle', () => {
  test('text and geometry share one original source; empty correction is preserved', () => {
    const sourceChirho = tokenChirho();
    const textDraftChirho = editDraftChirho(sourceChirho, undefined, { textChirho: '' })!;
    const boxDraftChirho = editDraftChirho(sourceChirho, textDraftChirho, { boxChirho: { ...sourceChirho.boxChirho!, xChirho: 22 } })!;
    expect(boxDraftChirho.textChirho).toBe('');
    expect(boxDraftChirho.sourceChirho.boxChirho?.xChirho).toBe(20);
    expect(boxDraftChirho.boxChirho?.xChirho).toBe(22);
    expect(editDraftChirho(sourceChirho, boxDraftChirho, { textChirho: sourceChirho.textChirho, boxChirho: sourceChirho.boxChirho! })).toBeNull();
  });
  test('round trip restores selection and draft without setting confirmation', () => {
    const storeChirho = storageChirho(), inputChirho = pageChirho();
    writePageDraftsChirho(storeChirho, inputChirho);
    expect(readPageDraftsChirho(storeChirho, 1)).toEqual(inputChirho);
    expect(readPageDraftsChirho(storeChirho, 1)!.draftsChirho[0].sourceChirho.confirmedChirho).toBe(false);
    expect(readPageDraftsChirho(storeChirho, 2)).toBeNull();
  });
  test('clearing a page cannot erase another page', () => {
    const storeChirho = storageChirho();
    writePageDraftsChirho(storeChirho, pageChirho(1)); writePageDraftsChirho(storeChirho, pageChirho(2));
    writePageDraftsChirho(storeChirho, { ...pageChirho(1), draftsChirho: [] });
    expect(readPageDraftsChirho(storeChirho, 1)).toBeNull(); expect(readPageDraftsChirho(storeChirho, 2)).toEqual(pageChirho(2));
  });
  test('source identity, text, script, line, geometry and removal cause holds', () => {
    const sourceChirho = tokenChirho(), draftChirho = pageChirho().draftsChirho[0];
    expect(draftMatchesSourceChirho(draftChirho, sourceChirho)).toBe(true);
    for (const changedChirho of [undefined, { ...sourceChirho, textChirho: 'new' }, { ...sourceChirho, scriptChirho: 'greek-chirho' },
      { ...sourceChirho, scanlineIdChirho: 3 }, { ...sourceChirho, idChirho: 13 }, { ...sourceChirho, lineIndexChirho: 7 },
      { ...sourceChirho, boxChirho: { ...sourceChirho.boxChirho!, widthChirho: 42 } }]) expect(draftMatchesSourceChirho(draftChirho, changedChirho)).toBe(false);
  });
  test('same values confirmed by another reviewer do not invalidate the draft baseline', () => {
    expect(draftMatchesSourceChirho(pageChirho().draftsChirho[0], { ...tokenChirho(), confirmedChirho: true })).toBe(true);
  });
});
describe('bounded storage and recovery failures', () => {
  test('a ninth page is refused without evicting any unfinished work', () => {
    const storeChirho = storageChirho();
    for (let idChirho = 1; idChirho <= 8; idChirho++) writePageDraftsChirho(storeChirho, pageChirho(idChirho));
    const beforeChirho = storeChirho.getItem(DRAFT_STORAGE_KEY_CHIRHO);
    expect(() => writePageDraftsChirho(storeChirho, pageChirho(9))).toThrow('eight');
    expect(storeChirho.getItem(DRAFT_STORAGE_KEY_CHIRHO)).toBe(beforeChirho);
  });
  test('payload limit refuses a large update and preserves previous backup', () => {
    const storeChirho = storageChirho(), inputChirho = pageChirho(); writePageDraftsChirho(storeChirho, inputChirho);
    const beforeChirho = storeChirho.getItem(DRAFT_STORAGE_KEY_CHIRHO);
    const draftsChirho = Array.from({ length: 100 }, (_unusedChirho, indexChirho) => ({ ...inputChirho.draftsChirho[0], textChirho: 'x'.repeat(8000),
      sourceChirho: { ...tokenChirho(), idChirho: indexChirho + 1, keyChirho: `word-${indexChirho + 1}-chirho` } }));
    expect(() => writePageDraftsChirho(storeChirho, { ...inputChirho, draftsChirho })).toThrow('full');
    expect(storeChirho.getItem(DRAFT_STORAGE_KEY_CHIRHO)).toBe(beforeChirho);
  });
  test('malformed, unsupported, duplicate and prototype-shaped stored input is refused unchanged', () => {
    const storeChirho = storageChirho();
    for (const rawChirho of ['{broken', JSON.stringify({ versionChirho: 2, pagesChirho: [] }), JSON.stringify({ versionChirho: 1, pagesChirho: [pageChirho(), pageChirho()] }),
      JSON.stringify({ versionChirho: 1, pagesChirho: [{ ...pageChirho(), draftsChirho: [{ ...pageChirho().draftsChirho[0], sourceChirho: { ...tokenChirho(), keyChirho: '__proto__' } }] }] }),
      'x'.repeat(MAX_STORAGE_CHARS_CHIRHO + 1)]) {
      storeChirho.setItem(DRAFT_STORAGE_KEY_CHIRHO, rawChirho);
      expect(() => readPageDraftsChirho(storeChirho, 1)).toThrow();
      expect(() => writePageDraftsChirho(storeChirho, pageChirho())).toThrow();
      expect(storeChirho.getItem(DRAFT_STORAGE_KEY_CHIRHO)).toBe(rawChirho);
    }
  });
  test('denied and silently dropped browser writes never claim backup succeeded', () => {
    const deniedChirho: TabStorageChirho = { getItem: () => null, removeItem: () => {}, setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(() => writePageDraftsChirho(deniedChirho, pageChirho())).toThrow();
    expect(() => writePageDraftsChirho({ ...deniedChirho, setItem: () => {} }, pageChirho())).toThrow('did not retain');
  });
});
