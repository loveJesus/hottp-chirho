// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Apply tightly-guarded suggested corrections from human-reviewed issue spans.
 *
 * This is intentionally narrower than generic correction editing. It only
 * applies Hebrew WLC-backed suggestions where the consonantal skeleton is
 * unchanged and the human issue flags are limited to vowels/accents/Hebrew
 * punctuation. Dry-run is the default.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  normalizeSpanLineTextFieldsChirho,
  scanSpanLinePathsChirho,
  type SpanLineLikeChirho,
  type SpanLikeChirho,
} from "./span-nfc-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "apply-human-suggested-corrections-chirho";
const DEFAULT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "human-suggested-corrections-chirho",
  "report-chirho.json"
);
const ALLOWED_WLC_CORRECTION_FLAGS_CHIRHO = new Set([
  "accents-chirho",
  "vowels-chirho",
  "hebrew-punctuation-chirho",
]);

interface CorrectableSpanChirho extends SpanLikeChirho {
  xMinPxChirho?: number;
  widthPxChirho?: number;
  humanReviewStatusChirho?: string;
  humanIssueFlagsChirho?: string[];
  humanValidationIdChirho?: number;
  humanValidationVerdictChirho?: string;
  wlcSuggestedTextChirho?: string;
  wlcSuggestionSourceChirho?: string;
  humanCorrectionStatusChirho?: string;
  humanCorrectionAppliedAtChirho?: string;
  humanCorrectedFromTextChirho?: string;
  humanCorrectionSourceChirho?: string;
  humanCorrectionIssueFlagsChirho?: string[];
  provenanceChirho?: string;
}

interface CorrectableLineChirho extends SpanLineLikeChirho {
  spansChirho?: CorrectableSpanChirho[];
}

interface CorrectionResultChirho {
  statusChirho: "planned-chirho" | "applied-chirho" | "skipped-chirho" | "blocked-chirho";
  relativePathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  originalTextChirho: string;
  suggestedTextChirho: string | null;
  originalHashChirho: string;
  suggestedHashChirho: string | null;
  issueFlagsChirho: string[];
  suggestionSourceChirho: string | null;
  humanValidationIdChirho: number | null;
  messageChirho: string;
}

interface ApplyOptionsChirho {
  targetValidationIdChirho: number | null;
  targetSuggestedTextChirho: string | null;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function hebrewSkeletonChirho(textChirho: string): string {
  return textChirho
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^\u05D0-\u05EA]/g, "");
}

function relativePathChirho(pathChirho: string): string {
  return pathChirho.startsWith(PROJECT_ROOT_CHIRHO)
    ? pathChirho.slice(PROJECT_ROOT_CHIRHO.length + 1)
    : pathChirho;
}

function allowedIssueFlagsChirho(flagsChirho: string[]): boolean {
  return flagsChirho.length > 0 &&
    flagsChirho.every((flagChirho) => ALLOWED_WLC_CORRECTION_FLAGS_CHIRHO.has(flagChirho));
}

function parseIntegerArgChirho(valueChirho: string | undefined, nameChirho: string): number | null {
  if (valueChirho === undefined) return null;
  const parsedChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(parsedChirho) || parsedChirho <= 0 || String(parsedChirho) !== valueChirho) {
    throw new Error(`--${nameChirho} must be a positive integer; got ${valueChirho}`);
  }
  return parsedChirho;
}

function resultBaseChirho(
  linePathChirho: string,
  lineChirho: CorrectableLineChirho,
  spanChirho: CorrectableSpanChirho
): Omit<CorrectionResultChirho, "statusChirho" | "messageChirho"> {
  const originalTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho ?? "");
  const suggestedTextChirho = typeof spanChirho.wlcSuggestedTextChirho === "string"
    ? normalizeTextForStorageChirho(spanChirho.wlcSuggestedTextChirho)
    : null;
  return {
    relativePathChirho: relativePathChirho(linePathChirho),
    volumeChirho: lineChirho.volumeChirho ?? 0,
    pageChirho: lineChirho.pageChirho ?? 0,
    lineIndexChirho: lineChirho.lineIndexChirho ?? 0,
    segmentIndexChirho: spanChirho.segmentIndexChirho ?? -1,
    originalTextChirho,
    suggestedTextChirho,
    originalHashChirho: hashTextChirho(originalTextChirho),
    suggestedHashChirho: suggestedTextChirho === null ? null : hashTextChirho(suggestedTextChirho),
    issueFlagsChirho: spanChirho.humanIssueFlagsChirho ?? [],
    suggestionSourceChirho: spanChirho.wlcSuggestionSourceChirho ?? null,
    humanValidationIdChirho: spanChirho.humanValidationIdChirho ?? null,
  };
}

