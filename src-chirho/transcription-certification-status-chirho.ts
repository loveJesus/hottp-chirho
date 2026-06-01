// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Report the difference between a structurally clean export and a fully
 * certified transcription.
 *
 * Default mode writes a status report and exits 0. Use --strict to make this a
 * gate: exit 1 until no raw Pass-C Hebrew spans and no vision-tier non-Latin
 * spans remain uncertified.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  countByScriptChirho,
  hashTextChirho,
  latinSymbolVisionLiveSnapshotChirho,
  type LatinSymbolVisionLiveItemChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import { scanNonNfcSpanTextFieldsChirho } from "./span-nfc-chirho.ts";

const MODULE_CHIRHO = "transcription-certification-status-chirho";
const EXPORT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "markdown-chirho",
  "export-report-chirho.json"
);
const RAW_HEBREW_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho",
  "pass-c-hebrew-validation-chirho.json"
);
const EXPERT_PACK_MANIFEST_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho",
  "manifest-chirho.json"
);
const LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "latin-symbol-vision-pack-chirho",
  "2026-05-31-chirho",
  "manifest-chirho.json"
);
const LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "latin-symbol-vision-reviews-backup-2026-05-31-chirho.json"
);
const OUT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "certification-status-chirho");

interface ExportReportChirho {
  generatedAtChirho?: string;
  strictPassedChirho?: boolean;
  issueCountChirho?: number;
  unknownSpanCountChirho?: number;
  nonNfcSpanCountChirho?: number;
  hebrewSpanCountChirho?: number;
  passCOcrHebrewSpanCountChirho?: number;
  crnnValidatedHebrewSpanCountChirho?: number;
  d1PagesWithoutSpansChirho?: unknown[];
}

interface RawHebrewSpanChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  validationStatusChirho: string;
  textChirho: string;
}

interface RawHebrewReportChirho {
  generatedAtChirho?: string;
  sourceFilterChirho?: string;
  sourceCountsChirho?: Record<string, number>;
  spanCountChirho?: number;
  tokenCountChirho?: number;
  allTokenValidatedSpanCountChirho?: number;
  partialTokenValidatedSpanCountChirho?: number;
  unvalidatedSpanCountChirho?: number;
  validatedTokenCountChirho?: number;
  spansChirho?: RawHebrewSpanChirho[];
}

interface ExpertPackManifestChirho {
  generatedAtChirho?: string;
  priorityItemsChirho?: unknown[];
  completeVisionCountsChirho?: Record<string, number>;
  completeVisionItemsChirho?: unknown[];
}

interface LatinSymbolPackItemChirho {
  idChirho: string;
  textChirho: string;
}

interface LatinSymbolPackManifestChirho {
  generatedAtChirho?: string;
  explicitSpanCountChirho?: number;
  d1DerivedWordCountChirho?: number;
  countsChirho?: Record<string, number>;
  itemsChirho?: LatinSymbolPackItemChirho[];
}

interface HumanValidationDbRowChirho {
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  verdict_chirho: string;
  applied_at_chirho: string | null;
  schema_version_chirho: number;
}

interface LatinSymbolReviewBackupReviewChirho {
  itemIdChirho?: string;
  currentTextHashChirho?: string;
  verdictChirho?: string;
  appliedAtChirho?: string | null;
  schemaVersionChirho?: number;
  updatedAtChirho?: string;
}

interface LatinSymbolReviewBackupChirho {
  schemaVersionChirho?: number;
  reviewsChirho?: LatinSymbolReviewBackupReviewChirho[];
}

interface LatinSymbolReviewRowChirho {
  itemIdChirho: string;
  currentTextHashChirho: string;
  verdictChirho: string;
  appliedAtChirho: string | null;
  schemaVersionChirho: number;
  updatedAtChirho: string;
  rowSourceChirho: "db-chirho" | "backup-chirho";
}

interface HumanValidationSummaryChirho {
  currentSchema2RowsChirho: number;
  reviewedCleanRowsChirho: number;
  reviewedIssueRowsChirho: number;
  appliedRowsChirho: number;
  rawQueueCurrentRowsChirho: number;
  rawQueueCleanRowsChirho: number;
  rawQueueIssueRowsChirho: number;
  rawQueueAppliedRowsChirho: number;
  legacyCurrentRowsChirho: number;
}

interface LatinSymbolReviewSummaryChirho {
  currentRowsChirho: number;
  validReviewedCleanRowsChirho: number;
  validReviewedIssueRowsChirho: number;
  staleRowsChirho: number;
  appliedRowsChirho: number;
}

interface LatinSymbolReviewBackupSummaryChirho {
  backupRowsChirho: number;
  dbRowsChirho: number;
  localRowsMissingFromBackupChirho: number;
}

