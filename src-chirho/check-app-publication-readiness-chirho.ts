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
 *
 * Use --summary-only-chirho to print the current status artifact without
 * running the app build or certification bundle. That mode is a quick triage
 * view, not a publication verification.
 */

import { readFileSync } from "fs";
import { join, relative } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-app-publication-readiness-chirho";
const APP_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "app-chirho");
const STATUS_JSON_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "status-chirho.json"
);
const RAW_HEBREW_HUMAN_CERTIFICATION_QUICKSTART_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "raw-hebrew-human-certification-quickstart-2026-06-05-chirho.md"
);
const LATIN_SYMBOL_HUMAN_REVIEW_QUICKSTART_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "latin-symbol-human-review-quickstart-2026-06-05-chirho.md"
);
const VISION_TIER_EXPERT_CONFIRMATION_QUICKSTART_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-tier-expert-confirmation-quickstart-2026-06-05-chirho.md"
);
const HALLELUJAH_REVIEW_SESSION_GUIDE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "hallelujah-review-session-guide-2026-06-05-chirho.md"
);

interface CommandChirho {
  labelChirho: string;
  argsChirho: string[];
  cwdChirho: string;
}

interface CertificationStatusSummaryChirho {
  generatedAtChirho?: unknown;
  certificationCompleteChirho?: unknown;
  remainingWorkChirho?: unknown;
  reviewStartLinksChirho?: Record<string, unknown>;
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

function stringOrUnknownChirho(valueChirho: unknown): string {
  return typeof valueChirho === "string" && valueChirho.length > 0 ? valueChirho : "unknown";
}

function remainingWorkLinesChirho(statusChirho: CertificationStatusSummaryChirho): string[] {
  if (!Array.isArray(statusChirho.remainingWorkChirho)) return ["remaining work unavailable"];
  return statusChirho.remainingWorkChirho.map((itemChirho) => String(itemChirho));
}

function reviewStartLinkChirho(statusChirho: CertificationStatusSummaryChirho, keyChirho: string): string | null {
  const linkChirho = statusChirho.reviewStartLinksChirho?.[keyChirho];
  return typeof linkChirho === "string" && linkChirho.length > 0 ? linkChirho : null;
}

function relativeProjectPathChirho(pathChirho: string): string {
  const relativePathChirho = relative(PROJECT_ROOT_CHIRHO, pathChirho).replaceAll("\\", "/");
  return relativePathChirho.startsWith("..") ? pathChirho : relativePathChirho;
}

function printNextReviewLinksChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const linksChirho: Array<[string, string | null]> = [
    ["Raw Hebrew primary", reviewStartLinkChirho(statusChirho, "rawHebrewVols35UnvalidatedChirho")],
    ["Raw Hebrew attribution blocked", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionBlockedChirho")],
    ["Raw Hebrew attribution re-review", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionRereviewChirho")],
    ["Latin/symbol proofing", reviewStartLinkChirho(statusChirho, "latinSymbolAllChirho")],
    ["Expert blank Syriac", reviewStartLinkChirho(statusChirho, "expertSyriacBlankChirho")],
    ["Expert Hebrew/WLC", reviewStartLinkChirho(statusChirho, "expertHebrewChirho")],
    ["Expert Greek", reviewStartLinkChirho(statusChirho, "expertGreekChirho")],
  ].filter((entryChirho): entryChirho is [string, string] => entryChirho[1] !== null);
  if (linksChirho.length === 0) return;
  console.log(`[${MODULE_CHIRHO}] Next review links:`);
  for (const [labelChirho, linkChirho] of linksChirho) {
    console.log(`- ${labelChirho}: ${linkChirho}`);
  }
}

function printReviewGuidePathsChirho(): void {
  const guidePathsChirho: Array<[string, string]> = [
    ["Raw Hebrew certification quickstart", RAW_HEBREW_HUMAN_CERTIFICATION_QUICKSTART_PATH_CHIRHO],
    ["Latin/symbol proofing quickstart", LATIN_SYMBOL_HUMAN_REVIEW_QUICKSTART_PATH_CHIRHO],
    ["Expert confirmation quickstart", VISION_TIER_EXPERT_CONFIRMATION_QUICKSTART_PATH_CHIRHO],
    ["Hallelujah review session guide", HALLELUJAH_REVIEW_SESSION_GUIDE_PATH_CHIRHO],
  ];
  console.log(`[${MODULE_CHIRHO}] Review guides:`);
  for (const [labelChirho, pathChirho] of guidePathsChirho) {
    console.log(`- ${labelChirho}: ${relativeProjectPathChirho(pathChirho)}`);
  }
}

function printReadinessSummaryChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const contentReadyChirho = statusChirho.certificationCompleteChirho === true;
  console.log(`[${MODULE_CHIRHO}] Review app build readiness: yes`);
  console.log(`[${MODULE_CHIRHO}] Status artifact generated: ${stringOrUnknownChirho(statusChirho.generatedAtChirho)}`);
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
    printNextReviewLinksChirho(statusChirho);
    printReviewGuidePathsChirho();
  }
}

function mainChirho(): void {
  const requireCertifiedMarkdownChirho = process.argv.includes("--require-certified-markdown-chirho");
  const summaryOnlyChirho = process.argv.includes("--summary-only-chirho");
  if (summaryOnlyChirho) {
    console.log(
      `[${MODULE_CHIRHO}] Summary-only mode: using existing status artifact; run without --summary-only-chirho before any publication claim.`
    );
    const statusChirho = readCertificationStatusChirho();
    printReadinessSummaryChirho(statusChirho);
    if (requireCertifiedMarkdownChirho && statusChirho.certificationCompleteChirho !== true) {
      throw new Error("certified UTF-8 Markdown publication is not ready");
    }
    return;
  }
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
