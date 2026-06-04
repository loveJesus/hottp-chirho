// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 3 p152 line 44 Greek residue.
 *
 * Second-witness scanline review confirmed that the current French-looking
 * residue spans `Tv 6601 Ts` and `Kai 6` are Greek text in Ezek 46:9b:
 * `τῆς` and `καὶ ὁ`. The geometry is already contiguous, so this repair only
 * changes text/script/provenance for those two spans and routes them to Greek
 * expert confirmation.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p152-l44-greek-residue-2026-06-04-chirho";
const TARGET_PATH_CHIRHO = spanLinePathChirho(3, 152, 44);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const SEG3_TEXT_CHIRHO = "τῆς";
const SEG7_TEXT_CHIRHO = "καὶ ὁ";
const SEG3_NOTES_CHIRHO =
  "Recovered vol 3 p152 line 44 Greek residue after scanline review: the current OCR stored `Tv 6601 Ts` as French, but the print reads Greek `τῆς` after `κατὰ` and before `πύλης` in Ezek 46:9b. Stored as greek-chirho vision-tier; exact Greek text remains Greek expert-confirmation tier.";
const SEG7_NOTES_CHIRHO =
  "Recovered vol 3 p152 line 44 Greek residue after scanline review: the current OCR stored `Kai 6` as French, but the print reads Greek `καὶ ὁ` before `εἰσπορευόμενος` in Ezek 46:9b. Stored as greek-chirho vision-tier; exact Greek text remains Greek expert-confirmation tier.";

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
  if (lineChirho.volumeChirho !== 3 || lineChirho.pageChirho !== 152 || lineChirho.lineIndexChirho !== 44) return "unknown-chirho";
  const spansChirho = sortedSpansChirho(lineChirho);
  if (
    spansChirho.length === 9 &&
    spansChirho[0]?.utf8TextChirho === "c) en 46,9b: omet" &&
    spansChirho[1]?.utf8TextChirho === "≠" &&
    spansChirho[2]?.utf8TextChirho === "κατὰ" &&
    spansChirho[3]?.scriptChirho === "french-chirho" &&
    spansChirho[3]?.utf8TextChirho === "Tv 6601 Ts" &&
    spansChirho[4]?.utf8TextChirho === "πύλης" &&
    spansChirho[5]?.utf8TextChirho === "τῆς" &&
    spansChirho[6]?.utf8TextChirho === "πρὸς νότον" &&
    spansChirho[7]?.scriptChirho === "french-chirho" &&
    spansChirho[7]?.utf8TextChirho === "Kai 6" &&
    spansChirho[8]?.utf8TextChirho === "εἰσπορευόμενος"
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 9 &&
    spansChirho[3]?.scriptChirho === "greek-chirho" &&
    spansChirho[3]?.utf8TextChirho === SEG3_TEXT_CHIRHO &&
    spansChirho[3]?.provenanceChirho === "vision-chirho" &&
    spansChirho[7]?.scriptChirho === "greek-chirho" &&
    spansChirho[7]?.utf8TextChirho === SEG7_TEXT_CHIRHO &&
    spansChirho[7]?.provenanceChirho === "vision-chirho"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function plannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  const seg3Chirho = nextLineChirho.spansChirho.find((spanChirho) => spanChirho.segmentIndexChirho === 3);
  const seg7Chirho = nextLineChirho.spansChirho.find((spanChirho) => spanChirho.segmentIndexChirho === 7);
  if (seg3Chirho === undefined) throw new Error("target segment 3 missing");
  if (seg7Chirho === undefined) throw new Error("target segment 7 missing");
  seg3Chirho.scriptChirho = "greek-chirho";
  seg3Chirho.utf8TextChirho = normalizeTextForStorageChirho(SEG3_TEXT_CHIRHO);
  seg3Chirho.provenanceChirho = "vision-chirho";
  seg3Chirho.visionTranscribedAtChirho = appliedAtChirho;
  seg3Chirho.visionNotesChirho = SEG3_NOTES_CHIRHO;
  seg7Chirho.scriptChirho = "greek-chirho";
  seg7Chirho.utf8TextChirho = normalizeTextForStorageChirho(SEG7_TEXT_CHIRHO);
  seg7Chirho.provenanceChirho = "vision-chirho";
  seg7Chirho.visionTranscribedAtChirho = appliedAtChirho;
  seg7Chirho.visionNotesChirho = SEG7_NOTES_CHIRHO;
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function upsertBackupChirho(appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const replacementKeysChirho = new Set(["3:152:44:3", "3:152:44:7"]);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) =>
      !replacementKeysChirho.has(`${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}`)
  );
  verdictsChirho.push(
    {
      volumeChirho: 3,
      pageChirho: 152,
      lineIndexChirho: 44,
      segmentIndexChirho: 3,
      garbleTextChirho: "Tv 6601 Ts",
      scriptChirho: "greek-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(SEG3_TEXT_CHIRHO),
      notesChirho: SEG3_NOTES_CHIRHO,
    },
    {
      volumeChirho: 3,
      pageChirho: 152,
      lineIndexChirho: 44,
      segmentIndexChirho: 7,
      garbleTextChirho: "Kai 6",
      scriptChirho: "greek-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(SEG7_TEXT_CHIRHO),
      notesChirho: SEG7_NOTES_CHIRHO,
    }
  );
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
    console.log(
      JSON.stringify(
        {
          moduleChirho: MODULE_CHIRHO,
          modeChirho: "dry-run-chirho",
          statusChirho: "planned-chirho",
          stateChirho: stateValueChirho,
          spansChirho: nextLineChirho.spansChirho,
        },
        null,
        2
      )
    );
    return;
  }
  if (stateValueChirho !== "already-applied-chirho") writeJsonChirho(TARGET_PATH_CHIRHO, nextLineChirho);
  upsertBackupChirho(appliedAtChirho);
  console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "apply-chirho", statusChirho: "applied-chirho", stateChirho: "already-applied-chirho" }, null, 2));
}

mainChirho();
