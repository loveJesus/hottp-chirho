// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { join, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-write-lease-chirho";
const DEFAULT_TEMPLATE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "reviewer-deployment-chirho",
  "human-review-vps-write-lease-template-2026-07-02-chirho.json"
);

interface WriteLeaseChirho {
  schema_version_chirho?: unknown;
  completed_chirho?: unknown;
  lease_id_chirho?: unknown;
  recorded_at_chirho?: unknown;
  recorded_by_chirho?: unknown;
  owner_approval_reference_chirho?: unknown;
  writer_host_chirho?: unknown;
  canonical_writer_chirho?: unknown;
  local_writes_paused_chirho?: unknown;
  remote_review_servers_stopped_chirho?: unknown;
  sqlite_checkpoint_or_stop_chirho?: unknown;
  pull_strategy_chirho?: unknown;
  expires_at_chirho?: unknown;
  notes_chirho?: unknown;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | null {
  const prefixChirho = `--${nameChirho}=`;
  const matchChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  return matchChirho === undefined ? null : matchChirho.slice(prefixChirho.length);
}

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function assertProjectPathChirho(pathChirho: string): string {
  const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, pathChirho);
  const rootChirho = resolve(PROJECT_ROOT_CHIRHO);
  if (!(resolvedChirho === rootChirho || resolvedChirho.startsWith(`${rootChirho}${sep}`))) {
    failChirho(`write lease path escapes project root: ${pathChirho}`);
  }
  return resolvedChirho;
}

function readLeaseChirho(pathChirho: string): WriteLeaseChirho {
  const resolvedChirho = pathChirho === DEFAULT_TEMPLATE_PATH_CHIRHO ? pathChirho : assertProjectPathChirho(pathChirho);
  if (!existsSync(resolvedChirho)) failChirho(`write lease file missing: ${pathChirho}`);
  return JSON.parse(readFileSync(resolvedChirho, "utf8")) as WriteLeaseChirho;
}

function recordChirho(valueChirho: unknown, labelChirho: string): Record<string, unknown> {
  if (valueChirho === null || typeof valueChirho !== "object" || Array.isArray(valueChirho)) {
    failChirho(`${labelChirho} must be an object`);
  }
  return valueChirho as Record<string, unknown>;
}

function stringFieldChirho(recordValueChirho: Record<string, unknown>, keyChirho: string, labelChirho: string): string {
  const valueChirho = recordValueChirho[keyChirho];
  if (typeof valueChirho !== "string") failChirho(`${labelChirho}.${keyChirho} must be a string`);
  return valueChirho;
}

function booleanFieldChirho(recordValueChirho: Record<string, unknown>, keyChirho: string, labelChirho: string): boolean {
  const valueChirho = recordValueChirho[keyChirho];
  if (typeof valueChirho !== "boolean") failChirho(`${labelChirho}.${keyChirho} must be a boolean`);
  return valueChirho;
}

function nonPlaceholderChirho(valueChirho: string, labelChirho: string): string {
  const trimmedChirho = valueChirho.trim();
  if (
    trimmedChirho.length === 0 ||
    /\b(?:replace|REVIEW_HOST|YYYY|explicit|metropoliluya-message|chat-reference|pending|todo|tbd)\b/i.test(trimmedChirho)
  ) {
    failChirho(`${labelChirho} is still a placeholder`);
  }
  return trimmedChirho;
}

function assertDateChirho(valueChirho: string, labelChirho: string): number {
  const timestampChirho = Date.parse(valueChirho);
  if (Number.isNaN(timestampChirho)) failChirho(`${labelChirho} must parse as an ISO timestamp`);
  return timestampChirho;
}

