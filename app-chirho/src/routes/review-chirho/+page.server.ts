// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import type { PageServerLoad } from "./$types";
import { drizzle } from "drizzle-orm/d1";
import { eq, ne, sql } from "drizzle-orm";
import { pagesChirho, scanlinesChirho, segmentsChirho } from "$lib/server-chirho/schema-d1-chirho";

export const load: PageServerLoad = async ({ platform, url }) => {
  if (!platform?.env?.DB_CHIRHO) return { pagesChirho: [], filterChirho: "needs-review" };
  const dbChirho = drizzle(platform.env.DB_CHIRHO);

  const filterChirho = url.searchParams.get("filter") ?? "needs-review";

  // Per-page rollup: counts of non-French segments grouped by confidence.
  const rollupChirho = await dbChirho
    .select({
      volChirho: pagesChirho.volumeNumberChirho,
      pageChirho: pagesChirho.pageNumberChirho,
      totalChirho: sql<number>`COUNT(*)`,
      highChirho: sql<number>`SUM(CASE WHEN ${segmentsChirho.canonicalConfidenceChirho}='high' THEN 1 ELSE 0 END)`,
      mediumChirho: sql<number>`SUM(CASE WHEN ${segmentsChirho.canonicalConfidenceChirho}='medium' THEN 1 ELSE 0 END)`,
      lowChirho: sql<number>`SUM(CASE WHEN ${segmentsChirho.canonicalConfidenceChirho}='low' THEN 1 ELSE 0 END)`,
      noneChirho: sql<number>`SUM(CASE WHEN ${segmentsChirho.canonicalConfidenceChirho} IS NULL THEN 1 ELSE 0 END)`,
    })
    .from(segmentsChirho)
    .innerJoin(scanlinesChirho, eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho))
    .innerJoin(pagesChirho, eq(pagesChirho.idChirho, scanlinesChirho.pageIdChirho))
    .where(ne(segmentsChirho.scriptTypeChirho, "french-chirho"))
    .groupBy(pagesChirho.volumeNumberChirho, pagesChirho.pageNumberChirho)
    .orderBy(pagesChirho.volumeNumberChirho, pagesChirho.pageNumberChirho);

  const filteredChirho = rollupChirho.filter((rChirho) => {
    if (filterChirho === "all") return rChirho.totalChirho > 0;
    if (filterChirho === "needs-review") return (rChirho.lowChirho + rChirho.noneChirho) > 0;
    if (filterChirho === "high-confidence") return rChirho.highChirho > 0 && rChirho.lowChirho === 0;
    return true;
  });

  return {
    pagesChirho: filteredChirho,
    filterChirho,
  };
};
