// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { parseRequiredPositiveIntParamChirho } from "$lib/server-chirho/query-params-chirho";
import { scanlinesChirho } from "$lib/server-chirho/schema-d1-chirho";
import { eq } from "drizzle-orm";

/** Get scanlines for a page */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);

  const pageIdChirho = url.searchParams.get("page-id-chirho");
  if (!pageIdChirho) {
    return json({ errorChirho: "Missing page-id-chirho" }, { status: 400 });
  }
  const parsedPageIdChirho = parseRequiredPositiveIntParamChirho(pageIdChirho, "page-id-chirho");

  const resultChirho = await dbChirho
    .select()
    .from(scanlinesChirho)
    .where(eq(scanlinesChirho.pageIdChirho, parsedPageIdChirho))
    .orderBy(scanlinesChirho.lineIndexChirho);

  return json(resultChirho);
};

/** Update a scanline (accept reconstructed text) */
export const PATCH: RequestHandler = async ({ request, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const bodyChirho = (await request.json()) as {
    scanlineIdChirho?: number;
    reconstructedTextChirho?: string;
    statusChirho?: string;
  };

  const { scanlineIdChirho, reconstructedTextChirho, statusChirho } =
    bodyChirho;

  if (!scanlineIdChirho) {
    return json(
      { errorChirho: "Missing scanlineIdChirho" },
      { status: 400 }
    );
  }

  const updateDataChirho: Record<string, unknown> = {};

  if (reconstructedTextChirho !== undefined) {
    updateDataChirho.reconstructedTextChirho = reconstructedTextChirho;
  }
  if (statusChirho) {
    updateDataChirho.statusChirho = statusChirho;
  }

  if (Object.keys(updateDataChirho).length > 0) {
    await dbChirho
      .update(scanlinesChirho)
      .set(updateDataChirho)
      .where(eq(scanlinesChirho.idChirho, scanlineIdChirho));
  }

  return json({ successChirho: true });
};
