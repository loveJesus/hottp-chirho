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
- [x] Gates in the worktree: frozen install, svelte-check 0/0, lint, full reader unit suites,
      build, D1 proof green.
- [ ] Land on main, push with a secret scan of the pushed range, receipt (corpus item-117
      annotation with the printed-folio evidence, workflow doc note, ledger close), completion
      message in the room.

## Printed-folio half, deliberately not taken

Printed folio ≠ PDF page: vol 3 PDF p151 prints folio **cxxvi** (Roman-numeral front matter), so
"jump by printed page" needs a per-volume printed↔PDF mapping (arabic offset plus roman front
matter), which is derivable from the hOCR header lines the intake keeps as lines — intake-lane
data work. The find page states PDF numbering explicitly; a mapping can slot into the same
parser later without changing the route contract.
