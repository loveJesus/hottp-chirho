// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol. 4 p. 151 lines 14-17.
 *
 * These lines contain printed Hebrew that Pass-C/D1 rendered as valid-looking
 * French/digit garbage, so structural strict export could not see the defect.
 * Recovered Hebrew is stored as vision-chirho only. Existing raw Pass-C Hebrew
 * spans remain at their current segment indices so pending human review keys are
 * not orphaned.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol4-p151-hidden-hebrew-2026-06-04-chirho";
const TARGET_VOLUME_CHIRHO = 4;
const TARGET_PAGE_CHIRHO = 151;
const PAGE_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-4-chirho",
  "page-0151-chirho"
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
  humanValidationIdChirho?: number | null;
  humanReviewStatusChirho?: string;
  humanCorrectionStatusChirho?: string;
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
  fromExistingSegmentIndexChirho?: number;
}

interface LineRepairChirho {
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
    lineIndexChirho: 14,
    expectedRenderedChirho: 'voit en D. "DD une construction archaïque semblable à',
    repairedRenderedChirho: "voit en מָעוּזִּי חָיִל une construction archaïque semblable à",
    specsChirho: [
      { widthPxChirho: 170, scriptChirho: "french-chirho", utf8TextChirho: "voit en" },
      {
        widthPxChirho: 225,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "מָעוּזִּי חָיִל",
        provenanceChirho: "vision-chirho",
        visionNotesChirho:
          'Recovered from printed Hebrew mis-OCR rendered as D. "DD after "voit en"; II Samuel 22:33 WLC corroborates מָעוּזִּי חָיִל, but exact printed pointing remains expert-confirmation tier.',
      },
      { widthPxChirho: 780, scriptChirho: "french-chirho", utf8TextChirho: "une construction archaïque semblable à" },
    ],
  },
  {
    lineIndexChirho: 15,
    expectedRenderedChirho: 'שָׁלוֹם "n°2 de Nb 25,12 (expression modernisée en N°73',
    repairedRenderedChirho: "שָׁלוֹם בְּרִיתִי de Nb 25,12 (expression modernisée en בְּרִית",
    specsChirho: [
      { widthPxChirho: 120, scriptChirho: "hebrew-chirho", utf8TextChirho: "שָׁלוֹם", fromExistingSegmentIndexChirho: 0 },
      {
        widthPxChirho: 150,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "בְּרִיתִי",
        provenanceChirho: "vision-chirho",
        visionNotesChirho:
          'Recovered from printed Hebrew mis-OCR rendered as "n°2; Numbers 25:12 WLC corroborates בְּרִיתִי שָׁלוֹם, with exact printed pointing routed to expert confirmation.',
      },
      { widthPxChirho: 812, scriptChirho: "french-chirho", utf8TextChirho: "de Nb 25,12 (expression modernisée en" },
      {
        widthPxChirho: 93,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "בְּרִית",
        provenanceChirho: "vision-chirho",
        visionNotesChirho:
          "Recovered from printed Hebrew mis-OCR rendered as N°73 at the end of the line; exact printed pointing remains expert-confirmation tier.",
      },
    ],
  },
  {
    lineIndexChirho: 16,
    expectedRenderedChirho: '"D par Is 54,10) ou 11} 72771 de Éz 16,27 ou encore',
    repairedRenderedChirho: "שְׁלוֹמִי par Is 54,10) ou דַּרְכֵּךְ זִמָּה de Éz 16,27 ou encore",
    specsChirho: [
      {
        widthPxChirho: 137,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "שְׁלוֹמִי",
        provenanceChirho: "vision-chirho",
        visionNotesChirho:
          'Recovered from printed Hebrew mis-OCR rendered as "D; Isaiah 54:10 WLC corroborates שְׁלוֹמִי, with exact printed pointing routed to expert confirmation.',
      },
      { widthPxChirho: 353, scriptChirho: "french-chirho", utf8TextChirho: "par Is 54,10) ou" },
      {
        widthPxChirho: 229,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "דַּרְכֵּךְ זִמָּה",
        provenanceChirho: "vision-chirho",
        visionNotesChirho:
          "Recovered from printed Hebrew mis-OCR rendered as 11} 72771; Ezekiel 16:27 WLC corroborates the phrase consonantally, with exact printed pointing routed to expert confirmation.",
      },
      { widthPxChirho: 456, scriptChirho: "french-chirho", utf8TextChirho: "de Éz 16,27 ou encore" },
    ],
  },
  {
    lineIndexChirho: 17,
    expectedRenderedChirho: "יְשׁוּעָה + 772279 de Ha 3, 8. Étant donné le relatif isolement",
    repairedRenderedChirho: "יְשׁוּעָה מַרְכְּבֹתֶיךָ de Ha 3, 8. Étant donné le relatif isolement",
    specsChirho: [
      { widthPxChirho: 135, scriptChirho: "hebrew-chirho", utf8TextChirho: "יְשׁוּעָה", fromExistingSegmentIndexChirho: 0 },
      {
        widthPxChirho: 212,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "מַרְכְּבֹתֶיךָ",
        provenanceChirho: "vision-chirho",
        visionNotesChirho:
          "Recovered from printed Hebrew mis-OCR rendered as + 772279; Habakkuk 3:8 WLC corroborates מַרְכְּבֹתֶיךָ יְשׁוּעָה, with exact printed pointing routed to expert confirmation.",
      },
      { widthPxChirho: 830, scriptChirho: "french-chirho", utf8TextChirho: "de Ha 3, 8. Étant donné le relatif isolement" },
    ],
  },
];

