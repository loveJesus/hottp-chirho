// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * The intake's own SQLite store. Keyed by (volume, PDF page) rather than
 * row ids, so a later D1 load maps pages explicitly. Single writer: only the
 * runner's main process writes, one transaction per page.
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import { Database } from "bun:sqlite";
import { dirname } from "path";

import { ensureDirChirho } from "../utils-chirho.ts";
import { pageKeyChirho } from "./intake-config-chirho.ts";
import type { LineBboxChirho } from "./page-geometry-chirho.ts";

export const PAGE_DONE_STATUS_CHIRHO = "lines-extracted-chirho";
export const PAGE_FAILED_STATUS_CHIRHO = "failed-chirho";

export interface IntakePageResultChirho {
  volumeNumberChirho: number;
  pageNumberChirho: number;
  imageRelPathChirho: string;
  imageSha256Chirho: string;
  imageBytesChirho: number;
  imageWidthChirho: number;
  imageHeightChirho: number;
  frenchTextChirho: string;
  geometrySourceChirho: string;
  geometryVersionChirho: number;
  linesChirho: LineBboxChirho[];
  elapsedMsChirho: number;
}

export interface DonePageChirho {
  imageRelPathChirho: string;
  imageBytesChirho: number;
  geometryVersionChirho: number;
}

export function openIntakeDbChirho(pathChirho: string): Database {
  ensureDirChirho(dirname(pathChirho));
  const dbChirho = new Database(pathChirho, { create: true });
  dbChirho.run("PRAGMA journal_mode = WAL");
  dbChirho.run("PRAGMA foreign_keys = ON");
  dbChirho.run(`
    CREATE TABLE IF NOT EXISTS intake_runs_chirho (
      id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at_chirho TEXT NOT NULL,
      finished_at_chirho TEXT,
      args_json_chirho TEXT NOT NULL,
      concurrency_chirho INTEGER NOT NULL,
      tool_versions_json_chirho TEXT NOT NULL,
      pages_done_chirho INTEGER NOT NULL DEFAULT 0,
      pages_failed_chirho INTEGER NOT NULL DEFAULT 0,
      pages_skipped_chirho INTEGER NOT NULL DEFAULT 0,
      stopped_early_chirho INTEGER NOT NULL DEFAULT 0
    )
  `);
  dbChirho.run(`
    CREATE TABLE IF NOT EXISTS intake_pages_chirho (
      volume_number_chirho INTEGER NOT NULL,
      page_number_chirho INTEGER NOT NULL,
      status_chirho TEXT NOT NULL,
      image_rel_path_chirho TEXT,
      image_sha256_chirho TEXT,
      image_bytes_chirho INTEGER,
      image_width_chirho INTEGER,
      image_height_chirho INTEGER,
      line_count_chirho INTEGER NOT NULL DEFAULT 0,
      french_text_chirho TEXT,
      geometry_source_chirho TEXT,
      geometry_version_chirho INTEGER,
      error_chirho TEXT,
      attempt_count_chirho INTEGER NOT NULL DEFAULT 1,
      elapsed_ms_chirho INTEGER,
      run_id_chirho INTEGER REFERENCES intake_runs_chirho(id_chirho),
      updated_at_chirho TEXT NOT NULL,
      PRIMARY KEY (volume_number_chirho, page_number_chirho)
    ) WITHOUT ROWID
  `);
  // Same column names as D1 scanlines_chirho; pdftotext_chirho holds the
  // line's machine text (tesseract on vols 1-4, the PDF layer on vol 5).
  dbChirho.run(`
    CREATE TABLE IF NOT EXISTS intake_lines_chirho (
      volume_number_chirho INTEGER NOT NULL,
      page_number_chirho INTEGER NOT NULL,
      line_index_chirho INTEGER NOT NULL,
      x_min_chirho INTEGER NOT NULL,
      y_min_chirho INTEGER NOT NULL,
      width_chirho INTEGER NOT NULL,
      height_chirho INTEGER NOT NULL,
      pdftotext_chirho TEXT NOT NULL,
      words_json_chirho TEXT NOT NULL,
      PRIMARY KEY (volume_number_chirho, page_number_chirho, line_index_chirho),
      FOREIGN KEY (volume_number_chirho, page_number_chirho)
        REFERENCES intake_pages_chirho(volume_number_chirho, page_number_chirho)
        ON DELETE CASCADE
    ) WITHOUT ROWID
  `);
  dbChirho.run(
    `CREATE INDEX IF NOT EXISTS intake_pages_status_idx_chirho
       ON intake_pages_chirho(status_chirho, volume_number_chirho)`
  );
  return dbChirho;
}

