// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { join, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-smoke-evidence-chirho";
const DEFAULT_TEMPLATE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "reviewer-deployment-chirho",
  "human-review-vps-smoke-evidence-template-2026-07-02-chirho.json"
);

const REVIEW_STATIONS_CHIRHO = new Set(["raw-hebrew-chirho", "latin-symbol-chirho", "expert-non-latin-chirho"]);
const TRUSTED_HEADERS_CHIRHO = new Set(["X-Webauth-User", "Cf-Access-Authenticated-User-Email"]);
const REQUIRED_COMMIT_BACK_GUARDS_CHIRHO = [
  "bun run check-pass-c-human-review-server-guards-chirho",
  "bun run transcription-certification-status-chirho",
  "bun run check-certification-strict-status-chirho",
] as const;

interface SmokeEvidenceChirho {
  schema_version_chirho?: unknown;
  completed_chirho?: unknown;
  evidence_id_chirho?: unknown;
  recorded_at_chirho?: unknown;
  recorded_by_chirho?: unknown;
  host_chirho?: unknown;
  review_station_chirho?: unknown;
  authenticated_url_chirho?: unknown;
  trusted_header_chirho?: unknown;
  server_health_chirho?: unknown;
  network_boundary_chirho?: unknown;
  browser_smoke_chirho?: unknown;
  write_smoke_chirho?: unknown;
  commit_back_chirho?: unknown;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | null {
  const prefixChirho = `--${nameChirho}=`;
  const matchChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  return matchChirho === undefined ? null : matchChirho.slice(prefixChirho.length);
}

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function recordChirho(valueChirho: unknown, labelChirho: string): Record<string, unknown> {
  if (valueChirho === null || typeof valueChirho !== "object" || Array.isArray(valueChirho)) {
    failChirho(`${labelChirho} must be an object`);
  }
  return valueChirho as Record<string, unknown>;
}

function stringFieldChirho(recordValueChirho: Record<string, unknown>, keyChirho: string, labelChirho: string): string {
  const valueChirho = recordValueChirho[keyChirho];
  if (typeof valueChirho !== "string") {
    failChirho(`${labelChirho}.${keyChirho} must be a string`);
  }
  return valueChirho;
}

function booleanFieldChirho(recordValueChirho: Record<string, unknown>, keyChirho: string, labelChirho: string): boolean {
  const valueChirho = recordValueChirho[keyChirho];
  if (typeof valueChirho !== "boolean") {
    failChirho(`${labelChirho}.${keyChirho} must be a boolean`);
  }
  return valueChirho;
}

function numberFieldChirho(recordValueChirho: Record<string, unknown>, keyChirho: string, labelChirho: string): number {
  const valueChirho = recordValueChirho[keyChirho];
  if (typeof valueChirho !== "number" || !Number.isFinite(valueChirho)) {
    failChirho(`${labelChirho}.${keyChirho} must be a finite number`);
  }
  return valueChirho;
}

function stringArrayFieldChirho(recordValueChirho: Record<string, unknown>, keyChirho: string, labelChirho: string): string[] {
  const valueChirho = recordValueChirho[keyChirho];
  if (!Array.isArray(valueChirho) || !valueChirho.every((itemChirho) => typeof itemChirho === "string")) {
    failChirho(`${labelChirho}.${keyChirho} must be a string array`);
  }
  return valueChirho;
}

function nonPlaceholderChirho(valueChirho: string, labelChirho: string): string {
  const trimmedChirho = valueChirho.trim();
  if (
    trimmedChirho.length === 0 ||
    /\b(?:replace|example|REVIEW_HOST|YYYY|explicit-human-or-agent-id|gateway-authenticated-reviewer)\b/i.test(trimmedChirho)
  ) {
    failChirho(`${labelChirho} is still a placeholder`);
  }
  return trimmedChirho;
}

function assertProjectPathChirho(pathChirho: string): string {
  const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, pathChirho);
  const rootChirho = resolve(PROJECT_ROOT_CHIRHO);
  if (!(resolvedChirho === rootChirho || resolvedChirho.startsWith(`${rootChirho}${sep}`))) {
    failChirho(`evidence path escapes project root: ${pathChirho}`);
  }
  return resolvedChirho;
}

