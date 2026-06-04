// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 1 p150 line 32.
 *
 * The line is a Joshua 6:18 apparatus entry. Pass-C stored the first Hebrew
 * word as a חמד form and left the M V S T witness reading buried as `1770n`.
 * Local page OCR plus direct crop review support חרם forms. These readings are
 * stored as vision-chirho only, not human-certified text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol1-p150-l32-herem-hidden-hebrew-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-1-chirho",
  "page-0150-chirho",
  "line-032-chirho.json"
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
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  spansChirho: Array<
    Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
  >;
}

const EXPECTED_RENDERED_CHIRHO = "6,18 cor תֶּחָמְדּוּ [C] G // assim-ctext : M V ST 1770n";
const POINTED_INTERMEDIATE_RENDERED_CHIRHO = "6,18 cor תֵּחָרְמוּ [C] G // assim-ctext : M V ST תַּחֲרִימוּ";
const REPAIRED_RENDERED_CHIRHO = "6,18 cor תחרמו [C] G // assim-ctext : M V ST תחרימו";
const CORRECTED_LEMMA_HEBREW_CHIRHO = "תחרמו";
const RECOVERED_VARIANT_HEBREW_CHIRHO = "תחרימו";
const LEMMA_NOTES_CHIRHO =
  "Corrected the vol 1 p150 L32 raw Pass-C Hebrew island from the current חמד-form OCR to a Joshua 6:18 חרם-form. Claude second-witnessed that the line must be חרם, not חמד; the local page OCR reads `תֵּחָרְמוּ`. Stored consonantal `תחרמו` as vision-chirho only because the exact printed vowels/marks remain Hebrew/WLC expert-confirmation tier.";
const VARIANT_NOTES_CHIRHO =
  "Recovered the M V S T witness reading from the hidden `1770n` OCR tail on vol 1 p150 L32. Claude second-witnessed the consonants as תחרימו and withdrew the earlier מחמד-family read; local page OCR reads `תַּחֲרִימוּ`, matching the Joshua 6:18 חרם context. Stored consonantal `תחרימו` as vision-chirho only because exact printed vowels/marks and segmentation remain Hebrew/WLC expert-confirmation tier.";

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

