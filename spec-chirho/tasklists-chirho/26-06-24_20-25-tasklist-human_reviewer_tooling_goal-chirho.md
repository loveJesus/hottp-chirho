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

- [x] Build a guarded browser workflow for proposing segment repairs:
      split, merge, rebox, edit script, edit provisional text, and preview line.
- [x] Require every proposed repair to show target crop, full line, old segments,
      new segments, and exact geometry.
- [x] Store repair proposals as reviewable/draft records first; do not auto-
      certify repaired text.
- [x] Add explicit issue types for segmentation, missing script, wrong script,
      punctuation attachment, and unreadable script.
- [x] Add guard checks that repaired tiling is contiguous, positive-width, and
      line-covering before any apply path can run.

## Phase 5 — Reviewer Documentation And Workflows Chirho

- [x] Create concise quickstarts for Hebrew/WLC, Greek, Syriac, Arabic, and
      Latin/symbol reviewers.
- [x] Add competence-boundary language: confirm only exact letters/marks within
      the reviewer lane; otherwise flag or skip.
- [x] Add Mermaid workflow diagrams under `spec-chirho/workflows-chirho/` for
      raw review, expert confirmation, expert-supplied blank text, and segment
      repair.
- [x] Link the quickstarts and workflows from the launchpad and status report.

## Phase 6 — VPS Smoke Deployment Chirho

External VPS provisioning remains open and should not be marked complete until a
real authenticated host exists and a remote reviewer smoke action is committed
back. Local prerequisites are ready: servers bind localhost, attribution is
server-authoritative, and the boundary/commit-back ritual is documented.

- [x] Add and pass `bun run check-human-review-vps-readiness-chirho` as a
      source-local preflight for localhost binding, trusted attribution headers,
      required assets, review packets, package scripts, and commit-back docs.
- [x] Add a concrete VPS smoke runbook covering rsync dry-run, Caddy trusted
      header proxying, raw-Hebrew-first startup, direct-port rejection, remote
      browser smoke, and commit-back proof.
- [x] Add a structured VPS smoke evidence template and verifier so Phase 6
      completion requires proof of remote auth, direct-port blocking, browser
      controls, harmless write smoke, guards, and commit-back/restore.
- [x] Add checked Caddy, environment, systemd, and raw-review service templates
      so the VPS setup copies reviewed artifacts instead of hand-transcribing
      proxy/header/service assumptions from prose.
- [x] Add checked systemd templates for the later Latin/symbol and expert
      review stations, while keeping the runbook raw-Hebrew-first until the
      first remote smoke and commit-back proof pass.
- [x] Add a dry-run-default sync helper for copying the full working tree,
      including ignored `workspace-chirho/` assets, to the review host with
      explicit excludes for `.git/`, `.env`, `node_modules/`, and build output.
- [x] Require real sync-out `--apply-chirho` to cite a completed provisioning
      decision whose selected host matches the sync host.
- [x] Add a dry-run-default commit-back pull helper for the canonical DB and
      review artifacts, with explicit optional flags for draft repair proposals,
      expert-supplied backups, and live span JSON.
- [x] Require real commit-back pull `--apply-chirho` to cite a completed
      provisioning decision whose selected host matches the pull host.
- [x] Bind real commit-back pull `--apply-chirho` to a write lease whose owner
      approval reference matches the completed provisioning decision.
- [x] Add a dry-run-default SSH host preflight helper for installed host checks:
      Bun, Caddy, rsync, directories, env permissions, Caddy validation, raw
      service status, and localhost server health.
- [x] Add a read-only provider inventory helper for existing Hetzner,
      DigitalOcean, and Cloudflare review-DNS state so provisioning starts from
      current infrastructure instead of assumptions.
- [x] Add a machine-checkable provisioning decision template/verifier so owner
      approval, host choice, DNS plan, budget posture, and single-writer safety
      are explicit before real VPS work starts.
- [x] Add a first-smoke completion checker that requires a completed
      provisioning decision and completed raw-Hebrew smoke evidence to agree on
      host, raw-review DNS name, station, and blocked direct port.
- [x] Quarantine remote `progress-chirho.sqlite` snapshots during commit-back
      so local agent log rows cannot be clobbered by binary SQLite overwrite.
- [x] Bind first-smoke evidence to a pulled-back Pass-C backup row so the
      remote write proof is measured from an artifact, not only self-attested.
- [x] Pin the trusted reviewer header for the Caddy VPS path and have host
      preflight verify the installed Caddyfile strips spoofable identity headers.
- [x] Add a write-lease verifier and require it for real VPS pull-back apply so
      local/remote write ownership is explicit before commit-back.
- [x] Have the commit-back pull helper measure local write-capable review ports
      and refuse `--apply-chirho` if raw, Latin/symbol, or expert review servers
      are still listening locally.
- [x] Add live-probe mode to smoke evidence checks so real host smoke verifies
      unauthenticated gateway denial and direct-port refusal itself.
- [x] Add a Phase 6 completion audit wrapper that composes the readiness,
      deployment-template, provisioning, write-lease, first-smoke, Pass-C
      backup-row, and certification guards into one final command.
- [x] Add a non-completed provisioning decision draft from read-only provider
      inventory so owner approval starts from current host/DNS evidence.
- [x] Add an owner approval handoff with current host/DNS inventory and the exact
      approval sentence needed before any VPS or DNS action.
- [ ] Provision one small authenticated VPS review host.
- [ ] Run Caddy with TLS and proxy only to localhost-bound Bun servers.
- [ ] Rsync `workspace-chirho/` assets and the canonical review DB explicitly;
      do not rely on git for ignored bulk assets.
- [ ] Start only `:8766` first, complete one remote reviewer smoke test, then add
      `:8770` and `:8771`.
- [ ] Prove DB commit-back with one harmless review action and a restore test.

## Phase 7 — Verification Gates Chirho

- [x] `bun run check` and `bun run build` in `app-chirho`.
- [x] Certification guard scripts still pass and gate remains red unless real
      review work legitimately reduces it.
- [x] Reviewer-attribution guard rejects forged client identity.
- [x] Review-server guard scripts pass for raw Hebrew, Latin/symbol, and expert
      review lanes.
- [x] Playwright smoke checks the launchpad and one read-only/one write-capable
      authenticated reviewer path.
- [x] `git diff --check` clean.

## Definition Of Done Chirho

- [x] A normal human reviewer can open one URL, choose their lane, review an item,
      flag or certify it, and see the next item without shell commands.
- [x] A script expert can supply text for the blank Syriac span through the
      browser, and it remains unconfirmed until separately certified.
- [x] A reviewer can propose a segment split/merge/rebox without the proposal
      silently certifying text.
- [x] Every stored review action is attributed to the authenticated server-side
      reviewer identity.
- [x] All new convenience paths are fail-closed on stale text, stale images,
      malformed packets, or geometry drift.
