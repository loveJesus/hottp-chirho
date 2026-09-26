// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { connect } from "net";
import { dirname, join, resolve, sep } from "path";

import { assertBunVersionsMatchPinChirho } from "./check-bun-version-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO } from "./d1-audit-fingerprint-chirho.ts";

const MODULE_CHIRHO = "sync-human-review-vps-chirho";
const DEFAULT_REMOTE_USER_CHIRHO = "hottp-review-chirho";
const DEFAULT_REMOTE_PATH_CHIRHO = "/srv/hottp-review-chirho/current/";
const LOCAL_PORT_CHECK_TIMEOUT_MS_CHIRHO = 500;
const PROGRESS_DB_WAL_PATH_CHIRHO = resolve(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite-wal");
const PROGRESS_DB_JOURNAL_PATH_CHIRHO = resolve(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite-journal");

// Every process that can write review state must be stopped before sync-out,
// because rsync --delete replaces the very files they write. The repair
// approval station belongs here too: approving, rejecting, or applying a
// proposal mutates the proposal store this sync overwrites.
const WRITE_CAPABLE_LOCAL_PORTS_CHIRHO = [
  { labelChirho: "raw Hebrew review server", portChirho: 8766 },
  { labelChirho: "Latin/symbol review server", portChirho: 8770 },
  { labelChirho: "expert non-Latin review server", portChirho: 8771 },
  { labelChirho: "segment repair approval server", portChirho: 8772 },
] as const;

const WRITE_CAPABLE_REMOTE_SERVICES_CHIRHO = [
  "hottp-raw-review-chirho.service",
  "hottp-latin-symbol-review-chirho.service",
  "hottp-expert-review-chirho.service",
  "hottp-repair-approval-chirho.service",
] as const;

/**
 * The Latin/symbol and expert stations derive part of their review queue from
 * the local D1 audit database, which lives inside the otherwise-excluded
 * `.wrangler/` tree. Without these rules those two stations fail closed on the
 * deployed host with "packet is stale", because their live item count is short
 * by exactly the D1-derived items.
 */
const D1_AUDIT_INCLUDES_CHIRHO = ((): string[] => {
  const segmentsChirho = LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO.split("/");
  const includesChirho = segmentsChirho.map(
    (_segmentChirho, indexChirho) => `${segmentsChirho.slice(0, indexChirho + 1).join("/")}/`
  );
  includesChirho.push(`${LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO}/*.sqlite`);
  return includesChirho;
})();

const EXCLUDES_CHIRHO = [
  "app-chirho/.wrangler/**",
  ".git/",
  ".env",
  ".env.*",
  ".wrangler/",
  "**/.wrangler/",
  "node_modules/",
  "app-chirho/.svelte-kit/",
  "backups-chirho/",
  "hottp-chirho.sqlite",
  "app-chirho/spec-chirho/*.sqlite",
  "workspace-chirho/spec-chirho/*.sqlite",
  "spec-chirho/*.sqlite-wal",
  "spec-chirho/*.sqlite-shm",
  "spec-chirho/*.sqlite-journal",
  "**/spec-chirho/*.sqlite-wal",
  "**/spec-chirho/*.sqlite-shm",
  "**/spec-chirho/*.sqlite-journal",
] as const;

interface ProvisioningDecisionForSyncChirho {
  owner_approval_chirho?: {
    approval_reference_chirho?: unknown;
  };
  selected_host_chirho?: {
    host_name_chirho?: unknown;
    host_address_chirho?: unknown;
  };
}

interface WriteLeaseForSyncChirho {
  owner_approval_reference_chirho?: unknown;
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

function assertSafeTokenChirho(valueChirho: string, labelChirho: string): string {
  const trimmedChirho = valueChirho.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(trimmedChirho)) {
    failChirho(`${labelChirho} must contain only letters, digits, dots, underscores, or dashes`);
  }
  return trimmedChirho;
}

function remotePathChirho(valueChirho: string): string {
  const trimmedChirho = valueChirho.trim();
  if (!trimmedChirho.startsWith("/") || /\s/.test(trimmedChirho)) {
    failChirho("remote path must be an absolute path without whitespace");
  }
  return trimmedChirho.endsWith("/") ? trimmedChirho : `${trimmedChirho}/`;
}

function rsyncArgsChirho(argsChirho: string[]): string[] {
  const printOnlyChirho = argsChirho.includes("--print-command-chirho");
  const hostArgChirho = parseArgValueChirho(argsChirho, "host-chirho");
  if (hostArgChirho === null && !printOnlyChirho) {
    failChirho("missing required --host-chirho=REVIEW_HOST_CHIRHO");
  }
  const hostChirho = assertSafeTokenChirho(
    hostArgChirho ?? "REVIEW_HOST_CHIRHO",
    "host-chirho"
  );
  const remoteUserValueChirho = remoteUserChirho(argsChirho);
  const remotePathValueChirho = remotePathChirho(
    parseArgValueChirho(argsChirho, "remote-path-chirho") ?? DEFAULT_REMOTE_PATH_CHIRHO
  );
  const applyChirho = argsChirho.includes("--apply-chirho");
  if (applyChirho && hostChirho === "REVIEW_HOST_CHIRHO") {
    failChirho("--apply-chirho requires a real --host-chirho value");
  }
  const outputChirho = ["-a", "--delete"];
  if (!applyChirho) outputChirho.push("--dry-run");
  for (const includeChirho of D1_AUDIT_INCLUDES_CHIRHO) {
    outputChirho.push("--include", includeChirho);
  }
  for (const excludeChirho of EXCLUDES_CHIRHO) {
    outputChirho.push("--exclude", excludeChirho);
  }
  outputChirho.push(`${PROJECT_ROOT_CHIRHO}/`);
  outputChirho.push(`${remoteUserValueChirho}@${hostChirho}:${remotePathValueChirho}`);
  return outputChirho;
}

function stringValueChirho(valueChirho: unknown, labelChirho: string): string {
  if (typeof valueChirho !== "string" || valueChirho.trim().length === 0) {
    failChirho(`${labelChirho} must be a non-empty string`);
  }
  return valueChirho.trim();
}

function completedDecisionApprovalReferenceForApplyChirho(argsChirho: string[], hostChirho: string): string | null {
  if (!argsChirho.includes("--apply-chirho")) return null;
  const decisionArgChirho = parseArgValueChirho(argsChirho, "decision-chirho");
  if (decisionArgChirho === null) {
    failChirho("--apply-chirho requires --decision-chirho=... so sync-out is tied to explicit owner approval");
  }
  const decisionPathChirho = projectPathChirho(decisionArgChirho, "provisioning decision");
  const resultChirho = Bun.spawnSync(
    [
      "bun",
      "run",
      "src-chirho/check-human-review-vps-provisioning-decision-chirho.ts",
      `--decision-chirho=${decisionArgChirho}`,
    ],
    { cwd: PROJECT_ROOT_CHIRHO, stdout: "inherit", stderr: "inherit" }
  );
  if (resultChirho.exitCode !== 0) failChirho(`provisioning decision check exited with code ${resultChirho.exitCode}`);
  const decisionChirho = JSON.parse(readFileSync(decisionPathChirho, "utf8")) as ProvisioningDecisionForSyncChirho;
  const hostNameChirho = stringValueChirho(decisionChirho.selected_host_chirho?.host_name_chirho, "selected host name");
  const hostAddressChirho = stringValueChirho(decisionChirho.selected_host_chirho?.host_address_chirho, "selected host address");
  if (hostChirho !== hostNameChirho && hostChirho !== hostAddressChirho) {
    failChirho(`sync host ${hostChirho} does not match selected host name or address from provisioning decision`);
  }
  return stringValueChirho(
    decisionChirho.owner_approval_chirho?.approval_reference_chirho,
    "provisioning decision approval reference"
  );
}

function assertWriteLeaseForApplyChirho(argsChirho: string[], hostChirho: string): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const leasePathChirho = parseArgValueChirho(argsChirho, "write-lease-chirho");
  if (leasePathChirho === null) {
    failChirho("--apply-chirho requires --write-lease-chirho=... so write ownership is explicit before sync-out");
  }
  const resultChirho = Bun.spawnSync(
    [
      "bun",
      "run",
      "src-chirho/check-human-review-vps-write-lease-chirho.ts",
      `--lease-chirho=${leasePathChirho}`,
      `--host-chirho=${hostChirho}`,
    ],
    { cwd: PROJECT_ROOT_CHIRHO, stdout: "inherit", stderr: "inherit" }
  );
  if (resultChirho.exitCode !== 0) failChirho(`write lease check exited with code ${resultChirho.exitCode}`);
}

function assertWriteLeaseApprovalReferenceForApplyChirho(
  argsChirho: string[],
  approvalReferenceChirho: string | null
): void {
  if (approvalReferenceChirho === null) return;
  const leasePathChirho = parseArgValueChirho(argsChirho, "write-lease-chirho");
  if (leasePathChirho === null) {
    failChirho("--apply-chirho requires --write-lease-chirho=... so write ownership is explicit before sync-out");
  }
  const leaseChirho = JSON.parse(readFileSync(projectPathChirho(leasePathChirho, "write lease"), "utf8")) as WriteLeaseForSyncChirho;
  const leaseApprovalReferenceChirho = stringValueChirho(
    leaseChirho.owner_approval_reference_chirho,
    "write lease owner approval reference"
  );
  if (leaseApprovalReferenceChirho !== approvalReferenceChirho) {
    failChirho("write lease owner approval reference does not match provisioning decision approval reference");
  }
}

/**
 * The review page ships a transpiled copy of the shared tiling block, produced
 * by whichever Bun runs the station. Deploying onto a host with a different Bun
 * could therefore put untested browser code in front of a reviewer, so sync-out
 * refuses until the host matches the pin in .bun-version.
 */
function assertBunPinForApplyChirho(argsChirho: string[], hostChirho: string): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  assertBunVersionsMatchPinChirho([
    `--host-chirho=${hostChirho}`,
    `--remote-user-chirho=${remoteUserChirho(argsChirho)}`,
  ]);
}

