// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Durable backup helpers for Pass-C human validation rows.
 *
 * The browser server stores decisions in local SQLite. This committed JSON
 * backup preserves the attributable review trail across fresh checkouts.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

export const PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "pass-c-human-validations-backup-2026-06-01-chirho.json"
);

const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");

export interface PassCHumanValidationBackupReviewChirho {
  dbIdChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  originalTextChirho: string;
  originalTextHashChirho: string;
  verdictChirho: string;
  correctedTextChirho: string | null;
  scriptVerdictChirho: string | null;
  issueFlagsChirho: string[];
  wlcSuggestedTextChirho?: string;
  wlcSuggestionSourceChirho?: string;
  notesChirho: string;
  queueGeneratedAtChirho: string | null;
  reviewerChirho: string;
  createdAtChirho: string;
  updatedAtChirho: string;
  appliedAtChirho: string | null;
  appliedToFileChirho: string | null;
  schemaVersionChirho: number;
}

export interface PassCHumanValidationBackupFileChirho {
  john316Chirho?: string;
  schemaVersionChirho?: number;
  generatedAtChirho?: string;
  sourceChirho?: string;
  reviewCountChirho?: number;
  reviewsChirho?: PassCHumanValidationBackupReviewChirho[];
}

interface PassCHumanValidationDbRowChirho {
  id_chirho: number;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  original_text_chirho: string;
  original_text_hash_chirho: string;
  verdict_chirho: string;
  corrected_text_chirho: string | null;
  script_verdict_chirho: string | null;
  issue_flags_chirho: string | null;
  notes_chirho: string | null;
  queue_generated_at_chirho: string | null;
  reviewer_chirho: string;
  created_at_chirho: string;
  updated_at_chirho: string;
  applied_at_chirho: string | null;
  applied_to_file_chirho: string | null;
  schema_version_chirho: number;
}

interface SpanLineChirho {
  spansChirho?: Array<{
    segmentIndexChirho?: number;
    wlcSuggestedTextChirho?: string;
    wlcSuggestionSourceChirho?: string;
  }>;
}

function tableExistsChirho(dbChirho: Database, tableNameChirho: string): boolean {
  const rowChirho = dbChirho
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableNameChirho) as { name: string } | undefined;
  return rowChirho !== undefined;
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): Set<string> {
  if (!tableExistsChirho(dbChirho, tableNameChirho)) return new Set();
  const rowsChirho = dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>;
  return new Set(rowsChirho.map((rowChirho) => rowChirho.name));
}

function parseIssueFlagsChirho(valueChirho: string | null): string[] {
  if (valueChirho === null || valueChirho.trim().length === 0) return [];
  try {
    const parsedChirho = JSON.parse(valueChirho) as unknown;
    return Array.isArray(parsedChirho)
      ? parsedChirho.filter((flagChirho): flagChirho is string => typeof flagChirho === "string")
      : [];
  } catch {
    return [];
  }
}

function spanLinePathChirho(rowChirho: PassCHumanValidationDbRowChirho): string {
  return join(
    SPANS_DIR_CHIRHO,
    `vol-${rowChirho.volume_chirho}-chirho`,
    `page-${String(rowChirho.page_chirho).padStart(4, "0")}-chirho`,
    `line-${String(rowChirho.line_index_chirho).padStart(3, "0")}-chirho.json`
  );
}

function projectRelativePathChirho(pathChirho: string): string {
  return pathChirho.startsWith(PROJECT_ROOT_CHIRHO)
    ? relative(PROJECT_ROOT_CHIRHO, pathChirho)
    : pathChirho;
}

function spanSuggestionChirho(
  rowChirho: PassCHumanValidationDbRowChirho
): Pick<PassCHumanValidationBackupReviewChirho, "wlcSuggestedTextChirho" | "wlcSuggestionSourceChirho"> {
  const rawPathChirho = rowChirho.applied_to_file_chirho ?? spanLinePathChirho(rowChirho);
  const candidatePathChirho = rawPathChirho.startsWith("/")
    ? rawPathChirho
    : join(PROJECT_ROOT_CHIRHO, rawPathChirho);
  if (!existsSync(candidatePathChirho)) return {};
  try {
    const lineChirho = JSON.parse(readFileSync(candidatePathChirho, "utf8")) as SpanLineChirho;
    const spanChirho = lineChirho.spansChirho?.find(
      (candidateChirho) => candidateChirho.segmentIndexChirho === rowChirho.segment_index_chirho
    );
    return {
      ...(typeof spanChirho?.wlcSuggestedTextChirho === "string"
        ? { wlcSuggestedTextChirho: spanChirho.wlcSuggestedTextChirho }
        : {}),
      ...(typeof spanChirho?.wlcSuggestionSourceChirho === "string"
        ? { wlcSuggestionSourceChirho: spanChirho.wlcSuggestionSourceChirho }
        : {}),
    };
  } catch {
    return {};
  }
}

