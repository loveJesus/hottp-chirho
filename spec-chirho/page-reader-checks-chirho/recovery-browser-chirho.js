// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho) => {
  const pageChirho = await parentPageChirho.context().newPage();
  const resultsChirho = [], runtimeErrorsChirho = [], writesChirho = [];
  const storageKeyChirho = 'hottp-page-drafts-v1-chirho';
  const pageUrlChirho = 'http://127.0.0.1:5178/volumes-chirho/3/pages-chirho/151';
  await pageChirho.addInitScript((keyChirho) => {
    const modeChirho = sessionStorage.getItem('draft-fixture-mode-chirho');
    if (!modeChirho) return;
    sessionStorage.removeItem('draft-fixture-mode-chirho');
    const shelfChirho = JSON.parse(sessionStorage.getItem(keyChirho));
    if (modeChirho === 'text-chirho') shelfChirho.pagesChirho[0].draftsChirho[0].sourceChirho.textChirho = 'older-source-chirho';
    if (modeChirho === 'image-chirho') shelfChirho.pagesChirho[0].imageKeyChirho = 'older-image-chirho';
    sessionStorage.setItem(keyChirho, JSON.stringify(shelfChirho));
  }, storageKeyChirho);
  function checkChirho(valueChirho, labelChirho) { if (!valueChirho) throw new Error(labelChirho); resultsChirho.push(labelChirho); }
  pageChirho.on('pageerror', (errorChirho) => runtimeErrorsChirho.push(errorChirho.message));
  await pageChirho.route('**/api-chirho/**', (routeChirho) => {
    if (['GET', 'HEAD'].includes(routeChirho.request().method())) return routeChirho.continue();
    writesChirho.push(routeChirho.request().postDataJSON());
    return routeChirho.fulfill({ status: 409, body: 'test guard: no real write' });
  });
  try {
    await pageChirho.setViewportSize({ width: 1440, height: 1000 });
    await pageChirho.goto(pageUrlChirho);
    await pageChirho.getByRole('button', { name: 'ἐκρύσεις', exact: true }).click();
    const editorChirho = pageChirho.getByRole('textbox');
    await editorChirho.fill('resume-draft-chirho');
    checkChirho((await pageChirho.evaluate((keyChirho) => sessionStorage.getItem(keyChirho), storageKeyChirho)).includes('resume-draft-chirho'), 'typing persists an unsubmitted tab-local draft');
    await pageChirho.reload();
    await pageChirho.waitForFunction(() => document.querySelector('textarea')?.value === 'resume-draft-chirho');
    checkChirho(await editorChirho.inputValue() === 'resume-draft-chirho', 'refresh restores draft text and selected reading');
    checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes('0 /'), 'restoration never marks a reading confirmed');
    await pageChirho.getByRole('button', { name: 'Adjust box', exact: true }).click();
    const boxChirho = pageChirho.locator('.scan-box-chirho[aria-pressed="true"]');
    await boxChirho.focus(); await boxChirho.press('Shift+ArrowRight');
    const changedStyleChirho = await boxChirho.getAttribute('style');
    await pageChirho.reload();
    await pageChirho.waitForFunction(() => document.querySelector('textarea')?.value === 'resume-draft-chirho');
    checkChirho(await boxChirho.getAttribute('style') === changedStyleChirho, 'box geometry survives refresh');
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'recovered box changes retain the confirmation hold');
    await pageChirho.getByRole('link', { name: 'Next page', exact: true }).click();
    await pageChirho.waitForURL('**/152');
    await pageChirho.goto(pageUrlChirho);
    await pageChirho.waitForFunction(() => document.querySelector('textarea')?.value === 'resume-draft-chirho');
    checkChirho(await editorChirho.inputValue() === 'resume-draft-chirho', 'page navigation and revisit retain unfinished work');
    checkChirho(writesChirho.length === 0, 'edit, restore, navigation and geometry issue no server writes');

    await pageChirho.evaluate(() => sessionStorage.setItem('draft-fixture-mode-chirho', 'text-chirho'));
    await pageChirho.reload();
    await pageChirho.getByRole('alert').waitFor();
    checkChirho(await editorChirho.isDisabled() && await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'stale text baseline holds editing and confirmation');
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).dispatchEvent('click');
    checkChirho(writesChirho.length === 0, 'conflict guard also refuses a dispatched confirmation event');
    const downloadPromiseChirho = pageChirho.waitForEvent('download');
    await pageChirho.getByRole('button', { name: 'Download all drafts', exact: true }).click();
    const downloadChirho = await downloadPromiseChirho;
    const streamChirho = await downloadChirho.createReadStream();
    let dataChirho = ''; for await (const chunkChirho of streamChirho) dataChirho += chunkChirho.toString();
    const exportedChirho = JSON.parse(dataChirho);
    checkChirho(exportedChirho.approved_chirho === false && exportedChirho.drafts_chirho[0].sourceChirho.textChirho === 'older-source-chirho' && exportedChirho.drafts_chirho[0].textChirho === 'resume-draft-chirho', 'conflicting source and proposed reading remain exportable');
    await pageChirho.getByRole('button', { name: 'Discard draft', exact: true }).click();
    checkChirho(await editorChirho.inputValue() === 'ἐκρύσεις', 'explicit discard restores current source reading');
    checkChirho(await pageChirho.evaluate((keyChirho) => sessionStorage.getItem(keyChirho), storageKeyChirho) === null, 'last draft removal clears only the draft backup key');

    await editorChirho.fill('another-draft-chirho');
    await pageChirho.evaluate(() => sessionStorage.setItem('draft-fixture-mode-chirho', 'image-chirho'));
    await pageChirho.reload(); await pageChirho.getByRole('alert').waitFor();
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'changed image key prevents restoring authority to old drafts');
    await pageChirho.getByRole('button', { name: 'Discard draft', exact: true }).click();
    const countChirho = await pageChirho.locator('.reading-token-chirho').count();
    await pageChirho.getByLabel('Move through').selectOption('greek-chirho');
    await editorChirho.press('Tab');
    checkChirho(await editorChirho.inputValue() === 'ἔκρυσις', 'language traversal skips French fields');
    checkChirho(await pageChirho.locator('.reading-token-chirho').count() === countChirho && (await pageChirho.locator('.reader-lines-chirho').innerText()).includes('Field'), 'language traversal keeps full French context');
    await pageChirho.getByLabel('Move through').selectOption('attention-chirho');
    await editorChirho.press('Tab');
    checkChirho(await editorChirho.inputValue() !== 'du', 'attention traversal skips ordinary French readings');

    await pageChirho.evaluate(() => {
      window.setItemBeforeTestChirho = Storage.prototype.setItem;
      Storage.prototype.setItem = function(keyChirho, valueChirho) { if (keyChirho === 'hottp-page-drafts-v1-chirho') throw new Error('test quota failure'); return window.setItemBeforeTestChirho.call(this, keyChirho, valueChirho); };
    });
    await editorChirho.fill('quota-draft-chirho');
    await pageChirho.getByRole('alert').waitFor();
    checkChirho(await editorChirho.inputValue() === 'quota-draft-chirho', 'denied storage keeps current edits visible with a warning');
    await pageChirho.evaluate(() => { window.confirmBeforeTestChirho = window.confirm; window.confirmCountChirho = 0; window.confirm = () => { window.confirmCountChirho++; return false; }; });
    await pageChirho.getByRole('link', { name: 'Next page', exact: true }).click();
    await pageChirho.waitForFunction(() => window.confirmCountChirho === 1);
    checkChirho(pageChirho.url() === pageUrlChirho, 'failed backup retains the cancellable navigation guard');
    await pageChirho.evaluate(() => { window.confirm = window.confirmBeforeTestChirho; Storage.prototype.setItem = window.setItemBeforeTestChirho; });
    await editorChirho.fill('quota-recovered-chirho');
    checkChirho((await pageChirho.evaluate((keyChirho) => sessionStorage.getItem(keyChirho), storageKeyChirho)).includes('quota-recovered-chirho'), 'backup resumes when storage becomes available');
    await pageChirho.getByRole('button', { name: 'Discard draft', exact: true }).click();

    await pageChirho.evaluate((keyChirho) => sessionStorage.setItem(keyChirho, '{broken-test-chirho'), storageKeyChirho);
    await pageChirho.reload(); await pageChirho.getByRole('alert').waitFor();
    await pageChirho.getByRole('button', { name: 'ἐκρύσεις', exact: true }).click();
    await editorChirho.fill('unsaved-after-corruption-chirho');
    checkChirho(await pageChirho.evaluate((keyChirho) => sessionStorage.getItem(keyChirho), storageKeyChirho) === '{broken-test-chirho', 'malformed prior backup is never silently overwritten');
    checkChirho(await editorChirho.inputValue() === 'unsaved-after-corruption-chirho', 'corrupt backup does not break current editing');
    checkChirho(writesChirho.length === 0 && runtimeErrorsChirho.length === 0, 'recovery checks have zero server writes and zero runtime errors');
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-09-18-draft-storage-failure-chirho.png', fullPage: true });
    return { assertionsChirho: resultsChirho.length, resultsChirho, writesChirho: writesChirho.length, runtimeErrorsChirho };
  } catch (errorChirho) {
    throw new Error(JSON.stringify({ passedChirho: resultsChirho, errorChirho: String(errorChirho),
      alertTextChirho: await pageChirho.getByRole('alert').allTextContents(), draftBannerChirho: await pageChirho.locator('.draft-backup-chirho').allTextContents(),
      storageChirho: await pageChirho.evaluate((keyChirho) => sessionStorage.getItem(keyChirho), storageKeyChirho) }));
  } finally {
    await pageChirho.close({ runBeforeUnload: false });
  }
}
