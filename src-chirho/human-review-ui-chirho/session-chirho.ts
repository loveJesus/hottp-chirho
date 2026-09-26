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

export function humanReviewSessionScriptChirho(QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO: Array<{ valueChirho: string; labelChirho: string }>): string {
  return `    function textChirho(valueChirho) { return document.createTextNode(valueChirho); }
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
    function storedReviewerChirho() {
      try { return window.localStorage.getItem("pass-c-human-reviewer-chirho") || ""; }
      catch (_errorChirho) { return ""; }
    }
    function persistReviewerChirho(valueChirho) {
      try { window.localStorage.setItem("pass-c-human-reviewer-chirho", valueChirho); }
      catch (_errorChirho) {}
    }
    function currentReviewerChirho() {
      const inputChirho = document.getElementById("reviewer-chirho");
      return (inputChirho ? inputChirho.value : reviewerChirho).trim();
    }
    function reviewerAttributionErrorChirho(valueChirho) {
      const trimmedChirho = String(valueChirho || "").trim();
      const normalizedChirho = trimmedChirho.toLowerCase();
      if (trimmedChirho.length === 0) return "Reviewer is required";
      if (genericReviewerIdsChirho.has(normalizedChirho)) {
        return "Reviewer must identify the explicit reviewer, not " + trimmedChirho;
      }
      if (reviewerTemplatePlaceholderReChirho.test(trimmedChirho)) {
        return "Reviewer must identify the explicit reviewer, not template placeholder " + trimmedChirho;
      }
      return null;
    }
    function isMachineReviewerAttributionChirho(valueChirho) {
      return machineReviewerIdReChirho.test(String(valueChirho || "").trim().toLowerCase());
    }
    function certifyingReviewerAttributionErrorChirho(valueChirho) {
      const explicitErrorChirho = reviewerAttributionErrorChirho(valueChirho);
      if (explicitErrorChirho !== null) return explicitErrorChirho;
      if (isMachineReviewerAttributionChirho(valueChirho)) {
        return "Reviewer must identify a human reviewer; machine reviewer " + String(valueChirho || "").trim() + " cannot certify";
      }
      return null;
    }
    function valueLooksTemplatePlaceholderChirho(valueChirho, placeholderValuesChirho) {
      const normalizedChirho = String(valueChirho || "").trim().toLowerCase().replace(/\\s+/g, " ");
      const unwrappedChirho = normalizedChirho.replace(/^<(.+)>$/u, "$1").trim();
      return placeholderValuesChirho.has(normalizedChirho) || placeholderValuesChirho.has(unwrappedChirho);
    }
    function reviewNotesErrorChirho(valueChirho) {
      const trimmedChirho = String(valueChirho || "").trim();
      if (trimmedChirho.length === 0) return "issue saves need an explanatory note";
      if (valueLooksTemplatePlaceholderChirho(trimmedChirho, reviewNotesPlaceholderValuesChirho)) {
        return "issue note must explain the issue, not a template placeholder";
      }
      return null;
    }
    function selectValueOrDefaultChirho(selectIdChirho, valueChirho, defaultChirho) {
      const selectChirho = document.getElementById(selectIdChirho);
      if (typeof valueChirho !== "string") return defaultChirho;
      return [...selectChirho.options].some((optionChirho) => optionChirho.value === valueChirho) ? valueChirho : defaultChirho;
    }
    function parseJsonArrayChirho(valueChirho) {
      if (typeof valueChirho !== "string" || valueChirho.length === 0) return [];
      try {
        const parsedChirho = JSON.parse(valueChirho);
        return Array.isArray(parsedChirho) ? parsedChirho.filter((itemChirho) => typeof itemChirho === "string") : [];
      } catch (_errorChirho) {
        return [];
      }
    }
    function shellSingleQuoteChirho(valueChirho) {
      return "'" + String(valueChirho).normalize("NFC").replace(/'/g, "'\\"'\\"'") + "'";
    }
    function fieldValueChirho(idChirho) {
      return document.getElementById(idChirho)?.value ?? "";
    }
    function shellArgOrPlaceholderChirho(valueChirho, placeholderChirho) {
      const trimmedChirho = String(valueChirho ?? "").trim();
      return shellSingleQuoteChirho(trimmedChirho.length > 0 ? trimmedChirho : placeholderChirho);
    }
    let reviewStateFilterChirho = selectValueOrDefaultChirho(
      "review-state-filter-chirho",
      initialSearchParamsChirho.get("review-state-chirho"),
      "pending-chirho"
    );
    let validationStatusFilterChirho = selectValueOrDefaultChirho(
      "validation-status-filter-chirho",
      initialSearchParamsChirho.get("validation-status-chirho"),
      "all-chirho"
    );
    let tierFilterChirho = selectValueOrDefaultChirho(
      "tier-filter-chirho",
      initialSearchParamsChirho.get("tier-chirho"),
      "all-chirho"
    );
    let attentionFilterChirho = selectValueOrDefaultChirho(
      "attention-filter-chirho",
      initialSearchParamsChirho.get("attention-chirho"),
      "all-chirho"
    );
    let preReviewNoteFilterChirho = selectValueOrDefaultChirho(
      "pre-review-note-filter-chirho",
      initialSearchParamsChirho.get("pre-review-note-chirho"),
      "all-chirho"
    );
    let preReviewReasonFilterChirho = selectValueOrDefaultChirho(
      "pre-review-reason-filter-chirho",
      initialSearchParamsChirho.get("pre-review-reason-chirho"),
      "all-chirho"
    );
    let attributionTextFilterChirho = selectValueOrDefaultChirho(
      "attribution-text-filter-chirho",
      initialSearchParamsChirho.get("attribution-text-chirho"),
      "all-chirho"
    );
    let volumeFilterChirho = selectValueOrDefaultChirho(
      "volume-filter-chirho",
      initialSearchParamsChirho.get("volume-chirho"),
      "all-chirho"
    );
    let scriptFilterChirho = selectValueOrDefaultChirho(
      "script-filter-chirho",
      initialSearchParamsChirho.get("script-chirho"),
      "all-chirho"
    );
    let exactTextFilterChirho = initialSearchParamsChirho.get("exact-text-chirho") || "";
    const laneShortcutFiltersByIdChirho = new Map([
      ["vols-3-5-unvalidated-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "unvalidated-chirho",
        tierChirho: "${RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO}",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["vols-1-2-unvalidated-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "unvalidated-chirho",
        tierChirho: "${RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO}",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["partial-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "partial-token-validated-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["spot-check-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-token-validated-chirho",
        tierChirho: "${RAW_HEBREW_REVIEW_TIER_SPOT_CHECK_CHIRHO}",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["low-confidence-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "${RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO}",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["confident-disagreement-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "${RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO}",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["multi-token-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "${RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO}",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["delimiter-notation-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "${RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO}",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["no-direct-read-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "${RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO}",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["with-pre-review-note-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "with-note-chirho",
        volumeChirho: "all-chirho"
      }],
      ["without-pre-review-note-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "without-note-chirho",
        volumeChirho: "all-chirho"
      }],
      ["pre-review-reason-gap-chirho", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        preReviewReasonChirho: "${RAW_HEBREW_PRE_REVIEW_REASON_MISSING_CURRENT_CHIRHO}",
        volumeChirho: "all-chirho"
      }],
      ["attribution-cleanup-chirho", {
        reviewStateChirho: "attribution-blocked-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        volumeChirho: "all-chirho"
      }],
      ["attribution-unchanged-chirho", {
        reviewStateChirho: "attribution-blocked-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        attributionTextChirho: "unchanged-chirho",
        volumeChirho: "all-chirho"
      }],
      ["attribution-changed-rereview-chirho", {
        reviewStateChirho: "attribution-rereview-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        attributionTextChirho: "changed-chirho",
        volumeChirho: "all-chirho"
      }],
      ${QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO.map((optionChirho) => `["script-only-${optionChirho.valueChirho}", {
        reviewStateChirho: "pending-chirho",
        validationStatusChirho: "all-chirho",
        tierChirho: "all-chirho",
        attentionChirho: "all-chirho",
        preReviewNoteChirho: "all-chirho",
        attributionTextChirho: "all-chirho",
        scriptChirho: "${optionChirho.valueChirho}",
        volumeChirho: "all-chirho"
      }]`).join(",\n      ")}
    ]);
    function syncFilterControlsChirho() {
      document.getElementById("review-state-filter-chirho").value = reviewStateFilterChirho;
      document.getElementById("validation-status-filter-chirho").value = validationStatusFilterChirho;
      document.getElementById("tier-filter-chirho").value = tierFilterChirho;
      document.getElementById("attention-filter-chirho").value = attentionFilterChirho;
      document.getElementById("pre-review-note-filter-chirho").value = preReviewNoteFilterChirho;
      document.getElementById("pre-review-reason-filter-chirho").value = preReviewReasonFilterChirho;
      document.getElementById("attribution-text-filter-chirho").value = attributionTextFilterChirho;
      document.getElementById("volume-filter-chirho").value = volumeFilterChirho;
      document.getElementById("script-filter-chirho").value = scriptFilterChirho;
      document.getElementById("exact-text-filter-chirho").value = exactTextFilterChirho;
    }
    function volumeFilterNumberForValueChirho(volumeValueChirho) {
      if (volumeValueChirho === "all-chirho") return null;
      const matchChirho = String(volumeValueChirho).match(/^vol-(\\d+)-chirho$/);
      return matchChirho ? Number.parseInt(matchChirho[1], 10) : null;
    }
    function volumeFilterNumberChirho() {
      return volumeFilterNumberForValueChirho(volumeFilterChirho);
    }
    function syncUrlChirho() {
      const paramsChirho = new URLSearchParams();
      if (reviewStateFilterChirho !== "pending-chirho") paramsChirho.set("review-state-chirho", reviewStateFilterChirho);
      if (validationStatusFilterChirho !== "all-chirho") paramsChirho.set("validation-status-chirho", validationStatusFilterChirho);
      if (tierFilterChirho !== "all-chirho") paramsChirho.set("tier-chirho", tierFilterChirho);
      if (attentionFilterChirho !== "all-chirho") paramsChirho.set("attention-chirho", attentionFilterChirho);
      if (preReviewNoteFilterChirho !== "all-chirho") paramsChirho.set("pre-review-note-chirho", preReviewNoteFilterChirho);
      if (preReviewReasonFilterChirho !== "all-chirho") paramsChirho.set("pre-review-reason-chirho", preReviewReasonFilterChirho);
      if (attributionTextFilterChirho !== "all-chirho") paramsChirho.set("attribution-text-chirho", attributionTextFilterChirho);
      if (volumeFilterChirho !== "all-chirho") paramsChirho.set("volume-chirho", volumeFilterChirho);
      if (scriptFilterChirho !== "all-chirho") paramsChirho.set("script-chirho", scriptFilterChirho);
      if (exactTextFilterChirho !== "") paramsChirho.set("exact-text-chirho", exactTextFilterChirho);
      const itemChirho = currentItemChirho();
      if (itemChirho) paramsChirho.set("item-chirho", itemChirho.keyChirho);
      const queryChirho = paramsChirho.toString();
      window.history.replaceState(null, "", queryChirho ? window.location.pathname + "?" + queryChirho : window.location.pathname);
    }
    function validationFreshForItemChirho(rowChirho, itemChirho) {
      return rowChirho &&
        rowChirho.original_text_hash_chirho === itemChirho.originalTextHashChirho &&
        rowChirho.original_text_chirho === itemChirho.liveSpanTextChirho;
    }
    function validationLiveTextChangedForItemChirho(rowChirho, itemChirho) {
      return !!rowChirho &&
        (rowChirho.original_text_hash_chirho !== itemChirho.originalTextHashChirho ||
          rowChirho.original_text_chirho !== itemChirho.liveSpanTextChirho);
    }
    function attributionRereviewUrlChirho(itemChirho) {
      return "/?review-state-chirho=attribution-rereview-chirho&item-chirho=" + encodeURIComponent(itemChirho.keyChirho);
    }
    function validationRowHasSavedVerdictChirho(rowChirho) {
      if (!rowChirho) return false;
      if (rowChirho.verdict_chirho === "reviewed-clean-chirho") return rowChirho.certify_clean_chirho === 1;
      return rowChirho.verdict_chirho === "reviewed-issues-chirho";
    }
    function validationCountsAsSavedForItemChirho(rowChirho, itemChirho) {
      if (itemChirho.validationStatusChirho === "attribution-blocked-chirho") {
        return validationRowHasSavedVerdictChirho(rowChirho);
      }
      if (!validationFreshForItemChirho(rowChirho, itemChirho)) return false;
      return validationRowHasSavedVerdictChirho(rowChirho);
    }
    function validationCountsAsIssueForItemChirho(rowChirho, itemChirho) {
      return validationFreshForItemChirho(rowChirho, itemChirho) &&
        rowChirho.verdict_chirho === "reviewed-issues-chirho";
    }
    function validationCountsAsAttributionBlockedForItemChirho(rowChirho, itemChirho) {
      return validationRowHasSavedVerdictChirho(rowChirho) &&
        (itemChirho.validationStatusChirho === "attribution-blocked-chirho" || validationFreshForItemChirho(rowChirho, itemChirho)) &&
        certifyingReviewerAttributionErrorChirho(rowChirho.reviewer_chirho) !== null;
    }
    function reviewStateAllowsSubmitChirho() {
      return reviewStateFilterChirho === "pending-chirho" || reviewStateFilterChirho === "attribution-rereview-chirho";
    }
    function reviewStateAllowsUndoChirho() {
      return reviewStateFilterChirho === "pending-chirho";
    }
    function reviewStateAllowsTypewriterChirho() {
      return reviewStateAllowsSubmitChirho();
    }
    function reviewStateIsAttributionModeChirho() {
      return reviewStateFilterChirho === "attribution-blocked-chirho" || reviewStateFilterChirho === "attribution-rereview-chirho";
    }
    function reviewStateValueIsAttributionModeChirho(reviewStateValueChirho) {
      return reviewStateValueChirho === "attribution-blocked-chirho" || reviewStateValueChirho === "attribution-rereview-chirho";
    }
    function validationVisibleForReviewStateValueChirho(itemChirho, reviewStateValueChirho) {
      const rowChirho = validationsChirho.get(itemChirho.keyChirho);
      if (reviewStateValueChirho === "pending-chirho") {
        return !validationCountsAsSavedForItemChirho(rowChirho, itemChirho);
      }
      if (reviewStateValueChirho === "saved-issues-chirho") {
        return validationCountsAsIssueForItemChirho(rowChirho, itemChirho);
      }
      if (reviewStateValueChirho === "attribution-blocked-chirho") {
        return validationCountsAsAttributionBlockedForItemChirho(rowChirho, itemChirho);
      }
      if (reviewStateValueChirho === "attribution-rereview-chirho") {
        return validationCountsAsAttributionBlockedForItemChirho(rowChirho, itemChirho);
      }
      return false;
    }
    function validationVisibleForReviewStateChirho(itemChirho) {
      return validationVisibleForReviewStateValueChirho(itemChirho, reviewStateFilterChirho);
    }
    function displayGuardForItemChirho(itemChirho) {
      return {
        expectedLiveSpanTextChirho: itemChirho.liveSpanTextChirho,
        expectedReportTextChirho: itemChirho.textChirho,
        expectedLineTextChirho: itemChirho.lineTextChirho,
        expectedValidationStatusChirho: itemChirho.validationStatusChirho,
        expectedCurrentScriptChirho: itemChirho.currentScriptChirho,
        expectedOriginalTextHashChirho: itemChirho.originalTextHashChirho,
        expectedSpanXMinPxChirho: itemChirho.spanXMinPxChirho,
        expectedSpanWidthPxChirho: itemChirho.spanWidthPxChirho,
        expectedLineWidthPxChirho: itemChirho.lineWidthPxChirho,
        expectedLineHeightPxChirho: itemChirho.lineHeightPxChirho,
        expectedLineImageHashChirho: itemChirho.lineImageHashChirho,
        expectedLineImageWidthPxChirho: itemChirho.lineImageWidthPxChirho,
        expectedLineImageHeightPxChirho: itemChirho.lineImageHeightPxChirho
      };
    }
    function latestValidationGuardChirho() {
      const latestChirho = validationRowsChirho[0] ?? null;
      return {
        expectedLatestValidationIdChirho: latestChirho?.id_chirho ?? null,
        expectedLatestValidationKeyChirho: latestChirho?.key_chirho ?? null,
        expectedLatestValidationReviewerChirho: latestChirho?.reviewer_chirho ?? null,
        expectedLatestValidationUpdatedAtChirho: latestChirho?.updated_at_chirho ?? null
      };
    }
    function itemMatchesFilterValuesChirho(itemChirho, filtersChirho) {
      const volumeChirho = volumeFilterNumberForValueChirho(filtersChirho.volumeChirho);
      const hasPreReviewNoteChirho = typeof itemChirho.preReviewNoteChirho === "string" && itemChirho.preReviewNoteChirho.length > 0;
      const preReviewReasonChirho = filtersChirho.preReviewReasonChirho ?? "all-chirho";
      const hasPreReviewReasonGapChirho = Array.isArray(itemChirho.preReviewMissingAttentionKindsChirho) &&
        itemChirho.preReviewMissingAttentionKindsChirho.length > 0;
      const attributionTextChirho = filtersChirho.attributionTextChirho ?? "all-chirho";
      const attributionTextFilterAppliesChirho = reviewStateValueIsAttributionModeChirho(filtersChirho.reviewStateChirho);
      const exactTextChirho = filtersChirho.exactTextChirho ?? "";
      const scriptChirho = filtersChirho.scriptChirho ?? "all-chirho";
      return validationVisibleForReviewStateValueChirho(itemChirho, filtersChirho.reviewStateChirho) &&
        (filtersChirho.validationStatusChirho === "all-chirho" || itemChirho.validationStatusChirho === filtersChirho.validationStatusChirho) &&
        (filtersChirho.tierChirho === "all-chirho" || itemChirho.tierChirho === filtersChirho.tierChirho) &&
        (filtersChirho.attentionChirho === "all-chirho" || itemChirho.attentionKindsChirho.includes(filtersChirho.attentionChirho)) &&
        (filtersChirho.preReviewNoteChirho === "all-chirho" ||
          (filtersChirho.preReviewNoteChirho === "with-note-chirho" && hasPreReviewNoteChirho) ||
          (filtersChirho.preReviewNoteChirho === "without-note-chirho" && !hasPreReviewNoteChirho)) &&
        (preReviewReasonChirho === "all-chirho" ||
          (preReviewReasonChirho === "${RAW_HEBREW_PRE_REVIEW_REASON_MISSING_CURRENT_CHIRHO}" && hasPreReviewReasonGapChirho)) &&
        (!attributionTextFilterAppliesChirho ||
          attributionTextChirho === "all-chirho" ||
          itemChirho.attributionTextStateChirho === attributionTextChirho) &&
        (volumeChirho === null || itemChirho.volumeChirho === volumeChirho) &&
        (scriptChirho === "all-chirho" || itemChirho.currentScriptChirho === scriptChirho) &&
        (exactTextChirho === "" || itemChirho.liveSpanTextChirho === exactTextChirho);
    }
    function activeQueueChirho() {
      return queueChirho.filter((itemChirho) =>
        itemMatchesFilterValuesChirho(itemChirho, {
          reviewStateChirho: reviewStateFilterChirho,
          validationStatusChirho: validationStatusFilterChirho,
          tierChirho: tierFilterChirho,
          attentionChirho: attentionFilterChirho,
          preReviewNoteChirho: preReviewNoteFilterChirho,
          preReviewReasonChirho: preReviewReasonFilterChirho,
          attributionTextChirho: attributionTextFilterChirho,
          volumeChirho: volumeFilterChirho,
          scriptChirho: scriptFilterChirho,
          exactTextChirho: exactTextFilterChirho
        })
      );
    }
    function repeatClusterItemsChirho(itemChirho) {
      return queueChirho.filter((candidateChirho) =>
        validationVisibleForReviewStateChirho(candidateChirho) &&
        candidateChirho.liveSpanTextChirho === itemChirho.liveSpanTextChirho &&
        candidateChirho.currentScriptChirho === itemChirho.currentScriptChirho
      );
    }
    function exactTextClusterUrlChirho(itemChirho) {
      const paramsChirho = new URLSearchParams();
      if (reviewStateFilterChirho !== "pending-chirho") paramsChirho.set("review-state-chirho", reviewStateFilterChirho);
      paramsChirho.set("exact-text-chirho", itemChirho.liveSpanTextChirho);
      paramsChirho.set("item-chirho", itemChirho.keyChirho);
      return window.location.pathname + "?" + paramsChirho.toString();
    }
    function repeatClusterTextChirho(itemChirho) {
      const clusterCountChirho = repeatClusterItemsChirho(itemChirho).length;
      if (clusterCountChirho <= 1) {
        return "Singleton exact live text for this script/review state. Planning aid only; every item still needs exact print certification or an explicit issue.";
      }
      return clusterCountChirho +
        " current item(s) share this exact live text/script/review state. Planning aid only; every item still needs exact print certification or an explicit issue.";
    }
    function updateLaneShortcutCountsChirho() {
      for (const linkChirho of document.querySelectorAll("[data-lane-shortcut-chirho]")) {
        const shortcutIdChirho = linkChirho.getAttribute("data-lane-shortcut-chirho");
        const countNodeChirho = linkChirho.querySelector(".lane-shortcut-count-chirho");
        const filtersChirho = laneShortcutFiltersByIdChirho.get(shortcutIdChirho);
        if (!countNodeChirho || !filtersChirho) continue;
        const countChirho = queueChirho.filter((itemChirho) => itemMatchesFilterValuesChirho(itemChirho, filtersChirho)).length;
        countNodeChirho.textContent = "(" + countChirho + ")";
      }
    }
    function activeIndexForItemKeyChirho(itemKeyChirho) {
      if (typeof itemKeyChirho !== "string" || itemKeyChirho.length === 0) return -1;
      return activeQueueChirho().findIndex((itemChirho) => itemChirho.keyChirho === itemKeyChirho);
    }
    function applyRequestedItemKeyChirho() {
      let requestedIndexChirho = activeIndexForItemKeyChirho(requestedItemKeyChirho);
      const requestedItemChirho = queueChirho.find((itemChirho) => itemChirho.keyChirho === requestedItemKeyChirho);
      if (requestedIndexChirho < 0 && requestedItemChirho) {
        let changedFiltersChirho = false;
        const requestedValidationChirho = validationsChirho.get(requestedItemChirho.keyChirho);
        const requestedIssueChirho = validationCountsAsIssueForItemChirho(requestedValidationChirho, requestedItemChirho);
        const requestedSavedChirho = validationCountsAsSavedForItemChirho(requestedValidationChirho, requestedItemChirho);
        const requestedAttributionBlockedChirho = validationCountsAsAttributionBlockedForItemChirho(requestedValidationChirho, requestedItemChirho);
        const volumeChirho = volumeFilterNumberChirho();
        if (reviewStateFilterChirho === "pending-chirho" && requestedAttributionBlockedChirho) {
          reviewStateFilterChirho = "attribution-blocked-chirho";
          changedFiltersChirho = true;
        } else if (reviewStateFilterChirho === "pending-chirho" && requestedIssueChirho) {
          reviewStateFilterChirho = "saved-issues-chirho";
          changedFiltersChirho = true;
        } else if (reviewStateFilterChirho === "saved-issues-chirho" && !requestedIssueChirho) {
          reviewStateFilterChirho = requestedAttributionBlockedChirho ? "attribution-blocked-chirho" : "pending-chirho";
          changedFiltersChirho = true;
        } else if (reviewStateFilterChirho === "attribution-blocked-chirho" && !requestedAttributionBlockedChirho) {
          reviewStateFilterChirho = requestedIssueChirho ? "saved-issues-chirho" : "pending-chirho";
          changedFiltersChirho = true;
        } else if (reviewStateFilterChirho === "attribution-rereview-chirho" && !requestedAttributionBlockedChirho) {
          reviewStateFilterChirho = requestedIssueChirho ? "saved-issues-chirho" : "pending-chirho";
          changedFiltersChirho = true;
        } else if (reviewStateFilterChirho !== "pending-chirho" && !requestedSavedChirho) {
          reviewStateFilterChirho = "pending-chirho";
          changedFiltersChirho = true;
        }
        if (validationStatusFilterChirho !== "all-chirho" && requestedItemChirho.validationStatusChirho !== validationStatusFilterChirho) {
          validationStatusFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (tierFilterChirho !== "all-chirho" && requestedItemChirho.tierChirho !== tierFilterChirho) {
          tierFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (attentionFilterChirho !== "all-chirho" && !requestedItemChirho.attentionKindsChirho.includes(attentionFilterChirho)) {
          attentionFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (preReviewNoteFilterChirho === "with-note-chirho" && !(typeof requestedItemChirho.preReviewNoteChirho === "string" && requestedItemChirho.preReviewNoteChirho.length > 0)) {
          preReviewNoteFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (preReviewNoteFilterChirho === "without-note-chirho" && typeof requestedItemChirho.preReviewNoteChirho === "string" && requestedItemChirho.preReviewNoteChirho.length > 0) {
          preReviewNoteFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (
          preReviewReasonFilterChirho === "${RAW_HEBREW_PRE_REVIEW_REASON_MISSING_CURRENT_CHIRHO}" &&
          (!Array.isArray(requestedItemChirho.preReviewMissingAttentionKindsChirho) ||
            requestedItemChirho.preReviewMissingAttentionKindsChirho.length === 0)
        ) {
          preReviewReasonFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (
          attributionTextFilterChirho !== "all-chirho" &&
          requestedAttributionBlockedChirho &&
          requestedItemChirho.attributionTextStateChirho !== attributionTextFilterChirho
        ) {
          attributionTextFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (volumeChirho !== null && requestedItemChirho.volumeChirho !== volumeChirho) {
          volumeFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (scriptFilterChirho !== "all-chirho" && requestedItemChirho.currentScriptChirho !== scriptFilterChirho) {
          scriptFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (exactTextFilterChirho !== "" && requestedItemChirho.liveSpanTextChirho !== exactTextFilterChirho) {
          exactTextFilterChirho = "";
          changedFiltersChirho = true;
        }
        if (changedFiltersChirho) syncFilterControlsChirho();
        requestedIndexChirho = activeIndexForItemKeyChirho(requestedItemKeyChirho);
      }
      if (requestedIndexChirho >= 0) indexChirho = requestedIndexChirho;
      requestedItemKeyChirho = null;
    }
    function currentItemChirho() { return activeQueueChirho()[indexChirho]; }
    function clampIndexChirho(valueChirho) {
      const maxIndexChirho = Math.max(0, activeQueueChirho().length - 1);
      indexChirho = Math.min(Math.max(0, valueChirho), maxIndexChirho);
    }
    function moveIndexChirho(deltaChirho) {
      clampIndexChirho(indexChirho + deltaChirho);
      renderChirho();
    }
    const hebrewTypewriterMarksChirho = [
      { labelChirho: "◌ֽ", valueChirho: "ֽ", titleChirho: "Meteg U+05BD" },
      { labelChirho: "־", valueChirho: "־", titleChirho: "Maqqef U+05BE" },
      { labelChirho: "׃", valueChirho: "׃", titleChirho: "Sof pasuq U+05C3" },
      { labelChirho: "◌ְ", valueChirho: "ְ", titleChirho: "Sheva U+05B0" },
      { labelChirho: "◌ֱ", valueChirho: "ֱ", titleChirho: "Hataf segol U+05B1" },
      { labelChirho: "◌ֲ", valueChirho: "ֲ", titleChirho: "Hataf patah U+05B2" },
      { labelChirho: "◌ֳ", valueChirho: "ֳ", titleChirho: "Hataf qamats U+05B3" },
      { labelChirho: "◌ִ", valueChirho: "ִ", titleChirho: "Hiriq U+05B4" },
      { labelChirho: "◌ֵ", valueChirho: "ֵ", titleChirho: "Tsere U+05B5" },
      { labelChirho: "◌ֶ", valueChirho: "ֶ", titleChirho: "Segol U+05B6" },
      { labelChirho: "◌ַ", valueChirho: "ַ", titleChirho: "Patah U+05B7" },
      { labelChirho: "◌ָ", valueChirho: "ָ", titleChirho: "Qamats U+05B8" },
      { labelChirho: "◌ׇ", valueChirho: "ׇ", titleChirho: "Qamats qatan U+05C7" },
      { labelChirho: "◌ֹ", valueChirho: "ֹ", titleChirho: "Holam U+05B9" },
      { labelChirho: "◌ֻ", valueChirho: "ֻ", titleChirho: "Qubuts U+05BB" },
      { labelChirho: "◌ּ", valueChirho: "ּ", titleChirho: "Dagesh U+05BC" },
      { labelChirho: "◌ׁ", valueChirho: "ׁ", titleChirho: "Shin dot U+05C1" },
      { labelChirho: "◌ׂ", valueChirho: "ׂ", titleChirho: "Sin dot U+05C2" },
      { labelChirho: "◌֖", valueChirho: "֖", titleChirho: "Tipcha U+0596" },
      { labelChirho: "◌֑", valueChirho: "֑", titleChirho: "Etnachta U+0591" }
    ];
    const combiningHebrewMarkReChirho = /[\u0591-\u05BD\u05BF-\u05C2\u05C4-\u05C5\u05C7]/u;
    const hebrewTypewriterTitleByValueChirho = new Map(
      hebrewTypewriterMarksChirho.map((markChirho) => [markChirho.valueChirho, markChirho.titleChirho])
    );
    const hebrewBaseLetterNameByValueChirho = new Map([
      ["א", "Hebrew letter alef"],
      ["ב", "Hebrew letter bet"],
      ["ג", "Hebrew letter gimel"],
      ["ד", "Hebrew letter dalet"],
      ["ה", "Hebrew letter he"],
      ["ו", "Hebrew letter vav"],
      ["ז", "Hebrew letter zayin"],
      ["ח", "Hebrew letter het"],
      ["ט", "Hebrew letter tet"],
      ["י", "Hebrew letter yod"],
      ["ך", "Hebrew letter final kaf"],
      ["כ", "Hebrew letter kaf"],
      ["ל", "Hebrew letter lamed"],
      ["ם", "Hebrew letter final mem"],
      ["מ", "Hebrew letter mem"],
      ["ן", "Hebrew letter final nun"],
      ["נ", "Hebrew letter nun"],
      ["ס", "Hebrew letter samekh"],
      ["ע", "Hebrew letter ayin"],
      ["ף", "Hebrew letter final pe"],
      ["פ", "Hebrew letter pe"],
      ["ץ", "Hebrew letter final tsadi"],
      ["צ", "Hebrew letter tsadi"],
      ["ק", "Hebrew letter qof"],
      ["ר", "Hebrew letter resh"],
      ["ש", "Hebrew letter shin"],
      ["ת", "Hebrew letter tav"]
    ]);
    function charCountsChirho(valueChirho) {
      const countsChirho = new Map();
      for (const charChirho of Array.from(String(valueChirho ?? "").normalize("NFC"))) {
        countsChirho.set(charChirho, (countsChirho.get(charChirho) ?? 0) + 1);
      }
      return countsChirho;
    }
    function displayMarkChirho(charChirho) {
      return (combiningHebrewMarkReChirho.test(charChirho) ? "◌" : "") + charChirho;
    }
    function unicodeNamePartChirho(charChirho) {
      const baseLetterNameChirho = hebrewBaseLetterNameByValueChirho.get(charChirho);
      if (baseLetterNameChirho) return " " + baseLetterNameChirho;
      const markTitleChirho = hebrewTypewriterTitleByValueChirho.get(charChirho);
      return markTitleChirho ? " " + markTitleChirho.replace(/\\s+U\\+[0-9A-F]+$/u, "") : "";
    }
    function displayValueChirho(valueChirho) {
      // Internal identifiers keep their -chirho suffix; reviewer-visible diagnostics drop it.
      return String(valueChirho ?? "").replace(/-chirho\\b/gu, "");
    }
    function codepointTextChirho(valueChirho) {
      const charsChirho = Array.from(String(valueChirho ?? "").normalize("NFC"));
      if (charsChirho.length === 0) return "(empty)";
      return charsChirho.map((charChirho) => {
        const codepointChirho = charChirho.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
        return "U+" + codepointChirho + " " + displayMarkChirho(charChirho) + unicodeNamePartChirho(charChirho);
      }).join(" | ");
    }
    function namedMarkDeltasChirho(fromTextChirho, toTextChirho) {
      const fromCountsChirho = charCountsChirho(fromTextChirho);
      const toCountsChirho = charCountsChirho(toTextChirho);
      const marksChirho = [];
      for (const [charChirho, toCountChirho] of toCountsChirho.entries()) {
        const titleChirho = hebrewTypewriterTitleByValueChirho.get(charChirho);
        if (!titleChirho) continue;
        const extraCountChirho = toCountChirho - (fromCountsChirho.get(charChirho) ?? 0);
        for (let indexChirho = 0; indexChirho < extraCountChirho; indexChirho++) {
          marksChirho.push("Add " + titleChirho + " " + displayMarkChirho(charChirho));
        }
      }
      for (const [charChirho, fromCountChirho] of fromCountsChirho.entries()) {
        const titleChirho = hebrewTypewriterTitleByValueChirho.get(charChirho);
        if (!titleChirho) continue;
        const removedCountChirho = fromCountChirho - (toCountsChirho.get(charChirho) ?? 0);
        for (let indexChirho = 0; indexChirho < removedCountChirho; indexChirho++) {
          marksChirho.push("Remove " + titleChirho + " " + displayMarkChirho(charChirho));
        }
      }
      return marksChirho;
    }
    function suggestedMarkDeltaTextChirho(fromTextChirho, toTextChirho) {
      const marksChirho = namedMarkDeltasChirho(fromTextChirho, toTextChirho);
      return marksChirho.length > 0 ? marksChirho.join("; ") : "No named typewriter mark additions/removals detected";
    }
    function preReviewCoveredAttentionKindChirho(noteChirho, kindChirho) {
      const normalizedNoteChirho = String(noteChirho || "").toLowerCase();
      if (kindChirho === "${RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO}") return normalizedNoteChirho.includes("low direct-read confidence") || normalizedNoteChirho.includes("low-confidence");
      if (kindChirho === "${RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO}") return normalizedNoteChirho.includes("confident direct-read disagreement") || normalizedNoteChirho.includes("direct-read disagreement");
      if (kindChirho === "${RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO}") return normalizedNoteChirho.includes("multi-token");
      if (kindChirho === "${RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO}") return normalizedNoteChirho.includes("delimiter") || normalizedNoteChirho.includes("damaged-text");
      if (kindChirho === "${RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO}") return normalizedNoteChirho.includes("no direct") || normalizedNoteChirho.includes("no-direct");
      return false;
    }
    function attentionKindLabelChirho(kindChirho) {
      if (kindChirho === "${RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO}") return "low direct-read confidence";
      if (kindChirho === "${RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO}") return "confident direct-read disagreement";
      if (kindChirho === "${RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO}") return "multi-token Hebrew span";
      if (kindChirho === "${RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO}") return "delimiter/damaged-text notation";
      if (kindChirho === "${RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO}") return "no direct CRNN crop read";
      return String(kindChirho || "unknown attention kind");
    }
    function preReviewMissingAttentionKindsChirho(itemChirho) {
      if (Array.isArray(itemChirho.preReviewMissingAttentionKindsChirho)) return itemChirho.preReviewMissingAttentionKindsChirho;
      if (typeof itemChirho.preReviewNoteChirho !== "string" || itemChirho.preReviewNoteChirho.length === 0) return [];
      return itemChirho.attentionKindsChirho.filter((kindChirho) =>
        !preReviewCoveredAttentionKindChirho(itemChirho.preReviewNoteChirho, kindChirho)
      );
    }
    function preReviewMissingAttentionLabelsChirho(itemChirho) {
      if (Array.isArray(itemChirho.preReviewMissingAttentionLabelsChirho)) return itemChirho.preReviewMissingAttentionLabelsChirho;
      return preReviewMissingAttentionKindsChirho(itemChirho).map(attentionKindLabelChirho);
    }
    function pendingReviewIssueFlagsChirho() {
      return Array.from(document.querySelectorAll(".issue-checkbox-chirho:checked"))
        .map((inputChirho) => inputChirho.value);
    }
    function pendingReviewNotesChirho() {
      return document.getElementById("notes-chirho")?.value ?? "";
    }
    function pendingReviewHasEditedTextChirho(itemChirho) {
      const editChirho = document.getElementById("edit-chirho");
      return !!editChirho && editChirho.value.normalize("NFC") !== String(itemChirho.liveSpanTextChirho ?? "").normalize("NFC");
    }
    function pendingReviewWouldBeCleanChirho(itemChirho) {
      return !pendingReviewHasEditedTextChirho(itemChirho) && pendingReviewIssueFlagsChirho().length === 0;
    }
    function cleanReviewAcknowledgedChirho() {
      return document.getElementById("certify-clean-chirho")?.checked === true;
    }
    function currentScriptVerdictChirho() {
      return document.querySelector("input[name='script-verdict-chirho']:checked")?.value ?? "";
    }
    function rawReviewActionMessagesChirho(itemChirho) {
      const issueFlagsChirho = pendingReviewIssueFlagsChirho();
      const hasIssueFlagChirho = issueFlagsChirho.length > 0;
      const messagesChirho = [];
      const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(currentReviewerChirho());
      if (reviewerErrorChirho) messagesChirho.push(reviewerErrorChirho);
      if (pendingRepairHasChangesChirho(itemChirho) && !issueFlagsChirho.includes("segmentation-chirho")) {
        messagesChirho.push("a changed box draft needs the Segmentation issue flag; it cannot certify the original box clean");
      }
      if (pendingReviewWouldBeCleanChirho(itemChirho) && !cleanReviewAcknowledgedChirho()) {
        messagesChirho.push("clean review needs the clean-certification checkbox");
      }
      if (hasIssueFlagChirho) {
        if (cleanReviewAcknowledgedChirho()) {
          messagesChirho.push("issue review cannot carry the clean-certification checkbox");
        }
        const notesErrorChirho = reviewNotesErrorChirho(pendingReviewNotesChirho());
        if (notesErrorChirho !== null) messagesChirho.push(notesErrorChirho);
      }
      if (pendingReviewHasEditedTextChirho(itemChirho) && !hasIssueFlagChirho) {
        messagesChirho.push("text changes need an issue box");
      }
      if (itemChirho.hasLiveSpanTextDriftChirho && !hasIssueFlagChirho) {
        messagesChirho.push("live text drift needs an issue box");
      }
      if (
        queueModeChirho === "unknown-script-chirho" &&
        currentScriptVerdictChirho().length === 0 &&
        !hasIssueFlagChirho &&
        !pendingReviewHasEditedTextChirho(itemChirho)
      ) {
        messagesChirho.push("unknown-script review needs a script verdict or issue box");
      }
      return messagesChirho;
    }
    function cleanReviewCanSubmitChirho(itemChirho) {
      const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(currentReviewerChirho());
      return reviewerErrorChirho === null &&
        rawReviewActionMessagesChirho(itemChirho).length === 0;
    }
    function cleanReviewActionTextChirho(itemChirho) {
      return pendingReviewWouldBeCleanChirho(itemChirho) ? "Accept as clean" : "Save issue";
    }
    async function loadValidationsChirho() {
      const responseChirho = await fetch("/api-chirho/validations-chirho");
      const dataChirho = await responseChirho.json();
      validationRowsChirho = dataChirho.validationsChirho;
      validationsChirho = new Map(validationRowsChirho.map((rowChirho) => [rowChirho.key_chirho, rowChirho]));
      clampIndexChirho(indexChirho);
    }
    function setStatusChirho(messageChirho) { document.getElementById("status-chirho").textContent = messageChirho; }
    function currentPositionTextChirho(activeCountChirho) {
      return activeCountChirho === 0 ? "item 0 of 0" : "item " + (indexChirho + 1) + " of " + activeCountChirho;
    }
    async function copyTextChirho(valueChirho, successMessageChirho, failureMessageChirho) {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(valueChirho);
        setStatusChirho(successMessageChirho);
      } catch (_errorChirho) {
        const textareaChirho = document.createElement("textarea");
        textareaChirho.value = valueChirho;
        textareaChirho.style.position = "fixed";
        textareaChirho.style.left = "-9999px";
        document.body.appendChild(textareaChirho);
        textareaChirho.select();
        const copiedChirho = document.execCommand("copy");
        textareaChirho.remove();
        setStatusChirho(copiedChirho ? successMessageChirho : failureMessageChirho);
      }
    }
    async function copyCurrentLinkChirho() {
      await copyTextChirho(window.location.href, "Copied current item link", "Copy failed; URL bar already has current item link");
    }
    function commandTextValueChirho(commandTextOrProviderChirho) {
      return typeof commandTextOrProviderChirho === "function"
        ? commandTextOrProviderChirho()
        : String(commandTextOrProviderChirho);
    }
    function commandRowChirho(commandTextOrProviderChirho) {
      const commandTextNodeChirho = elChirho("div", {
        classChirho: "mono-chirho command-chirho",
        textChirho: commandTextValueChirho(commandTextOrProviderChirho)
      });
      const refreshCommandChirho = () => {
        commandTextNodeChirho.textContent = commandTextValueChirho(commandTextOrProviderChirho);
      };
      const copyButtonChirho = elChirho("button", { classChirho: "copy-command-chirho", type: "button", textChirho: "Copy command" });
      copyButtonChirho.addEventListener("click", () => {
        refreshCommandChirho();
        copyTextChirho(commandTextNodeChirho.textContent ?? "", "Copied command", "Copy failed; select the command text manually");
      });
      const rowChirho = elChirho("div", { classChirho: "command-row-chirho" }, [
        commandTextNodeChirho,
        copyButtonChirho
      ]);
      rowChirho.refreshCommandChirho = refreshCommandChirho;
      return rowChirho;
    }
    function refreshCommandRowsChirho(rootChirho) {
      for (const rowChirho of rootChirho.querySelectorAll(".command-row-chirho")) {
        if (typeof rowChirho.refreshCommandChirho === "function") rowChirho.refreshCommandChirho();
      }
    }
    function renderSummaryChirho() {
      const activeCountChirho = activeQueueChirho().length;
      const modeLabelChirho = reviewStateFilterChirho === "pending-chirho"
        ? "remaining"
        : reviewStateFilterChirho === "saved-issues-chirho"
          ? "saved issue row(s)"
          : reviewStateFilterChirho === "attribution-rereview-chirho"
            ? "attribution re-review row(s)"
            : "attribution-blocked row(s)";
      document.getElementById("summary-chirho").textContent =
        activeCountChirho + " " + modeLabelChirho + " in filter of " + queueChirho.length + " review spans, " +
        validationsChirho.size + " saved, " + currentPositionTextChirho(activeCountChirho);
      const filterLabelsChirho = Array.from(document.querySelectorAll(".queue-filters-chirho select"))
        .filter((selectChirho) => selectChirho.value !== "all-chirho")
        .map((selectChirho) => selectChirho.selectedOptions[0]?.textContent || "")
        .filter(Boolean);
      if (exactTextFilterChirho) filterLabelsChirho.push("Exact text: " + exactTextFilterChirho);
      document.getElementById("queue-context-chirho").textContent = filterLabelsChirho.join(" · ");
      updateLaneShortcutCountsChirho();
    }
    function witnessTextChirho(tokenChirho) {
      if (tokenChirho.witnessesChirho.length === 0) return "none";
      return tokenChirho.witnessesChirho
        .map((wChirho) => wChirho.sourceChirho + ": " + wChirho.textChirho + (wChirho.confidenceChirho == null ? "" : " @" + wChirho.confidenceChirho))
        .join(" | ");
    }
    function spanTextClassChirho(itemChirho) {
      return itemChirho.currentScriptChirho === "hebrew-chirho" || queueModeChirho === "hebrew-chirho"
        ? "hebrew-chirho"
        : "span-text-chirho";
    }
    function isRtlLineSegmentScriptChirho(scriptChirho) {
      return ["hebrew-chirho", "syriac-chirho", "arabic-chirho"].includes(String(scriptChirho ?? ""));
    }
    function lineSegmentConfidenceClassChirho(itemChirho, segmentChirho) {
      const segmentTextChirho = String(segmentChirho.utf8TextChirho ?? "").trim();
      const scriptChirho = String(segmentChirho.scriptChirho ?? "");
      const isTargetChirho = Number(segmentChirho.segmentIndexChirho) === Number(itemChirho.segmentIndexChirho);
      if (segmentTextChirho.length === 0 || scriptChirho === "unknown-script-chirho") return "line-confidence-questionable-chirho";
      if (isTargetChirho) {
        if (
          itemChirho.hasLiveSpanTextDriftChirho ||
          itemChirho.attentionKindsChirho.includes("${RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO}") ||
          itemChirho.attentionKindsChirho.includes("${RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO}") ||
          itemChirho.validationStatusChirho === "unvalidated-chirho"
        ) {
          return "line-confidence-questionable-chirho";
        }
        if (
          itemChirho.validationStatusChirho !== "all-token-validated-chirho" ||
          itemChirho.attentionKindsChirho.length > 0
        ) {
          return "line-confidence-borderline-chirho";
        }
        return "line-confidence-certain-chirho";
      }
      if (["hebrew-chirho", "greek-chirho", "syriac-chirho", "arabic-chirho"].includes(scriptChirho)) {
        return "line-confidence-borderline-chirho";
      }
      return "line-confidence-certain-chirho";
    }
    function lineSegmentConfidenceLabelChirho(confidenceClassChirho) {
      if (confidenceClassChirho === "line-confidence-certain-chirho") return "certain";
      if (confidenceClassChirho === "line-confidence-borderline-chirho") return "borderline";
      return "questionable";
    }
    function reconstructedLineTextChirho(itemChirho) {
      const lineChirho = elChirho("div", {
        classChirho: "line-text-chirho reconstructed-line-chirho",
        "aria-label": itemChirho.lineTextChirho
      });
      if (!Array.isArray(itemChirho.lineSegmentsChirho) || itemChirho.lineSegmentsChirho.length === 0) {
        lineChirho.textContent = itemChirho.lineTextChirho;
        return lineChirho;
      }
      for (const segmentChirho of itemChirho.lineSegmentsChirho) {
        const confidenceClassChirho = lineSegmentConfidenceClassChirho(itemChirho, segmentChirho);
        const segmentTextChirho = String(segmentChirho.utf8TextChirho ?? "").trim();
        const classesChirho = [
          "line-text-segment-chirho",
          confidenceClassChirho,
          Number(segmentChirho.segmentIndexChirho) === Number(itemChirho.segmentIndexChirho) ? "line-text-segment-target-chirho" : "",
          isRtlLineSegmentScriptChirho(segmentChirho.scriptChirho) ? "line-text-segment-rtl-chirho" : ""
        ].filter((valueChirho) => valueChirho.length > 0).join(" ");
        lineChirho.appendChild(elChirho("span", {
          classChirho: classesChirho,
          title: "segment " + segmentChirho.segmentIndexChirho + " · " +
            (segmentRepairScriptLabelsChirho[segmentChirho.scriptChirho] ?? displayValueChirho(segmentChirho.scriptChirho)) +
            " · " + lineSegmentConfidenceLabelChirho(confidenceClassChirho),
          textChirho: segmentTextChirho.length === 0 ? "(empty span)" : segmentTextChirho
        }));
      }
      return lineChirho;
    }
    function confidenceLegendChirho() {
      return elChirho("div", { classChirho: "confidence-legend-chirho" }, [
        elChirho("span", { textChirho: "Machine confidence, not verification:" }),
        elChirho("span", { classChirho: "confidence-legend-chip-chirho" }, [
          elChirho("span", { classChirho: "confidence-swatch-chirho line-confidence-certain-chirho" }),
          textChirho("high")
        ]),
        elChirho("span", { classChirho: "confidence-legend-chip-chirho" }, [
          elChirho("span", { classChirho: "confidence-swatch-chirho line-confidence-borderline-chirho" }),
          textChirho("borderline")
        ]),
        elChirho("span", { classChirho: "confidence-legend-chip-chirho" }, [
          elChirho("span", { classChirho: "confidence-swatch-chirho line-confidence-questionable-chirho" }),
          textChirho("questionable")
        ])
      ]);
    }
    function installFocusMagnifierChirho(targetWrapChirho, targetFrameChirho, focusRootChirho, itemChirho) {
      const baseWidthChirho = Math.min(itemChirho.zoomCropWidthPxChirho * 2, 1040);
      const magnifiedWidthChirho = Math.min(Math.round(baseWidthChirho * 1.55), Math.max(baseWidthChirho, 1500));
      const centerTargetChirho = () => {
        const markerCenterPctChirho = itemChirho.zoomMarkerLeftPctChirho + itemChirho.zoomMarkerWidthPctChirho / 2;
        const targetCenterPxChirho = targetFrameChirho.clientWidth * markerCenterPctChirho / 100;
        targetWrapChirho.scrollLeft = Math.max(0, targetCenterPxChirho - targetWrapChirho.clientWidth / 2);
      };
      const setMagnifiedChirho = (enabledChirho) => {
        targetWrapChirho.classList.toggle("focus-magnify-chirho", enabledChirho);
        targetFrameChirho.style.maxWidth = enabledChirho ? "none" : "100%";
        targetFrameChirho.style.width = (enabledChirho ? magnifiedWidthChirho : baseWidthChirho) + "px";
        if (enabledChirho) window.requestAnimationFrame(centerTargetChirho);
      };
      focusRootChirho.addEventListener("focusin", (eventChirho) => {
        if (eventChirho.target?.matches?.("input, textarea, select, button")) setMagnifiedChirho(true);
      });
      focusRootChirho.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!focusRootChirho.contains(document.activeElement)) setMagnifiedChirho(false);
        }, 0);
      });
    }
    function focusPrimaryCorrectionChirho() {
      const editChirho = document.getElementById("edit-chirho");
      if (!editChirho || editChirho.hasAttribute("readonly")) return;
      editChirho.focus();
      editChirho.select();
    }
    function insertCorrectionTextChirho(valueChirho) {
      const editChirho = document.getElementById("edit-chirho");
      if (!editChirho) return;
      const selectionStartChirho = editChirho.selectionStart ?? editChirho.value.length;
      const selectionEndChirho = editChirho.selectionEnd ?? selectionStartChirho;
      editChirho.setRangeText(valueChirho, selectionStartChirho, selectionEndChirho, "end");
      editChirho.dispatchEvent(new Event("input", { bubbles: true }));
      editChirho.focus();
    }
    function typewriterChirho() {
      const wrapChirho = elChirho("div", { classChirho: "typewriter-chirho" });
      for (const markChirho of hebrewTypewriterMarksChirho) {
        const buttonChirho = elChirho("button", {
          classChirho: "typewriter-button-chirho",
          type: "button",
          title: markChirho.titleChirho,
          "aria-label": markChirho.titleChirho,
          textChirho: markChirho.labelChirho
        });
        if (!reviewStateAllowsTypewriterChirho()) {
          buttonChirho.disabled = true;
        } else {
          buttonChirho.addEventListener("click", () => insertCorrectionTextChirho(markChirho.valueChirho));
        }
        wrapChirho.appendChild(buttonChirho);
      }
      return wrapChirho;
    }
`;
}
