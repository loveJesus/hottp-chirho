// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Hosted navigation proof. No credentials; every non-read request is blocked.
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const pageChirho = await contextChirho.newPage();
  const checksChirho = [], errorsChirho = [], mutationsChirho = [];
  const assertChirho = (conditionChirho, labelChirho) => { if (!conditionChirho) throw new Error(labelChirho); checksChirho.push(labelChirho); };
  const originChirho = 'https://hottp-chirho.bible.systems';
  const pathChirho = '/volumes-chirho/3/pages-chirho/151';
  const editorChirho = pageChirho.locator('textarea.inline-reading-chirho');
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  await contextChirho.route('**/*', (routeChirho) => {
    if (['GET', 'HEAD'].includes(routeChirho.request().method())) return routeChirho.continue();
    mutationsChirho.push(routeChirho.request().method() + ' ' + routeChirho.request().url());
    return routeChirho.abort();
  });
  await contextChirho.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async (textChirho) => { window.copiedReadingChirho = textChirho; },
  } }));
  try {
    await pageChirho.goto(originChirho + pathChirho);
    await pageChirho.getByRole('searchbox').fill('PAPYRUS');
    await pageChirho.getByRole('button', { name: 'Next match', exact: true }).click();
    await editorChirho.waitFor();
    assertChirho((await editorChirho.inputValue()).toLowerCase() === 'papyrus', 'live search finds stored text');
    const labelChirho = await editorChirho.getAttribute('aria-label');
    await editorChirho.fill('private-hosted-navigation-draft-chirho');
    await pageChirho.getByRole('button', { name: 'Next match', exact: true }).click();
    assertChirho(await editorChirho.getAttribute('aria-label') !== labelChirho, 'live next-match advances');
    await pageChirho.getByRole('button', { name: 'Previous match', exact: true }).click();
    assertChirho(await editorChirho.inputValue() === 'private-hosted-navigation-draft-chirho', 'live previous-match preserves the unsubmitted draft');
    await pageChirho.getByRole('button', { name: 'Copy reading link', exact: true }).click();
    const linkChirho = await pageChirho.getByRole('textbox', { name: 'Reading link', exact: true }).inputValue();
    assertChirho(!linkChirho.includes('private-hosted') && !linkChirho.includes('?'), 'live copied URL contains no draft or query');
    await pageChirho.reload();
    await editorChirho.waitFor();
    assertChirho(await editorChirho.inputValue() === 'private-hosted-navigation-draft-chirho', 'live reload restores the tab-local draft');
    const freshChirho = await contextChirho.newPage();
    await freshChirho.goto(linkChirho.replace(originChirho, 'https://hottp-chirho.lovejesus.workers.dev'));
    await freshChirho.locator('textarea.inline-reading-chirho').waitFor();
    assertChirho((await freshChirho.locator('textarea.inline-reading-chirho').inputValue()).toLowerCase() === 'papyrus', 'source-bound link resolves across host aliases without exposing the draft');
    await freshChirho.close();
    await pageChirho.goto(linkChirho.slice(0, -1) + (linkChirho.endsWith('0') ? '1' : '0'));
    await pageChirho.getByText('This linked reading changed', { exact: false }).waitFor();
    assertChirho(await editorChirho.count() === 0, 'live stale fingerprint refuses a substitute reading');
    await pageChirho.goto(linkChirho);
    await editorChirho.waitFor();
    assertChirho(await editorChirho.inputValue() === 'private-hosted-navigation-draft-chirho', 'live valid link recovers selection and the retained draft');
    await pageChirho.getByRole('spinbutton', { name: 'Line number' }).fill('36');
    await pageChirho.getByRole('button', { name: 'Go', exact: true }).click();
    assertChirho(await editorChirho.getAttribute('aria-label') === 'Edit reading, line 36', 'live line jump selects the requested line');
    await pageChirho.goto(linkChirho);
    await editorChirho.waitFor();
    for (const widthChirho of [320, 390, 700, 1024]) {
      await pageChirho.setViewportSize({ width: widthChirho, height: 700 });
      await editorChirho.scrollIntoViewIfNeeded();
      assertChirho(await editorChirho.evaluate((elementChirho) => {
        const boxChirho = elementChirho.getBoundingClientRect();
        return document.elementFromPoint(boxChirho.left + boxChirho.width / 2, boxChirho.top + boxChirho.height / 2) === elementChirho && document.documentElement.scrollWidth <= innerWidth + 1;
      }), `live editor receives hit testing without horizontal overflow at ${widthChirho}px`);
      assertChirho(await pageChirho.getByRole('button', { name: 'Confirm & next', exact: false }).isDisabled(), `public confirmation remains disabled at ${widthChirho}px`);
    }
    await pageChirho.locator('.reader-intro-chirho a').click();
    assertChirho(await pageChirho.getByLabel('Reviewer username').count() === 1, 'live reading opens the sign-in screen');
    assertChirho(await pageChirho.evaluate((expectedChirho) => new URL(location.href).searchParams.get('return-chirho') === new URL(expectedChirho).pathname + new URL(expectedChirho).hash, linkChirho), 'live sign-in retains the source-bound return link');
    assertChirho(mutationsChirho.length === 0 && errorsChirho.length === 0, 'hosted navigation requested no mutations and had no runtime errors');
    return { assertions_chirho: checksChirho.length, checks_chirho: checksChirho, mutations_chirho: mutationsChirho, errors_chirho: errorsChirho, source_link_chirho: linkChirho };
  } finally { await contextChirho.close(); }
}
