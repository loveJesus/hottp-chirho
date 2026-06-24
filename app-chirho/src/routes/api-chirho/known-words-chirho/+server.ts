// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * known_words_chirho mutations:
 *   POST   — append a new entry (or no-op if already exists for that vol scope).
 *   PATCH  — update status (confirm / flag) or notes.
 *   DELETE — drop an entry.
 *
 * All three operations are PK-indexed (id_chirho) or composite-indexed
 * (idx_known_words_word_vol_chirho), so single-row touches.
 */

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import { parseRequiredPositiveIntParamChirho } from "$lib/server-chirho/query-params-chirho";
import { knownWordsChirho } from "$lib/server-chirho/schema-d1-chirho";
import { and, eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ request, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const bodyChirho = (await request.json()) as {
    wordChirho?: string;
    categoryChirho?: string;
    volumeNumberChirho?: number;
    statusChirho?: string;
    addedByChirho?: string;
    notesChirho?: string;
  };
  if (!bodyChirho.wordChirho) {
    return json({ errorChirho: "wordChirho required" }, { status: 400 });
  }
  const volChirho = bodyChirho.volumeNumberChirho ?? 0;

  const existsChirho = await dbChirho
    .select({ idChirho: knownWordsChirho.idChirho })
    .from(knownWordsChirho)
    .where(
      and(
        eq(knownWordsChirho.wordChirho, bodyChirho.wordChirho),
        eq(knownWordsChirho.volumeNumberChirho, volChirho)
      )
    )
    .limit(1);

  if (existsChirho.length > 0) {
    return json({ idChirho: existsChirho[0]!.idChirho, createdChirho: false });
  }

  const insertResultChirho = await dbChirho
    .insert(knownWordsChirho)
    .values({
      wordChirho: bodyChirho.wordChirho,
      categoryChirho: bodyChirho.categoryChirho ?? "unknown-chirho",
      volumeNumberChirho: volChirho,
      statusChirho: bodyChirho.statusChirho ?? "agent-pending-chirho",
      addedByChirho: bodyChirho.addedByChirho ?? "ui-chirho",
      notesChirho: bodyChirho.notesChirho ?? null,
    })
    .returning();
  return json({ idChirho: insertResultChirho[0]!.idChirho, createdChirho: true });
};

export const PATCH: RequestHandler = async ({ request, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const bodyChirho = (await request.json()) as {
    idChirho?: number;
    statusChirho?: string;
    categoryChirho?: string;
    notesChirho?: string;
    confirmedByChirho?: string;
  };
  if (!bodyChirho.idChirho) {
    return json({ errorChirho: "idChirho required" }, { status: 400 });
  }

  const updateChirho: Record<string, unknown> = {};
  if (bodyChirho.statusChirho) updateChirho.statusChirho = bodyChirho.statusChirho;
  if (bodyChirho.categoryChirho) updateChirho.categoryChirho = bodyChirho.categoryChirho;
  if (bodyChirho.notesChirho !== undefined) updateChirho.notesChirho = bodyChirho.notesChirho;
  if (bodyChirho.statusChirho === "human-confirmed-chirho") {
    updateChirho.confirmedAtChirho = new Date().toISOString();
    updateChirho.confirmedByChirho = bodyChirho.confirmedByChirho ?? "ui-chirho";
  }

  if (Object.keys(updateChirho).length === 0) {
    return json({ successChirho: true, noChangesChirho: true });
  }

  await dbChirho
    .update(knownWordsChirho)
    .set(updateChirho)
    .where(eq(knownWordsChirho.idChirho, bodyChirho.idChirho));
  return json({ successChirho: true });
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const idStrChirho = url.searchParams.get("id-chirho");
  if (!idStrChirho) {
    return json({ errorChirho: "id-chirho required" }, { status: 400 });
  }
  const idChirho = parseRequiredPositiveIntParamChirho(idStrChirho, "id-chirho");
  await dbChirho
    .delete(knownWordsChirho)
    .where(eq(knownWordsChirho.idChirho, idChirho));
  return json({ successChirho: true });
};
