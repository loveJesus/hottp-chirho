// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 2 p148 line 24.
 *
 * Pass-C captured several Hebrew islands and rendered intervening Hebrew as
 * short Latin/bracket garbage. Claude and Codex independently read the scanline
 * as a continuous Hebrew phrase in the Isaiah 8:11 / 1QSa discussion. The
 * recovered text is stored as vision-chirho only, not as human-certified text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol2-p148-l24-qumran-hidden-hebrew-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-2-chirho",
  "page-0148-chirho",
  "line-024-chirho.json"
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

const EXPECTED_RENDERED_CHIRHO = "הָעָם JnT{2 מִלֶּכֶת 1] אשר on”. Des allusions sous une forme simplifiée se ren-";
const PERIODLESS_REPAIRED_RENDERED_CHIRHO =
  "בְּרִיתָם אֲשֶׁר סָרוּ מִלֶּכֶת בְּדֶרֶךְ הָעָם Des allusions sous une forme simplifiée se ren-";
const REPAIRED_RENDERED_CHIRHO =
  "בְּרִיתָם אֲשֶׁר סָרוּ מִלֶּכֶת בְּדֶרֶךְ הָעָם. Des allusions sous une forme simplifiée se ren-";
const RECOVERED_HEBREW_CHIRHO = "בְּרִיתָם אֲשֶׁר סָרוּ מִלֶּכֶת בְּדֶרֶךְ הָעָם.";

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
  if (lineChirho.volumeChirho !== 2 || lineChirho.pageChirho !== 148 || lineChirho.lineIndexChirho !== 24) {
    throw new Error("span file is not vol 2 page 148 line 24");
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

function stateForLineChirho(
  lineChirho: SpanLineChirho
): "pre-repair-chirho" | "periodless-applied-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const renderedChirho = normalizeTextForStorageChirho(renderedLineChirho(lineChirho));
  if (renderedChirho === normalizeTextForStorageChirho(EXPECTED_RENDERED_CHIRHO)) return "pre-repair-chirho";
  if (renderedChirho === normalizeTextForStorageChirho(PERIODLESS_REPAIRED_RENDERED_CHIRHO)) return "periodless-applied-chirho";
  if (renderedChirho === normalizeTextForStorageChirho(REPAIRED_RENDERED_CHIRHO)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const existingSpansChirho = sortedSpansChirho(lineChirho);
  const suffixSpanChirho = existingSpansChirho.length === 2 ? existingSpansChirho[1] : existingSpansChirho[5];
  if (suffixSpanChirho === undefined) throw new Error("expected original French suffix span to exist");

  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    {
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: 600,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_HEBREW_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho:
        "Recovered continuous Isaiah 8:11 / 1QSa Hebrew phrase from partial Pass-C Hebrew islands plus short Latin/bracket garbage; Claude and Codex second-witnessed the scanline. A follow-up audit confirmed the printed sentence-ending period after the quote. Stored as one vision-chirho span because the OCR segmentation splits through the quote; exact letters, vowels, marks, and punctuation remain expert-confirmation tier.",
    },
    {
      ...suffixSpanChirho,
      segmentIndexChirho: 1,
      xMinPxChirho: 600,
      widthPxChirho: 838,
      scriptChirho: "french-chirho",
      utf8TextChirho: "Des allusions sous une forme simplifiée se ren-",
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho {
  const recoveredSpanChirho = sortedSpansChirho(lineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 0 && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (recoveredSpanChirho === undefined) throw new Error("recovered vision Hebrew span missing");
  return {
    volumeChirho: 2,
    pageChirho: 148,
    lineIndexChirho: 24,
    segmentIndexChirho: 0,
    garbleTextChirho: "JnT{2 + 1] + Hebrew swallowed into old French suffix around partial הָעָם / מִלֶּכֶת / אשר",
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(recoveredSpanChirho.utf8TextChirho),
    notesChirho:
      recoveredSpanChirho.visionNotesChirho ??
      "Recovered from known-script OCR garbage; stored as vision-chirho and routed to Hebrew/WLC expert confirmation.",
  };
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) => !(candidateChirho.volumeChirho === 2 && candidateChirho.pageChirho === 148 && candidateChirho.lineIndexChirho === 24)
  );
  const verdictChirho = visionVerdictForLineChirho(lineChirho);
  verdictsChirho.push(verdictChirho);
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
            "vol 2 p148 line 24 is not in the expected pre-repair or already-applied state; refusing to guess around current edits",
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
          [
            "ready to repair vol 2 p148 line 24 as vision-chirho without certifying it",
            "run with --apply to write the span file and upsert one durable vision-verdict backup row",
          ],
          plannedLineChirho
        ),
        null,
        2
      )
    );
    return;
  }

  writeJsonChirho(SPAN_LINE_PATH_CHIRHO, plannedLineChirho);
  const insertedRowsChirho = upsertVisionBackupChirho(plannedLineChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [
          `upserted durable vision verdict backup; inserted ${insertedRowsChirho} new row(s)`,
          "re-run export markdown, validate-pass-c-hebrew, both review packs, certification status, and hidden-Hebrew scan",
        ],
        plannedLineChirho
      ),
      null,
      2
    )
  );
}

if (import.meta.main) mainChirho();
