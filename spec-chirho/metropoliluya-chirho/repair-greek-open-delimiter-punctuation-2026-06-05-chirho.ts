// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for two Greek spans with missing close punctuation.
 *
 * A non-Hebrew delimiter sweep found Greek spans whose red boxes include the
 * printed closing parenthesis and following punctuation, but whose UTF-8 text
 * retained only the opening parenthesis and Greek words. The corrected spans
 * are stored as vision-tier for Greek expert confirmation.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-greek-open-delimiter-punctuation-2026-06-05-chirho";
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

interface RepairTargetChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  preTextChirho: string;
  nextTextChirho: string;
  notesChirho: string;
}

const TARGETS_CHIRHO: RepairTargetChirho[] = [
  {
    volumeChirho: 2,
    pageChirho: 148,
    lineIndexChirho: 9,
    segmentIndexChirho: 1,
    xMinPxChirho: 253,
    widthPxChirho: 334,
    preTextChirho: "(καὶ ἀπέστησέ με",
    nextTextChirho: "(καὶ ἀπέστησέ με),",
    notesChirho:
      "Second pass over vol 2 p148 line 9 confirmed the Greek span box x253..587 includes the printed close parenthesis and comma: `(καὶ ἀπέστησέ με),` before French `attesté`. The stored Greek span omitted `),`. Stored as greek-chirho vision-tier; exact Greek text, punctuation attachment, and geometry remain Greek expert-confirmation tier.",
  },
  {
    volumeChirho: 2,
    pageChirho: 151,
    lineIndexChirho: 2,
    segmentIndexChirho: 0,
    xMinPxChirho: 0,
    widthPxChirho: 264,
    preTextChirho: "(εἰς ἁγίασμα",
    nextTextChirho: "(εἰς ἁγίασμα).",
    notesChirho:
      "Second pass over vol 2 p151 line 2 confirmed the Greek span box x0..264 includes the printed close parenthesis and sentence period: `(εἰς ἁγίασμα).` before French `Sur ces deux points`. The stored Greek span omitted `).`. Stored as greek-chirho vision-tier; exact Greek text, punctuation attachment, and geometry remain Greek expert-confirmation tier.",
  },
];

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function linePathChirho(targetChirho: RepairTargetChirho): string {
  return spanLinePathChirho(targetChirho.volumeChirho, targetChirho.pageChirho, targetChirho.lineIndexChirho);
}

function sortedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function validateTargetLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): void {
  if (
    lineChirho.volumeChirho !== targetChirho.volumeChirho ||
    lineChirho.pageChirho !== targetChirho.pageChirho ||
    lineChirho.lineIndexChirho !== targetChirho.lineIndexChirho
  ) {
    throw new Error(`target mismatch for vol ${targetChirho.volumeChirho} p${targetChirho.pageChirho} line ${targetChirho.lineIndexChirho}`);
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

function targetSpanChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): SpanChirho | undefined {
  return sortedSpansChirho(lineChirho).find((spanChirho) => spanChirho.segmentIndexChirho === targetChirho.segmentIndexChirho);
}

function stateChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  validateTargetLineChirho(lineChirho, targetChirho);
  const spanChirho = targetSpanChirho(lineChirho, targetChirho);
  if (
    spanChirho?.xMinPxChirho === targetChirho.xMinPxChirho &&
    spanChirho.widthPxChirho === targetChirho.widthPxChirho &&
    spanChirho.scriptChirho === "greek-chirho" &&
    spanChirho.utf8TextChirho === targetChirho.preTextChirho
  ) {
    return "pre-repair-chirho";
  }
  if (
    spanChirho?.xMinPxChirho === targetChirho.xMinPxChirho &&
    spanChirho.widthPxChirho === targetChirho.widthPxChirho &&
    spanChirho.scriptChirho === "greek-chirho" &&
    spanChirho.utf8TextChirho === targetChirho.nextTextChirho &&
    spanChirho.provenanceChirho === "vision-chirho"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function buildLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  const spanChirho = targetSpanChirho(nextLineChirho, targetChirho);
  if (spanChirho === undefined) throw new Error("target span missing");
  spanChirho.utf8TextChirho = normalizeTextForStorageChirho(targetChirho.nextTextChirho);
  spanChirho.provenanceChirho = "vision-chirho";
  spanChirho.visionTranscribedAtChirho = appliedAtChirho;
  spanChirho.visionNotesChirho = targetChirho.notesChirho;
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function upsertBackupChirho(appliedAtChirho: string, appliedTargetsChirho: RepairTargetChirho[]): void {
  if (appliedTargetsChirho.length === 0) return;
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) =>
      !appliedTargetsChirho.some(
        (targetChirho) =>
          verdictChirho.volumeChirho === targetChirho.volumeChirho &&
          verdictChirho.pageChirho === targetChirho.pageChirho &&
          verdictChirho.lineIndexChirho === targetChirho.lineIndexChirho &&
          verdictChirho.segmentIndexChirho === targetChirho.segmentIndexChirho
      )
  );
  for (const targetChirho of appliedTargetsChirho) {
    verdictsChirho.push({
      volumeChirho: targetChirho.volumeChirho,
      pageChirho: targetChirho.pageChirho,
      lineIndexChirho: targetChirho.lineIndexChirho,
      segmentIndexChirho: targetChirho.segmentIndexChirho,
      garbleTextChirho: targetChirho.preTextChirho,
      scriptChirho: "greek-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(targetChirho.nextTextChirho),
      notesChirho: targetChirho.notesChirho,
    });
  }
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function spanSummaryChirho(lineChirho: SpanLineChirho): unknown {
  return sortedSpansChirho(lineChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const summariesChirho: unknown[] = [];
  const linesToWriteChirho: Array<{ pathChirho: string; lineChirho: SpanLineChirho; targetChirho: RepairTargetChirho }> = [];
  const appliedTargetsChirho: RepairTargetChirho[] = [];

  for (const targetChirho of TARGETS_CHIRHO) {
    const pathChirho = linePathChirho(targetChirho);
    const lineChirho = loadJsonChirho<SpanLineChirho>(pathChirho);
    validateTilingChirho(lineChirho);
    const stateValueChirho = stateChirho(lineChirho, targetChirho);
    const nextLineChirho = stateValueChirho === "pre-repair-chirho" ? buildLineChirho(lineChirho, targetChirho, appliedAtChirho) : lineChirho;
    summariesChirho.push({
      targetChirho: `v${targetChirho.volumeChirho}-p${String(targetChirho.pageChirho).padStart(4, "0")}-l${String(targetChirho.lineIndexChirho).padStart(3, "0")}-s${targetChirho.segmentIndexChirho}`,
      stateChirho: stateValueChirho,
      spansChirho: spanSummaryChirho(nextLineChirho),
    });
    if (stateValueChirho === "unknown-chirho") {
      console.log(JSON.stringify({
        moduleChirho: MODULE_CHIRHO,
        modeChirho: applyChirho ? "apply-chirho" : "dry-run-chirho",
        statusChirho: "blocked-chirho",
        linesChirho: summariesChirho,
      }, null, 2));
      process.exitCode = 1;
      return;
    }
    if (stateValueChirho === "pre-repair-chirho") {
      linesToWriteChirho.push({ pathChirho, lineChirho: nextLineChirho, targetChirho });
      appliedTargetsChirho.push(targetChirho);
    }
  }

  if (applyChirho) {
    for (const lineChirho of linesToWriteChirho) writeJsonChirho(lineChirho.pathChirho, lineChirho.lineChirho);
    upsertBackupChirho(appliedAtChirho, appliedTargetsChirho);
  }
  console.log(JSON.stringify({
    moduleChirho: MODULE_CHIRHO,
    modeChirho: applyChirho ? "apply-chirho" : "dry-run-chirho",
    statusChirho: appliedTargetsChirho.length === 0 ? "already-applied-chirho" : applyChirho ? "applied-chirho" : "planned-chirho",
    linesChirho: summariesChirho,
  }, null, 2));
}

mainChirho();
