<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Find a reading Chirho

Authority: L.J. directly to claude2 (2026-10-29): "continue dev on the main hottp please and a
message for the team about it". Corpus plan Phase 5 item "Jump by printed page and by biblical
reference" — this slice delivers the biblical-reference and volume:PDF-page half. Room claim
#30708; ledger row 2955 (agent claude2-fable-1029-chirho); isolated worktree
`find-reading-20261029-chirho`. Local-only landing: no station, canonical D1, prod, OCR,
certification or intake-path changes; nothing deployed.

- [x] Claim the slice in the room with exact paths; open the ledger row.
- [x] `catalog-chirho/find-chirho.ts`: WLC book vocabulary (the loader's exact stored names, with
      English abbreviations and unaccented French aliases), query normalization, parser
      (volume:page | book [chapter[:verse]]), range bounds, bounded reference search
      (segment cap 600, page cap 48, refusal over truncation), page-existence probe.
- [x] `catalog-chirho/reference-index-chirho.sql`: paired partial covering index, review-chirho
      precedent, NOT applied to production — joins the Phase-5 pre-deploy EXPLAIN gate.
- [x] `/find-chirho` route: server-rendered GET page; volume:page redirects to the loaded page or
      the volume window starting there; reference queries list matching pages with counts; help,
      unparsed, zero-match and refusal states stay on the page. Home page gets a small jump form.
- [x] Unit tests (parser, labels, range-ordering facts) and a Miniflare D1 proof (seeded fixture,
      verse/chapter/book results, same-prefix chapter isolation, both caps refusing whole, page
      existence, EXPLAIN QUERY PLAN pinned to the partial covering index for every find query).
- [x] Gates in the worktree: frozen install, svelte-check 0/0 (524 files), full reader unit
      suites (53 tests / 247 assertions), build, D1 proof green (6/6, plan-pinned; the DDL
      mutation turns exactly the plan test red). This app has no lint script; check is the gate.
      Rendered on a local wrangler worker with a fresh migrated + seeded D1 (never the protected
      copy): home form, accented French query to match list, both redirect shapes, repeated-q 400.
- [x] Land on main, push with a secret scan of the pushed range, receipt (corpus item-117
      annotation with the printed-folio evidence, workflow doc note, ledger close), completion
      message in the room. Feature 713e485; receipt follows it.

## 2026-11-03 continuation: CTAT sigla aliases Chirho

Authority: gpt handoff #31100 under L.J.'s Andrew-readiness fleet authorization (#31083);
ledger row 2964; isolated worktree branch `sigla-aliases-20261103-chirho`; local-only (no
migration, D1 writes or deploy — the hosted reader gains the sigla at its next release, so the
Andrew handout's "sigla not understood yet" line stays true for the demo).

- [x] `BOOK_ALIASES_CHIRHO` gains the 20 missing Jerusalem-Bible sigla (plus glued numbered
      variants); Esd names Ezra inside that system, freeing Ez for Ezekiel and resolving the
      earlier deliberate 'ez' omission. Query bounds, canonical names and reference coverage
      unchanged.
- [x] Tests: the printed trio "2 S 14,19 / Mi 6,10 / Pr 18,24"; the Esd/Ez disambiguation
      pair; an all-39-sigla bijection onto 39 distinct stored books. Suite now 64 tests /
      341 assertions.
- [x] Gates in the worktree: frozen install, svelte-check 0/0 (526 files), build, find D1
      proof 6/6; mutation (dropping 'ez') turns exactly the two sigla tests red, restored
      byte-identical and green.
- [x] Feature 68ae7fc ff-merged to main; receipt updates this tasklist and the workflow doc
      find section (stale "'ez' unmapped" and "not yet hosted" lines corrected there).

## Printed-folio half, deliberately not taken

Printed folio ≠ PDF page: vol 3 PDF p151 prints folio **cxxvi** (Roman-numeral front matter), so
"jump by printed page" needs a per-volume printed↔PDF mapping (arabic offset plus roman front
matter), which is derivable from the hOCR header lines the intake keeps as lines — intake-lane
data work. The find page states PDF numbering explicitly; a mapping can slot into the same
parser later without changing the route contract.
