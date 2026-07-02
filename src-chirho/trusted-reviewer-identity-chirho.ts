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

const TRUSTED_REVIEWER_HEADER_NAMES_CHIRHO = [
  CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER_CHIRHO,
  CADDY_AUTHENTICATED_USER_HEADER_CHIRHO,
] as const;

export function trustedReviewerIdentityChirho(
  headersChirho: Headers,
  serverReviewerChirho: string
): string {
  for (const headerNameChirho of TRUSTED_REVIEWER_HEADER_NAMES_CHIRHO) {
    const headerValueChirho = headersChirho.get(headerNameChirho)?.trim();
    if (headerValueChirho !== undefined && headerValueChirho.length > 0) {
      return headerValueChirho;
    }
  }
  return serverReviewerChirho.trim();
}
