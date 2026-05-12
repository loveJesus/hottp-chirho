// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Westminster Leningrad Codex / Miqra-according-to-the-Masorah loader.
 *
 * Downloads each book of the Hebrew Bible from Sefaria's v3 API as the
 * canonical Hebrew text with full nikkud and cantillation marks, then
 * persists it to a local SQLite (`spec-chirho/wlc-chirho.sqlite`) indexed by
 * (book, chapter, verse) for fast matching against Barthélemy quotes.
 */

import { Database } from "bun:sqlite";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

import { SPEC_DIR_CHIRHO } from "./config-chirho.ts";

const WLC_DB_PATH_CHIRHO = join(SPEC_DIR_CHIRHO, "wlc-chirho.sqlite");
const SEFARIA_API_BASE_CHIRHO = "https://www.sefaria.org/api/v3/texts";
const SEFARIA_VERSION_CHIRHO = "hebrew|Miqra according to the Masorah";

const BOOKS_CHIRHO: string[] = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "I Samuel", "II Samuel", "I Kings", "II Kings",
  "Isaiah", "Jeremiah", "Ezekiel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum",
  "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Psalms", "Proverbs", "Job",
  "Song of Songs", "Ruth", "Lamentations", "Ecclesiastes", "Esther",
  "Daniel", "Ezra", "Nehemiah", "I Chronicles", "II Chronicles",
];

const CANTILLATION_RE_CHIRHO = /[֑-ֽֿ֯׀׃׆]/g;
const HTML_TAG_RE_CHIRHO = /<[^>]+>/g;
const KETIB_RE_CHIRHO = /\([^)]*\)\s*\[([^\]]+)\]/g;
const PUNCT_RE_CHIRHO = /[־׀׃׆׳״]/g;

function normalizeForMatchChirho(textChirho: string): string {
  let outChirho = textChirho.replace(HTML_TAG_RE_CHIRHO, "");
  outChirho = outChirho.replace(KETIB_RE_CHIRHO, "$1");
  outChirho = outChirho.replace(CANTILLATION_RE_CHIRHO, "");
  outChirho = outChirho.replace(PUNCT_RE_CHIRHO, "");
  outChirho = outChirho.replace(/\s+/g, " ").trim();
  return outChirho;
}

function consonantsOnlyChirho(textChirho: string): string {
  let outChirho = textChirho.replace(HTML_TAG_RE_CHIRHO, "");
  outChirho = outChirho.replace(KETIB_RE_CHIRHO, "$1");
  outChirho = outChirho.replace(/[֑-ׇ]/g, "");
  outChirho = outChirho.replace(/\s+/g, " ").trim();
  return outChirho;
}

async function fetchBookChirho(bookChirho: string): Promise<string[][] | null> {
  const urlChirho =
    `${SEFARIA_API_BASE_CHIRHO}/${encodeURIComponent(bookChirho)}` +
    `?version=${encodeURIComponent(SEFARIA_VERSION_CHIRHO)}&return_format=text_only`;
  const respChirho = await fetch(urlChirho, {
    headers: { Accept: "application/json" },
  });
  if (!respChirho.ok) {
    console.error(`[wlc-load] ${bookChirho}: HTTP ${respChirho.status}`);
    return null;
  }
  const dataChirho = (await respChirho.json()) as {
    versions: Array<{ text: unknown }>;
  };
  const textChirho = dataChirho.versions?.[0]?.text;
  if (!Array.isArray(textChirho)) {
    console.error(`[wlc-load] ${bookChirho}: unexpected text shape`);
    return null;
  }
  return textChirho as string[][];
}

