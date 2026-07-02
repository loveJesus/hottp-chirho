// For God so loved the world, that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Server-authoritative reviewer identity for browser review writes.
 *
 * Reviewer text submitted by the browser is display-only. Stored attribution
 * comes from a trusted reverse-proxy header, falling back to the server's
 * local-dev `--reviewer` value when no proxy header is present.
 */

export const CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER_CHIRHO =
  "cf-access-authenticated-user-email";
export const CADDY_AUTHENTICATED_USER_HEADER_CHIRHO = "x-webauth-user";
export const TRUSTED_REVIEWER_HEADER_ENV_CHIRHO = "HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO";

const TRUSTED_REVIEWER_HEADER_NAMES_CHIRHO = [
  CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER_CHIRHO,
  CADDY_AUTHENTICATED_USER_HEADER_CHIRHO,
] as const;

function configuredTrustedReviewerHeaderChirho(): string | null {
  const configuredHeaderChirho = process.env[TRUSTED_REVIEWER_HEADER_ENV_CHIRHO]?.trim().toLowerCase();
  if (configuredHeaderChirho === undefined || configuredHeaderChirho.length === 0) return null;
  if (TRUSTED_REVIEWER_HEADER_NAMES_CHIRHO.includes(configuredHeaderChirho as (typeof TRUSTED_REVIEWER_HEADER_NAMES_CHIRHO)[number])) {
    return configuredHeaderChirho;
  }
  throw new Error(
    `${TRUSTED_REVIEWER_HEADER_ENV_CHIRHO} must be ${CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER_CHIRHO} or ${CADDY_AUTHENTICATED_USER_HEADER_CHIRHO}`
  );
}

export function trustedReviewerIdentityChirho(
  headersChirho: Headers,
  serverReviewerChirho: string
): string {
  const configuredHeaderChirho = configuredTrustedReviewerHeaderChirho();
  if (configuredHeaderChirho !== null) {
    const configuredHeaderValueChirho = headersChirho.get(configuredHeaderChirho)?.trim();
    if (configuredHeaderValueChirho !== undefined && configuredHeaderValueChirho.length > 0) {
      return configuredHeaderValueChirho;
    }
    return serverReviewerChirho.trim();
  }
  for (const headerNameChirho of TRUSTED_REVIEWER_HEADER_NAMES_CHIRHO) {
    const headerValueChirho = headersChirho.get(headerNameChirho)?.trim();
    if (headerValueChirho !== undefined && headerValueChirho.length > 0) {
      return headerValueChirho;
    }
  }
  return serverReviewerChirho.trim();
}
