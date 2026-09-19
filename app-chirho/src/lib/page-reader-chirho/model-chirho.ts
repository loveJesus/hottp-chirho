// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import type { PageLineChirho } from '$lib/server-chirho/page-lines-chirho';
import type { PageWordChirho } from '$lib/server-chirho/review-chirho/reading-evidence-chirho';

export interface BoxChirho { xChirho: number; yChirho: number; widthChirho: number; heightChirho: number }
export type ReviewStateChirho = 'recorded-chirho' | 'machine-chirho' | 'anonymous-chirho' | 'unattributed-chirho' | 'unreviewed-chirho';
export interface ReadingTokenChirho {
  keyChirho: string;
  kindChirho: 'word-chirho' | 'segment-chirho';
  idChirho: number;
  scanlineIdChirho: number;
  lineIndexChirho: number;
  textChirho: string;
  scriptChirho: string;
  confirmedChirho: boolean; // Raw D1 status for CAS, never a display-proof claim.
  reviewStateChirho?: ReviewStateChirho; // Optional only for old tab backups.
  flaggedChirho: boolean;
  boxChirho: BoxChirho | null;
}
export interface ReadingLineChirho { idChirho: number; indexChirho: number; textChirho: string; tokensChirho: ReadingTokenChirho[] }
export type ReadingWordChirho = Pick<PageWordChirho, 'idChirho' | 'scanlineIdChirho' | 'xMinChirho' | 'yMinChirho' | 'xMaxChirho' | 'yMaxChirho' | 'currentTextChirho' | 'originalOcrTextChirho' | 'currentScriptChirho' | 'isHumanConfirmedChirho' | 'pendingScriptFlagChirho' | 'reviewStateChirho'>;

export function isReviewConfirmedChirho(tokenChirho: ReadingTokenChirho): boolean {
  return tokenChirho.confirmedChirho && tokenChirho.reviewStateChirho === 'recorded-chirho' && !tokenChirho.flaggedChirho;
}
export function needsAttentionChirho(tokenChirho: ReadingTokenChirho): boolean {
  return tokenChirho.flaggedChirho || !isReviewConfirmedChirho(tokenChirho) &&
    (tokenChirho.confirmedChirho || ['machine-chirho', 'anonymous-chirho', 'unattributed-chirho'].includes(tokenChirho.reviewStateChirho ?? '') || !['french-chirho', 'latin-chirho'].includes(tokenChirho.scriptChirho));
}
export function reviewLabelChirho(tokenChirho: ReadingTokenChirho): string {
  if (isReviewConfirmedChirho(tokenChirho)) return 'Human-confirmed · shared reviewer account';
  if (tokenChirho.reviewStateChirho === 'machine-chirho') return 'Machine-assisted reading · needs review';
  if (tokenChirho.reviewStateChirho === 'anonymous-chirho') return 'Legacy anonymous activity · unverified';
  if (tokenChirho.confirmedChirho) return 'Unattributed confirmation mark · unverified';
  return 'Not human-confirmed';
}

export function boxChirho(xChirho: number | null, yChirho: number | null, widthChirho: number | null, heightChirho: number | null): BoxChirho | null {
  if (xChirho == null || yChirho == null || widthChirho == null || heightChirho == null ||
    ![xChirho, yChirho, widthChirho, heightChirho].every(Number.isFinite) || xChirho < 0 || yChirho < 0 || widthChirho <= 0 || heightChirho <= 0) return null;
  return { xChirho, yChirho, widthChirho, heightChirho };
}

export function sameBoxChirho(aChirho: BoxChirho | null, bChirho: BoxChirho | null): boolean {
  return aChirho?.xChirho === bChirho?.xChirho && aChirho?.yChirho === bChirho?.yChirho &&
    aChirho?.widthChirho === bChirho?.widthChirho && aChirho?.heightChirho === bChirho?.heightChirho;
}

export function scriptLabelChirho(scriptChirho: string): string {
  if (scriptChirho === 'latin-chirho') return 'French / Latin';
  if (scriptChirho === 'latin-non-french-chirho') return 'Latin';
  const labelChirho = scriptChirho.replace(/-chirho$/, '');
  return labelChirho.charAt(0).toUpperCase() + labelChirho.slice(1);
}

export function isRtlChirho(tokenChirho: ReadingTokenChirho): boolean {
  return ['hebrew-chirho', 'syriac-chirho', 'arabic-chirho'].includes(tokenChirho.scriptChirho) || /[\u0590-\u074f]/u.test(tokenChirho.textChirho);
}

