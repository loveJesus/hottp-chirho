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
 *
 * Use --lock-smoke-test-chirho=<ms> only from guard tests with
 * READINESS_LOCK_SMOKE_TEST_CHIRHO=1; it exercises the readiness lock without
 * running the app build or certification bundle.
 */

import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "check-app-publication-readiness-chirho";
const APP_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "app-chirho");
const READINESS_LOCK_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "run-locks-chirho",
  "app-publication-readiness-chirho.lock"
);
const READINESS_LOCK_WAIT_MS_CHIRHO = 180_000;
const READINESS_LOCK_STALE_MS_CHIRHO = 15 * 60_000;
const READINESS_LOCK_POLL_MS_CHIRHO = 250;
const READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO = "READINESS_LOCK_SMOKE_TEST_CHIRHO";
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
  rawHebrewChirho?: {
    livePendingSpanCountChirho?: unknown;
  };
  structuralChirho?: {
    strictPassedChirho?: unknown;
    passCOcrHebrewSpanCountChirho?: unknown;
  };
  visionTierChirho?: {
    remainingConfirmationCountChirho?: unknown;
    pendingVisionCountsChirho?: Record<string, unknown>;
    pendingBlankTextCountsChirho?: Record<string, unknown>;
  };
  latinSymbolVisionChirho?: {
    remainingDecisionCountChirho?: unknown;
    pendingDecisionCountsChirho?: Record<string, unknown>;
    pendingMixedScriptSymbolItemCountChirho?: unknown;
    pendingNontrivialSymbolItemCountChirho?: unknown;
    pendingTrivialPunctuationSymbolItemCountChirho?: unknown;
  };
  humanValidationDbChirho?: {
    genericReviewerRowsChirho?: unknown;
    genericReviewerLiveTextMatchRowsChirho?: unknown;
    genericReviewerLiveTextMismatchRowsChirho?: unknown;
    genericReviewerLiveTextUnknownRowsChirho?: unknown;
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

function sleepSyncChirho(msChirho: number): void {
  const bufferChirho = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(bufferChirho), 0, 0, msChirho);
}

function lockInfoTextChirho(): string {
  return JSON.stringify(
    {
      moduleChirho: MODULE_CHIRHO,
      pidChirho: process.pid,
      startedAtChirho: new Date().toISOString(),
    },
    null,
    2
  );
}

function acquireReadinessLockChirho(): () => void {
  mkdirSync(dirname(READINESS_LOCK_DIR_CHIRHO), { recursive: true });
  const deadlineChirho = Date.now() + READINESS_LOCK_WAIT_MS_CHIRHO;
  while (true) {
    try {
      mkdirSync(READINESS_LOCK_DIR_CHIRHO);
      writeFileSync(join(READINESS_LOCK_DIR_CHIRHO, "owner-chirho.json"), `${lockInfoTextChirho()}\n`);
      console.log(`[${MODULE_CHIRHO}] acquired readiness lock: ${relativeProjectPathChirho(READINESS_LOCK_DIR_CHIRHO)}`);
      return () => {
        rmSync(READINESS_LOCK_DIR_CHIRHO, { recursive: true, force: true });
        console.log(`[${MODULE_CHIRHO}] released readiness lock`);
      };
    } catch (errorChirho) {
      const codeChirho = typeof errorChirho === "object" && errorChirho !== null && "code" in errorChirho
        ? String((errorChirho as { code?: unknown }).code)
        : "";
      if (codeChirho !== "EEXIST") throw errorChirho;
      let staleChirho = false;
      try {
        const ageMsChirho = Date.now() - statSync(READINESS_LOCK_DIR_CHIRHO).mtimeMs;
        staleChirho = ageMsChirho > READINESS_LOCK_STALE_MS_CHIRHO;
      } catch {
        staleChirho = true;
      }
      if (staleChirho) {
        rmSync(READINESS_LOCK_DIR_CHIRHO, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadlineChirho) {
        throw new Error(
          `timed out waiting for readiness lock ${relativeProjectPathChirho(READINESS_LOCK_DIR_CHIRHO)}`
        );
      }
      sleepSyncChirho(READINESS_LOCK_POLL_MS_CHIRHO);
    }
  }
}

function parseLockSmokeTestMsChirho(argsChirho: string[]): number | null {
  const prefixChirho = "--lock-smoke-test-chirho=";
  const argChirho = argsChirho.find((candidateChirho) => candidateChirho.startsWith(prefixChirho));
  if (argChirho === undefined) return null;
  const valueChirho = argChirho.slice(prefixChirho.length);
  const parsedChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(parsedChirho) || parsedChirho < 0 || String(parsedChirho) !== valueChirho.trim()) {
    throw new Error(`invalid ${prefixChirho}${valueChirho}`);
  }
  return parsedChirho;
}

