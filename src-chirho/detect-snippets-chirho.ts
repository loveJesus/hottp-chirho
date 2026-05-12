// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import {
  GARBLED_CHAR_RATIO_THRESHOLD_CHIRHO,
  SNIPPET_MERGE_GAP_CHIRHO,
  RENDER_DPI_CHIRHO,
} from "./config-chirho.ts";
import {
  extractBboxHtmlChirho,
  parseBboxHtmlChirho,
} from "./extract-text-chirho.ts";
import type {
  BboxWordChirho,
  BboxLineChirho,
  SnippetRegionChirho,
  ScriptTypeChirho,
} from "./types-chirho.ts";
import { logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "detect-snippets-chirho";

/**
 * Detect non-French snippet regions on a page.
 *
 * Algorithm:
 * 1. Parse bbox output to get all words with coordinates
 * 2. Mark words as garbled based on special-char ratio
 * 3. Group consecutive garbled words into regions
 * 4. Merge nearby regions
 * 5. Convert PDF coordinates to pixel coordinates at render DPI
 */
export async function detectSnippetsChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<{
  snippetsChirho: SnippetRegionChirho[];
  pageWidthChirho: number;
  pageHeightChirho: number;
}> {
  logChirho(
    MODULE_CHIRHO,
    `Detecting snippets: vol ${volumeNumberChirho} page ${pageNumberChirho}`
  );

  const bboxHtmlChirho = await extractBboxHtmlChirho(
    volumeNumberChirho,
    pageNumberChirho
  );
  const parsedChirho = parseBboxHtmlChirho(bboxHtmlChirho);

  // Collect all garbled words with their positions
  const garbledWordsChirho: BboxWordChirho[] = [];

  for (const lineChirho of parsedChirho.linesChirho) {
    for (const wordChirho of lineChirho.wordsChirho) {
      if (wordChirho.isGarbledChirho) {
        garbledWordsChirho.push(wordChirho);
      }
    }
  }

  logChirho(
    MODULE_CHIRHO,
    `Found ${garbledWordsChirho.length} garbled words on page ${pageNumberChirho}`
  );

  if (garbledWordsChirho.length === 0) {
    return {
      snippetsChirho: [],
      pageWidthChirho: parsedChirho.pageWidthChirho,
      pageHeightChirho: parsedChirho.pageHeightChirho,
    };
  }

  // Group consecutive garbled words into regions
  const rawRegionsChirho = groupGarbledWordsChirho(
    garbledWordsChirho,
    parsedChirho.linesChirho
  );

  // Merge nearby regions
  const mergedRegionsChirho = mergeNearbyRegionsChirho(rawRegionsChirho);

  // Assign indices and detect script types
  const snippetsChirho: SnippetRegionChirho[] = mergedRegionsChirho.map(
    (regionChirho, indexChirho) => ({
      indexChirho,
      xMinChirho: regionChirho.xMinChirho,
      yMinChirho: regionChirho.yMinChirho,
      xMaxChirho: regionChirho.xMaxChirho,
      yMaxChirho: regionChirho.yMaxChirho,
      garbledTextChirho: regionChirho.garbledTextChirho,
      wordCountChirho: regionChirho.wordCountChirho,
      scriptTypeChirho: guessScriptTypeChirho(regionChirho.garbledTextChirho),
    })
  );

  logChirho(
    MODULE_CHIRHO,
    `Detected ${snippetsChirho.length} snippet regions on page ${pageNumberChirho}`
  );

  return {
    snippetsChirho,
    pageWidthChirho: parsedChirho.pageWidthChirho,
    pageHeightChirho: parsedChirho.pageHeightChirho,
  };
}

/** Internal region used during grouping */
interface RawRegionChirho {
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  garbledTextChirho: string;
  wordCountChirho: number;
}

/**
 * Group garbled words into contiguous regions.
 * Words on the same line that are adjacent or only separated by
 * a small gap are grouped together. Short non-garbled words between
 * two garbled words are "bridged" into the region (they're likely
 * garbled text that scored below threshold due to font mapping).
 */
function groupGarbledWordsChirho(
  garbledWordsChirho: BboxWordChirho[],
  linesChirho: BboxLineChirho[]
): RawRegionChirho[] {
  const regionsChirho: RawRegionChirho[] = [];

  // Process line by line to find garbled runs
  for (const lineChirho of linesChirho) {
    let currentRegionChirho: RawRegionChirho | null = null;
    let pendingBridgeChirho: BboxWordChirho | null = null;

    for (let iChirho = 0; iChirho < lineChirho.wordsChirho.length; iChirho++) {
      const wordChirho = lineChirho.wordsChirho[iChirho]!;

      if (wordChirho.isGarbledChirho) {
        // If we had a pending bridge word, include it first
        if (pendingBridgeChirho !== null && currentRegionChirho !== null) {
          extendRegionChirho(currentRegionChirho, pendingBridgeChirho);
          pendingBridgeChirho = null;
        }

        if (currentRegionChirho === null) {
          currentRegionChirho = {
            xMinChirho: wordChirho.xMinChirho,
            yMinChirho: wordChirho.yMinChirho,
            xMaxChirho: wordChirho.xMaxChirho,
            yMaxChirho: wordChirho.yMaxChirho,
            garbledTextChirho: wordChirho.textChirho,
            wordCountChirho: 1,
          };
        } else {
          extendRegionChirho(currentRegionChirho, wordChirho);
        }
      } else {
        // Non-garbled word — check if we should bridge it
        if (currentRegionChirho !== null) {
          // Look ahead: is there a garbled word within the next 2 positions?
          const canBridgeChirho = wordChirho.textChirho.length <= 4 &&
            hasNearbyGarbledChirho(lineChirho.wordsChirho, iChirho, 2);

          if (canBridgeChirho) {
            // Hold this word as a potential bridge
            pendingBridgeChirho = wordChirho;
          } else {
            // End the current region
            regionsChirho.push(currentRegionChirho);
            currentRegionChirho = null;
            pendingBridgeChirho = null;
          }
        } else {
          pendingBridgeChirho = null;
        }
      }
    }

    if (currentRegionChirho !== null) {
      regionsChirho.push(currentRegionChirho);
    }
  }

  return regionsChirho;
}

/** Extend a region with a word's bounds and text */
function extendRegionChirho(
  regionChirho: RawRegionChirho,
  wordChirho: BboxWordChirho
): void {
  regionChirho.xMinChirho = Math.min(regionChirho.xMinChirho, wordChirho.xMinChirho);
  regionChirho.yMinChirho = Math.min(regionChirho.yMinChirho, wordChirho.yMinChirho);
  regionChirho.xMaxChirho = Math.max(regionChirho.xMaxChirho, wordChirho.xMaxChirho);
  regionChirho.yMaxChirho = Math.max(regionChirho.yMaxChirho, wordChirho.yMaxChirho);
  regionChirho.garbledTextChirho += " " + wordChirho.textChirho;
  regionChirho.wordCountChirho++;
}

/** Check if there's a garbled word within the next N positions */
function hasNearbyGarbledChirho(
  wordsChirho: BboxWordChirho[],
  currentIndexChirho: number,
  lookAheadChirho: number
): boolean {
  for (let jChirho = 1; jChirho <= lookAheadChirho; jChirho++) {
    const nextChirho = wordsChirho[currentIndexChirho + jChirho];
    if (nextChirho?.isGarbledChirho) return true;
  }
  return false;
}

/**
 * Merge regions that are close together vertically (consecutive lines).
 * PDF coords: yMin increases downward.
 */
function mergeNearbyRegionsChirho(
  regionsChirho: RawRegionChirho[]
): RawRegionChirho[] {
  if (regionsChirho.length <= 1) return regionsChirho;

  // Sort by yMin then xMin
  const sortedChirho = [...regionsChirho].sort((aChirho, bChirho) => {
    const yDiffChirho = aChirho.yMinChirho - bChirho.yMinChirho;
    if (Math.abs(yDiffChirho) > 2) return yDiffChirho;
    return aChirho.xMinChirho - bChirho.xMinChirho;
  });

  const mergedChirho: RawRegionChirho[] = [sortedChirho[0]!];

  for (let iChirho = 1; iChirho < sortedChirho.length; iChirho++) {
    const currentChirho = sortedChirho[iChirho]!;
    const lastChirho = mergedChirho[mergedChirho.length - 1]!;

    // Merge if vertical gap is small (same or adjacent line)
    const vertGapChirho = currentChirho.yMinChirho - lastChirho.yMaxChirho;
    const horizOverlapChirho =
      currentChirho.xMinChirho < lastChirho.xMaxChirho + SNIPPET_MERGE_GAP_CHIRHO &&
      currentChirho.xMaxChirho > lastChirho.xMinChirho - SNIPPET_MERGE_GAP_CHIRHO;

    if (vertGapChirho < SNIPPET_MERGE_GAP_CHIRHO && horizOverlapChirho) {
      // Merge into last
      lastChirho.xMinChirho = Math.min(
        lastChirho.xMinChirho,
        currentChirho.xMinChirho
      );
      lastChirho.yMinChirho = Math.min(
        lastChirho.yMinChirho,
        currentChirho.yMinChirho
      );
      lastChirho.xMaxChirho = Math.max(
        lastChirho.xMaxChirho,
        currentChirho.xMaxChirho
      );
      lastChirho.yMaxChirho = Math.max(
        lastChirho.yMaxChirho,
        currentChirho.yMaxChirho
      );
      lastChirho.garbledTextChirho += " " + currentChirho.garbledTextChirho;
      lastChirho.wordCountChirho += currentChirho.wordCountChirho;
    } else {
      mergedChirho.push(currentChirho);
    }
  }

  return mergedChirho;
}

/**
 * Convert PDF coordinates (points) to pixel coordinates at render DPI.
 * PDF default is 72 DPI, so multiply by (renderDPI / 72).
 */
export function pdfToPixelChirho(
  coordChirho: number
): number {
  return Math.round(coordChirho * (RENDER_DPI_CHIRHO / 72));
}

/**
 * Guess the script type based on garbled patterns.
 * This is heuristic — the actual content will be confirmed by OCR.
 */
function guessScriptTypeChirho(garbledTextChirho: string): ScriptTypeChirho {
  // Hebrew garbled patterns tend to have: #$%=+()
  const hebrewIndicatorsChirho = (garbledTextChirho.match(/[#$%=+()]/g) || []).length;
  // Greek garbled patterns tend to have: accented capitals Ô È Ê
  const greekIndicatorsChirho = (garbledTextChirho.match(/[ÔÈÊ]/g) || []).length;
  // Syriac tends to have different patterns — rare in Vol 5
  const syriacIndicatorsChirho = (garbledTextChirho.match(/[Ì]/g) || []).length;

  const totalChirho = garbledTextChirho.length || 1;

  if (
    hebrewIndicatorsChirho / totalChirho > 0.1 &&
    hebrewIndicatorsChirho > greekIndicatorsChirho
  ) {
    return "hebrew-chirho";
  }
  if (greekIndicatorsChirho / totalChirho > 0.05) {
    return "greek-chirho";
  }
  if (syriacIndicatorsChirho > 0) {
    return "syriac-chirho";
  }
  if (hebrewIndicatorsChirho > 0 && greekIndicatorsChirho > 0) {
    return "mixed-chirho";
  }

  return "hebrew-chirho"; // Default for this corpus
}

/** CLI: test snippet detection on a single page */
if (import.meta.main) {
  const volChirho = parseInt(process.argv[2] ?? "5", 10);
  const pageChirho = parseInt(process.argv[3] ?? "50", 10);

  const resultChirho = await detectSnippetsChirho(volChirho, pageChirho);

  console.log(
    `\nPage ${pageChirho}: ${resultChirho.snippetsChirho.length} snippet regions detected`
  );
  console.log(
    `Page dimensions: ${resultChirho.pageWidthChirho}x${resultChirho.pageHeightChirho} pts`
  );

  for (const snippetChirho of resultChirho.snippetsChirho) {
    const pxXMinChirho = pdfToPixelChirho(snippetChirho.xMinChirho);
    const pxYMinChirho = pdfToPixelChirho(snippetChirho.yMinChirho);
    const pxXMaxChirho = pdfToPixelChirho(snippetChirho.xMaxChirho);
    const pxYMaxChirho = pdfToPixelChirho(snippetChirho.yMaxChirho);

    console.log(
      `\n  Snippet #${snippetChirho.indexChirho} [${snippetChirho.scriptTypeChirho}] (${snippetChirho.wordCountChirho} words)`
    );
    console.log(
      `    PDF coords: (${snippetChirho.xMinChirho.toFixed(1)}, ${snippetChirho.yMinChirho.toFixed(1)}) - (${snippetChirho.xMaxChirho.toFixed(1)}, ${snippetChirho.yMaxChirho.toFixed(1)})`
    );
    console.log(
      `    Pixel coords: (${pxXMinChirho}, ${pxYMinChirho}) - (${pxXMaxChirho}, ${pxYMaxChirho})`
    );
    console.log(
      `    Garbled: "${snippetChirho.garbledTextChirho.slice(0, 80)}${snippetChirho.garbledTextChirho.length > 80 ? "..." : ""}"`
    );
  }
}
