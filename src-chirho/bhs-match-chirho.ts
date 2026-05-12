// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { Database as BunDbChirho } from "bun:sqlite";
import { join } from "path";

import { sqliteChirho } from "./db-chirho.ts";
import { SPEC_DIR_CHIRHO } from "./config-chirho.ts";

const WLC_DB_PATH_CHIRHO = join(SPEC_DIR_CHIRHO, "wlc-chirho.sqlite");
const VERSE_WINDOW_CHIRHO = 2;

const CANTILLATION_RE_CHIRHO = /[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3\u05C6\u05C7]/g;

function stripCantillationChirho(textChirho) {
  return textChirho.replace(CANTILLATION_RE_CHIRHO, "");
}

function consonantsOnlyChirho(textChirho) {
  return textChirho.replace(/[֑-ׇ]/g, "");
}

function editDistanceChirho(aChirho, bChirho) {
  if (aChirho === bChirho) return 0;
  const mChirho = aChirho.length;
  const nChirho = bChirho.length;
  if (mChirho === 0) return nChirho;
  if (nChirho === 0) return mChirho;
  const prevChirho = new Array(nChirho + 1);
  const currChirho = new Array(nChirho + 1);
  for (let jChirho = 0; jChirho <= nChirho; jChirho++) prevChirho[jChirho] = jChirho;
  for (let iChirho = 1; iChirho <= mChirho; iChirho++) {
    currChirho[0] = iChirho;
    for (let jChirho = 1; jChirho <= nChirho; jChirho++) {
      const costChirho = aChirho[iChirho - 1] === bChirho[jChirho - 1] ? 0 : 1;
      currChirho[jChirho] = Math.min(
        prevChirho[jChirho] + 1,
        currChirho[jChirho - 1] + 1,
        prevChirho[jChirho - 1] + costChirho
      );
    }
    for (let kChirho = 0; kChirho <= nChirho; kChirho++) prevChirho[kChirho] = currChirho[kChirho];
  }
  return prevChirho[nChirho];
}

function gatherCandidatesChirho(wlcDbChirho, bookChirho, chapterChirho, verseStartChirho, verseEndChirho) {
  const minVChirho = Math.max(1, verseStartChirho - VERSE_WINDOW_CHIRHO);
  const maxVChirho = verseEndChirho + VERSE_WINDOW_CHIRHO;
  const rowsChirho = wlcDbChirho
    .prepare(
      "SELECT w.raw_word_chirho AS raw_word_chirho, w.consonants_only_chirho AS consonants_chirho, v.verse_chirho AS verse_chirho FROM words_chirho w JOIN verses_chirho v ON v.id_chirho = w.verse_id_chirho WHERE v.book_chirho = ? AND v.chapter_chirho = ? AND v.verse_chirho BETWEEN ? AND ? ORDER BY v.verse_chirho, w.word_index_chirho"
    )
    .all(bookChirho, chapterChirho, minVChirho, maxVChirho);
  return rowsChirho.map((rChirho) => ({
    rawChirho: rChirho.raw_word_chirho,
    consonantsChirho: rChirho.consonants_chirho,
    verseChirho: rChirho.verse_chirho,
  }));
}

