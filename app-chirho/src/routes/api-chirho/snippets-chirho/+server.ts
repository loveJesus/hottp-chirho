// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { parseRequiredPositiveIntParamChirho } from "$lib/server-chirho/query-params-chirho";
import {
  snippetsChirho,
  reviewsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq } from "drizzle-orm";

/** Get snippets for a page */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const pageIdChirho = url.searchParams.get("page-id-chirho");
  if (!pageIdChirho) {
    return json({ errorChirho: "Missing page-id-chirho" }, { status: 400 });
  }
  const parsedPageIdChirho = parseRequiredPositiveIntParamChirho(pageIdChirho, "page-id-chirho");

  const resultChirho = await dbChirho
    .select()
    .from(snippetsChirho)
    .where(eq(snippetsChirho.pageIdChirho, parsedPageIdChirho))
    .orderBy(snippetsChirho.snippetIndexChirho);

  return json(resultChirho);
};

/** Update a snippet (accept, edit, reject) */
export const PATCH: RequestHandler = async ({ request, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const bodyChirho = (await request.json()) as {
    snippetIdChirho?: number;
    acceptedTextChirho?: string;
    statusChirho?: string;
    actionChirho?: string;
    reviewerChirho?: string;
  };

  const {
    snippetIdChirho,
    acceptedTextChirho,
    statusChirho,
    actionChirho,
    reviewerChirho,
  } = bodyChirho;

  if (!snippetIdChirho || !actionChirho) {
    return json(
      { errorChirho: "Missing snippetIdChirho or actionChirho" },
      { status: 400 }
    );
  }

  // Get previous state for review log
  const previousChirho = await dbChirho
    .select()
    .from(snippetsChirho)
    .where(eq(snippetsChirho.idChirho, snippetIdChirho))
    .limit(1);

  if (previousChirho.length === 0) {
    return json({ errorChirho: "Snippet not found" }, { status: 404 });
  }

  const prevSnippetChirho = previousChirho[0]!;

  // Update snippet
  const updateDataChirho: Record<string, unknown> = {
    updatedAtChirho: new Date().toISOString(),
  };

  if (acceptedTextChirho !== undefined) {
    updateDataChirho.acceptedTextChirho = acceptedTextChirho;
  }
  if (statusChirho) {
    updateDataChirho.statusChirho = statusChirho;
  }

  await dbChirho
    .update(snippetsChirho)
    .set(updateDataChirho)
    .where(eq(snippetsChirho.idChirho, snippetIdChirho));

  // Log the review action
  await dbChirho.insert(reviewsChirho).values({
    snippetIdChirho: snippetIdChirho,
    reviewerChirho: reviewerChirho || "anonymous-chirho",
    actionChirho: actionChirho,
    previousTextChirho:
      prevSnippetChirho.acceptedTextChirho ??
      prevSnippetChirho.suggestedTextChirho,
    newTextChirho: acceptedTextChirho ?? prevSnippetChirho.suggestedTextChirho,
  });

  return json({ successChirho: true });
};
