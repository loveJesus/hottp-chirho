// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)
import { describe, expect, test } from 'bun:test';
import { boxChirho, readingLinesChirho, sameBoxChirho } from '../../app-chirho/src/lib/page-reader-chirho/model-chirho';
import { saveReadingChirho } from '../../app-chirho/src/lib/page-reader-chirho/save-reading-chirho';
import type { PageLineChirho, SegmentRowChirho } from '../../app-chirho/src/lib/server-chirho/page-lines-chirho';

function segmentChirho(idChirho: number, textChirho: string, scriptChirho: string, xChirho: number): SegmentRowChirho {
  return { idChirho, scanlineIdChirho: 1, segmentIndexChirho: idChirho, wordStartIndexChirho: null, wordEndIndexChirho: null,
    xMinPxChirho: xChirho, widthPxChirho: 50, pdftotextChirho: textChirho, ocrTextChirho: null, acceptedTextChirho: null,
    scriptTypeChirho: scriptChirho, statusChirho: 'accepted-chirho', imageR2KeyChirho: null,
    canonicalSourceChirho: 'wlc-chirho', canonicalConfidenceChirho: 'high', canonicalReferenceChirho: null, canonicalDistanceChirho: 0 };
}
function lineChirho(): PageLineChirho {
  return { scanlineChirho: { idChirho: 1, pageIdChirho: 7, lineIndexChirho: 2, xMinChirho: 100, yMinChirho: 200,
    widthChirho: 500, heightChirho: 30, pdftotextChirho: 'French context', reconstructedTextChirho: null,
    imageR2KeyChirho: null, wordsJsonChirho: null, segmentCountChirho: 2, statusChirho: 'pending-chirho' },
    segmentsChirho: [segmentChirho(1, 'French context', 'french-chirho', 0), segmentChirho(2, 'יהוה', 'hebrew-chirho', 60)] };
}
const snapshotChirho = JSON.stringify({ scanlinesChirho: [{ scanlineIdChirho: 1, wordsChirho: [
  { wordIdChirho: 11, xMinChirho: 100, yMinChirho: 200, xMaxChirho: 140, yMaxChirho: 230, currentTextChirho: 'French', currentScriptChirho: 'latin-chirho', isHumanConfirmedChirho: false },
  { wordIdChirho: 12, xMinChirho: 160, yMinChirho: 200, xMaxChirho: 190, yMaxChirho: 230, currentTextChirho: 'bad OCR', currentScriptChirho: 'hebrew-chirho', isHumanConfirmedChirho: false },
] }] });

describe('page reading model', () => {
  test('missing or malformed snapshot retains French and non-French segments', () => {
    for (const jsonChirho of [null, '{broken']) {
      const tokensChirho = readingLinesChirho([lineChirho()], jsonChirho, [])[0].tokensChirho;
      expect(tokensChirho.map((tokenChirho) => tokenChirho.textChirho)).toEqual(['French context', 'יהוה']);
      expect(tokensChirho[1].boxChirho).toEqual({ xChirho: 160, yChirho: 200, widthChirho: 50, heightChirho: 30 });
      expect(tokensChirho.every((tokenChirho) => !tokenChirho.confirmedChirho)).toBe(true);
    }
  });
  test('line without segments stays visible; missing coordinates are not invented', () => {
    const sourceChirho = lineChirho(); sourceChirho.segmentsChirho = [];
    expect(readingLinesChirho([sourceChirho], null, [])[0].textChirho).toBe('French context');
    expect(boxChirho(null, 1, 2, 3)).toBeNull(); expect(boxChirho(0, 0, -1, 3)).toBeNull(); expect(boxChirho(NaN, 0, 1, 1)).toBeNull();
  });
  test('snapshot words fold later human events but non-French phrase uses current segment', () => {
    const tokensChirho = readingLinesChirho([lineChirho()], snapshotChirho, [{ wordIdChirho: 11,
      eventTypeChirho: 'word-text-corrected-chirho', payloadJsonChirho: JSON.stringify({ newTextChirho: 'Changed' }) }])[0].tokensChirho;
    expect(tokensChirho.map((tokenChirho) => tokenChirho.textChirho)).toEqual(['Changed', 'יהוה']);
    expect(tokensChirho[0].confirmedChirho).toBe(true); expect(tokensChirho[1].confirmedChirho).toBe(false);
  });
  test('non-overlapping segment is retained, not dropped by snapshot merge', () => {
    const sourceChirho = lineChirho(); sourceChirho.segmentsChirho[1].xMinPxChirho = 300;
    expect(readingLinesChirho([sourceChirho], snapshotChirho, [])[0].tokensChirho.map((tokenChirho) => tokenChirho.textChirho)).toEqual(['French', 'bad OCR', 'יהוה']);
  });
  test('box equality distinguishes draft geometry from original', () => {
    expect(sameBoxChirho(boxChirho(1, 2, 3, 4), boxChirho(1, 2, 3, 4))).toBe(true);
    expect(sameBoxChirho(boxChirho(1, 2, 3, 4), boxChirho(2, 2, 3, 4))).toBe(false);
  });
});

