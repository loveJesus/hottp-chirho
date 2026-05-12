// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Scanline extraction: extract text lines from a page as individual image strips.
 *
 * Reuses parseBboxHtmlChirho() for line bounding boxes and cropPageLinesChirho()
 * logic for ImageMagick cropping, but stores results in the new scanlines_chirho
 * table rather than the old lines-chirho directory.
 *
 * Usage: bun src-chirho/scanline-extract-chirho.ts [vol] [page]
 */

import { join } from "path";
import {
  SCANLINES_DIR_CHIRHO,
  RENDER_DPI_CHIRHO,
} from "./config-chirho.ts";
import {
  extractBboxHtmlChirho,
  parseBboxHtmlChirho,
} from "./extract-text-chirho.ts";
import { pageImagePathChirho, renderPageChirho } from "./render-pages-chirho.ts";
import { ensureDirChirho, runCmdChirho, logChirho } from "./utils-chirho.ts";
import type { BboxLineChirho } from "./types-chirho.ts";
import type { ScanlineWordChirho } from "./types-chirho.ts";

const MODULE_CHIRHO = "scanline-extract-chirho";

/** Result of extracting one scanline */
export interface ExtractedScanlineChirho {
  lineIndexChirho: number;
  imagePathChirho: string;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  pdftotextChirho: string;
  wordsChirho: ScanlineWordChirho[];
}

/**
 * Extract all scanlines from a single page.
 *
 * 1. Ensures page is rendered to PNG
 * 2. Extracts bbox HTML for line/word positions
 * 3. Crops each line from the page image
 * 4. Returns structured data for each line
 */
export async function extractScanlinesChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<{
  scanlinesChirho: ExtractedScanlineChirho[];
  pageWidthChirho: number;
  pageHeightChirho: number;
}> {
  logChirho(
    MODULE_CHIRHO,
    `Extracting scanlines: vol ${volumeNumberChirho} page ${pageNumberChirho}`
  );

  // Ensure page image exists
  await renderPageChirho(volumeNumberChirho, pageNumberChirho);
  const pageImgChirho = pageImagePathChirho(volumeNumberChirho, pageNumberChirho);

  // Get bbox data
  const bboxHtmlChirho = await extractBboxHtmlChirho(
    volumeNumberChirho,
    pageNumberChirho
  );
  const parsedChirho = parseBboxHtmlChirho(bboxHtmlChirho);

  // Output directory for this page's line images
  const outputDirChirho = join(
    SCANLINES_DIR_CHIRHO,
    `vol-${volumeNumberChirho}-chirho`,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho`
  );
  ensureDirChirho(outputDirChirho);

  const dpiScaleChirho = RENDER_DPI_CHIRHO / 72;
  const paddingChirho = 5;
  const scanlinesChirho: ExtractedScanlineChirho[] = [];

  for (
    let iChirho = 0;
    iChirho < parsedChirho.linesChirho.length;
    iChirho++
  ) {
    const lineChirho = parsedChirho.linesChirho[iChirho]!;

    // Convert PDF coords to pixel coords
    const pxXMinChirho = Math.max(
      0,
      Math.round(lineChirho.xMinChirho * dpiScaleChirho) - paddingChirho
    );
    const pxYMinChirho = Math.max(
      0,
      Math.round(lineChirho.yMinChirho * dpiScaleChirho) - paddingChirho
    );
    const pxXMaxChirho =
      Math.round(lineChirho.xMaxChirho * dpiScaleChirho) + paddingChirho;
    const pxYMaxChirho =
      Math.round(lineChirho.yMaxChirho * dpiScaleChirho) + paddingChirho;

    const widthChirho = pxXMaxChirho - pxXMinChirho;
    const heightChirho = pxYMaxChirho - pxYMinChirho;

    if (widthChirho <= 0 || heightChirho <= 0) continue;

    const outputPathChirho = join(
      outputDirChirho,
      `line-${String(iChirho).padStart(3, "0")}-chirho.png`
    );

    // Crop the line from the page image
    try {
      await runCmdChirho([
        "convert",
        pageImgChirho,
        "-crop",
        `${widthChirho}x${heightChirho}+${pxXMinChirho}+${pxYMinChirho}`,
        "+repage",
        outputPathChirho,
      ]);
    } catch (errChirho) {
      logChirho(MODULE_CHIRHO, `Failed to crop line ${iChirho}: ${errChirho}`);
      continue;
    }

    // Build raw text and word data
    const pdftotextChirho = lineChirho.wordsChirho
      .map((wChirho) => wChirho.textChirho)
      .join(" ");

    const wordsChirho: ScanlineWordChirho[] = lineChirho.wordsChirho.map(
      (wChirho) => ({
        textChirho: wChirho.textChirho,
        xMinChirho: wChirho.xMinChirho,
        xMaxChirho: wChirho.xMaxChirho,
        yMinChirho: wChirho.yMinChirho,
        yMaxChirho: wChirho.yMaxChirho,
        garbledScoreChirho: wChirho.garbledScoreChirho,
      })
    );

    scanlinesChirho.push({
      lineIndexChirho: iChirho,
      imagePathChirho: outputPathChirho,
      xMinChirho: lineChirho.xMinChirho,
      yMinChirho: lineChirho.yMinChirho,
      xMaxChirho: lineChirho.xMaxChirho,
      yMaxChirho: lineChirho.yMaxChirho,
      pdftotextChirho,
      wordsChirho,
    });
  }

  logChirho(
    MODULE_CHIRHO,
    `Extracted ${scanlinesChirho.length} scanlines for vol ${volumeNumberChirho} page ${pageNumberChirho}`
  );

  return {
    scanlinesChirho,
    pageWidthChirho: parsedChirho.pageWidthChirho,
    pageHeightChirho: parsedChirho.pageHeightChirho,
  };
}

/** CLI: extract scanlines for a single page */
if (import.meta.main) {
  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const pageChirho = parseInt(process.argv[3] ?? "150", 10);

  const resultChirho = await extractScanlinesChirho(volChirho, pageChirho);

  console.log(
    `\nExtracted ${resultChirho.scanlinesChirho.length} scanlines from vol ${volChirho} page ${pageChirho}`
  );
  console.log(
    `Page dimensions: ${resultChirho.pageWidthChirho}x${resultChirho.pageHeightChirho} pts`
  );

  for (const lineChirho of resultChirho.scanlinesChirho) {
    console.log(
      `  Line ${lineChirho.lineIndexChirho}: ${lineChirho.wordsChirho.length} words ` +
        `"${lineChirho.pdftotextChirho.slice(0, 60)}${lineChirho.pdftotextChirho.length > 60 ? "..." : ""}"`
    );
  }
}
