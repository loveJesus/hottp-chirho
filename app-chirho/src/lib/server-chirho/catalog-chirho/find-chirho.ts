// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { and, asc, count, eq, gte, isNotNull, lt } from 'drizzle-orm';
import type { DbChirho } from '../db-chirho';
import { pagesChirho, scanlinesChirho, segmentsChirho } from '../schema-d1-chirho';

// Workflow: page-reading-workflow-chirho.md (Find a reading across the corpus).
// Reference search reads segments_chirho.canonical_reference_chirho only: the
// canonically matched spans, not full text. Both queries seek the partial index
// in reference-index-chirho.sql and are capped; a too-broad search is refused
// whole, never truncated silently.
export const FIND_SEGMENT_CAP_CHIRHO = 600;
export const FIND_PAGE_LIMIT_CHIRHO = 48;
export const FIND_QUERY_MAX_CHARS_CHIRHO = 80;

// Stored book names are the WLC loader's exact spellings (src-chirho/wlc-load-chirho.ts
// BOOKS_CHIRHO): Roman-numeral Samuel/Kings/Chronicles, "Psalms", "Song of Songs".
// Aliases include common English abbreviations, unaccented French names, and the
// Jerusalem-Bible sigla CTAT itself prints ("2 S 14,19; Mi 6,10 et Pr 18,24"):
// Jg, 1/2 S, 1/2 R, 1/2 Ch, Esd, Ne, Qo, Ct, Ez, Os, Ab, Mi, Ha, So, Ag, Za, Ml.
// Within that sigla system Esd names Ezra, which frees Ez for Ezechiel and
// resolves the earlier deliberate "ez" omission. Aliases are normalized again
// at map build, so accented spellings may appear here as typed.
const BOOK_ALIASES_CHIRHO: [string, string[]][] = [
  ['Genesis', ['gen', 'gn', 'genese']],
  ['Exodus', ['exod', 'ex', 'exode']],
  ['Leviticus', ['lev', 'lv', 'levitique']],
  ['Numbers', ['num', 'nm', 'nb', 'nombres']],
  ['Deuteronomy', ['deut', 'dt', 'deuteronome']],
  ['Joshua', ['josh', 'jos', 'josue']],
  ['Judges', ['judg', 'jdg', 'jgs', 'jg', 'juges']],
  ['I Samuel', ['1 samuel', '1samuel', '1 sam', '1sam', 'i sam', '1 s', '1s']],
  ['II Samuel', ['2 samuel', '2samuel', '2 sam', '2sam', 'ii sam', '2 s', '2s']],
  ['I Kings', ['1 kings', '1kings', '1 kgs', '1kgs', 'i kgs', '1 rois', '1 r', '1r']],
  ['II Kings', ['2 kings', '2kings', '2 kgs', '2kgs', 'ii kgs', '2 rois', '2 r', '2r']],
  ['Isaiah', ['isa', 'is', 'esaie', 'isaie']],
  ['Jeremiah', ['jer', 'jr', 'jeremie']],
  ['Ezekiel', ['ezek', 'eze', 'ez', 'ezechiel']],
  ['Hosea', ['hos', 'os', 'osee']],
  ['Joel', ['jl']],
  ['Amos', ['am']],
  ['Obadiah', ['obad', 'ob', 'ab', 'abdias']],
  ['Jonah', ['jon', 'jonas']],
  ['Micah', ['mic', 'mi', 'michee']],
  ['Nahum', ['nah', 'na', 'nahoum']],
  ['Habakkuk', ['hab', 'hb', 'ha', 'habacuc']],
  ['Zephaniah', ['zeph', 'zep', 'so', 'sophonie']],
  ['Haggai', ['hag', 'hg', 'ag', 'aggee']],
  ['Zechariah', ['zech', 'zec', 'za', 'zacharie']],
  ['Malachi', ['mal', 'ml', 'malachie']],
  ['Psalms', ['psalm', 'pss', 'psa', 'ps', 'psaumes', 'psaume']],
  ['Proverbs', ['prov', 'prv', 'pr', 'proverbes']],
  ['Job', ['jb']],
  ['Song of Songs', ['song of solomon', 'song', 'songs', 'sos', 'cant', 'canticles', 'ct', 'cantique', 'cantiques']],
  ['Ruth', ['ru', 'rt']],
  ['Lamentations', ['lam', 'lm']],
  ['Ecclesiastes', ['eccl', 'eccles', 'ecc', 'qoh', 'qohelet', 'qoheleth', 'qo', 'ecclesiaste']],
  ['Esther', ['esth', 'est']],
  ['Daniel', ['dan', 'dn']],
  ['Ezra', ['ezr', 'esd', 'esdras']],
  ['Nehemiah', ['neh', 'ne', 'nehemie']],
  ['I Chronicles', ['1 chronicles', '1chronicles', '1 chr', '1chr', '1 chron', 'i chr', '1 ch', '1ch', '1 chroniques']],
  ['II Chronicles', ['2 chronicles', '2chronicles', '2 chr', '2chr', '2 chron', 'ii chr', '2 ch', '2ch', '2 chroniques']],
];

