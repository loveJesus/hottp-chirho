// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Pass 3 — ingest assembled span JSON files from
 * `workspace-chirho/spans-chirho/vol-N-chirho/page-NNNN-chirho/line-LLL-chirho.json`
 * into `segments_chirho` rows in local sqlite.
 *
 * For each line: wipe existing segments_chirho rows for the parent scanline,
 * then bulk-insert the spans from the JSON file with proper xMinPx/widthPx
 * (already line-local) + scriptType + utf8 text fields. Updates
 * `scanlines_chirho.segment_count_chirho` for each scanline.
 *
 * CLI:
 *   bun src-chirho/pass3-ingest-spans-chirho.ts --pilot
 *   bun src-chirho/pass3-ingest-spans-chirho.ts --vol=2 --page=150
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  initDbChirho,
  sqliteChirho,
  logStepStartChirho,
  logStepEndChirho,
} from "./db-chirho.ts";
import { logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "pass3-ingest-spans-chirho";
const AGENT_CODE_CHIRHO = "pass3-ingest-spans-chirho";

const SPANS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho"
);

interface SpanFileChirho {
  lineIndexChirho: number;
  spansChirho: Array<{
    segmentIndexChirho: number;
    xMinPxChirho: number;
    widthPxChirho: number;
    scriptChirho: string;
    utf8TextChirho: string;
  }>;
}

function ingestPageChirho(volChirho: number, pageChirho: number): { linesChirho: number; segmentsChirho: number } {
  const pageDirChirho = join(
    SPANS_DIR_CHIRHO,
    `vol-${volChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`
  );
  if (!existsSync(pageDirChirho)) return { linesChirho: 0, segmentsChirho: 0 };

  const pageRowChirho = sqliteChirho
    .query(
      `SELECT id_chirho FROM pages_chirho
       WHERE volume_number_chirho = ? AND page_number_chirho = ?`
    )
    .get(volChirho, pageChirho) as { id_chirho: number } | null;
  if (!pageRowChirho) {
    logChirho(MODULE_CHIRHO, `WARN: page row not found for vol ${volChirho} p${pageChirho}; skipping`);
    return { linesChirho: 0, segmentsChirho: 0 };
  }

  const scanlineMapChirho = new Map<number, number>(); // line_index → scanline id
  const scanlineRowsChirho = sqliteChirho
    .query(
      `SELECT id_chirho, line_index_chirho FROM scanlines_chirho WHERE page_id_chirho = ?`
    )
    .all(pageRowChirho.id_chirho) as Array<{
      id_chirho: number;
      line_index_chirho: number;
    }>;
  for (const sChirho of scanlineRowsChirho) {
    scanlineMapChirho.set(sChirho.line_index_chirho, sChirho.id_chirho);
  }

  // Wipe all existing segments for this page's scanlines (idempotent re-ingest).
  // bhs_matches references segments by FK — clear those first.
  const allScanlineIdsChirho = scanlineRowsChirho.map((sChirho) => sChirho.id_chirho);
  if (allScanlineIdsChirho.length > 0) {
    sqliteChirho.run(
      `DELETE FROM bhs_matches_chirho WHERE segment_id_chirho IN (SELECT id_chirho FROM segments_chirho WHERE scanline_id_chirho IN (${allScanlineIdsChirho.join(",")}))`
    );
    sqliteChirho.run(
      `DELETE FROM lxx_matches_chirho WHERE segment_id_chirho IN (SELECT id_chirho FROM segments_chirho WHERE scanline_id_chirho IN (${allScanlineIdsChirho.join(",")}))`
    );
    sqliteChirho.run(
      `DELETE FROM segments_chirho WHERE scanline_id_chirho IN (${allScanlineIdsChirho.join(",")})`
    );
  }

  const insertStmtChirho = sqliteChirho.prepare(
    `INSERT INTO segments_chirho
       (scanline_id_chirho, segment_index_chirho, x_min_px_chirho, width_px_chirho,
        script_type_chirho, accepted_text_chirho, ocr_text_chirho, status_chirho)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'agent-pending-chirho')`
  );
  const updateScanlineCountChirho = sqliteChirho.prepare(
    `UPDATE scanlines_chirho SET segment_count_chirho = ? WHERE id_chirho = ?`
  );

  let linesChirho = 0;
  let segmentsChirho = 0;

  for (const fnChirho of readdirSync(pageDirChirho)) {
    const lmChirho = fnChirho.match(/^line-(\d+)-chirho\.json$/);
    if (!lmChirho) continue;
    const lineIdxChirho = parseInt(lmChirho[1]!, 10);
    const scanlineIdChirho = scanlineMapChirho.get(lineIdxChirho);
    if (!scanlineIdChirho) continue;

    const dataChirho: SpanFileChirho = JSON.parse(
      readFileSync(join(pageDirChirho, fnChirho), "utf8")
    );

    for (const spanChirho of dataChirho.spansChirho) {
      // For French spans: utf8TextChirho is from tesseract/pdftotext (raw OCR).
      // For non-French spans: utf8TextChirho is the agent's curated transcription.
      // Both go into accepted_text_chirho since they're the assembler's "best"
      // text. ocr_text_chirho mirrors it so human reviewers can compare.
      insertStmtChirho.run(
        scanlineIdChirho,
        spanChirho.segmentIndexChirho,
        spanChirho.xMinPxChirho,
        spanChirho.widthPxChirho,
        spanChirho.scriptChirho,
        spanChirho.utf8TextChirho,
        spanChirho.utf8TextChirho
      );
      segmentsChirho++;
    }
    updateScanlineCountChirho.run(dataChirho.spansChirho.length, scanlineIdChirho);
    linesChirho++;
  }

  return { linesChirho, segmentsChirho };
}

