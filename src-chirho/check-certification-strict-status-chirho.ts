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
  structuralChirho?: {
    strictPassedChirho?: boolean;
    passCOcrHebrewSpanCountChirho?: number;
  };
  visionTierChirho?: {
    completeVisionItemCountChirho?: number;
  };
  normalizationChirho?: {
    liveNonNfcSpanTextFieldCountChirho?: number;
  };
}

interface StatusRunResultChirho {
  exitCodeChirho: number;
  stdoutChirho: string;
  stderrChirho: string;
  outDirChirho: string;
}

interface StatusSummaryLineChirho {
  completeChirho: boolean;
  strictModeChirho: boolean;
  strictExportChirho: boolean;
  rawHebrewChirho: number;
  visionTierChirho: number;
  liveNonNfcChirho: number;
  reportChirho: string;
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): asserts conditionChirho {
  if (!conditionChirho) throw new Error(messageChirho);
}

function booleanFieldChirho(valueChirho: unknown, labelChirho: string): boolean {
  assertCheckChirho(typeof valueChirho === "boolean", `${labelChirho} must be a boolean`);
  return valueChirho;
}

function numberFieldChirho(valueChirho: unknown, labelChirho: string): number {
  assertCheckChirho(typeof valueChirho === "number" && Number.isFinite(valueChirho), `${labelChirho} must be a finite number`);
  return valueChirho;
}

function objectFieldChirho(valueChirho: unknown, labelChirho: string): Record<string, unknown> {
  assertCheckChirho(valueChirho !== null && typeof valueChirho === "object" && !Array.isArray(valueChirho), `${labelChirho} must be an object`);
  return valueChirho as Record<string, unknown>;
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

function parseStatusSummaryLineChirho(outputChirho: string): StatusSummaryLineChirho {
  const matchChirho = outputChirho.match(
    /^\[transcription-certification-status-chirho\] complete=(true|false) strictMode=(true|false) strictExport=(true|false) rawHebrew=(\d+) visionTier=(\d+) liveNonNfc=(\d+) report=(.+)$/m
  );
  assertCheckChirho(matchChirho !== null, `status stdout missing parseable summary line\n${outputChirho}`);
  const [
    ,
    completeTextChirho,
    strictModeTextChirho,
    strictExportTextChirho,
    rawHebrewTextChirho,
    visionTierTextChirho,
    liveNonNfcTextChirho,
    reportTextChirho,
  ] = matchChirho;
  return {
    completeChirho: completeTextChirho === "true",
    strictModeChirho: strictModeTextChirho === "true",
    strictExportChirho: strictExportTextChirho === "true",
    rawHebrewChirho: Number.parseInt(rawHebrewTextChirho!, 10),
    visionTierChirho: Number.parseInt(visionTierTextChirho!, 10),
    liveNonNfcChirho: Number.parseInt(liveNonNfcTextChirho!, 10),
    reportChirho: reportTextChirho!,
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

function assertStatusSummaryMatchesJsonChirho(
  resultChirho: StatusRunResultChirho,
  statusChirho: CertificationStatusForStrictGuardChirho,
  expectedStrictModeChirho: boolean
): void {
  const summaryChirho = parseStatusSummaryLineChirho(resultChirho.stdoutChirho);
  const structuralChirho = objectFieldChirho(statusChirho.structuralChirho, "status.structuralChirho");
  const visionTierChirho = objectFieldChirho(statusChirho.visionTierChirho, "status.visionTierChirho");
  const normalizationChirho = objectFieldChirho(statusChirho.normalizationChirho, "status.normalizationChirho");
  assertCheckChirho(
    summaryChirho.completeChirho === booleanFieldChirho(statusChirho.certificationCompleteChirho, "status.certificationCompleteChirho"),
    "status summary complete value does not match certificationCompleteChirho"
  );
  assertCheckChirho(
    summaryChirho.strictModeChirho === expectedStrictModeChirho,
    "status summary strictMode value does not match invocation"
  );
  assertCheckChirho(
    summaryChirho.strictExportChirho === booleanFieldChirho(structuralChirho.strictPassedChirho, "status.structuralChirho.strictPassedChirho"),
    "status summary strictExport value does not match structuralChirho.strictPassedChirho"
  );
  assertCheckChirho(
    summaryChirho.rawHebrewChirho ===
      numberFieldChirho(structuralChirho.passCOcrHebrewSpanCountChirho, "status.structuralChirho.passCOcrHebrewSpanCountChirho"),
    "status summary rawHebrew value does not match structuralChirho.passCOcrHebrewSpanCountChirho"
  );
  assertCheckChirho(
    summaryChirho.visionTierChirho ===
      numberFieldChirho(visionTierChirho.completeVisionItemCountChirho, "status.visionTierChirho.completeVisionItemCountChirho"),
    "status summary visionTier value does not match visionTierChirho.completeVisionItemCountChirho"
  );
  assertCheckChirho(
    summaryChirho.liveNonNfcChirho ===
      numberFieldChirho(normalizationChirho.liveNonNfcSpanTextFieldCountChirho, "status.normalizationChirho.liveNonNfcSpanTextFieldCountChirho"),
    "status summary liveNonNfc value does not match normalizationChirho.liveNonNfcSpanTextFieldCountChirho"
  );
  assertCheckChirho(
    summaryChirho.reportChirho === join(resultChirho.outDirChirho, "status-chirho.md"),
    "status summary report path does not match generated Markdown path"
  );
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
    assertStatusSummaryMatchesJsonChirho(normalResultChirho, normalStatusChirho, false);

    const strictResultChirho = runStatusChirho(tempDirChirho, true);
    const strictStatusChirho = readStatusChirho(strictResultChirho.outDirChirho);
    assertStatusSummaryMatchesJsonChirho(strictResultChirho, strictStatusChirho, true);
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