function assertProgressDbCheckpointedForApplyChirho(argsChirho: string[]): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const unsafeSidecarsChirho = [
    { labelChirho: "progress DB WAL", pathChirho: PROGRESS_DB_WAL_PATH_CHIRHO },
    { labelChirho: "progress DB rollback journal", pathChirho: PROGRESS_DB_JOURNAL_PATH_CHIRHO },
  ].filter((sidecarChirho) => existsSync(sidecarChirho.pathChirho) && statSync(sidecarChirho.pathChirho).size > 0);
  if (unsafeSidecarsChirho.length > 0) {
    failChirho(
      "--apply-chirho requires the progress DB to be checkpointed before sync-out; non-empty sidecar(s): " +
        unsafeSidecarsChirho.map((sidecarChirho) => sidecarChirho.labelChirho).join(", ")
    );
  }
}

/**
 * Refuse to ship a D1 audit database whose latest commits still live in a WAL
 * or rollback journal. The sidecars are deliberately not synced, so copying the
 * bare .sqlite would hand the stations a database missing recent rows.
 */
function assertD1AuditDbCheckpointedForApplyChirho(argsChirho: string[]): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const d1DirChirho = resolve(PROJECT_ROOT_CHIRHO, ...LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO.split("/"));
  if (!existsSync(d1DirChirho)) {
    failChirho(
      `--apply-chirho requires the local D1 audit database at ${LOCAL_D1_AUDIT_RELATIVE_DIR_CHIRHO}; ` +
        "the Latin/symbol and expert stations fail closed without it"
    );
    return;
  }
  const unsafeSidecarsChirho: string[] = [];
  for (const fileChirho of readdirSync(d1DirChirho)) {
    if (!fileChirho.endsWith(".sqlite")) continue;
    for (const suffixChirho of ["-wal", "-journal"]) {
      const sidecarPathChirho = join(d1DirChirho, `${fileChirho}${suffixChirho}`);
      if (existsSync(sidecarPathChirho) && statSync(sidecarPathChirho).size > 0) {
        unsafeSidecarsChirho.push(`${fileChirho}${suffixChirho}`);
      }
    }
  }
  if (unsafeSidecarsChirho.length > 0) {
    failChirho(
      "--apply-chirho requires the D1 audit database to be checkpointed before sync-out; non-empty sidecar(s): " +
        unsafeSidecarsChirho.join(", ")
    );
  }
}

