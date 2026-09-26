// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import {
  RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO,
  RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO,
  RAW_HEBREW_REVIEW_TIER_SPOT_CHECK_CHIRHO
} from "../raw-hebrew-review-tier-chirho.ts";
import {
  RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO,
  RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO,
  RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO,
  RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO,
  RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO,
  RAW_HEBREW_PRE_REVIEW_REASON_MISSING_CURRENT_CHIRHO
} from "../raw-hebrew-review-triage-chirho.ts";
import type { ReviewServerHealthChirho } from "../review-server-health-chirho.ts";
import {
  GENERIC_REVIEWER_IDS_CHIRHO,
  MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO,
  MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO,
  REVIEWER_TEMPLATE_PLACEHOLDER_RE_FLAGS_CHIRHO,
  REVIEWER_TEMPLATE_PLACEHOLDER_RE_SOURCE_CHIRHO
} from "../reviewer-attribution-chirho.ts";
import {
  SEGMENT_REPAIR_KIND_LABELS_CHIRHO,
  SEGMENT_REPAIR_KIND_VALUES_CHIRHO,
  SEGMENT_REPAIR_SCRIPT_LABELS_CHIRHO,
  SEGMENT_REPAIR_SCRIPT_VALUES_CHIRHO
} from "../segment-repair-proposals-chirho.ts";
import { segmentTilingEditClientScriptChirho } from "../segment-tiling-edit-chirho.ts";
import {
  REVIEW_NOTES_PLACEHOLDER_VALUES_CHIRHO
} from "../template-placeholder-chirho.ts";
import { humanReviewEventsScriptChirho } from "./events-chirho.ts";
import { humanReviewRenderScriptChirho } from "./render-chirho.ts";
import { humanReviewRepairScriptChirho } from "./repair-chirho.ts";
import { humanReviewSessionScriptChirho } from "./session-chirho.ts";
import { HUMAN_REVIEW_STYLES_CHIRHO } from "./styles-chirho.ts";
import { ISSUE_FLAG_OPTIONS_CHIRHO, REVIEW_STATE_FILTER_OPTIONS_CHIRHO, SCRIPT_VERDICT_OPTIONS_CHIRHO, type QueueItemChirho, type QueueModeChirho } from "./types-chirho.ts";

interface HumanReviewPageOptionsChirho {
  queueTitleChirho: string;
  queueChirho: QueueItemChirho[];
  queueModeChirho: QueueModeChirho;
  reviewerChirho: string;
  serverHealthChirho: ReviewServerHealthChirho;
  scriptOptionsChirho: Array<{ valueChirho: string; labelChirho: string }>;
}

