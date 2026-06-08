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
import { humanReviewSessionChecklistLinesChirho } from "./human-review-session-checklist-chirho.ts";

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
const SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO = "SKIP_READINESS_LOCK_SMOKE_TEST_CHIRHO";
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
const ATTRIBUTION_CLEANUP_HANDOFF_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "attribution-cleanup-handoff-chirho.md"
);
const RAW_HEBREW_REPEAT_CLUSTERS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "raw-hebrew-repeat-clusters-chirho.md"
);
const EXPERT_REPEAT_CLUSTERS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "expert-repeat-clusters-chirho.md"
);
const LATIN_SYMBOL_REPEAT_CLUSTERS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "latin-symbol-repeat-clusters-chirho.md"
);
const REVIEW_VOLUME_KEYS_CHIRHO = [
  "vol-1-chirho",
  "vol-2-chirho",
  "vol-3-chirho",
  "vol-4-chirho",
  "vol-5-chirho",
] as const;

interface CommandChirho {
  labelChirho: string;
  argsChirho: string[];
  cwdChirho: string;
  envChirho?: Record<string, string>;
}

interface RepeatSummaryChirho {
  duplicateTextGroupCountChirho?: unknown;
  duplicateTextItemCountChirho?: unknown;
  duplicateTextItemCountsByValidationStatusChirho?: Record<string, unknown>;
  duplicateTextItemCountsByScriptChirho?: Record<string, unknown>;
}