// Workflow: spec-chirho/workflows-chirho/page-reading-workflow-chirho.md.
// Current D1 words and segments are authoritative for display and raw CAS.
// Events only supply independently matched provenance; never replay an event
// into a confirmation flag or overwrite current text from a stale snapshot.
export function readingLinesChirho(linesChirho: PageLineChirho[], currentWordsChirho: ReadingWordChirho[]): ReadingLineChirho[] {
  const wordLinesChirho = new Map<number, ReadingWordChirho[]>();
  for (const wordChirho of currentWordsChirho) {
    const listChirho = wordLinesChirho.get(wordChirho.scanlineIdChirho) ?? [];
    listChirho.push(wordChirho); wordLinesChirho.set(wordChirho.scanlineIdChirho, listChirho);
  }
  return linesChirho.map(({ scanlineChirho: lineChirho, segmentsChirho }) => {
    const segmentTokensChirho: ReadingTokenChirho[] = segmentsChirho.map((segmentChirho) => ({
      keyChirho: `segment-${segmentChirho.idChirho}-chirho`, kindChirho: 'segment-chirho', idChirho: segmentChirho.idChirho,
      scanlineIdChirho: lineChirho.idChirho, lineIndexChirho: lineChirho.lineIndexChirho,
      textChirho: segmentChirho.acceptedTextChirho ?? segmentChirho.ocrTextChirho ?? segmentChirho.pdftotextChirho ?? '',
      scriptChirho: segmentChirho.scriptTypeChirho ?? 'unknown-chirho',
      confirmedChirho: segmentChirho.statusChirho === 'human-confirmed-chirho', flaggedChirho: false,
      reviewStateChirho: segmentChirho.reviewStateChirho ?? (segmentChirho.statusChirho === 'human-confirmed-chirho' ? 'unattributed-chirho' : 'unreviewed-chirho'),
      boxChirho: boxChirho(lineChirho.xMinChirho == null || segmentChirho.xMinPxChirho == null ? null : lineChirho.xMinChirho + segmentChirho.xMinPxChirho,
        lineChirho.yMinChirho, segmentChirho.widthPxChirho, lineChirho.heightChirho),
    }));
    const wordsChirho = wordLinesChirho.get(lineChirho.idChirho) ?? [];
    let tokensChirho = segmentTokensChirho;
    if (wordsChirho.length) {
      const phrasesChirho = segmentTokensChirho.filter((tokenChirho) => tokenChirho.scriptChirho !== 'french-chirho');
      const emittedChirho = new Set<string>();
      tokensChirho = wordsChirho.flatMap((wordChirho): ReadingTokenChirho[] => {
        const middleChirho = wordChirho.xMinChirho == null || wordChirho.xMaxChirho == null ? null : (wordChirho.xMinChirho + wordChirho.xMaxChirho) / 2;
        const phraseChirho = phrasesChirho.find((tokenChirho) => middleChirho != null && tokenChirho.boxChirho && middleChirho >= tokenChirho.boxChirho.xChirho && middleChirho <= tokenChirho.boxChirho.xChirho + tokenChirho.boxChirho.widthChirho);
        if (phraseChirho) {
          if (emittedChirho.has(phraseChirho.keyChirho)) return [];
          emittedChirho.add(phraseChirho.keyChirho);
          return [phraseChirho];
        }
        const tokenChirho: ReadingTokenChirho = {
          keyChirho: `word-${wordChirho.idChirho}-chirho`, kindChirho: 'word-chirho', idChirho: wordChirho.idChirho,
          scanlineIdChirho: lineChirho.idChirho, lineIndexChirho: lineChirho.lineIndexChirho,
          textChirho: wordChirho.currentTextChirho ?? wordChirho.originalOcrTextChirho ?? '',
          scriptChirho: wordChirho.currentScriptChirho ?? 'latin-chirho',
          confirmedChirho: wordChirho.isHumanConfirmedChirho === 1, flaggedChirho: wordChirho.pendingScriptFlagChirho === 1,
          reviewStateChirho: wordChirho.reviewStateChirho,
          boxChirho: boxChirho(wordChirho.xMinChirho, wordChirho.yMinChirho,
            wordChirho.xMaxChirho == null || wordChirho.xMinChirho == null ? null : wordChirho.xMaxChirho - wordChirho.xMinChirho,
            wordChirho.yMaxChirho == null || wordChirho.yMinChirho == null ? null : wordChirho.yMaxChirho - wordChirho.yMinChirho),
        };
        return [tokenChirho];
      });
      // A segment without an overlapping word must not silently disappear.
      tokensChirho.push(...phrasesChirho.filter((tokenChirho) => !emittedChirho.has(tokenChirho.keyChirho)));
      tokensChirho.sort((aChirho, bChirho) => (aChirho.boxChirho?.xChirho ?? Infinity) - (bChirho.boxChirho?.xChirho ?? Infinity));
    }
    return { idChirho: lineChirho.idChirho, indexChirho: lineChirho.lineIndexChirho,
      textChirho: lineChirho.reconstructedTextChirho ?? lineChirho.pdftotextChirho ?? '', tokensChirho };
  });
}