interface CertificationStatusChirho {
  generatedAtChirho: string;
  artifactsChirho: {
    exportReportExistsChirho: boolean;
    rawHebrewReportExistsChirho: boolean;
    expertPackManifestExistsChirho: boolean;
    latinSymbolPackManifestExistsChirho: boolean;
    latinSymbolReviewBackupExistsChirho: boolean;
    exportReportShapeOkChirho: boolean;
    rawHebrewReportShapeOkChirho: boolean;
    expertPackManifestShapeOkChirho: boolean;
    latinSymbolPackManifestShapeOkChirho: boolean;
    latinSymbolReviewBackupShapeOkChirho: boolean;
  };
  structuralChirho: {
    exportGeneratedAtChirho: string | null;
    strictPassedChirho: boolean;
    issueCountChirho: number;
    unknownSpanCountChirho: number;
    nonNfcSpanCountChirho: number;
    d1GapPageCountChirho: number;
    hebrewSpanCountChirho: number;
    passCOcrHebrewSpanCountChirho: number;
    crnnValidatedHebrewSpanCountChirho: number;
  };
  rawHebrewChirho: {
    reportGeneratedAtChirho: string | null;
    sourceFilterChirho: string | null;
    reportSpanCountChirho: number;
    reportTokenCountChirho: number;
    unvalidatedSpanCountChirho: number;
    partialValidatedSpanCountChirho: number;
    allTokenValidatedSpanCountChirho: number;
    validatedTokenCountChirho: number;
    sourceCountsChirho: Record<string, number>;
    exportPassCOcrMatchesReportChirho: boolean;
  };
  visionTierChirho: {
    manifestGeneratedAtChirho: string | null;
    priorityItemCountChirho: number;
    completeVisionItemCountChirho: number;
    completeVisionCountsChirho: Record<string, number>;
  };
  latinSymbolVisionChirho: {
    d1ReadErrorChirho: string | null;
    explicitVisionItemCountChirho: number;
    explicitVisionCountsChirho: Record<string, number>;
    d1DerivedVisionWordCountChirho: number;
    d1DerivedVisionCountsChirho: Record<string, number>;
    reviewPacketItemCountChirho: number;
    reviewPacketCountMatchesCurrentChirho: boolean;
    reviewPacketIdsMatchCurrentChirho: boolean;
    reviewPacketTextMatchesCurrentChirho: boolean;
    reviewedCleanCountChirho: number;
    reviewedIssueCountChirho: number;
    staleReviewCountChirho: number;
    remainingDecisionCountChirho: number;
    includedInCompletionGateChirho: boolean;
  };
  normalizationChirho: {
    liveNonNfcSpanTextFieldCountChirho: number;
    liveNonNfcSpanFileCountChirho: number;
  };
  humanValidationDbChirho: HumanValidationSummaryChirho;
  latinSymbolReviewDbChirho: LatinSymbolReviewSummaryChirho;
  latinSymbolReviewBackupChirho: LatinSymbolReviewBackupSummaryChirho;
  certificationCompleteChirho: boolean;
  remainingWorkChirho: string[];
}

function readJsonFileChirho<TChirho>(pathChirho: string, fallbackChirho: TChirho): TChirho {
  if (!existsSync(pathChirho)) return fallbackChirho;
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function spanKeyChirho(spanChirho: Pick<RawHebrewSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return [
    spanChirho.volumeChirho,
    spanChirho.pageChirho,
    spanChirho.lineIndexChirho,
    spanChirho.segmentIndexChirho,
  ].join(":");
}

function rowKeyChirho(rowChirho: Pick<HumanValidationDbRowChirho, "volume_chirho" | "page_chirho" | "line_index_chirho" | "segment_index_chirho">): string {
  return [
    rowChirho.volume_chirho,
    rowChirho.page_chirho,
    rowChirho.line_index_chirho,
    rowChirho.segment_index_chirho,
  ].join(":");
}

function tableExistsChirho(dbChirho: Database, tableNameChirho: string): boolean {
  const rowChirho = dbChirho
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableNameChirho) as { name: string } | undefined;
  return rowChirho !== undefined;
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): string[] {
  if (!tableExistsChirho(dbChirho, tableNameChirho)) return [];
  return (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
    (rowChirho) => rowChirho.name
  );
}

function validationRowsChirho(dbPathChirho: string): HumanValidationDbRowChirho[] {
  if (!existsSync(dbPathChirho)) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const columnsChirho = new Set(tableColumnsChirho(dbChirho, "pass_c_human_validations_chirho"));
    if (columnsChirho.size === 0) return [];
    const hasSchemaVersionChirho = columnsChirho.has("schema_version_chirho");
    const hasAppliedAtChirho = columnsChirho.has("applied_at_chirho");
    return dbChirho
      .query(`
        SELECT volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
               verdict_chirho,
               ${hasAppliedAtChirho ? "applied_at_chirho" : "NULL AS applied_at_chirho"},
               ${hasSchemaVersionChirho ? "schema_version_chirho" : "1 AS schema_version_chirho"}
          FROM pass_c_human_validations_chirho
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'
         ORDER BY volume_chirho, page_chirho, line_index_chirho, segment_index_chirho`)
      .all() as HumanValidationDbRowChirho[];
  } finally {
    dbChirho.close();
  }
}

function latinSymbolReviewRowsChirho(dbPathChirho: string): LatinSymbolReviewRowChirho[] {
  if (!existsSync(dbPathChirho)) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const columnsChirho = new Set(tableColumnsChirho(dbChirho, "latin_symbol_vision_reviews_chirho"));
    if (columnsChirho.size === 0) return [];
    const hasAppliedAtChirho = columnsChirho.has("applied_at_chirho");
    const hasSchemaVersionChirho = columnsChirho.has("schema_version_chirho");
    const rowsChirho = dbChirho
      .query(`
        SELECT item_id_chirho, current_text_hash_chirho, verdict_chirho, updated_at_chirho,
               ${hasAppliedAtChirho ? "applied_at_chirho" : "NULL AS applied_at_chirho"},
               ${hasSchemaVersionChirho ? "schema_version_chirho" : "1 AS schema_version_chirho"}
          FROM latin_symbol_vision_reviews_chirho
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'
         ORDER BY item_id_chirho`)
      .all() as Array<{
        item_id_chirho: string;
        current_text_hash_chirho: string;
        verdict_chirho: string;
        updated_at_chirho: string;
        applied_at_chirho: string | null;
        schema_version_chirho: number;
      }>;
    return rowsChirho.map((rowChirho) => ({
      itemIdChirho: rowChirho.item_id_chirho,
      currentTextHashChirho: rowChirho.current_text_hash_chirho,
      verdictChirho: rowChirho.verdict_chirho,
      appliedAtChirho: rowChirho.applied_at_chirho,
      schemaVersionChirho: rowChirho.schema_version_chirho,
      updatedAtChirho: rowChirho.updated_at_chirho,
      rowSourceChirho: "db-chirho",
    }));
  } finally {
    dbChirho.close();
  }
}

