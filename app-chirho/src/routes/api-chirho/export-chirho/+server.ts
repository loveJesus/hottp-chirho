// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { parseRequiredPositiveIntParamChirho } from "$lib/server-chirho/query-params-chirho";
import { pagesChirho } from "$lib/server-chirho/schema-d1-chirho";
import { eq } from "drizzle-orm";

const MAX_EXPORT_PAGES_PER_VOLUME_CHIRHO = 5000;

/** Export reconstructed page text for a volume as UTF-8 markdown. */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const volumeChirho = url.searchParams.get("volume-chirho");
  if (!volumeChirho) {
    return json({ errorChirho: "Missing volume-chirho" }, { status: 400 });
  }

  const volumeNumChirho = parseRequiredPositiveIntParamChirho(volumeChirho, "volume-chirho");

  const volumePagesChirho = await dbChirho
    .select()
    .from(pagesChirho)
    .where(eq(pagesChirho.volumeNumberChirho, volumeNumChirho))
    .orderBy(pagesChirho.pageNumberChirho)
    .limit(MAX_EXPORT_PAGES_PER_VOLUME_CHIRHO);

  let missingReconstructedCountChirho = 0;
  let markdownChirho =
    "<!--\n" +
    "For God so loved the world that he gave his only begotten Son,\n" +
    "that whoever believes in him should not perish but have eternal life. John 3:16\n" +
    "-->\n\n" +
    `# Barthélemy — Critique textuelle de l'Ancien Testament — Volume ${volumeNumChirho}\n\n` +
    "<!-- source-chirho: pages_chirho.reconstructed_text_chirho; charset-chirho: utf-8 -->\n\n";

  for (const pageChirho of volumePagesChirho) {
    markdownChirho += `\n---\n## Page ${pageChirho.pageNumberChirho}\n\n`;

    const pageTextChirho = pageChirho.reconstructedTextChirho?.trimEnd();
    if (pageTextChirho && pageTextChirho.length > 0) {
      markdownChirho += `${pageTextChirho}\n`;
    } else {
      missingReconstructedCountChirho++;
      markdownChirho +=
        "<!-- needs-review-chirho: missing reconstructed_text_chirho for this page -->\n\n" +
        `${pageChirho.frenchTextChirho?.trimEnd() ?? ""}\n`;
    }
  }

  return new Response(markdownChirho, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="barthelemy-vol-${volumeNumChirho}-chirho.md"`,
      "X-Missing-Reconstructed-Pages-Chirho": String(missingReconstructedCountChirho),
    },
  });
};