function assertGitWorkingTreeCleanForApplyChirho(argsChirho: string[]): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const resultChirho = Bun.spawnSync(
    ["git", "status", "--porcelain", "--untracked-files=all"],
    { cwd: PROJECT_ROOT_CHIRHO }
  );
  if (resultChirho.exitCode !== 0) {
    failChirho(`git status exited with code ${resultChirho.exitCode}`);
  }
  const statusChirho = new TextDecoder().decode(resultChirho.stdout).trim();
  if (statusChirho.length > 0) {
    failChirho(
      "--apply-chirho requires a clean git working tree before sync-out; commit, stash, or remove local changes first:\n" +
        statusChirho
    );
  }
}

function shellQuoteChirho(valueChirho: string): string {
  return `'${valueChirho.replace(/'/g, "'\"'\"'")}'`;
}

function remoteUserChirho(argsChirho: string[]): string {
  return assertSafeTokenChirho(
    parseArgValueChirho(argsChirho, "remote-user-chirho") ?? DEFAULT_REMOTE_USER_CHIRHO,
    "remote-user-chirho"
  );
}

async function localPortAcceptsConnectionChirho(portChirho: number): Promise<boolean> {
  return await new Promise((resolveChirho) => {
    const socketChirho = connect({ host: "127.0.0.1", port: portChirho });
    let settledChirho = false;
    const finishChirho = (acceptsConnectionChirho: boolean): void => {
      if (settledChirho) return;
      settledChirho = true;
      socketChirho.destroy();
      resolveChirho(acceptsConnectionChirho);
    };
    socketChirho.setTimeout(LOCAL_PORT_CHECK_TIMEOUT_MS_CHIRHO);
    socketChirho.once("connect", () => finishChirho(true));
    socketChirho.once("error", () => finishChirho(false));
    socketChirho.once("timeout", () => finishChirho(false));
  });
}

