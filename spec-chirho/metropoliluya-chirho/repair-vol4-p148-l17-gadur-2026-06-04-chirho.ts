// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 4 p148 line 17.
 *
 * The scanline prints `20 lire גָדוּר (πεφραγμένος)`, but OCR stored the
 * Hebrew word as `11` inside the leading French span. The recovered Hebrew
 * remains vision-tier for Hebrew/WLC expert confirmation.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol4-p148-l17-gadur-2026-06-04-chirho";
const LINE_PATH_CHIRHO = spanLinePathChirho(4, 148, 17);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const HEBREW_TEXT_CHIRHO = "גָדוּר";
const HEBREW_NOTES_CHIRHO =
  "Recovered vol 4 p148 line 17 hidden Hebrew from the old OCR `11`: scanline reads `20 lire גָדוּר (πεφραγμένος)`. Greek `πεφραγμένος` corroborates the fenced/enclosed reading; exact Hebrew pointing remains Hebrew/WLC expert-confirmation tier.";

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

function visionSpanChirho(spanChirho: SpanChirho, appliedAtChirho: string): SpanChirho {
  return {
    ...spanChirho,
    utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: appliedAtChirho,
    visionNotesChirho: HEBREW_NOTES_CHIRHO,
  };
}

function stateChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (lineChirho.volumeChirho !== 4 || lineChirho.pageChirho !== 148 || lineChirho.lineIndexChirho !== 17) return "unknown-chirho";
  const spansChirho = sortedSpansChirho(lineChirho);
  if (
    spansChirho.length === 3 &&
    spansChirho[0]?.segmentIndexChirho === 0 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 237 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === "20 lire 11" &&
    spansChirho[1]?.segmentIndexChirho === 1 &&
    spansChirho[1]?.xMinPxChirho === 237 &&
    spansChirho[1]?.widthPxChirho === 309 &&
    spansChirho[1]?.scriptChirho === "greek-chirho" &&
    spansChirho[1]?.utf8TextChirho === "(πεφραγμένος" &&
    spansChirho[2]?.segmentIndexChirho === 2 &&
    spansChirho[2]?.xMinPxChirho === 546 &&
    spansChirho[2]?.widthPxChirho === 693 &&
    spansChirho[2]?.scriptChirho === "french-chirho"
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 4 &&
    spansChirho[0]?.segmentIndexChirho === 0 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 130 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === "20 lire" &&
    spansChirho[1]?.segmentIndexChirho === 1 &&
    spansChirho[1]?.xMinPxChirho === 130 &&
    spansChirho[1]?.widthPxChirho === 105 &&
    spansChirho[1]?.scriptChirho === "hebrew-chirho" &&
    spansChirho[1]?.utf8TextChirho === HEBREW_TEXT_CHIRHO &&
    spansChirho[1]?.provenanceChirho === "vision-chirho" &&
    spansChirho[2]?.segmentIndexChirho === 2 &&
    spansChirho[2]?.xMinPxChirho === 235 &&
    spansChirho[2]?.widthPxChirho === 311 &&
    spansChirho[2]?.scriptChirho === "greek-chirho" &&
    spansChirho[2]?.utf8TextChirho === "(πεφραγμένος" &&
    spansChirho[3]?.segmentIndexChirho === 3 &&
    spansChirho[3]?.xMinPxChirho === 546 &&
    spansChirho[3]?.widthPxChirho === 693 &&
    spansChirho[3]?.scriptChirho === "french-chirho"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function buildLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const sourceSpansChirho = sortedSpansChirho(lineChirho);
  const firstSpanChirho = sourceSpansChirho[0];
  const greekSpanChirho = sourceSpansChirho[1];
  const frenchTailSpanChirho = sourceSpansChirho[2];
  if (firstSpanChirho === undefined || greekSpanChirho === undefined || frenchTailSpanChirho === undefined) throw new Error("source line missing expected spans");
  const nextLineChirho: SpanLineChirho = {
    ...structuredClone(lineChirho),
    spansChirho: [
      {
        ...firstSpanChirho,
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 130,
        scriptChirho: "french-chirho",
        utf8TextChirho: "20 lire",
      },
      visionSpanChirho(
        {
          segmentIndexChirho: 1,
          xMinPxChirho: 130,
          widthPxChirho: 105,
          scriptChirho: "hebrew-chirho",
          utf8TextChirho: HEBREW_TEXT_CHIRHO,
        },
        appliedAtChirho
      ),
      {
        ...greekSpanChirho,
        segmentIndexChirho: 2,
        xMinPxChirho: 235,
        widthPxChirho: 311,
      },
      {
        ...frenchTailSpanChirho,
        segmentIndexChirho: 3,
      },
    ],
  };
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function upsertBackupChirho(appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) => !(verdictChirho.volumeChirho === 4 && verdictChirho.pageChirho === 148 && verdictChirho.lineIndexChirho === 17 && verdictChirho.segmentIndexChirho === 1)
  );
  verdictsChirho.push({
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 17,
    segmentIndexChirho: 1,
    garbleTextChirho: "11",
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(HEBREW_TEXT_CHIRHO),
    notesChirho: HEBREW_NOTES_CHIRHO,
  });
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const lineChirho = loadJsonChirho<SpanLineChirho>(LINE_PATH_CHIRHO);
  validateTilingChirho(lineChirho);
  const stateValueChirho = stateChirho(lineChirho);
  const nextLineChirho = stateValueChirho === "pre-repair-chirho" ? buildLineChirho(lineChirho, appliedAtChirho) : lineChirho;
  const summaryChirho = {
    moduleChirho: MODULE_CHIRHO,
    modeChirho: applyChirho ? "apply-chirho" : "dry-run-chirho",
    statusChirho: stateValueChirho === "unknown-chirho" ? "blocked-chirho" : applyChirho ? "applied-chirho" : "planned-chirho",
    stateChirho: stateValueChirho,
    spansChirho: sortedSpansChirho(nextLineChirho).map((spanChirho) => ({
      segmentIndexChirho: spanChirho.segmentIndexChirho,
      xMinPxChirho: spanChirho.xMinPxChirho,
      widthPxChirho: spanChirho.widthPxChirho,
      scriptChirho: spanChirho.scriptChirho,
      utf8TextChirho: spanChirho.utf8TextChirho,
      provenanceChirho: spanChirho.provenanceChirho,
    })),
  };
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify(summaryChirho, null, 2));
    process.exitCode = 1;
    return;
  }
  if (!applyChirho) {
    console.log(JSON.stringify(summaryChirho, null, 2));
    return;
  }
  writeJsonChirho(LINE_PATH_CHIRHO, nextLineChirho);
  upsertBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(summaryChirho, null, 2));
}

mainChirho();
