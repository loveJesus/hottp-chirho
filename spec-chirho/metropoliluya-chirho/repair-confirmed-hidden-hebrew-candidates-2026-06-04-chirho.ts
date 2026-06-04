// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for the first double-witnessed hidden-Hebrew candidates.
 *
 * The hidden-Hebrew scanner found printed Hebrew that Pass-C rendered as
 * valid-looking French/digit/symbol garbage. Claude and Codex independently
 * confirmed these two lines against the scanlines. Recovered Hebrew is stored
 * as vision-chirho only, not as certified human text.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-confirmed-hidden-hebrew-candidates-2026-06-04-chirho";
const SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
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

interface LineRepairChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  expectedRenderedChirho: string;
  repairedRenderedChirho: string;
  specsChirho: SpanSpecChirho[];
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

interface RepairReportLineChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  statusChirho: "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  spansChirho: Array<
    Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
  >;
}

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  linesChirho: RepairReportLineChirho[];
}

const LINE_REPAIRS_CHIRHO: LineRepairChirho[] = [
  {
    volumeChirho: 2,
    pageChirho: 148,
    lineIndexChirho: 37,
    expectedRenderedChirho: "lon moi, וְיַסִּירֵנִי est un futur de 12? dont la première radicale a été insérée dans la",
    repairedRenderedChirho: "lon moi, וְיַסִּירֵנִי est un futur de יסר dont la première radicale a été insérée dans la",
    specsChirho: [
      { widthPxChirho: 168, scriptChirho: "french-chirho", utf8TextChirho: "lon moi,", fromExistingSegmentIndexChirho: 0 },
      { widthPxChirho: 115, scriptChirho: "hebrew-chirho", utf8TextChirho: "וְיַסִּירֵנִי", fromExistingSegmentIndexChirho: 1 },
      { widthPxChirho: 257, scriptChirho: "french-chirho", utf8TextChirho: "est un futur de", fromExistingSegmentIndexChirho: 2 },
      {
        widthPxChirho: 90,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "יסר",
        provenanceChirho: "vision-chirho",
        garbleTextChirho: "12?",
        visionNotesChirho:
          'Recovered from printed Hebrew root mis-OCR rendered as "12?" after "est un futur de"; Claude and Codex second-witnessed the scanline as יסר. Stored as vision-chirho; exact printed form remains expert-confirmation tier.',
      },
      {
        widthPxChirho: 812,
        scriptChirho: "french-chirho",
        utf8TextChirho: "dont la première radicale a été insérée dans la",
        fromExistingSegmentIndexChirho: 2,
      },
    ],
  },
  {
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 28,
    expectedRenderedChirho: "42,4 et Qo 12,6 où }11? et JT) se rattachent évidemment",
    repairedRenderedChirho: "42,4 et Qo 12,6 où יָרוּץ et וְתָרוּץ se rattachent évidemment",
    specsChirho: [
      { widthPxChirho: 385, scriptChirho: "french-chirho", utf8TextChirho: "42,4 et Qo 12,6 où", fromExistingSegmentIndexChirho: 0 },
      {
        widthPxChirho: 120,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "יָרוּץ",
        provenanceChirho: "vision-chirho",
        garbleTextChirho: "}11?",
        visionNotesChirho:
          'Recovered from printed Hebrew mis-OCR rendered as "}11?" in the Qo 12,6 discussion; Claude and Codex second-witnessed the scanline as יָרוּץ. Stored as vision-chirho; exact vowel/accent confirmation remains expert tier.',
      },
      { widthPxChirho: 50, scriptChirho: "french-chirho", utf8TextChirho: "et", fromExistingSegmentIndexChirho: 0 },
      {
        widthPxChirho: 120,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "וְתָרוּץ",
        provenanceChirho: "vision-chirho",
        garbleTextChirho: "JT)",
        visionNotesChirho:
          'Recovered from printed Hebrew mis-OCR rendered as "JT)" in the Qo 12,6 discussion; Claude and Codex second-witnessed the scanline as וְתָרוּץ. Stored as vision-chirho; exact vowel/accent confirmation remains expert tier.',
      },
      {
        widthPxChirho: 503,
        scriptChirho: "french-chirho",
        utf8TextChirho: "se rattachent évidemment",
        fromExistingSegmentIndexChirho: 0,
      },
    ],
  },
];