export function passCHumanValidationBackupRowsFromDbChirho(
  dbChirho: Database
): PassCHumanValidationBackupReviewChirho[] {
  const columnsChirho = tableColumnsChirho(dbChirho, "pass_c_human_validations_chirho");
  if (columnsChirho.size === 0 || !columnsChirho.has("is_current_chirho")) return [];
  const hasIssueFlagsChirho = columnsChirho.has("issue_flags_chirho");
  const hasScriptVerdictChirho = columnsChirho.has("script_verdict_chirho");
  const hasAppliedAtChirho = columnsChirho.has("applied_at_chirho");
  const hasAppliedToFileChirho = columnsChirho.has("applied_to_file_chirho");
  const hasSchemaVersionChirho = columnsChirho.has("schema_version_chirho");
  const rowsChirho = dbChirho.query(`
    SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
           original_text_chirho, original_text_hash_chirho, verdict_chirho, corrected_text_chirho,
           ${hasScriptVerdictChirho ? "script_verdict_chirho" : "NULL AS script_verdict_chirho"},
           ${hasIssueFlagsChirho ? "issue_flags_chirho" : "NULL AS issue_flags_chirho"},
           notes_chirho, queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
           ${hasAppliedAtChirho ? "applied_at_chirho" : "NULL AS applied_at_chirho"},
           ${hasAppliedToFileChirho ? "applied_to_file_chirho" : "NULL AS applied_to_file_chirho"},
           ${hasSchemaVersionChirho ? "schema_version_chirho" : "1 AS schema_version_chirho"}
      FROM pass_c_human_validations_chirho
     WHERE is_current_chirho = 1
       AND verdict_chirho <> 'undo-chirho'
       AND ${hasSchemaVersionChirho ? "schema_version_chirho >= 2" : "1 = 0"}
     ORDER BY volume_chirho, page_chirho, line_index_chirho, segment_index_chirho, id_chirho
  `).all() as PassCHumanValidationDbRowChirho[];
  return rowsChirho.map((rowChirho) => ({
    dbIdChirho: rowChirho.id_chirho,
    volumeChirho: rowChirho.volume_chirho,
    pageChirho: rowChirho.page_chirho,
    lineIndexChirho: rowChirho.line_index_chirho,
    segmentIndexChirho: rowChirho.segment_index_chirho,
    originalTextChirho: rowChirho.original_text_chirho,
    originalTextHashChirho: rowChirho.original_text_hash_chirho,
    verdictChirho: rowChirho.verdict_chirho,
    correctedTextChirho: rowChirho.corrected_text_chirho,
    scriptVerdictChirho: rowChirho.script_verdict_chirho,
    issueFlagsChirho: parseIssueFlagsChirho(rowChirho.issue_flags_chirho),
    ...spanSuggestionChirho(rowChirho),
    notesChirho: rowChirho.notes_chirho ?? "",
    queueGeneratedAtChirho: rowChirho.queue_generated_at_chirho,
    reviewerChirho: rowChirho.reviewer_chirho,
    createdAtChirho: rowChirho.created_at_chirho,
    updatedAtChirho: rowChirho.updated_at_chirho,
    appliedAtChirho: rowChirho.applied_at_chirho,
    appliedToFileChirho:
      rowChirho.applied_to_file_chirho === null ? null : projectRelativePathChirho(rowChirho.applied_to_file_chirho),
    schemaVersionChirho: rowChirho.schema_version_chirho,
  }));
}

export function passCHumanValidationBackupRowsFromDbPathChirho(
  dbPathChirho: string
): PassCHumanValidationBackupReviewChirho[] {
  if (!existsSync(dbPathChirho)) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    return passCHumanValidationBackupRowsFromDbChirho(dbChirho);
  } finally {
    dbChirho.close();
  }
}

