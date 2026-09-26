// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

// Playwright function runner; requires the disposable local station on :8876.
// All POSTs are intercepted. These are interface checks, never human certification.
async (pageChirho) => {
  const checksChirho = [];
  const errorsChirho = [];
  const postsChirho = [];
  let networkFailureChirho = false;
  const originChirho = "http://127.0.0.1:8876";
  const initialUrlChirho = originChirho + "/?item-chirho=3%3A151%3A36%3A2";
  const assertChirho = (valueChirho, nameChirho) => {
    if (!valueChirho) throw new Error(nameChirho);
    checksChirho.push(nameChirho);
  };
  const errorHandlerChirho = errorChirho => errorsChirho.push(String(errorChirho));
  const routeHandlerChirho = async routeChirho => {
    const requestChirho = routeChirho.request();
    if (requestChirho.method() !== "POST") return routeChirho.continue();
    postsChirho.push({ pathChirho: requestChirho.url().slice(originChirho.length), bodyChirho: requestChirho.postDataJSON() });
    if (networkFailureChirho) return routeChirho.abort("failed");
    return routeChirho.fulfill({ status: 409, json: { okChirho: false, errorChirho: "Fixture rejection: nothing was saved." } });
  };
  pageChirho.on("pageerror", errorHandlerChirho);
  await pageChirho.route(originChirho + "/api-chirho/**", routeHandlerChirho);
  try {
    await pageChirho.setViewportSize({ width: 1366, height: 768 });
    await pageChirho.goto(initialUrlChirho);
    await pageChirho.locator("#edit-chirho").waitFor();
    await pageChirho.waitForFunction(() => [...document.querySelectorAll(".target-image-chirho, .line-image-chirho")].every(imageChirho => imageChirho.complete && imageChirho.naturalWidth > 0));
    const geometryChirho = await pageChirho.evaluate(() => {
      const editChirho = document.getElementById("edit-chirho").getBoundingClientRect();
      const scanChirho = document.querySelector(".target-image-chirho").getBoundingClientRect();
      return { editBottomChirho: editChirho.bottom, editLeftChirho: editChirho.left, scanRightChirho: scanChirho.right, scanBottomChirho: scanChirho.bottom, viewportHeightChirho: innerHeight };
    });
    assertChirho(geometryChirho.editBottomChirho <= 768 && geometryChirho.scanBottomChirho <= 768 && geometryChirho.editLeftChirho > geometryChirho.scanRightChirho, "Laptop: scan and correction visible together without scrolling");
    assertChirho(!await pageChirho.locator("#queue-tools-chirho").evaluate(nodeChirho => nodeChirho.open), "Queue tools collapsed initially");
    await pageChirho.locator("#reviewer-chirho").fill("dr-interface-fixture-chirho");
    await pageChirho.locator("#certify-clean-chirho").check();
    await pageChirho.getByRole("button", { name: "Box repair", exact: true }).focus();
    await pageChirho.keyboard.press("Enter");
    assertChirho(postsChirho.length === 0, "Enter on a task button never submits a clean review");
    assertChirho(await pageChirho.locator("#box-repair-chirho").isVisible() && !await pageChirho.locator("#edit-chirho").isVisible(), "Box repair is a separate view beside the source");
    await pageChirho.getByRole("button", { name: "Split the red-box row", exact: true }).click();
    assertChirho(await pageChirho.locator("#issue-segmentation-chirho").isChecked() && !await pageChirho.locator("#certify-clean-chirho").isChecked(), "Geometry edit flags segmentation and clears clean acknowledgement");
    await pageChirho.getByRole("button", { name: "Text review", exact: true }).click();
    await pageChirho.locator("#issue-segmentation-chirho").uncheck();
    await pageChirho.locator("#certify-clean-chirho").check();
    await pageChirho.keyboard.press("Control+Enter");
    assertChirho(postsChirho.length === 0 && await pageChirho.locator(".continue-chirho").isDisabled(), "Changed box cannot be certified clean through button or shortcut");
    await pageChirho.getByRole("button", { name: "Box repair", exact: true }).click();
    await pageChirho.locator("#segment-repair-rationale-chirho").fill("Disposable UI fixture: split the selected box to check draft routing.");
    await Promise.all([
      pageChirho.waitForResponse(responseChirho => responseChirho.url().endsWith("/segment-repair-proposal-chirho")),
      pageChirho.keyboard.press("Control+Enter"),
    ]);
    assertChirho(postsChirho.length === 1 && postsChirho[0].pathChirho.endsWith("/segment-repair-proposal-chirho"), "Repair shortcut routes only to the draft endpoint");
    const spansChirho = postsChirho[0].bodyChirho.proposedSpansChirho;
    assertChirho(spansChirho.every((spanChirho, indexChirho) => spanChirho.widthPxChirho > 0 && spanChirho.xMinPxChirho === (indexChirho ? spansChirho[indexChirho - 1].xMinPxChirho + spansChirho[indexChirho - 1].widthPxChirho : 0)), "Split draft remains a contiguous positive-width tiling");
    assertChirho(await pageChirho.locator("#segment-repair-rationale-chirho").inputValue() !== "", "Rejected draft retains the editor contents");

    await pageChirho.goto(initialUrlChirho);
    await pageChirho.locator("#edit-chirho").waitFor();
    await pageChirho.locator("#reviewer-chirho").fill("dr-interface-fixture-chirho");
    const correctionChirho = await pageChirho.locator("#edit-chirho").inputValue() + "א";
    await pageChirho.locator("#edit-chirho").fill(correctionChirho);
    assertChirho(await pageChirho.locator("#review-issues-chirho").evaluate(nodeChirho => nodeChirho.open), "Typing a correction exposes issue and explanation controls");
    await pageChirho.locator("#issue-letters-chirho").check();
    await pageChirho.locator("#notes-chirho").fill("Disposable UI fixture to exercise the correction request, not a source judgement.");
    await pageChirho.keyboard.press("Control+Enter");
    await pageChirho.waitForFunction(() => document.getElementById("status-chirho").textContent.includes("Fixture rejection"));
    assertChirho(postsChirho.length === 2 && postsChirho[1].bodyChirho.certifyCleanChirho === false && postsChirho[1].bodyChirho.correctedTextChirho === correctionChirho, "Correction routes as an issue, never clean certification");
    assertChirho(await pageChirho.locator("#edit-chirho").inputValue() === correctionChirho, "Rejected correction retains the transcription");
    networkFailureChirho = true;
    await pageChirho.keyboard.press("Control+Enter");
    await pageChirho.waitForFunction(() => document.getElementById("status-chirho").textContent.includes("Could not confirm the save"));
    assertChirho(await pageChirho.locator("#edit-chirho").inputValue() === correctionChirho, "Network failure keeps edits and reports an unconfirmed save");
    networkFailureChirho = false;

    await pageChirho.goto(originChirho + "/?review-state-chirho=attribution-blocked-chirho");
    await pageChirho.locator("#edit-chirho").waitFor();
    assertChirho(await pageChirho.locator("#edit-chirho").getAttribute("readonly") !== null && await pageChirho.locator("#box-repair-chirho").count() === 0, "Attribution-blocked records remain read-only, without repair controls");

    await pageChirho.goto(initialUrlChirho);
    await pageChirho.locator("#edit-chirho").waitFor();
    const scaledChirho = await pageChirho.evaluate(() => activeQueueChirho().find(itemChirho => itemChirho.volumeChirho === 5 && itemChirho.lineImageWidthPxChirho !== itemChirho.lineWidthPxChirho));
    assertChirho(Boolean(scaledChirho), "Scaled Volume 5 fixture exists");
    await pageChirho.goto(originChirho + "/?item-chirho=" + encodeURIComponent(scaledChirho.keyChirho));
    await pageChirho.locator(".target-image-chirho").waitFor();
    await pageChirho.waitForFunction(() => document.querySelector(".target-image-chirho").complete && document.querySelector(".target-image-chirho").naturalWidth > 0);
    const markerChirho = await pageChirho.locator(".rebox-handle-left-chirho").boundingBox();
    await pageChirho.mouse.move(markerChirho.x + markerChirho.width / 2, markerChirho.y + markerChirho.height / 2);
    await pageChirho.mouse.down();
    await pageChirho.mouse.move(markerChirho.x + markerChirho.width / 2 + 8, markerChirho.y + markerChirho.height / 2, { steps: 4 });
    await pageChirho.mouse.up();
    const draggedChirho = await pageChirho.evaluate(() => ({
      rowsChirho: repairRowsFromGridChirho(document.querySelector(".segment-repair-grid-chirho")),
      itemChirho: currentItemChirho(),
      dirtyChirho: pendingRepairHasChangesChirho(currentItemChirho()),
      modeChirho: document.getElementById("app-chirho").dataset.reviewModeChirho,
    }));
    assertChirho(draggedChirho.dirtyChirho && draggedChirho.modeChirho === "repair-chirho", "Dragging the scaled crop opens the repair view");
    const finalSpanChirho = draggedChirho.rowsChirho.at(-1);
    assertChirho(finalSpanChirho.xMinPxChirho + finalSpanChirho.widthPxChirho === scaledChirho.lineWidthPxChirho && draggedChirho.rowsChirho.every((spanChirho, indexChirho) => spanChirho.widthPxChirho > 0 && spanChirho.xMinPxChirho === (indexChirho ? draggedChirho.rowsChirho[indexChirho - 1].xMinPxChirho + draggedChirho.rowsChirho[indexChirho - 1].widthPxChirho : 0)), "Scaled drag preserves full-line pixel tiling");

    for (const widthChirho of [1440, 1024, 768, 390]) {
      await pageChirho.setViewportSize({ width: widthChirho, height: 900 });
      await pageChirho.goto(initialUrlChirho);
      await pageChirho.locator("#edit-chirho").waitFor();
      await pageChirho.waitForFunction(() => [...document.querySelectorAll(".target-image-chirho, .line-image-chirho")].every(imageChirho => imageChirho.complete && imageChirho.naturalWidth > 0));
      assertChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Text view has no page overflow at " + widthChirho);
      await pageChirho.getByRole("button", { name: "Box repair", exact: true }).click();
      assertChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Repair view has no page overflow at " + widthChirho);
    }
    assertChirho(errorsChirho.length === 0, "No browser runtime errors across exercised flows");
    return { checksChirho, geometryChirho, scaledKeyChirho: scaledChirho.keyChirho, interceptedPostsChirho: postsChirho.length, errorsChirho };
  } finally {
    await pageChirho.unroute(originChirho + "/api-chirho/**", routeHandlerChirho);
    pageChirho.off("pageerror", errorHandlerChirho);
    await pageChirho.evaluate(() => localStorage.removeItem("pass-c-human-reviewer-chirho"));
  }
}
