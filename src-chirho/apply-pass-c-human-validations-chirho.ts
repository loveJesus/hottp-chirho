// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Apply append-only Pass C human validation verdicts back to span JSON files.
 *
 * Defaults to dry-run. Use --apply with --expected-row-count-chirho and
 * --expected-validation-id-chirho for each selected row to write span files
 * and stamp applied_at.
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { writePassCHumanValidationBackupChirho } from "./pass-c-human-validation-backup-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "./span-nfc-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "apply-pass-c-human-validations-chirho";
const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const SCRIPT_VERDICT_VALUES_CHIRHO = new Set([
  "latin-non-french-chirho",
  "french-chirho",
  "hebrew-chirho",
  "greek-chirho",
  "syriac-chirho",
  "symbol-chirho",
]);
const HUMAN_PROVENANCE_SCRIPT_VALUES_CHIRHO = new Set([
  "latin-non-french-chirho",
  "french-chirho",
  "latin-chirho",
  "symbol-chirho",
]);

interface HumanValidationRowChirho {
  id_chirho: number;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  original_text_chirho: string;
  original_text_hash_chirho: string;
  verdict_chirho: string;
  certify_clean_chirho: number;
  corrected_text_chirho: string | null;
  script_verdict_chirho: string | null;
  issue_flags_chirho: string | null;
  notes_chirho: string | null;
  applied_at_chirho: string | null;
}

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  humanValidationIdChirho?: number;
  humanValidationVerdictChirho?: string;
  humanValidatedAtChirho?: string;
  humanValidationNotesChirho?: string;
  humanReviewStatusChirho?: string;
  humanIssueFlagsChirho?: string[];
  humanSuggestedTextChirho?: string;
  needsSourceChirho?: boolean;
  badSegmentationChirho?: boolean;
}

interface SpanLineChirho {
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  spansChirho: SpanChirho[];
}

interface ApplyResultChirho {
  idChirho: number;
  keyChirho: string;
  verdictChirho: string;
  statusChirho: "planned-chirho" | "applied-chirho" | "skipped-chirho" | "error-chirho";
  messageChirho: string;
  filePathChirho: string | null;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function parseNonNegativeIntegerArgChirho(valueChirho: string | undefined, nameChirho: string): number | null {
  if (valueChirho === undefined) return null;
  if (!/^(0|[1-9]\d*)$/.test(valueChirho)) {
    throw new Error(`--${nameChirho} must be a non-negative integer`);
  }
  return Number.parseInt(valueChirho, 10);
}

function parseExpectedValidationIdsChirho(argsChirho: string[]): Set<number> {
  const prefixChirho = "--expected-validation-id-chirho=";
  const expectedIdsChirho = new Set<number>();
  for (const argChirho of argsChirho) {
    if (!argChirho.startsWith(prefixChirho)) continue;
    const rawIdChirho = argChirho.slice(prefixChirho.length);
    if (!/^[1-9]\d*$/.test(rawIdChirho)) {
      throw new Error("--expected-validation-id-chirho must be a positive integer");
    }
    const idChirho = Number.parseInt(rawIdChirho, 10);
    if (expectedIdsChirho.has(idChirho)) {
      throw new Error(`duplicate --expected-validation-id-chirho=${idChirho}`);
    }
    expectedIdsChirho.add(idChirho);
  }
  return expectedIdsChirho;
}

function sortedNumbersChirho(numbersChirho: Iterable<number>): number[] {
  return [...numbersChirho].sort((leftChirho, rightChirho) => leftChirho - rightChirho);
}

function assertApplySelectionGuardChirho(
  rowsChirho: HumanValidationRowChirho[],
  expectedRowCountChirho: number | null,
  expectedValidationIdsChirho: Set<number>
): void {
  if (expectedRowCountChirho === null) {
    throw new Error("--apply requires --expected-row-count-chirho=<count>");
  }
  if (expectedRowCountChirho !== rowsChirho.length) {
    throw new Error(
      `--expected-row-count-chirho=${expectedRowCountChirho} does not match selected row count ${rowsChirho.length}`
    );
  }
  if (expectedValidationIdsChirho.size !== rowsChirho.length) {
    throw new Error(
      "--apply requires one --expected-validation-id-chirho=<id> flag for each selected validation row"
    );
  }
  const selectedIdsChirho = sortedNumbersChirho(rowsChirho.map((rowChirho) => rowChirho.id_chirho));
  const expectedIdsChirho = sortedNumbersChirho(expectedValidationIdsChirho);
  const selectedKeyChirho = selectedIdsChirho.join(",");
  const expectedKeyChirho = expectedIdsChirho.join(",");
  if (selectedKeyChirho !== expectedKeyChirho) {
    throw new Error(
      `--expected-validation-id-chirho set [${expectedKeyChirho}] does not match selected row ids [${selectedKeyChirho}]`
    );
  }
}

function parseIssueFlagsChirho(issueFlagsChirho: string | null): string[] {
  if (!issueFlagsChirho) return [];
  try {
    const parsedChirho = JSON.parse(issueFlagsChirho) as unknown;
    if (!Array.isArray(parsedChirho)) return [];
    return parsedChirho.filter((flagChirho): flagChirho is string => typeof flagChirho === "string");
  } catch {
    return [];
  }
}

function parseScriptVerdictChirho(scriptVerdictChirho: string | null): string | null {
  if (!scriptVerdictChirho) return null;
  return SCRIPT_VERDICT_VALUES_CHIRHO.has(scriptVerdictChirho) ? scriptVerdictChirho : null;
}

function shouldStampHumanProvenanceChirho(scriptChirho: string): boolean {
  return HUMAN_PROVENANCE_SCRIPT_VALUES_CHIRHO.has(scriptChirho);
}

function spanKeyChirho(rowChirho: Pick<HumanValidationRowChirho, "volume_chirho" | "page_chirho" | "line_index_chirho" | "segment_index_chirho">): string {
  return [
    rowChirho.volume_chirho,
    rowChirho.page_chirho,
    rowChirho.line_index_chirho,
    rowChirho.segment_index_chirho,
  ].join(":");
}

function spanLinePathChirho(rowChirho: HumanValidationRowChirho, spansDirChirho: string): string {
  return join(
    spansDirChirho,
    `vol-${rowChirho.volume_chirho}-chirho`,
    `page-${String(rowChirho.page_chirho).padStart(4, "0")}-chirho`,
    `line-${String(rowChirho.line_index_chirho).padStart(3, "0")}-chirho.json`
  );
}

function loadSpanLineChirho(pathChirho: string): SpanLineChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho;
}

