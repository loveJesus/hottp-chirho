// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Line-by-line Vision OCR pipeline.
 *
 * Instead of detecting garbled text via heuristics, this approach:
 * 1. Gets line bounding boxes from pdftotext -bbox-layout
 * 2. Crops each text line from the rendered page image
 * 3. Outputs line images for Claude Vision analysis
 * 4. Claude identifies French vs non-French text in each line
 *
 * This bypasses broken font mapping issues entirely — vision can
 * distinguish Hebrew, Greek, Syriac by actually seeing the glyphs.
 *
 * Usage: bun src-chirho/vision-lines-chirho.ts [vol] [page]
 */

import { join } from "path";
import {
  IMAGES_DIR_CHIRHO,
  RENDER_DPI_CHIRHO,
  PROJECT_ROOT_CHIRHO,
} from "./config-chirho.ts";
import {
  extractBboxHtmlChirho,
  parseBboxHtmlChirho,
} from "./extract-text-chirho.ts";
import { pageImagePathChirho } from "./render-pages-chirho.ts";
import { ensureDirChirho, runCmdChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "vision-lines-chirho";

/** Output directory for line images */
export const LINES_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "lines-chirho"
);

export interface LineImageChirho {
  lineIndexChirho: number;
  imagePathChirho: string;
  /** PDF coordinates for this line */
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  /** Number of words pdftotext detected on this line */
  wordCountChirho: number;
  /** The raw pdftotext text for this line (garbled for non-French) */
  rawTextChirho: string;
}

export interface VisionLineResultChirho {
  lineIndexChirho: number;
  /** Full text of the line as read by vision */
  fullTextChirho: string;
  /** Whether any non-French text was found */
  hasNonFrenchChirho: boolean;
  /** Individual segments of the line */
  segmentsChirho: Array<{
    textChirho: string;
    scriptChirho: "french" | "greek" | "hebrew" | "syriac" | "arabic" | "emoji" | "symbol" | "latin" | "mixed";
  }>;
}

/**
 * Crop each text line from the page image.
 * Returns paths to line images and metadata.
 */
export async function cropPageLinesChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<LineImageChirho[]> {
  logChirho(MODULE_CHIRHO, `Cropping lines: vol ${volumeNumberChirho} page ${pageNumberChirho}`);

  // Get line bounding boxes
  const bboxHtmlChirho = await extractBboxHtmlChirho(volumeNumberChirho, pageNumberChirho);
  const parsedChirho = parseBboxHtmlChirho(bboxHtmlChirho);

  // Source page image
  const pageImgChirho = pageImagePathChirho(volumeNumberChirho, pageNumberChirho);

  // Output directory
  const outputDirChirho = join(
    LINES_DIR_CHIRHO,
    `vol-${volumeNumberChirho}-chirho`,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho`
  );
  await ensureDirChirho(outputDirChirho);

  const dpiScaleChirho = RENDER_DPI_CHIRHO / 72;
  const paddingChirho = 5; // Small padding in pixels
  const lineImagesChirho: LineImageChirho[] = [];

  for (let iChirho = 0; iChirho < parsedChirho.linesChirho.length; iChirho++) {
    const lineChirho = parsedChirho.linesChirho[iChirho]!;

    // Convert PDF coords to pixel coords
    const pxXMinChirho = Math.max(0, Math.round(lineChirho.xMinChirho * dpiScaleChirho) - paddingChirho);
    const pxYMinChirho = Math.max(0, Math.round(lineChirho.yMinChirho * dpiScaleChirho) - paddingChirho);
    const pxXMaxChirho = Math.round(lineChirho.xMaxChirho * dpiScaleChirho) + paddingChirho;
    const pxYMaxChirho = Math.round(lineChirho.yMaxChirho * dpiScaleChirho) + paddingChirho;

    const widthChirho = pxXMaxChirho - pxXMinChirho;
    const heightChirho = pxYMaxChirho - pxYMinChirho;

    if (widthChirho <= 0 || heightChirho <= 0) continue;

    const outputPathChirho = join(
      outputDirChirho,
      `line-${String(iChirho).padStart(3, "0")}-chirho.png`
    );

    // Crop the line from the page image using ImageMagick
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

    // Collect raw text from all words on this line
    const rawTextChirho = lineChirho.wordsChirho
      .map((wChirho) => wChirho.textChirho)
      .join(" ");

    lineImagesChirho.push({
      lineIndexChirho: iChirho,
      imagePathChirho: outputPathChirho,
      xMinChirho: lineChirho.xMinChirho,
      yMinChirho: lineChirho.yMinChirho,
      xMaxChirho: lineChirho.xMaxChirho,
      yMaxChirho: lineChirho.yMaxChirho,
      wordCountChirho: lineChirho.wordsChirho.length,
      rawTextChirho,
    });
  }

  logChirho(MODULE_CHIRHO, `Cropped ${lineImagesChirho.length} lines for page ${pageNumberChirho}`);
  return lineImagesChirho;
}

/** CLI: crop lines for a single page and output JSON manifest */
if (import.meta.main) {
  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const pageChirho = parseInt(process.argv[3] ?? "50", 10);

  const linesChirho = await cropPageLinesChirho(volChirho, pageChirho);

  console.log(`\nCropped ${linesChirho.length} lines from page ${pageChirho}`);
  for (const lineChirho of linesChirho) {
    console.log(
      `  Line ${lineChirho.lineIndexChirho}: ${lineChirho.wordCountChirho} words ` +
      `"${lineChirho.rawTextChirho.slice(0, 60)}${lineChirho.rawTextChirho.length > 60 ? "..." : ""}"`
    );
  }

  // Write manifest JSON
  const manifestPathChirho = join(
    LINES_DIR_CHIRHO,
    `vol-${volChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    "manifest-chirho.json"
  );
  await Bun.write(manifestPathChirho, JSON.stringify(linesChirho, null, 2));
  console.log(`\nManifest written to: ${manifestPathChirho}`);
}
