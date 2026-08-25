<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Language Tagging Pass Chirho (Scope Only — Andrew Actionable H)

Follow-on to `26-07-18_21-57-tasklist-reviewer_ux_v2_goal-chirho.md` Phase 3 item H.
**Nothing here is built.** This file records the decision of what the pass would be,
so the reviewer-UX goal can close without either building it or losing it.

## The Ask Chirho

Andrew's actionable H: a human marks *which language* each region is, then OCR runs
constrained to that language, then a human reviews the result. Today the order is the
other way round — OCR guesses the script, and the reviewer inherits its guess.

## Why It Is Deferred, Not Dropped Chirho

- The reviewer-UX goal is about **adjusting** existing segmentation. This is about
  **producing** segmentation from a human prior. Different lane, different gates.
- It needs a per-language OCR path that does not exist yet for Greek or Syriac. The
  Hebrew CRNN reads Hebrew word crops; there is no comparable Greek reader here, so a
  tagging pass would currently feed tesseract with a language hint and little else.
- The 2026-08-19 gold-label work showed that a machine reading admitted by a weak
  oracle becomes a wrong label nobody can see. A tagging pass must not repeat that:
  a human-supplied language tag is a *constraint*, never a certification.

## Shape It Would Take Chirho

1. **Tag lane** — a reviewer sweeps a page and paints language regions on the line
   images. Storage reuses the segment-repair proposal shape (contiguous tiling,
   script per box, empty text), so the geometry invariant and the apply lane are
   already proven. The manual-first slate plus draw-a-box built on 2026-08-25 is
   exactly this UI; the gap is page-level sweep rather than item-at-a-time.
2. **Constrained OCR** — re-run recognition per box with the language fixed, not
   guessed. Hebrew boxes go to the CRNN; Latin/French to tesseract with `-l fra`;
   Greek/Syriac stay unreadable until a reader exists, and must be recorded as
   unreadable rather than filled with a guess.
3. **Review** — the produced text enters the existing review lanes. A tag never
   certifies text; only a human reading the print does.

## Preconditions Before Building Chirho

- [ ] A per-language reader exists (or is explicitly declared absent) for every
      script the tagger can assign, so no box is silently filled by the wrong engine.
- [ ] Page-level tagging UI decided: extend the raw lane, or a separate tagging
      station with its own credential.
- [ ] Decide whether a language tag alone can supersede an existing script verdict,
      or whether it only proposes one (default: proposes only, fail-closed).

## Decision Chirho

Scoped 2026-08-25, not started. Revisit after Andrew's first real session, because
his feedback on the manual-first + draw-a-box tools tells us whether page-level
tagging is the bottleneck or whether item-level adjustment already covers it.
