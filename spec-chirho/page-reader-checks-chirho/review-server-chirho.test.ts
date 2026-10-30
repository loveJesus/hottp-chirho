// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import { configuredChirho, createSessionChirho, credentialsMatchChirho, returnPathChirho, sameOriginChirho, sessionReviewerChirho } from '../../app-chirho/src/lib/server-chirho/review-chirho/session-chirho';
import { boundedTextChirho } from '../../app-chirho/src/lib/server-chirho/review-chirho/request-chirho';

const credentialsChirho = { HOTTP_SITE_PASSWORD_CHIRHO: 'fixture-password-for-local-tests-only-chirho', HOTTP_REVIEW_SESSION_SECRET_CHIRHO: 'fixture-signing-secret-for-local-tests-only-chirho' };
describe('reviewer trust boundary', () => {
  test('missing configuration fails closed; only the shared password authenticates', async () => {
    expect(configuredChirho(undefined)).toBe(false);
    expect(configuredChirho({ ...credentialsChirho, HOTTP_REVIEW_SESSION_SECRET_CHIRHO: '' })).toBe(false);
    expect(configuredChirho({ ...credentialsChirho, HOTTP_SITE_PASSWORD_CHIRHO: '' })).toBe(false);
    expect(await credentialsMatchChirho('wrong-chirho', credentialsChirho)).toBe(false);
    expect(await credentialsMatchChirho(credentialsChirho.HOTTP_SITE_PASSWORD_CHIRHO, credentialsChirho)).toBe(true);
  });
  test('signed sessions expire and reject tamper, changed passwords, rotated secrets and malformed cookies', async () => {
    const nowChirho = Date.now(), cookieChirho = await createSessionChirho(credentialsChirho, nowChirho);
    expect(await sessionReviewerChirho(cookieChirho, credentialsChirho, nowChirho)).toBe('shared-reviewer-chirho');
    expect(await sessionReviewerChirho(cookieChirho, credentialsChirho, nowChirho + 8 * 3600 * 1000)).toBeNull();
    expect(await sessionReviewerChirho(cookieChirho.slice(0, -2) + 'zz', credentialsChirho, nowChirho)).toBeNull();
    expect(await sessionReviewerChirho(cookieChirho, { ...credentialsChirho, HOTTP_REVIEW_SESSION_SECRET_CHIRHO: 'another-signing-secret-with-enough-entropy-chirho' }, nowChirho)).toBeNull();
    expect(await sessionReviewerChirho(cookieChirho, { ...credentialsChirho, HOTTP_SITE_PASSWORD_CHIRHO: 'other-password-chirho' }, nowChirho)).toBeNull();
    expect(await sessionReviewerChirho('a'.repeat(10000), credentialsChirho)).toBeNull();
  });
  test('origin and return location cannot be supplied by another site', () => {
    for (const originChirho of [null, 'https://elsewhere.invalid', 'null']) {
      expect(sameOriginChirho(new Request('https://hottp.invalid/api-chirho/test-chirho', { headers: originChirho ? { Origin: originChirho } : {} }))).toBe(false);
    }
    expect(sameOriginChirho(new Request('https://hottp.invalid/api-chirho/test-chirho', { headers: { Origin: 'https://hottp.invalid' } }))).toBe(true);
    for (const pathChirho of ['//other.invalid', '/\\other.invalid', 'https://other.invalid', '/volumes-chirho/3?redirect=evil']) expect(returnPathChirho(pathChirho)).toBe('/');
    expect(returnPathChirho('/volumes-chirho/3/pages-chirho/151')).toBe('/volumes-chirho/3/pages-chirho/151');
    expect(returnPathChirho('/find-chirho?q-chirho=Isaiah+8%3A12')).toBe('/find-chirho?q-chirho=Isaiah+8%3A12');
    expect(returnPathChirho('/volumes-chirho/3?from-chirho=148')).toBe('/volumes-chirho/3?from-chirho=148');
    expect(returnPathChirho('/volumes-chirho/3?from-chirho=148&before-chirho=200')).toBe('/');
    expect(returnPathChirho('/find-chirho?q-chirho=x&q-chirho=y')).toBe('/');
  });
  test('streamed request size is bounded even without Content-Length', async () => {
    await expect(boundedTextChirho(new Request('https://test.invalid', { method: 'POST', body: 'abc' }), 2)).rejects.toMatchObject({ status: 413 });
    expect(await boundedTextChirho(new Request('https://test.invalid', { method: 'POST', body: 'abc' }), 3)).toBe('abc');
  });
});
