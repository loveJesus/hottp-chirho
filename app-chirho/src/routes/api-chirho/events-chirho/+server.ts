// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Event-sourced write endpoint. Two responsibilities per request:
 *   1. INSERT the row into events_chirho (append-only audit log).
 *   2. UPDATE the projection on words_chirho (the editor's fast-read columns).
 *
 * Both happen on D1 sequentially in the same handler. SQLite/D1 inside a
 * single Worker request is effectively serialised, so projection drift is
 * bounded — and replay logic (sync-from-d1) is the authoritative recovery
 * path if a write ever crashes between the two statements.
 */

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  eventsChirho,
  wordsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq, and, gt } from "drizzle-orm";

interface EventBodyChirho {
  pageIdChirho: number;
  scanlineIdChirho?: number | null;
  wordIdChirho?: number | null;
  aggregateTypeChirho: "word-chirho" | "scanline-chirho" | "page-chirho";
  eventTypeChirho:
    | "word-text-corrected-chirho"
    | "word-script-flagged-chirho"
    | "word-script-set-chirho"
    | "word-verified-chirho"
    | "word-vision-applied-chirho"
    | "scanline-needs-ai-review-chirho"
    | "scanline-needs-ai-review-resolved-chirho"
    | "scanline-verified-chirho"
    | "page-completed-chirho";
  payloadChirho: Record<string, unknown>;
  reviewerChirho?: string | null;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const bodyChirho = (await request.json()) as EventBodyChirho;

  if (!bodyChirho.pageIdChirho || !bodyChirho.aggregateTypeChirho || !bodyChirho.eventTypeChirho) {
    error(400, "missing required fields: pageIdChirho, aggregateTypeChirho, eventTypeChirho");
  }

  const reviewerChirho = bodyChirho.reviewerChirho ?? "anon-chirho";

  // 1. INSERT the event
  const insertedChirho = await dbChirho
    .insert(eventsChirho)
    .values({
      pageIdChirho: bodyChirho.pageIdChirho,
      scanlineIdChirho: bodyChirho.scanlineIdChirho ?? null,
      wordIdChirho: bodyChirho.wordIdChirho ?? null,
      aggregateTypeChirho: bodyChirho.aggregateTypeChirho,
      eventTypeChirho: bodyChirho.eventTypeChirho,
      payloadJsonChirho: JSON.stringify(bodyChirho.payloadChirho ?? {}),
      reviewerChirho,
    })
    .returning();

  const newEventChirho = insertedChirho[0]!;
  const seqChirho = newEventChirho.seqChirho;

  // 2. PROJECT into words_chirho where applicable
  if (bodyChirho.wordIdChirho != null) {
    const payloadChirho = bodyChirho.payloadChirho ?? {};
    switch (bodyChirho.eventTypeChirho) {
      case "word-text-corrected-chirho": {
        const newTextChirho = typeof payloadChirho.newTextChirho === "string"
          ? (payloadChirho.newTextChirho as string)
          : null;
        await dbChirho
          .update(wordsChirho)
          .set({
            currentTextChirho: newTextChirho,
            currentSourceChirho: "human-chirho",
            isHumanConfirmedChirho: 1,
            lastEventSeqChirho: seqChirho,
          })
          .where(eq(wordsChirho.idChirho, bodyChirho.wordIdChirho));
        break;
      }
      case "word-script-flagged-chirho": {
        await dbChirho
          .update(wordsChirho)
          .set({
            pendingScriptFlagChirho: 1,
            lastEventSeqChirho: seqChirho,
          })
          .where(eq(wordsChirho.idChirho, bodyChirho.wordIdChirho));
        break;
      }
      case "word-script-set-chirho": {
        const newScriptChirho = typeof payloadChirho.newScriptChirho === "string"
          ? (payloadChirho.newScriptChirho as string)
          : null;
        await dbChirho
          .update(wordsChirho)
          .set({
            currentScriptChirho: newScriptChirho,
            currentSourceChirho: "human-chirho",
            pendingScriptFlagChirho: 0,
            lastEventSeqChirho: seqChirho,
          })
          .where(eq(wordsChirho.idChirho, bodyChirho.wordIdChirho));
        break;
      }
      case "word-verified-chirho": {
        await dbChirho
          .update(wordsChirho)
          .set({
            isHumanConfirmedChirho: 1,
            lastEventSeqChirho: seqChirho,
          })
          .where(eq(wordsChirho.idChirho, bodyChirho.wordIdChirho));
        break;
      }
      case "word-vision-applied-chirho": {
        const newTextChirho = typeof payloadChirho.newTextChirho === "string"
          ? (payloadChirho.newTextChirho as string)
          : null;
        const newScriptChirho = typeof payloadChirho.newScriptChirho === "string"
          ? (payloadChirho.newScriptChirho as string)
          : null;
        await dbChirho
          .update(wordsChirho)
          .set({
            currentTextChirho: newTextChirho,
            currentScriptChirho: newScriptChirho,
            currentSourceChirho: "vision-chirho",
            pendingScriptFlagChirho: 0,
            lastEventSeqChirho: seqChirho,
          })
          .where(eq(wordsChirho.idChirho, bodyChirho.wordIdChirho));
        break;
      }
      default: {
        // scanline / page level events: no per-word projection.
        break;
      }
    }
  }

  return json({ eventChirho: newEventChirho });
};

/**
 * GET /api-chirho/events-chirho?page-id-chirho=N&since-seq-chirho=N
 * Returns events for a page above a cursor — used by the editor to merge
 * with snapshot, and by sync-from-d1-chirho.ts for local mirroring.
 */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const pageIdChirho = url.searchParams.get("page-id-chirho");
  const sinceSeqChirho = parseInt(url.searchParams.get("since-seq-chirho") ?? "0", 10);
  const limitChirho = Math.min(parseInt(url.searchParams.get("limit-chirho") ?? "1000", 10), 5000);

  if (pageIdChirho) {
    const rowsChirho = await dbChirho
      .select()
      .from(eventsChirho)
      .where(
        and(
          eq(eventsChirho.pageIdChirho, parseInt(pageIdChirho, 10)),
          gt(eventsChirho.seqChirho, sinceSeqChirho),
        ),
      )
      .orderBy(eventsChirho.seqChirho)
      .limit(limitChirho);
    return json({ eventsChirho: rowsChirho });
  }

  // Global cursor — used by local sync to fetch all new events.
  const rowsChirho = await dbChirho
    .select()
    .from(eventsChirho)
    .where(gt(eventsChirho.seqChirho, sinceSeqChirho))
    .orderBy(eventsChirho.seqChirho)
    .limit(limitChirho);
  return json({ eventsChirho: rowsChirho });
};
