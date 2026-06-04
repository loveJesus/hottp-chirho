// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for the vol 3 p149 line 25 Micah 6:9 hidden-Hebrew cluster.
 *
 * Pass-C captured two partial Hebrew islands and rendered the rest of the quote
 * as digit/Latin garbage. Claude and Codex independently read the scanline as
 * a continuous Hebrew quote. The recovered text is stored as vision-chirho, not
 * as certified human text. The old schema-v1 "correct" verdict on the partial
 * וְתוּשִׁיָּה span is retired because the segment is rebuilt into a larger
 * vision-tier quote.
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p149-l25-micah-hidden-hebrew-2026-06-04-chirho";
const SPAN_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-3-chirho",
  "page-0149-chirho",
  "line-025-chirho.json"
);
const PROGRESS_DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
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
  legacyRowsToRetireChirho: number;
  legacyRowsRetiredChirho: number;
  spansChirho: Array<
    Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
  >;
}

const EXPECTED_RENDERED_CHIRHO =
  "est de l'hébreu, il est vrai que c'est par 709 87 וְתוּשִׁיָּה Kip? y יִקְרָא Dip que les mss";
const REPAIRED_RENDERED_CHIRHO =
  "est de l'hébreu, il est vrai que c'est par קוֹל יְהוָה לָעִיר יִקְרָא וְתוּשִׁיָּה יִרְאֶה שְׁמֶךָ que les mss";
const RECOVERED_HEBREW_CHIRHO = "קוֹל יְהוָה לָעִיר יִקְרָא וְתוּשִׁיָּה יִרְאֶה שְׁמֶךָ";

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
  if (lineChirho.volumeChirho !== 3 || lineChirho.pageChirho !== 149 || lineChirho.lineIndexChirho !== 25) {
    throw new Error("span file is not vol 3 page 149 line 25");
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
  const prefixSpanChirho = spansChirho[0];
  const suffixSpanChirho = spansChirho[4];
  if (prefixSpanChirho === undefined || suffixSpanChirho === undefined) {
    throw new Error("expected original prefix and suffix spans to exist");
  }
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    {
      ...prefixSpanChirho,
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: 590,
      scriptChirho: "french-chirho",
      utf8TextChirho: "est de l'hébreu, il est vrai que c'est par",
    },
    {
      segmentIndexChirho: 1,
      xMinPxChirho: 590,
      widthPxChirho: 548,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_HEBREW_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho:
        "Recovered full Micah 6:9 printed Hebrew quote from Pass-C digit/Latin garbage around two partial Hebrew islands; Claude and Codex second-witnessed the scanline. Stored as one vision-chirho span to preserve the continuous RTL quote; exact letters, vowels, and marks remain expert-confirmation tier.",
    },
    {
      ...suffixSpanChirho,
      segmentIndexChirho: 2,
      xMinPxChirho: 1138,
      widthPxChirho: 141,
      scriptChirho: "french-chirho",
      utf8TextChirho: "que les mss",
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictForLineChirho(lineChirho: SpanLineChirho): VisionVerdictChirho {
  const recoveredSpanChirho = sortedSpansChirho(lineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 1 && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (recoveredSpanChirho === undefined) throw new Error("recovered vision Hebrew span missing");
  return {
    volumeChirho: 3,
    pageChirho: 149,
    lineIndexChirho: 25,
    segmentIndexChirho: 1,
    garbleTextChirho: "709 87 + Kip? y + Dip around partial וְתוּשִׁיָּה / יִקְרָא",
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
    (candidateChirho) => !(candidateChirho.volumeChirho === 3 && candidateChirho.pageChirho === 149 && candidateChirho.lineIndexChirho === 25)
  );
  const verdictChirho = visionVerdictForLineChirho(lineChirho);
  verdictsChirho.push(verdictChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return 1;
}

function countLegacyCurrentRowsChirho(dbChirho: Database): number {
  const rowChirho = dbChirho
    .prepare(
      `
      SELECT COUNT(*) AS countChirho
        FROM pass_c_human_validations_chirho
       WHERE volume_chirho = 3
         AND page_chirho = 149
         AND line_index_chirho = 25
         AND is_current_chirho = 1
         AND COALESCE(schema_version_chirho, 1) < 2`
    )
    .get() as { countChirho: number };
  return rowChirho.countChirho;
}

function retireLegacyCurrentRowsChirho(dbChirho: Database): number {
  const resultChirho = dbChirho
    .prepare(
      `
      UPDATE pass_c_human_validations_chirho
         SET is_current_chirho = 0,
             updated_at_chirho = datetime('now'),
             notes_chirho = COALESCE(notes_chirho, '') || CASE
               WHEN COALESCE(notes_chirho, '') = '' THEN ''
               ELSE '\n'
             END || 'Retired by repair-vol3-p149-l25-micah-hidden-hebrew-2026-06-04-chirho: stale schema-v1 verdict on a partial span rebuilt into a larger vision-tier Micah 6:9 quote.'
       WHERE volume_chirho = 3
         AND page_chirho = 149
         AND line_index_chirho = 25
         AND is_current_chirho = 1
         AND COALESCE(schema_version_chirho, 1) < 2`
    )
    .run();
  return resultChirho.changes;
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  lineChirho: SpanLineChirho,
  legacyRowsToRetireChirho: number,
  legacyRowsRetiredChirho: number
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    legacyRowsToRetireChirho,
    legacyRowsRetiredChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const dbChirho = new Database(PROGRESS_DB_PATH_CHIRHO);
  const lineChirho = loadJsonChirho<SpanLineChirho>(SPAN_LINE_PATH_CHIRHO);
  validateTargetLineChirho(lineChirho);
  validateTilingChirho(lineChirho);
  const stateChirho = stateForLineChirho(lineChirho);
  const legacyRowsToRetireChirho = countLegacyCurrentRowsChirho(dbChirho);
  if (stateChirho === "unknown-chirho") {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          "blocked-chirho",
          [
            "vol 3 p149 line 25 is not in the expected pre-repair or already-applied state; refusing to guess around current edits",
            `rendered line: ${JSON.stringify(renderedLineChirho(lineChirho))}`,
          ],
          lineChirho,
          legacyRowsToRetireChirho,
          0
        ),
        null,
        2
      )
    );
    dbChirho.close();
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
            "ready to repair vol 3 p149 line 25 as one vision-chirho Micah 6:9 quote without certifying it",
            "run with --apply to write the span file, upsert the durable vision-verdict backup row, and retire stale schema-v1 validation rows",
          ],
          plannedLineChirho,
          legacyRowsToRetireChirho,
          0
        ),
        null,
        2
      )
    );
    dbChirho.close();
    return;
  }

  writeJsonChirho(SPAN_LINE_PATH_CHIRHO, plannedLineChirho);
  const insertedRowsChirho = upsertVisionBackupChirho(plannedLineChirho, appliedAtChirho);
  const legacyRowsRetiredChirho = retireLegacyCurrentRowsChirho(dbChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [
          `upserted durable vision verdict backup; inserted ${insertedRowsChirho} rebuilt row(s)`,
          `retired ${legacyRowsRetiredChirho} stale schema-v1 validation row(s) on this line`,
          "re-run export markdown, validate-pass-c-hebrew, review packs, certification status, and hidden-Hebrew scan",
        ],
        plannedLineChirho,
        legacyRowsToRetireChirho,
        legacyRowsRetiredChirho
      ),
      null,
      2
    )
  );
  dbChirho.close();
}

if (import.meta.main) mainChirho();
