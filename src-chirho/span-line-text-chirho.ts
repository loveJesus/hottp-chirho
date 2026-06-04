// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

const RTL_SCRIPTS_CHIRHO = new Set(["hebrew-chirho", "arabic-chirho", "syriac-chirho"]);

export interface RenderSpanTextSpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho?: number;
  scriptChirho: string;
  utf8TextChirho: string;
}

export interface RenderSpanTextLineChirho {
  lineIndexChirho?: number;
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
  lineChirho: { spansChirho: TSpanChirho[] }
): TSpanChirho[] {
  const spansChirho = [...lineChirho.spansChirho].sort(
    (aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );
  if (!isRtlDominantSpanLineChirho(spansChirho)) return spansChirho;
  return [...spansChirho].sort((aChirho, bChirho) => {
    const aXMinChirho = aChirho.xMinPxChirho ?? aChirho.segmentIndexChirho;
    const bXMinChirho = bChirho.xMinPxChirho ?? bChirho.segmentIndexChirho;
    return bXMinChirho - aXMinChirho;
  });
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
