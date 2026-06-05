// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify status review-start deep links against the running review stations.
 *
 * This is intentionally server-dependent and should run after review server
 * health checks. It proves the generated handoff URLs and Markdown report URLs
 * point to live reviewer pages or queue items, and that their query filters
 * include those items.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { assertGeneratedCheckChirho } from "./generated-output-hygiene-chirho.ts";

const MODULE_CHIRHO = "check-status-review-links-live-chirho";
const STATUS_JSON_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "status-chirho.json"
);
const STATUS_MARKDOWN_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "status-chirho.md"
);
const EXPERT_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "expert-repeat-clusters-chirho.md"
);
const LATIN_SYMBOL_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "latin-symbol-repeat-clusters-chirho.md"
);
const RAW_HEBREW_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "raw-hebrew-repeat-clusters-chirho.md"
);
const ATTRIBUTION_CLEANUP_HANDOFF_MARKDOWN_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "attribution-cleanup-handoff-chirho.md"
);
const RAW_HEBREW_ATTENTION_HANDOFF_MARKDOWN_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "raw-hebrew-attention-handoff-chirho.md"
);
const FETCH_TIMEOUT_MS_CHIRHO = 5000;
const REVIEW_SERVER_PORTS_CHIRHO = new Set([8766, 8770, 8771]);
const MARKDOWN_REVIEW_URL_RE_CHIRHO = /http:\/\/localhost:(?:8766|8770|8771)\/[^\s)`<>\]]+/gu;
const RAW_REVIEW_STATES_CHIRHO = new Set([
  "pending-chirho",
  "saved-issues-chirho",
  "attribution-blocked-chirho",
  "attribution-rereview-chirho",
]);
const RAW_VALIDATION_STATUSES_CHIRHO = new Set([
  "unvalidated-chirho",
  "partial-token-validated-chirho",
  "all-token-validated-chirho",
]);
const RAW_REVIEW_TIERS_CHIRHO = new Set([
  "primary-vols-3-5-chirho",
  "primary-vol-2-chirho",
  "spot-check-chirho",
]);
const RAW_ATTENTION_KINDS_CHIRHO = new Set([
  "low-confidence-direct-read-chirho",
  "confident-direct-read-disagreement-chirho",
  "multi-token-chirho",
  "delimiter-notation-chirho",
  "no-direct-read-chirho",
]);
const RAW_PRE_REVIEW_NOTE_FILTERS_CHIRHO = new Set([
  "with-note-chirho",
  "without-note-chirho",
]);
const RAW_PRE_REVIEW_REASON_FILTERS_CHIRHO = new Set([
  "missing-current-reason-chirho",
]);
const RAW_ATTRIBUTION_TEXT_FILTERS_CHIRHO = new Set([
  "unchanged-chirho",
  "changed-chirho",
]);
const LATIN_SYMBOL_SCRIPTS_CHIRHO = new Set([
  "french-chirho",
  "latin-non-french-chirho",
  "symbol-chirho",
]);
const LATIN_SYMBOL_RISKS_CHIRHO = new Set([
  "trivial-punctuation-chirho",
  "script-or-siglum-symbol-chirho",
  "nontrivial-symbol-chirho",
]);
const EXPERT_SCRIPTS_CHIRHO = new Set([
  "hebrew-chirho",
  "greek-chirho",
  "syriac-chirho",
  "arabic-chirho",
]);
const EXPERT_PRIORITIES_CHIRHO = new Set([
  "priority-chirho",
  "appendix-chirho",
]);
const EXPERT_TEXT_STATES_CHIRHO = new Set([
  "blank-chirho",
  "nonblank-chirho",
]);
const EXPERT_SOURCES_CHIRHO = new Set([
  "explicit-span-chirho",
  "pass-c-ocr-span-chirho",
  "d1-derived-chirho",
]);

interface CertificationStatusChirho {
  reviewStartLinksChirho?: Record<string, string | null>;
  structuralChirho?: {
    passCOcrHebrewSpanCountChirho?: number;
  };
  rawHebrewChirho?: {
    livePendingSpanCountChirho?: number;
    triageChirho?: {
      attentionItemCountChirho?: number;
      lowConfidenceItemCountChirho?: number;
      confidentDirectReadDisagreementItemCountChirho?: number;
      multiTokenItemCountChirho?: number;
      delimiterNotationItemCountChirho?: number;
      noDirectReadItemCountChirho?: number;
      preReviewNotesAvailableChirho?: boolean;
      preReviewCoveredAttentionItemCountChirho?: number;
      preReviewReasonCoveredAttentionItemCountChirho?: number;
      preReviewReasonGapAttentionItemCountChirho?: number;
      attentionItemsChirho?: RawHebrewAttentionHandoffItemChirho[];
    };
    repeatSummaryChirho?: RawHebrewRepeatSummaryChirho;
  };
  humanValidationDbChirho?: {
    genericReviewerRowsChirho?: number;
    genericReviewerLiveTextMatchRowsChirho?: number;
    genericReviewerLiveTextMismatchRowsChirho?: number;
    genericReviewerLiveTextUnknownRowsChirho?: number;
    genericReviewerRowDetailsChirho?: AttributionCleanupRowChirho[];
    genericReviewerRowGroupsChirho?: AttributionCleanupGroupChirho[];
  };
  latinSymbolVisionChirho?: {
    pendingDecisionCountChirho?: number;
    repeatSummaryChirho?: LatinSymbolRepeatSummaryChirho;
  };
  visionTierChirho?: {
    pendingVisionItemCountChirho?: number;
    repeatSummaryChirho?: ExpertRepeatSummaryChirho;
  };
}

interface AttributionCleanupRowChirho {
  idChirho: number;
  locationChirho: string;
  reviewerChirho: string;
  verdictChirho: string;
  appliedAtChirho: string | null;
  scriptVerdictChirho: string | null;
  issueFlagsChirho: string[];
  originalTextChirho: string;
  correctedTextChirho: string | null;
  liveSpanExistsChirho: boolean;
  liveSpanReadErrorChirho: string | null;
  liveTextChirho: string | null;
  liveScriptChirho: string | null;
  liveProvenanceChirho: string | null;
  liveTextMatchesOriginalChirho: boolean | null;
  liveSpanLinePathChirho: string;
  liveScanlinePathChirho: string;
  liveScanlineExistsChirho: boolean;
}

interface AttributionCleanupGroupChirho {
  reviewerChirho: string;
  appliedAtChirho: string | null;
  liveTextMatchIdsChirho: number[];
  liveTextMismatchIdsChirho: number[];
  liveTextUnknownIdsChirho: number[];
  liveTextMatchExpectedLiveTextHashArgsChirho: string[];
}

interface RawHebrewAttentionHandoffItemChirho {
  idChirho: string;
  reviewUrlChirho: string;
  textChirho: string;
  validationStatusChirho: string;
  reasonsChirho: string[];
  witnessCountChirho?: number | null;
  bestDirectConfidenceChirho: number | null;
  lineTextChirho: string;
}

interface RawHebrewRepeatItemChirho {
  itemKeyChirho: string;
  volumeChirho: number | null;
  validationStatusChirho: string;
  reviewUrlChirho: string;
}

interface RawHebrewRepeatGroupChirho {
  textChirho: string;
  countChirho: number;
  reviewUrlChirho: string;
  validationStatusCountsChirho: Record<string, number>;
  itemsChirho: RawHebrewRepeatItemChirho[];
}

interface RawHebrewRepeatSummaryChirho {
  textGroupCountChirho?: number;
  duplicateTextGroupCountChirho?: number;
  duplicateTextItemCountChirho?: number;
  singletonTextGroupCountChirho?: number;
  duplicateTextGroupCountsByValidationStatusChirho?: Record<string, number>;
  duplicateTextItemCountsByValidationStatusChirho?: Record<string, number>;
  groupsChirho?: RawHebrewRepeatGroupChirho[];
}

interface LatinSymbolRepeatItemChirho {
  idChirho: string;
  volumeChirho: number;
  itemKindChirho: string;
  reviewUrlChirho: string;
}

interface LatinSymbolRepeatGroupChirho {
  scriptChirho: string;
  symbolRiskChirho: string;
  textChirho: string;
  countChirho: number;
  firstItemIdChirho: string;
  reviewUrlChirho: string;
  itemsChirho: LatinSymbolRepeatItemChirho[];
}

interface LatinSymbolRepeatSummaryChirho {
  textGroupCountChirho?: number;
  duplicateTextGroupCountChirho?: number;
  duplicateTextItemCountChirho?: number;
  singletonTextGroupCountChirho?: number;
  duplicateTextGroupCountsByScriptChirho?: Record<string, number>;
  duplicateTextItemCountsByScriptChirho?: Record<string, number>;
  groupsChirho?: LatinSymbolRepeatGroupChirho[];
}

interface ExpertRepeatItemChirho {
  idChirho: string;
  volumeChirho: number | null;
  reviewUrlChirho: string;
}

interface ExpertRepeatGroupChirho {
  scriptChirho: string;
  currentTextChirho: string;
  countChirho: number;
  firstItemIdChirho: string;
  reviewUrlChirho: string;
  itemsChirho: ExpertRepeatItemChirho[];
}

interface ExpertRepeatSummaryChirho {
  textGroupCountChirho?: number;
  duplicateTextGroupCountChirho?: number;
  duplicateTextItemCountChirho?: number;
  singletonTextGroupCountChirho?: number;
  duplicateTextGroupCountsByScriptChirho?: Record<string, number>;
  duplicateTextItemCountsByScriptChirho?: Record<string, number>;
  groupsChirho?: ExpertRepeatGroupChirho[];
}

interface RawHebrewQueueItemChirho {
  keyChirho: string;
  liveSpanTextChirho: string;
  validationStatusChirho: string;
  tierChirho: string;
  attentionKindsChirho: string[];
  preReviewNoteChirho?: string | null;
  preReviewMissingAttentionKindsChirho?: string[];
  attributionTextStateChirho?: string;
  volumeChirho: number;
}

interface LatinSymbolItemChirho {
  idChirho: string;
  scriptChirho: string;
  symbolRiskChirho?: string;
  textChirho: string;
  volumeChirho: number;
}

interface ExpertItemChirho {
  idChirho: string;
  scriptChirho: string;
  visionSourceChirho: string;
  priorityMatchChirho: boolean;
  currentTextChirho: string;
  volumeChirho: number;
}

interface StateResponseChirho<TItemChirho> {
  okChirho?: boolean;
  itemsChirho?: TItemChirho[];
}

async function fetchTextChirho(urlChirho: string): Promise<string> {
  const abortControllerChirho = new AbortController();
  const timeoutChirho = setTimeout(() => abortControllerChirho.abort(), FETCH_TIMEOUT_MS_CHIRHO);
  try {
    const responseChirho = await fetch(urlChirho, { signal: abortControllerChirho.signal });
    assertGeneratedCheckChirho(responseChirho.ok, `${urlChirho} returned HTTP ${responseChirho.status}`);
    return await responseChirho.text();
  } finally {
    clearTimeout(timeoutChirho);
  }
}

async function fetchJsonChirho<TChirho>(urlChirho: string): Promise<TChirho> {
  return JSON.parse(await fetchTextChirho(urlChirho)) as TChirho;
}

function parseItemIdChirho(urlChirho: URL, keyChirho: string): string {
  const itemIdChirho = urlChirho.searchParams.get("item-chirho");
  assertGeneratedCheckChirho(itemIdChirho !== null && itemIdChirho.length > 0, `${keyChirho} missing item-chirho query`);
  return itemIdChirho;
}

function parseVolumeFilterChirho(urlChirho: URL): number | null {
  const valueChirho = urlChirho.searchParams.get("volume-chirho");
  if (valueChirho === null) return null;
  const matchChirho = /^vol-(\d+)-chirho$/.exec(valueChirho);
  assertGeneratedCheckChirho(matchChirho !== null, `invalid volume-chirho filter ${valueChirho}`);
  return Number.parseInt(matchChirho[1]!, 10);
}

function assertBaseReviewUrlChirho(urlChirho: URL, keyChirho: string): void {
  assertGeneratedCheckChirho(urlChirho.protocol === "http:", `${keyChirho} must use http`);
  assertGeneratedCheckChirho(urlChirho.hostname === "localhost", `${keyChirho} must target localhost`);
  assertGeneratedCheckChirho(REVIEW_SERVER_PORTS_CHIRHO.has(Number(urlChirho.port)), `${keyChirho} targets unexpected port ${urlChirho.port}`);
}

function assertKnownSearchParamsChirho(urlChirho: URL, keyChirho: string, knownParamsChirho: Set<string>): void {
  for (const paramChirho of urlChirho.searchParams.keys()) {
    assertGeneratedCheckChirho(
      knownParamsChirho.has(paramChirho),
      `${keyChirho} contains unsupported query parameter ${paramChirho}`
    );
  }
}

function assertParamInSetChirho(
  urlChirho: URL,
  keyChirho: string,
  paramChirho: string,
  allowedValuesChirho: Set<string>
): void {
  const valueChirho = urlChirho.searchParams.get(paramChirho);
  if (valueChirho === null) return;
  assertGeneratedCheckChirho(
    allowedValuesChirho.has(valueChirho),
    `${keyChirho} contains invalid ${paramChirho}=${valueChirho}`
  );
}

function assertRawQueryValuesChirho(urlChirho: URL, keyChirho: string): void {
  assertKnownSearchParamsChirho(
    urlChirho,
    keyChirho,
    new Set([
      "item-chirho",
      "validation-status-chirho",
      "tier-chirho",
      "attention-chirho",
      "pre-review-note-chirho",
      "pre-review-reason-chirho",
      "attribution-text-chirho",
      "volume-chirho",
      "review-state-chirho",
      "exact-text-chirho",
    ])
  );
  assertParamInSetChirho(urlChirho, keyChirho, "review-state-chirho", RAW_REVIEW_STATES_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "validation-status-chirho", RAW_VALIDATION_STATUSES_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "tier-chirho", RAW_REVIEW_TIERS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "attention-chirho", RAW_ATTENTION_KINDS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "pre-review-note-chirho", RAW_PRE_REVIEW_NOTE_FILTERS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "pre-review-reason-chirho", RAW_PRE_REVIEW_REASON_FILTERS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "attribution-text-chirho", RAW_ATTRIBUTION_TEXT_FILTERS_CHIRHO);
  parseVolumeFilterChirho(urlChirho);
}

function assertLatinQueryValuesChirho(urlChirho: URL, keyChirho: string): void {
  assertKnownSearchParamsChirho(
    urlChirho,
    keyChirho,
    new Set(["item-chirho", "script-chirho", "symbol-risk-chirho", "volume-chirho", "exact-text-chirho"])
  );
  assertParamInSetChirho(urlChirho, keyChirho, "script-chirho", LATIN_SYMBOL_SCRIPTS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "symbol-risk-chirho", LATIN_SYMBOL_RISKS_CHIRHO);
  parseVolumeFilterChirho(urlChirho);
}

function assertExpertQueryValuesChirho(urlChirho: URL, keyChirho: string): void {
  assertKnownSearchParamsChirho(
    urlChirho,
    keyChirho,
    new Set(["item-chirho", "script-chirho", "priority-chirho", "text-state-chirho", "volume-chirho", "source-chirho", "exact-text-chirho"])
  );
  assertParamInSetChirho(urlChirho, keyChirho, "script-chirho", EXPERT_SCRIPTS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "priority-chirho", EXPERT_PRIORITIES_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "text-state-chirho", EXPERT_TEXT_STATES_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "source-chirho", EXPERT_SOURCES_CHIRHO);
  parseVolumeFilterChirho(urlChirho);
}

function assertReviewQueryValuesChirho(urlChirho: URL, keyChirho: string): void {
  if (urlChirho.port === "8766") {
    assertRawQueryValuesChirho(urlChirho, keyChirho);
  } else if (urlChirho.port === "8770") {
    assertLatinQueryValuesChirho(urlChirho, keyChirho);
  } else if (urlChirho.port === "8771") {
    assertExpertQueryValuesChirho(urlChirho, keyChirho);
  } else {
    throw new Error(`${keyChirho} targets unsupported review port ${urlChirho.port}`);
  }
}

function assertReviewPageHtmlChirho(keyChirho: string, urlChirho: URL, htmlChirho: string): void {
  if (urlChirho.port === "8766") {
    assertGeneratedCheckChirho(htmlChirho.includes("Pass C Hebrew Validation Chirho"), `${keyChirho} did not load the raw Hebrew reviewer page`);
  } else if (urlChirho.port === "8770") {
    assertGeneratedCheckChirho(htmlChirho.includes("Latin/Symbol Vision Review Chirho"), `${keyChirho} did not load the Latin/symbol reviewer page`);
  } else if (urlChirho.port === "8771") {
    assertGeneratedCheckChirho(htmlChirho.includes("Expert Non-Latin Review Chirho"), `${keyChirho} did not load the expert reviewer page`);
  } else {
    throw new Error(`${keyChirho} targets unsupported review port ${urlChirho.port}`);
  }
}

function numberFieldChirho(valueChirho: unknown, pathChirho: string): number {
  assertGeneratedCheckChirho(typeof valueChirho === "number" && Number.isFinite(valueChirho), `status JSON missing ${pathChirho} number`);
  return valueChirho;
}

function booleanFieldChirho(valueChirho: unknown, pathChirho: string): boolean {
  assertGeneratedCheckChirho(typeof valueChirho === "boolean", `status JSON missing ${pathChirho} boolean`);
  return valueChirho;
}

function stringFieldChirho(valueChirho: unknown, pathChirho: string): string {
  assertGeneratedCheckChirho(typeof valueChirho === "string", `status JSON missing ${pathChirho} string`);
  return valueChirho;
}

function stringArrayFieldChirho(valueChirho: unknown, pathChirho: string): string[] {
  assertGeneratedCheckChirho(
    Array.isArray(valueChirho) && valueChirho.every((entryChirho) => typeof entryChirho === "string"),
    `status JSON missing ${pathChirho} string array`
  );
  return valueChirho;
}

function markdownCodeSpanForCheckChirho(valueChirho: string): string {
  const fenceChirho = valueChirho.includes("`") ? "``" : "`";
  return `${fenceChirho}${valueChirho}${fenceChirho}`;
}

function oneLineSnippetForCheckChirho(textChirho: string, maxLengthChirho: number): string {
  const normalizedChirho = textChirho.replace(/\s+/g, " ").trim();
  return normalizedChirho.length <= maxLengthChirho
    ? normalizedChirho
    : `${normalizedChirho.slice(0, Math.max(0, maxLengthChirho - 1))}…`;
}

function shellSingleQuoteForCheckChirho(valueChirho: string): string {
  return `'${valueChirho.replace(/'/g, `'\\''`)}'`;
}

