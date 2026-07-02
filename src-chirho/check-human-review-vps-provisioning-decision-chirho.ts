// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { join, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-provisioning-decision-chirho";
const DEFAULT_TEMPLATE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "reviewer-deployment-chirho",
  "human-review-vps-provisioning-decision-template-2026-07-02-chirho.json"
);
const PROVIDERS_CHIRHO = new Set(["hetzner-chirho", "digitalocean-chirho", "other-vps-chirho"]);
const SCOPES_CHIRHO = new Set(["reuse-existing-host-chirho", "create-new-host-chirho"]);
const REQUIRED_DNS_CHIRHO = {
  raw_review_hostname_chirho: "raw-review.bible.systems",
  latin_review_hostname_chirho: "latin-review.bible.systems",
  expert_review_hostname_chirho: "expert-review.bible.systems",
} as const;
const REQUIRED_ACKS_CHIRHO = [
  "single_writer_host_chirho",
  "no_cloudflare_workers_for_authoring_chirho",
  "no_d1_authoring_database_chirho",
  "secrets_outside_git_chirho",
  "caddy_auth_required_chirho",
  "direct_ports_blocked_chirho",
  "workspace_assets_synced_explicitly_chirho",
] as const;

interface ProvisioningDecisionChirho {
  schema_version_chirho?: unknown;
  completed_chirho?: unknown;
  decision_id_chirho?: unknown;
  recorded_at_chirho?: unknown;
  recorded_by_chirho?: unknown;
  owner_approval_chirho?: unknown;
  selected_host_chirho?: unknown;
  dns_plan_chirho?: unknown;
  safety_acknowledgements_chirho?: unknown;
  inventory_snapshot_chirho?: unknown;
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

function nonPlaceholderChirho(valueChirho: string, labelChirho: string): string {
  const trimmedChirho = valueChirho.trim();
  if (
    trimmedChirho.length === 0 ||
    /\b(?:replace|example|REVIEW_HOST|YYYY|explicit|copy-from|provider-|pending|todo|tbd)\b/i.test(trimmedChirho)
  ) {
    failChirho(`${labelChirho} is still a placeholder`);
  }
  return trimmedChirho;
}

function assertProjectPathChirho(pathChirho: string): string {
  const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, pathChirho);
  const rootChirho = resolve(PROJECT_ROOT_CHIRHO);
  if (!(resolvedChirho === rootChirho || resolvedChirho.startsWith(`${rootChirho}${sep}`))) {
    failChirho(`decision path escapes project root: ${pathChirho}`);
  }
  return resolvedChirho;
}

function readDecisionChirho(pathChirho: string): ProvisioningDecisionChirho {
  const resolvedChirho = pathChirho === DEFAULT_TEMPLATE_PATH_CHIRHO ? pathChirho : assertProjectPathChirho(pathChirho);
  if (!existsSync(resolvedChirho)) {
    failChirho(`provisioning decision file missing: ${pathChirho}`);
  }
  return JSON.parse(readFileSync(resolvedChirho, "utf8")) as ProvisioningDecisionChirho;
}

