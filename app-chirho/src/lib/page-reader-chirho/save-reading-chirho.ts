// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import type { ReadingTokenChirho } from './model-chirho';

// Workflow: page-reading-workflow-chirho.md. Authenticated, transactional source
// comparison; transport errors never authorize optimistic confirmation.
export async function saveReadingChirho(tokenChirho: ReadingTokenChirho, textChirho: string, pageIdChirho: number, fetchChirho: typeof fetch = fetch, observedSeqChirho = 0): Promise<void> {
  if (!tokenChirho.boxChirho) throw new Error('The original source box is missing. No changes saved.');
  const boxChirho = tokenChirho.boxChirho;
  const responseChirho = await fetchChirho('/api-chirho/reading-confirmations-chirho', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_id_chirho: pageIdChirho, scanline_id_chirho: tokenChirho.scanlineIdChirho, record_id_chirho: tokenChirho.idChirho,
      kind_chirho: tokenChirho.kindChirho, text_chirho: textChirho, observed_event_seq_chirho: observedSeqChirho,
      expected_chirho: { text_chirho: tokenChirho.textChirho, script_chirho: tokenChirho.scriptChirho, confirmed_chirho: !!tokenChirho.confirmedChirho,
        box_chirho: { x_chirho: boxChirho.xChirho, y_chirho: boxChirho.yChirho, width_chirho: boxChirho.widthChirho, height_chirho: boxChirho.heightChirho } },
    }),
  }).catch(() => { throw new Error('Save unconfirmed after a connection failure. Your draft is still here; check the stored reading before retrying.'); });
  if (responseChirho.status === 401) throw new Error('Reviewer session expired. Sign in again; your draft is still here.');
  if (responseChirho.status === 409) throw new Error('The stored reading or box changed. Reload and review before confirming. Your draft is still here.');
  if (!responseChirho.ok) throw new Error(`Save not confirmed (HTTP ${responseChirho.status}). Your draft is still here.`);
  const resultChirho = await responseChirho.json().catch(() => null) as { confirmed_chirho?: boolean; event_seq_chirho?: number } | null;
  if (resultChirho?.confirmed_chirho !== true || !Number.isSafeInteger(resultChirho.event_seq_chirho) || resultChirho.event_seq_chirho! <= 0) {
    throw new Error('Save response was not recognized. Your draft is still here; check the stored reading before retrying.');
  }
}
