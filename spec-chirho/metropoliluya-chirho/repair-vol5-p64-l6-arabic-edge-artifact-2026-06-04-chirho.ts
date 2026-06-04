// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first cleanup for vol 5 p64 line 6.
 *
 * The printed line ends with the Arabic `الـى`. Pass-C left a tiny final
 * French span `*8` at the right edge, but the scanline shows no extra glyph
 * there. This script removes that edge artifact and extends the existing
 * Arabic vision-tier span to the line edge without changing its text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-p64-l6-arabic-edge-artifact-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-5-chirho",
  "page-0064-chirho",
  "line-006-chirho.json"
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

const ARABIC_TEXT_CHIRHO = "الـى";
const ARABIC_VISION_NOTES_CHIRHO =
  "Cleaned the vol 5 p64 line 6 right edge after visual inspection: the scanline ends with Arabic `الـى`, and the old final S6 French `*8` was a non-existent edge artifact. The Arabic span was widened from x1892..2021 to x1892..2046 to cover the line edge. The Arabic reading remains vision-chirho and still belongs to Arabist expert confirmation for exact orthography.";

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
  if (lineChirho.volumeChirho !== 5 || lineChirho.pageChirho !== 64 || lineChirho.lineIndexChirho !== 6) {
    throw new Error("span file is not vol 5 page 64 line 6");
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

function isPreRepairLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 7 &&
    spansChirho[5]?.segmentIndexChirho === 5 &&
    spansChirho[5]?.xMinPxChirho === 1892 &&
    spansChirho[5]?.widthPxChirho === 129 &&
    spansChirho[5]?.scriptChirho === "arabic-chirho" &&
    spansChirho[5]?.utf8TextChirho === ARABIC_TEXT_CHIRHO &&
    spansChirho[6]?.segmentIndexChirho === 6 &&
    spansChirho[6]?.xMinPxChirho === 2021 &&
    spansChirho[6]?.widthPxChirho === 25 &&
    spansChirho[6]?.scriptChirho === "french-chirho" &&
    spansChirho[6]?.utf8TextChirho === "*8"
  );
}

function isAlreadyAppliedLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 6 &&
    spansChirho[5]?.segmentIndexChirho === 5 &&
    spansChirho[5]?.xMinPxChirho === 1892 &&
    spansChirho[5]?.widthPxChirho === 154 &&
    spansChirho[5]?.scriptChirho === "arabic-chirho" &&
    spansChirho[5]?.utf8TextChirho === ARABIC_TEXT_CHIRHO &&
    spansChirho[5]?.provenanceChirho === "vision-chirho"
  );
}

function stateForLineChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (isPreRepairLineChirho(lineChirho)) return "pre-repair-chirho";
  if (isAlreadyAppliedLineChirho(lineChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    ...spansChirho.slice(0, 5),
    {
      ...spansChirho[5],
      segmentIndexChirho: 5,
      xMinPxChirho: 1892,
      widthPxChirho: 154,
      scriptChirho: "arabic-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(ARABIC_TEXT_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: spansChirho[5]?.visionTranscribedAtChirho ?? appliedAtChirho,
      visionNotesChirho: ARABIC_VISION_NOTES_CHIRHO,
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho {
  const arabicSpanChirho = sortedSpansChirho(lineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 5 && spanChirho.scriptChirho === "arabic-chirho" && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (arabicSpanChirho === undefined) throw new Error("Arabic vision span missing");
  return {
    volumeChirho: 5,
    pageChirho: 64,
    lineIndexChirho: 6,
    segmentIndexChirho: 5,
    garbleTextChirho: "#### + trailing *8 edge artifact",
    scriptChirho: "arabic-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(arabicSpanChirho.utf8TextChirho),
    notesChirho: arabicSpanChirho.visionNotesChirho ?? ARABIC_VISION_NOTES_CHIRHO,
  };
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !(
        candidateChirho.volumeChirho === 5 &&
        candidateChirho.pageChirho === 64 &&
        candidateChirho.lineIndexChirho === 6 &&
        candidateChirho.segmentIndexChirho === 5
      )
  );
  verdictsChirho.push(visionVerdictForLineChirho(lineChirho));
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return 1;
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
        reportChirho(
          modeChirho,
          "blocked-chirho",
          [
            "vol 5 p64 line 6 is not in the expected pre-repair or already-applied state; refusing to guess around current edits",
            `rendered line: ${JSON.stringify(renderedLineChirho(lineChirho))}`,
          ],
          lineChirho
        ),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  const plannedLineChirho = stateChirho === "already-applied-chirho" ? lineChirho : buildPlannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          stateChirho === "already-applied-chirho" ? "already-applied-chirho" : "planned-chirho",
          ["ready to remove vol 5 p64 L6 trailing edge artifact and widen the Arabic vision span"],
          plannedLineChirho
        ),
        null,
        2
      )
    );
    return;
  }

  if (stateChirho !== "already-applied-chirho") {
    writeJsonChirho(SPAN_LINE_PATH_CHIRHO, plannedLineChirho);
  }
  const upsertCountChirho = upsertVisionBackupChirho(plannedLineChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [`applied vol 5 p64 L6 Arabic edge cleanup and upserted ${upsertCountChirho} durable vision verdict`],
        plannedLineChirho
      ),
      null,
      2
    )
  );
}

mainChirho();
