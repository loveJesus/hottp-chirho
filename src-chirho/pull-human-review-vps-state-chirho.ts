// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { dirname, join, resolve, sep } from "path";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { connect } from "net";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "pull-human-review-vps-state-chirho";
const DEFAULT_REMOTE_USER_CHIRHO = "hottp-review-chirho";
const DEFAULT_REMOTE_PATH_CHIRHO = "/srv/hottp-review-chirho/current/";
const REMOTE_PROGRESS_DB_PATH_CHIRHO = "spec-chirho/progress-chirho.sqlite";
const QUARANTINE_PROGRESS_DB_PATH_CHIRHO = "backups-chirho/vps-snapshot-progress-chirho.sqlite";
const LOCAL_PORT_CHECK_TIMEOUT_MS_CHIRHO = 500;

const WRITE_CAPABLE_LOCAL_PORTS_CHIRHO = [
  { labelChirho: "raw Hebrew review server", portChirho: 8766 },
  { labelChirho: "Latin/symbol review server", portChirho: 8770 },
  { labelChirho: "expert non-Latin review server", portChirho: 8771 },
] as const;

const WRITE_CAPABLE_REMOTE_SERVICES_CHIRHO = [
  "hottp-raw-review-chirho.service",
  "hottp-latin-symbol-review-chirho.service",
  "hottp-expert-review-chirho.service",
] as const;

interface ProvisioningDecisionForPullChirho {
  owner_approval_chirho?: {
    approval_reference_chirho?: unknown;
  };
  selected_host_chirho?: {
    host_name_chirho?: unknown;
    host_address_chirho?: unknown;
  };
}

interface WriteLeaseForPullChirho {
  owner_approval_reference_chirho?: unknown;
}

const STATION_VALUES_CHIRHO = new Set([
  "raw-hebrew-chirho",
  "latin-symbol-chirho",
  "expert-non-latin-chirho",
  "all-chirho",
]);

interface PullArtifactChirho {
  stationChirho: "core-chirho" | "raw-hebrew-chirho" | "latin-symbol-chirho" | "expert-non-latin-chirho";
  relativePathChirho: string;
  optionalFlagChirho?: string;
}

const PULL_ARTIFACTS_CHIRHO: PullArtifactChirho[] = [
  { stationChirho: "core-chirho", relativePathChirho: REMOTE_PROGRESS_DB_PATH_CHIRHO },
  {
    stationChirho: "raw-hebrew-chirho",
    relativePathChirho: "spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json",
  },
  {
    stationChirho: "raw-hebrew-chirho",
    relativePathChirho: "spec-chirho/metropoliluya-chirho/segment-repair-proposals-2026-07-02-chirho.json",
    optionalFlagChirho: "--include-segment-repair-proposals-chirho",
  },
  {
    stationChirho: "latin-symbol-chirho",
    relativePathChirho: "spec-chirho/metropoliluya-chirho/latin-symbol-vision-reviews-backup-2026-05-31-chirho.json",
  },
  {
    stationChirho: "expert-non-latin-chirho",
    relativePathChirho: "spec-chirho/metropoliluya-chirho/vision-tier-expert-confirmations-2026-06-01-chirho.json",
  },
  {
    stationChirho: "expert-non-latin-chirho",
    relativePathChirho: "spec-chirho/metropoliluya-chirho/expert-supplied-vision-transcriptions-2026-06-04-chirho.json",
    optionalFlagChirho: "--include-expert-supplied-backup-chirho",
  },
  {
    stationChirho: "expert-non-latin-chirho",
    relativePathChirho: "workspace-chirho/spans-chirho/",
    optionalFlagChirho: "--include-workspace-spans-chirho",
  },
];

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

function shellQuoteChirho(valueChirho: string): string {
  return `'${valueChirho.replace(/'/g, "'\"'\"'")}'`;
}

function remoteUserChirho(argsChirho: string[]): string {
  return assertSafeTokenChirho(
    parseArgValueChirho(argsChirho, "remote-user-chirho") ?? DEFAULT_REMOTE_USER_CHIRHO,
    "remote-user-chirho"
  );
}

function selectedStationChirho(argsChirho: string[]): string {
  const stationChirho = parseArgValueChirho(argsChirho, "station-chirho") ?? "raw-hebrew-chirho";
  if (!STATION_VALUES_CHIRHO.has(stationChirho)) {
    failChirho(`unsupported --station-chirho value: ${stationChirho}`);
  }
  return stationChirho;
}

function artifactSelectedChirho(artifactChirho: PullArtifactChirho, stationChirho: string, argsChirho: string[]): boolean {
  if (artifactChirho.optionalFlagChirho !== undefined && !argsChirho.includes(artifactChirho.optionalFlagChirho)) {
    return false;
  }
  return (
    artifactChirho.stationChirho === "core-chirho" ||
    stationChirho === "all-chirho" ||
    artifactChirho.stationChirho === stationChirho
  );
}