function bestMatchChirho(segmentConsonantsChirho, candidatesChirho) {
  if (candidatesChirho.length === 0 || !segmentConsonantsChirho) return null;
  const segmentWordsChirho = segmentConsonantsChirho.split(/\s+/).filter((wChirho) => wChirho);
  if (segmentWordsChirho.length === 0) return null;
  if (segmentWordsChirho.length === 1) {
    const segWChirho = segmentWordsChirho[0];
    let bestChirho = null;
    for (const cChirho of candidatesChirho) {
      const dChirho = editDistanceChirho(segWChirho, cChirho.consonantsChirho);
      if (bestChirho === null || dChirho < bestChirho.distanceChirho) {
        bestChirho = {
          canonicalRawChirho: cChirho.rawChirho,
          canonicalNikkudChirho: stripCantillationChirho(cChirho.rawChirho),
          consonantsChirho: cChirho.consonantsChirho,
          verseChirho: cChirho.verseChirho,
          distanceChirho: dChirho,
        };
      }
    }
    return bestChirho;
  }
  const nChirho = segmentWordsChirho.length;
  let bestChirho = null;
  for (let iChirho = 0; iChirho <= candidatesChirho.length - nChirho; iChirho++) {
    const windowChirho = candidatesChirho.slice(iChirho, iChirho + nChirho);
    let totalChirho = 0;
    for (let jChirho = 0; jChirho < nChirho; jChirho++) {
      totalChirho += editDistanceChirho(
        segmentWordsChirho[jChirho],
        windowChirho[jChirho].consonantsChirho
      );
    }
    if (bestChirho === null || totalChirho < bestChirho.distanceChirho) {
      const rawJoinedChirho = windowChirho.map((wChirho) => wChirho.rawChirho).join(" ");
      const consJoinedChirho = windowChirho.map((wChirho) => wChirho.consonantsChirho).join(" ");
      bestChirho = {
        canonicalRawChirho: rawJoinedChirho,
        canonicalNikkudChirho: stripCantillationChirho(rawJoinedChirho),
        consonantsChirho: consJoinedChirho,
        verseChirho: windowChirho[0].verseChirho,
        distanceChirho: totalChirho,
      };
    }
  }
  return bestChirho;
}

function ensureSchemaChirho() {
  sqliteChirho.exec(
    "CREATE TABLE IF NOT EXISTS bhs_matches_chirho (id_chirho INTEGER PRIMARY KEY AUTOINCREMENT, segment_id_chirho INTEGER NOT NULL UNIQUE REFERENCES segments_chirho (id_chirho), book_chirho TEXT NOT NULL, chapter_chirho INTEGER NOT NULL, verse_chirho INTEGER NOT NULL, segment_consonants_chirho TEXT NOT NULL, canonical_raw_chirho TEXT NOT NULL, canonical_nikkud_chirho TEXT NOT NULL, consonants_chirho TEXT NOT NULL, distance_chirho INTEGER NOT NULL, confidence_chirho TEXT NOT NULL, created_at_chirho TEXT DEFAULT (datetime('now'))); CREATE INDEX IF NOT EXISTS bhs_matches_segment_chirho ON bhs_matches_chirho (segment_id_chirho);"
  );
}

function isSubsequenceChirho(needleChirho, haystackChirho) {
  let iChirho = 0;
  for (let kChirho = 0; kChirho < haystackChirho.length && iChirho < needleChirho.length; kChirho++) {
    if (haystackChirho[kChirho] === needleChirho[iChirho]) iChirho++;
  }
  return iChirho === needleChirho.length;
}

function classifyConfidenceChirho(distanceChirho, segConsChirho, canonicalConsChirho) {
  const segNoSpaceChirho = segConsChirho.replace(/\s+/g, "");
  const canNoSpaceChirho = (canonicalConsChirho ?? "").replace(/\s+/g, "");
  if (segNoSpaceChirho.length === 0) return "low";
  if (distanceChirho === 0) return "high";
  // Subsequence rule: every char in segment must appear, in order, in canonical.
  // This guards against character-loss matches like הברית→ברית.
  if (!isSubsequenceChirho(segNoSpaceChirho, canNoSpaceChirho)) return "low";
  if (distanceChirho <= 2 && segNoSpaceChirho.length >= 4) return "medium";
  return "low";
}

