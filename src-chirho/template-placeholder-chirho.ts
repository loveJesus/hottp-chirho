// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared template-placeholder checks for certification-affecting CLI fields.
 */

export const REVIEW_NOTES_PLACEHOLDER_VALUES_CHIRHO = new Set([
  "why this issue is recorded",
  "why these issues are recorded",
  "why this exact issue is recorded",
  "why this problem is recorded",
  "notes",
  "note",
  "rationale",
  "reason",
  "placeholder",
  "todo",
  "tbd",
]);

export function valueLooksTemplatePlaceholderChirho(
  valueChirho: string,
  placeholderValuesChirho: Set<string>
): boolean {
  const normalizedChirho = valueChirho
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const unwrappedChirho = normalizedChirho.replace(/^<(.+)>$/u, "$1").trim();
  return (
    placeholderValuesChirho.has(normalizedChirho) ||
    placeholderValuesChirho.has(unwrappedChirho)
  );
}

export function reviewNotesLookPlaceholderChirho(notesChirho: string): boolean {
  return valueLooksTemplatePlaceholderChirho(notesChirho, REVIEW_NOTES_PLACEHOLDER_VALUES_CHIRHO);
}
