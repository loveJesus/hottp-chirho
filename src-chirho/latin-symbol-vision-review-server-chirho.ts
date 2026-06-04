// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Browser review UI for Latin/symbol vision-tier decisions.
 *
 * A clean Continue requires the explicit clean-acceptance checkbox and records
 * accepted-clean-chirho. Continue with issue flags records
 * reviewed-issues-chirho and keeps the item pending.
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { resolve } from "path";

import { PROGRESS_DB_PATH_CHIRHO } from "./config-chirho.ts";
import {
  LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO,
  readLatinSymbolAcceptancePolicyFileChirho,
  summarizeLatinSymbolAcceptancePolicyChirho,
} from "./latin-symbol-vision-acceptance-policy-chirho.ts";
import {
  latinSymbolVisionLiveItemsChirho,
  symbolRiskForItemChirho,
  type LatinSymbolVisionLiveItemChirho,
  type LatinSymbolVisionSymbolRiskChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import {
  assertLatinSymbolManifestMatchesLiveChirho,
  acceptedCleanLatinSymbolReviewIdsChirho,
  ensureLatinSymbolReviewSchemaChirho,
  LATIN_SYMBOL_PACK_DIR_CHIRHO,
  LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO,
  loadLatinSymbolPacketManifestChirho,
  parseLatinSymbolIssueFlagsChirho,
  publicLatinSymbolReviewRowsChirho,
  reviewedIssueLatinSymbolReviewIdsChirho,
  saveLatinSymbolReviewChirho,
  verdictForLatinSymbolIssueFlagsChirho,
  writeLatinSymbolReviewBackupChirho,
  type LatinSymbolPacketItemChirho,
  type LatinSymbolPacketManifestChirho,
} from "./latin-symbol-vision-review-store-chirho.ts";
import {
  certifyingReviewerAttributionErrorChirho,
  explicitReviewerAttributionErrorChirho,
  GENERIC_REVIEWER_IDS_CHIRHO,
} from "./reviewer-attribution-chirho.ts";

const MODULE_CHIRHO = "latin-symbol-vision-review-server-chirho";
const DEFAULT_PORT_CHIRHO = 8770;
const SYMBOL_RISK_OPTIONS_CHIRHO = [
  { valueChirho: "all-chirho", labelChirho: "All risk classes" },
  { valueChirho: "trivial-punctuation-chirho", labelChirho: "Trivial punctuation" },
  { valueChirho: "script-or-siglum-symbol-chirho", labelChirho: "Script/siglum symbol" },
  { valueChirho: "nontrivial-symbol-chirho", labelChirho: "Nontrivial symbol" },
  { valueChirho: "not-symbol-chirho", labelChirho: "Not symbol" },
] as const;
const ISSUE_FLAG_OPTIONS_CHIRHO = [
  { valueChirho: "letters-chirho", labelChirho: "Letters", helpChirho: "Wrong base letters, digits, witness sigla, or codepoint choice." },
  { valueChirho: "punctuation-chirho", labelChirho: "Punctuation", helpChirho: "Wrong comma, period, bracket, operator, quote, or apparatus punctuation." },
  { valueChirho: "spacing-chirho", labelChirho: "Spacing", helpChirho: "Missing or extra space between words, references, sigla, or operators." },
  { valueChirho: "wrong-script-chirho", labelChirho: "Wrong script", helpChirho: "The item belongs in a different script lane." },
  { valueChirho: "segmentation-chirho", labelChirho: "Segmentation", helpChirho: "Wrong split/merge/box: multiple items lumped, one item split, or wrong crop." },
  { valueChirho: "garbled-text-chirho", labelChirho: "Garbled text", helpChirho: "The stored text is unreadable or not what the print shows." },
  { valueChirho: "missing-text-chirho", labelChirho: "Missing text", helpChirho: "Printed text or symbol is absent from the stored item." },
  { valueChirho: "extra-text-chirho", labelChirho: "Extra text", helpChirho: "Stored text includes pixels that are not part of this item." },
  { valueChirho: "wrong-language-chirho", labelChirho: "Wrong language", helpChirho: "The script is plausible, but the language/category is wrong for this review lane." },
];

interface ReviewRequestChirho {
  idChirho?: string;
  issueFlagsChirho?: unknown;
  notesChirho?: string;
  reviewerChirho?: string;
  acceptCleanChirho?: unknown;
  expectedItemKindChirho?: string;
  expectedScriptChirho?: string;
  expectedSourceChirho?: string;
  expectedTextChirho?: string;
  expectedLineTextChirho?: string;
  expectedSourceImageHashChirho?: string;
  expectedTargetImageHashChirho?: string;
  expectedLineImageHashChirho?: string;
  expectedTargetMarkdownPathChirho?: string;
  expectedLineMarkdownPathChirho?: string;
}

interface LatinSymbolReviewItemChirho extends LatinSymbolPacketItemChirho {
  symbolRiskChirho: LatinSymbolVisionSymbolRiskChirho;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  const matchedArgChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  if (matchedArgChirho === undefined) return undefined;
  const valueChirho = matchedArgChirho.slice(prefixChirho.length);
  if (valueChirho.length === 0) throw new Error(`--${nameChirho} must not be empty`);
  return valueChirho;
}

function parsePortChirho(argsChirho: string[]): number {
  const valueChirho = parseArgValueChirho(argsChirho, "port");
  if (valueChirho === undefined) return DEFAULT_PORT_CHIRHO;
  const portChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(portChirho) || portChirho <= 0) throw new Error(`port must be positive; got ${valueChirho}`);
  return portChirho;
}

