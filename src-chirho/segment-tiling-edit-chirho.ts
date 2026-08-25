// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Pure segment-tiling edits shared by the review server and its browser page.
 *
 * A reviewed line is tiled: its segments are contiguous, positive-width, and
 * together cover exactly 0..lineWidthPx. Every edit here preserves that
 * invariant, because `validateSegmentRepairProposalSpansChirho` refuses a
 * proposal that breaks it and the apply lane refuses a non-contiguous tiling.
 * A "drawn box" is therefore never a floating rectangle: it carves the drawn
 * x-range out of whatever already covers it, and the neighbours keep the rest.
 *
 * The browser gets these functions VERBATIM: the server transpiles this file
 * and injects the result into its inline script (see
 * `segmentTilingEditClientScriptChirho`), so there is no second copy to drift.
 * That is also why the shared block below uses only browser-safe syntax and no
 * imports — `check-segment-tiling-edit-chirho.ts` proves both sides agree.
 *
 * Workflow: spec-chirho/workflows-chirho/segment-repair-proposal-workflow-chirho.md
 */

export interface SegmentTilingRowChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
}

export interface DrawnBoxResultChirho {
  rowsChirho: SegmentTilingRowChirho[];
  drawnIndexChirho: number;
}

// ---------------------------------------------------------------------------
// SHARED BLOCK START CHIRHO — everything below to SHARED BLOCK END is shipped
// to the browser verbatim. Keep it dependency-free and side-effect-free.
// ---------------------------------------------------------------------------

export function reindexTilingRowsChirho(rowsChirho: SegmentTilingRowChirho[]): SegmentTilingRowChirho[] {
  return rowsChirho.map((rowChirho, indexChirho) => ({
    segmentIndexChirho: indexChirho,
    xMinPxChirho: rowChirho.xMinPxChirho,
    widthPxChirho: rowChirho.widthPxChirho,
    scriptChirho: rowChirho.scriptChirho,
    utf8TextChirho: rowChirho.utf8TextChirho,
  }));
}

/** Null when the rows tile 0..lineWidthPx exactly; otherwise the reason they do not. */
export function tilingCoverageErrorChirho(
  rowsChirho: SegmentTilingRowChirho[],
  lineWidthPxChirho: number
): string | null {
  if (!Number.isInteger(lineWidthPxChirho) || lineWidthPxChirho <= 0) {
    return "line width must be a positive integer";
  }
  if (rowsChirho.length === 0) return "a line needs at least one box";
  let cursorChirho = 0;
  for (let indexChirho = 0; indexChirho < rowsChirho.length; indexChirho += 1) {
    const rowChirho = rowsChirho[indexChirho] as SegmentTilingRowChirho;
    if (!Number.isInteger(rowChirho.xMinPxChirho) || !Number.isInteger(rowChirho.widthPxChirho)) {
      return "box " + indexChirho + " has a non-integer left or width";
    }
    if (rowChirho.widthPxChirho <= 0) return "box " + indexChirho + " has a width of " + rowChirho.widthPxChirho;
    if (rowChirho.xMinPxChirho !== cursorChirho) {
      return "box " + indexChirho + " starts at " + rowChirho.xMinPxChirho + ", expected " + cursorChirho;
    }
    cursorChirho += rowChirho.widthPxChirho;
  }
  if (cursorChirho !== lineWidthPxChirho) {
    return "boxes end at " + cursorChirho + ", expected " + lineWidthPxChirho;
  }
  return null;
}

function joinedTilingTextChirho(textsChirho: string[]): string {
  return textsChirho
    .map((textChirho) => String(textChirho === null || textChirho === undefined ? "" : textChirho).trim())
    .filter((textChirho) => textChirho.length > 0)
    .join(" ");
}

/**
 * Carve [startXPx, endXPx) out of an existing tiling and hand it back as one box.
 *
 * Text is never dropped silently:
 *  - boxes swallowed whole by the drawn range hand their text to the drawn box;
 *  - a box clipped on one side keeps its text on the surviving stub;
 *  - a box the drawn range sits strictly inside keeps its text on the LEFT stub
 *    and leaves the right stub empty, matching what the split button does.
 */
