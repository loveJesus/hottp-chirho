// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Append-only reattribution for current Pass-C human validation rows.
 *
 * This does not change the reviewed text, verdict, issue flags, or applied
 * metadata. It only supersedes a current generic-reviewer row with a copied row
 * carrying an explicit reviewer and an audit note.
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";

import { PROGRESS_DB_PATH_CHIRHO } from "./config-chirho.ts";
import {
  PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO,
  writePassCHumanValidationBackupChirho,
} from "./pass-c-human-validation-backup-chirho.ts";
import {
  assertCertifyingReviewerAttributionChirho,
  isBlockedCertificationReviewerAttributionChirho,
} from "./reviewer-attribution-chirho.ts";
import { spanLinePathChirho, type SpanLineLikeChirho, type SpanLikeChirho } from "./span-nfc-chirho.ts";
import { valueLooksTemplatePlaceholderChirho } from "./template-placeholder-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "reattribute-pass-c-human-validations-chirho";
const RATIONALE_PLACEHOLDER_VALUES_CHIRHO = new Set([
  "why this existing row is attributable to that reviewer",
  "why every current attribution-blocked row is attributable to that reviewer",
  "why every selected row is attributable to that reviewer",
  "rationale",
  "reason",
  "placeholder",
  "todo",
  "tbd",
]);

interface PassCHumanValidationRowChirho {
  id_chirho: number;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  original_text_chirho: string;
  original_text_hash_chirho: string;
  line_text_chirho: string | null;
  verdict_chirho: string;
  certify_clean_chirho: number;
  corrected_text_chirho: string | null;
  corrected_skeleton_chirho: string | null;
  script_verdict_chirho: string | null;
  issue_flags_chirho: string | null;
  notes_chirho: string | null;
  witness_snapshot_chirho: string | null;
  queue_generated_at_chirho: string | null;
  reviewer_chirho: string;
  created_at_chirho: string;
  updated_at_chirho: string;
  supersedes_id_chirho: number | null;
  is_current_chirho: number;
  applied_at_chirho: string | null;
  applied_to_file_chirho: string | null;
  schema_version_chirho: number;
}

interface ReattributionResultChirho {
  oldIdChirho: number;
  newIdChirho: number | null;
  keyChirho: string;
  previousReviewerChirho: string;
  newReviewerChirho: string;
  statusChirho: "planned-chirho" | "applied-chirho";
}

function usageChirho(): string {
  return [
    `Usage: bun run ${MODULE_CHIRHO} -- --validation-id-chirho=<id> [--validation-id-chirho=<id> ...] --reviewer-chirho=<reviewer-id> --rationale-chirho=<reason> [--expected-live-text-chirho=<current-live-text> | --expected-live-text-hash-chirho=<id>:<sha256> ...] [--apply-chirho]`,
    `       bun run ${MODULE_CHIRHO} -- --all-generic-chirho --expected-generic-row-count-chirho=<count> --reviewer-chirho=<reviewer-id> --rationale-chirho=<reason> [--apply-chirho]`,
    "",
    "Dry-run is the default. Applying writes append-only superseding rows and refreshes the Pass-C human validation backup.",
    "Only current schema-v2 rows with blank/generic/machine reviewer attribution can be reattributed.",
    "--expected-generic-row-count-chirho is required for --all-generic-chirho with --apply-chirho; it fails closed if the attribution-blocked row count changed since the status report was read.",
    "--expected-live-text-hash-chirho is required for every selected row when applying --all-generic-chirho.",
    "Any --apply-chirho write requires a live-text drift guard: --expected-live-text-chirho for a single exact-ID row, or --expected-live-text-hash-chirho=<id>:<sha256> for every selected row.",
    "--expected-live-text-chirho is only supported for a single --validation-id-chirho row; it fails closed if the live span text has drifted since the status report was read.",
    "--expected-live-text-hash-chirho=<id>:<sha256> may be repeated; when present, every selected row must have a matching live text hash.",
  ].join("\n");
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  const matchedArgChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  if (matchedArgChirho === undefined) return undefined;
  const valueChirho = matchedArgChirho.slice(prefixChirho.length);
  if (valueChirho.length === 0) throw new Error(`--${nameChirho} must not be empty`);
  return valueChirho;
}