function evaluateCorrectionChirho(
  linePathChirho: string,
  lineChirho: CorrectableLineChirho,
  spanChirho: CorrectableSpanChirho,
  optionsChirho: ApplyOptionsChirho
): CorrectionResultChirho | null {
  if (spanChirho.humanReviewStatusChirho !== "reviewed-issues-chirho") return null;
  if (!Array.isArray(spanChirho.humanIssueFlagsChirho) || spanChirho.humanIssueFlagsChirho.length === 0) return null;
  const baseChirho = resultBaseChirho(linePathChirho, lineChirho, spanChirho);
  if (optionsChirho.targetValidationIdChirho !== null && baseChirho.humanValidationIdChirho !== optionsChirho.targetValidationIdChirho) {
    return null;
  }
  if (spanChirho.scriptChirho !== "hebrew-chirho") {
    return { ...baseChirho, statusChirho: "blocked-chirho", messageChirho: "not a Hebrew span" };
  }
  if (baseChirho.suggestedTextChirho === null || baseChirho.suggestionSourceChirho === null) {
    return { ...baseChirho, statusChirho: "blocked-chirho", messageChirho: "missing WLC suggestion text/source" };
  }
  if (!baseChirho.suggestionSourceChirho.startsWith("WLC ")) {
    return { ...baseChirho, statusChirho: "blocked-chirho", messageChirho: "suggestion source is not WLC" };
  }
  if (!allowedIssueFlagsChirho(baseChirho.issueFlagsChirho)) {
    return { ...baseChirho, statusChirho: "blocked-chirho", messageChirho: "issue flags are not limited to vowels/accents/Hebrew punctuation" };
  }
  if (optionsChirho.targetSuggestedTextChirho !== null && baseChirho.suggestedTextChirho !== optionsChirho.targetSuggestedTextChirho) {
    return { ...baseChirho, statusChirho: "blocked-chirho", messageChirho: "suggested text does not match the explicit confirmation text" };
  }
  if (hebrewSkeletonChirho(baseChirho.originalTextChirho) !== hebrewSkeletonChirho(baseChirho.suggestedTextChirho)) {
    return { ...baseChirho, statusChirho: "blocked-chirho", messageChirho: "suggestion changes Hebrew consonantal skeleton" };
  }
  if (baseChirho.originalTextChirho === baseChirho.suggestedTextChirho) {
    return { ...baseChirho, statusChirho: "skipped-chirho", messageChirho: "suggestion already applied" };
  }
  return { ...baseChirho, statusChirho: "planned-chirho", messageChirho: "safe WLC suggestion can be applied" };
}

