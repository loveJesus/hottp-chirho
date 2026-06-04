// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 3 p152 apparatus symbols.
 *
 * Scanline review confirmed:
 * - line 29 prints `967 ≠`, not `967 4`;
 * - line 31 prints `967 ±`, not `967 +`.
 *
 * Both are apparatus-symbol fixes, so they remain vision-tier and route to the
 * Latin/symbol proofing lane rather than being silently accepted.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p152-apparatus-symbols-2026-06-04-chirho";
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const L29_PATH_CHIRHO = spanLinePathChirho(3, 152, 29);
const L31_PATH_CHIRHO = spanLinePathChirho(3, 152, 31);
const L29_TEXT_CHIRHO = "967 ≠";
const L31_TEXT_CHIRHO = "967 ±";
const L29_NOTES_CHIRHO =
  "Cleaned vol 3 p152 line 29 apparatus symbol after scanline review: the print reads `967 ≠` between Greek `‘ἡγούμενος` and `ἀφηγούμενος`; current OCR stored the not-equal sign as `4`. Stored as symbol-chirho vision-tier for Latin/symbol proofing.";
const L31_NOTES_CHIRHO =
  "Cleaned vol 3 p152 line 31 apparatus symbol after scanline review: the print reads `967 ±` between Greek `κρίνειν` and `κρῖσιν`; current OCR stored the plus-minus sign as plain `+`. Stored as symbol-chirho vision-tier for Latin/symbol proofing.";

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

interface LineConfigChirho {
  labelChirho: string;
  pathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  oldTextChirho: string;
  nextTextChirho: string;
  notesChirho: string;
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

function stateChirho(lineChirho: SpanLineChirho, configChirho: LineConfigChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (
    lineChirho.volumeChirho !== configChirho.volumeChirho ||
    lineChirho.pageChirho !== configChirho.pageChirho ||
    lineChirho.lineIndexChirho !== configChirho.lineIndexChirho
  ) {
    return "unknown-chirho";
  }
  const spanChirho = sortedSpansChirho(lineChirho).find((candidateChirho) => candidateChirho.segmentIndexChirho === configChirho.segmentIndexChirho);
  if (spanChirho?.scriptChirho === "french-chirho" && spanChirho.utf8TextChirho === configChirho.oldTextChirho) return "pre-repair-chirho";
  if (spanChirho?.scriptChirho === "symbol-chirho" && spanChirho.utf8TextChirho === configChirho.nextTextChirho && spanChirho.provenanceChirho === "vision-chirho") {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function buildLineChirho(lineChirho: SpanLineChirho, configChirho: LineConfigChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  const spanChirho = nextLineChirho.spansChirho.find((candidateChirho) => candidateChirho.segmentIndexChirho === configChirho.segmentIndexChirho);
  if (spanChirho === undefined) throw new Error(`${configChirho.labelChirho} target segment missing`);
  spanChirho.scriptChirho = "symbol-chirho";
  spanChirho.utf8TextChirho = normalizeTextForStorageChirho(configChirho.nextTextChirho);
  spanChirho.provenanceChirho = "vision-chirho";
  spanChirho.visionTranscribedAtChirho = appliedAtChirho;
  spanChirho.visionNotesChirho = configChirho.notesChirho;
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function configsChirho(): LineConfigChirho[] {
  return [
    {
      labelChirho: "vol3-p152-l029-chirho",
      pathChirho: L29_PATH_CHIRHO,
      volumeChirho: 3,
      pageChirho: 152,
      lineIndexChirho: 29,
      segmentIndexChirho: 2,
      oldTextChirho: "967 4",
      nextTextChirho: L29_TEXT_CHIRHO,
      notesChirho: L29_NOTES_CHIRHO,
    },
    {
      labelChirho: "vol3-p152-l031-chirho",
      pathChirho: L31_PATH_CHIRHO,
      volumeChirho: 3,
      pageChirho: 152,
      lineIndexChirho: 31,
      segmentIndexChirho: 2,
      oldTextChirho: "967 +",
      nextTextChirho: L31_TEXT_CHIRHO,
      notesChirho: L31_NOTES_CHIRHO,
    },
  ];
}

function upsertBackupChirho(configsValueChirho: LineConfigChirho[], appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const replacementKeysChirho = new Set(
    configsValueChirho.map((configChirho) => `${configChirho.volumeChirho}:${configChirho.pageChirho}:${configChirho.lineIndexChirho}:${configChirho.segmentIndexChirho}`)
  );
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) =>
      !replacementKeysChirho.has(`${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}`)
  );
  for (const configChirho of configsValueChirho) {
    verdictsChirho.push({
      volumeChirho: configChirho.volumeChirho,
      pageChirho: configChirho.pageChirho,
      lineIndexChirho: configChirho.lineIndexChirho,
      segmentIndexChirho: configChirho.segmentIndexChirho,
      garbleTextChirho: configChirho.oldTextChirho,
      scriptChirho: "symbol-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(configChirho.nextTextChirho),
      notesChirho: configChirho.notesChirho,
    });
  }
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const configsValueChirho = configsChirho();
  const plannedLinesChirho = new Map<string, SpanLineChirho>();
  const summariesChirho = [];
  let blockedChirho = false;
  for (const configChirho of configsValueChirho) {
    const lineChirho = loadJsonChirho<SpanLineChirho>(configChirho.pathChirho);
    validateTilingChirho(lineChirho);
    const stateValueChirho = stateChirho(lineChirho, configChirho);
    if (stateValueChirho === "unknown-chirho") blockedChirho = true;
    const nextLineChirho = stateValueChirho === "pre-repair-chirho" ? buildLineChirho(lineChirho, configChirho, appliedAtChirho) : lineChirho;
    plannedLinesChirho.set(configChirho.pathChirho, nextLineChirho);
    summariesChirho.push({
      labelChirho: configChirho.labelChirho,
      stateChirho: stateValueChirho,
      spansChirho: sortedSpansChirho(nextLineChirho).map((spanChirho) => ({
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        xMinPxChirho: spanChirho.xMinPxChirho,
        widthPxChirho: spanChirho.widthPxChirho,
        scriptChirho: spanChirho.scriptChirho,
        utf8TextChirho: spanChirho.utf8TextChirho,
        provenanceChirho: spanChirho.provenanceChirho,
      })),
    });
  }
  if (blockedChirho) {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, statusChirho: "blocked-chirho", linesChirho: summariesChirho }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (!applyChirho) {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "dry-run-chirho", statusChirho: "planned-chirho", linesChirho: summariesChirho }, null, 2));
    return;
  }
  for (const configChirho of configsValueChirho) {
    const nextLineChirho = plannedLinesChirho.get(configChirho.pathChirho);
    if (nextLineChirho === undefined) throw new Error(`missing planned line for ${configChirho.labelChirho}`);
    writeJsonChirho(configChirho.pathChirho, nextLineChirho);
  }
  upsertBackupChirho(configsValueChirho, appliedAtChirho);
  console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "apply-chirho", statusChirho: "applied-chirho", linesChirho: summariesChirho }, null, 2));
}

mainChirho();
