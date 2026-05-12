// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

import { sqliteChirho } from "./db-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

if (!import.meta.main) throw new Error("CLI only");

const argsChirho = process.argv.slice(2);
const volChirho = parseInt(
  argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "1",
  10
);
const pageRangeChirho =
  argsChirho.find((aChirho) => aChirho.startsWith("--pages="))?.split("=")[1] ?? "148-152";
const maxDistanceChirho = parseInt(
  argsChirho.find((aChirho) => aChirho.startsWith("--max-distance="))?.split("=")[1] ?? "0",
  10
);
const dryRunChirho = argsChirho.includes("--dry-run");

const [pStartChirho, pEndChirho] = pageRangeChirho.split("-").map((nChirho) => parseInt(nChirho, 10));
const pagesChirho = [];
for (let pChirho = pStartChirho; pChirho <= pEndChirho; pChirho++) pagesChirho.push(pChirho);
const placeholdersChirho = pagesChirho.map(() => "?").join(",");

const rowsChirho = sqliteChirho
  .prepare(
    "SELECT seg.id_chirho AS segment_id_chirho, p.page_number_chirho AS page_number_chirho, sl.line_index_chirho AS line_index_chirho, seg.segment_index_chirho AS segment_index_chirho, seg.accepted_text_chirho AS current_text_chirho, bm.canonical_nikkud_chirho AS canonical_text_chirho, bm.distance_chirho AS distance_chirho, bm.book_chirho AS book_chirho, bm.chapter_chirho AS chapter_chirho, bm.verse_chirho AS verse_chirho FROM bhs_matches_chirho bm JOIN segments_chirho seg ON seg.id_chirho = bm.segment_id_chirho JOIN scanlines_chirho sl ON sl.id_chirho = seg.scanline_id_chirho JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho WHERE p.volume_number_chirho = ? AND p.page_number_chirho IN (" + placeholdersChirho + ") AND bm.distance_chirho <= ? AND bm.confidence_chirho IN ('high', 'medium') ORDER BY p.page_number_chirho, sl.line_index_chirho, seg.segment_index_chirho"
  )
  .all(volChirho, ...pagesChirho, maxDistanceChirho);

console.log("[bhs-apply] " + rowsChirho.length + " matches at distance <= " + maxDistanceChirho + (dryRunChirho ? " (dry-run)" : ""));

const affectedPagesChirho = new Set();
let appliedChirho = 0;
let skippedChirho = 0;

for (const rChirho of rowsChirho) {
  const spanFileChirho = join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "spans-chirho",
    "vol-" + volChirho + "-chirho",
    "page-" + String(rChirho.page_number_chirho).padStart(4, "0") + "-chirho",
    "line-" + String(rChirho.line_index_chirho).padStart(3, "0") + "-chirho.json"
  );
  if (!existsSync(spanFileChirho)) {
    console.warn("  missing span file: " + spanFileChirho);
    skippedChirho++;
    continue;
  }
  const dataChirho = JSON.parse(readFileSync(spanFileChirho, "utf8"));
  const spanChirho = dataChirho.spansChirho?.[rChirho.segment_index_chirho];
  if (!spanChirho) {
    console.warn("  span index out of range: " + spanFileChirho + " idx=" + rChirho.segment_index_chirho);
    skippedChirho++;
    continue;
  }
  if (spanChirho.utf8TextChirho === rChirho.canonical_text_chirho) {
    skippedChirho++;
    continue;
  }
  console.log(
    "  p" + rChirho.page_number_chirho + " L" + rChirho.line_index_chirho + " seg" + rChirho.segment_index_chirho +
    " (" + rChirho.book_chirho + " " + rChirho.chapter_chirho + ":" + rChirho.verse_chirho + ") " +
    spanChirho.utf8TextChirho + " → " + rChirho.canonical_text_chirho
  );
  if (!dryRunChirho) {
    spanChirho.utf8TextChirho = rChirho.canonical_text_chirho;
    dataChirho.agentChirho = "bhs-apply-vol-" + volChirho + "-chirho";
    writeFileSync(spanFileChirho, JSON.stringify(dataChirho, null, 2) + "\n", "utf8");
    affectedPagesChirho.add(rChirho.page_number_chirho);
    appliedChirho++;
  }
}

console.log("[bhs-apply] applied=" + appliedChirho + " skipped=" + skippedChirho + " affected_pages=" + Array.from(affectedPagesChirho).sort().join(","));
