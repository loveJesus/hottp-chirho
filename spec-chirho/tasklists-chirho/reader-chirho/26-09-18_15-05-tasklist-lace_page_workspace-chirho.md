<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Lace-like page workspace Chirho

Authority: L.J. asked to make the interface Lace-like where appropriate. Local, reversible implementation; no production deployment, source certification, model/gold changes, or outbound messages.

- [x] Read Andrew's primary feedback and Lace's editing guide/source. Reference checkout: brobertson/Lace2, commit 7a9a43b34f4eb870312c8d5b5a643f62e2c12f82. Public trylace.org failed DNS; no claim of a running Lace session. No GPL source copied.
- [x] Establish placement: default page-reading workspace in app-chirho, separate components under lib/page-reader-chirho; existing word/language tools remain reachable. Extract oversized legacy page without changing its write contracts.
- [x] Build scan-left, full-text-right view with linked selection, padded magnification, inline correction and keyboard traversal. Missing snapshots must not hide existing segment/French text.
- [x] Keep draft text when moving between fields; explicit confirmation only. Box adjustments remain exportable local repair drafts, block text confirmation, never mutate canonical geometry. Machine evidence is not a human verification badge.
- [x] Verify Svelte check/build and browser behavior using local data, intercepted writes/failures, desktop/mobile, and both snapshot/fallback paths.
- [x] Record workflow and actual evidence; distinguish implementation from Andrew's acceptance and production readiness.

Existing API authorization/attribution and production provenance are not certified by this UI change. No endpoint permission is widened. Skill guidance keeps preference choices reversible; no branch/commit or communication needed for this local UI pass.

Evidence: 8 unit tests / 23 assertions; 29 browser assertions; separate missing-image check refused confirmation with zero writes. Svelte check zero errors/warnings; Cloudflare-adapter build successful. Browser found the repair-hold reactive dependency bug, fixed and retested. Details and honest remaining boundaries in `spec-chirho/workflows-chirho/page-reading-workflow-chirho.md`.

Preview: `http://127.0.0.1:5178/volumes-chirho/3/pages-chirho/151`. Box repair exports are local, not submitted into the approval workflow. No deployment, commit, push, canonical validation, or source repair performed.
