// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Run the repeatable certification-critical verification bundle.
 *
 * This does not certify text or modify review state. It only checks the
 * TypeScript surface used by the certification gate/review tools, checks diff
 * whitespace hygiene, regenerates the current certification status report, and
 * verifies the browser review stations are responding.
 */

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-certification-chirho";

interface CheckCommandChirho {
  labelChirho: string;
  argsChirho: string[];
}

const CHECK_COMMANDS_CHIRHO: CheckCommandChirho[] = [
  {
    labelChirho: "certification TypeScript surface",
    argsChirho: [process.execPath, "run", "typecheck-certification-chirho"],
  },
  {
    labelChirho: "reviewer attribution invariants",
    argsChirho: [process.execPath, "run", "check-reviewer-attribution-chirho"],
  },
  {
    labelChirho: "certification status gate guards",
    argsChirho: [process.execPath, "run", "check-certification-status-gate-guards-chirho"],
  },
  {
    labelChirho: "certification strict status exit behavior",
    argsChirho: [process.execPath, "run", "check-certification-strict-status-chirho"],
  },
  {
    labelChirho: "expert-supplied text CLI guards",
    argsChirho: [process.execPath, "run", "check-expert-supplied-text-guards-chirho"],
  },
  {
    labelChirho: "human-suggested correction CLI guards",
    argsChirho: [process.execPath, "run", "check-human-suggested-correction-cli-guards-chirho"],
  },
  {
    labelChirho: "Latin/symbol review CLI guards",
    argsChirho: [process.execPath, "run", "check-latin-symbol-review-cli-guards-chirho"],
  },
  {
    labelChirho: "Latin/symbol review server guards",
    argsChirho: [process.execPath, "run", "check-latin-symbol-review-server-guards-chirho"],
  },
  {
    labelChirho: "Pass-C human apply CLI guards",
    argsChirho: [process.execPath, "run", "check-pass-c-human-apply-cli-guards-chirho"],
  },
  {
    labelChirho: "Pass-C human reattribution CLI guards",
    argsChirho: [process.execPath, "run", "check-pass-c-human-reattribution-cli-guards-chirho"],
  },
  {
    labelChirho: "Pass-C human review server guards",
    argsChirho: [process.execPath, "run", "check-pass-c-human-review-server-guards-chirho"],
  },
  {
    labelChirho: "policy preparation CLI guards",
    argsChirho: [process.execPath, "run", "check-policy-preparation-cli-guards-chirho"],
  },
  {
    labelChirho: "vision-tier expert review server guards",
    argsChirho: [process.execPath, "run", "check-vision-tier-expert-review-server-guards-chirho"],
  },
  {
    labelChirho: "git diff whitespace hygiene",
    argsChirho: ["git", "diff", "--check"],
  },
  {
    labelChirho: "certification status gate",
    argsChirho: [process.execPath, "run", "transcription-certification-status-chirho"],
  },
  {
    labelChirho: "certification status output hygiene",
    argsChirho: [process.execPath, "run", "check-certification-status-output-hygiene-chirho"],
  },
  {
    labelChirho: "review server health",
    argsChirho: [process.execPath, "run", "review-servers-chirho", "--", "--check-chirho"],
  },
];

function shellCommandTextChirho(argsChirho: string[]): string {
  return argsChirho
    .map((argChirho) => (/\s/.test(argChirho) ? JSON.stringify(argChirho) : argChirho))
    .join(" ");
}

function runCheckCommandChirho(commandChirho: CheckCommandChirho): void {
  console.log(`[${MODULE_CHIRHO}] checking ${commandChirho.labelChirho}: ${shellCommandTextChirho(commandChirho.argsChirho)}`);
  const resultChirho = Bun.spawnSync(commandChirho.argsChirho, {
    cwd: PROJECT_ROOT_CHIRHO,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    throw new Error(`${commandChirho.labelChirho} failed with exit code ${resultChirho.exitCode}`);
  }
}

function mainChirho(): void {
  for (const commandChirho of CHECK_COMMANDS_CHIRHO) {
    runCheckCommandChirho(commandChirho);
  }
  console.log(`[${MODULE_CHIRHO}] all certification checks passed`);
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
