// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { error } from '@sveltejs/kit';
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import type { DbChirho } from '../db-chirho';
import { pagesChirho } from '../schema-d1-chirho';
import { EXPORT_BYTES_CHIRHO, EXPORT_FIELD_BYTES_CHIRHO, PAGE_WINDOW_CHIRHO, type ExportRangeChirho } from './request-chirho';

// Workflow: page-reading-workflow-chirho.md. Bound fields inside SQL, not after
// transferring an oversized value. A refusal never returns truncated Markdown.
export async function exportPageRangeChirho(dbChirho: DbChirho, rangeChirho: ExportRangeChirho): Promise<Response> {
  const rowsChirho = await dbChirho.select({ pageNumberChirho: pagesChirho.pageNumberChirho,
    reconstructedOversizedChirho: sql<number>`length(cast(coalesce(${pagesChirho.reconstructedTextChirho}, '') as blob)) > ${EXPORT_FIELD_BYTES_CHIRHO}`,
    frenchOversizedChirho: sql<number>`length(cast(coalesce(${pagesChirho.frenchTextChirho}, '') as blob)) > ${EXPORT_FIELD_BYTES_CHIRHO}`,
    reconstructedTextChirho: sql<string | null>`case when length(cast(${pagesChirho.reconstructedTextChirho} as blob)) <= ${EXPORT_FIELD_BYTES_CHIRHO} then ${pagesChirho.reconstructedTextChirho} else null end`,
    frenchTextChirho: sql<string | null>`case when length(cast(${pagesChirho.frenchTextChirho} as blob)) <= ${EXPORT_FIELD_BYTES_CHIRHO} then ${pagesChirho.frenchTextChirho} else null end`,
  }).from(pagesChirho).where(and(eq(pagesChirho.volumeNumberChirho, rangeChirho.volumeChirho),
    gte(pagesChirho.pageNumberChirho, rangeChirho.fromChirho), lte(pagesChirho.pageNumberChirho, rangeChirho.toChirho)))
    .orderBy(asc(pagesChirho.pageNumberChirho)).limit(PAGE_WINDOW_CHIRHO + 1);
  if (!rowsChirho.length) error(404, 'No loaded pages in this range.');
  if (rowsChirho.length > PAGE_WINDOW_CHIRHO) error(413, `Choose at most ${PAGE_WINDOW_CHIRHO} loaded pages, using the volume browser. Nothing was exported.`);
  let missingChirho = 0;
  const chunksChirho = [
    '<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->\n\n',
    `# Barthélemy — Critique textuelle de l'Ancien Testament — Volume ${rangeChirho.volumeChirho}\n\n`,
    `Requested PDF pages ${rangeChirho.fromChirho}–${rangeChirho.toChirho}; ${rowsChirho.length} loaded pages included. This is a range export, not a complete volume.\n\n`,
    'Unverified legacy stored text, not certified print accuracy. Current reader edits may not be reflected here.\n\n',
    '<!-- unverified-export-chirho -->\n',
    '<!-- source-chirho: pages_chirho.reconstructed_text_chirho with french_text_chirho fallback; charset-chirho: utf-8 -->\n',
  ];
  for (const pageChirho of rowsChirho) {
    const textChirho = pageChirho.reconstructedTextChirho?.trimEnd();
    if (pageChirho.reconstructedOversizedChirho || (!textChirho && pageChirho.frenchOversizedChirho)) {
      error(413, `A required page field exceeds the ${EXPORT_FIELD_BYTES_CHIRHO / 1024} KiB limit. Use the offline export workflow; nothing was exported.`);
    }
    chunksChirho.push(`\n---\n## Page ${pageChirho.pageNumberChirho}\n\n`);
    if (textChirho) chunksChirho.push(`${textChirho}\n`);
    else {
      missingChirho++;
      chunksChirho.push('<!-- needs-review-chirho: missing reconstructed_text_chirho for this page -->\n\n', `${pageChirho.frenchTextChirho?.trimEnd() ?? ''}\n`);
    }
  }
  const markdownChirho = chunksChirho.join('');
  if (new TextEncoder().encode(markdownChirho).byteLength > EXPORT_BYTES_CHIRHO) error(413, 'Export exceeds 1 MiB. Choose a smaller page range; nothing was exported.');
  return new Response(markdownChirho, { headers: {
    'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'private, no-store',
    'Content-Disposition': `attachment; filename="barthelemy-vol-${rangeChirho.volumeChirho}-pages-${rangeChirho.fromChirho}-${rangeChirho.toChirho}-chirho.md"`,
    'X-Missing-Reconstructed-Pages-Chirho': String(missingChirho), 'X-Exported-Pages-Chirho': String(rowsChirho.length),
  } });
}
