// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho, originChirho, passwordChirho, screenshotRootChirho) => {
  if (!['http://127.0.0.1:5194', 'https://hottp-chirho.bible.systems', 'https://hottp-chirho.lovejesus.workers.dev'].includes(originChirho)) throw new Error('Unexpected inspection origin');
  const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const pageChirho = await contextChirho.newPage(), checksChirho = [], errorsChirho = [], writesChirho = [];
  const checkChirho = (valueChirho, labelChirho) => { if (!valueChirho) throw new Error(labelChirho); checksChirho.push(labelChirho); };
  const dialogChirho = pageChirho.getByRole('dialog', { name: 'Inspect print', exact: true });
  const openChirho = pageChirho.getByRole('button', { name: 'Inspect print', exact: true });
  const editorChirho = pageChirho.locator('.inline-reading-chirho');
  const waitImageChirho = () => pageChirho.waitForFunction(() => { const imageChirho = document.querySelector('img[alt="Scanned source page"]'); return imageChirho?.complete && imageChirho.naturalWidth > 0; });
  const dimensionsChirho = () => dialogChirho.getByRole('img').evaluate((elementChirho) => {
    const boundsChirho = elementChirho.getBoundingClientRect(), viewChirho = elementChirho.viewBox.baseVal;
    const imageChirho = elementChirho.querySelector('image'), nativeChirho = document.querySelector('img[alt="Scanned source page"]');
    return { width_chirho: boundsChirho.width, height_chirho: boundsChirho.height, expected_width_chirho: viewChirho.width * nativeChirho.naturalWidth / Number(imageChirho.getAttribute('width')),
      expected_height_chirho: viewChirho.height * nativeChirho.naturalHeight / Number(imageChirho.getAttribute('height')), raw_width_chirho: Number(imageChirho.getAttribute('width')) };
  });
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  await pageChirho.route('**/api-chirho/**', (routeChirho) => {
    if (['GET', 'HEAD'].includes(routeChirho.request().method())) return routeChirho.continue();
    writesChirho.push(routeChirho.request().method() + ' ' + new URL(routeChirho.request().url()).pathname);
    return routeChirho.abort();
  });
  try {
    checkChirho((await contextChirho.request.get(originChirho + '/api-chirho/events-chirho', { maxRedirects: 0 })).status() === 401, 'Anonymous corpus API remains gated');
    await pageChirho.goto(originChirho + '/volumes-chirho/5/pages-chirho/500');
    await pageChirho.getByLabel('Password', { exact: true }).fill(passwordChirho);
    await pageChirho.getByRole('button', { name: 'Open reader', exact: true }).click();
    await pageChirho.waitForURL(originChirho + '/volumes-chirho/5/pages-chirho/500');
    for (const [volumeChirho, numberChirho, calibratedChirho] of [[5, 500, false], [5, 148, true], [3, 151, false]]) {
      const responseChirho = await pageChirho.goto(originChirho + '/volumes-chirho/' + volumeChirho + '/pages-chirho/' + numberChirho);
      await waitImageChirho();
      checkChirho(responseChirho.status() === 200 && responseChirho.headers()['cache-control'] === 'private, no-store', 'Page ' + volumeChirho + ':' + numberChirho + ' stays private');
      const tokenChirho = numberChirho === 500 ? pageChirho.getByRole('button', { name: 'ἐνώπιον κυρίου καὶ ἀνθρώπων', exact: true }) : pageChirho.locator('.reading-token-chirho').first();
      await tokenChirho.click();
      const oldTextChirho = await editorChirho.inputValue(), oldBoxChirho = await pageChirho.locator('.scan-box-chirho.chosen-chirho').getAttribute('style');
      await editorChirho.fill('unsubmitted-inspection-draft-chirho');
      await openChirho.click();
      checkChirho(await dialogChirho.isVisible(), 'Enlarged inspection opens on ' + volumeChirho + ':' + numberChirho);
      await dialogChirho.getByLabel('Print zoom', { exact: true }).selectOption('1');
      const nativeChirho = await dimensionsChirho();
      checkChirho(Math.abs(nativeChirho.width_chirho - nativeChirho.expected_width_chirho) < .5 && Math.abs(nativeChirho.height_chirho - nativeChirho.expected_height_chirho) < .5, '100 percent is native PNG pixels on ' + volumeChirho + ':' + numberChirho);
      const naturalWidthChirho = await pageChirho.getByAltText('Scanned source page', { exact: true }).evaluate((imageChirho) => imageChirho.naturalWidth);
      checkChirho(calibratedChirho ? Math.abs(nativeChirho.raw_width_chirho - 892 * 300 / 72) < .01 : nativeChirho.raw_width_chirho === naturalWidthChirho, 'Stored coordinate world is preserved on ' + volumeChirho + ':' + numberChirho);
      await dialogChirho.getByLabel('Print zoom', { exact: true }).selectOption('4');
      const enlargedChirho = await dimensionsChirho();
      checkChirho(Math.abs(enlargedChirho.width_chirho - nativeChirho.width_chirho * 4) < .5, '400 percent does not silently fit down');
      if (screenshotRootChirho && numberChirho === 500) await pageChirho.screenshot({ path: screenshotRootChirho + '/inspection-greek-desktop-chirho.png' });
      const selectedRectChirho = await dialogChirho.locator('rect').evaluate((rectChirho) => ['x', 'y', 'width', 'height'].map((nameChirho) => rectChirho.getAttribute(nameChirho)));
      await dialogChirho.getByLabel('Print context', { exact: true }).selectOption('line-chirho');
      const lineChirho = await dimensionsChirho();
      checkChirho(numberChirho === 500 ? lineChirho.expected_width_chirho > nativeChirho.expected_width_chirho : lineChirho.expected_width_chirho >= nativeChirho.expected_width_chirho, 'Full-line context covers the selection and neighbouring print');
      checkChirho(JSON.stringify(await dialogChirho.locator('rect').evaluate((rectChirho) => ['x', 'y', 'width', 'height'].map((nameChirho) => rectChirho.getAttribute(nameChirho)))) === JSON.stringify(selectedRectChirho), 'Context and zoom retain the exact raw highlight');
      await dialogChirho.getByLabel('Print zoom', { exact: true }).selectOption('fit-chirho');
      checkChirho(await dialogChirho.getByRole('region').evaluate((elementChirho) => elementChirho.scrollWidth <= elementChirho.clientWidth + 1 && elementChirho.scrollHeight <= elementChirho.clientHeight + 1), 'Fit view contains the entire context without enlarging it');
      await dialogChirho.getByLabel('Print context', { exact: true }).selectOption('selection-chirho');
      await dialogChirho.getByLabel('Print zoom', { exact: true }).selectOption('8');
      await pageChirho.waitForTimeout(50);
      const beforePanChirho = await dialogChirho.getByRole('region').evaluate((elementChirho) => ({ left_chirho: elementChirho.scrollLeft, max_chirho: elementChirho.scrollWidth - elementChirho.clientWidth }));
      await dialogChirho.getByRole('button', { name: 'Pan print right', exact: true }).focus();
      await pageChirho.keyboard.press('Enter');
      const afterPanChirho = await dialogChirho.getByRole('region').evaluate((elementChirho) => elementChirho.scrollLeft);
      checkChirho(numberChirho === 500 ? afterPanChirho > beforePanChirho.left_chirho : afterPanChirho >= beforePanChirho.left_chirho && afterPanChirho <= beforePanChirho.max_chirho + 1, 'Keyboard-operable pan controls move or respect the image edge');
      await pageChirho.keyboard.press('Control+Enter');
      await pageChirho.keyboard.press('Shift+Tab');
      checkChirho(await dialogChirho.evaluate((elementChirho) => elementChirho.contains(document.activeElement)), 'Keyboard focus stays in the inspection dialog');
      if (screenshotRootChirho && numberChirho !== 500) await pageChirho.screenshot({ path: screenshotRootChirho + '/inspection-' + volumeChirho + '-' + numberChirho + '-desktop-chirho.png' });
      await pageChirho.keyboard.press('Escape');
      checkChirho(!await dialogChirho.isVisible() && await openChirho.evaluate((buttonChirho) => document.activeElement === buttonChirho), 'Escape closes and returns focus to the opener');
      checkChirho(await editorChirho.inputValue() === 'unsubmitted-inspection-draft-chirho' && await pageChirho.locator('.scan-box-chirho.chosen-chirho').getAttribute('style') === oldBoxChirho, 'Inspection preserves the local draft and original raw box');
      await pageChirho.getByRole('button', { name: 'Discard draft', exact: true }).click();
      checkChirho(await editorChirho.inputValue() === oldTextChirho, 'Discard still reveals the stored text, not an inspection overlay');
    }
    for (const widthChirho of [320, 390, 700, 1024]) {
      await pageChirho.setViewportSize({ width: widthChirho, height: 844 });
      await openChirho.click();
      await dialogChirho.getByLabel('Print zoom', { exact: true }).selectOption('4');
      checkChirho(await dialogChirho.evaluate((elementChirho) => {
        const boundsChirho = elementChirho.getBoundingClientRect();
        return boundsChirho.left >= 0 && boundsChirho.top >= 0 && boundsChirho.right <= innerWidth + 1 && boundsChirho.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
      }), 'Inspection remains inside the viewport at ' + widthChirho + 'px');
      if (screenshotRootChirho && widthChirho === 390) await pageChirho.screenshot({ path: screenshotRootChirho + '/inspection-mobile-chirho.png' });
      await dialogChirho.getByRole('button', { name: 'Close inspection', exact: true }).click();
      await editorChirho.scrollIntoViewIfNeeded();
      checkChirho(await editorChirho.evaluate((elementChirho) => { const boundsChirho = elementChirho.getBoundingClientRect(); return document.elementFromPoint(boundsChirho.left + boundsChirho.width / 2, boundsChirho.top + boundsChirho.height / 2) === elementChirho; }), 'Closing inspection leaves the editor unobstructed at ' + widthChirho + 'px');
    }
    if (originChirho === 'http://127.0.0.1:5194') {
      await pageChirho.route('**/api-chirho/images-chirho**', (routeChirho) => routeChirho.abort());
      await pageChirho.goto(originChirho + '/volumes-chirho/5/pages-chirho/500');
      await pageChirho.getByRole('alert').filter({ hasText: 'The source image could not load' }).waitFor();
      await pageChirho.getByRole('button', { name: 'ἐνώπιον κυρίου καὶ ἀνθρώπων', exact: true }).click();
      checkChirho(await openChirho.isDisabled() && await pageChirho.getByRole('button', { name: 'Confirm & next →', exact: true }).isDisabled(), 'Missing source image holds inspection and confirmation');
      await editorChirho.press('Control+Enter');
      checkChirho(writesChirho.length === 0, 'Missing-image shortcut cannot submit a reading');
    }
    checkChirho(writesChirho.length === 0 && errorsChirho.length === 0, 'No content mutation attempts or runtime page errors');
    return { verified_at_chirho: new Date().toISOString(), origin_chirho: originChirho, assertions_chirho: checksChirho.length, checks_chirho: checksChirho, writes_chirho: writesChirho, errors_chirho: errorsChirho, production_confirmations_chirho: 0 };
  } catch (caughtChirho) { throw new Error(caughtChirho.message + '; passed: ' + JSON.stringify(checksChirho)); }
  finally { await contextChirho.close(); }
}
