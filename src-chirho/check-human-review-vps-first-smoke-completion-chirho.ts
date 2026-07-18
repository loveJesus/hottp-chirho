// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { join, resolve, sep } from "path";
import { Database } from "bun:sqlite";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-first-smoke-completion-chirho";
const DEFAULT_PASS_C_BACKUP_PATH_CHIRHO =
  "spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json";
const QUARANTINE_PROGRESS_DB_PATH_CHIRHO = "backups-chirho/vps-snapshot-progress-chirho.sqlite";
const SOURCE_LOCAL_FIXTURE_DIR_FRAGMENT_CHIRHO =
  "spec-chirho/reviewer-deployment-chirho/.tmp-phase6-completion-fixture-chirho/";

interface ProvisioningDecisionChirho {
  selected_host_chirho?: {
    host_name_chirho?: unknown;
    host_address_chirho?: unknown;
  };
  dns_plan_chirho?: {
    raw_review_hostname_chirho?: unknown;
  };
}

interface SmokeEvidenceChirho {
  host_chirho?: unknown;
  review_station_chirho?: unknown;
  authenticated_url_chirho?: unknown;
  network_boundary_chirho?: {
    public_direct_port_chirho?: unknown;
  };
  write_smoke_chirho?: {
    action_chirho?: unknown;
    item_id_chirho?: unknown;
    validation_id_chirho?: unknown;
    undo_validation_id_chirho?: unknown;
    expected_reviewer_chirho?: unknown;
    saved_after_chirho?: unknown;
    saved_before_chirho?: unknown;
    final_state_chirho?: unknown;
  };
}

interface PassCBackupReviewChirho {
  dbIdChirho?: unknown;
  volumeChirho?: unknown;
  pageChirho?: unknown;
  lineIndexChirho?: unknown;
  segmentIndexChirho?: unknown;
  verdictChirho?: unknown;
  reviewerChirho?: unknown;
  createdAtChirho?: unknown;
  updatedAtChirho?: unknown;
}

interface PassCBackupChirho {
  reviewsChirho?: unknown;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | null {
  const prefixChirho = `--${nameChirho}=`;
  const matchChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  return matchChirho === undefined ? null : matchChirho.slice(prefixChirho.length);
}

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function projectPathChirho(pathChirho: string, labelChirho: string): string {
  const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, pathChirho);
  const rootChirho = resolve(PROJECT_ROOT_CHIRHO);
  if (!(resolvedChirho === rootChirho || resolvedChirho.startsWith(`${rootChirho}${sep}`))) {
    failChirho(`${labelChirho} escapes project root: ${pathChirho}`);
  }
  if (!existsSync(resolvedChirho)) failChirho(`${labelChirho} missing: ${pathChirho}`);
  return resolvedChirho;
}

function projectExistingOrFixturePathChirho(pathChirho: string, labelChirho: string): string {
  const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, pathChirho);
  const rootChirho = resolve(PROJECT_ROOT_CHIRHO);
  if (!(resolvedChirho === rootChirho || resolvedChirho.startsWith(`${rootChirho}${sep}`))) {
    failChirho(`${labelChirho} escapes project root: ${pathChirho}`);
  }
  if (!existsSync(resolvedChirho)) failChirho(`${labelChirho} missing: ${pathChirho}`);
  if (
    pathChirho !== QUARANTINE_PROGRESS_DB_PATH_CHIRHO &&
    !pathChirho.includes(SOURCE_LOCAL_FIXTURE_DIR_FRAGMENT_CHIRHO)
  ) {
    failChirho(`${labelChirho} must be the default quarantine DB or a Phase 6 fixture DB`);
  }
  return resolvedChirho;
}

function stringValueChirho(valueChirho: unknown, labelChirho: string): string {
  if (typeof valueChirho !== "string" || valueChirho.trim().length === 0) {
    failChirho(`${labelChirho} must be a non-empty string`);
  }
  return valueChirho.trim();
}

