<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Source-font machine drafts Chirho

```mermaid
flowchart TD
  SourceChirho[Original volume-5 PDF and frozen image/payload hashes] --> GlyphsChirho[Read embedded glyph codes, positions and ink bounds]
  GlyphsChirho --> MapChirho[Source-outline mappings; retain uncertainty]
  MapChirho --> MatchChirho[Match the complete segment in native 300-DPI geometry]
  MatchChirho -->|unknown, mixed, clipped or incomplete| HoldChirho[Keep raw PDF text; no write]
  MatchChirho -->|complete and resolved| PrepareChirho[Freeze page, line and segment source rows privately]
  PrepareChirho --> GuardChirho{Exact source match, pending and unreviewed?}
  GuardChirho -->|no| StopChirho[Stop; retain manifest and reconcile]
  GuardChirho -->|yes| BatchChirho[Atomic page batch: OCR draft update, affected-row assertion, machine audit]
  BatchChirho -->|failure| RollbackChirho[Roll back text and audit together]
  BatchChirho --> ReadbackChirho[Verify every field against the expected projection and exact audit]
  ReadbackChirho --> ReaderChirho[Existing reader shows Unicode as unconfirmed machine text]
  ReaderChirho --> ReviewChirho[Compare the print; only explicit source-matched confirmation records human review]
  ReaderChirho --> StaleChirho[Old raw-code tabs receive 409; local drafts survive and stay held]
```

## Boundary

This lane uses `segments_chirho.ocr_text_chirho`, never the raw `pdftotext_chirho`, accepted text, status, canonical fields or page/line geometry. Only volume 5's 1,004 native-coordinate reader pages are in scope. The five earlier reviewed pages 148–152 are excluded. The original 21 pilot page rows remain intact; their newly appended pending reader segments may receive drafts.

All source rows come from the frozen full-corpus/legacy projections and are compared with production before preparing a manifest. A page with events, words, snippets, snapshots, approved lines, accepted readings, existing OCR or review state is refused. A full target-row and parent-line comparison runs inside the same D1 transaction as the update; a changed page/image key is also refused. An ignored UPDATE or failed audit INSERT raises an SQL error and rolls back the whole page. Work is bounded to eight disjoint pages at a time; all in-flight requests settle before a failure stops the next window.

The machine event is `page-machine-font-decoded-chirho`, actor `font-decoder-chirho`, aggregate `page-chirho`, with no word/scanline id. Its payload records the decoder version, manifest, PDF, image, original payload and target hashes, and `approved_chirho=false`. It is not a confirmation receipt. Event sync ignores its word projection because it has no word id; it is not copied into the training/certification progress database.

## Mapping evidence and limits

`vol5_fonts_chirho/` reads the embedded NewJerusalemU and SymbolGreekU outlines. Hebrew rules retain prior behavior, with glyph coverage added across operator boundaries. Greek reads left-to-right; literal spaces, accents and iota subscripts are preserved for resolved glyphs. Compare Greek identities with the [Unicode Greek Extended chart](https://www.unicode.org/charts/PDF/U1F00.pdf), but use the embedded print outlines as the source witness.

The enlarged Greek comparison disproved several initial readings. Only 68 visually resolved main codes are eligible; all breathing-bearing main glyphs remain held, including any plausible proposed identity in the diagnostic table. The companion's Latin/punctuation outlines were also inspected. Unknown codes and standalone unattached accents cannot become eligible through a familiar biblical spelling. Syriac is unsupported in this release. French ligatures and mixed-font segments remain separate work. Unicode output remains a machine draft, not a claim of exact vocalization or print certification.

Pixel checks use pinned full-page scans, with padded lines from PDF pp. 51, 54, 56, 65, 200, 500 and 900. Greek examples include `γεννᾶται` (56:26) and `περινοῆσαι` (500:7); Hebrew checks include the two Job 5:7 phrases on 56:15. WLC agreement is not used to certify these readings. As a separate completeness check, the source-code character multiset must equal the stored raw segment, ignoring only whitespace/bidi controls and NFC representation. This includes invisible spacers. The driver checks every main font's actual ToUnicode range against its source encoding: Hebrew's range is ASCII identity, whereas Greek's upper bytes map to MacRoman characters, not byte-identical Unicode. The companion resources explicitly use MacRoman. This is a scope check, not a substitute for the print witness or a claim of correct word order.

## Execution and recovery

1. `publish-chirho/font-chirho/source-chirho.ts` freezes the 1,004 source projections. `segment_drafts_chirho.py` produces a page-bounded dry run. `prepare-chirho.ts` reads hosted rows without mutation and freezes a private manifest.
2. Run decoder tests, reader/intake tests, strict TypeScript, Svelte diagnostics, the real-D1 disposable transaction proof and the copied-database browser proof. The browser test's only successful confirmations target the local fixture; hosted verification never clicks Confirm.
3. Commit and scan the exact source range before `apply-chirho.ts apply-chirho`. No Worker code, schema, R2 object, credential, model, station packet or certification witness needs changing.
4. A retry must match both the complete expected OCR projection and its exact machine audit. A source conflict, unaudited existing draft or partial result is a stop, never permission to overwrite. `verify-chirho` writes no rows.
5. Preserve the private pre-state and hashes. A future rollback may clear only this release's exact OCR values while the raw/accepted/status/source still match and no intervening review exists. Do not restore a whole database or replay a fixture into production. Retire these cold manifests only after their audit retention decision; they are not build cache.

Private evidence lives under `workspace-chirho/corpus-intake-chirho/font-decode-chirho/`. Public code/receipt contains hashes and counts, not credentials or local test-store contents. The release receipt records actual publication and hosted evidence separately from the dry-run counts.