function readCertificationStatusChirho(): CertificationStatusSummaryChirho {
  return JSON.parse(readFileSync(STATUS_JSON_PATH_CHIRHO, "utf8")) as CertificationStatusSummaryChirho;
}

function numberOrUnknownChirho(valueChirho: unknown): string {
  return typeof valueChirho === "number" && Number.isFinite(valueChirho) ? String(valueChirho) : "unknown";
}

function finiteNumberChirho(valueChirho: unknown): number | null {
  return typeof valueChirho === "number" && Number.isFinite(valueChirho) ? valueChirho : null;
}

function recordNumberChirho(recordChirho: Record<string, unknown> | undefined, keyChirho: string): number | null {
  return finiteNumberChirho(recordChirho?.[keyChirho]);
}

function sumNumbersChirho(valuesChirho: Array<number | null>): number | null {
  if (valuesChirho.some((valueChirho) => valueChirho === null)) return null;
  let sumChirho = 0;
  for (const valueChirho of valuesChirho) {
    sumChirho += valueChirho ?? 0;
  }
  return sumChirho;
}

function numberTextChirho(valueChirho: number | null): string {
  return valueChirho === null ? "unknown" : String(valueChirho);
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
    ["Raw Hebrew confident disagreement", reviewStartLinkChirho(statusChirho, "rawHebrewConfidentDirectReadDisagreementChirho")],
    ["Raw Hebrew attribution blocked", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionBlockedChirho")],
    ["Raw Hebrew attribution unchanged", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionBlockedUnchangedChirho")],
    ["Raw Hebrew attribution re-review", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionRereviewChirho")],
    ["Raw Hebrew attribution changed re-review", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionRereviewChangedChirho")],
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

function printReviewRoutingSummaryChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const rawHebrewPendingChirho =
    finiteNumberChirho(statusChirho.rawHebrewChirho?.livePendingSpanCountChirho) ??
    finiteNumberChirho(statusChirho.structuralChirho?.passCOcrHebrewSpanCountChirho);
  const pendingExpertCountsChirho = statusChirho.visionTierChirho?.pendingVisionCountsChirho;
  const expertHebrewChirho = recordNumberChirho(pendingExpertCountsChirho, "hebrew-chirho");
  const expertGreekChirho = recordNumberChirho(pendingExpertCountsChirho, "greek-chirho");
  const expertSyriacChirho = recordNumberChirho(pendingExpertCountsChirho, "syriac-chirho");
  const expertArabicChirho = recordNumberChirho(pendingExpertCountsChirho, "arabic-chirho");
  const blankSyriacChirho = recordNumberChirho(statusChirho.visionTierChirho?.pendingBlankTextCountsChirho, "syriac-chirho");
  const hallelujahScriptTargetsChirho = sumNumbersChirho([
    rawHebrewPendingChirho,
    expertHebrewChirho,
    expertGreekChirho,
  ]);
  const externalScriptTargetsChirho = sumNumbersChirho([
    expertSyriacChirho,
    expertArabicChirho,
  ]);

  const pendingLatinCountsChirho = statusChirho.latinSymbolVisionChirho?.pendingDecisionCountsChirho;
  const frenchChirho = recordNumberChirho(pendingLatinCountsChirho, "french-chirho");
  const latinNonFrenchChirho = recordNumberChirho(pendingLatinCountsChirho, "latin-non-french-chirho");
  const symbolChirho = recordNumberChirho(pendingLatinCountsChirho, "symbol-chirho");

  console.log(`[${MODULE_CHIRHO}] Review routing summary:`);
  console.log(
    `- Hallelujah script lanes: ${numberTextChirho(hallelujahScriptTargetsChirho)} target(s) = ` +
      `raw Hebrew ${numberTextChirho(rawHebrewPendingChirho)} + ` +
      `expert Hebrew/WLC ${numberTextChirho(expertHebrewChirho)} + ` +
      `expert Greek ${numberTextChirho(expertGreekChirho)}`
  );
  console.log(
    `- External script-expert lanes: ${numberTextChirho(externalScriptTargetsChirho)} item(s) = ` +
      `Syriac ${numberTextChirho(expertSyriacChirho)} + Arabic ${numberTextChirho(expertArabicChirho)}; ` +
      `blank Syriac handoff ${numberTextChirho(blankSyriacChirho)}`
  );
  console.log(
    `- Latin/symbol proofing: ${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.remainingDecisionCountChirho)} item(s) = ` +
      `French ${numberTextChirho(frenchChirho)} + ` +
      `Latin/non-French ${numberTextChirho(latinNonFrenchChirho)} + ` +
      `symbol ${numberTextChirho(symbolChirho)} ` +
      `(symbol risk: ${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.pendingMixedScriptSymbolItemCountChirho)} script/sigla, ` +
      `${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.pendingNontrivialSymbolItemCountChirho)} nontrivial, ` +
      `${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.pendingTrivialPunctuationSymbolItemCountChirho)} trivial pending)`
  );
  console.log(
    `- Attribution cleanup: ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerRowsChirho)} row(s); ` +
      `unchanged ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextMatchRowsChirho)}, ` +
      `changed ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextMismatchRowsChirho)}, ` +
      `unknown ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextUnknownRowsChirho)}; ` +
      `reattribute unchanged rows only if genuinely attributable, otherwise use re-review`
  );
}

function printReadinessSummaryChirho(
  statusChirho: CertificationStatusSummaryChirho,
  appBuildCheckedChirho: boolean
): void {
  const contentReadyChirho = statusChirho.certificationCompleteChirho === true;
  console.log(
    `[${MODULE_CHIRHO}] Review app build readiness: ${
      appBuildCheckedChirho
        ? "yes"
        : "not checked in summary-only mode; run bun run check-app-publication-readiness-chirho for app check/build"
    }`
  );
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
    printReviewRoutingSummaryChirho(statusChirho);
    printNextReviewLinksChirho(statusChirho);
    printReviewGuidePathsChirho();
  }
}

function mainChirho(): void {
  const requireCertifiedMarkdownChirho = process.argv.includes("--require-certified-markdown-chirho");
  const summaryOnlyChirho = process.argv.includes("--summary-only-chirho");
  const lockSmokeTestMsChirho = parseLockSmokeTestMsChirho(process.argv);
  if (lockSmokeTestMsChirho !== null) {
    if (process.env[READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO] !== "1") {
      throw new Error(
        `--lock-smoke-test-chirho is guard-only and requires ${READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO}=1`
      );
    }
    const releaseReadinessLockChirho = acquireReadinessLockChirho();
    try {
      console.log(`[${MODULE_CHIRHO}] lock smoke test holding for ${lockSmokeTestMsChirho}ms`);
      sleepSyncChirho(lockSmokeTestMsChirho);
      console.log(`[${MODULE_CHIRHO}] lock smoke test completed`);
    } finally {
      releaseReadinessLockChirho();
    }
    return;
  }
  if (summaryOnlyChirho) {
    console.log(
      `[${MODULE_CHIRHO}] Summary-only mode: using existing status artifact; run without --summary-only-chirho before any publication claim.`
    );
    const statusChirho = readCertificationStatusChirho();
    printReadinessSummaryChirho(statusChirho, false);
    if (requireCertifiedMarkdownChirho && statusChirho.certificationCompleteChirho !== true) {
      throw new Error("certified UTF-8 Markdown publication is not ready");
    }
    return;
  }
  const appCommandsChirho: CommandChirho[] = [
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
  ];
  const certificationCommandChirho: CommandChirho = {
    labelChirho: "transcription certification verification bundle",
    argsChirho: [process.execPath, "run", "check-certification-chirho"],
    cwdChirho: PROJECT_ROOT_CHIRHO,
  };

  const releaseReadinessLockChirho = acquireReadinessLockChirho();
  try {
    for (const commandChirho of appCommandsChirho) {
      runCommandChirho(commandChirho);
    }
    runCommandChirho(certificationCommandChirho);

    const statusChirho = readCertificationStatusChirho();
    printReadinessSummaryChirho(statusChirho, true);
    if (requireCertifiedMarkdownChirho && statusChirho.certificationCompleteChirho !== true) {
      throw new Error("certified UTF-8 Markdown publication is not ready");
    }
  } finally {
    releaseReadinessLockChirho();
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
