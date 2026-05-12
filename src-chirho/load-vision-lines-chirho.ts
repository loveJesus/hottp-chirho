// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Load line-by-line vision OCR results into the local SQLite DB.
 * Assembles full page text from individual line transcriptions and
 * stores it in the vision_text_chirho column of pages_chirho.
 *
 * Usage: bun src-chirho/load-vision-lines-chirho.ts
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { sqliteChirho, initDbChirho, logStepStartChirho, logStepEndChirho } from "./db-chirho.ts";
import { logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "load-vision-lines-chirho";

interface VisionLineEntryChirho {
  lineIndexChirho: number;
  textChirho: string;
}

async function loadVisionLinesChirho(): Promise<void> {
  initDbChirho();

  const stepIdChirho = logStepStartChirho(
    MODULE_CHIRHO,
    "Loading line-by-line vision results into pages_chirho.vision_text_chirho"
  );

  const visionDirChirho = join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "vision-results-chirho"
  );

  const filesChirho = readdirSync(visionDirChirho)
    .filter((fChirho) => fChirho.match(/page-\d+-lines-chirho\.json$/))
    .sort();

  logChirho(MODULE_CHIRHO, `Found ${filesChirho.length} vision line result files`);

  let updatedCountChirho = 0;

  const updateStmtChirho = sqliteChirho.prepare(`
    UPDATE pages_chirho
    SET vision_text_chirho = ?,
        status_chirho = 'vision-done-chirho',
        updated_at_chirho = datetime('now')
    WHERE volume_number_chirho = 5 AND page_number_chirho = ?
  `);

  for (const fileNameChirho of filesChirho) {
    // Extract page number: page-0050-lines-chirho.json -> 50
    const pageMatchChirho = fileNameChirho.match(/page-(\d+)-lines-chirho\.json/);
    if (!pageMatchChirho) continue;

    const pageNumberChirho = parseInt(pageMatchChirho[1]!, 10);
    const filePathChirho = join(visionDirChirho, fileNameChirho);
    const rawChirho = readFileSync(filePathChirho, "utf-8");

    let linesChirho: VisionLineEntryChirho[];
    try {
      linesChirho = JSON.parse(rawChirho);
    } catch (parseErrChirho) {
      logChirho(MODULE_CHIRHO, `Failed to parse ${fileNameChirho}: ${parseErrChirho}`);
      continue;
    }

    // Sort by lineIndex and assemble full page text
    linesChirho.sort((aChirho, bChirho) => aChirho.lineIndexChirho - bChirho.lineIndexChirho);
    const fullTextChirho = linesChirho
      .map((lineChirho) => lineChirho.textChirho)
      .join("\n");

    const resultChirho = updateStmtChirho.run(fullTextChirho, pageNumberChirho);

    if (resultChirho.changes > 0) {
      updatedCountChirho++;
      logChirho(
        MODULE_CHIRHO,
        `Page ${pageNumberChirho}: ${linesChirho.length} lines → ${fullTextChirho.length} chars`
      );
    } else {
      logChirho(MODULE_CHIRHO, `Page ${pageNumberChirho}: no matching row found`);
    }
  }

  const summaryChirho = `Updated ${updatedCountChirho} pages with vision text`;
  logChirho(MODULE_CHIRHO, summaryChirho);

  logStepEndChirho(
    stepIdChirho,
    summaryChirho,
    "Vision line results loaded. Ready for D1 sync."
  );
}

if (import.meta.main) {
  await loadVisionLinesChirho();
}
