// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify status review-start deep links against the running review stations.
 *
 * This is intentionally server-dependent and should run after review server
 * health checks. It proves the generated handoff URLs point to live queue
 * items and that their query filters include those items.
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
const FETCH_TIMEOUT_MS_CHIRHO = 5000;
const REVIEW_SERVER_PORTS_CHIRHO = new Set([8766, 8770, 8771]);

interface CertificationStatusChirho {
  reviewStartLinksChirho?: Record<string, string | null>;
}

interface RawHebrewQueueItemChirho {
  keyChirho: string;
  validationStatusChirho: string;
  tierChirho: string;
  attentionKindsChirho: string[];
  volumeChirho: number;
}

interface LatinSymbolItemChirho {
  idChirho: string;
  scriptChirho: string;
  symbolRiskChirho?: string;
  volumeChirho: number;
}

interface ExpertItemChirho {
  idChirho: string;
  scriptChirho: string;
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
  const volumeChirho = parseVolumeFilterChirho(urlChirho);
  if (volumeChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.volumeChirho === volumeChirho, `${keyChirho} item ${itemChirho.keyChirho} does not match volume ${volumeChirho}`);
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
  const volumeChirho = parseVolumeFilterChirho(urlChirho);
  if (volumeChirho !== null) {
    assertGeneratedCheckChirho(itemChirho.volumeChirho === volumeChirho, `${keyChirho} item ${itemChirho.idChirho} does not match volume ${volumeChirho}`);
  }
}

async function checkRawLinkChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  const itemIdChirho = parseItemIdChirho(urlChirho, keyChirho);
  const htmlChirho = await fetchTextChirho(urlChirho.toString());
  assertGeneratedCheckChirho(htmlChirho.includes("Pass C Hebrew Validation Chirho"), `${keyChirho} did not load the raw Hebrew reviewer page`);
  const queueChirho = parseRawQueueFromHtmlChirho(htmlChirho);
  const itemChirho = queueChirho.find((candidateChirho) => candidateChirho.keyChirho === itemIdChirho);
  assertGeneratedCheckChirho(itemChirho !== undefined, `${keyChirho} item ${itemIdChirho} is not present in raw Hebrew queue`);
  assertRawFiltersChirho(urlChirho, itemChirho, keyChirho);
}

async function checkLatinLinkChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  const itemIdChirho = parseItemIdChirho(urlChirho, keyChirho);
  const htmlChirho = await fetchTextChirho(urlChirho.toString());
  assertGeneratedCheckChirho(htmlChirho.includes("Latin/Symbol Vision Review Chirho"), `${keyChirho} did not load the Latin/symbol reviewer page`);
  const stateChirho = await fetchJsonChirho<StateResponseChirho<LatinSymbolItemChirho>>(`${urlChirho.origin}/api-chirho/state-chirho`);
  assertGeneratedCheckChirho(stateChirho.okChirho === true && Array.isArray(stateChirho.itemsChirho), `${keyChirho} Latin/symbol state response is invalid`);
  const itemChirho = stateChirho.itemsChirho.find((candidateChirho) => candidateChirho.idChirho === itemIdChirho);
  assertGeneratedCheckChirho(itemChirho !== undefined, `${keyChirho} item ${itemIdChirho} is not present in Latin/symbol state`);
  assertLatinFiltersChirho(urlChirho, itemChirho, keyChirho);
}

async function checkExpertLinkChirho(keyChirho: string, urlChirho: URL): Promise<void> {
  const itemIdChirho = parseItemIdChirho(urlChirho, keyChirho);
  const htmlChirho = await fetchTextChirho(urlChirho.toString());
  assertGeneratedCheckChirho(htmlChirho.includes("Vision-Tier Expert Review Chirho"), `${keyChirho} did not load the expert reviewer page`);
  const stateChirho = await fetchJsonChirho<StateResponseChirho<ExpertItemChirho>>(`${urlChirho.origin}/api-chirho/state-chirho`);
  assertGeneratedCheckChirho(stateChirho.okChirho === true && Array.isArray(stateChirho.itemsChirho), `${keyChirho} expert state response is invalid`);
  const itemChirho = stateChirho.itemsChirho.find((candidateChirho) => candidateChirho.idChirho === itemIdChirho);
  assertGeneratedCheckChirho(itemChirho !== undefined, `${keyChirho} item ${itemIdChirho} is not present in expert state`);
  assertExpertFiltersChirho(urlChirho, itemChirho, keyChirho);
}

async function checkReviewLinkChirho(keyChirho: string, linkChirho: string): Promise<void> {
  const urlChirho = new URL(linkChirho);
  assertBaseReviewUrlChirho(urlChirho, keyChirho);
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

async function mainChirho(): Promise<void> {
  assertGeneratedCheckChirho(existsSync(STATUS_JSON_PATH_CHIRHO), `missing status JSON: ${STATUS_JSON_PATH_CHIRHO}`);
  const statusChirho = JSON.parse(readFileSync(STATUS_JSON_PATH_CHIRHO, "utf8")) as CertificationStatusChirho;
  assertGeneratedCheckChirho(
    statusChirho.reviewStartLinksChirho !== undefined && typeof statusChirho.reviewStartLinksChirho === "object",
    "status JSON missing reviewStartLinksChirho object"
  );
  let checkedCountChirho = 0;
  for (const [keyChirho, linkChirho] of Object.entries(statusChirho.reviewStartLinksChirho)) {
    if (linkChirho === null) continue;
    await checkReviewLinkChirho(keyChirho, linkChirho);
    checkedCountChirho += 1;
  }
  assertGeneratedCheckChirho(checkedCountChirho > 0, "status JSON contains no live review links to check");
  console.log(`[${MODULE_CHIRHO}] live status review links passed for ${checkedCountChirho} link(s)`);
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
