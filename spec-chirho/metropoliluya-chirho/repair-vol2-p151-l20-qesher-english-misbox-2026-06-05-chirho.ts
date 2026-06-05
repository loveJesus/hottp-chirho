// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 2 p151 line 20.
 *
 * The current Hebrew span is boxed over the English phrase `conspiracy`.
 * The printed Hebrew `קֶשֶׁר` is earlier in the line, hidden inside the
 * preceding French span as OCR `17`. This repair re-segments the line and
 * leaves the recovered Hebrew vision-tier, not certified.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol2-p151-l20-qesher-english-misbox-2026-06-05-chirho";
const TARGET_PATH_CHIRHO = spanLinePathChirho(2, 151, 20);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);

const S0_TEXT_CHIRHO = "Lowth interprétait justement";
const S1_TEXT_CHIRHO = "קֶשֶׁר";
const S2_TEXT_CHIRHO = "comme signifiant “a conspiracy” . Mais il lisait";

const S0_NOTES_CHIRHO =
  "Re-segmented vol 2 p151 line 20 after packet-crop review: the old French span swallowed the printed Hebrew `קֶשֶׁר` as OCR `17` and also contained part of the English gloss. This span now ends before the Hebrew word. Stored as french-chirho vision-tier cleanup, not certified.";
const S1_NOTES_CHIRHO =
  "Recovered vol 2 p151 line 20 printed Hebrew `קֶשֶׁר` from the French span where it was OCR'd as `17`; the old Hebrew span was actually boxed over English `conspiracy`. Stored as hebrew-chirho vision-tier pending Hebrew/WLC expert confirmation of exact letters, vowels, and shin-dot.";
const S2_NOTES_CHIRHO =
  "Re-segmented vol 2 p151 line 20 English/French continuation after moving the misplaced Hebrew span: print reads `comme signifiant “a conspiracy” . Mais il lisait` after `קֶשֶׁר`. Stored as french-chirho vision-tier cleanup; quote/period spacing remains human proofing tier.";

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
  if (lineChirho.volumeChirho !== 2 || lineChirho.pageChirho !== 151 || lineChirho.lineIndexChirho !== 20) return "unknown-chirho";
  const spansChirho = sortedSpansChirho(lineChirho);
  if (
    spansChirho.length === 3 &&
    spansChirho[0]?.utf8TextChirho === "Lowth interprétait justement 17 comme signifiant “’a" &&
    spansChirho[1]?.utf8TextChirho === "קֶשֶׁר" &&
    spansChirho[1]?.xMinPxChirho === 947 &&
    spansChirho[2]?.utf8TextChirho === "Mais il lisait"
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 3 &&
    spansChirho[0]?.utf8TextChirho === S0_TEXT_CHIRHO &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 500 &&
    spansChirho[1]?.utf8TextChirho === S1_TEXT_CHIRHO &&
    spansChirho[1]?.xMinPxChirho === 500 &&
    spansChirho[1]?.widthPxChirho === 90 &&
    spansChirho[1]?.provenanceChirho === "vision-chirho" &&
    spansChirho[2]?.utf8TextChirho === S2_TEXT_CHIRHO &&
    spansChirho[2]?.xMinPxChirho === 590 &&
    spansChirho[2]?.widthPxChirho === 779
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function visionSpanChirho(
  segmentIndexChirho: number,
  xMinPxChirho: number,
  widthPxChirho: number,
  scriptChirho: string,
  textChirho: string,
  notesChirho: string,
  appliedAtChirho: string
): SpanChirho {
  return {
    segmentIndexChirho,
    xMinPxChirho,
    widthPxChirho,
    scriptChirho,
    utf8TextChirho: normalizeTextForStorageChirho(textChirho),
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: appliedAtChirho,
    visionNotesChirho: notesChirho,
  };
}

function plannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    visionSpanChirho(0, 0, 500, "french-chirho", S0_TEXT_CHIRHO, S0_NOTES_CHIRHO, appliedAtChirho),
    visionSpanChirho(1, 500, 90, "hebrew-chirho", S1_TEXT_CHIRHO, S1_NOTES_CHIRHO, appliedAtChirho),
    visionSpanChirho(2, 590, 779, "french-chirho", S2_TEXT_CHIRHO, S2_NOTES_CHIRHO, appliedAtChirho),
  ];
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function backupKeyChirho(rowChirho: Pick<VisionVerdictChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return `${rowChirho.volumeChirho}:${rowChirho.pageChirho}:${rowChirho.lineIndexChirho}:${rowChirho.segmentIndexChirho}`;
}

function upsertBackupChirho(appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const rowsChirho: VisionVerdictChirho[] = [
    {
      volumeChirho: 2,
      pageChirho: 151,
      lineIndexChirho: 20,
      segmentIndexChirho: 0,
      garbleTextChirho: "Lowth interprétait justement 17 comme signifiant “’a",
      scriptChirho: "french-chirho",
      utf8TextChirho: S0_TEXT_CHIRHO,
      notesChirho: S0_NOTES_CHIRHO,
    },
    {
      volumeChirho: 2,
      pageChirho: 151,
      lineIndexChirho: 20,
      segmentIndexChirho: 1,
      garbleTextChirho: "17 hidden in French span; old Hebrew box covered `conspiracy`",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: S1_TEXT_CHIRHO,
      notesChirho: S1_NOTES_CHIRHO,
    },
    {
      volumeChirho: 2,
      pageChirho: 151,
      lineIndexChirho: 20,
      segmentIndexChirho: 2,
      garbleTextChirho: "Mais il lisait",
      scriptChirho: "french-chirho",
      utf8TextChirho: S2_TEXT_CHIRHO,
      notesChirho: S2_NOTES_CHIRHO,
    },
  ];
  const keysChirho = new Set(rowsChirho.map(backupKeyChirho));
  const existingChirho = Array.isArray(backupChirho.verdictsChirho) ? backupChirho.verdictsChirho : [];
  const existingKeysChirho = new Set(existingChirho.map(backupKeyChirho));
  const insertedCountChirho = rowsChirho.filter((rowChirho) => !existingKeysChirho.has(backupKeyChirho(rowChirho))).length;
  const verdictsChirho = existingChirho.filter((rowChirho) => !keysChirho.has(backupKeyChirho(rowChirho)));
  verdictsChirho.push(...rowsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return insertedCountChirho;
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const lineChirho = loadJsonChirho<SpanLineChirho>(TARGET_PATH_CHIRHO);
  validateTilingChirho(lineChirho);
  const stateValueChirho = stateChirho(lineChirho);
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, statusChirho: "blocked-chirho", stateChirho: stateValueChirho, spansChirho: sortedSpansChirho(lineChirho) }, null, 2));
    process.exitCode = 1;
    return;
  }
  const nextLineChirho = stateValueChirho === "already-applied-chirho" ? lineChirho : plannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "dry-run-chirho", statusChirho: "planned-chirho", stateChirho: stateValueChirho, spansChirho: nextLineChirho.spansChirho }, null, 2));
    return;
  }
  if (stateValueChirho !== "already-applied-chirho") writeJsonChirho(TARGET_PATH_CHIRHO, nextLineChirho);
  const upsertCountChirho = upsertBackupChirho(appliedAtChirho);
  console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "apply-chirho", statusChirho: "applied-chirho", stateChirho: "already-applied-chirho", upsertCountChirho }, null, 2));
}

mainChirho();
