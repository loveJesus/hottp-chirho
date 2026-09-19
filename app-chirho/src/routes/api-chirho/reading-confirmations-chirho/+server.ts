// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDbChirho } from '$lib/server-chirho/db-chirho';
import { boundedTextChirho } from '$lib/server-chirho/review-chirho/request-chirho';
import { confirmReadingChirho, parseConfirmationChirho } from '$lib/server-chirho/review-chirho/confirm-reading-chirho';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.reviewerChirho) error(401, 'Reviewer sign-in required.');
  if (!request.headers.get('content-type')?.startsWith('application/json')) error(415, 'JSON required.');
  const textChirho = await boundedTextChirho(request, 100000);
  let valueChirho: unknown;
  try { valueChirho = JSON.parse(textChirho); } catch { error(400, 'Invalid JSON.'); }
  const seqChirho = await confirmReadingChirho(getDbChirho(platform!.env.DB_CHIRHO), parseConfirmationChirho(valueChirho), locals.reviewerChirho);
  return json({ confirmed_chirho: true, event_seq_chirho: seqChirho });
};
