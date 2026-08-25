// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Guards the shared segment-tiling edits (draw-a-box, manual-first slate).
 *
 * Two jobs:
 *  1. Prove the tiling invariant survives every edit — contiguous, positive
 *     widths, exact 0..lineWidth coverage — because the apply lane refuses a
 *     proposal that breaks it, and prove no reviewer text is dropped silently.
 *  2. Prove the browser copy is the SAME code. The page runs a transpiled copy
 *     of the shared block, so the copy is evaluated here and compared against
 *     the module on every case. Drift fails this check instead of the reviewer.
 */

import {
  SEGMENT_TILING_EDIT_CLIENT_EXPORTS_CHIRHO,
  cropFractionToLineXChirho,
  cropToLineScaleChirho,
  drawnBoxTilingRowsChirho,
  lineXToCropFractionChirho,
  manualFirstTilingRowsChirho,
  segmentTilingEditClientScriptChirho,
  tilingCoverageErrorChirho,
  tilingEditRepairKindChirho,
  type SegmentTilingRowChirho,
} from "./segment-tiling-edit-chirho.ts";

const MODULE_CHIRHO = "check-segment-tiling-edit-chirho";

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function assertChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) failChirho(messageChirho);
}

function assertEqualJsonChirho(actualChirho: unknown, expectedChirho: unknown, labelChirho: string): void {
  const actualTextChirho = JSON.stringify(actualChirho);
  const expectedTextChirho = JSON.stringify(expectedChirho);
  if (actualTextChirho !== expectedTextChirho) {
    failChirho(`${labelChirho}\n  expected: ${expectedTextChirho}\n  actual:   ${actualTextChirho}`);
  }
}

function rowChirho(
  xMinPxChirho: number,
  widthPxChirho: number,
  scriptChirho: string,
  utf8TextChirho: string
): SegmentTilingRowChirho {
  return { segmentIndexChirho: 0, xMinPxChirho, widthPxChirho, scriptChirho, utf8TextChirho };
}

function reindexedChirho(rowsChirho: SegmentTilingRowChirho[]): SegmentTilingRowChirho[] {
  return rowsChirho.map((entryChirho, indexChirho) => ({ ...entryChirho, segmentIndexChirho: indexChirho }));
}

// Andrew's line shape: French running text with Hebrew words carved out of it.
const SAMPLE_LINE_WIDTH_CHIRHO = 1288;
const SAMPLE_ROWS_CHIRHO: SegmentTilingRowChirho[] = reindexedChirho([
  rowChirho(0, 400, "french-chirho", "et en 1R 7 9 pour"),
  rowChirho(400, 200, "hebrew-chirho", "גְּבוּל"),
  rowChirho(600, 300, "french-chirho", "dans la mesure"),
  rowChirho(900, 388, "latin-non-french-chirho", "cf. supra"),
]);

function assertTilesChirho(rowsChirho: SegmentTilingRowChirho[], labelChirho: string): void {
  const errorChirho = tilingCoverageErrorChirho(rowsChirho, SAMPLE_LINE_WIDTH_CHIRHO);
  assertChirho(errorChirho === null, `${labelChirho} broke the tiling invariant: ${errorChirho}`);
  rowsChirho.forEach((entryChirho, indexChirho) => {
    assertChirho(
      entryChirho.segmentIndexChirho === indexChirho,
      `${labelChirho} left segmentIndexChirho ${entryChirho.segmentIndexChirho} at position ${indexChirho}`
    );
  });
}

function checkCoverageDetectionChirho(): void {
  assertChirho(tilingCoverageErrorChirho(SAMPLE_ROWS_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO) === null, "sample line must tile");
  assertChirho(tilingCoverageErrorChirho([], SAMPLE_LINE_WIDTH_CHIRHO) !== null, "an empty line must be rejected");
  assertChirho(
    tilingCoverageErrorChirho([rowChirho(0, 100, "french-chirho", "")], SAMPLE_LINE_WIDTH_CHIRHO) !== null,
    "short coverage must be rejected"
  );
  assertChirho(
    tilingCoverageErrorChirho(
      reindexedChirho([rowChirho(0, 400, "french-chirho", ""), rowChirho(500, 788, "french-chirho", "")]),
      SAMPLE_LINE_WIDTH_CHIRHO
    ) !== null,
    "a gap between boxes must be rejected"
  );
  assertChirho(
    tilingCoverageErrorChirho(
      reindexedChirho([rowChirho(0, 0, "french-chirho", ""), rowChirho(0, 1288, "french-chirho", "")]),
      SAMPLE_LINE_WIDTH_CHIRHO
    ) !== null,
    "a zero-width box must be rejected"
  );
}

