// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-first-smoke-completion-chirho";
const DEFAULT_PASS_C_BACKUP_PATH_CHIRHO =
  "spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json";

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
    expected_reviewer_chirho?: unknown;
    saved_after_chirho?: unknown;
    saved_before_chirho?: unknown;
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

function rawItemIdChirho(reviewChirho: PassCBackupReviewChirho): string {
  return [
    numberValueChirho(reviewChirho.volumeChirho, "backup volume"),
    numberValueChirho(reviewChirho.pageChirho, "backup page"),
    numberValueChirho(reviewChirho.lineIndexChirho, "backup line"),
    numberValueChirho(reviewChirho.segmentIndexChirho, "backup segment"),
  ].join(":");
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

function assertCrossEvidenceChirho(decisionPathChirho: string, evidencePathChirho: string, backupPathChirho: string): void {
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
  assertSmokeRowBackedByPassCBackupChirho(evidenceChirho, backupPathChirho);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const decisionArgChirho = parseArgValueChirho(argsChirho, "decision-chirho");
  const evidenceArgChirho = parseArgValueChirho(argsChirho, "evidence-chirho");
  const backupArgChirho = parseArgValueChirho(argsChirho, "pass-c-backup-chirho") ?? DEFAULT_PASS_C_BACKUP_PATH_CHIRHO;
  const liveProbeChirho = argsChirho.includes("--live-probe-chirho");
  if (decisionArgChirho === null || evidenceArgChirho === null) {
    failChirho("requires --decision-chirho=... and --evidence-chirho=...");
  }
  const decisionPathChirho = projectPathChirho(decisionArgChirho, "provisioning decision");
  const evidencePathChirho = projectPathChirho(evidenceArgChirho, "smoke evidence");
  const backupPathChirho = projectPathChirho(backupArgChirho, "Pass-C human validation backup");
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
  runVerifierChirho(smokeEvidenceVerifierCommandChirho);
  assertCrossEvidenceChirho(decisionPathChirho, evidencePathChirho, backupPathChirho);
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
