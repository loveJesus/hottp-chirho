// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-review-vps-phase6-completion-chirho";
const DEFAULT_PASS_C_BACKUP_PATH_CHIRHO =
  "spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json";
const SOURCE_LOCAL_FIXTURE_DIR_FRAGMENT_CHIRHO =
  "spec-chirho/reviewer-deployment-chirho/.tmp-phase6-completion-fixture-chirho/";
const REQUIRED_TRUSTED_HEADER_CHIRHO = "X-Webauth-User";

interface ProvisioningDecisionForPhase6Chirho {
  owner_approval_chirho?: {
    approval_reference_chirho?: unknown;
  };
  selected_host_chirho?: {
    host_name_chirho?: unknown;
  };
}

interface WriteLeaseForPhase6Chirho {
  owner_approval_reference_chirho?: unknown;
}

interface SmokeEvidenceForPhase6Chirho {
  trusted_header_chirho?: unknown;
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

function readJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function stringValueChirho(valueChirho: unknown, labelChirho: string): string {
  if (typeof valueChirho !== "string" || valueChirho.trim().length === 0) {
    failChirho(`${labelChirho} must be a non-empty string`);
  }
  return valueChirho.trim();
}

function selectedHostNameChirho(decisionPathChirho: string): string {
  const decisionChirho = readJsonChirho<ProvisioningDecisionForPhase6Chirho>(decisionPathChirho);
  return stringValueChirho(decisionChirho.selected_host_chirho?.host_name_chirho, "selected host name");
}

function assertWriteLeaseApprovalReferenceMatchesDecisionChirho(decisionPathChirho: string, leasePathChirho: string): void {
  const decisionChirho = readJsonChirho<ProvisioningDecisionForPhase6Chirho>(decisionPathChirho);
  const leaseChirho = readJsonChirho<WriteLeaseForPhase6Chirho>(leasePathChirho);
  const decisionApprovalReferenceChirho = stringValueChirho(
    decisionChirho.owner_approval_chirho?.approval_reference_chirho,
    "provisioning decision approval reference"
  );
  const leaseApprovalReferenceChirho = stringValueChirho(
    leaseChirho.owner_approval_reference_chirho,
    "write lease owner approval reference"
  );
  if (leaseApprovalReferenceChirho !== decisionApprovalReferenceChirho) {
    failChirho("write lease owner approval reference does not match provisioning decision approval reference");
  }
}

function assertSmokeEvidenceUsesPinnedTrustedHeaderChirho(evidencePathChirho: string): void {
  const evidenceChirho = readJsonChirho<SmokeEvidenceForPhase6Chirho>(evidencePathChirho);
  const trustedHeaderChirho = stringValueChirho(evidenceChirho.trusted_header_chirho, "smoke evidence trusted header");
  if (trustedHeaderChirho !== REQUIRED_TRUSTED_HEADER_CHIRHO) {
    failChirho(
      `Phase 6 Caddy smoke evidence must use ${REQUIRED_TRUSTED_HEADER_CHIRHO}, got ${trustedHeaderChirho}`
    );
  }
}

function runVerifierChirho(commandChirho: string[]): void {
  const resultChirho = Bun.spawnSync(commandChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    failChirho(`verifier failed: ${commandChirho.join(" ")}`);
  }
}

function assertFixtureModeChirho(argsChirho: {
  sourceLocalFixtureChirho: boolean;
  liveProbeChirho: boolean;
  decisionArgChirho: string;
  evidenceArgChirho: string;
  leaseArgChirho: string;
  backupArgChirho: string;
}): void {
  if (!argsChirho.sourceLocalFixtureChirho && !argsChirho.liveProbeChirho) {
    failChirho("Phase 6 completion requires --live-probe-chirho unless --source-local-fixture-chirho is used");
  }
  if (!argsChirho.sourceLocalFixtureChirho) return;
  const fixturePathsChirho = [
    argsChirho.decisionArgChirho,
    argsChirho.evidenceArgChirho,
    argsChirho.leaseArgChirho,
    argsChirho.backupArgChirho,
  ];
  if (!fixturePathsChirho.every((pathChirho) => pathChirho.includes(SOURCE_LOCAL_FIXTURE_DIR_FRAGMENT_CHIRHO))) {
    failChirho("--source-local-fixture-chirho is only allowed for files under the Phase 6 fixture directory");
  }
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const decisionArgChirho = parseArgValueChirho(argsChirho, "decision-chirho");
  const evidenceArgChirho = parseArgValueChirho(argsChirho, "evidence-chirho");
  const leaseArgChirho = parseArgValueChirho(argsChirho, "write-lease-chirho");
  const backupArgChirho = parseArgValueChirho(argsChirho, "pass-c-backup-chirho") ?? DEFAULT_PASS_C_BACKUP_PATH_CHIRHO;
  const liveProbeChirho = argsChirho.includes("--live-probe-chirho");
  const sourceLocalFixtureChirho = argsChirho.includes("--source-local-fixture-chirho");
  if (decisionArgChirho === null || evidenceArgChirho === null || leaseArgChirho === null) {
    failChirho("requires --decision-chirho=..., --evidence-chirho=..., and --write-lease-chirho=...");
  }
  assertFixtureModeChirho({
    sourceLocalFixtureChirho,
    liveProbeChirho,
    decisionArgChirho,
    evidenceArgChirho,
    leaseArgChirho,
    backupArgChirho,
  });
  const decisionPathChirho = projectPathChirho(decisionArgChirho, "provisioning decision");
  const evidencePathChirho = projectPathChirho(evidenceArgChirho, "smoke evidence");
  const leasePathChirho = projectPathChirho(leaseArgChirho, "write lease");
  projectPathChirho(backupArgChirho, "Pass-C human validation backup");
  const hostNameChirho = selectedHostNameChirho(decisionPathChirho);

  runVerifierChirho(["bun", "run", "src-chirho/check-human-review-vps-readiness-chirho.ts"]);
  runVerifierChirho(["bun", "run", "src-chirho/check-human-review-vps-deployment-templates-chirho.ts"]);
  runVerifierChirho([
    "bun",
    "run",
    "src-chirho/check-human-review-vps-provisioning-decision-chirho.ts",
    `--decision-chirho=${decisionArgChirho}`,
  ]);
  runVerifierChirho([
    "bun",
    "run",
    "src-chirho/check-human-review-vps-write-lease-chirho.ts",
    `--lease-chirho=${leaseArgChirho}`,
    `--host-chirho=${hostNameChirho}`,
  ]);
  if (!sourceLocalFixtureChirho) {
    runVerifierChirho([
      "bun",
      "run",
      "src-chirho/check-human-review-vps-host-preflight-chirho.ts",
      `--host-chirho=${hostNameChirho}`,
    ]);
  }
  assertWriteLeaseApprovalReferenceMatchesDecisionChirho(decisionPathChirho, leasePathChirho);
  assertSmokeEvidenceUsesPinnedTrustedHeaderChirho(evidencePathChirho);
  const firstSmokeCommandChirho = [
    "bun",
    "run",
    "src-chirho/check-human-review-vps-first-smoke-completion-chirho.ts",
    `--decision-chirho=${decisionArgChirho}`,
    `--evidence-chirho=${evidenceArgChirho}`,
    `--pass-c-backup-chirho=${backupArgChirho}`,
  ];
  if (liveProbeChirho) firstSmokeCommandChirho.push("--live-probe-chirho");
  runVerifierChirho(firstSmokeCommandChirho);
  runVerifierChirho(["bun", "run", "src-chirho/check-pass-c-human-review-server-guards-chirho.ts"]);
  runVerifierChirho(["bun", "run", "src-chirho/transcription-certification-status-chirho.ts"]);
  runVerifierChirho(["bun", "run", "src-chirho/check-certification-strict-status-chirho.ts"]);
  console.log(
    `[${MODULE_CHIRHO}] Phase 6 completion audit passed` +
      (sourceLocalFixtureChirho ? " for source-local fixture evidence" : "")
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