function parseArgValuesChirho(argsChirho: string[], nameChirho: string): string[] {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho
    .filter((argChirho) => argChirho.startsWith(prefixChirho))
    .map((argChirho) => {
      const valueChirho = argChirho.slice(prefixChirho.length);
      if (valueChirho.length === 0) throw new Error(`--${nameChirho} must not be empty`);
      return valueChirho;
    });
}

function requiredArgValueChirho(argsChirho: string[], nameChirho: string): string {
  const valueChirho = parseArgValueChirho(argsChirho, nameChirho)?.trim();
  if (valueChirho === undefined || valueChirho.length === 0) throw new Error(`--${nameChirho} is required`);
  return valueChirho;
}

function parseValidationIdsChirho(argsChirho: string[]): number[] {
  const idValuesChirho = parseArgValuesChirho(argsChirho, "validation-id-chirho");
  const idsChirho = idValuesChirho.map((valueChirho) => {
    const idChirho = Number.parseInt(valueChirho, 10);
    if (!Number.isInteger(idChirho) || String(idChirho) !== valueChirho.trim()) {
      throw new Error(`invalid --validation-id-chirho=${valueChirho}`);
    }
    return idChirho;
  });
  return [...new Set(idsChirho)];
}

function parseOptionalNonnegativeIntegerChirho(argsChirho: string[], nameChirho: string): number | undefined {
  const valueChirho = parseArgValueChirho(argsChirho, nameChirho);
  if (valueChirho === undefined) return undefined;
  const parsedChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(parsedChirho) || parsedChirho < 0 || String(parsedChirho) !== valueChirho.trim()) {
    throw new Error(`invalid --${nameChirho}=${valueChirho}`);
  }
  return parsedChirho;
}

function keyForRowChirho(rowChirho: PassCHumanValidationRowChirho): string {
  return [
    rowChirho.volume_chirho,
    rowChirho.page_chirho,
    rowChirho.line_index_chirho,
    rowChirho.segment_index_chirho,
  ].join(":");
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): Set<string> {
  const tableExistsChirho = dbChirho
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableNameChirho) as { name: string } | undefined;
  if (tableExistsChirho === undefined) return new Set();
  return new Set(
    (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
      (rowChirho) => rowChirho.name
    )
  );
}

function assertSchemaChirho(dbChirho: Database): void {
  const columnsChirho = tableColumnsChirho(dbChirho, "pass_c_human_validations_chirho");
  const requiredColumnsChirho = [
    "id_chirho",
    "volume_chirho",
    "page_chirho",
    "line_index_chirho",
    "segment_index_chirho",
    "original_text_chirho",
    "original_text_hash_chirho",
    "line_text_chirho",
    "verdict_chirho",
    "certify_clean_chirho",
    "corrected_text_chirho",
    "corrected_skeleton_chirho",
    "script_verdict_chirho",
    "issue_flags_chirho",
    "notes_chirho",
    "witness_snapshot_chirho",
    "queue_generated_at_chirho",
    "reviewer_chirho",
    "created_at_chirho",
    "updated_at_chirho",
    "supersedes_id_chirho",
    "is_current_chirho",
    "applied_at_chirho",
    "applied_to_file_chirho",
    "schema_version_chirho",
  ];
  const missingColumnsChirho = requiredColumnsChirho.filter((columnChirho) => !columnsChirho.has(columnChirho));
  if (missingColumnsChirho.length > 0) {
    throw new Error(`pass_c_human_validations_chirho lacks required column(s): ${missingColumnsChirho.join(",")}`);
  }
}

function loadRowsByIdChirho(dbChirho: Database, idsChirho: number[]): PassCHumanValidationRowChirho[] {
  if (idsChirho.length === 0) return [];
  const placeholdersChirho = idsChirho.map(() => "?").join(",");
  return dbChirho
    .query(
      `SELECT *
         FROM pass_c_human_validations_chirho
        WHERE id_chirho IN (${placeholdersChirho})
        ORDER BY id_chirho`
    )
    .all(...idsChirho) as PassCHumanValidationRowChirho[];
}

