// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Contact sheet of intake pages with their line boxes drawn on, for a
 * human (or agent) eyeball check: tinted boxes show what was found, and
 * untinted print shows what was missed.
 *
 * CLI:
 *   bun src-chirho/corpus-intake-chirho/intake-montage-chirho.ts --vol=2 [--pages=1,5,300] [--count=12]
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import { Database } from "bun:sqlite";
import { rmSync } from "fs";
import { join } from "path";

import { ensureDirChirho, parseCliArgPrefixValueChirho, runCmdChirho } from "../utils-chirho.ts";
import { INTAKE_DB_PATH_CHIRHO, INTAKE_REPORTS_DIR_CHIRHO, INTAKE_ROOT_DIR_CHIRHO } from "./intake-config-chirho.ts";
import { PAGE_DONE_STATUS_CHIRHO } from "./intake-db-chirho.ts";

const TILE_SCALE_PERCENT_CHIRHO = 20;
const BOX_STROKE_PX_CHIRHO = 10;

/** Spread a sample over the volume, weighted to its front matter and back indexes. */
export function samplePagesChirho(donePagesChirho: number[], countChirho: number): number[] {
  if (donePagesChirho.length <= countChirho) return [...donePagesChirho];
  const fractionsChirho = [0, 0.01, 0.03, 1, 0.99, 0.97];
  for (let iChirho = 1; fractionsChirho.length < countChirho; iChirho++) {
    fractionsChirho.push(iChirho / (countChirho - 5));
  }
  const pickedChirho = new Set<number>();
  for (const fChirho of fractionsChirho.slice(0, countChirho)) {
    const idxChirho = Math.min(donePagesChirho.length - 1, Math.round(fChirho * (donePagesChirho.length - 1)));
    pickedChirho.add(donePagesChirho[idxChirho]!);
  }
  return [...pickedChirho].sort((aChirho, bChirho) => aChirho - bChirho);
}

async function mainChirho(): Promise<void> {
  let volChirho: number | null = null;
  let pagesChirho: number[] | null = null;
  let countChirho = 12;
  for (const aChirho of process.argv.slice(2)) {
    let vChirho: string | null;
    if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--vol=")) !== null) volChirho = Number(vChirho);
    else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--pages=")) !== null) pagesChirho = vChirho.split(",").map(Number);
    else if ((vChirho = parseCliArgPrefixValueChirho(aChirho, "--count=")) !== null) countChirho = Number(vChirho);
    else throw new Error(`unknown argument: ${aChirho}`);
  }
  if (volChirho === null || !Number.isInteger(volChirho)) throw new Error("--vol=N is required");

  const dbChirho = new Database(INTAKE_DB_PATH_CHIRHO, { readonly: true });
  const doneChirho = (dbChirho
    .query(`SELECT page_number_chirho FROM intake_pages_chirho WHERE volume_number_chirho = ? AND status_chirho = ? ORDER BY 1`)
    .all(volChirho, PAGE_DONE_STATUS_CHIRHO) as Array<{ page_number_chirho: number }>).map((rChirho) => rChirho.page_number_chirho);
  const chosenChirho = pagesChirho ?? samplePagesChirho(doneChirho, countChirho);
  if (chosenChirho.length === 0) throw new Error(`no extracted pages for vol ${volChirho}`);

  const workDirChirho = join(INTAKE_REPORTS_DIR_CHIRHO, `montage-work-vol-${volChirho}-chirho`);
  rmSync(workDirChirho, { recursive: true, force: true });
  ensureDirChirho(workDirChirho);
  const montageArgsChirho: string[] = [];
  for (const pChirho of chosenChirho) {
    const pageRowChirho = dbChirho
      .query(`SELECT image_rel_path_chirho, line_count_chirho FROM intake_pages_chirho
               WHERE volume_number_chirho = ? AND page_number_chirho = ? AND status_chirho = ?`)
      .get(volChirho, pChirho, PAGE_DONE_STATUS_CHIRHO) as { image_rel_path_chirho: string; line_count_chirho: number } | null;
    if (!pageRowChirho) throw new Error(`vol ${volChirho} p${pChirho} is not extracted`);
    const linesChirho = dbChirho
      .query(`SELECT x_min_chirho, y_min_chirho, width_chirho, height_chirho FROM intake_lines_chirho
               WHERE volume_number_chirho = ? AND page_number_chirho = ? ORDER BY line_index_chirho`)
      .all(volChirho, pChirho) as Array<{ x_min_chirho: number; y_min_chirho: number; width_chirho: number; height_chirho: number }>;
    const drawChirho = linesChirho.flatMap((lChirho) => [
      "-draw",
      `rectangle ${lChirho.x_min_chirho},${lChirho.y_min_chirho} ` +
        `${lChirho.x_min_chirho + lChirho.width_chirho},${lChirho.y_min_chirho + lChirho.height_chirho}`,
    ]);
    const tileChirho = join(workDirChirho, `p${String(pChirho).padStart(4, "0")}-chirho.png`);
    await runCmdChirho([
      "magick",
      join(INTAKE_ROOT_DIR_CHIRHO, pageRowChirho.image_rel_path_chirho),
      "-fill", "rgba(255,0,0,0.18)",
      "-stroke", "rgba(220,0,0,0.9)",
      "-strokewidth", String(BOX_STROKE_PX_CHIRHO),
      ...drawChirho,
      "-resize", `${TILE_SCALE_PERCENT_CHIRHO}%`,
      tileChirho,
    ]);
    montageArgsChirho.push("-label", `p${pChirho} (${pageRowChirho.line_count_chirho} lines)`, tileChirho);
  }
  dbChirho.close();

  const outChirho = join(INTAKE_REPORTS_DIR_CHIRHO, `montage-vol-${volChirho}-chirho.png`);
  await runCmdChirho([
    "magick", "montage", ...montageArgsChirho,
    "-tile", "4x", "-geometry", "+10+10", "-pointsize", "22", "-background", "#f4f4f4",
    outChirho,
  ]);
  rmSync(workDirChirho, { recursive: true, force: true });
  console.log(outChirho);
}

if (import.meta.main) {
  await mainChirho();
}