function linePathChirho(lineIndexChirho: number): string {
  return join(PAGE_DIR_CHIRHO, `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`);
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
    lineChirho.volumeChirho !== TARGET_VOLUME_CHIRHO ||
    lineChirho.pageChirho !== TARGET_PAGE_CHIRHO ||
    lineChirho.lineIndexChirho !== repairChirho.lineIndexChirho
  ) {
    throw new Error(`line file is not vol4 page151 line${repairChirho.lineIndexChirho}`);
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

function lineVisionVerdictsChirho(lineChirho: SpanLineChirho): VisionVerdictChirho[] {
  return sortSpansChirho(lineChirho.spansChirho)
    .filter((spanChirho) => spanChirho.provenanceChirho === "vision-chirho" && spanChirho.scriptChirho === "hebrew-chirho")
    .map((spanChirho) => ({
      volumeChirho: TARGET_VOLUME_CHIRHO,
      pageChirho: TARGET_PAGE_CHIRHO,
      lineIndexChirho: lineChirho.lineIndexChirho,
      segmentIndexChirho: spanChirho.segmentIndexChirho,
      garbleTextChirho: "known-script-garble-chirho",
      scriptChirho: spanChirho.scriptChirho,
      utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
      notesChirho:
        spanChirho.visionNotesChirho ??
        "Recovered from vol4 p151 known-script OCR garbage; stored as vision-chirho and routed to expert confirmation.",
    }));
}

function upsertVisionVerdictBackupChirho(plannedLinesChirho: SpanLineChirho[], appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = backupChirho.verdictsChirho ?? [];
  let insertedChirho = 0;
  for (const verdictChirho of plannedLinesChirho.flatMap(lineVisionVerdictsChirho)) {
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
  const plannedLinesChirho: Array<{ pathChirho: string; lineChirho: SpanLineChirho; stateChirho: string }> = [];
  const messagesChirho: string[] = [];

  for (const repairChirho of LINE_REPAIRS_CHIRHO) {
    const pathChirho = linePathChirho(repairChirho.lineIndexChirho);
    const lineChirho = loadJsonChirho<SpanLineChirho>(pathChirho);
    assertTargetLineChirho(lineChirho, repairChirho);
    validateTilingChirho(lineChirho);
    const stateChirho = stateForLineChirho(lineChirho, repairChirho);
    if (stateChirho === "unknown-chirho") {
      const blockedReportChirho = reportChirho(
        modeChirho,
        "blocked-chirho",
        [
          `line ${repairChirho.lineIndexChirho} is not in the expected pre-repair or already-applied state; refusing to guess around current edits`,
          `rendered line ${repairChirho.lineIndexChirho}: ${JSON.stringify(renderedLineChirho(lineChirho))}`,
        ],
        reportLinesChirho
      );
      console.log(JSON.stringify(blockedReportChirho, null, 2));
      process.exitCode = 1;
      return;
    }
    const plannedLineChirho =
      stateChirho === "already-applied-chirho" ? lineChirho : buildPlannedLineChirho(lineChirho, repairChirho, appliedAtChirho);
    plannedLinesChirho.push({ pathChirho, lineChirho: plannedLineChirho, stateChirho });
    reportLinesChirho.push({
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
            "ready to repair vol4 p151 hidden Hebrew as vision-chirho without certifying it",
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
    plannedLinesChirho.map((lineChirho) => lineChirho.lineChirho),
    appliedAtChirho
  );
  messagesChirho.push(`upserted durable vision verdict backup; inserted ${insertedVisionRowsChirho} new row(s)`);
  messagesChirho.push("re-run export markdown, raw Hebrew validation/report pack, expert pack, and certification status");
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", messagesChirho, reportLinesChirho), null, 2));
}

if (import.meta.main) mainChirho();