function rsyncCommandChirho(paramsChirho: {
  artifactChirho: PullArtifactChirho;
  applyChirho: boolean;
  hostChirho: string;
  remoteUserChirho: string;
  remotePathChirho: string;
}): string[] {
  const remoteSourceChirho =
    `${paramsChirho.remoteUserChirho}@${paramsChirho.hostChirho}:` +
    `${paramsChirho.remotePathChirho}${paramsChirho.artifactChirho.relativePathChirho}`;
  let localTargetChirho: string;
  if (paramsChirho.artifactChirho.relativePathChirho === REMOTE_PROGRESS_DB_PATH_CHIRHO) {
    localTargetChirho = join(PROJECT_ROOT_CHIRHO, QUARANTINE_PROGRESS_DB_PATH_CHIRHO);
  } else {
    localTargetChirho = paramsChirho.artifactChirho.relativePathChirho.endsWith("/")
      ? join(PROJECT_ROOT_CHIRHO, paramsChirho.artifactChirho.relativePathChirho)
      : `${join(PROJECT_ROOT_CHIRHO, dirname(paramsChirho.artifactChirho.relativePathChirho))}/`;
  }

  const commandChirho = ["rsync", "-a"];
  if (!paramsChirho.applyChirho) commandChirho.push("--dry-run");
  commandChirho.push(remoteSourceChirho, localTargetChirho);
  return commandChirho;
}

function commandsChirho(argsChirho: string[]): string[][] {
  const printOnlyChirho = argsChirho.includes("--print-command-chirho");
  const hostArgChirho = parseArgValueChirho(argsChirho, "host-chirho");
  if (hostArgChirho === null && !printOnlyChirho) {
    failChirho("missing required --host-chirho=REVIEW_HOST_CHIRHO");
  }
  const hostChirho = assertSafeTokenChirho(hostArgChirho ?? "REVIEW_HOST_CHIRHO", "host-chirho");
  const applyChirho = argsChirho.includes("--apply-chirho");
  if (applyChirho && hostChirho === "REVIEW_HOST_CHIRHO") {
    failChirho("--apply-chirho requires a real --host-chirho value");
  }
  const remoteUserValueChirho = remoteUserChirho(argsChirho);
  const remotePathValueChirho = remotePathChirho(
    parseArgValueChirho(argsChirho, "remote-path-chirho") ?? DEFAULT_REMOTE_PATH_CHIRHO
  );
  const stationChirho = selectedStationChirho(argsChirho);
  const selectedArtifactsChirho = PULL_ARTIFACTS_CHIRHO.filter((artifactChirho) =>
    artifactSelectedChirho(artifactChirho, stationChirho, argsChirho)
  );
  if (selectedArtifactsChirho.length === 0) failChirho("no pull artifacts selected");
  return selectedArtifactsChirho.map((artifactChirho) =>
    rsyncCommandChirho({
      artifactChirho,
      applyChirho,
      hostChirho,
      remoteUserChirho: remoteUserValueChirho,
      remotePathChirho: remotePathValueChirho,
    })
  );
}

function assertWriteLeaseForApplyChirho(argsChirho: string[], hostChirho: string): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const leasePathChirho = parseArgValueChirho(argsChirho, "write-lease-chirho");
  if (leasePathChirho === null) {
    failChirho("--apply-chirho requires --write-lease-chirho=... so write ownership is explicit before pull-back");
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
    failChirho("--apply-chirho requires --decision-chirho=... so pull-back is tied to explicit owner approval");
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
  const decisionChirho = JSON.parse(readFileSync(decisionPathChirho, "utf8")) as ProvisioningDecisionForPullChirho;
  const hostNameChirho = stringValueChirho(decisionChirho.selected_host_chirho?.host_name_chirho, "selected host name");
  const hostAddressChirho = stringValueChirho(decisionChirho.selected_host_chirho?.host_address_chirho, "selected host address");
  if (hostChirho !== hostNameChirho && hostChirho !== hostAddressChirho) {
    failChirho(`pull host ${hostChirho} does not match selected host name or address from provisioning decision`);
  }
  return stringValueChirho(
    decisionChirho.owner_approval_chirho?.approval_reference_chirho,
    "provisioning decision approval reference"
  );
}