if (import.meta.main) {
  ensureSchemaChirho();
  const wlcDbChirho = new BunDbChirho(WLC_DB_PATH_CHIRHO);
  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "1",
    10
  );
  const pageRangeChirho =
    argsChirho.find((aChirho) => aChirho.startsWith("--pages="))?.split("=")[1] ?? "148-152";
  const [pStartChirho, pEndChirho] = pageRangeChirho.split("-").map((nChirho) => parseInt(nChirho, 10));
  const pagesChirho = [];
  for (let pChirho = pStartChirho; pChirho <= pEndChirho; pChirho++) pagesChirho.push(pChirho);
  const placeholdersChirho = pagesChirho.map(() => "?").join(",");
  const rowsChirho = sqliteChirho
    .prepare(
      "SELECT seg.id_chirho AS segment_id_chirho, p.page_number_chirho AS page_number_chirho, sl.line_index_chirho AS line_index_chirho, seg.accepted_text_chirho AS accepted_text_chirho, vc.book_chirho AS book_chirho, vc.chapter_chirho AS chapter_chirho, vc.verse_start_chirho AS verse_start_chirho, vc.verse_end_chirho AS verse_end_chirho FROM segments_chirho seg JOIN scanlines_chirho sl ON sl.id_chirho = seg.scanline_id_chirho JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho LEFT JOIN verse_context_chirho vc ON vc.scanline_id_chirho = sl.id_chirho WHERE p.volume_number_chirho = ? AND p.page_number_chirho IN (" + placeholdersChirho + ") AND seg.script_type_chirho = 'hebrew-chirho' ORDER BY p.page_number_chirho, sl.line_index_chirho, seg.segment_index_chirho"
    )
    .all(volChirho, ...pagesChirho);
  const insertMatchChirho = sqliteChirho.prepare(
    "INSERT OR REPLACE INTO bhs_matches_chirho (segment_id_chirho, book_chirho, chapter_chirho, verse_chirho, segment_consonants_chirho, canonical_raw_chirho, canonical_nikkud_chirho, consonants_chirho, distance_chirho, confidence_chirho) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  let highChirho = 0, mediumChirho = 0, lowChirho = 0, skippedChirho = 0;
  const reportChirho = [];
  for (const rChirho of rowsChirho) {
    if (!rChirho.book_chirho || !rChirho.chapter_chirho || !rChirho.verse_start_chirho) {
      skippedChirho++;
      continue;
    }
    const acceptedChirho = (rChirho.accepted_text_chirho ?? "").trim();
    if (!acceptedChirho) {
      skippedChirho++;
      continue;
    }
    const segConsChirho = consonantsOnlyChirho(acceptedChirho);
    const candidatesChirho = gatherCandidatesChirho(
      wlcDbChirho,
      rChirho.book_chirho,
      rChirho.chapter_chirho,
      rChirho.verse_start_chirho,
      rChirho.verse_end_chirho ?? rChirho.verse_start_chirho
    );
    const bestChirho = bestMatchChirho(segConsChirho, candidatesChirho);
    if (!bestChirho) {
      skippedChirho++;
      continue;
    }
    const confChirho = classifyConfidenceChirho(bestChirho.distanceChirho, segConsChirho, bestChirho.consonantsChirho);
    insertMatchChirho.run(
      rChirho.segment_id_chirho,
      rChirho.book_chirho,
      rChirho.chapter_chirho,
      bestChirho.verseChirho,
      segConsChirho,
      bestChirho.canonicalRawChirho,
      bestChirho.canonicalNikkudChirho,
      bestChirho.consonantsChirho,
      bestChirho.distanceChirho,
      confChirho
    );
    if (confChirho === "high") highChirho++;
    else if (confChirho === "medium") mediumChirho++;
    else lowChirho++;
    reportChirho.push({
      pageChirho: rChirho.page_number_chirho,
      lineChirho: rChirho.line_index_chirho,
      segIdChirho: rChirho.segment_id_chirho,
      currentChirho: acceptedChirho,
      canonicalChirho: bestChirho.canonicalNikkudChirho,
      distChirho: bestChirho.distanceChirho,
      confChirho,
    });
  }
  console.log(
    "[bhs-match] vol " + volChirho + " pp" + pStartChirho + "-" + pEndChirho + ": " +
    rowsChirho.length + " hebrew segments → high=" + highChirho + ", medium=" + mediumChirho + ", low=" + lowChirho + ", skipped=" + skippedChirho
  );
  console.log("\n=== Sample matches (sorted by distance) ===");
  reportChirho.sort((aChirho, bChirho) => aChirho.distChirho - bChirho.distChirho);
  for (const rChirho of reportChirho.slice(0, 50)) {
    console.log(
      "[" + rChirho.confChirho.padEnd(6) + "] d=" + rChirho.distChirho + " p" + rChirho.pageChirho + " L" + rChirho.lineChirho + " seg#" + rChirho.segIdChirho + "\n  current  : " + rChirho.currentChirho + "\n  canonical: " + rChirho.canonicalChirho
    );
  }
  wlcDbChirho.close();
}
