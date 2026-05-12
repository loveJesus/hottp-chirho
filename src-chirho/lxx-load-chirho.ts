// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { Database as BunDbChirho } from "bun:sqlite";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

import { SPEC_DIR_CHIRHO } from "./config-chirho.ts";

const LXX_DB_PATH_CHIRHO = join(SPEC_DIR_CHIRHO, "lxx-chirho.sqlite");
const SWETE_BASE_CHIRHO = "https://raw.githubusercontent.com/nathans/lxx-swete/master/data";

const BOOKS_CHIRHO = [
  { lxxFileChirho: "01.Genesis.txt", canonicalChirho: "Genesis" },
  { lxxFileChirho: "02.Exodus.txt", canonicalChirho: "Exodus" },
  { lxxFileChirho: "03.Leviticus.txt", canonicalChirho: "Leviticus" },
  { lxxFileChirho: "04.Numeri.txt", canonicalChirho: "Numbers" },
  { lxxFileChirho: "05.Deuteronomium.txt", canonicalChirho: "Deuteronomy" },
  { lxxFileChirho: "06.Josue.txt", canonicalChirho: "Joshua" },
  { lxxFileChirho: "08.Judices.txt", canonicalChirho: "Judges" },
  { lxxFileChirho: "10.Ruth.txt", canonicalChirho: "Ruth" },
  { lxxFileChirho: "11.Regnorum_I.txt", canonicalChirho: "I Samuel" },
  { lxxFileChirho: "12.Regnorum_II.txt", canonicalChirho: "II Samuel" },
  { lxxFileChirho: "13.Regnorum_III.txt", canonicalChirho: "I Kings" },
  { lxxFileChirho: "14.Regnorum_IV.txt", canonicalChirho: "II Kings" },
  { lxxFileChirho: "15.Paralipomenon_I.txt", canonicalChirho: "I Chronicles" },
  { lxxFileChirho: "16.Paralipomenon_II.txt", canonicalChirho: "II Chronicles" },
  { lxxFileChirho: "19.Esther.txt", canonicalChirho: "Esther" },
  { lxxFileChirho: "32.Job.txt", canonicalChirho: "Job" },
  { lxxFileChirho: "27.Psalmi.txt", canonicalChirho: "Psalms" },
  { lxxFileChirho: "29.Proverbia.txt", canonicalChirho: "Proverbs" },
  { lxxFileChirho: "31.Canticum.txt", canonicalChirho: "Song of Songs" },
  { lxxFileChirho: "36.Osee.txt", canonicalChirho: "Hosea" },
  { lxxFileChirho: "37.Amos.txt", canonicalChirho: "Amos" },
  { lxxFileChirho: "38.Michaeas.txt", canonicalChirho: "Micah" },
  { lxxFileChirho: "39.Joel.txt", canonicalChirho: "Joel" },
  { lxxFileChirho: "40.Abdias.txt", canonicalChirho: "Obadiah" },
  { lxxFileChirho: "41.Jonas.txt", canonicalChirho: "Jonah" },
  { lxxFileChirho: "42.Nahum.txt", canonicalChirho: "Nahum" },
  { lxxFileChirho: "43.Habacuc.txt", canonicalChirho: "Habakkuk" },
  { lxxFileChirho: "44.Sophonias.txt", canonicalChirho: "Zephaniah" },
  { lxxFileChirho: "45.Aggaeus.txt", canonicalChirho: "Haggai" },
  { lxxFileChirho: "46.Zacharias.txt", canonicalChirho: "Zechariah" },
  { lxxFileChirho: "47.Malachias.txt", canonicalChirho: "Malachi" },
  { lxxFileChirho: "48.Isaias.txt", canonicalChirho: "Isaiah" },
  { lxxFileChirho: "49.Jeremias.txt", canonicalChirho: "Jeremiah" },
  { lxxFileChirho: "51.Threni_seu_Lamentationes.txt", canonicalChirho: "Lamentations" },
  { lxxFileChirho: "53.Ezechiel.txt", canonicalChirho: "Ezekiel" },
  { lxxFileChirho: "56.Daniel_translatio_Graeca.txt", canonicalChirho: "Daniel" },
  { lxxFileChirho: "18.Esdras_B.txt", canonicalChirho: "Ezra" },
  { lxxFileChirho: "18.Esdras_B.txt", canonicalChirho: "Nehemiah" },
];

const POLYTONIC_TO_BARE_CHIRHO = /[̀-ͯ҃-҉᪰-᫿᷀-᷿⃐-⃿︠-︯]/g;

function stripDiacriticsChirho(textChirho) {
  return textChirho.normalize("NFD").replace(POLYTONIC_TO_BARE_CHIRHO, "").normalize("NFC");
}

function lowercaseChirho(textChirho) {
  return textChirho.toLowerCase();
}

function bareChirho(textChirho) {
  return lowercaseChirho(stripDiacriticsChirho(textChirho));
}

async function fetchBookChirho(lxxFileChirho) {
  const urlChirho = SWETE_BASE_CHIRHO + "/" + lxxFileChirho;
  const respChirho = await fetch(urlChirho);
  if (!respChirho.ok) {
    console.error("[lxx-load] " + lxxFileChirho + ": HTTP " + respChirho.status);
    return null;
  }
  return await respChirho.text();
}