function loadGenericRowsChirho(dbChirho: Database): PassCHumanValidationRowChirho[] {
  return dbChirho
    .query(
      `SELECT *
         FROM pass_c_human_validations_chirho
        WHERE is_current_chirho = 1
          AND schema_version_chirho >= 2
        ORDER BY id_chirho`
    )
    .all()
    .filter((rowChirho) =>
      isBlockedCertificationReviewerAttributionChirho((rowChirho as PassCHumanValidationRowChirho).reviewer_chirho)
    ) as PassCHumanValidationRowChirho[];
}

function assertRowsEligibleChirho(rowsChirho: PassCHumanValidationRowChirho[], requestedIdsChirho: number[]): void {
  const foundIdsChirho = new Set(rowsChirho.map((rowChirho) => rowChirho.id_chirho));
  const missingIdsChirho = requestedIdsChirho.filter((idChirho) => !foundIdsChirho.has(idChirho));
  if (missingIdsChirho.length > 0) throw new Error(`validation id(s) not found: ${missingIdsChirho.join(",")}`);
  for (const rowChirho of rowsChirho) {
    if (rowChirho.is_current_chirho !== 1) throw new Error(`validation id ${rowChirho.id_chirho} is not current`);
    if (rowChirho.schema_version_chirho < 2) throw new Error(`validation id ${rowChirho.id_chirho} is not schema-v2`);
    if (!isBlockedCertificationReviewerAttributionChirho(rowChirho.reviewer_chirho)) {
      throw new Error(`validation id ${rowChirho.id_chirho} already has explicit reviewer ${rowChirho.reviewer_chirho}`);
    }
  }
}

interface LiveSpanForReattributionChirho extends SpanLikeChirho {
  segmentIndexChirho?: number;
  utf8TextChirho?: string;
}

function liveSpanTextForRowChirho(rowChirho: PassCHumanValidationRowChirho): string {
  const pathChirho = spanLinePathChirho(rowChirho.volume_chirho, rowChirho.page_chirho, rowChirho.line_index_chirho);
  if (!existsSync(pathChirho)) {
    throw new Error(`live span line file is missing for validation id ${rowChirho.id_chirho}: ${pathChirho}`);
  }
  const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineLikeChirho;
  const spanChirho = lineChirho.spansChirho?.find(
    (candidateChirho): candidateChirho is LiveSpanForReattributionChirho =>
      candidateChirho.segmentIndexChirho === rowChirho.segment_index_chirho
  );
  if (spanChirho === undefined) {
    throw new Error(`live span segment is missing for validation id ${rowChirho.id_chirho}`);
  }
  if (typeof spanChirho.utf8TextChirho !== "string") {
    throw new Error(`live span text is missing for validation id ${rowChirho.id_chirho}`);
  }
  return normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
}

function assertExpectedLiveTextChirho(
  rowsChirho: PassCHumanValidationRowChirho[],
  expectedLiveTextChirho: string | undefined,
  allGenericChirho: boolean
): void {
  if (expectedLiveTextChirho === undefined) return;
  if (allGenericChirho || rowsChirho.length !== 1) {
    throw new Error("--expected-live-text-chirho is only supported with exactly one --validation-id-chirho row");
  }
  const rowChirho = rowsChirho[0]!;
  const expectedChirho = normalizeTextForStorageChirho(expectedLiveTextChirho);
  const liveChirho = liveSpanTextForRowChirho(rowChirho);
  if (liveChirho !== expectedChirho) {
    throw new Error(
      `validation id ${rowChirho.id_chirho} live text drifted; expected ${JSON.stringify(expectedChirho)}, current ${JSON.stringify(liveChirho)}`
    );
  }
}

