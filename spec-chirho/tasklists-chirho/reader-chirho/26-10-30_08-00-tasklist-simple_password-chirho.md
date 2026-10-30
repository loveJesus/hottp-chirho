<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Simple reader password Chirho

Authority: L.J. directly requested a simple shared password on 2026-10-30, followed by "its mostly to dissuade bots right now". This replaces the planned email-code entrance for this reader. Standing direct commit/push/deploy instructions apply to the existing Worker. Main ledger row 2956. Isolated branch reader-password-20261030-chirho from ac60b63; local checkpoint reader-password-20261030-before-chirho.

Decision: one password-only screen unlocks the reader and its existing shared-reviewer save permissions for eight hours. A dedicated HOTTP_SITE_PASSWORD_CHIRHO secret and the existing random signing secret protect the session; changing either invalidates sessions. The password stays outside Git and built assets. Existing station/approval credentials, source-match saves, attribution and certification rules are unchanged. This is a shared account, not individual reviewer certification. No full-corpus upload is included.

Placement: reuse reviewer-chirho and review-chirho/session-chirho.ts; enforce access in hooks.server.ts using decoded route identities. Return unauthorized API requests as 401 and browser page requests to the password form. The existing event-sync consumer authenticates GET events using the dedicated password and earns no write session. Tests live under proof-chirho/password-chirho/. Update the existing page-reading workflow and the login decision in the corpus plan.

- [x] Inspect current auth, callers, instructions, Git and ledger ownership; create isolated worktree.
- [x] Implement one password field, signed session, fail-closed whole-reader access and preserved deep links.
- [x] Preserve event sync with a read-only authenticated path; add crawler backstop.
- [x] Verify real HTTP/browser login, refusal, expiry/tamper, rate limiting, deep links, shared save and mobile behavior on disposable state; run focused unit and build checks.
- [x] Verify live schema/index prerequisites and compatibility before publication; keep production content unchanged.
- [x] Store the requested password privately and in the Worker secret store; scan explicit commit range and build artifacts; commit/push owned paths.
- [x] Deploy the existing Worker and verify both hostnames using reads/refused writes, then close row 2956 and record the release.

Acceptance: an ordinary reader enters only the shared password and can read, draft and save under the existing shared-reviewer identity. Anonymous page, image and API requests cannot read corpus content. Password/session secrets never enter response data or static assets. Failed login does not create a session; stale source or cross-origin saves still refuse. Event sync retains bounded authenticated reads. Missing configuration refuses access rather than opening the reader.

Local proof: 56 unit tests / 271 assertions; 14 real local D1 scale/export/find tests; 36 browser checks pass. One copied-D1 save earns a shared-reviewer receipt and a stale repeat refuses without another event. Desktop/mobile sign-in screenshots are retained under workspace-chirho/reviewer-ui-chirho/26-10-30-shared-password-chirho/. No tests write production content.

The copied database is physically separate from the protected witness. The witness SHA-256 before tests is 3c9ab06d0305035305b9f525307b600e22ea9f07554e959cb8aa2acca3827d40. Production preflight counts: pages 46, scanlines 1076, words 11938, segments 1925, known words 275, events 237, max seq 752.

Production schema action: applied the previously committed paired reference-index DDL (CREATE INDEX IF NOT EXISTS). D1 reports 237 index rows written, changes 0, no content projection update. Captured 12 SELECT queries from the real catalog functions against the owned copy, then EXPLAINed each on production: expected page/scanline/segment seeks, covering home scan and covering reference index, all EXPLAIN rows_written=0. Runner: proof-chirho/password-chirho/predeploy-chirho.ts.

Fixture corrections: SvelteKit serializes page-data redirects and JSON action failures with HTTP 200, so the harness now checks the redirect envelope and uses the browser's HTML Accept header for form refusal tests. A plain read-only open of a sidecar-less WAL copy failed; the preflight now reuses openLocalD1ReadonlyChirho. These setup/transport failures are excluded from passing counts.

Final Svelte check: zero errors/warnings. Cloudflare-adapter build passes. Scanned 156 output/adapter files against nine configured/fixture credential fields: zero hits. No dependency/lockfile change. The requested password is stored only in the main checkout's ignored environment file and will be installed as HOTTP_SITE_PASSWORD_CHIRHO in the existing Worker.

## Publication

Source 503a993 was committed after a 16-path scope audit, fast-forwarded to main and pushed. Gitleaks over the exact pushed source range found no leaks. The app was clean when the final artifact was built; the repeated artifact credential scan found zero hits. The existing signing key and station credentials were retained; only the dedicated reader password was added to the Worker secret store.

Published with the locked Wrangler 4.67.0 to the existing Worker and both existing hostnames. Active version 2ed6b14d-df2d-46fa-9dfa-c382a08491dc, deployment 4854cb25-4ca5-4563-9573-9649cd767990, created 2026-10-30T12:25:51.260814Z at 100%. This also publishes the previously committed draft restore, bounded catalog/export/home and reference search. The hosted corpus remains 46 pages; no intake load occurred.

Hosted proof: 35 browser/HTTP assertions across hottp-chirho.bible.systems and hottp-chirho.lovejesus.workers.dev. Anonymous API/image/export/encoded-path requests return 401, page requests reach the single password field, correct sign-in/reload/image/search work, Secure/HttpOnly/Strict cookies are set, deliberately empty saves return 400, cross-origin saves return 403, and logout closes access. No valid production confirmation was submitted; zero browser runtime errors. The retained hosted runner takes the private password as a runtime argument. The browser VM does not permit filesystem imports, so it never reads the environment itself.

After hosted checks, read-only counts remain 46 pages / 1076 scanlines / 11938 words / 1925 segments / 275 known words / 237 events, max seq 752. This is count/cursor evidence, not full-row-hash equivalence. The protected local witness retains SHA-256 3c9ab06d0305035305b9f525307b600e22ea9f07554e959cb8aa2acca3827d40. Row 2956 is closed.

Recovery: prefer correcting the dedicated secret or a scoped fix-forward. Previous authenticated version 3c04b05c remains the pre-release reference but would reopen public reading; never restore the anonymous-write May Worker. Eight-hour sessions and private/no-store responses remain the intended contract. Individual certification, station approval and full-corpus promotion are separate.

Cleanup: closed the owned browser/server, verified no open handles under the temporary root, removed the clean merged worktree through Git and deleted only its regenerable copied D1/R2 state. Source and retained proof runners remain in Git, screenshots in the main workspace, and the protected witness and intake corpus are preserved.
