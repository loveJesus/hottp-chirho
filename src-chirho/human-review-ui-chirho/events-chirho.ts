// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

export function humanReviewEventsScriptChirho(): string {
  return `    let reviewWritePendingChirho = false;
    async function reviewWriteChirho(pathChirho, bodyChirho) {
      if (reviewWritePendingChirho) {
        setStatusChirho("A save is already in progress. Please wait for its result.");
        return null;
      }
      reviewWritePendingChirho = true;
      try {
        const responseChirho = await fetch(pathChirho, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyChirho)
        });
        const dataChirho = await responseChirho.json();
        if (!responseChirho.ok || dataChirho.okChirho !== true) {
          setStatusChirho(dataChirho.errorChirho || "Save was rejected. Your edits are still here.");
          return null;
        }
        return dataChirho;
      } catch (_errorChirho) {
        setStatusChirho("Could not confirm the save. Your edits are still here. Check saved state before retrying.");
        return null;
      } finally {
        reviewWritePendingChirho = false;
      }
    }
    async function saveSegmentRepairProposalChirho(itemChirho, kindSelectChirho, rationaleChirho, gridChirho, resultChirho) {
      const rowsChirho = repairRowsFromGridChirho(gridChirho);
      const dataChirho = await reviewWriteChirho("/api-chirho/segment-repair-proposal-chirho", {
          keyChirho: itemChirho.keyChirho,
          reviewStateChirho: reviewStateFilterChirho,
          repairKindChirho: kindSelectChirho.value,
          proposedSpansChirho: rowsChirho,
          rationaleChirho: rationaleChirho.value,
          reviewerChirho: currentReviewerChirho(),
          ...displayGuardForItemChirho(itemChirho)
      });
      if (dataChirho === null) {
        resultChirho.textContent = document.getElementById("status-chirho").textContent;
        return;
      }
      setStatusChirho("Saved draft segment repair proposal " + dataChirho.proposalChirho.proposalIdChirho + "; no live span text was changed.");
      resultChirho.textContent = JSON.stringify(dataChirho.proposalChirho, null, 2);
    }
    async function submitReviewChirho() {
      if (!reviewStateAllowsSubmitChirho()) {
        setStatusChirho(reviewStateIsAttributionModeChirho() ? "Attribution-blocked view is read-only" : "Saved issue view is read-only");
        return;
      }
      const itemChirho = currentItemChirho();
      if (!itemChirho) return;
      const correctedTextChirho = document.getElementById("edit-chirho").value;
      const notesChirho = document.getElementById("notes-chirho").value;
      const reviewerValueChirho = currentReviewerChirho();
      const issueFlagsChirho = Array.from(document.querySelectorAll(".issue-checkbox-chirho:checked"))
        .map((inputChirho) => inputChirho.value);
      const scriptVerdictChirho = document.querySelector("input[name='script-verdict-chirho']:checked")?.value ?? "";
      const actionMessagesChirho = rawReviewActionMessagesChirho(itemChirho);
      if (actionMessagesChirho.length > 0) {
        setStatusChirho(actionMessagesChirho.join("; "));
        return;
      }
      reviewerChirho = reviewerValueChirho;
      persistReviewerChirho(reviewerChirho);
      const dataChirho = await reviewWriteChirho("/api-chirho/submit-chirho", {
          keyChirho: itemChirho.keyChirho,
          issueFlagsChirho,
          correctedTextChirho,
          notesChirho,
          scriptVerdictChirho,
          reviewerChirho,
          certifyCleanChirho: cleanReviewAcknowledgedChirho(),
          supersedeAttributionBlockedChirho: reviewStateFilterChirho === "attribution-rereview-chirho",
          ...displayGuardForItemChirho(itemChirho)
      });
      if (dataChirho === null) return;
      validationRowsChirho = [
        dataChirho.rowChirho,
        ...validationRowsChirho.filter((rowChirho) => rowChirho.key_chirho !== itemChirho.keyChirho)
      ];
      validationsChirho.set(itemChirho.keyChirho, dataChirho.rowChirho);
      setStatusChirho("Saved " + dataChirho.rowChirho.verdict_chirho);
      clampIndexChirho(indexChirho);
      focusCorrectionAfterRenderChirho = true;
      renderChirho();
    }
    async function undoLastChirho() {
      if (!reviewStateAllowsUndoChirho()) {
        setStatusChirho("Saved issue view is read-only");
        return;
      }
      const dataChirho = await reviewWriteChirho("/api-chirho/undo-last-chirho", latestValidationGuardChirho());
      if (dataChirho === null) return;
      await loadValidationsChirho();
      setStatusChirho("Undone");
      renderChirho();
    }
    document.addEventListener("keydown", (eventChirho) => {
      const keyChirho = eventChirho.key.toLowerCase();
      if ((eventChirho.ctrlKey || eventChirho.metaKey) && keyChirho === "enter" && reviewStateAllowsSubmitChirho()) {
        eventChirho.preventDefault();
        if (document.getElementById("app-chirho").dataset.reviewModeChirho === "repair-chirho") {
          const saveChirho = document.getElementById("save-repair-chirho");
          if (saveChirho && !saveChirho.disabled) saveChirho.click();
          else setStatusChirho("Finish the box geometry and explain the repair before saving a draft.");
          return;
        }
        submitReviewChirho();
        return;
      }
      if (eventChirho.target?.closest("textarea, input, select, button, a, summary, [role='button']")) return;
      if (keyChirho === "u" && reviewStateAllowsUndoChirho()) undoLastChirho();
      if (keyChirho === "arrowright") moveIndexChirho(1);
      if (keyChirho === "arrowleft") moveIndexChirho(-1);
    });
    document.getElementById("prev-chirho").addEventListener("click", () => moveIndexChirho(-1));
    document.getElementById("next-chirho").addEventListener("click", () => moveIndexChirho(1));
    document.getElementById("copy-link-chirho").addEventListener("click", () => copyCurrentLinkChirho());
    document.getElementById("review-state-filter-chirho").addEventListener("change", (eventChirho) => {
      reviewStateFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("validation-status-filter-chirho").addEventListener("change", (eventChirho) => {
      validationStatusFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("tier-filter-chirho").addEventListener("change", (eventChirho) => {
      tierFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("attention-filter-chirho").addEventListener("change", (eventChirho) => {
      attentionFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("pre-review-note-filter-chirho").addEventListener("change", (eventChirho) => {
      preReviewNoteFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("pre-review-reason-filter-chirho").addEventListener("change", (eventChirho) => {
      preReviewReasonFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("attribution-text-filter-chirho").addEventListener("change", (eventChirho) => {
      attributionTextFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("volume-filter-chirho").addEventListener("change", (eventChirho) => {
      volumeFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("script-filter-chirho").addEventListener("change", (eventChirho) => {
      scriptFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("exact-text-filter-chirho").addEventListener("input", (eventChirho) => {
      exactTextFilterChirho = eventChirho.target.value;
      requestedItemKeyChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    syncFilterControlsChirho();
    loadValidationsChirho().then(() => {
      applyRequestedItemKeyChirho();
      renderChirho();
    });
`;
}
