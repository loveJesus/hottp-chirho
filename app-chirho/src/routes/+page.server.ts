// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Volume index page — every volume with its page and approval counts.
 *
 * One pass over pages_chirho grouped by volume. Segment totals are not shown
 * here: they would read every segment of the corpus on each view.
 */

import type { PageServerLoad } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { loadVolumeSummariesChirho } from "$lib/server-chirho/catalog-chirho/home-chirho";

export const load: PageServerLoad = async ({ platform }) => ({
  volumesChirho: await loadVolumeSummariesChirho(getDbChirho(platform!.env.DB_CHIRHO)),
});
