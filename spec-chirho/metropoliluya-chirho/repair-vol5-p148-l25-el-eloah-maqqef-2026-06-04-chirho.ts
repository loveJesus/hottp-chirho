// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 5 p148 line 25 segment 3.
 *
 * The raw Pass-C text glued `אֶל` and `אֱלוֹהַּ`; the packet crop visibly prints
 * a maqqef between them. This repair preserves the full Hebrew phrase as
 * vision-tier text, not certified human text.
 */

import { readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-p148-l25-el-eloah-maqqef-2026-06-04-chirho";
const LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-5-chirho",
  "page-0148-chirho",
  "line-025-chirho.json"
);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const OLD_TEXT_CHIRHO = "אֶלאֱלוֹהַּ דָּלְפָה עֵינִי";
const NEW_TEXT_CHIRHO = "אֶל־אֱלוֹהַּ דָּלְפָה עֵינִי".normalize("NFC");
const NOTES_CHIRHO =
  "Repaired vol 5 p148 line 25 segment 3: packet crop shows printed maqqef between `אֶל` and `אֱלוֹהַּ`; old raw Pass-C text glued them as `אֶלאֱלוֹהַּ`. Stored as vision-chirho, not certified; exact vowels/marks, maqqef, and segmentation remain Hebrew/WLC expert-confirmation tier.";

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

function writeJsonAtomicChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function sortedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function validateLineChirho(lineChirho: SpanLineChirho): void {
  if (lineChirho.volumeChirho !== 5 || lineChirho.pageChirho !== 148 || lineChirho.lineIndexChirho !== 25) {
    throw new Error("target line identity mismatch");
  }
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortedSpansChirho(lineChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) throw new Error(`segment index gap at ${indexChirho}`);
    if (spanChirho.xMinPxChirho !== expectedXChirho) throw new Error(`tiling gap before segment ${indexChirho}`);
    if (spanChirho.widthPxChirho <= 0) throw new Error(`non-positive width at segment ${indexChirho}`);
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`line tiling ends at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
  }
}

function upsertBackupVerdictChirho(appliedAtChirho: string): void {
  const backupChirho = JSON.parse(readFileSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO, "utf8")) as VisionVerdictsBackupChirho;
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) =>
      !(
        verdictChirho.volumeChirho === 5 &&
        verdictChirho.pageChirho === 148 &&
        verdictChirho.lineIndexChirho === 25 &&
        verdictChirho.segmentIndexChirho === 3
      )
  );
  verdictsChirho.push({
    volumeChirho: 5,
    pageChirho: 148,
    lineIndexChirho: 25,
    segmentIndexChirho: 3,
    garbleTextChirho: OLD_TEXT_CHIRHO,
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: NEW_TEXT_CHIRHO,
    notesChirho: NOTES_CHIRHO,
  });
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.countChirho = verdictsChirho.length;
  backupChirho.verdictsChirho = verdictsChirho;
  writeJsonAtomicChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function mainChirho(): void {
  const applyChirho = process.argv.includes("--apply");
  const lineChirho = JSON.parse(readFileSync(LINE_PATH_CHIRHO, "utf8")) as SpanLineChirho;
  validateLineChirho(lineChirho);
  const spanChirho = lineChirho.spansChirho.find((candidateChirho) => candidateChirho.segmentIndexChirho === 3);
  if (spanChirho === undefined) throw new Error("target span missing");
  const stateChirho =
    spanChirho.utf8TextChirho === OLD_TEXT_CHIRHO && spanChirho.scriptChirho === "hebrew-chirho"
      ? "pre-repair-chirho"
      : spanChirho.utf8TextChirho === NEW_TEXT_CHIRHO && spanChirho.provenanceChirho === "vision-chirho"
        ? "already-applied-chirho"
        : "unknown-chirho";
  if (stateChirho === "unknown-chirho") {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, statusChirho: "blocked-chirho", currentTextChirho: spanChirho.utf8TextChirho }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (stateChirho === "already-applied-chirho" || !applyChirho) {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: applyChirho ? "apply-chirho" : "dry-run-chirho", statusChirho: stateChirho === "already-applied-chirho" ? "already-applied-chirho" : "planned-chirho", oldTextChirho: OLD_TEXT_CHIRHO, newTextChirho: NEW_TEXT_CHIRHO }, null, 2));
    return;
  }
  const appliedAtChirho = new Date().toISOString();
  spanChirho.utf8TextChirho = NEW_TEXT_CHIRHO;
  spanChirho.provenanceChirho = "vision-chirho";
  spanChirho.visionTranscribedAtChirho = appliedAtChirho;
  spanChirho.visionNotesChirho = NOTES_CHIRHO;
  normalizeSpanLineTextFieldsChirho(lineChirho);
  validateLineChirho(lineChirho);
  writeJsonAtomicChirho(LINE_PATH_CHIRHO, lineChirho);
  upsertBackupVerdictChirho(appliedAtChirho);
  console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "apply-chirho", statusChirho: "applied-chirho", oldTextChirho: OLD_TEXT_CHIRHO, newTextChirho: NEW_TEXT_CHIRHO }, null, 2));
}

mainChirho();
