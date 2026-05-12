// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { join } from "path";
import { existsSync } from "fs";
import {
  IMAGES_DIR_CHIRHO,
  RENDER_DPI_CHIRHO,
} from "./config-chirho.ts";
import { pdfPathChirho } from "./extract-text-chirho.ts";
import { runCmdChirho, ensureDirChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "render-pages-chirho";

/** Get the expected image path for a rendered page */
export function pageImagePathChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): string {
  const volumeDirChirho = join(IMAGES_DIR_CHIRHO, `vol-${volumeNumberChirho}-chirho`);
  return join(volumeDirChirho, `page-${String(pageNumberChirho).padStart(4, "0")}-chirho.png`);
}

/**
 * Render a single PDF page to PNG using pdftoppm.
 * Returns the path to the rendered image.
 */
export async function renderPageChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  const pdfChirho = pdfPathChirho(volumeNumberChirho);
  const volumeDirChirho = join(IMAGES_DIR_CHIRHO, `vol-${volumeNumberChirho}-chirho`);
  ensureDirChirho(volumeDirChirho);

  const outputPrefixChirho = join(
    volumeDirChirho,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho`
  );

  const expectedPathChirho = `${outputPrefixChirho}.png`;

  // Skip if already rendered
  if (existsSync(expectedPathChirho)) {
    logChirho(MODULE_CHIRHO, `Already rendered: vol ${volumeNumberChirho} page ${pageNumberChirho}`);
    return expectedPathChirho;
  }

  logChirho(
    MODULE_CHIRHO,
    `Rendering vol ${volumeNumberChirho} page ${pageNumberChirho} at ${RENDER_DPI_CHIRHO} DPI`
  );

  // pdftoppm outputs as prefix-NNNNNN.png, but with -singlefile it drops the number
  await runCmdChirho([
    "pdftoppm",
    "-f", String(pageNumberChirho),
    "-l", String(pageNumberChirho),
    "-r", String(RENDER_DPI_CHIRHO),
    "-png",
    "-singlefile",
    pdfChirho,
    outputPrefixChirho,
  ]);

  if (!existsSync(expectedPathChirho)) {
    throw new Error(
      `Rendered image not found at expected path: ${expectedPathChirho}`
    );
  }

  logChirho(MODULE_CHIRHO, `Rendered: ${expectedPathChirho}`);
  return expectedPathChirho;
}

/**
 * Render a range of pages to PNG.
 * Returns array of { pageNumberChirho, imagePathChirho }.
 */
export async function renderPageRangeChirho(
  volumeNumberChirho: number,
  startPageChirho: number,
  endPageChirho: number
): Promise<{ pageNumberChirho: number; imagePathChirho: string }[]> {
  const resultsChirho: { pageNumberChirho: number; imagePathChirho: string }[] = [];

  for (
    let pageChirho = startPageChirho;
    pageChirho <= endPageChirho;
    pageChirho++
  ) {
    const imagePathChirho = await renderPageChirho(volumeNumberChirho, pageChirho);
    resultsChirho.push({ pageNumberChirho: pageChirho, imagePathChirho });
  }

  return resultsChirho;
}

/** CLI: render pages */
if (import.meta.main) {
  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const startChirho = parseInt(process.argv[3] ?? "50", 10);
  const endChirho = parseInt(process.argv[4] ?? "50", 10);

  console.log(
    `Rendering vol ${volChirho} pages ${startChirho}-${endChirho}...`
  );
  const resultsChirho = await renderPageRangeChirho(
    volChirho,
    startChirho,
    endChirho
  );
  for (const rChirho of resultsChirho) {
    console.log(`  Page ${rChirho.pageNumberChirho}: ${rChirho.imagePathChirho}`);
  }
}