function relativeProjectPathForCheckChirho(pathChirho: string): string {
  return pathChirho.startsWith(PROJECT_ROOT_CHIRHO)
    ? pathChirho.slice(PROJECT_ROOT_CHIRHO.length + 1)
    : pathChirho;
}

function rawHebrewReviewUrlForCheckChirho(reviewStateChirho: string, itemKeyChirho: string): string {
  const paramsChirho = new URLSearchParams([
    ["review-state-chirho", reviewStateChirho],
    ["item-chirho", itemKeyChirho],
  ]);
  return `http://localhost:8766/?${paramsChirho.toString()}`;
}

function assertMarkdownIncludesChirho(markdownChirho: string, snippetChirho: string, contextChirho: string): void {
  assertGeneratedCheckChirho(markdownChirho.includes(snippetChirho), `raw Hebrew attention handoff missing ${contextChirho}: ${snippetChirho}`);
}

function assertAttributionMarkdownIncludesChirho(markdownChirho: string, snippetChirho: string, contextChirho: string): void {
  assertGeneratedCheckChirho(markdownChirho.includes(snippetChirho), `attribution cleanup handoff missing ${contextChirho}: ${snippetChirho}`);
}

function assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho: string, snippetChirho: string, contextChirho: string): void {
  assertGeneratedCheckChirho(markdownChirho.includes(snippetChirho), `raw Hebrew repeat-cluster handoff missing ${contextChirho}: ${snippetChirho}`);
}

function assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho: string, snippetChirho: string, contextChirho: string): void {
  assertGeneratedCheckChirho(markdownChirho.includes(snippetChirho), `Latin/symbol repeat-cluster handoff missing ${contextChirho}: ${snippetChirho}`);
}

function assertExpertRepeatMarkdownIncludesChirho(markdownChirho: string, snippetChirho: string, contextChirho: string): void {
  assertGeneratedCheckChirho(markdownChirho.includes(snippetChirho), `expert repeat-cluster handoff missing ${contextChirho}: ${snippetChirho}`);
}

function numberArrayFieldChirho(valueChirho: unknown, pathChirho: string): number[] {
  assertGeneratedCheckChirho(
    Array.isArray(valueChirho) && valueChirho.every((entryChirho) => typeof entryChirho === "number"),
    `status JSON missing ${pathChirho} number array`
  );
  return valueChirho;
}

function numberRecordFieldChirho(valueChirho: unknown, pathChirho: string): Record<string, number> {
  assertGeneratedCheckChirho(
    valueChirho !== null &&
      typeof valueChirho === "object" &&
      !Array.isArray(valueChirho) &&
      Object.values(valueChirho).every((entryChirho) => typeof entryChirho === "number"),
    `status JSON missing ${pathChirho} number record`
  );
  return valueChirho as Record<string, number>;
}

function nullableStringFieldChirho(valueChirho: unknown, pathChirho: string): string | null {
  assertGeneratedCheckChirho(valueChirho === null || typeof valueChirho === "string", `status JSON missing ${pathChirho} string/null`);
  return valueChirho;
}

function nullableBooleanFieldChirho(valueChirho: unknown, pathChirho: string): boolean | null {
  assertGeneratedCheckChirho(valueChirho === null || typeof valueChirho === "boolean", `status JSON missing ${pathChirho} boolean/null`);
  return valueChirho;
}

function assertAttributionCleanupRowShapeChirho(rowChirho: AttributionCleanupRowChirho, indexChirho: number): void {
  const rowPathChirho = `humanValidationDbChirho.genericReviewerRowDetailsChirho[${indexChirho}]`;
  numberFieldChirho(rowChirho.idChirho, `${rowPathChirho}.idChirho`);
  stringFieldChirho(rowChirho.locationChirho, `${rowPathChirho}.locationChirho`);
  stringFieldChirho(rowChirho.reviewerChirho, `${rowPathChirho}.reviewerChirho`);
  stringFieldChirho(rowChirho.verdictChirho, `${rowPathChirho}.verdictChirho`);
  nullableStringFieldChirho(rowChirho.appliedAtChirho, `${rowPathChirho}.appliedAtChirho`);
  nullableStringFieldChirho(rowChirho.scriptVerdictChirho, `${rowPathChirho}.scriptVerdictChirho`);
  stringArrayFieldChirho(rowChirho.issueFlagsChirho, `${rowPathChirho}.issueFlagsChirho`);
  stringFieldChirho(rowChirho.originalTextChirho, `${rowPathChirho}.originalTextChirho`);
  nullableStringFieldChirho(rowChirho.correctedTextChirho, `${rowPathChirho}.correctedTextChirho`);
  booleanFieldChirho(rowChirho.liveSpanExistsChirho, `${rowPathChirho}.liveSpanExistsChirho`);
  nullableStringFieldChirho(rowChirho.liveSpanReadErrorChirho, `${rowPathChirho}.liveSpanReadErrorChirho`);
  nullableStringFieldChirho(rowChirho.liveTextChirho, `${rowPathChirho}.liveTextChirho`);
  nullableStringFieldChirho(rowChirho.liveScriptChirho, `${rowPathChirho}.liveScriptChirho`);
  nullableStringFieldChirho(rowChirho.liveProvenanceChirho, `${rowPathChirho}.liveProvenanceChirho`);
  nullableBooleanFieldChirho(rowChirho.liveTextMatchesOriginalChirho, `${rowPathChirho}.liveTextMatchesOriginalChirho`);
  stringFieldChirho(rowChirho.liveSpanLinePathChirho, `${rowPathChirho}.liveSpanLinePathChirho`);
  stringFieldChirho(rowChirho.liveScanlinePathChirho, `${rowPathChirho}.liveScanlinePathChirho`);
  booleanFieldChirho(rowChirho.liveScanlineExistsChirho, `${rowPathChirho}.liveScanlineExistsChirho`);
}

