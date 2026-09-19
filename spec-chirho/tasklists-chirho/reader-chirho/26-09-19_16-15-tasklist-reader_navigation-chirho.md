<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Reader navigation Chirho

Authority: L.J.'s direct "continue dev" after cleanup. Progress row 2935 in the main-tree ledger only. Local reversible reader work; no production/source data writes or station edits.

Decision: add page-local stored-text search, line jump, and copyable record links beside existing scope traversal. Confidence high that locating a confusing reading supports Andrew's workflow; exact copy/layout remains plastic. Alternative is a station deep link, but its different 1D identity/geometry cannot be invented from these 2D records. Correction cost is removal of this isolated UI module. No new dependency or data schema.

Placement: pure matching/link helpers plus a small navigator component in `app-chirho/src/lib/page-reader-chirho`; parent retains selection, draft recovery and save ownership. Isolated branch `reader-navigation-20260919-chirho` from e93b105. No architecture fork/checkpoint tag needed for this additive navigation feature.

- [x] Inspect current source, primary feedback/tasklists, ownership and protected boundaries; announce reader-only scope.
- [x] Implement find/line/link navigation without saving or including draft text in URLs; preserve context and drafts.
- [x] Test multilingual matching, exact/missing/malformed links, clipboard refusal, selection restoration, keyboard behavior and mobile layout using disposable local data.
- [x] Run reader regression checks and Svelte check/build, review changed scope and record evidence.
- [x] Commit owned paths and fast-forward into main without staging the raw-station lane. Source commit `4369d4c`; 29 tests / 140 assertions pass again from main after landing.

Acceptance: meaningful navigation in a real rendered reader; navigation performs zero content mutation requests, retained drafts survive links/search/reload, no invented replacement for a missing record, URLs contain only origin/page/record identity plus a stored-source digest, and auth/confirmation behavior remains unchanged. This is not Andrew's hands-on acceptance or hosted release evidence.

## Evidence

- 29 Bun tests / 140 assertions pass, including multilingual folding, wrapping matches, source/reseed mismatch, malformed link parsing and strict return paths.
- New browser suite: 34 assertions, zero API mutations and runtime errors. Real local sign-in round-trips the exact linked reading and existing draft; a fresh tab sees stored text only. Clipboard success/refusal is simulated without changing the system clipboard. Broken/unrelated fragments, line absence, draft preservation, and editor/confirmation hit testing at 320/390/700/1024px pass.
- Existing interaction suite: 29 assertions, four confirmation requests intercepted (zero source writes). Existing recovery suite: 22 assertions, zero content writes/runtime errors. Synthetic credentials and copied local D1/R2 only; port 5183.
- Svelte check: zero errors/warnings. Cloudflare-adapter production build succeeds. No new dependencies or lockfile changes. Source files and owned code/test directory sizes pass. Grouped this and four completed reader tasklists under `reader-chirho/`, updating two report references, so the inherited flat tasklist directory returns within the entry limit without moving another agent's work.
- Desktop and mobile screenshots were inspected under `workspace-chirho/reviewer-ui-chirho/26-09-19-navigation-chirho/`. Visual inspection exposed clipped mobile confirmation controls; increasing mobile content flow and allowing short desktop panel scrolling fixes it. A new 700px-height viewport test also exposed the sticky global header covering the editor; keeping the header in flow fixes it. These are real fixes, not screenshot-only claims.
- Claude read-only audit #23800 passed search/link/fingerprint/redirect reasoning and identified unrelated-fragment handling; fixed and exercised in the browser. The first browser harness attempt hit a tool file-root restriction; copying the harness into the permitted project directory resolved it. A runner-only missing `URL` global was corrected in the harness. Neither failed attempt is counted as product proof.
- Canonical witness byte hash remains `3c9ab06d0305035305b9f525307b600e22ea9f07554e959cb8aa2acca3827d40`, matching the pre-work cleanup check. No canonical DB opening/test writes, production content/schema changes or deployment in this pass. Current deployed artifact remains retained in the main app.

Recovery: revert these scoped code changes; retain authenticated mutation gates and provenance fixes from the earlier release. Source-bound links are not a repair-station bridge and cannot certify a reading. The skill-guided implementation stayed isolated and reversible; live publication is a separate landing step.

Test server stopped after verification. Removed only the isolated navigation worktree's inactive `app-chirho/node_modules` and copied `app-chirho/.wrangler` after empty open-file checks, keeping its committed source and build artifact. Reinstall dependencies and make a fresh test-state copy before rerunning the local browser harness; never default a test run to the canonical witness. Main dependencies and deployed artifact were not removed. No hosted release or push is claimed by this development receipt.
