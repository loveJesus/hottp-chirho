// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import type { PageLineChirho } from '$lib/server-chirho/page-lines-chirho';

export interface BoxChirho { xChirho: number; yChirho: number; widthChirho: number; heightChirho: number }
export interface ReadingTokenChirho {
  keyChirho: string;
  kindChirho: 'word-chirho' | 'segment-chirho';
  idChirho: number;
  scanlineIdChirho: number;
  lineIndexChirho: number;
  textChirho: string;
  scriptChirho: string;
  confirmedChirho: boolean;
  flaggedChirho: boolean;
  boxChirho: BoxChirho | null;
}
export interface ReadingLineChirho { idChirho: number; indexChirho: number; textChirho: string; tokensChirho: ReadingTokenChirho[] }
interface SnapshotWordChirho {
  wordIdChirho: number; xMinChirho: number | null; yMinChirho: number | null;
  xMaxChirho: number | null; yMaxChirho: number | null;
  currentTextChirho: string | null; originalOcrTextChirho: string | null;
  currentScriptChirho: string | null; isHumanConfirmedChirho: boolean; pendingScriptFlagChirho: boolean;
}
interface SnapshotChirho { scanlinesChirho: { scanlineIdChirho: number; wordsChirho: SnapshotWordChirho[] }[] }
export interface ReadingEventChirho { wordIdChirho: number | null; eventTypeChirho: string; payloadJsonChirho: string }

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
// Fresh segments retain the established non-French phrase layer. French word
// snapshots, when present, retain event-sourced edits. No snapshot is required.
export function readingLinesChirho(linesChirho: PageLineChirho[], snapshotJsonChirho: string | null, eventsChirho: ReadingEventChirho[]): ReadingLineChirho[] {
  let snapshotChirho: SnapshotChirho | null = null;
  try { snapshotChirho = snapshotJsonChirho ? JSON.parse(snapshotJsonChirho) : null; } catch { /* fall back to current rows */ }
  const snapshotLinesChirho = new Map((snapshotChirho?.scanlinesChirho ?? []).map((lineChirho) => [lineChirho.scanlineIdChirho, lineChirho]));
  const wordEventsChirho = new Map<number, ReadingEventChirho[]>();
  for (const eventChirho of eventsChirho) {
    if (eventChirho.wordIdChirho == null) continue;
    const listChirho = wordEventsChirho.get(eventChirho.wordIdChirho) ?? [];
    listChirho.push(eventChirho);
    wordEventsChirho.set(eventChirho.wordIdChirho, listChirho);
  }
  return linesChirho.map(({ scanlineChirho: lineChirho, segmentsChirho }) => {
    const segmentTokensChirho: ReadingTokenChirho[] = segmentsChirho.map((segmentChirho) => ({
      keyChirho: `segment-${segmentChirho.idChirho}-chirho`, kindChirho: 'segment-chirho', idChirho: segmentChirho.idChirho,
      scanlineIdChirho: lineChirho.idChirho, lineIndexChirho: lineChirho.lineIndexChirho,
      textChirho: segmentChirho.acceptedTextChirho ?? segmentChirho.ocrTextChirho ?? segmentChirho.pdftotextChirho ?? '',
      scriptChirho: segmentChirho.scriptTypeChirho ?? 'unknown-chirho',
      confirmedChirho: segmentChirho.statusChirho === 'human-confirmed-chirho', flaggedChirho: false,
      boxChirho: boxChirho(lineChirho.xMinChirho == null || segmentChirho.xMinPxChirho == null ? null : lineChirho.xMinChirho + segmentChirho.xMinPxChirho,
        lineChirho.yMinChirho, segmentChirho.widthPxChirho, lineChirho.heightChirho),
    }));
    const wordsChirho = snapshotLinesChirho.get(lineChirho.idChirho)?.wordsChirho ?? [];
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
          keyChirho: `word-${wordChirho.wordIdChirho}-chirho`, kindChirho: 'word-chirho', idChirho: wordChirho.wordIdChirho,
          scanlineIdChirho: lineChirho.idChirho, lineIndexChirho: lineChirho.lineIndexChirho,
          textChirho: wordChirho.currentTextChirho ?? wordChirho.originalOcrTextChirho ?? '',
          scriptChirho: wordChirho.currentScriptChirho ?? 'latin-chirho',
          confirmedChirho: wordChirho.isHumanConfirmedChirho, flaggedChirho: wordChirho.pendingScriptFlagChirho,
          boxChirho: boxChirho(wordChirho.xMinChirho, wordChirho.yMinChirho,
            wordChirho.xMaxChirho == null || wordChirho.xMinChirho == null ? null : wordChirho.xMaxChirho - wordChirho.xMinChirho,
            wordChirho.yMaxChirho == null || wordChirho.yMinChirho == null ? null : wordChirho.yMaxChirho - wordChirho.yMinChirho),
        };
        for (const eventChirho of wordEventsChirho.get(wordChirho.wordIdChirho) ?? []) {
          let payloadChirho: Record<string, unknown>;
          try { payloadChirho = JSON.parse(eventChirho.payloadJsonChirho); } catch { continue; }
          if (eventChirho.eventTypeChirho === 'word-text-corrected-chirho' && typeof payloadChirho.newTextChirho === 'string') {
            tokenChirho.textChirho = payloadChirho.newTextChirho; tokenChirho.confirmedChirho = true;
          } else if (eventChirho.eventTypeChirho === 'word-verified-chirho') tokenChirho.confirmedChirho = true;
          else if (eventChirho.eventTypeChirho === 'word-script-flagged-chirho') tokenChirho.flaggedChirho = true;
          else if (eventChirho.eventTypeChirho === 'word-script-set-chirho' && typeof payloadChirho.newScriptChirho === 'string') {
            tokenChirho.scriptChirho = payloadChirho.newScriptChirho; tokenChirho.flaggedChirho = false;
          } else if (eventChirho.eventTypeChirho === 'word-vision-applied-chirho') {
            if (typeof payloadChirho.newTextChirho === 'string') tokenChirho.textChirho = payloadChirho.newTextChirho;
            if (typeof payloadChirho.newScriptChirho === 'string') tokenChirho.scriptChirho = payloadChirho.newScriptChirho;
            tokenChirho.flaggedChirho = false;
          }
        }
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