function latinSymbolReviewBackupRowsChirho(
  backupChirho: LatinSymbolReviewBackupChirho,
  shapeOkChirho: boolean
): LatinSymbolReviewRowChirho[] {
  if (!shapeOkChirho) return [];
  return (backupChirho.reviewsChirho ?? [])
    .filter(
      (rowChirho) =>
        typeof rowChirho.itemIdChirho === "string" &&
        typeof rowChirho.currentTextHashChirho === "string" &&
        typeof rowChirho.verdictChirho === "string" &&
        typeof rowChirho.updatedAtChirho === "string"
    )
    .map((rowChirho) => ({
      itemIdChirho: rowChirho.itemIdChirho!,
      currentTextHashChirho: rowChirho.currentTextHashChirho!,
      verdictChirho: rowChirho.verdictChirho!,
      appliedAtChirho: rowChirho.appliedAtChirho ?? null,
      schemaVersionChirho: rowChirho.schemaVersionChirho ?? 1,
      updatedAtChirho: rowChirho.updatedAtChirho!,
      rowSourceChirho: "backup-chirho",
    }));
}

function reviewDurabilityKeyChirho(rowChirho: LatinSymbolReviewRowChirho): string {
  return [
    rowChirho.itemIdChirho,
    rowChirho.currentTextHashChirho,
    rowChirho.verdictChirho,
    rowChirho.updatedAtChirho,
  ].join("\u0000");
}

function mergeReviewRowsChirho(rowsChirho: LatinSymbolReviewRowChirho[]): LatinSymbolReviewRowChirho[] {
  const rowsByItemChirho = new Map<string, LatinSymbolReviewRowChirho>();
  for (const rowChirho of rowsChirho) {
    const existingChirho = rowsByItemChirho.get(rowChirho.itemIdChirho);
    if (
      existingChirho === undefined ||
      rowChirho.updatedAtChirho > existingChirho.updatedAtChirho ||
      (rowChirho.updatedAtChirho === existingChirho.updatedAtChirho && rowChirho.rowSourceChirho === "db-chirho")
    ) {
      rowsByItemChirho.set(rowChirho.itemIdChirho, rowChirho);
    }
  }
  return [...rowsByItemChirho.values()].sort((aChirho, bChirho) => aChirho.itemIdChirho.localeCompare(bChirho.itemIdChirho));
}

function countLocalRowsMissingFromBackupChirho(
  dbRowsChirho: LatinSymbolReviewRowChirho[],
  backupRowsChirho: LatinSymbolReviewRowChirho[]
): number {
  const backupKeysChirho = new Set(backupRowsChirho.map(reviewDurabilityKeyChirho));
  return dbRowsChirho.filter((rowChirho) => !backupKeysChirho.has(reviewDurabilityKeyChirho(rowChirho))).length;
}

function summarizeHumanValidationsChirho(
  rowsChirho: HumanValidationDbRowChirho[],
  rawSpansChirho: RawHebrewSpanChirho[]
): HumanValidationSummaryChirho {
  const rawKeysChirho = new Set(rawSpansChirho.map(spanKeyChirho));
  const schema2RowsChirho = rowsChirho.filter((rowChirho) => rowChirho.schema_version_chirho >= 2);
  const rawRowsChirho = schema2RowsChirho.filter((rowChirho) => rawKeysChirho.has(rowKeyChirho(rowChirho)));
  return {
    currentSchema2RowsChirho: schema2RowsChirho.length,
    reviewedCleanRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-clean-chirho").length,
    reviewedIssueRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-issues-chirho").length,
    appliedRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.applied_at_chirho !== null).length,
    rawQueueCurrentRowsChirho: rawRowsChirho.length,
    rawQueueCleanRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-clean-chirho").length,
    rawQueueIssueRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-issues-chirho").length,
    rawQueueAppliedRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.applied_at_chirho !== null).length,
    legacyCurrentRowsChirho: rowsChirho.filter((rowChirho) => rowChirho.schema_version_chirho < 2).length,
  };
}

function sumCountsChirho(countsChirho: Record<string, number>): number {
  return Object.values(countsChirho).reduce((sumChirho, countChirho) => sumChirho + countChirho, 0);
}

function summarizeLatinSymbolReviewsChirho(
  rowsChirho: LatinSymbolReviewRowChirho[],
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): LatinSymbolReviewSummaryChirho {
  const hashByIdChirho = new Map(liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, hashTextChirho(itemChirho.textChirho)]));
  const schemaRowsChirho = rowsChirho.filter((rowChirho) => rowChirho.schemaVersionChirho >= 1);
  let validReviewedCleanRowsChirho = 0;
  let validReviewedIssueRowsChirho = 0;
  let staleRowsChirho = 0;
  let appliedRowsChirho = 0;
  for (const rowChirho of schemaRowsChirho) {
    const currentHashChirho = hashByIdChirho.get(rowChirho.itemIdChirho);
    const currentAndFreshChirho =
      currentHashChirho !== undefined && currentHashChirho === rowChirho.currentTextHashChirho;
    if (!currentAndFreshChirho) {
      staleRowsChirho += 1;
      continue;
    }
    if (rowChirho.verdictChirho === "accepted-clean-chirho") validReviewedCleanRowsChirho += 1;
    if (rowChirho.verdictChirho === "reviewed-issues-chirho") validReviewedIssueRowsChirho += 1;
    if (rowChirho.appliedAtChirho !== null) appliedRowsChirho += 1;
  }
  return {
    currentRowsChirho: schemaRowsChirho.length,
    validReviewedCleanRowsChirho,
    validReviewedIssueRowsChirho,
    staleRowsChirho,
    appliedRowsChirho,
  };
}

