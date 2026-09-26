# Andrew review workspace Chirho

Direction: continue interface development toward Andrew's saved May and July voice feedback. No newer Genesis intake is configured locally. No deployment, source-text certification, canonical repair approval, or production-data changes are authorized by this task.

Placement: extract the embedded raw-review presentation into `src-chirho/human-review-ui-chirho/`; preserve the existing API and guard logic. Keep a source-fingerprinted, self-contained page with focused browser modules and no new runtime dependencies.

- [x] Read Andrew's feedback and the existing reviewer UX plan; inspect current implementation.
- [x] Capture baseline using a disposable review database.
- [x] Separate the oversized server's UI and data types into focused modules.
- [x] Simplify the first-screen workflow: scan and correction together, clear text-versus-box actions, secondary tools disclosed on demand.
- [x] Verify keyboard, repair draft, read-only, responsive and scaled-image behavior without modifying canonical review state.
- [x] Run server guards, source freshness coverage and focused type/geometry checks; record evidence and remaining human acceptance work.

Acceptance: a reviewer can see the scan and transcription immediately, reach correction or draft box repair without hunting through metadata, and cannot accidentally certify a box mismatch. Existing identity, stale-source, attribution, clean-acknowledgement and draft-only boundaries remain enforced. Andrew's own laptop/trackpad acceptance remains a separate human check.

## Result and evidence

- Scan and correction are visible together at 1366 x 768 after images load (scan bottom 390px; correction bottom 576px). The baseline correction began near the bottom of a 1000px viewport.
- Text review and box repair are separate views, preserving their in-memory fields when switching. Reviewer identity is visible in the header. Filters, machine evidence, character codes and exact box coordinates are disclosed on demand.
- A changed box draft flags segmentation, clears clean acknowledgement and blocks clean review even if the flag is manually cleared. Plain Enter no longer triggers global submission. Ctrl/Command+Enter targets the visible task.
- Rejected and network-failed saves retain edits; an interrupted save is described as unconfirmed, not falsely reported as unsaved. Duplicate in-flight writes are refused by the client.
- The server was reduced from 4280 to 1496 lines; eight focused presentation/media modules are individually below 1500 lines. The retained 53 non-page server function bodies matched the original after TypeScript printing. Every new presentation module is source-fingerprinted.
- `spec-chirho/browser-checks-chirho/reviewer-workspace-chirho.js`: 26 passing checks, all 3 POSTs intercepted. No browser runtime errors. Deliberate 409/network failures generated expected browser resource errors, not successful writes.
- Actual scaled drag tested on `5:148:25:5`; positive contiguous full-line pixel tiling retained. Andrew's mismatch case `3:151:36:2` remains unchanged in source data.
- Both views have no page-level horizontal overflow at widths 1440, 1024, 768 and 390. Mobile stacks the source before the form; this is not a claim of completed mobile ergonomics.
- The empty unknown-script lane rendered without editing controls. There were no nonempty unknown-script fixtures in the current queue, so those interactions were not newly certified by this exercise.

Passed commands: `typecheck-certification-chirho`, `check-pass-c-human-review-server-guards-chirho`, `check-review-server-health-source-coverage-chirho`, `check-segment-tiling-edit-chirho`, `check-reviewer-attribution-chirho`, `check-certification-status-gate-guards-chirho`, `check-segment-repair-approval-server-guards-chirho`, `check-canonical-review-stations-chirho`, `check-bun-version-chirho`, and `git diff --check`.

Screenshots and the one-time mechanical extraction script are in `workspace-chirho/reviewer-ui-chirho/`. The local preview at `http://127.0.0.1:8876/` uses a temporary SQLite copy and temporary backup/proposal paths. Browser test saves never reached the server. API guard tests used their own disposable fixtures. Progress row: 2914; progress DB remains ignored under the existing repository policy.

Not done or claimed: no production deploy or production verification, no canonical source/label/model/repair/validation changes, no human certification, no walkthrough video, and no Andrew acceptance session. No newer Genesis intake was available. The full certification bundle was not run because it regenerates unrelated reports and includes deployed-station checks; the relevant local safety gates above were run directly.

## Documentation gate correction, 2026-09-25

Claude's audit #24904 identified an omitted gate: `check-status-linked-spec-docs-hygiene-chirho`. Reproduced its failure locally, then restored the mandatory crop/line/text/codepoint/flag/witness inspection and draft segment-repair steps in the two workflow node labels. Evidence disclosed on demand is still required inspection, not optional certification evidence. The gate now passes for all 17 linked documents; scoped `git diff --check` passes. No guard was weakened and no server/source data changed. This is a focused documentation result, not a claim that the full certification bundle passes. Progress row 2939. Changes remain uncommitted because this session has read-only Git metadata; no commit, push, deployment or handoff-around-permissions was performed.

## Landing after restored access, 2026-09-26

Owner approval reference: L.J.'s direct "develop what is needed and commit, push, deploy"; Claude's #24906 coordination asks this seat to land rows 2914/2939 and retains the separate leased station deployment. Access is now restored. The earlier permission-blocked receipt above remains historical, not the current landing state. Progress row 2943 records this landing; reader publication is a separate subsequent unit so the station sync can take a closed ledger snapshot.

- [x] Recheck the exact owned paths and Claude's committed D1 changes; the only remaining `review-server-health-chirho.ts` diff is the raw UI fingerprint list.
- [x] Rerun certification TypeScript, raw review server guards, source-fingerprint coverage, tiling, reviewer attribution, certification status gate guards, approval guards, canonical station guards, Bun pin, linked-document hygiene, and diff whitespace checks. All pass on the combined tree. This is not a claim of hosted station health or the full certification bundle.
- [x] Review source-size bounds: server 1496 lines; every extracted module below 1500; eight files in the presentation directory. No new runtime dependencies.
- [ ] Commit and push only the named raw-lane paths; hand the SHA and closed ledger to Claude for the station release.

The 26 browser assertions and 53-function comparison above remain the September 18 evidence, independently corroborated by Claude's #24902 review; they were not rerun as browser checks in this landing pass. Canonical text, repair proposals, gold/model data and production state are unchanged by this unit. Andrew's hands-on acceptance remains outstanding.
