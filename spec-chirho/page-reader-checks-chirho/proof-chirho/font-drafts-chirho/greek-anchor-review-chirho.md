<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Greek source-font witnesses Chirho

Independent reader: HOTTP_CHIRHO/claude2_chirho, broker #30873 (2026-10-30 19:52 EDT) and #30875 (19:54 EDT). The reader inspected only the source glyph-sheet PNG, enlarged each cell 5x and checked its red code label. They did not consult the proposed Greek table or a familiar biblical word. No ledger, intake or production writes were made by that reviewer.

| Source code | Independent identity | Confidence |
| --- | --- | --- |
| 21 | ἑ, epsilon + rough | high |
| 27 | ἐ, epsilon + smooth | high |
| 3B | ἀ, alpha + smooth | high |
| 73 | ἄ, alpha + smooth + acute | medium-high |
| 3C | ἶ, iota + smooth + circumflex | high |
| 96 | ἷ, iota + rough + circumflex | high |
| 71 | Ὁ, capital omicron + rough | high |
| A2 | Ἀ, capital alpha + smooth | high |

The review's limitation is explicit: it witnesses the raster shapes and trusts the sheet's code labels. The implementation independently reads the actual embedded font cmap, then matches repeated contours by full SHA-256 of translation/cyclic-start-normalized quadratic control points and on-curve flags. A letter's outer contour and holes must all share one translation; independently moving a hole is refused. Reflection, scaling and fuzzy similarity are not accepted. The smaller circumflex breathings and capital variants have their own witnessed signatures; they are not inferred from a near hash. A one-point mutation or an unknown/incomplete accent component must fail.

All 141 main codes can be reconstructed from source components. Base anchors cover the previously resolved letters; an alternate alpha body comes from the already-read `ὰ` glyph after removing its known grave component. Capital eta/omega bodies are read directly from their source outlines, with their witnessed capital breathing removed. Diaeresis requires both source dot contours, not one; iota subscript is distinct from a breathing. The [Unicode Greek Extended chart](https://www.unicode.org/charts/PDF/U1F00.pdf) supplies character identities, not the source reading.

Earlier held proposals contained real mistakes: 21/27 were swapped, several acute-only glyphs were mistaken for a breathing combination, and some iota subscripts were invented or missed. Those proposals were never published; the first release published only its 68 resolved codes. The new table must preserve those 68 readings, and the incremental publisher cannot overwrite an existing OCR field. New Unicode is still unapproved machine draft text, never a human confirmation or a certification label.

Private source outlines, fingerprints and re-rendered comparisons live under `workspace-chirho/corpus-intake-chirho/greek-completion-chirho/`. No embedded font program or vector-font dataset is distributed in this repository.
