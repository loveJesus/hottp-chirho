// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDbChirho } from '$lib/server-chirho/db-chirho';
import { singleParamChirho } from '$lib/server-chirho/catalog-chirho/request-chirho';
import {
  FIND_QUERY_MAX_CHARS_CHIRHO, findReferencePagesChirho, pageExistsChirho,
  parseFindQueryChirho, referenceLabelChirho, type FindPageMatchChirho,
} from '$lib/server-chirho/catalog-chirho/find-chirho';

// Workflow: page-reading-workflow-chirho.md. GET navigation never changes
// readings. A volume:page query redirects to the page when it is loaded, and
// otherwise to the volume window starting there, matching the volume browser's
// gaps-skip-forward semantics.
const emptyChirho = {
  unparsedChirho: false,
  referenceChirho: null as string | null,
  refusedChirho: null as string | null,
  segmentCountChirho: 0,
  pagesChirho: null as FindPageMatchChirho[] | null,
};

export const load: PageServerLoad = async ({ url, platform }) => {
  const rawChirho = singleParamChirho(url.searchParams, 'q-chirho');
  if (rawChirho === null || rawChirho.trim() === '') return { queryChirho: null as string | null, ...emptyChirho };
  if (rawChirho.length > FIND_QUERY_MAX_CHARS_CHIRHO) {
    error(400, `q-chirho must stay within ${FIND_QUERY_MAX_CHARS_CHIRHO} characters.`);
  }
  const parsedChirho = parseFindQueryChirho(rawChirho);
  if (parsedChirho === null) return { queryChirho: rawChirho as string | null, ...emptyChirho, unparsedChirho: true };
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  if (parsedChirho.kindChirho === 'page-chirho') {
    const targetChirho = (await pageExistsChirho(dbChirho, parsedChirho.volumeChirho, parsedChirho.pageChirho))
      ? `/volumes-chirho/${parsedChirho.volumeChirho}/pages-chirho/${parsedChirho.pageChirho}`
      : `/volumes-chirho/${parsedChirho.volumeChirho}?from-chirho=${parsedChirho.pageChirho}`;
    redirect(303, targetChirho);
  }
  const referenceChirho = referenceLabelChirho(parsedChirho);
  const resultChirho = await findReferencePagesChirho(dbChirho, parsedChirho);
  if (resultChirho.refusedChirho !== null) {
    return { queryChirho: rawChirho as string | null, ...emptyChirho, referenceChirho, refusedChirho: resultChirho.refusedChirho };
  }
  return {
    queryChirho: rawChirho as string | null, ...emptyChirho, referenceChirho,
    segmentCountChirho: resultChirho.segmentCountChirho, pagesChirho: resultChirho.pagesChirho,
  };
};
