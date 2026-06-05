// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Non-mutating guard checks for the human-suggested correction CLI.
 *
 * These checks prove the WLC correction apply tool cannot stamp human
 * provenance under --certify-human without explicit human reviewer attribution.
 * Successful checks write only a temporary report path.
 */

import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-human-suggested-correction-cli-guards-chirho";
const APPLY_SCRIPT_CHIRHO = "apply-human-suggested-corrections-chirho";

function commandTextChirho(argsChirho: string[]): string {
  return argsChirho.map((argChirho) => (/\s/.test(argChirho) ? JSON.stringify(argChirho) : argChirho)).join(" ");
}

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

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): void {
  if (!conditionChirho) throw new Error(messageChirho);
}

function tempReportChirho(): { dirChirho: string; reportPathChirho: string } {
  const dirChirho = mkdtempSync(join(tmpdir(), "human-suggested-correction-cli-guard-chirho-"));
  return { dirChirho, reportPathChirho: join(dirChirho, "report-chirho.json") };
}

function applyArgsChirho(reportPathChirho: string, extraArgsChirho: string[]): string[] {
  return [
    process.execPath,
    "run",
    APPLY_SCRIPT_CHIRHO,
    "--",
    `--report=${reportPathChirho}`,
    ...extraArgsChirho,
  ];
}

function checkRejectedCertifyHumanChirho(extraArgsChirho: string[], expectedMessageChirho: string): void {
  const tempChirho = tempReportChirho();
  try {
    const argsChirho = applyArgsChirho(tempChirho.reportPathChirho, [
      "--apply",
      "--certify-human",
      "--validation-id-chirho=999999",
      "--suggested-text-chirho=א",
      ...extraArgsChirho,
    ]);
    const resultChirho = runCommandChirho(argsChirho);
    const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
    assertCheckChirho(
      resultChirho.exitCodeChirho !== 0,
      `rejected command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
    );
    assertCheckChirho(
      combinedOutputChirho.includes(expectedMessageChirho),
      `rejected command failed for the wrong reason: ${combinedOutputChirho}`
    );
    assertCheckChirho(!existsSync(tempChirho.reportPathChirho), "rejected command wrote a report file");
  } finally {
    rmSync(tempChirho.dirChirho, { force: true, recursive: true });
  }
}

function checkRejectedApplyChirho(extraArgsChirho: string[], expectedMessageChirho: string): void {
  const tempChirho = tempReportChirho();
  try {
    const argsChirho = applyArgsChirho(tempChirho.reportPathChirho, [
      "--apply",
      "--validation-id-chirho=999999",
      "--suggested-text-chirho=א",
      ...extraArgsChirho,
    ]);
    const resultChirho = runCommandChirho(argsChirho);
    const combinedOutputChirho = `${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`;
    assertCheckChirho(
      resultChirho.exitCodeChirho !== 0,
      `rejected apply command unexpectedly succeeded: ${commandTextChirho(argsChirho)}`
    );
    assertCheckChirho(
      combinedOutputChirho.includes(expectedMessageChirho),
      `rejected apply command failed for the wrong reason: ${combinedOutputChirho}`
    );
    assertCheckChirho(!existsSync(tempChirho.reportPathChirho), "rejected apply command wrote a report file");
  } finally {
    rmSync(tempChirho.dirChirho, { force: true, recursive: true });
  }
}

function checkHumanCertifyDryRunChirho(): void {
  const tempChirho = tempReportChirho();
  try {
    const argsChirho = applyArgsChirho(tempChirho.reportPathChirho, [
      "--certify-human",
      "--reviewer-chirho=hallelujah-chirho",
    ]);
    const resultChirho = runCommandChirho(argsChirho);
    assertCheckChirho(
      resultChirho.exitCodeChirho === 0,
      `human certify dry-run failed: ${commandTextChirho(argsChirho)}\n${resultChirho.stdoutChirho}\n${resultChirho.stderrChirho}`
    );
    assertCheckChirho(existsSync(tempChirho.reportPathChirho), "human certify dry-run did not write temp report");
  } finally {
    rmSync(tempChirho.dirChirho, { force: true, recursive: true });
  }
}

function mainChirho(): void {
  checkRejectedApplyChirho([], "--reviewer-chirho is required with --apply");
  checkRejectedApplyChirho(
    ["--reviewer-chirho=codex-gpt5-chirho"],
    "--reviewer-chirho must identify a human reviewer; machine reviewer codex-gpt5-chirho cannot certify"
  );
  checkRejectedApplyChirho(
    ["--reviewer-chirho=human-chirho"],
    "--reviewer-chirho must identify the explicit reviewer, not generic human-chirho"
  );
  checkRejectedApplyChirho(
    ["--reviewer-chirho=<explicit-human-reviewer-id-chirho>"],
    "--reviewer-chirho must identify the explicit reviewer, not template placeholder <explicit-human-reviewer-id-chirho>"
  );
  checkRejectedCertifyHumanChirho([], "--reviewer-chirho is required with --certify-human");
  checkRejectedCertifyHumanChirho(
    ["--reviewer-chirho=codex-gpt5-chirho"],
    "--reviewer-chirho must identify a human reviewer; machine reviewer codex-gpt5-chirho cannot certify"
  );
  checkRejectedCertifyHumanChirho(
    ["--reviewer-chirho=human-chirho"],
    "--reviewer-chirho must identify the explicit reviewer, not generic human-chirho"
  );
  checkRejectedCertifyHumanChirho(
    ["--reviewer-chirho=<explicit-human-reviewer-id-chirho>"],
    "--reviewer-chirho must identify the explicit reviewer, not template placeholder <explicit-human-reviewer-id-chirho>"
  );
  checkHumanCertifyDryRunChirho();
  console.log(`[${MODULE_CHIRHO}] human-suggested correction CLI guards passed`);
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
