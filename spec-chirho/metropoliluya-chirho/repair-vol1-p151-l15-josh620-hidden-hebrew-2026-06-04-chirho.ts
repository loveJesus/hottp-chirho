// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 1 p151 line 15.
 *
 * The scanner caught the OCR fragment `y" [B]` immediately after `הָעָם`.
 * The scanline and Joshua 6:20 context show the full Hebrew phrase as the
 * consonantal `וירע העם`; the bracketed `[B]` witness label remains separate.
 * This routes the phrase to Hebrew/WLC expert review and does not certify it.
 */

import { readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol1-p151-l15-josh620-hidden-hebrew-2026-06-04-chirho";
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
  visionNotesChirho?: string;
  [keyChirho: string]: unknown;
}

interface SpanLineChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  spansChirho: SpanChirho[];
  [keyChirho: string]: unknown;
}

interface VisionVerdictChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  garbleTextChirho: string;
  scriptChirho: string;
  utf8TextChirho: string;
  notesChirho: string;
}

interface VisionVerdictsBackupChirho {
  generatedAtChirho?: string;
  countChirho?: number;
  verdictsChirho?: VisionVerdictChirho[];
  [keyChirho: string]: unknown;
}

const TARGET_VOLUME_CHIRHO = 1;
const TARGET_PAGE_CHIRHO = 151;
const TARGET_LINE_CHIRHO = 15;

const OLD_SPANS_CHIRHO = [
  { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 89, scriptChirho: "french-chirho", utf8TextChirho: "6,20" },
  { segmentIndexChirho: 1, xMinPxChirho: 89, widthPxChirho: 78, scriptChirho: "hebrew-chirho", utf8TextChirho: "הָעָם" },
  { segmentIndexChirho: 2, xMinPxChirho: 167, widthPxChirho: 161, scriptChirho: "french-chirho", utf8TextChirho: "y\" [B]" },
  { segmentIndexChirho: 3, xMinPxChirho: 328, widthPxChirho: 268, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "M g V S T // lic" },
  { segmentIndexChirho: 4, xMinPxChirho: 596, widthPxChirho: 113, scriptChirho: "french-chirho", utf8TextChirho: ": Gom" },
] satisfies Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho">>;

const NEW_SPANS_CHIRHO: SpanChirho[] = [
  { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 89, scriptChirho: "french-chirho", utf8TextChirho: "6,20" },
  {
    segmentIndexChirho: 1,
    xMinPxChirho: 89,
    widthPxChirho: 159,
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: "וירע העם",
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: new Date().toISOString(),
    visionNotesChirho:
      "Recovered hidden Joshua 6:20 Hebrew phrase from old `הָעָם y\"` geometry. Stored consonantal text only; WLC has וַיָּרַע הָעָם, but exact printed vowels/marks remain Hebrew/WLC expert-confirmation tier.",
  },
  {
    segmentIndexChirho: 2,
    xMinPxChirho: 248,
    widthPxChirho: 80,
    scriptChirho: "french-chirho",
    utf8TextChirho: "[B]",
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: new Date().toISOString(),
    visionNotesChirho: "Split bracketed [B] witness label away from the hidden Hebrew phrase.",
  },
  { segmentIndexChirho: 3, xMinPxChirho: 328, widthPxChirho: 268, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "M g V S T // lic" },
  { segmentIndexChirho: 4, xMinPxChirho: 596, widthPxChirho: 113, scriptChirho: "french-chirho", utf8TextChirho: ": Gom" },
];

const BACKUP_ROWS_CHIRHO: VisionVerdictChirho[] = [
  {
    volumeChirho: TARGET_VOLUME_CHIRHO,
    pageChirho: TARGET_PAGE_CHIRHO,
    lineIndexChirho: TARGET_LINE_CHIRHO,
    segmentIndexChirho: 1,
    garbleTextChirho: 'הָעָם + y" hidden continuation',
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: "וירע העם",
    notesChirho:
      "Recovered vol 1 p151 line 15 Joshua 6:20 Hebrew phrase from old partial pass-c `הָעָם` plus OCR fragment `y\"`. Scanline shows the two-word phrase before [B]; WLC Joshua 6:20 corroborates וַיָּרַע הָעָם, but stored consonantal `וירע העם` remains vision-chirho pending Hebrew/WLC expert confirmation of exact vowels/marks.",
  },
  {
    volumeChirho: TARGET_VOLUME_CHIRHO,
    pageChirho: TARGET_PAGE_CHIRHO,
    lineIndexChirho: TARGET_LINE_CHIRHO,
    segmentIndexChirho: 2,
    garbleTextChirho: 'y" [B]',
    scriptChirho: "french-chirho",
    utf8TextChirho: "[B]",
    notesChirho: "Split bracketed [B] witness label from old OCR fragment `y\" [B]`; label remains vision-tier Latin/French proofing, not certified.",
  },
];

function readJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonAtomicChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function linePathChirho(): string {
  return spanLinePathChirho(TARGET_VOLUME_CHIRHO, TARGET_PAGE_CHIRHO, TARGET_LINE_CHIRHO);
}