function assertShapeChirho(decisionChirho: ProvisioningDecisionChirho): void {
  const rootChirho = recordChirho(decisionChirho, "decision");
  if (rootChirho.schema_version_chirho !== 1) failChirho("decision.schema_version_chirho must be 1");
  booleanFieldChirho(rootChirho, "completed_chirho", "decision");
  stringFieldChirho(rootChirho, "decision_id_chirho", "decision");
  stringFieldChirho(rootChirho, "recorded_at_chirho", "decision");
  stringFieldChirho(rootChirho, "recorded_by_chirho", "decision");
  const approvalChirho = recordChirho(rootChirho.owner_approval_chirho, "owner_approval_chirho");
  booleanFieldChirho(approvalChirho, "approved_chirho", "owner_approval_chirho");
  stringFieldChirho(approvalChirho, "approved_by_chirho", "owner_approval_chirho");
  stringFieldChirho(approvalChirho, "approval_reference_chirho", "owner_approval_chirho");
  const scopeChirho = stringFieldChirho(approvalChirho, "approved_scope_chirho", "owner_approval_chirho");
  if (!SCOPES_CHIRHO.has(scopeChirho)) failChirho(`unsupported approved scope: ${scopeChirho}`);
  booleanFieldChirho(approvalChirho, "creates_billable_resources_chirho", "owner_approval_chirho");
  booleanFieldChirho(approvalChirho, "dns_changes_approved_chirho", "owner_approval_chirho");
  numberFieldChirho(approvalChirho, "monthly_budget_usd_chirho", "owner_approval_chirho");
  const hostChirho = recordChirho(rootChirho.selected_host_chirho, "selected_host_chirho");
  const providerChirho = stringFieldChirho(hostChirho, "provider_chirho", "selected_host_chirho");
  if (!PROVIDERS_CHIRHO.has(providerChirho)) failChirho(`unsupported provider: ${providerChirho}`);
  stringFieldChirho(hostChirho, "host_name_chirho", "selected_host_chirho");
  stringFieldChirho(hostChirho, "host_address_chirho", "selected_host_chirho");
  stringFieldChirho(hostChirho, "region_chirho", "selected_host_chirho");
  stringFieldChirho(hostChirho, "size_chirho", "selected_host_chirho");
  booleanFieldChirho(hostChirho, "existing_host_chirho", "selected_host_chirho");
  const dnsChirho = recordChirho(rootChirho.dns_plan_chirho, "dns_plan_chirho");
  for (const keyChirho of Object.keys(REQUIRED_DNS_CHIRHO)) {
    stringFieldChirho(dnsChirho, keyChirho, "dns_plan_chirho");
  }
  booleanFieldChirho(dnsChirho, "create_or_update_records_chirho", "dns_plan_chirho");
  booleanFieldChirho(dnsChirho, "proxied_chirho", "dns_plan_chirho");
  const acksChirho = recordChirho(rootChirho.safety_acknowledgements_chirho, "safety_acknowledgements_chirho");
  for (const keyChirho of REQUIRED_ACKS_CHIRHO) {
    booleanFieldChirho(acksChirho, keyChirho, "safety_acknowledgements_chirho");
  }
  const inventoryChirho = recordChirho(rootChirho.inventory_snapshot_chirho, "inventory_snapshot_chirho");
  stringFieldChirho(inventoryChirho, "inventory_recorded_at_chirho", "inventory_snapshot_chirho");
  stringFieldChirho(inventoryChirho, "hetzner_status_chirho", "inventory_snapshot_chirho");
  stringFieldChirho(inventoryChirho, "digital_ocean_status_chirho", "inventory_snapshot_chirho");
  stringFieldChirho(inventoryChirho, "cloudflare_review_dns_status_chirho", "inventory_snapshot_chirho");
  stringFieldChirho(inventoryChirho, "notes_chirho", "inventory_snapshot_chirho");
}

