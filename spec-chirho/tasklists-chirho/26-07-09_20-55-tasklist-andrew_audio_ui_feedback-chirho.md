<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Andrew 2026-07-09 Audio Feedback UI Adjustments Chirho

Source: `workspace-chirho/audio-comments-chirho/transcription-chirho-2026-07-09-14-44-17.txt`
(Andrew's first real session on the raw Hebrew review station; he got stuck on the
first item). Target: `src-chirho/pass-c-human-validate-server-chirho.ts` UI only —
stored values, wire formats, and certification gates unchanged.

## Andrew's pain points → adjustments Chirho

- [x] Add transcript entry 4 + actionables to
      `workspace-chirho/audio-comments-chirho/transcripts-chirho.md`.
- [x] Chirho suffix leaking into UI: segment-repair Kind and script dropdowns
      render raw stored values (`split-chirho`, `hebrew-chirho`, `french-chirho`).
      Add display-label maps in `segment-repair-proposals-chirho.ts`, inject into
      the client, keep stored option values untouched.
- [x] Opaque labels: rename "Live span text" → "Current text (red box)",
      "Optional suggested text" → "Your correction (optional)",
      "Line text" → "Full line text"; move codepoint readouts under a collapsed
      details block so they stop shouting at non-technical reviewers.
- [x] Scroll pain: reorder the left panel so the current-text + correction grid
      sits directly under the zoomed target crop, with the full-line context
      image after it.
- [x] "Fix the text or fix the box?" — add a short "How to review this item"
      decision guide at the top of the item panel covering the three cases
      (text wrong / box wrong / both match), including Andrew's exact case
      (box on an untranscribed word with unrelated text = box problem →
      Segmentation flag or segment repair, never retype).
- [x] "Split target row" button + repair box get one-line plain explanations.
- [x] Update `check-pass-c-human-review-server-guards-chirho.ts` pinned snippets
      in lockstep with the renamed labels.
- [x] Gates: run the pass-c server guard script + related review checks; zero
      TS/lint complaints in touched files.
- [x] Commit touched files by name; log step in progress DB; post a short
      metropoliluya note so GPT/Gemini know the raw station UI shifted.

## Follow-ups not in this pass (for L.J. / later) Chirho

- [ ] Drag-to-move/resize the red box directly on the image (Lace-style);
      today reboxing is numeric x/w fields in the repair grid.
- [ ] Screen-recorded walkthrough video for Andrew (L.J. to record; Andrew
      asked explicitly).
- [ ] Ask Andrew for the Copy-link URL of the confusing first item so the
      box/text misalignment can be inspected as data (possible bad span bbox).
- [ ] Same display-label sweep for the Latin/symbol and expert stations if
      their dropdowns leak raw values.