export function drawnBoxTilingRowsChirho(
  rowsChirho: SegmentTilingRowChirho[],
  startXPxChirho: number,
  endXPxChirho: number,
  lineWidthPxChirho: number,
  drawnScriptChirho: string
): DrawnBoxResultChirho {
  const coverageErrorChirho = tilingCoverageErrorChirho(rowsChirho, lineWidthPxChirho);
  if (coverageErrorChirho !== null) {
    throw new Error("cannot draw on a broken tiling: " + coverageErrorChirho);
  }
  const leftEdgeChirho = Math.min(startXPxChirho, endXPxChirho);
  const rightEdgeChirho = Math.max(startXPxChirho, endXPxChirho);
  if (!Number.isInteger(leftEdgeChirho) || !Number.isInteger(rightEdgeChirho)) {
    throw new Error("drawn box edges must be integers");
  }
  if (leftEdgeChirho < 0 || rightEdgeChirho > lineWidthPxChirho) {
    throw new Error("drawn box must stay inside the line");
  }
  if (rightEdgeChirho - leftEdgeChirho < 1) {
    throw new Error("drawn box must be at least 1px wide");
  }
  const beforeChirho: SegmentTilingRowChirho[] = [];
  const afterChirho: SegmentTilingRowChirho[] = [];
  const absorbedTextsChirho: string[] = [];
  for (let indexChirho = 0; indexChirho < rowsChirho.length; indexChirho += 1) {
    const rowChirho = rowsChirho[indexChirho] as SegmentTilingRowChirho;
    const rowStartChirho = rowChirho.xMinPxChirho;
    const rowEndChirho = rowStartChirho + rowChirho.widthPxChirho;
    const leftStubWidthChirho = Math.min(rowEndChirho, leftEdgeChirho) - rowStartChirho;
    const rightStubStartChirho = Math.max(rowStartChirho, rightEdgeChirho);
    const rightStubWidthChirho = rowEndChirho - rightStubStartChirho;
    const straddlesChirho = leftStubWidthChirho > 0 && rightStubWidthChirho > 0;
    if (leftStubWidthChirho > 0) {
      beforeChirho.push({
        segmentIndexChirho: beforeChirho.length,
        xMinPxChirho: rowStartChirho,
        widthPxChirho: leftStubWidthChirho,
        scriptChirho: rowChirho.scriptChirho,
        utf8TextChirho: rowChirho.utf8TextChirho,
      });
    }
    if (rightStubWidthChirho > 0) {
      afterChirho.push({
        segmentIndexChirho: afterChirho.length,
        xMinPxChirho: rightStubStartChirho,
        widthPxChirho: rightStubWidthChirho,
        scriptChirho: rowChirho.scriptChirho,
        utf8TextChirho: straddlesChirho ? "" : rowChirho.utf8TextChirho,
      });
    }
    if (leftStubWidthChirho <= 0 && rightStubWidthChirho <= 0) {
      absorbedTextsChirho.push(rowChirho.utf8TextChirho);
    }
  }
  const drawnRowChirho: SegmentTilingRowChirho = {
    segmentIndexChirho: beforeChirho.length,
    xMinPxChirho: leftEdgeChirho,
    widthPxChirho: rightEdgeChirho - leftEdgeChirho,
    scriptChirho: drawnScriptChirho,
    utf8TextChirho: joinedTilingTextChirho(absorbedTextsChirho),
  };
  const nextRowsChirho = reindexTilingRowsChirho(beforeChirho.concat([drawnRowChirho], afterChirho));
  return { rowsChirho: nextRowsChirho, drawnIndexChirho: beforeChirho.length };
}

/**
 * Manual-first slate (Andrew's handwritten pages): collapse the whole line to a
 * single box so the reviewer tags it themselves instead of fighting the
 * auto-segmentation. `keepTextChirho` decides whether the OCR reading survives
 * as a crib or the reviewer starts from blank.
 */
export function manualFirstTilingRowsChirho(
  rowsChirho: SegmentTilingRowChirho[],
  lineWidthPxChirho: number,
  keepTextChirho: boolean
): SegmentTilingRowChirho[] {
  const coverageErrorChirho = tilingCoverageErrorChirho(rowsChirho, lineWidthPxChirho);
  if (coverageErrorChirho !== null) {
    throw new Error("cannot start manual-first from a broken tiling: " + coverageErrorChirho);
  }
  const textsChirho = rowsChirho.map((rowChirho) => rowChirho.utf8TextChirho);
  return [
    {
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: lineWidthPxChirho,
      scriptChirho: "unknown-script-chirho",
      utf8TextChirho: keepTextChirho ? joinedTilingTextChirho(textsChirho) : "",
    },
  ];
}

/**
 * Name the edit the reviewer just made with an existing repair kind, so the
 * saved draft is not silently mislabelled. More boxes than before is a split,
 * fewer is a merge, same count is a rebox.
 */
export function tilingEditRepairKindChirho(beforeCountChirho: number, afterCountChirho: number): string {
  if (afterCountChirho > beforeCountChirho) return "split-chirho";
  if (afterCountChirho < beforeCountChirho) return "merge-chirho";
  return "rebox-chirho";
}

/**
 * Zoom-crop geometry is in IMAGE pixels; span geometry is in LINE pixels. On
 * vol-5 lines the line image is stored at ~0.667x, so mixing the two units puts
 * the red box off the crop entirely and maps a pointer to the wrong line-x.
 * Everything below converts explicitly, so the caller can never mix them again.
 */
