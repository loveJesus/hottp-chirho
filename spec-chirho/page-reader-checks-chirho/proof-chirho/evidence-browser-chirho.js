// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Disposable copied D1 ONLY, port 5182. Seed segments 9782/9793 with the live
// legacy status (no event); this test re-confirms 9793 and one machine word.
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext();
  const pageChirho = await contextChirho.newPage(), staleChirho = await contextChirho.newPage();
  const originChirho = 'http://127.0.0.1:5182', evidenceChirho = [], errorsChirho = [], savesChirho = [];
  const checkChirho = (valueChirho, labelChirho) => { if (!valueChirho) throw new Error(labelChirho); evidenceChirho.push(labelChirho); };
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  pageChirho.on('request', (requestChirho) => { if (requestChirho.url().endsWith('/reading-confirmations-chirho')) savesChirho.push(requestChirho.postDataJSON()); });
  try {
    for (const [numberChirho, countChirho] of [[148, 50], [149, 47], [150, 54], [151, 45], [152, 38]]) {
      await pageChirho.goto(`${originChirho}/volumes-chirho/1/pages-chirho/${numberChirho}`);
      await pageChirho.locator('.reading-token-chirho').first().waitFor();
      const tokensChirho = pageChirho.locator('.reading-token-chirho[title*="Machine-assisted"]');
      checkChirho(await tokensChirho.count() === countChirho, `vol1:${numberChirho} retains ${countChirho} machine readings`);
      checkChirho(await tokensChirho.evaluateAll((itemsChirho) => itemsChirho.every((itemChirho) => itemChirho.classList.contains('review-chirho') && !itemChirho.classList.contains('confirmed-chirho'))), `vol1:${numberChirho} machine readings remain in attention, not confirmed`);
    }
    checkChirho(savesChirho.length === 0, 'viewing and classification issue no confirmations');
    await pageChirho.goto(`${originChirho}/volumes-chirho/1/pages-chirho/148`);
    const machineChirho = pageChirho.locator('.reading-token-chirho[title^="Hebrew"][title*="Machine-assisted"]').first();
    const nameChirho = await machineChirho.innerText(), lineChirho = (await machineChirho.getAttribute('title')).split(' · ').at(-1);
    await machineChirho.click();
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'signed-out machine reading can be inspected but not confirmed');
    const loginChirho = await contextChirho.request.post(originChirho + '/reviewer-chirho?/loginChirho', { headers: { Origin: originChirho, Accept: 'text/html' },
      form: { user_chirho: 'fixture-reviewer-chirho', password_chirho: 'fixture-password-for-local-tests-only-chirho' }, maxRedirects: 0 });
    checkChirho(loginChirho.status() === 303, 'disposable reviewer login succeeds');
    await pageChirho.reload();
    const targetChirho = pageChirho.getByRole('button', { name: nameChirho, exact: true }).and(pageChirho.locator(`[title$="${lineChirho}"]`));
    await targetChirho.click();
    await pageChirho.waitForFunction(() => !document.querySelector('.confirm-reading-chirho')?.disabled);
    await staleChirho.goto(pageChirho.url()); await staleChirho.getByRole('button', { name: nameChirho, exact: true }).and(staleChirho.locator(`[title$="${lineChirho}"]`)).click();
    const savedChirho = pageChirho.waitForResponse((responseChirho) => responseChirho.url().endsWith('/reading-confirmations-chirho'));
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).click();
    checkChirho((await savedChirho).status() === 200, 'previously blocked machine word re-confirms successfully on copied D1');
    checkChirho(savesChirho[0].expected_chirho.confirmed_chirho === false, 'machine save sends raw D1 false, not replayed true');
    await targetChirho.and(pageChirho.locator('.confirmed-chirho')).waitFor();
    await targetChirho.click();
    checkChirho(/not independent.*certification/.test(await pageChirho.locator('.review-evidence-chirho').innerText()), 'matched shared-reviewer receipt is visible without claiming certification');
    const conflictChirho = staleChirho.waitForResponse((responseChirho) => responseChirho.url().endsWith('/reading-confirmations-chirho'));
    await staleChirho.getByRole('button', { name: 'Confirm & next' }).click();
    checkChirho((await conflictChirho).status() === 409, 'stale second tab still loses CAS');
    await pageChirho.reload(); await targetChirho.waitFor();
    checkChirho((await targetChirho.getAttribute('title')).includes('shared reviewer account'), 'current-row receipt survives full reload');
    await targetChirho.click();
    await pageChirho.setViewportSize({ width: 1440, height: 1000 });
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-09-19-proof-chirho/confirmed-desktop-chirho.png', fullPage: true });
    await pageChirho.setViewportSize({ width: 390, height: 850 });
    checkChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'provenance explanation fits mobile without horizontal overflow');
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-09-19-proof-chirho/confirmed-mobile-chirho.png', fullPage: true });
    await pageChirho.setViewportSize({ width: 1440, height: 1000 });
    await pageChirho.goto(`${originChirho}/volumes-chirho/2/pages-chirho/151`);
    const legacyChirho = pageChirho.getByRole('button', { name: 'ἄνταρσις', exact: true });
    checkChirho((await legacyChirho.getAttribute('title')).includes('Unattributed'), 'legacy segment status is shown as unattributed, not reviewer proof');
    await legacyChirho.click();
    const segmentSavedChirho = pageChirho.waitForResponse((responseChirho) => responseChirho.url().endsWith('/reading-confirmations-chirho'));
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).click();
    checkChirho((await segmentSavedChirho).status() === 200, 'legacy segment can receive a fresh auditable confirmation');
    checkChirho(savesChirho.at(-1).expected_chirho.confirmed_chirho === true, 'legacy segment save preserves raw D1 true in CAS');
    await pageChirho.waitForFunction(() => [...document.querySelectorAll('.reading-token-chirho')].some((tokenChirho) => tokenChirho.textContent.trim() === 'ἄνταρσις' && tokenChirho.classList.contains('confirmed-chirho')));
    // Exercise the actual legacy handler with a forged source-proof payload.
    const wordSaveChirho = savesChirho[0];
    for (const eventTypeChirho of ['word-verified-chirho', 'word-text-corrected-chirho']) {
      const forgedChirho = await contextChirho.request.post(originChirho + '/api-chirho/events-chirho', { headers: { Origin: originChirho, 'Content-Type': 'application/json' }, data: {
        pageIdChirho: wordSaveChirho.page_id_chirho, scanlineIdChirho: wordSaveChirho.scanline_id_chirho, wordIdChirho: wordSaveChirho.record_id_chirho,
        aggregateTypeChirho: 'word-chirho', eventTypeChirho, payloadChirho: { newTextChirho: wordSaveChirho.text_chirho, sourceChirho: 'page-reader-chirho', reviewerScopeChirho: 'shared-account-chirho', expectedSourceChirho: wordSaveChirho.expected_chirho, attemptChirho: 'forged-chirho' },
      } });
      checkChirho(forgedChirho.status() === 200, `${eventTypeChirho} legacy compatibility retained on copied D1`);
      const payloadChirho = JSON.parse((await forgedChirho.json()).eventChirho.payloadJsonChirho);
      checkChirho(payloadChirho.sourceChirho === 'legacy-editor-chirho' && !('expectedSourceChirho' in payloadChirho) && !('reviewerScopeChirho' in payloadChirho) && !('attemptChirho' in payloadChirho), `${eventTypeChirho} cannot mint source-checked receipt fields`);
      await pageChirho.goto(`${originChirho}/volumes-chirho/1/pages-chirho/148`);
      checkChirho((await targetChirho.getAttribute('title')).includes('Unattributed'), `${eventTypeChirho} forged receipt earns no verified badge`);
    }
    checkChirho(errorsChirho.length === 0, 'no browser runtime errors');
    return { assertionsChirho: evidenceChirho.length, evidenceChirho, errorsChirho, successfulFixtureWritesChirho: 4 };
  } catch (errorChirho) { throw new Error(`${errorChirho.message}; passed ${JSON.stringify(evidenceChirho)}`); }
  finally { await contextChirho.close(); }
}