function checkDrawInsideOneBoxChirho(): void {
  // The defect class: a Hebrew word printed inside what OCR called French.
  const resultChirho = drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 120, 260, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho");
  assertTilesChirho(resultChirho.rowsChirho, "drawing inside one box");
  assertChirho(resultChirho.rowsChirho.length === 6, "drawing strictly inside one box must yield left stub + drawn + right stub");
  assertChirho(resultChirho.drawnIndexChirho === 1, "the drawn box must follow its left stub");
  const drawnChirho = resultChirho.rowsChirho[1] as SegmentTilingRowChirho;
  assertEqualJsonChirho(
    { xMinPxChirho: drawnChirho.xMinPxChirho, widthPxChirho: drawnChirho.widthPxChirho, scriptChirho: drawnChirho.scriptChirho },
    { xMinPxChirho: 120, widthPxChirho: 140, scriptChirho: "hebrew-chirho" },
    "drawn box geometry"
  );
  assertChirho(drawnChirho.utf8TextChirho === "", "a box drawn inside one box absorbs no whole box, so it starts empty");
  assertChirho(
    (resultChirho.rowsChirho[0] as SegmentTilingRowChirho).utf8TextChirho === "et en 1R 7 9 pour",
    "the left stub keeps the split box's text"
  );
  assertChirho(
    (resultChirho.rowsChirho[2] as SegmentTilingRowChirho).utf8TextChirho === "",
    "the right stub of a straddled box starts empty, as the split button already does"
  );
}

function checkDrawSwallowingWholeBoxesChirho(): void {
  const resultChirho = drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 400, 900, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho");
  assertTilesChirho(resultChirho.rowsChirho, "drawing over whole boxes");
  assertChirho(resultChirho.rowsChirho.length === 3, "two swallowed boxes must collapse into the drawn box");
  const drawnChirho = resultChirho.rowsChirho[resultChirho.drawnIndexChirho] as SegmentTilingRowChirho;
  assertChirho(
    drawnChirho.utf8TextChirho === "גְּבוּל dans la mesure",
    `swallowed text must survive in the drawn box, got: ${drawnChirho.utf8TextChirho}`
  );
}

function checkDrawAtLineEdgesChirho(): void {
  const startChirho = drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 0, 150, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho");
  assertTilesChirho(startChirho.rowsChirho, "drawing at the line start");
  assertChirho(startChirho.drawnIndexChirho === 0, "a box drawn at x0 must be the first box");
  const endChirho = drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 1200, SAMPLE_LINE_WIDTH_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho");
  assertTilesChirho(endChirho.rowsChirho, "drawing at the line end");
  assertChirho(
    endChirho.drawnIndexChirho === endChirho.rowsChirho.length - 1,
    "a box drawn against the right edge must be the last box"
  );
  const wholeChirho = drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 0, SAMPLE_LINE_WIDTH_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho");
  assertTilesChirho(wholeChirho.rowsChirho, "drawing over the whole line");
  assertChirho(wholeChirho.rowsChirho.length === 1, "a box drawn over the whole line leaves exactly one box");
  assertChirho(
    (wholeChirho.rowsChirho[0] as SegmentTilingRowChirho).utf8TextChirho ===
      "et en 1R 7 9 pour גְּבוּל dans la mesure cf. supra",
    "drawing over the whole line must keep every box's text"
  );
}

function checkDrawExactlyOverOneBoxChirho(): void {
  const resultChirho = drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 400, 600, SAMPLE_LINE_WIDTH_CHIRHO, "greek-chirho");
  assertTilesChirho(resultChirho.rowsChirho, "drawing exactly over one box");
  assertChirho(resultChirho.rowsChirho.length === SAMPLE_ROWS_CHIRHO.length, "re-drawing one box must not change the box count");
  const drawnChirho = resultChirho.rowsChirho[resultChirho.drawnIndexChirho] as SegmentTilingRowChirho;
  assertChirho(drawnChirho.scriptChirho === "greek-chirho", "the reviewer's picked script wins over the old one");
  assertChirho(drawnChirho.utf8TextChirho === "גְּבוּל", "re-drawing one box keeps that box's text");
}

