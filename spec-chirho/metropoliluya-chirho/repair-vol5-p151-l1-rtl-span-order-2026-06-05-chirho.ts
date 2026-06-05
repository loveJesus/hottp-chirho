// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 5 p151 line 1.
 *
 * This accented Job 17:1 apparatus line has the same physical/logical RTL-run
 * assignment issue as vol 5 p150 line 8: S3 and S7 text were stored in logical
 * Hebrew order instead of matching their physical boxes. This script makes
 * each span text match the boxed crop and opts the line into logical rendering.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO } from "../../src-chirho/span-line-text-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-p151-l1-rtl-span-order-2026-06-05-chirho";
const TARGET_PATH_CHIRHO = spanLinePathChirho(5, 151, 1);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const APPLIED_STATUS_CHIRHO = "rtl-run-span-text-reassigned-to-box-chirho";
const S3_NOTES_CHIRHO =
  "Corrected vol 5 p151 line 1 S3 after packet crop inspection: the S3 target box is on the leftmost Hebrew word `קְבָרִ֣ים`, not the previously stored accented phrase `רוּחִ֣י חֻ֭בָּלָה`. Stored as vision-chirho because this is a machine-witnessed geometry/text reassignment; exact letters, accents, niqqud, and the slash-separated RTL run remain Hebrew/WLC expert-confirmation tier.";
const S7_NOTES_CHIRHO =
  "Corrected vol 5 p151 line 1 S7 after packet crop inspection: the S7 target box is on the rightmost accented phrase `רוּחִ֣י חֻ֭בָּלָה`, not the previously stored `קְבָרִ֣ים`. The line carries lineTextOrderChirho=rtl-runs-logical-chirho so exported Markdown keeps the logical Hebrew run order while span text matches the boxed geometry. Stored as vision-chirho pending Hebrew/WLC expert confirmation.";

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
  visionNotesChirho?: string;
  visionCorrectionStatusChirho?: string;
  [keyChirho: string]: unknown;
}

