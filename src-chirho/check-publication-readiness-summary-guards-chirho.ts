// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Guard the quick publication summary against overclaiming. Summary-only mode
 * is useful for triage, but it must not imply that app check/build ran.
 */

import { existsSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-publication-readiness-summary-guards-chirho";
const READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO = "READINESS_LOCK_SMOKE_TEST_CHIRHO";
const SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO = "SKIP_READINESS_LOCK_SMOKE_TEST_CHIRHO";
const READINESS_LOCK_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "run-locks-chirho",
  "app-publication-readiness-chirho.lock"
);

interface CommandResultChirho {
  exitCodeChirho: number;
  outputChirho: string;
}

interface AsyncCommandOptionsChirho {
  envChirho?: Record<string, string>;
}

interface AsyncCommandResultChirho {
  exitCodeChirho: number | null;
  outputChirho: string;
  elapsedMsChirho: number;
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): asserts conditionChirho {
  if (!conditionChirho) throw new Error(messageChirho);
}

function runPublicationSummaryChirho(argsChirho: string[]): CommandResultChirho {
  const resultChirho = Bun.spawnSync(argsChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdoutChirho = Buffer.from(resultChirho.stdout).toString("utf8");
  const stderrChirho = Buffer.from(resultChirho.stderr).toString("utf8");
  return {
    exitCodeChirho: resultChirho.exitCode,
    outputChirho: `${stdoutChirho}\n${stderrChirho}`,
  };
}

async function processOutputChirho(processChirho: Bun.Subprocess): Promise<string> {
  const stdoutChirho =
    processChirho.stdout instanceof ReadableStream ? await new Response(processChirho.stdout).text() : "";
  const stderrChirho =
    processChirho.stderr instanceof ReadableStream ? await new Response(processChirho.stderr).text() : "";
  return [stdoutChirho, stderrChirho].filter((valueChirho) => valueChirho.length > 0).join("\n");
}

async function runAsyncCommandChirho(
  argsChirho: string[],
  optionsChirho: AsyncCommandOptionsChirho = {}
): Promise<AsyncCommandResultChirho> {
  const startedAtChirho = Date.now();
  const processChirho = Bun.spawn(argsChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    env: optionsChirho.envChirho,
    stdout: "pipe",
    stderr: "pipe",
  });
  const outputChirho = await processOutputChirho(processChirho);
  const exitCodeChirho = await processChirho.exited;
  return {
    exitCodeChirho,
    outputChirho,
    elapsedMsChirho: Date.now() - startedAtChirho,
  };
}

function readinessLockSmokeTestEnvChirho(): Record<string, string> {
  return {
    ...process.env,
    [READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO]: "1",
  } as Record<string, string>;
}

function skipReadinessLockSmokeTestEnvChirho(): Record<string, string> {
  return {
    ...process.env,
    [SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO]: "1",
  } as Record<string, string>;
}

