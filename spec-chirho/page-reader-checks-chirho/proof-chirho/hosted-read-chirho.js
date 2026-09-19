// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Public read-only release observation. Block every mutation in this context.
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext();
  const pageChirho = await contextChirho.newPage(), evidenceChirho = [], errorsChirho = [];
  let blockedWritesChirho = 0;
  const checkChirho = (valueChirho, labelChirho) => { if (!valueChirho) throw new Error(labelChirho); evidenceChirho.push(labelChirho); };
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  await contextChirho.route('**/*', (routeChirho) => { if (['GET', 'HEAD'].includes(routeChirho.request().method())) return routeChirho.continue(); blockedWritesChirho++; return routeChirho.abort(); });
  try {
    for (const [numberChirho, countChirho] of [[148, 50], [149, 47], [150, 54], [151, 45], [152, 38]]) {
      const responseChirho = await pageChirho.goto(`https://hottp-chirho.bible.systems/volumes-chirho/1/pages-chirho/${numberChirho}`);
      checkChirho(responseChirho.status() === 200, `live vol1:${numberChirho} loads`);
      await pageChirho.locator('.reading-token-chirho').first().waitFor();
      const machineChirho = pageChirho.locator('.reading-token-chirho[title*="Machine-assisted"]');
      checkChirho(await machineChirho.count() === countChirho && await machineChirho.evaluateAll((itemsChirho) => itemsChirho.every((itemChirho) => itemChirho.classList.contains('review-chirho') && !itemChirho.classList.contains('confirmed-chirho'))), `live vol1:${numberChirho} keeps ${countChirho} machine readings unverified and in attention`);
    }
    await pageChirho.goto('https://hottp-chirho.bible.systems/volumes-chirho/2/pages-chirho/151');
    const legacyChirho = pageChirho.getByRole('button', { name: 'ἄνταρσις', exact: true });
    checkChirho((await legacyChirho.getAttribute('title')).includes('Unattributed'), 'live legacy Greek mark is visibly unverified');
    await legacyChirho.click();
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'public reader cannot persist a confirmation');
    await pageChirho.goto('https://hottp-chirho.bible.systems/volumes-chirho/5/pages-chirho/148');
    await pageChirho.waitForFunction(() => document.querySelectorAll('.scan-box-chirho').length > 0);
    checkChirho(await pageChirho.locator('.scan-box-chirho').evaluateAll((boxesChirho) => boxesChirho.every((boxChirho) => parseFloat(boxChirho.style.left) + parseFloat(boxChirho.style.width) <= 100.000001 && parseFloat(boxChirho.style.top) + parseFloat(boxChirho.style.height) <= 100.000001)), 'live volume-5 calibration still contains every displayed box');
    await pageChirho.goto('https://hottp-chirho.bible.systems/volumes-chirho/3/pages-chirho/151?view-chirho=tools-chirho');
    checkChirho(await pageChirho.locator('.legacy-page-editor-chirho').count() === 1, 'advanced tools still load on their explicit route');
    await pageChirho.setViewportSize({ width: 390, height: 850 });
    await pageChirho.goto('https://hottp-chirho.bible.systems/volumes-chirho/1/pages-chirho/148');
    await pageChirho.locator('.reading-token-chirho[title^="Hebrew"][title*="Machine-assisted"]').first().click();
    checkChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'live mobile reader has no horizontal overflow');
    await pageChirho.waitForFunction(() => { const editorChirho = document.querySelector('textarea'); if (!editorChirho) return false; const boxChirho = editorChirho.getBoundingClientRect(); return document.elementFromPoint(boxChirho.left + boxChirho.width / 2, boxChirho.top + boxChirho.height / 2) === editorChirho; });
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-09-19-proof-chirho/hosted-mobile-viewport-chirho.png' });
    // A sticky site header is otherwise captured at the prior document scroll
    // offset in a full-page screenshot. Also retain the real viewport above.
    await pageChirho.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-09-19-proof-chirho/hosted-mobile-chirho.png', fullPage: true });
    checkChirho(blockedWritesChirho === 0 && errorsChirho.length === 0, 'public walkthrough requested no mutations and had no runtime errors');
    return { assertionsChirho: evidenceChirho.length, evidenceChirho, blockedWritesChirho, errorsChirho };
  } finally { await contextChirho.close(); }
}
