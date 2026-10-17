// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import type { RequestHandler } from './$types';
import { getDbChirho } from '$lib/server-chirho/db-chirho';
import { exportRangeChirho } from '$lib/server-chirho/catalog-chirho/request-chirho';
import { exportPageRangeChirho } from '$lib/server-chirho/catalog-chirho/export-chirho';

// Explicit bounds are validated before even opening the database client.
export const GET: RequestHandler = async ({ url, platform }) => {
  const rangeChirho = exportRangeChirho(url.searchParams);
  return exportPageRangeChirho(getDbChirho(platform!.env.DB_CHIRHO), rangeChirho);
};
