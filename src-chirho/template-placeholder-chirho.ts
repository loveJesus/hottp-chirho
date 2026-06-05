// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared template-placeholder checks for certification-affecting CLI fields.
 */

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