async function assertLocalWritePortsStoppedForApplyChirho(argsChirho: string[]): Promise<void> {
  if (!argsChirho.includes("--apply-chirho")) return;
  const listeningPortsChirho: string[] = [];
  for (const portChirho of WRITE_CAPABLE_LOCAL_PORTS_CHIRHO) {
    if (await localPortAcceptsConnectionChirho(portChirho.portChirho)) {
      listeningPortsChirho.push(`${portChirho.labelChirho} :${portChirho.portChirho}`);
    }
  }
  if (listeningPortsChirho.length > 0) {
    failChirho(
      "--apply-chirho requires local write-capable review servers to be stopped before sync-out; listening: " +
        listeningPortsChirho.join(", ")
    );
  }
}

function remoteWriteServicesStoppedScriptChirho(): string {
  return [
    "set -euo pipefail",
    "active_services_chirho=''",
    ...WRITE_CAPABLE_REMOTE_SERVICES_CHIRHO.map(
      (serviceChirho) =>
        `if systemctl is-active --quiet ${shellQuoteChirho(serviceChirho)}; then active_services_chirho="$active_services_chirho ${serviceChirho}"; fi`
    ),
    "if [ -n \"$active_services_chirho\" ]; then",
    "  printf '%s\\n' \"active write-capable review services:$active_services_chirho\" >&2",
    "  exit 45",
    "fi",
  ].join("\n");
}

function assertRemoteWriteServicesStoppedForApplyChirho(argsChirho: string[], hostChirho: string): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const remoteUserValueChirho = remoteUserChirho(argsChirho);
  const commandChirho = ["ssh", `${remoteUserValueChirho}@${hostChirho}`, "bash", "-s"];
  const resultChirho = Bun.spawnSync(commandChirho, {
    stdin: new TextEncoder().encode(remoteWriteServicesStoppedScriptChirho()),
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    failChirho("remote write-capable review services must be stopped before sync-out");
  }
}

/**
 * The shell script that proves the host presents the workstation's project
 * root as an alias of the deployed tree.
 */