interface SpanLineChirho {
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  lineTextOrderChirho?: string;
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

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function sortedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function spanByIndexChirho(lineChirho: SpanLineChirho, segmentIndexChirho: number): SpanChirho {
  const spanChirho = sortedSpansChirho(lineChirho).find((candidateChirho) => candidateChirho.segmentIndexChirho === segmentIndexChirho);
  if (spanChirho === undefined) throw new Error(`missing segment ${segmentIndexChirho}`);
  return spanChirho;
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortedSpansChirho(lineChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) throw new Error(`segment index ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    if (spanChirho.xMinPxChirho !== expectedXChirho) throw new Error(`xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    if (spanChirho.widthPxChirho <= 0) throw new Error(`span ${indexChirho} has non-positive width ${spanChirho.widthPxChirho}`);
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
}

function validateTargetLineChirho(lineChirho: SpanLineChirho): void {
  if (lineChirho.volumeChirho !== 5 || lineChirho.pageChirho !== 151 || lineChirho.lineIndexChirho !== 1) {
    throw new Error("target line identity mismatch");
  }
  if (lineChirho.lineWidthPxChirho !== 2050) throw new Error(`line width ${lineChirho.lineWidthPxChirho} !== expected 2050`);
  validateTilingChirho(lineChirho);
}

function stateChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  validateTargetLineChirho(lineChirho);
  const s3Chirho = spanByIndexChirho(lineChirho, 3);
  const s5Chirho = spanByIndexChirho(lineChirho, 5);
  const s7Chirho = spanByIndexChirho(lineChirho, 7);
  const s3TextChirho = normalizeTextForStorageChirho(s3Chirho.utf8TextChirho);
  const s5TextChirho = normalizeTextForStorageChirho(s5Chirho.utf8TextChirho);
  const s7TextChirho = normalizeTextForStorageChirho(s7Chirho.utf8TextChirho);
  if (
    s3Chirho.xMinPxChirho === 780 &&
    s3Chirho.widthPxChirho === 237 &&
    s3Chirho.scriptChirho === "hebrew-chirho" &&
    s3TextChirho === "רוּחִ֣י חֻ֭בָּלָה" &&
    s3Chirho.provenanceChirho === undefined &&
    s5Chirho.xMinPxChirho === 1092 &&
    s5Chirho.widthPxChirho === 413 &&
    s5Chirho.scriptChirho === "hebrew-chirho" &&
    s5TextChirho === "יָמַ֣י נִזְעָ֑כוּ" &&
    s7Chirho.xMinPxChirho === 1571 &&
    s7Chirho.widthPxChirho === 479 &&
    s7Chirho.scriptChirho === "hebrew-chirho" &&
    s7TextChirho === "קְבָרִ֣ים" &&
    s7Chirho.provenanceChirho === undefined &&
    lineChirho.lineTextOrderChirho === undefined
  ) {
    return "pre-repair-chirho";
  }
  if (
    s3TextChirho === "קְבָרִ֣ים" &&
    s3Chirho.provenanceChirho === "vision-chirho" &&
    s3Chirho.visionCorrectionStatusChirho === APPLIED_STATUS_CHIRHO &&
    s5TextChirho === "יָמַ֣י נִזְעָ֑כוּ" &&
    s7TextChirho === "רוּחִ֣י חֻ֭בָּלָה" &&
    s7Chirho.provenanceChirho === "vision-chirho" &&
    s7Chirho.visionCorrectionStatusChirho === APPLIED_STATUS_CHIRHO &&
    lineChirho.lineTextOrderChirho === RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function plannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.lineTextOrderChirho = RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO;
  const s3Chirho = spanByIndexChirho(nextLineChirho, 3);
  const s7Chirho = spanByIndexChirho(nextLineChirho, 7);
  s3Chirho.utf8TextChirho = normalizeTextForStorageChirho("קְבָרִ֣ים");
  s3Chirho.provenanceChirho = "vision-chirho";
  s3Chirho.visionTranscribedAtChirho = appliedAtChirho;
  s3Chirho.visionCorrectionStatusChirho = APPLIED_STATUS_CHIRHO;
  s3Chirho.visionNotesChirho = S3_NOTES_CHIRHO;
  s7Chirho.utf8TextChirho = normalizeTextForStorageChirho("רוּחִ֣י חֻ֭בָּלָה");
  s7Chirho.provenanceChirho = "vision-chirho";
  s7Chirho.visionTranscribedAtChirho = appliedAtChirho;
  s7Chirho.visionCorrectionStatusChirho = APPLIED_STATUS_CHIRHO;
  s7Chirho.visionNotesChirho = S7_NOTES_CHIRHO;
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTargetLineChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictsChirho(lineChirho: SpanLineChirho): VisionVerdictChirho[] {
  const s3Chirho = spanByIndexChirho(lineChirho, 3);
  const s7Chirho = spanByIndexChirho(lineChirho, 7);
  return [
    {
      volumeChirho: 5,
      pageChirho: 151,
      lineIndexChirho: 1,
      segmentIndexChirho: 3,
      garbleTextChirho: "previously assigned `רוּחִ֣י חֻ֭בָּלָה` to the S3 box",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(s3Chirho.utf8TextChirho),
      notesChirho: s3Chirho.visionNotesChirho ?? S3_NOTES_CHIRHO,
    },
    {
      volumeChirho: 5,
      pageChirho: 151,
      lineIndexChirho: 1,
      segmentIndexChirho: 7,
      garbleTextChirho: "previously assigned `קְבָרִ֣ים` to the S7 box",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(s7Chirho.utf8TextChirho),
      notesChirho: s7Chirho.visionNotesChirho ?? S7_NOTES_CHIRHO,
    },
  ];
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const nextVerdictsChirho = visionVerdictsChirho(lineChirho);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !nextVerdictsChirho.some(
        (verdictChirho) =>
          candidateChirho.volumeChirho === verdictChirho.volumeChirho &&
          candidateChirho.pageChirho === verdictChirho.pageChirho &&
          candidateChirho.lineIndexChirho === verdictChirho.lineIndexChirho &&
          candidateChirho.segmentIndexChirho === verdictChirho.segmentIndexChirho
      )
  );
  verdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return nextVerdictsChirho.length;
}

function reportChirho(modeChirho: string, statusChirho: string, messagesChirho: string[], lineChirho: SpanLineChirho): unknown {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    lineTextOrderChirho: lineChirho.lineTextOrderChirho ?? null,
    messagesChirho,
    spansChirho: [3, 5, 7].map((segmentIndexChirho) => {
      const spanChirho = spanByIndexChirho(lineChirho, segmentIndexChirho);
      return {
        segmentIndexChirho,
        xMinPxChirho: spanChirho.xMinPxChirho,
        widthPxChirho: spanChirho.widthPxChirho,
        scriptChirho: spanChirho.scriptChirho,
        utf8TextChirho: spanChirho.utf8TextChirho,
        provenanceChirho: spanChirho.provenanceChirho ?? null,
      };
    }),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const lineChirho = loadJsonChirho<SpanLineChirho>(TARGET_PATH_CHIRHO);
  const stateValueChirho = stateChirho(lineChirho);
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify(reportChirho(modeChirho, "blocked-chirho", ["target line is not in the expected pre-repair or already-applied state"], lineChirho), null, 2));
    process.exitCode = 1;
    return;
  }
  const nextLineChirho = stateValueChirho === "already-applied-chirho" ? lineChirho : plannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          stateValueChirho === "already-applied-chirho" ? "already-applied-chirho" : "planned-chirho",
          ["ready to reassign S3/S7 text to their boxed geometry and preserve logical RTL-run rendering"],
          nextLineChirho
        ),
        null,
        2
      )
    );
    return;
  }
  if (stateValueChirho !== "already-applied-chirho") writeJsonChirho(TARGET_PATH_CHIRHO, nextLineChirho);
  const upsertedChirho = upsertVisionBackupChirho(nextLineChirho, appliedAtChirho);
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", [`applied repair and upserted ${upsertedChirho} vision backup row(s)`], nextLineChirho), null, 2));
}

mainChirho();
