// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import { matchingReadingsChirho, nextMatchChirho, linkedReadingChirho, readingLinkChirho, readingTargetChirho } from '../../../app-chirho/src/lib/page-reader-chirho/navigation-chirho';
import { returnPathChirho } from '../../../app-chirho/src/lib/server-chirho/review-chirho/session-chirho';
import type { ReadingTokenChirho } from '../../../app-chirho/src/lib/page-reader-chirho/model-chirho';

const tokenChirho: ReadingTokenChirho = { keyChirho: 'word-23-chirho', idChirho: 23, kindChirho: 'word-chirho', scanlineIdChirho: 8, lineIndexChirho: 4,
  textChirho: 'יְהוֹשֻׁעַ', scriptChirho: 'hebrew-chirho', confirmedChirho: false, flaggedChirho: false,
  boxChirho: { xChirho: 10, yChirho: 20, widthChirho: 40, heightChirho: 30 } };
const pageUrlChirho = 'https://hottp.invalid/volumes-chirho/3/pages-chirho/151';

describe('page-local navigation without state mutation', () => {
  test('matches stored multilingual readings without case, accents, pointing or bidi marks', () => {
    const tokensChirho = [tokenChirho, { ...tokenChirho, keyChirho: 'word-24-chirho', textChirho: 'Écriture' }, { ...tokenChirho, keyChirho: 'word-25-chirho', textChirho: 'ἄνταρσις' }];
    expect(matchingReadingsChirho(tokensChirho, '\u200fיהושע')).toEqual([tokenChirho]);
    expect(matchingReadingsChirho(tokensChirho, 'E\u0301CRIT')).toEqual([tokensChirho[1]!]);
    expect(matchingReadingsChirho(tokensChirho, 'ανταρσις')).toEqual([tokensChirho[2]!]);
    expect(matchingReadingsChirho(tokensChirho, ' \u05b0 ')).toEqual([]);
    expect(matchingReadingsChirho(tokensChirho, 'absent')).toEqual([]);
    expect(tokenChirho.textChirho).toBe('יְהוֹשֻׁעַ');
  });
  test('match navigation wraps in both directions without selecting nonmatches', () => {
    const otherChirho = { ...tokenChirho, keyChirho: 'segment-99-chirho' };
    const matchesChirho = [tokenChirho, otherChirho];
    expect(nextMatchChirho(matchesChirho, null, 1)).toBe(tokenChirho);
    expect(nextMatchChirho(matchesChirho, null, -1)).toBe(otherChirho);
    expect(nextMatchChirho(matchesChirho, otherChirho.keyChirho, 1)).toBe(tokenChirho);
    expect(nextMatchChirho(matchesChirho, tokenChirho.keyChirho, -1)).toBe(otherChirho);
    expect(nextMatchChirho([], null, 1)).toBeNull();
  });
  test('links include identity and a source digest, strip queries/credentials and do not certify a reading', async () => {
    const linkChirho = await readingLinkChirho(pageUrlChirho.replace('https://', 'https://private:secret@') + '?draft-chirho=PRIVATE&token-chirho=SECRET', tokenChirho);
    expect(new URL(linkChirho).search).toBe('');
    expect(linkChirho).not.toContain('PRIVATE'); expect(linkChirho).not.toContain('secret');
    expect(linkChirho).not.toContain(tokenChirho.textChirho);
    expect(await linkedReadingChirho(linkChirho, [tokenChirho])).toBe(tokenChirho);
    expect(await linkedReadingChirho(linkChirho, [{ ...tokenChirho, confirmedChirho: true, reviewStateChirho: 'recorded-chirho' }])).not.toBeNull();
    expect(returnPathChirho(new URL(linkChirho).pathname + new URL(linkChirho).hash)).toBe(new URL(linkChirho).pathname + new URL(linkChirho).hash);
  });
  test('missing/reseeded/changed records and a different page never resolve to a substitute', async () => {
    const linkChirho = await readingLinkChirho(pageUrlChirho, tokenChirho);
    expect(await linkedReadingChirho(linkChirho, [])).toBeNull();
    for (const changedChirho of [{ ...tokenChirho, textChirho: 'other' }, { ...tokenChirho, scriptChirho: 'greek-chirho' },
      { ...tokenChirho, lineIndexChirho: 5 }, { ...tokenChirho, boxChirho: { ...tokenChirho.boxChirho!, xChirho: 11 } },
      { ...tokenChirho, keyChirho: 'word-99-chirho' }]) expect(await linkedReadingChirho(linkChirho, [changedChirho])).toBeNull();
    expect(await linkedReadingChirho(linkChirho.replace('/151#', '/152#'), [tokenChirho])).toBeNull();
  });
  test('malformed targets and return paths fail closed, including repeated hash delimiters', async () => {
    const linkChirho = new URL(await readingLinkChirho(pageUrlChirho, tokenChirho));
    for (const hashChirho of ['#reading-chirho=word-23-chirho', linkChirho.hash + '#evil', linkChirho.hash + '&redirect=https://evil.invalid', linkChirho.hash.replace('23', '9007199254740993')]) {
      expect(readingTargetChirho(hashChirho)).toBeNull();
      expect(returnPathChirho(linkChirho.pathname + hashChirho)).toBe('/');
    }
    for (const pathChirho of ['//evil.invalid' + linkChirho.hash, '/volumes-chirho/3' + linkChirho.hash, linkChirho.pathname + '?item=evil' + linkChirho.hash, linkChirho.pathname + '#', '/volumes-chirho/3/pages-chirho/%31' + linkChirho.hash]) expect(returnPathChirho(pathChirho)).toBe('/');
  });
});
