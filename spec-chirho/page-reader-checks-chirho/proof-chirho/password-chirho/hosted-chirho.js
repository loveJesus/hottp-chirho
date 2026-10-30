// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
async (parentPageChirho, passwordChirho) => {
  // Reads, sign-in/out and deliberately invalid saves only. Never confirms a
  // production reading. Caller supplies the private password at runtime;
  // the browser sandbox needs no filesystem access and returns no credential.
  if (typeof passwordChirho !== 'string' || !passwordChirho) throw new Error('Private reader password is missing.');
  const evidenceChirho = [], errorsChirho = [];
  const checkChirho = (conditionChirho, labelChirho) => { if (!conditionChirho) throw new Error(labelChirho); evidenceChirho.push(labelChirho); };
  for (const originChirho of ['https://hottp-chirho.bible.systems', 'https://hottp-chirho.lovejesus.workers.dev']) {
    const contextChirho = await parentPageChirho.context().browser().newContext({ viewport: { width: 390, height: 844 } });
    const pageChirho = await contextChirho.newPage();
    pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
    try {
      for (const pathChirho of ['/api-chirho/events-chirho', '/api%2Dchirho/events-chirho',
        '/api-chirho/images-chirho?key-chirho=vol-3-chirho%2Fpage-0151-chirho%2Ffull-page-chirho.png',
        '/api-chirho/export-chirho?volume-chirho=3&from-chirho=148&to-chirho=149']) {
        const responseChirho = await contextChirho.request.get(originChirho + pathChirho, { maxRedirects: 0 });
        checkChirho(responseChirho.status() === 401 && responseChirho.headers()['cache-control'] === 'private, no-store', originChirho + ': anonymous route refused ' + pathChirho);
      }
      await pageChirho.goto(originChirho + '/volumes-chirho/3/pages-chirho/151');
      await pageChirho.getByLabel('Password', { exact: true }).waitFor();
      checkChirho(pageChirho.url().includes('/reviewer-chirho?return-chirho='), originChirho + ': page opens the password screen');
      checkChirho(await pageChirho.locator('input:not([type=hidden])').count() === 1, originChirho + ': only one password field');
      checkChirho(await pageChirho.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), originChirho + ': mobile sign-in fits');
      const loginChirho = pageChirho.getByRole('button', { name: 'Open reader', exact: true });
      await loginChirho.scrollIntoViewIfNeeded();
      checkChirho(await loginChirho.evaluate((elementChirho) => { const boxChirho = elementChirho.getBoundingClientRect(); return document.elementFromPoint(boxChirho.x + boxChirho.width / 2, boxChirho.y + boxChirho.height / 2) === elementChirho; }), originChirho + ': login button is reachable');
      await pageChirho.getByLabel('Password', { exact: true }).fill(passwordChirho);
      await loginChirho.click();
      await pageChirho.waitForURL(originChirho + '/volumes-chirho/3/pages-chirho/151');
      checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes('signed in'), originChirho + ': one password opens the signed-in reader');
      const cookieChirho = (await contextChirho.cookies()).find((itemChirho) => itemChirho.name === 'hottp-review-session-chirho');
      checkChirho(cookieChirho?.httpOnly && cookieChirho.secure && cookieChirho.sameSite === 'Strict', originChirho + ': secure bounded browser cookie');
      await pageChirho.reload();
      checkChirho((await pageChirho.locator('.reader-intro-chirho').innerText()).includes('signed in'), originChirho + ': reload retains access');
      await pageChirho.locator('img').first().waitFor();
      checkChirho(await pageChirho.locator('img').first().evaluate((elementChirho) => elementChirho.complete && elementChirho.naturalWidth > 0), originChirho + ': source image loads');
      const invalidSaveChirho = await contextChirho.request.post(originChirho + '/api-chirho/reading-confirmations-chirho',
        { headers: { Origin: originChirho }, data: {} });
      checkChirho(invalidSaveChirho.status() === 400, originChirho + ': shared session reaches validation; empty save refuses');
      const crossSiteChirho = await contextChirho.request.post(originChirho + '/api-chirho/reading-confirmations-chirho',
        { headers: { Origin: 'https://elsewhere.invalid' }, data: {} });
      checkChirho(crossSiteChirho.status() === 403, originChirho + ': cross-site save refuses');
      const homeChirho = await contextChirho.request.get(originChirho + '/');
      checkChirho(homeChirho.status() === 200 && (await homeChirho.text()).includes('find-chirho'), originChirho + ': updated home and find navigation load');
      const findChirho = await contextChirho.request.get(originChirho + '/find-chirho?q-chirho=Psaumes+22%2C17');
      checkChirho(findChirho.status() === 200, originChirho + ': reference search responds');
      await pageChirho.goto(originChirho + '/reviewer-chirho');
      await pageChirho.getByRole('button', { name: 'Sign out', exact: true }).click();
      checkChirho((await contextChirho.request.get(originChirho + '/api-chirho/events-chirho')).status() === 401, originChirho + ': sign out closes access');
    } finally { await contextChirho.close(); }
  }
  checkChirho(errorsChirho.length === 0, 'zero hosted browser runtime errors');
  return { assertionsChirho: evidenceChirho.length, evidenceChirho, errorsChirho };
}
