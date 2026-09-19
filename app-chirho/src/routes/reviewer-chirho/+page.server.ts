// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { configuredChirho, createSessionChirho, credentialsMatchChirho, REVIEW_COOKIE_CHIRHO, returnPathChirho, SESSION_SECONDS_CHIRHO } from '$lib/server-chirho/review-chirho/session-chirho';
import { boundedTextChirho } from '$lib/server-chirho/review-chirho/request-chirho';

export const load: PageServerLoad = ({ locals, platform, url }) => ({
  signedInChirho: !!locals.reviewerChirho,
  configuredChirho: configuredChirho(platform?.env),
  returnPathChirho: returnPathChirho(url.searchParams.get('return-chirho')),
});
export const actions: Actions = {
  loginChirho: async ({ request, platform, cookies, url }) => {
    const envChirho = platform?.env;
    if (!configuredChirho(envChirho) || !envChirho.REVIEW_LOGIN_LIMITER_CHIRHO) return fail(503, { errorChirho: 'Reviewer sign-in is unavailable. Drafting remains available.' });
    const allowedChirho = await envChirho.REVIEW_LOGIN_LIMITER_CHIRHO.limit({ key: request.headers.get('cf-connecting-ip') ?? 'local-chirho' });
    if (!allowedChirho.success) return fail(429, { errorChirho: 'Too many sign-in attempts. Wait a minute and try again.' });
    if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return fail(400, { errorChirho: 'Invalid sign-in form.' });
    const fieldsChirho = new URLSearchParams(await boundedTextChirho(request, 4096));
    if (!await credentialsMatchChirho(fieldsChirho.get('user_chirho') ?? '', fieldsChirho.get('password_chirho') ?? '', envChirho)) return fail(401, { errorChirho: 'Sign-in details were not recognized.' });
    cookies.set(REVIEW_COOKIE_CHIRHO, await createSessionChirho(envChirho), {
      path: '/', httpOnly: true, sameSite: 'strict', secure: url.protocol === 'https:', maxAge: SESSION_SECONDS_CHIRHO,
    });
    redirect(303, returnPathChirho(url.searchParams.get('return-chirho')));
  },
  logoutChirho: async ({ cookies }) => {
    cookies.delete(REVIEW_COOKIE_CHIRHO, { path: '/' });
    redirect(303, '/reviewer-chirho');
  },
};