function renderedLineChirho(lineChirho: SpanLineChirho): string {
  return sortedSpansChirho(lineChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join(" ");
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

function validateTargetLineChirho(lineChirho: SpanLineChirho): void {
  if (lineChirho.volumeChirho !== 1 || lineChirho.pageChirho !== 150 || lineChirho.lineIndexChirho !== 32) {
    throw new Error("span file is not vol 1 page 150 line 32");
  }
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
    if (spanChirho.widthPxChirho <= 0) {
      throw new Error(`span ${indexChirho} has non-positive width ${spanChirho.widthPxChirho}`);
    }
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
  }
}

function stateForLineChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const renderedChirho = normalizeTextForStorageChirho(renderedLineChirho(lineChirho));
  if (renderedChirho === normalizeTextForStorageChirho(EXPECTED_RENDERED_CHIRHO)) return "pre-repair-chirho";
  if (renderedChirho === normalizeTextForStorageChirho(POINTED_INTERMEDIATE_RENDERED_CHIRHO)) return "pre-repair-chirho";
  if (renderedChirho === normalizeTextForStorageChirho(REPAIRED_RENDERED_CHIRHO)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const prefixSpanChirho = spansChirho[0];
  const bracketSpanChirho = spansChirho[2];
  const assimSpanChirho = spansChirho[3];
  if (prefixSpanChirho === undefined || bracketSpanChirho === undefined || assimSpanChirho === undefined) {
    throw new Error("expected vol 1 p150 L32 original spans to exist");
  }

  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    { ...prefixSpanChirho, segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 150 },
    {
      segmentIndexChirho: 1,
      xMinPxChirho: 150,
      widthPxChirho: 111,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(CORRECTED_LEMMA_HEBREW_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: LEMMA_NOTES_CHIRHO,
    },
    { ...bracketSpanChirho, segmentIndexChirho: 2, xMinPxChirho: 261, widthPxChirho: 153 },
    { ...assimSpanChirho, segmentIndexChirho: 3, xMinPxChirho: 414, widthPxChirho: 199 },
    {
      segmentIndexChirho: 4,
      xMinPxChirho: 613,
      widthPxChirho: 180,
      scriptChirho: "french-chirho",
      utf8TextChirho: ": M V ST",
    },
    {
      segmentIndexChirho: 5,
      xMinPxChirho: 793,
      widthPxChirho: 99,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_VARIANT_HEBREW_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: VARIANT_NOTES_CHIRHO,
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictsForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho[] {
  const spansChirho = sortedSpansChirho(lineChirho);
  const lemmaSpanChirho = spansChirho.find(
    (spanChirho) => spanChirho.segmentIndexChirho === 1 && spanChirho.provenanceChirho === "vision-chirho"
  );
  const variantSpanChirho = spansChirho.find(
    (spanChirho) => spanChirho.segmentIndexChirho === 5 && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (lemmaSpanChirho === undefined) throw new Error("corrected lemma vision Hebrew span missing");
  if (variantSpanChirho === undefined) throw new Error("recovered variant vision Hebrew span missing");
  return [
    {
      volumeChirho: 1,
      pageChirho: 150,
      lineIndexChirho: 32,
      segmentIndexChirho: 1,
      garbleTextChirho: "old pass-c OCR תֶּחָמְדּוּ",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(lemmaSpanChirho.utf8TextChirho),
      notesChirho: lemmaSpanChirho.visionNotesChirho ?? LEMMA_NOTES_CHIRHO,
    },
    {
      volumeChirho: 1,
      pageChirho: 150,
      lineIndexChirho: 32,
      segmentIndexChirho: 5,
      garbleTextChirho: "1770n",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(variantSpanChirho.utf8TextChirho),
      notesChirho: variantSpanChirho.visionNotesChirho ?? VARIANT_NOTES_CHIRHO,
    },
  ];
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) => !(candidateChirho.volumeChirho === 1 && candidateChirho.pageChirho === 150 && candidateChirho.lineIndexChirho === 32)
  );
  const nextVerdictsChirho = visionVerdictsForLineChirho(lineChirho);
  verdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return nextVerdictsChirho.length;
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  lineChirho: SpanLineChirho
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const lineChirho = loadJsonChirho<SpanLineChirho>(SPAN_LINE_PATH_CHIRHO);
  validateTargetLineChirho(lineChirho);
  validateTilingChirho(lineChirho);

  const stateChirho = stateForLineChirho(lineChirho);
  if (stateChirho === "unknown-chirho") {
    console.log(
      JSON.stringify(
        reportChirho(modeChirho, "blocked-chirho", ["line is neither the expected pre-repair state nor the repaired state"], lineChirho),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  if (stateChirho === "already-applied-chirho") {
    if (applyChirho) upsertVisionBackupChirho(lineChirho, appliedAtChirho);
    console.log(JSON.stringify(reportChirho(modeChirho, "already-applied-chirho", ["repair already applied"], lineChirho), null, 2));
    return;
  }

  const plannedLineChirho = buildPlannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(
      JSON.stringify(reportChirho(modeChirho, "planned-chirho", ["ready to repair vol 1 p150 L32 as vision-chirho"], plannedLineChirho), null, 2)
    );
    return;
  }

  writeJsonChirho(SPAN_LINE_PATH_CHIRHO, plannedLineChirho);
  const upsertCountChirho = upsertVisionBackupChirho(plannedLineChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(modeChirho, "applied-chirho", [`applied repair and upserted ${upsertCountChirho} durable vision verdict(s)`], plannedLineChirho),
      null,
      2
    )
  );
}

mainChirho();
