// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Load OCR results JSON files into the local SQLite DB.
 * Updates suggested_text_chirho and script_type_chirho for each snippet.
 *
 * Usage: bun src-chirho/load-ocr-results-chirho.ts
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { sqliteChirho, initDbChirho, logStepStartChirho, logStepEndChirho } from "./db-chirho.ts";
import { logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "load-ocr-results-chirho";

interface OcrResultEntryChirho {
  snippetIndexChirho: number;
  scriptTypeChirho: string;
  transcribedTextChirho: string;
}

async function loadOcrResultsChirho(): Promise<void> {
  initDbChirho();

  const stepIdChirho = logStepStartChirho(
    MODULE_CHIRHO,
    "Loading OCR results from JSON files into local SQLite DB"
  );

  const ocrDirChirho = join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "ocr-results-chirho"
  );

  const filesChirho = readdirSync(ocrDirChirho)
    .filter((fChirho) => fChirho.endsWith("-chirho.json"))
    .sort();

  logChirho(MODULE_CHIRHO, `Found ${filesChirho.length} OCR result files`);

  let updatedCountChirho = 0;
  let skippedCountChirho = 0;
  let errorCountChirho = 0;

  // Get page_id mapping: page_number -> id_chirho
  const pageMapChirho = new Map<number, number>();
  const pagesChirho = sqliteChirho
    .query("SELECT id_chirho, page_number_chirho FROM pages_chirho WHERE volume_number_chirho = 5")
    .all() as Array<{ id_chirho: number; page_number_chirho: number }>;

  for (const pageChirho of pagesChirho) {
    pageMapChirho.set(pageChirho.page_number_chirho, pageChirho.id_chirho);
  }

  const updateStmtChirho = sqliteChirho.prepare(`
    UPDATE snippets_chirho
    SET suggested_text_chirho = ?,
        script_type_chirho = ?,
        status_chirho = 'ocr-done-chirho',
        updated_at_chirho = datetime('now')
    WHERE page_id_chirho = ? AND snippet_index_chirho = ?
  `);

  for (const fileNameChirho of filesChirho) {
    // Extract page number from filename: page-0050-chirho.json -> 50
    const pageMatchChirho = fileNameChirho.match(/page-(\d+)-chirho\.json/);
    if (!pageMatchChirho) {
      logChirho(MODULE_CHIRHO, `Skipping unrecognized file: ${fileNameChirho}`);
      continue;
    }

    const pageNumberChirho = parseInt(pageMatchChirho[1]!, 10);
    const pageIdChirho = pageMapChirho.get(pageNumberChirho);

    if (!pageIdChirho) {
      logChirho(MODULE_CHIRHO, `No page record found for page ${pageNumberChirho}`);
      skippedCountChirho++;
      continue;
    }

    const filePathChirho = join(ocrDirChirho, fileNameChirho);
    const rawChirho = readFileSync(filePathChirho, "utf-8");

    let entriesChirho: OcrResultEntryChirho[];
    try {
      entriesChirho = JSON.parse(rawChirho);
    } catch (parseErrChirho) {
      logChirho(MODULE_CHIRHO, `Failed to parse ${fileNameChirho}: ${parseErrChirho}`);
      errorCountChirho++;
      continue;
    }

    let pageUpdatesChirho = 0;
    for (const entryChirho of entriesChirho) {
      try {
        const resultChirho = updateStmtChirho.run(
          entryChirho.transcribedTextChirho,
          entryChirho.scriptTypeChirho + "-chirho",
          pageIdChirho,
          entryChirho.snippetIndexChirho
        );

        if (resultChirho.changes > 0) {
          updatedCountChirho++;
          pageUpdatesChirho++;
        } else {
          skippedCountChirho++;
        }
      } catch (dbErrChirho) {
        logChirho(
          MODULE_CHIRHO,
          `DB update failed for page ${pageNumberChirho} snippet ${entryChirho.snippetIndexChirho}: ${dbErrChirho}`
        );
        errorCountChirho++;
      }
    }

    logChirho(
      MODULE_CHIRHO,
      `Page ${pageNumberChirho}: updated ${pageUpdatesChirho}/${entriesChirho.length} snippets`
    );
  }

  // Also update page status for pages that have OCR results
  sqliteChirho.run(`
    UPDATE pages_chirho
    SET status_chirho = 'ocr-done-chirho',
        updated_at_chirho = datetime('now')
    WHERE id_chirho IN (
      SELECT DISTINCT page_id_chirho FROM snippets_chirho
      WHERE status_chirho = 'ocr-done-chirho'
    )
  `);

  const summaryChirho = `Updated: ${updatedCountChirho}, Skipped: ${skippedCountChirho}, Errors: ${errorCountChirho}`;
  logChirho(MODULE_CHIRHO, summaryChirho);

  logStepEndChirho(
    stepIdChirho,
    summaryChirho,
    "OCR results loaded into local SQLite. Ready for D1 sync."
  );
}

if (import.meta.main) {
  await loadOcrResultsChirho();
}
