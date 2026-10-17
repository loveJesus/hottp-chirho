// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import type { PageServerLoad } from './$types';
import { getDbChirho } from '$lib/server-chirho/db-chirho';
import { parseRequiredPositiveIntParamChirho } from '$lib/server-chirho/query-params-chirho';
import { pageWindowChirho, PAGE_WINDOW_CHIRHO } from '$lib/server-chirho/catalog-chirho/request-chirho';
import { loadVolumeWindowChirho } from '$lib/server-chirho/catalog-chirho/volume-chirho';

export const load: PageServerLoad = async ({ params, platform, url }) => {
  const volumeNumberChirho = parseRequiredPositiveIntParamChirho(params.vol_chirho, 'vol_chirho');
  const windowChirho = pageWindowChirho(url.searchParams);
  return { volumeNumberChirho, windowSizeChirho: PAGE_WINDOW_CHIRHO, requestedFromChirho: windowChirho.fromChirho,
    ...await loadVolumeWindowChirho(getDbChirho(platform!.env.DB_CHIRHO), volumeNumberChirho, windowChirho) };
};