export function passCHumanValidationDurabilityKeyChirho(
  reviewChirho: PassCHumanValidationBackupReviewChirho
): string {
  return JSON.stringify({
    dbIdChirho: reviewChirho.dbIdChirho,
    volumeChirho: reviewChirho.volumeChirho,
    pageChirho: reviewChirho.pageChirho,
    lineIndexChirho: reviewChirho.lineIndexChirho,
    segmentIndexChirho: reviewChirho.segmentIndexChirho,
    originalTextHashChirho: reviewChirho.originalTextHashChirho,
    verdictChirho: reviewChirho.verdictChirho,
    correctedTextChirho: reviewChirho.correctedTextChirho,
    scriptVerdictChirho: reviewChirho.scriptVerdictChirho,
    issueFlagsChirho: reviewChirho.issueFlagsChirho,
    wlcSuggestedTextChirho: reviewChirho.wlcSuggestedTextChirho ?? null,
    wlcSuggestionSourceChirho: reviewChirho.wlcSuggestionSourceChirho ?? null,
    notesChirho: reviewChirho.notesChirho,
    reviewerChirho: reviewChirho.reviewerChirho,
    createdAtChirho: reviewChirho.createdAtChirho,
    updatedAtChirho: reviewChirho.updatedAtChirho,
    appliedAtChirho: reviewChirho.appliedAtChirho,
    appliedToFileChirho: reviewChirho.appliedToFileChirho,
    schemaVersionChirho: reviewChirho.schemaVersionChirho,
  });
}

export function readPassCHumanValidationBackupFileChirho(
  backupPathChirho = PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO
): PassCHumanValidationBackupFileChirho {
  if (!existsSync(backupPathChirho)) return {};
  return JSON.parse(readFileSync(backupPathChirho, "utf8")) as PassCHumanValidationBackupFileChirho;
}

export function passCHumanValidationBackupShapeOkChirho(
  backupChirho: PassCHumanValidationBackupFileChirho,
  existsChirho: boolean
): boolean {
  return (
    !existsChirho ||
    (backupChirho.schemaVersionChirho === 1 &&
      Array.isArray(backupChirho.reviewsChirho) &&
      backupChirho.reviewCountChirho === backupChirho.reviewsChirho.length &&
      (backupChirho.reviewsChirho ?? []).every(
        (reviewChirho) =>
          typeof reviewChirho.dbIdChirho === "number" &&
          typeof reviewChirho.volumeChirho === "number" &&
          typeof reviewChirho.pageChirho === "number" &&
          typeof reviewChirho.lineIndexChirho === "number" &&
          typeof reviewChirho.segmentIndexChirho === "number" &&
          typeof reviewChirho.originalTextChirho === "string" &&
          typeof reviewChirho.originalTextHashChirho === "string" &&
          typeof reviewChirho.verdictChirho === "string" &&
          Array.isArray(reviewChirho.issueFlagsChirho) &&
          typeof reviewChirho.reviewerChirho === "string" &&
          typeof reviewChirho.createdAtChirho === "string" &&
          typeof reviewChirho.updatedAtChirho === "string" &&
          typeof reviewChirho.schemaVersionChirho === "number"
      ))
  );
}

export function passCHumanValidationBackupRowsChirho(
  backupChirho: PassCHumanValidationBackupFileChirho,
  shapeOkChirho: boolean
): PassCHumanValidationBackupReviewChirho[] {
  return shapeOkChirho ? backupChirho.reviewsChirho ?? [] : [];
}

export function countPassCHumanValidationRowsMissingFromBackupChirho(
  dbRowsChirho: PassCHumanValidationBackupReviewChirho[],
  backupRowsChirho: PassCHumanValidationBackupReviewChirho[]
): number {
  const backupKeysChirho = new Set(backupRowsChirho.map(passCHumanValidationDurabilityKeyChirho));
  return dbRowsChirho.filter((rowChirho) => !backupKeysChirho.has(passCHumanValidationDurabilityKeyChirho(rowChirho))).length;
}

export function writePassCHumanValidationBackupChirho(
  dbChirho: Database,
  backupPathChirho = PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO
): number {
  const rowsChirho = passCHumanValidationBackupRowsFromDbChirho(dbChirho);
  const backupChirho: PassCHumanValidationBackupFileChirho = {
    john316Chirho:
      "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
    schemaVersionChirho: 1,
    generatedAtChirho: new Date().toISOString(),
    sourceChirho: "pass_c_human_validations_chirho current schema-v2 rows",
    reviewCountChirho: rowsChirho.length,
    reviewsChirho: rowsChirho,
  };
  mkdirSync(dirname(backupPathChirho), { recursive: true });
  writeFileSync(backupPathChirho, `${JSON.stringify(backupChirho, null, 2)}\n`);
  return rowsChirho.length;
}

if (import.meta.main) {
  const dbChirho = new Database(join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite"));
  try {
    const rowCountChirho = writePassCHumanValidationBackupChirho(dbChirho);
    console.log(
      `[pass-c-human-validation-backup-chirho] wrote ${rowCountChirho} current row(s) to ${PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO}`
    );
  } finally {
    dbChirho.close();
  }
}
