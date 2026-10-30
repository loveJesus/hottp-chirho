// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { expect, test } from 'bun:test';
import { handle as handleChirho } from '../../../../app-chirho/src/hooks.server';

const envChirho = { HOTTP_SITE_PASSWORD_CHIRHO: 'fixture-password-for-local-tests-only-chirho',
  HOTTP_REVIEW_SESSION_SECRET_CHIRHO: 'fixture-signing-secret-for-local-tests-only-chirho' };
async function requestChirho(routeChirho: string, optionsChirho: {
  envChirho?: typeof envChirho; pathChirho?: string; methodChirho?: string; bearerChirho?: string;
} = {}) {
  let resolvedChirho = false;
  const urlChirho = new URL(optionsChirho.pathChirho ?? routeChirho, 'https://reader.invalid');
  const responseChirho = await handleChirho({
    event: { url: urlChirho, request: new Request(urlChirho, { method: optionsChirho.methodChirho ?? 'GET',
      headers: { Origin: urlChirho.origin, 'Content-Type': 'application/json', Authorization: optionsChirho.bearerChirho ?? '' } }),
      route: { id: routeChirho }, locals: { reviewerChirho: null }, cookies: { get: () => undefined },
      platform: { env: optionsChirho.envChirho } } as unknown as Parameters<typeof handleChirho>[0]['event'],
    resolve: async () => { resolvedChirho = true; return new Response('protected fixture'); },
  });
  return { responseChirho, resolvedChirho };
}
test('missing or empty password configuration never reaches protected content', async () => {
  for (const configChirho of [undefined, { ...envChirho, HOTTP_SITE_PASSWORD_CHIRHO: '' }]) {
    for (const routeChirho of ['/', '/api-chirho/images-chirho', '/api-chirho/events-chirho']) {
      const resultChirho = await requestChirho(routeChirho, { envChirho: configChirho });
      expect(resultChirho.responseChirho.status).toBe(503); expect(resultChirho.resolvedChirho).toBe(false);
    }
  }
});
test('encoded API paths use the decoded route and cannot bypass the entrance', async () => {
  const resultChirho = await requestChirho('/api-chirho/events-chirho', { envChirho, pathChirho: '/api%2Dchirho/events-chirho' });
  expect(resultChirho.responseChirho.status).toBe(401); expect(resultChirho.resolvedChirho).toBe(false);
});
test('sync password permits only event GET/HEAD, never any writer or another API', async () => {
  const bearerChirho = 'Bearer ' + envChirho.HOTTP_SITE_PASSWORD_CHIRHO;
  for (const methodChirho of ['GET', 'HEAD']) expect((await requestChirho('/api-chirho/events-chirho', { envChirho, bearerChirho, methodChirho })).resolvedChirho).toBe(true);
  for (const [routeChirho, methodChirho] of [['/api-chirho/events-chirho', 'POST'], ['/api-chirho/pages-chirho', 'GET']]) {
    const resultChirho = await requestChirho(routeChirho!, { envChirho, bearerChirho, methodChirho });
    expect(resultChirho.responseChirho.status).toBe(401); expect(resultChirho.resolvedChirho).toBe(false);
  }
});
