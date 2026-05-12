// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verse-context tagger.
 *
 * Each Barthelemy entry begins with a Hebrew-Bible citation. For every
 * scanline of the pilot pages we parse out the book/chapter/verse context,
 * inheriting forward across lines so unindexed lines pick up the book hint
 * from the most recent explicit citation.
 *
 * Output: writes verse_context_chirho rows keyed by scanline_id_chirho into
 * spec-chirho/progress-chirho.sqlite.
 */

import { sqliteChirho } from "./db-chirho.ts";

const ABBREV_MAP_CHIRHO: Record<string, string> = {
  Gn: "Genesis", Ex: "Exodus", Lv: "Leviticus", Nb: "Numbers", Dt: "Deuteronomy",
  Jos: "Joshua", Jg: "Judges", Jdc: "Judges", Jud: "Judges",
  Ru: "Ruth",
  "1S": "I Samuel", "2S": "II Samuel",
  "1R": "I Kings", "2R": "II Kings",
  Is: "Isaiah", Jr: "Jeremiah", Ez: "Ezekiel",
  Os: "Hosea", Jl: "Joel", Am: "Amos", Ab: "Obadiah", Jon: "Jonah",
  Mi: "Micah", Na: "Nahum", Ha: "Habakkuk", So: "Zephaniah",
  Ag: "Haggai", Za: "Zechariah", Ml: "Malachi",
  Ps: "Psalms", Pr: "Proverbs", Jb: "Job", Job: "Job",
  Ct: "Song of Songs", Cant: "Song of Songs",
  Lm: "Lamentations", Qo: "Ecclesiastes", Eccl: "Ecclesiastes",
  Est: "Esther", Dn: "Daniel",
  Esd: "Ezra", Ezr: "Ezra", Ne: "Nehemiah",
  "1Ch": "I Chronicles", "2Ch": "II Chronicles",
};

