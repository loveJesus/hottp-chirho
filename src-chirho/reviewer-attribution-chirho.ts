// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared explicit-reviewer attribution checks.
 *
 * A certification-affecting review must name the actual reviewer, not a
 * generic role placeholder.
 */

export const GENERIC_REVIEWER_IDS_CHIRHO = new Set<string>([
  "arabist",
  "arabist-chirho",
  "greek reviewer",
  "greek-reviewer-chirho",
  "hebrew reviewer",
  "hebrew-reviewer-chirho",
  "hebrew/wlc reviewer",
  "hebrew-wlc-reviewer-chirho",
  "human",
  "human-chirho",
  "human-reviewer",
  "human-reviewer-chirho",
  "reviewer",
  "reviewer-chirho",
  "syriac reader",
  "syriac-reader-chirho",
  "unknown",
  "unknown-chirho",
  "unknown-reviewer",
  "unknown-reviewer-chirho",
]);

function normalizedReviewerIdChirho(reviewerChirho: string): string {
  return reviewerChirho.trim().toLowerCase();
}

export function isGenericReviewerAttributionChirho(reviewerChirho: string): boolean {
  const trimmedChirho = normalizedReviewerIdChirho(reviewerChirho);
  return trimmedChirho.length === 0 || GENERIC_REVIEWER_IDS_CHIRHO.has(trimmedChirho);
}

export function explicitReviewerAttributionErrorChirho(
  reviewerChirho: string,
  fieldNameChirho = "reviewerChirho"
): string | null {
  const displayReviewerChirho = reviewerChirho.trim();
  const trimmedChirho = normalizedReviewerIdChirho(reviewerChirho);
  if (trimmedChirho.length === 0) return `${fieldNameChirho} is required`;
  if (GENERIC_REVIEWER_IDS_CHIRHO.has(trimmedChirho)) {
    return `${fieldNameChirho} must identify the explicit reviewer, not generic ${displayReviewerChirho}`;
  }
  return null;
}

export function assertExplicitReviewerAttributionChirho(
  reviewerChirho: string,
  fieldNameChirho = "--reviewer-chirho"
): void {
  const errorChirho = explicitReviewerAttributionErrorChirho(reviewerChirho, fieldNameChirho);
  if (errorChirho !== null) throw new Error(errorChirho);
}
