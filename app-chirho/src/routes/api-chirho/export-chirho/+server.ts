// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { pagesChirho, snippetsChirho } from "$lib/server-chirho/schema-d1-chirho";
import { eq, and } from "drizzle-orm";

/** Export assembled text for a volume as markdown */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const volumeChirho = url.searchParams.get("volume-chirho");
  if (!volumeChirho) {
    return json({ errorChirho: "Missing volume-chirho" }, { status: 400 });
  }

  const volumeNumChirho = parseInt(volumeChirho, 10);

  const volumePagesChirho = await dbChirho
    .select()
    .from(pagesChirho)
    .where(eq(pagesChirho.volumeNumberChirho, volumeNumChirho))
    .orderBy(pagesChirho.pageNumberChirho);

  let markdownChirho = `# Barthélemy — Critique textuelle de l'Ancien Testament — Volume ${volumeNumChirho}\n\n`;

  for (const pageChirho of volumePagesChirho) {
    markdownChirho += `\n---\n## Page ${pageChirho.pageNumberChirho}\n\n`;

    // Get accepted snippets for this page
    const pageSnippetsChirho = await dbChirho
      .select()
      .from(snippetsChirho)
      .where(eq(snippetsChirho.pageIdChirho, pageChirho.idChirho))
      .orderBy(snippetsChirho.snippetIndexChirho);

    const acceptedCountChirho = pageSnippetsChirho.filter(
      (sChirho) => sChirho.statusChirho === "accepted-chirho"
    ).length;

    if (acceptedCountChirho < pageSnippetsChirho.length) {
      markdownChirho += `> **Note:** ${pageSnippetsChirho.length - acceptedCountChirho} snippet(s) still pending review\n\n`;
    }

    // Build page text by interleaving French text with accepted snippets
    // For now, output French text followed by snippets
    if (pageChirho.frenchTextChirho) {
      markdownChirho += pageChirho.frenchTextChirho + "\n\n";
    }

    if (pageSnippetsChirho.length > 0) {
      markdownChirho += "### Non-French Snippets\n\n";
      for (const snippetChirho of pageSnippetsChirho) {
        const textChirho =
          snippetChirho.acceptedTextChirho ??
          snippetChirho.suggestedTextChirho ??
          snippetChirho.garbledTextChirho ??
          "(no text)";
        const statusBadgeChirho =
          snippetChirho.statusChirho === "accepted-chirho" ? "✓" : "⏳";
        markdownChirho += `- **[${snippetChirho.scriptTypeChirho}]** ${statusBadgeChirho} ${textChirho}\n`;
      }
    }
  }

  return new Response(markdownChirho, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="barthelemy-vol-${volumeNumChirho}-chirho.md"`,
    },
  });
};