function assertAttributionCleanupGroupShapeChirho(groupChirho: AttributionCleanupGroupChirho, indexChirho: number): void {
  const groupPathChirho = `humanValidationDbChirho.genericReviewerRowGroupsChirho[${indexChirho}]`;
  stringFieldChirho(groupChirho.reviewerChirho, `${groupPathChirho}.reviewerChirho`);
  nullableStringFieldChirho(groupChirho.appliedAtChirho, `${groupPathChirho}.appliedAtChirho`);
  numberArrayFieldChirho(groupChirho.liveTextMatchIdsChirho, `${groupPathChirho}.liveTextMatchIdsChirho`);
  numberArrayFieldChirho(groupChirho.liveTextMismatchIdsChirho, `${groupPathChirho}.liveTextMismatchIdsChirho`);
  numberArrayFieldChirho(groupChirho.liveTextUnknownIdsChirho, `${groupPathChirho}.liveTextUnknownIdsChirho`);
  stringArrayFieldChirho(groupChirho.liveTextMatchExpectedLiveTextHashArgsChirho, `${groupPathChirho}.liveTextMatchExpectedLiveTextHashArgsChirho`);
}

function attributionCleanupBatchCommandForCheckChirho(
  idsChirho: number[],
  expectedLiveTextHashArgsChirho: string[]
): { dryRunCommandChirho: string; applyCommandChirho: string } {
  const baseCommandPartsChirho = [
    "bun run reattribute-pass-c-human-validations-chirho --",
    ...idsChirho.map((idChirho) => `--validation-id-chirho=${idChirho}`),
    "--reviewer-chirho='<explicit-human-reviewer-id-chirho>'",
    "--rationale-chirho='<why every unchanged selected row is attributable to that reviewer>'",
    ...expectedLiveTextHashArgsChirho,
  ];
  return {
    dryRunCommandChirho: baseCommandPartsChirho.join(" "),
    applyCommandChirho: [...baseCommandPartsChirho, "--apply-chirho"].join(" "),
  };
}

function countEntriesForCheckChirho(countsChirho: Record<string, number>): string {
  return Object.entries(countsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ") || "none";
}

function assertRawHebrewRepeatItemShapeChirho(itemChirho: RawHebrewRepeatItemChirho, pathChirho: string): void {
  stringFieldChirho(itemChirho.itemKeyChirho, `${pathChirho}.itemKeyChirho`);
  assertGeneratedCheckChirho(itemChirho.volumeChirho === null || typeof itemChirho.volumeChirho === "number", `status JSON missing ${pathChirho}.volumeChirho number/null`);
  stringFieldChirho(itemChirho.validationStatusChirho, `${pathChirho}.validationStatusChirho`);
  stringFieldChirho(itemChirho.reviewUrlChirho, `${pathChirho}.reviewUrlChirho`);
}

function assertRawHebrewRepeatGroupShapeChirho(groupChirho: RawHebrewRepeatGroupChirho, indexChirho: number): void {
  const groupPathChirho = `rawHebrewChirho.repeatSummaryChirho.groupsChirho[${indexChirho}]`;
  stringFieldChirho(groupChirho.textChirho, `${groupPathChirho}.textChirho`);
  numberFieldChirho(groupChirho.countChirho, `${groupPathChirho}.countChirho`);
  stringFieldChirho(groupChirho.reviewUrlChirho, `${groupPathChirho}.reviewUrlChirho`);
  numberRecordFieldChirho(groupChirho.validationStatusCountsChirho, `${groupPathChirho}.validationStatusCountsChirho`);
  assertGeneratedCheckChirho(Array.isArray(groupChirho.itemsChirho), `status JSON missing ${groupPathChirho}.itemsChirho array`);
  assertGeneratedCheckChirho(
    groupChirho.itemsChirho.length === groupChirho.countChirho,
    `status JSON ${groupPathChirho}.itemsChirho length ${groupChirho.itemsChirho.length} does not match countChirho ${groupChirho.countChirho}`
  );
  groupChirho.itemsChirho.forEach((itemChirho, itemIndexChirho) =>
    assertRawHebrewRepeatItemShapeChirho(itemChirho, `${groupPathChirho}.itemsChirho[${itemIndexChirho}]`)
  );
}

function assertLatinSymbolRepeatItemShapeChirho(itemChirho: LatinSymbolRepeatItemChirho, pathChirho: string): void {
  stringFieldChirho(itemChirho.idChirho, `${pathChirho}.idChirho`);
  numberFieldChirho(itemChirho.volumeChirho, `${pathChirho}.volumeChirho`);
  stringFieldChirho(itemChirho.itemKindChirho, `${pathChirho}.itemKindChirho`);
  stringFieldChirho(itemChirho.reviewUrlChirho, `${pathChirho}.reviewUrlChirho`);
}

function assertLatinSymbolRepeatGroupShapeChirho(groupChirho: LatinSymbolRepeatGroupChirho, indexChirho: number): void {
  const groupPathChirho = `latinSymbolVisionChirho.repeatSummaryChirho.groupsChirho[${indexChirho}]`;
  stringFieldChirho(groupChirho.scriptChirho, `${groupPathChirho}.scriptChirho`);
  stringFieldChirho(groupChirho.symbolRiskChirho, `${groupPathChirho}.symbolRiskChirho`);
  stringFieldChirho(groupChirho.textChirho, `${groupPathChirho}.textChirho`);
  numberFieldChirho(groupChirho.countChirho, `${groupPathChirho}.countChirho`);
  stringFieldChirho(groupChirho.firstItemIdChirho, `${groupPathChirho}.firstItemIdChirho`);
  stringFieldChirho(groupChirho.reviewUrlChirho, `${groupPathChirho}.reviewUrlChirho`);
  assertGeneratedCheckChirho(Array.isArray(groupChirho.itemsChirho), `status JSON missing ${groupPathChirho}.itemsChirho array`);
  assertGeneratedCheckChirho(
    groupChirho.itemsChirho.length === groupChirho.countChirho,
    `status JSON ${groupPathChirho}.itemsChirho length ${groupChirho.itemsChirho.length} does not match countChirho ${groupChirho.countChirho}`
  );
  groupChirho.itemsChirho.forEach((itemChirho, itemIndexChirho) =>
    assertLatinSymbolRepeatItemShapeChirho(itemChirho, `${groupPathChirho}.itemsChirho[${itemIndexChirho}]`)
  );
}

function assertExpertRepeatItemShapeChirho(itemChirho: ExpertRepeatItemChirho, pathChirho: string): void {
  stringFieldChirho(itemChirho.idChirho, `${pathChirho}.idChirho`);
  assertGeneratedCheckChirho(itemChirho.volumeChirho === null || typeof itemChirho.volumeChirho === "number", `status JSON missing ${pathChirho}.volumeChirho number/null`);
  stringFieldChirho(itemChirho.reviewUrlChirho, `${pathChirho}.reviewUrlChirho`);
}

function assertExpertRepeatGroupShapeChirho(groupChirho: ExpertRepeatGroupChirho, indexChirho: number): void {
  const groupPathChirho = `visionTierChirho.repeatSummaryChirho.groupsChirho[${indexChirho}]`;
  stringFieldChirho(groupChirho.scriptChirho, `${groupPathChirho}.scriptChirho`);
  stringFieldChirho(groupChirho.currentTextChirho, `${groupPathChirho}.currentTextChirho`);
  numberFieldChirho(groupChirho.countChirho, `${groupPathChirho}.countChirho`);
  stringFieldChirho(groupChirho.firstItemIdChirho, `${groupPathChirho}.firstItemIdChirho`);
  stringFieldChirho(groupChirho.reviewUrlChirho, `${groupPathChirho}.reviewUrlChirho`);
  assertGeneratedCheckChirho(Array.isArray(groupChirho.itemsChirho), `status JSON missing ${groupPathChirho}.itemsChirho array`);
  assertGeneratedCheckChirho(
    groupChirho.itemsChirho.length === groupChirho.countChirho,
    `status JSON ${groupPathChirho}.itemsChirho length ${groupChirho.itemsChirho.length} does not match countChirho ${groupChirho.countChirho}`
  );
  groupChirho.itemsChirho.forEach((itemChirho, itemIndexChirho) =>
    assertExpertRepeatItemShapeChirho(itemChirho, `${groupPathChirho}.itemsChirho[${itemIndexChirho}]`)
  );
}

function assertRawHebrewRepeatHandoffMatchesStatusChirho(statusChirho: CertificationStatusChirho, markdownChirho: string): void {
  assertGeneratedCheckChirho(
    statusChirho.rawHebrewChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho === "object" &&
      statusChirho.rawHebrewChirho.repeatSummaryChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho.repeatSummaryChirho === "object",
    "status JSON missing rawHebrewChirho.repeatSummaryChirho object"
  );
  const rawHebrewChirho = statusChirho.rawHebrewChirho;
  const summaryChirho = rawHebrewChirho.repeatSummaryChirho!;
  const pendingCountChirho = numberFieldChirho(rawHebrewChirho.livePendingSpanCountChirho, "rawHebrewChirho.livePendingSpanCountChirho");
  const textGroupCountChirho = numberFieldChirho(summaryChirho.textGroupCountChirho, "rawHebrewChirho.repeatSummaryChirho.textGroupCountChirho");
  const duplicateTextGroupCountChirho = numberFieldChirho(
    summaryChirho.duplicateTextGroupCountChirho,
    "rawHebrewChirho.repeatSummaryChirho.duplicateTextGroupCountChirho"
  );
  const duplicateTextItemCountChirho = numberFieldChirho(
    summaryChirho.duplicateTextItemCountChirho,
    "rawHebrewChirho.repeatSummaryChirho.duplicateTextItemCountChirho"
  );
  const singletonTextGroupCountChirho = numberFieldChirho(
    summaryChirho.singletonTextGroupCountChirho,
    "rawHebrewChirho.repeatSummaryChirho.singletonTextGroupCountChirho"
  );
  const duplicateGroupCountsByStatusChirho = numberRecordFieldChirho(
    summaryChirho.duplicateTextGroupCountsByValidationStatusChirho,
    "rawHebrewChirho.repeatSummaryChirho.duplicateTextGroupCountsByValidationStatusChirho"
  );
  const duplicateItemCountsByStatusChirho = numberRecordFieldChirho(
    summaryChirho.duplicateTextItemCountsByValidationStatusChirho,
    "rawHebrewChirho.repeatSummaryChirho.duplicateTextItemCountsByValidationStatusChirho"
  );
  assertGeneratedCheckChirho(Array.isArray(summaryChirho.groupsChirho), "status JSON missing rawHebrewChirho.repeatSummaryChirho.groupsChirho array");
  const groupsChirho = summaryChirho.groupsChirho;
  assertGeneratedCheckChirho(
    groupsChirho.length === duplicateTextGroupCountChirho,
    `raw Hebrew repeat status has ${groupsChirho.length} rendered duplicate group(s), expected ${duplicateTextGroupCountChirho}`
  );

  assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho, `- Pending raw Hebrew items: ${pendingCountChirho}`, "pending raw Hebrew count");
  assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho, `- Text groups: ${textGroupCountChirho}`, "text group count");
  assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho, `- Duplicate groups: ${duplicateTextGroupCountChirho}`, "duplicate group count");
  assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho, `- Duplicate items: ${duplicateTextItemCountChirho}`, "duplicate item count");
  assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho, `- Singleton groups: ${singletonTextGroupCountChirho}`, "singleton group count");
  assertRawHebrewRepeatMarkdownIncludesChirho(
    markdownChirho,
    `- Duplicate groups by validation status: ${countEntriesForCheckChirho(duplicateGroupCountsByStatusChirho)}`,
    "duplicate groups by validation status"
  );
  assertRawHebrewRepeatMarkdownIncludesChirho(
    markdownChirho,
    `- Duplicate items by validation status: ${countEntriesForCheckChirho(duplicateItemCountsByStatusChirho)}`,
    "duplicate items by validation status"
  );

  const renderedGroupHeadingCountChirho = [...markdownChirho.matchAll(/^## \d+\. hebrew-chirho x\d+ /gmu)].length;
  assertGeneratedCheckChirho(
    renderedGroupHeadingCountChirho === groupsChirho.length,
    `raw Hebrew repeat handoff rendered ${renderedGroupHeadingCountChirho} group heading(s), expected ${groupsChirho.length}`
  );
  if (groupsChirho.length === 0) {
    assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho, "- No duplicate raw Hebrew text groups are currently pending.", "empty duplicate group notice");
    return;
  }

  groupsChirho.forEach((groupChirho, indexChirho) => {
    assertRawHebrewRepeatGroupShapeChirho(groupChirho, indexChirho);
    const groupNumberChirho = indexChirho + 1;
    const textDisplayChirho = groupChirho.textChirho.trim().length === 0
      ? "(blank text)"
      : markdownCodeSpanForCheckChirho(groupChirho.textChirho);
    assertRawHebrewRepeatMarkdownIncludesChirho(
      markdownChirho,
      `## ${groupNumberChirho}. hebrew-chirho x${groupChirho.countChirho} ${textDisplayChirho}`,
      `group ${groupNumberChirho} heading`
    );
    assertRawHebrewRepeatMarkdownIncludesChirho(markdownChirho, `- First pending exact-text view: ${groupChirho.reviewUrlChirho}`, `group ${groupNumberChirho} first URL`);
    assertRawHebrewRepeatMarkdownIncludesChirho(
      markdownChirho,
      `- Validation statuses: ${countEntriesForCheckChirho(groupChirho.validationStatusCountsChirho)}`,
      `group ${groupNumberChirho} validation statuses`
    );
    assertRawHebrewRepeatMarkdownIncludesChirho(
      markdownChirho,
      `- Item keys: ${groupChirho.itemsChirho.map((itemChirho) => itemChirho.itemKeyChirho).join(", ")}`,
      `group ${groupNumberChirho} item keys`
    );
    for (const itemChirho of groupChirho.itemsChirho) {
      const volumeTextChirho = itemChirho.volumeChirho === null ? "vol ?" : `vol ${itemChirho.volumeChirho}`;
      assertRawHebrewRepeatMarkdownIncludesChirho(
        markdownChirho,
        `  - ${itemChirho.itemKeyChirho} (${volumeTextChirho}; ${itemChirho.validationStatusChirho}): ${itemChirho.reviewUrlChirho}`,
        `group ${groupNumberChirho} item ${itemChirho.itemKeyChirho}`
      );
    }
  });
}

