// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 3 p151 line 21.
 *
 * Pass-C swallowed the Greek μου into a French span, rendered printed Hebrew as
 * digit/quote garbage, and assigned the wrong Hebrew text to the following box.
 * Claude and Codex independently read the scanline. Recovered text is stored as
 * vision-chirho only, not as human-certified text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p151-l21-hidden-greek-hebrew-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-3-chirho",
  "page-0151-chirho",
  "line-021-chirho.json"
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

interface SpanSpecChirho {
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionNotesChirho?: string;
  garbleTextChirho?: string;
  fromExistingSegmentIndexChirho?: number;
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
  'Ἰσραὴλ τὸν λαόν Lou pour le M: "32"n8 “אֶת־עַמִּי En CT3 397,17-20, ayant noté que le';
const INTERMEDIATE_SYMBOL_SPLIT_RENDERED_CHIRHO =
  "Ἰσραὴλ τὸν λαόν μου pour le M: נְשִׂיאֵי אֶת־עַמִּי . En CT3 397,17-20, ayant noté que le";
const REPAIRED_RENDERED_CHIRHO =
  "Ἰσραὴλ τὸν λαόν μου pour le M: נְשִׂיאֵי אֶת־עַמִּי. En CT3 397,17-20, ayant noté que le";

const SPAN_SPECS_CHIRHO: SpanSpecChirho[] = [
  { widthPxChirho: 279, scriptChirho: "greek-chirho", utf8TextChirho: "Ἰσραὴλ τὸν λαόν", fromExistingSegmentIndexChirho: 0 },
  {
    widthPxChirho: 68,
    scriptChirho: "greek-chirho",
    utf8TextChirho: "μου",
    provenanceChirho: "vision-chirho",
    garbleTextChirho: "missing-greek-tail-chirho",
    visionNotesChirho:
      "Recovered Greek μου swallowed into the following French span; Claude and Codex second-witnessed the scanline. Stored as vision-chirho; exact printed Greek remains expert-confirmation tier.",
  },
  { widthPxChirho: 153, scriptChirho: "french-chirho", utf8TextChirho: "pour le M:", fromExistingSegmentIndexChirho: 1 },
  {
    widthPxChirho: 212,
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: "נְשִׂיאֵי אֶת־עַמִּי.",
    provenanceChirho: "vision-chirho",
    garbleTextChirho: '"32"n8 + misassigned “אֶת־עַמִּי + missing period',
    visionNotesChirho:
      'Recovered printed Hebrew phrase from digit/quote garbage and a wrong raw Pass-C assignment; Claude and Codex second-witnessed the scanline as נְשִׂיאֵי אֶת־עַמִּי. Stored with its printed period as vision-chirho; exact letters, vowels, marks, and punctuation remain expert-confirmation tier.',
  },
  { widthPxChirho: 571, scriptChirho: "french-chirho", utf8TextChirho: "En CT3 397,17-20, ayant noté que le", fromExistingSegmentIndexChirho: 3 },
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
  if (lineChirho.volumeChirho !== 3 || lineChirho.pageChirho !== 151 || lineChirho.lineIndexChirho !== 21) {
    throw new Error("span file is not vol 3 page 151 line 21");
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
  if (
    renderedChirho === normalizeTextForStorageChirho(EXPECTED_RENDERED_CHIRHO) ||
    renderedChirho === normalizeTextForStorageChirho(INTERMEDIATE_SYMBOL_SPLIT_RENDERED_CHIRHO)
  ) {
    return "pre-repair-chirho";
  }
  if (renderedChirho === normalizeTextForStorageChirho(REPAIRED_RENDERED_CHIRHO)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const existingSpansChirho = sortedSpansChirho(lineChirho);
  let cursorChirho = 0;
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = SPAN_SPECS_CHIRHO.map((specChirho, indexChirho) => {
    const existingSpanChirho =
      specChirho.fromExistingSegmentIndexChirho === undefined ? undefined : existingSpansChirho[specChirho.fromExistingSegmentIndexChirho];
    if (specChirho.fromExistingSegmentIndexChirho !== undefined && existingSpanChirho === undefined) {
      throw new Error(`missing existing segment ${specChirho.fromExistingSegmentIndexChirho}`);
    }
    const spanChirho: SpanChirho = {
      ...(existingSpanChirho ?? {}),
      segmentIndexChirho: indexChirho,
      xMinPxChirho: cursorChirho,
      widthPxChirho: specChirho.widthPxChirho,
      scriptChirho: specChirho.scriptChirho,
      utf8TextChirho: normalizeTextForStorageChirho(specChirho.utf8TextChirho),
    };
    if (specChirho.provenanceChirho !== undefined) {
      spanChirho.provenanceChirho = specChirho.provenanceChirho;
    } else {
      delete spanChirho.provenanceChirho;
      delete spanChirho.visionTranscribedAtChirho;
      delete spanChirho.visionNotesChirho;
    }
    if (specChirho.visionNotesChirho !== undefined) {
      spanChirho.visionTranscribedAtChirho = appliedAtChirho;
      spanChirho.visionNotesChirho = specChirho.visionNotesChirho;
    }
    cursorChirho += specChirho.widthPxChirho;
    return spanChirho;
  });
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictsForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho[] {
  const specBySegmentChirho = new Map(SPAN_SPECS_CHIRHO.map((specChirho, indexChirho) => [indexChirho, specChirho] as const));
  return sortedSpansChirho(lineChirho)
    .filter((spanChirho) => spanChirho.provenanceChirho === "vision-chirho")
    .map((spanChirho) => {
      const specChirho = specBySegmentChirho.get(spanChirho.segmentIndexChirho);
      return {
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        garbleTextChirho: specChirho?.garbleTextChirho ?? "known-script-garble-chirho",
        scriptChirho: spanChirho.scriptChirho,
        utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
        notesChirho:
          spanChirho.visionNotesChirho ??
          "Recovered from known-script OCR garbage; stored as vision-chirho and routed to the appropriate review lane.",
      };
    });
}

function upsertVisionBackupChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) => !(candidateChirho.volumeChirho === 3 && candidateChirho.pageChirho === 151 && candidateChirho.lineIndexChirho === 21)
  );
  let insertedChirho = 0;
  for (const verdictChirho of visionVerdictsForLineChirho(lineChirho)) {
    const existingIndexChirho = verdictsChirho.findIndex(
      (candidateChirho) =>
        candidateChirho.volumeChirho === verdictChirho.volumeChirho &&
        candidateChirho.pageChirho === verdictChirho.pageChirho &&
        candidateChirho.lineIndexChirho === verdictChirho.lineIndexChirho &&
        candidateChirho.segmentIndexChirho === verdictChirho.segmentIndexChirho
    );
    if (existingIndexChirho === -1) {
      verdictsChirho.push(verdictChirho);
      insertedChirho += 1;
    } else {
      verdictsChirho[existingIndexChirho] = verdictChirho;
    }
  }
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return insertedChirho;
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
            "vol 3 p151 line 21 is not in the expected pre-repair or already-applied state; refusing to guess around current edits",
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
            "ready to repair vol 3 p151 line 21 as vision-chirho without certifying it",
            "run with --apply to write the span file and upsert durable vision-verdict backup rows",
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
