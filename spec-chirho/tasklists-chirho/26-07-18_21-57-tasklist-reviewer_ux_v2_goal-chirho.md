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

- [ ] Drag to move and drag-handles to resize the red box on the zoomed crop,
      Lace-style, with live px readout synced to the numeric repair fields.
- [ ] A drag edit creates or updates a draft rebox/split segment-repair
      proposal — it never silently mutates stored spans.
- [ ] Client-side geometry preview enforces the same invariants the server
      enforces on save: contiguous tiling, positive widths, full line coverage.
- [ ] Works acceptably with trackpad and touch (Andrew reviews on a laptop).

## Phase 3 — Manual Segmentation Tools Chirho (E, F, G, I; H scoped later)

- [ ] Draw-a-box on the scan: drag a rectangle, pick a script, type the
      transcription; stored as a manual segment proposal that augments or
      overrides OCR output (E).
- [ ] Merge / split / delete existing auto-segments, including selecting
      multiple chips to merge into one phrase (F).
- [ ] Manual-first mode for the toughest (handwritten) pages: reviewer tags
      everything themselves without fighting auto-detection (G).
- [ ] Per-language reviewer filter: a volunteer can sweep "only Hebrew items" /
      "only Greek items" across a volume (I).
- [ ] Scope the language-tagging-pass workflow (human tags → language-
      constrained OCR → review) as its own follow-on plan; record the decision
      here rather than building it in this goal (H).

## Phase 4 — Repair Proposal Apply Lane Chirho

Today `segment-repair-proposals-chirho.ts` stores drafts only; nothing can land
an approved repair. Close that gap.

- [ ] Approval queue UI: list draft proposals with target crop, full line,
      old spans, proposed spans, and exact geometry side by side.
- [ ] Approve / reject with server-authoritative attribution; approval never
      certifies text by itself.
- [ ] Apply path: an approved proposal rewrites the live spans atomically with
      a backup written first and a documented reverse path.
- [ ] Applying correctly invalidates or preserves existing validations for the
      touched line (stale-hash rules decide; nothing silently stays certified
      against changed geometry).
- [ ] Apply refuses stale line-image hash, stale text, or non-contiguous
      tiling; certification gate output changes only through legitimate review
      state transitions.

## Phase 5 — Swallowed-Hebrew Data Sweep Chirho (Q)

- [ ] Fix vol 3 p151 L36 S2 through the repair lane: red box sits on printed
      טפח while the stored span text is גבול; the printed גבול was swallowed by
      the French segment (stored line text garbles it as "pour 13,").
- [x] Build the sweep: flag French/Latin segments whose stored text contains
      garbled digit-runs / mojibake where the print likely shows Hebrew
      (cross-check with CRNN witness reads on the corresponding crop x-ranges).
      (scan-swallowed-hebrew + witness_swallowed_hebrew, 2d6c43e/eef08bd/995fde6)
- [x] Triage every flagged item into a draft repair proposal (or clear it with
      a recorded reason). (77628c2 + eye-check pass: 25 drafted / 57 cleared of
      82 findings; suspect tier 7 eye-cleared, 5:69:7:8 awaits a second reader,
      5:150:10:3 routed to the expert print check)
- [ ] Land the fixes through the Phase 4 apply lane; re-run certification
      status and confirm any count movement is legitimate review work.

## Phase 6 — Rollout To Andrew Chirho (P)

- [ ] L.J. records the screen-capture walkthrough video Andrew asked for: a
      couple of clean reviews, one correction, one segmentation flag, one
      repair proposal (P — L.J.'s action).
- [ ] Onboarding note with the live URL and credential handoff outside git
      (no secrets in the repo or the broker).
- [ ] Handout gains the "hit Copy link whenever an item confuses you" feedback
      loop so confusing items arrive as permalinks.
- [ ] Capture Andrew's first real-session feedback into
      `transcripts-chirho.md` actionables and fold deltas into this plan.

## Phase 7 — Verification Gates Chirho

- [ ] Review-server guard scripts pass for raw Hebrew, Latin/symbol, and
      expert lanes after every UI change (snippets updated in lockstep).
- [ ] Certification guards and strict status stay red unless legitimately
      reduced; reviewer-attribution guard still rejects forged identity.
- [ ] Playwright smoke per changed station: launchpad, one read-only path, one
      write-capable path, and zero visible "-chirho" in reviewer-facing text.
- [ ] `bun run check` and `bun run build` in `app-chirho`; `git diff --check`
      clean; typecheck-certification clean.
- [ ] Redeploy changed stations to the VPS via the leased sync-out ritual
      (stopped writers, decision + lease cited) and pass one remote smoke per
      changed station.

## Definition Of Done Chirho

- [ ] Andrew reviews side by side — the word he is typing about stays magnified
      next to the input, with no scrolling between crop and correction.
- [ ] Andrew fixes a wrong box by dragging it, and that files a draft repair —
      stored spans never change without an approval step.
- [ ] An approved repair proposal can actually land, with backup and a proven
      reverse path.
- [ ] The 3:151:36:2 defect is fixed in the data and the sweep has triaged its
      sibling class to zero open unexplained flags.
- [ ] Every stored action remains server-attributed; every convenience path
      stays fail-closed; no internal suffixes leak into reviewer-facing text.
- [ ] The walkthrough video is delivered to Andrew.