function parseExpectedLiveTextHashesChirho(argsChirho: string[]): Map<number, string> {
  const valuesChirho = parseArgValuesChirho(argsChirho, "expected-live-text-hash-chirho");
  const hashesChirho = new Map<number, string>();
  for (const valueChirho of valuesChirho) {
    const separatorIndexChirho = valueChirho.indexOf(":");
    if (separatorIndexChirho <= 0) {
      throw new Error(`invalid --expected-live-text-hash-chirho=${valueChirho}; expected <id>:<sha256>`);
    }
    const idTextChirho = valueChirho.slice(0, separatorIndexChirho);
    const hashChirho = valueChirho.slice(separatorIndexChirho + 1).toLowerCase();
    const idChirho = Number.parseInt(idTextChirho, 10);
    if (!Number.isInteger(idChirho) || String(idChirho) !== idTextChirho.trim()) {
      throw new Error(`invalid expected hash validation id: ${idTextChirho}`);
    }
    if (!/^[a-f0-9]{64}$/.test(hashChirho)) {
      throw new Error(`invalid expected live text hash for validation id ${idChirho}`);
    }
    if (hashesChirho.has(idChirho)) throw new Error(`duplicate expected live text hash for validation id ${idChirho}`);
    hashesChirho.set(idChirho, hashChirho);
  }
  return hashesChirho;
}

function assertExpectedLiveTextHashesChirho(
  rowsChirho: PassCHumanValidationRowChirho[],
  expectedHashesChirho: Map<number, string>,
  allGenericChirho: boolean,
  applyChirho: boolean
): void {
  if (expectedHashesChirho.size === 0) {
    if (allGenericChirho && applyChirho) {
      throw new Error("--expected-live-text-hash-chirho is required for every row when applying --all-generic-chirho");
    }
    return;
  }
  const rowIdsChirho = new Set(rowsChirho.map((rowChirho) => rowChirho.id_chirho));
  const extraIdsChirho = [...expectedHashesChirho.keys()].filter((idChirho) => !rowIdsChirho.has(idChirho));
  if (extraIdsChirho.length > 0) {
    throw new Error(`expected live text hash supplied for unselected validation id(s): ${extraIdsChirho.join(",")}`);
  }
  const missingIdsChirho = rowsChirho
    .map((rowChirho) => rowChirho.id_chirho)
    .filter((idChirho) => !expectedHashesChirho.has(idChirho));
  if (missingIdsChirho.length > 0) {
    throw new Error(`missing expected live text hash for selected validation id(s): ${missingIdsChirho.join(",")}`);
  }
  for (const rowChirho of rowsChirho) {
    const expectedHashChirho = expectedHashesChirho.get(rowChirho.id_chirho)!;
    const liveHashChirho = hashTextChirho(liveSpanTextForRowChirho(rowChirho));
    if (liveHashChirho !== expectedHashChirho) {
      throw new Error(
        `validation id ${rowChirho.id_chirho} live text hash drifted; expected ${expectedHashChirho}, current ${liveHashChirho}`
      );
    }
  }
}

function assertExpectedGenericRowCountChirho(
  rowsChirho: PassCHumanValidationRowChirho[],
  allGenericChirho: boolean,
  applyChirho: boolean,
  expectedGenericRowCountChirho: number | undefined
): void {
  if (!allGenericChirho && expectedGenericRowCountChirho !== undefined) {
    throw new Error("--expected-generic-row-count-chirho is only supported with --all-generic-chirho");
  }
  if (allGenericChirho && applyChirho && expectedGenericRowCountChirho === undefined) {
    throw new Error("--expected-generic-row-count-chirho is required when applying --all-generic-chirho");
  }
  if (expectedGenericRowCountChirho !== undefined && rowsChirho.length !== expectedGenericRowCountChirho) {
    throw new Error(
      `generic row count drifted; expected ${expectedGenericRowCountChirho}, current ${rowsChirho.length}`
    );
  }
}

function assertApplyHasLiveTextGuardChirho(
  rowsChirho: PassCHumanValidationRowChirho[],
  applyChirho: boolean,
  expectedLiveTextChirho: string | undefined,
  expectedHashesChirho: Map<number, string>
): void {
  if (!applyChirho || rowsChirho.length === 0) return;
  if (expectedHashesChirho.size > 0) return;
  if (rowsChirho.length === 1 && expectedLiveTextChirho !== undefined) return;
  throw new Error(
    "--apply-chirho requires --expected-live-text-chirho for one selected row or --expected-live-text-hash-chirho for every selected row"
  );
}