function assertExpertRepeatHandoffMatchesStatusChirho(statusChirho: CertificationStatusChirho, markdownChirho: string): void {
  assertGeneratedCheckChirho(
    statusChirho.visionTierChirho !== undefined &&
      typeof statusChirho.visionTierChirho === "object" &&
      statusChirho.visionTierChirho.repeatSummaryChirho !== undefined &&
      typeof statusChirho.visionTierChirho.repeatSummaryChirho === "object",
    "status JSON missing visionTierChirho.repeatSummaryChirho object"
  );
  const visionTierChirho = statusChirho.visionTierChirho;
  const summaryChirho = visionTierChirho.repeatSummaryChirho!;
  const pendingCountChirho = numberFieldChirho(visionTierChirho.pendingVisionItemCountChirho, "visionTierChirho.pendingVisionItemCountChirho");
  const textGroupCountChirho = numberFieldChirho(summaryChirho.textGroupCountChirho, "visionTierChirho.repeatSummaryChirho.textGroupCountChirho");
  const duplicateTextGroupCountChirho = numberFieldChirho(
    summaryChirho.duplicateTextGroupCountChirho,
    "visionTierChirho.repeatSummaryChirho.duplicateTextGroupCountChirho"
  );
  const duplicateTextItemCountChirho = numberFieldChirho(
    summaryChirho.duplicateTextItemCountChirho,
    "visionTierChirho.repeatSummaryChirho.duplicateTextItemCountChirho"
  );
  const singletonTextGroupCountChirho = numberFieldChirho(
    summaryChirho.singletonTextGroupCountChirho,
    "visionTierChirho.repeatSummaryChirho.singletonTextGroupCountChirho"
  );
  const duplicateGroupCountsByScriptChirho = numberRecordFieldChirho(
    summaryChirho.duplicateTextGroupCountsByScriptChirho,
    "visionTierChirho.repeatSummaryChirho.duplicateTextGroupCountsByScriptChirho"
  );
  const duplicateItemCountsByScriptChirho = numberRecordFieldChirho(
    summaryChirho.duplicateTextItemCountsByScriptChirho,
    "visionTierChirho.repeatSummaryChirho.duplicateTextItemCountsByScriptChirho"
  );
  assertGeneratedCheckChirho(Array.isArray(summaryChirho.groupsChirho), "status JSON missing visionTierChirho.repeatSummaryChirho.groupsChirho array");
  const groupsChirho = summaryChirho.groupsChirho;
  assertGeneratedCheckChirho(
    groupsChirho.length === duplicateTextGroupCountChirho,
    `expert repeat status has ${groupsChirho.length} rendered duplicate group(s), expected ${duplicateTextGroupCountChirho}`
  );

  assertExpertRepeatMarkdownIncludesChirho(markdownChirho, `- Pending expert items: ${pendingCountChirho}`, "pending expert count");
  assertExpertRepeatMarkdownIncludesChirho(markdownChirho, `- Text groups: ${textGroupCountChirho}`, "text group count");
  assertExpertRepeatMarkdownIncludesChirho(markdownChirho, `- Duplicate groups: ${duplicateTextGroupCountChirho}`, "duplicate group count");
  assertExpertRepeatMarkdownIncludesChirho(markdownChirho, `- Duplicate items: ${duplicateTextItemCountChirho}`, "duplicate item count");
  assertExpertRepeatMarkdownIncludesChirho(markdownChirho, `- Singleton groups: ${singletonTextGroupCountChirho}`, "singleton group count");
  assertExpertRepeatMarkdownIncludesChirho(
    markdownChirho,
    `- Duplicate groups by script: ${countEntriesForCheckChirho(duplicateGroupCountsByScriptChirho)}`,
    "duplicate groups by script"
  );
  assertExpertRepeatMarkdownIncludesChirho(
    markdownChirho,
    `- Duplicate items by script: ${countEntriesForCheckChirho(duplicateItemCountsByScriptChirho)}`,
    "duplicate items by script"
  );

  const renderedGroupHeadingCountChirho = [...markdownChirho.matchAll(/^## \d+\. .+ x\d+ /gmu)].length;
  assertGeneratedCheckChirho(
    renderedGroupHeadingCountChirho === groupsChirho.length,
    `expert repeat handoff rendered ${renderedGroupHeadingCountChirho} group heading(s), expected ${groupsChirho.length}`
  );
  if (groupsChirho.length === 0) {
    assertExpertRepeatMarkdownIncludesChirho(markdownChirho, "- No duplicate expert text groups are currently pending.", "empty duplicate group notice");
    return;
  }

  groupsChirho.forEach((groupChirho, indexChirho) => {
    assertExpertRepeatGroupShapeChirho(groupChirho, indexChirho);
    const groupNumberChirho = indexChirho + 1;
    const textDisplayChirho = groupChirho.currentTextChirho.trim().length === 0
      ? "(blank text)"
      : markdownCodeSpanForCheckChirho(groupChirho.currentTextChirho);
    assertExpertRepeatMarkdownIncludesChirho(
      markdownChirho,
      `## ${groupNumberChirho}. ${groupChirho.scriptChirho} x${groupChirho.countChirho} ${textDisplayChirho}`,
      `group ${groupNumberChirho} heading`
    );
    assertExpertRepeatMarkdownIncludesChirho(markdownChirho, `- First pending: ${groupChirho.reviewUrlChirho}`, `group ${groupNumberChirho} first URL`);
    assertExpertRepeatMarkdownIncludesChirho(
      markdownChirho,
      `- Item IDs: ${groupChirho.itemsChirho.map((itemChirho) => itemChirho.idChirho).join(", ")}`,
      `group ${groupNumberChirho} item IDs`
    );
    for (const itemChirho of groupChirho.itemsChirho) {
      const volumeTextChirho = itemChirho.volumeChirho === null ? "vol ?" : `vol ${itemChirho.volumeChirho}`;
      assertExpertRepeatMarkdownIncludesChirho(
        markdownChirho,
        `  - ${itemChirho.idChirho} (${volumeTextChirho}): ${itemChirho.reviewUrlChirho}`,
        `group ${groupNumberChirho} item ${itemChirho.idChirho}`
      );
    }
  });
}

function assertLatinSymbolRepeatHandoffMatchesStatusChirho(statusChirho: CertificationStatusChirho, markdownChirho: string): void {
  assertGeneratedCheckChirho(
    statusChirho.latinSymbolVisionChirho !== undefined &&
      typeof statusChirho.latinSymbolVisionChirho === "object" &&
      statusChirho.latinSymbolVisionChirho.repeatSummaryChirho !== undefined &&
      typeof statusChirho.latinSymbolVisionChirho.repeatSummaryChirho === "object",
    "status JSON missing latinSymbolVisionChirho.repeatSummaryChirho object"
  );
  const latinSymbolChirho = statusChirho.latinSymbolVisionChirho;
  const summaryChirho = latinSymbolChirho.repeatSummaryChirho!;
  const pendingCountChirho = numberFieldChirho(latinSymbolChirho.pendingDecisionCountChirho, "latinSymbolVisionChirho.pendingDecisionCountChirho");
  const textGroupCountChirho = numberFieldChirho(summaryChirho.textGroupCountChirho, "latinSymbolVisionChirho.repeatSummaryChirho.textGroupCountChirho");
  const duplicateTextGroupCountChirho = numberFieldChirho(
    summaryChirho.duplicateTextGroupCountChirho,
    "latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextGroupCountChirho"
  );
  const duplicateTextItemCountChirho = numberFieldChirho(
    summaryChirho.duplicateTextItemCountChirho,
    "latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextItemCountChirho"
  );
  const singletonTextGroupCountChirho = numberFieldChirho(
    summaryChirho.singletonTextGroupCountChirho,
    "latinSymbolVisionChirho.repeatSummaryChirho.singletonTextGroupCountChirho"
  );
  const duplicateGroupCountsByScriptChirho = numberRecordFieldChirho(
    summaryChirho.duplicateTextGroupCountsByScriptChirho,
    "latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextGroupCountsByScriptChirho"
  );
  const duplicateItemCountsByScriptChirho = numberRecordFieldChirho(
    summaryChirho.duplicateTextItemCountsByScriptChirho,
    "latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextItemCountsByScriptChirho"
  );
  assertGeneratedCheckChirho(Array.isArray(summaryChirho.groupsChirho), "status JSON missing latinSymbolVisionChirho.repeatSummaryChirho.groupsChirho array");
  const groupsChirho = summaryChirho.groupsChirho;
  assertGeneratedCheckChirho(
    groupsChirho.length === duplicateTextGroupCountChirho,
    `Latin/symbol repeat status has ${groupsChirho.length} rendered duplicate group(s), expected ${duplicateTextGroupCountChirho}`
  );

  assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho, `- Pending Latin/symbol decisions: ${pendingCountChirho}`, "pending Latin/symbol count");
  assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho, `- Text groups: ${textGroupCountChirho}`, "text group count");
  assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho, `- Duplicate groups: ${duplicateTextGroupCountChirho}`, "duplicate group count");
  assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho, `- Duplicate items: ${duplicateTextItemCountChirho}`, "duplicate item count");
  assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho, `- Singleton groups: ${singletonTextGroupCountChirho}`, "singleton group count");
  assertLatinSymbolRepeatMarkdownIncludesChirho(
    markdownChirho,
    `- Duplicate groups by script: ${countEntriesForCheckChirho(duplicateGroupCountsByScriptChirho)}`,
    "duplicate groups by script"
  );
  assertLatinSymbolRepeatMarkdownIncludesChirho(
    markdownChirho,
    `- Duplicate items by script: ${countEntriesForCheckChirho(duplicateItemCountsByScriptChirho)}`,
    "duplicate items by script"
  );

  const renderedGroupHeadingCountChirho = [...markdownChirho.matchAll(/^## \d+\. .+ x\d+ /gmu)].length;
  assertGeneratedCheckChirho(
    renderedGroupHeadingCountChirho === groupsChirho.length,
    `Latin/symbol repeat handoff rendered ${renderedGroupHeadingCountChirho} group heading(s), expected ${groupsChirho.length}`
  );
  if (groupsChirho.length === 0) {
    assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho, "- No duplicate Latin/symbol text groups are currently pending.", "empty duplicate group notice");
    return;
  }

  groupsChirho.forEach((groupChirho, indexChirho) => {
    assertLatinSymbolRepeatGroupShapeChirho(groupChirho, indexChirho);
    const groupNumberChirho = indexChirho + 1;
    const textDisplayChirho = groupChirho.textChirho.trim().length === 0
      ? "(blank text)"
      : markdownCodeSpanForCheckChirho(groupChirho.textChirho);
    assertLatinSymbolRepeatMarkdownIncludesChirho(
      markdownChirho,
      `## ${groupNumberChirho}. ${groupChirho.scriptChirho}/${groupChirho.symbolRiskChirho} x${groupChirho.countChirho} ${textDisplayChirho}`,
      `group ${groupNumberChirho} heading`
    );
    assertLatinSymbolRepeatMarkdownIncludesChirho(markdownChirho, `- First pending exact-text view: ${groupChirho.reviewUrlChirho}`, `group ${groupNumberChirho} first URL`);
    assertLatinSymbolRepeatMarkdownIncludesChirho(
      markdownChirho,
      `- Item IDs: ${groupChirho.itemsChirho.map((itemChirho) => itemChirho.idChirho).join(", ")}`,
      `group ${groupNumberChirho} item IDs`
    );
    for (const itemChirho of groupChirho.itemsChirho) {
      assertLatinSymbolRepeatMarkdownIncludesChirho(
        markdownChirho,
        `  - ${itemChirho.idChirho} (vol ${itemChirho.volumeChirho}; ${itemChirho.itemKindChirho}): ${itemChirho.reviewUrlChirho}`,
        `group ${groupNumberChirho} item ${itemChirho.idChirho}`
      );
    }
  });
}

