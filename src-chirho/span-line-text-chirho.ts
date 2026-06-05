// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

const RTL_SCRIPTS_CHIRHO = new Set(["hebrew-chirho", "arabic-chirho", "syriac-chirho"]);
export const RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO = "rtl-runs-logical-chirho";
const NEUTRAL_RTL_RUN_DELIMITER_RE_CHIRHO = /^[\s/|\\.,;:!?()[\]{}<>]+$/u;

export interface RenderSpanTextSpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho?: number;
  scriptChirho: string;
  utf8TextChirho: string;
}

export interface RenderSpanTextLineChirho {
  lineIndexChirho?: number;
  lineTextOrderChirho?: string;
  spansChirho: RenderSpanTextSpanChirho[];
}

interface RenderSpanLineTextOptionsChirho {
  normalizeTextChirho?: (textChirho: string) => string;
  emptySpanTextChirho?: (spanChirho: RenderSpanTextSpanChirho, lineChirho: RenderSpanTextLineChirho) => string;
}

export function isRtlDominantSpanLineChirho(spansChirho: RenderSpanTextSpanChirho[]): boolean {
  let rtlCharsChirho = 0;
  let nonRtlCharsChirho = 0;
  let rtlSpanCountChirho = 0;
  for (const spanChirho of spansChirho) {
    const charCountChirho = [...spanChirho.utf8TextChirho.replace(/\s+/g, "")].length;
    if (RTL_SCRIPTS_CHIRHO.has(spanChirho.scriptChirho)) {
      rtlCharsChirho += charCountChirho;
      if (charCountChirho > 0) rtlSpanCountChirho++;
    } else {
      nonRtlCharsChirho += charCountChirho;
    }
  }
  return rtlSpanCountChirho >= 2 && rtlCharsChirho > 0 && nonRtlCharsChirho === 0;
}

export function orderedSpansForLineTextChirho<TSpanChirho extends RenderSpanTextSpanChirho>(
  lineChirho: { lineTextOrderChirho?: string; spansChirho: TSpanChirho[] }
): TSpanChirho[] {
  const spansChirho = [...lineChirho.spansChirho].sort(
    (aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );
  if (lineChirho.lineTextOrderChirho === RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO) {
    return orderedRtlRunsLogicallyChirho(spansChirho);
  }
  if (!isRtlDominantSpanLineChirho(spansChirho)) return spansChirho;
  return [...spansChirho].sort((aChirho, bChirho) => {
    const aXMinChirho = aChirho.xMinPxChirho ?? aChirho.segmentIndexChirho;
    const bXMinChirho = bChirho.xMinPxChirho ?? bChirho.segmentIndexChirho;
    return bXMinChirho - aXMinChirho;
  });
}

function isRtlScriptSpanChirho(spanChirho: RenderSpanTextSpanChirho): boolean {
  return RTL_SCRIPTS_CHIRHO.has(spanChirho.scriptChirho);
}

function isNeutralRtlRunDelimiterSpanChirho(spanChirho: RenderSpanTextSpanChirho): boolean {
  return !isRtlScriptSpanChirho(spanChirho) && NEUTRAL_RTL_RUN_DELIMITER_RE_CHIRHO.test(spanChirho.utf8TextChirho.trim());
}

function orderedRtlRunsLogicallyChirho<TSpanChirho extends RenderSpanTextSpanChirho>(spansChirho: TSpanChirho[]): TSpanChirho[] {
  const orderedChirho: TSpanChirho[] = [];
  for (let indexChirho = 0; indexChirho < spansChirho.length; ) {
    const spanChirho = spansChirho[indexChirho];
    if (spanChirho === undefined || !isRtlScriptSpanChirho(spanChirho)) {
      if (spanChirho !== undefined) orderedChirho.push(spanChirho);
      indexChirho += 1;
      continue;
    }
    const runChirho: TSpanChirho[] = [];
    let rtlCountChirho = 0;
    let runIndexChirho = indexChirho;
    while (runIndexChirho < spansChirho.length) {
      const candidateChirho = spansChirho[runIndexChirho];
      if (candidateChirho === undefined) break;
      if (isRtlScriptSpanChirho(candidateChirho)) {
        runChirho.push(candidateChirho);
        rtlCountChirho += 1;
        runIndexChirho += 1;
        continue;
      }
      if (isNeutralRtlRunDelimiterSpanChirho(candidateChirho)) {
        runChirho.push(candidateChirho);
        runIndexChirho += 1;
        continue;
      }
      break;
    }
    orderedChirho.push(...(rtlCountChirho >= 2 ? [...runChirho].reverse() : runChirho));
    indexChirho = runIndexChirho;
  }
  return orderedChirho;
}

export function renderSpanLineTextChirho(
  lineChirho: RenderSpanTextLineChirho,
  optionsChirho: RenderSpanLineTextOptionsChirho = {}
): string {
  const normalizeTextChirho = optionsChirho.normalizeTextChirho ?? ((textChirho: string) => textChirho);
  return orderedSpansForLineTextChirho(lineChirho)
    .map((spanChirho) => {
      const textChirho = normalizeTextChirho(spanChirho.utf8TextChirho).trim();
      if (textChirho.length > 0) return textChirho;
      return optionsChirho.emptySpanTextChirho?.(spanChirho, lineChirho) ?? "";
    })
    .filter((textChirho) => textChirho.length > 0)
    .join(" ");
}
