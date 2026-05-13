// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * ETL labeled (image_crop, text, script) pairs into training_pairs_chirho.
 *
 * Two sources, in priority order (UNIQUE(word_id, source) so re-runs are idempotent):
 *
 *   1. canonical-recon-chirho — every word on an aligned scanline whose
 *      reconstructed-text token is the canonical (WLC/BHS) answer. Highest
 *      training signal because the label came from an authoritative external
 *      source, not from a model.
 *
 *   2. opus-vision-chirho — every word that received a word-vision-applied
 *      event. The model's >=0.9 certainty tier.
 *
 * Both sources need the per-word crop image. We re-use the existing crop files
 * under workspace-chirho/vision-batches-chirho/ where they exist, otherwise
 * re-crop from the page PNG with the same padding the vision pipeline used.
 *
 * Crops are mirrored into workspace-chirho/training-pairs-chirho/vol-V-page-PPPP-chirho/
 * so the training script has a stable directory layout independent of vision-
 * batch dirs (which may be deleted later).
 *
 * CLI:
 *   bun src-chirho/training-pairs-etl-chirho.ts --vol=1 --page=148
 *   bun src-chirho/training-pairs-etl-chirho.ts --vol=1 --pages=148-152
 */

import { existsSync, readdirSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { initDbChirho, sqliteChirho } from "./db-chirho.ts";
import { runCmdChirho, ensureDirChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "training-pairs-etl-chirho";

const CROP_PAD_PX_CHIRHO = 4; // matches vision-word-batch-chirho.ts

interface PairRowChirho {
  wordIdChirho: number;
  scanlineIdChirho: number;
  pageIdChirho: number;
  volChirho: number;
  pageNumChirho: number;
  lineIdxChirho: number;
  wordIdxChirho: number;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  cropPathChirho: string;
  textChirho: string;
  scriptChirho: string;
  sourceChirho: string;
  certaintyChirho: number | null;
  tesseractWasChirho: string | null;
}

function pairsDirChirho(volChirho: number, pageNumChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "training-pairs-chirho",
    `vol-${volChirho}-page-${String(pageNumChirho).padStart(4, "0")}-chirho`
  );
}

function pageImagePathChirho(volChirho: number, pageNumChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "images-chirho",
    `vol-${volChirho}-chirho`,
    `page-${String(pageNumChirho).padStart(4, "0")}-chirho.png`
  );
}

async function ensureCropChirho(
  pageImgChirho: string,
  outPathChirho: string,
  xChirho: number,
  yChirho: number,
  wChirho: number,
  hChirho: number
): Promise<void> {
  if (existsSync(outPathChirho)) return;
  const xpadChirho = Math.max(0, Math.round(xChirho - CROP_PAD_PX_CHIRHO));
  const ypadChirho = Math.max(0, Math.round(yChirho - CROP_PAD_PX_CHIRHO));
  const wpadChirho = Math.round(wChirho + CROP_PAD_PX_CHIRHO * 2);
  const hpadChirho = Math.round(hChirho + CROP_PAD_PX_CHIRHO * 2);
  await runCmdChirho([
    "magick",
    pageImgChirho,
    "-crop",
    `${wpadChirho}x${hpadChirho}+${xpadChirho}+${ypadChirho}`,
    "+repage",
    outPathChirho,
  ]);
}

