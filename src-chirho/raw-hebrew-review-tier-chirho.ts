// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

export const RAW_HEBREW_REVIEW_TIER_SPOT_CHECK_CHIRHO = "spot-check-chirho";
export const RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO = "primary-vols-3-5-chirho";
export const RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO = "primary-vol-2-chirho";

export interface RawHebrewReviewTierInputChirho {
  volumeChirho: number;
  validationStatusChirho: string;
}

export function rawHebrewReviewTierForSpanChirho(spanChirho: RawHebrewReviewTierInputChirho): string {
  if (spanChirho.validationStatusChirho === "all-token-validated-chirho") {
    return RAW_HEBREW_REVIEW_TIER_SPOT_CHECK_CHIRHO;
  }
  if (spanChirho.volumeChirho >= 3) {
    return RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO;
  }
  return RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO;
}
