// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import type { Handle } from '@sveltejs/kit';
import { configuredChirho, REVIEW_COOKIE_CHIRHO, sameOriginChirho, sessionReviewerChirho } from '$lib/server-chirho/review-chirho/session-chirho';

export const handle: Handle = async ({ event: eventChirho, resolve: resolveChirho }) => {
  eventChirho.locals.reviewerChirho = await sessionReviewerChirho(eventChirho.cookies.get(REVIEW_COOKIE_CHIRHO), eventChirho.platform?.env);
  const mutationChirho = !['GET', 'HEAD', 'OPTIONS'].includes(eventChirho.request.method);
  if (mutationChirho) {
    if (!sameOriginChirho(eventChirho.request)) return new Response('Same-origin request required.', { status: 403 });
    if (!eventChirho.route.id) return new Response('Unknown mutation route.', { status: 404 });
    // Match the router's decoded identity, not the raw percent-encoded URL.
    if (eventChirho.route.id.startsWith('/api-chirho/')) {
      if (!configuredChirho(eventChirho.platform?.env)) return new Response('Reviewer sign-in is not configured. No changes saved.', { status: 503 });
      if (!eventChirho.locals.reviewerChirho) return new Response('Sign in to confirm readings. No changes saved.', { status: 401 });
      if (!eventChirho.request.headers.get('content-type')?.startsWith('application/json')) return new Response('JSON required.', { status: 415 });
    }
  }
  const responseChirho = await resolveChirho(eventChirho);
  if (eventChirho.route.id?.startsWith('/reviewer-chirho') || eventChirho.route.id?.startsWith('/volumes-chirho') || mutationChirho) {
    responseChirho.headers.set('Cache-Control', 'private, no-store');
  }
  responseChirho.headers.set('X-Content-Type-Options', 'nosniff');
  responseChirho.headers.set('Referrer-Policy', 'same-origin');
  responseChirho.headers.set('X-Frame-Options', 'DENY');
  return responseChirho;
};
