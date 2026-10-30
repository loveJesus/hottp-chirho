// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho) => {
  // A valid save is exercised ONLY on the explicitly local copied database.
  const originChirho = 'http://127.0.0.1:5186';
  const passwordChirho = 'fixture-password-for-local-tests-only-chirho';
  const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const pageChirho = await contextChirho.newPage(), evidenceChirho = [], errorsChirho = [];
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  const checkChirho = (conditionChirho, labelChirho) => { if (!conditionChirho) throw new Error(labelChirho); evidenceChirho.push(labelChirho); };
  const eventsChirho = async () => (await (await contextChirho.request.get(originChirho + '/api-chirho/events-chirho?limit-chirho=1000')).json()).eventsChirho;
  try {
    for (const pathChirho of ['/', '/find-chirho?q-chirho=Isaiah+8%3A12', '/volumes-chirho/3?from-chirho=149',
      '/volumes%2Dchirho/3/pages-chirho/151', '/volumes-chirho/3/pages-chirho/151/__data.json']) {
      const responseChirho = await contextChirho.request.get(originChirho + pathChirho, { maxRedirects: 0 });
      const dataRedirectChirho = pathChirho.endsWith('/__data.json') ? await responseChirho.json() : null;
      checkChirho(dataRedirectChirho
        ? responseChirho.status() === 200 && dataRedirectChirho.type === 'redirect' && dataRedirectChirho.location.startsWith('/reviewer-chirho?') && !dataRedirectChirho.nodes
        : responseChirho.status() === 303 && responseChirho.headers().location.startsWith('/reviewer-chirho?'),
      'anonymous page/data requires the password: ' + pathChirho);
    }
    for (const pathChirho of ['/api-chirho/pages-chirho', '/api-chirho/events-chirho',
      '/api-chirho/export-chirho?volume-chirho=3&from-chirho=148&to-chirho=149',
      '/api-chirho/images-chirho?key-chirho=vol-3-chirho%2Fpage-0151-chirho%2Ffull-page-chirho.png',
      '/api%2Dchirho/events-chirho']) {
      const responseChirho = await contextChirho.request.get(originChirho + pathChirho, { maxRedirects: 0 });
      checkChirho(responseChirho.status() === 401 && responseChirho.headers()['cache-control'] === 'private, no-store', 'anonymous API/image/download is refused: ' + pathChirho);
    }
    const badOriginChirho = await contextChirho.request.post(originChirho + '/reviewer-chirho?/loginChirho',
      { headers: { Origin: 'https://elsewhere.invalid', Accept: 'text/html' }, form: { password_chirho: passwordChirho } });
    checkChirho(badOriginChirho.status() === 403, 'cross-origin login is refused');
    const wrongChirho = await contextChirho.request.post(originChirho + '/reviewer-chirho?/loginChirho',
      { headers: { Origin: originChirho, Accept: 'text/html' }, form: { password_chirho: 'wrong-local-password-chirho' } });
    checkChirho(wrongChirho.status() === 401 && (await contextChirho.cookies()).length === 0, 'wrong password never earns a session');
    await pageChirho.goto(originChirho + '/volumes-chirho/3?from-chirho=149');
    await pageChirho.getByLabel('Password', { exact: true }).waitFor();
    checkChirho(await pageChirho.locator('input:not([type=hidden])').count() === 1, 'one password field; no username or email');
    for (const widthChirho of [320, 390, 1440]) {
      await pageChirho.setViewportSize({ width: widthChirho, height: 900 });
      checkChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'login fits viewport ' + widthChirho);
      const buttonChirho = pageChirho.getByRole('button', { name: 'Open reader', exact: true });
      await buttonChirho.scrollIntoViewIfNeeded();
      checkChirho(await buttonChirho.evaluate((elementChirho) => { const boxChirho = elementChirho.getBoundingClientRect(); return document.elementFromPoint(boxChirho.x + boxChirho.width / 2, boxChirho.y + boxChirho.height / 2) === elementChirho; }), 'login button is unobstructed at ' + widthChirho);
    }
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-10-30-shared-password-chirho/login-desktop-chirho.png', fullPage: true });
    await pageChirho.setViewportSize({ width: 390, height: 844 });
    await pageChirho.screenshot({ path: '/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/reviewer-ui-chirho/26-10-30-shared-password-chirho/login-mobile-chirho.png', fullPage: true });
    await pageChirho.getByLabel('Password', { exact: true }).fill(passwordChirho);
    await pageChirho.getByRole('button', { name: 'Open reader', exact: true }).click();
    await pageChirho.waitForURL(originChirho + '/volumes-chirho/3?from-chirho=149');
    checkChirho(await pageChirho.locator('.page-card-chirho').count() === 4, 'password alone returns to the requested page window');
    const cookieChirho = (await contextChirho.cookies()).find((itemChirho) => itemChirho.name === 'hottp-review-session-chirho');
    checkChirho(cookieChirho?.httpOnly && cookieChirho.sameSite === 'Strict' && cookieChirho.expires > Date.now() / 1000, 'browser retains a bounded HttpOnly Strict session');
    await pageChirho.reload();
    checkChirho(await pageChirho.locator('.page-card-chirho').count() === 4, 'reload stays signed in without another prompt');
    const imageChirho = await contextChirho.request.get(originChirho + '/api-chirho/images-chirho?key-chirho=vol-3-chirho%2Fpage-0151-chirho%2Ffull-page-chirho.png');
    checkChirho(imageChirho.status() === 200 && imageChirho.headers()['cache-control'] === 'private, no-store', 'signed-in image loads without a public cache');

    const readContextChirho = await contextChirho.browser().newContext();
    try {
      const bearerChirho = { Authorization: 'Bearer ' + passwordChirho };
      checkChirho((await readContextChirho.request.get(originChirho + '/api-chirho/events-chirho?limit-chirho=1', { headers: bearerChirho })).status() === 200, 'event-sync bearer can read bounded events');
      checkChirho((await readContextChirho.request.get(originChirho + '/api-chirho/pages-chirho', { headers: bearerChirho })).status() === 401, 'event-sync bearer grants no other read route');
      checkChirho((await readContextChirho.request.post(originChirho + '/api-chirho/events-chirho', { headers: { ...bearerChirho, Origin: originChirho }, data: {} })).status() === 401, 'event-sync bearer grants no write permission');
    } finally { await readContextChirho.close(); }

    const beforeChirho = await eventsChirho();
    await pageChirho.setViewportSize({ width: 1440, height: 1000 });
    await pageChirho.goto(originChirho + '/volumes-chirho/3/pages-chirho/151');
    await pageChirho.locator('.reading-token-chirho').first().click();
    const saveResponseChirho = pageChirho.waitForResponse((responseChirho) => responseChirho.url().endsWith('/api-chirho/reading-confirmations-chirho') && responseChirho.request().method() === 'POST');
    await pageChirho.getByRole('button', { name: 'Confirm & next →', exact: true }).click();
    const savedChirho = await saveResponseChirho, payloadChirho = savedChirho.request().postDataJSON();
    checkChirho(savedChirho.status() === 200 && (await savedChirho.json()).confirmed_chirho === true, 'one password unlocks a real reader confirmation in the copied D1');
    const afterChirho = await eventsChirho();
    checkChirho(afterChirho.length === beforeChirho.length + 1 && afterChirho.at(-1).reviewerChirho === 'shared-reviewer-chirho', 'save is attributed to the shared reviewer, not an invented individual');
    const staleChirho = await contextChirho.request.post(originChirho + '/api-chirho/reading-confirmations-chirho',
      { headers: { Origin: originChirho }, data: payloadChirho });
    checkChirho(staleChirho.status() === 409 && (await eventsChirho()).length === afterChirho.length, 'the existing stale-source/cursor check still refuses without a new event');
    await pageChirho.reload();
    checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes('1 / 600'), 'the real saved receipt survives a full reload');

    await pageChirho.goto(originChirho + '/reviewer-chirho');
    await pageChirho.getByRole('button', { name: 'Sign out', exact: true }).click();
    checkChirho((await contextChirho.cookies()).every((itemChirho) => itemChirho.name !== 'hottp-review-session-chirho'), 'sign out removes the session');
    checkChirho((await contextChirho.request.get(originChirho + '/api-chirho/events-chirho')).status() === 401, 'sign out closes API access too');
    const hashChirho = '#reading-chirho=word-1-chirho&source-chirho=' + 'a'.repeat(64);
    await pageChirho.goto(originChirho + '/volumes-chirho/3/pages-chirho/151' + hashChirho);
    await pageChirho.getByLabel('Password', { exact: true }).fill(passwordChirho);
    await pageChirho.getByRole('button', { name: 'Open reader', exact: true }).click();
    await pageChirho.waitForURL(originChirho + '/volumes-chirho/3/pages-chirho/151' + hashChirho);
    checkChirho(pageChirho.url().endsWith(hashChirho), 'shared reading fragment survives the password form');
    await contextChirho.addCookies([{ ...cookieChirho, value: cookieChirho.value.slice(0, -1) + (cookieChirho.value.endsWith('a') ? 'b' : 'a') }]);
    checkChirho((await contextChirho.request.get(originChirho + '/api-chirho/events-chirho')).status() === 401, 'tampered browser session is refused');
    let limitedChirho = false;
    for (let attemptChirho = 0; attemptChirho < 12; attemptChirho++) {
      const responseChirho = await contextChirho.request.post(originChirho + '/reviewer-chirho?/loginChirho',
        { headers: { Origin: originChirho, Accept: 'text/html' }, form: { password_chirho: 'wrong-local-password-chirho' } });
      if (responseChirho.status() === 429) { limitedChirho = true; break; }
    }
    checkChirho(limitedChirho, 'repeated incorrect passwords hit the platform login limiter');
    checkChirho(errorsChirho.length === 0, 'no browser runtime errors');
    return { assertionsChirho: evidenceChirho.length, evidenceChirho, errorsChirho };
  } finally { await contextChirho.close(); }
}
