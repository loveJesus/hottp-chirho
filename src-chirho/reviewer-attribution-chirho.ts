// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared explicit-reviewer attribution checks.
 *
 * A certification-affecting review must name the actual human reviewer, not a
 * generic role placeholder or an obvious machine/model identity.
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

const MACHINE_REVIEWER_ID_RE_CHIRHO =
  /(^|[^a-z0-9])(anthropic|claude|codex|gemini|gpt[-_ ]?[0-9]*|llama|mistral|model|openai|o[0-9]+)([^a-z0-9]|$)/i;

function normalizedReviewerIdChirho(reviewerChirho: string): string {
  return reviewerChirho.trim().toLowerCase();
}

export function isGenericReviewerAttributionChirho(reviewerChirho: string): boolean {
  const trimmedChirho = normalizedReviewerIdChirho(reviewerChirho);
  return trimmedChirho.length === 0 || GENERIC_REVIEWER_IDS_CHIRHO.has(trimmedChirho);
}

export function isMachineReviewerAttributionChirho(reviewerChirho: string): boolean {
  return MACHINE_REVIEWER_ID_RE_CHIRHO.test(normalizedReviewerIdChirho(reviewerChirho));
}

export function isBlockedCertificationReviewerAttributionChirho(reviewerChirho: string): boolean {
  return isGenericReviewerAttributionChirho(reviewerChirho) || isMachineReviewerAttributionChirho(reviewerChirho);
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

export function certifyingReviewerAttributionErrorChirho(
  reviewerChirho: string,
  fieldNameChirho = "reviewerChirho"
): string | null {
  const explicitErrorChirho = explicitReviewerAttributionErrorChirho(reviewerChirho, fieldNameChirho);
  if (explicitErrorChirho !== null) return explicitErrorChirho;
  if (isMachineReviewerAttributionChirho(reviewerChirho)) {
    return `${fieldNameChirho} must identify a human reviewer; machine reviewer ${reviewerChirho.trim()} cannot certify`;
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

export function assertCertifyingReviewerAttributionChirho(
  reviewerChirho: string,
  fieldNameChirho = "--reviewer-chirho"
): void {
  const errorChirho = certifyingReviewerAttributionErrorChirho(reviewerChirho, fieldNameChirho);
  if (errorChirho !== null) throw new Error(errorChirho);
}
