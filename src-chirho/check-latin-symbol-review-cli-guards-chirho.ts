// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Non-mutating guard checks for the Latin/symbol review CLI.
 *
 * These checks run against temporary SQLite files. They prove the batch CLI
 * cannot record gate-decrementing accepted-clean reviews under machine
 * reviewer attribution, while a named human reviewer can still use the guarded
 * path with the current live text hash.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  latinSymbolVisionLiveItemsChirho,
  type LatinSymbolVisionLiveItemChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import {
  assertLatinSymbolManifestMatchesLiveChirho,
  LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO,
  loadLatinSymbolPacketManifestChirho,
} from "./latin-symbol-vision-review-store-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "check-latin-symbol-review-cli-guards-chirho";
const RECORD_SCRIPT_CHIRHO = "record-latin-symbol-vision-review-chirho";

function runCommandChirho(argsChirho: string[]): {
  exitCodeChirho: number;
  stdoutChirho: string;
  stderrChirho: string;
} {
  const resultChirho = Bun.spawnSync(argsChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCodeChirho: resultChirho.exitCode,
    stdoutChirho: Buffer.from(resultChirho.stdout).toString("utf8"),
    stderrChirho: Buffer.from(resultChirho.stderr).toString("utf8"),
  };
}

function commandTextChirho(argsChirho: string[]): string {
  return argsChirho.map((argChirho) => (/\s/.test(argChirho) ? JSON.stringify(argChirho) : argChirho)).join(" ");
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) throw new Error(messageChirho);
}

function tempDbPathChirho(): { dirChirho: string; dbPathChirho: string } {
  const dirChirho = mkdtempSync(join(tmpdir(), "latin-symbol-review-cli-guard-chirho-"));
  return { dirChirho, dbPathChirho: join(dirChirho, "reviews-chirho.sqlite") };
}

function reviewRowCountChirho(dbPathChirho: string): number {
  if (!existsSync(dbPathChirho)) return 0;
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const tableRowChirho = dbChirho
      .query<{ countChirho: number }, []>(
        "SELECT COUNT(*) AS countChirho FROM sqlite_master WHERE type = 'table' AND name = 'latin_symbol_vision_reviews_chirho'"
      )
      .get();
    if ((tableRowChirho?.countChirho ?? 0) === 0) return 0;
    const countRowChirho = dbChirho
      .query<{ countChirho: number }, []>("SELECT COUNT(*) AS countChirho FROM latin_symbol_vision_reviews_chirho")
      .get();
    return countRowChirho?.countChirho ?? 0;
  } finally {
    dbChirho.close();
  }
}

function firstLivePacketItemChirho(): LatinSymbolVisionLiveItemChirho {
  const manifestChirho = loadLatinSymbolPacketManifestChirho(LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO);
  const liveItemsChirho = latinSymbolVisionLiveItemsChirho();
  const liveByIdChirho = assertLatinSymbolManifestMatchesLiveChirho(manifestChirho, liveItemsChirho);
  const firstPacketItemChirho = manifestChirho.itemsChirho?.[0];
  if (firstPacketItemChirho === undefined) throw new Error("Latin/symbol packet has no items");
  const liveItemChirho = liveByIdChirho.get(firstPacketItemChirho.idChirho);
  if (liveItemChirho === undefined) throw new Error(`Live item missing for ${firstPacketItemChirho.idChirho}`);
  return liveItemChirho;
}

function recordArgsChirho(
  dbPathChirho: string,
  liveItemChirho: LatinSymbolVisionLiveItemChirho,
  reviewerChirho: string
): string[] {
  return [
    process.execPath,
    "run",
    RECORD_SCRIPT_CHIRHO,
    "--",
    `--db=${dbPathChirho}`,
    `--id=${liveItemChirho.idChirho}`,
    "--verdict=accepted-clean",
    `--reviewer=${reviewerChirho}`,
    `--expected-text-hash-chirho=${hashTextChirho(liveItemChirho.textChirho)}`,
    "--accept-clean-chirho",
  ];
}

function checkMachineAcceptedCleanRejectedChirho(liveItemChirho: LatinSymbolVisionLiveItemChirho): void {
  const tempChirho = tempDbPathChirho();
  try {
    const argsChirho = recordArgsChirho(tempChirho.dbPathChirho, liveItemChirho, "codex-gpt5-chirho");
    const resultChirho = runCommandChirho(argsChirho);
    const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
    assertCheckChirho(
      resultChirho.exitCodeChirho !== 0,
      `machine accepted-clean command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
    );
    assertCheckChirho(
      combinedOutputChirho.includes("machine reviewer codex-gpt5-chirho cannot certify"),
      `machine accepted-clean command failed for the wrong reason: ${combinedOutputChirho}`
    );
    assertCheckChirho(
      reviewRowCountChirho(tempChirho.dbPathChirho) === 0,
      "machine accepted-clean command wrote review rows"
    );
  } finally {
    rmSync(tempChirho.dirChirho, { force: true, recursive: true });
  }
}

function checkHumanAcceptedCleanStillWritesChirho(liveItemChirho: LatinSymbolVisionLiveItemChirho): void {
  const tempChirho = tempDbPathChirho();
  try {
    const argsChirho = recordArgsChirho(tempChirho.dbPathChirho, liveItemChirho, "dr-latin-symbol-cli-guard-chirho");
    const resultChirho = runCommandChirho(argsChirho);
    assertCheckChirho(
      resultChirho.exitCodeChirho === 0,
      `human accepted-clean command failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
    );
    assertCheckChirho(
      reviewRowCountChirho(tempChirho.dbPathChirho) === 1,
      "human accepted-clean command did not write exactly one temp review row"
    );
  } finally {
    rmSync(tempChirho.dirChirho, { force: true, recursive: true });
  }
}

function mainChirho(): void {
  const liveItemChirho = firstLivePacketItemChirho();
  checkMachineAcceptedCleanRejectedChirho(liveItemChirho);
  checkHumanAcceptedCleanStillWritesChirho(liveItemChirho);
  console.log(`[${MODULE_CHIRHO}] checked live item ${liveItemChirho.idChirho}`);
  console.log(`[${MODULE_CHIRHO}] Latin/symbol review CLI guards passed`);
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