interface CertificationStatusSummaryChirho {
  generatedAtChirho?: unknown;
  certificationCompleteChirho?: unknown;
  remainingWorkChirho?: unknown;
  reviewStartLinksChirho?: Record<string, unknown>;
  rawHebrewChirho?: {
    livePendingSpanCountChirho?: unknown;
    livePendingVolumeCountsChirho?: Record<string, unknown>;
    repeatSummaryChirho?: RepeatSummaryChirho;
    triageChirho?: {
      attentionItemCountChirho?: unknown;
      lowConfidenceItemCountChirho?: unknown;
      confidentDirectReadDisagreementItemCountChirho?: unknown;
      multiTokenItemCountChirho?: unknown;
      delimiterNotationItemCountChirho?: unknown;
      noDirectReadItemCountChirho?: unknown;
      preReviewNoteItemCountChirho?: unknown;
      withoutPreReviewNoteItemCountChirho?: unknown;
      preReviewCoveredAttentionItemCountChirho?: unknown;
      preReviewUncoveredAttentionItemCountChirho?: unknown;
      preReviewReasonGapAttentionItemCountChirho?: unknown;
    };
  };
  structuralChirho?: {
    strictPassedChirho?: unknown;
    passCOcrHebrewSpanCountChirho?: unknown;
    blankVisionTierHandoffsChirho?: Array<{
      idChirho?: unknown;
      locationChirho?: unknown;
      scriptChirho?: unknown;
      expectedReviewerRoleChirho?: unknown;
      expertReviewUrlChirho?: unknown;
      handoffDocumentPathChirho?: unknown;
      handoffDocumentExistsChirho?: unknown;
      handoffTargetCropPathChirho?: unknown;
      handoffTargetCropExistsChirho?: unknown;
      handoffCropPathChirho?: unknown;
      handoffCropExistsChirho?: unknown;
    }>;
  };
  visionTierChirho?: {
    remainingConfirmationCountChirho?: unknown;
    pendingVisionCountsChirho?: Record<string, unknown>;
    pendingBlankTextCountsChirho?: Record<string, unknown>;
    pendingVolumeCountsChirho?: Record<string, unknown>;
    repeatSummaryChirho?: RepeatSummaryChirho;
  };
  latinSymbolVisionChirho?: {
    remainingDecisionCountChirho?: unknown;
    pendingDecisionCountsChirho?: Record<string, unknown>;
    pendingDecisionVolumeCountsChirho?: Record<string, unknown>;
    pendingMixedScriptSymbolItemCountChirho?: unknown;
    pendingNontrivialSymbolItemCountChirho?: unknown;
    pendingTrivialPunctuationSymbolItemCountChirho?: unknown;
    repeatSummaryChirho?: RepeatSummaryChirho;
  };
  humanValidationDbChirho?: {
    genericReviewerRowsChirho?: unknown;
    genericReviewerLiveTextMatchRowsChirho?: unknown;
    genericReviewerLiveTextMismatchRowsChirho?: unknown;
    genericReviewerLiveTextUnknownRowsChirho?: unknown;
    genericReviewerRowGroupsChirho?: Array<{
      liveTextMatchIdsChirho?: unknown;
      liveTextMismatchIdsChirho?: unknown;
      liveTextUnknownIdsChirho?: unknown;
    }>;
  };
  strictBlindScansChirho?: {
    hiddenHebrewChirho?: {
      reportExistsChirho?: unknown;
      reportShapeOkChirho?: unknown;
      scannerSourceFingerprintMatchesCurrentChirho?: unknown;
      spanSourceFingerprintMatchesCurrentChirho?: unknown;
      candidateLineCountChirho?: unknown;
      summaryCountsMatchRenderedCandidatesChirho?: unknown;
    };
    nonLatinResidueChirho?: {
      reportExistsChirho?: unknown;
      reportShapeOkChirho?: unknown;
      scannerSourceFingerprintMatchesCurrentChirho?: unknown;
      spanSourceFingerprintMatchesCurrentChirho?: unknown;
      candidateLineCountChirho?: unknown;
      summaryCountsMatchRenderedCandidatesChirho?: unknown;
    };
    hebrewDelimiterOrderChirho?: {
      reportExistsChirho?: unknown;
      reportShapeOkChirho?: unknown;
      scannerSourceFingerprintMatchesCurrentChirho?: unknown;
      spanSourceFingerprintMatchesCurrentChirho?: unknown;
      closeBeforeOpenSuspectCountChirho?: unknown;
      neighborUnbalancedUncoveredByReviewCountChirho?: unknown;
      summaryCountsMatchRenderedRowsChirho?: unknown;
    };
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
    env: commandChirho.envChirho,
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

function reviewVolumeLabelChirho(volumeKeyChirho: string): string {
  const matchChirho = /^vol-(\d+)-chirho$/.exec(volumeKeyChirho);
  return matchChirho === null ? volumeKeyChirho : `vol ${matchChirho[1]}`;
}

function reviewVolumeCountsTextChirho(volumeCountsChirho: Record<string, unknown> | undefined): string {
  if (volumeCountsChirho === undefined) return "unknown";
  const orderedKeySetChirho = new Set<string>(REVIEW_VOLUME_KEYS_CHIRHO);
  const entriesChirho: string[] = [];
  for (const volumeKeyChirho of REVIEW_VOLUME_KEYS_CHIRHO) {
    const countChirho = finiteNumberChirho(volumeCountsChirho[volumeKeyChirho]);
    if (countChirho !== null && countChirho > 0) {
      entriesChirho.push(`${reviewVolumeLabelChirho(volumeKeyChirho)} ${countChirho}`);
    }
  }
  const extraKeysChirho = Object.keys(volumeCountsChirho)
    .filter((volumeKeyChirho) => !orderedKeySetChirho.has(volumeKeyChirho))
    .sort();
  for (const volumeKeyChirho of extraKeysChirho) {
    const countChirho = finiteNumberChirho(volumeCountsChirho[volumeKeyChirho]);
    if (countChirho !== null && countChirho > 0) {
      entriesChirho.push(`${reviewVolumeLabelChirho(volumeKeyChirho)} ${countChirho}`);
    }
  }
  return entriesChirho.length === 0 ? "none" : entriesChirho.join(", ");
}

function recordCountsTextChirho(countsChirho: Record<string, unknown> | undefined): string {
  if (countsChirho === undefined) return "unknown";
  const entriesChirho = Object.entries(countsChirho)
    .map(([keyChirho, valueChirho]) => [keyChirho, finiteNumberChirho(valueChirho)] as const)
    .filter((entryChirho): entryChirho is readonly [string, number] => entryChirho[1] !== null)
    .sort(([leftKeyChirho], [rightKeyChirho]) => leftKeyChirho.localeCompare(rightKeyChirho));
  return entriesChirho.length === 0
    ? "none"
    : entriesChirho.map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`).join(", ");
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

function booleanTextChirho(valueChirho: unknown): string {
  return typeof valueChirho === "boolean" ? String(valueChirho) : "unknown";
}

function stringOrUnknownChirho(valueChirho: unknown): string {
  return typeof valueChirho === "string" && valueChirho.length > 0 ? valueChirho : "unknown";
}

function numberArrayChirho(valueChirho: unknown): number[] {
  if (!Array.isArray(valueChirho)) return [];
  return valueChirho.filter((itemChirho): itemChirho is number => Number.isInteger(itemChirho));
}

function sortedUniqueNumbersChirho(valuesChirho: number[]): number[] {
  return [...new Set(valuesChirho)].sort((leftChirho, rightChirho) => leftChirho - rightChirho);
}

function idListTextChirho(idsChirho: number[]): string {
  return idsChirho.length === 0 ? "none" : idsChirho.join(", ");
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
    ["Raw Hebrew low confidence", reviewStartLinkChirho(statusChirho, "rawHebrewLowConfidenceChirho")],
    ["Raw Hebrew multi-token", reviewStartLinkChirho(statusChirho, "rawHebrewMultiTokenChirho")],
    ["Raw Hebrew delimiter/damaged text", reviewStartLinkChirho(statusChirho, "rawHebrewDelimiterNotationChirho")],
    ["Raw Hebrew no direct read", reviewStartLinkChirho(statusChirho, "rawHebrewNoDirectReadChirho")],
    ["Raw Hebrew pre-review notes", reviewStartLinkChirho(statusChirho, "rawHebrewPreReviewNoteChirho")],
    ["Raw Hebrew attribution blocked", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionBlockedChirho")],
    ["Raw Hebrew attribution unchanged", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionBlockedUnchangedChirho")],
    ["Raw Hebrew attribution re-review", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionRereviewChirho")],
    ["Raw Hebrew attribution changed re-review", reviewStartLinkChirho(statusChirho, "rawHebrewAttributionRereviewChangedChirho")],
    ["Latin/symbol proofing", reviewStartLinkChirho(statusChirho, "latinSymbolAllChirho")],
    ["Latin/symbol French", reviewStartLinkChirho(statusChirho, "latinSymbolFrenchChirho")],
    ["Latin/symbol Latin/non-French", reviewStartLinkChirho(statusChirho, "latinSymbolNonFrenchChirho")],
    ["Latin/symbol script/sigla symbols", reviewStartLinkChirho(statusChirho, "latinSymbolSiglumSymbolChirho")],
    ["Latin/symbol nontrivial symbols", reviewStartLinkChirho(statusChirho, "latinSymbolNontrivialSymbolChirho")],
    ["Expert blank Syriac", reviewStartLinkChirho(statusChirho, "expertSyriacBlankChirho")],
    ["Expert Syriac nonblank", reviewStartLinkChirho(statusChirho, "expertSyriacNonblankChirho")],
    ["Expert Syriac Pass-C", reviewStartLinkChirho(statusChirho, "expertSyriacPassCOcrSourceChirho")],
    ["Expert Arabic", reviewStartLinkChirho(statusChirho, "expertArabicChirho")],
    ["Expert Arabic explicit", reviewStartLinkChirho(statusChirho, "expertArabicExplicitSpanSourceChirho")],
    ["Expert Hebrew/WLC", reviewStartLinkChirho(statusChirho, "expertHebrewChirho")],
    ["Expert Hebrew explicit", reviewStartLinkChirho(statusChirho, "expertHebrewExplicitSpanSourceChirho")],
    ["Expert Hebrew D1", reviewStartLinkChirho(statusChirho, "expertHebrewD1DerivedSourceChirho")],
    ["Expert Greek", reviewStartLinkChirho(statusChirho, "expertGreekChirho")],
    ["Expert Greek explicit", reviewStartLinkChirho(statusChirho, "expertGreekExplicitSpanSourceChirho")],
    ["Expert Greek Pass-C", reviewStartLinkChirho(statusChirho, "expertGreekPassCOcrSourceChirho")],
  ].filter((entryChirho): entryChirho is [string, string] => entryChirho[1] !== null);
  if (linksChirho.length === 0) return;
  console.log(`[${MODULE_CHIRHO}] Next review links:`);
  for (const [labelChirho, linkChirho] of linksChirho) {
    console.log(`- ${labelChirho}: ${linkChirho}`);
  }
}

function printVolumeReviewLinksChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const linksChirho: Array<[string, string | null]> = [];
  for (const volumeKeyChirho of REVIEW_VOLUME_KEYS_CHIRHO) {
    const volumeNumberChirho = reviewVolumeLabelChirho(volumeKeyChirho);
    const volumeSuffixChirho = volumeKeyChirho.replace(/^vol-/, "").replace(/-chirho$/, "");
    const volumePascalSuffixChirho = `Vol${volumeSuffixChirho}`;
    linksChirho.push([
      `Raw Hebrew ${volumeNumberChirho}`,
      reviewStartLinkChirho(statusChirho, `rawHebrewChirho${volumePascalSuffixChirho}Chirho`),
    ]);
    linksChirho.push([
      `Expert ${volumeNumberChirho}`,
      reviewStartLinkChirho(statusChirho, `expertChirho${volumePascalSuffixChirho}Chirho`),
    ]);
    linksChirho.push([
      `Latin/symbol ${volumeNumberChirho}`,
      reviewStartLinkChirho(statusChirho, `latinSymbolChirho${volumePascalSuffixChirho}Chirho`),
    ]);
  }
  const presentLinksChirho = linksChirho.filter(
    (entryChirho): entryChirho is [string, string] => entryChirho[1] !== null
  );
  if (presentLinksChirho.length === 0) return;
  console.log(`[${MODULE_CHIRHO}] Volume review links:`);
  for (const [labelChirho, linkChirho] of presentLinksChirho) {
    console.log(`- ${labelChirho}: ${linkChirho}`);
  }
}

function handoffPathTextChirho(pathChirho: unknown, existsChirho: unknown): string {
  const pathTextChirho = typeof pathChirho === "string" && pathChirho.length > 0
    ? relativeProjectPathChirho(pathChirho)
    : "missing-path";
  return `${pathTextChirho} (${existsChirho === true ? "present" : "missing"})`;
}

function printBlankTextHandoffsChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const handoffsChirho = statusChirho.structuralChirho?.blankVisionTierHandoffsChirho ?? [];
  if (!Array.isArray(handoffsChirho) || handoffsChirho.length === 0) return;
  console.log(`[${MODULE_CHIRHO}] Blank text handoffs:`);
  for (const handoffChirho of handoffsChirho) {
    const idChirho = stringOrUnknownChirho(handoffChirho.idChirho);
    const locationChirho = stringOrUnknownChirho(handoffChirho.locationChirho);
    const scriptChirho = stringOrUnknownChirho(handoffChirho.scriptChirho);
    const roleChirho = stringOrUnknownChirho(handoffChirho.expectedReviewerRoleChirho);
    const reviewUrlChirho = stringOrUnknownChirho(handoffChirho.expertReviewUrlChirho);
    console.log(`- ${idChirho}: ${locationChirho}; script ${scriptChirho}; role ${roleChirho}; review ${reviewUrlChirho}`);
    console.log(
      `  handoff doc: ${handoffPathTextChirho(
        handoffChirho.handoffDocumentPathChirho,
        handoffChirho.handoffDocumentExistsChirho
      )}`
    );
    console.log(
      `  target crop: ${handoffPathTextChirho(
        handoffChirho.handoffTargetCropPathChirho,
        handoffChirho.handoffTargetCropExistsChirho
      )}`
    );
    console.log(
      `  context crop: ${handoffPathTextChirho(
        handoffChirho.handoffCropPathChirho,
        handoffChirho.handoffCropExistsChirho
      )}`
    );
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

function printHumanReviewSessionChecklistChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const rawPrimaryLinkChirho = reviewStartLinkChirho(statusChirho, "rawHebrewVols35UnvalidatedChirho");
  const rawAttributionUnchangedLinkChirho =
    reviewStartLinkChirho(statusChirho, "rawHebrewAttributionBlockedUnchangedChirho");
  const rawAttributionRereviewLinkChirho =
    reviewStartLinkChirho(statusChirho, "rawHebrewAttributionRereviewChangedChirho") ??
    reviewStartLinkChirho(statusChirho, "rawHebrewAttributionRereviewChirho");
  const expertHebrewLinkChirho = reviewStartLinkChirho(statusChirho, "expertHebrewChirho");
  const expertGreekLinkChirho = reviewStartLinkChirho(statusChirho, "expertGreekChirho");
  const expertSyriacBlankLinkChirho = reviewStartLinkChirho(statusChirho, "expertSyriacBlankChirho");
  const latinSymbolLinkChirho = reviewStartLinkChirho(statusChirho, "latinSymbolAllChirho");
  const genericRowsChirho = numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerRowsChirho);
  const unchangedRowsChirho =
    numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextMatchRowsChirho);
  const changedRowsChirho =
    numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextMismatchRowsChirho);

  console.log(`[${MODULE_CHIRHO}] Human review session checklist:`);
  for (const lineChirho of humanReviewSessionChecklistLinesChirho({
    attributionRowCountChirho: genericRowsChirho,
    attributionUnchangedRowCountChirho: unchangedRowsChirho,
    attributionChangedRowCountChirho: changedRowsChirho,
    attributionUnchangedLaneUrlChirho: stringOrUnknownChirho(rawAttributionUnchangedLinkChirho),
    attributionRereviewLaneUrlChirho: stringOrUnknownChirho(rawAttributionRereviewLinkChirho),
    rawHebrewPrimaryLaneUrlChirho: stringOrUnknownChirho(rawPrimaryLinkChirho),
    expertHebrewLaneUrlChirho: stringOrUnknownChirho(expertHebrewLinkChirho),
    expertGreekLaneUrlChirho: stringOrUnknownChirho(expertGreekLinkChirho),
    expertSyriacBlankLaneUrlChirho: stringOrUnknownChirho(expertSyriacBlankLinkChirho),
    latinSymbolLaneUrlChirho: stringOrUnknownChirho(latinSymbolLinkChirho),
  })) {
    console.log(lineChirho);
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
  const rawTriageChirho = statusChirho.rawHebrewChirho?.triageChirho;
  const rawAttentionChirho = finiteNumberChirho(rawTriageChirho?.attentionItemCountChirho);
  const rawLowConfidenceChirho = finiteNumberChirho(rawTriageChirho?.lowConfidenceItemCountChirho);
  const rawConfidentDisagreementChirho =
    finiteNumberChirho(rawTriageChirho?.confidentDirectReadDisagreementItemCountChirho);
  const rawMultiTokenChirho = finiteNumberChirho(rawTriageChirho?.multiTokenItemCountChirho);
  const rawDelimiterNotationChirho = finiteNumberChirho(rawTriageChirho?.delimiterNotationItemCountChirho);
  const rawNoDirectReadChirho = finiteNumberChirho(rawTriageChirho?.noDirectReadItemCountChirho);
  const rawPreReviewNotesChirho = finiteNumberChirho(rawTriageChirho?.preReviewNoteItemCountChirho);
  const rawWithoutPreReviewNotesChirho = finiteNumberChirho(rawTriageChirho?.withoutPreReviewNoteItemCountChirho);
  const rawUncoveredAttentionChirho = finiteNumberChirho(rawTriageChirho?.preReviewUncoveredAttentionItemCountChirho);
  const rawReasonGapAttentionChirho = finiteNumberChirho(rawTriageChirho?.preReviewReasonGapAttentionItemCountChirho);
  const rawVolumeCountsTextChirho = reviewVolumeCountsTextChirho(
    statusChirho.rawHebrewChirho?.livePendingVolumeCountsChirho
  );
  const expertVolumeCountsTextChirho = reviewVolumeCountsTextChirho(
    statusChirho.visionTierChirho?.pendingVolumeCountsChirho
  );
  const latinSymbolVolumeCountsTextChirho = reviewVolumeCountsTextChirho(
    statusChirho.latinSymbolVisionChirho?.pendingDecisionVolumeCountsChirho
  );

  console.log(`[${MODULE_CHIRHO}] Review routing summary:`);
  console.log(
    `- Hallelujah script lanes: ${numberTextChirho(hallelujahScriptTargetsChirho)} target(s) = ` +
      `raw Hebrew ${numberTextChirho(rawHebrewPendingChirho)} + ` +
      `expert Hebrew/WLC ${numberTextChirho(expertHebrewChirho)} + ` +
      `expert Greek ${numberTextChirho(expertGreekChirho)}`
  );
  console.log(
    `- Raw Hebrew attention triage: ${numberTextChirho(rawAttentionChirho)} flagged span(s); ` +
      `overlapping signals low-confidence ${numberTextChirho(rawLowConfidenceChirho)}, ` +
      `confident-disagreement ${numberTextChirho(rawConfidentDisagreementChirho)}, ` +
      `multi-token ${numberTextChirho(rawMultiTokenChirho)}, ` +
      `delimiter/damaged-text ${numberTextChirho(rawDelimiterNotationChirho)}, ` +
      `no-direct-read ${numberTextChirho(rawNoDirectReadChirho)}; ` +
      `pre-review notes ${numberTextChirho(rawPreReviewNotesChirho)}/${numberTextChirho(rawHebrewPendingChirho)} ` +
      `pending raw span(s), without notes ${numberTextChirho(rawWithoutPreReviewNotesChirho)}, ` +
      `uncovered attention ${numberTextChirho(rawUncoveredAttentionChirho)}, ` +
      `reason gaps ${numberTextChirho(rawReasonGapAttentionChirho)}`
  );
  console.log(`- Raw Hebrew by volume: ${rawVolumeCountsTextChirho}`);
  console.log(
    `- External script-expert lanes: ${numberTextChirho(externalScriptTargetsChirho)} item(s) = ` +
      `Syriac ${numberTextChirho(expertSyriacChirho)} + Arabic ${numberTextChirho(expertArabicChirho)}; ` +
      `blank Syriac handoff ${numberTextChirho(blankSyriacChirho)}`
  );
  console.log(`- Expert review by volume: ${expertVolumeCountsTextChirho}`);
  console.log(
    `- Latin/symbol proofing: ${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.remainingDecisionCountChirho)} item(s) = ` +
      `French ${numberTextChirho(frenchChirho)} + ` +
      `Latin/non-French ${numberTextChirho(latinNonFrenchChirho)} + ` +
      `symbol ${numberTextChirho(symbolChirho)} ` +
      `(symbol risk: ${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.pendingMixedScriptSymbolItemCountChirho)} script/sigla, ` +
      `${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.pendingNontrivialSymbolItemCountChirho)} nontrivial, ` +
      `${numberOrUnknownChirho(statusChirho.latinSymbolVisionChirho?.pendingTrivialPunctuationSymbolItemCountChirho)} trivial pending)`
  );
  console.log(`- Latin/symbol by volume: ${latinSymbolVolumeCountsTextChirho}`);
  console.log(
    `- Attribution cleanup: ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerRowsChirho)} row(s); ` +
      `unchanged ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextMatchRowsChirho)}, ` +
      `changed ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextMismatchRowsChirho)}, ` +
      `unknown ${numberOrUnknownChirho(statusChirho.humanValidationDbChirho?.genericReviewerLiveTextUnknownRowsChirho)}; ` +
      `reattribute unchanged rows only if genuinely attributable, otherwise use re-review`
  );
}

function printStrictBlindScanSummaryChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const hiddenHebrewChirho = statusChirho.strictBlindScansChirho?.hiddenHebrewChirho;
  const nonLatinResidueChirho = statusChirho.strictBlindScansChirho?.nonLatinResidueChirho;
  const delimiterOrderChirho = statusChirho.strictBlindScansChirho?.hebrewDelimiterOrderChirho;
  if (
    hiddenHebrewChirho === undefined &&
    nonLatinResidueChirho === undefined &&
    delimiterOrderChirho === undefined
  ) {
    return;
  }
  console.log(`[${MODULE_CHIRHO}] Strict-blind scan evidence:`);
  console.log(
    `- Candidate queues: hidden Hebrew ${numberOrUnknownChirho(hiddenHebrewChirho?.candidateLineCountChirho)} line(s), ` +
      `non-Latin residue ${numberOrUnknownChirho(nonLatinResidueChirho?.candidateLineCountChirho)} line(s), ` +
      `Hebrew delimiter close-before-open ${numberOrUnknownChirho(delimiterOrderChirho?.closeBeforeOpenSuspectCountChirho)}, ` +
      `uncovered delimiter-neighbor rows ${numberOrUnknownChirho(delimiterOrderChirho?.neighborUnbalancedUncoveredByReviewCountChirho)}`
  );
  console.log(
    `- Scanner freshness: hidden Hebrew exists=${booleanTextChirho(hiddenHebrewChirho?.reportExistsChirho)} ` +
      `shape=${booleanTextChirho(hiddenHebrewChirho?.reportShapeOkChirho)} ` +
      `source=${booleanTextChirho(hiddenHebrewChirho?.scannerSourceFingerprintMatchesCurrentChirho)} ` +
      `spans=${booleanTextChirho(hiddenHebrewChirho?.spanSourceFingerprintMatchesCurrentChirho)} ` +
      `rendered=${booleanTextChirho(hiddenHebrewChirho?.summaryCountsMatchRenderedCandidatesChirho)}; ` +
      `non-Latin residue exists=${booleanTextChirho(nonLatinResidueChirho?.reportExistsChirho)} ` +
      `shape=${booleanTextChirho(nonLatinResidueChirho?.reportShapeOkChirho)} ` +
      `source=${booleanTextChirho(nonLatinResidueChirho?.scannerSourceFingerprintMatchesCurrentChirho)} ` +
      `spans=${booleanTextChirho(nonLatinResidueChirho?.spanSourceFingerprintMatchesCurrentChirho)} ` +
      `rendered=${booleanTextChirho(nonLatinResidueChirho?.summaryCountsMatchRenderedCandidatesChirho)}; ` +
      `delimiter exists=${booleanTextChirho(delimiterOrderChirho?.reportExistsChirho)} ` +
      `shape=${booleanTextChirho(delimiterOrderChirho?.reportShapeOkChirho)} ` +
      `source=${booleanTextChirho(delimiterOrderChirho?.scannerSourceFingerprintMatchesCurrentChirho)} ` +
      `spans=${booleanTextChirho(delimiterOrderChirho?.spanSourceFingerprintMatchesCurrentChirho)} ` +
      `rendered=${booleanTextChirho(delimiterOrderChirho?.summaryCountsMatchRenderedRowsChirho)}`
  );
  console.log("- Strict-blind scans are heuristic evidence only; certification still requires the listed human/expert review gates.");
}

function printRepeatClusterHandoffsChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const rawRepeatChirho = statusChirho.rawHebrewChirho?.repeatSummaryChirho;
  const expertRepeatChirho = statusChirho.visionTierChirho?.repeatSummaryChirho;
  const latinRepeatChirho = statusChirho.latinSymbolVisionChirho?.repeatSummaryChirho;
  if (rawRepeatChirho === undefined && expertRepeatChirho === undefined && latinRepeatChirho === undefined) return;

  console.log(`[${MODULE_CHIRHO}] Repeat-cluster handoffs:`);
  console.log(
    `- Raw Hebrew repeat clusters: ${numberOrUnknownChirho(rawRepeatChirho?.duplicateTextGroupCountChirho)} duplicate group(s), ` +
      `${numberOrUnknownChirho(rawRepeatChirho?.duplicateTextItemCountChirho)} duplicate item(s); ` +
      `items by status ${recordCountsTextChirho(rawRepeatChirho?.duplicateTextItemCountsByValidationStatusChirho)}; ` +
      `handoff ${relativeProjectPathChirho(RAW_HEBREW_REPEAT_CLUSTERS_PATH_CHIRHO)}`
  );
  console.log(
    `- Expert repeat clusters: ${numberOrUnknownChirho(expertRepeatChirho?.duplicateTextGroupCountChirho)} duplicate group(s), ` +
      `${numberOrUnknownChirho(expertRepeatChirho?.duplicateTextItemCountChirho)} duplicate item(s); ` +
      `items by script ${recordCountsTextChirho(expertRepeatChirho?.duplicateTextItemCountsByScriptChirho)}; ` +
      `handoff ${relativeProjectPathChirho(EXPERT_REPEAT_CLUSTERS_PATH_CHIRHO)}`
  );
  console.log(
    `- Latin/symbol repeat clusters: ${numberOrUnknownChirho(latinRepeatChirho?.duplicateTextGroupCountChirho)} duplicate group(s), ` +
      `${numberOrUnknownChirho(latinRepeatChirho?.duplicateTextItemCountChirho)} duplicate item(s); ` +
      `items by script ${recordCountsTextChirho(latinRepeatChirho?.duplicateTextItemCountsByScriptChirho)}; ` +
      `handoff ${relativeProjectPathChirho(LATIN_SYMBOL_REPEAT_CLUSTERS_PATH_CHIRHO)}`
  );
  console.log(
    "- Repeat clusters are planning aids only; every item still needs exact print review, confirmation, or policy decision."
  );
}

function printAttributionCleanupHandoffChirho(statusChirho: CertificationStatusSummaryChirho): void {
  const genericRowCountChirho = finiteNumberChirho(statusChirho.humanValidationDbChirho?.genericReviewerRowsChirho);
  if (genericRowCountChirho === null || genericRowCountChirho === 0) return;
  const groupsChirho = statusChirho.humanValidationDbChirho?.genericReviewerRowGroupsChirho ?? [];
  const unchangedIdsChirho = sortedUniqueNumbersChirho(
    groupsChirho.flatMap((groupChirho) => numberArrayChirho(groupChirho.liveTextMatchIdsChirho))
  );
  const changedIdsChirho = sortedUniqueNumbersChirho(
    groupsChirho.flatMap((groupChirho) => numberArrayChirho(groupChirho.liveTextMismatchIdsChirho))
  );
  const unknownIdsChirho = sortedUniqueNumbersChirho(
    groupsChirho.flatMap((groupChirho) => numberArrayChirho(groupChirho.liveTextUnknownIdsChirho))
  );
  console.log(`[${MODULE_CHIRHO}] Attribution cleanup handoff:`);
  console.log(`- Handoff doc: ${relativeProjectPathChirho(ATTRIBUTION_CLEANUP_HANDOFF_PATH_CHIRHO)}`);
  console.log(
    `- Attribution-blocked ids: unchanged ${idListTextChirho(unchangedIdsChirho)}; ` +
      `changed/re-review ${idListTextChirho(changedIdsChirho)}; unchecked ${idListTextChirho(unknownIdsChirho)}`
  );
  console.log(
    "- Reattribute unchanged rows only when they are genuinely attributable to the named human reviewer; use Attribution re-review for changed or uncertain rows."
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
    printHumanReviewSessionChecklistChirho(statusChirho);
    printReviewRoutingSummaryChirho(statusChirho);
    printStrictBlindScanSummaryChirho(statusChirho);
    printRepeatClusterHandoffsChirho(statusChirho);
    printNextReviewLinksChirho(statusChirho);
    printVolumeReviewLinksChirho(statusChirho);
    printBlankTextHandoffsChirho(statusChirho);
    printAttributionCleanupHandoffChirho(statusChirho);
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
    envChirho: {
      ...process.env,
      [SKIP_READINESS_LOCK_SMOKE_TEST_ENV_CHIRHO]: "1",
    } as Record<string, string>,
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
