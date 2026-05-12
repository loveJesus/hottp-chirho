// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { pagesChirho } from "$lib/server-chirho/schema-d1-chirho";
import { eq, sql } from "drizzle-orm";

/** Get pages for a volume, or all pages */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const volumeChirho = url.searchParams.get("volume-chirho");

  let queryChirho;
  if (volumeChirho) {
    queryChirho = dbChirho
      .select()
      .from(pagesChirho)
      .where(eq(pagesChirho.volumeNumberChirho, parseInt(volumeChirho, 10)))
      .orderBy(pagesChirho.pageNumberChirho);
  } else {
    queryChirho = dbChirho
      .select()
      .from(pagesChirho)
      .orderBy(pagesChirho.volumeNumberChirho, pagesChirho.pageNumberChirho);
  }

  const resultChirho = await queryChirho;
  return json(resultChirho);
};
