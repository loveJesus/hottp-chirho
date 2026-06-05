// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Check whether the review app build surface is ready, while separately
 * reporting whether the certified UTF-8 Markdown corpus is publication-ready.
 *
 * Default mode exits 0 when the app check/build and certification verification
 * bundle pass, even if the transcription-content gate remains red. Use
 * --require-certified-markdown-chirho for the stricter release gate that exits
 * nonzero until the certified Markdown corpus is complete.
 */

import { readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-app-publication-readiness-chirho";
const APP_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "app-chirho");
const STATUS_JSON_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "status-chirho.json"
);

interface CommandChirho {
  labelChirho: string;
  argsChirho: string[];
  cwdChirho: string;
}

interface CertificationStatusSummaryChirho {
  certificationCompleteChirho?: unknown;
  remainingWorkChirho?: unknown;
  structuralChirho?: {
    strictPassedChirho?: unknown;
    passCOcrHebrewSpanCountChirho?: unknown;
  };
  visionTierChirho?: {
    remainingConfirmationCountChirho?: unknown;
  };
  latinSymbolVisionChirho?: {
    remainingDecisionCountChirho?: unknown;
  };
  humanValidationDbChirho?: {
    genericReviewerRowsChirho?: unknown;
  };
}

function commandTextChirho(commandChirho: CommandChirho): string {
  return commandChirho.argsChirho
    .map((argChirho) => (/\s/.test(argChirho) ? JSON.stringify(argChirho) : argChirho))
    .join(" ");
}

function runCommandChirho(commandChirho: CommandChirho): void {
  console.log(`[${MODULE_CHIRHO}] ${commandChirho.labelChirho}: ${commandTextChirho(commandChirho)}`);
  const resultChirho = Bun.spawnSync(commandChirho.argsChirho, {
    cwd: commandChirho.cwdChirho,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    throw new Error(`${commandChirho.labelChirho} failed with exit code ${resultChirho.exitCode}`);
  }
}

function readCertificationStatusChirho(): CertificationStatusSummaryChirho {
  return JSON.parse(readFileSync(STATUS_JSON_PATH_CHIRHO, "utf8")) as CertificationStatusSummaryChirho;
}

function numberOrUnknownChirho(valueChirho: unknown): string {
  return typeof valueChirho === "number" && Number.isFinite(valueChirho) ? String(valueChirho) : "unknown";
}

function remainingWorkLinesChirho(statusChirho: CertificationStatusSummaryChirho): string[] {
  if (!Array.isArray(statusChirho.remainingWorkChirho)) return ["remaining work unavailable"];
  return statusChirho.remainingWorkChirho.map((itemChirho) => String(itemChirho));
}

function printReadinessSummaryChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const contentReadyChirho = statusChirho.certificationCompleteChirho === true;
  console.log(`[${MODULE_CHIRHO}] Review app build readiness: yes`);
  console.log(`[${MODULE_CHIRHO}] Certified UTF-8 Markdown publication readiness: ${contentReadyChirho ? "yes" : "no"}`);
  console.log(
    `[${MODULE_CHIRHO}] Gate summary: strict=${String(statusChirho.structuralChirho?.strictPassedChirho ?? "unknown")}; ` +
      `rawHebrew=${numberOrUnknownChirho(statusChirho.structuralChirho?.passCOcrHebrewSpanCountChirho)}; ` +
      `visionTier=${numberOrUnknownChirho(statusChirho.visionTierChirho?.remainingConfirmationCountChirho)}; ` +
      `latinSymbol=${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.remainingDecisionCountChirho)}; ` +
      `attributionBlocked=${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerRowsChirho)}`
  );
  if (!contentReadyChirho) {
    console.log(`[${MODULE_CHIRHO}] Certified Markdown blockers:`);
    for (const itemChirho of remainingWorkLinesChirho(statusChirho)) {
      console.log(`- ${itemChirho}`);
    }
  }
}

function mainChirho(): void {
  const requireCertifiedMarkdownChirho = process.argv.includes("--require-certified-markdown-chirho");
  const commandsChirho: CommandChirho[] = [
    {
      labelChirho: "Svelte app check",
      argsChirho: [process.execPath, "run", "check"],
      cwdChirho: APP_DIR_CHIRHO,
    },
    {
      labelChirho: "Svelte app build",
      argsChirho: [process.execPath, "run", "build"],
      cwdChirho: APP_DIR_CHIRHO,
    },
    {
      labelChirho: "transcription certification verification bundle",
      argsChirho: [process.execPath, "run", "check-certification-chirho"],
      cwdChirho: PROJECT_ROOT_CHIRHO,
    },
  ];

  for (const commandChirho of commandsChirho) {
    runCommandChirho(commandChirho);
  }

  const statusChirho = readCertificationStatusChirho();
  printReadinessSummaryChirho(statusChirho);
  if (requireCertifiedMarkdownChirho && statusChirho.certificationCompleteChirho !== true) {
    throw new Error("certified UTF-8 Markdown publication is not ready");
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