function ensureSchemaChirho(dbChirho: Database) {
  dbChirho.exec(`
    CREATE TABLE IF NOT EXISTS verses_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      book_chirho TEXT NOT NULL,
      chapter_chirho INTEGER NOT NULL,
      verse_chirho INTEGER NOT NULL,
      raw_text_chirho TEXT NOT NULL,
      normalized_text_chirho TEXT NOT NULL,
      consonants_only_chirho TEXT NOT NULL,
      UNIQUE (book_chirho, chapter_chirho, verse_chirho)
    );
    CREATE INDEX IF NOT EXISTS verses_book_chap_chirho
      ON verses_chirho (book_chirho, chapter_chirho);
    CREATE INDEX IF NOT EXISTS verses_consonants_chirho
      ON verses_chirho (consonants_only_chirho);

    CREATE TABLE IF NOT EXISTS words_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      verse_id_chirho INTEGER NOT NULL REFERENCES verses_chirho (id_chirho),
      word_index_chirho INTEGER NOT NULL,
      raw_word_chirho TEXT NOT NULL,
      normalized_word_chirho TEXT NOT NULL,
      consonants_only_chirho TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS words_verse_chirho ON words_chirho (verse_id_chirho);
    CREATE INDEX IF NOT EXISTS words_consonants_chirho
      ON words_chirho (consonants_only_chirho);
    CREATE INDEX IF NOT EXISTS words_normalized_chirho
      ON words_chirho (normalized_word_chirho);
  `);
}

if (import.meta.main) {
  if (!existsSync(SPEC_DIR_CHIRHO)) mkdirSync(SPEC_DIR_CHIRHO, { recursive: true });
  const dbChirho = new Database(WLC_DB_PATH_CHIRHO);
  ensureSchemaChirho(dbChirho);

  const argsChirho = process.argv.slice(2);
  const onlyBookChirho =
    argsChirho.find((aChirho) => aChirho.startsWith("--book="))?.split("=")[1] ?? null;
  const booksChirho = onlyBookChirho ? [onlyBookChirho] : BOOKS_CHIRHO;

  const insertVerseChirho = dbChirho.prepare(
    `INSERT OR REPLACE INTO verses_chirho
       (book_chirho, chapter_chirho, verse_chirho, raw_text_chirho,
        normalized_text_chirho, consonants_only_chirho)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const deleteWordsChirho = dbChirho.prepare(
    `DELETE FROM words_chirho WHERE verse_id_chirho = ?`
  );
  const insertWordChirho = dbChirho.prepare(
    `INSERT INTO words_chirho
       (verse_id_chirho, word_index_chirho, raw_word_chirho,
        normalized_word_chirho, consonants_only_chirho)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (const bookChirho of booksChirho) {
    const chaptersChirho = await fetchBookChirho(bookChirho);
    if (!chaptersChirho) continue;
    let verseCountChirho = 0;
    let wordCountChirho = 0;
    dbChirho.transaction(() => {
      for (let chIdxChirho = 0; chIdxChirho < chaptersChirho.length; chIdxChirho++) {
        const versesChirho = chaptersChirho[chIdxChirho];
        if (!Array.isArray(versesChirho)) continue;
        for (let vIdxChirho = 0; vIdxChirho < versesChirho.length; vIdxChirho++) {
          const rawChirho = String(versesChirho[vIdxChirho] ?? "");
          if (!rawChirho.trim()) continue;
          const normChirho = normalizeForMatchChirho(rawChirho);
          const consChirho = consonantsOnlyChirho(rawChirho);
          const infoChirho = insertVerseChirho.run(
            bookChirho,
            chIdxChirho + 1,
            vIdxChirho + 1,
            rawChirho,
            normChirho,
            consChirho
          );
          const verseIdChirho = Number(infoChirho.lastInsertRowid);
          deleteWordsChirho.run(verseIdChirho);
          const tokensChirho = normChirho.split(/\s+/).filter((tChirho) => tChirho);
          for (let wIdxChirho = 0; wIdxChirho < tokensChirho.length; wIdxChirho++) {
            const wRawChirho = tokensChirho[wIdxChirho];
            insertWordChirho.run(
              verseIdChirho,
              wIdxChirho,
              wRawChirho,
              wRawChirho,
              consonantsOnlyChirho(wRawChirho)
            );
            wordCountChirho++;
          }
          verseCountChirho++;
        }
      }
    })();
    console.log(
      `[wlc-load] ${bookChirho}: ${chaptersChirho.length} chapters, ${verseCountChirho} verses, ${wordCountChirho} words`
    );
  }
  dbChirho.close();
  console.log(`[wlc-load] Done → ${WLC_DB_PATH_CHIRHO}`);
}
