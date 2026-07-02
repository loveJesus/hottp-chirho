<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Human Reviewer Tooling Goal Plan Chirho

## Goal Objective Chirho

Make the HOTTP review tooling complete and easy enough that non-agent human
reviewers can reconstruct text, verify segment boundaries, flag issues, supply
expert readings, and certify eligible items through guarded browser workflows,
with server-authoritative reviewer attribution and no hidden weakening of the
certification gate.

## Non-Goals Chirho

- Do not mark the corpus complete.
- Do not move the authoring/review servers to Cloudflare Workers.
- Do not let UI convenience bypass the existing fail-closed certification gates.
- Do not require normal reviewers to run shell commands for routine review work.

## Phase 1 — Authority And Deployment Boundary Chirho

- [x] Choose the trusted reviewer identity source: support Cloudflare Access
      `Cf-Access-Authenticated-User-Email`, Caddy `X-Webauth-User`, then local
      server `--reviewer` fallback.
- [x] Update write paths so server identity wins and client-submitted
      `reviewerChirho` is display-only for raw Hebrew, Latin/symbol, and expert
      review stations.
- [x] Add impersonation guard tests: forged client reviewer must not reach stored
      attribution.
- [x] Document the VPS boundary: Bun review servers on `127.0.0.1`, Caddy/TLS in
      front, one canonical write-owning DB.
- [x] Document the DB backup/commit-back ritual for human review rows.

## Phase 2 — Single Reviewer Launchpad Chirho

- [x] Add a browser launchpad that links every review lane from one place:
      raw Hebrew, Latin/symbol, expert non-Latin, saved issues, and status.
- [x] Show role-specific first-pending links and counts without exposing unsafe
      write actions.
- [x] Add short lane-specific guidance directly near each launch button.
- [x] Make the launchpad read from the same status/gate sources as the existing
      report so counts cannot drift.

## Phase 3 — No-Command Expert And Issue Workflows Chirho

- [x] Replace the Syriac expert-supplied-text command helper with a guarded
      browser form for authenticated script readers.
- [x] Keep supplied text distinct from expert confirmation: supply fills the
      blank; confirmation remains a separate explicit expert action.
- [x] Ensure report-issue remains available to non-readers for crop/source/
      segmentation problems without certifying text.
- [x] Preserve current fail-closed behavior for stale pack text/images/paths.

## Phase 4 — Segment Repair Assistant Chirho

- [ ] Build a guarded browser workflow for proposing segment repairs:
      split, merge, rebox, edit script, edit provisional text, and preview line.
- [ ] Require every proposed repair to show target crop, full line, old segments,
      new segments, and exact geometry.
- [ ] Store repair proposals as reviewable/draft records first; do not auto-
      certify repaired text.
- [ ] Add explicit issue types for segmentation, missing script, wrong script,
      punctuation attachment, and unreadable script.
- [ ] Add guard checks that repaired tiling is contiguous, positive-width, and
      line-covering before any apply path can run.

## Phase 5 — Reviewer Documentation And Workflows Chirho

- [ ] Create concise quickstarts for Hebrew/WLC, Greek, Syriac, Arabic, and
      Latin/symbol reviewers.
- [ ] Add competence-boundary language: confirm only exact letters/marks within
      the reviewer lane; otherwise flag or skip.
- [ ] Add Mermaid workflow diagrams under `spec-chirho/workflows-chirho/` for
      raw review, expert confirmation, expert-supplied blank text, and segment
      repair.
- [ ] Link the quickstarts and workflows from the launchpad and status report.

## Phase 6 — VPS Smoke Deployment Chirho

- [ ] Provision one small authenticated VPS review host.
- [ ] Run Caddy with TLS and proxy only to localhost-bound Bun servers.
- [ ] Rsync `workspace-chirho/` assets and the canonical review DB explicitly;
      do not rely on git for ignored bulk assets.
- [ ] Start only `:8766` first, complete one remote reviewer smoke test, then add
      `:8770` and `:8771`.
- [ ] Prove DB commit-back with one harmless review action and a restore test.

## Phase 7 — Verification Gates Chirho

- [ ] `bun run check` and `bun run build` in `app-chirho`.
- [ ] Certification guard scripts still pass and gate remains red unless real
      review work legitimately reduces it.
- [ ] Reviewer-attribution guard rejects forged client identity.
- [ ] Review-server guard scripts pass for raw Hebrew, Latin/symbol, and expert
      review lanes.
- [ ] Playwright smoke checks the launchpad and one read-only/one write-capable
      authenticated reviewer path.
- [ ] `git diff --check` clean.

## Definition Of Done Chirho

- [ ] A normal human reviewer can open one URL, choose their lane, review an item,
      flag or certify it, and see the next item without shell commands.
- [ ] A script expert can supply text for the blank Syriac span through the
      browser, and it remains unconfirmed until separately certified.
- [ ] A reviewer can propose a segment split/merge/rebox without the proposal
      silently certifying text.
- [ ] Every stored review action is attributed to the authenticated server-side
      reviewer identity.
- [ ] All new convenience paths are fail-closed on stale text, stale images,
      malformed packets, or geometry drift.
