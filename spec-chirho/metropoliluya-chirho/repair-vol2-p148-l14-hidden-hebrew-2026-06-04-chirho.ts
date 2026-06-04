// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 2 p148 line 14.
 *
 * The raw Hebrew review crop exposed that the French span still contains
 * `1D?.`, but the scanline prints a Hebrew word followed by a period there.
 * This script splits the line so the recovered consonantal text remains
 * vision-tier, not certified.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";

const MODULE_CHIRHO = "repair-vol2-p148-l14-hidden-hebrew-2026-06-04-chirho";
const LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-2-chirho",
  "page-0148-chirho",
  "line-014-chirho.json"
);
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
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
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

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "planned-chirho" | "applied-chirho" | "already-applied-chirho" | "blocked-chirho";
  stateChirho: "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho";
  messagesChirho: string[];
  spansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>;
}

const OLD_FRENCH_TAIL_CHIRHO = "C'est inexact. Sa leçon est 1D?. Il est probable que la confusion yod/";
const FRENCH_BEFORE_CHIRHO = "C'est inexact. Sa leçon est";
const RECOVERED_HEBREW_CHIRHO = "יוסרנו.";
const FRENCH_AFTER_CHIRHO = "Il est probable que la confusion yod/";
const VISION_NOTES_CHIRHO =
  "Recovered vol 2 p148 line 14 hidden Hebrew from OCR `1D?.` after raw-review crop inspection. The scanline prints consonantal `יוסרנו` followed by a period between French `Sa leçon est` and `Il est probable`. Stored as vision-chirho; exact letters, vowels/marks, and period placement remain Hebrew/WLC expert-confirmation tier.";

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

