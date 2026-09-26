// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

export function humanReviewRenderScriptChirho(): string {
  return `    // Workflow: spec-chirho/workflows-chirho/raw-review-workflow-chirho.md
    function disclosureChirho(labelChirho, childrenChirho = []) {
      return elChirho("details", { classChirho: "disclosure-chirho" }, [
        elChirho("summary", { textChirho: labelChirho }), ...childrenChirho
      ]);
    }
    function howToReviewBoxChirho() {
      return disclosureChirho("How to review this item", [
        elChirho("div", { textChirho: "1. Compare the red box in the images below with Current text (red box)." }),
        elChirho("div", { textChirho: "2. Box in the right spot but the text is wrong: type the exact printed letters in Your correction." }),
        elChirho("div", { textChirho: "3. Box itself is wrong (on the wrong word, wrong position or size, or the text belongs to a different word): do not retype text. Check the Segmentation issue box or file a segment repair proposal below." }),
        elChirho("div", { textChirho: "4. Text and box both match the print exactly: check the clean-certification box and Save." })
      ]);
    }
    function renderChirho() {
      syncUrlChirho();
      const appChirho = document.getElementById("app-chirho");
      clearChirho(appChirho);
      clearChirho(document.getElementById("session-identity-chirho"));
      appChirho.dataset.reviewModeChirho = "text-chirho";
      renderSummaryChirho();
      const itemChirho = currentItemChirho();
      document.getElementById("item-context-chirho").textContent = itemChirho
        ? "Volume " + itemChirho.volumeChirho + " / Page " + itemChirho.pageChirho + " / Line " + itemChirho.lineIndexChirho
        : "No items in this queue";
      if (!itemChirho) {
        appChirho.appendChild(elChirho("div", { classChirho: "done-chirho", textChirho: "Queue complete." }));
        return;
      }

      const leftChirho = elChirho("div", { classChirho: "line-panel-chirho" });
      const savedValidationChirho = validationsChirho.get(itemChirho.keyChirho);
      const savedIssueFlagsChirho = new Set(parseJsonArrayChirho(savedValidationChirho?.issue_flags_chirho));
      leftChirho.appendChild(elChirho("h2", { classChirho: "panel-heading-chirho", textChirho: "1. Read the scan" }));
      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Target crop - red box is the item" }));
      const targetWrapChirho = elChirho("div", { classChirho: "target-image-wrap-chirho" });
      const targetFrameChirho = elChirho("div", { classChirho: "target-image-frame-chirho" });
      targetFrameChirho.style.width = Math.min(itemChirho.zoomCropWidthPxChirho * 2, 1040) + "px";
      const targetImageChirho = elChirho("img", { classChirho: "target-image-chirho", src: "/span-image-chirho/" + encodeURIComponent(itemChirho.keyChirho), alt: "Printed source around the selected word" });
      const targetMarkerChirho = elChirho("div", { classChirho: "span-marker-chirho" });
      targetMarkerChirho.style.left = itemChirho.zoomMarkerLeftPctChirho + "%";
      targetMarkerChirho.style.width = itemChirho.zoomMarkerWidthPctChirho + "%";
      targetMarkerChirho.style.top = itemChirho.zoomMarkerTopPctChirho + "%";
      targetMarkerChirho.style.height = itemChirho.zoomMarkerHeightPctChirho + "%";
      targetFrameChirho.appendChild(targetImageChirho);
      targetFrameChirho.appendChild(targetMarkerChirho);
      targetWrapChirho.appendChild(targetFrameChirho);
      leftChirho.appendChild(targetWrapChirho);
      leftChirho.appendChild(elChirho("div", { classChirho: "target-boundary-note-chirho", textChirho: targetBoundaryTextChirho(itemChirho) }));

      const targetRowChirho = elChirho("div", { classChirho: "box-chirho target-row-chirho review-primary-chirho" });
      targetRowChirho.appendChild(elChirho("h2", { classChirho: "panel-heading-chirho", textChirho: "2. Check the transcription" }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Current text (red box)" }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: itemChirho.liveSpanTextChirho }));
      if (itemChirho.hasLiveSpanTextDriftChirho) {
        targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Report text" }));
        targetRowChirho.appendChild(elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: itemChirho.textChirho }));
      }
      targetRowChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "edit-chirho", textChirho: "Your correction (optional - only when the print differs)" }));
      const editChirho = elChirho("textarea", { classChirho: "edit-chirho", id: "edit-chirho", "aria-describedby": "correction-help-chirho", spellcheck: "false" });
      editChirho.value = savedValidationChirho?.corrected_text_chirho ?? itemChirho.liveSpanTextChirho;
      editChirho.style.direction = isRtlLineSegmentScriptChirho(itemChirho.currentScriptChirho) ? "rtl" : "ltr";
      if (!reviewStateAllowsSubmitChirho()) editChirho.setAttribute("readonly", "true");
      targetRowChirho.appendChild(editChirho);
      targetRowChirho.appendChild(elChirho("div", { id: "correction-help-chirho", classChirho: "field-help-chirho", textChirho: "Correct text only if the red box covers the right word. If the box is wrong, use Box is wrong below." }));
      targetRowChirho.appendChild(disclosureChirho("Hebrew keyboard", [typewriterChirho()]));
      const editCodepointsChirho = elChirho("div", { id: "edit-codepoints-chirho", classChirho: "mono-chirho codepoints-chirho", textChirho: codepointTextChirho(editChirho.value) });
      const codepointsDetailsChildrenChirho = [
        elChirho("summary", { textChirho: "Unicode codepoints (exact character check)" }),
        elChirho("div", { classChirho: "label-chirho", textChirho: "Current text codepoints" }),
        elChirho("div", { classChirho: "mono-chirho codepoints-chirho", textChirho: codepointTextChirho(itemChirho.liveSpanTextChirho) })
      ];
      if (itemChirho.hasLiveSpanTextDriftChirho) {
        codepointsDetailsChildrenChirho.push(elChirho("div", { classChirho: "label-chirho", textChirho: "Report codepoints" }));
        codepointsDetailsChildrenChirho.push(elChirho("div", { classChirho: "mono-chirho codepoints-chirho", textChirho: codepointTextChirho(itemChirho.textChirho) }));
      }
      codepointsDetailsChildrenChirho.push(elChirho("div", { classChirho: "label-chirho", textChirho: "Correction codepoints" }));
      codepointsDetailsChildrenChirho.push(editCodepointsChirho);
      const characterDetailsChirho = elChirho("details", { classChirho: "codepoints-details-chirho" }, codepointsDetailsChildrenChirho);

      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Full line - red box in context" }));
      const imageWrapChirho = elChirho("div", { classChirho: "line-image-wrap-chirho" });
      const imageFrameChirho = elChirho("div", { classChirho: "line-image-frame-chirho" });
      imageFrameChirho.style.width = "100%";
      const imageChirho = elChirho("img", { classChirho: "line-image-chirho", src: "/line-image-chirho/" + encodeURIComponent(itemChirho.keyChirho), alt: "Full printed line with the selected region outlined" });
      const markerChirho = elChirho("div", { classChirho: "span-marker-chirho" });
      markerChirho.style.left = itemChirho.lineMarkerLeftPctChirho + "%";
      markerChirho.style.width = itemChirho.lineMarkerWidthPctChirho + "%";
      markerChirho.style.top = itemChirho.lineMarkerTopPctChirho + "%";
      markerChirho.style.height = itemChirho.lineMarkerHeightPctChirho + "%";
      imageFrameChirho.appendChild(imageChirho);
      imageFrameChirho.appendChild(markerChirho);
      imageWrapChirho.appendChild(imageFrameChirho);
      leftChirho.appendChild(imageWrapChirho);
      const lineTextRowChirho = elChirho("div", { classChirho: "target-row-chirho" });
      lineTextRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Full line text" }));
      lineTextRowChirho.appendChild(reconstructedLineTextChirho(itemChirho));
      lineTextRowChirho.appendChild(confidenceLegendChirho());
      leftChirho.appendChild(lineTextRowChirho);
      const segmentRepairBoxChirho = reviewStateAllowsSubmitChirho()
        ? segmentRepairProposalBoxChirho(itemChirho, targetMarkerChirho, targetFrameChirho)
        : null;

      const reviewColumnChirho = elChirho("aside", { classChirho: "review-column-chirho" });
      const sideChirho = elChirho("div", { classChirho: "side-chirho review-text-body-chirho" });
      const identityChirho = elChirho("div", { classChirho: "review-identity-chirho" });
      const showRepairChirho = (repairChirho) => {
        appChirho.dataset.reviewModeChirho = repairChirho ? "repair-chirho" : "text-chirho";
        if (segmentRepairBoxChirho) segmentRepairBoxChirho.open = true;
        for (const buttonChirho of reviewColumnChirho.querySelectorAll("[data-review-mode-button-chirho]")) {
          buttonChirho.setAttribute("aria-pressed", String(buttonChirho.dataset.reviewModeButtonChirho === appChirho.dataset.reviewModeChirho));
        }
      };
      if (segmentRepairBoxChirho) segmentRepairBoxChirho.showRepairChirho = () => showRepairChirho(true);
      if (segmentRepairBoxChirho) {
        const modeNavChirho = elChirho("div", { classChirho: "review-mode-nav-chirho", role: "group", "aria-label": "Review task" });
        for (const [modeChirho, labelChirho] of [["text-chirho", "Text review"], ["repair-chirho", "Box repair"]]) {
          const buttonChirho = elChirho("button", { type: "button", "data-review-mode-button-chirho": modeChirho, "aria-pressed": String(modeChirho === "text-chirho"), textChirho: labelChirho });
          buttonChirho.addEventListener("click", () => showRepairChirho(modeChirho === "repair-chirho"));
          modeNavChirho.appendChild(buttonChirho);
        }
        reviewColumnChirho.appendChild(modeNavChirho);
      }
      const referenceChirho = disclosureChirho("Machine evidence and technical details");
      const guidanceChirho = howToReviewBoxChirho();
      sideChirho.appendChild(targetRowChirho);
      referenceChirho.appendChild(characterDetailsChirho);
      if (queueModeChirho === "hebrew-chirho") {
        targetRowChirho.appendChild(elChirho("div", { classChirho: "field-help-chirho", textChirho: "Check every letter, vowel mark and word boundary against the scan. Machine agreement is not print verification." }));
        referenceChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Machine witnesses validate consonants only. Vowels and niqqud are UNVERIFIED even when consonants agree." }));
        guidanceChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: "Clean certification means letters, marks, punctuation, spacing, maqqef, word boundaries, and the red box all match the print. Multiple Hebrew words in one box are fine only when the box intentionally covers exactly those words."
        }));
      } else if (queueModeChirho === "suspect-text-chirho") {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "No issue boxes checked means this suspect-text warning is a false positive after source review." }));
      } else {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Choose a script only when the live text is usable for that script. Latin and symbol clean reviews certify the text; Hebrew, Greek, and Syriac clean reviews only resolve the script and still need script-specific text validation." }));
      }
      if (itemChirho.attentionReasonsChirho.length > 0) {
        referenceChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: "Attention flags: " + displayValueChirho(itemChirho.attentionReasonsChirho.join("; ")) + ". These are review-priority signals, not verdicts; inspect the Target crop - red box is the item and Full line - red box in context panels before any clean certification."
        }));
      }
      if (typeof itemChirho.preReviewNoteChirho === "string" && itemChirho.preReviewNoteChirho.length > 0) {
        const missingAttentionKindsChirho = preReviewMissingAttentionKindsChirho(itemChirho);
        referenceChirho.appendChild(elChirho("div", { classChirho: "box-chirho" }, [
          elChirho("div", { classChirho: "label-chirho", textChirho: "Non-certifying pre-review note" }),
          elChirho("div", {
            classChirho: "mono-chirho",
            style: "white-space:pre-wrap;font-size:12px;line-height:1.45;",
            textChirho: itemChirho.preReviewNoteChirho
          }),
          ...(missingAttentionKindsChirho.length === 0 ? [] : [
            elChirho("div", {
              classChirho: "warning-chirho",
              textChirho: "This older pre-review note does not mention current attention kind(s): " + preReviewMissingAttentionLabelsChirho(itemChirho).join(", ") + ". Treat it as location context only and review the current flags against the print."
            })
          ]),
          elChirho("div", {
            classChirho: "status-chirho",
            textChirho: "This note is a machine-assisted visual aid only. It is not a verdict; certify only from the Target crop - red box is the item and Full line - red box in context panels."
          })
        ]));
      }
      if (itemChirho.hasLiveSpanTextDriftChirho) {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Current text differs from this report. Check the relevant issue box; clean review is blocked." }));
      }
      if (reviewStateFilterChirho === "saved-issues-chirho" && savedValidationChirho) {
        sideChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: "Saved issue row shown read-only. Inspect the crop and use the guarded status-report correction command only after explicit confirmation."
        }));
        if (typeof itemChirho.wlcSuggestedTextChirho === "string" && itemChirho.wlcSuggestedTextChirho.length > 0) {
          const guardedCommandChirho = () =>
            "bun run apply-human-suggested-corrections-chirho -- --apply --certify-human " +
            "--reviewer-chirho=" + shellArgOrPlaceholderChirho(fieldValueChirho("wlc-command-reviewer-chirho"), "<explicit-human-reviewer-id-chirho>") + " " +
            "--validation-id-chirho=" + savedValidationChirho.id_chirho + " " +
            "--suggested-text-chirho=" + shellSingleQuoteChirho(itemChirho.wlcSuggestedTextChirho);
          const wlcReviewerInputChirho = elChirho("input", {
            id: "wlc-command-reviewer-chirho",
            classChirho: "reviewer-input-chirho",
            placeholder: "explicit-human-reviewer-id-chirho"
          });
          const suggestionBoxChirho = elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
            elChirho("div", { textChirho: "WLC suggestion" }),
            elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: itemChirho.wlcSuggestedTextChirho }),
            elChirho("div", { textChirho: "Marks to confirm" }),
            elChirho("div", { classChirho: "mono-chirho", textChirho: suggestedMarkDeltaTextChirho(itemChirho.liveSpanTextChirho, itemChirho.wlcSuggestedTextChirho) }),
            elChirho("div", { textChirho: "Source" }),
            elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.wlcSuggestionSourceChirho ?? "unknown-chirho" }),
            elChirho("div", { textChirho: "Reviewer for command" }),
            wlcReviewerInputChirho,
            elChirho("div", { textChirho: "Command helper note" }),
            elChirho("div", { classChirho: "command-helper-note-chirho", textChirho: "This helper field only updates the copied command; it does not save, apply, or certify." }),
            elChirho("div", { textChirho: "After confirmation" }),
            commandRowChirho(guardedCommandChirho)
          ]);
          wlcReviewerInputChirho.addEventListener("input", () => refreshCommandRowsChirho(suggestionBoxChirho));
          sideChirho.appendChild(suggestionBoxChirho);
        }
      }
      if (reviewStateIsAttributionModeChirho() && savedValidationChirho) {
        const attributionLiveTextChangedChirho = validationLiveTextChangedForItemChirho(savedValidationChirho, itemChirho);
        const attributionTextStateLabelChirho = attributionLiveTextChangedChirho
          ? "changed-live-text-chirho"
          : "unchanged-live-text-chirho";
        const attributionGateEffectTextChirho = attributionLiveTextChangedChirho
          ? "Fresh re-review can replace this generic row; the quick reattribution helper is intentionally omitted."
          : reviewStateFilterChirho === "attribution-blocked-chirho"
          ? "Guarded reattribution can fix attribution only; it does not certify new text, change the verdict, or change issue flags."
          : "Fresh re-review appends a new explicit human decision that supersedes the generic row.";
        sideChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: attributionLiveTextChangedChirho
            ? "Live text changed since this generic row was recorded. Use Attribution re-review by default; reattribute only after rechecking the current live text against the print."
            : reviewStateFilterChirho === "attribution-rereview-chirho"
            ? "Attribution re-review mode appends a fresh explicit human review that supersedes the generic row. Use this only when the old row is not genuinely attributable to one named reviewer."
            : "Attribution-blocked row shown read-only. Inspect the Target crop - red box is the item and Full line - red box in context panels; reattribute only if this existing row is genuinely attributable to the named human reviewer."
        }));
        sideChirho.appendChild(elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
          elChirho("div", { textChirho: "Attribution text state" }),
          elChirho("div", { classChirho: "mono-chirho", textChirho: displayValueChirho(attributionTextStateLabelChirho) }),
          elChirho("div", { textChirho: "Gate effect" }),
          elChirho("div", { textChirho: attributionGateEffectTextChirho })
        ]));
        if (attributionLiveTextChangedChirho) {
          sideChirho.appendChild(elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
            elChirho("div", { textChirho: "Originally reviewed text" }),
            elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: savedValidationChirho.original_text_chirho }),
            elChirho("div", { textChirho: "Current live text" }),
            elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: itemChirho.liveSpanTextChirho }),
            elChirho("div", { textChirho: "Default action" }),
            elChirho("a", { href: attributionRereviewUrlChirho(itemChirho), textChirho: "Open Attribution re-review for this item" })
          ]));
        }
        if (reviewStateFilterChirho === "attribution-blocked-chirho" && !attributionLiveTextChangedChirho) {
          const baseReattributeCommandChirho = () =>
            "bun run reattribute-pass-c-human-validations-chirho -- " +
            "--validation-id-chirho=" + savedValidationChirho.id_chirho + " " +
            "--reviewer-chirho=" + shellArgOrPlaceholderChirho(fieldValueChirho("attribution-command-reviewer-chirho"), "<explicit-human-reviewer-id-chirho>") + " " +
            "--rationale-chirho=" + shellArgOrPlaceholderChirho(fieldValueChirho("attribution-command-rationale-chirho"), "<why this existing row is attributable to that reviewer>") + " " +
            "--expected-live-text-hash-chirho=" + savedValidationChirho.id_chirho + ":" + itemChirho.originalTextHashChirho;
          const attributionReviewerInputChirho = elChirho("input", {
            id: "attribution-command-reviewer-chirho",
            classChirho: "reviewer-input-chirho",
            placeholder: "explicit-human-reviewer-id-chirho"
          });
          const attributionRationaleInputChirho = elChirho("textarea", {
            id: "attribution-command-rationale-chirho",
            classChirho: "reviewer-input-chirho",
            placeholder: "why this existing row is attributable to that reviewer"
          });
          const attributionBoxChirho = elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
            elChirho("div", { textChirho: "Current reviewer" }),
            elChirho("div", { classChirho: "mono-chirho", textChirho: savedValidationChirho.reviewer_chirho }),
            elChirho("div", { textChirho: "Reviewer for command" }),
            attributionReviewerInputChirho,
            elChirho("div", { textChirho: "Rationale for command" }),
            attributionRationaleInputChirho,
            elChirho("div", { textChirho: "Command helper note" }),
            elChirho("div", { classChirho: "command-helper-note-chirho", textChirho: "These helper fields only update the copied commands; they do not save, apply, or certify." }),
            elChirho("div", { textChirho: "Dry run" }),
            commandRowChirho(baseReattributeCommandChirho),
            elChirho("div", { textChirho: "Apply after dry run" }),
            commandRowChirho(() => baseReattributeCommandChirho() + " --apply-chirho")
          ]);
          for (const inputChirho of [attributionReviewerInputChirho, attributionRationaleInputChirho]) {
            inputChirho.addEventListener("input", () => refreshCommandRowsChirho(attributionBoxChirho));
          }
          sideChirho.appendChild(attributionBoxChirho);
        } else if (reviewStateFilterChirho === "attribution-blocked-chirho") {
          sideChirho.appendChild(elChirho("div", {
            classChirho: "warning-chirho",
            textChirho: "Reattribute command helper omitted because the live text changed. A manual changed-text override belongs outside this quick path after explicit print recheck."
          }));
        } else {
          sideChirho.appendChild(elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
            elChirho("div", { textChirho: "Superseded reviewer" }),
            elChirho("div", { classChirho: "mono-chirho", textChirho: savedValidationChirho.reviewer_chirho }),
            elChirho("div", { textChirho: "Fresh review" }),
            elChirho("div", { textChirho: "Use the Reviewer, Issues, Notes, and clean acknowledgement controls below to record a new explicit decision." })
          ]));
        }
      }
      const metaChirho = elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
        elChirho("div", { textChirho: "Location" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: "vol " + itemChirho.volumeChirho + " p" + itemChirho.pageChirho + " L" + itemChirho.lineIndexChirho + " S" + itemChirho.segmentIndexChirho }),
        elChirho("div", { textChirho: "Status" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: displayValueChirho(itemChirho.validationStatusChirho) }),
        elChirho("div", { textChirho: "Current script" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: segmentRepairScriptLabelsChirho[itemChirho.currentScriptChirho] ?? displayValueChirho(itemChirho.currentScriptChirho) }),
        elChirho("div", { textChirho: "Script hints" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: displayValueChirho(itemChirho.scriptHintSummaryChirho) }),
        elChirho("div", { textChirho: "Tier" }),
        elChirho("div", { classChirho: "tier-chirho", textChirho: displayValueChirho(itemChirho.tierChirho) }),
        elChirho("div", { textChirho: "Attention" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.attentionReasonsChirho.length === 0 ? "none" : displayValueChirho(itemChirho.attentionReasonsChirho.join("; ")) }),
        elChirho("div", { textChirho: "Hash" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.originalTextHashChirho.slice(0, 16) }),
        elChirho("div", { textChirho: "Skeletons" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.tokenSkeletonsChirho.join(" ") })
      ]);
      referenceChirho.appendChild(metaChirho);
      const repeatClusterChirho = elChirho("div", { classChirho: "box-chirho" });
      repeatClusterChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Repeat cluster" }));
      repeatClusterChirho.appendChild(elChirho("div", { textChirho: repeatClusterTextChirho(itemChirho) }));
      repeatClusterChirho.appendChild(elChirho("a", {
        classChirho: "toolbar-link-chirho",
        href: exactTextClusterUrlChirho(itemChirho),
        textChirho: "Open exact-text cluster"
      }));
      referenceChirho.appendChild(repeatClusterChirho);

      if (itemChirho.issueMessageChirho) {
        sideChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: itemChirho.issueMessageChirho
        }));
      }

      if (itemChirho.candidateWordsChirho.length > 0) {
        const candidateBoxChirho = elChirho("div", { classChirho: "box-chirho" });
        candidateBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Candidate words" }));
        candidateBoxChirho.appendChild(elChirho("div", {
          classChirho: "mono-chirho candidate-words-chirho",
          textChirho: itemChirho.candidateWordsChirho
            .map((wordChirho) => "#" + wordChirho.wordIndexChirho + " " + displayValueChirho(wordChirho.scriptHintChirho) + " " + wordChirho.textChirho)
            .join(" | ")
        }));
        referenceChirho.appendChild(candidateBoxChirho);
      }

      const witnessBoxChirho = elChirho("div", { classChirho: "box-chirho" });
      witnessBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Witnesses" }));
      const witnessListChirho = elChirho("div", { classChirho: "witness-list-chirho" });
      for (const tokenChirho of itemChirho.tokenValidationsChirho) {
        witnessListChirho.appendChild(elChirho("div", { classChirho: "witness-chirho", textChirho: tokenChirho.skeletonChirho + " -> " + witnessTextChirho(tokenChirho) }));
      }
      if (itemChirho.directWordReadsChirho.length > 0) {
        witnessListChirho.appendChild(elChirho("div", { classChirho: "witness-chirho", textChirho: "direct reads: " + itemChirho.directWordReadsChirho.map((readChirho) => readChirho.textChirho + " @" + readChirho.confidenceChirho).join(" | ") }));
      }
      witnessBoxChirho.appendChild(witnessListChirho);
      referenceChirho.appendChild(witnessBoxChirho);

      if (queueModeChirho === "unknown-script-chirho") {
        const scriptBoxChirho = elChirho("div", { classChirho: "box-chirho" });
        scriptBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Script verdict" }));
        const scriptGridChirho = elChirho("div", { classChirho: "script-grid-chirho" });
        for (const optionChirho of scriptVerdictOptionsChirho) {
          const inputChirho = elChirho("input", {
            id: "script-" + (optionChirho.valueChirho || "defer-chirho"),
            name: "script-verdict-chirho",
            type: "radio",
            value: optionChirho.valueChirho
          });
          if ((itemChirho.defaultScriptVerdictChirho ?? "") === optionChirho.valueChirho) {
            inputChirho.checked = true;
          }
          scriptGridChirho.appendChild(elChirho("label", { classChirho: "issue-option-chirho", for: "script-" + (optionChirho.valueChirho || "defer-chirho") }, [
            inputChirho,
            elChirho("span", { textChirho: optionChirho.labelChirho })
          ]));
        }
        scriptBoxChirho.appendChild(scriptGridChirho);
        sideChirho.appendChild(scriptBoxChirho);
      }

      let reviewerInputChirho = null;
      let reviewerStatusChirho = null;
      if (reviewStateAllowsSubmitChirho()) {
        const reviewerBoxChirho = elChirho("div", { classChirho: "box-chirho" });
        reviewerBoxChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "reviewer-chirho", textChirho: "Reviewer" }));
        reviewerInputChirho = elChirho("input", {
          id: "reviewer-chirho",
          classChirho: "reviewer-input-chirho",
          type: "text",
          autocomplete: "name",
          value: reviewerChirho
        });
        reviewerBoxChirho.appendChild(reviewerInputChirho);
        reviewerStatusChirho = elChirho("div", { classChirho: "label-chirho reviewer-status-chirho", textChirho: "" });
        reviewerBoxChirho.appendChild(reviewerStatusChirho);
        identityChirho.appendChild(reviewerBoxChirho);
      } else if (savedValidationChirho) {
        sideChirho.appendChild(elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
          elChirho("div", { textChirho: "Reviewer" }),
          elChirho("div", { classChirho: "mono-chirho", textChirho: savedValidationChirho.reviewer_chirho })
        ]));
      }

      const issuesBoxChirho = disclosureChirho("Flag an issue or explain a correction");
      issuesBoxChirho.id = "review-issues-chirho";
      issuesBoxChirho.open = savedIssueFlagsChirho.size > 0;
      issuesBoxChirho.appendChild(elChirho("div", {
        classChirho: "label-chirho",
        textChirho: "Dots inside letters, mappiq, shuruk, and shin/sin dots are Vowels/niqqud; cantillation/meteg are Accents/meteg; wrong splits, lumped words, spaces, or maqqef are Segmentation."
      }));
      const issueGridChirho = elChirho("div", { classChirho: "issue-grid-chirho" });
      for (const optionChirho of issueFlagOptionsChirho) {
        const inputChirho = elChirho("input", {
          classChirho: "issue-checkbox-chirho",
          id: "issue-" + optionChirho.valueChirho,
          type: "checkbox",
          value: optionChirho.valueChirho
        });
        if (savedIssueFlagsChirho.has(optionChirho.valueChirho)) inputChirho.checked = true;
        if (!reviewStateAllowsSubmitChirho()) inputChirho.disabled = true;
        issueGridChirho.appendChild(elChirho("label", {
          classChirho: "issue-option-chirho",
          for: "issue-" + optionChirho.valueChirho,
          title: optionChirho.helpChirho,
          "aria-label": optionChirho.labelChirho + ": " + optionChirho.helpChirho
        }, [
          inputChirho,
          elChirho("span", { classChirho: "issue-label-text-chirho" }, [
            elChirho("span", { textChirho: optionChirho.labelChirho }),
            elChirho("span", { classChirho: "issue-help-chirho", textChirho: optionChirho.helpChirho })
          ])
        ]));
      }
      issuesBoxChirho.appendChild(issueGridChirho);
      sideChirho.appendChild(issuesBoxChirho);

      const notesBoxChirho = elChirho("div", { classChirho: "box-chirho" });
      notesBoxChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "notes-chirho", textChirho: "What needs attention?" }));
      const notesChirho = elChirho("textarea", { id: "notes-chirho", classChirho: "reviewer-input-chirho", placeholder: "Describe what you see in the print. Required when flagging an issue." });
      notesChirho.value = savedValidationChirho?.notes_chirho ?? "";
      if (!reviewStateAllowsSubmitChirho()) notesChirho.setAttribute("readonly", "true");
      notesBoxChirho.appendChild(notesChirho);
      issuesBoxChirho.appendChild(notesBoxChirho);

      if (reviewStateAllowsSubmitChirho()) {
        const intentRowChirho = elChirho("div", { classChirho: "intent-actions-chirho" });
        const correctionButtonChirho = elChirho("button", { type: "button", textChirho: "Text needs correction" });
        correctionButtonChirho.addEventListener("click", () => { issuesBoxChirho.open = true; editChirho.focus(); });
        const boxButtonChirho = elChirho("button", { type: "button", textChirho: "Box is wrong" });
        boxButtonChirho.addEventListener("click", () => {
          issuesBoxChirho.open = true;
          if (segmentRepairBoxChirho) segmentRepairBoxChirho.open = true;
          showRepairChirho(true);
          markBoxIssueChirho();
          setStatusChirho("Box repair: adjust the box in the scan or describe the problem. A draft does not change or certify the source text.");
          targetWrapChirho.scrollIntoView({ block: "nearest" });
        });
        intentRowChirho.append(correctionButtonChirho, boxButtonChirho);
        targetRowChirho.appendChild(intentRowChirho);
        editChirho.addEventListener("input", () => {
          if (editChirho.value !== itemChirho.liveSpanTextChirho) issuesBoxChirho.open = true;
        });
      }

      const actionsChirho = elChirho("div", { classChirho: "actions-chirho" });
      let refreshActionChirho = () => {};
      if (reviewStateAllowsSubmitChirho()) {
        const cleanCertifyInputChirho = elChirho("input", { id: "certify-clean-chirho", type: "checkbox" });
        sideChirho.appendChild(elChirho("label", { classChirho: "clean-certify-option-chirho", for: "certify-clean-chirho" }, [
          cleanCertifyInputChirho,
          document.createTextNode("I checked the scan: the box, text, marks and word boundaries all match exactly.")
        ]));
        guidanceChirho.appendChild(elChirho("div", {
          textChirho: "I checked the Target crop - red box is the item and Full line - red box in context panels against the print; if no issue boxes are checked and the text is unchanged, this exact span is intentionally reviewed clean."
        }));
        guidanceChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: "A clean save requires the checkbox above. Check an issue box and write a note if anything is wrong, split, lumped, missing, extra, or uncertain."
        }));
        sideChirho.appendChild(elChirho("div", {
          classChirho: "keyboard-hint-chirho",
          textChirho: "Keyboard: Ctrl/Command+Enter saves when the action requirements are satisfied; Tab from the final action button moves to the next item."
        }));
        const actionStatusChirho = elChirho("div", { classChirho: "label-chirho action-status-chirho", textChirho: "" });
        sideChirho.appendChild(actionStatusChirho);
        const continueButtonChirho = elChirho("button", { classChirho: "continue-chirho", textChirho: cleanReviewActionTextChirho(itemChirho) });
        const updateReviewerStatusChirho = () => {
          if (!reviewerStatusChirho) return;
          const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(currentReviewerChirho());
          reviewerStatusChirho.textContent = reviewerErrorChirho ?? "Reviewer attribution OK.";
        };
        const updateActionStatusChirho = () => {
          const messagesChirho = rawReviewActionMessagesChirho(itemChirho);
          actionStatusChirho.textContent = messagesChirho.length === 0
            ? "Action requirements are currently satisfied."
            : "Action requirements: " + messagesChirho.join("; ") + ".";
        };
        const updateContinueButtonChirho = () => {
          updateReviewerStatusChirho();
          updateActionStatusChirho();
          editCodepointsChirho.textContent = codepointTextChirho(editChirho.value);
          continueButtonChirho.textContent = cleanReviewActionTextChirho(itemChirho);
          continueButtonChirho.disabled = !cleanReviewCanSubmitChirho(itemChirho);
        };
        editChirho.addEventListener("input", updateContinueButtonChirho);
        for (const checkboxChirho of issueGridChirho.querySelectorAll(".issue-checkbox-chirho")) {
          checkboxChirho.addEventListener("change", updateContinueButtonChirho);
        }
        for (const radioChirho of sideChirho.querySelectorAll("input[name='script-verdict-chirho']")) {
          radioChirho.addEventListener("change", updateContinueButtonChirho);
        }
        notesChirho.addEventListener("input", updateContinueButtonChirho);
        if (reviewerInputChirho) {
          reviewerInputChirho.addEventListener("input", () => {
            reviewerChirho = reviewerInputChirho.value;
            persistReviewerChirho(reviewerChirho);
            updateContinueButtonChirho();
          });
        }
        cleanCertifyInputChirho.addEventListener("change", updateContinueButtonChirho);
        refreshActionChirho = updateContinueButtonChirho;
        continueButtonChirho.addEventListener("click", () => submitReviewChirho());
        actionsChirho.appendChild(continueButtonChirho);
        const undoButtonChirho = elChirho("button", { classChirho: "undo-chirho", textChirho: "Undo last" });
        const advanceOnTabChirho = (eventChirho) => {
          if (eventChirho.key !== "Tab" || eventChirho.shiftKey) return;
          eventChirho.preventDefault();
          focusCorrectionAfterRenderChirho = true;
          moveIndexChirho(1);
        };
        if (reviewStateAllowsUndoChirho()) {
          undoButtonChirho.addEventListener("click", () => undoLastChirho());
          undoButtonChirho.addEventListener("keydown", advanceOnTabChirho);
        } else {
          undoButtonChirho.disabled = true;
          continueButtonChirho.addEventListener("keydown", advanceOnTabChirho);
        }
        actionsChirho.appendChild(undoButtonChirho);
      } else {
        actionsChirho.appendChild(elChirho("button", {
          disabled: "true",
          textChirho: reviewStateIsAttributionModeChirho()
            ? "Read-only attribution row"
            : "Read-only saved issue"
        }));
      }
      sideChirho.appendChild(actionsChirho);
      reviewColumnChirho.appendChild(sideChirho);
      if (segmentRepairBoxChirho !== null) {
        reviewColumnChirho.appendChild(segmentRepairBoxChirho);
      }
      document.getElementById("session-identity-chirho").appendChild(identityChirho);
      sideChirho.appendChild(guidanceChirho);
      sideChirho.appendChild(referenceChirho);

      installFocusMagnifierChirho(targetWrapChirho, targetFrameChirho, reviewColumnChirho, itemChirho);
      appChirho.appendChild(leftChirho);
      appChirho.appendChild(reviewColumnChirho);
      refreshActionChirho();
      if (focusCorrectionAfterRenderChirho) {
        focusCorrectionAfterRenderChirho = false;
        window.requestAnimationFrame(focusPrimaryCorrectionChirho);
      }
    }
`;
}
