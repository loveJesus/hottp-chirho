// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { error } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import type { DbChirho } from '../db-chirho';
import { eventsChirho, scanlinesChirho, segmentsChirho, wordsChirho } from '../schema-d1-chirho';

export interface ConfirmationChirho {
  page_id_chirho: number; scanline_id_chirho: number; record_id_chirho: number;
  kind_chirho: 'word-chirho' | 'segment-chirho'; text_chirho: string;
  observed_event_seq_chirho: number;
  expected_chirho: { text_chirho: string; script_chirho: string; confirmed_chirho: boolean;
    box_chirho: { x_chirho: number; y_chirho: number; width_chirho: number; height_chirho: number } };
}
export function parseConfirmationChirho(valueChirho: unknown): ConfirmationChirho {
  const bodyChirho = valueChirho as ConfirmationChirho | null;
  const expectedChirho = bodyChirho?.expected_chirho, boxChirho = expectedChirho?.box_chirho;
  if (!bodyChirho || ![bodyChirho.page_id_chirho, bodyChirho.scanline_id_chirho, bodyChirho.record_id_chirho].every((idChirho) => Number.isSafeInteger(idChirho) && idChirho > 0) ||
    !['word-chirho', 'segment-chirho'].includes(bodyChirho.kind_chirho) ||
    !Number.isSafeInteger(bodyChirho.observed_event_seq_chirho) || bodyChirho.observed_event_seq_chirho < 0 ||
    ![bodyChirho.text_chirho, expectedChirho?.text_chirho].every((textChirho) => typeof textChirho === 'string' && textChirho.length <= 8192) ||
    typeof expectedChirho?.script_chirho !== 'string' || expectedChirho.script_chirho.length > 80 || typeof expectedChirho.confirmed_chirho !== 'boolean' ||
    !boxChirho || ![boxChirho.x_chirho, boxChirho.y_chirho, boxChirho.width_chirho, boxChirho.height_chirho].every((numberChirho) => typeof numberChirho === 'number' && Number.isFinite(numberChirho) && numberChirho >= 0 && numberChirho <= 100000) ||
    boxChirho.width_chirho <= 0 || boxChirho.height_chirho <= 0) error(400, 'Invalid reading or original source box. No changes saved.');
  if (!bodyChirho.text_chirho.trim()) error(400, 'An empty reading cannot be confirmed. Keep it as a draft for review.');
  return { ...bodyChirho, text_chirho: bodyChirho.text_chirho.normalize('NFC') };
}

