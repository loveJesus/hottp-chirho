// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
// Explicit release smoke: reads and refused mutations only; never submit a valid reading.
if (process.env.HOTTP_HOSTED_READER_SMOKE_CHIRHO !== 'read-and-refuse-only-chirho') throw new Error('Explicit hosted smoke opt-in required.');
const originChirho = 'https://hottp-chirho.bible.systems';
const evidenceChirho: string[] = [];
function checkChirho(valueChirho: unknown, labelChirho: string): asserts valueChirho {
  if (!valueChirho) throw new Error(labelChirho);
  evidenceChirho.push(labelChirho);
}
async function eventCountChirho(): Promise<string> {
  const accountChirho = process.env.CLOUDFLARE_GLOBAL_API_MAIN_ACCOUNT_ID_CHIRHO;
  checkChirho(accountChirho === 'aecd5616f7ef88323e52b6406ba384bd', 'expected Cloudflare account');
  const responseChirho = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountChirho}/d1/database/873a8eda-1551-4ee7-9e3b-9b281b6c1635/query`, {
    method: 'POST', headers: { 'X-Auth-Key': process.env.CLOUDFLARE_GLOBAL_API_KEY_CHIRHO!, 'X-Auth-Email': process.env.CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: 'SELECT count(*) AS count_chirho, max(seq_chirho) AS max_seq_chirho FROM events_chirho', params: [] }),
  });
  const bodyChirho = await responseChirho.json() as { success: boolean; result: { results: unknown[]; meta: { rows_written: number } }[] };
  checkChirho(responseChirho.ok && bodyChirho.success && bodyChirho.result[0]?.meta.rows_written === 0, 'event ledger SELECT writes zero rows');
  return JSON.stringify(bodyChirho.result[0]!.results);
}
const beforeChirho = await eventCountChirho();
for (const hostChirho of [originChirho, 'https://hottp-chirho.lovejesus.workers.dev']) {
  for (const [routeChirho, methodChirho] of [
    ['events-chirho', 'POST'], ['segments-chirho', 'PATCH'], ['scanlines-chirho', 'PATCH'], ['snippets-chirho', 'PATCH'],
    ['known-words-chirho', 'POST'], ['known-words-chirho', 'PATCH'], ['known-words-chirho?id-chirho=1', 'DELETE'], ['reading-confirmations-chirho', 'POST'],
  ]) {
    for (const prefixChirho of ['/api-chirho/', '/api%2Dchirho/']) {
      const responseChirho = await fetch(hostChirho + prefixChirho + routeChirho, { method: methodChirho, headers: { Origin: hostChirho, 'Content-Type': 'application/json' }, body: '{}' });
      checkChirho(responseChirho.status === 401, `${hostChirho} ${prefixChirho}${routeChirho} ${methodChirho} refuses anonymous write`);
      await responseChirho.body?.cancel();
    }
  }
}
const eventsChirho = await fetch(originChirho + '/api-chirho/events-chirho?limit-chirho=1');
checkChirho(eventsChirho.status === 200, 'public event sync remains readable');
await eventsChirho.body?.cancel();
const loginChirho = await fetch(originChirho + '/reviewer-chirho?return-chirho=%2Fvolumes-chirho%2F3%2Fpages-chirho%2F151&/loginChirho', {
  method: 'POST', redirect: 'manual', headers: { Origin: originChirho, Accept: 'text/html', 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ user_chirho: process.env.HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO!, password_chirho: process.env.HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO! }),
});
checkChirho(loginChirho.status === 303 && loginChirho.headers.get('location') === '/volumes-chirho/3/pages-chirho/151', 'real shared credential signs in and returns to the reading');
const setCookieChirho = loginChirho.headers.get('set-cookie') ?? '';
checkChirho(/HttpOnly/i.test(setCookieChirho) && /; Secure/i.test(setCookieChirho) && /SameSite=Strict/i.test(setCookieChirho) && /Max-Age=28800/i.test(setCookieChirho), 'hosted session is Secure HttpOnly Strict and eight-hour bounded');
const cookieChirho = setCookieChirho.split(';')[0]!;
const signedChirho = await fetch(originChirho + '/reviewer-chirho', { headers: { Cookie: cookieChirho } });
checkChirho(signedChirho.ok && (await signedChirho.text()).includes('Sign out'), 'signed session survives a new hosted request');
for (const [headersChirho, statusChirho, labelChirho] of [
  [{ Origin: 'https://elsewhere.invalid', 'Content-Type': 'application/json' }, 403, 'cross-origin'],
  [{ Origin: originChirho, 'Content-Type': 'text/plain' }, 415, 'non-JSON'],
  [{ Origin: originChirho, 'Content-Type': 'application/json' }, 400, 'invalid empty reading payload'],
] as const) {
  const responseChirho = await fetch(originChirho + '/api%2Dchirho/reading-confirmations-chirho', { method: 'POST', headers: { ...headersChirho, Cookie: cookieChirho }, body: '{}' });
  checkChirho(responseChirho.status === statusChirho, `signed ${labelChirho} mutation refused`);
  await responseChirho.body?.cancel();
}
const pageChirho = await fetch(originChirho + '/volumes%2Dchirho/3/pages-chirho/151', { headers: { Cookie: cookieChirho } });
checkChirho(pageChirho.ok && pageChirho.headers.get('cache-control') === 'private, no-store', 'encoded signed page is private and not cached');
await pageChirho.body?.cancel();
const logoutChirho = await fetch(originChirho + '/reviewer-chirho?/logoutChirho', { method: 'POST', redirect: 'manual', headers: { Origin: originChirho, Cookie: cookieChirho, Accept: 'text/html', 'Content-Type': 'application/x-www-form-urlencoded' }, body: '' });
checkChirho(logoutChirho.status === 303 && /Max-Age=0/i.test(logoutChirho.headers.get('set-cookie') ?? ''), 'logout clears browser session');
const afterChirho = await eventCountChirho();
checkChirho(beforeChirho === afterChirho, 'production event count and sequence unchanged through smoke');
const localVersionChirho = await Bun.file('app-chirho/.svelte-kit/cloudflare/_app/version.json').text();
checkChirho(await (await fetch(originChirho + '/_app/version.json')).text() === localVersionChirho, 'hosted asset version matches the committed-source build');
console.log(JSON.stringify({ assertions_chirho: evidenceChirho.length, evidence_chirho: evidenceChirho, event_ledger_chirho: JSON.parse(afterChirho) }, null, 2));
