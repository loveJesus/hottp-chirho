// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Guard the quick publication summary against overclaiming. Summary-only mode
 * is useful for triage, but it must not imply that app check/build ran.
 */

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-publication-readiness-summary-guards-chirho";

interface CommandResultChirho {
  exitCodeChirho: number;
  outputChirho: string;
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
}

function mainChirho(): void {
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
  console.log(`[${MODULE_CHIRHO}] publication summary-only guard passed`);
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
