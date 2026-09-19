// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Run ONLY against the disposable HOTTP_LOCAL_PERSIST_CHIRHO copy on port 5178.
async (parentPageChirho) => {
  const contextChirho = await parentPageChirho.context().browser().newContext();
  const pageChirho = await contextChirho.newPage(), staleChirho = await contextChirho.newPage();
  const originChirho = 'http://127.0.0.1:5178', pathChirho = '/volumes-chirho/3/pages-chirho/151';
  const evidenceChirho = [], errorsChirho = [];
  const checkChirho = (valueChirho, nameChirho) => { if (!valueChirho) throw new Error(nameChirho); evidenceChirho.push(nameChirho); };
  pageChirho.on('pageerror', (errorChirho) => errorsChirho.push(errorChirho.message));
  try {
    await pageChirho.goto(originChirho + pathChirho);
    await pageChirho.getByRole('button', { name: 'ἐκρύσεις', exact: true }).click();
    await pageChirho.getByRole('textbox').fill('login-draft-chirho');
    checkChirho(await pageChirho.getByRole('button', { name: 'Confirm & next' }).isDisabled(), 'signed-out readers can draft but cannot confirm');
    for (const [pathChirho, methodChirho] of [
      ['events-chirho', 'POST'], ['segments-chirho', 'PATCH'], ['scanlines-chirho', 'PATCH'], ['snippets-chirho', 'PATCH'],
      ['known-words-chirho', 'POST'], ['known-words-chirho', 'PATCH'], ['known-words-chirho?id-chirho=1', 'DELETE'], ['reading-confirmations-chirho', 'POST'],
    ]) {
      for (const prefixChirho of ['/api-chirho/', '/api%2Dchirho/']) {
        const responseChirho = await contextChirho.request.fetch(originChirho + prefixChirho + pathChirho, { method: methodChirho, headers: { Origin: originChirho, 'Content-Type': 'application/json' }, data: '{}' });
        checkChirho(responseChirho.status() === 401, `anonymous ${methodChirho} refused at ${prefixChirho}${pathChirho}`);
      }
    }
    const publicChirho = await contextChirho.request.get(originChirho + '/api-chirho/events-chirho?limit-chirho=1');
    checkChirho(publicChirho.status() === 200, 'read-only event sync remains available');
    await pageChirho.getByRole('link', { name: 'Sign in to confirm · drafts stay here' }).click();
    await pageChirho.getByLabel('Reviewer username').fill('fixture-reviewer-chirho');
    await pageChirho.getByLabel('Password', { exact: true }).fill('wrong-chirho');
    await pageChirho.getByRole('button', { name: 'Sign in', exact: true }).click();
    checkChirho(await pageChirho.getByRole('alert').isVisible(), 'wrong credentials rejected visibly');
    await pageChirho.getByLabel('Reviewer username').fill('fixture-reviewer-chirho');
    await pageChirho.getByLabel('Password', { exact: true }).fill('fixture-password-for-local-tests-only-chirho');
    await pageChirho.getByRole('button', { name: 'Sign in', exact: true }).click();
    await pageChirho.waitForURL('**/pages-chirho/151');
    await pageChirho.waitForFunction(() => document.querySelector('textarea')?.value === 'login-draft-chirho');
    checkChirho(await pageChirho.getByRole('textbox').inputValue() === 'login-draft-chirho', 'sign-in returns to reading and recovers the unsent draft');
    const cookieChirho = (await contextChirho.cookies()).find((cookieChirho) => cookieChirho.name === 'hottp-review-session-chirho');
    checkChirho(cookieChirho.httpOnly && cookieChirho.sameSite === 'Strict' && cookieChirho.expires < Date.now() / 1000 + 28810, 'session is HttpOnly, SameSite Strict and bounded to eight hours');
    const crossChirho = await contextChirho.request.post(originChirho + '/api%2Dchirho/events-chirho', { headers: { Origin: 'https://elsewhere.invalid', 'Content-Type': 'application/json' }, data: '{}' });
    checkChirho(crossChirho.status() === 403, 'authenticated cross-origin mutation refused');
    const formChirho = await contextChirho.request.patch(originChirho + '/api-chirho/segments-chirho', { headers: { Origin: originChirho, 'Content-Type': 'text/plain' }, data: '{}' });
    checkChirho(formChirho.status() === 415, 'authenticated non-JSON API mutation refused');
    await staleChirho.goto(originChirho + pathChirho);
    await staleChirho.getByRole('button', { name: 'ἐκρύσεις', exact: true }).click();
    await staleChirho.getByRole('textbox').fill('stale-rival-chirho');
    await pageChirho.getByRole('textbox').fill('fixture-e\u0301-chirho');
    const responsePromiseChirho = pageChirho.waitForResponse((responseChirho) => responseChirho.url().endsWith('/reading-confirmations-chirho'));
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).click();
    const savedChirho = await responsePromiseChirho;
    checkChirho(savedChirho.status() === 200 && (await savedChirho.json()).confirmed_chirho, 'real segment confirmation succeeds on copied D1');
    await pageChirho.getByRole('button', { name: 'fixture-é-chirho', exact: true }).waitFor();
    checkChirho(await pageChirho.getByRole('button', { name: 'fixture-é-chirho', exact: true }).getAttribute('title').then((valueChirho) => valueChirho.includes('Human-confirmed')), 'refreshed state displays NFC text and persisted confirmation');
    const staleResponseChirho = staleChirho.waitForResponse((responseChirho) => responseChirho.url().endsWith('/reading-confirmations-chirho'));
    await staleChirho.getByRole('button', { name: 'Confirm & next' }).click();
    checkChirho((await staleResponseChirho).status() === 409 && await staleChirho.getByRole('textbox').inputValue() === 'stale-rival-chirho', 'competing stale tab is refused without losing its draft');
    await staleChirho.reload();
    await staleChirho.waitForFunction(() => document.querySelector('textarea')?.disabled);
    checkChirho(await staleChirho.getByRole('textbox').inputValue() === 'stale-rival-chirho', 'reload holds conflicting recovered draft against changed source');
    const wordChirho = pageChirho.locator('.reading-token-chirho[title^="French / Latin"]').first();
    await wordChirho.click();
    await pageChirho.getByRole('textbox').fill('fixture-word-chirho');
    const wordResponseChirho = pageChirho.waitForResponse((responseChirho) => responseChirho.url().endsWith('/reading-confirmations-chirho'));
    await pageChirho.getByRole('button', { name: 'Confirm & next' }).click();
    checkChirho((await wordResponseChirho).status() === 200, 'real word confirmation succeeds through event and projection');
    await pageChirho.reload();
    await pageChirho.getByRole('button', { name: 'fixture-word-chirho', exact: true }).waitFor();
    checkChirho(await pageChirho.getByRole('button', { name: 'fixture-word-chirho', exact: true }).getAttribute('title').then((valueChirho) => valueChirho.includes('Human-confirmed')), 'word correction survives full reload via event replay');
    await pageChirho.getByRole('link', { name: 'Reviewer access · signed in' }).click();
    await pageChirho.getByRole('button', { name: 'Sign out', exact: true }).click();
    const refusedChirho = await contextChirho.request.post(originChirho + '/api-chirho/reading-confirmations-chirho', { headers: { Origin: originChirho, 'Content-Type': 'application/json' }, data: '{}' });
    checkChirho(refusedChirho.status() === 401, 'sign-out removes write access');
    checkChirho(errorsChirho.length === 0, 'no page runtime errors');
    return { evidenceChirho, assertionsChirho: evidenceChirho.length, errorsChirho, persistenceChirho: 'disposable copied D1 only' };
  } catch (caughtChirho) { throw new Error(`${caughtChirho.message}; passed: ${JSON.stringify(evidenceChirho)}`); }
  finally { await contextChirho.close(); }
}