function buildStatusChirho(dbPathChirho: string): CertificationStatusChirho {
  const exportReportExistsChirho = existsSync(EXPORT_REPORT_PATH_CHIRHO);
  const rawHebrewReportExistsChirho = existsSync(RAW_HEBREW_REPORT_PATH_CHIRHO);
  const expertPackManifestExistsChirho = existsSync(EXPERT_PACK_MANIFEST_PATH_CHIRHO);
  const latinSymbolPackManifestExistsChirho = existsSync(LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO);
  const latinSymbolReviewBackupExistsChirho = existsSync(LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO);
  const exportReportChirho = readJsonFileChirho<ExportReportChirho>(EXPORT_REPORT_PATH_CHIRHO, {});
  const rawReportChirho = readJsonFileChirho<RawHebrewReportChirho>(RAW_HEBREW_REPORT_PATH_CHIRHO, {});
  const expertManifestChirho = readJsonFileChirho<ExpertPackManifestChirho>(EXPERT_PACK_MANIFEST_PATH_CHIRHO, {});
  const latinSymbolManifestChirho = readJsonFileChirho<LatinSymbolPackManifestChirho>(
    LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO,
    {}
  );
  const latinSymbolReviewBackupFileChirho = readJsonFileChirho<LatinSymbolReviewBackupChirho>(
    LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO,
    {}
  );
  const nonNfcSpanTextFieldsChirho = scanNonNfcSpanTextFieldsChirho();
  const nonNfcSpanFilesChirho = new Set(
    nonNfcSpanTextFieldsChirho.map((findingChirho) => findingChirho.relativePathChirho)
  );
  const exportReportShapeOkChirho =
    !exportReportExistsChirho ||
    (typeof exportReportChirho.strictPassedChirho === "boolean" &&
      typeof exportReportChirho.issueCountChirho === "number");
  const rawHebrewReportShapeOkChirho =
    !rawHebrewReportExistsChirho ||
    (Array.isArray(rawReportChirho.spansChirho) &&
      typeof rawReportChirho.sourceFilterChirho === "string");
  const expertPackManifestShapeOkChirho =
    !expertPackManifestExistsChirho ||
    (Array.isArray(expertManifestChirho.completeVisionItemsChirho) &&
      Array.isArray(expertManifestChirho.priorityItemsChirho));
  const latinSymbolPackManifestShapeOkChirho =
    !latinSymbolPackManifestExistsChirho ||
    (Array.isArray(latinSymbolManifestChirho.itemsChirho) &&
      typeof latinSymbolManifestChirho.explicitSpanCountChirho === "number" &&
      typeof latinSymbolManifestChirho.d1DerivedWordCountChirho === "number");
  const latinSymbolReviewBackupShapeOkChirho =
    !latinSymbolReviewBackupExistsChirho ||
    (latinSymbolReviewBackupFileChirho.schemaVersionChirho === 1 &&
      Array.isArray(latinSymbolReviewBackupFileChirho.reviewsChirho));
  const rawSpansChirho = rawReportChirho.spansChirho ?? [];
  const humanSummaryChirho = summarizeHumanValidationsChirho(validationRowsChirho(dbPathChirho), rawSpansChirho);
  const structuralChirho = {
    exportGeneratedAtChirho: exportReportChirho.generatedAtChirho ?? null,
    strictPassedChirho: exportReportChirho.strictPassedChirho === true,
    issueCountChirho: exportReportChirho.issueCountChirho ?? 0,
    unknownSpanCountChirho: exportReportChirho.unknownSpanCountChirho ?? 0,
    nonNfcSpanCountChirho: exportReportChirho.nonNfcSpanCountChirho ?? 0,
    d1GapPageCountChirho: exportReportChirho.d1PagesWithoutSpansChirho?.length ?? 0,
    hebrewSpanCountChirho: exportReportChirho.hebrewSpanCountChirho ?? 0,
    passCOcrHebrewSpanCountChirho: exportReportChirho.passCOcrHebrewSpanCountChirho ?? 0,
    crnnValidatedHebrewSpanCountChirho: exportReportChirho.crnnValidatedHebrewSpanCountChirho ?? 0,
  };
  const rawHebrewChirho = {
    reportGeneratedAtChirho: rawReportChirho.generatedAtChirho ?? null,
    sourceFilterChirho: rawReportChirho.sourceFilterChirho ?? null,
    reportSpanCountChirho: rawReportChirho.spanCountChirho ?? rawSpansChirho.length,
    reportTokenCountChirho: rawReportChirho.tokenCountChirho ?? 0,
    unvalidatedSpanCountChirho: rawReportChirho.unvalidatedSpanCountChirho ?? 0,
    partialValidatedSpanCountChirho: rawReportChirho.partialTokenValidatedSpanCountChirho ?? 0,
    allTokenValidatedSpanCountChirho: rawReportChirho.allTokenValidatedSpanCountChirho ?? 0,
    validatedTokenCountChirho: rawReportChirho.validatedTokenCountChirho ?? 0,
    sourceCountsChirho: rawReportChirho.sourceCountsChirho ?? {},
    exportPassCOcrMatchesReportChirho:
      structuralChirho.passCOcrHebrewSpanCountChirho === (rawReportChirho.spanCountChirho ?? rawSpansChirho.length),
  };
  const visionTierChirho = {
    manifestGeneratedAtChirho: expertManifestChirho.generatedAtChirho ?? null,
    priorityItemCountChirho: expertManifestChirho.priorityItemsChirho?.length ?? 0,
    completeVisionItemCountChirho: expertManifestChirho.completeVisionItemsChirho?.length ?? 0,
    completeVisionCountsChirho: expertManifestChirho.completeVisionCountsChirho ?? {},
  };
  const latinSymbolLiveSnapshotChirho = latinSymbolVisionLiveSnapshotChirho();
  const latinSymbolLiveItemsChirho = latinSymbolLiveSnapshotChirho.itemsChirho;
  const latinSymbolD1ReadErrorChirho = latinSymbolLiveSnapshotChirho.d1ReadErrorChirho;
  const explicitLatinSymbolLiveItemsChirho = latinSymbolLiveItemsChirho.filter(
    (itemChirho) => itemChirho.itemKindChirho === "span-chirho"
  );
  const d1DerivedLatinSymbolLiveItemsChirho = latinSymbolLiveItemsChirho.filter(
    (itemChirho) => itemChirho.itemKindChirho === "d1-word-chirho"
  );
  const latinSymbolVisionCountsResultChirho = countByScriptChirho(explicitLatinSymbolLiveItemsChirho);
  const d1DerivedLatinSymbolVisionCountsResultChirho = countByScriptChirho(d1DerivedLatinSymbolLiveItemsChirho);
  const currentLatinSymbolDecisionCountChirho =
    sumCountsChirho(latinSymbolVisionCountsResultChirho) + sumCountsChirho(d1DerivedLatinSymbolVisionCountsResultChirho);
  const latinSymbolPacketItemsChirho = latinSymbolPackManifestShapeOkChirho
    ? latinSymbolManifestChirho.itemsChirho ?? []
    : [];
  const latinSymbolDbRowsChirho = latinSymbolReviewRowsChirho(dbPathChirho);
  const latinSymbolBackupRowsChirho = latinSymbolReviewBackupRowsChirho(
    latinSymbolReviewBackupFileChirho,
    latinSymbolReviewBackupShapeOkChirho
  );
  const latinSymbolMergedRowsChirho = mergeReviewRowsChirho([...latinSymbolBackupRowsChirho, ...latinSymbolDbRowsChirho]);
  const latinSymbolLocalRowsMissingFromBackupChirho = countLocalRowsMissingFromBackupChirho(
    latinSymbolDbRowsChirho,
    latinSymbolBackupRowsChirho
  );
  const latinSymbolReviewSummaryChirho = summarizeLatinSymbolReviewsChirho(latinSymbolMergedRowsChirho, latinSymbolLiveItemsChirho);
  const latinSymbolReviewBackupSummaryChirho = {
    backupRowsChirho: latinSymbolBackupRowsChirho.length,
    dbRowsChirho: latinSymbolDbRowsChirho.length,
    localRowsMissingFromBackupChirho: latinSymbolLocalRowsMissingFromBackupChirho,
  };
  const latinSymbolLiveItemsByIdChirho = new Map(
    latinSymbolLiveItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho])
  );
  const latinSymbolPacketItemIdsChirho = new Set(latinSymbolPacketItemsChirho.map((itemChirho) => itemChirho.idChirho));
  const latinSymbolReviewPacketCountMatchesCurrentChirho =
    latinSymbolPacketItemsChirho.length === currentLatinSymbolDecisionCountChirho;
  const latinSymbolReviewPacketIdsMatchCurrentChirho =
    latinSymbolReviewPacketCountMatchesCurrentChirho &&
    latinSymbolPacketItemsChirho.every((itemChirho) => latinSymbolLiveItemsByIdChirho.has(itemChirho.idChirho)) &&
    latinSymbolLiveItemsChirho.every((itemChirho) => latinSymbolPacketItemIdsChirho.has(itemChirho.idChirho));
  const latinSymbolReviewPacketTextMatchesCurrentChirho =
    latinSymbolReviewPacketIdsMatchCurrentChirho &&
    latinSymbolPacketItemsChirho.every((itemChirho) => {
      const liveItemChirho = latinSymbolLiveItemsByIdChirho.get(itemChirho.idChirho);
      return liveItemChirho !== undefined && liveItemChirho.textChirho === itemChirho.textChirho;
    });
  const latinSymbolRemainingDecisionCountChirho =
    latinSymbolD1ReadErrorChirho !== null
      ? Math.max(currentLatinSymbolDecisionCountChirho, latinSymbolPacketItemsChirho.length)
      : latinSymbolReviewPacketTextMatchesCurrentChirho
      ? Math.max(0, currentLatinSymbolDecisionCountChirho - latinSymbolReviewSummaryChirho.validReviewedCleanRowsChirho)
      : currentLatinSymbolDecisionCountChirho;
  const latinSymbolVisionChirho = {
    d1ReadErrorChirho: latinSymbolD1ReadErrorChirho,
    explicitVisionItemCountChirho: sumCountsChirho(latinSymbolVisionCountsResultChirho),
    explicitVisionCountsChirho: latinSymbolVisionCountsResultChirho,
    d1DerivedVisionWordCountChirho: sumCountsChirho(d1DerivedLatinSymbolVisionCountsResultChirho),
    d1DerivedVisionCountsChirho: d1DerivedLatinSymbolVisionCountsResultChirho,
    reviewPacketItemCountChirho: latinSymbolPacketItemsChirho.length,
    reviewPacketCountMatchesCurrentChirho: latinSymbolReviewPacketCountMatchesCurrentChirho,
    reviewPacketIdsMatchCurrentChirho: latinSymbolReviewPacketIdsMatchCurrentChirho,
    reviewPacketTextMatchesCurrentChirho: latinSymbolReviewPacketTextMatchesCurrentChirho,
    reviewedCleanCountChirho: latinSymbolReviewSummaryChirho.validReviewedCleanRowsChirho,
    reviewedIssueCountChirho: latinSymbolReviewSummaryChirho.validReviewedIssueRowsChirho,
    staleReviewCountChirho: latinSymbolReviewSummaryChirho.staleRowsChirho,
    remainingDecisionCountChirho: latinSymbolRemainingDecisionCountChirho,
    includedInCompletionGateChirho: true,
  };
  const normalizationChirho = {
    liveNonNfcSpanTextFieldCountChirho: nonNfcSpanTextFieldsChirho.length,
    liveNonNfcSpanFileCountChirho: nonNfcSpanFilesChirho.size,
  };
  const remainingWorkChirho: string[] = [];
  if (!exportReportExistsChirho) {
    remainingWorkChirho.push("strict export report is missing; run export-markdown-chirho --all --strict");
  }
  if (!rawHebrewReportExistsChirho) {
    remainingWorkChirho.push("raw Hebrew validation report is missing; run validate-pass-c-hebrew-chirho --all");
  }
  if (!expertPackManifestExistsChirho) {
    remainingWorkChirho.push("expert confirmation manifest is missing; run make-expert-confirm-pack-chirho");
  }
  if (currentLatinSymbolDecisionCountChirho !== 0 && !latinSymbolPackManifestExistsChirho) {
    remainingWorkChirho.push("Latin/symbol vision review packet is missing; run make-latin-symbol-vision-pack-chirho");
  }
  if (latinSymbolD1ReadErrorChirho !== null) {
    remainingWorkChirho.push(`D1-derived Latin/symbol vision word scan failed: ${latinSymbolD1ReadErrorChirho}`);
  }
  if (exportReportExistsChirho && !exportReportShapeOkChirho) {
    remainingWorkChirho.push("strict export report is malformed; regenerate export-markdown-chirho --all --strict");
  }
  if (rawHebrewReportExistsChirho && !rawHebrewReportShapeOkChirho) {
    remainingWorkChirho.push("raw Hebrew validation report is malformed; regenerate validate-pass-c-hebrew-chirho --all");
  }
  if (expertPackManifestExistsChirho && !expertPackManifestShapeOkChirho) {
    remainingWorkChirho.push("expert confirmation manifest is malformed; regenerate make-expert-confirm-pack-chirho");
  }
  if (latinSymbolPackManifestExistsChirho && !latinSymbolPackManifestShapeOkChirho) {
    remainingWorkChirho.push("Latin/symbol vision review packet is malformed; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (latinSymbolReviewBackupExistsChirho && !latinSymbolReviewBackupShapeOkChirho) {
    remainingWorkChirho.push("Latin/symbol review backup is malformed; regenerate record-latin-symbol-vision-review-chirho --export-backup");
  }
  if (!structuralChirho.strictPassedChirho || structuralChirho.issueCountChirho !== 0) {
    remainingWorkChirho.push("structural export strict gate is not clean");
  }
  if (structuralChirho.unknownSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.unknownSpanCountChirho} unknown span(s) remain`);
  }
  if (structuralChirho.nonNfcSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.nonNfcSpanCountChirho} non-NFC span(s) remain in the latest export report`);
  }
  if (normalizationChirho.liveNonNfcSpanTextFieldCountChirho !== 0) {
    remainingWorkChirho.push(
      `${normalizationChirho.liveNonNfcSpanTextFieldCountChirho} live span text field(s) are not NFC-normalized`
    );
  }
  if (structuralChirho.d1GapPageCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.d1GapPageCountChirho} D1 page gap(s) remain`);
  }
  if (structuralChirho.passCOcrHebrewSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.passCOcrHebrewSpanCountChirho} raw Pass-C Hebrew span(s) still need human certification`);
  }
  if (visionTierChirho.completeVisionItemCountChirho !== 0) {
    remainingWorkChirho.push(`${visionTierChirho.completeVisionItemCountChirho} vision-tier non-Latin span(s) still need expert/human confirmation`);
  }
  if (
    latinSymbolD1ReadErrorChirho === null &&
    currentLatinSymbolDecisionCountChirho !== 0 &&
    latinSymbolPackManifestExistsChirho &&
    latinSymbolPackManifestShapeOkChirho &&
    !latinSymbolReviewPacketCountMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("Latin/symbol vision review packet count does not match current span/D1 state; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (
    latinSymbolD1ReadErrorChirho === null &&
    currentLatinSymbolDecisionCountChirho !== 0 &&
    latinSymbolPackManifestExistsChirho &&
    latinSymbolPackManifestShapeOkChirho &&
    latinSymbolReviewPacketCountMatchesCurrentChirho &&
    !latinSymbolReviewPacketIdsMatchCurrentChirho
  ) {
    remainingWorkChirho.push("Latin/symbol vision review packet item IDs do not match current span/D1 state; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (
    latinSymbolD1ReadErrorChirho === null &&
    currentLatinSymbolDecisionCountChirho !== 0 &&
    latinSymbolPackManifestExistsChirho &&
    latinSymbolPackManifestShapeOkChirho &&
    latinSymbolReviewPacketIdsMatchCurrentChirho &&
    !latinSymbolReviewPacketTextMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("Latin/symbol vision review packet text does not match current live span/D1 text; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (latinSymbolReviewSummaryChirho.staleRowsChirho !== 0) {
    remainingWorkChirho.push(`${latinSymbolReviewSummaryChirho.staleRowsChirho} Latin/symbol review row(s) are stale against current live span/D1 text`);
  }
  if (latinSymbolLocalRowsMissingFromBackupChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolLocalRowsMissingFromBackupChirho} local Latin/symbol review row(s) need export-backup before certification can complete on a fresh checkout`
    );
  }
  if (latinSymbolRemainingDecisionCountChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolRemainingDecisionCountChirho} Latin/symbol vision-tier span/word decision(s) still need accepted-clean review or explicit acceptance policy`
    );
  }
  if (!rawHebrewChirho.exportPassCOcrMatchesReportChirho) {
    remainingWorkChirho.push("raw Hebrew validation report count does not match the latest export report; regenerate validation artifacts");
  }
  const certificationCompleteChirho = remainingWorkChirho.length === 0;
  return {
    generatedAtChirho: new Date().toISOString(),
    artifactsChirho: {
      exportReportExistsChirho,
      rawHebrewReportExistsChirho,
      expertPackManifestExistsChirho,
      latinSymbolPackManifestExistsChirho,
      latinSymbolReviewBackupExistsChirho,
      exportReportShapeOkChirho,
      rawHebrewReportShapeOkChirho,
      expertPackManifestShapeOkChirho,
      latinSymbolPackManifestShapeOkChirho,
      latinSymbolReviewBackupShapeOkChirho,
    },
    structuralChirho,
    rawHebrewChirho,
    visionTierChirho,
    latinSymbolVisionChirho,
    normalizationChirho,
    humanValidationDbChirho: humanSummaryChirho,
    latinSymbolReviewDbChirho: latinSymbolReviewSummaryChirho,
    latinSymbolReviewBackupChirho: latinSymbolReviewBackupSummaryChirho,
    certificationCompleteChirho,
    remainingWorkChirho,
  };
}

