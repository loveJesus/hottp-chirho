// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-first-smoke-completion-chirho";

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

function assertCrossEvidenceChirho(decisionPathChirho: string, evidencePathChirho: string): void {
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
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const decisionArgChirho = parseArgValueChirho(argsChirho, "decision-chirho");
  const evidenceArgChirho = parseArgValueChirho(argsChirho, "evidence-chirho");
  if (decisionArgChirho === null || evidenceArgChirho === null) {
    failChirho("requires --decision-chirho=... and --evidence-chirho=...");
  }
  const decisionPathChirho = projectPathChirho(decisionArgChirho, "provisioning decision");
  const evidencePathChirho = projectPathChirho(evidenceArgChirho, "smoke evidence");
  runVerifierChirho([
    "bun",
    "run",
    "src-chirho/check-human-review-vps-provisioning-decision-chirho.ts",
    `--decision-chirho=${decisionArgChirho}`,
  ]);
  runVerifierChirho([
    "bun",
    "run",
    "src-chirho/check-human-review-vps-smoke-evidence-chirho.ts",
    `--evidence-chirho=${evidenceArgChirho}`,
  ]);
  assertCrossEvidenceChirho(decisionPathChirho, evidencePathChirho);
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
