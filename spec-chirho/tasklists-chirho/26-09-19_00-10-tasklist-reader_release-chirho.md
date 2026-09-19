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
- [ ] Reread release scope, run check/build, checkpoint explicit owned paths and deploy exact verified app artifact.
- [ ] Verify hosted source/transcript/image/login/refusal behavior; record version, rollback, remaining boundaries and progress.

Baseline hosted version: 6644c9ec-517b-4bdd-aeb5-411c95e690d2 (2026-05-24). Worker settings currently contain DB/R2/APP_NAME only, no secret bindings; no matching Access application. Legacy mutation routes are unauthenticated. Read-only sync consumer src-chirho/sync-from-d1-chirho.ts must continue working.

Progress row: 2917. Ownership: HOTTP_CHIRHO/gpt_chirho (runtime pane %133). Claude asked for read-only contract audit; no parallel edits requested.

Pre-deploy evidence: 24 unit tests/101 assertions; 7 local and 7 disposable remote D1 cases; browser suites 29 + 22 + 31 + 12; 25-page coordinate preflight. Zero Svelte errors/warnings, successful adapter build, no frozen-install changes. Read-only audit message 23630 reports no release blockers. Release includes reader rows 2915-2917, excluding row 2914 raw-station refactor. See page-reading-workflow-chirho.md for exact scope, failed-test corrections, witness logical fingerprint and recovery boundary.
