// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { readingTargetChirho } from '../../page-reader-chirho/navigation-chirho';

export const REVIEW_COOKIE_CHIRHO = 'hottp-review-session-chirho';
export const SESSION_SECONDS_CHIRHO = 8 * 60 * 60;
export interface ReviewCredentialsChirho {
  HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO?: string;
  HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO?: string;
  HOTTP_REVIEW_SESSION_SECRET_CHIRHO?: string;
}
const encoderChirho = new TextEncoder();
export function configuredChirho(envChirho: ReviewCredentialsChirho | undefined): envChirho is Required<ReviewCredentialsChirho> {
  return !!envChirho?.HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO && (envChirho.HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO?.length ?? 0) >= 20 && (envChirho.HOTTP_REVIEW_SESSION_SECRET_CHIRHO?.length ?? 0) >= 32;
}
async function signingKeyChirho(envChirho: Required<ReviewCredentialsChirho>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoderChirho.encode(envChirho.HOTTP_REVIEW_SESSION_SECRET_CHIRHO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
function messageChirho(expiryChirho: number, nonceChirho: string, envChirho: Required<ReviewCredentialsChirho>): Uint8Array<ArrayBuffer> {
  return encoderChirho.encode(`hottp-review-session-v1-chirho\n${envChirho.HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO}\n${expiryChirho}\n${nonceChirho}`);
}
function hexChirho(bytesChirho: ArrayBuffer): string { return [...new Uint8Array(bytesChirho)].map((byteChirho) => byteChirho.toString(16).padStart(2, '0')).join(''); }

// Workflow: page-reading-workflow-chirho.md. No server-side session collection:
// bounded signed cookies expire; rotating the signing secret invalidates all.
export async function createSessionChirho(envChirho: Required<ReviewCredentialsChirho>, nowChirho = Date.now()): Promise<string> {
  const expiryChirho = Math.floor(nowChirho / 1000) + SESSION_SECONDS_CHIRHO;
  const nonceChirho = crypto.randomUUID();
  const signatureChirho = await crypto.subtle.sign('HMAC', await signingKeyChirho(envChirho), messageChirho(expiryChirho, nonceChirho, envChirho));
  return `${expiryChirho}.${nonceChirho}.${hexChirho(signatureChirho)}`;
}
export async function sessionReviewerChirho(cookieChirho: string | undefined, envChirho: ReviewCredentialsChirho | undefined, nowChirho = Date.now()): Promise<string | null> {
  if (!configuredChirho(envChirho) || !cookieChirho || cookieChirho.length > 160) return null;
  const matchChirho = /^(\d{10})\.([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(cookieChirho);
  if (!matchChirho) return null;
  const expiryChirho = Number(matchChirho[1]), secondsChirho = Math.floor(nowChirho / 1000);
  if (expiryChirho <= secondsChirho || expiryChirho > secondsChirho + SESSION_SECONDS_CHIRHO) return null;
  const signatureChirho = Uint8Array.from(matchChirho[3]!.match(/../g)!, (byteChirho) => parseInt(byteChirho, 16));
  return await crypto.subtle.verify('HMAC', await signingKeyChirho(envChirho), signatureChirho, messageChirho(expiryChirho, matchChirho[2]!, envChirho))
    ? 'shared-reviewer-chirho' : null;
}
export async function credentialsMatchChirho(userChirho: string, passwordChirho: string, envChirho: Required<ReviewCredentialsChirho>): Promise<boolean> {
  // Fixed-length digests avoid leaking the matched prefix of either credential.
  const suppliedChirho = await crypto.subtle.digest('SHA-256', encoderChirho.encode(JSON.stringify([userChirho, passwordChirho])));
  const expectedChirho = await crypto.subtle.digest('SHA-256', encoderChirho.encode(JSON.stringify([envChirho.HOTTP_REVIEW_BASIC_AUTH_USER_CHIRHO, envChirho.HOTTP_REVIEW_BASIC_AUTH_PASSWORD_CHIRHO])));
  let differenceChirho = 0;
  const expectedBytesChirho = new Uint8Array(expectedChirho);
  new Uint8Array(suppliedChirho).forEach((byteChirho, indexChirho) => { differenceChirho |= byteChirho ^ expectedBytesChirho[indexChirho]!; });
  return differenceChirho === 0;
}
export function returnPathChirho(valueChirho: string | null): string {
  if (!valueChirho || valueChirho.length > 240) return '/';
  const splitChirho = valueChirho.indexOf('#');
  const pathChirho = splitChirho < 0 ? valueChirho : valueChirho.slice(0, splitChirho);
  const hashChirho = splitChirho < 0 ? '' : valueChirho.slice(splitChirho);
  if (!/^\/volumes-chirho\/\d+(?:\/pages-chirho\/\d+)?$/.test(pathChirho)) return '/';
  if (hashChirho && (!/^\/volumes-chirho\/\d+\/pages-chirho\/\d+$/.test(pathChirho) || !readingTargetChirho(hashChirho))) return '/';
  return valueChirho;
}
export function sameOriginChirho(requestChirho: Request): boolean {
  return requestChirho.headers.get('origin') === new URL(requestChirho.url).origin && requestChirho.headers.get('sec-fetch-site') !== 'cross-site';
}
