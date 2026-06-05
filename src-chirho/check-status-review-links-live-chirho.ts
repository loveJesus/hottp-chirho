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
  "multi-token-chirho",
  "delimiter-notation-chirho",
  "no-direct-read-chirho",
]);
const RAW_PRE_REVIEW_NOTE_FILTERS_CHIRHO = new Set([
  "with-note-chirho",
  "without-note-chirho",
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
  rawHebrewChirho?: {
    triageChirho?: {
      attentionItemCountChirho?: number;
    };
  };
  humanValidationDbChirho?: {
    genericReviewerRowsChirho?: number;
  };
  latinSymbolVisionChirho?: {
    repeatSummaryChirho?: {
      duplicateTextGroupCountChirho?: number;
    };
  };
}

interface RawHebrewQueueItemChirho {
  keyChirho: string;
  validationStatusChirho: string;
  tierChirho: string;
  attentionKindsChirho: string[];
  preReviewNoteChirho?: string | null;
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
      "volume-chirho",
      "review-state-chirho",
    ])
  );
  assertParamInSetChirho(urlChirho, keyChirho, "review-state-chirho", RAW_REVIEW_STATES_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "validation-status-chirho", RAW_VALIDATION_STATUSES_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "tier-chirho", RAW_REVIEW_TIERS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "attention-chirho", RAW_ATTENTION_KINDS_CHIRHO);
  assertParamInSetChirho(urlChirho, keyChirho, "pre-review-note-chirho", RAW_PRE_REVIEW_NOTE_FILTERS_CHIRHO);
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
  const volumeChirho = parseVolumeFilterChirho(urlChirho);
  if (volumeChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.volumeChirho === volumeChirho, `${keyChirho} item ${itemChirho.keyChirho} does not match volume ${volumeChirho}`);
  }
  const reviewStateChirho = urlChirho.searchParams.get("review-state-chirho");
  if (reviewStateChirho === "attribution-blocked-chirho" || reviewStateChirho === "attribution-rereview-chirho") {
    assertGeneratedCheckChirho(
      itemChirho.validationStatusChirho === "attribution-blocked-chirho",
      `${keyChirho} item ${itemChirho.keyChirho} is not attribution-blocked`
    );
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
    statusChirho.latinSymbolVisionChirho !== undefined &&
      typeof statusChirho.latinSymbolVisionChirho === "object" &&
      statusChirho.latinSymbolVisionChirho.repeatSummaryChirho !== undefined &&
      typeof statusChirho.latinSymbolVisionChirho.repeatSummaryChirho === "object" &&
      typeof statusChirho.latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextGroupCountChirho === "number",
    "status JSON missing latinSymbolVisionChirho.repeatSummaryChirho.duplicateTextGroupCountChirho number"
  );
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
