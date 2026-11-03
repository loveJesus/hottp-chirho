// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import {
  normalizeFindQueryChirho, parseFindQueryChirho, referenceLabelChirho,
} from '../../../app-chirho/src/lib/server-chirho/catalog-chirho/find-chirho';

describe('find-query normalization', () => {
  test('lowercases, strips accents and abbreviation periods, keeps digit separators', () => {
    expect(normalizeFindQueryChirho('Ps.  22.17')).toBe('ps 22:17');
    expect(normalizeFindQueryChirho('Ésaïe 8,12')).toBe('esaie 8:12');
    expect(normalizeFindQueryChirho('  II   Samuel  7 : 4 ')).toBe('ii samuel 7:4');
  });
});

describe('volume:page jumps', () => {
  test('parses V:P with colon, comma or period separators', () => {
    expect(parseFindQueryChirho('3:151')).toEqual({ kindChirho: 'page-chirho', volumeChirho: 3, pageChirho: 151 });
    expect(parseFindQueryChirho('3,151')).toEqual({ kindChirho: 'page-chirho', volumeChirho: 3, pageChirho: 151 });
    expect(parseFindQueryChirho('5.148')).toEqual({ kindChirho: 'page-chirho', volumeChirho: 5, pageChirho: 148 });
  });
  test('rejects zero positions and malformed jumps', () => {
    expect(parseFindQueryChirho('0:5')).toBeNull();
    expect(parseFindQueryChirho('3:0')).toBeNull();
    expect(parseFindQueryChirho('1:2:3')).toBeNull();
  });
});

