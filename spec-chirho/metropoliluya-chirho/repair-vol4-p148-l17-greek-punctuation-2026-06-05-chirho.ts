// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 4 p148 line 17 Greek punctuation.
 *
 * The earlier hidden-Hebrew repair correctly recovered גָדוּר but left the
 * adjacent Greek span text as `(πεφραγμένος` even though the same red box covers
 * the printed close parenthesis and sentence period. This patch stores the full
 * printed span text as vision-tier for Greek expert confirmation.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol4-p148-l17-greek-punctuation-2026-06-05-chirho";
const LINE_PATH_CHIRHO = spanLinePathChirho(4, 148, 17);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const PRE_GREEK_TEXT_CHIRHO = "(πεφραγμένος";
const NEXT_GREEK_TEXT_CHIRHO = "(πεφραγμένος).";
const GREEK_NOTES_CHIRHO =
  "Second pass over vol 4 p148 line 17 confirmed the Greek span box x235..546 includes the printed close parenthesis and sentence period: `(πεφραγμένος).` before French `C'est`. The prior hidden-Hebrew repair note already described the scanline as `20 lire גָדוּר (πεφραγμένος)`, but the stored Greek span omitted `).`. Stored as greek-chirho vision-tier; exact Greek text, punctuation attachment, and geometry remain Greek expert-confirmation tier.";

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

function validateTargetLineChirho(lineChirho: SpanLineChirho): void {
  if (lineChirho.volumeChirho !== 4 || lineChirho.pageChirho !== 148 || lineChirho.lineIndexChirho !== 17) {
    throw new Error("target line is not vol 4 p148 line 17");
  }
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

function stateChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  validateTargetLineChirho(lineChirho);
  const spansChirho = sortedSpansChirho(lineChirho);
  const greekSpanChirho = spansChirho[2];
  if (
    spansChirho.length === 4 &&
    greekSpanChirho?.segmentIndexChirho === 2 &&
    greekSpanChirho.xMinPxChirho === 235 &&
    greekSpanChirho.widthPxChirho === 311 &&
    greekSpanChirho.scriptChirho === "greek-chirho" &&
    greekSpanChirho.utf8TextChirho === PRE_GREEK_TEXT_CHIRHO
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 4 &&
    greekSpanChirho?.segmentIndexChirho === 2 &&
    greekSpanChirho.xMinPxChirho === 235 &&
    greekSpanChirho.widthPxChirho === 311 &&
    greekSpanChirho.scriptChirho === "greek-chirho" &&
    greekSpanChirho.utf8TextChirho === NEXT_GREEK_TEXT_CHIRHO &&
    greekSpanChirho.provenanceChirho === "vision-chirho"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function buildLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  const spansChirho = sortedSpansChirho(nextLineChirho);
  const greekSpanChirho = spansChirho[2];
  if (greekSpanChirho === undefined) throw new Error("Greek span missing");
  greekSpanChirho.utf8TextChirho = normalizeTextForStorageChirho(NEXT_GREEK_TEXT_CHIRHO);
  greekSpanChirho.provenanceChirho = "vision-chirho";
  greekSpanChirho.visionTranscribedAtChirho = appliedAtChirho;
  greekSpanChirho.visionNotesChirho = GREEK_NOTES_CHIRHO;
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function upsertBackupChirho(appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) => !(verdictChirho.volumeChirho === 4 && verdictChirho.pageChirho === 148 && verdictChirho.lineIndexChirho === 17 && verdictChirho.segmentIndexChirho === 2)
  );
  verdictsChirho.push({
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 17,
    segmentIndexChirho: 2,
    garbleTextChirho: PRE_GREEK_TEXT_CHIRHO,
    scriptChirho: "greek-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(NEXT_GREEK_TEXT_CHIRHO),
    notesChirho: GREEK_NOTES_CHIRHO,
  });
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function summaryChirho(lineChirho: SpanLineChirho, modeChirho: string, statusChirho: string, stateValueChirho: string): unknown {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    stateChirho: stateValueChirho,
    spansChirho: sortedSpansChirho(lineChirho).map((spanChirho) => ({
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
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const lineChirho = loadJsonChirho<SpanLineChirho>(LINE_PATH_CHIRHO);
  validateTilingChirho(lineChirho);
  const stateValueChirho = stateChirho(lineChirho);
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify(summaryChirho(lineChirho, applyChirho ? "apply-chirho" : "dry-run-chirho", "blocked-chirho", stateValueChirho), null, 2));
    process.exitCode = 1;
    return;
  }
  const nextLineChirho = stateValueChirho === "pre-repair-chirho" ? buildLineChirho(lineChirho, appliedAtChirho) : lineChirho;
  if (!applyChirho) {
    console.log(JSON.stringify(
      summaryChirho(
        nextLineChirho,
        "dry-run-chirho",
        stateValueChirho === "already-applied-chirho" ? "already-applied-chirho" : "planned-chirho",
        stateValueChirho
      ),
      null,
      2
    ));
    return;
  }
  if (stateValueChirho === "pre-repair-chirho") {
    writeJsonChirho(LINE_PATH_CHIRHO, nextLineChirho);
    upsertBackupChirho(appliedAtChirho);
  }
  console.log(JSON.stringify(summaryChirho(nextLineChirho, "apply-chirho", stateValueChirho === "already-applied-chirho" ? "already-applied-chirho" : "applied-chirho", stateValueChirho), null, 2));
}

mainChirho();
