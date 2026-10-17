// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Per-volume inventory of the intake: PDF pages, protected, extracted,
 * failed, missing, zero-line pages, lines, image bytes and page time.
 * Read-only on the intake database; writes one JSON report and prints a
 * Markdown table.
 *
 * CLI: bun src-chirho/corpus-intake-chirho/intake-inventory-chirho.ts
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { join } from "path";

import { PROGRESS_DB_PATH_CHIRHO } from "../config-chirho.ts";
import { ensureDirChirho, runCmdChirho } from "../utils-chirho.ts";
import {
  INTAKE_DB_PATH_CHIRHO,
  INTAKE_REPORTS_DIR_CHIRHO,
  INTAKE_ROOT_DIR_CHIRHO,
  INTAKE_VOLUMES_CHIRHO,
} from "./intake-config-chirho.ts";
import { PAGE_DONE_STATUS_CHIRHO, PAGE_FAILED_STATUS_CHIRHO } from "./intake-db-chirho.ts";
import { pdfPageCountChirho } from "./intake-runner-chirho.ts";
import { protectedPagesChirho } from "./protected-pages-chirho.ts";

interface VolumeInventoryChirho {
  volume_chirho: number;
  pdf_pages_chirho: number;
  protected_chirho: number;
  extracted_chirho: number;
  failed_chirho: number;
  missing_chirho: number;
  zero_line_pages_chirho: number[];
  lines_chirho: number;
  image_mb_chirho: number;
  page_seconds_sum_chirho: number;
  first_errors_chirho: Array<{ page_chirho: number; error_chirho: string }>;
}

function inventoryVolumeChirho(
  dbChirho: Database,
  volumeChirho: number,
  pdfPagesChirho: number,
  protectedCountChirho: number
): VolumeInventoryChirho {
  const aggChirho = dbChirho
    .query(
      `SELECT
         SUM(status_chirho = ?) AS extracted_chirho,
         SUM(status_chirho = ?) AS failed_chirho,
         COALESCE(SUM(CASE WHEN status_chirho = ? THEN line_count_chirho END), 0) AS lines_chirho,
         COALESCE(SUM(CASE WHEN status_chirho = ? THEN image_bytes_chirho END), 0) AS bytes_chirho,
         COALESCE(SUM(CASE WHEN status_chirho = ? THEN elapsed_ms_chirho END), 0) AS ms_chirho
       FROM intake_pages_chirho WHERE volume_number_chirho = ?`
    )
    .get(
      PAGE_DONE_STATUS_CHIRHO,
      PAGE_FAILED_STATUS_CHIRHO,
      PAGE_DONE_STATUS_CHIRHO,
      PAGE_DONE_STATUS_CHIRHO,
      PAGE_DONE_STATUS_CHIRHO,
      volumeChirho
    ) as { extracted_chirho: number | null; failed_chirho: number | null; lines_chirho: number; bytes_chirho: number; ms_chirho: number };
  const zeroChirho = dbChirho
    .query(
      `SELECT page_number_chirho FROM intake_pages_chirho
        WHERE volume_number_chirho = ? AND status_chirho = ? AND line_count_chirho = 0
        ORDER BY page_number_chirho`
    )
    .all(volumeChirho, PAGE_DONE_STATUS_CHIRHO) as Array<{ page_number_chirho: number }>;
  const errorsChirho = dbChirho
    .query(
      `SELECT page_number_chirho, error_chirho FROM intake_pages_chirho
        WHERE volume_number_chirho = ? AND status_chirho = ?
        ORDER BY page_number_chirho LIMIT 5`
    )
    .all(volumeChirho, PAGE_FAILED_STATUS_CHIRHO) as Array<{ page_number_chirho: number; error_chirho: string }>;
  const extractedChirho = aggChirho.extracted_chirho ?? 0;
  const failedChirho = aggChirho.failed_chirho ?? 0;
  return {
    volume_chirho: volumeChirho,
    pdf_pages_chirho: pdfPagesChirho,
    protected_chirho: protectedCountChirho,
    extracted_chirho: extractedChirho,
    failed_chirho: failedChirho,
    missing_chirho: pdfPagesChirho - protectedCountChirho - extractedChirho - failedChirho,
    zero_line_pages_chirho: zeroChirho.map((rChirho) => rChirho.page_number_chirho),
    lines_chirho: aggChirho.lines_chirho,
    image_mb_chirho: Math.round((aggChirho.bytes_chirho / 1e6) * 10) / 10,
    page_seconds_sum_chirho: Math.round(aggChirho.ms_chirho / 1000),
    first_errors_chirho: errorsChirho.map((eChirho) => ({
      page_chirho: eChirho.page_number_chirho,
      error_chirho: eChirho.error_chirho.split("\n")[0] ?? "",
    })),
  };
}