function readEvidenceChirho(pathChirho: string): SmokeEvidenceChirho {
  const resolvedChirho = pathChirho === DEFAULT_TEMPLATE_PATH_CHIRHO ? pathChirho : assertProjectPathChirho(pathChirho);
  if (!existsSync(resolvedChirho)) {
    failChirho(`smoke evidence file missing: ${pathChirho}`);
  }
  return JSON.parse(readFileSync(resolvedChirho, "utf8")) as SmokeEvidenceChirho;
}

function assertShapeChirho(evidenceChirho: SmokeEvidenceChirho): void {
  const rootChirho = recordChirho(evidenceChirho, "evidence");
  if (rootChirho.schema_version_chirho !== 1) failChirho("evidence.schema_version_chirho must be 1");
  booleanFieldChirho(rootChirho, "completed_chirho", "evidence");
  stringFieldChirho(rootChirho, "evidence_id_chirho", "evidence");
  stringFieldChirho(rootChirho, "recorded_at_chirho", "evidence");
  stringFieldChirho(rootChirho, "recorded_by_chirho", "evidence");
  stringFieldChirho(rootChirho, "host_chirho", "evidence");
  const stationChirho = stringFieldChirho(rootChirho, "review_station_chirho", "evidence");
  if (!REVIEW_STATIONS_CHIRHO.has(stationChirho)) failChirho(`unsupported review station: ${stationChirho}`);
  stringFieldChirho(rootChirho, "authenticated_url_chirho", "evidence");
  const trustedHeaderChirho = stringFieldChirho(rootChirho, "trusted_header_chirho", "evidence");
  if (!TRUSTED_HEADERS_CHIRHO.has(trustedHeaderChirho)) failChirho(`unsupported trusted header: ${trustedHeaderChirho}`);
  const healthChirho = recordChirho(rootChirho.server_health_chirho, "server_health_chirho");
  booleanFieldChirho(healthChirho, "localhost_health_ok_chirho", "server_health_chirho");
  stringFieldChirho(healthChirho, "source_fingerprint_chirho", "server_health_chirho");
  numberFieldChirho(healthChirho, "source_file_count_chirho", "server_health_chirho");
  const boundaryChirho = recordChirho(rootChirho.network_boundary_chirho, "network_boundary_chirho");
  numberFieldChirho(boundaryChirho, "public_direct_port_chirho", "network_boundary_chirho");
  booleanFieldChirho(boundaryChirho, "public_direct_port_blocked_chirho", "network_boundary_chirho");
  booleanFieldChirho(boundaryChirho, "proxy_tls_ok_chirho", "network_boundary_chirho");
  booleanFieldChirho(boundaryChirho, "trusted_header_injected_chirho", "network_boundary_chirho");
  const browserChirho = recordChirho(rootChirho.browser_smoke_chirho, "browser_smoke_chirho");
  stringFieldChirho(browserChirho, "page_title_chirho", "browser_smoke_chirho");
  booleanFieldChirho(browserChirho, "target_crop_visible_chirho", "browser_smoke_chirho");
  booleanFieldChirho(browserChirho, "full_line_visible_chirho", "browser_smoke_chirho");
  booleanFieldChirho(browserChirho, "issue_flags_visible_chirho", "browser_smoke_chirho");
  booleanFieldChirho(browserChirho, "clean_ack_visible_chirho", "browser_smoke_chirho");
  booleanFieldChirho(browserChirho, "segment_repair_panel_visible_chirho", "browser_smoke_chirho");
  stringFieldChirho(browserChirho, "item_id_chirho", "browser_smoke_chirho");
  const writeChirho = recordChirho(rootChirho.write_smoke_chirho, "write_smoke_chirho");
  booleanFieldChirho(writeChirho, "performed_chirho", "write_smoke_chirho");
  stringFieldChirho(writeChirho, "action_chirho", "write_smoke_chirho");
  stringFieldChirho(writeChirho, "item_id_chirho", "write_smoke_chirho");
  numberFieldChirho(writeChirho, "validation_id_chirho", "write_smoke_chirho");
  stringFieldChirho(writeChirho, "expected_reviewer_chirho", "write_smoke_chirho");
  stringFieldChirho(writeChirho, "saved_after_chirho", "write_smoke_chirho");
  stringFieldChirho(writeChirho, "saved_before_chirho", "write_smoke_chirho");
  booleanFieldChirho(writeChirho, "reversible_chirho", "write_smoke_chirho");
  stringFieldChirho(writeChirho, "notes_chirho", "write_smoke_chirho");
  const commitBackChirho = recordChirho(rootChirho.commit_back_chirho, "commit_back_chirho");
  booleanFieldChirho(commitBackChirho, "db_copied_back_chirho", "commit_back_chirho");
  booleanFieldChirho(commitBackChirho, "backup_or_proposal_copied_back_chirho", "commit_back_chirho");
  stringArrayFieldChirho(commitBackChirho, "guards_passed_chirho", "commit_back_chirho");
  booleanFieldChirho(commitBackChirho, "git_status_reviewed_chirho", "commit_back_chirho");
  booleanFieldChirho(commitBackChirho, "restore_test_passed_chirho", "commit_back_chirho");
  booleanFieldChirho(commitBackChirho, "committed_or_restored_chirho", "commit_back_chirho");
}