async function assertReadinessLockSerializesChirho(): Promise<void> {
  if (process.env[SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO] === "1") {
    assertCheckChirho(
      existsSync(READINESS_LOCK_DIR_CHIRHO),
      `${SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO}=1 requires an active app publication readiness lock`
    );
    console.log(
      `[${MODULE_CHIRHO}] skipped readiness lock smoke test because ${SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO}=1`
    );
    return;
  }
  const unguardedResultChirho = await runAsyncCommandChirho([
    process.execPath,
    "run",
    "src-chirho/check-app-publication-readiness-chirho.ts",
    "--lock-smoke-test-chirho=0",
  ]);
  assertCheckChirho(
    unguardedResultChirho.exitCodeChirho !== 0,
    "readiness lock smoke-test flag unexpectedly passed without guard environment variable"
  );
  assertCheckChirho(
    unguardedResultChirho.outputChirho.includes(`${READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO}=1`),
    `unguarded smoke-test failure did not name required env var\n${unguardedResultChirho.outputChirho}`
  );
  const firstProcessChirho = Bun.spawn(
    [process.execPath, "run", "src-chirho/check-app-publication-readiness-chirho.ts", "--lock-smoke-test-chirho=900"],
    {
      cwd: PROJECT_ROOT_CHIRHO,
      env: readinessLockSmokeTestEnvChirho(),
      stdout: "pipe",
      stderr: "pipe",
    }
  );
  await new Promise((resolveChirho) => setTimeout(resolveChirho, 150));
  const nestedSkipResultPromiseChirho = runAsyncCommandChirho([
    process.execPath,
    "run",
    "check-publication-readiness-summary-guards-chirho",
  ], { envChirho: skipReadinessLockSmokeTestEnvChirho() });
  const secondResultPromiseChirho = runAsyncCommandChirho([
    process.execPath,
    "run",
    "src-chirho/check-app-publication-readiness-chirho.ts",
    "--lock-smoke-test-chirho=0",
  ], { envChirho: readinessLockSmokeTestEnvChirho() });
  const [nestedSkipResultChirho, secondResultChirho] = await Promise.all([
    nestedSkipResultPromiseChirho,
    secondResultPromiseChirho,
  ]);
  const firstOutputChirho = await processOutputChirho(firstProcessChirho);
  const firstExitCodeChirho = await firstProcessChirho.exited;
  assertCheckChirho(
    firstExitCodeChirho === 0,
    `first readiness lock smoke test exited ${String(firstExitCodeChirho)}\n${firstOutputChirho}`
  );
  assertCheckChirho(
    nestedSkipResultChirho.exitCodeChirho === 0 &&
      nestedSkipResultChirho.outputChirho.includes(`skipped readiness lock smoke test because ${SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO}=1`),
    `nested publication summary guard did not pass with lock smoke test skipped while app readiness lock was held\n${nestedSkipResultChirho.outputChirho}`
  );
  assertCheckChirho(
    secondResultChirho.exitCodeChirho === 0,
    `second readiness lock smoke test exited ${String(secondResultChirho.exitCodeChirho)}\n${secondResultChirho.outputChirho}`
  );
  assertCheckChirho(
    firstOutputChirho.includes("acquired readiness lock") && firstOutputChirho.includes("released readiness lock"),
    `first readiness lock smoke test did not acquire/release lock\n${firstOutputChirho}`
  );
  assertCheckChirho(
    secondResultChirho.outputChirho.includes("acquired readiness lock") &&
      secondResultChirho.outputChirho.includes("released readiness lock"),
    `second readiness lock smoke test did not acquire/release lock\n${secondResultChirho.outputChirho}`
  );
  assertCheckChirho(
    secondResultChirho.elapsedMsChirho >= 500,
    `second readiness lock smoke test did not wait for the first lock holder; elapsed ${secondResultChirho.elapsedMsChirho}ms`
  );
}