export function cropToLineScaleChirho(lineWidthPxChirho: number, lineImageWidthPxChirho: number): number {
  if (!Number.isFinite(lineWidthPxChirho) || lineWidthPxChirho <= 0) {
    throw new Error("line width must be positive to scale crop geometry");
  }
  if (!Number.isFinite(lineImageWidthPxChirho) || lineImageWidthPxChirho <= 0) {
    throw new Error("line image width must be positive to scale crop geometry");
  }
  return lineImageWidthPxChirho / lineWidthPxChirho;
}

/** Where along the line (in line px) a fraction across the zoom crop points. */
export function cropFractionToLineXChirho(
  fractionChirho: number,
  zoomCropXMinPxChirho: number,
  zoomCropWidthPxChirho: number,
  lineWidthPxChirho: number,
  lineImageWidthPxChirho: number
): number {
  const scaleChirho = cropToLineScaleChirho(lineWidthPxChirho, lineImageWidthPxChirho);
  const imageXChirho = zoomCropXMinPxChirho + fractionChirho * zoomCropWidthPxChirho;
  const lineXChirho = imageXChirho / scaleChirho;
  return Math.round(Math.min(Math.max(lineXChirho, 0), lineWidthPxChirho));
}

/** Where a line-px position sits across the zoom crop, as a 0..1 fraction. */
export function lineXToCropFractionChirho(
  lineXChirho: number,
  zoomCropXMinPxChirho: number,
  zoomCropWidthPxChirho: number,
  lineWidthPxChirho: number,
  lineImageWidthPxChirho: number
): number {
  if (!Number.isFinite(zoomCropWidthPxChirho) || zoomCropWidthPxChirho <= 0) {
    throw new Error("zoom crop width must be positive");
  }
  const scaleChirho = cropToLineScaleChirho(lineWidthPxChirho, lineImageWidthPxChirho);
  return (lineXChirho * scaleChirho - zoomCropXMinPxChirho) / zoomCropWidthPxChirho;
}

// ---------------------------------------------------------------------------
// SHARED BLOCK END CHIRHO
// ---------------------------------------------------------------------------

// Server-side only from here down: this is how the shared block above reaches
// the browser. It is deliberately outside the markers so nothing Node/Bun-only
// can ever be shipped into the page.

import { readFileSync } from "fs";
import { join } from "path";

const SHARED_BLOCK_START_MARKER_CHIRHO = "// SHARED BLOCK START CHIRHO";
const SHARED_BLOCK_END_MARKER_CHIRHO = "// SHARED BLOCK END CHIRHO";

export const SEGMENT_TILING_EDIT_CLIENT_EXPORTS_CHIRHO = [
  "reindexTilingRowsChirho",
  "tilingCoverageErrorChirho",
  "drawnBoxTilingRowsChirho",
  "manualFirstTilingRowsChirho",
  "tilingEditRepairKindChirho",
  "cropToLineScaleChirho",
  "cropFractionToLineXChirho",
  "lineXToCropFractionChirho",
] as const;

export function segmentTilingEditSharedSourceChirho(): string {
  const sourceChirho = readFileSync(join(import.meta.dir, "segment-tiling-edit-chirho.ts"), "utf8");
  const startChirho = sourceChirho.indexOf(SHARED_BLOCK_START_MARKER_CHIRHO);
  const endChirho = sourceChirho.indexOf(SHARED_BLOCK_END_MARKER_CHIRHO);
  if (startChirho < 0 || endChirho < 0 || endChirho <= startChirho) {
    throw new Error("segment-tiling-edit-chirho.ts shared block markers are missing or out of order");
  }
  return sourceChirho.slice(sourceChirho.indexOf("\n", startChirho) + 1, endChirho);
}

/**
 * Browser-ready JavaScript for the shared block: same source, types stripped,
 * module syntax removed. Fail-closed — if anything the browser cannot evaluate
 * survives, or an expected function does not, this throws at server start
 * rather than shipping a broken page.
 */
export function segmentTilingEditClientScriptChirho(): string {
  const transpiledChirho = new Bun.Transpiler({ loader: "ts", target: "browser" }).transformSync(
    segmentTilingEditSharedSourceChirho()
  );
  const strippedChirho = transpiledChirho.replace(/^export\s+(?=function\s)/gm, "");
  if (/^\s*(export|import)\b/m.test(strippedChirho)) {
    throw new Error("segment tiling edit client script still contains module syntax");
  }
  for (const nameChirho of SEGMENT_TILING_EDIT_CLIENT_EXPORTS_CHIRHO) {
    if (!strippedChirho.includes("function " + nameChirho + "(")) {
      throw new Error(`segment tiling edit client script is missing ${nameChirho}`);
    }
  }
  return strippedChirho.trim();
}