async function mainChirho(): Promise<void> {
  if (!existsSync(INTAKE_DB_PATH_CHIRHO)) throw new Error(`no intake database at ${INTAKE_DB_PATH_CHIRHO}`);
  const protectedChirho = protectedPagesChirho(PROGRESS_DB_PATH_CHIRHO);
  const dbChirho = new Database(INTAKE_DB_PATH_CHIRHO, { readonly: true });
  const volumesChirho: VolumeInventoryChirho[] = [];
  for (const vChirho of INTAKE_VOLUMES_CHIRHO) {
    const pdfPagesChirho = await pdfPageCountChirho(vChirho);
    const protectedCountChirho = [...protectedChirho.keysChirho].filter((kChirho) => kChirho.startsWith(`${vChirho}:`)).length;
    volumesChirho.push(inventoryVolumeChirho(dbChirho, vChirho, pdfPagesChirho, protectedCountChirho));
  }
  const runsChirho = dbChirho
    .query(
      `SELECT id_chirho, started_at_chirho, finished_at_chirho, concurrency_chirho, pages_done_chirho,
              pages_failed_chirho, pages_skipped_chirho, stopped_early_chirho, tool_versions_json_chirho
         FROM intake_runs_chirho ORDER BY id_chirho`
    )
    .all();
  dbChirho.close();
  const diskChirho = (await runCmdChirho(["du", "-sk", INTAKE_ROOT_DIR_CHIRHO])).split("\t")[0] ?? "0";

  const reportChirho = {
    generated_at_chirho: new Date().toISOString(),
    intake_disk_mb_chirho: Math.round(Number(diskChirho) / 1024),
    volumes_chirho: volumesChirho,
    runs_chirho: runsChirho,
  };
  ensureDirChirho(INTAKE_REPORTS_DIR_CHIRHO);
  const outPathChirho = join(
    INTAKE_REPORTS_DIR_CHIRHO,
    `inventory-${reportChirho.generated_at_chirho.replace(/[:.]/g, "-")}-chirho.json`
  );
  await Bun.write(outPathChirho, JSON.stringify(reportChirho, null, 2) + "\n");

  const rowsChirho = volumesChirho.map((vChirho) =>
    `| ${vChirho.volume_chirho} | ${vChirho.pdf_pages_chirho} | ${vChirho.protected_chirho} | ${vChirho.extracted_chirho} | ` +
    `${vChirho.failed_chirho} | ${vChirho.missing_chirho} | ${vChirho.zero_line_pages_chirho.length} | ${vChirho.lines_chirho} | ` +
    `${vChirho.image_mb_chirho} | ${vChirho.page_seconds_sum_chirho} |`
  );
  console.log(
    [
      "| Vol | PDF pages | Protected | Extracted | Failed | Missing | Zero-line | Lines | Image MB | Page seconds |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      ...rowsChirho,
    ].join("\n")
  );
  console.log(`\nIntake disk use: ${reportChirho.intake_disk_mb_chirho} MB. Report: ${outPathChirho}`);
}

if (import.meta.main) {
  await mainChirho();
}
