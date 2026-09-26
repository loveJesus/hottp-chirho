<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Reviewer UX V2 Goal Plan Chirho (Lace Parity + Data Quality)

Successor to `26-06-24_20-25-tasklist-human_reviewer_tooling_goal-chirho.md`
(completed 2026-07-18: raw Hebrew station live at https://raw-review.bible.systems/
behind Caddy auth, Phase 6 smoke + commit-back proven). Requirements source:
Andrew's voice-note actionables A–Q in
`workspace-chirho/audio-comments-chirho/transcripts-chirho.md` (gitignored,
rsync-carried) — letters cited below refer to that file.

## Goal Objective Chirho

Make the live review stations fast and self-evident for a non-technical
reviewer: scan and correction sit side by side with magnify-on-focus, the red
box can be fixed by direct manipulation, wrong segmentations can be repaired
end-to-end (draft proposal → approval → applied data), and the known
swallowed-Hebrew defect class is swept and fixed — all without weakening any
fail-closed certification gate.

## Non-Goals Chirho

- Do not mark the corpus complete.
- Do not move the review servers to Cloudflare Workers.
- Do not let UI convenience bypass or weaken the fail-closed certification gates.
- Do not require normal reviewers to run shell commands.
- Do not auto-apply repair proposals; an explicit approval step always sits
  between a draft and a data change.
- Do not pin plastic UI copy in tests beyond the deliberately maintained guard
  snippets.

## Phase 1 — Lace Parity Review Surface Chirho (A, B, C, D)

- [x] Side-by-side layout: scan/line image on the left, review-and-correction
      column on the right, line-aligned; replace the vertical scroll layout (A).
- [x] Magnify-on-focus: focusing the correction (or any per-segment input)
      magnifies the matching word crop in place — no popups or modals (B).
- [x] Keyboard flow: Tab advances to the next item needing review; saving from
      the keyboard works without mouse travel (D).
- [x] Confidence coloring over the full reconstructed line text: green =
      certain, yellow = atypical/borderline, red-pink = questionable or no
      canonical match — surrounding French visibly checked too, not only
      segment chips (C).
- [x] Keep the 4-case "How to review this item" guide adjacent to the new
      layout without re-crowding the first screen.
- [x] Update guard snippets in lockstep with any copy/layout change; never
      reduce the safety-bearing pins (clean-certification semantics, red-box
      meaning, boundary note).

## Phase 2 — Direct Box Manipulation Chirho (O)

- [x] Drag to move and drag-handles to resize the red box on the zoomed crop,
      Lace-style, with live px readout synced to the numeric repair fields.
- [x] A drag edit creates or updates a draft rebox/split segment-repair
      proposal — it never silently mutates stored spans.
- [x] Client-side geometry preview enforces the same invariants the server
      enforces on save: contiguous tiling, positive widths, full line coverage.
- [ ] Works acceptably with trackpad and touch during Andrew's first real
      laptop session; synthetic pointer drag/resize is verified, but real
      trackpad/touch ergonomics still need human-session confirmation.

## Phase 3 — Manual Segmentation Tools Chirho (E, F, G, I; H scoped later) — COMPLETE

- [x] Draw-a-box on the scan: drag a rectangle, pick a script, type the
      transcription; stored as a manual segment proposal that augments or
      overrides OCR output (E). (2026-08-25. Geometry lives in the new
      typechecked `src-chirho/segment-tiling-edit-chirho.ts`, shared VERBATIM
      with the page - the server transpiles its marked block into the inline
      script, and `check-segment-tiling-edit-chirho.ts` evaluates that exact
      copy and diffs it against the module, so the two cannot drift. A drawn
      box is never a floating rectangle: it carves the dragged x-range out of
      the existing coverage, whole boxes it swallows hand over their text, a
      clipped box keeps its text on the surviving stub. Real-mouse smokes on
      3:151:36:2: aimed 1040..1140 -> x1040 w100, pointer-down started ON the
      red box and the draw still won over the rebox drag; kind auto-set to
      "split-chirho", focus jumped to the new row's text field, save stayed
      gated on a reason. No proposal saved.)
