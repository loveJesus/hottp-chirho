// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 1 p151 line 7.
 *
 * Pass-C captured the middle of the Deuteronomy 7:25 quote but rendered the
 * opening, ellipsis, and closing token as French/symbol garbage. Claude and
 * Codex independently read the quote; the recovered text is stored as
 * vision-chirho only, not as human-certified text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol1-p151-l7-deuteronomy-hidden-hebrew-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-1-chirho",
  "page-0151-chirho",
  "line-007-chirho.json"
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

const EXPECTED_RENDERED_CHIRHO =
  "tiques Jos 7,21 ואחמדם) (ואקחם et Dt 7,25 (1? תחמד ולקחת N° en un contexte";
const REPAIRED_RENDERED_CHIRHO =
  "tiques Jos 7,21 ואחמדם) (ואקחם et Dt 7,25 (לא תחמד ... ולקחת לך) en un contexte";
const RECOVERED_HEBREW_CHIRHO = "(לא תחמד ... ולקחת לך)";
const VISION_NOTES_CHIRHO =
  "Recovered the full Deuteronomy 7:25 Hebrew citation from hidden OCR garbage around the partial Pass-C Hebrew island. Claude and Codex second-witnessed the scanline as logical text `(לא תחמד ... ולקחת לך)`, including the printed three-dot ellipsis between תחמד and ולקחת and the closing לך. Parentheses delimit the Hebrew citation and are stored inside the Hebrew span. Exact vowels/marks, ellipsis character convention, and punctuation/parenthesis placement remain Hebrew/WLC expert-confirmation tier.";

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
  if (lineChirho.volumeChirho !== 1 || lineChirho.pageChirho !== 151 || lineChirho.lineIndexChirho !== 7) {
    throw new Error("span file is not vol 1 page 151 line 7");
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
  if (renderedChirho === normalizeTextForStorageChirho(REPAIRED_RENDERED_CHIRHO)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const prefixFrenchSpanChirho = spansChirho[0];
  const joshuaHebrewSpanChirho = spansChirho[1];
  const suffixFrenchSpanChirho = spansChirho[4];
  if (prefixFrenchSpanChirho === undefined || joshuaHebrewSpanChirho === undefined || suffixFrenchSpanChirho === undefined) {
    throw new Error("expected original vol 1 p151 L7 spans to exist");
  }

  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    prefixFrenchSpanChirho,
    joshuaHebrewSpanChirho,
    {
      segmentIndexChirho: 2,
      xMinPxChirho: 582,
      widthPxChirho: 223,
      scriptChirho: "french-chirho",
      utf8TextChirho: "et Dt 7,25",
    },
    {
      segmentIndexChirho: 3,
      xMinPxChirho: 805,
      widthPxChirho: 382,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_HEBREW_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: VISION_NOTES_CHIRHO,
    },
    {
      ...suffixFrenchSpanChirho,
      segmentIndexChirho: 4,
      xMinPxChirho: 1187,
      widthPxChirho: 254,
      scriptChirho: "french-chirho",
      utf8TextChirho: "en un contexte",
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho {
  const recoveredSpanChirho = sortedSpansChirho(lineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 3 && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (recoveredSpanChirho === undefined) throw new Error("recovered vision Hebrew span missing");
  return {
    volumeChirho: 1,
    pageChirho: 151,
    lineIndexChirho: 7,
    segmentIndexChirho: 3,
    garbleTextChirho: "(1? + omitted ellipsis + N° around partial תחמד ולקחת",
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(recoveredSpanChirho.utf8TextChirho),
    notesChirho: recoveredSpanChirho.visionNotesChirho ?? VISION_NOTES_CHIRHO,
  };
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) => !(candidateChirho.volumeChirho === 1 && candidateChirho.pageChirho === 151 && candidateChirho.lineIndexChirho === 7)
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
            "vol 1 p151 line 7 is not in the expected pre-repair or already-applied state; refusing to guess around current edits",
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
          ["ready to repair vol 1 p151 L7 as one vision-chirho Deuteronomy quote with ellipsis"],
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
        [`applied repair and upserted ${upsertCountChirho} durable vision verdict for vol 1 p151 L7`],
        plannedLineChirho
      ),
      null,
      2
    )
  );
}

mainChirho();
