<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Human Review VPS Boundary Chirho

## Purpose Chirho

This document records the deployment boundary for browser-based human review
tools. The Cloudflare app remains the read-mostly reader. The Bun review
stations stay on one authenticated VPS or local workstation with filesystem
access, SQLite state, and explicit commit-back.

## Trusted Reviewer Identity Chirho

Stored reviewer attribution is server-authoritative. Browser-submitted
`reviewerChirho` values are display-only and must not decide persisted reviewer
identity.

Production reviewer identity is pinned by
`HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO`. The server trusts only that configured
header and ignores the other supported identity header. The first Caddy
basic-auth deployment sets:

```text
HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user
```

Supported production header values are:

1. `cf-access-authenticated-user-email`
2. `x-webauth-user`

If the configured trusted header is absent on a request, the server does not
fall back to the local `--reviewer=...` identity. That makes a broken or
bypassed VPS proxy fail closed instead of storing a CLI fallback reviewer. The
local `--reviewer=...` fallback is available only when the environment variable
is unset for trusted local/dev sessions. If the environment variable is unset,
the dual-header behavior is local-dev only and must not be used for the VPS
deployment.

If the configured trusted header and local fallback are absent or generic,
certification-affecting writes fail through the existing reviewer-attribution
guards.

The two supported production gateways are:

- Cloudflare Access in front of the VPS, forwarding
  `Cf-Access-Authenticated-User-Email`, with
  `HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=cf-access-authenticated-user-email`.
- Caddy basic-auth or auth portal in front of the VPS, injecting
  `X-Webauth-User`, with
  `HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user`.

Do not rely on a browser form, localStorage, or POST body reviewer value for
stored attribution.

## Network Boundary Chirho

All Bun review servers must bind to `127.0.0.1`, never `0.0.0.0`. Public traffic
must reach them only through the authenticated reverse proxy.

Current review station ports:

- `:8766` raw Hebrew human validator.
- `:8770` Latin/symbol review.
- `:8771` expert non-Latin review.

Other local tools, such as glyph review, labeling, polygon annotation, font
specimen, and Hebrew validation, follow the same localhost-only rule.

## Single-Writer DB Rule Chirho

Only one box owns human-review writes at a time. The canonical writer owns:

- `spec-chirho/progress-chirho.sqlite`
- any active review SQLite DBs
- committed review backup JSON files
- generated status/backup artifacts that represent human decisions

Do not run competing write-capable review servers against separate copies of the
same review state. SQLite files are binary and do not merge safely.

## Asset Sync Rule Chirho

`workspace-chirho/` bulk assets are gitignored and must be copied to the VPS
explicitly. A repository clone is not enough.

Minimum sync set before starting review:

- `workspace-chirho/spans-chirho/`
- `workspace-chirho/scanlines-chirho/`
- review packets and manifests
- expert pack images
- any D1/R2-derived local mirrors needed by the selected server

## Commit-Back Ritual Chirho

For each review session:

1. Stop or pause write-capable review servers.
2. Copy the canonical SQLite DB and generated backup artifacts from the writer
   box back into the repository working tree.
3. Run the relevant guard scripts:
   - `bun run check-pass-c-human-review-server-guards-chirho`
   - `bun run check-latin-symbol-review-server-guards-chirho`
   - `bun run check-vision-tier-expert-review-server-guards-chirho`
   - `bun run transcription-certification-status-chirho`
   - `bun run check-certification-strict-status-chirho`
4. Inspect `git status --short` and stage only intentional review artifacts.
5. Commit the review artifacts by exact path.
6. Restart the review servers from the committed state.

If any guard fails, do not commit the review batch until the discrepancy is
understood and either fixed or explicitly backed out.

## Cloudflare Boundary Chirho

The Cloudflare app can serve public read-only views from D1/R2. It should not
become the primary authoring system until its write routes are separately
authenticated, bounded, and covered by reviewer-attribution guards.

Do not run destructive D1 sync tooling against the live reader database as part
of review-server commit-back. Use page-scoped or explicitly reviewed sync paths
only.