function writeSpanLineChirho(pathChirho: string, lineChirho: SpanLineChirho): void {
  normalizeSpanLineTextFieldsChirho(lineChirho);
  writeJsonAtomicChirho(pathChirho, lineChirho);
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): string[] {
  return (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
    (rowChirho) => rowChirho.name
  );
}

function rowQueryChirho(
  argsChirho: string[],
  hasIssueFlagsColumnChirho: boolean,
  hasScriptVerdictColumnChirho: boolean,
  hasCertifyCleanColumnChirho: boolean
): { sqlChirho: string; paramsChirho: Array<string | number> } {
  const clausesChirho = [
    "is_current_chirho = 1",
    "applied_at_chirho IS NULL",
    "verdict_chirho IN ('reviewed-clean-chirho', 'reviewed-issues-chirho')",
  ];
  const paramsChirho: Array<string | number> = [];
  const idChirho = parseArgValueChirho(argsChirho, "id");
  const volChirho = parseArgValueChirho(argsChirho, "vol");
  const pageChirho = parseArgValueChirho(argsChirho, "page");
  if (idChirho !== undefined) {
    clausesChirho.push("id_chirho = ?");
    paramsChirho.push(Number.parseInt(idChirho, 10));
  }
  if (volChirho !== undefined) {
    clausesChirho.push("volume_chirho = ?");
    paramsChirho.push(Number.parseInt(volChirho, 10));
  }
  if (pageChirho !== undefined) {
    clausesChirho.push("page_chirho = ?");
    paramsChirho.push(Number.parseInt(pageChirho, 10));
  }
  return {
    sqlChirho: `
      SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
             original_text_chirho, original_text_hash_chirho, verdict_chirho,
             ${hasCertifyCleanColumnChirho ? "certify_clean_chirho" : "0 AS certify_clean_chirho"},
             corrected_text_chirho,
             ${hasScriptVerdictColumnChirho ? "script_verdict_chirho" : "NULL AS script_verdict_chirho"},
             ${hasIssueFlagsColumnChirho ? "issue_flags_chirho" : "NULL AS issue_flags_chirho"},
             notes_chirho, applied_at_chirho
        FROM pass_c_human_validations_chirho
       WHERE ${clausesChirho.join(" AND ")}
       ORDER BY volume_chirho, page_chirho, line_index_chirho, segment_index_chirho, id_chirho`,
    paramsChirho,
  };
}