function scriptJsonChirho(valueChirho: unknown): string {
  return JSON.stringify(valueChirho)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function safeAssetPathChirho(relativePathChirho: string): string | null {
  const resolvedChirho = resolve(LATIN_SYMBOL_PACK_DIR_CHIRHO, relativePathChirho);
  const packRootChirho = resolve(LATIN_SYMBOL_PACK_DIR_CHIRHO);
  if (resolvedChirho !== packRootChirho && !resolvedChirho.startsWith(`${packRootChirho}/`)) return null;
  return resolvedChirho;
}

function jsonResponseChirho(dataChirho: unknown, statusChirho = 200): Response {
  return new Response(JSON.stringify(dataChirho), {
    status: statusChirho,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function reviewItemsForManifestChirho(manifestChirho: LatinSymbolPacketManifestChirho): LatinSymbolReviewItemChirho[] {
  return (manifestChirho.itemsChirho ?? []).map((itemChirho) => ({
    ...itemChirho,
    symbolRiskChirho: symbolRiskForItemChirho(itemChirho),
  }));
}

function staleDisplayMismatchChirho(
  requestChirho: ReviewRequestChirho,
  packetItemChirho: LatinSymbolPacketItemChirho
): string | null {
  const comparisonsChirho = [
    ["expectedItemKindChirho", packetItemChirho.itemKindChirho],
    ["expectedScriptChirho", packetItemChirho.scriptChirho],
    ["expectedSourceChirho", packetItemChirho.sourceChirho],
    ["expectedTextChirho", packetItemChirho.textChirho],
    ["expectedLineTextChirho", packetItemChirho.lineTextChirho],
    ["expectedSourceImageHashChirho", packetItemChirho.sourceImageHashChirho],
    ["expectedTargetImageHashChirho", packetItemChirho.targetImageHashChirho],
    ["expectedLineImageHashChirho", packetItemChirho.lineImageHashChirho],
    ["expectedTargetMarkdownPathChirho", packetItemChirho.targetMarkdownPathChirho],
    ["expectedLineMarkdownPathChirho", packetItemChirho.lineMarkdownPathChirho],
  ] as const;
  for (const [fieldChirho, currentValueChirho] of comparisonsChirho) {
    const submittedValueChirho = requestChirho[fieldChirho];
    if (typeof submittedValueChirho !== "string") return `${fieldChirho} is missing`;
    if (submittedValueChirho !== currentValueChirho) return `${fieldChirho} no longer matches current packet`;
  }
  return null;
}

function htmlChirho(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Latin/Symbol Vision Review Chirho</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f5f5f2; color: #1f2933; }
    button, textarea, select, input { font: inherit; }
    .shell-chirho { max-width: 1240px; margin: 0 auto; padding: 18px; }
    .top-chirho { display: flex; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid #d8d4c8; padding-bottom: 12px; }
    .title-chirho { font-size: 20px; font-weight: 750; }
    .summary-chirho, .status-chirho { color: #59636f; font-size: 13px; }
    .toolbar-chirho { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .toolbar-chirho select, .toolbar-chirho button { border: 1px solid #aab1b9; background: white; min-height: 34px; padding: 5px 8px; }
    .main-chirho { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 18px; padding-top: 18px; }
    .panel-chirho { min-width: 0; }
    .image-label-chirho { color: #59636f; font-size: 13px; font-weight: 650; margin: 0 0 6px; }
    .image-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: auto; margin-bottom: 12px; }
    .target-image-chirho { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
    .line-image-chirho { display: block; max-width: none; width: 1400px; height: auto; image-rendering: -webkit-optimize-contrast; }
    .text-box-chirho { background: white; border: 1px solid #d6d9dd; padding: 10px; line-height: 1.45; overflow-wrap: anywhere; }
    .current-text-chirho { font-size: 22px; }
    .line-text-chirho { font-size: 16px; }
    .side-chirho { display: flex; flex-direction: column; gap: 12px; }
    .box-chirho { border: 1px solid #d6d9dd; background: white; padding: 12px; }
    .meta-grid-chirho { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; font-size: 13px; }
    .label-chirho { color: #59636f; font-size: 13px; font-weight: 650; }
    .mono-chirho { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .issue-grid-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .issue-option-chirho { display: flex; gap: 7px; align-items: center; border: 1px solid #d6d9dd; padding: 8px; min-height: 38px; box-sizing: border-box; cursor: pointer; }
    .issue-option-chirho input { margin: 0; }
    .issue-option-chirho:has(input:checked) { border-color: #bd7a1b; background: #fff7e8; }
    .clean-accept-option-chirho { display: flex; gap: 8px; align-items: flex-start; border: 1px solid #b8d5ca; background: #f2fbf7; padding: 10px; font-size: 13px; line-height: 1.35; cursor: pointer; }
    .clean-accept-option-chirho input { width: auto; margin: 3px 0 0; }
    .reviewer-input-chirho { width: 100%; box-sizing: border-box; border: 1px solid #b8bec7; padding: 8px; margin: 6px 0 10px; }
    .notes-chirho { width: 100%; min-height: 82px; resize: vertical; box-sizing: border-box; border: 1px solid #b8bec7; padding: 9px; }
    .actions-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .actions-chirho button { border: 1px solid #aab1b9; background: white; padding: 10px; cursor: pointer; min-height: 42px; }
    .actions-chirho button:disabled { cursor: not-allowed; opacity: 0.55; }
    .actions-chirho button:hover, .toolbar-chirho button:hover { background: #edf1f4; }
    .continue-chirho { color: #116149; border-color: #499b7f !important; font-weight: 750; }
    .warning-chirho { border-left: 4px solid #bd7a1b; background: #fff7e8; padding: 10px; font-size: 13px; color: #704000; }
    .done-chirho { padding: 42px 0; color: #59636f; font-size: 18px; }
    @media (max-width: 900px) {
      .main-chirho { grid-template-columns: 1fr; }
      .side-chirho { order: -1; }
      .line-image-chirho { width: 1100px; }
    }
  </style>
</head>
<body>
  <main class="shell-chirho">
    <div class="top-chirho">
      <div>
        <div class="title-chirho">Latin/Symbol Vision Review</div>
        <div class="summary-chirho" id="summary-chirho"></div>
      </div>
      <div class="status-chirho" id="status-chirho"></div>
    </div>
    <div class="toolbar-chirho">
      <label class="label-chirho" for="script-filter-chirho">Script</label>
      <select id="script-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="french-chirho">French</option>
        <option value="latin-non-french-chirho">Latin non-French</option>
        <option value="symbol-chirho">Symbol</option>
      </select>
      <label class="label-chirho" for="symbol-risk-filter-chirho">Symbol risk</label>
      <select id="symbol-risk-filter-chirho">
        ${SYMBOL_RISK_OPTIONS_CHIRHO.map((optionChirho) => `<option value="${optionChirho.valueChirho}">${optionChirho.labelChirho}</option>`).join("")}
      </select>
      <label class="label-chirho" for="volume-filter-chirho">Volume</label>
      <select id="volume-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="vol-1-chirho">Vol 1</option>
        <option value="vol-2-chirho">Vol 2</option>
        <option value="vol-3-chirho">Vol 3</option>
        <option value="vol-4-chirho">Vol 4</option>
        <option value="vol-5-chirho">Vol 5</option>
      </select>
      <button type="button" id="prev-chirho">Previous</button>
      <button type="button" id="next-chirho">Skip</button>
      <button type="button" id="copy-link-chirho">Copy link</button>
    </div>
    <section class="main-chirho" id="app-chirho"></section>
  </main>
  <script>
    const issueFlagOptionsChirho = ${scriptJsonChirho(ISSUE_FLAG_OPTIONS_CHIRHO)};
    const symbolRiskOptionsChirho = ${scriptJsonChirho(SYMBOL_RISK_OPTIONS_CHIRHO)};
    const serverReviewerChirho = ${scriptJsonChirho(reviewerChirho)};
    const genericReviewerIdsChirho = new Set(${scriptJsonChirho([...GENERIC_REVIEWER_IDS_CHIRHO])});
    let itemsChirho = [];
    let reviewsChirho = new Map();
    let acceptedPolicyIdsChirho = new Set();
    let acceptedReviewIdsChirho = new Set();
    let reviewedIssueIdsChirho = new Set();
    let indexChirho = 0;
    const initialSearchParamsChirho = new URLSearchParams(window.location.search);
    let requestedItemIdChirho = initialSearchParamsChirho.get("item-chirho");
    let reviewerChirho = storedReviewerChirho() || serverReviewerChirho || "";

    function textNodeChirho(valueChirho) { return document.createTextNode(valueChirho == null ? "" : String(valueChirho)); }
    function elChirho(tagChirho, attrsChirho = {}, childrenChirho = []) {
      const nodeChirho = document.createElement(tagChirho);
      for (const [keyChirho, valueChirho] of Object.entries(attrsChirho)) {
        if (keyChirho === "classChirho") nodeChirho.className = valueChirho;
        else if (keyChirho === "textChirho") nodeChirho.textContent = valueChirho;
        else nodeChirho.setAttribute(keyChirho, valueChirho);
      }
      for (const childChirho of childrenChirho) nodeChirho.appendChild(childChirho);
      return nodeChirho;
    }
    function clearChirho(nodeChirho) { while (nodeChirho.firstChild) nodeChirho.removeChild(nodeChirho.firstChild); }
    function setStatusChirho(messageChirho) { document.getElementById("status-chirho").textContent = messageChirho; }
    function storedReviewerChirho() {
      try { return window.localStorage.getItem("latin-symbol-reviewer-chirho") || ""; }
      catch (_errorChirho) { return ""; }
    }
    function persistReviewerChirho(valueChirho) {
      try { window.localStorage.setItem("latin-symbol-reviewer-chirho", valueChirho); }
      catch (_errorChirho) {}
    }
    function currentReviewerChirho() {
      const inputChirho = document.getElementById("reviewer-chirho");
      return (inputChirho ? inputChirho.value : reviewerChirho).trim();
    }
    function reviewerAttributionErrorChirho(valueChirho) {
      const trimmedChirho = String(valueChirho || "").trim();
      const normalizedChirho = trimmedChirho.toLowerCase();
      if (trimmedChirho.length === 0) return "Reviewer is required.";
      if (genericReviewerIdsChirho.has(normalizedChirho)) {
        return "Reviewer must identify the explicit reviewer, not " + trimmedChirho + ".";
      }
      return null;
    }
    function isMachineReviewerAttributionChirho(valueChirho) {
      return /(^|[^a-z0-9])(anthropic|claude|codex|gemini|gpt[-_ ]?[0-9]*|llama|mistral|model|openai|o[0-9]+)([^a-z0-9]|$)/i.test(String(valueChirho || "").trim().toLowerCase());
    }
    function certifyingReviewerAttributionErrorChirho(valueChirho) {
      const explicitErrorChirho = reviewerAttributionErrorChirho(valueChirho);
      if (explicitErrorChirho !== null) return explicitErrorChirho;
      if (isMachineReviewerAttributionChirho(valueChirho)) {
        return "Reviewer must identify a human reviewer; machine reviewer " + String(valueChirho || "").trim() + " cannot certify.";
      }
      return null;
    }
    function currentPositionTextChirho(activeCountChirho) {
      return activeCountChirho === 0 ? "item 0 of 0" : "item " + (indexChirho + 1) + " of " + activeCountChirho;
    }
    async function copyCurrentLinkChirho() {
      const linkChirho = window.location.href;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(linkChirho);
        setStatusChirho("Copied current item link");
      } catch (_errorChirho) {
        const textareaChirho = document.createElement("textarea");
        textareaChirho.value = linkChirho;
        textareaChirho.style.position = "fixed";
        textareaChirho.style.left = "-9999px";
        document.body.appendChild(textareaChirho);
        textareaChirho.select();
        const copiedChirho = document.execCommand("copy");
        textareaChirho.remove();
        setStatusChirho(copiedChirho ? "Copied current item link" : "Copy failed; URL bar already has current item link");
      }
    }
    function selectValueOrDefaultChirho(selectIdChirho, valueChirho, defaultChirho) {
      const selectChirho = document.getElementById(selectIdChirho);
      if (typeof valueChirho !== "string") return defaultChirho;
      return [...selectChirho.options].some((optionChirho) => optionChirho.value === valueChirho) ? valueChirho : defaultChirho;
    }
    let scriptFilterChirho = selectValueOrDefaultChirho(
      "script-filter-chirho",
      initialSearchParamsChirho.get("script-chirho"),
      "all-chirho"
    );
    let symbolRiskFilterChirho = selectValueOrDefaultChirho(
      "symbol-risk-filter-chirho",
      initialSearchParamsChirho.get("symbol-risk-chirho"),
      "all-chirho"
    );
    let volumeFilterChirho = selectValueOrDefaultChirho(
      "volume-filter-chirho",
      initialSearchParamsChirho.get("volume-chirho"),
      "all-chirho"
    );
    function syncFilterControlsChirho() {
      document.getElementById("script-filter-chirho").value = scriptFilterChirho;
      document.getElementById("symbol-risk-filter-chirho").value = symbolRiskFilterChirho;
      document.getElementById("volume-filter-chirho").value = volumeFilterChirho;
    }
    function volumeFilterNumberChirho() {
      if (volumeFilterChirho === "all-chirho") return null;
      const matchChirho = volumeFilterChirho.match(/^vol-(\\d+)-chirho$/);
      return matchChirho ? Number.parseInt(matchChirho[1], 10) : null;
    }
    function syncUrlChirho() {
      const paramsChirho = new URLSearchParams();
      if (scriptFilterChirho !== "all-chirho") paramsChirho.set("script-chirho", scriptFilterChirho);
      if (symbolRiskFilterChirho !== "all-chirho") paramsChirho.set("symbol-risk-chirho", symbolRiskFilterChirho);
      if (volumeFilterChirho !== "all-chirho") paramsChirho.set("volume-chirho", volumeFilterChirho);
      const itemChirho = currentItemChirho();
      if (itemChirho) paramsChirho.set("item-chirho", itemChirho.idChirho);
      const queryChirho = paramsChirho.toString();
      window.history.replaceState(null, "", queryChirho ? window.location.pathname + "?" + queryChirho : window.location.pathname);
    }
    function acceptedDecisionIdsChirho() {
      const idsChirho = new Set();
      for (const itemIdChirho of acceptedPolicyIdsChirho) idsChirho.add(itemIdChirho);
      for (const itemIdChirho of acceptedReviewIdsChirho) idsChirho.add(itemIdChirho);
      for (const itemIdChirho of reviewedIssueIdsChirho) idsChirho.delete(itemIdChirho);
      return idsChirho;
    }
    function activeItemsChirho() {
      const acceptedChirho = acceptedDecisionIdsChirho();
      const volumeChirho = volumeFilterNumberChirho();
      return itemsChirho.filter((itemChirho) =>
        !acceptedChirho.has(itemChirho.idChirho) &&
        (scriptFilterChirho === "all-chirho" || itemChirho.scriptChirho === scriptFilterChirho) &&
        (symbolRiskFilterChirho === "all-chirho" || itemChirho.symbolRiskChirho === symbolRiskFilterChirho) &&
        (volumeChirho === null || itemChirho.volumeChirho === volumeChirho)
      );
    }
    function activeIndexForItemIdChirho(itemIdChirho) {
      if (typeof itemIdChirho !== "string" || itemIdChirho.length === 0) return -1;
      return activeItemsChirho().findIndex((itemChirho) => itemChirho.idChirho === itemIdChirho);
    }
    function applyRequestedItemIdChirho() {
      let requestedIndexChirho = activeIndexForItemIdChirho(requestedItemIdChirho);
      const requestedItemChirho = itemsChirho.find((itemChirho) => itemChirho.idChirho === requestedItemIdChirho);
      const volumeChirho = volumeFilterNumberChirho();
      if (requestedIndexChirho < 0 && requestedItemChirho && volumeChirho !== null && requestedItemChirho.volumeChirho !== volumeChirho) {
        volumeFilterChirho = "all-chirho";
        syncFilterControlsChirho();
        requestedIndexChirho = activeIndexForItemIdChirho(requestedItemIdChirho);
      }
      if (requestedIndexChirho >= 0) indexChirho = requestedIndexChirho;
      requestedItemIdChirho = null;
    }
    function currentItemChirho() { return activeItemsChirho()[indexChirho]; }
    function imageSrcChirho(pathChirho) { return "/asset-chirho?path=" + encodeURIComponent(pathChirho); }
    function currentIssueFlagsChirho() {
      return [...document.querySelectorAll(".issue-option-chirho input:checked")].map((nodeChirho) => nodeChirho.value);
    }
    function cleanAcceptAcknowledgedChirho() {
      return document.getElementById("accept-clean-chirho")?.checked === true;
    }
    function currentReviewWouldBeCleanChirho() {
      return currentIssueFlagsChirho().length === 0;
    }
    function currentReviewCanSubmitChirho() {
      const reviewerErrorChirho = currentReviewWouldBeCleanChirho()
        ? certifyingReviewerAttributionErrorChirho(currentReviewerChirho())
        : reviewerAttributionErrorChirho(currentReviewerChirho());
      return reviewerErrorChirho === null &&
        (!currentReviewWouldBeCleanChirho() || cleanAcceptAcknowledgedChirho());
    }
    function latinSymbolReviewActionMessagesChirho() {
      const messagesChirho = [];
      const reviewerErrorChirho = currentReviewWouldBeCleanChirho()
        ? certifyingReviewerAttributionErrorChirho(currentReviewerChirho())
        : reviewerAttributionErrorChirho(currentReviewerChirho());
      if (reviewerErrorChirho !== null) messagesChirho.push(reviewerErrorChirho);
      if (currentReviewWouldBeCleanChirho() && !cleanAcceptAcknowledgedChirho()) {
        messagesChirho.push("clean acceptance checkbox required");
      }
      return messagesChirho;
    }
    function reviewActionTextChirho() {
      return currentIssueFlagsChirho().length === 0 ? "Accept as clean" : "Save issue";
    }
    function symbolRiskLabelChirho(valueChirho) {
      const optionChirho = symbolRiskOptionsChirho.find((candidateChirho) => candidateChirho.valueChirho === valueChirho);
      return optionChirho ? optionChirho.labelChirho : valueChirho;
    }
    async function loadStateChirho() {
      const responseChirho = await fetch("/api-chirho/state-chirho");
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) throw new Error(dataChirho.errorChirho || "state failed");
      itemsChirho = dataChirho.itemsChirho;
      reviewsChirho = new Map(dataChirho.reviewsChirho.map((reviewChirho) => [reviewChirho.itemIdChirho, reviewChirho]));
      acceptedPolicyIdsChirho = new Set(dataChirho.acceptedPolicyItemIdsChirho || []);
      acceptedReviewIdsChirho = new Set(dataChirho.acceptedReviewItemIdsChirho || []);
      reviewedIssueIdsChirho = new Set(dataChirho.reviewedIssueItemIdsChirho || []);
      applyRequestedItemIdChirho();
      if (indexChirho >= activeItemsChirho().length) indexChirho = Math.max(0, activeItemsChirho().length - 1);
      renderChirho();
    }
    function renderSummaryChirho() {
      const acceptedChirho = acceptedDecisionIdsChirho().size;
      const activeChirho = activeItemsChirho().length;
      document.getElementById("summary-chirho").textContent =
        activeChirho + " pending in filter, " + acceptedChirho + " accepted decision(s), " +
        reviewsChirho.size + " current review rows, " + currentPositionTextChirho(activeChirho);
    }
    function renderChirho() {
      syncUrlChirho();
      const appChirho = document.getElementById("app-chirho");
      clearChirho(appChirho);
      renderSummaryChirho();
      const itemChirho = currentItemChirho();
      if (!itemChirho) {
        appChirho.appendChild(elChirho("div", { classChirho: "done-chirho", textChirho: "No pending items in this filter." }));
        return;
      }
      const reviewChirho = reviewsChirho.get(itemChirho.idChirho);
      const leftChirho = elChirho("div", { classChirho: "panel-chirho" });
      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Target crop" }));
      const targetWrapChirho = elChirho("div", { classChirho: "image-wrap-chirho" });
      targetWrapChirho.appendChild(elChirho("img", { classChirho: "target-image-chirho", src: imageSrcChirho(itemChirho.targetMarkdownPathChirho), alt: "" }));
      leftChirho.appendChild(targetWrapChirho);
      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Full line" }));
      const lineWrapChirho = elChirho("div", { classChirho: "image-wrap-chirho" });
      lineWrapChirho.appendChild(elChirho("img", { classChirho: "line-image-chirho", src: imageSrcChirho(itemChirho.lineMarkdownPathChirho), alt: "" }));
      leftChirho.appendChild(lineWrapChirho);
      leftChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Current text" }));
      leftChirho.appendChild(elChirho("div", { classChirho: "text-box-chirho current-text-chirho", textChirho: itemChirho.textChirho }));
      leftChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Line text" }));
      leftChirho.appendChild(elChirho("div", { classChirho: "text-box-chirho line-text-chirho", textChirho: itemChirho.lineTextChirho }));

      const sideChirho = elChirho("div", { classChirho: "side-chirho" });
      const metaChirho = elChirho("div", { classChirho: "box-chirho" });
      const metaGridChirho = elChirho("div", { classChirho: "meta-grid-chirho" });
      for (const [labelChirho, valueChirho] of [
        ["ID", itemChirho.idChirho],
        ["Location", "vol " + itemChirho.volumeChirho + " p" + itemChirho.pageChirho + " L" + itemChirho.lineIndexChirho],
        ["Kind", itemChirho.itemKindChirho],
        ["Script", itemChirho.scriptChirho],
        ["Symbol risk", symbolRiskLabelChirho(itemChirho.symbolRiskChirho)],
        ["Source", itemChirho.sourceChirho],
        ["Review", reviewChirho ? reviewChirho.verdictChirho : "none"]
      ]) {
        metaGridChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: labelChirho }));
        metaGridChirho.appendChild(elChirho("div", { classChirho: "mono-chirho", textChirho: valueChirho }));
      }
      metaChirho.appendChild(metaGridChirho);
      sideChirho.appendChild(metaChirho);
      if (reviewChirho?.verdictChirho === "reviewed-issues-chirho") {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "This item has issue flags and remains pending until accepted clean." }));
      }
      const formChirho = elChirho("div", { classChirho: "box-chirho" });
      formChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "reviewer-chirho", textChirho: "Reviewer" }));
      const reviewerInputChirho = elChirho("input", {
        id: "reviewer-chirho",
        classChirho: "reviewer-input-chirho",
        type: "text",
        autocomplete: "name",
        value: reviewerChirho
      });
      formChirho.appendChild(reviewerInputChirho);
      const reviewerStatusChirho = elChirho("div", { classChirho: "label-chirho reviewer-status-chirho", textChirho: "" });
      formChirho.appendChild(reviewerStatusChirho);
      formChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Issue flags" }));
      formChirho.appendChild(elChirho("div", {
        classChirho: "label-chirho",
        textChirho: "A clean acceptance requires the checkbox below. Check a flag for any wrong letter/digit/siglum, punctuation, spacing, crop, split, missing text, or extra text."
      }));
      const issueGridChirho = elChirho("div", { classChirho: "issue-grid-chirho" });
      for (const optionChirho of issueFlagOptionsChirho) {
        const inputChirho = elChirho("input", { type: "checkbox", value: optionChirho.valueChirho });
        if (reviewChirho?.issueFlagsChirho?.includes(optionChirho.valueChirho)) {
          inputChirho.checked = true;
        }
        const labelChirho = elChirho("label", {
          classChirho: "issue-option-chirho",
          title: optionChirho.helpChirho,
          "aria-label": optionChirho.labelChirho + ": " + optionChirho.helpChirho
        }, [inputChirho, textNodeChirho(optionChirho.labelChirho)]);
        issueGridChirho.appendChild(labelChirho);
      }
      formChirho.appendChild(issueGridChirho);
      const cleanAcceptInputChirho = elChirho("input", { id: "accept-clean-chirho", type: "checkbox" });
      formChirho.appendChild(elChirho("label", { classChirho: "clean-accept-option-chirho", for: "accept-clean-chirho" }, [
        cleanAcceptInputChirho,
        textNodeChirho("I checked the target crop and full line against the print; if no issue flags are checked, this item is intentionally accepted clean.")
      ]));
      formChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Notes" }));
      const notesChirho = elChirho("textarea", { classChirho: "notes-chirho", id: "notes-chirho" });
      notesChirho.value = reviewChirho?.notesChirho ?? "";
      formChirho.appendChild(notesChirho);
      const actionStatusChirho = elChirho("div", { classChirho: "label-chirho action-status-chirho", textChirho: "" });
      formChirho.appendChild(actionStatusChirho);
      const actionsChirho = elChirho("div", { classChirho: "actions-chirho" });
      const continueChirho = elChirho("button", { classChirho: "continue-chirho", type: "button", textChirho: reviewActionTextChirho() });
      const updateReviewerStatusChirho = () => {
        const reviewerErrorChirho = currentReviewWouldBeCleanChirho()
          ? certifyingReviewerAttributionErrorChirho(currentReviewerChirho())
          : reviewerAttributionErrorChirho(currentReviewerChirho());
        reviewerStatusChirho.textContent = reviewerErrorChirho ?? "Reviewer attribution OK.";
      };
      const updateActionStatusChirho = () => {
        const messagesChirho = latinSymbolReviewActionMessagesChirho();
        actionStatusChirho.textContent = messagesChirho.length === 0
          ? (currentReviewWouldBeCleanChirho()
            ? "Clean acceptance requirements are currently satisfied."
            : "Issue save requirements are currently satisfied.")
          : "Action requirements: " + messagesChirho.join("; ") + ".";
      };
      const updateContinueButtonChirho = () => {
        updateReviewerStatusChirho();
        updateActionStatusChirho();
        continueChirho.textContent = reviewActionTextChirho();
        continueChirho.disabled = !currentReviewCanSubmitChirho();
      };
      for (const checkboxChirho of issueGridChirho.querySelectorAll("input")) {
        checkboxChirho.addEventListener("change", updateContinueButtonChirho);
      }
      cleanAcceptInputChirho.addEventListener("change", updateContinueButtonChirho);
      reviewerInputChirho.addEventListener("input", () => {
        reviewerChirho = reviewerInputChirho.value;
        persistReviewerChirho(reviewerChirho);
        updateContinueButtonChirho();
      });
      updateContinueButtonChirho();
      continueChirho.addEventListener("click", () => saveCurrentChirho(itemChirho));
      const skipChirho = elChirho("button", { type: "button", textChirho: "Skip" });
      skipChirho.addEventListener("click", () => { indexChirho = Math.min(indexChirho + 1, Math.max(0, activeItemsChirho().length - 1)); renderChirho(); });
      actionsChirho.appendChild(continueChirho);
      actionsChirho.appendChild(skipChirho);
      formChirho.appendChild(actionsChirho);
      sideChirho.appendChild(formChirho);
      appChirho.appendChild(leftChirho);
      appChirho.appendChild(sideChirho);
    }
    async function saveCurrentChirho(itemChirho) {
      const flagsChirho = currentIssueFlagsChirho();
      const notesChirho = document.getElementById("notes-chirho").value;
      const reviewerValueChirho = currentReviewerChirho();
      const reviewerErrorChirho = flagsChirho.length === 0
        ? certifyingReviewerAttributionErrorChirho(reviewerValueChirho)
        : reviewerAttributionErrorChirho(reviewerValueChirho);
      if (reviewerErrorChirho !== null) {
        setStatusChirho(reviewerErrorChirho);
        return;
      }
      if (flagsChirho.length === 0 && !cleanAcceptAcknowledgedChirho()) {
        setStatusChirho("Check the clean acceptance box before accepting as clean.");
        return;
      }
      reviewerChirho = reviewerValueChirho;
      persistReviewerChirho(reviewerChirho);
      setStatusChirho("Saving...");
      const responseChirho = await fetch("/api-chirho/review-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idChirho: itemChirho.idChirho,
          issueFlagsChirho: flagsChirho,
          notesChirho,
          reviewerChirho,
          acceptCleanChirho: cleanAcceptAcknowledgedChirho(),
          expectedItemKindChirho: itemChirho.itemKindChirho,
          expectedScriptChirho: itemChirho.scriptChirho,
          expectedSourceChirho: itemChirho.sourceChirho,
          expectedTextChirho: itemChirho.textChirho,
          expectedLineTextChirho: itemChirho.lineTextChirho,
          expectedSourceImageHashChirho: itemChirho.sourceImageHashChirho,
          expectedTargetImageHashChirho: itemChirho.targetImageHashChirho,
          expectedLineImageHashChirho: itemChirho.lineImageHashChirho,
          expectedTargetMarkdownPathChirho: itemChirho.targetMarkdownPathChirho,
          expectedLineMarkdownPathChirho: itemChirho.lineMarkdownPathChirho
        })
      });
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) {
        setStatusChirho(dataChirho.errorChirho || "Save failed");
        return;
      }
      reviewsChirho.set(dataChirho.reviewChirho.itemIdChirho, dataChirho.reviewChirho);
      if (dataChirho.reviewChirho.verdictChirho === "accepted-clean-chirho") {
        acceptedReviewIdsChirho.add(dataChirho.reviewChirho.itemIdChirho);
        reviewedIssueIdsChirho.delete(dataChirho.reviewChirho.itemIdChirho);
        if (indexChirho >= activeItemsChirho().length) indexChirho = Math.max(0, activeItemsChirho().length - 1);
      } else {
        acceptedReviewIdsChirho.delete(dataChirho.reviewChirho.itemIdChirho);
        reviewedIssueIdsChirho.add(dataChirho.reviewChirho.itemIdChirho);
        indexChirho = Math.min(indexChirho + 1, Math.max(0, activeItemsChirho().length - 1));
      }
      setStatusChirho("Saved " + dataChirho.reviewChirho.verdictChirho + " and refreshed backup.");
      renderChirho();
    }
    document.getElementById("script-filter-chirho").addEventListener("change", (eventChirho) => {
      scriptFilterChirho = eventChirho.target.value;
      requestedItemIdChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("symbol-risk-filter-chirho").addEventListener("change", (eventChirho) => {
      symbolRiskFilterChirho = eventChirho.target.value;
      requestedItemIdChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("volume-filter-chirho").addEventListener("change", (eventChirho) => {
      volumeFilterChirho = eventChirho.target.value;
      requestedItemIdChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("prev-chirho").addEventListener("click", () => {
      indexChirho = Math.max(0, indexChirho - 1);
      renderChirho();
    });
    document.getElementById("next-chirho").addEventListener("click", () => {
      indexChirho = Math.min(indexChirho + 1, Math.max(0, activeItemsChirho().length - 1));
      renderChirho();
    });
    document.getElementById("copy-link-chirho").addEventListener("click", () => copyCurrentLinkChirho());
    syncFilterControlsChirho();
    loadStateChirho().catch((errorChirho) => setStatusChirho(String(errorChirho)));
  </script>
</body>
</html>`;
}

const argsChirho = process.argv.slice(2);
const portChirho = parsePortChirho(argsChirho);
const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? PROGRESS_DB_PATH_CHIRHO;
const backupPathChirho = parseArgValueChirho(argsChirho, "backup") ?? LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO;
const policyPathChirho = parseArgValueChirho(argsChirho, "policy") ?? LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO;
const reviewerChirho = parseArgValueChirho(argsChirho, "reviewer")?.trim() ?? "";
const dbChirho = new Database(dbPathChirho);
ensureLatinSymbolReviewSchemaChirho(dbChirho);

function loadCurrentStateChirho(): {
  manifestChirho: LatinSymbolPacketManifestChirho;
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[];
  liveByIdChirho: Map<string, LatinSymbolVisionLiveItemChirho>;
} {
  const manifestChirho = loadLatinSymbolPacketManifestChirho();
  const liveItemsChirho = latinSymbolVisionLiveItemsChirho();
  const liveByIdChirho = assertLatinSymbolManifestMatchesLiveChirho(manifestChirho, liveItemsChirho);
  return { manifestChirho, liveItemsChirho, liveByIdChirho };
}

Bun.serve({
  port: portChirho,
  async fetch(reqChirho) {
    const urlChirho = new URL(reqChirho.url);
    try {
      if (urlChirho.pathname === "/") {
        return new Response(htmlChirho(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      if (urlChirho.pathname === "/favicon.ico") {
        return new Response(null, { status: 204 });
      }
      if (urlChirho.pathname === "/asset-chirho") {
        const relativePathChirho = urlChirho.searchParams.get("path");
        if (!relativePathChirho) return new Response("missing path", { status: 400 });
        const assetPathChirho = safeAssetPathChirho(relativePathChirho);
        if (assetPathChirho === null || !existsSync(assetPathChirho)) return new Response("not found", { status: 404 });
        return new Response(Bun.file(assetPathChirho));
      }
      if (urlChirho.pathname === "/api-chirho/state-chirho") {
        const { manifestChirho, liveItemsChirho } = loadCurrentStateChirho();
        const policySummaryChirho = summarizeLatinSymbolAcceptancePolicyChirho(
          readLatinSymbolAcceptancePolicyFileChirho(policyPathChirho),
          existsSync(policyPathChirho),
          liveItemsChirho
        );
        return jsonResponseChirho({
          okChirho: true,
          generatedAtChirho: manifestChirho.generatedAtChirho ?? null,
          itemsChirho: reviewItemsForManifestChirho(manifestChirho),
          reviewsChirho: publicLatinSymbolReviewRowsChirho(dbChirho),
          acceptedPolicyItemIdsChirho: [...policySummaryChirho.acceptedItemIdsChirho],
          acceptedReviewItemIdsChirho: [...acceptedCleanLatinSymbolReviewIdsChirho(dbChirho, liveItemsChirho)],
          reviewedIssueItemIdsChirho: [...reviewedIssueLatinSymbolReviewIdsChirho(dbChirho, liveItemsChirho)],
        });
      }
      if (urlChirho.pathname === "/api-chirho/review-chirho" && reqChirho.method === "POST") {
        const bodyChirho = (await reqChirho.json()) as ReviewRequestChirho;
        if (typeof bodyChirho.idChirho !== "string") return jsonResponseChirho({ okChirho: false, errorChirho: "missing idChirho" }, 400);
        const { manifestChirho, liveItemsChirho, liveByIdChirho } = loadCurrentStateChirho();
        const liveItemChirho = liveByIdChirho.get(bodyChirho.idChirho);
        if (liveItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown item" }, 404);
        const packetItemChirho = (manifestChirho.itemsChirho ?? []).find((itemChirho) => itemChirho.idChirho === bodyChirho.idChirho);
        if (packetItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown packet item" }, 404);
        const staleDisplayChirho = staleDisplayMismatchChirho(bodyChirho, packetItemChirho);
        if (staleDisplayChirho !== null) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: `Latin/symbol review item is stale: ${staleDisplayChirho}; reload review state`,
          }, 409);
        }
        const issueFlagsChirho = parseLatinSymbolIssueFlagsChirho(bodyChirho.issueFlagsChirho);
        if (issueFlagsChirho.length === 0 && bodyChirho.acceptCleanChirho !== true) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: "acceptCleanChirho acknowledgement is required for accepted-clean",
          }, 400);
        }
        const notesChirho = typeof bodyChirho.notesChirho === "string" && bodyChirho.notesChirho.trim().length > 0
          ? bodyChirho.notesChirho.trim()
          : null;
        const effectiveReviewerChirho = typeof bodyChirho.reviewerChirho === "string" && bodyChirho.reviewerChirho.trim().length > 0
          ? bodyChirho.reviewerChirho.trim()
          : reviewerChirho;
        if (effectiveReviewerChirho.length === 0) {
          return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
        }
        const reviewerErrorChirho = issueFlagsChirho.length === 0
          ? certifyingReviewerAttributionErrorChirho(effectiveReviewerChirho)
          : explicitReviewerAttributionErrorChirho(effectiveReviewerChirho);
        if (reviewerErrorChirho !== null) {
          return jsonResponseChirho({ okChirho: false, errorChirho: reviewerErrorChirho }, 400);
        }
        const reviewChirho = saveLatinSymbolReviewChirho({
          dbChirho,
          manifestChirho,
          liveItemChirho,
          verdictChirho: verdictForLatinSymbolIssueFlagsChirho(issueFlagsChirho),
          acceptCleanChirho: issueFlagsChirho.length === 0,
          issueFlagsChirho,
          notesChirho,
          reviewerChirho: effectiveReviewerChirho,
        });
        writeLatinSymbolReviewBackupChirho(dbChirho, backupPathChirho, liveItemsChirho, manifestChirho);
        return jsonResponseChirho({ okChirho: true, reviewChirho });
      }
      return new Response("not found", { status: 404 });
    } catch (errorChirho) {
      return jsonResponseChirho({ okChirho: false, errorChirho: String(errorChirho) }, 500);
    }
  },
});

console.log(`[${MODULE_CHIRHO}] http://localhost:${portChirho}/`);
