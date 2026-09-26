<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP reader navigation release Chirho

L.J.'s direct "develop what is needed and commit, push, deploy" authorizes this release. The existing reader at https://hottp-chirho.bible.systems now has page-local multilingual search, previous/next matches, line jumps and copyable source-bound reading links. Shared links preserve the exact reading through sign-in; changed source refuses a guessed substitute. Drafts stay in the originating tab and are never put in a shared URL. No new hostname, Worker, runtime dependency or schema migration.

Navigation source `4369d4c` is pushed. Validated app tree `595d8ee` matches release preparation `e2416a3`; the app was clean when built and published. Active Worker `3c04b05c-0ac0-42d8-993a-b2cc23d00aea` serves 100%, created `2026-09-26T17:11:38.91838Z`. Asset version `1790442342542`; adapter SHA256 `7bc6c4794ddc38db6c2bb66a6c409f67dc2922f8edf43ee2a44093fa7fc13e34` over 41 files. Existing auth, source-match confirmation and provenance classification are retained.

Fresh local proof: 29 unit tests / 140 assertions, 34 navigation browser assertions against copied local state, zero Svelte errors/warnings, frozen dependency install and production build. Credential-value scan: 147 generated files, six configured fields, zero hits. Hosted proof: 47 read/refusal smoke assertions on both hostnames, 20 navigation browser assertions, 16 public provenance assertions and three exact linked-sign-in HTTP checks. No valid production confirmation was submitted. The new hosted harness initially raced client-side sign-in navigation; waiting for the visible form corrected the harness without a product change.

Full-row hashes of all seven reader content tables match across publication: 46 pages, 1076 scanlines, 11938 words, 1925 segments, zero snippets, 275 known words and 237 events (max seq 752). Read-only queries report zero rows written. This covers the legacy tables missed by event-only checks, but is endpoint-equality evidence, not a universal infrastructure audit. The canonical local witness retains both its logical fingerprint `2584f948...` (46/11938/67) and file hash `3c9ab06d...`. Test state stayed in a disposable `/private/tmp` copy, outside the station sync payload.

Attribution remains conservative. Claude's #24901 relays L.J.'s answer that the anonymous events 750–752 and segment marks 9782/9793 have no known author. They remain unverified; no actor was invented and no production flags were reset. Andrew's hands-on acceptance, OCR provenance/remint/retrain decisions and a lossless reader-to-repair-station bridge remain separate work.

Coordination: Codex's previously blocked raw-review lane landed/pushed in `81c1168` plus `595d8ee`, explicit owned paths only. One staged new-file EOF whitespace defect was fixed in the follow-up before the station handoff. Ten focused raw/toolchain/documentation checks and the TypeScript check pass; no broad station-certification claim is inferred from them. Claude owns the leased four-station deployment; this report does not certify its outcome. The shared tree/ledger stayed frozen until his #24912 snapshot release.

Evidence: `spec-chirho/tasklists-chirho/reader-chirho/26-09-26_13-10-tasklist-reader_navigation_release-chirho.md` and `spec-chirho/page-reader-checks-chirho/navigation-chirho/release-2026-09-26-chirho.json`. Recovery prefers fix-forward; pre-release authenticated/provenance-aware version `7ef3d75d-1393-4d16-ab9b-ecadc3829cd2` is available. Never roll back to the anonymous-write May Worker.

Local consensus: pending Claude's read-only factual review. Not yet notified to AICEO.