function applyRowChirho(
  rowChirho: HumanValidationRowChirho,
  spansDirChirho: string,
  applyChirho: boolean,
  appliedAtChirho: string,
  updateAppliedStmtChirho: ReturnType<Database["prepare"]>
): ApplyResultChirho {
  const keyChirho = spanKeyChirho(rowChirho);
  const filePathChirho = spanLinePathChirho(rowChirho, spansDirChirho);
  if (!existsSync(filePathChirho)) {
    return {
      idChirho: rowChirho.id_chirho,
      keyChirho,
      verdictChirho: rowChirho.verdict_chirho,
      statusChirho: "error-chirho",
      messageChirho: `span line file missing: ${filePathChirho}`,
      filePathChirho,
    };
  }

  const lineChirho = loadSpanLineChirho(filePathChirho);
  const spanChirho = lineChirho.spansChirho.find(
    (candidateChirho) => candidateChirho.segmentIndexChirho === rowChirho.segment_index_chirho
  );
  if (!spanChirho) {
    return {
      idChirho: rowChirho.id_chirho,
      keyChirho,
      verdictChirho: rowChirho.verdict_chirho,
      statusChirho: "error-chirho",
      messageChirho: `segmentIndexChirho ${rowChirho.segment_index_chirho} not found`,
      filePathChirho,
    };
  }

  const currentHashChirho = hashTextChirho(spanChirho.utf8TextChirho);
  if (currentHashChirho !== rowChirho.original_text_hash_chirho) {
    return {
      idChirho: rowChirho.id_chirho,
      keyChirho,
      verdictChirho: rowChirho.verdict_chirho,
      statusChirho: "error-chirho",
      messageChirho: `staleness hash mismatch: current ${currentHashChirho}, reviewed ${rowChirho.original_text_hash_chirho}`,
      filePathChirho,
    };
  }

  const messagePartsChirho: string[] = [];
  const issueFlagsChirho = parseIssueFlagsChirho(rowChirho.issue_flags_chirho);
  const scriptVerdictChirho = parseScriptVerdictChirho(rowChirho.script_verdict_chirho);
  if (rowChirho.verdict_chirho === "reviewed-clean-chirho") {
    if (rowChirho.certify_clean_chirho !== 1) {
      return {
        idChirho: rowChirho.id_chirho,
        keyChirho,
        verdictChirho: rowChirho.verdict_chirho,
        statusChirho: "error-chirho",
        messageChirho: "reviewed-clean row is missing certify_clean_chirho=1 acknowledgement",
        filePathChirho,
      };
    }
    const stampsHumanProvenanceChirho =
      scriptVerdictChirho === null || shouldStampHumanProvenanceChirho(scriptVerdictChirho);
    if (applyChirho) {
      if (scriptVerdictChirho) spanChirho.scriptChirho = scriptVerdictChirho;
      if (stampsHumanProvenanceChirho) {
        spanChirho.provenanceChirho = "human-chirho";
      } else {
        delete spanChirho.provenanceChirho;
      }
      spanChirho.humanReviewStatusChirho = rowChirho.verdict_chirho;
      spanChirho.humanIssueFlagsChirho = [];
      spanChirho.needsSourceChirho = false;
      spanChirho.badSegmentationChirho = false;
    }
    messagePartsChirho.push(
      `reviewed clean; ${stampsHumanProvenanceChirho ? "stamp provenanceChirho=human-chirho" : "leave provenance derived for script-specific validation"}${scriptVerdictChirho ? `; set scriptChirho=${scriptVerdictChirho}` : ""}`
    );
  } else if (rowChirho.verdict_chirho === "reviewed-issues-chirho") {
    if (applyChirho) {
      if (scriptVerdictChirho) spanChirho.scriptChirho = scriptVerdictChirho;
      spanChirho.humanReviewStatusChirho = rowChirho.verdict_chirho;
      spanChirho.humanIssueFlagsChirho = issueFlagsChirho;
      if (rowChirho.corrected_text_chirho?.trim()) {
        spanChirho.humanSuggestedTextChirho = normalizeTextForStorageChirho(rowChirho.corrected_text_chirho);
      }
      if (issueFlagsChirho.includes("segmentation-chirho")) spanChirho.badSegmentationChirho = true;
      if (issueFlagsChirho.includes("missing-hebrew-chirho")) spanChirho.needsSourceChirho = true;
    }
    messagePartsChirho.push(
      `reviewed with issue flags=${JSON.stringify(issueFlagsChirho)}${scriptVerdictChirho ? `; set scriptChirho=${scriptVerdictChirho}` : ""}`
    );
  }

  if (applyChirho) {
    spanChirho.humanValidationIdChirho = rowChirho.id_chirho;
    spanChirho.humanValidationVerdictChirho = rowChirho.verdict_chirho;
    spanChirho.humanValidatedAtChirho = appliedAtChirho;
    if (rowChirho.notes_chirho?.trim()) spanChirho.humanValidationNotesChirho = rowChirho.notes_chirho;
    writeSpanLineChirho(filePathChirho, lineChirho);
    updateAppliedStmtChirho.run(appliedAtChirho, filePathChirho, appliedAtChirho, rowChirho.id_chirho);
  }

  return {
    idChirho: rowChirho.id_chirho,
    keyChirho,
    verdictChirho: rowChirho.verdict_chirho,
    statusChirho: applyChirho ? "applied-chirho" : "planned-chirho",
    messageChirho: messagePartsChirho.join("; "),
    filePathChirho,
  };
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const applyChirho = argsChirho.includes("--apply");
  const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? PROGRESS_DB_PATH_CHIRHO;
  const spansDirChirho = parseArgValueChirho(argsChirho, "spans-dir") ?? SPANS_DIR_CHIRHO;
  const backupPathChirho = parseArgValueChirho(argsChirho, "backup-chirho");
  const expectedRowCountChirho = parseNonNegativeIntegerArgChirho(
    parseArgValueChirho(argsChirho, "expected-row-count-chirho"),
    "expected-row-count-chirho"
  );
  const expectedValidationIdsChirho = parseExpectedValidationIdsChirho(argsChirho);
  const dbChirho = new Database(dbPathChirho);
  const columnsChirho = new Set(tableColumnsChirho(dbChirho, "pass_c_human_validations_chirho"));
  const queryChirho = rowQueryChirho(
    argsChirho,
    columnsChirho.has("issue_flags_chirho"),
    columnsChirho.has("script_verdict_chirho"),
    columnsChirho.has("certify_clean_chirho")
  );
  const rowsChirho = dbChirho.query(queryChirho.sqlChirho).all(...queryChirho.paramsChirho) as HumanValidationRowChirho[];
  if (applyChirho) {
    assertApplySelectionGuardChirho(rowsChirho, expectedRowCountChirho, expectedValidationIdsChirho);
  }
  const updateAppliedStmtChirho = dbChirho.prepare(`
    UPDATE pass_c_human_validations_chirho
       SET applied_at_chirho = ?,
           applied_to_file_chirho = ?,
           updated_at_chirho = ?
     WHERE id_chirho = ?`);
  const appliedAtChirho = new Date().toISOString();
  const resultsChirho = rowsChirho.map((rowChirho) =>
    applyRowChirho(rowChirho, spansDirChirho, applyChirho, appliedAtChirho, updateAppliedStmtChirho)
  );
  if (applyChirho) writePassCHumanValidationBackupChirho(dbChirho, backupPathChirho);

  console.log(`[${MODULE_CHIRHO}] mode=${applyChirho ? "apply-chirho" : "dry-run-chirho"} rowCount=${rowsChirho.length}`);
  for (const resultChirho of resultsChirho) {
    console.log(
      `[${resultChirho.statusChirho}] id=${resultChirho.idChirho} key=${resultChirho.keyChirho} ` +
        `verdict=${resultChirho.verdictChirho} ${resultChirho.messageChirho}`
    );
  }
  const errorCountChirho = resultsChirho.filter((resultChirho) => resultChirho.statusChirho === "error-chirho").length;
  if (errorCountChirho > 0) process.exitCode = 1;
}

if (import.meta.main) mainChirho();
