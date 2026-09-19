// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Local copied state only. Clipboard outcomes are simulated; no system clipboard is changed.
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const pageChirho = await contextChirho.newPage();
  const errorsChirho = [], mutationsChirho = [], checksChirho = [];
  const urlChirho = 'http://127.0.0.1:5183/volumes-chirho/3/pages-chirho/151';
  const assertChirho = (conditionChirho, labelChirho) => { if (!conditionChirho) throw new Error(labelChirho); checksChirho.push(labelChirho); };
  const editorChirho = pageChirho.locator('textarea.inline-reading-chirho');
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  await contextChirho.route('**/api-chirho/**', (routeChirho) => {
    if (!['GET', 'HEAD'].includes(routeChirho.request().method())) { mutationsChirho.push(routeChirho.request().url()); return routeChirho.abort(); }
    return routeChirho.continue();
  });
  await contextChirho.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async (textChirho) => { window.copiedReadingChirho = textChirho; },
  } }));
  try {
    await pageChirho.goto(urlChirho);
    await pageChirho.getByRole('searchbox').fill('PAPYRUS');
    await pageChirho.getByRole('button', { name: 'Next match', exact: true }).click();
    await editorChirho.waitFor();
    assertChirho((await editorChirho.inputValue()).toLowerCase() === 'papyrus', 'search selects a matching stored reading');
    const firstLineChirho = await editorChirho.getAttribute('aria-label');
    await editorChirho.fill('private-navigation-draft-chirho');
    await pageChirho.getByRole('button', { name: 'Next match', exact: true }).click();
    assertChirho(await editorChirho.getAttribute('aria-label') !== firstLineChirho, 'next match advances while full context stays visible');
    await pageChirho.getByRole('button', { name: 'Previous match', exact: true }).click();
    assertChirho(await editorChirho.inputValue() === 'private-navigation-draft-chirho', 'previous match retains the unsubmitted draft');
    await pageChirho.getByRole('button', { name: 'Copy reading link', exact: true }).click();
    const linkChirho = await pageChirho.getByRole('textbox', { name: 'Reading link', exact: true }).inputValue();
    await pageChirho.waitForFunction((expectedChirho) => window.copiedReadingChirho === expectedChirho, linkChirho);
    assertChirho(!linkChirho.includes('private-navigation-draft-chirho') && !linkChirho.includes('?'), 'copied link contains no draft or query');
    await pageChirho.getByRole('button', { name: 'Next match', exact: true }).click();
    await pageChirho.goto(linkChirho);
    await editorChirho.waitFor();
    assertChirho(await editorChirho.getAttribute('aria-label') === firstLineChirho && await editorChirho.inputValue() === 'private-navigation-draft-chirho', 'explicit link overrides saved selection without losing draft');
    await pageChirho.reload(); await editorChirho.waitFor();
    assertChirho(await editorChirho.inputValue() === 'private-navigation-draft-chirho', 'draft and linked selection survive refresh');
    await pageChirho.goto(urlChirho + '#top'); await editorChirho.waitFor();
    assertChirho(await editorChirho.inputValue() === 'private-navigation-draft-chirho', 'unrelated fragment still restores tab selection');
    assertChirho(await pageChirho.getByText('This linked reading changed', { exact: false }).count() === 0, 'unrelated fragment is not treated as a broken reading link');
    await pageChirho.goto(linkChirho); await editorChirho.waitFor();

    const newPageChirho = await contextChirho.newPage();
    await newPageChirho.goto(linkChirho); await newPageChirho.locator('textarea.inline-reading-chirho').waitFor();
    assertChirho((await newPageChirho.locator('textarea.inline-reading-chirho').inputValue()).toLowerCase() === 'papyrus', 'fresh tab sees stored source, never another tab draft');
    await newPageChirho.close();
    await pageChirho.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
    await pageChirho.getByRole('button', { name: 'Copy reading link', exact: true }).click();
    await pageChirho.getByText('Clipboard unavailable.', { exact: false }).waitFor();
    assertChirho(await pageChirho.getByRole('textbox', { name: 'Reading link', exact: true }).inputValue() === linkChirho, 'clipboard refusal retains a selectable manual-copy link');

    await pageChirho.getByRole('searchbox').fill('zzzz-no-match-chirho');
    assertChirho(await pageChirho.getByRole('button', { name: 'Next match', exact: true }).isDisabled(), 'empty result cannot move selection');
    assertChirho(await editorChirho.inputValue() === 'private-navigation-draft-chirho', 'search input never edits or clears the active draft');
    await pageChirho.getByRole('spinbutton', { name: 'Line number' }).fill('36');
    await pageChirho.getByRole('button', { name: 'Go', exact: true }).click();
    assertChirho(await editorChirho.getAttribute('aria-label') === 'Edit reading, line 36', 'line jump selects the named line');
    await pageChirho.getByRole('spinbutton', { name: 'Line number' }).fill('9999');
    await pageChirho.getByRole('button', { name: 'Go', exact: true }).click();
    await pageChirho.getByText('That line is not available', { exact: false }).waitFor();
    assertChirho(await editorChirho.getAttribute('aria-label') === 'Edit reading, line 36', 'missing line does not select a substitute');

    const invalidLinkChirho = linkChirho.slice(0, -1) + (linkChirho.endsWith('0') ? '1' : '0');
    await pageChirho.goto(invalidLinkChirho);
    await pageChirho.getByText('This linked reading changed', { exact: false }).waitFor();
    assertChirho(await editorChirho.count() === 0, 'source mismatch refuses automatic selection');
    assertChirho(await pageChirho.getByRole('complementary', { name: 'Draft backup' }).count() === 1, 'failed link preserves local drafts');
    await pageChirho.goto(urlChirho + '#reading-chirho=word-23-chirho');
    await pageChirho.getByText('This linked reading changed', { exact: false }).waitFor();
    assertChirho(await editorChirho.count() === 0, 'malformed link refuses selection');
    await pageChirho.evaluate((hashChirho) => { location.hash = hashChirho; }, linkChirho.slice(linkChirho.indexOf('#')));
    await editorChirho.waitFor();
    assertChirho(await editorChirho.inputValue() === 'private-navigation-draft-chirho', 'same-page fragment navigation resolves the exact reading');

    await pageChirho.locator('.reader-intro-chirho a').click();
    await pageChirho.getByLabel('Reviewer username').fill('fixture-reviewer-chirho');
    await pageChirho.getByLabel('Password', { exact: true }).fill('fixture-password-for-local-tests-only-chirho');
    await pageChirho.getByRole('button', { name: 'Sign in', exact: true }).click();
    await editorChirho.waitFor();
    assertChirho(pageChirho.url() === linkChirho && await editorChirho.inputValue() === 'private-navigation-draft-chirho', 'real local sign-in returns to the linked reading with draft intact');
    await pageChirho.waitForFunction(() => document.querySelector('.scan-canvas-chirho img')?.naturalWidth > 0);
    assertChirho(await pageChirho.getByRole('button', { name: 'Confirm & next', exact: false }).isEnabled(), 'authenticated confirmation remains available after navigation');
    for (const widthChirho of [320, 390, 700, 1024]) {
      await pageChirho.setViewportSize({ width: widthChirho, height: 700 });
      await editorChirho.scrollIntoViewIfNeeded();
      const visibilityChirho = await editorChirho.evaluate((elementChirho) => {
        const boxChirho = elementChirho.getBoundingClientRect(), xChirho = boxChirho.left + boxChirho.width / 2, yChirho = boxChirho.top + boxChirho.height / 2;
        return { hitChirho: document.elementFromPoint(xChirho, yChirho) === elementChirho, overflowChirho: document.documentElement.scrollWidth > innerWidth + 1,
          topChirho: boxChirho.top, hitTagChirho: document.elementFromPoint(xChirho, yChirho)?.outerHTML.slice(0,160) };
      });
      assertChirho(visibilityChirho.hitChirho && !visibilityChirho.overflowChirho, `editor visible and no horizontal overflow at ${widthChirho}px: ${JSON.stringify(visibilityChirho)}`);
      await pageChirho.getByRole('button', { name: 'Copy reading link', exact: true }).click();
      assertChirho(await pageChirho.getByRole('textbox', { name: 'Reading link', exact: true }).inputValue() === linkChirho, `copy control usable at ${widthChirho}px`);
      const confirmChirho = pageChirho.getByRole('button', { name: 'Confirm & next', exact: false });
      await confirmChirho.scrollIntoViewIfNeeded();
      assertChirho(await confirmChirho.evaluate((elementChirho) => { const boxChirho = elementChirho.getBoundingClientRect(); return document.elementFromPoint(boxChirho.left + boxChirho.width / 2, boxChirho.top + boxChirho.height / 2) === elementChirho; }), `confirmation is not clipped or covered at ${widthChirho}px`);
    }
    assertChirho(mutationsChirho.length === 0, 'navigation issues zero API mutations');
    assertChirho(errorsChirho.length === 0, 'no browser runtime errors');
    return { assertionsChirho: checksChirho.length, checksChirho, apiMutationsChirho: mutationsChirho.length, errorsChirho };
  } finally { await contextChirho.close(); }
}