function spanMatchesChirho(spanChirho: SpanChirho, expectedChirho: Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho">): boolean {
  return (
    spanChirho.segmentIndexChirho === expectedChirho.segmentIndexChirho &&
    spanChirho.xMinPxChirho === expectedChirho.xMinPxChirho &&
    spanChirho.widthPxChirho === expectedChirho.widthPxChirho &&
    spanChirho.scriptChirho === expectedChirho.scriptChirho &&
    normalizeTextForStorageChirho(spanChirho.utf8TextChirho) === normalizeTextForStorageChirho(expectedChirho.utf8TextChirho)
  );
}

function lineMatchesChirho(lineChirho: SpanLineChirho, expectedChirho: typeof OLD_SPANS_CHIRHO | typeof NEW_SPANS_CHIRHO): boolean {
  if (lineChirho.spansChirho.length !== expectedChirho.length) return false;
  return expectedChirho.every((spanChirho, indexChirho) => {
    const currentChirho = lineChirho.spansChirho[indexChirho];
    return currentChirho !== undefined && spanMatchesChirho(currentChirho, spanChirho);
  });
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of lineChirho.spansChirho.entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) throw new Error(`segment-index-gap-chirho at S${spanChirho.segmentIndexChirho}`);
    if (spanChirho.widthPxChirho <= 0) throw new Error(`non-positive-width-chirho at S${spanChirho.segmentIndexChirho}`);
    if (spanChirho.xMinPxChirho !== expectedXChirho) throw new Error(`span-tiling-gap-chirho at S${spanChirho.segmentIndexChirho}: expected ${expectedXChirho}, got ${spanChirho.xMinPxChirho}`);
    expectedXChirho = spanChirho.xMinPxChirho + spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`line-width-mismatch-chirho: expected ${lineChirho.lineWidthPxChirho}, got ${expectedXChirho}`);
  }
}

function backupKeyChirho(rowChirho: Pick<VisionVerdictChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return `${rowChirho.volumeChirho}:${rowChirho.pageChirho}:${rowChirho.lineIndexChirho}:${rowChirho.segmentIndexChirho}`;
}

function reconcileBackupChirho(): void {
  const backupChirho = readJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  if (!Array.isArray(backupChirho.verdictsChirho)) throw new Error("vision verdict backup is malformed");
  const insertKeysChirho = new Set(BACKUP_ROWS_CHIRHO.map(backupKeyChirho));
  backupChirho.verdictsChirho = backupChirho.verdictsChirho.filter((rowChirho) => !insertKeysChirho.has(backupKeyChirho(rowChirho)));
  backupChirho.verdictsChirho.push(...BACKUP_ROWS_CHIRHO);
  backupChirho.countChirho = backupChirho.verdictsChirho.length;
  backupChirho.generatedAtChirho = new Date().toISOString();
  writeJsonAtomicChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function stateChirho(lineChirho: SpanLineChirho): "pre-apply-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (lineMatchesChirho(lineChirho, OLD_SPANS_CHIRHO)) return "pre-apply-chirho";
  if (lineMatchesChirho(lineChirho, NEW_SPANS_CHIRHO)) return "already-applied-chirho";
  return "unknown-chirho";
}

function reportChirho(statusChirho: string, lineChirho: SpanLineChirho): unknown {
  return {
    moduleChirho: MODULE_CHIRHO,
    statusChirho,
    stateChirho: stateChirho(lineChirho),
    spansChirho: lineChirho.spansChirho.map((spanChirho) => ({
      segmentIndexChirho: spanChirho.segmentIndexChirho,
      xMinPxChirho: spanChirho.xMinPxChirho,
      widthPxChirho: spanChirho.widthPxChirho,
      scriptChirho: spanChirho.scriptChirho,
      utf8TextChirho: spanChirho.utf8TextChirho,
      provenanceChirho: spanChirho.provenanceChirho,
    })),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.includes("--apply");
  const pathChirho = linePathChirho();
  const lineChirho = readJsonChirho<SpanLineChirho>(pathChirho);
  validateTilingChirho(lineChirho);
  const stateValueChirho = stateChirho(lineChirho);
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify(reportChirho("blocked-chirho", lineChirho), null, 2));
    process.exit(1);
  }
  if (stateValueChirho === "already-applied-chirho") {
    if (applyChirho) reconcileBackupChirho();
    console.log(JSON.stringify(reportChirho("already-applied-chirho", lineChirho), null, 2));
    return;
  }
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho("planned-chirho", lineChirho), null, 2));
    return;
  }
  lineChirho.spansChirho = NEW_SPANS_CHIRHO.map((spanChirho) => ({ ...spanChirho, utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho) }));
  normalizeSpanLineTextFieldsChirho(lineChirho);
  validateTilingChirho(lineChirho);
  writeJsonAtomicChirho(pathChirho, lineChirho);
  reconcileBackupChirho();
  const appliedLineChirho = readJsonChirho<SpanLineChirho>(pathChirho);
  console.log(JSON.stringify(reportChirho("applied-chirho", appliedLineChirho), null, 2));
}

mainChirho();
