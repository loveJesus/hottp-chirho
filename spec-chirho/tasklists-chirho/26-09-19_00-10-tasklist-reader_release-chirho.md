<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Reader release Chirho

L.J. directs: "continue dev and even deploy". Release the Lace-style reader to the existing hottp-chirho Worker and hostname. No new domain/Worker, gold/model remediation, canonical approvals, or reviewer-content test writes in production.

owner_approval_reference: direct L.J. message in this Codex thread, "continue dev and even deploy"; preceding direction asks for Andrew's Lace-like interface.

Placement: shared reviewer authentication and atomic reading confirmation under app-chirho/src/lib/server-chirho/review-chirho; existing reader transport consumes a dedicated authenticated confirmation endpoint. Public reading remains available; all API mutations require reviewer sign-in. Reuse existing review credentials as Worker secrets, never browser code. No new packages or database migration. Production is live-client consequence; use isolated local test records and read-only/refused-write hosted smokes.

- [x] Inspect current instructions, shared tree, hosted configuration, credentials names, existing consumers and deployment baseline.
- [x] Add bounded, expiring reviewer sign-in and same-origin mutation gate; retain public viewing/drafting.
- [x] Add transactional source-match confirmation and audit attribution for word/segment readings; hold incomplete event tails and failed refreshes.
- [x] Verify local real writes, rejected stale/forged/unauthenticated writes, rollback and browser recovery/reader behavior.
- [x] Calibrate volume-5 display, retain raw CAS/draft units, hold clipped tokens rather than whole padded-folio pages, and avoid known-bad line images.
- [x] Reread release scope, run check/build, checkpoint explicit owned paths and deploy exact verified app artifact.
- [x] Verify hosted source/transcript/image/login/refusal behavior; record version, rollback, remaining boundaries and progress.

Baseline hosted version: 6644c9ec-517b-4bdd-aeb5-411c95e690d2 (2026-05-24). Worker settings currently contain DB/R2/APP_NAME only, no secret bindings; no matching Access application. Legacy mutation routes are unauthenticated. Read-only sync consumer src-chirho/sync-from-d1-chirho.ts must continue working.

Progress row: 2917. Ownership: HOTTP_CHIRHO/gpt_chirho (runtime pane %133). Claude asked for read-only contract audit; no parallel edits requested.

Pre-deploy evidence: 24 unit tests/101 assertions; 7 local and 7 disposable remote D1 cases; browser suites 29 + 22 + 31 + 12; 25-page coordinate preflight. Zero Svelte errors/warnings, successful adapter build, no frozen-install changes. Read-only audit message 23630 reports no release blockers. Release includes reader rows 2915-2917, excluding row 2914 raw-station refactor. See page-reading-workflow-chirho.md for exact scope, failed-test corrections, witness logical fingerprint and recovery boundary.

## Deployed outcome

- Source commit `47a8420` pushed to `gh_chirho/main`. `app-chirho` was clean before the final build; unrelated raw-station work remains outside this commit.
- Worker `hottp-chirho`, version `c72418ea-e5ed-4f44-9b84-4b2b6db94ab4`, deployed 2026-09-19. Existing custom hostname and workers.dev hostname; no new subdomain/service. Three selected review secrets provisioned from ignored .env through stdin, never logged. No migrations or R2 source writes.
- Adapter output fingerprint: 41 files; SHA256 `f08ba52028cc6efce891557af7cbdc3ce06d94befb6ec93a96f1849eaed4ac58`, computed over sorted relative paths plus bytes. Build secret-value scan passes. Hosted `/_app/version.json` equals local `{"version":"1789793623516"}`. Wrangler upload 790.40 KiB / 155.63 KiB gzip.
- `hosted-smoke-chirho.ts`: 47 checks pass, including anonymous mutation refusal on both hostnames and encoded routes, real shared credential sign-in, Secure/HttpOnly/Strict eight-hour cookie, session reuse, signed Origin/content-type/invalid-payload refusal, encoded-page private cache policy, logout, and public event GET. All attempted content writes were refused. Production event ledger before/after: 237 rows, max sequence 752, unchanged. No successful production confirmation was tested.
- Hosted browser: 12 checks pass on volumes 3 and 5, full-page image/linked magnifier, correct volume-5 line-25 alignment, anonymous hold, 390px layout, login form, zero API writes and zero runtime errors. Desktop/mobile screenshots visually inspected under `workspace-chirho/reviewer-ui-chirho/26-09-19-hosted-*`.
- Existing login credentials now required to persist readings; public viewing/local drafts stay available. Geometry repair remains an unsubmitted local export. Andrew's hands-on acceptance and canonical repair intake integration remain open.
- Read-only follow-up audit 23632 confirms commit scope and final calibration. Future hardening: image GET currently accepts any R2 key; the bucket was independently inventoried as public book PNGs/snapshots only. Do not add private objects under this bucket/API contract. Any authorized re-cut must use NEW object keys because images are cached immutable for one year.
- Recovery: do not directly roll back to the anonymous-write May version. Retain the authenticated mutation gate or disable writes before any emergency presentation rollback. Known unrelated review-station health failures, gold/model remediation, training/certification data and source provenance remain outside this release.
