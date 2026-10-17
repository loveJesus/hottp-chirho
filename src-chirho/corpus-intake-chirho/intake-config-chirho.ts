// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Full-corpus intake: paths and the certified working set it must never touch.
 *
 * Intake artifacts live apart from the progress database, span corpus,
 * export and certification gate, which keep the 46-page working set until a
 * page is deliberately promoted.
 * Plan: spec-chirho/tasklists-chirho/corpus-chirho/26-10-16_13-45-tasklist-full_corpus_intake-chirho.md
 */

import { cpus } from "os";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO, VOLUMES_CHIRHO } from "../config-chirho.ts";

export const INTAKE_ROOT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "corpus-intake-chirho"
);
export const INTAKE_DB_PATH_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO, "intake-chirho.sqlite");
export const INTAKE_PAGES_DIR_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO, "pages-chirho");
export const INTAKE_REPORTS_DIR_CHIRHO = join(INTAKE_ROOT_DIR_CHIRHO, "reports-chirho");

export const INTAKE_VOLUMES_CHIRHO = Object.keys(VOLUMES_CHIRHO)
  .map(Number)
  .sort((aChirho, bChirho) => aChirho - bChirho);

/**
 * The hosted, certified working set: vols 1-4 pp. 148-152 and vol 5
 * pp. 50-70 and 148-152 (46 PDF pages). Pages are PDF page indexes.
 */
export const WORKING_SET_RANGES_CHIRHO: ReadonlyArray<{
  volumeNumberChirho: number;
  firstPageChirho: number;
  lastPageChirho: number;
}> = [
  { volumeNumberChirho: 1, firstPageChirho: 148, lastPageChirho: 152 },
  { volumeNumberChirho: 2, firstPageChirho: 148, lastPageChirho: 152 },
  { volumeNumberChirho: 3, firstPageChirho: 148, lastPageChirho: 152 },
  { volumeNumberChirho: 4, firstPageChirho: 148, lastPageChirho: 152 },
  { volumeNumberChirho: 5, firstPageChirho: 50, lastPageChirho: 70 },
  { volumeNumberChirho: 5, firstPageChirho: 148, lastPageChirho: 152 },
];

export function pageKeyChirho(volumeNumberChirho: number, pageNumberChirho: number): string {
  return `${volumeNumberChirho}:${pageNumberChirho}`;
}

export function workingSetKeysChirho(): Set<string> {
  const keysChirho = new Set<string>();
  for (const rChirho of WORKING_SET_RANGES_CHIRHO) {
    for (let pChirho = rChirho.firstPageChirho; pChirho <= rChirho.lastPageChirho; pChirho++) {
      keysChirho.add(pageKeyChirho(rChirho.volumeNumberChirho, pChirho));
    }
  }
  return keysChirho;
}

/** Leave headroom on a workstation shared with other agents. */
export const DEFAULT_CONCURRENCY_CHIRHO = Math.max(1, Math.floor(cpus().length / 2));

function pad4Chirho(nChirho: number): string {
  return String(nChirho).padStart(4, "0");
}

/**
 * Page image path, relative to INTAKE_ROOT_DIR_CHIRHO, sharded by hundreds:
 * pages-chirho/vol-3-chirho/0100-chirho/page-0123-chirho.png
 */
export function intakeImageRelPathChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): string {
  const shardChirho = pad4Chirho(Math.floor(pageNumberChirho / 100) * 100);
  return join(
    "pages-chirho",
    `vol-${volumeNumberChirho}-chirho`,
    `${shardChirho}-chirho`,
    `page-${pad4Chirho(pageNumberChirho)}-chirho.png`
  );
}
