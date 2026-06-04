// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol. 3 p. 148 line 59.
 *
 * The current span 0 contains French plus the garbled Hebrew continuation
 * "72 >23"; the print shows the Zechariah 9:2 continuation
 * "תִּגְבׇּל־בָּ֑הּ". Applying this repair necessarily renumbers the already
 * reviewed "וְגַם־חֲמָ֖ת" span from segment 1 to segment 2, so the script also
 * migrates the human-validation DB key and its durable backup. It refuses to
 * apply until that existing segment has already been corrected and certified.
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p148-l59-zechariah-quote-2026-06-01-chirho";
const LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-3-chirho",
  "page-0148-chirho",
  "line-059-chirho.json"
);
const HUMAN_VALIDATIONS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "pass-c-human-validations-backup-2026-06-01-chirho.json"
);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);

const TARGET_VOLUME_CHIRHO = 3;
const TARGET_PAGE_CHIRHO = 148;
const TARGET_LINE_CHIRHO = 59;
const OLD_REVIEW_SEGMENT_CHIRHO = 1;
const NEW_REVIEW_SEGMENT_CHIRHO = 2;
const REVIEW_DB_ID_CHIRHO = 3;
const LINE_WIDTH_CHIRHO = 1174;
const EXPECTED_GARBLED_PREFIX_CHIRHO = "b) Za 9,2. Le M place 72 >23";
const CLEAN_PREFIX_CHIRHO = "b) Za 9,2. Le M place";
const EXPECTED_CORRECTED_REVIEW_TEXT_CHIRHO = "וְגַם־חֲמָ֖ת";
const RECOVERED_CONTINUATION_TEXT_CHIRHO = "תִּגְבׇּל־בָּ֑הּ";

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
  visionNotesChirho?: string;
  humanValidationIdChirho?: number;
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

interface HumanValidationBackupReviewChirho {
  dbIdChirho?: number;
  volumeChirho?: number;
  pageChirho?: number;
  lineIndexChirho?: number;
  segmentIndexChirho?: number;
  [keyChirho: string]: unknown;
}