function scriptJsonChirho(valueChirho: unknown): string {
  return JSON.stringify(valueChirho)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function humanReviewPageChirho({ queueTitleChirho, queueChirho, queueModeChirho, reviewerChirho, serverHealthChirho: SERVER_HEALTH_CHIRHO, scriptOptionsChirho: QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO }: HumanReviewPageOptionsChirho): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Text review · Barthélemy</title>
  <style>
${HUMAN_REVIEW_STYLES_CHIRHO}
  </style>
</head>
<body>
  <main class="shell-chirho">
    <div class="top-chirho">
      <div>
        <div class="eyebrow-chirho">Barthélemy · Textual criticism</div>
        <h1 class="title-chirho">Review the printed text</h1>
        <div class="summary-chirho" id="summary-chirho"></div>
      </div>
      <div>
        <nav class="toolbar-chirho" aria-label="Review navigation">
          <button type="button" id="prev-chirho">Previous</button>
          <button type="button" id="next-chirho">Skip for now</button>
          <button type="button" id="copy-link-chirho">Copy link</button>
        </nav>
        <div id="session-identity-chirho"></div>
      </div>
    </div>
    <details class="queue-tools-chirho" id="queue-tools-chirho">
    <summary>Choose review queue <span id="queue-context-chirho" class="summary-chirho"></span></summary>
    <div class="toolbar-chirho queue-filters-chirho">
      <label class="label-chirho" for="review-state-filter-chirho">Review</label>
      <select id="review-state-filter-chirho">
        ${REVIEW_STATE_FILTER_OPTIONS_CHIRHO.map((optionChirho) => `<option value="${optionChirho.valueChirho}">${optionChirho.labelChirho}</option>`).join("")}
      </select>
      <label class="label-chirho" for="validation-status-filter-chirho">Status</label>
      <select id="validation-status-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="unvalidated-chirho">Unvalidated</option>
        <option value="partial-token-validated-chirho">Partial</option>
        <option value="all-token-validated-chirho">All-token spot check</option>
      </select>
      <label class="label-chirho" for="tier-filter-chirho">Tier</label>
      <select id="tier-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="${RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO}">Primary vols 3-5</option>
        <option value="${RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO}">Primary vols 1-2</option>
        <option value="${RAW_HEBREW_REVIEW_TIER_SPOT_CHECK_CHIRHO}">Spot check</option>
        <option value="suspect-text-chirho">Suspect text</option>
        <option value="unknown-script-chirho">Unknown script</option>
      </select>
      <label class="label-chirho" for="attention-filter-chirho">Attention</label>
      <select id="attention-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="${RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO}">Low confidence</option>
        <option value="${RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO}">Confident disagreement</option>
        <option value="${RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO}">Multi-token</option>
        <option value="${RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO}">Delimiter notation</option>
        <option value="${RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO}">No direct read</option>
      </select>
      <label class="label-chirho" for="pre-review-note-filter-chirho">Pre-review</label>
      <select id="pre-review-note-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="with-note-chirho">Has note</option>
        <option value="without-note-chirho">No note</option>
      </select>
      <label class="label-chirho" for="pre-review-reason-filter-chirho">Pre-review reason</label>
      <select id="pre-review-reason-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="${RAW_HEBREW_PRE_REVIEW_REASON_MISSING_CURRENT_CHIRHO}">Missing current reason</option>
      </select>
      <label class="label-chirho" for="attribution-text-filter-chirho">Attribution text</label>
      <select id="attribution-text-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="unchanged-chirho">Unchanged live text</option>
        <option value="changed-chirho">Changed live text</option>
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
      <label class="label-chirho" for="script-filter-chirho">Language</label>
      <select id="script-filter-chirho">
        <option value="all-chirho">All</option>
        ${QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO.map((optionChirho) => `<option value="${optionChirho.valueChirho}">${optionChirho.labelChirho}</option>`).join("")}
      </select>
      <label class="label-chirho" for="exact-text-filter-chirho">Exact text</label>
      <input id="exact-text-filter-chirho" type="text" placeholder="optional exact live text" />
      <a class="toolbar-link-chirho" href="/quickstart-chirho" target="_blank" rel="noreferrer">Quickstart</a>
      <a class="toolbar-link-chirho" href="/session-guide-chirho" target="_blank" rel="noreferrer">Session guide</a>
    </div>
    <div class="lane-shortcuts-chirho" aria-label="Recommended raw review order">
      <span>Recommended raw review order</span>
      <a data-lane-shortcut-chirho="vols-3-5-unvalidated-chirho" href="/?validation-status-chirho=unvalidated-chirho&tier-chirho=${RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO}">Vols 3-5 unvalidated <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="vols-1-2-unvalidated-chirho" href="/?validation-status-chirho=unvalidated-chirho&tier-chirho=${RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO}">Vols 1-2 unvalidated <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="partial-chirho" href="/?validation-status-chirho=partial-token-validated-chirho">Partial <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="spot-check-chirho" href="/?validation-status-chirho=all-token-validated-chirho&tier-chirho=${RAW_HEBREW_REVIEW_TIER_SPOT_CHECK_CHIRHO}">Spot check <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="low-confidence-chirho" href="/?attention-chirho=${RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO}">Low confidence <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="confident-disagreement-chirho" href="/?attention-chirho=${RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO}">Confident disagreement <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="multi-token-chirho" href="/?attention-chirho=${RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO}">Multi-token <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="delimiter-notation-chirho" href="/?attention-chirho=${RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO}">Delimiter notation <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="no-direct-read-chirho" href="/?attention-chirho=${RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO}">No direct read <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="with-pre-review-note-chirho" href="/?pre-review-note-chirho=with-note-chirho">With pre-review note <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="without-pre-review-note-chirho" href="/?pre-review-note-chirho=without-note-chirho">No pre-review note <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="pre-review-reason-gap-chirho" href="/?pre-review-reason-chirho=${RAW_HEBREW_PRE_REVIEW_REASON_MISSING_CURRENT_CHIRHO}">Pre-review reason gap <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="attribution-cleanup-chirho" href="/?review-state-chirho=attribution-blocked-chirho">Attribution cleanup <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="attribution-unchanged-chirho" href="/?review-state-chirho=attribution-blocked-chirho&attribution-text-chirho=unchanged-chirho">Attribution unchanged <span class="lane-shortcut-count-chirho"></span></a>
      <a data-lane-shortcut-chirho="attribution-changed-rereview-chirho" href="/?review-state-chirho=attribution-rereview-chirho&attribution-text-chirho=changed-chirho">Attribution changed re-review <span class="lane-shortcut-count-chirho"></span></a>
      ${QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO.map((optionChirho) => `<a data-lane-shortcut-chirho="script-only-${optionChirho.valueChirho}" href="/?script-chirho=${encodeURIComponent(optionChirho.valueChirho)}">Only ${optionChirho.labelChirho} <span class="lane-shortcut-count-chirho"></span></a>`).join("\n      ")}
    </div>
    </details>
    <div class="workspace-context-chirho">
      <span id="item-context-chirho"></span>
      <span class="summary-chirho">Read the scan. Check the box. Then review the text.</span>
    </div>
    <div class="status-chirho" id="status-chirho" role="status" aria-live="polite"></div>
    <section class="main-chirho" id="app-chirho"></section>
    <footer class="review-footer-chirho">
      <details><summary>About this review station</summary>
        <p>${queueTitleChirho}</p>
        <div class="server-health-chirho">Review server source: ${SERVER_HEALTH_CHIRHO.sourceFingerprintChirho.slice(0, 12)}; started: ${SERVER_HEALTH_CHIRHO.startedAtChirho}</div>
      </details>
    </footer>
  </main>
  <script>
    // Segment tiling edits, shared verbatim with src-chirho/segment-tiling-edit-chirho.ts.
    // check-segment-tiling-edit-chirho.ts evaluates this exact copy and compares it
    // against the module, so the page and the server can never drift apart.
${segmentTilingEditClientScriptChirho()}
    const queueChirho = ${scriptJsonChirho(queueChirho)};
    const queueModeChirho = ${scriptJsonChirho(queueModeChirho)};
    const issueFlagOptionsChirho = ${scriptJsonChirho(ISSUE_FLAG_OPTIONS_CHIRHO)};
    const scriptVerdictOptionsChirho = ${scriptJsonChirho(SCRIPT_VERDICT_OPTIONS_CHIRHO)};
    const segmentRepairKindOptionsChirho = ${scriptJsonChirho(SEGMENT_REPAIR_KIND_VALUES_CHIRHO)};
    const segmentRepairKindLabelsChirho = ${scriptJsonChirho(SEGMENT_REPAIR_KIND_LABELS_CHIRHO)};
    const segmentRepairScriptOptionsChirho = ${scriptJsonChirho(SEGMENT_REPAIR_SCRIPT_VALUES_CHIRHO)};
    const segmentRepairScriptLabelsChirho = ${scriptJsonChirho(SEGMENT_REPAIR_SCRIPT_LABELS_CHIRHO)};
    const serverReviewerChirho = ${scriptJsonChirho(reviewerChirho)};
    const genericReviewerIdsChirho = new Set(${scriptJsonChirho([...GENERIC_REVIEWER_IDS_CHIRHO])});
    const machineReviewerIdReChirho = new RegExp(
      ${scriptJsonChirho(MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO)},
      ${scriptJsonChirho(MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO)}
    );
    const reviewerTemplatePlaceholderReChirho = new RegExp(
      ${scriptJsonChirho(REVIEWER_TEMPLATE_PLACEHOLDER_RE_SOURCE_CHIRHO)},
      ${scriptJsonChirho(REVIEWER_TEMPLATE_PLACEHOLDER_RE_FLAGS_CHIRHO)}
    );
    const reviewNotesPlaceholderValuesChirho = new Set(${scriptJsonChirho([...REVIEW_NOTES_PLACEHOLDER_VALUES_CHIRHO])});
    let validationRowsChirho = [];
    let validationsChirho = new Map();
    let indexChirho = 0;
    let focusCorrectionAfterRenderChirho = false;
    const initialSearchParamsChirho = new URLSearchParams(window.location.search);
    let requestedItemKeyChirho = initialSearchParamsChirho.get("item-chirho");
    let reviewerChirho = storedReviewerChirho() || serverReviewerChirho || "";

${humanReviewSessionScriptChirho(QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO)}
${humanReviewRepairScriptChirho()}
${humanReviewRenderScriptChirho()}
${humanReviewEventsScriptChirho()}
  </script>
</body>
</html>`;
}
