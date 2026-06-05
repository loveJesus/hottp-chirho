// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Guard the quick publication summary against overclaiming. Summary-only mode
 * is useful for triage, but it must not imply that app check/build ran.
 */

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-publication-readiness-summary-guards-chirho";

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): asserts conditionChirho {
  if (!conditionChirho) throw new Error(messageChirho);
}

function mainChirho(): void {
  const resultChirho = Bun.spawnSync([process.execPath, "run", "publication-readiness-summary-chirho"], {
    cwd: PROJECT_ROOT_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdoutChirho = Buffer.from(resultChirho.stdout).toString("utf8");
  const stderrChirho = Buffer.from(resultChirho.stderr).toString("utf8");
  const outputChirho = `${stdoutChirho}\n${stderrChirho}`;
  assertCheckChirho(resultChirho.exitCode === 0, `publication summary exited ${resultChirho.exitCode}\n${outputChirho}`);
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