export function startRunChirho(
  dbChirho: Database,
  argsChirho: unknown,
  concurrencyChirho: number,
  toolVersionsChirho: Record<string, string>
): number {
  const rowChirho = dbChirho
    .query(
      `INSERT INTO intake_runs_chirho
         (started_at_chirho, args_json_chirho, concurrency_chirho, tool_versions_json_chirho)
       VALUES (?, ?, ?, ?) RETURNING id_chirho`
    )
    .get(
      new Date().toISOString(),
      JSON.stringify(argsChirho),
      concurrencyChirho,
      JSON.stringify(toolVersionsChirho)
    ) as { id_chirho: number };
  return rowChirho.id_chirho;
}

export function finishRunChirho(
  dbChirho: Database,
  runIdChirho: number,
  countsChirho: { doneChirho: number; failedChirho: number; skippedChirho: number; stoppedEarlyChirho: boolean }
): void {
  dbChirho.run(
    `UPDATE intake_runs_chirho
        SET finished_at_chirho = ?, pages_done_chirho = ?, pages_failed_chirho = ?,
            pages_skipped_chirho = ?, stopped_early_chirho = ?
      WHERE id_chirho = ?`,
    [
      new Date().toISOString(),
      countsChirho.doneChirho,
      countsChirho.failedChirho,
      countsChirho.skippedChirho,
      countsChirho.stoppedEarlyChirho ? 1 : 0,
      runIdChirho,
    ]
  );
}

const UPSERT_PAGE_SQL_CHIRHO = `
  INSERT INTO intake_pages_chirho
    (volume_number_chirho, page_number_chirho, status_chirho, image_rel_path_chirho,
     image_sha256_chirho, image_bytes_chirho, image_width_chirho, image_height_chirho,
     line_count_chirho, french_text_chirho, geometry_source_chirho, geometry_version_chirho,
     error_chirho, elapsed_ms_chirho, run_id_chirho, updated_at_chirho)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (volume_number_chirho, page_number_chirho) DO UPDATE SET
    status_chirho = excluded.status_chirho,
    image_rel_path_chirho = excluded.image_rel_path_chirho,
    image_sha256_chirho = excluded.image_sha256_chirho,
    image_bytes_chirho = excluded.image_bytes_chirho,
    image_width_chirho = excluded.image_width_chirho,
    image_height_chirho = excluded.image_height_chirho,
    line_count_chirho = excluded.line_count_chirho,
    french_text_chirho = excluded.french_text_chirho,
    geometry_source_chirho = excluded.geometry_source_chirho,
    geometry_version_chirho = excluded.geometry_version_chirho,
    error_chirho = excluded.error_chirho,
    elapsed_ms_chirho = excluded.elapsed_ms_chirho,
    run_id_chirho = excluded.run_id_chirho,
    updated_at_chirho = excluded.updated_at_chirho,
    attempt_count_chirho = intake_pages_chirho.attempt_count_chirho + 1`;

const DELETE_LINES_SQL_CHIRHO = `
  DELETE FROM intake_lines_chirho WHERE volume_number_chirho = ? AND page_number_chirho = ?`;