- [x] Merge / split / delete existing auto-segments, including selecting
      multiple chips to merge into one phrase (F). (Split + per-row delete
      already existed; 2026-08-22 added a select-checkbox column and
      "Merge selected boxes" to the repair grid — merges adjacent boxes,
      keeps the first non-French script, joins the texts, auto-sets Kind to
      merge-chirho. Browser-verified on Andrew's own item 3:151:36:2: 4 boxes
      -> 3, merged x=1105 w=183 script hebrew, "Geometry OK: contiguous
      positive-width tiling covers 0..1288", save still gated on a reason.)
- [x] Manual-first mode for the toughest (handwritten) pages: reviewer tags
      everything themselves without fighting auto-detection (G). (2026-08-25.
      Two buttons collapse the line to a single box - "keep text" joins every
      reading as a crib, "blank text" starts empty - and the reviewer then
      draws their own boxes. No modal: both are one click, draft-only, and
      reloading the item restores the automatic boxes (verified: 1 row after,
      4 rows on reload). Smoke drew a hand box at 1100..1180 from a blank
      slate; tiling stayed exact.)
- [x] Per-language reviewer filter: a volunteer can sweep "only Hebrew items" /
      "only Greek items" across a volume (I). (2026-08-25. "Language" toolbar
      select + `?script-chirho=` permalink + a counted lane shortcut per
      script. Options are generated from the scripts the loaded queue actually
      contains, so no dead option is ever offered, and labels are plain
      language - the raw Hebrew queue correctly shows only "Hebrew". Composes
      with the volume filter, and a permalink to an item of another script
      clears the filter rather than showing an empty queue.)
- [x] Scope the language-tagging-pass workflow (human tags → language-
      constrained OCR → review) as its own follow-on plan; record the decision
      here rather than building it in this goal (H). (2026-08-25, scoped and
      NOT started: `26-08-25_18-45-tasklist-language_tagging_pass_scope-chirho.md`.
      Decision: deferred because no per-language reader exists for Greek or
      Syriac, so a tagging pass would today hand those boxes to an engine that
      cannot read them - the same weak-oracle trap the gold-label audit found.
      Revisit after Andrew's first real session.)

### Defect found and fixed while building Phase 3 Chirho

- [x] Crop/line pixel units were mixed in the reviewer surface. Zoom-crop
      geometry is IMAGE pixels; span geometry is LINE pixels. Vol-5 line images
      are stored at ~0.667x, so `updateTargetMarkerFromRepairRowsChirho` put the
      red box at **left 153.42%** on item 5:148:25:5 - off the crop, invisible -
      and `lineXFromPointerChirho` mapped a pointer to the wrong line-x, so a
      Phase-2 rebox drag would have written wrong geometry into a draft. This
      was already SHIPPED (Phase 2 ticked, station live). 39 of the 100 items in
      the raw queue are affected, all vol-5. Fixed with
      `cropFractionToLineXChirho` / `lineXToCropFractionChirho` in the shared
      module; the marker now renders at 53.55% against the server's own 52.03%
      (the residual is the word-box padding), unscaled lines are byte-unchanged,
      and a draw on the scaled line aimed at 1600..1750 produced exactly
      x1600 w150 in line pixels. Screenshot-verified: the red box sits on
      מְלִיצַי רֵעָי. The guard states the defect as a test (marker left must be
      within 0..100%). Blast radius on stored data: none - the only vol-5 draft
      of the 26 parked (5:69:7:8) came from the machine sweep, not a browser
      drag, so no parked proposal carries wrong geometry.
- [x] `src-chirho/segment-repair-store-lock-chirho.ts` was missing from the raw
      review server's source-fingerprint list, so edits to the store lock did
      not mark that server stale. Pre-existing; confirmed against HEAD with the
      fix stashed, then closed.

## Phase 4 — Repair Proposal Apply Lane Chirho

Today `segment-repair-proposals-chirho.ts` stores drafts only; nothing can land
an approved repair. Close that gap.

- [x] Approval queue UI: list draft proposals with target crop, full line,
      old spans, proposed spans, and exact geometry side by side.
      (segment-repair-approval-server-chirho.ts, station on :8772; all 26
      parked drafts render apply-ready against the live tree, Playwright-eyed)
- [x] Approve / reject with server-authoritative attribution; approval never
      certifies text by itself. (trusted-header identity + certifying human
      guard; machine drafter allowed, machine approver 400-refused; decision
      recorded on the proposal, no data change — guard-proven)
- [x] Apply path: an approved proposal rewrites the live spans atomically with
      a backup written first and a documented reverse path.
      (segment-repair-apply-chirho.ts backup-first + manifest;
      revert-segment-repair-chirho.ts restores byte-exact — guard-proven,
      incl. the real store lock replacing the announce-window protocol)
- [x] Applying correctly invalidates or preserves existing validations for the
      touched line (stale-hash rules decide; nothing silently stays certified
      against changed geometry). (rule: a current row survives iff its segment
      is identical before/after at the same index; everything else gets a
      non-certifying tombstone superseding the segment's current rows —
      split/index-shift cases guard-proven)
- [x] Apply refuses stale line-image hash, stale text, or non-contiguous
      tiling; certification gate output changes only through legitimate review
      state transitions. (segmentRepairLiveStateChirho shared by UI readiness
      and the apply gate; tamper + corrupted-tiling refusals guard-proven;
      check-segment-repair-approval-server-guards-chirho.ts runs inside
      check-certification-chirho)

## Phase 5 — Swallowed-Hebrew Data Sweep Chirho (Q)

- [ ] Fix vol 3 p151 L36 S2 through the repair lane: red box sits on printed
      טפח while the stored span text is גבול; the printed גבול was swallowed by
      the French segment (stored line text garbles it as "pour 13,").
      (UNBLOCKED: the draft renders apply-ready on the :8772 approval station;
      needs a human approve + apply — machines cannot approve by design)
- [x] Build the sweep: flag French/Latin segments whose stored text contains
      garbled digit-runs / mojibake where the print likely shows Hebrew
      (cross-check with CRNN witness reads on the corresponding crop x-ranges).
      (scan-swallowed-hebrew + witness_swallowed_hebrew, 2d6c43e/eef08bd/995fde6)
- [x] Triage every flagged item into a draft repair proposal (or clear it with
      a recorded reason). (77628c2 + eye-check pass: 25 drafted / 57 cleared of
      82 findings; suspect tier 7 eye-cleared, 5:69:7:8 drafted after the
      two-agent מָדַד confirmation, 5:150:10:3 routed to the expert print check)
- [ ] Land the fixes through the Phase 4 apply lane; re-run certification
      status and confirm any count movement is legitimate review work.
      (UNBLOCKED: all 26 drafts verified apply-ready 2026-08-13; awaiting
      L.J.'s approve/apply decisions on the station)

## Phase 6 — Rollout To Andrew Chirho (P)

- [ ] L.J. records the screen-capture walkthrough video Andrew asked for: a
      couple of clean reviews, one correction, one segmentation flag, one
      repair proposal (P — L.J.'s action).
- [ ] Onboarding note with the live URL and credential handoff outside git
      (no secrets in the repo or the broker).
- [x] Handout gains the "hit Copy link whenever an item confuses you" feedback
      loop so confusing items arrive as permalinks. (2026-08-25. Reworded so
      the reviewer is told to copy the link and move on with Skip WITHOUT
      having to explain the item. Same pass added a "When The Box Itself Is
      Wrong" section covering drag, split, merge, draw-a-box, manual-first and
      the Geometry gate in plain language, plus the Language filter - the
      handout previously told reviewers to retype text "only if the tool
      clearly supports that repair", which is now stale and was corrected.)
- [ ] Capture Andrew's first real-session feedback into
      `transcripts-chirho.md` actionables and fold deltas into this plan.

## Phase 7 — Verification Gates Chirho

- [x] The certification bundle's liveness gate checks the stations where they
      actually live. It probed localhost while the VPS owned the fleet, so it
      exited 1 on every run for a legitimate operational reason, which trains
      everyone to ignore a red bundle and hides real regressions.
      (2026-08-28. `human-review-canonical-stations-chirho.json` records the
      standing location; `review-servers-chirho --check-chirho` probes the
      deployed stations over HTTPS with the .env basic-auth credentials and
      asserts the same things as locally - 200, no-store, key match, source
      fingerprint equal to current local source. Both branches exercised.)
- [x] `review-servers-chirho` refuses to start local writers while a deployed
      fleet is the recorded canonical writer, with
      `--local-writer-anyway-chirho` as the deliberate override. The
      single-writer rule was documented but not enforced. (2026-08-28)
- [x] The approval station is covered by the review-server source-coverage
      guard; `segment-repair-approval-chirho` was missing from its key list, so
      that station's fingerprint list was never checked against its imports.
      (2026-08-28, passes with the key added)
- [x] The guard scripts are themselves typechecked.
      `check-bun-version-chirho`, `check-segment-tiling-edit-chirho` and the new
      `check-canonical-review-stations-chirho` were outside
      `tsconfig-certification-chirho.json`. (2026-08-28)

### Defect found by the fixed liveness gate Chirho

The first honest run of the gate found two of the four live stations broken:
`latin-review` and `expert-review` answer HTTP 500 on
`/api-chirho/state-chirho` with "packet is stale: packet has 567 item(s), live
state has 559" and "645 / 644".

Root cause, proven rather than inferred: the sync excludes `.wrangler/`, and the
host has no `app-chirho/.wrangler` directory at all, so the local D1 audit
database never travelled. Those two stations derive part of their queue from it.
Locally the Latin queue is 559 explicit-span + 8 D1-derived = 567, matching the
packet; on the host the 8 D1-derived items are absent, giving 559. The expert
queue loses its single D1-derived item, 645 to 644. The span corpus is identical
on both sides at 1789 files, so the D1 database is the whole difference.

Why it went unnoticed: `/` returns 200 because the HTML shell renders; only the
data call fails. The only recorded VPS smoke evidence is
`human-review-vps-smoke-evidence-2026-07-18-cx33-raw-hebrew-chirho.json`, which
covers the raw Hebrew station alone, and the D1-derived items predate the first
2026-07-02 deploy. There is no evidence these two stations ever worked on the
VPS.

- [x] Fix the sync rules so the D1 audit database travels, keeping the rest of
      `.wrangler/` excluded, and refuse to ship a D1 database whose commits are
      still in a WAL or rollback journal. (2026-08-28. Itemized dry run against
      the host: exactly one new file, the D1 `.sqlite`, plus its five parent
      directories; zero deletions; no `-wal`/`-shm` carried. The guard was
      mutation-tested - removing the include turns it red.)
- [x] Make the shipped audit database readable. (2026-09-25. The sync fix
      above was incomplete: it proved the file transfers, not that a station
      can read it. The file is WAL-mode, and its -wal/-shm sidecars have been
      gone since Miniflare's 2026-09-19 00:18 shutdown checkpoint. A read-only
      SQLite connection may not create them, so all six read-only opens across
      five files failed with "unable to open database file". Locally that
      broke check-certification-status-gate-guards, and on the host it would
      have left Latin/symbol and expert down after the redeploy, with a
      different error. Five private copies of the locator collapsed into one
      shared latestLocalD1PathChirho plus openLocalD1ReadonlyChirho in
      d1-audit-fingerprint-chirho.ts. The opener uses an immutable open only
      when no sidecar exists, and normal WAL locking otherwise. The regression
      test in check-canonical-review-stations-chirho closes a fixture into
      exactly that state, and is mutation-tested: a plain read-only open fails
      it with two named failures. All 51 Markdown outputs stayed byte-identical,
      the D1 audit fingerprint is unchanged at 2584f948, the witness file was
      never modified, and the status generator reproduces the same counts.)
- [x] Redeploy so the two broken stations serve again, then confirm the
      liveness gate goes green. (2026-09-26, L.J. "3 ok", lease
      2026-09-26-cx33. Three applies, each preceded by a host inspection that
      found nothing to lose, all four stations stopped, and an itemized dry
      run. The first run's 38,395 deletions were all the deleted kraken venv.
      The applies were 595d8ee+ca1938f (carrying GPT's row-2914 raw workspace,
      81c1168), 013fd55 and c79803c. Each apply exposed the next hidden layer
      behind the one before, and each was fixed with a controlled
      before/after proof on the host:
      1. Bun on Linux bundles SQLite 3.53.2 without default URI support, so
         the immutable open needed an explicit SQLITE_OPEN_URI (013fd55).
      2. The packet manifests store the workstation's absolute paths, so the
         Latin/symbol and expert stations could never have worked on the host.
         Fixed with a host alias (/Users/hallelujah/.../hottp-chirho ->
         /srv/hottp-review-chirho/current), a realpath-aware containment check
         (host drifts 1134/645 -> 0/0), and a sync-out guard that refuses a
         host without the alias (e2f0f37).
      3. The live-links check pinned the raw page's old title; it now
         identifies each page by the station's own source fingerprint.
      Verified:
      - the liveness gate shows all four stations ok at current source (raw
        f822afc96506, latin b97d30ae1609, expert f44e0a4fd13a, approval
        aa5847524d5e);
      - the Latin state API serves 567 items and expert serves 645;
      - the live-links check passed on 57 JSON, 105 Markdown and 531
        repeat-cluster URLs;
      - a tunnel browser smoke showed Latin "item 1 of 563", expert "item 1
        of 645" and the new raw UI "item 1 of 90", with every image loaded and
        zero console errors;
      - the host opener read a sidecar-less WAL fixture and the witness
        (2584f948, 46/11938/67) without creating sidecars;
      - the 12 raw validations are intact.
      Screenshots are in
      workspace-chirho/reviewer-ui-chirho/26-09-26-station-redeploy-chirho/.)
- [ ] Store packet image paths project-relative instead of workstation-absolute,
      so the host alias can retire. OWNER DECISION: the expert lane's stored
      certification records hold the absolute path strings and the status
      generator compares them, so this migrates certification data.


- [x] Review-server guard scripts pass for raw Hebrew, Latin/symbol, and
      expert lanes after every UI change (snippets updated in lockstep).
      (2026-08-25: raw Hebrew, Latin/symbol, expert, repair-approval, health
      source coverage, VPS deployment templates and the new segment tiling
      guard all pass.)
- [x] Certification guards and strict status stay red unless legitimately
      reduced; reviewer-attribution guard still rejects forged identity.
      (2026-08-25: check-reviewer-attribution, check-certification-strict-status
      and check-certification-status-gate-guards all pass; status regenerated
      complete=false strictMode=false strictExport=false rawHebrew=90
      visionTier=645 - unchanged by this work, which saved no validation.)
- [x] Playwright smoke per changed station: launchpad, one read-only path, one
      write-capable path, and zero visible "-chirho" in reviewer-facing text.
      (2026-08-25. Raw station write-capable path shows the repair panel, draw
      tool, manual-first and Language filter; read-only saved-issues path
      correctly hides the repair panel and draw tool. A text-node + attribute
      walk found ZERO leaks on both. The launchpad DID leak one - its footer
      read "generated from status-chirho.json" - reworded to "generated from
      the certification status file", keeping every safety claim; re-scanned
      clean. Language filter verified live: 90 of 100 items, permalink kept,
      shortcut reads "Only Hebrew (90)".)
- [x] `bun run check` and `bun run build` in `app-chirho`; `git diff --check`
      clean; typecheck-certification clean. (2026-08-25: svelte-check 615
      files, 0 errors, 0 warnings; build succeeded with the Cloudflare adapter;
      git diff --check clean; typecheck-certification clean.
      check-certification-chirho passes every step EXCEPT its final local
      station liveness probe, which needs ports 8766/8770/8771 up - they are
      intentionally closed while the VPS is the canonical writer.)
- [x] Redeploy changed stations to the VPS via the leased sync-out ritual
      (stopped writers, decision + lease cited) and pass one remote smoke per
      changed station. (2026-08-25 on L.J.'s "yes redeploy". Fresh lease
      human-review-vps-write-lease-2026-08-25-cx33-chirho.json + the July
      decision cited. Pre-sync the remote was inspected and had NOTHING to
      lose: 12 validation rows, latest 2026-06-04, WAL already 0 bytes, and a
      table-by-table comparison showed local >= remote on all 20 tables with no
      remote-only table. All four write-capable services stopped - including
      the repair-approval station, which this pass first ADDED to the sync
      guard's writer list. Itemised dry run: 82 changes, ZERO deletions.
      Post-sync: services all active, data intact at 12 rows, and the tiling
      guard re-run ON the deployed tree passed under the VPS's Bun 1.3.14
      (local is 1.2.14 - a real transpile risk, retired by running it there).
      Smokes: unauth 401 on all four hosts; review credential 200 on
      raw/latin/expert and 401 on repair-approval; approval credential 200;
      unauth POST 401 on both submit and decide; direct ports 8766/8770/8771/
      8772 blocked from the public internet while all four answer 200 on
      loopback; ImageMagick crop path serves valid PNGs (520x54 span,
      1174x83 line). Browser smoke through an SSH tunnel to the origin (no
      credential exposed): served fingerprint da197063bbcd EQUALS local, all
      five shared tiling functions live in the page, every Phase 3 control
      present, zero page errors, and the vol-5 defect item 5:148:25:5 now
      renders its red box at 53.55% - on the crop, screenshot-verified sitting
      on מְלִיצַי רֵעָי - where the previously deployed code put it at 153.42%.
      Drew a box on the live station: aimed 1620..1700, got x1620 w80,
      geometry OK. No proposal saved, no validation row written.)
- [x] Toolchain pinned so the two sides cannot silently diverge again.
      (2026-08-25. The version gap found during the redeploy - local 1.2.14 vs
      host 1.3.14 - mattered because the page ships a TRANSPILED copy of the
      shared tiling block, so a host on a different Bun could show a reviewer
      code that was never tested. Both sides moved to Bun 1.4.0 on L.J.'s
      call. The transpiled block is byte-identical across 1.2.14 / 1.3.14 /
      1.4.0 at 6554 bytes, and its sha256 built ON the host equals the local
      one (35939e0e5149...), so the risk never materialised - but nothing
      guaranteed it. .bun-version now holds the exact version and
      check-bun-version-chirho enforces it locally and, via --host-chirho, on
      the review host; it runs inside check-certification AND inside the
      sync-out apply sequence, so a deploy onto a mismatched host fails closed.
      The guard was proven to fire, refusing the host while it was still on
      1.3.14. Re-smoked live after the upgrade: zero page errors, all Phase 3
      controls present, vol-5 red box on the crop at 53.55%, draw 1620..1700
      -> x1620 w80, manual-first collapsed to 1 row, ImageMagick still serving
      valid PNGs. Caveat: 1.4.0 was 5 days old at adoption, so a 1.4.x patch
      is worth watching for.)
      History of the completed 2026-08-13 round:
- [x] (2026-08-13) Redeployed changed stations to the VPS via the leased sync-out ritual
      (stopped writers, decision + lease cited) and pass one remote smoke per
      changed station. (2026-08-13: fresh lease
      human-review-vps-write-lease-2026-08-13-cx33-chirho.json + July decision
      cited; remote services stopped + both WALs truncated + local ports
      verified before rsync; all four stations restarted 21:12Z on the synced
      tree incl. the NEW repair-approval station at
      https://repair-approval.bible.systems behind its own L.J.-only
      credential (shared review login cannot reach it); smokes: unauth 401 /
      wrong-password 401 / authed 200 with all 26 draft cards / unauth POST
      401 on repair-approval, unauth 401 on raw/latin/expert, all four origin
      health keys current)

## Definition Of Done Chirho

- [ ] Andrew reviews side by side — the word he is typing about stays magnified
      next to the input, with no scrolling between crop and correction.
- [ ] Andrew fixes a wrong box by dragging it, and that files a draft repair —
      stored spans never change without an approval step; synthetic pointer
      smoke is complete, real laptop ergonomics remain part of Andrew rollout.
- [ ] An approved repair proposal can actually land, with backup and a proven
      reverse path.
- [ ] The 3:151:36:2 defect is fixed in the data and the sweep has triaged its
      sibling class to zero open unexplained flags.
- [ ] Every stored action remains server-attributed; every convenience path
      stays fail-closed; no internal suffixes leak into reviewer-facing text.
- [ ] The walkthrough video is delivered to Andrew.
