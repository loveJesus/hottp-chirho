// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Draft segments for an intake line: the deterministic French classifier's
 * per-word verdicts, tiled across the line the way Pass C tiles spans, plus
 * "unknown" tiles over wide gaps, where tesseract often drops Hebrew and
 * Greek entirely. A draft is a machine hint for a reader to check, never an
 * accepted reading.
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import type { ClassifyReasonChirho, WordWithBboxChirho } from "../classify-french-chirho.ts";

/** Bump when draft output changes, so drafted pages are redone. */
export const DRAFTS_VERSION_CHIRHO = 1;

/**
 * Gaps wider than this (render pixels) become unknown tiles. Measured
 * 2026-10-17 with draft-recall-chirho.ts on the 46 working-set pages: 80px
 * flags as much as 30-45px with fewer false tiles on vol 5's justified lines,
 * and slightly more than no gap rule on vol 1.
 */
export const DRAFT_GAP_THRESHOLD_PX_CHIRHO = 80;

export const FRENCH_SCRIPT_CHIRHO = "french-chirho";
export const LATIN_NON_FRENCH_SCRIPT_CHIRHO = "latin-non-french-chirho";
export const UNKNOWN_SCRIPT_CHIRHO = "unknown-chirho";

/** Scripts a reader can take as machine French/Latin text; everything else needs reading. */
export function isLatinScriptChirho(scriptChirho: string): boolean {
  return scriptChirho === FRENCH_SCRIPT_CHIRHO || scriptChirho === LATIN_NON_FRENCH_SCRIPT_CHIRHO;
}

const HINTED_SCRIPTS_CHIRHO = new Set(["hebrew-chirho", "greek-chirho", "syriac-chirho", "arabic-chirho", "symbol-chirho"]);
const RTL_SCRIPTS_CHIRHO = new Set(["hebrew-chirho", "syriac-chirho", "arabic-chirho"]);

export type DraftReasonChirho = "classifier-chirho" | "gap-chirho";

export interface DraftSegmentChirho {
  segmentIndexChirho: number;
  /** Inclusive word range into the line's words; null for a gap tile. */
  wordStartIndexChirho: number | null;
  wordEndIndexChirho: number | null;
  /** Line-local pixels; tiles cover [0, line width] without gaps or overlaps. */
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  /** Unverified machine text: tesseract on vols 1-4, the PDF layer on vol 5. */
  machineTextChirho: string;
  reasonChirho: DraftReasonChirho;
}

export interface DraftLineChirho {
  xMinChirho: number;
  widthChirho: number;
  wordsChirho: WordWithBboxChirho[];
}

export function wordScriptChirho(reasonChirho: ClassifyReasonChirho, scriptHintChirho: string | undefined): string {
  if (reasonChirho === "latin-hunspell-chirho") return LATIN_NON_FRENCH_SCRIPT_CHIRHO;
  if (reasonChirho !== "candidate-chirho") return FRENCH_SCRIPT_CHIRHO;
  return scriptHintChirho && HINTED_SCRIPTS_CHIRHO.has(scriptHintChirho) ? scriptHintChirho : UNKNOWN_SCRIPT_CHIRHO;
}

interface RunChirho {
  leftEdgeChirho: number;
  rightEdgeChirho: number;
  scriptChirho: string;
  reasonChirho: DraftReasonChirho;
  wordStartChirho: number | null;
  wordEndChirho: number | null;
}

/**
 * Tile one line. `reasonsChirho[i]` is the classifier verdict for word i.
 * A gap wider than `gapThresholdPxChirho` between words, or between a line
 * edge and its first or last word, becomes an unknown tile of its own.
 */
