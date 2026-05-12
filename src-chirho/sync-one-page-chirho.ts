// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Surgical per-page sync.
 *
 * Why this exists: `sync-to-cloud-chirho.ts` wipes ALL scanlines/segments/words
 * on D1 then re-inserts. If even one other page already has events_chirho rows
 * referencing those scanlines/words, the wipe fails on FK constraint. This
 * script only touches one (vol, page) tuple — safe to run after re-OCRing a
 * single page.
 *
 * CLI:
 *   bun src-chirho/sync-one-page-chirho.ts --vol=1 --page=148
 *
 * Steps (all on D1):
 *   1. Refuse if any events_chirho rows exist for this page on D1 (human work
 *      would be orphaned).
 *   2. Cascade-delete D1 rows for the page: events → words → bhs/lxx matches →
 *      segments → scanlines → page_snapshots.
 *   3. INSERT OR REPLACE pages, scanlines, segments, words, page_snapshots for
 *      this page from local sqlite.
 *   4. Upload the snapshot JSON body to R2 at the underlay_r2_key path.
 */

import { writeFileSync, existsSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { initDbChirho, sqliteChirho } from "./db-chirho.ts";
import { runCmdChirho, logChirho, ensureDirChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "sync-one-page-chirho";

const D1_NAME_CHIRHO = "hottp-d1-chirho";
const R2_BUCKET_CHIRHO = "hottp-chirho";
const WRANGLER_CONFIG_CHIRHO = join(PROJECT_ROOT_CHIRHO, "app-chirho", "wrangler-chirho.toml");
const SYNC_TMP_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "sync-tmp-chirho");

function sqlEscapeChirho(valChirho: unknown): string {
  if (valChirho === null || valChirho === undefined) return "NULL";
  if (typeof valChirho === "number") return String(valChirho);
  if (typeof valChirho === "boolean") return valChirho ? "1" : "0";
  const sChirho = String(valChirho).replace(/'/g, "''");
  return `'${sChirho}'`;
}

interface RowChirho { [key: string]: unknown }

function buildInsertChirho(tableChirho: string, rowChirho: RowChirho): string {
  const colsChirho = Object.keys(rowChirho);
  const valsChirho = colsChirho.map((cChirho) => sqlEscapeChirho(rowChirho[cChirho]));
  return `INSERT OR REPLACE INTO ${tableChirho} (${colsChirho.join(", ")}) VALUES (${valsChirho.join(", ")});`;
}

async function applyD1Chirho(sqlChirho: string, labelChirho: string): Promise<void> {
  ensureDirChirho(SYNC_TMP_DIR_CHIRHO);
  const fnChirho = join(SYNC_TMP_DIR_CHIRHO, `one-page-${labelChirho}-chirho.sql`);
  writeFileSync(fnChirho, sqlChirho, "utf8");
  await runCmdChirho(
    [
      "bunx", "wrangler", "d1", "execute",
      D1_NAME_CHIRHO,
      "--remote",
      "--config", WRANGLER_CONFIG_CHIRHO,
      "--file", fnChirho,
    ],
    { timeoutMsChirho: 120_000 }
  );
}

async function queryD1Chirho<TChirho = unknown>(sqlChirho: string): Promise<TChirho[]> {
  const outChirho = await runCmdChirho(
    [
      "bunx", "wrangler", "d1", "execute",
      D1_NAME_CHIRHO,
      "--remote",
      "--config", WRANGLER_CONFIG_CHIRHO,
      "--command", sqlChirho,
      "--json",
    ],
    { timeoutMsChirho: 60_000 }
  );
  const parsedChirho = JSON.parse(outChirho) as { results: TChirho[] }[];
  return parsedChirho[0]?.results ?? [];
}

async function uploadSnapshotR2Chirho(r2KeyChirho: string, localPathChirho: string): Promise<void> {
  await runCmdChirho(
    [
      "bunx", "wrangler", "r2", "object", "put",
      `${R2_BUCKET_CHIRHO}/${r2KeyChirho}`,
      "--file", localPathChirho,
      "--content-type", "application/json",
      "--remote",
      "--config", WRANGLER_CONFIG_CHIRHO,
    ],
    { timeoutMsChirho: 60_000 }
  );
}

async function mainChirho(): Promise<void> {
  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "", 10);
  const pageNumChirho = parseInt(argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1] ?? "", 10);
  if (!volChirho || !pageNumChirho) {
    console.error("Usage: bun src-chirho/sync-one-page-chirho.ts --vol=N --page=X");
    process.exit(1);
  }

  initDbChirho();

  const localPageChirho = sqliteChirho
    .query("SELECT * FROM pages_chirho WHERE volume_number_chirho = ? AND page_number_chirho = ?")
    .get(volChirho, pageNumChirho) as RowChirho | undefined;
  if (!localPageChirho) {
    throw new Error(`vol ${volChirho} p${pageNumChirho}: not found in local sqlite`);
  }
  const localPageIdChirho = localPageChirho.id_chirho as number;
  logChirho(MODULE_CHIRHO, `local page id = ${localPageIdChirho}`);

  // Find the page on D1 (id may match but verify by vol+page).
  const d1PageChirho = (await queryD1Chirho<{ id_chirho: number }>(
    `SELECT id_chirho FROM pages_chirho WHERE volume_number_chirho = ${volChirho} AND page_number_chirho = ${pageNumChirho}`
  ))[0];
  if (!d1PageChirho) {
    logChirho(MODULE_CHIRHO, `D1 has no row for this page — INSERT-only path`);
  } else {
    logChirho(MODULE_CHIRHO, `D1 page id = ${d1PageChirho.id_chirho}`);
    // Safety: never overwrite a page with events on D1.
    const eventCountChirho = (await queryD1Chirho<{ c: number }>(
      `SELECT COUNT(*) AS c FROM events_chirho WHERE page_id_chirho = ${d1PageChirho.id_chirho}`
    ))[0];
    if ((eventCountChirho?.c ?? 0) > 0) {
      throw new Error(
        `D1 has ${eventCountChirho?.c} event(s) on vol ${volChirho} p${pageNumChirho}. ` +
          `Refusing to overwrite — pull events first, then resolve conflict by hand.`
      );
    }
  }

  // ===== build cascade-delete SQL for this page on D1 =====
  const d1PidChirho = d1PageChirho?.id_chirho ?? localPageIdChirho;
  const segIdSubqChirho = `(SELECT id_chirho FROM segments_chirho WHERE scanline_id_chirho IN (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ${d1PidChirho}))`;
  // bhs_matches_chirho / lxx_matches_chirho / verse_context_chirho live only on
  // local sqlite — D1 doesn't carry them, so don't try to DELETE there.
  void segIdSubqChirho;
  const wipeChirho = [
    `DELETE FROM events_chirho WHERE page_id_chirho = ${d1PidChirho};`,
    `DELETE FROM page_snapshots_chirho WHERE page_id_chirho = ${d1PidChirho};`,
    `DELETE FROM words_chirho WHERE scanline_id_chirho IN (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ${d1PidChirho});`,
    `DELETE FROM segments_chirho WHERE scanline_id_chirho IN (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ${d1PidChirho});`,
    `DELETE FROM scanlines_chirho WHERE page_id_chirho = ${d1PidChirho};`,
  ];
  await applyD1Chirho(wipeChirho.join("\n"), "wipe");
  logChirho(MODULE_CHIRHO, `D1 wipe done for page_id ${d1PidChirho}`);

  // ===== local rows to re-insert =====
  const localScanlinesChirho = sqliteChirho
    .query(
      `SELECT id_chirho, page_id_chirho, line_index_chirho, x_min_chirho, y_min_chirho,
              width_chirho, height_chirho, pdftotext_chirho, image_r2_key_chirho,
              words_json_chirho, segment_count_chirho, status_chirho
         FROM scanlines_chirho WHERE page_id_chirho = ?`
    )
    .all(localPageIdChirho) as RowChirho[];
  const scanlineIdsChirho = localScanlinesChirho.map((sChirho) => sChirho.id_chirho as number);
  const segmentsChirho = scanlineIdsChirho.length === 0
    ? []
    : (sqliteChirho
        .query(
          `SELECT * FROM segments_chirho WHERE scanline_id_chirho IN (${scanlineIdsChirho.join(",")})`
        )
        .all() as RowChirho[]);
  const wordsChirho = scanlineIdsChirho.length === 0
    ? []
    : (sqliteChirho
        .query(
          `SELECT id_chirho, scanline_id_chirho, word_index_chirho, x_min_chirho, y_min_chirho,
                  x_max_chirho, y_max_chirho, original_ocr_text_chirho, original_ocr_script_chirho,
                  current_text_chirho, current_script_chirho, current_source_chirho,
                  is_human_confirmed_chirho, pending_script_flag_chirho, last_event_seq_chirho,
                  created_at_chirho
             FROM words_chirho WHERE scanline_id_chirho IN (${scanlineIdsChirho.join(",")})`
        )
        .all() as RowChirho[]);
  const snapshotsChirho = sqliteChirho
    .query(
      `SELECT id_chirho, page_id_chirho, snapshot_seq_chirho, '' AS underlay_json_chirho, underlay_r2_key_chirho
         FROM page_snapshots_chirho WHERE page_id_chirho = ?`
    )
    .all(localPageIdChirho) as RowChirho[];

  logChirho(
    MODULE_CHIRHO,
    `local rows: ${localScanlinesChirho.length} scanlines, ${segmentsChirho.length} segments, ${wordsChirho.length} words, ${snapshotsChirho.length} snapshots`
  );

  // ===== emit INSERT OR REPLACE for the page itself + dependent rows =====
  const insertSqlChirho: string[] = [];
  insertSqlChirho.push(buildInsertChirho("pages_chirho", localPageChirho));
  for (const rChirho of localScanlinesChirho) insertSqlChirho.push(buildInsertChirho("scanlines_chirho", rChirho));
  for (const rChirho of segmentsChirho) insertSqlChirho.push(buildInsertChirho("segments_chirho", rChirho));
  for (const rChirho of wordsChirho) insertSqlChirho.push(buildInsertChirho("words_chirho", rChirho));
  for (const rChirho of snapshotsChirho) insertSqlChirho.push(buildInsertChirho("page_snapshots_chirho", rChirho));

  // D1 cap is 100 statements per --file. 509 words puts us over, so chunk.
  const CHUNK_CHIRHO = 90;
  for (let iChirho = 0; iChirho < insertSqlChirho.length; iChirho += CHUNK_CHIRHO) {
    const sliceChirho = insertSqlChirho.slice(iChirho, iChirho + CHUNK_CHIRHO);
    await applyD1Chirho(sliceChirho.join("\n"), `insert-${String(Math.floor(iChirho / CHUNK_CHIRHO)).padStart(3, "0")}`);
  }
  logChirho(MODULE_CHIRHO, `D1 insert done — ${insertSqlChirho.length} statements`);

  // ===== R2 upload of snapshot body =====
  for (const sChirho of snapshotsChirho) {
    const r2KeyChirho = sChirho.underlay_r2_key_chirho as string | null;
    if (!r2KeyChirho) continue;
    const baseNameChirho = r2KeyChirho.replace(/^snapshots-chirho\//, "");
    const localPathChirho = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "snapshots-chirho", baseNameChirho);
    if (!existsSync(localPathChirho)) {
      logChirho(MODULE_CHIRHO, `WARN snapshot file missing: ${localPathChirho}`);
      continue;
    }
    await uploadSnapshotR2Chirho(r2KeyChirho, localPathChirho);
    logChirho(MODULE_CHIRHO, `R2 uploaded: ${r2KeyChirho}`);
  }

  logChirho(MODULE_CHIRHO, `done. vol ${volChirho} p${pageNumChirho} synced.`);
}

mainChirho().catch((errChirho) => {
  console.error(errChirho);
  process.exit(1);
});
