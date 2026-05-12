// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Word-vision refinement pass.
 *
 * For each non-French segment on a given vol/page, crop the segment region
 * out of its line image (we have line crops in workspace-chirho/scanlines-chirho)
 * and emit a per-segment vision-job manifest.
 *
 * Operator then dispatches a vision subagent per segment (parallel) to read
 * the crop and return precise UTF-8 with nikkud / breathings / vowels.
 *
 * CLI:
 *   bun src-chirho/word-vision-refine-chirho.ts --vol=1 --page=150
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

import { sqliteChirho } from "./db-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const NON_FRENCH_SCRIPTS_CHIRHO = new Set([
  "hebrew-chirho",
  "greek-chirho",
  "syriac-chirho",
  "arabic-chirho",
  "latin-non-french-chirho",
  "symbol-chirho",
]);

const UPSCALE_FACTOR_CHIRHO = 3;

interface SegmentJobChirho {
  pageNumberChirho: number;
  lineIndexChirho: number;
  segmentIdChirho: number;
  segmentIndexChirho: number;
  scriptTypeChirho: string;
  currentTextChirho: string;
  segmentImagePathChirho: string;
  lineImagePathChirho: string;
  xMinPxChirho: number;
  widthPxChirho: number;
}

function cropSegmentChirho(
  lineImagePathChirho: string,
  xMinChirho: number,
  widthChirho: number,
  outputPathChirho: string
): void {
  const padChirho = 6;
  const xChirho = Math.max(0, Math.floor(xMinChirho - padChirho));
  const wChirho = Math.ceil(widthChirho + padChirho * 2);
  const cropChirho = `${wChirho}x10000+${xChirho}+0`;
  const resultChirho = spawnSync(
    "magick",
    [
      lineImagePathChirho,
      "-crop", cropChirho,
      "+repage",
      "-filter", "Lanczos",
      "-resize", `${UPSCALE_FACTOR_CHIRHO * 100}%`,
      outputPathChirho,
    ],
    { stdio: "pipe" }
  );
  if (resultChirho.status !== 0) {
    throw new Error(
      `magick crop failed for ${lineImagePathChirho}: ${resultChirho.stderr.toString()}`
    );
  }
}

if (import.meta.main) {
  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "1",
    10
  );
  const pageChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1] ?? "150",
    10
  );

  console.log(`[word-vision-refine] vol ${volChirho} p${pageChirho}`);

  const rowsChirho = sqliteChirho
    .prepare(
      `SELECT seg.id_chirho            AS segment_id_chirho,
              seg.segment_index_chirho AS segment_index_chirho,
              seg.script_type_chirho   AS script_type_chirho,
              seg.accepted_text_chirho AS accepted_text_chirho,
              seg.x_min_px_chirho      AS x_min_px_chirho,
              seg.width_px_chirho      AS width_px_chirho,
              sl.line_index_chirho     AS line_index_chirho,
              sl.image_r2_key_chirho   AS image_r2_key_chirho
         FROM segments_chirho seg
         JOIN scanlines_chirho sl ON sl.id_chirho = seg.scanline_id_chirho
         JOIN pages_chirho p      ON p.id_chirho = sl.page_id_chirho
        WHERE p.volume_number_chirho = ?
          AND p.page_number_chirho = ?
        ORDER BY sl.line_index_chirho, seg.segment_index_chirho`
    )
    .all(volChirho, pageChirho) as Array<{
      segment_id_chirho: number;
      segment_index_chirho: number;
      script_type_chirho: string;
      accepted_text_chirho: string | null;
      x_min_px_chirho: number | null;
      width_px_chirho: number | null;
      line_index_chirho: number;
      image_r2_key_chirho: string | null;
    }>;

  const jobsChirho: SegmentJobChirho[] = [];
  const segOutDirChirho = join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "segments-chirho",
    `vol-${volChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`
  );
  if (!existsSync(segOutDirChirho)) mkdirSync(segOutDirChirho, { recursive: true });

  for (const rChirho of rowsChirho) {
    if (!NON_FRENCH_SCRIPTS_CHIRHO.has(rChirho.script_type_chirho)) continue;
    if (rChirho.x_min_px_chirho === null || rChirho.width_px_chirho === null) continue;
    if (!rChirho.image_r2_key_chirho) continue;

    const lineImagePathChirho = join(
      PROJECT_ROOT_CHIRHO,
      "workspace-chirho",
      "scanlines-chirho",
      rChirho.image_r2_key_chirho
    );
    if (!existsSync(lineImagePathChirho)) {
      console.warn(`[word-vision-refine] missing line image: ${lineImagePathChirho}`);
      continue;
    }

    const segmentImagePathChirho = join(
      segOutDirChirho,
      `line-${String(rChirho.line_index_chirho).padStart(3, "0")}-seg-${String(
        rChirho.segment_index_chirho
      ).padStart(2, "0")}-chirho.png`
    );

    cropSegmentChirho(
      lineImagePathChirho,
      rChirho.x_min_px_chirho,
      rChirho.width_px_chirho,
      segmentImagePathChirho
    );

    jobsChirho.push({
      pageNumberChirho: pageChirho,
      lineIndexChirho: rChirho.line_index_chirho,
      segmentIdChirho: rChirho.segment_id_chirho,
      segmentIndexChirho: rChirho.segment_index_chirho,
      scriptTypeChirho: rChirho.script_type_chirho,
      currentTextChirho: rChirho.accepted_text_chirho ?? "",
      segmentImagePathChirho,
      lineImagePathChirho,
      xMinPxChirho: rChirho.x_min_px_chirho,
      widthPxChirho: rChirho.width_px_chirho,
    });
  }

  const manifestPathChirho = join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "segments-chirho",
    `vol-${volChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `word-vision-manifest-chirho.json`
  );
  writeFileSync(manifestPathChirho, JSON.stringify(jobsChirho, null, 2), "utf8");

  console.log(
    `[word-vision-refine] Cropped ${jobsChirho.length} segments → ${segOutDirChirho}`
  );
  console.log(`[word-vision-refine] Manifest: ${manifestPathChirho}`);
}