/** Replace a page's row and lines in one transaction. */
export function recordPageDoneChirho(
  dbChirho: Database,
  runIdChirho: number,
  rChirho: IntakePageResultChirho
): void {
  const insertLineChirho = dbChirho.prepare(
    `INSERT INTO intake_lines_chirho
       (volume_number_chirho, page_number_chirho, line_index_chirho, x_min_chirho,
        y_min_chirho, width_chirho, height_chirho, pdftotext_chirho, words_json_chirho)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  dbChirho.transaction(() => {
    dbChirho.run(DELETE_LINES_SQL_CHIRHO, [rChirho.volumeNumberChirho, rChirho.pageNumberChirho]);
    dbChirho.run(UPSERT_PAGE_SQL_CHIRHO, [
      rChirho.volumeNumberChirho,
      rChirho.pageNumberChirho,
      PAGE_DONE_STATUS_CHIRHO,
      rChirho.imageRelPathChirho,
      rChirho.imageSha256Chirho,
      rChirho.imageBytesChirho,
      rChirho.imageWidthChirho,
      rChirho.imageHeightChirho,
      rChirho.linesChirho.length,
      rChirho.frenchTextChirho,
      rChirho.geometrySourceChirho,
      rChirho.geometryVersionChirho,
      null,
      rChirho.elapsedMsChirho,
      runIdChirho,
      new Date().toISOString(),
    ]);
    rChirho.linesChirho.forEach((lChirho, iChirho) => {
      insertLineChirho.run(
        rChirho.volumeNumberChirho,
        rChirho.pageNumberChirho,
        iChirho,
        lChirho.xMinChirho,
        lChirho.yMinChirho,
        Math.round(lChirho.xMaxChirho - lChirho.xMinChirho),
        Math.round(lChirho.yMaxChirho - lChirho.yMinChirho),
        lChirho.textChirho,
        JSON.stringify(lChirho.wordsChirho)
      );
    });
  })();
}

/** Mark a page failed; any earlier lines for it are removed with the same write. */
export function recordPageFailedChirho(
  dbChirho: Database,
  runIdChirho: number,
  volumeNumberChirho: number,
  pageNumberChirho: number,
  errorChirho: string,
  elapsedMsChirho: number
): void {
  dbChirho.transaction(() => {
    dbChirho.run(DELETE_LINES_SQL_CHIRHO, [volumeNumberChirho, pageNumberChirho]);
    dbChirho.run(UPSERT_PAGE_SQL_CHIRHO, [
      volumeNumberChirho,
      pageNumberChirho,
      PAGE_FAILED_STATUS_CHIRHO,
      null,
      null,
      null,
      null,
      null,
      0,
      null,
      null,
      null,
      errorChirho.slice(0, 4000),
      elapsedMsChirho,
      runIdChirho,
      new Date().toISOString(),
    ]);
  })();
}

/** Pages already extracted, keyed by pageKeyChirho. */
export function donePagesChirho(dbChirho: Database): Map<string, DonePageChirho> {
  const rowsChirho = dbChirho
    .query(
      `SELECT volume_number_chirho, page_number_chirho, image_rel_path_chirho, image_bytes_chirho,
              geometry_version_chirho
         FROM intake_pages_chirho WHERE status_chirho = ?`
    )
    .all(PAGE_DONE_STATUS_CHIRHO) as Array<{
    volume_number_chirho: number;
    page_number_chirho: number;
    image_rel_path_chirho: string;
    image_bytes_chirho: number;
    geometry_version_chirho: number;
  }>;
  return new Map(
    rowsChirho.map((rChirho) => [
      pageKeyChirho(rChirho.volume_number_chirho, rChirho.page_number_chirho),
      {
        imageRelPathChirho: rChirho.image_rel_path_chirho,
        imageBytesChirho: rChirho.image_bytes_chirho,
        geometryVersionChirho: rChirho.geometry_version_chirho,
      },
    ])
  );
}

/** Pages whose last attempt failed, keyed by pageKeyChirho. */
export function failedPageKeysChirho(dbChirho: Database): Set<string> {
  const rowsChirho = dbChirho
    .query(
      `SELECT volume_number_chirho, page_number_chirho FROM intake_pages_chirho WHERE status_chirho = ?`
    )
    .all(PAGE_FAILED_STATUS_CHIRHO) as Array<{ volume_number_chirho: number; page_number_chirho: number }>;
  return new Set(rowsChirho.map((rChirho) => pageKeyChirho(rChirho.volume_number_chirho, rChirho.page_number_chirho)));
}
