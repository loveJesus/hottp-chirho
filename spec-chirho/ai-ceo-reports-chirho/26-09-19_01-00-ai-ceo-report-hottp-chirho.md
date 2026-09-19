<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP reader release Chirho

Owner authority: L.J.'s direct "continue dev and even deploy" in the active Codex thread. Same Worker and domain, not a new service.

Shipped source commit `47a8420` to `https://hottp-chirho.bible.systems`; Worker version `c72418ea-e5ed-4f44-9b84-4b2b6db94ab4`. Source-left/transcription-right reading, linked magnifier, inline edits, keyboard traversal, bounded recoverable tab-local drafts and unsubmitted box-repair exports. Shared reviewer sign-in now gates all API mutations; reading remains public. The new confirmation path uses source-match concurrency, server-stamped shared attribution and transactional event/projection rollback. Volume-5 display coordinates are calibrated; the known-bad old line images are avoided, not rewritten.

Evidence: 24 unit tests/101 assertions; 7 local and 7 disposable remote D1 cases; 94 local browser checks; all 25 available line-bearing pages pass geometry preflight with five clipped segment boxes held individually. Zero Svelte errors/warnings; clean-app build and secret scan. Hosted release smoke: 47 checks across the custom and workers.dev hostnames, plus 12 public browser checks on volumes 3/5 and phone layout. Real credential sign-in was checked without exposing it. Only refused production content writes were attempted; event ledger stayed 237 rows/max sequence 752. Successful content writes were exercised on copied local D1 and synthetic remote D1 only; the remote fixture database was removed.

Independent review: Claude's read-only audits 23630 and 23632 found no release blockers, verified live schema compatibility, auth/actor fixes, calibration, logical witness fingerprint and exact commit scope. Hosted evidence is in the release tasklist and workspace screenshots; this milestone is pending Claude's final report-consensus acknowledgment before portfolio notification.

Boundaries: Andrew has not yet tried this iteration. Box-repair exports are not canonical approval/intake. No gold/model/canonical training changes, production source rewrites or VPS releases. Earlier raw-station work stays uncommitted and excluded. Existing latin/expert HTTP 500s and stale station fingerprints remain outside this release; no whole-project certification claim. Legacy gated tool writes are not all covered by the new confirmation transaction. Public image API must not receive private bucket objects; future repaired images require new keys due immutable caching.

Recovery: the previous May Worker allows anonymous writes, so it is not a safe automatic rollback. Retain an authenticated gate or disable mutations before any emergency rollback. Detailed record: `spec-chirho/tasklists-chirho/26-09-19_00-10-tasklist-reader_release-chirho.md` and `spec-chirho/workflows-chirho/page-reading-workflow-chirho.md`.
