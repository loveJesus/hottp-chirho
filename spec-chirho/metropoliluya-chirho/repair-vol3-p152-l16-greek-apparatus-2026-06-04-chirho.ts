// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 3 p152 line 16.
 *
 * The scanline reads `λέγει κύριος .967 ≠ + ὁ θεός Cpl et rel.[1]`.
 * The current spans swallow `.967` inside the Greek phrase box and mis-OCR
 * the following Greek/article apparatus as French `4 +0 es`.
 *
 * Repaired Greek/symbol spans stay vision-tier so Greek and Latin/symbol
 * reviewers still confirm the text and apparatus before certification.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p152-l16-greek-apparatus-2026-06-04-chirho";
const TARGET_VOLUME_CHIRHO = 3;
const TARGET_PAGE_CHIRHO = 152;
const TARGET_LINE_INDEX_CHIRHO = 16;
const TARGET_LINE_WIDTH_CHIRHO = 824;
const TARGET_PATH_CHIRHO = spanLinePathChirho(TARGET_VOLUME_CHIRHO, TARGET_PAGE_CHIRHO, TARGET_LINE_INDEX_CHIRHO);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);

const GREEK_PHRASE_CHIRHO = "λέγει κύριος";
const APPARATUS_SYMBOL_CHIRHO = ".967 ≠ +";
const GREEK_THEOS_CHIRHO = "ὁ θεός";

const GREEK_PHRASE_NOTES_CHIRHO =
  "Reboxed vol 3 p152 line 16 after scanline review: the print reads `λέγει κύριος .967 ≠ + ὁ θεός Cpl et rel.[1]`, and the old Greek phrase box swallowed the following `.967` apparatus siglum. Stored as greek-chirho vision-tier for Greek expert confirmation, not certified.";
const APPARATUS_SYMBOL_NOTES_CHIRHO =
  "Recovered vol 3 p152 line 16 apparatus sequence `.967 ≠ +` after scanline review. The leading dot before 967 and the `≠ +` operators are printed; stored as symbol-chirho vision-tier for Latin/symbol proofing, not certified.";
const GREEK_THEOS_NOTES_CHIRHO =
  "Recovered vol 3 p152 line 16 Greek `ὁ θεός` after scanline review. The OCR rendered the rough-breathing omicron `ὁ` and following `θεός` as French-like `+0 es`; stored as greek-chirho vision-tier for Greek expert confirmation, not certified.";

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
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  stateChirho: "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho";
  messagesChirho: string[];
  spansChirho: Array<
    Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
  >;
}

const PRE_SPANS_CHIRHO: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho">> = [
  { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 198, scriptChirho: "french-chirho", utf8TextChirho: "a) en 43,18a:" },
  { segmentIndexChirho: 1, xMinPxChirho: 198, widthPxChirho: 268, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
  { segmentIndexChirho: 2, xMinPxChirho: 466, widthPxChirho: 358, scriptChirho: "french-chirho", utf8TextChirho: "4 +0 es Cpl et rel.[1]" },
];

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

function normalizeSpanChirho(spanChirho: SpanChirho): SpanChirho {
  return {
    ...spanChirho,
    utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
  };
}

function visionSpanChirho(spanChirho: SpanChirho, appliedAtChirho: string, notesChirho: string): SpanChirho {
  return normalizeSpanChirho({
    ...spanChirho,
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: appliedAtChirho,
    visionNotesChirho: notesChirho,
  });
}

