// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho) => {
  // Local copied D1/R2 only. Synthetic sign-in exercises confirmation holds;
  // every content mutation is intercepted, including programmatic clicks.
  const originChirho = 'http://127.0.0.1:5184';
  const pagePathChirho = '/volumes-chirho/3/pages-chirho/151';
  const storageKeyChirho = 'hottp-page-drafts-v1-chirho';
  const resultsChirho = [], errorsChirho = [], writesChirho = [], contextsChirho = [];
  let activePageChirho;
  function checkChirho(valueChirho, labelChirho) { if (!valueChirho) throw new Error(labelChirho); resultsChirho.push(labelChirho); }
  function canonicalChirho(valueChirho) {
    if (Array.isArray(valueChirho)) return valueChirho.map(canonicalChirho);
    if (valueChirho && typeof valueChirho === 'object') return Object.fromEntries(Object.keys(valueChirho).sort().map((keyChirho) => [keyChirho, canonicalChirho(valueChirho[keyChirho])]));
    return valueChirho;
  }
  async function newPageChirho() {
    const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
    contextsChirho.push(contextChirho);
    await contextChirho.route('**/api-chirho/**', (routeChirho) => {
      if (['GET', 'HEAD'].includes(routeChirho.request().method())) return routeChirho.continue();
      writesChirho.push(routeChirho.request().url());
      return routeChirho.fulfill({ status: 409, body: 'test guard: no content writes' });
    });
    const pageChirho = await contextChirho.newPage(); activePageChirho = pageChirho;
    pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
    await pageChirho.goto(originChirho + pagePathChirho);
    await pageChirho.locator('.reading-token-chirho:not([disabled])').first().waitFor();
    return pageChirho;
  }
  async function downloadChirho(pageChirho) {
    const nextChirho = pageChirho.waitForEvent('download');
    await pageChirho.getByRole('button', { name: 'Download all drafts', exact: true }).click();
    const fileChirho = await nextChirho, streamChirho = await fileChirho.createReadStream();
    let rawChirho = ''; for await (const chunkChirho of streamChirho) rawChirho += chunkChirho.toString();
    return JSON.parse(rawChirho);
  }
  async function chooseChirho(pageChirho, backupChirho, nameChirho = 'reading-backup-chirho.json') {
    const detailsChirho = pageChirho.locator('.draft-backup-chirho details');
    if (!await detailsChirho.evaluate((elementChirho) => elementChirho.open)) await detailsChirho.locator('summary').click();
    await pageChirho.getByLabel('Draft backup file').setInputFiles({ name: nameChirho, mimeType: 'application/json', buffer: Buffer.from(typeof backupChirho === 'string' ? backupChirho : JSON.stringify(backupChirho)) });
  }
  async function restoreChirho(pageChirho, backupChirho) {
    await chooseChirho(pageChirho, backupChirho);
    await pageChirho.getByRole('button', { name: 'Restore drafts', exact: true }).click();
  }
  async function shelfChirho(pageChirho) { return pageChirho.evaluate((keyChirho) => sessionStorage.getItem(keyChirho), storageKeyChirho); }
  async function clearChirho(pageChirho) {
    pageChirho.once('dialog', (dialogChirho) => dialogChirho.accept());
    await pageChirho.getByRole('button', { name: 'Discard page drafts', exact: true }).click();
  }
  async function hitChirho(pageChirho, locatorChirho) {
    await locatorChirho.scrollIntoViewIfNeeded();
    return locatorChirho.evaluate((elementChirho) => {
      const boxChirho = elementChirho.getBoundingClientRect();
      const topChirho = document.elementFromPoint(boxChirho.x + boxChirho.width / 2, boxChirho.y + boxChirho.height / 2);
      return topChirho === elementChirho || elementChirho.contains(topChirho);
    });
  }
  try {
    const originalPageChirho = await newPageChirho();
    await originalPageChirho.getByRole('button', { name: 'ἐκρύσεις', exact: true }).click();
    await originalPageChirho.locator('textarea.inline-reading-chirho').fill('resume שָׁלוֹם e\u0301');
    await originalPageChirho.getByRole('button', { name: 'Adjust box', exact: true }).click();
    const sourceBoxChirho = originalPageChirho.locator('.scan-box-chirho[aria-pressed="true"]');
    await sourceBoxChirho.focus(); await sourceBoxChirho.press('Shift+ArrowRight');
    await originalPageChirho.waitForFunction((keyChirho) => {
      const draftChirho = JSON.parse(sessionStorage.getItem(keyChirho)).pagesChirho[0].draftsChirho[0];
      return draftChirho.boxChirho.xChirho !== draftChirho.sourceChirho.boxChirho.xChirho;
    }, storageKeyChirho);
    const backupChirho = await downloadChirho(originalPageChirho);
    checkChirho(backupChirho.approved_chirho === false && backupChirho.drafts_chirho[0].boxChirho.xChirho !== backupChirho.drafts_chirho[0].sourceChirho.boxChirho.xChirho, 'real download carries raw source, proposed text and changed box, not approval');
    await originalPageChirho.getByRole('button', { name: 'Discard draft', exact: true }).click();
    await restoreChirho(originalPageChirho, backupChirho);
    checkChirho(await originalPageChirho.locator('textarea.inline-reading-chirho').inputValue() === backupChirho.drafts_chirho[0].textChirho && await originalPageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'anonymous readers can restore local drafts without gaining permission to confirm');
    await originalPageChirho.context().close(); contextsChirho.shift();

    const pageChirho = await newPageChirho();
    checkChirho(await shelfChirho(pageChirho) === null, 'fresh browser context has no inherited tab backup');
    await pageChirho.goto(`${originChirho}/reviewer-chirho?return-chirho=${encodeURIComponent(pagePathChirho)}`);
    await pageChirho.locator('input[name="user_chirho"]').fill('restore-fixture-chirho');
    await pageChirho.locator('input[name="password_chirho"]').fill('local-draft-fixture-only-20261015-chirho');
    await pageChirho.getByRole('button', { name: 'Sign in', exact: true }).click();
    await pageChirho.waitForURL(originChirho + pagePathChirho);
    await pageChirho.getByRole('button', { name: 'ἐκρύσεις', exact: true }).click();
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).waitFor();
    await pageChirho.waitForFunction(() => !document.querySelector('.confirm-reading-chirho')?.disabled);
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isEnabled(), 'signed-in clean reading enables confirmation before importing geometry');
    await pageChirho.reload();
    const beforeBadgeChirho = await pageChirho.locator('.reader-intro-chirho span').innerText();
    await chooseChirho(pageChirho, backupChirho);
    await pageChirho.locator('.backup-preview-chirho').waitFor();
    checkChirho(await pageChirho.locator('.backup-status-chirho').evaluate((elementChirho) => getComputedStyle(elementChirho).display !== 'none'), 'empty restore status remains rendered before its live announcement');
    checkChirho(await shelfChirho(pageChirho) === null && await pageChirho.locator('textarea.inline-reading-chirho').count() === 0, 'file selection is preview only and does not create drafts or selection');
    await pageChirho.getByRole('button', { name: 'Restore drafts', exact: true }).click();
    const editorChirho = pageChirho.locator('textarea.inline-reading-chirho');
    await pageChirho.waitForFunction(() => document.querySelector('textarea.inline-reading-chirho')?.value === 'resume שָׁלוֹם e\u0301');
    checkChirho(await editorChirho.inputValue() === backupChirho.drafts_chirho[0].textChirho, 'fresh context restores the actual downloaded multilingual draft and selection');
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'imported raw box edit holds confirmation even when signed in');
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).dispatchEvent('click');
    await editorChirho.press('Control+Enter');
    checkChirho(writesChirho.length === 0, 'geometry hold rejects dispatched confirmation and keyboard shortcut');
    checkChirho(await pageChirho.locator('.reader-intro-chirho span').innerText() === beforeBadgeChirho, 'restoration does not award a human-confirmed badge');
    const roundTripChirho = await downloadChirho(pageChirho);
    checkChirho(JSON.stringify(canonicalChirho(roundTripChirho.drafts_chirho)) === JSON.stringify(canonicalChirho(backupChirho.drafts_chirho)), 'export after import preserves source, text and geometry values without depending on object-key order');
    await pageChirho.reload();
    await pageChirho.waitForFunction(() => document.querySelector('textarea.inline-reading-chirho')?.value === 'resume שָׁלוֹם e\u0301');
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'restored geometry and its hold survive reload');

    await chooseChirho(pageChirho, backupChirho);
    await pageChirho.locator('.backup-preview-chirho').waitFor();
    await editorChirho.fill('newer edit after preview');
    await pageChirho.getByRole('button', { name: 'Restore drafts', exact: true }).click();
    checkChirho(await editorChirho.inputValue() === 'newer edit after preview', 'merge uses click-time state and never overwrites an edit made after preview');
    checkChirho(JSON.parse(await shelfChirho(pageChirho)).pagesChirho[0].draftsChirho.length === 1, 'repeated restore does not duplicate a draft');
    const beforeRefusalChirho = await shelfChirho(pageChirho);
    for (const badChirho of [{ ...backupChirho, page_id_chirho: backupChirho.page_id_chirho + 1 }, { ...backupChirho, image_key_chirho: 'different-image-chirho.png' }]) {
      await restoreChirho(pageChirho, badChirho);
      await pageChirho.locator('.backup-error-chirho').waitFor();
      checkChirho(await shelfChirho(pageChirho) === beforeRefusalChirho && await editorChirho.inputValue() === 'newer edit after preview', 'wrong page or image refuses without changing visible or stored work');
    }
    for (const badChirho of ['{broken', { ...backupChirho, approved_chirho: true }, 'x'.repeat(4 * 1024 * 1024 + 1)]) {
      await chooseChirho(pageChirho, badChirho);
      await pageChirho.locator('.backup-error-chirho').waitFor();
      checkChirho(await shelfChirho(pageChirho) === beforeRefusalChirho && await pageChirho.getByRole('button', { name: 'Restore drafts', exact: true }).count() === 0, 'malformed, approval-marked or oversized file has no restore action and preserves work');
    }
    await pageChirho.evaluate(() => {
      window.fileTextBeforeRestoreChirho = File.prototype.text;
      File.prototype.text = function() {
        if (this.name === 'slow-backup-chirho.json') return new Promise((resolveChirho, rejectChirho) => {
          window.finishSlowFileChirho = () => window.fileTextBeforeRestoreChirho.call(this).then(resolveChirho, rejectChirho);
        });
        return window.fileTextBeforeRestoreChirho.call(this);
      };
    });
    await chooseChirho(pageChirho, backupChirho, 'slow-backup-chirho.json');
    await chooseChirho(pageChirho, backupChirho, 'latest-backup-chirho.json');
    await pageChirho.locator('.backup-preview-chirho').waitFor();
    await pageChirho.evaluate(async () => { await window.finishSlowFileChirho(); File.prototype.text = window.fileTextBeforeRestoreChirho; });
    checkChirho((await pageChirho.locator('.backup-preview-chirho').innerText()).includes('latest-backup-chirho.json'), 'late completion of an older file cannot replace the latest preview');

    await clearChirho(pageChirho);
    checkChirho(await pageChirho.locator('.backup-status-chirho').innerText() === '', 'discarding page drafts clears an obsolete restore success message');
    const staleChirho = JSON.parse(JSON.stringify(backupChirho));
    staleChirho.drafts_chirho[0].sourceChirho.textChirho = 'older source';
    staleChirho.drafts_chirho[0].sourceChirho.confirmedChirho = true;
    staleChirho.drafts_chirho[0].sourceChirho.reviewStateChirho = 'recorded-chirho';
    await restoreChirho(pageChirho, staleChirho);
    checkChirho(await editorChirho.isDisabled() && await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'stale imported source locks editing and confirmation instead of rebasing');
    checkChirho(await pageChirho.locator('.reader-intro-chirho span').innerText() === beforeBadgeChirho, 'claimed confirmation in an imported source cannot mint a current badge');
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).dispatchEvent('click');
    checkChirho(writesChirho.length === 0, 'stale imported source blocks programmatic confirmation');
    checkChirho((await downloadChirho(pageChirho)).drafts_chirho[0].sourceChirho.textChirho === 'older source', 'stale original source stays downloadable for comparison');
    await clearChirho(pageChirho);

    await editorChirho.fill('draft from older image');
    await pageChirho.addInitScript((keyChirho) => {
      if (sessionStorage.getItem('older-image-fixture-chirho') !== '1') return;
      sessionStorage.removeItem('older-image-fixture-chirho');
      const shelfChirho = JSON.parse(sessionStorage.getItem(keyChirho));
      shelfChirho.pagesChirho[0].imageKeyChirho = 'older-image-chirho.png';
      sessionStorage.setItem(keyChirho, JSON.stringify(shelfChirho));
    }, storageKeyChirho);
    await pageChirho.evaluate(() => sessionStorage.setItem('older-image-fixture-chirho', '1'));
    await pageChirho.reload();
    await pageChirho.waitForFunction(() => document.querySelector('textarea.inline-reading-chirho')?.disabled);
    const beforeHeldChirho = await shelfChirho(pageChirho);
    await restoreChirho(pageChirho, backupChirho);
    checkChirho((await pageChirho.locator('.backup-error-chirho').innerText()).includes('Drafts already in this tab'), 'existing older-image drafts are identified as the obstacle, not the current-image file');
    checkChirho(await shelfChirho(pageChirho) === beforeHeldChirho, 'held-image refusal preserves the previous drafts without rebasing');
    await clearChirho(pageChirho);
    const missingChirho = JSON.parse(JSON.stringify(backupChirho));
    missingChirho.drafts_chirho[0].sourceChirho.idChirho = 99999999;
    missingChirho.drafts_chirho[0].sourceChirho.keyChirho = 'word-99999999-chirho';
    missingChirho.drafts_chirho[0].sourceChirho.kindChirho = 'word-chirho';
    await restoreChirho(pageChirho, missingChirho);
    checkChirho((await pageChirho.getByRole('alert').allTextContents()).some((textChirho) => textChirho.includes('no longer match')), 'missing record is retained as a held draft, not silently dropped');
    checkChirho((await downloadChirho(pageChirho)).drafts_chirho[0].sourceChirho.idChirho === 99999999, 'missing record keeps its original identity in downloads');
    await clearChirho(pageChirho);

    const plainChirho = JSON.parse(JSON.stringify(backupChirho));
    plainChirho.drafts_chirho[0].boxChirho = { ...plainChirho.drafts_chirho[0].sourceChirho.boxChirho };
    await pageChirho.getByRole('button', { name: 'ἔκρυσις', exact: true }).click();
    await editorChirho.fill('keep this other draft');
    const beforeQuotaChirho = await shelfChirho(pageChirho);
    await pageChirho.evaluate((keyChirho) => {
      window.setItemBeforeRestoreChirho = Storage.prototype.setItem;
      Storage.prototype.setItem = function(nameChirho, valueChirho) {
        if (nameChirho === keyChirho) throw new Error('fixture quota refusal');
        return window.setItemBeforeRestoreChirho.call(this, nameChirho, valueChirho);
      };
    }, storageKeyChirho);
    await restoreChirho(pageChirho, plainChirho);
    checkChirho(await editorChirho.inputValue() === 'keep this other draft', 'restoring another record preserves current selection and draft');
    checkChirho(await shelfChirho(pageChirho) === beforeQuotaChirho, 'quota refusal leaves the earlier stored backup intact');
    checkChirho((await pageChirho.getByRole('alert').allTextContents()).some((textChirho) => textChirho.includes('quota refusal')), 'quota failure is visible rather than claiming durable recovery');
    checkChirho((await pageChirho.locator('.backup-status-chirho').innerText()).includes('In memory only'), 'restore result explicitly reports failed tab persistence');
    checkChirho((await downloadChirho(pageChirho)).drafts_chirho.length === 2, 'both existing and imported drafts remain downloadable after quota failure');
    await pageChirho.evaluate(() => { window.confirmBeforeRestoreChirho = window.confirm; window.leaveAttemptsChirho = 0;
      window.confirm = () => { window.leaveAttemptsChirho++; return false; }; });
    await pageChirho.getByRole('link', { name: 'Next page', exact: true }).click();
    await pageChirho.waitForFunction(() => window.leaveAttemptsChirho > 0);
    checkChirho(pageChirho.url() === originChirho + pagePathChirho, 'failed restore backup retains the cancellable navigation guard');
    await pageChirho.evaluate(() => { Storage.prototype.setItem = window.setItemBeforeRestoreChirho; window.confirm = window.confirmBeforeRestoreChirho; });
    await pageChirho.getByRole('button', { name: plainChirho.drafts_chirho[0].textChirho, exact: true }).click();
    checkChirho(await editorChirho.inputValue() === plainChirho.drafts_chirho[0].textChirho, 'restored draft remains editable after storage recovers');
    checkChirho(!(await pageChirho.locator('.backup-status-chirho').innerText()).includes('In memory only'), 'recovered persistence clears the stale memory-only warning');
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isEnabled(), 'unchanged-source text-only recovery still permits later explicit review');

    for (const widthChirho of [320, 390, 1024]) {
      await pageChirho.setViewportSize({ width: widthChirho, height: 700 });
      checkChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `no horizontal overflow at ${widthChirho}px`);
      checkChirho(await hitChirho(pageChirho, pageChirho.getByLabel('Draft backup file')), `restore input is not covered at ${widthChirho}px`);
      checkChirho(await hitChirho(pageChirho, editorChirho), `reading editor is not covered at ${widthChirho}px`);
    }
    await pageChirho.setViewportSize({ width: 390, height: 844 });
    await pageChirho.getByLabel('Draft backup file').scrollIntoViewIfNeeded();
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-10-15-draft-restore-chirho/mobile-chirho.png' });
    await pageChirho.setViewportSize({ width: 1440, height: 1000 });
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-10-15-draft-restore-chirho/desktop-chirho.png', fullPage: true });
    checkChirho(writesChirho.length === 0 && errorsChirho.length === 0, 'entire restore workflow made zero content mutations and had zero runtime errors');
    return { assertionsChirho: resultsChirho.length, resultsChirho, writesChirho, errorsChirho };
  } catch (errorChirho) {
    throw new Error(JSON.stringify({ passedChirho: resultsChirho, errorChirho: String(errorChirho), alertsChirho: await activePageChirho?.getByRole('alert').allTextContents() }));
  } finally { for (const contextChirho of contextsChirho) await contextChirho.close(); }
}
