// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Event-sourced write endpoint. Two responsibilities per request:
 *   1. INSERT the row into events_chirho (append-only audit log).
 *   2. UPDATE the projection on words_chirho (the editor's fast-read columns).
 *
 * Legacy writes remain sequential and can drift if the projection fails;
 * they are not source-checked reviewer receipts. The page reader uses the
 * separate transactional reading-confirmations endpoint with raw-source CAS.
 */

import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDbChirho } from "$lib/server-chirho/db-chirho";
import {
  parseBoundedNonnegativeIntParamChirho,
  parseBoundedPositiveIntParamChirho,
  parseOptionalPositiveIntParamChirho,
} from "$lib/server-chirho/query-params-chirho";
import {
  eventsChirho,
  wordsChirho,
} from "$lib/server-chirho/schema-d1-chirho";
import { eq, and, gt } from "drizzle-orm";

const LEGACY_AGGREGATES_CHIRHO = ['word-chirho', 'scanline-chirho', 'page-chirho'] as const;
const LEGACY_EVENT_TYPES_CHIRHO = [
  'word-text-corrected-chirho', 'word-script-flagged-chirho', 'word-script-set-chirho', 'word-verified-chirho', 'word-vision-applied-chirho',
  'scanline-needs-ai-review-chirho', 'scanline-needs-ai-review-resolved-chirho', 'scanline-verified-chirho', 'page-completed-chirho',
] as const;

interface EventBodyChirho {
  pageIdChirho: number;
  scanlineIdChirho?: number | null;
  wordIdChirho?: number | null;
  aggregateTypeChirho: typeof LEGACY_AGGREGATES_CHIRHO[number];
  eventTypeChirho: typeof LEGACY_EVENT_TYPES_CHIRHO[number];
  payloadChirho: Record<string, unknown>;
  reviewerChirho?: string | null;
}

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!locals.reviewerChirho) error(401, 'Reviewer sign-in required.');
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const bodyChirho = (await request.json()) as EventBodyChirho;

  if (!bodyChirho || !Number.isSafeInteger(bodyChirho.pageIdChirho) || bodyChirho.pageIdChirho <= 0 ||
      !LEGACY_AGGREGATES_CHIRHO.includes(bodyChirho.aggregateTypeChirho) || !LEGACY_EVENT_TYPES_CHIRHO.includes(bodyChirho.eventTypeChirho)) {
    error(400, 'Invalid page or unsupported legacy event. Reading receipts require source-checked confirmation.');
  }

  const reviewerChirho = locals.reviewerChirho!;
  if (bodyChirho.payloadChirho != null && (typeof bodyChirho.payloadChirho !== 'object' || Array.isArray(bodyChirho.payloadChirho))) error(400, 'Event payload must be an object.');
  // Workflow: page-reading-workflow-chirho.md. Only confirm-reading may mint
  // source-matched receipts; a signed-in legacy caller cannot claim that lane.
  const payloadChirho: Record<string, unknown> = { ...bodyChirho.payloadChirho, sourceChirho: 'legacy-editor-chirho' };
  delete payloadChirho.reviewerScopeChirho;
  delete payloadChirho.expectedSourceChirho;
  delete payloadChirho.attemptChirho;

  // 1. INSERT the event
  const insertedChirho = await dbChirho
    .insert(eventsChirho)
    .values({
      pageIdChirho: bodyChirho.pageIdChirho,
      scanlineIdChirho: bodyChirho.scanlineIdChirho ?? null,
      wordIdChirho: bodyChirho.wordIdChirho ?? null,
      aggregateTypeChirho: bodyChirho.aggregateTypeChirho,
      eventTypeChirho: bodyChirho.eventTypeChirho,
      payloadJsonChirho: JSON.stringify(payloadChirho),
      reviewerChirho,
    })
    .returning();

  const newEventChirho = insertedChirho[0]!;
  const seqChirho = newEventChirho.seqChirho;

  // 2. PROJECT into words_chirho where applicable
  if (bodyChirho.wordIdChirho != null) {
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

const DEFAULT_EVENT_LIMIT_CHIRHO = 1000;
const MAX_EVENT_LIMIT_CHIRHO = 5000;

/**
 * GET /api-chirho/events-chirho?page-id-chirho=N&since-seq-chirho=N
 * Returns events for a page above a cursor — used by the editor to merge
 * with snapshot, and by sync-from-d1-chirho.ts for local mirroring.
 */
export const GET: RequestHandler = async ({ url, platform }) => {
  const dbChirho = getDbChirho(platform!.env.DB_CHIRHO);
  const pageIdChirho = parseOptionalPositiveIntParamChirho(
    url.searchParams.get("page-id-chirho"),
    "page-id-chirho",
  );
  const sinceSeqChirho = parseBoundedNonnegativeIntParamChirho(
    url.searchParams.get("since-seq-chirho"),
    "since-seq-chirho",
    0,
    Number.MAX_SAFE_INTEGER,
  );
  const limitChirho = parseBoundedPositiveIntParamChirho(
    url.searchParams.get("limit-chirho"),
    "limit-chirho",
    DEFAULT_EVENT_LIMIT_CHIRHO,
    MAX_EVENT_LIMIT_CHIRHO,
  );

  if (pageIdChirho !== null) {
    const rowsChirho = await dbChirho
      .select()
      .from(eventsChirho)
      .where(
        and(
          eq(eventsChirho.pageIdChirho, pageIdChirho),
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