// Lowercase, strip accents, turn digit separators (: , .) into ':', drop
// abbreviation periods, collapse whitespace. Separator conversion runs before
// period-stripping so "Ps. 22.17" keeps its chapter:verse split.
export function normalizeFindQueryChirho(textChirho: string): string {
  return textChirho.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/(\d)\s*[:,.]\s*(\d)/g, '$1:$2').replace(/\./g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const bookByAliasChirho = new Map<string, string>();
for (const [storedChirho, aliasesChirho] of BOOK_ALIASES_CHIRHO) {
  for (const aliasChirho of [storedChirho, ...aliasesChirho]) {
    bookByAliasChirho.set(normalizeFindQueryChirho(aliasChirho), storedChirho);
  }
}

export type FindQueryChirho =
  | { kindChirho: 'page-chirho'; volumeChirho: number; pageChirho: number }
  | { kindChirho: 'reference-chirho'; bookChirho: string; chapterChirho: number | null; verseChirho: number | null };

function boundedIntChirho(tokenChirho: string): number | null {
  if (!/^\d{1,4}$/.test(tokenChirho)) return null;
  const valueChirho = Number(tokenChirho);
  return valueChirho >= 1 ? valueChirho : null;
}

// "V:P" jumps to a volume's PDF page (never the printed folio, which front
// matter numbers differently — vol 3 PDF p151 prints folio cxxvi). Anything
// else is book [chapter[:verse]]. Null means unparseable; the page explains.
export function parseFindQueryChirho(rawChirho: string): FindQueryChirho | null {
  const normalizedChirho = normalizeFindQueryChirho(rawChirho);
  if (!normalizedChirho) return null;
  const pageJumpChirho = /^(\d{1,2}):(\d{1,4})$/.exec(normalizedChirho);
  if (pageJumpChirho) {
    const volumeChirho = Number(pageJumpChirho[1]);
    const pageChirho = Number(pageJumpChirho[2]);
    if (volumeChirho >= 1 && pageChirho >= 1) return { kindChirho: 'page-chirho', volumeChirho, pageChirho };
    return null;
  }
  const tokensChirho = normalizedChirho.split(' ');
  for (let bookTokensChirho = Math.min(tokensChirho.length, 4); bookTokensChirho >= 1; bookTokensChirho--) {
    const bookChirho = bookByAliasChirho.get(tokensChirho.slice(0, bookTokensChirho).join(' '));
    if (!bookChirho) continue;
    const restChirho = tokensChirho.slice(bookTokensChirho);
    if (restChirho.length === 0) return { kindChirho: 'reference-chirho', bookChirho, chapterChirho: null, verseChirho: null };
    if (restChirho.length === 1) {
      const pairChirho = /^(\d{1,4}):(\d{1,4})$/.exec(restChirho[0]!);
      if (pairChirho) {
        const chapterChirho = boundedIntChirho(pairChirho[1]!);
        const verseChirho = boundedIntChirho(pairChirho[2]!);
        return chapterChirho && verseChirho ? { kindChirho: 'reference-chirho', bookChirho, chapterChirho, verseChirho } : null;
      }
      const chapterChirho = boundedIntChirho(restChirho[0]!);
      return chapterChirho ? { kindChirho: 'reference-chirho', bookChirho, chapterChirho, verseChirho: null } : null;
    }
    if (restChirho.length === 2) {
      const chapterChirho = boundedIntChirho(restChirho[0]!);
      const verseChirho = boundedIntChirho(restChirho[1]!);
      return chapterChirho && verseChirho ? { kindChirho: 'reference-chirho', bookChirho, chapterChirho, verseChirho } : null;
    }
    return null;
  }
  return null;
}

export function referenceLabelChirho(queryChirho: Extract<FindQueryChirho, { kindChirho: 'reference-chirho' }>): string {
  const chapterPartChirho = queryChirho.chapterChirho === null ? '' : ` ${queryChirho.chapterChirho}`;
  const versePartChirho = queryChirho.verseChirho === null ? '' : `:${queryChirho.verseChirho}`;
  return `${queryChirho.bookChirho}${chapterPartChirho}${versePartChirho}`;
}

// Stored references read "Book C:V". A chapter range ["Book C:", "Book C;") is
// exact because ';' is the character after ':'; "Isaiah 81:1" sorts before
// "Isaiah 8:" and stays out. A book range ["Book ", "Book!") works the same way
// with '!', the character after ' '.
function referenceWhereChirho(queryChirho: Extract<FindQueryChirho, { kindChirho: 'reference-chirho' }>) {
  const columnChirho = segmentsChirho.canonicalReferenceChirho;
  if (queryChirho.verseChirho !== null) {
    return and(isNotNull(columnChirho), eq(columnChirho, referenceLabelChirho(queryChirho)));
  }
  if (queryChirho.chapterChirho !== null) {
    const lowerChirho = `${queryChirho.bookChirho} ${queryChirho.chapterChirho}:`;
    return and(isNotNull(columnChirho), gte(columnChirho, lowerChirho), lt(columnChirho, `${queryChirho.bookChirho} ${queryChirho.chapterChirho};`));
  }
  return and(isNotNull(columnChirho), gte(columnChirho, `${queryChirho.bookChirho} `), lt(columnChirho, `${queryChirho.bookChirho}!`));
}

export interface FindPageMatchChirho { volumeNumberChirho: number; pageNumberChirho: number; segmentCountChirho: number }
export type FindResultChirho =
  | { refusedChirho: string }
  | { refusedChirho: null; segmentCountChirho: number; pagesChirho: FindPageMatchChirho[] };

export async function findReferencePagesChirho(dbChirho: DbChirho, queryChirho: Extract<FindQueryChirho, { kindChirho: 'reference-chirho' }>): Promise<FindResultChirho> {
  const whereChirho = referenceWhereChirho(queryChirho);
  const countRowsChirho = await dbChirho.select({ segmentCountChirho: count() }).from(segmentsChirho).where(whereChirho);
  const segmentCountChirho = countRowsChirho[0]?.segmentCountChirho ?? 0;
  if (segmentCountChirho === 0) return { refusedChirho: null, segmentCountChirho: 0, pagesChirho: [] };
  if (segmentCountChirho > FIND_SEGMENT_CAP_CHIRHO) {
    return { refusedChirho: `${referenceLabelChirho(queryChirho)} matches ${segmentCountChirho} segments, more than the ${FIND_SEGMENT_CAP_CHIRHO} this search reads. Narrow to a chapter or a verse; nothing was listed.` };
  }
  const rowsChirho = await dbChirho.select({
    volumeNumberChirho: pagesChirho.volumeNumberChirho,
    pageNumberChirho: pagesChirho.pageNumberChirho,
    segmentCountChirho: count(),
  }).from(segmentsChirho)
    .innerJoin(scanlinesChirho, eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho))
    .innerJoin(pagesChirho, eq(pagesChirho.idChirho, scanlinesChirho.pageIdChirho))
    .where(whereChirho)
    .groupBy(pagesChirho.volumeNumberChirho, pagesChirho.pageNumberChirho)
    .orderBy(asc(pagesChirho.volumeNumberChirho), asc(pagesChirho.pageNumberChirho))
    .limit(FIND_PAGE_LIMIT_CHIRHO + 1);
  if (rowsChirho.length > FIND_PAGE_LIMIT_CHIRHO) {
    return { refusedChirho: `${referenceLabelChirho(queryChirho)} appears on more than the ${FIND_PAGE_LIMIT_CHIRHO} loaded pages this page lists. Nothing was listed; this search pinpoints readings — survey broadly in the volume browser.` };
  }
  return { refusedChirho: null, segmentCountChirho, pagesChirho: rowsChirho };
}

export async function pageExistsChirho(dbChirho: DbChirho, volumeChirho: number, pageChirho: number): Promise<boolean> {
  const rowsChirho = await dbChirho.select({ idChirho: pagesChirho.idChirho }).from(pagesChirho)
    .where(and(eq(pagesChirho.volumeNumberChirho, volumeChirho), eq(pagesChirho.pageNumberChirho, pageChirho))).limit(1);
  return rowsChirho.length > 0;
}