function linePathChirho(repairChirho: LineRepairChirho): string {
  return join(
    SPANS_ROOT_CHIRHO,
    `vol-${repairChirho.volumeChirho}-chirho`,
    `page-${String(repairChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(repairChirho.lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function sortSpansChirho(spansChirho: SpanChirho[]): SpanChirho[] {
  return [...spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function renderedLineChirho(lineChirho: SpanLineChirho): string {
  return sortSpansChirho(lineChirho.spansChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join(" ");
}

function spanSummaryChirho(spansChirho: SpanChirho[]): RepairReportLineChirho["spansChirho"] {
  return sortSpansChirho(spansChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function assertTargetLineChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho): void {
  if (
    lineChirho.volumeChirho !== repairChirho.volumeChirho ||
    lineChirho.pageChirho !== repairChirho.pageChirho ||
    lineChirho.lineIndexChirho !== repairChirho.lineIndexChirho
  ) {
    throw new Error(`line file is not vol${repairChirho.volumeChirho} page${repairChirho.pageChirho} line${repairChirho.lineIndexChirho}`);
  }
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortSpansChirho(lineChirho.spansChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) {
      throw new Error(`line ${lineChirho.lineIndexChirho}: segment index ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    }
    if (spanChirho.xMinPxChirho !== expectedXChirho) {
      throw new Error(`line ${lineChirho.lineIndexChirho}: xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    }
    if (spanChirho.widthPxChirho <= 0) {
      throw new Error(`line ${lineChirho.lineIndexChirho}: span ${indexChirho} has non-positive width ${spanChirho.widthPxChirho}`);
    }
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`line ${lineChirho.lineIndexChirho}: spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
  }
}

function stateForLineChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const renderedChirho = normalizeTextForStorageChirho(renderedLineChirho(lineChirho));
  const expectedChirho = normalizeTextForStorageChirho(repairChirho.expectedRenderedChirho);
  const repairedChirho = normalizeTextForStorageChirho(repairChirho.repairedRenderedChirho);
  if (renderedChirho === expectedChirho) return "pre-repair-chirho";
  if (renderedChirho === repairedChirho) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho, appliedAtChirho: string): SpanLineChirho {
  const existingSpansChirho = sortSpansChirho(lineChirho.spansChirho);
  let cursorChirho = 0;
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = repairChirho.specsChirho.map((specChirho, indexChirho) => {
    const existingSpanChirho =
      specChirho.fromExistingSegmentIndexChirho === undefined ? undefined : existingSpansChirho[specChirho.fromExistingSegmentIndexChirho];
    if (specChirho.fromExistingSegmentIndexChirho !== undefined && existingSpanChirho === undefined) {
      throw new Error(`line ${lineChirho.lineIndexChirho}: missing existing segment ${specChirho.fromExistingSegmentIndexChirho}`);
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

function lineVisionVerdictsChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho): VisionVerdictChirho[] {
  const specBySegmentChirho = new Map(repairChirho.specsChirho.map((specChirho, indexChirho) => [indexChirho, specChirho] as const));
  return sortSpansChirho(lineChirho.spansChirho)
    .filter((spanChirho) => spanChirho.provenanceChirho === "vision-chirho" && spanChirho.scriptChirho === "hebrew-chirho")
    .map((spanChirho) => {
      const specChirho = specBySegmentChirho.get(spanChirho.segmentIndexChirho);
      return {
        volumeChirho: repairChirho.volumeChirho,
        pageChirho: repairChirho.pageChirho,
        lineIndexChirho: repairChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        garbleTextChirho: specChirho?.garbleTextChirho ?? "known-script-garble-chirho",
        scriptChirho: spanChirho.scriptChirho,
        utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
        notesChirho:
          spanChirho.visionNotesChirho ??
          "Recovered from known-script OCR garbage; stored as vision-chirho and routed to expert confirmation.",
      };
    });
}

function upsertVisionVerdictBackupChirho(plannedLinesChirho: Array<{ lineChirho: SpanLineChirho; repairChirho: LineRepairChirho }>, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = backupChirho.verdictsChirho ?? [];
  let insertedChirho = 0;
  for (const plannedLineChirho of plannedLinesChirho) {
    for (const verdictChirho of lineVisionVerdictsChirho(plannedLineChirho.lineChirho, plannedLineChirho.repairChirho)) {
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
  linesChirho: RepairReportLineChirho[]
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    linesChirho,
  };
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const applyChirho = argsChirho.includes("--apply");
  const modeChirho = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const reportLinesChirho: RepairReportLineChirho[] = [];
  const plannedLinesChirho: Array<{ pathChirho: string; lineChirho: SpanLineChirho; repairChirho: LineRepairChirho; stateChirho: string }> = [];
  const messagesChirho: string[] = [];

  for (const repairChirho of LINE_REPAIRS_CHIRHO) {
    const pathChirho = linePathChirho(repairChirho);
    const lineChirho = loadJsonChirho<SpanLineChirho>(pathChirho);
    assertTargetLineChirho(lineChirho, repairChirho);
    validateTilingChirho(lineChirho);
    const stateChirho = stateForLineChirho(lineChirho, repairChirho);
    if (stateChirho === "unknown-chirho") {
      console.log(
        JSON.stringify(
          reportChirho(
            modeChirho,
            "blocked-chirho",
            [
              `vol${repairChirho.volumeChirho} p${repairChirho.pageChirho} line ${repairChirho.lineIndexChirho} is not in the expected pre-repair or already-applied state; refusing to guess around current edits`,
              `rendered line: ${JSON.stringify(renderedLineChirho(lineChirho))}`,
            ],
            reportLinesChirho
          ),
          null,
          2
        )
      );
      process.exitCode = 1;
      return;
    }
    const plannedLineChirho =
      stateChirho === "already-applied-chirho" ? lineChirho : buildPlannedLineChirho(lineChirho, repairChirho, appliedAtChirho);
    plannedLinesChirho.push({ pathChirho, lineChirho: plannedLineChirho, repairChirho, stateChirho });
    reportLinesChirho.push({
      volumeChirho: repairChirho.volumeChirho,
      pageChirho: repairChirho.pageChirho,
      lineIndexChirho: repairChirho.lineIndexChirho,
      statusChirho: stateChirho === "already-applied-chirho" ? "already-applied-chirho" : applyChirho ? "applied-chirho" : "planned-chirho",
      spansChirho: spanSummaryChirho(plannedLineChirho.spansChirho),
    });
  }

  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          plannedLinesChirho.every((lineChirho) => lineChirho.stateChirho === "already-applied-chirho")
            ? "already-applied-chirho"
            : "planned-chirho",
          [
            "ready to repair two double-witnessed hidden-Hebrew candidate lines as vision-chirho without certifying them",
            "run with --apply to write span files and upsert durable vision-verdict backup rows",
          ],
          reportLinesChirho
        ),
        null,
        2
      )
    );
    return;
  }

  for (const plannedLineChirho of plannedLinesChirho) {
    writeJsonChirho(plannedLineChirho.pathChirho, plannedLineChirho.lineChirho);
  }
  const insertedVisionRowsChirho = upsertVisionVerdictBackupChirho(
    plannedLinesChirho.map((lineChirho) => ({ lineChirho: lineChirho.lineChirho, repairChirho: lineChirho.repairChirho })),
    appliedAtChirho
  );
  messagesChirho.push(`upserted durable vision verdict backup; inserted ${insertedVisionRowsChirho} new row(s)`);
  messagesChirho.push("re-run export markdown, raw Hebrew validation/report pack, expert pack, certification status, and hidden-Hebrew scan");
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", messagesChirho, reportLinesChirho), null, 2));
}

if (import.meta.main) mainChirho();
