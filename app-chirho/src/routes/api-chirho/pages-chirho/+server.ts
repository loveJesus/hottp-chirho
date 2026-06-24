// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { parseOptionalPositiveIntParamChirho } from "$lib/server-chirho/query-params-chirho";
import { pagesChirho } from "$lib/server-chirho/schema-d1-chirho";
import { eq } from "drizzle-orm";

const MAX_PAGE_LIST_CHIRHO = 5000;

/** Get pages for a volume, or all pages */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const volumeChirho = parseOptionalPositiveIntParamChirho(
    url.searchParams.get("volume-chirho"),
    "volume-chirho",
  );

  let queryChirho;
  if (volumeChirho !== null) {
    queryChirho = dbChirho
      .select()
      .from(pagesChirho)
      .where(eq(pagesChirho.volumeNumberChirho, volumeChirho))
      .orderBy(pagesChirho.pageNumberChirho)
      .limit(MAX_PAGE_LIST_CHIRHO);
  } else {
    queryChirho = dbChirho
      .select()
      .from(pagesChirho)
      .orderBy(pagesChirho.volumeNumberChirho, pagesChirho.pageNumberChirho)
      .limit(MAX_PAGE_LIST_CHIRHO);
  }

  const resultChirho = await queryChirho;
  return json(resultChirho);
};
