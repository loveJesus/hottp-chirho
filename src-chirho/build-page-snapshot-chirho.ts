// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Build a self-contained per-page underlay JSON snapshot for the editor.
//
// Output: rows in page_snapshots_chirho keyed by page_id_chirho. Each row's
// underlay_json_chirho holds scanlines + words + segments + canonical refs.
//
// The editor reads ONE row per page-load + any newer events_chirho. Cheap.
//
// CLI:
//   bun src-chirho/build-page-snapshot-chirho.ts --vol=1 --pages=148-152
//   bun src-chirho/build-page-snapshot-chirho.ts --all-pilot

import { Database as BunDbChirho } from "bun:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { writeTextAtomicChirho } from "./atomic-json-chirho.ts";

const __filenameChirho = fileURLToPath(import.meta.url);
const __dirnameChirho = path.dirname(__filenameChirho);
const PROGRESS_DB_PATH_CHIRHO = path.resolve(__dirnameChirho, "..", "spec-chirho", "progress-chirho.sqlite");
const SNAPSHOT_DIR_CHIRHO = path.resolve(__dirnameChirho, "..", "workspace-chirho", "snapshots-chirho");

interface CliArgsChirho {
  volsChirho: number[];
  pagesChirho: number[] | null;
}

function parseArgsChirho(argvChirho: string[]): CliArgsChirho {
  let volsChirho: number[] = [];
  let pagesChirho: number[] | null = null;
  for (const argChirho of argvChirho.slice(2)) {
    if (argChirho.startsWith("--vol=")) {
      const partsChirho = argChirho.slice("--vol=".length).split(",");
      for (const pChirho of partsChirho) volsChirho.push(Number.parseInt(pChirho, 10));
    } else if (argChirho.startsWith("--pages=")) {
      const rangeChirho = argChirho.slice("--pages=".length);
      const [aChirho, bChirho] = rangeChirho.split("-").map((vChirho) => Number.parseInt(vChirho, 10));
      pagesChirho = [];
      for (let nChirho = aChirho!; nChirho <= (bChirho ?? aChirho!); nChirho++) pagesChirho.push(nChirho);
    } else if (argChirho === "--all-pilot") {
      volsChirho = [1, 2, 3, 4, 5];
      pagesChirho = [148, 149, 150, 151, 152];
    }
  }
  if (volsChirho.length === 0) volsChirho = [1, 2, 3, 4, 5];
  return { volsChirho, pagesChirho };
}

interface PageRowChirho {
  id_chirho: number;
  volume_number_chirho: number;
  page_number_chirho: number;
  image_path_chirho: string | null;
  status_chirho: string;
}

interface ScanlineRowChirho {
  id_chirho: number;
  line_index_chirho: number;
  x_min_chirho: number | null;
  y_min_chirho: number | null;
  width_chirho: number | null;
  height_chirho: number | null;
  reconstructed_text_chirho: string | null;
}

interface WordRowChirho {
  id_chirho: number;
  word_index_chirho: number;
  x_min_chirho: number | null;
  y_min_chirho: number | null;
  x_max_chirho: number | null;
  y_max_chirho: number | null;
  original_ocr_text_chirho: string | null;
  original_ocr_script_chirho: string | null;
  current_text_chirho: string | null;
  current_script_chirho: string | null;
  current_source_chirho: string | null;
  is_human_confirmed_chirho: number;
  pending_script_flag_chirho: number;
}

interface SegmentRowChirho {
  id_chirho: number;
  segment_index_chirho: number;
  x_min_px_chirho: number | null;
  width_px_chirho: number | null;
  accepted_text_chirho: string | null;
  ocr_text_chirho: string | null;
  script_type_chirho: string | null;
  canonical_source_chirho: string | null;
  canonical_confidence_chirho: string | null;
  canonical_reference_chirho: string | null;
  canonical_distance_chirho: number | null;
}