if (import.meta.main) {
  initDbChirho();
  const argsChirho = process.argv.slice(2);
  const isPilotChirho = argsChirho.includes("--pilot");
  const volArgChirho = argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1];
  const pageArgChirho = argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1];

  interface TargetChirho { volChirho: number; pageChirho: number }
  const targetsChirho: TargetChirho[] = [];
  if (isPilotChirho) {
    for (const vChirho of [1, 2, 3, 4, 5]) {
      for (let pChirho = 148; pChirho <= 152; pChirho++) {
        targetsChirho.push({ volChirho: vChirho, pageChirho: pChirho });
      }
    }
  } else if (volArgChirho && pageArgChirho) {
    targetsChirho.push({
      volChirho: parseInt(volArgChirho, 10),
      pageChirho: parseInt(pageArgChirho, 10),
    });
  } else {
    console.error("Usage: --pilot OR --vol=N --page=X");
    process.exit(1);
  }

  const stepIdChirho = logStepStartChirho(
    AGENT_CODE_CHIRHO,
    `Pass 3 ingest: ${targetsChirho.length} pages`
  );

  let totalLinesChirho = 0;
  let totalSegmentsChirho = 0;
  for (const tChirho of targetsChirho) {
    const rChirho = ingestPageChirho(tChirho.volChirho, tChirho.pageChirho);
    logChirho(
      MODULE_CHIRHO,
      `Vol ${tChirho.volChirho} p${tChirho.pageChirho}: ${rChirho.linesChirho} lines, ${rChirho.segmentsChirho} segments`
    );
    totalLinesChirho += rChirho.linesChirho;
    totalSegmentsChirho += rChirho.segmentsChirho;
  }

  logChirho(MODULE_CHIRHO, `Done: ${totalLinesChirho} lines, ${totalSegmentsChirho} segments ingested.`);
  logStepEndChirho(
    stepIdChirho,
    `Ingested ${totalSegmentsChirho} segments across ${totalLinesChirho} lines`,
    `Pass 3 ingest complete.`
  );
}
