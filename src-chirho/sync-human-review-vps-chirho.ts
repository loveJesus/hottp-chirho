// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { connect } from "net";
import { resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "sync-human-review-vps-chirho";
const DEFAULT_REMOTE_USER_CHIRHO = "hottp-review-chirho";
const DEFAULT_REMOTE_PATH_CHIRHO = "/srv/hottp-review-chirho/current/";
const LOCAL_PORT_CHECK_TIMEOUT_MS_CHIRHO = 500;

const WRITE_CAPABLE_LOCAL_PORTS_CHIRHO = [
  { labelChirho: "raw Hebrew review server", portChirho: 8766 },
  { labelChirho: "Latin/symbol review server", portChirho: 8770 },
  { labelChirho: "expert non-Latin review server", portChirho: 8771 },
] as const;

const EXCLUDES_CHIRHO = [
  ".git/",
  ".env",
  "node_modules/",
  "app-chirho/.svelte-kit/",
] as const;

interface ProvisioningDecisionForSyncChirho {
  selected_host_chirho?: {
    host_name_chirho?: unknown;
    host_address_chirho?: unknown;
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
  const remoteUserChirho = assertSafeTokenChirho(
    parseArgValueChirho(argsChirho, "remote-user-chirho") ?? DEFAULT_REMOTE_USER_CHIRHO,
    "remote-user-chirho"
  );
  const remotePathValueChirho = remotePathChirho(
    parseArgValueChirho(argsChirho, "remote-path-chirho") ?? DEFAULT_REMOTE_PATH_CHIRHO
  );
  const applyChirho = argsChirho.includes("--apply-chirho");
  if (applyChirho && hostChirho === "REVIEW_HOST_CHIRHO") {
    failChirho("--apply-chirho requires a real --host-chirho value");
  }
  const outputChirho = ["-a", "--delete"];
  if (!applyChirho) outputChirho.push("--dry-run");
  for (const excludeChirho of EXCLUDES_CHIRHO) {
    outputChirho.push("--exclude", excludeChirho);
  }
  outputChirho.push(`${PROJECT_ROOT_CHIRHO}/`);
  outputChirho.push(`${remoteUserChirho}@${hostChirho}:${remotePathValueChirho}`);
  return outputChirho;
}

function stringValueChirho(valueChirho: unknown, labelChirho: string): string {
  if (typeof valueChirho !== "string" || valueChirho.trim().length === 0) {
    failChirho(`${labelChirho} must be a non-empty string`);
  }
  return valueChirho.trim();
}

function assertCompletedDecisionForApplyChirho(argsChirho: string[], hostChirho: string): void {
  if (!argsChirho.includes("--apply-chirho")) return;
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
}

function shellQuoteChirho(valueChirho: string): string {
  return `'${valueChirho.replace(/'/g, "'\"'\"'")}'`;
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

async function mainChirho(): Promise<void> {
  const argsChirho = process.argv.slice(2);
  const printOnlyChirho = argsChirho.includes("--print-command-chirho");
  const hostChirho = assertSafeTokenChirho(parseArgValueChirho(argsChirho, "host-chirho") ?? "REVIEW_HOST_CHIRHO", "host-chirho");
  if (!printOnlyChirho) assertCompletedDecisionForApplyChirho(argsChirho, hostChirho);
  if (!printOnlyChirho) await assertLocalWritePortsStoppedForApplyChirho(argsChirho);
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
