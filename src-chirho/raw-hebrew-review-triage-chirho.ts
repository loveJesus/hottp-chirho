// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

export const RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO = "low-confidence-direct-read-chirho";
export const RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO = "confident-direct-read-disagreement-chirho";
export const RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO = "multi-token-chirho";
export const RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO = "delimiter-notation-chirho";
export const RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO = "no-direct-read-chirho";
export const RAW_HEBREW_CONFIDENT_DIRECT_READ_DISAGREEMENT_MIN_CONFIDENCE_CHIRHO = 0.85;

export const RAW_HEBREW_ATTENTION_FILTERS_CHIRHO = [
  RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO,
  RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO,
  RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO,
  RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO,
  RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO,
] as const;

export type RawHebrewAttentionKindChirho = typeof RAW_HEBREW_ATTENTION_FILTERS_CHIRHO[number];

export interface RawHebrewReviewTriageItemChirho {
  textChirho: string;
  validationStatusChirho?: string;
  tokenSkeletonsChirho?: string[];
  directWordReadsChirho?: Array<{
    textChirho?: string | null;
    confidenceChirho?: number | null;
  }>;
}

export interface RawHebrewDirectReadDisagreementChirho {
  textChirho: string;
  skeletonChirho: string;
  confidenceChirho: number;
}

export function bestRawHebrewDirectConfidenceChirho(itemChirho: RawHebrewReviewTriageItemChirho): number | null {
  const confidencesChirho = (itemChirho.directWordReadsChirho ?? [])
    .map((readChirho) => readChirho.confidenceChirho)
    .filter((confidenceChirho): confidenceChirho is number => typeof confidenceChirho === "number");
  return confidencesChirho.length === 0 ? null : Math.max(...confidencesChirho);
}

function hebrewSkeletonChirho(textChirho: string): string {
  return textChirho.normalize("NFKD").replace(/[\u0591-\u05C7]/g, "").replace(/[^\u05D0-\u05EA]/g, "");
}

export function rawHebrewConfidentDirectReadDisagreementsChirho(
  itemChirho: RawHebrewReviewTriageItemChirho
): RawHebrewDirectReadDisagreementChirho[] {
  const tokenSkeletonsChirho = new Set(
    (itemChirho.tokenSkeletonsChirho ?? [])
      .map((tokenSkeletonChirho) => hebrewSkeletonChirho(tokenSkeletonChirho))
      .filter((tokenSkeletonChirho) => tokenSkeletonChirho.length > 0)
  );
  if (tokenSkeletonsChirho.size === 0) return [];
  return (itemChirho.directWordReadsChirho ?? [])
    .map((readChirho): RawHebrewDirectReadDisagreementChirho | null => {
      if (typeof readChirho.textChirho !== "string") return null;
      if (typeof readChirho.confidenceChirho !== "number") return null;
      if (readChirho.confidenceChirho < RAW_HEBREW_CONFIDENT_DIRECT_READ_DISAGREEMENT_MIN_CONFIDENCE_CHIRHO) return null;
      const skeletonChirho = hebrewSkeletonChirho(readChirho.textChirho);
      if (skeletonChirho.length === 0 || tokenSkeletonsChirho.has(skeletonChirho)) return null;
      return {
        textChirho: readChirho.textChirho,
        skeletonChirho,
        confidenceChirho: readChirho.confidenceChirho,
      };
    })
    .filter((readChirho): readChirho is RawHebrewDirectReadDisagreementChirho => readChirho !== null);
}

export function rawHebrewDelimiterNotationRiskChirho(textChirho: string): boolean {
  return /[()[\]{}<>]/u.test(textChirho) || textChirho.includes("...") || textChirho.includes("\u0307");
}

export function rawHebrewAttentionKindsChirho(itemChirho: RawHebrewReviewTriageItemChirho): RawHebrewAttentionKindChirho[] {
  const kindsChirho: RawHebrewAttentionKindChirho[] = [];
  const bestConfidenceChirho = bestRawHebrewDirectConfidenceChirho(itemChirho);
  if (bestConfidenceChirho !== null && bestConfidenceChirho < 0.75) {
    kindsChirho.push(RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO);
  }
  if (rawHebrewConfidentDirectReadDisagreementsChirho(itemChirho).length > 0) {
    kindsChirho.push(RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO);
  }
  if ((itemChirho.tokenSkeletonsChirho ?? []).length > 1) {
    kindsChirho.push(RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO);
  }
  if (rawHebrewDelimiterNotationRiskChirho(itemChirho.textChirho)) {
    kindsChirho.push(RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO);
  }
  if ((itemChirho.directWordReadsChirho ?? []).length === 0) {
    kindsChirho.push(RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO);
  }
  return kindsChirho;
}

export function rawHebrewAttentionReasonsChirho(itemChirho: RawHebrewReviewTriageItemChirho): string[] {
  const bestConfidenceChirho = bestRawHebrewDirectConfidenceChirho(itemChirho);
  const directDisagreementChirho = rawHebrewConfidentDirectReadDisagreementsChirho(itemChirho)[0] ?? null;
  return rawHebrewAttentionKindsChirho(itemChirho).map((kindChirho) => {
    if (kindChirho === RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO) {
      return bestConfidenceChirho === null
        ? "low direct-read confidence"
        : `low direct-read confidence ${bestConfidenceChirho.toFixed(4)}`;
    }
    if (kindChirho === RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO) {
      return directDisagreementChirho === null
        ? "confident direct-read disagreement"
        : `confident direct-read disagreement ${directDisagreementChirho.textChirho} @${directDisagreementChirho.confidenceChirho.toFixed(4)}`;
    }
    if (kindChirho === RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO) return "multi-token Hebrew span";
    if (kindChirho === RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO) return "delimiter/damaged-text notation";
    return "no direct CRNN crop read";
  });
}

export function rawHebrewTriageScoreChirho(itemChirho: RawHebrewReviewTriageItemChirho): number {
  let scoreChirho = 0;
  for (const kindChirho of rawHebrewAttentionKindsChirho(itemChirho)) {
    if (kindChirho === RAW_HEBREW_ATTENTION_CONFIDENT_DIRECT_READ_DISAGREEMENT_CHIRHO) scoreChirho += 5;
    if (kindChirho === RAW_HEBREW_ATTENTION_LOW_CONFIDENCE_DIRECT_READ_CHIRHO) scoreChirho += 4;
    if (kindChirho === RAW_HEBREW_ATTENTION_DELIMITER_NOTATION_CHIRHO) scoreChirho += 3;
    if (kindChirho === RAW_HEBREW_ATTENTION_MULTI_TOKEN_CHIRHO) scoreChirho += 2;
    if (kindChirho === RAW_HEBREW_ATTENTION_NO_DIRECT_READ_CHIRHO) scoreChirho += 1;
  }
  if (itemChirho.validationStatusChirho === "unvalidated-chirho") scoreChirho += 1;
  return scoreChirho;
}