function assertAttributionCleanupHandoffMatchesStatusChirho(statusChirho: CertificationStatusChirho, markdownChirho: string): void {
  assertGeneratedCheckChirho(
    statusChirho.humanValidationDbChirho !== undefined && typeof statusChirho.humanValidationDbChirho === "object",
    "status JSON missing humanValidationDbChirho object"
  );
  const humanChirho = statusChirho.humanValidationDbChirho;
  const genericReviewerRowsChirho = numberFieldChirho(humanChirho.genericReviewerRowsChirho, "humanValidationDbChirho.genericReviewerRowsChirho");
  const genericReviewerLiveTextMatchRowsChirho = numberFieldChirho(
    humanChirho.genericReviewerLiveTextMatchRowsChirho,
    "humanValidationDbChirho.genericReviewerLiveTextMatchRowsChirho"
  );
  const genericReviewerLiveTextMismatchRowsChirho = numberFieldChirho(
    humanChirho.genericReviewerLiveTextMismatchRowsChirho,
    "humanValidationDbChirho.genericReviewerLiveTextMismatchRowsChirho"
  );
  const genericReviewerLiveTextUnknownRowsChirho = numberFieldChirho(
    humanChirho.genericReviewerLiveTextUnknownRowsChirho,
    "humanValidationDbChirho.genericReviewerLiveTextUnknownRowsChirho"
  );
  assertGeneratedCheckChirho(
    Array.isArray(humanChirho.genericReviewerRowDetailsChirho),
    "status JSON missing humanValidationDbChirho.genericReviewerRowDetailsChirho array"
  );
  assertGeneratedCheckChirho(
    Array.isArray(humanChirho.genericReviewerRowGroupsChirho),
    "status JSON missing humanValidationDbChirho.genericReviewerRowGroupsChirho array"
  );
  const rowsChirho = humanChirho.genericReviewerRowDetailsChirho;
  const groupsChirho = humanChirho.genericReviewerRowGroupsChirho;
  assertGeneratedCheckChirho(
    rowsChirho.length === genericReviewerRowsChirho,
    `status JSON genericReviewerRowDetailsChirho length ${rowsChirho.length} does not match genericReviewerRowsChirho ${genericReviewerRowsChirho}`
  );

  assertAttributionMarkdownIncludesChirho(markdownChirho, `- Attribution-blocked rows: ${genericReviewerRowsChirho}`, "blocked-row count");
  assertAttributionMarkdownIncludesChirho(
    markdownChirho,
    `- Live text still matches original reviewed text: ${genericReviewerLiveTextMatchRowsChirho}`,
    "unchanged live-text count"
  );
  assertAttributionMarkdownIncludesChirho(
    markdownChirho,
    `- Live text changed since original review: ${genericReviewerLiveTextMismatchRowsChirho}`,
    "changed live-text count"
  );
  assertAttributionMarkdownIncludesChirho(
    markdownChirho,
    `- Live text could not be checked: ${genericReviewerLiveTextUnknownRowsChirho}`,
    "unknown live-text count"
  );

  const renderedRowHeadingCountChirho = [...markdownChirho.matchAll(/^## id \d+ - [^\n]+$/gmu)].length;
  assertGeneratedCheckChirho(
    renderedRowHeadingCountChirho === rowsChirho.length,
    `attribution cleanup handoff rendered ${renderedRowHeadingCountChirho} row heading(s), expected ${rowsChirho.length}`
  );
  if (rowsChirho.length === 0) {
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      "- No attribution-blocked Pass-C human validation rows are currently present.",
      "empty attribution row notice"
    );
  }

  for (const [indexChirho, groupChirho] of groupsChirho.entries()) {
    assertAttributionCleanupGroupShapeChirho(groupChirho, indexChirho);
  }
  const batchGroupsChirho = groupsChirho.filter((groupChirho) => groupChirho.liveTextMatchIdsChirho.length > 1);
  if (batchGroupsChirho.length === 0) {
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      "- No unchanged-live-text exact-ID batch groups currently have more than one row.",
      "empty unchanged-live-text batch notice"
    );
  }
  for (const groupChirho of batchGroupsChirho) {
    const { dryRunCommandChirho, applyCommandChirho } = attributionCleanupBatchCommandForCheckChirho(
      groupChirho.liveTextMatchIdsChirho,
      groupChirho.liveTextMatchExpectedLiveTextHashArgsChirho
    );
    const groupLabelChirho = groupChirho.appliedAtChirho ?? "not-applied-chirho";
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Applied ${groupLabelChirho}; current reviewer ${markdownCodeSpanForCheckChirho(groupChirho.reviewerChirho)}; unchanged ids ${groupChirho.liveTextMatchIdsChirho.join(", ")}; excluded changed ids ${groupChirho.liveTextMismatchIdsChirho.join(", ") || "none"}; excluded unchecked ids ${groupChirho.liveTextUnknownIdsChirho.join(", ") || "none"}`,
      `batch group ${groupLabelChirho} summary`
    );
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `  - Unchanged batch dry-run: ${markdownCodeSpanForCheckChirho(dryRunCommandChirho)}`,
      `batch group ${groupLabelChirho} dry-run command`
    );
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `  - Unchanged batch apply: ${markdownCodeSpanForCheckChirho(applyCommandChirho)}`,
      `batch group ${groupLabelChirho} apply command`
    );
  }

  for (const [indexChirho, rowChirho] of rowsChirho.entries()) {
    assertAttributionCleanupRowShapeChirho(rowChirho, indexChirho);
    const flagsChirho = rowChirho.issueFlagsChirho.length === 0 ? "none" : rowChirho.issueFlagsChirho.join(", ");
    const correctedTextChirho = rowChirho.correctedTextChirho === null ? "none" : markdownCodeSpanForCheckChirho(rowChirho.correctedTextChirho);
    const liveTextChirho = rowChirho.liveTextChirho === null ? "none" : markdownCodeSpanForCheckChirho(rowChirho.liveTextChirho);
    const liveTextMatchesOriginalChirho = rowChirho.liveTextMatchesOriginalChirho === null ? "unknown" : String(rowChirho.liveTextMatchesOriginalChirho);
    const liveSpanStatusChirho = rowChirho.liveSpanReadErrorChirho !== null
      ? `read-error-chirho ${markdownCodeSpanForCheckChirho(rowChirho.liveSpanReadErrorChirho)}`
      : rowChirho.liveSpanExistsChirho
        ? "present-chirho"
        : "missing-chirho";
    const scanlineStatusChirho = rowChirho.liveScanlineExistsChirho ? "present-chirho" : "missing-chirho";
    assertAttributionMarkdownIncludesChirho(markdownChirho, `## id ${rowChirho.idChirho} - ${rowChirho.locationChirho}`, `row ${rowChirho.idChirho} heading`);
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Attribution-blocked read-only view: ${rawHebrewReviewUrlForCheckChirho("attribution-blocked-chirho", rowChirho.locationChirho)}`,
      `row ${rowChirho.idChirho} blocked URL`
    );
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Attribution re-review view: ${rawHebrewReviewUrlForCheckChirho("attribution-rereview-chirho", rowChirho.locationChirho)}`,
      `row ${rowChirho.idChirho} re-review URL`
    );
    assertAttributionMarkdownIncludesChirho(markdownChirho, `- Current reviewer value: ${markdownCodeSpanForCheckChirho(rowChirho.reviewerChirho)}`, `row ${rowChirho.idChirho} reviewer`);
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Verdict: ${rowChirho.verdictChirho}; applied: ${rowChirho.appliedAtChirho ?? "not-applied-chirho"}; script verdict: ${rowChirho.scriptVerdictChirho ?? "none"}; issue flags: ${flagsChirho}`,
      `row ${rowChirho.idChirho} verdict`
    );
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Original reviewed text: ${markdownCodeSpanForCheckChirho(rowChirho.originalTextChirho)}`,
      `row ${rowChirho.idChirho} original text`
    );
    assertAttributionMarkdownIncludesChirho(markdownChirho, `- Corrected text: ${correctedTextChirho}`, `row ${rowChirho.idChirho} corrected text`);
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Live span: ${liveSpanStatusChirho}; live text: ${liveTextChirho}; live script: ${rowChirho.liveScriptChirho ?? "none-chirho"}; live provenance: ${rowChirho.liveProvenanceChirho ?? "none-chirho"}; text matches original: ${liveTextMatchesOriginalChirho}`,
      `row ${rowChirho.idChirho} live span`
    );
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Live span JSON: ${markdownCodeSpanForCheckChirho(relativeProjectPathForCheckChirho(rowChirho.liveSpanLinePathChirho))}`,
      `row ${rowChirho.idChirho} live span path`
    );
    assertAttributionMarkdownIncludesChirho(
      markdownChirho,
      `- Source scanline: ${markdownCodeSpanForCheckChirho(relativeProjectPathForCheckChirho(rowChirho.liveScanlinePathChirho))} (${scanlineStatusChirho})`,
      `row ${rowChirho.idChirho} scanline path`
    );
    if (rowChirho.liveTextMatchesOriginalChirho === true && rowChirho.liveTextChirho !== null) {
      const baseCommandPartsChirho = [
        "bun run reattribute-pass-c-human-validations-chirho --",
        `--validation-id-chirho=${rowChirho.idChirho}`,
        "--reviewer-chirho='<explicit-human-reviewer-id-chirho>'",
        "--rationale-chirho='<why this existing row is attributable to that reviewer>'",
        `--expected-live-text-chirho=${shellSingleQuoteForCheckChirho(rowChirho.liveTextChirho)}`,
      ];
      assertAttributionMarkdownIncludesChirho(
        markdownChirho,
        `  - Guarded reattribute dry-run: ${markdownCodeSpanForCheckChirho(baseCommandPartsChirho.join(" "))}`,
        `row ${rowChirho.idChirho} dry-run command`
      );
      assertAttributionMarkdownIncludesChirho(
        markdownChirho,
        `  - Guarded reattribute apply: ${markdownCodeSpanForCheckChirho([...baseCommandPartsChirho, "--apply-chirho"].join(" "))}`,
        `row ${rowChirho.idChirho} apply command`
      );
    } else if (rowChirho.liveTextMatchesOriginalChirho === false) {
      assertAttributionMarkdownIncludesChirho(
        markdownChirho,
        "  - Reattribute command omitted: live text changed since the original row. Use Attribution re-review unless the named human rechecks the current live text against the print.",
        `row ${rowChirho.idChirho} changed-live-text omission`
      );
    } else {
      assertAttributionMarkdownIncludesChirho(
        markdownChirho,
        "  - Reattribute command omitted: live text could not be checked.",
        `row ${rowChirho.idChirho} unknown-live-text omission`
      );
    }
  }
}