function reattributionNoteChirho(
  existingNotesChirho: string | null,
  previousReviewerChirho: string,
  newReviewerChirho: string,
  rationaleChirho: string,
  nowChirho: string
): string {
  const previousChirho = previousReviewerChirho.trim().length === 0 ? "<blank-reviewer-chirho>" : previousReviewerChirho;
  const noteChirho =
    `[reattribution-chirho ${nowChirho}] reviewer_chirho ${previousChirho} -> ${newReviewerChirho}; rationale: ${rationaleChirho}`;
  const trimmedExistingChirho = existingNotesChirho?.trim();
  return trimmedExistingChirho === undefined || trimmedExistingChirho.length === 0
    ? noteChirho
    : `${existingNotesChirho}\n${noteChirho}`;
}

function insertReattributedRowChirho(
  dbChirho: Database,
  rowChirho: PassCHumanValidationRowChirho,
  reviewerChirho: string,
  rationaleChirho: string,
  nowChirho: string
): number {
  const notesChirho = reattributionNoteChirho(
    rowChirho.notes_chirho,
    rowChirho.reviewer_chirho,
    reviewerChirho,
    rationaleChirho,
    nowChirho
  );
  dbChirho
    .prepare(
      `UPDATE pass_c_human_validations_chirho
          SET is_current_chirho = 0
        WHERE volume_chirho = ?
          AND page_chirho = ?
          AND line_index_chirho = ?
          AND segment_index_chirho = ?
          AND is_current_chirho = 1`
    )
    .run(rowChirho.volume_chirho, rowChirho.page_chirho, rowChirho.line_index_chirho, rowChirho.segment_index_chirho);
  const resultChirho = dbChirho
    .prepare(
      `INSERT INTO pass_c_human_validations_chirho
        (volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
         original_text_chirho, original_text_hash_chirho, line_text_chirho, verdict_chirho, certify_clean_chirho,
         corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho,
         witness_snapshot_chirho, queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
         supersedes_id_chirho, is_current_chirho, applied_at_chirho, applied_to_file_chirho, schema_version_chirho)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
    )
    .run(
      rowChirho.volume_chirho,
      rowChirho.page_chirho,
      rowChirho.line_index_chirho,
      rowChirho.segment_index_chirho,
      rowChirho.original_text_chirho,
      rowChirho.original_text_hash_chirho,
      rowChirho.line_text_chirho,
      rowChirho.verdict_chirho,
      rowChirho.certify_clean_chirho,
      rowChirho.corrected_text_chirho,
      rowChirho.corrected_skeleton_chirho,
      rowChirho.script_verdict_chirho,
      rowChirho.issue_flags_chirho,
      notesChirho,
      rowChirho.witness_snapshot_chirho,
      rowChirho.queue_generated_at_chirho,
      reviewerChirho,
      nowChirho,
      nowChirho,
      rowChirho.id_chirho,
      rowChirho.applied_at_chirho,
      rowChirho.applied_to_file_chirho,
      rowChirho.schema_version_chirho
    );
  return Number(resultChirho.lastInsertRowid);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  if (argsChirho.includes("--help-chirho") || argsChirho.includes("-h")) {
    console.log(usageChirho());
    return;
  }
  const applyChirho = argsChirho.includes("--apply-chirho");
  const allGenericChirho = argsChirho.includes("--all-generic-chirho");
  const validationIdsChirho = parseValidationIdsChirho(argsChirho);
  if (allGenericChirho && validationIdsChirho.length > 0) {
    throw new Error("use either --all-generic-chirho or --validation-id-chirho, not both");
  }
  if (!allGenericChirho && validationIdsChirho.length === 0) throw new Error(usageChirho());
  const reviewerChirho = requiredArgValueChirho(argsChirho, "reviewer-chirho");
  assertCertifyingReviewerAttributionChirho(reviewerChirho, "--reviewer-chirho");
  const rationaleChirho = requiredArgValueChirho(argsChirho, "rationale-chirho");
  if (valueLooksTemplatePlaceholderChirho(rationaleChirho, RATIONALE_PLACEHOLDER_VALUES_CHIRHO)) {
    throw new Error("--rationale-chirho must explain the explicit attribution, not a template placeholder");
  }
  const expectedLiveTextChirho = parseArgValueChirho(argsChirho, "expected-live-text-chirho");
  const expectedLiveTextHashesChirho = parseExpectedLiveTextHashesChirho(argsChirho);
  const expectedGenericRowCountChirho = parseOptionalNonnegativeIntegerChirho(argsChirho, "expected-generic-row-count-chirho");
  const dbPathChirho = parseArgValueChirho(argsChirho, "db-chirho") ?? PROGRESS_DB_PATH_CHIRHO;
  const backupPathChirho =
    parseArgValueChirho(argsChirho, "backup-chirho") ?? PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO;
  const dbChirho = new Database(dbPathChirho);
  try {
    assertSchemaChirho(dbChirho);
    const rowsChirho = allGenericChirho
      ? loadGenericRowsChirho(dbChirho)
      : loadRowsByIdChirho(dbChirho, validationIdsChirho);
    assertRowsEligibleChirho(rowsChirho, validationIdsChirho);
    assertExpectedGenericRowCountChirho(rowsChirho, allGenericChirho, applyChirho, expectedGenericRowCountChirho);
    assertExpectedLiveTextChirho(rowsChirho, expectedLiveTextChirho, allGenericChirho);
    assertExpectedLiveTextHashesChirho(rowsChirho, expectedLiveTextHashesChirho, allGenericChirho, applyChirho);
    assertApplyHasLiveTextGuardChirho(rowsChirho, applyChirho, expectedLiveTextChirho, expectedLiveTextHashesChirho);
    if (rowsChirho.length === 0) {
      console.log(`[${MODULE_CHIRHO}] no eligible row(s)`);
      return;
    }
    const nowChirho = new Date().toISOString();
    const resultsChirho: ReattributionResultChirho[] = [];
    if (applyChirho) dbChirho.run("BEGIN IMMEDIATE");
    try {
      for (const rowChirho of rowsChirho) {
        const newIdChirho = applyChirho
          ? insertReattributedRowChirho(dbChirho, rowChirho, reviewerChirho, rationaleChirho, nowChirho)
          : null;
        resultsChirho.push({
          oldIdChirho: rowChirho.id_chirho,
          newIdChirho,
          keyChirho: keyForRowChirho(rowChirho),
          previousReviewerChirho: rowChirho.reviewer_chirho,
          newReviewerChirho: reviewerChirho,
          statusChirho: applyChirho ? "applied-chirho" : "planned-chirho",
        });
      }
      if (applyChirho) dbChirho.run("COMMIT");
    } catch (errorChirho) {
      if (applyChirho) dbChirho.run("ROLLBACK");
      throw errorChirho;
    }
    if (applyChirho) {
      const rowCountChirho = writePassCHumanValidationBackupChirho(dbChirho, backupPathChirho);
      console.log(`[${MODULE_CHIRHO}] refreshed backup rows=${rowCountChirho} path=${backupPathChirho}`);
    }
    for (const resultChirho of resultsChirho) {
      console.log(
        `[${MODULE_CHIRHO}] ${resultChirho.statusChirho} old=${resultChirho.oldIdChirho}` +
          `${resultChirho.newIdChirho === null ? "" : ` new=${resultChirho.newIdChirho}`}` +
          ` key=${resultChirho.keyChirho} reviewer=${resultChirho.previousReviewerChirho}->${resultChirho.newReviewerChirho}`
      );
    }
    if (!applyChirho) console.log(`[${MODULE_CHIRHO}] dry-run only; add --apply-chirho to write`);
  } finally {
    dbChirho.close();
  }
}

if (import.meta.main) mainChirho();
