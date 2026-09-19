// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Read-only rendered visibility, not just DOM presence or overflow.
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 390, height: 850 } });
  const pageChirho = await contextChirho.newPage();
  await contextChirho.route('**/*', (routeChirho) => ['GET', 'HEAD'].includes(routeChirho.request().method()) ? routeChirho.continue() : routeChirho.abort());
  try {
    await pageChirho.goto('https://hottp-chirho.bible.systems/volumes-chirho/1/pages-chirho/148');
    await pageChirho.locator('.reading-token-chirho[title^="Hebrew"]').first().click();
    await pageChirho.waitForFunction(() => document.querySelector('.scan-canvas-chirho img')?.naturalWidth > 0);
    await pageChirho.evaluate(() => new Promise((resolveChirho) => {
      let previousChirho = -1, stableChirho = 0;
      function frameChirho() { stableChirho = window.scrollY === previousChirho ? stableChirho + 1 : 0; previousChirho = window.scrollY; if (stableChirho >= 5) resolveChirho(null); else requestAnimationFrame(frameChirho); }
      requestAnimationFrame(frameChirho);
    }));
    const proofChirho = await pageChirho.getByRole('textbox').evaluate((editorChirho) => {
      const boxChirho = editorChirho.getBoundingClientRect();
      const xChirho = boxChirho.left + boxChirho.width / 2, yChirho = boxChirho.top + boxChirho.height / 2;
      return { visibleChirho: yChirho >= 0 && yChirho < innerHeight && document.elementFromPoint(xChirho, yChirho) === editorChirho, topChirho: boxChirho.top, bottomChirho: boxChirho.bottom };
    });
    if (!proofChirho.visibleChirho) throw new Error('Active mobile reading is covered: ' + JSON.stringify(proofChirho));
    return { assertionsChirho: 1, proofChirho };
  } finally { await contextChirho.close(); }
}