function buildSnapshotJsonChirho(
  dbChirho: BunDbChirho,
  pageRowChirho: PageRowChirho,
): { underlayJsonChirho: string; wordCountChirho: number; segmentCountChirho: number } {
  const scanlinesChirho = dbChirho
    .query<ScanlineRowChirho, [number]>(
      `SELECT id_chirho, line_index_chirho, x_min_chirho, y_min_chirho,
              width_chirho, height_chirho, reconstructed_text_chirho
         FROM scanlines_chirho
        WHERE page_id_chirho = ?
        ORDER BY line_index_chirho`,
    )
    .all(pageRowChirho.id_chirho);

  const scanlineIdsChirho = scanlinesChirho.map((sChirho) => sChirho.id_chirho);
  const idsListChirho = scanlineIdsChirho.length === 0 ? "(0)" : `(${scanlineIdsChirho.join(",")})`;

  const wordsByLineChirho = new Map<number, WordRowChirho[]>();
  if (scanlineIdsChirho.length > 0) {
    const wordRowsChirho = dbChirho
      .query<WordRowChirho & { scanline_id_chirho: number }, []>(
        `SELECT id_chirho, scanline_id_chirho, word_index_chirho,
                x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
                original_ocr_text_chirho, original_ocr_script_chirho,
                current_text_chirho, current_script_chirho, current_source_chirho,
                is_human_confirmed_chirho, pending_script_flag_chirho
           FROM words_chirho
          WHERE scanline_id_chirho IN ${idsListChirho}
          ORDER BY scanline_id_chirho, word_index_chirho`,
      )
      .all();
    for (const wRowChirho of wordRowsChirho) {
      const arrChirho = wordsByLineChirho.get(wRowChirho.scanline_id_chirho) ?? [];
      arrChirho.push(wRowChirho);
      wordsByLineChirho.set(wRowChirho.scanline_id_chirho, arrChirho);
    }
  }

  const segmentsByLineChirho = new Map<number, SegmentRowChirho[]>();
  if (scanlineIdsChirho.length > 0) {
    const segRowsChirho = dbChirho
      .query<SegmentRowChirho & { scanline_id_chirho: number }, []>(
        `SELECT seg.id_chirho, seg.scanline_id_chirho, seg.segment_index_chirho,
                seg.x_min_px_chirho, seg.width_px_chirho,
                seg.accepted_text_chirho, seg.ocr_text_chirho, seg.script_type_chirho,
                COALESCE(
                  CASE WHEN bm.confidence_chirho IS NOT NULL THEN 'bhs' END,
                  CASE WHEN lm.confidence_chirho IS NOT NULL THEN 'lxx' END
                ) AS canonical_source_chirho,
                COALESCE(bm.confidence_chirho, lm.confidence_chirho) AS canonical_confidence_chirho,
                COALESCE(
                  bm.book_chirho || ' ' || bm.chapter_chirho || ':' || bm.verse_chirho,
                  lm.book_chirho || ' ' || lm.chapter_chirho || ':' || lm.verse_chirho
                ) AS canonical_reference_chirho,
                COALESCE(bm.distance_chirho, lm.distance_chirho) AS canonical_distance_chirho
           FROM segments_chirho seg
           LEFT JOIN bhs_matches_chirho bm ON bm.segment_id_chirho = seg.id_chirho
           LEFT JOIN lxx_matches_chirho lm ON lm.segment_id_chirho = seg.id_chirho
          WHERE seg.scanline_id_chirho IN ${idsListChirho}
          ORDER BY seg.scanline_id_chirho, seg.segment_index_chirho`,
      )
      .all();
    for (const sRowChirho of segRowsChirho) {
      const arrChirho = segmentsByLineChirho.get(sRowChirho.scanline_id_chirho) ?? [];
      arrChirho.push(sRowChirho);
      segmentsByLineChirho.set(sRowChirho.scanline_id_chirho, arrChirho);
    }
  }

  let wordCountChirho = 0;
  let segmentCountChirho = 0;

  const snapshotObjectChirho = {
    pageIdChirho: pageRowChirho.id_chirho,
    volumeNumberChirho: pageRowChirho.volume_number_chirho,
    pageNumberChirho: pageRowChirho.page_number_chirho,
    imagePathChirho: pageRowChirho.image_path_chirho,
    scanlinesChirho: scanlinesChirho.map((sChirho) => {
      const wordRowsChirho = wordsByLineChirho.get(sChirho.id_chirho) ?? [];
      const segRowsChirho = segmentsByLineChirho.get(sChirho.id_chirho) ?? [];
      wordCountChirho += wordRowsChirho.length;
      segmentCountChirho += segRowsChirho.length;
      return {
        scanlineIdChirho: sChirho.id_chirho,
        lineIndexChirho: sChirho.line_index_chirho,
        xMinChirho: sChirho.x_min_chirho,
        yMinChirho: sChirho.y_min_chirho,
        widthChirho: sChirho.width_chirho,
        heightChirho: sChirho.height_chirho,
        reconstructedTextChirho: sChirho.reconstructed_text_chirho,
        wordsChirho: wordRowsChirho.map((wChirho) => ({
          wordIdChirho: wChirho.id_chirho,
          wordIndexChirho: wChirho.word_index_chirho,
          xMinChirho: wChirho.x_min_chirho,
          yMinChirho: wChirho.y_min_chirho,
          xMaxChirho: wChirho.x_max_chirho,
          yMaxChirho: wChirho.y_max_chirho,
          originalOcrTextChirho: wChirho.original_ocr_text_chirho,
          originalOcrScriptChirho: wChirho.original_ocr_script_chirho,
          currentTextChirho: wChirho.current_text_chirho,
          currentScriptChirho: wChirho.current_script_chirho,
          currentSourceChirho: wChirho.current_source_chirho,
          isHumanConfirmedChirho: wChirho.is_human_confirmed_chirho === 1,
          pendingScriptFlagChirho: wChirho.pending_script_flag_chirho === 1,
        })),
        segmentsChirho: segRowsChirho.map((segChirho) => ({
          segmentIdChirho: segChirho.id_chirho,
          segmentIndexChirho: segChirho.segment_index_chirho,
          xMinChirho: segChirho.x_min_px_chirho,
          widthChirho: segChirho.width_px_chirho,
          acceptedTextChirho: segChirho.accepted_text_chirho,
          ocrTextChirho: segChirho.ocr_text_chirho,
          scriptTypeChirho: segChirho.script_type_chirho,
          canonicalChirho: {
            sourceChirho: segChirho.canonical_source_chirho,
            confidenceChirho: segChirho.canonical_confidence_chirho,
            referenceChirho: segChirho.canonical_reference_chirho,
            distanceChirho: segChirho.canonical_distance_chirho,
          },
        })),
      };
    }),
  };

  return {
    underlayJsonChirho: JSON.stringify(snapshotObjectChirho),
    wordCountChirho,
    segmentCountChirho,
  };
}