function markdownChirho(statusChirho: CertificationStatusChirho): string {
  const remainingLinesChirho = statusChirho.remainingWorkChirho.length === 0
    ? ["- None."]
    : statusChirho.remainingWorkChirho.map((itemChirho) => `- ${itemChirho}`);
  const visionCountsChirho = Object.entries(statusChirho.visionTierChirho.completeVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const sourceCountsChirho = Object.entries(statusChirho.rawHebrewChirho.sourceCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const latinSymbolCountsChirho = Object.entries(statusChirho.latinSymbolVisionChirho.explicitVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const d1LatinSymbolCountsChirho = Object.entries(statusChirho.latinSymbolVisionChirho.d1DerivedVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  return [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Transcription Certification Status Chirho",
    "",
    `Generated: ${statusChirho.generatedAtChirho}`,
    "",
    `Certification complete: ${statusChirho.certificationCompleteChirho ? "yes" : "no"}`,
    "",
    "## Structural Export",
    "",
    `- Export report exists: ${statusChirho.artifactsChirho.exportReportExistsChirho}`,
    `- Export report shape OK: ${statusChirho.artifactsChirho.exportReportShapeOkChirho}`,
    `- Strict passed: ${statusChirho.structuralChirho.strictPassedChirho}`,
    `- Issues: ${statusChirho.structuralChirho.issueCountChirho}`,
    `- Unknown spans: ${statusChirho.structuralChirho.unknownSpanCountChirho}`,
    `- Non-NFC spans in export report: ${statusChirho.structuralChirho.nonNfcSpanCountChirho}`,
    `- D1 gap pages: ${statusChirho.structuralChirho.d1GapPageCountChirho}`,
    `- Hebrew spans: ${statusChirho.structuralChirho.hebrewSpanCountChirho}`,
    `- Raw Pass-C Hebrew spans: ${statusChirho.structuralChirho.passCOcrHebrewSpanCountChirho}`,
    "",
    "## Unicode Normalization",
    "",
    `- Live non-NFC span text fields: ${statusChirho.normalizationChirho.liveNonNfcSpanTextFieldCountChirho}`,
    `- Live files with non-NFC span text: ${statusChirho.normalizationChirho.liveNonNfcSpanFileCountChirho}`,
    "",
    "## Raw Hebrew Human Queue",
    "",
    `- Raw Hebrew report exists: ${statusChirho.artifactsChirho.rawHebrewReportExistsChirho}`,
    `- Raw Hebrew report shape OK: ${statusChirho.artifactsChirho.rawHebrewReportShapeOkChirho}`,
    `- Report spans: ${statusChirho.rawHebrewChirho.reportSpanCountChirho}`,
    `- Tokens: ${statusChirho.rawHebrewChirho.reportTokenCountChirho}`,
    `- Unvalidated spans: ${statusChirho.rawHebrewChirho.unvalidatedSpanCountChirho}`,
    `- Partial spans: ${statusChirho.rawHebrewChirho.partialValidatedSpanCountChirho}`,
    `- All-token spot checks: ${statusChirho.rawHebrewChirho.allTokenValidatedSpanCountChirho}`,
    `- Source counts before filter: ${sourceCountsChirho || "none"}`,
    `- Export/report count match: ${statusChirho.rawHebrewChirho.exportPassCOcrMatchesReportChirho}`,
    "",
    "## Human Validation DB",
    "",
    `- Current schema-v2 rows: ${statusChirho.humanValidationDbChirho.currentSchema2RowsChirho}`,
    `- Raw queue rows: ${statusChirho.humanValidationDbChirho.rawQueueCurrentRowsChirho}`,
    `- Raw queue clean rows: ${statusChirho.humanValidationDbChirho.rawQueueCleanRowsChirho}`,
    `- Raw queue issue rows: ${statusChirho.humanValidationDbChirho.rawQueueIssueRowsChirho}`,
    `- Raw queue applied rows: ${statusChirho.humanValidationDbChirho.rawQueueAppliedRowsChirho}`,
    `- Legacy current rows ignored by apply/certification: ${statusChirho.humanValidationDbChirho.legacyCurrentRowsChirho}`,
    "",
    "## Vision-Tier Expert Queue",
    "",
    `- Expert manifest exists: ${statusChirho.artifactsChirho.expertPackManifestExistsChirho}`,
    `- Expert manifest shape OK: ${statusChirho.artifactsChirho.expertPackManifestShapeOkChirho}`,
    `- Priority items: ${statusChirho.visionTierChirho.priorityItemCountChirho}`,
    `- Complete vision-tier items: ${statusChirho.visionTierChirho.completeVisionItemCountChirho}`,
    `- Counts: ${visionCountsChirho || "none"}`,
    "",
    "## Latin/Symbol Vision Scope",
    "",
    "These spans are not in the non-Latin expert pack, but they still matter for a project-wide flawless-transcription claim.",
    "",
    `- Included in completion gate: ${statusChirho.latinSymbolVisionChirho.includedInCompletionGateChirho}`,
    `- D1 scan error: ${statusChirho.latinSymbolVisionChirho.d1ReadErrorChirho ?? "none"}`,
    `- Explicit vision-tier Latin/symbol items: ${statusChirho.latinSymbolVisionChirho.explicitVisionItemCountChirho}`,
    `- Counts: ${latinSymbolCountsChirho || "none"}`,
    `- D1-derived Latin/symbol vision words: ${statusChirho.latinSymbolVisionChirho.d1DerivedVisionWordCountChirho}`,
    `- D1-derived counts: ${d1LatinSymbolCountsChirho || "none"}`,
    `- Review packet exists: ${statusChirho.artifactsChirho.latinSymbolPackManifestExistsChirho}`,
    `- Review packet shape OK: ${statusChirho.artifactsChirho.latinSymbolPackManifestShapeOkChirho}`,
    `- Review packet items: ${statusChirho.latinSymbolVisionChirho.reviewPacketItemCountChirho}`,
    `- Review packet count matches current state: ${statusChirho.latinSymbolVisionChirho.reviewPacketCountMatchesCurrentChirho}`,
    `- Review packet IDs match current state: ${statusChirho.latinSymbolVisionChirho.reviewPacketIdsMatchCurrentChirho}`,
    `- Review packet text matches current state: ${statusChirho.latinSymbolVisionChirho.reviewPacketTextMatchesCurrentChirho}`,
    `- Accepted-clean reviews: ${statusChirho.latinSymbolVisionChirho.reviewedCleanCountChirho}`,
    `- Reviewed-issues rows: ${statusChirho.latinSymbolVisionChirho.reviewedIssueCountChirho}`,
    `- Stale review rows: ${statusChirho.latinSymbolVisionChirho.staleReviewCountChirho}`,
    `- Remaining decisions: ${statusChirho.latinSymbolVisionChirho.remainingDecisionCountChirho}`,
    "",
    "## Latin/Symbol Review Store",
    "",
    `- Backup exists: ${statusChirho.artifactsChirho.latinSymbolReviewBackupExistsChirho}`,
    `- Backup shape OK: ${statusChirho.artifactsChirho.latinSymbolReviewBackupShapeOkChirho}`,
    `- Current merged rows: ${statusChirho.latinSymbolReviewDbChirho.currentRowsChirho}`,
    `- Local DB rows: ${statusChirho.latinSymbolReviewBackupChirho.dbRowsChirho}`,
    `- Backup rows: ${statusChirho.latinSymbolReviewBackupChirho.backupRowsChirho}`,
    `- Local rows missing from backup: ${statusChirho.latinSymbolReviewBackupChirho.localRowsMissingFromBackupChirho}`,
    `- Valid accepted-clean rows: ${statusChirho.latinSymbolReviewDbChirho.validReviewedCleanRowsChirho}`,
    `- Valid reviewed-issues rows: ${statusChirho.latinSymbolReviewDbChirho.validReviewedIssueRowsChirho}`,
    `- Stale rows: ${statusChirho.latinSymbolReviewDbChirho.staleRowsChirho}`,
    `- Applied rows: ${statusChirho.latinSymbolReviewDbChirho.appliedRowsChirho}`,
    "",
    "## Remaining Work",
    "",
    ...remainingLinesChirho,
    "",
  ].join("\n");
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const strictChirho = argsChirho.includes("--strict");
  const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? PROGRESS_DB_PATH_CHIRHO;
  const outDirChirho = parseArgValueChirho(argsChirho, "out-dir") ?? OUT_DIR_CHIRHO;
  mkdirSync(outDirChirho, { recursive: true });
  const statusChirho = buildStatusChirho(dbPathChirho);
  writeFileSync(join(outDirChirho, "status-chirho.json"), `${JSON.stringify(statusChirho, null, 2)}\n`);
  writeFileSync(join(outDirChirho, "status-chirho.md"), markdownChirho(statusChirho));
  console.log(
    `[${MODULE_CHIRHO}] complete=${statusChirho.certificationCompleteChirho} ` +
      `strictMode=${strictChirho} ` +
      `strictExport=${statusChirho.structuralChirho.strictPassedChirho} ` +
      `rawHebrew=${statusChirho.structuralChirho.passCOcrHebrewSpanCountChirho} ` +
      `visionTier=${statusChirho.visionTierChirho.completeVisionItemCountChirho} ` +
      `liveNonNfc=${statusChirho.normalizationChirho.liveNonNfcSpanTextFieldCountChirho} ` +
      `report=${join(outDirChirho, "status-chirho.md")}`
  );
  if (strictChirho && !statusChirho.certificationCompleteChirho) process.exitCode = 1;
}

if (import.meta.main) mainChirho();