function assertCompletedDecisionChirho(decisionChirho: ProvisioningDecisionChirho): void {
  const rootChirho = recordChirho(decisionChirho, "decision");
  if (rootChirho.completed_chirho !== true) failChirho("completed provisioning decision must set completed_chirho=true");
  nonPlaceholderChirho(stringFieldChirho(rootChirho, "decision_id_chirho", "decision"), "decision_id_chirho");
  nonPlaceholderChirho(stringFieldChirho(rootChirho, "recorded_by_chirho", "decision"), "recorded_by_chirho");
  const recordedAtChirho = stringFieldChirho(rootChirho, "recorded_at_chirho", "decision");
  if (Number.isNaN(Date.parse(recordedAtChirho))) failChirho("recorded_at_chirho must parse as a date");
  const approvalChirho = recordChirho(rootChirho.owner_approval_chirho, "owner_approval_chirho");
  if (booleanFieldChirho(approvalChirho, "approved_chirho", "owner_approval_chirho") !== true) {
    failChirho("owner approval must be explicit before provisioning or reusing a host");
  }
  nonPlaceholderChirho(stringFieldChirho(approvalChirho, "approved_by_chirho", "owner_approval_chirho"), "approved_by_chirho");
  nonPlaceholderChirho(
    stringFieldChirho(approvalChirho, "approval_reference_chirho", "owner_approval_chirho"),
    "approval_reference_chirho"
  );
  const scopeChirho = stringFieldChirho(approvalChirho, "approved_scope_chirho", "owner_approval_chirho");
  const createsBillableChirho = booleanFieldChirho(
    approvalChirho,
    "creates_billable_resources_chirho",
    "owner_approval_chirho"
  );
  const dnsChangesApprovedChirho = booleanFieldChirho(
    approvalChirho,
    "dns_changes_approved_chirho",
    "owner_approval_chirho"
  );
  const budgetChirho = numberFieldChirho(approvalChirho, "monthly_budget_usd_chirho", "owner_approval_chirho");
  if (budgetChirho < 0) failChirho("monthly_budget_usd_chirho cannot be negative");
  if (createsBillableChirho && budgetChirho <= 0) {
    failChirho("billable provisioning requires a positive monthly_budget_usd_chirho");
  }
  const hostChirho = recordChirho(rootChirho.selected_host_chirho, "selected_host_chirho");
  nonPlaceholderChirho(stringFieldChirho(hostChirho, "host_name_chirho", "selected_host_chirho"), "host_name_chirho");
  nonPlaceholderChirho(stringFieldChirho(hostChirho, "host_address_chirho", "selected_host_chirho"), "host_address_chirho");
  nonPlaceholderChirho(stringFieldChirho(hostChirho, "region_chirho", "selected_host_chirho"), "region_chirho");
  nonPlaceholderChirho(stringFieldChirho(hostChirho, "size_chirho", "selected_host_chirho"), "size_chirho");
  const existingHostChirho = booleanFieldChirho(hostChirho, "existing_host_chirho", "selected_host_chirho");
  if (scopeChirho === "reuse-existing-host-chirho" && !existingHostChirho) {
    failChirho("reuse-existing-host-chirho requires selected_host_chirho.existing_host_chirho=true");
  }
  if (scopeChirho === "create-new-host-chirho" && !createsBillableChirho) {
    failChirho("create-new-host-chirho must acknowledge creates_billable_resources_chirho=true");
  }
  const dnsChirho = recordChirho(rootChirho.dns_plan_chirho, "dns_plan_chirho");
  const createOrUpdateDnsChirho = booleanFieldChirho(dnsChirho, "create_or_update_records_chirho", "dns_plan_chirho");
  if (createOrUpdateDnsChirho !== dnsChangesApprovedChirho) {
    failChirho("owner_approval_chirho.dns_changes_approved_chirho must match dns_plan_chirho.create_or_update_records_chirho");
  }
  for (const [keyChirho, expectedChirho] of Object.entries(REQUIRED_DNS_CHIRHO)) {
    const actualChirho = stringFieldChirho(dnsChirho, keyChirho, "dns_plan_chirho");
    if (actualChirho !== expectedChirho) {
      failChirho(`${keyChirho} must be ${expectedChirho}`);
    }
  }
  const acksChirho = recordChirho(rootChirho.safety_acknowledgements_chirho, "safety_acknowledgements_chirho");
  for (const keyChirho of REQUIRED_ACKS_CHIRHO) {
    if (booleanFieldChirho(acksChirho, keyChirho, "safety_acknowledgements_chirho") !== true) {
      failChirho(`safety acknowledgement missing: ${keyChirho}`);
    }
  }
  const inventoryChirho = recordChirho(rootChirho.inventory_snapshot_chirho, "inventory_snapshot_chirho");
  const inventoryAtChirho = stringFieldChirho(inventoryChirho, "inventory_recorded_at_chirho", "inventory_snapshot_chirho");
  if (Number.isNaN(Date.parse(inventoryAtChirho))) failChirho("inventory_recorded_at_chirho must parse as a date");
  nonPlaceholderChirho(stringFieldChirho(inventoryChirho, "hetzner_status_chirho", "inventory_snapshot_chirho"), "hetzner_status_chirho");
  nonPlaceholderChirho(
    stringFieldChirho(inventoryChirho, "digital_ocean_status_chirho", "inventory_snapshot_chirho"),
    "digital_ocean_status_chirho"
  );
  nonPlaceholderChirho(
    stringFieldChirho(inventoryChirho, "cloudflare_review_dns_status_chirho", "inventory_snapshot_chirho"),
    "cloudflare_review_dns_status_chirho"
  );
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const templateOkChirho = argsChirho.includes("--template-ok-chirho");
  const decisionPathChirho = parseArgValueChirho(argsChirho, "decision-chirho") ?? DEFAULT_TEMPLATE_PATH_CHIRHO;
  const decisionChirho = readDecisionChirho(decisionPathChirho);
  assertShapeChirho(decisionChirho);
  if (!templateOkChirho) assertCompletedDecisionChirho(decisionChirho);
  console.log(
    `[${MODULE_CHIRHO}] ${templateOkChirho ? "template shape" : "completed provisioning decision"} passed: ${decisionPathChirho}`
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