function assertShapeChirho(leaseChirho: WriteLeaseChirho): void {
  const rootChirho = recordChirho(leaseChirho, "write lease");
  if (rootChirho.schema_version_chirho !== 1) failChirho("write lease schema_version_chirho must be 1");
  booleanFieldChirho(rootChirho, "completed_chirho", "write lease");
  stringFieldChirho(rootChirho, "lease_id_chirho", "write lease");
  stringFieldChirho(rootChirho, "recorded_at_chirho", "write lease");
  stringFieldChirho(rootChirho, "recorded_by_chirho", "write lease");
  stringFieldChirho(rootChirho, "owner_approval_reference_chirho", "write lease");
  stringFieldChirho(rootChirho, "writer_host_chirho", "write lease");
  stringFieldChirho(rootChirho, "canonical_writer_chirho", "write lease");
  booleanFieldChirho(rootChirho, "local_writes_paused_chirho", "write lease");
  booleanFieldChirho(rootChirho, "remote_review_servers_stopped_chirho", "write lease");
  stringFieldChirho(rootChirho, "sqlite_checkpoint_or_stop_chirho", "write lease");
  stringFieldChirho(rootChirho, "pull_strategy_chirho", "write lease");
  stringFieldChirho(rootChirho, "expires_at_chirho", "write lease");
  stringFieldChirho(rootChirho, "notes_chirho", "write lease");
}

function assertCompletedLeaseChirho(leaseChirho: WriteLeaseChirho, expectedHostChirho: string | null): void {
  const rootChirho = recordChirho(leaseChirho, "write lease");
  if (rootChirho.completed_chirho !== true) failChirho("completed write lease must set completed_chirho=true");
  nonPlaceholderChirho(stringFieldChirho(rootChirho, "lease_id_chirho", "write lease"), "lease_id_chirho");
  nonPlaceholderChirho(stringFieldChirho(rootChirho, "recorded_by_chirho", "write lease"), "recorded_by_chirho");
  nonPlaceholderChirho(
    stringFieldChirho(rootChirho, "owner_approval_reference_chirho", "write lease"),
    "owner_approval_reference_chirho"
  );
  const writerHostChirho = nonPlaceholderChirho(
    stringFieldChirho(rootChirho, "writer_host_chirho", "write lease"),
    "writer_host_chirho"
  );
  if (expectedHostChirho !== null && writerHostChirho !== expectedHostChirho) {
    failChirho(`write lease writer host ${writerHostChirho} does not match pull host ${expectedHostChirho}`);
  }
  if (stringFieldChirho(rootChirho, "canonical_writer_chirho", "write lease") !== "vps-human-review-chirho") {
    failChirho("write lease canonical_writer_chirho must be vps-human-review-chirho");
  }
  if (booleanFieldChirho(rootChirho, "local_writes_paused_chirho", "write lease") !== true) {
    failChirho("write lease must confirm local write-capable review servers are stopped with no listening review ports");
  }
  if (booleanFieldChirho(rootChirho, "remote_review_servers_stopped_chirho", "write lease") !== true) {
    failChirho("write lease must confirm remote review services are stopped before pull-back");
  }
  if (stringFieldChirho(rootChirho, "sqlite_checkpoint_or_stop_chirho", "write lease") !== "stopped-review-servers-chirho") {
    failChirho("write lease sqlite_checkpoint_or_stop_chirho must be stopped-review-servers-chirho");
  }
  if (stringFieldChirho(rootChirho, "pull_strategy_chirho", "write lease") !== "json-replay-with-quarantined-sqlite-chirho") {
    failChirho("write lease pull_strategy_chirho must be json-replay-with-quarantined-sqlite-chirho");
  }
  assertDateChirho(stringFieldChirho(rootChirho, "recorded_at_chirho", "write lease"), "recorded_at_chirho");
  const expiresAtChirho = assertDateChirho(stringFieldChirho(rootChirho, "expires_at_chirho", "write lease"), "expires_at_chirho");
  if (expiresAtChirho < Date.now()) failChirho("write lease has expired");
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const templateOkChirho = argsChirho.includes("--template-ok-chirho");
  const leasePathChirho = parseArgValueChirho(argsChirho, "lease-chirho") ?? DEFAULT_TEMPLATE_PATH_CHIRHO;
  const hostChirho = parseArgValueChirho(argsChirho, "host-chirho");
  const leaseChirho = readLeaseChirho(leasePathChirho);
  assertShapeChirho(leaseChirho);
  if (!templateOkChirho) assertCompletedLeaseChirho(leaseChirho, hostChirho);
  console.log(
    `[${MODULE_CHIRHO}] ${templateOkChirho ? "template shape" : "completed write lease"} passed: ${leasePathChirho}`
  );
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
