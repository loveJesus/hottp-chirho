// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Known-words manager — list, filter, paginate.
 *
 * Indexed query plan:
 *   filter (status_chirho, volume_number_chirho) → idx_known_words_vol_status_addedat_chirho
 *   filter (status_chirho)                       → idx_known_words_status_addedat_chirho
 *   filter (volume_number_chirho)                → idx_known_words_word_vol_chirho
 *
 * Pagination via LIMIT/OFFSET (50 rows per page). Count is a separate cheap
 * indexed COUNT(*).
 */

import type { PageServerLoad } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  parseBoundedNonnegativeIntParamChirho,
  parseOptionalPositiveIntParamChirho,
} from "$lib/server-chirho/query-params-chirho";
import { knownWordsChirho } from "$lib/server-chirho/schema-d1-chirho";
import { and, desc, eq, sql } from "drizzle-orm";

const PAGE_SIZE_CHIRHO = 50;
const MAX_KNOWN_WORDS_OFFSET_CHIRHO = 5000;

export const load: PageServerLoad = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const statusChirho = url.searchParams.get("status-chirho") ?? "";
  const volumeStrChirho = url.searchParams.get("volume-chirho") ?? "";
  const volumeNumberChirho = parseOptionalPositiveIntParamChirho(volumeStrChirho, "volume-chirho");
  const offsetChirho = parseBoundedNonnegativeIntParamChirho(
    url.searchParams.get("offset-chirho"),
    "offset-chirho",
    0,
    MAX_KNOWN_WORDS_OFFSET_CHIRHO,
  );

  const filtersChirho = [];
  if (statusChirho) filtersChirho.push(eq(knownWordsChirho.statusChirho, statusChirho));
  if (volumeNumberChirho !== null) {
    filtersChirho.push(eq(knownWordsChirho.volumeNumberChirho, volumeNumberChirho));
  }
  const whereChirho = filtersChirho.length === 0 ? undefined : filtersChirho.length === 1 ? filtersChirho[0] : and(...filtersChirho);

  const rowsChirho = await dbChirho
    .select()
    .from(knownWordsChirho)
    .where(whereChirho)
    .orderBy(desc(knownWordsChirho.addedAtChirho))
    .limit(PAGE_SIZE_CHIRHO)
    .offset(offsetChirho);

  const countResultChirho = await dbChirho
    .select({ totalChirho: sql<number>`COUNT(*)` })
    .from(knownWordsChirho)
    .where(whereChirho);
  const totalChirho = Number(countResultChirho[0]?.totalChirho ?? 0);

  // Aggregate counts per status (small index-only scan, used for the filter chips).
  const statusCountsChirho = await dbChirho
    .select({
      statusChirho: knownWordsChirho.statusChirho,
      countChirho: sql<number>`COUNT(*)`,
    })
    .from(knownWordsChirho)
    .groupBy(knownWordsChirho.statusChirho);

  return {
    rowsChirho,
    totalChirho,
    statusCountsChirho,
    pageSizeChirho: PAGE_SIZE_CHIRHO,
    offsetChirho,
    filterStatusChirho: statusChirho,
    filterVolumeChirho: volumeStrChirho,
  };
};
