// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

export function humanReviewRepairScriptChirho(): string {
  return `    function markBoxIssueChirho() {
      const checkboxChirho = document.getElementById("issue-segmentation-chirho");
      const issuesChirho = document.getElementById("review-issues-chirho");
      if (issuesChirho) issuesChirho.open = true;
      const acknowledgementChirho = document.getElementById("certify-clean-chirho");
      if (acknowledgementChirho) acknowledgementChirho.checked = false;
      if (checkboxChirho) {
        checkboxChirho.checked = true;
        checkboxChirho.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    function pendingRepairHasChangesChirho(itemChirho) {
      const gridChirho = document.querySelector(".segment-repair-grid-chirho");
      return gridChirho !== null && JSON.stringify(repairRowsFromGridChirho(gridChirho)) !== JSON.stringify(normalizedRepairRowsChirho(itemChirho.lineSegmentsChirho));
    }
    function normalizedRepairRowsChirho(rowsChirho) {
      return rowsChirho.map((rowChirho, indexChirho) => ({
        segmentIndexChirho: indexChirho,
        xMinPxChirho: Number.parseInt(rowChirho.xMinPxChirho, 10),
        widthPxChirho: Number.parseInt(rowChirho.widthPxChirho, 10),
        scriptChirho: String(rowChirho.scriptChirho || "unknown-script-chirho"),
        utf8TextChirho: String(rowChirho.utf8TextChirho ?? "").normalize("NFC")
      }));
    }
    function repairLinePreviewChirho(rowsChirho) {
      return rowsChirho
        .map((rowChirho) => String(rowChirho.utf8TextChirho ?? "").normalize("NFC").trim())
        .filter((valueChirho) => valueChirho.length > 0)
        .join(" ");
    }
    function repairGeometryMessageChirho(rowsChirho, lineWidthChirho) {
      let cursorChirho = 0;
      for (let indexChirho = 0; indexChirho < rowsChirho.length; indexChirho++) {
        const rowChirho = rowsChirho[indexChirho];
        if (!Number.isInteger(rowChirho.xMinPxChirho) || !Number.isInteger(rowChirho.widthPxChirho)) return "Geometry invalid: x and width must be integers.";
        if (rowChirho.widthPxChirho <= 0) return "Geometry invalid: every width must be positive.";
        if (rowChirho.xMinPxChirho !== cursorChirho) return "Geometry invalid: row " + indexChirho + " starts at " + rowChirho.xMinPxChirho + ", expected " + cursorChirho + ".";
        cursorChirho += rowChirho.widthPxChirho;
      }
      if (cursorChirho !== lineWidthChirho) return "Geometry invalid: rows end at " + cursorChirho + ", expected " + lineWidthChirho + ".";
      return "Geometry OK: contiguous positive-width tiling covers 0.." + lineWidthChirho + ".";
    }
    function repairRowsFromGridChirho(gridChirho) {
      return normalizedRepairRowsChirho(Array.from(gridChirho.querySelectorAll(".segment-repair-row-chirho")).map((rowChirho) => ({
        xMinPxChirho: rowChirho.querySelector(".repair-x-chirho").value,
        widthPxChirho: rowChirho.querySelector(".repair-width-chirho").value,
        scriptChirho: rowChirho.querySelector(".repair-script-chirho").value,
        utf8TextChirho: rowChirho.querySelector(".repair-text-chirho").value
      })));
    }
    function targetRepairRowIndexChirho(rowsChirho, itemChirho) {
      const segmentIndexChirho = Number(itemChirho.segmentIndexChirho);
      if (Number.isInteger(segmentIndexChirho) && segmentIndexChirho >= 0 && segmentIndexChirho < rowsChirho.length) {
        return segmentIndexChirho;
      }
      return rowsChirho.findIndex((rowChirho) =>
        rowChirho.xMinPxChirho === itemChirho.spanXMinPxChirho && rowChirho.widthPxChirho === itemChirho.spanWidthPxChirho
      );
    }
    function repairBoundariesChirho(rowsChirho, lineWidthChirho) {
      const boundariesChirho = [0];
      for (const rowChirho of rowsChirho) {
        boundariesChirho.push(rowChirho.xMinPxChirho + rowChirho.widthPxChirho);
      }
      boundariesChirho[boundariesChirho.length - 1] = lineWidthChirho;
      return boundariesChirho;
    }
    function repairRowsFromBoundariesChirho(rowsChirho, boundariesChirho) {
      return rowsChirho.map((rowChirho, indexChirho) => ({
        ...rowChirho,
        segmentIndexChirho: indexChirho,
        xMinPxChirho: boundariesChirho[indexChirho],
        widthPxChirho: boundariesChirho[indexChirho + 1] - boundariesChirho[indexChirho]
      }));
    }
    function clampNumberChirho(valueChirho, minChirho, maxChirho) {
      return Math.min(Math.max(valueChirho, minChirho), maxChirho);
    }
    function updateTargetMarkerFromRepairRowsChirho(itemChirho, rowsChirho, targetMarkerChirho, dragReadoutChirho) {
      const targetIndexChirho = targetRepairRowIndexChirho(rowsChirho, itemChirho);
      const targetRowChirho = rowsChirho[targetIndexChirho];
      if (!targetRowChirho) return;
      // Span geometry is line px, crop geometry is image px - convert, never mix.
      const cropScaleChirho = cropToLineScaleChirho(itemChirho.lineWidthPxChirho, itemChirho.lineImageWidthPxChirho);
      const markerLeftPctChirho = lineXToCropFractionChirho(
        targetRowChirho.xMinPxChirho,
        itemChirho.zoomCropXMinPxChirho,
        itemChirho.zoomCropWidthPxChirho,
        itemChirho.lineWidthPxChirho,
        itemChirho.lineImageWidthPxChirho
      ) * 100;
      const markerWidthPctChirho = ((targetRowChirho.widthPxChirho * cropScaleChirho) / itemChirho.zoomCropWidthPxChirho) * 100;
      targetMarkerChirho.style.left = markerLeftPctChirho + "%";
      targetMarkerChirho.style.width = markerWidthPctChirho + "%";
      const endChirho = targetRowChirho.xMinPxChirho + targetRowChirho.widthPxChirho;
      dragReadoutChirho.textContent =
        "Draft red box x" + targetRowChirho.xMinPxChirho + ".." + endChirho +
        " (width " + targetRowChirho.widthPxChirho + "px). Drag the red box or its side handles; Save draft repair proposal records a draft only.";
    }
    function lineXFromPointerChirho(eventChirho, targetFrameChirho, itemChirho) {
      const rectChirho = targetFrameChirho.getBoundingClientRect();
      const relativeXChirho = rectChirho.width <= 0 ? 0 : (eventChirho.clientX - rectChirho.left) / rectChirho.width;
      return cropFractionToLineXChirho(
        relativeXChirho,
        itemChirho.zoomCropXMinPxChirho,
        itemChirho.zoomCropWidthPxChirho,
        itemChirho.lineWidthPxChirho,
        itemChirho.lineImageWidthPxChirho
      );
    }
    function installTargetMarkerDraftDragChirho(paramsChirho) {
      const {
        itemChirho,
        targetMarkerChirho,
        targetFrameChirho,
        gridChirho,
        kindSelectChirho,
        rationaleChirho,
        dragReadoutChirho,
        renderRowsChirho,
        updateChirho
      } = paramsChirho;
      const leftHandleChirho = elChirho("div", { classChirho: "rebox-handle-chirho rebox-handle-left-chirho", "aria-hidden": "true" });
      const rightHandleChirho = elChirho("div", { classChirho: "rebox-handle-chirho rebox-handle-right-chirho", "aria-hidden": "true" });
      targetMarkerChirho.classList.add("target-span-marker-chirho");
      targetMarkerChirho.appendChild(leftHandleChirho);
      targetMarkerChirho.appendChild(rightHandleChirho);
      const applyRowsChirho = (rowsChirho) => {
        renderRowsChirho(rowsChirho);
        updateTargetMarkerFromRepairRowsChirho(itemChirho, rowsChirho, targetMarkerChirho, dragReadoutChirho);
        updateChirho();
      };
      updateTargetMarkerFromRepairRowsChirho(itemChirho, repairRowsFromGridChirho(gridChirho), targetMarkerChirho, dragReadoutChirho);
      targetMarkerChirho.addEventListener("pointerdown", (eventChirho) => {
        if (eventChirho.button !== 0) return;
        const rowsChirho = repairRowsFromGridChirho(gridChirho);
        const targetIndexChirho = targetRepairRowIndexChirho(rowsChirho, itemChirho);
        if (targetIndexChirho < 0) {
          setStatusChirho("Target row not found in proposal grid.");
          return;
        }
        const boundariesChirho = repairBoundariesChirho(rowsChirho, itemChirho.lineWidthPxChirho);
        const originalLeftChirho = boundariesChirho[targetIndexChirho];
        const originalRightChirho = boundariesChirho[targetIndexChirho + 1];
        const originalWidthChirho = originalRightChirho - originalLeftChirho;
        const minLeftChirho = targetIndexChirho === 0 ? 0 : boundariesChirho[targetIndexChirho - 1] + 1;
        const maxRightChirho = targetIndexChirho + 1 === rowsChirho.length ? itemChirho.lineWidthPxChirho : boundariesChirho[targetIndexChirho + 2] - 1;
        const startPointerXChirho = lineXFromPointerChirho(eventChirho, targetFrameChirho, itemChirho);
        const modeChirho = eventChirho.target.classList.contains("rebox-handle-left-chirho")
          ? "left-chirho"
          : eventChirho.target.classList.contains("rebox-handle-right-chirho")
            ? "right-chirho"
            : "move-chirho";
        eventChirho.preventDefault();
        targetMarkerChirho.setPointerCapture(eventChirho.pointerId);
        targetMarkerChirho.classList.add("dragging-rebox-chirho");
        const pointerMoveChirho = (moveEventChirho) => {
          const deltaChirho = lineXFromPointerChirho(moveEventChirho, targetFrameChirho, itemChirho) - startPointerXChirho;
          const nextBoundariesChirho = [...boundariesChirho];
          if (modeChirho === "left-chirho") {
            nextBoundariesChirho[targetIndexChirho] = clampNumberChirho(originalLeftChirho + deltaChirho, minLeftChirho, originalRightChirho - 1);
          } else if (modeChirho === "right-chirho") {
            nextBoundariesChirho[targetIndexChirho + 1] = clampNumberChirho(originalRightChirho + deltaChirho, originalLeftChirho + 1, maxRightChirho);
          } else {
            const minMoveLeftChirho = targetIndexChirho === 0 ? 0 : minLeftChirho;
            const maxMoveLeftChirho = targetIndexChirho + 1 === rowsChirho.length
              ? itemChirho.lineWidthPxChirho - originalWidthChirho
              : maxRightChirho - originalWidthChirho;
            const nextLeftChirho = clampNumberChirho(originalLeftChirho + deltaChirho, minMoveLeftChirho, maxMoveLeftChirho);
            nextBoundariesChirho[targetIndexChirho] = targetIndexChirho === 0 ? 0 : nextLeftChirho;
            nextBoundariesChirho[targetIndexChirho + 1] = targetIndexChirho + 1 === rowsChirho.length
              ? itemChirho.lineWidthPxChirho
              : nextLeftChirho + originalWidthChirho;
          }
          const nextRowsChirho = repairRowsFromBoundariesChirho(rowsChirho, nextBoundariesChirho);
          applyRowsChirho(nextRowsChirho);
        };
        const pointerUpChirho = (upEventChirho) => {
          targetMarkerChirho.releasePointerCapture(upEventChirho.pointerId);
          targetMarkerChirho.classList.remove("dragging-rebox-chirho");
          targetMarkerChirho.removeEventListener("pointermove", pointerMoveChirho);
          targetMarkerChirho.removeEventListener("pointerup", pointerUpChirho);
          targetMarkerChirho.removeEventListener("pointercancel", pointerUpChirho);
          kindSelectChirho.value = "rebox-chirho";
          if (rationaleChirho.value.trim().length === 0) {
            rationaleChirho.value = "Moved or resized the red box in the zoom crop; verify the proposed boundaries against the print before approval.";
            rationaleChirho.dispatchEvent(new Event("input", { bubbles: true }));
          }
          updateChirho();
        };
        targetMarkerChirho.addEventListener("pointermove", pointerMoveChirho);
        targetMarkerChirho.addEventListener("pointerup", pointerUpChirho);
        targetMarkerChirho.addEventListener("pointercancel", pointerUpChirho);
      });
    }
    // Phase 3 item E. Segments tile the line completely, so a drawn box is never
    // a floating rectangle: drawnBoxTilingRowsChirho carves the dragged x-range
    // out of the existing coverage and the neighbours keep the rest.
    function installDrawBoxChirho(paramsChirho) {
      const {
        itemChirho,
        targetFrameChirho,
        gridChirho,
        kindSelectChirho,
        rationaleChirho,
        drawScriptSelectChirho,
        drawButtonChirho,
        renderRowsChirho,
        updateChirho
      } = paramsChirho;
      let armedChirho = false;
      let bandChirho = null;
      let bandStartXChirho = 0;
      function setArmedChirho(nextArmedChirho) {
        armedChirho = nextArmedChirho;
        drawButtonChirho.classList.toggle("draw-box-armed-chirho", armedChirho);
        targetFrameChirho.classList.toggle("drawing-armed-chirho", armedChirho);
        drawButtonChirho.textContent = armedChirho ? "Drawing - drag on the crop (or click here to cancel)" : "Draw a new box";
      }
      function removeBandChirho() {
        if (bandChirho) bandChirho.remove();
        bandChirho = null;
      }
      function paintBandChirho(currentXChirho) {
        if (!bandChirho) return;
        const leftPxChirho = Math.min(bandStartXChirho, currentXChirho);
        const widthPxChirho = Math.abs(currentXChirho - bandStartXChirho);
        bandChirho.style.left = (((leftPxChirho - itemChirho.zoomCropXMinPxChirho) / itemChirho.zoomCropWidthPxChirho) * 100) + "%";
        bandChirho.style.width = ((widthPxChirho / itemChirho.zoomCropWidthPxChirho) * 100) + "%";
      }
      drawButtonChirho.addEventListener("click", () => {
        setArmedChirho(!armedChirho);
        setStatusChirho(armedChirho
          ? "Drag across the printed word on the crop to draw a box for it."
          : "Draw cancelled; nothing changed.");
      });
      targetFrameChirho.addEventListener("pointerdown", (eventChirho) => {
        if (!armedChirho || eventChirho.button !== 0) return;
        // Capture phase plus stopPropagation so arming the draw tool beats the
        // red box's own move/resize drag on the same pixels.
        eventChirho.stopPropagation();
        eventChirho.preventDefault();
        bandStartXChirho = lineXFromPointerChirho(eventChirho, targetFrameChirho, itemChirho);
        removeBandChirho();
        bandChirho = elChirho("div", { classChirho: "draw-box-band-chirho" });
        targetFrameChirho.appendChild(bandChirho);
        paintBandChirho(bandStartXChirho);
        targetFrameChirho.setPointerCapture(eventChirho.pointerId);
        const pointerMoveChirho = (moveEventChirho) => {
          paintBandChirho(lineXFromPointerChirho(moveEventChirho, targetFrameChirho, itemChirho));
        };
        const pointerUpChirho = (upEventChirho) => {
          targetFrameChirho.releasePointerCapture(upEventChirho.pointerId);
          targetFrameChirho.removeEventListener("pointermove", pointerMoveChirho);
          targetFrameChirho.removeEventListener("pointerup", pointerUpChirho);
          targetFrameChirho.removeEventListener("pointercancel", pointerUpChirho);
          removeBandChirho();
          setArmedChirho(false);
          const endXChirho = lineXFromPointerChirho(upEventChirho, targetFrameChirho, itemChirho);
          const rowsChirho = repairRowsFromGridChirho(gridChirho);
          let drawnChirho;
          try {
            drawnChirho = drawnBoxTilingRowsChirho(rowsChirho, bandStartXChirho, endXChirho, itemChirho.lineWidthPxChirho, drawScriptSelectChirho.value);
          } catch (errorChirho) {
            setStatusChirho("Box not drawn: " + (errorChirho && errorChirho.message ? errorChirho.message : String(errorChirho)));
            return;
          }
          renderRowsChirho(drawnChirho.rowsChirho, drawnChirho.drawnIndexChirho);
          kindSelectChirho.value = tilingEditRepairKindChirho(rowsChirho.length, drawnChirho.rowsChirho.length);
          if (rationaleChirho.value.trim().length === 0) {
            rationaleChirho.value = "Drew a box for a printed word the segmentation missed; verify the boundaries and the typed text against the print before approval.";
            rationaleChirho.dispatchEvent(new Event("input", { bubbles: true }));
          }
          updateChirho();
          const textInputChirho = repairRowTextInputChirho(gridChirho, drawnChirho.drawnIndexChirho);
          if (textInputChirho) textInputChirho.focus();
          setStatusChirho("Drew a box at x" + drawnChirho.rowsChirho[drawnChirho.drawnIndexChirho].xMinPxChirho +
            " (width " + drawnChirho.rowsChirho[drawnChirho.drawnIndexChirho].widthPxChirho +
            "px). Type what is printed in it, add a reason, then save the draft.");
        };
        targetFrameChirho.addEventListener("pointermove", pointerMoveChirho);
        targetFrameChirho.addEventListener("pointerup", pointerUpChirho);
        targetFrameChirho.addEventListener("pointercancel", pointerUpChirho);
      }, true);
    }
    function repairRowChirho(spanChirho, updateChirho) {
      const rowChirho = elChirho("div", { classChirho: "segment-repair-row-chirho" });
      const selectCellChirho = elChirho("div", { classChirho: "repair-select-cell-chirho" });
      const selectBoxChirho = elChirho("input", { classChirho: "repair-select-chirho", type: "checkbox", "aria-label": "Select this box to merge" });
      selectCellChirho.appendChild(selectBoxChirho);
      rowChirho.appendChild(selectCellChirho);
      rowChirho.appendChild(elChirho("div", { classChirho: "mono-chirho repair-index-chirho", textChirho: String(spanChirho.segmentIndexChirho) }));
      const xInputChirho = elChirho("input", { classChirho: "repair-x-chirho", type: "number", min: "0", step: "1", "aria-label": "Box left position in pixels", value: String(spanChirho.xMinPxChirho) });
      const widthInputChirho = elChirho("input", { classChirho: "repair-width-chirho", type: "number", min: "1", step: "1", "aria-label": "Box width in pixels", value: String(spanChirho.widthPxChirho) });
      const scriptSelectChirho = elChirho("select", { classChirho: "repair-script-chirho", "aria-label": "Box language" });
      for (const scriptChirho of segmentRepairScriptOptionsChirho) {
        const optionChirho = elChirho("option", { value: scriptChirho, textChirho: segmentRepairScriptLabelsChirho[scriptChirho] ?? scriptChirho });
        if (scriptChirho === spanChirho.scriptChirho) optionChirho.selected = true;
        scriptSelectChirho.appendChild(optionChirho);
      }
      const textInputChirho = elChirho("textarea", { classChirho: "repair-text-chirho", "aria-label": "Box transcription", dir: "auto" });
      textInputChirho.value = spanChirho.utf8TextChirho ?? "";
      const deleteButtonChirho = elChirho("button", { type: "button", textChirho: "X", "aria-label": "Delete segment row" });
      deleteButtonChirho.addEventListener("click", () => {
        rowChirho.remove();
        updateChirho();
      });
      for (const inputChirho of [xInputChirho, widthInputChirho, scriptSelectChirho, textInputChirho]) {
        inputChirho.addEventListener("input", updateChirho);
        inputChirho.addEventListener("change", updateChirho);
      }
      rowChirho.appendChild(scriptSelectChirho);
      rowChirho.appendChild(deleteButtonChirho);
      rowChirho.appendChild(textInputChirho);
      const coordinatesChirho = disclosureChirho("Position and width", [
        elChirho("label", { textChirho: "Left (px)" }, [xInputChirho]),
        elChirho("label", { textChirho: "Width (px)" }, [widthInputChirho])
      ]);
      coordinatesChirho.classList.add("repair-coordinates-chirho");
      rowChirho.appendChild(coordinatesChirho);
      return rowChirho;
    }
    function renderRepairRowsChirho(gridChirho, rowsChirho, updateChirho, highlightIndexChirho) {
      clearChirho(gridChirho);
      rowsChirho.forEach((rowChirho, indexChirho) => {
        const rowNodeChirho = repairRowChirho({ ...rowChirho, segmentIndexChirho: indexChirho }, updateChirho);
        if (indexChirho === highlightIndexChirho) rowNodeChirho.classList.add("segment-repair-row-selected-chirho");
        gridChirho.appendChild(rowNodeChirho);
      });
    }
    function repairRowTextInputChirho(gridChirho, indexChirho) {
      const rowNodeChirho = gridChirho.querySelectorAll(".segment-repair-row-chirho")[indexChirho];
      return rowNodeChirho ? rowNodeChirho.querySelector(".repair-text-chirho") : null;
    }
    function selectedRepairRowIndexesChirho(gridChirho) {
      return Array.from(gridChirho.querySelectorAll(".segment-repair-row-chirho"))
        .map((rowChirho, indexChirho) => (rowChirho.querySelector(".repair-select-chirho").checked ? indexChirho : -1))
        .filter((indexChirho) => indexChirho >= 0);
    }
    // Andrew's case: one printed phrase carved into several boxes, some of its
    // words swallowed by the neighbouring French box. Merging the boxes back
    // into one phrase is faster than deleting each tag and re-selecting.
    function mergeRepairRowsChirho(rowsChirho, selectedChirho) {
      const firstChirho = rowsChirho[selectedChirho[0]];
      const lastChirho = rowsChirho[selectedChirho[selectedChirho.length - 1]];
      const textsChirho = selectedChirho
        .map((indexChirho) => (rowsChirho[indexChirho].utf8TextChirho ?? "").trim())
        .filter((textChirho) => textChirho.length > 0);
      // A merged phrase takes the first non-French script among its parts: the
      // French box is usually the one that swallowed the words, not the subject.
      const scriptsChirho = selectedChirho.map((indexChirho) => rowsChirho[indexChirho].scriptChirho);
      const scriptChirho = scriptsChirho.find((candidateChirho) => candidateChirho !== "french-chirho") ?? scriptsChirho[0];
      const mergedChirho = {
        segmentIndexChirho: selectedChirho[0],
        xMinPxChirho: firstChirho.xMinPxChirho,
        widthPxChirho: lastChirho.xMinPxChirho + lastChirho.widthPxChirho - firstChirho.xMinPxChirho,
        scriptChirho: scriptChirho,
        utf8TextChirho: textsChirho.join(" ")
      };
      const remainingChirho = rowsChirho.filter((unusedChirho, indexChirho) => !selectedChirho.includes(indexChirho));
      remainingChirho.splice(selectedChirho[0], 0, mergedChirho);
      return remainingChirho;
    }
    function reindexRepairGridChirho(gridChirho) {
      Array.from(gridChirho.querySelectorAll(".repair-index-chirho")).forEach((nodeChirho, indexChirho) => {
        nodeChirho.textContent = String(indexChirho);
      });
    }
    function defaultDrawScriptChirho() {
      return queueModeChirho === "hebrew-chirho" ? "hebrew-chirho" : "unknown-script-chirho";
    }
    function segmentRepairProposalBoxChirho(itemChirho, targetMarkerChirho, targetFrameChirho) {
      const boxChirho = disclosureChirho("Adjust boxes · draft repair");
      boxChirho.id = "box-repair-chirho";
      boxChirho.classList.add("repair-panel-chirho");
      boxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Segment repair proposal" }));
      boxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Use this when the red box itself is wrong: split it, merge it, move or resize it, fix its script, or mark it unreadable. Saving only files a draft proposal for later review; it never certifies text." }));
      const kindSelectChirho = elChirho("select", { id: "segment-repair-kind-chirho", "aria-label": "Repair kind" });
      for (const kindChirho of segmentRepairKindOptionsChirho) {
        kindSelectChirho.appendChild(elChirho("option", { value: kindChirho, textChirho: segmentRepairKindLabelsChirho[kindChirho] ?? kindChirho }));
      }
      const rationaleChirho = elChirho("textarea", { id: "segment-repair-rationale-chirho", "aria-label": "Repair rationale", placeholder: "Explain which box is wrong and what should change." });
      const gridChirho = elChirho("div", { classChirho: "segment-repair-grid-chirho" });
      const previewChirho = elChirho("div", { classChirho: "segment-repair-preview-chirho" });
      const geometryChirho = elChirho("div", { classChirho: "label-chirho" });
      const dragReadoutChirho = elChirho("div", { classChirho: "rebox-readout-chirho" });
      const resultChirho = elChirho("div", { classChirho: "mono-chirho codepoints-chirho" });
      const saveButtonChirho = elChirho("button", { type: "button", id: "save-repair-chirho", textChirho: "Save draft repair proposal" });
      const renderRowsChirho = (rowsChirho, highlightIndexChirho) => renderRepairRowsChirho(gridChirho, rowsChirho, updateChirho, highlightIndexChirho);
      const updateChirho = () => {
        reindexRepairGridChirho(gridChirho);
        const rowsChirho = repairRowsFromGridChirho(gridChirho);
        previewChirho.textContent = repairLinePreviewChirho(rowsChirho);
        const geometryTextChirho = repairGeometryMessageChirho(rowsChirho, itemChirho.lineWidthPxChirho);
        geometryChirho.textContent = geometryTextChirho;
        updateTargetMarkerFromRepairRowsChirho(itemChirho, rowsChirho, targetMarkerChirho, dragReadoutChirho);
        if (JSON.stringify(rowsChirho) !== JSON.stringify(normalizedRepairRowsChirho(itemChirho.lineSegmentsChirho))) {
          boxChirho.open = true;
          if (boxChirho.showRepairChirho) boxChirho.showRepairChirho();
          markBoxIssueChirho();
        }
        saveButtonChirho.disabled = !geometryTextChirho.startsWith("Geometry OK") || rationaleChirho.value.trim().length === 0;
      };
      renderRowsChirho(itemChirho.lineSegmentsChirho);
      const actionRowChirho = elChirho("div", { classChirho: "repair-tools-chirho" });
      const splitButtonChirho = elChirho("button", { type: "button", textChirho: "Split the red-box row" });
      const addButtonChirho = elChirho("button", { type: "button", textChirho: "Add row" });
      splitButtonChirho.addEventListener("click", () => {
        const rowsChirho = repairRowsFromGridChirho(gridChirho);
        const targetIndexChirho = rowsChirho.findIndex((rowChirho) =>
          rowChirho.xMinPxChirho === itemChirho.spanXMinPxChirho && rowChirho.widthPxChirho === itemChirho.spanWidthPxChirho
        );
        if (targetIndexChirho < 0) {
          setStatusChirho("Target row not found in proposal grid.");
          return;
        }
        const targetChirho = rowsChirho[targetIndexChirho];
        if (targetChirho.widthPxChirho < 2) {
          setStatusChirho("Target row is too narrow to split.");
          return;
        }
        const leftWidthChirho = Math.floor(targetChirho.widthPxChirho / 2);
        const rightWidthChirho = targetChirho.widthPxChirho - leftWidthChirho;
        rowsChirho.splice(
          targetIndexChirho,
          1,
          { ...targetChirho, widthPxChirho: leftWidthChirho },
          { ...targetChirho, xMinPxChirho: targetChirho.xMinPxChirho + leftWidthChirho, widthPxChirho: rightWidthChirho, utf8TextChirho: "" }
        );
        renderRowsChirho(rowsChirho);
        updateChirho();
      });
      addButtonChirho.addEventListener("click", () => {
        const rowsChirho = repairRowsFromGridChirho(gridChirho);
        const endChirho = rowsChirho.reduce((cursorChirho, rowChirho) => Math.max(cursorChirho, rowChirho.xMinPxChirho + rowChirho.widthPxChirho), 0);
        rowsChirho.push({ segmentIndexChirho: rowsChirho.length, xMinPxChirho: endChirho, widthPxChirho: 1, scriptChirho: "unknown-script-chirho", utf8TextChirho: "" });
        renderRowsChirho(rowsChirho);
        updateChirho();
      });
      saveButtonChirho.addEventListener("click", () => saveSegmentRepairProposalChirho(itemChirho, kindSelectChirho, rationaleChirho, gridChirho, resultChirho));
      rationaleChirho.addEventListener("input", updateChirho);
      const mergeButtonChirho = elChirho("button", { type: "button", textChirho: "Merge selected boxes" });
      mergeButtonChirho.addEventListener("click", () => {
        const rowsChirho = repairRowsFromGridChirho(gridChirho);
        const selectedChirho = selectedRepairRowIndexesChirho(gridChirho);
        if (selectedChirho.length < 2) {
          setStatusChirho("Tick at least two boxes to merge them into one phrase.");
          return;
        }
        const contiguousChirho = selectedChirho.every(
          (indexChirho, positionChirho) => positionChirho === 0 || indexChirho === selectedChirho[positionChirho - 1] + 1
        );
        if (!contiguousChirho) {
          setStatusChirho("Only boxes next to each other can merge into one phrase.");
          return;
        }
        renderRowsChirho(mergeRepairRowsChirho(rowsChirho, selectedChirho));
        kindSelectChirho.value = "merge-chirho";
        updateChirho();
        setStatusChirho("Merged " + selectedChirho.length + " boxes into one. Check the text, add a reason, then save the draft.");
      });
      actionRowChirho.appendChild(splitButtonChirho);
      actionRowChirho.appendChild(mergeButtonChirho);
      actionRowChirho.appendChild(addButtonChirho);

      // Phase 3 item E: draw a box for a printed word the segmentation missed.
      const drawRowChirho = elChirho("div", { classChirho: "repair-tools-chirho" });
      const drawScriptSelectChirho = elChirho("select", { id: "draw-box-script-chirho", "aria-label": "Script for the box you draw" });
      for (const scriptChirho of segmentRepairScriptOptionsChirho) {
        const optionChirho = elChirho("option", { value: scriptChirho, textChirho: segmentRepairScriptLabelsChirho[scriptChirho] ?? scriptChirho });
        if (scriptChirho === defaultDrawScriptChirho()) optionChirho.selected = true;
        drawScriptSelectChirho.appendChild(optionChirho);
      }
      const drawButtonChirho = elChirho("button", { type: "button", id: "draw-box-chirho", textChirho: "Draw a new box" });
      drawRowChirho.appendChild(elChirho("span", { classChirho: "repair-tools-label-chirho", textChirho: "Missed word? Pick its script, then draw it on the crop:" }));
      drawRowChirho.appendChild(drawScriptSelectChirho);
      drawRowChirho.appendChild(drawButtonChirho);

      // Phase 3 item G: manual-first for the hardest pages - collapse the line
      // to one box so the reviewer tags it themselves instead of fighting the
      // auto-segmentation. Draft-only, so reloading the item restores the OCR.
      const manualRowChirho = elChirho("div", { classChirho: "repair-tools-chirho" });
      const manualKeepButtonChirho = elChirho("button", { type: "button", id: "manual-first-keep-chirho", textChirho: "One box for the whole line (keep text)" });
      const manualBlankButtonChirho = elChirho("button", { type: "button", id: "manual-first-blank-chirho", textChirho: "One box for the whole line (blank text)" });
      const startManualFirstChirho = (keepTextChirho) => {
        const rowsChirho = repairRowsFromGridChirho(gridChirho);
        let manualRowsChirho;
        try {
          manualRowsChirho = manualFirstTilingRowsChirho(rowsChirho, itemChirho.lineWidthPxChirho, keepTextChirho);
        } catch (errorChirho) {
          setStatusChirho("Manual-first not started: " + (errorChirho && errorChirho.message ? errorChirho.message : String(errorChirho)));
          return;
        }
        renderRowsChirho(manualRowsChirho, 0);
        kindSelectChirho.value = tilingEditRepairKindChirho(rowsChirho.length, manualRowsChirho.length);
        if (rationaleChirho.value.trim().length === 0) {
          rationaleChirho.value = "Re-segmenting this line by hand because the automatic boxes do not fit the print; verify every drawn box and its text before approval.";
          rationaleChirho.dispatchEvent(new Event("input", { bubbles: true }));
        }
        updateChirho();
        setStatusChirho(keepTextChirho
          ? "Whole line is one box and every reading was kept. Draw your own boxes on the crop; reload the item to get the automatic boxes back."
          : "Whole line is one blank box. Draw your own boxes on the crop; reload the item to get the automatic boxes back.");
      };
      manualKeepButtonChirho.addEventListener("click", () => startManualFirstChirho(true));
      manualBlankButtonChirho.addEventListener("click", () => startManualFirstChirho(false));
      manualRowChirho.appendChild(elChirho("span", { classChirho: "repair-tools-label-chirho", textChirho: "Hard page? Start from scratch and tag it yourself:" }));
      manualRowChirho.appendChild(manualKeepButtonChirho);
      manualRowChirho.appendChild(manualBlankButtonChirho);
      const advancedChirho = disclosureChirho("Advanced tools and geometry", [elChirho("div", { classChirho: "meta-grid-chirho" }, [
        elChirho("div", { textChirho: "Drag red box" }),
        dragReadoutChirho,
        elChirho("div", { textChirho: "Old line" }),
        elChirho("div", { classChirho: "line-text-chirho", textChirho: itemChirho.lineTextChirho }),
        elChirho("div", { textChirho: "Preview" }),
        previewChirho,
        elChirho("div", { textChirho: "Geometry" }),
        geometryChirho
      ])]);
      boxChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "segment-repair-kind-chirho", textChirho: "Repair type" }));
      boxChirho.appendChild(kindSelectChirho);
      boxChirho.appendChild(actionRowChirho);
      boxChirho.appendChild(drawRowChirho);
      boxChirho.appendChild(elChirho("div", { classChirho: "repair-grid-scroll-chirho", tabindex: "0", role: "region", "aria-label": "Box coordinates, language and text" }, [gridChirho]));
      boxChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "segment-repair-rationale-chirho", textChirho: "Why is this repair needed?" }));
      boxChirho.appendChild(rationaleChirho);
      advancedChirho.appendChild(manualRowChirho);
      boxChirho.appendChild(advancedChirho);
      boxChirho.appendChild(elChirho("div", { classChirho: "actions-chirho" }, [saveButtonChirho]));
      boxChirho.appendChild(resultChirho);
      installTargetMarkerDraftDragChirho({
        itemChirho,
        targetMarkerChirho,
        targetFrameChirho,
        gridChirho,
        kindSelectChirho,
        rationaleChirho,
        dragReadoutChirho,
        renderRowsChirho,
        updateChirho
      });
      installDrawBoxChirho({
        itemChirho,
        targetFrameChirho,
        gridChirho,
        kindSelectChirho,
        rationaleChirho,
        drawScriptSelectChirho,
        drawButtonChirho,
        renderRowsChirho,
        updateChirho
      });
      updateChirho();
      return boxChirho;
    }
    function targetBoundaryTextChirho(itemChirho) {
      const spanStartChirho = Number(itemChirho.spanXMinPxChirho);
      const spanWidthChirho = Number(itemChirho.spanWidthPxChirho);
      const lineWidthChirho = Number(itemChirho.lineWidthPxChirho);
      const spanEndChirho = spanStartChirho + spanWidthChirho;
      return "Certify exactly what the red box covers - letters, marks, spacing, maqqef, punctuation, and word boundaries. " +
        "(Span x" + spanStartChirho + ".." + spanEndChirho + " of " + lineWidthChirho + "px, segment " + itemChirho.segmentIndexChirho + ".)";
    }
`;
}