function spanSummaryChirho(lineChirho: SpanLineChirho): RepairReportChirho["spansChirho"] {
  return sortedSpansChirho(lineChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortedSpansChirho(lineChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) {
      throw new Error(`segment index ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    }
    if (spanChirho.xMinPxChirho !== expectedXChirho) {
      throw new Error(`xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    }
    if (spanChirho.widthPxChirho <= 0) throw new Error(`span ${indexChirho} has non-positive width`);
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
  }
}

function validateTargetLineChirho(lineChirho: SpanLineChirho): void {
  if (lineChirho.volumeChirho !== 2 || lineChirho.pageChirho !== 148 || lineChirho.lineIndexChirho !== 14) {
    throw new Error("span file is not vol 2 page 148 line 14");
  }
}

function stateChirho(lineChirho: SpanLineChirho): RepairReportChirho["stateChirho"] {
  const spansChirho = sortedSpansChirho(lineChirho);
  if (
    spansChirho.length === 3 &&
    spansChirho[0]?.segmentIndexChirho === 0 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 104 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === "lit ici" &&
    spansChirho[1]?.segmentIndexChirho === 1 &&
    spansChirho[1]?.xMinPxChirho === 104 &&
    spansChirho[1]?.widthPxChirho === 135 &&
    spansChirho[1]?.scriptChirho === "hebrew-chirho" &&
    spansChirho[1]?.utf8TextChirho === "וְיַסִּירֵנִי" &&
    spansChirho[2]?.segmentIndexChirho === 2 &&
    spansChirho[2]?.xMinPxChirho === 239 &&
    spansChirho[2]?.widthPxChirho === 1201 &&
    spansChirho[2]?.scriptChirho === "french-chirho" &&
    spansChirho[2]?.utf8TextChirho === OLD_FRENCH_TAIL_CHIRHO
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 5 &&
    spansChirho[2]?.xMinPxChirho === 239 &&
    spansChirho[2]?.widthPxChirho === 460 &&
    spansChirho[2]?.utf8TextChirho === FRENCH_BEFORE_CHIRHO &&
    spansChirho[3]?.xMinPxChirho === 699 &&
    spansChirho[3]?.widthPxChirho === 104 &&
    spansChirho[3]?.scriptChirho === "hebrew-chirho" &&
    spansChirho[3]?.utf8TextChirho === RECOVERED_HEBREW_CHIRHO &&
    spansChirho[3]?.provenanceChirho === "vision-chirho" &&
    spansChirho[4]?.xMinPxChirho === 803 &&
    spansChirho[4]?.widthPxChirho === 637 &&
    spansChirho[4]?.utf8TextChirho === FRENCH_AFTER_CHIRHO
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function plannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const nextLineChirho: SpanLineChirho = {
    ...lineChirho,
    spansChirho: [
      { ...spansChirho[0]!, segmentIndexChirho: 0 },
      { ...spansChirho[1]!, segmentIndexChirho: 1 },
      {
        segmentIndexChirho: 2,
        xMinPxChirho: 239,
        widthPxChirho: 460,
        scriptChirho: "french-chirho",
        utf8TextChirho: FRENCH_BEFORE_CHIRHO,
      },
      {
        segmentIndexChirho: 3,
        xMinPxChirho: 699,
        widthPxChirho: 104,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: RECOVERED_HEBREW_CHIRHO,
        provenanceChirho: "vision-chirho",
        visionTranscribedAtChirho: appliedAtChirho,
        visionNotesChirho: VISION_NOTES_CHIRHO,
      },
      {
        segmentIndexChirho: 4,
        xMinPxChirho: 803,
        widthPxChirho: 637,
        scriptChirho: "french-chirho",
        utf8TextChirho: FRENCH_AFTER_CHIRHO,
      },
    ],
  };
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function writeBackupChirho(appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !(
        candidateChirho.volumeChirho === 2 &&
        candidateChirho.pageChirho === 148 &&
        candidateChirho.lineIndexChirho === 14 &&
        candidateChirho.segmentIndexChirho === 3
      )
  );
  verdictsChirho.push({
    volumeChirho: 2,
    pageChirho: 148,
    lineIndexChirho: 14,
    segmentIndexChirho: 3,
    garbleTextChirho: "1D?.",
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: RECOVERED_HEBREW_CHIRHO,
    notesChirho: VISION_NOTES_CHIRHO,
  });
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function reportChirho(paramsChirho: {
  applyChirho: boolean;
  statusChirho: RepairReportChirho["statusChirho"];
  stateValueChirho: RepairReportChirho["stateChirho"];
  messagesChirho: string[];
  lineChirho: SpanLineChirho;
}): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho: paramsChirho.applyChirho ? "apply-chirho" : "dry-run-chirho",
    statusChirho: paramsChirho.statusChirho,
    stateChirho: paramsChirho.stateValueChirho,
    messagesChirho: paramsChirho.messagesChirho,
    spansChirho: spanSummaryChirho(paramsChirho.lineChirho),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.includes("--apply");
  const lineChirho = loadJsonChirho<SpanLineChirho>(LINE_PATH_CHIRHO);
  validateTargetLineChirho(lineChirho);
  validateTilingChirho(lineChirho);
  const stateValueChirho = stateChirho(lineChirho);
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "blocked-chirho",
      stateValueChirho,
      messagesChirho: ["line is neither in the expected pre-repair state nor already applied"],
      lineChirho,
    }), null, 2));
    process.exitCode = 1;
    return;
  }
  if (stateValueChirho === "already-applied-chirho") {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "already-applied-chirho",
      stateValueChirho,
      messagesChirho: ["vol 2 p148 L14 hidden Hebrew repair is already applied"],
      lineChirho,
    }), null, 2));
    return;
  }
  const appliedAtChirho = new Date().toISOString();
  const nextLineChirho = plannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "planned-chirho",
      stateValueChirho,
      messagesChirho: ["ready to split OCR `1D?.` into a Hebrew vision-tier span; rerun with --apply after review"],
      lineChirho: nextLineChirho,
    }), null, 2));
    return;
  }
  writeJsonChirho(LINE_PATH_CHIRHO, nextLineChirho);
  writeBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(reportChirho({
    applyChirho,
    statusChirho: "applied-chirho",
    stateValueChirho,
    messagesChirho: ["applied hidden Hebrew repair; regenerate export, review packs, expert pack, scanners, and status"],
    lineChirho: nextLineChirho,
  }), null, 2));
}

if (import.meta.main) mainChirho();