function assertRawHebrewAttentionItemShapeChirho(itemChirho: RawHebrewAttentionHandoffItemChirho, indexChirho: number): void {
  const itemPathChirho = `rawHebrewChirho.triageChirho.attentionItemsChirho[${indexChirho}]`;
  stringFieldChirho(itemChirho.idChirho, `${itemPathChirho}.idChirho`);
  stringFieldChirho(itemChirho.reviewUrlChirho, `${itemPathChirho}.reviewUrlChirho`);
  stringFieldChirho(itemChirho.textChirho, `${itemPathChirho}.textChirho`);
  stringFieldChirho(itemChirho.validationStatusChirho, `${itemPathChirho}.validationStatusChirho`);
  stringArrayFieldChirho(itemChirho.reasonsChirho, `${itemPathChirho}.reasonsChirho`);
  assertGeneratedCheckChirho(
    itemChirho.witnessCountChirho === undefined || itemChirho.witnessCountChirho === null || typeof itemChirho.witnessCountChirho === "number",
    `status JSON missing ${itemPathChirho}.witnessCountChirho number/null`
  );
  assertGeneratedCheckChirho(
    itemChirho.bestDirectConfidenceChirho === null || typeof itemChirho.bestDirectConfidenceChirho === "number",
    `status JSON missing ${itemPathChirho}.bestDirectConfidenceChirho number/null`
  );
  stringFieldChirho(itemChirho.lineTextChirho, `${itemPathChirho}.lineTextChirho`);
}

function assertRawHebrewAttentionHandoffMatchesStatusChirho(statusChirho: CertificationStatusChirho, markdownChirho: string): void {
  assertGeneratedCheckChirho(
    statusChirho.structuralChirho !== undefined && typeof statusChirho.structuralChirho === "object",
    "status JSON missing structuralChirho object"
  );
  const rawHebrewCountChirho = numberFieldChirho(
    statusChirho.structuralChirho.passCOcrHebrewSpanCountChirho,
    "structuralChirho.passCOcrHebrewSpanCountChirho"
  );
  assertGeneratedCheckChirho(
    statusChirho.rawHebrewChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho === "object" &&
      statusChirho.rawHebrewChirho.triageChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho.triageChirho === "object",
    "status JSON missing rawHebrewChirho.triageChirho object"
  );
  const triageChirho = statusChirho.rawHebrewChirho.triageChirho;
  const attentionItemCountChirho = numberFieldChirho(triageChirho.attentionItemCountChirho, "rawHebrewChirho.triageChirho.attentionItemCountChirho");
  const lowConfidenceItemCountChirho = numberFieldChirho(
    triageChirho.lowConfidenceItemCountChirho,
    "rawHebrewChirho.triageChirho.lowConfidenceItemCountChirho"
  );
  const confidentDisagreementItemCountChirho = numberFieldChirho(
    triageChirho.confidentDirectReadDisagreementItemCountChirho,
    "rawHebrewChirho.triageChirho.confidentDirectReadDisagreementItemCountChirho"
  );
  const multiTokenItemCountChirho = numberFieldChirho(triageChirho.multiTokenItemCountChirho, "rawHebrewChirho.triageChirho.multiTokenItemCountChirho");
  const delimiterNotationItemCountChirho = numberFieldChirho(
    triageChirho.delimiterNotationItemCountChirho,
    "rawHebrewChirho.triageChirho.delimiterNotationItemCountChirho"
  );
  const noDirectReadItemCountChirho = numberFieldChirho(triageChirho.noDirectReadItemCountChirho, "rawHebrewChirho.triageChirho.noDirectReadItemCountChirho");
  const preReviewNotesAvailableChirho = booleanFieldChirho(
    triageChirho.preReviewNotesAvailableChirho,
    "rawHebrewChirho.triageChirho.preReviewNotesAvailableChirho"
  );
  const preReviewCoveredAttentionItemCountChirho = numberFieldChirho(
    triageChirho.preReviewCoveredAttentionItemCountChirho,
    "rawHebrewChirho.triageChirho.preReviewCoveredAttentionItemCountChirho"
  );
  const preReviewReasonCoveredAttentionItemCountChirho = numberFieldChirho(
    triageChirho.preReviewReasonCoveredAttentionItemCountChirho,
    "rawHebrewChirho.triageChirho.preReviewReasonCoveredAttentionItemCountChirho"
  );
  const preReviewReasonGapAttentionItemCountChirho = numberFieldChirho(
    triageChirho.preReviewReasonGapAttentionItemCountChirho,
    "rawHebrewChirho.triageChirho.preReviewReasonGapAttentionItemCountChirho"
  );
  assertGeneratedCheckChirho(
    Array.isArray(triageChirho.attentionItemsChirho),
    "status JSON missing rawHebrewChirho.triageChirho.attentionItemsChirho array"
  );
  const attentionItemsChirho = triageChirho.attentionItemsChirho;
  assertGeneratedCheckChirho(
    attentionItemsChirho.length === attentionItemCountChirho,
    `status JSON attentionItemsChirho length ${attentionItemsChirho.length} does not match attentionItemCountChirho ${attentionItemCountChirho}`
  );

  assertMarkdownIncludesChirho(markdownChirho, `- Raw Hebrew items still gate-blocking certification: ${rawHebrewCountChirho}`, "raw Hebrew gate-blocking count");
  assertMarkdownIncludesChirho(markdownChirho, `- Attention items with at least one flag: ${attentionItemCountChirho}`, "attention item count");
  assertMarkdownIncludesChirho(markdownChirho, `- Low-confidence direct CRNN reads (<0.75): ${lowConfidenceItemCountChirho}`, "low-confidence count");
  assertMarkdownIncludesChirho(
    markdownChirho,
    `- Confident direct CRNN read disagreements (>=0.85): ${confidentDisagreementItemCountChirho}`,
    "confident direct-read disagreement count"
  );
  assertMarkdownIncludesChirho(markdownChirho, `- Multi-token Hebrew spans: ${multiTokenItemCountChirho}`, "multi-token count");
  assertMarkdownIncludesChirho(markdownChirho, `- Delimiter/damaged-text notation spans: ${delimiterNotationItemCountChirho}`, "delimiter notation count");
  assertMarkdownIncludesChirho(markdownChirho, `- No direct CRNN crop reads: ${noDirectReadItemCountChirho}`, "no-direct-read count");
  assertMarkdownIncludesChirho(
    markdownChirho,
    `- Non-certifying pre-review item-location coverage: ${
      preReviewNotesAvailableChirho ? `${preReviewCoveredAttentionItemCountChirho}/${attentionItemCountChirho}` : "notes unavailable"
    }`,
    "pre-review item-location coverage"
  );
  assertMarkdownIncludesChirho(
    markdownChirho,
    `- Non-certifying pre-review reason-specific coverage: ${
      preReviewNotesAvailableChirho ? `${preReviewReasonCoveredAttentionItemCountChirho}/${attentionItemCountChirho}` : "notes unavailable"
    }`,
    "pre-review reason-specific coverage"
  );
  assertMarkdownIncludesChirho(
    markdownChirho,
    `- Current attention items with missing pre-review reason coverage: ${preReviewReasonGapAttentionItemCountChirho}`,
    "pre-review reason-gap count"
  );

  const renderedItemHeadingCountChirho = [...markdownChirho.matchAll(/^## v[^\n]+$/gmu)].length;
  assertGeneratedCheckChirho(
    renderedItemHeadingCountChirho === attentionItemsChirho.length,
    `raw Hebrew attention handoff rendered ${renderedItemHeadingCountChirho} item heading(s), expected ${attentionItemsChirho.length}`
  );
  if (attentionItemsChirho.length === 0) {
    assertMarkdownIncludesChirho(markdownChirho, "- No raw Hebrew attention items are currently present.", "empty attention item notice");
    return;
  }

  for (const [indexChirho, itemChirho] of attentionItemsChirho.entries()) {
    assertRawHebrewAttentionItemShapeChirho(itemChirho, indexChirho);
    const confidenceTextChirho = itemChirho.bestDirectConfidenceChirho === null ? "none" : itemChirho.bestDirectConfidenceChirho.toFixed(4);
    const witnessTextChirho = itemChirho.witnessCountChirho ?? "unknown";
    const lineContextChirho = markdownCodeSpanForCheckChirho(oneLineSnippetForCheckChirho(itemChirho.lineTextChirho, 180));
    assertMarkdownIncludesChirho(markdownChirho, `## ${itemChirho.idChirho}`, `${itemChirho.idChirho} heading`);
    assertMarkdownIncludesChirho(markdownChirho, `- Live review URL: ${itemChirho.reviewUrlChirho}`, `${itemChirho.idChirho} review URL`);
    assertMarkdownIncludesChirho(markdownChirho, `- Text: ${markdownCodeSpanForCheckChirho(itemChirho.textChirho)}`, `${itemChirho.idChirho} text`);
    assertMarkdownIncludesChirho(markdownChirho, `- Validation status: ${itemChirho.validationStatusChirho}`, `${itemChirho.idChirho} validation status`);
    assertMarkdownIncludesChirho(markdownChirho, `- Attention reason(s): ${itemChirho.reasonsChirho.join(", ")}`, `${itemChirho.idChirho} attention reasons`);
    assertMarkdownIncludesChirho(markdownChirho, `- Witness count: ${witnessTextChirho}`, `${itemChirho.idChirho} witness count`);
    assertMarkdownIncludesChirho(markdownChirho, `- Best direct CRNN confidence: ${confidenceTextChirho}`, `${itemChirho.idChirho} direct confidence`);
    assertMarkdownIncludesChirho(markdownChirho, `- Line context: ${lineContextChirho}`, `${itemChirho.idChirho} line context`);
  }
}

function parseRawQueueFromHtmlChirho(htmlChirho: string): RawHebrewQueueItemChirho[] {
  const startNeedleChirho = "const queueChirho = ";
  const startChirho = htmlChirho.indexOf(startNeedleChirho);
  assertGeneratedCheckChirho(startChirho >= 0, "raw Hebrew page does not embed queueChirho");
  const jsonStartChirho = startChirho + startNeedleChirho.length;
  const endChirho = htmlChirho.indexOf(";\n", jsonStartChirho);
  assertGeneratedCheckChirho(endChirho > jsonStartChirho, "raw Hebrew queueChirho terminator not found");
  const queueChirho = JSON.parse(htmlChirho.slice(jsonStartChirho, endChirho)) as RawHebrewQueueItemChirho[];
  assertGeneratedCheckChirho(Array.isArray(queueChirho), "raw Hebrew queueChirho is not an array");
  return queueChirho;
}

function assertRawFiltersChirho(urlChirho: URL, itemChirho: RawHebrewQueueItemChirho, keyChirho: string): void {
  const validationStatusChirho = urlChirho.searchParams.get("validation-status-chirho");
  if (validationStatusChirho !== null) {
    assertGeneratedCheckChirho(
      itemChirho.validationStatusChirho === validationStatusChirho,
      `${keyChirho} item ${itemChirho.keyChirho} does not match validation-status-chirho=${validationStatusChirho}`
    );
  }
  const tierChirho = urlChirho.searchParams.get("tier-chirho");
  if (tierChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.tierChirho === tierChirho, `${keyChirho} item ${itemChirho.keyChirho} does not match tier-chirho=${tierChirho}`);
  }
  const attentionChirho = urlChirho.searchParams.get("attention-chirho");
  if (attentionChirho !== null) {
    assertGeneratedCheckChirho(
      itemChirho.attentionKindsChirho.includes(attentionChirho),
      `${keyChirho} item ${itemChirho.keyChirho} does not match attention-chirho=${attentionChirho}`
    );
  }
  const preReviewNoteChirho = urlChirho.searchParams.get("pre-review-note-chirho");
  if (preReviewNoteChirho !== null) {
    const hasPreReviewNoteChirho = typeof itemChirho.preReviewNoteChirho === "string" && itemChirho.preReviewNoteChirho.length > 0;
    assertGeneratedCheckChirho(
      (preReviewNoteChirho === "with-note-chirho" && hasPreReviewNoteChirho) ||
        (preReviewNoteChirho === "without-note-chirho" && !hasPreReviewNoteChirho),
      `${keyChirho} item ${itemChirho.keyChirho} does not match pre-review-note-chirho=${preReviewNoteChirho}`
    );
  }
  const preReviewReasonChirho = urlChirho.searchParams.get("pre-review-reason-chirho");
  if (preReviewReasonChirho !== null) {
    assertGeneratedCheckChirho(
      preReviewReasonChirho === "missing-current-reason-chirho" &&
        Array.isArray(itemChirho.preReviewMissingAttentionKindsChirho) &&
        itemChirho.preReviewMissingAttentionKindsChirho.length > 0,
      `${keyChirho} item ${itemChirho.keyChirho} does not match pre-review-reason-chirho=${preReviewReasonChirho}`
    );
  }
  const volumeChirho = parseVolumeFilterChirho(urlChirho);
  if (volumeChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.volumeChirho === volumeChirho, `${keyChirho} item ${itemChirho.keyChirho} does not match volume ${volumeChirho}`);
  }
  const exactTextChirho = urlChirho.searchParams.get("exact-text-chirho");
  if (exactTextChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.liveSpanTextChirho === exactTextChirho, `${keyChirho} item ${itemChirho.keyChirho} does not match exact-text-chirho`);
  }
  const reviewStateChirho = urlChirho.searchParams.get("review-state-chirho");
  if (reviewStateChirho === "attribution-blocked-chirho" || reviewStateChirho === "attribution-rereview-chirho") {
    assertGeneratedCheckChirho(
      itemChirho.validationStatusChirho === "attribution-blocked-chirho",
      `${keyChirho} item ${itemChirho.keyChirho} is not attribution-blocked`
    );
    const attributionTextChirho = urlChirho.searchParams.get("attribution-text-chirho");
    if (attributionTextChirho !== null) {
      assertGeneratedCheckChirho(
        itemChirho.attributionTextStateChirho === attributionTextChirho,
        `${keyChirho} item ${itemChirho.keyChirho} does not match attribution-text-chirho=${attributionTextChirho}`
      );
    }
  }
}