async function etlPageChirho(volChirho: number, pageNumChirho: number): Promise<{
  canonChirho: number;
  visionChirho: number;
  skippedExistingChirho: number;
}> {
  initDbChirho();
  const pageRowChirho = sqliteChirho
    .query("SELECT id_chirho FROM pages_chirho WHERE volume_number_chirho = ? AND page_number_chirho = ?")
    .get(volChirho, pageNumChirho) as { id_chirho: number } | undefined;
  if (!pageRowChirho) {
    logChirho(MODULE_CHIRHO, `vol ${volChirho} p${pageNumChirho}: not found, skip`);
    return { canonChirho: 0, visionChirho: 0, skippedExistingChirho: 0 };
  }
  const pageIdChirho = pageRowChirho.id_chirho;

  const pageImgChirho = pageImagePathChirho(volChirho, pageNumChirho);
  if (!existsSync(pageImgChirho)) {
    throw new Error(`page image not found: ${pageImgChirho}`);
  }
  const outRootChirho = pairsDirChirho(volChirho, pageNumChirho);
  ensureDirChirho(outRootChirho);

  // Each event row that gave a word its final canonical/vision text is one
  // training pair. We trust the latest projection in words_chirho for the
  // ground-truth text + script, but pull the source tag from the event.
  const eventsChirho = sqliteChirho
    .query(
      `SELECT e.word_id_chirho, e.scanline_id_chirho, e.event_type_chirho,
              e.payload_json_chirho, e.reviewer_chirho,
              w.word_index_chirho, w.x_min_chirho, w.y_min_chirho,
              w.x_max_chirho, w.y_max_chirho, w.current_text_chirho,
              w.current_script_chirho, w.is_human_confirmed_chirho,
              s.line_index_chirho
         FROM events_chirho e
         JOIN words_chirho w ON w.id_chirho = e.word_id_chirho
         JOIN scanlines_chirho s ON s.id_chirho = e.scanline_id_chirho
         WHERE e.page_id_chirho = ?
           AND e.word_id_chirho IS NOT NULL
           AND e.event_type_chirho IN ('word-text-corrected-chirho','word-vision-applied-chirho','word-verified-chirho')
         ORDER BY e.seq_chirho`
    )
    .all(pageIdChirho) as Array<{
      word_id_chirho: number;
      scanline_id_chirho: number;
      event_type_chirho: string;
      payload_json_chirho: string;
      reviewer_chirho: string | null;
      word_index_chirho: number;
      x_min_chirho: number;
      y_min_chirho: number;
      x_max_chirho: number;
      y_max_chirho: number;
      current_text_chirho: string | null;
      current_script_chirho: string | null;
      is_human_confirmed_chirho: number;
      line_index_chirho: number;
    }>;

  let canonChirho = 0;
  let visionChirho = 0;
  let skippedExistingChirho = 0;

  const insertStmtChirho = sqliteChirho.prepare(
    `INSERT OR IGNORE INTO training_pairs_chirho
      (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
       line_idx_chirho, word_idx_chirho,
       x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
       crop_path_chirho, text_chirho, script_chirho, source_chirho,
       certainty_chirho, tesseract_was_chirho)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );

  // Latest-event-per-(word, source) wins. Walk events newest-first.
  const seenChirho = new Set<string>();
  for (let iChirho = eventsChirho.length - 1; iChirho >= 0; iChirho--) {
    const eChirho = eventsChirho[iChirho]!;
    let payloadChirho: any = {};
    try { payloadChirho = JSON.parse(eChirho.payload_json_chirho); } catch {}

    const sourceTagChirho =
      eChirho.reviewer_chirho === "canonical-recon-chirho" ? "canonical-recon-chirho" :
      eChirho.reviewer_chirho === "vision-batch-opus-chirho" ? "opus-vision-chirho" :
      eChirho.is_human_confirmed_chirho === 1 ? "human-chirho" :
      null;
    if (!sourceTagChirho) continue;

    const keyChirho = `${eChirho.word_id_chirho}::${sourceTagChirho}`;
    if (seenChirho.has(keyChirho)) continue;
    seenChirho.add(keyChirho);

    const textChirho = (eChirho.current_text_chirho ?? "").trim();
    const scriptChirho = eChirho.current_script_chirho ?? "unknown-chirho";
    if (textChirho.length === 0) continue;

    const cropFileChirho = `word-${eChirho.word_id_chirho}-chirho.png`;
    const cropPathChirho = join(outRootChirho, cropFileChirho);
    await ensureCropChirho(
      pageImgChirho,
      cropPathChirho,
      eChirho.x_min_chirho,
      eChirho.y_min_chirho,
      eChirho.x_max_chirho - eChirho.x_min_chirho,
      eChirho.y_max_chirho - eChirho.y_min_chirho
    );

    const certChirho =
      sourceTagChirho === "opus-vision-chirho" && typeof payloadChirho.certaintyChirho === "number"
        ? payloadChirho.certaintyChirho as number
        : null;
    const tessWasChirho =
      typeof payloadChirho.tesseractWasChirho === "string"
        ? payloadChirho.tesseractWasChirho as string
        : typeof payloadChirho.oldTextChirho === "string"
        ? payloadChirho.oldTextChirho as string
        : null;

    const resChirho = insertStmtChirho.run(
      eChirho.word_id_chirho,
      eChirho.scanline_id_chirho,
      pageIdChirho,
      volChirho,
      pageNumChirho,
      eChirho.line_index_chirho,
      eChirho.word_index_chirho,
      eChirho.x_min_chirho,
      eChirho.y_min_chirho,
      eChirho.x_max_chirho,
      eChirho.y_max_chirho,
      cropPathChirho,
      textChirho,
      scriptChirho,
      sourceTagChirho,
      certChirho,
      tessWasChirho
    );

    if (resChirho.changes === 0) {
      skippedExistingChirho++;
    } else if (sourceTagChirho === "canonical-recon-chirho") {
      canonChirho++;
    } else if (sourceTagChirho === "opus-vision-chirho") {
      visionChirho++;
    }
  }

  return { canonChirho, visionChirho, skippedExistingChirho };
}

async function mainChirho(): Promise<void> {
  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "", 10);
  const pageArgChirho = argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1];
  const pagesArgChirho = argsChirho.find((aChirho) => aChirho.startsWith("--pages="))?.split("=")[1];
  if (!volChirho || (!pageArgChirho && !pagesArgChirho)) {
    console.error("Usage: bun src-chirho/training-pairs-etl-chirho.ts --vol=N (--page=X | --pages=X-Y)");
    process.exit(1);
  }

  const pagesChirho: number[] = [];
  if (pageArgChirho) pagesChirho.push(parseInt(pageArgChirho, 10));
  else if (pagesArgChirho) {
    const [aChirho, bChirho] = pagesArgChirho.split("-").map((sChirho) => parseInt(sChirho, 10));
    for (let pChirho = aChirho!; pChirho <= bChirho!; pChirho++) pagesChirho.push(pChirho);
  }

  let totalCanonChirho = 0, totalVisionChirho = 0, totalSkipChirho = 0;
  for (const pChirho of pagesChirho) {
    const rChirho = await etlPageChirho(volChirho, pChirho);
    logChirho(MODULE_CHIRHO, `vol ${volChirho} p${pChirho}: +${rChirho.canonChirho} canonical, +${rChirho.visionChirho} vision, ${rChirho.skippedExistingChirho} already-present`);
    totalCanonChirho += rChirho.canonChirho;
    totalVisionChirho += rChirho.visionChirho;
    totalSkipChirho += rChirho.skippedExistingChirho;
  }
  logChirho(MODULE_CHIRHO, `total: ${totalCanonChirho} canonical, ${totalVisionChirho} vision, ${totalSkipChirho} skipped`);
}

mainChirho().catch((errChirho) => {
  console.error(errChirho);
  process.exit(1);
});
