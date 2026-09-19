// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { eq, sql, type SQL } from 'drizzle-orm';
import { eventsChirho, scanlinesChirho, wordsChirho } from '../schema-d1-chirho';
import type { DbChirho } from '../db-chirho';
import type { ReviewStateChirho } from '$lib/page-reader-chirho/model-chirho';

export interface ReadingSourceSqlChirho {
  kindChirho: 'word-chirho' | 'segment-chirho';
  idChirho: SQL; pageChirho: SQL; lineChirho: SQL;
  textChirho: SQL; scriptChirho: SQL; confirmedChirho: SQL;
  xChirho: SQL; yChirho: SQL; widthChirho: SQL; heightChirho: SQL;
  lastSeqChirho?: SQL;
}

// Workflow: page-reading-workflow-chirho.md. The receipt is classified against
// the CURRENT row in the same SQL read, not replayed over a cached snapshot.
// Malformed/unknown evidence never grants a confirmation badge.
export function reviewStateSqlChirho(sourceChirho: ReadingSourceSqlChirho): SQL<ReviewStateChirho> {
  const payloadChirho = sql`case when json_valid(${eventsChirho.payloadJsonChirho}) then ${eventsChirho.payloadJsonChirho} else '{}' end`;
  const identityChirho = sql`${eventsChirho.pageIdChirho} = ${sourceChirho.pageChirho}
    and ${eventsChirho.scanlineIdChirho} = ${sourceChirho.lineChirho}
    and ${eventsChirho.aggregateTypeChirho} = ${sourceChirho.kindChirho}
    and ${sourceChirho.kindChirho === 'word-chirho'
      ? sql`${eventsChirho.wordIdChirho} = ${sourceChirho.idChirho}`
      : sql`json_extract(${payloadChirho}, '$.segmentIdChirho') = ${sourceChirho.idChirho}`}`;
  const typeChirho = sourceChirho.kindChirho === 'word-chirho'
    ? sql`${eventsChirho.eventTypeChirho} in ('word-text-corrected-chirho', 'word-verified-chirho')`
    : sql`${eventsChirho.eventTypeChirho} = 'segment-reading-confirmed-chirho'`;
  return sql<ReviewStateChirho>`case
    when ${sourceChirho.confirmedChirho} = 1 and ${identityChirho} and ${typeChirho}
      and ${sourceChirho.lastSeqChirho ? sql`${sourceChirho.lastSeqChirho} = ${eventsChirho.seqChirho}` : sql`1`}
      and ${eventsChirho.reviewerChirho} = 'shared-reviewer-chirho'
      and json_extract(${payloadChirho}, '$.sourceChirho') = 'page-reader-chirho'
      and json_extract(${payloadChirho}, '$.reviewerScopeChirho') = 'shared-account-chirho'
      and json_extract(${payloadChirho}, '$.newTextChirho') = ${sourceChirho.textChirho}
      and json_extract(${payloadChirho}, '$.expectedSourceChirho.script_chirho') = ${sourceChirho.scriptChirho}
      and json_extract(${payloadChirho}, '$.expectedSourceChirho.box_chirho.x_chirho') = ${sourceChirho.xChirho}
      and json_extract(${payloadChirho}, '$.expectedSourceChirho.box_chirho.y_chirho') = ${sourceChirho.yChirho}
      and json_extract(${payloadChirho}, '$.expectedSourceChirho.box_chirho.width_chirho') = ${sourceChirho.widthChirho}
      and json_extract(${payloadChirho}, '$.expectedSourceChirho.box_chirho.height_chirho') = ${sourceChirho.heightChirho}
      then 'recorded-chirho'
    when ${identityChirho} and ${eventsChirho.reviewerChirho} = 'anon-chirho' then 'anonymous-chirho'
    when ${identityChirho} and ${eventsChirho.reviewerChirho} in ('canonical-recon-chirho', 'vision-batch-opus-chirho')
      and json_extract(${payloadChirho}, '$.newTextChirho') = ${sourceChirho.textChirho} then 'machine-chirho'
    when ${sourceChirho.confirmedChirho} = 1 then 'unattributed-chirho'
    else 'unreviewed-chirho' end`;
}

