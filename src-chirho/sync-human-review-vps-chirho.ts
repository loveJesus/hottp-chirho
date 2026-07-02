// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "sync-human-review-vps-chirho";
const DEFAULT_REMOTE_USER_CHIRHO = "hottp-review-chirho";
const DEFAULT_REMOTE_PATH_CHIRHO = "/srv/hottp-review-chirho/current/";

const EXCLUDES_CHIRHO = [
  ".git/",
  ".env",
  "node_modules/",
  "app-chirho/.svelte-kit/",
] as const;

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | null {
  const prefixChirho = `--${nameChirho}=`;
  const matchChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  return matchChirho === undefined ? null : matchChirho.slice(prefixChirho.length);
}

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
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

function shellQuoteChirho(valueChirho: string): string {
  return `'${valueChirho.replace(/'/g, "'\"'\"'")}'`;
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const printOnlyChirho = argsChirho.includes("--print-command-chirho");
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
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