export function workstationPathAliasScriptChirho(workstationRootChirho: string, remoteRootChirho: string): string {
  return [
    "set -eu",
    `alias_target_chirho=$(readlink -f -- ${shellQuoteChirho(workstationRootChirho)} 2>/dev/null || true)`,
    `remote_target_chirho=$(readlink -f -- ${shellQuoteChirho(remoteRootChirho)})`,
    '[ -n "$alias_target_chirho" ] && [ "$alias_target_chirho" = "$remote_target_chirho" ]',
  ].join("\n");
}

/**
 * Review packet manifests store the absolute paths of the workstation that
 * generated them, and the expert lane's records keep those paths as strings.
 * The review host therefore has to present this workstation's project root as
 * an alias of the deployed tree. Without it, the Latin/symbol and expert
 * stations find no images and answer 500. Refuse to sync onto a host where the
 * alias is missing or points elsewhere.
 */
function assertWorkstationPathAliasForApplyChirho(argsChirho: string[], hostChirho: string): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const remoteRootChirho = remotePathChirho(parseArgValueChirho(argsChirho, "remote-path-chirho") ?? DEFAULT_REMOTE_PATH_CHIRHO);
  const resultChirho = Bun.spawnSync(["ssh", `${remoteUserChirho(argsChirho)}@${hostChirho}`, "bash", "-s"], {
    stdin: new TextEncoder().encode(workstationPathAliasScriptChirho(PROJECT_ROOT_CHIRHO, remoteRootChirho)),
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    failChirho(
      `the review host must alias ${PROJECT_ROOT_CHIRHO} to ${remoteRootChirho} so packet manifest paths resolve; ` +
        `create it with: sudo mkdir -p ${shellQuoteChirho(dirname(PROJECT_ROOT_CHIRHO))} && sudo ln -s ${shellQuoteChirho(remoteRootChirho.replace(/\/$/, ""))} ${shellQuoteChirho(PROJECT_ROOT_CHIRHO)}`
    );
  }
}

async function mainChirho(): Promise<void> {
  const argsChirho = process.argv.slice(2);
  const printOnlyChirho = argsChirho.includes("--print-command-chirho");
  const hostChirho = assertSafeTokenChirho(parseArgValueChirho(argsChirho, "host-chirho") ?? "REVIEW_HOST_CHIRHO", "host-chirho");
  if (!printOnlyChirho) assertGitWorkingTreeCleanForApplyChirho(argsChirho);
  const approvalReferenceChirho = !printOnlyChirho ? completedDecisionApprovalReferenceForApplyChirho(argsChirho, hostChirho) : null;
  if (!printOnlyChirho) assertWriteLeaseForApplyChirho(argsChirho, hostChirho);
  if (!printOnlyChirho) assertWriteLeaseApprovalReferenceForApplyChirho(argsChirho, approvalReferenceChirho);
  if (!printOnlyChirho) assertProgressDbCheckpointedForApplyChirho(argsChirho);
  if (!printOnlyChirho) assertD1AuditDbCheckpointedForApplyChirho(argsChirho);
  if (!printOnlyChirho) await assertLocalWritePortsStoppedForApplyChirho(argsChirho);
  if (!printOnlyChirho) assertRemoteWriteServicesStoppedForApplyChirho(argsChirho, hostChirho);
  if (!printOnlyChirho) assertBunPinForApplyChirho(argsChirho, hostChirho);
  if (!printOnlyChirho) assertWorkstationPathAliasForApplyChirho(argsChirho, hostChirho);
  const rsyncArgsValueChirho = rsyncArgsChirho(argsChirho);
  console.log(
    `[${MODULE_CHIRHO}] ${["rsync", ...rsyncArgsValueChirho].map(shellQuoteChirho).join(" ")}`
  );
  if (printOnlyChirho) return;
  const resultChirho = Bun.spawnSync(["rsync", ...rsyncArgsValueChirho], {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    failChirho(`rsync exited with code ${resultChirho.exitCode}`);
  }
}

if (import.meta.main) {
  mainChirho().catch((errorChirho) => {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  });
}