// Correlated lookups are index seeks, not a capped recent-history scan. Old
// confirmations remain discoverable after snapshots advance or events grow.
// Unary + removes the correlated INTEGER column's affinity: JSON numeric IDs
// then use the paired expression index instead of scanning the page history.
export function latestSegmentReceiptChirho(segmentIdChirho: SQL, pageIdChirho: SQL): SQL<number | null> {
  return sql<number | null>`(select receipt_chirho.seq_chirho from events_chirho receipt_chirho
    where receipt_chirho.page_id_chirho = ${pageIdChirho}
      and (case when json_valid(receipt_chirho.payload_json_chirho)
        then json_extract(receipt_chirho.payload_json_chirho, '$.segmentIdChirho') end) = +${segmentIdChirho}
      and receipt_chirho.event_type_chirho = 'segment-reading-confirmed-chirho'
      and receipt_chirho.aggregate_type_chirho = 'segment-chirho'
    order by receipt_chirho.seq_chirho desc limit 1)`;
}

export async function loadPageWordsChirho(dbChirho: DbChirho, pageIdChirho: number) {
  const reviewStateChirho = reviewStateSqlChirho({
    kindChirho: 'word-chirho', idChirho: sql`${wordsChirho.idChirho}`, pageChirho: sql`${scanlinesChirho.pageIdChirho}`, lineChirho: sql`${wordsChirho.scanlineIdChirho}`,
    textChirho: sql`coalesce(${wordsChirho.currentTextChirho}, ${wordsChirho.originalOcrTextChirho}, '')`, scriptChirho: sql`coalesce(${wordsChirho.currentScriptChirho}, 'latin-chirho')`,
    confirmedChirho: sql`${wordsChirho.isHumanConfirmedChirho}`, lastSeqChirho: sql`${wordsChirho.lastEventSeqChirho}`,
    xChirho: sql`${wordsChirho.xMinChirho}`, yChirho: sql`${wordsChirho.yMinChirho}`, widthChirho: sql`${wordsChirho.xMaxChirho} - ${wordsChirho.xMinChirho}`, heightChirho: sql`${wordsChirho.yMaxChirho} - ${wordsChirho.yMinChirho}`,
  });
  return await dbChirho.select({
    idChirho: wordsChirho.idChirho, scanlineIdChirho: wordsChirho.scanlineIdChirho,
    xMinChirho: wordsChirho.xMinChirho, yMinChirho: wordsChirho.yMinChirho, xMaxChirho: wordsChirho.xMaxChirho, yMaxChirho: wordsChirho.yMaxChirho,
    currentTextChirho: wordsChirho.currentTextChirho, originalOcrTextChirho: wordsChirho.originalOcrTextChirho, currentScriptChirho: wordsChirho.currentScriptChirho,
    isHumanConfirmedChirho: wordsChirho.isHumanConfirmedChirho, pendingScriptFlagChirho: wordsChirho.pendingScriptFlagChirho, reviewStateChirho,
  })
    .from(scanlinesChirho).innerJoin(wordsChirho, eq(wordsChirho.scanlineIdChirho, scanlinesChirho.idChirho))
    .leftJoin(eventsChirho, eq(eventsChirho.seqChirho, sql<number>`(select receipt_chirho.seq_chirho from events_chirho receipt_chirho
      where receipt_chirho.word_id_chirho = ${wordsChirho.idChirho} order by receipt_chirho.seq_chirho desc limit 1)`))
    .where(eq(scanlinesChirho.pageIdChirho, pageIdChirho))
    .orderBy(scanlinesChirho.lineIndexChirho, wordsChirho.wordIndexChirho);
}
export type PageWordChirho = Awaited<ReturnType<typeof loadPageWordsChirho>>[number];