async function mainChirho(): Promise<void> {
  const argsChirho = parseArgsChirho(process.argv);
  const dbChirho = new BunDbChirho(PROGRESS_DB_PATH_CHIRHO);

  let whereChirho = "1=1";
  if (argsChirho.volsChirho.length > 0) {
    whereChirho += ` AND volume_number_chirho IN (${argsChirho.volsChirho.join(",")})`;
  }
  if (argsChirho.pagesChirho && argsChirho.pagesChirho.length > 0) {
    whereChirho += ` AND page_number_chirho IN (${argsChirho.pagesChirho.join(",")})`;
  }

  const pagesChirho = dbChirho
    .query<PageRowChirho, []>(
      `SELECT id_chirho, volume_number_chirho, page_number_chirho, image_path_chirho, status_chirho
         FROM pages_chirho
        WHERE ${whereChirho}
        ORDER BY volume_number_chirho, page_number_chirho`,
    )
    .all();

  console.log(`[build-page-snapshot] building snapshots for ${pagesChirho.length} pages`);

  // D1 caps single statements ~100KB; snapshot JSON exceeds that. Local table
  // still stores the body (cheap, useful for offline editing), but we also
  // emit JSON files to disk so sync-to-cloud can upload to R2 (which has no
  // statement-size limit and serves cheap reads via the R2 binding).
  const upsertStmtChirho = dbChirho.prepare(
    `INSERT INTO page_snapshots_chirho (page_id_chirho, snapshot_seq_chirho, underlay_json_chirho, underlay_r2_key_chirho, built_at_chirho, updated_at_chirho)
     VALUES (?, 0, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(page_id_chirho) DO UPDATE SET
        underlay_json_chirho = excluded.underlay_json_chirho,
        underlay_r2_key_chirho = excluded.underlay_r2_key_chirho,
        updated_at_chirho   = datetime('now')`,
  );

  let totalWordsChirho = 0;
  let totalSegsChirho = 0;
  for (const pageRowChirho of pagesChirho) {
    const { underlayJsonChirho, wordCountChirho, segmentCountChirho } = buildSnapshotJsonChirho(dbChirho, pageRowChirho);
    const r2KeyChirho = `snapshots-chirho/vol-${pageRowChirho.volume_number_chirho}-page-${String(pageRowChirho.page_number_chirho).padStart(4, "0")}-chirho.json`;
    const localFilePathChirho = path.join(SNAPSHOT_DIR_CHIRHO, `vol-${pageRowChirho.volume_number_chirho}-page-${String(pageRowChirho.page_number_chirho).padStart(4, "0")}-chirho.json`);
    writeTextAtomicChirho(localFilePathChirho, underlayJsonChirho);
    upsertStmtChirho.run(pageRowChirho.id_chirho, underlayJsonChirho, r2KeyChirho);
    totalWordsChirho += wordCountChirho;
    totalSegsChirho += segmentCountChirho;
    console.log(
      `  vol ${pageRowChirho.volume_number_chirho} p${pageRowChirho.page_number_chirho}: ${wordCountChirho} words, ${segmentCountChirho} segments, r2=${r2KeyChirho}`,
    );
  }

  console.log(`[build-page-snapshot] done — ${totalWordsChirho} words, ${totalSegsChirho} segments across ${pagesChirho.length} pages`);
}

await mainChirho();