// Workflow: page-reading-workflow-chirho.md. D1 batch is transactional. The
// guarded INSERT certifies the source match; changes() carries its 0/1 result
// into the immediately following projection UPDATE. Any SQL failure rolls
// back BOTH statements. No read-then-write race or unaudited projection write.
export async function confirmReadingChirho(dbChirho: DbChirho, bodyChirho: ConfirmationChirho, reviewerChirho: string): Promise<number> {
  const expectedChirho = bodyChirho.expected_chirho, boxChirho = expectedChirho.box_chirho;
  const isWordChirho = bodyChirho.kind_chirho === 'word-chirho';
  const changedChirho = bodyChirho.text_chirho !== expectedChirho.text_chirho;
  const attemptChirho = crypto.randomUUID();
  const eventTypeChirho = isWordChirho ? (changedChirho ? 'word-text-corrected-chirho' : 'word-verified-chirho') : 'segment-reading-confirmed-chirho';
  const payloadChirho = JSON.stringify({ oldTextChirho: expectedChirho.text_chirho, newTextChirho: bodyChirho.text_chirho,
    textChirho: bodyChirho.text_chirho, ...(isWordChirho ? {} : { segmentIdChirho: bodyChirho.record_id_chirho }),
    expectedSourceChirho: expectedChirho, sourceChirho: 'page-reader-chirho', reviewerScopeChirho: 'shared-account-chirho', attemptChirho });
  const eventValuesChirho = {
    seqChirho: sql<number>`null`.as('seq_chirho'),
    pageIdChirho: sql<number>`${bodyChirho.page_id_chirho}`.as('page_id_chirho'),
    scanlineIdChirho: sql<number>`${bodyChirho.scanline_id_chirho}`.as('scanline_id_chirho'),
    wordIdChirho: sql<number | null>`${isWordChirho ? bodyChirho.record_id_chirho : null}`.as('word_id_chirho'),
    aggregateTypeChirho: sql<string>`${bodyChirho.kind_chirho}`.as('aggregate_type_chirho'),
    eventTypeChirho: sql<string>`${eventTypeChirho}`.as('event_type_chirho'),
    payloadJsonChirho: sql<string>`${payloadChirho}`.as('payload_json_chirho'),
    reviewerChirho: sql<string>`${reviewerChirho}`.as('reviewer_chirho'),
    createdAtChirho: sql<string>`datetime('now')`.as('created_at_chirho'),
  };
  const lineMatchChirho = and(eq(scanlinesChirho.idChirho, bodyChirho.scanline_id_chirho), eq(scanlinesChirho.pageIdChirho, bodyChirho.page_id_chirho));
  // SQLite has no general ASSERT statement. A deliberately invalid JSON value
  // raises an SQL error only if our insert exists but its projection changed
  // zero rows (including a RAISE(IGNORE) trigger). The batch then rolls back.
  // The per-attempt nonce prevents an old last_insert_rowid from authorizing it.
  const projectionAssertionChirho = dbChirho.select({ validChirho: sql<number>`case when changes() = 1 or not exists
    (select 1 from ${eventsChirho} where ${eventsChirho.seqChirho} = last_insert_rowid()
      and json_extract(${eventsChirho.payloadJsonChirho}, '$.attemptChirho') = ${attemptChirho})
    then 1 else json_extract('projection-missing-chirho', '$') end`.as('valid_chirho') }).from(sql`(select 1)`);
  if (isWordChirho) {
    const sourceMatchChirho = and(lineMatchChirho, eq(wordsChirho.idChirho, bodyChirho.record_id_chirho),
      sql`coalesce(${wordsChirho.currentTextChirho}, ${wordsChirho.originalOcrTextChirho}, '') = ${expectedChirho.text_chirho}`,
      sql`coalesce(${wordsChirho.currentScriptChirho}, 'latin-chirho') = ${expectedChirho.script_chirho}`,
      eq(wordsChirho.isHumanConfirmedChirho, expectedChirho.confirmed_chirho ? 1 : 0),
      sql`${wordsChirho.lastEventSeqChirho} <= ${bodyChirho.observed_event_seq_chirho}`,
      eq(wordsChirho.xMinChirho, boxChirho.x_chirho), eq(wordsChirho.yMinChirho, boxChirho.y_chirho),
      sql`${wordsChirho.xMaxChirho} - ${wordsChirho.xMinChirho} = ${boxChirho.width_chirho}`,
      sql`${wordsChirho.yMaxChirho} - ${wordsChirho.yMinChirho} = ${boxChirho.height_chirho}`);
    const [insertedChirho, updatedChirho] = await dbChirho.batch([
      dbChirho.insert(eventsChirho).select(dbChirho.select(eventValuesChirho).from(wordsChirho)
        .innerJoin(scanlinesChirho, eq(scanlinesChirho.idChirho, wordsChirho.scanlineIdChirho)).where(sourceMatchChirho)).returning({ seqChirho: eventsChirho.seqChirho }),
      dbChirho.update(wordsChirho).set({ currentTextChirho: bodyChirho.text_chirho, currentSourceChirho: 'human-chirho', isHumanConfirmedChirho: 1, lastEventSeqChirho: sql`last_insert_rowid()` })
        .where(and(eq(wordsChirho.idChirho, bodyChirho.record_id_chirho), sql`changes() = 1`)).returning({ idChirho: wordsChirho.idChirho }),
      projectionAssertionChirho,
    ]);
    if (!insertedChirho.length) error(409, 'The stored reading or box changed. Reload and review before confirming. Your draft is retained.');
    if (updatedChirho.length !== 1) error(500, 'Confirmation could not be verified. Reload before continuing.');
    return insertedChirho[0]!.seqChirho;
  }
  const sourceMatchChirho = and(lineMatchChirho, eq(segmentsChirho.idChirho, bodyChirho.record_id_chirho),
    sql`not exists (select 1 from ${eventsChirho} where ${eventsChirho.pageIdChirho} = ${bodyChirho.page_id_chirho}
      and ${eventsChirho.seqChirho} > ${bodyChirho.observed_event_seq_chirho} and ${eventsChirho.eventTypeChirho} = 'segment-reading-confirmed-chirho'
      and json_extract(${eventsChirho.payloadJsonChirho}, '$.segmentIdChirho') = ${bodyChirho.record_id_chirho})`,
    sql`coalesce(${segmentsChirho.acceptedTextChirho}, ${segmentsChirho.ocrTextChirho}, ${segmentsChirho.pdftotextChirho}, '') = ${expectedChirho.text_chirho}`,
    sql`coalesce(${segmentsChirho.scriptTypeChirho}, 'unknown-chirho') = ${expectedChirho.script_chirho}`,
    sql`(${segmentsChirho.statusChirho} = 'human-confirmed-chirho') = ${expectedChirho.confirmed_chirho ? 1 : 0}`,
    sql`${scanlinesChirho.xMinChirho} + ${segmentsChirho.xMinPxChirho} = ${boxChirho.x_chirho}`,
    eq(scanlinesChirho.yMinChirho, boxChirho.y_chirho), eq(segmentsChirho.widthPxChirho, boxChirho.width_chirho), eq(scanlinesChirho.heightChirho, boxChirho.height_chirho));
  const [insertedChirho, updatedChirho] = await dbChirho.batch([
    dbChirho.insert(eventsChirho).select(dbChirho.select(eventValuesChirho).from(segmentsChirho)
      .innerJoin(scanlinesChirho, eq(scanlinesChirho.idChirho, segmentsChirho.scanlineIdChirho)).where(sourceMatchChirho)).returning({ seqChirho: eventsChirho.seqChirho }),
    dbChirho.update(segmentsChirho).set({ acceptedTextChirho: bodyChirho.text_chirho, statusChirho: 'human-confirmed-chirho' })
      .where(and(eq(segmentsChirho.idChirho, bodyChirho.record_id_chirho), sql`changes() = 1`)).returning({ idChirho: segmentsChirho.idChirho }),
    projectionAssertionChirho,
  ]);
  if (!insertedChirho.length) error(409, 'The stored reading or box changed. Reload and review before confirming. Your draft is retained.');
  if (updatedChirho.length !== 1) error(500, 'Confirmation could not be verified. Reload before continuing.');
  return insertedChirho[0]!.seqChirho;
}