function assertLatinFiltersChirho(urlChirho: URL, itemChirho: LatinSymbolItemChirho, keyChirho: string): void {
  const scriptChirho = urlChirho.searchParams.get("script-chirho");
  if (scriptChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.scriptChirho === scriptChirho, `${keyChirho} item ${itemChirho.idChirho} does not match script-chirho=${scriptChirho}`);
  }
  const symbolRiskChirho = urlChirho.searchParams.get("symbol-risk-chirho");
  if (symbolRiskChirho !== null) {
    assertGeneratedCheckChirho(
      itemChirho.symbolRiskChirho === symbolRiskChirho,
      `${keyChirho} item ${itemChirho.idChirho} does not match symbol-risk-chirho=${symbolRiskChirho}`
    );
  }
  const volumeChirho = parseVolumeFilterChirho(urlChirho);
  if (volumeChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.volumeChirho === volumeChirho, `${keyChirho} item ${itemChirho.idChirho} does not match volume ${volumeChirho}`);
  }
  const exactTextChirho = urlChirho.searchParams.get("exact-text-chirho");
  if (exactTextChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.textChirho === exactTextChirho, `${keyChirho} item ${itemChirho.idChirho} does not match exact-text-chirho`);
  }
}

function assertExpertFiltersChirho(urlChirho: URL, itemChirho: ExpertItemChirho, keyChirho: string): void {
  const scriptChirho = urlChirho.searchParams.get("script-chirho");
  if (scriptChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.scriptChirho === scriptChirho, `${keyChirho} item ${itemChirho.idChirho} does not match script-chirho=${scriptChirho}`);
  }
  const priorityChirho = urlChirho.searchParams.get("priority-chirho");
  if (priorityChirho !== null) {
    assertGeneratedCheckChirho(
      (priorityChirho === "priority-chirho" && itemChirho.priorityMatchChirho) ||
        (priorityChirho === "appendix-chirho" && !itemChirho.priorityMatchChirho),
      `${keyChirho} item ${itemChirho.idChirho} does not match priority-chirho=${priorityChirho}`
    );
  }
  const textStateChirho = urlChirho.searchParams.get("text-state-chirho");
  if (textStateChirho !== null) {
    assertGeneratedCheckChirho(
      (textStateChirho === "blank-chirho" && itemChirho.currentTextChirho.length === 0) ||
        (textStateChirho === "nonblank-chirho" && itemChirho.currentTextChirho.length > 0),
      `${keyChirho} item ${itemChirho.idChirho} does not match text-state-chirho=${textStateChirho}`
    );
  }
  const sourceChirho = urlChirho.searchParams.get("source-chirho");
  if (sourceChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.visionSourceChirho === sourceChirho, `${keyChirho} item ${itemChirho.idChirho} does not match source-chirho=${sourceChirho}`);
  }
  const exactTextChirho = urlChirho.searchParams.get("exact-text-chirho");
  if (exactTextChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.currentTextChirho === exactTextChirho, `${keyChirho} item ${itemChirho.idChirho} does not match exact-text-chirho`);
  }
  const volumeChirho = parseVolumeFilterChirho(urlChirho);
  if (volumeChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.volumeChirho === volumeChirho, `${keyChirho} item ${itemChirho.idChirho} does not match volume ${volumeChirho}`);
  }
}

async function checkRawLinkChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  const itemIdChirho = parseItemIdChirho(urlChirho, keyChirho);
  const htmlChirho = await fetchTextChirho(urlChirho.toString());
  assertReviewPageHtmlChirho(keyChirho, urlChirho, htmlChirho);
  const queueChirho = parseRawQueueFromHtmlChirho(htmlChirho);
  const itemChirho = queueChirho.find((candidateChirho) => candidateChirho.keyChirho === itemIdChirho);
  assertGeneratedCheckChirho(itemChirho !== undefined, `${keyChirho} item ${itemIdChirho} is not present in raw Hebrew queue`);
  assertRawFiltersChirho(urlChirho, itemChirho, keyChirho);
}

async function checkLatinLinkChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  const itemIdChirho = parseItemIdChirho(urlChirho, keyChirho);
  const htmlChirho = await fetchTextChirho(urlChirho.toString());
  assertReviewPageHtmlChirho(keyChirho, urlChirho, htmlChirho);
  const stateChirho = await fetchJsonChirho<StateResponseChirho<LatinSymbolItemChirho>>(`${urlChirho.origin}/api-chirho/state-chirho`);
  assertGeneratedCheckChirho(stateChirho.okChirho === true && Array.isArray(stateChirho.itemsChirho), `${keyChirho} Latin/symbol state response is invalid`);
  const itemChirho = stateChirho.itemsChirho.find((candidateChirho) => candidateChirho.idChirho === itemIdChirho);
  assertGeneratedCheckChirho(itemChirho !== undefined, `${keyChirho} item ${itemIdChirho} is not present in Latin/symbol state`);
  assertLatinFiltersChirho(urlChirho, itemChirho, keyChirho);
}

async function checkExpertLinkChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  const itemIdChirho = parseItemIdChirho(urlChirho, keyChirho);
  const htmlChirho = await fetchTextChirho(urlChirho.toString());
  assertReviewPageHtmlChirho(keyChirho, urlChirho, htmlChirho);
  const stateChirho = await fetchJsonChirho<StateResponseChirho<ExpertItemChirho>>(`${urlChirho.origin}/api-chirho/state-chirho`);
  assertGeneratedCheckChirho(stateChirho.okChirho === true && Array.isArray(stateChirho.itemsChirho), `${keyChirho} expert state response is invalid`);
  const itemChirho = stateChirho.itemsChirho.find((candidateChirho) => candidateChirho.idChirho === itemIdChirho);
  assertGeneratedCheckChirho(itemChirho !== undefined, `${keyChirho} item ${itemIdChirho} is not present in expert state`);
  assertExpertFiltersChirho(urlChirho, itemChirho, keyChirho);
}

async function checkReviewItemUrlChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  assertBaseReviewUrlChirho(urlChirho, keyChirho);
  assertReviewQueryValuesChirho(urlChirho, keyChirho);
  if (urlChirho.port === "8766") {
    await checkRawLinkChirho(keyChirho, urlChirho);
  } else if (urlChirho.port === "8770") {
    await checkLatinLinkChirho(keyChirho, urlChirho);
  } else if (urlChirho.port === "8771") {
    await checkExpertLinkChirho(keyChirho, urlChirho);
  } else {
    throw new Error(`${keyChirho} targets unsupported review port ${urlChirho.port}`);
  }
}

async function checkReviewLandingUrlChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  assertBaseReviewUrlChirho(urlChirho, keyChirho);
  assertReviewQueryValuesChirho(urlChirho, keyChirho);
  const htmlChirho = await fetchTextChirho(urlChirho.toString());
  assertReviewPageHtmlChirho(keyChirho, urlChirho, htmlChirho);
}

async function checkReviewLinkChirho(keyChirho: string, linkChirho: string): Promise<void> {
  const urlChirho = new URL(linkChirho);
  await checkReviewItemUrlChirho(keyChirho, urlChirho);
}

function markdownReviewLinksChirho(markdownChirho: string): string[] {
  const linksChirho: string[] = [];
  for (const matchChirho of markdownChirho.matchAll(MARKDOWN_REVIEW_URL_RE_CHIRHO)) {
    const linkChirho = matchChirho[0].replace(/[.,;]+$/u, "");
    linksChirho.push(linkChirho);
  }
  return linksChirho;
}