function ensureSchemaChirho(dbChirho) {
  dbChirho.exec(
    "CREATE TABLE IF NOT EXISTS lxx_verses_chirho (id_chirho INTEGER PRIMARY KEY AUTOINCREMENT, book_chirho TEXT NOT NULL, chapter_chirho INTEGER NOT NULL, verse_chirho INTEGER NOT NULL, raw_text_chirho TEXT NOT NULL, bare_text_chirho TEXT NOT NULL, UNIQUE (book_chirho, chapter_chirho, verse_chirho)); CREATE INDEX IF NOT EXISTS lxx_verses_book_chap_chirho ON lxx_verses_chirho (book_chirho, chapter_chirho); CREATE INDEX IF NOT EXISTS lxx_verses_bare_chirho ON lxx_verses_chirho (bare_text_chirho); CREATE TABLE IF NOT EXISTS lxx_words_chirho (id_chirho INTEGER PRIMARY KEY AUTOINCREMENT, verse_id_chirho INTEGER NOT NULL REFERENCES lxx_verses_chirho (id_chirho), word_index_chirho INTEGER NOT NULL, raw_word_chirho TEXT NOT NULL, bare_word_chirho TEXT NOT NULL); CREATE INDEX IF NOT EXISTS lxx_words_verse_chirho ON lxx_words_chirho (verse_id_chirho); CREATE INDEX IF NOT EXISTS lxx_words_bare_chirho ON lxx_words_chirho (bare_word_chirho);"
  );
}

if (import.meta.main) {
  if (!existsSync(SPEC_DIR_CHIRHO)) mkdirSync(SPEC_DIR_CHIRHO, { recursive: true });
  const dbChirho = new BunDbChirho(LXX_DB_PATH_CHIRHO);
  ensureSchemaChirho(dbChirho);

  const argsChirho = process.argv.slice(2);
  const onlyBookChirho = argsChirho.find((aChirho) => aChirho.startsWith("--book="))?.split("=")[1] ?? null;
  const booksChirho = onlyBookChirho ? BOOKS_CHIRHO.filter((bChirho) => bChirho.canonicalChirho === onlyBookChirho) : BOOKS_CHIRHO;

  const insertVerseChirho = dbChirho.prepare(
    "INSERT OR REPLACE INTO lxx_verses_chirho (book_chirho, chapter_chirho, verse_chirho, raw_text_chirho, bare_text_chirho) VALUES (?, ?, ?, ?, ?)"
  );
  const deleteWordsChirho = dbChirho.prepare("DELETE FROM lxx_words_chirho WHERE verse_id_chirho = ?");
  const insertWordChirho = dbChirho.prepare(
    "INSERT INTO lxx_words_chirho (verse_id_chirho, word_index_chirho, raw_word_chirho, bare_word_chirho) VALUES (?, ?, ?, ?)"
  );

  for (const bChirho of booksChirho) {
    const contentChirho = await fetchBookChirho(bChirho.lxxFileChirho);
    if (!contentChirho) continue;
    const wordsByVerseChirho = new Map();
    for (const lineChirho of contentChirho.split("\n")) {
      const trimmedChirho = lineChirho.trim();
      if (!trimmedChirho) continue;
      const matchChirho = trimmedChirho.match(/^([\d]+)\.([\d]+)\.([\d]+)\s+(.+)$/);
      if (!matchChirho) continue;
      const chChirho = parseInt(matchChirho[2], 10);
      const vChirho = parseInt(matchChirho[3], 10);
      const wordChirho = matchChirho[4].trim();
      const keyChirho = chChirho + ":" + vChirho;
      if (!wordsByVerseChirho.has(keyChirho)) wordsByVerseChirho.set(keyChirho, []);
      wordsByVerseChirho.get(keyChirho).push(wordChirho);
    }
    let verseCountChirho = 0;
    let wordCountChirho = 0;
    dbChirho.transaction(() => {
      for (const [keyChirho, wordsChirho] of wordsByVerseChirho.entries()) {
        const [chStrChirho, vStrChirho] = keyChirho.split(":");
        const chChirho = parseInt(chStrChirho, 10);
        const vChirho = parseInt(vStrChirho, 10);
        const rawChirho = wordsChirho.join(" ");
        const bareChirhoText = bareChirho(rawChirho);
        const infoChirho = insertVerseChirho.run(bChirho.canonicalChirho, chChirho, vChirho, rawChirho, bareChirhoText);
        const verseIdChirho = Number(infoChirho.lastInsertRowid);
        deleteWordsChirho.run(verseIdChirho);
        for (let wIdxChirho = 0; wIdxChirho < wordsChirho.length; wIdxChirho++) {
          insertWordChirho.run(verseIdChirho, wIdxChirho, wordsChirho[wIdxChirho], bareChirho(wordsChirho[wIdxChirho]));
          wordCountChirho++;
        }
        verseCountChirho++;
      }
    })();
    console.log("[lxx-load] " + bChirho.canonicalChirho + ": " + verseCountChirho + " verses, " + wordCountChirho + " words");
  }
  dbChirho.close();
  console.log("[lxx-load] Done → " + LXX_DB_PATH_CHIRHO);
}