function runVerifierChirho(commandChirho: string[]): void {
  const resultChirho = Bun.spawnSync(commandChirho, {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    failChirho(`verifier failed: ${commandChirho.join(" ")}`);
  }
}

function readJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function numberValueChirho(valueChirho: unknown, labelChirho: string): number {
  if (typeof valueChirho !== "number" || !Number.isFinite(valueChirho)) {
    failChirho(`${labelChirho} must be a finite number`);
  }
  return valueChirho;
}

function optionalNumberValueChirho(valueChirho: unknown, labelChirho: string): number | null {
  if (valueChirho === undefined || valueChirho === null) return null;
  return numberValueChirho(valueChirho, labelChirho);
}

function rawItemIdChirho(reviewChirho: PassCBackupReviewChirho): string {
  return [
    numberValueChirho(reviewChirho.volumeChirho, "backup volume"),
    numberValueChirho(reviewChirho.pageChirho, "backup page"),
    numberValueChirho(reviewChirho.lineIndexChirho, "backup line"),
    numberValueChirho(reviewChirho.segmentIndexChirho, "backup segment"),
  ].join(":");
}

interface SmokeHistoryRowChirho {
  id_chirho: number;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  verdict_chirho: string;
  reviewer_chirho: string;
  updated_at_chirho: string;
  is_current_chirho: number;
  supersedes_id_chirho: number | null;
}

function rawHistoryItemIdChirho(rowChirho: SmokeHistoryRowChirho): string {
  return [
    rowChirho.volume_chirho,
    rowChirho.page_chirho,
    rowChirho.line_index_chirho,
    rowChirho.segment_index_chirho,
  ].join(":");
}

function assertSmokeHistoryRowCommonChirho(paramsChirho: {
  rowChirho: SmokeHistoryRowChirho | null;
  validationIdChirho: number;
  itemIdChirho: string;
  expectedReviewerChirho: string;
  expectedActionChirho: string;
  savedAfterChirho: number;
  savedBeforeChirho: number;
}): SmokeHistoryRowChirho {
  const rowChirho = paramsChirho.rowChirho;
  if (rowChirho === null) failChirho(`quarantined DB lacks smoke validation id ${paramsChirho.validationIdChirho}`);
  if (rowChirho.verdict_chirho !== paramsChirho.expectedActionChirho) {
    failChirho("quarantined DB smoke row verdict does not match evidence action");
  }
  if (rowChirho.reviewer_chirho !== paramsChirho.expectedReviewerChirho) {
    failChirho("quarantined DB smoke row reviewer does not match gateway identity evidence");
  }
  if (rawHistoryItemIdChirho(rowChirho) !== paramsChirho.itemIdChirho) {
    failChirho("quarantined DB smoke row item id does not match evidence item id");
  }
  const rowUpdatedAtChirho = Date.parse(rowChirho.updated_at_chirho);
  if (
    Number.isNaN(rowUpdatedAtChirho) ||
    rowUpdatedAtChirho < paramsChirho.savedAfterChirho ||
    rowUpdatedAtChirho > paramsChirho.savedBeforeChirho
  ) {
    failChirho("quarantined DB smoke row updatedAt is outside the evidence time window");
  }
  return rowChirho;
}

function assertSmokeRowBackedByQuarantinedHistoryChirho(
  evidenceChirho: SmokeEvidenceChirho,
  quarantineDbPathChirho: string,
  backupPathChirho: string
): void {
  const writeChirho = evidenceChirho.write_smoke_chirho;
  if (writeChirho === undefined) failChirho("smoke evidence lacks write_smoke_chirho");
  const validationIdChirho = numberValueChirho(writeChirho.validation_id_chirho, "write smoke validation id");
  const undoValidationIdChirho = optionalNumberValueChirho(
    writeChirho.undo_validation_id_chirho,
    "write smoke undo validation id"
  );
  if (undoValidationIdChirho === null) {
    failChirho("undone write smoke evidence must record undo_validation_id_chirho");
  }
  const itemIdChirho = stringValueChirho(writeChirho.item_id_chirho, "write smoke item id");
  const expectedReviewerChirho = stringValueChirho(writeChirho.expected_reviewer_chirho, "write smoke expected reviewer");
  const expectedActionChirho = stringValueChirho(writeChirho.action_chirho, "write smoke action");
  const savedAfterChirho = Date.parse(stringValueChirho(writeChirho.saved_after_chirho, "write smoke saved_after"));
  const savedBeforeChirho = Date.parse(stringValueChirho(writeChirho.saved_before_chirho, "write smoke saved_before"));
  if (Number.isNaN(savedAfterChirho) || Number.isNaN(savedBeforeChirho) || savedAfterChirho > savedBeforeChirho) {
    failChirho("write smoke saved time window is invalid");
  }
  const dbChirho = new Database(quarantineDbPathChirho, { readonly: true });
  try {
    const validationStmtChirho = dbChirho.query(`
      SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
             verdict_chirho, reviewer_chirho, updated_at_chirho, is_current_chirho, supersedes_id_chirho
        FROM pass_c_human_validations_chirho
       WHERE id_chirho = ?`);
    const rowChirho = assertSmokeHistoryRowCommonChirho({
      rowChirho: validationStmtChirho.get(validationIdChirho) as SmokeHistoryRowChirho | null,
      validationIdChirho,
      itemIdChirho,
      expectedReviewerChirho,
      expectedActionChirho,
      savedAfterChirho,
      savedBeforeChirho,
    });
    if (rowChirho.is_current_chirho !== 0) {
      failChirho("undone smoke row must not be current in the quarantined DB");
    }
    const undoRowChirho = validationStmtChirho.get(undoValidationIdChirho) as SmokeHistoryRowChirho | null;
    if (undoRowChirho === null) failChirho(`quarantined DB lacks smoke undo validation id ${undoValidationIdChirho}`);
    if (undoRowChirho.verdict_chirho !== "undo-chirho") failChirho("smoke undo row must have verdict undo-chirho");
    if (undoRowChirho.reviewer_chirho !== expectedReviewerChirho) {
      failChirho("smoke undo row reviewer does not match gateway identity evidence");
    }
    if (rawHistoryItemIdChirho(undoRowChirho) !== itemIdChirho) {
      failChirho("smoke undo row item id does not match evidence item id");
    }
    if (undoRowChirho.supersedes_id_chirho !== validationIdChirho) {
      failChirho("smoke undo row does not supersede the smoke write row");
    }
    if (undoRowChirho.is_current_chirho !== 1) {
      failChirho("smoke undo row must be current in the quarantined DB after restore");
    }
  } finally {
    dbChirho.close();
  }
  const backupChirho = readJsonChirho<PassCBackupChirho>(backupPathChirho);
  if (!Array.isArray(backupChirho.reviewsChirho)) failChirho("Pass-C backup reviewsChirho must be an array");
  const rowsChirho = backupChirho.reviewsChirho as PassCBackupReviewChirho[];
  if (rowsChirho.some((candidateChirho) => candidateChirho.dbIdChirho === validationIdChirho)) {
    failChirho("undone smoke row must not remain in the current Pass-C backup");
  }
}

function assertSmokeRowBackedByPassCBackupChirho(evidenceChirho: SmokeEvidenceChirho, backupPathChirho: string): void {
  const backupChirho = readJsonChirho<PassCBackupChirho>(backupPathChirho);
  if (!Array.isArray(backupChirho.reviewsChirho)) failChirho("Pass-C backup reviewsChirho must be an array");
  const writeChirho = evidenceChirho.write_smoke_chirho;
  if (writeChirho === undefined) failChirho("smoke evidence lacks write_smoke_chirho");
  const validationIdChirho = numberValueChirho(writeChirho.validation_id_chirho, "write smoke validation id");
  const itemIdChirho = stringValueChirho(writeChirho.item_id_chirho, "write smoke item id");
  const expectedReviewerChirho = stringValueChirho(writeChirho.expected_reviewer_chirho, "write smoke expected reviewer");
  const expectedActionChirho = stringValueChirho(writeChirho.action_chirho, "write smoke action");
  const savedAfterChirho = Date.parse(stringValueChirho(writeChirho.saved_after_chirho, "write smoke saved_after"));
  const savedBeforeChirho = Date.parse(stringValueChirho(writeChirho.saved_before_chirho, "write smoke saved_before"));
  if (Number.isNaN(savedAfterChirho) || Number.isNaN(savedBeforeChirho) || savedAfterChirho > savedBeforeChirho) {
    failChirho("write smoke saved time window is invalid");
  }
  const rowsChirho = backupChirho.reviewsChirho as PassCBackupReviewChirho[];
  const rowChirho = rowsChirho.find((candidateChirho) => candidateChirho.dbIdChirho === validationIdChirho);
  if (rowChirho === undefined) failChirho(`Pass-C backup lacks smoke validation id ${validationIdChirho}`);
  if (stringValueChirho(rowChirho.verdictChirho, "backup verdict") !== expectedActionChirho) {
    failChirho("Pass-C backup smoke row verdict does not match evidence action");
  }
  if (stringValueChirho(rowChirho.reviewerChirho, "backup reviewer") !== expectedReviewerChirho) {
    failChirho("Pass-C backup smoke row reviewer does not match gateway identity evidence");
  }
  if (rawItemIdChirho(rowChirho) !== itemIdChirho) {
    failChirho("Pass-C backup smoke row item id does not match evidence item id");
  }
  const rowUpdatedAtChirho = Date.parse(stringValueChirho(rowChirho.updatedAtChirho, "backup updatedAt"));
  if (Number.isNaN(rowUpdatedAtChirho) || rowUpdatedAtChirho < savedAfterChirho || rowUpdatedAtChirho > savedBeforeChirho) {
    failChirho("Pass-C backup smoke row updatedAt is outside the evidence time window");
  }
}

function assertSmokeRowBackingChirho(
  evidenceChirho: SmokeEvidenceChirho,
  backupPathChirho: string,
  quarantineDbPathChirho: string
): void {
  const writeChirho = evidenceChirho.write_smoke_chirho;
  if (writeChirho === undefined) failChirho("smoke evidence lacks write_smoke_chirho");
  const finalStateChirho =
    typeof writeChirho.final_state_chirho === "string" ? writeChirho.final_state_chirho : "current-row-chirho";
  if (finalStateChirho === "current-row-chirho") {
    assertSmokeRowBackedByPassCBackupChirho(evidenceChirho, backupPathChirho);
    return;
  }
  if (finalStateChirho === "undone-chirho") {
    assertSmokeRowBackedByQuarantinedHistoryChirho(evidenceChirho, quarantineDbPathChirho, backupPathChirho);
    return;
  }
  failChirho(`unsupported write smoke final_state_chirho: ${finalStateChirho}`);
}

function assertCrossEvidenceChirho(
  decisionPathChirho: string,
  evidencePathChirho: string,
  backupPathChirho: string,
  quarantineDbPathChirho: string
): void {
  const decisionChirho = readJsonChirho<ProvisioningDecisionChirho>(decisionPathChirho);
  const evidenceChirho = readJsonChirho<SmokeEvidenceChirho>(evidencePathChirho);
  const hostNameChirho = stringValueChirho(decisionChirho.selected_host_chirho?.host_name_chirho, "selected host name");
  const hostAddressChirho = stringValueChirho(decisionChirho.selected_host_chirho?.host_address_chirho, "selected host address");
  const smokeHostChirho = stringValueChirho(evidenceChirho.host_chirho, "smoke host");
  if (smokeHostChirho !== hostNameChirho && smokeHostChirho !== hostAddressChirho) {
    failChirho(`smoke host ${smokeHostChirho} does not match selected host name or address`);
  }
  const stationChirho = stringValueChirho(evidenceChirho.review_station_chirho, "review station");
  if (stationChirho !== "raw-hebrew-chirho") {
    failChirho("first VPS smoke completion must use raw-hebrew-chirho before later stations are added");
  }
  const rawHostChirho = stringValueChirho(decisionChirho.dns_plan_chirho?.raw_review_hostname_chirho, "raw review hostname");
  const smokeUrlChirho = new URL(stringValueChirho(evidenceChirho.authenticated_url_chirho, "authenticated URL"));
  if (smokeUrlChirho.hostname !== rawHostChirho) {
    failChirho(`smoke URL host ${smokeUrlChirho.hostname} does not match raw review hostname ${rawHostChirho}`);
  }
  const directPortChirho = evidenceChirho.network_boundary_chirho?.public_direct_port_chirho;
  if (directPortChirho !== 8766) {
    failChirho("first VPS smoke must prove direct public port 8766 is blocked");
  }
  assertSmokeRowBackingChirho(evidenceChirho, backupPathChirho, quarantineDbPathChirho);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const decisionArgChirho = parseArgValueChirho(argsChirho, "decision-chirho");
  const evidenceArgChirho = parseArgValueChirho(argsChirho, "evidence-chirho");
  const backupArgChirho = parseArgValueChirho(argsChirho, "pass-c-backup-chirho") ?? DEFAULT_PASS_C_BACKUP_PATH_CHIRHO;
  const liveProbeChirho = argsChirho.includes("--live-probe-chirho");
  const quarantineDbArgChirho = parseArgValueChirho(argsChirho, "source-local-fixture-quarantine-db-chirho");
  if (decisionArgChirho === null || evidenceArgChirho === null) {
    failChirho("requires --decision-chirho=... and --evidence-chirho=...");
  }
  const decisionPathChirho = projectPathChirho(decisionArgChirho, "provisioning decision");
  const evidencePathChirho = projectPathChirho(evidenceArgChirho, "smoke evidence");
  const backupPathChirho = projectPathChirho(backupArgChirho, "Pass-C human validation backup");
  const quarantineDbPathChirho = projectExistingOrFixturePathChirho(
    quarantineDbArgChirho ?? QUARANTINE_PROGRESS_DB_PATH_CHIRHO,
    "quarantined progress DB"
  );
  runVerifierChirho([
    "bun",
    "run",
    "src-chirho/check-human-review-vps-provisioning-decision-chirho.ts",
    `--decision-chirho=${decisionArgChirho}`,
  ]);
  const smokeEvidenceVerifierCommandChirho = [
    "bun",
    "run",
    "src-chirho/check-human-review-vps-smoke-evidence-chirho.ts",
    `--evidence-chirho=${evidenceArgChirho}`,
  ];
  if (liveProbeChirho) smokeEvidenceVerifierCommandChirho.push("--live-probe-chirho");
  if (quarantineDbArgChirho !== null) {
    smokeEvidenceVerifierCommandChirho.push(`--source-local-fixture-quarantine-db-chirho=${quarantineDbArgChirho}`);
  }
  runVerifierChirho(smokeEvidenceVerifierCommandChirho);
  assertCrossEvidenceChirho(decisionPathChirho, evidencePathChirho, backupPathChirho, quarantineDbPathChirho);
  console.log(`[${MODULE_CHIRHO}] first VPS smoke completion evidence passed`);
}

if (import.meta.main) {
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