function nextSpansChirho(appliedAtChirho: string): SpanChirho[] {
  return [
    { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 198, scriptChirho: "french-chirho", utf8TextChirho: "a) en 43,18a:" },
    visionSpanChirho(
      { segmentIndexChirho: 1, xMinPxChirho: 198, widthPxChirho: 192, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
      appliedAtChirho,
      GREEK_PHRASE_NOTES_CHIRHO
    ),
    visionSpanChirho(
      { segmentIndexChirho: 2, xMinPxChirho: 390, widthPxChirho: 115, scriptChirho: "symbol-chirho", utf8TextChirho: APPARATUS_SYMBOL_CHIRHO },
      appliedAtChirho,
      APPARATUS_SYMBOL_NOTES_CHIRHO
    ),
    visionSpanChirho(
      { segmentIndexChirho: 3, xMinPxChirho: 505, widthPxChirho: 145, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_THEOS_CHIRHO },
      appliedAtChirho,
      GREEK_THEOS_NOTES_CHIRHO
    ),
    { segmentIndexChirho: 4, xMinPxChirho: 650, widthPxChirho: 174, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[1]" },
  ];
}

function validateTargetLineChirho(lineChirho: SpanLineChirho): void {
  if (
    lineChirho.volumeChirho !== TARGET_VOLUME_CHIRHO ||
    lineChirho.pageChirho !== TARGET_PAGE_CHIRHO ||
    lineChirho.lineIndexChirho !== TARGET_LINE_INDEX_CHIRHO ||
    lineChirho.lineWidthPxChirho !== TARGET_LINE_WIDTH_CHIRHO
  ) {
    throw new Error(`target path is not vol ${TARGET_VOLUME_CHIRHO} page ${TARGET_PAGE_CHIRHO} line ${TARGET_LINE_INDEX_CHIRHO}`);
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

function spansEqualChirho(
  actualSpansChirho: SpanChirho[],
  expectedSpansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>,
  requireExpectedProvenanceChirho: boolean
): boolean {
  if (actualSpansChirho.length !== expectedSpansChirho.length) return false;
  return expectedSpansChirho.every((expectedSpanChirho, indexChirho) => {
    const actualSpanChirho = actualSpansChirho[indexChirho];
    return (
      actualSpanChirho?.segmentIndexChirho === expectedSpanChirho.segmentIndexChirho &&
      actualSpanChirho?.xMinPxChirho === expectedSpanChirho.xMinPxChirho &&
      actualSpanChirho?.widthPxChirho === expectedSpanChirho.widthPxChirho &&
      actualSpanChirho?.scriptChirho === expectedSpanChirho.scriptChirho &&
      actualSpanChirho?.utf8TextChirho === normalizeTextForStorageChirho(expectedSpanChirho.utf8TextChirho) &&
      (!requireExpectedProvenanceChirho || expectedSpanChirho.provenanceChirho === undefined || actualSpanChirho?.provenanceChirho === expectedSpanChirho.provenanceChirho)
    );
  });
}

function stateForLineChirho(lineChirho: SpanLineChirho, plannedSpansChirho: SpanChirho[]): RepairReportChirho["stateChirho"] {
  const actualSpansChirho = sortedSpansChirho(lineChirho);
  if (spansEqualChirho(actualSpansChirho, PRE_SPANS_CHIRHO, false)) return "pre-repair-chirho";
  if (spansEqualChirho(actualSpansChirho, plannedSpansChirho, true)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildLineChirho(lineChirho: SpanLineChirho, plannedSpansChirho: SpanChirho[]): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = plannedSpansChirho.map(normalizeSpanChirho);
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
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

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  stateChirho: RepairReportChirho["stateChirho"],
  messagesChirho: string[],
  lineChirho: SpanLineChirho
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    stateChirho,
    messagesChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
}

function visionVerdictsChirho(plannedSpansChirho: SpanChirho[]): VisionVerdictChirho[] {
  const bySegmentChirho = new Map(plannedSpansChirho.map((spanChirho) => [spanChirho.segmentIndexChirho, spanChirho]));
  const verdictForSegmentChirho = (segmentIndexChirho: number, garbleTextChirho: string, scriptChirho: string, notesChirho: string): VisionVerdictChirho => {
    const spanChirho = bySegmentChirho.get(segmentIndexChirho);
    if (spanChirho === undefined) throw new Error(`missing planned segment ${segmentIndexChirho}`);
    return {
      volumeChirho: TARGET_VOLUME_CHIRHO,
      pageChirho: TARGET_PAGE_CHIRHO,
      lineIndexChirho: TARGET_LINE_INDEX_CHIRHO,
      segmentIndexChirho,
      garbleTextChirho,
      scriptChirho,
      utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
      notesChirho,
    };
  };
  return [
    verdictForSegmentChirho(1, "old Greek span swallowed .967", "greek-chirho", GREEK_PHRASE_NOTES_CHIRHO),
    verdictForSegmentChirho(2, "OCR `4` plus omitted `.967 ≠ +` apparatus", "symbol-chirho", APPARATUS_SYMBOL_NOTES_CHIRHO),
    verdictForSegmentChirho(3, "OCR `+0 es` for Greek ὁ θεός", "greek-chirho", GREEK_THEOS_NOTES_CHIRHO),
  ];
}

function upsertVisionBackupChirho(plannedSpansChirho: SpanChirho[], appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const nextVerdictsChirho = visionVerdictsChirho(plannedSpansChirho);
  const replacementKeysChirho = new Set(
    nextVerdictsChirho.map((verdictChirho) => `${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}`)
  );
  const keptVerdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) => !replacementKeysChirho.has(`${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}`)
  );
  keptVerdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = keptVerdictsChirho;
  backupChirho.countChirho = keptVerdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return nextVerdictsChirho.length;
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const plannedSpansChirho = nextSpansChirho(appliedAtChirho);
  const lineChirho = loadJsonChirho<SpanLineChirho>(TARGET_PATH_CHIRHO);
  validateTargetLineChirho(lineChirho);
  validateTilingChirho(lineChirho);
  const stateChirho = stateForLineChirho(lineChirho, plannedSpansChirho);
  const plannedLineChirho = stateChirho === "already-applied-chirho" ? lineChirho : buildLineChirho(lineChirho, plannedSpansChirho);

  if (stateChirho === "unknown-chirho") {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          "blocked-chirho",
          stateChirho,
          ["target line is not in the expected pre-repair or already-applied state; refusing to guess around current edits"],
          lineChirho
        ),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          stateChirho === "already-applied-chirho" ? "already-applied-chirho" : "planned-chirho",
          stateChirho,
          [
            "ready to split vol 3 p152 line 16 into Greek phrase, `.967 ≠ +` apparatus, Greek `ὁ θεός`, and French tail",
            "changed spans remain vision-tier and require Greek or Latin/symbol review",
          ],
          plannedLineChirho
        ),
        null,
        2
      )
    );
    return;
  }

  if (stateChirho !== "already-applied-chirho") writeJsonChirho(TARGET_PATH_CHIRHO, plannedLineChirho);
  const upsertCountChirho = upsertVisionBackupChirho(plannedSpansChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        "already-applied-chirho",
        [`applied vol 3 p152 line 16 Greek apparatus repair and upserted ${upsertCountChirho} durable vision verdicts`, "regenerate export/report/packs/status next"],
        plannedLineChirho
      ),
      null,
      2
    )
  );
}

mainChirho();