describe('biblical reference parsing against the stored WLC book names', () => {
  test('full names resolve case- and accent-insensitively', () => {
    expect(parseFindQueryChirho('Isaiah 8:12')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Isaiah', chapterChirho: 8, verseChirho: 12 });
    expect(parseFindQueryChirho('ISAIAH 8:12')?.kindChirho).toBe('reference-chirho');
    expect(parseFindQueryChirho('Ésaïe 8,12')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Isaiah', chapterChirho: 8, verseChirho: 12 });
  });
  test('numbered books normalize to the stored Roman-numeral spellings', () => {
    const expectedChirho = { kindChirho: 'reference-chirho', bookChirho: 'II Samuel', chapterChirho: 7, verseChirho: 4 };
    expect(parseFindQueryChirho('II Samuel 7:4')).toEqual(expectedChirho);
    expect(parseFindQueryChirho('2 Sam. 7,4')).toEqual(expectedChirho);
    expect(parseFindQueryChirho('2sam 7 4')).toEqual(expectedChirho);
  });
  test('French names and common abbreviations map to stored names', () => {
    expect(parseFindQueryChirho('Psaumes 22,17')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Psalms', chapterChirho: 22, verseChirho: 17 });
    expect(parseFindQueryChirho('qohelet 3')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Ecclesiastes', chapterChirho: 3, verseChirho: null });
    expect(parseFindQueryChirho('esdras 4:7')?.kindChirho === 'reference-chirho' && parseFindQueryChirho('esdras 4:7')).toMatchObject({ bookChirho: 'Ezra' });
    expect(parseFindQueryChirho('song 2:4')).toMatchObject({ bookChirho: 'Song of Songs', chapterChirho: 2, verseChirho: 4 });
    expect(parseFindQueryChirho('gn 12:3')).toMatchObject({ bookChirho: 'Genesis' });
  });
  test('book-only and chapter-only granularities parse', () => {
    expect(parseFindQueryChirho('Job')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Job', chapterChirho: null, verseChirho: null });
    expect(parseFindQueryChirho('Song of Songs')).toMatchObject({ bookChirho: 'Song of Songs', chapterChirho: null });
    expect(parseFindQueryChirho('isaiah 8')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Isaiah', chapterChirho: 8, verseChirho: null });
  });
  test('unrecognized, ambiguous and over-specified inputs return null, not a guess', () => {
    expect(parseFindQueryChirho('')).toBeNull();
    expect(parseFindQueryChirho('   ')).toBeNull();
    expect(parseFindQueryChirho('hello world 5')).toBeNull();
    expect(parseFindQueryChirho('isaiah 8:12-14')).toBeNull();
    expect(parseFindQueryChirho('isaiah 8 12 14')).toBeNull();
    expect(parseFindQueryChirho('isaiah 0')).toBeNull();
  });
});

describe('CTAT Jerusalem-Bible sigla, the abbreviations the volumes print', () => {
  test("the printed trio parses: '2 S 14,19; Mi 6,10 et Pr 18,24'", () => {
    expect(parseFindQueryChirho('2 S 14,19')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'II Samuel', chapterChirho: 14, verseChirho: 19 });
    expect(parseFindQueryChirho('Mi 6,10')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Micah', chapterChirho: 6, verseChirho: 10 });
    expect(parseFindQueryChirho('Pr 18,24')).toEqual({ kindChirho: 'reference-chirho', bookChirho: 'Proverbs', chapterChirho: 18, verseChirho: 24 });
  });
  test('Esd names Ezra within the sigla system, freeing Ez for Ezekiel', () => {
    expect(parseFindQueryChirho('Esd 3')).toMatchObject({ bookChirho: 'Ezra', chapterChirho: 3 });
    expect(parseFindQueryChirho('Ez 5')).toMatchObject({ bookChirho: 'Ezekiel', chapterChirho: 5 });
  });
  test('every protestant-canon JB siglum resolves to its own stored book', () => {
    const siglaChirho: [string, string][] = [
      ['Gn', 'Genesis'], ['Ex', 'Exodus'], ['Lv', 'Leviticus'], ['Nb', 'Numbers'],
      ['Dt', 'Deuteronomy'], ['Jos', 'Joshua'], ['Jg', 'Judges'], ['Rt', 'Ruth'],
      ['1 S', 'I Samuel'], ['2 S', 'II Samuel'], ['1 R', 'I Kings'], ['2 R', 'II Kings'],
      ['1 Ch', 'I Chronicles'], ['2 Ch', 'II Chronicles'], ['Esd', 'Ezra'], ['Ne', 'Nehemiah'],
      ['Est', 'Esther'], ['Jb', 'Job'], ['Ps', 'Psalms'], ['Pr', 'Proverbs'],
      ['Qo', 'Ecclesiastes'], ['Ct', 'Song of Songs'], ['Is', 'Isaiah'], ['Jr', 'Jeremiah'],
      ['Lm', 'Lamentations'], ['Ez', 'Ezekiel'], ['Dn', 'Daniel'], ['Os', 'Hosea'],
      ['Jl', 'Joel'], ['Am', 'Amos'], ['Ab', 'Obadiah'], ['Jon', 'Jonah'],
      ['Mi', 'Micah'], ['Na', 'Nahum'], ['Ha', 'Habakkuk'], ['So', 'Zephaniah'],
      ['Ag', 'Haggai'], ['Za', 'Zechariah'], ['Ml', 'Malachi'],
    ];
    expect(siglaChirho.length).toBe(39);
    expect(new Set(siglaChirho.map(([, bookChirho]) => bookChirho)).size).toBe(39);
    for (const [siglumChirho, bookChirho] of siglaChirho) {
      expect(parseFindQueryChirho(siglumChirho)).toEqual({ kindChirho: 'reference-chirho', bookChirho, chapterChirho: null, verseChirho: null });
    }
    expect(parseFindQueryChirho('1ch 29')).toMatchObject({ bookChirho: 'I Chronicles', chapterChirho: 29 });
    expect(parseFindQueryChirho('2s 22:31')).toMatchObject({ bookChirho: 'II Samuel', chapterChirho: 22, verseChirho: 31 });
  });
});

describe('reference labels and range ordering facts the SQL bounds rely on', () => {
  test('labels render Book, Book C and Book C:V', () => {
    expect(referenceLabelChirho({ kindChirho: 'reference-chirho', bookChirho: 'Job', chapterChirho: null, verseChirho: null })).toBe('Job');
    expect(referenceLabelChirho({ kindChirho: 'reference-chirho', bookChirho: 'Isaiah', chapterChirho: 8, verseChirho: null })).toBe('Isaiah 8');
    expect(referenceLabelChirho({ kindChirho: 'reference-chirho', bookChirho: 'Isaiah', chapterChirho: 8, verseChirho: 12 })).toBe('Isaiah 8:12');
  });
  test('chapter range [Book C:, Book C;) excludes same-prefix higher chapters', () => {
    expect('Isaiah 8:12' >= 'Isaiah 8:').toBe(true);
    expect('Isaiah 8:12' < 'Isaiah 8;').toBe(true);
    // "Isaiah 81:1" must sort BELOW the chapter-8 lower bound: '1' < ':'.
    expect('Isaiah 81:1' < 'Isaiah 8:').toBe(true);
  });
  test('book range [Book␣, Book!) spans every chapter:verse and nothing else', () => {
    expect('Isaiah 1:1' >= 'Isaiah ').toBe(true);
    expect('Isaiah 66:24' < 'Isaiah!').toBe(true);
    expect('Isaiahx' < 'Isaiah ' || 'Isaiahx' >= 'Isaiah!').toBe(true);
  });
});
