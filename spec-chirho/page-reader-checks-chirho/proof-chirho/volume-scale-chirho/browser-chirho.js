// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho) => {
  // Synthetic D1 fixture from catalog-d1-chirho.ts, copied into the isolated
  // reader's persist directory. No production requests or content mutations.
  const originChirho = 'http://127.0.0.1:5184';
  const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const pageChirho = await contextChirho.newPage();
  const resultsChirho = [], writesChirho = [], errorsChirho = [];
  function checkChirho(valueChirho, labelChirho) { if (!valueChirho) throw new Error(labelChirho); resultsChirho.push(labelChirho); }
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  await contextChirho.route('**/*', (routeChirho) => {
    if (['GET', 'HEAD'].includes(routeChirho.request().method())) return routeChirho.continue();
    writesChirho.push(routeChirho.request().url()); return routeChirho.fulfill({ status: 409, body: 'fixture: content writes refused' });
  });
  const numbersChirho = () => pageChirho.locator('.page-card-chirho strong').allTextContents();
  async function hitChirho(locatorChirho) {
    await locatorChirho.scrollIntoViewIfNeeded();
    return locatorChirho.evaluate((elementChirho) => {
      const boundsChirho = elementChirho.getBoundingClientRect();
      const topChirho = document.elementFromPoint(boundsChirho.x + boundsChirho.width / 2, boundsChirho.y + boundsChirho.height / 2);
      return topChirho === elementChirho || elementChirho.contains(topChirho);
    });
  }
  try {
    const responseChirho = await pageChirho.goto(originChirho + '/volumes-chirho/3');
    await pageChirho.locator('.page-card-chirho').first().waitFor();
    checkChirho((await numbersChirho()).length === 24, 'volume renders a bounded first window');
    checkChirho((await numbersChirho())[0] === 'p. 1' && (await numbersChirho()).at(-1) === 'p. 24', 'first window is ordered by PDF page number');
    checkChirho(!(await responseChirho.text()).includes('F'.repeat(256)), 'listing response excludes full French text');
    checkChirho((await pageChirho.locator('.page-card-chirho').first().innerText()).includes('130 segments · 90 non-French'), 'visible card counts match the seeded data');
    await pageChirho.getByRole('link', { name: 'Next pages →', exact: true }).click();
    await pageChirho.waitForURL('**?from-chirho=25');
    checkChirho((await numbersChirho())[0] === 'p. 25', 'next window starts at the overfetched page');
    await pageChirho.getByRole('link', { name: '← Previous pages', exact: true }).click();
    await pageChirho.waitForURL('**?before-chirho=25');
    checkChirho((await numbersChirho()).at(-1) === 'p. 24', 'backward window returns the preceding pages');

    await pageChirho.getByLabel('Start at PDF page').fill('1410');
    await pageChirho.getByRole('button', { name: 'Go', exact: true }).click();
    await pageChirho.waitForURL('**?from-chirho=1410');
    checkChirho((await numbersChirho()).length === 9 && (await numbersChirho()).at(-1) === 'p. 1418', 'jump reaches the final partial window');
    checkChirho(await pageChirho.getByRole('link', { name: 'Next pages →', exact: true }).count() === 0, 'no next link beyond the last loaded page');
    checkChirho((await pageChirho.locator('.export-btn-chirho').getAttribute('href')).endsWith('from-chirho=1410&to-chirho=1418'), 'download link carries exactly the displayed bounds');
    const downloadEventChirho = pageChirho.waitForEvent('download');
    await pageChirho.locator('.export-btn-chirho').click();
    const downloadChirho = await downloadEventChirho, streamChirho = await downloadChirho.createReadStream();
    let markdownChirho = ''; for await (const chunkChirho of streamChirho) markdownChirho += chunkChirho.toString();
    checkChirho((markdownChirho.match(/^## Page /gm) ?? []).length === 9, 'actual downloaded file contains only displayed pages');
    checkChirho(markdownChirho.includes('not a complete volume') && markdownChirho.includes('Unverified legacy stored text'), 'download visibly describes scope and uncertainty');
    checkChirho(downloadChirho.suggestedFilename().includes('pages-1410-1418'), 'download filename cannot be mistaken for a complete volume');

    await pageChirho.goto(originChirho + '/volumes-chirho/6?from-chirho=7');
    checkChirho((await numbersChirho())[0] === 'p. 9', 'page jump skips missing page numbers without inventing data');
    await pageChirho.getByRole('link', { name: '← Previous pages', exact: true }).click();
    await pageChirho.waitForURL('**?before-chirho=9');
    checkChirho((await numbersChirho()).join(',') === 'p. 3,p. 6', 'previous window handles a sparse beginning');
    const sparseDownloadChirho = await contextChirho.request.get(originChirho + await pageChirho.locator('.export-btn-chirho').getAttribute('href'));
    checkChirho(sparseDownloadChirho.status() === 200 && sparseDownloadChirho.headers()['x-exported-pages-chirho'] === '2', 'sparse beginning exports two pages, not following hidden pages');

    for (const [queryChirho, statusChirho] of [
      ['volume-chirho=3', 400], ['volume-chirho=3&from-chirho=1&to-chirho=1418', 413],
      ['volume-chirho=3&from-chirho=1600&to-chirho=1700', 404], ['volume-chirho=3&from-chirho=5&to-chirho=1', 400],
      ['volume-chirho=3&from-chirho=1&to-chirho=2&to-chirho=2000', 400],
    ]) {
      const refusedChirho = await contextChirho.request.get(originChirho + '/api-chirho/export-chirho?' + queryChirho);
      checkChirho(refusedChirho.status() === statusChirho && !refusedChirho.headers()['content-disposition'], 'invalid or oversized export fails without a partial download: ' + statusChirho);
    }
    const utfChirho = await contextChirho.request.get(originChirho + '/api-chirho/export-chirho?volume-chirho=3&from-chirho=1&to-chirho=2');
    checkChirho((await utfChirho.text()).includes('שָׁלוֹם · ἔκρυσις · é'), 'HTTP download preserves Hebrew, Greek and French');
    checkChirho(utfChirho.headers()['cache-control'] === 'private, no-store', 'range exports do not enter a shared cache');
    const malformedChirho = await contextChirho.request.get(originChirho + '/volumes-chirho/3?from-chirho=1&before-chirho=2');
    checkChirho(malformedChirho.status() === 400, 'conflicting cursor input fails closed');
    await pageChirho.goto(originChirho + '/volumes-chirho/3?from-chirho=9999');
    checkChirho(await pageChirho.locator('.page-card-chirho').count() === 0 && await pageChirho.locator('.export-btn-chirho').count() === 0, 'empty window has no invented page or download');
    await pageChirho.getByRole('link', { name: 'First pages', exact: true }).click();
    await pageChirho.waitForURL(originChirho + '/volumes-chirho/3');
    checkChirho((await numbersChirho())[0] === 'p. 1', 'empty-window recovery resets to the first loaded pages');

    for (const widthChirho of [320, 390, 768, 1440]) {
      await pageChirho.setViewportSize({ width: widthChirho, height: 900 });
      checkChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no horizontal overflow at ' + widthChirho);
      checkChirho(await hitChirho(pageChirho.getByLabel('Start at PDF page')) && await hitChirho(pageChirho.getByRole('button', { name: 'Go', exact: true })), 'jump controls are reachable at ' + widthChirho);
    }
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-10-17-reader-scale-chirho/desktop-chirho.png', fullPage: true });
    await pageChirho.setViewportSize({ width: 390, height: 844 }); await pageChirho.evaluate(() => window.scrollTo(0, 0));
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-10-17-reader-scale-chirho/mobile-chirho.png' });
    checkChirho(writesChirho.length === 0 && errorsChirho.length === 0, 'all browsing and export checks made zero content mutations and raised no runtime errors');
    return { assertionsChirho: resultsChirho.length, resultsChirho, writesChirho, errorsChirho };
  } finally { await contextChirho.close(); }
}
