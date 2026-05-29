// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Apply append-only Pass C human validation verdicts back to span JSON files.
 *
 * Defaults to dry-run. Use --apply to write span files and stamp applied_at.
 */

import { Database } from "bun:sqlite";
import { createHash as createHashChirho } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "apply-pass-c-human-validations-chirho";
const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");

interface HumanValidationRowChirho {
  id_chirho: number;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  original_text_chirho: string;
  original_text_hash_chirho: string;
  verdict_chirho: string;
  corrected_text_chirho: string | null;
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

function hashTextChirho(textChirho: string): string {
  return createHashChirho("sha256").update(textChirho, "utf8").digest("hex");
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
  writeFileSync(pathChirho, `${JSON.stringify(lineChirho, null, 2)}\n`);
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): string[] {
  return (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
    (rowChirho) => rowChirho.name
  );
}

function rowQueryChirho(
  argsChirho: string[],
  hasIssueFlagsColumnChirho: boolean
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
             corrected_text_chirho,
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
  if (rowChirho.verdict_chirho === "reviewed-clean-chirho") {
    if (applyChirho) {
      spanChirho.provenanceChirho = "human-chirho";
      spanChirho.humanReviewStatusChirho = rowChirho.verdict_chirho;
      spanChirho.humanIssueFlagsChirho = [];
      spanChirho.needsSourceChirho = false;
      spanChirho.badSegmentationChirho = false;
    }
    messagePartsChirho.push("reviewed clean; stamp provenanceChirho=human-chirho");
  } else if (rowChirho.verdict_chirho === "reviewed-issues-chirho") {
    if (applyChirho) {
      spanChirho.humanReviewStatusChirho = rowChirho.verdict_chirho;
      spanChirho.humanIssueFlagsChirho = issueFlagsChirho;
      if (rowChirho.corrected_text_chirho?.trim()) spanChirho.humanSuggestedTextChirho = rowChirho.corrected_text_chirho;
      if (issueFlagsChirho.includes("segmentation-chirho")) spanChirho.badSegmentationChirho = true;
      if (issueFlagsChirho.includes("missing-hebrew-chirho")) spanChirho.needsSourceChirho = true;
    }
    messagePartsChirho.push(`reviewed with issue flags=${JSON.stringify(issueFlagsChirho)}`);
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
  const dbChirho = new Database(dbPathChirho);
  const columnsChirho = new Set(tableColumnsChirho(dbChirho, "pass_c_human_validations_chirho"));
  const queryChirho = rowQueryChirho(argsChirho, columnsChirho.has("issue_flags_chirho"));
  const rowsChirho = dbChirho.query(queryChirho.sqlChirho).all(...queryChirho.paramsChirho) as HumanValidationRowChirho[];
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
