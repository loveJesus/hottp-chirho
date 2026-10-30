// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { statementsChirho, type PagePayloadChirho, type StatementChirho } from '../source-chirho.ts';
import { getTableColumns } from '../../../../app-chirho/node_modules/drizzle-orm';
import { pagesChirho } from '../../../../app-chirho/src/lib/server-chirho/schema-d1-chirho.ts';
export interface LegacyEntryChirho {
  original_page_chirho: Record<string, string | number | null>;
  payload_chirho: PagePayloadChirho;
  payload_sha256_chirho: string;
  image_sha256_chirho: string;
  image_md5_chirho: string;
  image_width_chirho: number;
  image_height_chirho: number;
  image_bytes_chirho: number;
}
export const LEGACY_PAGE_NUMBERS_CHIRHO = Array.from({length:21}, (_, indexChirho) => indexChirho + 50);

// Workflow: spec-chirho/workflows-chirho/corpus-chirho/legacy-reader-workflow-chirho.md.
// No page INSERT/UPDATE and no REPLACE/DELETE. A failed SELECT guard raises
// an SQL error, aborting the same batch before either child INSERT can commit.
export function legacyStatementsChirho(entryChirho: LegacyEntryChirho): StatementChirho[] {
  const pageChirho = entryChirho.original_page_chirho;
  const [volumeChirho, numberChirho] = entryChirho.payload_chirho.page_chirho;
  if (volumeChirho !== 5 || !LEGACY_PAGE_NUMBERS_CHIRHO.includes(numberChirho) || pageChirho.volume_number_chirho !== 5 || pageChirho.page_number_chirho !== numberChirho ||
    !Number.isSafeInteger(pageChirho.id_chirho) || Number(pageChirho.id_chirho) <= 0 || !entryChirho.payload_chirho.lines_chirho.length || !entryChirho.payload_chirho.segments_chirho.length) throw new Error('Outside the empty legacy pilot scope');
  const columnsChirho = Object.keys(pageChirho);
  const schemaColumnsChirho = Object.values(getTableColumns(pagesChirho)).map(columnChirho => columnChirho.name);
  if (columnsChirho.length !== schemaColumnsChirho.length || columnsChirho.some(columnChirho => !schemaColumnsChirho.includes(columnChirho))) throw new Error('Incomplete/changed page baseline schema');
  const conditionsChirho = columnsChirho.map(columnChirho => `p.${columnChirho} IS ?`).join(' AND ');
  return [{sql:`SELECT json(CASE WHEN EXISTS(SELECT 1 FROM pages_chirho p WHERE ${conditionsChirho}
    AND NOT EXISTS(SELECT 1 FROM scanlines_chirho l WHERE l.page_id_chirho=p.id_chirho)
    AND NOT EXISTS(SELECT 1 FROM events_chirho e WHERE e.page_id_chirho=p.id_chirho)
    AND NOT EXISTS(SELECT 1 FROM snippets_chirho s WHERE s.page_id_chirho=p.id_chirho)
    AND NOT EXISTS(SELECT 1 FROM page_snapshots_chirho q WHERE q.page_id_chirho=p.id_chirho))
    THEN 'null' ELSE 'legacy-source-conflict-chirho' END) AS source_guard_chirho`, params: columnsChirho.map(columnChirho => pageChirho[columnChirho]!)},
    ...statementsChirho(entryChirho.payload_chirho).slice(1)];
}
