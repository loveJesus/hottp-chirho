// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { join } from "path";
import { existsSync } from "fs";
import {
  SNIPPETS_DIR_CHIRHO,
  CROP_PADDING_PX_CHIRHO,
  RENDER_DPI_CHIRHO,
} from "./config-chirho.ts";
import { pdfToPixelChirho } from "./detect-snippets-chirho.ts";
import type { SnippetRegionChirho, CroppedSnippetChirho } from "./types-chirho.ts";
import { runCmdChirho, ensureDirChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "crop-snippets-chirho";

/**
 * Crop a snippet region from a rendered page image using ImageMagick.
 *
 * Converts PDF coordinates to pixel coordinates and applies padding.
 */
export async function cropSnippetChirho(
  pageImagePathChirho: string,
  volumeNumberChirho: number,
  pageNumberChirho: number,
  snippetChirho: SnippetRegionChirho,
  pageWidthPtsChirho: number,
  pageHeightPtsChirho: number
): Promise<CroppedSnippetChirho> {
  const snippetDirChirho = join(
    SNIPPETS_DIR_CHIRHO,
    `vol-${volumeNumberChirho}-chirho`,
    `page-${String(pageNumberChirho).padStart(4, "0")}-chirho`
  );
  ensureDirChirho(snippetDirChirho);

  const outputPathChirho = join(
    snippetDirChirho,
    `snippet-${String(snippetChirho.indexChirho).padStart(3, "0")}-chirho.png`
  );

  // Convert PDF points to pixels
  const pxXMinChirho = pdfToPixelChirho(snippetChirho.xMinChirho) - CROP_PADDING_PX_CHIRHO;
  const pxYMinChirho = pdfToPixelChirho(snippetChirho.yMinChirho) - CROP_PADDING_PX_CHIRHO;
  const pxXMaxChirho = pdfToPixelChirho(snippetChirho.xMaxChirho) + CROP_PADDING_PX_CHIRHO;
  const pxYMaxChirho = pdfToPixelChirho(snippetChirho.yMaxChirho) + CROP_PADDING_PX_CHIRHO;

  // Clamp to image bounds
  const imageWidthChirho = pdfToPixelChirho(pageWidthPtsChirho);
  const imageHeightChirho = pdfToPixelChirho(pageHeightPtsChirho);

  const xChirho = Math.max(0, pxXMinChirho);
  const yChirho = Math.max(0, pxYMinChirho);
  const widthChirho = Math.min(pxXMaxChirho, imageWidthChirho) - xChirho;
  const heightChirho = Math.min(pxYMaxChirho, imageHeightChirho) - yChirho;

  if (widthChirho <= 0 || heightChirho <= 0) {
    logChirho(
      MODULE_CHIRHO,
      `Warning: Invalid crop dimensions for snippet ${snippetChirho.indexChirho} on page ${pageNumberChirho}`
    );
    return {
      snippetIndexChirho: snippetChirho.indexChirho,
      imagePathChirho: "",
      regionChirho: snippetChirho,
    };
  }

  // Skip if already cropped
  if (existsSync(outputPathChirho)) {
    logChirho(
      MODULE_CHIRHO,
      `Already cropped: snippet ${snippetChirho.indexChirho} page ${pageNumberChirho}`
    );
    return {
      snippetIndexChirho: snippetChirho.indexChirho,
      imagePathChirho: outputPathChirho,
      regionChirho: snippetChirho,
    };
  }

  logChirho(
    MODULE_CHIRHO,
    `Cropping snippet ${snippetChirho.indexChirho}: ${widthChirho}x${heightChirho}+${xChirho}+${yChirho}`
  );

  // ImageMagick crop: widthxheight+x+y
  const cropGeometryChirho = `${widthChirho}x${heightChirho}+${xChirho}+${yChirho}`;

  await runCmdChirho([
    "convert",
    pageImagePathChirho,
    "-crop", cropGeometryChirho,
    "+repage",
    outputPathChirho,
  ]);

  return {
    snippetIndexChirho: snippetChirho.indexChirho,
    imagePathChirho: outputPathChirho,
    regionChirho: snippetChirho,
  };
}

/**
 * Crop all snippet regions from a page image.
 */
export async function cropAllSnippetsChirho(
  pageImagePathChirho: string,
  volumeNumberChirho: number,
  pageNumberChirho: number,
  snippetsChirho: SnippetRegionChirho[],
  pageWidthPtsChirho: number,
  pageHeightPtsChirho: number
): Promise<CroppedSnippetChirho[]> {
  const resultsChirho: CroppedSnippetChirho[] = [];

  for (const snippetChirho of snippetsChirho) {
    const croppedChirho = await cropSnippetChirho(
      pageImagePathChirho,
      volumeNumberChirho,
      pageNumberChirho,
      snippetChirho,
      pageWidthPtsChirho,
      pageHeightPtsChirho
    );
    resultsChirho.push(croppedChirho);
  }

  return resultsChirho;
}

/** CLI: test cropping on a single page */
if (import.meta.main) {
  const { detectSnippetsChirho } = await import("./detect-snippets-chirho.ts");
  const { renderPageChirho } = await import("./render-pages-chirho.ts");

  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const pageChirho = parseInt(process.argv[3] ?? "50", 10);

  console.log(`Rendering page ${pageChirho}...`);
  const imagePathChirho = await renderPageChirho(volChirho, pageChirho);

  console.log(`Detecting snippets on page ${pageChirho}...`);
  const detectedChirho = await detectSnippetsChirho(volChirho, pageChirho);

  console.log(
    `Cropping ${detectedChirho.snippetsChirho.length} snippets...`
  );
  const croppedChirho = await cropAllSnippetsChirho(
    imagePathChirho,
    volChirho,
    pageChirho,
    detectedChirho.snippetsChirho,
    detectedChirho.pageWidthChirho,
    detectedChirho.pageHeightChirho
  );

  for (const cChirho of croppedChirho) {
    console.log(
      `  Snippet #${cChirho.snippetIndexChirho}: ${cChirho.imagePathChirho || "(skipped)"}`
    );
  }
}