export function draftLineSegmentsChirho(
  lineChirho: DraftLineChirho,
  reasonsChirho: ClassifyReasonChirho[],
  gapThresholdPxChirho: number
): DraftSegmentChirho[] {
  const wordsChirho = lineChirho.wordsChirho;
  const widthChirho = Math.max(1, Math.round(lineChirho.widthChirho));
  if (reasonsChirho.length !== wordsChirho.length) throw new Error("one classifier verdict per word is required");
  const localChirho = (xChirho: number) => Math.min(widthChirho, Math.max(0, Math.round(xChirho - lineChirho.xMinChirho)));
  if (wordsChirho.length === 0) {
    return [{ segmentIndexChirho: 0, wordStartIndexChirho: null, wordEndIndexChirho: null, xMinPxChirho: 0,
      widthPxChirho: widthChirho, scriptChirho: UNKNOWN_SCRIPT_CHIRHO, machineTextChirho: "", reasonChirho: "gap-chirho" }];
  }

  const runsChirho: RunChirho[] = [];
  const pushGapChirho = (leftChirho: number, rightChirho: number) => {
    if (rightChirho - leftChirho > gapThresholdPxChirho) {
      runsChirho.push({ leftEdgeChirho: leftChirho, rightEdgeChirho: rightChirho,
        scriptChirho: UNKNOWN_SCRIPT_CHIRHO, reasonChirho: "gap-chirho", wordStartChirho: null, wordEndChirho: null });
    }
  };
  pushGapChirho(0, localChirho(wordsChirho[0]!.xMinChirho));
  wordsChirho.forEach((wChirho, iChirho) => {
    const scriptChirho = wordScriptChirho(reasonsChirho[iChirho]!, wChirho.scriptHintChirho);
    const leftChirho = localChirho(wChirho.xMinChirho);
    const rightChirho = Math.max(leftChirho, localChirho(wChirho.xMaxChirho));
    const lastChirho = runsChirho[runsChirho.length - 1];
    if (lastChirho && lastChirho.reasonChirho === "classifier-chirho" && lastChirho.scriptChirho === scriptChirho) {
      lastChirho.wordEndChirho = iChirho;
      lastChirho.rightEdgeChirho = Math.max(lastChirho.rightEdgeChirho, rightChirho);
    } else {
      runsChirho.push({ leftEdgeChirho: leftChirho, rightEdgeChirho: rightChirho,
        scriptChirho, reasonChirho: "classifier-chirho", wordStartChirho: iChirho, wordEndChirho: iChirho });
    }
    const nextChirho = wordsChirho[iChirho + 1];
    if (nextChirho) pushGapChirho(rightChirho, localChirho(nextChirho.xMinChirho));
  });
  pushGapChirho(localChirho(wordsChirho[wordsChirho.length - 1]!.xMaxChirho), widthChirho);

  // Contiguous tiling: each run reaches the next run's left edge (the Pass C
  // convention), so gap tiles keep exactly the empty stretch they cover.
  // Boundaries never move left, even if words overlap.
  const boundsChirho = [0];
  for (let kChirho = 1; kChirho < runsChirho.length; kChirho++) {
    boundsChirho.push(Math.max(boundsChirho[kChirho - 1]!, runsChirho[kChirho]!.leftEdgeChirho));
  }
  boundsChirho.push(Math.max(boundsChirho[boundsChirho.length - 1]!, widthChirho));
  return runsChirho.map((rChirho, kChirho) => {
    const startChirho = boundsChirho[kChirho]!;
    const endChirho = boundsChirho[kChirho + 1]!;
    let textsChirho = rChirho.wordStartChirho === null
      ? []
      : wordsChirho.slice(rChirho.wordStartChirho, rChirho.wordEndChirho! + 1).map((wChirho) => wChirho.textChirho);
    // Words come left to right; RTL runs read right to left.
    if (RTL_SCRIPTS_CHIRHO.has(rChirho.scriptChirho)) textsChirho = [...textsChirho].reverse();
    return {
      segmentIndexChirho: kChirho,
      wordStartIndexChirho: rChirho.wordStartChirho,
      wordEndIndexChirho: rChirho.wordEndChirho,
      xMinPxChirho: startChirho,
      widthPxChirho: endChirho - startChirho,
      scriptChirho: rChirho.scriptChirho,
      machineTextChirho: textsChirho.join(" ").trim(),
      reasonChirho: rChirho.reasonChirho,
    };
  });
}