function assertWriteLeaseApprovalReferenceForApplyChirho(argsChirho: string[], approvalReferenceChirho: string | null): void {
  if (approvalReferenceChirho === null) return;
  const leasePathChirho = parseArgValueChirho(argsChirho, "write-lease-chirho");
  if (leasePathChirho === null) {
    failChirho("--apply-chirho requires --write-lease-chirho=... so write ownership is explicit before pull-back");
  }
  const leaseChirho = JSON.parse(readFileSync(projectPathChirho(leasePathChirho, "write lease"), "utf8")) as WriteLeaseForPullChirho;
  const leaseApprovalReferenceChirho = stringValueChirho(
    leaseChirho.owner_approval_reference_chirho,
    "write lease owner approval reference"
  );
  if (leaseApprovalReferenceChirho !== approvalReferenceChirho) {
    failChirho("write lease owner approval reference does not match provisioning decision approval reference");
  }
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
      "--apply-chirho requires local write-capable review servers to be stopped before pull-back; listening: " +
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
    failChirho("remote write-capable review services must be stopped before pull-back");
  }
}

function remoteProgressDbCheckpointedScriptChirho(remotePathValueChirho: string): string {
  const remoteDbPathChirho = `${remotePathValueChirho}${REMOTE_PROGRESS_DB_PATH_CHIRHO}`;
  return [
    "set -euo pipefail",
    "unsafe_sidecars_chirho=''",
    `if [ -s ${shellQuoteChirho(`${remoteDbPathChirho}-wal`)} ]; then unsafe_sidecars_chirho="$unsafe_sidecars_chirho progress-db-wal"; fi`,
    `if [ -s ${shellQuoteChirho(`${remoteDbPathChirho}-journal`)} ]; then unsafe_sidecars_chirho="$unsafe_sidecars_chirho progress-db-journal"; fi`,
    "if [ -n \"$unsafe_sidecars_chirho\" ]; then",
    "  printf '%s\\n' \"remote progress DB must be checkpointed before pull-back; non-empty sidecar(s):$unsafe_sidecars_chirho\" >&2",
    "  exit 46",
    "fi",
  ].join("\n");
}

function assertRemoteProgressDbCheckpointedForApplyChirho(argsChirho: string[], hostChirho: string): void {
  if (!argsChirho.includes("--apply-chirho")) return;
  const remoteUserValueChirho = remoteUserChirho(argsChirho);
  const remotePathValueChirho = remotePathChirho(
    parseArgValueChirho(argsChirho, "remote-path-chirho") ?? DEFAULT_REMOTE_PATH_CHIRHO
  );
  const commandChirho = ["ssh", `${remoteUserValueChirho}@${hostChirho}`, "bash", "-s"];
  const resultChirho = Bun.spawnSync(commandChirho, {
    stdin: new TextEncoder().encode(remoteProgressDbCheckpointedScriptChirho(remotePathValueChirho)),
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    failChirho("remote progress DB must be checkpointed before pull-back");
  }
}

async function mainChirho(): Promise<void> {
  const argsChirho = process.argv.slice(2);
  const printOnlyChirho = argsChirho.includes("--print-command-chirho");
  const commandsValueChirho = commandsChirho(argsChirho);
  const applyChirho = argsChirho.includes("--apply-chirho");
  const hostChirho = assertSafeTokenChirho(parseArgValueChirho(argsChirho, "host-chirho") ?? "REVIEW_HOST_CHIRHO", "host-chirho");
  const approvalReferenceChirho = !printOnlyChirho ? completedDecisionApprovalReferenceForApplyChirho(argsChirho, hostChirho) : null;
  if (!printOnlyChirho) assertWriteLeaseForApplyChirho(argsChirho, hostChirho);
  if (!printOnlyChirho) assertWriteLeaseApprovalReferenceForApplyChirho(argsChirho, approvalReferenceChirho);
  if (!printOnlyChirho) await assertLocalWritePortsStoppedForApplyChirho(argsChirho);
  if (!printOnlyChirho) assertRemoteWriteServicesStoppedForApplyChirho(argsChirho, hostChirho);
  if (!printOnlyChirho) assertRemoteProgressDbCheckpointedForApplyChirho(argsChirho, hostChirho);
  for (const commandChirho of commandsValueChirho) {
    console.log(`[${MODULE_CHIRHO}] ${commandChirho.map(shellQuoteChirho).join(" ")}`);
  }
  if (printOnlyChirho) return;
  for (const commandChirho of commandsValueChirho) {
    const localPathChirho = commandChirho[commandChirho.length - 1]!;
    const targetDirChirho = localPathChirho.endsWith("/") ? localPathChirho : dirname(localPathChirho);
    if (applyChirho && !existsSync(targetDirChirho)) {
      mkdirSync(targetDirChirho, { recursive: true });
    }
    const resultChirho = Bun.spawnSync(commandChirho, { stdout: "inherit", stderr: "inherit" });
    if (resultChirho.exitCode !== 0) failChirho(`rsync exited with code ${resultChirho.exitCode}`);
  }
}

if (import.meta.main) {
  mainChirho().catch((errorChirho) => {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  });
}