function checkDrawRefusalsChirho(): void {
  const refusalsChirho: { labelChirho: string; runChirho: () => unknown }[] = [
    { labelChirho: "zero-width draw", runChirho: () => drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 300, 300, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho") },
    { labelChirho: "draw past the right edge", runChirho: () => drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 1200, 1400, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho") },
    { labelChirho: "draw before the left edge", runChirho: () => drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, -5, 100, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho") },
    { labelChirho: "fractional draw", runChirho: () => drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 10.5, 100, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho") },
    {
      labelChirho: "draw on a broken tiling",
      runChirho: () =>
        drawnBoxTilingRowsChirho(
          reindexedChirho([rowChirho(0, 400, "french-chirho", ""), rowChirho(500, 788, "french-chirho", "")]),
          100,
          200,
          SAMPLE_LINE_WIDTH_CHIRHO,
          "hebrew-chirho"
        ),
    },
  ];
  for (const refusalChirho of refusalsChirho) {
    let threwChirho = false;
    try {
      refusalChirho.runChirho();
    } catch {
      threwChirho = true;
    }
    assertChirho(threwChirho, `${refusalChirho.labelChirho} must be refused, not silently accepted`);
  }
}

function checkManualFirstChirho(): void {
  const keptChirho = manualFirstTilingRowsChirho(SAMPLE_ROWS_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO, true);
  assertTilesChirho(keptChirho, "manual-first keeping text");
  assertChirho(keptChirho.length === 1, "manual-first must collapse the line to one box");
  assertChirho(
    (keptChirho[0] as SegmentTilingRowChirho).utf8TextChirho === "et en 1R 7 9 pour גְּבוּל dans la mesure cf. supra",
    "manual-first keeping text must lose nothing"
  );
  const blankChirho = manualFirstTilingRowsChirho(SAMPLE_ROWS_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO, false);
  assertTilesChirho(blankChirho, "manual-first blanking text");
  assertChirho((blankChirho[0] as SegmentTilingRowChirho).utf8TextChirho === "", "manual-first blank must start empty");
  assertChirho(
    (blankChirho[0] as SegmentTilingRowChirho).scriptChirho === "unknown-script-chirho",
    "a manual-first slate must not assert a script the reviewer has not chosen"
  );
}

function checkRepairKindNamingChirho(): void {
  assertChirho(tilingEditRepairKindChirho(4, 6) === "split-chirho", "more boxes than before is a split");
  assertChirho(tilingEditRepairKindChirho(4, 3) === "merge-chirho", "fewer boxes than before is a merge");
  assertChirho(tilingEditRepairKindChirho(4, 4) === "rebox-chirho", "the same box count is a rebox");
}

// Real geometry from the live queue. 3:151:36:2 stores its line image 1:1;
// 5:148:25:5 is a vol-5 line whose image is stored at ~0.667x, which is where
// mixing crop (image px) and span (line px) units put the red box at 153% left
// - off the crop entirely - before this conversion existed.
const UNSCALED_LINE_CHIRHO = {
  lineWidthPxChirho: 1288,
  lineImageWidthPxChirho: 1288,
  zoomCropXMinPxChirho: 768,
  zoomCropWidthPxChirho: 520,
  spanXMinPxChirho: 1105,
  spanWidthPxChirho: 69,
};
const SCALED_LINE_CHIRHO = {
  lineWidthPxChirho: 1946,
  lineImageWidthPxChirho: 1299,
  zoomCropXMinPxChirho: 773,
  zoomCropWidthPxChirho: 526,
  spanXMinPxChirho: 1580,
  spanWidthPxChirho: 345,
  serverMarkerLeftPctChirho: 52.03166092872578,
  serverMarkerWidthPctChirho: 46.82423534285012,
};

function checkCropLineUnitsChirho(): void {
  assertChirho(cropToLineScaleChirho(1288, 1288) === 1, "an unscaled line image has scale 1");
  assertChirho(
    Math.abs(cropToLineScaleChirho(SCALED_LINE_CHIRHO.lineWidthPxChirho, SCALED_LINE_CHIRHO.lineImageWidthPxChirho) - 0.6675) < 0.001,
    "a vol-5 line image scales at about 0.667"
  );
  for (const badChirho of [[0, 100], [100, 0], [-1, 100], [100, Number.NaN]] as [number, number][]) {
    let threwChirho = false;
    try {
      cropToLineScaleChirho(badChirho[0], badChirho[1]);
    } catch {
      threwChirho = true;
    }
    assertChirho(threwChirho, `crop scale must refuse ${JSON.stringify(badChirho)} rather than return Infinity or NaN`);
  }

  // The defect, stated as a test: the target span's marker must land ON the crop.
  const leftPctChirho =
    lineXToCropFractionChirho(
      SCALED_LINE_CHIRHO.spanXMinPxChirho,
      SCALED_LINE_CHIRHO.zoomCropXMinPxChirho,
      SCALED_LINE_CHIRHO.zoomCropWidthPxChirho,
      SCALED_LINE_CHIRHO.lineWidthPxChirho,
      SCALED_LINE_CHIRHO.lineImageWidthPxChirho
    ) * 100;
  assertChirho(
    leftPctChirho >= 0 && leftPctChirho <= 100,
    `the red box must sit on the crop for a scaled line, got left ${leftPctChirho}%`
  );
  assertChirho(
    Math.abs(leftPctChirho - SCALED_LINE_CHIRHO.serverMarkerLeftPctChirho) < 3,
    `marker left ${leftPctChirho}% must agree with the server's ${SCALED_LINE_CHIRHO.serverMarkerLeftPctChirho}% within the word-box padding`
  );
  const widthPctChirho =
    (SCALED_LINE_CHIRHO.spanWidthPxChirho *
      cropToLineScaleChirho(SCALED_LINE_CHIRHO.lineWidthPxChirho, SCALED_LINE_CHIRHO.lineImageWidthPxChirho)) /
    SCALED_LINE_CHIRHO.zoomCropWidthPxChirho *
    100;
  assertChirho(
    Math.abs(widthPctChirho - SCALED_LINE_CHIRHO.serverMarkerWidthPctChirho) < 4,
    `marker width ${widthPctChirho}% must agree with the server's ${SCALED_LINE_CHIRHO.serverMarkerWidthPctChirho}%`
  );

  // Pointer -> line -> pointer must round-trip on both line shapes.
  for (const lineChirho of [UNSCALED_LINE_CHIRHO, SCALED_LINE_CHIRHO]) {
    for (const fractionChirho of [0, 0.25, 0.5, 0.75, 1]) {
      const lineXChirho = cropFractionToLineXChirho(
        fractionChirho,
        lineChirho.zoomCropXMinPxChirho,
        lineChirho.zoomCropWidthPxChirho,
        lineChirho.lineWidthPxChirho,
        lineChirho.lineImageWidthPxChirho
      );
      assertChirho(
        Number.isInteger(lineXChirho) && lineXChirho >= 0 && lineXChirho <= lineChirho.lineWidthPxChirho,
        `pointer mapping must return an in-range integer line-x, got ${lineXChirho}`
      );
      const backChirho = lineXToCropFractionChirho(
        lineXChirho,
        lineChirho.zoomCropXMinPxChirho,
        lineChirho.zoomCropWidthPxChirho,
        lineChirho.lineWidthPxChirho,
        lineChirho.lineImageWidthPxChirho
      );
      assertChirho(
        Math.abs(backChirho - fractionChirho) < 0.01,
        `crop fraction ${fractionChirho} must round-trip, got ${backChirho}`
      );
    }
  }

  // An unscaled line must behave exactly as it did before the conversion existed.
  assertChirho(
    cropFractionToLineXChirho(0.5, 768, 520, 1288, 1288) === Math.round(768 + 0.5 * 520),
    "an unscaled line must map pointers exactly as before"
  );
}

interface ClientTilingApiChirho {
  cropFractionToLineXChirho: typeof cropFractionToLineXChirho;
  lineXToCropFractionChirho: typeof lineXToCropFractionChirho;
  tilingCoverageErrorChirho: typeof tilingCoverageErrorChirho;
  drawnBoxTilingRowsChirho: typeof drawnBoxTilingRowsChirho;
  manualFirstTilingRowsChirho: typeof manualFirstTilingRowsChirho;
  tilingEditRepairKindChirho: typeof tilingEditRepairKindChirho;
}

function clientTilingApiChirho(): ClientTilingApiChirho {
  const clientScriptChirho = segmentTilingEditClientScriptChirho();
  const namesChirho = SEGMENT_TILING_EDIT_CLIENT_EXPORTS_CHIRHO.join(", ");
  const factoryChirho = new Function(`${clientScriptChirho}\nreturn { ${namesChirho} };`) as () => ClientTilingApiChirho;
  return factoryChirho();
}

/**
 * The page runs a copy of the shared block, so prove the copy behaves the same.
 * A stale or mangled copy fails here rather than in front of a reviewer.
 */
function checkBrowserCopyMatchesModuleChirho(): void {
  const clientChirho = clientTilingApiChirho();
  const drawCasesChirho: [number, number, string][] = [
    [120, 260, "hebrew-chirho"],
    [400, 900, "hebrew-chirho"],
    [0, 150, "greek-chirho"],
    [1200, SAMPLE_LINE_WIDTH_CHIRHO, "symbol-chirho"],
    [0, SAMPLE_LINE_WIDTH_CHIRHO, "unknown-script-chirho"],
    [400, 600, "greek-chirho"],
  ];
  for (const [startChirho, endChirho, scriptChirho] of drawCasesChirho) {
    assertEqualJsonChirho(
      clientChirho.drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, startChirho, endChirho, SAMPLE_LINE_WIDTH_CHIRHO, scriptChirho),
      drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, startChirho, endChirho, SAMPLE_LINE_WIDTH_CHIRHO, scriptChirho),
      `browser copy disagrees on draw ${startChirho}..${endChirho} as ${scriptChirho}`
    );
  }
  for (const keepTextChirho of [true, false]) {
    assertEqualJsonChirho(
      clientChirho.manualFirstTilingRowsChirho(SAMPLE_ROWS_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO, keepTextChirho),
      manualFirstTilingRowsChirho(SAMPLE_ROWS_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO, keepTextChirho),
      `browser copy disagrees on manual-first keepText=${keepTextChirho}`
    );
  }
  assertEqualJsonChirho(
    clientChirho.tilingCoverageErrorChirho(SAMPLE_ROWS_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO),
    tilingCoverageErrorChirho(SAMPLE_ROWS_CHIRHO, SAMPLE_LINE_WIDTH_CHIRHO),
    "browser copy disagrees on a valid tiling"
  );
  assertEqualJsonChirho(
    clientChirho.tilingCoverageErrorChirho([rowChirho(0, 100, "french-chirho", "")], SAMPLE_LINE_WIDTH_CHIRHO),
    tilingCoverageErrorChirho([rowChirho(0, 100, "french-chirho", "")], SAMPLE_LINE_WIDTH_CHIRHO),
    "browser copy disagrees on a broken tiling message"
  );
  for (const [beforeCountChirho, afterCountChirho] of [[4, 6], [4, 3], [4, 4]] as [number, number][]) {
    assertEqualJsonChirho(
      clientChirho.tilingEditRepairKindChirho(beforeCountChirho, afterCountChirho),
      tilingEditRepairKindChirho(beforeCountChirho, afterCountChirho),
      `browser copy disagrees on repair kind ${beforeCountChirho}->${afterCountChirho}`
    );
  }
  for (const lineChirho of [UNSCALED_LINE_CHIRHO, SCALED_LINE_CHIRHO]) {
    for (const fractionChirho of [0, 0.33, 0.5, 1]) {
      assertEqualJsonChirho(
        clientChirho.cropFractionToLineXChirho(fractionChirho, lineChirho.zoomCropXMinPxChirho, lineChirho.zoomCropWidthPxChirho, lineChirho.lineWidthPxChirho, lineChirho.lineImageWidthPxChirho),
        cropFractionToLineXChirho(fractionChirho, lineChirho.zoomCropXMinPxChirho, lineChirho.zoomCropWidthPxChirho, lineChirho.lineWidthPxChirho, lineChirho.lineImageWidthPxChirho),
        `browser copy disagrees on pointer mapping at fraction ${fractionChirho}`
      );
    }
    assertEqualJsonChirho(
      clientChirho.lineXToCropFractionChirho(lineChirho.spanXMinPxChirho, lineChirho.zoomCropXMinPxChirho, lineChirho.zoomCropWidthPxChirho, lineChirho.lineWidthPxChirho, lineChirho.lineImageWidthPxChirho),
      lineXToCropFractionChirho(lineChirho.spanXMinPxChirho, lineChirho.zoomCropXMinPxChirho, lineChirho.zoomCropWidthPxChirho, lineChirho.lineWidthPxChirho, lineChirho.lineImageWidthPxChirho),
      "browser copy disagrees on marker placement"
    );
  }
  let clientRefusedChirho = false;
  try {
    clientChirho.drawnBoxTilingRowsChirho(SAMPLE_ROWS_CHIRHO, 300, 300, SAMPLE_LINE_WIDTH_CHIRHO, "hebrew-chirho");
  } catch {
    clientRefusedChirho = true;
  }
  assertChirho(clientRefusedChirho, "browser copy must refuse a zero-width draw just as the module does");
}

function mainChirho(): void {
  checkCoverageDetectionChirho();
  checkDrawInsideOneBoxChirho();
  checkDrawSwallowingWholeBoxesChirho();
  checkDrawAtLineEdgesChirho();
  checkDrawExactlyOverOneBoxChirho();
  checkDrawRefusalsChirho();
  checkManualFirstChirho();
  checkRepairKindNamingChirho();
  checkCropLineUnitsChirho();
  checkBrowserCopyMatchesModuleChirho();
  console.log(`[${MODULE_CHIRHO}] segment tiling edits passed (module and browser copy agree)`);
}

if (import.meta.main) {
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
