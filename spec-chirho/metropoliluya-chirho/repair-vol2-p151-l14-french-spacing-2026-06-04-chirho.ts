// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 2 p151 line 14.
 *
 * The scanline reads `en 13 par קדשו et en 14 par למקדשא`; the current
 * French connector span is fused as `eten 14 par`.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol2-p151-l14-french-spacing-2026-06-04-chirho";
const TARGET_PATH_CHIRHO = spanLinePathChirho(2, 151, 14);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const NOTES_CHIRHO =
  "Cleaned vol 2 p151 line 14 French connector after scanline review: print reads `et en 14 par` between Hebrew `קדשו` and `למקדשא`; current OCR fused it as `eten 14 par`. Stored as french-chirho vision-tier cleanup, not certified.";

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
  if (lineChirho.volumeChirho !== 2 || lineChirho.pageChirho !== 151 || lineChirho.lineIndexChirho !== 14) return "unknown-chirho";
  const spansChirho = sortedSpansChirho(lineChirho);
  if (
    spansChirho.length === 4 &&
    spansChirho[0]?.utf8TextChirho === "en 13 par" &&
    spansChirho[1]?.utf8TextChirho === "קדשו" &&
    spansChirho[2]?.utf8TextChirho === "eten 14 par" &&
    spansChirho[3]?.utf8TextChirho === "למקדשא"
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 4 &&
    spansChirho[0]?.utf8TextChirho === "en 13 par" &&
    spansChirho[1]?.utf8TextChirho === "קדשו" &&
    spansChirho[2]?.utf8TextChirho === "et en 14 par" &&
    spansChirho[2]?.provenanceChirho === "vision-chirho" &&
    spansChirho[3]?.utf8TextChirho === "למקדשא"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function plannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  const spanChirho = nextLineChirho.spansChirho.find((candidateChirho) => candidateChirho.segmentIndexChirho === 2);
  if (spanChirho === undefined) throw new Error("target segment 2 missing");
  spanChirho.utf8TextChirho = normalizeTextForStorageChirho("et en 14 par");
  spanChirho.provenanceChirho = "vision-chirho";
  spanChirho.visionTranscribedAtChirho = appliedAtChirho;
  spanChirho.visionNotesChirho = NOTES_CHIRHO;
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function upsertBackupChirho(appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const keyChirho = "2:151:14:2";
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) => `${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}` !== keyChirho
  );
  verdictsChirho.push({
    volumeChirho: 2,
    pageChirho: 151,
    lineIndexChirho: 14,
    segmentIndexChirho: 2,
    garbleTextChirho: "eten 14 par",
    scriptChirho: "french-chirho",
    utf8TextChirho: "et en 14 par",
    notesChirho: NOTES_CHIRHO,
  });
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const lineChirho = loadJsonChirho<SpanLineChirho>(TARGET_PATH_CHIRHO);
  validateTilingChirho(lineChirho);
  const stateValueChirho = stateChirho(lineChirho);
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, statusChirho: "blocked-chirho", stateChirho: stateValueChirho }, null, 2));
    process.exitCode = 1;
    return;
  }
  const nextLineChirho = stateValueChirho === "already-applied-chirho" ? lineChirho : plannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "dry-run-chirho", statusChirho: "planned-chirho", stateChirho: stateValueChirho, spansChirho: nextLineChirho.spansChirho }, null, 2));
    return;
  }
  if (stateValueChirho !== "already-applied-chirho") writeJsonChirho(TARGET_PATH_CHIRHO, nextLineChirho);
  upsertBackupChirho(appliedAtChirho);
  console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "apply-chirho", statusChirho: "applied-chirho", stateChirho: "already-applied-chirho" }, null, 2));
}

mainChirho();