function assertSummaryOnlyDoesNotBuildChirho(outputChirho: string): void {
  assertCheckChirho(
    outputChirho.includes("Summary-only mode: using existing status artifact"),
    "publication summary must explicitly identify summary-only mode"
  );
  assertCheckChirho(
    outputChirho.includes("Review app build readiness: not checked in summary-only mode"),
    "summary-only publication output must not imply app build readiness was verified"
  );
  assertCheckChirho(
    !outputChirho.includes("Review app build readiness: yes"),
    "summary-only publication output must not report app build readiness yes"
  );
  assertCheckChirho(
    !outputChirho.includes("Svelte app check:") && !outputChirho.includes("Svelte app build:"),
    "summary-only publication output must not run the Svelte check/build path"
  );
  assertCheckChirho(
    outputChirho.includes("Certified UTF-8 Markdown publication readiness:"),
    "publication summary must still report certified Markdown readiness"
  );
  assertCheckChirho(
    outputChirho.includes("Attribution cleanup:") &&
      outputChirho.includes("unchanged") &&
      outputChirho.includes("changed") &&
      outputChirho.includes("reattribute unchanged rows only if genuinely attributable"),
    "publication summary must split attribution cleanup into unchanged/changed routing"
  );
  assertCheckChirho(
    outputChirho.includes("Raw Hebrew attention triage:") &&
      outputChirho.includes("overlapping signals") &&
      outputChirho.includes("pre-review notes") &&
      outputChirho.includes("uncovered attention") &&
      outputChirho.includes("reason gaps"),
    "publication summary must surface raw Hebrew triage and pre-review coverage"
  );
  assertCheckChirho(
    outputChirho.includes("Raw Hebrew low confidence:") &&
      outputChirho.includes("Raw Hebrew multi-token:") &&
      outputChirho.includes("Raw Hebrew delimiter/damaged text:") &&
      outputChirho.includes("Raw Hebrew no direct read:") &&
      outputChirho.includes("Raw Hebrew pre-review notes:"),
    "publication summary must link the actionable raw Hebrew attention lanes"
  );
  assertCheckChirho(
    outputChirho.includes("Latin/symbol French:") &&
      outputChirho.includes("Latin/symbol Latin/non-French:") &&
      outputChirho.includes("Latin/symbol script/sigla symbols:") &&
      outputChirho.includes("Latin/symbol nontrivial symbols:"),
    "publication summary must link the actionable Latin/symbol script and risk lanes"
  );
  assertCheckChirho(
    outputChirho.includes("Expert Syriac nonblank:") &&
      outputChirho.includes("Expert Syriac Pass-C:") &&
      outputChirho.includes("Expert Arabic:") &&
      outputChirho.includes("Expert Arabic explicit:") &&
      outputChirho.includes("Expert Hebrew explicit:") &&
      outputChirho.includes("Expert Hebrew D1:") &&
      outputChirho.includes("Expert Greek explicit:") &&
      outputChirho.includes("Expert Greek Pass-C:"),
    "publication summary must link the actionable expert script and source lanes"
  );
}

async function mainChirho(): Promise<void> {
  const summaryResultChirho = runPublicationSummaryChirho([process.execPath, "run", "publication-readiness-summary-chirho"]);
  const summaryOutputChirho = summaryResultChirho.outputChirho;
  assertCheckChirho(
    summaryResultChirho.exitCodeChirho === 0,
    `publication summary exited ${summaryResultChirho.exitCodeChirho}\n${summaryOutputChirho}`
  );
  assertSummaryOnlyDoesNotBuildChirho(summaryOutputChirho);
  const certifiedReadyChirho = summaryOutputChirho.includes("Certified UTF-8 Markdown publication readiness: yes");
  assertCheckChirho(
    certifiedReadyChirho || summaryOutputChirho.includes("Certified UTF-8 Markdown publication readiness: no"),
    "publication summary must render a yes/no certified Markdown readiness verdict"
  );

  const strictSummaryResultChirho = runPublicationSummaryChirho([
    process.execPath,
    "run",
    "src-chirho/check-app-publication-readiness-chirho.ts",
    "--summary-only-chirho",
    "--require-certified-markdown-chirho",
  ]);
  assertSummaryOnlyDoesNotBuildChirho(strictSummaryResultChirho.outputChirho);
  if (certifiedReadyChirho) {
    assertCheckChirho(
      strictSummaryResultChirho.exitCodeChirho === 0,
      `strict publication summary must pass when certified Markdown is ready\n${strictSummaryResultChirho.outputChirho}`
    );
  } else {
    assertCheckChirho(
      strictSummaryResultChirho.exitCodeChirho !== 0,
      "strict publication summary must fail while certified Markdown is not ready"
    );
    assertCheckChirho(
      strictSummaryResultChirho.outputChirho.includes("certified UTF-8 Markdown publication is not ready"),
      "strict publication summary failure must name certified Markdown readiness"
    );
  }
  await assertReadinessLockSerializesChirho();
  console.log(`[${MODULE_CHIRHO}] publication summary-only and readiness-lock guards passed`);
}

if (import.meta.main) {
  try {
    await mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