function applyCorrectionChirho(
  spanChirho: CorrectableSpanChirho,
  resultChirho: CorrectionResultChirho,
  appliedAtChirho: string,
  certifyHumanChirho: boolean
): void {
  if (resultChirho.suggestedTextChirho === null) throw new Error("cannot apply missing suggestion");
  spanChirho.utf8TextChirho = resultChirho.suggestedTextChirho;
  spanChirho.humanCorrectionStatusChirho = "suggested-correction-applied-chirho";
  spanChirho.humanCorrectionAppliedAtChirho = appliedAtChirho;
  spanChirho.humanCorrectedFromTextChirho = resultChirho.originalTextChirho;
  spanChirho.humanCorrectionSourceChirho = resultChirho.suggestionSourceChirho ?? undefined;
  spanChirho.humanCorrectionIssueFlagsChirho = resultChirho.issueFlagsChirho;
  spanChirho.humanReviewStatusChirho = "reviewed-corrected-chirho";
  spanChirho.humanIssueFlagsChirho = [];
  if (certifyHumanChirho) spanChirho.provenanceChirho = "human-chirho";
  normalizeSpanLineTextFieldsChirho({ spansChirho: [spanChirho] });
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const applyChirho = argsChirho.includes("--apply");
  const certifyHumanChirho = argsChirho.includes("--certify-human");
  const targetValidationIdChirho = parseIntegerArgChirho(parseArgValueChirho(argsChirho, "validation-id-chirho"), "validation-id-chirho");
  const targetSuggestedTextArgChirho = parseArgValueChirho(argsChirho, "suggested-text-chirho");
  const targetSuggestedTextChirho = targetSuggestedTextArgChirho === undefined
    ? null
    : normalizeTextForStorageChirho(targetSuggestedTextArgChirho);
  if (applyChirho && (targetValidationIdChirho === null || targetSuggestedTextChirho === null)) {
    throw new Error("--apply requires --validation-id-chirho and --suggested-text-chirho for exact human-confirmed targeting");
  }
  const optionsChirho: ApplyOptionsChirho = {
    targetValidationIdChirho,
    targetSuggestedTextChirho,
  };
  const reportPathChirho = parseArgValueChirho(argsChirho, "report") ?? DEFAULT_REPORT_PATH_CHIRHO;
  const appliedAtChirho = new Date().toISOString();
  const resultsChirho: CorrectionResultChirho[] = [];
  let appliedCountChirho = 0;

  for (const linePathChirho of scanSpanLinePathsChirho()) {
    const lineChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as CorrectableLineChirho;
    let lineChangedChirho = false;
    for (const spanChirho of lineChirho.spansChirho ?? []) {
      const resultChirho = evaluateCorrectionChirho(linePathChirho, lineChirho, spanChirho, optionsChirho);
      if (resultChirho === null) continue;
      if (applyChirho && resultChirho.statusChirho === "planned-chirho") {
        applyCorrectionChirho(spanChirho, resultChirho, appliedAtChirho, certifyHumanChirho);
        resultChirho.statusChirho = "applied-chirho";
        resultChirho.messageChirho = certifyHumanChirho
          ? "applied WLC suggestion and stamped human provenance"
          : "applied WLC suggestion without changing provenance";
        lineChangedChirho = true;
        appliedCountChirho += 1;
      }
      resultsChirho.push(resultChirho);
    }
    if (lineChangedChirho) {
      normalizeSpanLineTextFieldsChirho(lineChirho);
      writeFileSync(linePathChirho, `${JSON.stringify(lineChirho, null, 2)}\n`);
    }
  }

  const reportChirho = {
    john316Chirho:
      "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
    generatedAtChirho: appliedAtChirho,
    appliedChirho: applyChirho,
    certifyHumanChirho,
    targetValidationIdChirho,
    targetSuggestedTextChirho,
    allowedIssueFlagsChirho: [...ALLOWED_WLC_CORRECTION_FLAGS_CHIRHO],
    candidateCountChirho: resultsChirho.length,
    appliedCountChirho,
    blockedCountChirho: resultsChirho.filter((resultChirho) => resultChirho.statusChirho === "blocked-chirho").length,
    skippedCountChirho: resultsChirho.filter((resultChirho) => resultChirho.statusChirho === "skipped-chirho").length,
    resultsChirho,
  };

  mkdirSync(dirname(reportPathChirho), { recursive: true });
  writeFileSync(reportPathChirho, `${JSON.stringify(reportChirho, null, 2)}\n`);
  console.log(
    `[${MODULE_CHIRHO}] mode=${applyChirho ? "apply-chirho" : "dry-run-chirho"} ` +
      `candidates=${resultsChirho.length} applied=${appliedCountChirho} ` +
      `blocked=${reportChirho.blockedCountChirho} skipped=${reportChirho.skippedCountChirho} ` +
      `report=${reportPathChirho}`
  );
  if (applyChirho && reportChirho.blockedCountChirho > 0) process.exitCode = 1;
  if (applyChirho && resultsChirho.length === 0) {
    console.error(`[${MODULE_CHIRHO}] no matching correction candidate for validation ${targetValidationIdChirho}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) mainChirho();