function assertCompletedEvidenceChirho(evidenceChirho: SmokeEvidenceChirho): void {
  const rootChirho = recordChirho(evidenceChirho, "evidence");
  if (rootChirho.completed_chirho !== true) failChirho("completed smoke evidence must set completed_chirho=true");
  nonPlaceholderChirho(stringFieldChirho(rootChirho, "evidence_id_chirho", "evidence"), "evidence_id_chirho");
  nonPlaceholderChirho(stringFieldChirho(rootChirho, "recorded_by_chirho", "evidence"), "recorded_by_chirho");
  nonPlaceholderChirho(stringFieldChirho(rootChirho, "host_chirho", "evidence"), "host_chirho");
  const recordedAtChirho = stringFieldChirho(rootChirho, "recorded_at_chirho", "evidence");
  if (Number.isNaN(Date.parse(recordedAtChirho))) failChirho("recorded_at_chirho must parse as a date");
  const authenticatedUrlChirho = new URL(stringFieldChirho(rootChirho, "authenticated_url_chirho", "evidence"));
  if (authenticatedUrlChirho.protocol !== "https:") failChirho("authenticated_url_chirho must be https");
  const healthChirho = recordChirho(rootChirho.server_health_chirho, "server_health_chirho");
  if (booleanFieldChirho(healthChirho, "localhost_health_ok_chirho", "server_health_chirho") !== true) {
    failChirho("localhost health must be proven true");
  }
  nonPlaceholderChirho(stringFieldChirho(healthChirho, "source_fingerprint_chirho", "server_health_chirho"), "source_fingerprint_chirho");
  if (numberFieldChirho(healthChirho, "source_file_count_chirho", "server_health_chirho") <= 0) {
    failChirho("source_file_count_chirho must be positive");
  }
  const boundaryChirho = recordChirho(rootChirho.network_boundary_chirho, "network_boundary_chirho");
  if (booleanFieldChirho(boundaryChirho, "public_direct_port_blocked_chirho", "network_boundary_chirho") !== true) {
    failChirho("public direct port must be blocked");
  }
  if (booleanFieldChirho(boundaryChirho, "proxy_tls_ok_chirho", "network_boundary_chirho") !== true) {
    failChirho("proxy TLS must be proven OK");
  }
  if (booleanFieldChirho(boundaryChirho, "trusted_header_injected_chirho", "network_boundary_chirho") !== true) {
    failChirho("trusted header injection must be proven");
  }
  const browserChirho = recordChirho(rootChirho.browser_smoke_chirho, "browser_smoke_chirho");
  if (!stringFieldChirho(browserChirho, "page_title_chirho", "browser_smoke_chirho").includes("Pass C Hebrew Validation")) {
    failChirho("first smoke must prove the raw Hebrew review page loaded");
  }
  for (const keyChirho of [
    "target_crop_visible_chirho",
    "full_line_visible_chirho",
    "issue_flags_visible_chirho",
    "clean_ack_visible_chirho",
    "segment_repair_panel_visible_chirho",
  ]) {
    if (booleanFieldChirho(browserChirho, keyChirho, "browser_smoke_chirho") !== true) {
      failChirho(`browser smoke did not prove ${keyChirho}`);
    }
  }
  nonPlaceholderChirho(stringFieldChirho(browserChirho, "item_id_chirho", "browser_smoke_chirho"), "browser item id");
  const writeChirho = recordChirho(rootChirho.write_smoke_chirho, "write_smoke_chirho");
  if (booleanFieldChirho(writeChirho, "performed_chirho", "write_smoke_chirho") !== true) {
    failChirho("write smoke must perform a harmless reversible write");
  }
  if (stringFieldChirho(writeChirho, "action_chirho", "write_smoke_chirho") !== "reviewed-issues-chirho") {
    failChirho("first write smoke must be a reviewed-issues row, not a clean certification");
  }
  if (booleanFieldChirho(writeChirho, "reversible_chirho", "write_smoke_chirho") !== true) {
    failChirho("write smoke must be reversible");
  }
  nonPlaceholderChirho(stringFieldChirho(writeChirho, "item_id_chirho", "write_smoke_chirho"), "write smoke item id");
  if (numberFieldChirho(writeChirho, "validation_id_chirho", "write_smoke_chirho") <= 0) {
    failChirho("write smoke validation_id_chirho must be positive");
  }
  nonPlaceholderChirho(
    stringFieldChirho(writeChirho, "expected_reviewer_chirho", "write_smoke_chirho"),
    "write smoke expected reviewer"
  );
  const savedAfterChirho = stringFieldChirho(writeChirho, "saved_after_chirho", "write_smoke_chirho");
  const savedBeforeChirho = stringFieldChirho(writeChirho, "saved_before_chirho", "write_smoke_chirho");
  if (Number.isNaN(Date.parse(savedAfterChirho))) failChirho("write smoke saved_after_chirho must parse as a date");
  if (Number.isNaN(Date.parse(savedBeforeChirho))) failChirho("write smoke saved_before_chirho must parse as a date");
  if (Date.parse(savedAfterChirho) > Date.parse(savedBeforeChirho)) {
    failChirho("write smoke saved_after_chirho must be <= saved_before_chirho");
  }
  const commitBackChirho = recordChirho(rootChirho.commit_back_chirho, "commit_back_chirho");
  for (const keyChirho of [
    "db_copied_back_chirho",
    "backup_or_proposal_copied_back_chirho",
    "git_status_reviewed_chirho",
    "restore_test_passed_chirho",
    "committed_or_restored_chirho",
  ]) {
    if (booleanFieldChirho(commitBackChirho, keyChirho, "commit_back_chirho") !== true) {
      failChirho(`commit-back proof missing ${keyChirho}`);
    }
  }
  const guardsChirho = new Set(stringArrayFieldChirho(commitBackChirho, "guards_passed_chirho", "commit_back_chirho"));
  for (const guardChirho of REQUIRED_COMMIT_BACK_GUARDS_CHIRHO) {
    if (!guardsChirho.has(guardChirho)) failChirho(`commit-back proof missing guard: ${guardChirho}`);
  }
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const templateOkChirho = argsChirho.includes("--template-ok-chirho");
  const evidencePathChirho = parseArgValueChirho(argsChirho, "evidence-chirho") ?? DEFAULT_TEMPLATE_PATH_CHIRHO;
  const evidenceChirho = readEvidenceChirho(evidencePathChirho);
  assertShapeChirho(evidenceChirho);
  if (!templateOkChirho) assertCompletedEvidenceChirho(evidenceChirho);
  console.log(
    `[${MODULE_CHIRHO}] ${templateOkChirho ? "template shape" : "completed smoke evidence"} passed: ${evidencePathChirho}`
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