async function mainChirho(): Promise<void> {
  assertGeneratedCheckChirho(existsSync(STATUS_JSON_PATH_CHIRHO), `missing status JSON: ${STATUS_JSON_PATH_CHIRHO}`);
  assertGeneratedCheckChirho(existsSync(STATUS_MARKDOWN_PATH_CHIRHO), `missing status Markdown: ${STATUS_MARKDOWN_PATH_CHIRHO}`);
  assertGeneratedCheckChirho(
    existsSync(EXPERT_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO),
    `missing expert repeat-cluster Markdown: ${EXPERT_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO}`
  );
  assertGeneratedCheckChirho(
    existsSync(LATIN_SYMBOL_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO),
    `missing Latin/symbol repeat-cluster Markdown: ${LATIN_SYMBOL_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO}`
  );
  assertGeneratedCheckChirho(
    existsSync(RAW_HEBREW_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO),
    `missing raw Hebrew repeat-cluster Markdown: ${RAW_HEBREW_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO}`
  );
  assertGeneratedCheckChirho(
    existsSync(ATTRIBUTION_CLEANUP_HANDOFF_MARKDOWN_PATH_CHIRHO),
    `missing attribution cleanup handoff Markdown: ${ATTRIBUTION_CLEANUP_HANDOFF_MARKDOWN_PATH_CHIRHO}`
  );
  assertGeneratedCheckChirho(
    existsSync(RAW_HEBREW_ATTENTION_HANDOFF_MARKDOWN_PATH_CHIRHO),
    `missing raw Hebrew attention handoff Markdown: ${RAW_HEBREW_ATTENTION_HANDOFF_MARKDOWN_PATH_CHIRHO}`
  );
  const statusChirho = JSON.parse(readFileSync(STATUS_JSON_PATH_CHIRHO, "utf8")) as CertificationStatusChirho;
  const markdownChirho = readFileSync(STATUS_MARKDOWN_PATH_CHIRHO, "utf8");
  const expertRepeatMarkdownChirho = readFileSync(EXPERT_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO, "utf8");
  const latinSymbolRepeatMarkdownChirho = readFileSync(LATIN_SYMBOL_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO, "utf8");
  const rawHebrewRepeatMarkdownChirho = readFileSync(RAW_HEBREW_REPEAT_CLUSTER_MARKDOWN_PATH_CHIRHO, "utf8");
  const attributionCleanupMarkdownChirho = readFileSync(ATTRIBUTION_CLEANUP_HANDOFF_MARKDOWN_PATH_CHIRHO, "utf8");
  const rawHebrewAttentionMarkdownChirho = readFileSync(RAW_HEBREW_ATTENTION_HANDOFF_MARKDOWN_PATH_CHIRHO, "utf8");
  assertGeneratedCheckChirho(
    statusChirho.reviewStartLinksChirho !== undefined && typeof statusChirho.reviewStartLinksChirho === "object",
    "status JSON missing reviewStartLinksChirho object"
  );
  assertGeneratedCheckChirho(
    statusChirho.humanValidationDbChirho !== undefined &&
      typeof statusChirho.humanValidationDbChirho === "object" &&
      typeof statusChirho.humanValidationDbChirho.genericReviewerRowsChirho === "number",
    "status JSON missing humanValidationDbChirho.genericReviewerRowsChirho number"
  );
  assertGeneratedCheckChirho(
    statusChirho.rawHebrewChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho === "object" &&
      statusChirho.rawHebrewChirho.triageChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho.triageChirho === "object" &&
      typeof statusChirho.rawHebrewChirho.triageChirho.attentionItemCountChirho === "number",
    "status JSON missing rawHebrewChirho.triageChirho.attentionItemCountChirho number"
  );
  assertGeneratedCheckChirho(
    statusChirho.rawHebrewChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho === "object" &&
      statusChirho.rawHebrewChirho.repeatSummaryChirho !== undefined &&
      typeof statusChirho.rawHebrewChirho.repeatSummaryChirho === "object" &&
      typeof statusChirho.rawHebrewChirho.repeatSummaryChirho.duplicateTextGroupCountChirho === "number",
    "status JSON missing rawHebrewChirho.repeatSummaryChirho.duplicateTextGroupCountChirho number"
  );
  assertGeneratedCheckChirho(
    statusChirho.latinSymbolVisionChirho !== undefined &&
      typeof statusChirho.latinSymbolVisionChirho === "object" &&
      statusChirho.latinSymbolVisionChirho.repeatSummaryChirho !== undefined &&
      typeof statusChirho.latinSymbolVisionChirho.repeatSummaryChirho === "object" &&
      typeof statusChirho.latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextGroupCountChirho === "number",
    "status JSON missing latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextGroupCountChirho number"
  );
  assertAttributionCleanupHandoffMatchesStatusChirho(statusChirho, attributionCleanupMarkdownChirho);
  assertRawHebrewAttentionHandoffMatchesStatusChirho(statusChirho, rawHebrewAttentionMarkdownChirho);
  assertRawHebrewRepeatHandoffMatchesStatusChirho(statusChirho, rawHebrewRepeatMarkdownChirho);
  assertLatinSymbolRepeatHandoffMatchesStatusChirho(statusChirho, latinSymbolRepeatMarkdownChirho);
  assertExpertRepeatHandoffMatchesStatusChirho(statusChirho, expertRepeatMarkdownChirho);
  const checkedLinksChirho = new Set<string>();
  let jsonCheckedCountChirho = 0;
  for (const [keyChirho, linkChirho] of Object.entries(statusChirho.reviewStartLinksChirho)) {
    if (linkChirho === null) continue;
    await checkReviewLinkChirho(keyChirho, linkChirho);
    checkedLinksChirho.add(new URL(linkChirho).toString());
    jsonCheckedCountChirho += 1;
  }
  assertGeneratedCheckChirho(jsonCheckedCountChirho > 0, "status JSON contains no live review links to check");

  let markdownCheckedCountChirho = 0;
  for (const linkChirho of markdownReviewLinksChirho(markdownChirho)) {
    const urlChirho = new URL(linkChirho);
    assertBaseReviewUrlChirho(urlChirho, `Markdown review URL ${markdownCheckedCountChirho + 1}`);
    const canonicalLinkChirho = urlChirho.toString();
    if (checkedLinksChirho.has(canonicalLinkChirho)) continue;
    const keyChirho = `Markdown review URL ${markdownCheckedCountChirho + 1}`;
    if (urlChirho.searchParams.has("item-chirho")) {
      await checkReviewItemUrlChirho(keyChirho, urlChirho);
    } else {
      await checkReviewLandingUrlChirho(keyChirho, urlChirho);
    }
    checkedLinksChirho.add(canonicalLinkChirho);
    markdownCheckedCountChirho += 1;
  }
  assertGeneratedCheckChirho(markdownCheckedCountChirho > 0, "status Markdown contains no additional live review URLs to check");
  let expertRepeatCheckedCountChirho = 0;
  for (const linkChirho of markdownReviewLinksChirho(expertRepeatMarkdownChirho)) {
    const urlChirho = new URL(linkChirho);
    assertBaseReviewUrlChirho(urlChirho, `Expert repeat-cluster URL ${expertRepeatCheckedCountChirho + 1}`);
    const canonicalLinkChirho = urlChirho.toString();
    if (checkedLinksChirho.has(canonicalLinkChirho)) continue;
    await checkReviewItemUrlChirho(`Expert repeat-cluster URL ${expertRepeatCheckedCountChirho + 1}`, urlChirho);
    checkedLinksChirho.add(canonicalLinkChirho);
    expertRepeatCheckedCountChirho += 1;
  }
  assertGeneratedCheckChirho(expertRepeatCheckedCountChirho > 0, "expert repeat-cluster Markdown contains no additional live review URLs to check");
  const latinSymbolRepeatLinksChirho = markdownReviewLinksChirho(latinSymbolRepeatMarkdownChirho);
  let latinSymbolRepeatCheckedCountChirho = 0;
  let latinSymbolRepeatTotalCountChirho = 0;
  for (const linkChirho of latinSymbolRepeatLinksChirho) {
    latinSymbolRepeatTotalCountChirho += 1;
    const urlChirho = new URL(linkChirho);
    assertBaseReviewUrlChirho(urlChirho, `Latin/symbol repeat-cluster URL ${latinSymbolRepeatTotalCountChirho}`);
    const canonicalLinkChirho = urlChirho.toString();
    if (checkedLinksChirho.has(canonicalLinkChirho)) continue;
    await checkReviewItemUrlChirho(`Latin/symbol repeat-cluster URL ${latinSymbolRepeatTotalCountChirho}`, urlChirho);
    checkedLinksChirho.add(canonicalLinkChirho);
    latinSymbolRepeatCheckedCountChirho += 1;
  }
  const latinSymbolRepeatGroupCountChirho = statusChirho.latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextGroupCountChirho;
  if (latinSymbolRepeatGroupCountChirho > 0) {
    assertGeneratedCheckChirho(
      latinSymbolRepeatTotalCountChirho > 0,
      "Latin/symbol repeat-cluster Markdown contains no live review URLs while duplicate groups remain"
    );
  } else {
    assertGeneratedCheckChirho(
      latinSymbolRepeatTotalCountChirho === 0,
      "Latin/symbol repeat-cluster Markdown still contains review URLs after duplicate groups reached zero"
    );
  }
  const rawHebrewRepeatLinksChirho = markdownReviewLinksChirho(rawHebrewRepeatMarkdownChirho);
  let rawHebrewRepeatCheckedCountChirho = 0;
  let rawHebrewRepeatTotalCountChirho = 0;
  for (const linkChirho of rawHebrewRepeatLinksChirho) {
    rawHebrewRepeatTotalCountChirho += 1;
    const urlChirho = new URL(linkChirho);
    assertBaseReviewUrlChirho(urlChirho, `Raw Hebrew repeat-cluster URL ${rawHebrewRepeatTotalCountChirho}`);
    const canonicalLinkChirho = urlChirho.toString();
    if (checkedLinksChirho.has(canonicalLinkChirho)) continue;
    await checkReviewItemUrlChirho(`Raw Hebrew repeat-cluster URL ${rawHebrewRepeatTotalCountChirho}`, urlChirho);
    checkedLinksChirho.add(canonicalLinkChirho);
    rawHebrewRepeatCheckedCountChirho += 1;
  }
  const rawHebrewRepeatGroupCountChirho = statusChirho.rawHebrewChirho.repeatSummaryChirho.duplicateTextGroupCountChirho;
  if (rawHebrewRepeatGroupCountChirho > 0) {
    assertGeneratedCheckChirho(
      rawHebrewRepeatTotalCountChirho > 0,
      "raw Hebrew repeat-cluster Markdown contains no live review URLs while duplicate groups remain"
    );
  } else {
    assertGeneratedCheckChirho(
      rawHebrewRepeatTotalCountChirho === 0,
      "raw Hebrew repeat-cluster Markdown still contains review URLs after duplicate groups reached zero"
    );
  }
  const attributionCleanupLinksChirho = markdownReviewLinksChirho(attributionCleanupMarkdownChirho);
  let attributionCleanupCheckedCountChirho = 0;
  let attributionCleanupTotalCountChirho = 0;
  for (const linkChirho of attributionCleanupLinksChirho) {
    attributionCleanupTotalCountChirho += 1;
    const urlChirho = new URL(linkChirho);
    assertBaseReviewUrlChirho(urlChirho, `Attribution cleanup URL ${attributionCleanupTotalCountChirho}`);
    const canonicalLinkChirho = urlChirho.toString();
    if (checkedLinksChirho.has(canonicalLinkChirho)) continue;
    await checkReviewItemUrlChirho(`Attribution cleanup URL ${attributionCleanupTotalCountChirho}`, urlChirho);
    checkedLinksChirho.add(canonicalLinkChirho);
    attributionCleanupCheckedCountChirho += 1;
  }
  const attributionBlockedRowsChirho = statusChirho.humanValidationDbChirho.genericReviewerRowsChirho;
  if (attributionBlockedRowsChirho > 0) {
    assertGeneratedCheckChirho(
      attributionCleanupTotalCountChirho > 0,
      "attribution cleanup handoff Markdown contains no live review URLs while attribution-blocked rows remain"
    );
  } else {
    assertGeneratedCheckChirho(
      attributionCleanupTotalCountChirho === 0,
      "attribution cleanup handoff Markdown still contains review URLs after attribution-blocked rows reached zero"
    );
  }
  const rawHebrewAttentionLinksChirho = markdownReviewLinksChirho(rawHebrewAttentionMarkdownChirho);
  let rawHebrewAttentionCheckedCountChirho = 0;
  let rawHebrewAttentionTotalCountChirho = 0;
  for (const linkChirho of rawHebrewAttentionLinksChirho) {
    rawHebrewAttentionTotalCountChirho += 1;
    const urlChirho = new URL(linkChirho);
    assertBaseReviewUrlChirho(urlChirho, `Raw Hebrew attention URL ${rawHebrewAttentionTotalCountChirho}`);
    const canonicalLinkChirho = urlChirho.toString();
    if (checkedLinksChirho.has(canonicalLinkChirho)) continue;
    if (urlChirho.searchParams.has("item-chirho")) {
      await checkReviewItemUrlChirho(`Raw Hebrew attention URL ${rawHebrewAttentionTotalCountChirho}`, urlChirho);
    } else {
      await checkReviewLandingUrlChirho(`Raw Hebrew attention URL ${rawHebrewAttentionTotalCountChirho}`, urlChirho);
    }
    checkedLinksChirho.add(canonicalLinkChirho);
    rawHebrewAttentionCheckedCountChirho += 1;
  }
  const rawHebrewAttentionItemCountChirho = statusChirho.rawHebrewChirho.triageChirho.attentionItemCountChirho;
  if (rawHebrewAttentionItemCountChirho > 0) {
    assertGeneratedCheckChirho(
      rawHebrewAttentionTotalCountChirho > 0,
      "raw Hebrew attention handoff Markdown contains no live review URLs while attention items remain"
    );
  } else {
    assertGeneratedCheckChirho(
      rawHebrewAttentionTotalCountChirho === 0,
      "raw Hebrew attention handoff Markdown still contains review URLs after attention items reached zero"
    );
  }
  console.log(
    `[${MODULE_CHIRHO}] live status review links passed for ${jsonCheckedCountChirho} JSON link(s), ` +
      `${markdownCheckedCountChirho} additional Markdown URL(s), and ` +
      `${expertRepeatCheckedCountChirho} expert repeat-cluster URL(s), ` +
      `${latinSymbolRepeatCheckedCountChirho}/${latinSymbolRepeatTotalCountChirho} Latin/symbol repeat-cluster URL(s), and ` +
      `${rawHebrewRepeatCheckedCountChirho}/${rawHebrewRepeatTotalCountChirho} raw Hebrew repeat-cluster URL(s), and ` +
      `${attributionCleanupCheckedCountChirho}/${attributionCleanupTotalCountChirho} attribution cleanup URL(s), and ` +
      `${rawHebrewAttentionCheckedCountChirho}/${rawHebrewAttentionTotalCountChirho} raw Hebrew attention URL(s)`
  );
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
