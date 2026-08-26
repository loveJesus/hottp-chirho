// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Pins the Bun toolchain to `.bun-version`, locally and on the review host.
 *
 * This is not tidiness. The review page ships a TRANSPILED copy of the shared
 * segment-tiling block (see segment-tiling-edit-chirho.ts), produced by
 * whichever Bun renders the page. If the review host runs a different Bun from
 * the one the guards were run under, a reviewer can be shown browser code that
 * was never tested. On 2026-08-25 local was 1.2.14 while the host was 1.3.14;
 * the transpiled output happened to be byte-identical, but nothing guaranteed
 * that - so the versions are pinned rather than left to chance.
 *
 *   bun run src-chirho/check-bun-version-chirho.ts
 *   bun run src-chirho/check-bun-version-chirho.ts --host-chirho=<review host>
 */

import { readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-bun-version-chirho";
const BUN_VERSION_FILE_CHIRHO = join(PROJECT_ROOT_CHIRHO, ".bun-version");
const DEFAULT_REMOTE_USER_CHIRHO = "hottp-review-chirho";
const SEMVER_RE_CHIRHO = /^\d+\.\d+\.\d+$/;

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function assertSafeTokenChirho(valueChirho: string, labelChirho: string): string {
  const trimmedChirho = valueChirho.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(trimmedChirho)) {
    failChirho(`${labelChirho} must contain only letters, digits, dots, underscores, or dashes`);
  }
  return trimmedChirho;
}

export function pinnedBunVersionChirho(): string {
  const rawChirho = readFileSync(BUN_VERSION_FILE_CHIRHO, "utf8").trim();
  if (!SEMVER_RE_CHIRHO.test(rawChirho)) {
    failChirho(`.bun-version must hold one exact version like 1.3.14, found: ${rawChirho}`);
  }
  return rawChirho;
}

function assertLocalBunVersionChirho(pinnedChirho: string): void {
  const runningChirho = Bun.version.trim();
  if (runningChirho !== pinnedChirho) {
    failChirho(
      `local Bun is ${runningChirho} but .bun-version pins ${pinnedChirho}; ` +
        `run: curl -fsSL https://bun.sh/install | bash -s "bun-v${pinnedChirho}"`
    );
  }
}

function assertRemoteBunVersionChirho(pinnedChirho: string, hostChirho: string, remoteUserChirho: string): void {
  const resultChirho = Bun.spawnSync(
    ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", `${remoteUserChirho}@${hostChirho}`, "bun --version"],
    { stdout: "pipe", stderr: "pipe" }
  );
  if (resultChirho.exitCode !== 0) {
    failChirho(`could not read Bun version on ${hostChirho}: ${resultChirho.stderr.toString().trim()}`);
  }
  const remoteVersionChirho = resultChirho.stdout.toString().trim();
  if (remoteVersionChirho !== pinnedChirho) {
    failChirho(
      `${hostChirho} runs Bun ${remoteVersionChirho} but .bun-version pins ${pinnedChirho}; ` +
        "the review page ships transpiled code, so the host must match before sync-out"
    );
  }
  console.log(`[${MODULE_CHIRHO}] ${hostChirho} Bun ${remoteVersionChirho} matches the pin`);
}

export function assertBunVersionsMatchPinChirho(argsChirho: string[]): void {
  const pinnedChirho = pinnedBunVersionChirho();
  assertLocalBunVersionChirho(pinnedChirho);
  const hostArgChirho = parseArgValueChirho(argsChirho, "host-chirho");
  if (hostArgChirho !== undefined) {
    assertRemoteBunVersionChirho(
      pinnedChirho,
      assertSafeTokenChirho(hostArgChirho, "host-chirho"),
      assertSafeTokenChirho(parseArgValueChirho(argsChirho, "remote-user-chirho") ?? DEFAULT_REMOTE_USER_CHIRHO, "remote-user-chirho")
    );
  }
  console.log(`[${MODULE_CHIRHO}] Bun ${pinnedChirho} matches the pin`);
}

if (import.meta.main) {
  try {
    assertBunVersionsMatchPinChirho(process.argv.slice(2));
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
