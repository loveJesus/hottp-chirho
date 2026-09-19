// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import { configuredChirho, createSessionChirho, credentialsMatchChirho, returnPathChirho, sameOriginChirho, sessionReviewerChirho } from '../../app-chirho/src/lib/server-chirho/review-chirho/session-chirho';
import { boundedTextChirho } from '../../app-chirho/src/lib/server-chirho/review-chirho/request-chirho';

const credentialsChirho = { HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO: 'fixture-reviewer-chirho', HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO: 'fixture-password-for-local-tests-only-chirho', HOTTP_REVIEW_SESSION_SECRET_CHIRHO: 'fixture-signing-secret-for-local-tests-only-chirho' };
describe('reviewer trust boundary', () => {
  test('missing/weak configuration fails closed; credential comparison checks both fields', async () => {
    expect(configuredChirho(undefined)).toBe(false);
    expect(configuredChirho({ ...credentialsChirho, HOTTP_REVIEW_SESSION_SECRET_CHIRHO: '' })).toBe(false);
    expect(await credentialsMatchChirho('wrong-chirho', credentialsChirho.HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO, credentialsChirho)).toBe(false);
    expect(await credentialsMatchChirho(credentialsChirho.HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO, 'wrong-chirho', credentialsChirho)).toBe(false);
    expect(await credentialsMatchChirho(credentialsChirho.HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO, credentialsChirho.HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO, credentialsChirho)).toBe(true);
  });
  test('signed sessions expire and reject tamper, rotated secrets, renamed users and malformed cookies', async () => {
    const nowChirho = Date.now(), cookieChirho = await createSessionChirho(credentialsChirho, nowChirho);
    expect(await sessionReviewerChirho(cookieChirho, credentialsChirho, nowChirho)).toBe('shared-reviewer-chirho');
    expect(await sessionReviewerChirho(cookieChirho, credentialsChirho, nowChirho + 8 * 3600 * 1000)).toBeNull();
    expect(await sessionReviewerChirho(cookieChirho.slice(0, -2) + 'zz', credentialsChirho, nowChirho)).toBeNull();
    expect(await sessionReviewerChirho(cookieChirho, { ...credentialsChirho, HOTTP_REVIEW_SESSION_SECRET_CHIRHO: 'another-signing-secret-with-enough-entropy-chirho' }, nowChirho)).toBeNull();
    expect(await sessionReviewerChirho(cookieChirho, { ...credentialsChirho, HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO: 'other-chirho' }, nowChirho)).toBeNull();
    expect(await sessionReviewerChirho('a'.repeat(10000), credentialsChirho)).toBeNull();
  });
  test('origin and return location cannot be supplied by another site', () => {
    for (const originChirho of [null, 'https://elsewhere.invalid', 'null']) {
      expect(sameOriginChirho(new Request('https://hottp.invalid/api-chirho/test-chirho', { headers: originChirho ? { Origin: originChirho } : {} }))).toBe(false);
    }
    expect(sameOriginChirho(new Request('https://hottp.invalid/api-chirho/test-chirho', { headers: { Origin: 'https://hottp.invalid' } }))).toBe(true);
    for (const pathChirho of ['//other.invalid', '/\\other.invalid', 'https://other.invalid', '/volumes-chirho/3?redirect=evil']) expect(returnPathChirho(pathChirho)).toBe('/');
    expect(returnPathChirho('/volumes-chirho/3/pages-chirho/151')).toBe('/volumes-chirho/3/pages-chirho/151');
  });
  test('streamed request size is bounded even without Content-Length', async () => {
    await expect(boundedTextChirho(new Request('https://test.invalid', { method: 'POST', body: 'abc' }), 2)).rejects.toMatchObject({ status: 413 });
    expect(await boundedTextChirho(new Request('https://test.invalid', { method: 'POST', body: 'abc' }), 3)).toBe('abc');
  });
});
