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

import { PROGRESS_DB_PATH_CHIRHO } from "./config-chirho.ts";
import {
  PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO,
  writePassCHumanValidationBackupChirho,
} from "./pass-c-human-validation-backup-chirho.ts";
import {
  assertExplicitReviewerAttributionChirho,
  isGenericReviewerAttributionChirho,
} from "./reviewer-attribution-chirho.ts";

const MODULE_CHIRHO = "reattribute-pass-c-human-validations-chirho";

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
    `Usage: bun run ${MODULE_CHIRHO} -- --validation-id-chirho=<id> [--validation-id-chirho=<id> ...] --reviewer-chirho=<reviewer-id> --rationale-chirho=<reason> [--apply-chirho]`,
    `       bun run ${MODULE_CHIRHO} -- --all-generic-chirho --reviewer-chirho=<reviewer-id> --rationale-chirho=<reason> [--apply-chirho]`,
    "",
    "Dry-run is the default. Applying writes append-only superseding rows and refreshes the Pass-C human validation backup.",
    "Only current schema-v2 rows with blank/generic reviewer attribution can be reattributed.",
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
          AND (trim(reviewer_chirho) = '' OR lower(trim(reviewer_chirho)) IN ('human-chirho', 'unknown-reviewer-chirho'))
        ORDER BY id_chirho`
    )
    .all() as PassCHumanValidationRowChirho[];
}

function assertRowsEligibleChirho(rowsChirho: PassCHumanValidationRowChirho[], requestedIdsChirho: number[]): void {
  const foundIdsChirho = new Set(rowsChirho.map((rowChirho) => rowChirho.id_chirho));
  const missingIdsChirho = requestedIdsChirho.filter((idChirho) => !foundIdsChirho.has(idChirho));
  if (missingIdsChirho.length > 0) throw new Error(`validation id(s) not found: ${missingIdsChirho.join(",")}`);
  for (const rowChirho of rowsChirho) {
    if (rowChirho.is_current_chirho !== 1) throw new Error(`validation id ${rowChirho.id_chirho} is not current`);
    if (rowChirho.schema_version_chirho < 2) throw new Error(`validation id ${rowChirho.id_chirho} is not schema-v2`);
    if (!isGenericReviewerAttributionChirho(rowChirho.reviewer_chirho)) {
      throw new Error(`validation id ${rowChirho.id_chirho} already has explicit reviewer ${rowChirho.reviewer_chirho}`);
    }
  }
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
  assertExplicitReviewerAttributionChirho(reviewerChirho, "--reviewer-chirho");
  const rationaleChirho = requiredArgValueChirho(argsChirho, "rationale-chirho");
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