interface HumanValidationBackupChirho {
  generatedAtChirho?: string;
  reviewCountChirho?: number;
  reviewsChirho?: HumanValidationBackupReviewChirho[];
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

interface SqliteCountRowChirho {
  countChirho: number;
}

interface RepairReportChirho {
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  linePathChirho: string;
  plannedSpansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>;
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

function spanSummaryChirho(spansChirho: SpanChirho[]): RepairReportChirho["plannedSpansChirho"] {
  return spansChirho.map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function assertTargetLineChirho(lineChirho: SpanLineChirho): void {
  if (
    lineChirho.volumeChirho !== TARGET_VOLUME_CHIRHO ||
    lineChirho.pageChirho !== TARGET_PAGE_CHIRHO ||
    lineChirho.lineIndexChirho !== TARGET_LINE_CHIRHO
  ) {
    throw new Error("line file is not vol3 page148 line59");
  }
  if (lineChirho.lineWidthPxChirho !== LINE_WIDTH_CHIRHO) {
    throw new Error(`lineWidthPxChirho ${lineChirho.lineWidthPxChirho} !== ${LINE_WIDTH_CHIRHO}`);
  }
}

function validateTilingChirho(spansChirho: SpanChirho[]): void {
  let expectedXChirho = 0;
  for (let indexChirho = 0; indexChirho < spansChirho.length; indexChirho += 1) {
    const spanChirho = spansChirho[indexChirho]!;
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
  if (expectedXChirho !== LINE_WIDTH_CHIRHO) {
    throw new Error(`spans end at ${expectedXChirho}, expected ${LINE_WIDTH_CHIRHO}`);
  }
}

function currentStateChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const spansChirho = sortSpansChirho(lineChirho.spansChirho);
  if (
    spansChirho.length === 3 &&
    spansChirho[0]?.utf8TextChirho === EXPECTED_GARBLED_PREFIX_CHIRHO &&
    spansChirho[1]?.segmentIndexChirho === OLD_REVIEW_SEGMENT_CHIRHO
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 4 &&
    spansChirho[0]?.utf8TextChirho === CLEAN_PREFIX_CHIRHO &&
    spansChirho[1]?.utf8TextChirho === normalizeTextForStorageChirho(RECOVERED_CONTINUATION_TEXT_CHIRHO) &&
    spansChirho[2]?.utf8TextChirho === normalizeTextForStorageChirho(EXPECTED_CORRECTED_REVIEW_TEXT_CHIRHO)
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function s1CorrectionResolvedChirho(spanChirho: SpanChirho): boolean {
  return (
    normalizeTextForStorageChirho(spanChirho.utf8TextChirho) === normalizeTextForStorageChirho(EXPECTED_CORRECTED_REVIEW_TEXT_CHIRHO) &&
    spanChirho.humanReviewStatusChirho === "reviewed-corrected-chirho" &&
    spanChirho.humanCorrectionStatusChirho === "suggested-correction-applied-chirho" &&
    spanChirho.provenanceChirho === "human-chirho" &&
    spanChirho.humanValidationIdChirho === REVIEW_DB_ID_CHIRHO
  );
}

function plannedLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortSpansChirho(lineChirho.spansChirho);
  const prefixSpanChirho = spansChirho[0]!;
  const reviewedSpanChirho = spansChirho[1]!;
  const suffixSpanChirho = spansChirho[2]!;
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    {
      ...prefixSpanChirho,
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: 344,
      scriptChirho: "french-chirho",
      utf8TextChirho: CLEAN_PREFIX_CHIRHO,
    },
    {
      segmentIndexChirho: 1,
      xMinPxChirho: 344,
      widthPxChirho: 116,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_CONTINUATION_TEXT_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho:
        "Recovered from Pass-C garble \"72 >23\" in the printed Zechariah 9:2 quote; WLC continuation תִּגְבׇּל־בָּ֑הּ matches the crop consonantally, with exact pointing routed to expert confirmation.",
    },
    {
      ...reviewedSpanChirho,
      segmentIndexChirho: 2,
      xMinPxChirho: 460,
      widthPxChirho: 115,
    },
    {
      ...suffixSpanChirho,
      segmentIndexChirho: 3,
      xMinPxChirho: 575,
      widthPxChirho: 599,
    },
  ];
  validateTilingChirho(sortSpansChirho(nextLineChirho.spansChirho));
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function migrateHumanValidationRowsChirho(dbChirho: Database): number {
  const stmtChirho = dbChirho.prepare(`
    UPDATE pass_c_human_validations_chirho
       SET segment_index_chirho = ?,
           updated_at_chirho = datetime('now')
     WHERE volume_chirho = ?
       AND page_chirho = ?
       AND line_index_chirho = ?
       AND segment_index_chirho = ?`);
  const resultChirho = stmtChirho.run(
    NEW_REVIEW_SEGMENT_CHIRHO,
    TARGET_VOLUME_CHIRHO,
    TARGET_PAGE_CHIRHO,
    TARGET_LINE_CHIRHO,
    OLD_REVIEW_SEGMENT_CHIRHO
  );
  return resultChirho.changes;
}

function countHumanValidationRowsAtSegmentChirho(dbChirho: Database, segmentIndexChirho: number): number {
  const rowChirho = dbChirho
    .prepare(
      `
        SELECT COUNT(*) AS countChirho
          FROM pass_c_human_validations_chirho
         WHERE volume_chirho = ?
           AND page_chirho = ?
           AND line_index_chirho = ?
           AND segment_index_chirho = ?`
    )
    .get(TARGET_VOLUME_CHIRHO, TARGET_PAGE_CHIRHO, TARGET_LINE_CHIRHO, segmentIndexChirho) as SqliteCountRowChirho;
  return rowChirho.countChirho;
}

function migrateHumanValidationBackupChirho(appliedAtChirho: string): number {
  if (!existsSync(HUMAN_VALIDATIONS_BACKUP_PATH_CHIRHO)) return 0;
  const backupChirho = loadJsonChirho<HumanValidationBackupChirho>(HUMAN_VALIDATIONS_BACKUP_PATH_CHIRHO);
  let changedChirho = 0;
  for (const reviewChirho of backupChirho.reviewsChirho ?? []) {
    if (
      reviewChirho.volumeChirho === TARGET_VOLUME_CHIRHO &&
      reviewChirho.pageChirho === TARGET_PAGE_CHIRHO &&
      reviewChirho.lineIndexChirho === TARGET_LINE_CHIRHO &&
      reviewChirho.segmentIndexChirho === OLD_REVIEW_SEGMENT_CHIRHO
    ) {
      reviewChirho.segmentIndexChirho = NEW_REVIEW_SEGMENT_CHIRHO;
      changedChirho += 1;
    }
  }
  if (changedChirho !== 0) {
    backupChirho.generatedAtChirho = appliedAtChirho;
    writeJsonChirho(HUMAN_VALIDATIONS_BACKUP_PATH_CHIRHO, backupChirho);
  }
  return changedChirho;
}

function upsertVisionVerdictBackupChirho(appliedAtChirho: string): number {
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = backupChirho.verdictsChirho ?? [];
  const existingIndexChirho = verdictsChirho.findIndex(
    (verdictChirho) =>
      verdictChirho.volumeChirho === TARGET_VOLUME_CHIRHO &&
      verdictChirho.pageChirho === TARGET_PAGE_CHIRHO &&
      verdictChirho.lineIndexChirho === TARGET_LINE_CHIRHO &&
      verdictChirho.segmentIndexChirho === 1
  );
  const verdictChirho: VisionVerdictChirho = {
    volumeChirho: TARGET_VOLUME_CHIRHO,
    pageChirho: TARGET_PAGE_CHIRHO,
    lineIndexChirho: TARGET_LINE_CHIRHO,
    segmentIndexChirho: 1,
    garbleTextChirho: "72 >23",
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_CONTINUATION_TEXT_CHIRHO),
    notesChirho:
      "Recovered the Zechariah 9:2 continuation from the printed crop: Pass-C garble \"72 >23\" corresponds to תִּגְבׇּל־בָּ֑הּ. Stored as vision-chirho; exact vowel/accent confirmation remains in the expert pack.",
  };
  if (existingIndexChirho === -1) {
    verdictsChirho.push(verdictChirho);
  } else {
    verdictsChirho[existingIndexChirho] = verdictChirho;
  }
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return existingIndexChirho === -1 ? 1 : 0;
}

function reconcileMetadataChirho(appliedAtChirho: string): {
  migratedDbRowsChirho: number;
  migratedBackupRowsChirho: number;
  insertedVisionBackupRowsChirho: number;
  dbRowsAtNewSegmentChirho: number;
} {
  const dbChirho = new Database(PROGRESS_DB_PATH_CHIRHO);
  let migratedDbRowsChirho = 0;
  let dbRowsAtNewSegmentChirho = 0;
  try {
    dbChirho.transaction(() => {
      migratedDbRowsChirho = migrateHumanValidationRowsChirho(dbChirho);
      dbRowsAtNewSegmentChirho = countHumanValidationRowsAtSegmentChirho(dbChirho, NEW_REVIEW_SEGMENT_CHIRHO);
    })();
  } finally {
    dbChirho.close();
  }

  const migratedBackupRowsChirho = migrateHumanValidationBackupChirho(appliedAtChirho);
  const insertedVisionBackupRowsChirho = upsertVisionVerdictBackupChirho(appliedAtChirho);
  return {
    migratedDbRowsChirho,
    migratedBackupRowsChirho,
    insertedVisionBackupRowsChirho,
    dbRowsAtNewSegmentChirho,
  };
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  spansChirho: SpanChirho[]
): RepairReportChirho {
  return {
    modeChirho,
    statusChirho,
    messagesChirho,
    linePathChirho: LINE_PATH_CHIRHO,
    plannedSpansChirho: spanSummaryChirho(spansChirho),
  };
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const applyChirho = argsChirho.includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const modeChirho = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const lineChirho = loadJsonChirho<SpanLineChirho>(LINE_PATH_CHIRHO);
  assertTargetLineChirho(lineChirho);
  validateTilingChirho(sortSpansChirho(lineChirho.spansChirho));
  const stateChirho = currentStateChirho(lineChirho);

  if (stateChirho === "already-applied-chirho") {
    if (applyChirho) {
      const reconciledChirho = reconcileMetadataChirho(appliedAtChirho);
      console.log(
        JSON.stringify(
          reportChirho(
            modeChirho,
            "applied-chirho",
            [
              "line already carries the recovered Zechariah continuation; reconciled metadata/backups idempotently",
              `migrated ${reconciledChirho.migratedDbRowsChirho} DB validation row(s) from segment 1 to 2`,
              `DB validation row(s) now keyed to segment 2: ${reconciledChirho.dbRowsAtNewSegmentChirho}`,
              `migrated ${reconciledChirho.migratedBackupRowsChirho} human-validation backup row(s)`,
              `inserted ${reconciledChirho.insertedVisionBackupRowsChirho} vision backup verdict row(s)`,
            ],
            sortSpansChirho(lineChirho.spansChirho)
          ),
          null,
          2
        )
      );
      return;
    }
    const alreadyReportChirho = reportChirho(
      modeChirho,
      "already-applied-chirho",
      ["line already carries the recovered Zechariah continuation and migrated segment order"],
      sortSpansChirho(lineChirho.spansChirho)
    );
    console.log(JSON.stringify(alreadyReportChirho, null, 2));
    return;
  }

  if (stateChirho !== "pre-repair-chirho") {
    const blockedReportChirho = reportChirho(
      modeChirho,
      "blocked-chirho",
      ["line is not in the expected pre-repair state; refusing to guess around current edits"],
      sortSpansChirho(lineChirho.spansChirho)
    );
    console.log(JSON.stringify(blockedReportChirho, null, 2));
    process.exitCode = 1;
    return;
  }

  const reviewedSpanChirho = sortSpansChirho(lineChirho.spansChirho)[1]!;
  if (!s1CorrectionResolvedChirho(reviewedSpanChirho)) {
    const plannedChirho = plannedLineChirho(lineChirho, appliedAtChirho);
    const blockedReportChirho = reportChirho(
      modeChirho,
      "blocked-chirho",
      [
        "segment 1 must first be corrected/certified in place via apply-human-suggested-corrections-chirho --apply --certify-human --reviewer-chirho=<explicit-human-reviewer-id-chirho> --validation-id-chirho=3 --suggested-text-chirho='וְגַם־חֲמָ֖ת'",
        `current segment 1 text/status: ${JSON.stringify({
          textChirho: reviewedSpanChirho.utf8TextChirho,
          humanReviewStatusChirho: reviewedSpanChirho.humanReviewStatusChirho ?? null,
          humanCorrectionStatusChirho: reviewedSpanChirho.humanCorrectionStatusChirho ?? null,
          provenanceChirho: reviewedSpanChirho.provenanceChirho ?? null,
          humanValidationIdChirho: reviewedSpanChirho.humanValidationIdChirho ?? null,
        })}`,
      ],
      sortSpansChirho(plannedChirho.spansChirho)
    );
    console.log(JSON.stringify(blockedReportChirho, null, 2));
    process.exitCode = applyChirho ? 1 : 0;
    return;
  }

  const plannedChirho = plannedLineChirho(lineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          "planned-chirho",
          [
            "ready to recover the Zechariah 9:2 continuation and migrate human-validation segment keys",
            "run with --apply to write the span file, migrate DB rows 1/3 from segment 1 to 2, and refresh durable backups",
          ],
          sortSpansChirho(plannedChirho.spansChirho)
        ),
        null,
        2
      )
    );
    return;
  }

  writeJsonChirho(LINE_PATH_CHIRHO, plannedChirho);
  const reconciledChirho = reconcileMetadataChirho(appliedAtChirho);

  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [
          `migrated ${reconciledChirho.migratedDbRowsChirho} DB validation row(s) from segment 1 to 2`,
          `DB validation row(s) now keyed to segment 2: ${reconciledChirho.dbRowsAtNewSegmentChirho}`,
          `migrated ${reconciledChirho.migratedBackupRowsChirho} human-validation backup row(s)`,
          `inserted ${reconciledChirho.insertedVisionBackupRowsChirho} vision backup verdict row(s)`,
          "rerun export-markdown-chirho --all --strict, validate-pass-c-hebrew-chirho --all, make-pass-c-hebrew-human-pack-chirho, and make-expert-confirm-pack-chirho after this repair",
        ],
        sortSpansChirho(plannedChirho.spansChirho)
      ),
      null,
      2
    )
  );
}

if (import.meta.main) mainChirho();
