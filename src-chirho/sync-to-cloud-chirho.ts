// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Sync local sqlite + workspace assets to Cloudflare D1 + R2.
 *
 * Steps (run sequentially):
 *   1. Push pages, scanlines, segments, known_words to D1 by emitting batched
 *      SQL files and applying via `bunx wrangler d1 execute`. Each batch is
 *      capped at 100 statements (D1 limit).
 *   2. Upload page PNGs to R2 at  vol-N-chirho/page-NNNN-chirho/full-page-chirho.png
 *   3. Upload line crops to R2 at vol-N-chirho/page-NNNN-chirho/line-LLL-chirho.png
 *
 * The page editor's `imageR2KeyChirho` / `fullPageR2KeyChirho` references
 * those exact paths. Updates the `image_r2_key_chirho` field on each scanline
 * after upload so the route can build R2 URLs deterministically.
 *
 * CLI:
 *   bun src-chirho/sync-to-cloud-chirho.ts            # sync everything
 *   bun src-chirho/sync-to-cloud-chirho.ts --db-only  # skip R2
 *   bun src-chirho/sync-to-cloud-chirho.ts --r2-only  # skip D1
 *   bun src-chirho/sync-to-cloud-chirho.ts --pages-only          # skip line crops
 *   bun src-chirho/sync-to-cloud-chirho.ts --pilot   # only vols 1-5
 */

import { existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

import {
  PROJECT_ROOT_CHIRHO,
  IMAGES_DIR_CHIRHO,
  SCANLINES_DIR_CHIRHO,
} from "./config-chirho.ts";
import {
  initDbChirho,
  sqliteChirho,
  logStepStartChirho,
  logStepEndChirho,
} from "./db-chirho.ts";
import { runCmdChirho, logChirho, ensureDirChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "sync-to-cloud-chirho";
const AGENT_CODE_CHIRHO = "sync-to-cloud-chirho";

const D1_NAME_CHIRHO = "hottp-d1-chirho";
const R2_BUCKET_CHIRHO = "hottp-chirho";
const WRANGLER_CONFIG_CHIRHO = join(PROJECT_ROOT_CHIRHO, "app-chirho", "wrangler-chirho.toml");
const SYNC_TMP_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "sync-tmp-chirho");
const D1_BATCH_SIZE_CHIRHO = 100;

function sqlEscapeChirho(valChirho: unknown): string {
  if (valChirho === null || valChirho === undefined) return "NULL";
  if (typeof valChirho === "number") return String(valChirho);
  if (typeof valChirho === "boolean") return valChirho ? "1" : "0";
  const sChirho = String(valChirho).replace(/'/g, "''");
  return `'${sChirho}'`;
}

interface RowChirho { [key: string]: unknown }

function fetchRowsChirho(sqlChirho: string, paramsChirho: unknown[] = []): RowChirho[] {
  const stmtChirho = sqliteChirho.prepare(sqlChirho);
  return stmtChirho.all(...paramsChirho) as RowChirho[];
}

function buildInsertChirho(tableChirho: string, rowChirho: RowChirho): string {
  const colsChirho = Object.keys(rowChirho);
  const valsChirho = colsChirho.map((cChirho) => sqlEscapeChirho(rowChirho[cChirho]));
  return `INSERT OR REPLACE INTO ${tableChirho} (${colsChirho.join(", ")}) VALUES (${valsChirho.join(", ")});`;
}

function writeBatchedSqlChirho(
  dirChirho: string,
  prefixChirho: string,
  statementsChirho: string[]
): string[] {
  ensureDirChirho(dirChirho);
  const filesChirho: string[] = [];
  for (let iChirho = 0; iChirho < statementsChirho.length; iChirho += D1_BATCH_SIZE_CHIRHO) {
    const chunkChirho = statementsChirho.slice(iChirho, iChirho + D1_BATCH_SIZE_CHIRHO);
    const fnChirho = join(
      dirChirho,
      `${prefixChirho}-${String(Math.floor(iChirho / D1_BATCH_SIZE_CHIRHO)).padStart(4, "0")}-chirho.sql`
    );
    writeFileSync(fnChirho, chunkChirho.join("\n"), "utf8");
    filesChirho.push(fnChirho);
  }
  return filesChirho;
}

async function applySqlFileToD1Chirho(filePathChirho: string): Promise<void> {
  await runCmdChirho(
    [
      "bunx", "wrangler", "d1", "execute",
      D1_NAME_CHIRHO,
      "--remote",
      "--config", WRANGLER_CONFIG_CHIRHO,
      "--file", filePathChirho,
    ],
    { timeoutMsChirho: 120_000 }
  );
}

async function syncDbChirho(volsChirho: number[] | null): Promise<void> {
  ensureDirChirho(SYNC_TMP_DIR_CHIRHO);

  const volFilterChirho = volsChirho
    ? `WHERE volume_number_chirho IN (${volsChirho.join(",")})`
    : "";

  const pagesChirho = fetchRowsChirho(
    `SELECT id_chirho, volume_number_chirho, page_number_chirho, french_text_chirho,
            image_path_chirho, snippet_count_chirho, vision_text_chirho,
            reconstructed_text_chirho, lines_approved_at_chirho,
            lines_rejection_note_chirho, status_chirho, created_at_chirho,
            updated_at_chirho
       FROM pages_chirho ${volFilterChirho}
       ORDER BY id_chirho`
  );

  const pageIdsChirho = pagesChirho.map((pChirho) => pChirho.id_chirho as number);
  const pageIdsListChirho = pageIdsChirho.length === 0 ? "(0)" : `(${pageIdsChirho.join(",")})`;

  const scanlinesChirho = fetchRowsChirho(
    `SELECT id_chirho, page_id_chirho, line_index_chirho, x_min_chirho, y_min_chirho,
            width_chirho, height_chirho, pdftotext_chirho, reconstructed_text_chirho,
            image_r2_key_chirho, words_json_chirho, segment_count_chirho, status_chirho
       FROM scanlines_chirho
      WHERE page_id_chirho IN ${pageIdsListChirho}
      ORDER BY id_chirho`
  );

  const scanlineIdsChirho = scanlinesChirho.map((sChirho) => sChirho.id_chirho as number);
  const scanlineIdsListChirho = scanlineIdsChirho.length === 0 ? "(0)" : `(${scanlineIdsChirho.join(",")})`;

  const segmentsChirho = fetchRowsChirho(
    `SELECT seg.id_chirho, seg.scanline_id_chirho, seg.segment_index_chirho,
            seg.word_start_index_chirho, seg.word_end_index_chirho,
            seg.x_min_px_chirho, seg.width_px_chirho, seg.pdftotext_chirho,
            seg.ocr_text_chirho, seg.accepted_text_chirho, seg.script_type_chirho,
            seg.image_r2_key_chirho, seg.status_chirho,
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
      WHERE seg.scanline_id_chirho IN ${scanlineIdsListChirho}
      ORDER BY seg.id_chirho`
  );

  const knownWordsChirho = fetchRowsChirho(
    `SELECT id_chirho, word_chirho, category_chirho, volume_number_chirho,
            status_chirho, source_page_id_chirho, source_line_index_chirho,
            confirmed_at_chirho, confirmed_by_chirho, added_at_chirho,
            added_by_chirho, notes_chirho
       FROM known_words_chirho
       ORDER BY id_chirho`
  );

  const wordsForCloudChirho = fetchRowsChirho(
    `SELECT id_chirho, scanline_id_chirho, word_index_chirho,
            x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
            original_ocr_text_chirho, original_ocr_script_chirho,
            current_text_chirho, current_script_chirho, current_source_chirho,
            is_human_confirmed_chirho, pending_script_flag_chirho,
            last_event_seq_chirho, created_at_chirho
       FROM words_chirho
      WHERE scanline_id_chirho IN ${scanlineIdsListChirho}
      ORDER BY id_chirho`
  );

  // D1 size limit: keep underlay_json_chirho empty on D1; the real body
  // travels via R2. The D1 row stores only the R2 key + snapshot_seq.
  const snapshotsForCloudChirho = fetchRowsChirho(
    `SELECT id_chirho, page_id_chirho, snapshot_seq_chirho,
            '' AS underlay_json_chirho,
            underlay_r2_key_chirho,
            built_at_chirho, updated_at_chirho
       FROM page_snapshots_chirho
      WHERE page_id_chirho IN ${pageIdsListChirho}
      ORDER BY page_id_chirho`
  );

  // Full wipe in FK dependency order (children → parents). Pass1 re-running
  // can change scanline/segment IDs locally; INSERT OR REPLACE then triggers
  // FK violations because the implicit DELETE of the old parent row leaves
  // orphans behind. Plain DELETE-then-INSERT is the cleanest path: dependents
  // first (reviews → snippets → segments → scanlines), then pages, then
  // dictionary. After wipe the inserts go into empty tables — no FK clashes.
  // Wipe order respects FK dependencies: snapshots and words reference
  // scanlines/pages. events_chirho is NEVER wiped by the pipeline — that's
  // the human/AI event log and must be append-only across syncs.
  // Human-confirmed words are also preserved (they hold human truth that
  // the pipeline must not clobber on re-OCR).
  const wipeStatementsChirho = [
    `DELETE FROM reviews_chirho;`,
    `DELETE FROM snippets_chirho;`,
    `DELETE FROM page_snapshots_chirho;`,
    `DELETE FROM segments_chirho;`,
    `DELETE FROM words_chirho WHERE is_human_confirmed_chirho = 0;`,
    `DELETE FROM scanlines_chirho;`,
    `DELETE FROM pages_chirho;`,
    `DELETE FROM known_words_chirho;`,
  ];
  const insertPageStmtsChirho = pagesChirho.map((rChirho) => buildInsertChirho("pages_chirho", rChirho));
  const insertScanlineStmtsChirho = scanlinesChirho.map((rChirho) => buildInsertChirho("scanlines_chirho", rChirho));
  const insertSegmentStmtsChirho = segmentsChirho.map((rChirho) => buildInsertChirho("segments_chirho", rChirho));
  const insertKnownStmtsChirho = knownWordsChirho.map((rChirho) => buildInsertChirho("known_words_chirho", rChirho));
  // INSERT OR IGNORE on words: human-confirmed rows (kept above) take precedence.
  const insertWordsStmtsChirho = wordsForCloudChirho.map((rChirho) =>
    buildInsertChirho("words_chirho", rChirho).replace(/^INSERT INTO/, "INSERT OR IGNORE INTO")
  );
  const insertSnapshotStmtsChirho = snapshotsForCloudChirho.map((rChirho) =>
    buildInsertChirho("page_snapshots_chirho", rChirho)
  );

  logChirho(MODULE_CHIRHO, `D1 sync rows: ${pagesChirho.length} pages, ${scanlinesChirho.length} scanlines, ${segmentsChirho.length} segments, ${wordsForCloudChirho.length} words, ${snapshotsForCloudChirho.length} snapshots, ${knownWordsChirho.length} known_words`);

  const wipeFilesChirho = writeBatchedSqlChirho(SYNC_TMP_DIR_CHIRHO, "wipe", wipeStatementsChirho);
  for (const fChirho of wipeFilesChirho) await applySqlFileToD1Chirho(fChirho);

  // Snapshots can be 200-500KB each — they would blow D1's per-statement
  // size limit if batched with normal inserts. Push them one-per-file after
  // the normal batched inserts so each statement is its own request.
  const allInsertChirho = [
    ...insertPageStmtsChirho,
    ...insertScanlineStmtsChirho,
    ...insertSegmentStmtsChirho,
    ...insertWordsStmtsChirho,
    ...insertKnownStmtsChirho,
  ];
  const insertFilesChirho = writeBatchedSqlChirho(SYNC_TMP_DIR_CHIRHO, "insert", allInsertChirho);
  logChirho(MODULE_CHIRHO, `Applying ${insertFilesChirho.length} D1 batch files (${allInsertChirho.length} statements total)`);
  for (let iChirho = 0; iChirho < insertFilesChirho.length; iChirho++) {
    await applySqlFileToD1Chirho(insertFilesChirho[iChirho]!);
    if ((iChirho + 1) % 5 === 0) {
      logChirho(MODULE_CHIRHO, `  ${iChirho + 1} / ${insertFilesChirho.length} batches applied`);
    }
  }

  // Upload each snapshot JSON to R2 (D1 rows hold only the key)
  logChirho(MODULE_CHIRHO, `Uploading ${snapshotsForCloudChirho.length} snapshot bodies to R2`);
  for (let iChirho = 0; iChirho < snapshotsForCloudChirho.length; iChirho++) {
    const rowChirho = snapshotsForCloudChirho[iChirho]!;
    const r2KeyChirho = rowChirho.underlay_r2_key_chirho as string | null;
    if (!r2KeyChirho) {
      logChirho(MODULE_CHIRHO, `  skipping snapshot ${rowChirho.page_id_chirho} (no r2 key)`);
      continue;
    }
    // Derive local file path from r2 key (kept in sync by build-page-snapshot)
    const baseNameChirho = r2KeyChirho.replace(/^snapshots-chirho\//, "");
    const localPathChirho = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "snapshots-chirho", baseNameChirho);
    await r2PutJsonChirho({ localPathChirho, r2KeyChirho });
    if ((iChirho + 1) % 5 === 0) {
      logChirho(MODULE_CHIRHO, `  ${iChirho + 1} / ${snapshotsForCloudChirho.length} R2 uploads done`);
    }
  }

  // Now apply the D1 snapshot rows (each is small now — just metadata + key)
  logChirho(MODULE_CHIRHO, `Applying ${insertSnapshotStmtsChirho.length} D1 snapshot-metadata rows`);
  const snapshotMetaFilesChirho = writeBatchedSqlChirho(SYNC_TMP_DIR_CHIRHO, "snap-meta", insertSnapshotStmtsChirho);
  for (const fChirho of snapshotMetaFilesChirho) await applySqlFileToD1Chirho(fChirho);
}

interface UploadJobChirho { localPathChirho: string; r2KeyChirho: string }

async function r2PutChirho(jobChirho: UploadJobChirho): Promise<void> {
  await runCmdChirho(
    [
      "bunx", "wrangler", "r2", "object", "put",
      `${R2_BUCKET_CHIRHO}/${jobChirho.r2KeyChirho}`,
      "--file", jobChirho.localPathChirho,
      "--remote",
      "--config", WRANGLER_CONFIG_CHIRHO,
      "--content-type", "image/png",
    ],
    { timeoutMsChirho: 60_000 }
  );
}

async function r2PutJsonChirho(jobChirho: UploadJobChirho): Promise<void> {
  await runCmdChirho(
    [
      "bunx", "wrangler", "r2", "object", "put",
      `${R2_BUCKET_CHIRHO}/${jobChirho.r2KeyChirho}`,
      "--file", jobChirho.localPathChirho,
      "--remote",
      "--config", WRANGLER_CONFIG_CHIRHO,
      "--content-type", "application/json",
    ],
    { timeoutMsChirho: 60_000 }
  );
}

async function runUploadsChirho(
  jobsChirho: UploadJobChirho[],
  concurrencyChirho: number
): Promise<void> {
  let nextChirho = 0;
  let doneChirho = 0;
  async function workerChirho(): Promise<void> {
    while (nextChirho < jobsChirho.length) {
      const myIdxChirho = nextChirho++;
      try {
        await r2PutChirho(jobsChirho[myIdxChirho]!);
      } catch (errChirho) {
        logChirho(MODULE_CHIRHO, `R2 PUT failed for ${jobsChirho[myIdxChirho]!.r2KeyChirho}: ${errChirho}`);
      }
      doneChirho++;
      if (doneChirho % 50 === 0 || doneChirho === jobsChirho.length) {
        logChirho(MODULE_CHIRHO, `  R2 progress: ${doneChirho} / ${jobsChirho.length}`);
      }
    }
  }
  const workersChirho = Array.from({ length: concurrencyChirho }, () => workerChirho());
  await Promise.all(workersChirho);
}

async function syncR2Chirho(volsChirho: number[] | null, pagesOnlyChirho: boolean): Promise<void> {
  const jobsChirho: UploadJobChirho[] = [];

  for (const volEntryChirho of readdirSync(IMAGES_DIR_CHIRHO, { withFileTypes: true })) {
    if (!volEntryChirho.isDirectory()) continue;
    const matchChirho = volEntryChirho.name.match(/^vol-(\d+)-chirho$/);
    if (!matchChirho) continue;
    const volNumChirho = parseInt(matchChirho[1]!, 10);
    if (volsChirho && !volsChirho.includes(volNumChirho)) continue;

    const volDirChirho = join(IMAGES_DIR_CHIRHO, volEntryChirho.name);
    for (const fileChirho of readdirSync(volDirChirho)) {
      const pageMatchChirho = fileChirho.match(/^page-(\d+)-chirho\.png$/);
      if (!pageMatchChirho) continue;
      const pageNumStrChirho = pageMatchChirho[1]!;
      jobsChirho.push({
        localPathChirho: join(volDirChirho, fileChirho),
        r2KeyChirho: `vol-${volNumChirho}-chirho/page-${pageNumStrChirho}-chirho/full-page-chirho.png`,
      });
    }
  }

  if (!pagesOnlyChirho) {
    if (existsSync(SCANLINES_DIR_CHIRHO)) {
      for (const volEntryChirho of readdirSync(SCANLINES_DIR_CHIRHO, { withFileTypes: true })) {
        if (!volEntryChirho.isDirectory()) continue;
        const matchChirho = volEntryChirho.name.match(/^vol-(\d+)-chirho$/);
        if (!matchChirho) continue;
        const volNumChirho = parseInt(matchChirho[1]!, 10);
        if (volsChirho && !volsChirho.includes(volNumChirho)) continue;

        const volDirChirho = join(SCANLINES_DIR_CHIRHO, volEntryChirho.name);
        for (const pageEntryChirho of readdirSync(volDirChirho, { withFileTypes: true })) {
          if (!pageEntryChirho.isDirectory()) continue;
          const pageMatchChirho = pageEntryChirho.name.match(/^page-(\d+)-chirho$/);
          if (!pageMatchChirho) continue;
          const pageDirChirho = join(volDirChirho, pageEntryChirho.name);
          for (const lineFileChirho of readdirSync(pageDirChirho)) {
            if (!/^line-\d+-chirho\.png$/.test(lineFileChirho)) continue;
            jobsChirho.push({
              localPathChirho: join(pageDirChirho, lineFileChirho),
              r2KeyChirho: `vol-${volNumChirho}-chirho/${pageEntryChirho.name}/${lineFileChirho}`,
            });
          }
        }
      }
    }
  }

  logChirho(MODULE_CHIRHO, `R2 upload jobs queued: ${jobsChirho.length}`);
  if (jobsChirho.length === 0) return;

  await runUploadsChirho(jobsChirho, 8);

  if (!pagesOnlyChirho) {
    sqliteChirho.run(`
      UPDATE scanlines_chirho
      SET image_r2_key_chirho = (
        SELECT 'vol-' || p.volume_number_chirho || '-chirho/page-' ||
               printf('%04d', p.page_number_chirho) || '-chirho/line-' ||
               printf('%03d', scanlines_chirho.line_index_chirho) || '-chirho.png'
        FROM pages_chirho p WHERE p.id_chirho = scanlines_chirho.page_id_chirho
      )
      WHERE image_r2_key_chirho IS NULL OR image_r2_key_chirho = ''
    `);
  }
}

if (import.meta.main) {
  initDbChirho();

  const argsChirho = process.argv.slice(2);
  const dbOnlyChirho = argsChirho.includes("--db-only");
  const r2OnlyChirho = argsChirho.includes("--r2-only");
  const pagesOnlyChirho = argsChirho.includes("--pages-only");
  const pilotChirho = argsChirho.includes("--pilot");

  const volsChirho: number[] | null = pilotChirho ? [1, 2, 3, 4, 5] : null;

  const stepIdChirho = logStepStartChirho(
    AGENT_CODE_CHIRHO,
    `Sync to cloud (db-only=${dbOnlyChirho}, r2-only=${r2OnlyChirho}, pages-only=${pagesOnlyChirho}, pilot=${pilotChirho})`
  );

  try {
    if (!r2OnlyChirho) {
      logChirho(MODULE_CHIRHO, "=== D1 sync ===");
      await syncDbChirho(volsChirho);
    }
    if (!dbOnlyChirho) {
      logChirho(MODULE_CHIRHO, "=== R2 sync ===");
      await syncR2Chirho(volsChirho, pagesOnlyChirho);
    }
    logStepEndChirho(stepIdChirho, "Sync OK", "Synced local sqlite + workspace assets to D1 + R2.");
    logChirho(MODULE_CHIRHO, "Done.");
  } catch (errChirho) {
    logStepEndChirho(stepIdChirho, `Error: ${errChirho}`, "Sync failed.");
    throw errChirho;
  }
}