describe('explicit confirmation transport', () => {
  test('segment confirmation carries original-source precondition, not a geometry mutation', async () => {
    const tokenChirho = readingLinesChirho([lineChirho()], null, [])[0].tokensChirho[1];
    const requestsChirho: RequestInit[] = [];
    const fetchChirho = (async (_urlChirho: unknown, initChirho: RequestInit) => { requestsChirho.push(initChirho); return Response.json({ confirmed_chirho: true, event_seq_chirho: 10 }); }) as typeof fetch;
    await saveReadingChirho(tokenChirho, 'Test correction', 7, fetchChirho);
    expect(requestsChirho[0].method).toBe('POST');
    const bodyChirho = JSON.parse(requestsChirho[0].body as string);
    expect(bodyChirho.kind_chirho).toBe('segment-chirho');
    expect(bodyChirho.text_chirho).toBe('Test correction');
    expect(bodyChirho.expected_chirho.text_chirho).toBe('יהוה');
    expect(bodyChirho.expected_chirho.box_chirho.x_chirho).toBe(160);
    expect(bodyChirho.proposed_box_chirho).toBeUndefined();
  });
  test('word confirmation retains expected text whether changed or unchanged', async () => {
    const tokenChirho = readingLinesChirho([lineChirho()], snapshotChirho, [])[0].tokensChirho[0];
    const requestsChirho: Record<string, unknown>[] = [];
    const fetchChirho = (async (_urlChirho: unknown, initChirho: RequestInit) => { requestsChirho.push(JSON.parse(initChirho.body as string)); return Response.json({ confirmed_chirho: true, event_seq_chirho: 10 }); }) as typeof fetch;
    await saveReadingChirho(tokenChirho, tokenChirho.textChirho, 7, fetchChirho);
    await saveReadingChirho(tokenChirho, 'Changed', 7, fetchChirho);
    expect(requestsChirho.map((requestChirho) => requestChirho.text_chirho)).toEqual([tokenChirho.textChirho, 'Changed']);
    expect(requestsChirho.every((requestChirho) => requestChirho.kind_chirho === 'word-chirho')).toBe(true);
  });
  test('HTTP rejection, ambiguous success and lost connection reject confirmation', async () => {
    const tokenChirho = readingLinesChirho([lineChirho()], null, [])[0].tokensChirho[0];
    for (const responseChirho of [new Response('blocked', { status: 403 }), Response.json({}), new Response('<html>login</html>')]) {
      await expect(saveReadingChirho(tokenChirho, 'Changed', 7, (async () => responseChirho) as typeof fetch)).rejects.toThrow();
    }
    await expect(saveReadingChirho(tokenChirho, 'Changed', 7, (async () => { throw new Error('network'); }) as unknown as typeof fetch)).rejects.toThrow('Save unconfirmed');
  });
});
