// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify transcription-certification-status-chirho --strict exits consistently
 * with certificationCompleteChirho.
 *
 * This uses temporary status output directories and does not mutate review
 * state. It protects the final CI/handoff boundary: a red certification gate
 * must not exit successfully in strict mode, and a future green gate must.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-certification-strict-status-chirho";

interface CertificationStatusForStrictGuardChirho {
  certificationCompleteChirho?: boolean;
}

interface StatusRunResultChirho {
  exitCodeChirho: number;
  stdoutChirho: string;
  stderrChirho: string;
  outDirChirho: string;
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) throw new Error(messageChirho);
}

function runStatusChirho(tempDirChirho: string, strictChirho: boolean): StatusRunResultChirho {
  const outDirChirho = join(tempDirChirho, strictChirho ? "strict-status-chirho" : "normal-status-chirho");
  const argsChirho = [
    process.execPath,
    "run",
    "transcription-certification-status-chirho",
    "--",
    `--out-dir=${outDirChirho}`,
  ];
  if (strictChirho) argsChirho.push("--strict");
  const resultChirho = Bun.spawnSync(argsChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCodeChirho: resultChirho.exitCode,
    stdoutChirho: Buffer.from(resultChirho.stdout).toString("utf8"),
    stderrChirho: Buffer.from(resultChirho.stderr).toString("utf8"),
    outDirChirho,
  };
}

function readStatusChirho(outDirChirho: string): CertificationStatusForStrictGuardChirho {
  const statusPathChirho = join(outDirChirho, "status-chirho.json");
  assertCheckChirho(existsSync(statusPathChirho), `status output missing: ${statusPathChirho}`);
  const statusChirho = JSON.parse(readFileSync(statusPathChirho, "utf8")) as CertificationStatusForStrictGuardChirho;
  assertCheckChirho(
    typeof statusChirho.certificationCompleteChirho === "boolean",
    "status output lacks boolean certificationCompleteChirho"
  );
  return statusChirho;
}

function mainChirho(): void {
  const tempDirChirho = mkdtempSync(join(tmpdir(), "certification-strict-status-guard-chirho-"));
  try {
    const normalResultChirho = runStatusChirho(tempDirChirho, false);
    assertCheckChirho(
      normalResultChirho.exitCodeChirho === 0,
      `non-strict status failed with exit ${normalResultChirho.exitCodeChirho}\n${normalResultChirho.stdoutChirho}\n${normalResultChirho.stderrChirho}`
    );
    const normalStatusChirho = readStatusChirho(normalResultChirho.outDirChirho);

    const strictResultChirho = runStatusChirho(tempDirChirho, true);
    const strictStatusChirho = readStatusChirho(strictResultChirho.outDirChirho);
    assertCheckChirho(
      strictStatusChirho.certificationCompleteChirho === normalStatusChirho.certificationCompleteChirho,
      "strict and non-strict status runs disagree on certificationCompleteChirho"
    );
    if (normalStatusChirho.certificationCompleteChirho) {
      assertCheckChirho(
        strictResultChirho.exitCodeChirho === 0,
        `strict status failed even though certificationCompleteChirho=true\n${strictResultChirho.stdoutChirho}\n${strictResultChirho.stderrChirho}`
      );
    } else {
      assertCheckChirho(
        strictResultChirho.exitCodeChirho !== 0,
        "strict status unexpectedly exited 0 while certificationCompleteChirho=false"
      );
    }
    console.log(
      `[${MODULE_CHIRHO}] strict exit behavior matches certificationCompleteChirho=${normalStatusChirho.certificationCompleteChirho}`
    );
  } finally {
    rmSync(tempDirChirho, { recursive: true, force: true });
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
