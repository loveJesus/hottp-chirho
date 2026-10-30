// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import type { Handle } from '@sveltejs/kit';
import { configuredChirho, credentialsMatchChirho, REVIEW_COOKIE_CHIRHO, returnPathChirho, sameOriginChirho, sessionReviewerChirho } from '$lib/server-chirho/review-chirho/session-chirho';

function privateResponseChirho(responseChirho: Response): Response {
  responseChirho.headers.set('Cache-Control', 'private, no-store');
  responseChirho.headers.set('X-Robots-Tag', 'noindex, nofollow');
  responseChirho.headers.set('X-Content-Type-Options', 'nosniff');
  responseChirho.headers.set('Referrer-Policy', 'same-origin');
  responseChirho.headers.set('X-Frame-Options', 'DENY');
  return responseChirho;
}

export const handle: Handle = async ({ event: eventChirho, resolve: resolveChirho }) => {
  eventChirho.locals.reviewerChirho = await sessionReviewerChirho(eventChirho.cookies.get(REVIEW_COOKIE_CHIRHO), eventChirho.platform?.env);
  const mutationChirho = !['GET', 'HEAD', 'OPTIONS'].includes(eventChirho.request.method);
  if (mutationChirho) {
    if (!sameOriginChirho(eventChirho.request)) return privateResponseChirho(new Response('Same-origin request required.', { status: 403 }));
    if (!eventChirho.route.id) return privateResponseChirho(new Response('Unknown mutation route.', { status: 404 }));
    // Match the router's decoded identity, not the raw percent-encoded URL.
    if (eventChirho.route.id.startsWith('/api-chirho/')) {
      if (!configuredChirho(eventChirho.platform?.env)) return privateResponseChirho(new Response('Reader access is unavailable.', { status: 503 }));
      if (!eventChirho.locals.reviewerChirho) return privateResponseChirho(new Response('Enter the reader password first. No changes saved.', { status: 401 }));
      if (!eventChirho.request.headers.get('content-type')?.startsWith('application/json')) return privateResponseChirho(new Response('JSON required.', { status: 415 }));
    }
  }
  // Workflow: page-reading-workflow-chirho.md. Match decoded route identities:
  // the same entrance protects both hostnames, images, page data and exports.
  if (!eventChirho.locals.reviewerChirho && eventChirho.route.id !== '/reviewer-chirho') {
    const envChirho = eventChirho.platform?.env;
    if (!configuredChirho(envChirho)) return privateResponseChirho(new Response('Reader access is unavailable.', { status: 503 }));
    const syncReadChirho = eventChirho.route.id === '/api-chirho/events-chirho' && ['GET', 'HEAD'].includes(eventChirho.request.method);
    const bearerChirho = eventChirho.request.headers.get('authorization') ?? '';
    const permittedSyncChirho = syncReadChirho && bearerChirho.startsWith('Bearer ') && await credentialsMatchChirho(bearerChirho.slice(7), envChirho);
    if (!permittedSyncChirho) {
      if (eventChirho.route.id?.startsWith('/api-chirho/') || !['GET', 'HEAD'].includes(eventChirho.request.method)) {
        return privateResponseChirho(new Response('Enter the reader password first.', { status: 401 }));
      }
      const targetChirho = returnPathChirho(eventChirho.url.pathname + eventChirho.url.search);
      return privateResponseChirho(new Response(null, { status: 303, headers: { Location: '/reviewer-chirho?return-chirho=' + encodeURIComponent(targetChirho) } }));
    }
  }
  return privateResponseChirho(await resolveChirho(eventChirho));
};