const CITATION_INLINE_RE_CHIRHO =
  /(?:^|[\s(\[])([A-Z][a-z]{0,3}|1S|2S|1R|2R|1Ch|2Ch)\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?/;
const CITATION_LINE_START_RE_CHIRHO = /^(\d{1,3}),(\d{1,3})(?:\s*[A-Z]?)?\b/;

interface VerseContextChirho {
  bookChirho: string | null;
  chapterChirho: number | null;
  verseStartChirho: number | null;
  verseEndChirho: number | null;
  sourceChirho: "inline" | "line-start" | "inherited";
}

function parseCitationChirho(textChirho: string): VerseContextChirho | null {
  const lineStartChirho = textChirho.match(CITATION_LINE_START_RE_CHIRHO);
  if (lineStartChirho) {
    const chChirho = parseInt(lineStartChirho[1], 10);
    const vChirho = parseInt(lineStartChirho[2], 10);
    return {
      bookChirho: null,
      chapterChirho: chChirho,
      verseStartChirho: vChirho,
      verseEndChirho: vChirho,
      sourceChirho: "line-start",
    };
  }

  const matchChirho = textChirho.match(CITATION_INLINE_RE_CHIRHO);
  if (matchChirho) {
    const abbrevChirho = matchChirho[1];
    const bookChirho = ABBREV_MAP_CHIRHO[abbrevChirho] ?? null;
    if (!bookChirho) return null;
    return {
      bookChirho,
      chapterChirho: parseInt(matchChirho[2], 10),
      verseStartChirho: parseInt(matchChirho[3], 10),
      verseEndChirho: matchChirho[4]
        ? parseInt(matchChirho[4], 10)
        : parseInt(matchChirho[3], 10),
      sourceChirho: "inline",
    };
  }
  return null;
}

function ensureSchemaChirho(): void {
  sqliteChirho.exec(`
    CREATE TABLE IF NOT EXISTS verse_context_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      scanline_id_chirho INTEGER NOT NULL UNIQUE
        REFERENCES scanlines_chirho (id_chirho),
      book_chirho TEXT,
      chapter_chirho INTEGER,
      verse_start_chirho INTEGER,
      verse_end_chirho INTEGER,
      source_chirho TEXT,
      created_at_chirho TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS verse_context_book_chirho
      ON verse_context_chirho (book_chirho, chapter_chirho);
  `);
}

if (import.meta.main) {
  ensureSchemaChirho();

  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "1",
    10
  );
  const pageRangeChirho =
    argsChirho.find((aChirho) => aChirho.startsWith("--pages="))?.split("=")[1] ?? "148-152";
  const [pStartChirho, pEndChirho] = pageRangeChirho.split("-").map((nChirho) => parseInt(nChirho, 10));
  const pagesChirho: number[] = [];
  for (let pChirho = pStartChirho; pChirho <= pEndChirho; pChirho++) pagesChirho.push(pChirho);

  const placeholdersChirho = pagesChirho.map(() => "?").join(",");
  type RowChirho = {
    page_number_chirho: number;
    scanline_id_chirho: number;
    line_index_chirho: number;
    line_text_chirho: string | null;
  };
  const rowsChirho = sqliteChirho
    .prepare(
      `SELECT p.page_number_chirho   AS page_number_chirho,
              sl.id_chirho           AS scanline_id_chirho,
              sl.line_index_chirho   AS line_index_chirho,
              sl.pdftotext_chirho    AS line_text_chirho
         FROM scanlines_chirho sl
         JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
        WHERE p.volume_number_chirho = ?
          AND p.page_number_chirho IN (${placeholdersChirho})
        ORDER BY p.page_number_chirho, sl.line_index_chirho`
    )
    .all(volChirho, ...pagesChirho) as RowChirho[];

  const insertChirho = sqliteChirho.prepare(
    `INSERT OR REPLACE INTO verse_context_chirho
       (scanline_id_chirho, book_chirho, chapter_chirho, verse_start_chirho,
        verse_end_chirho, source_chirho)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  let currentBookChirho: string | null = null;
  let currentChapterChirho: number | null = null;
  let currentVerseStartChirho: number | null = null;
  let currentVerseEndChirho: number | null = null;
  let inlineHitsChirho = 0;
  let lineStartHitsChirho = 0;
  let inheritedChirho = 0;
  let nullsChirho = 0;

  for (const rChirho of rowsChirho) {
    const textChirho = (rChirho.line_text_chirho ?? "").trim();
    const parsedChirho = textChirho ? parseCitationChirho(textChirho) : null;

    let bookChirho = parsedChirho?.bookChirho ?? null;
    let chapterChirho = parsedChirho?.chapterChirho ?? null;
    let verseStartChirho = parsedChirho?.verseStartChirho ?? null;
    let verseEndChirho = parsedChirho?.verseEndChirho ?? null;
    let sourceChirho: string = parsedChirho?.sourceChirho ?? "none";

    if (parsedChirho?.sourceChirho === "inline") {
      currentBookChirho = bookChirho;
      currentChapterChirho = chapterChirho;
      currentVerseStartChirho = verseStartChirho;
      currentVerseEndChirho = verseEndChirho;
      inlineHitsChirho++;
    } else if (parsedChirho?.sourceChirho === "line-start") {
      bookChirho = currentBookChirho;
      if (currentBookChirho) {
        sourceChirho = "line-start";
        currentChapterChirho = chapterChirho;
        currentVerseStartChirho = verseStartChirho;
        currentVerseEndChirho = verseEndChirho;
      } else {
        sourceChirho = "line-start-orphan";
      }
      lineStartHitsChirho++;
    } else if (currentBookChirho && currentChapterChirho) {
      bookChirho = currentBookChirho;
      chapterChirho = currentChapterChirho;
      verseStartChirho = currentVerseStartChirho;
      verseEndChirho = currentVerseEndChirho;
      sourceChirho = "inherited";
      inheritedChirho++;
    } else {
      nullsChirho++;
    }

    insertChirho.run(
      rChirho.scanline_id_chirho,
      bookChirho,
      chapterChirho,
      verseStartChirho,
      verseEndChirho,
      sourceChirho
    );
  }

  console.log(
    `[verse-context] vol ${volChirho} pp${pStartChirho}-${pEndChirho}: ` +
    `${rowsChirho.length} lines tagged ` +
    `(inline=${inlineHitsChirho}, line-start=${lineStartHitsChirho}, inherited=${inheritedChirho}, null=${nullsChirho})`
  );
}
