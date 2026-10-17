<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Full corpus intake Chirho

Direction, L.J. 2026-10-16: "continue dev so we can fully work on the whole hottp thing", then "how much would it cost to host it all on cloudflare, and protect it with some kind of password i don't want a bot spamming our app".

Today the reader holds 46 of the 5,335 PDF pages: vols 1-4 pp. 148-152 and vol 5 pp. 50-70 and 148-152. The local progress database also has Pass A lines for vol 1 pp. 148-360. The certification gate, the span corpus, the Markdown export and the four review stations all cover the same 46-page working set.

Goal: every page of all five volumes can be read and worked in the reader, behind a login. Machine text is plainly marked unverified, the certification working set does not change, and no gate is weakened.

Non-goals: certification counts do not move; no review-station packet changes; no production write without L.J.'s go-ahead for that step.

## Measured facts, 2026-10-16

- PDF pages: vol 1 812, vol 2 1,106, vol 3 1,418, vol 4 990, vol 5 1,009, total 5,335. Every volume has a text layer. Vols 1 and 4 carry a hidden OCR layer, vols 2 and 3 a plain Times/Helvetica layer, and vol 5 is born-digital (Junicode, Cardo, Estrangelo Edessa fonts).
- Pass A on one core: render at 300 dpi 0.4 s, deskew 0.4 s, tesseract `fra+heb+grc+lat` 3.2 s, so about 4 s per page. The whole corpus is about 30 minutes on this machine's 18 cores.
- Sizes from the pilot: a page PNG averages about 460 KB, a line strip about 10 KB, and D1 about 90 KB per page (4.15 MB for 46 pages).
- Production today: D1 4.15 MB; R2 37.2 MB in 1,461 objects.
- Account: Workers Paid ($5 a month) is already active. Zero Trust Free is active (organization `lovejesus.cloudflareaccess.com`), with the email one-time-PIN login already configured.
- Traffic, 24 hours to 2026-10-16 13:40 EDT: about 2,000 requests, nearly all bots. ClaudeBot 409, a leakix vulnerability scanner 113, 19 probes for `/.env`, GPTBot, and scrapers with fake browser agents. The public export endpoint got 40 hits. D1 served 677,767 row reads and zero writes. No bot can save anything, because saving needs reviewer sign-in, but every page, image and the export is readable.

## Hosting cost, full corpus

| Item | Full-corpus estimate | Included or price | Cost |
| --- | --- | --- | --- |
| R2 storage | about 2.5 GB pages + 1.2 GB line strips | 10 GB free per account, then $0.015 per GB-month | $0, at worst about $0.06 a month |
| R2 uploads | about 130,000 objects, once | 1M Class A free a month, then $4.50 per million | $0 |
| R2 reads and egress | about 25 objects per page view | 10M Class B free a month; egress free | $0 |
| D1 storage | about 0.5 GB | 5 GB included; 10 GB per-database cap | $0 |
| D1 load | about 5M rows written, once | 50M a month included | $0 |
| Worker requests | about 25 per page view | 10M a month included | $0 |
| Login (Access) | up to 50 people | Zero Trust Free | $0 |

Total: the $5 a month the account already pays. Sources: Cloudflare R2, D1 and Workers pricing pages and the D1 limits page, read 2026-10-16. The 50-person Zero Trust Free limit comes from Cloudflare's plan announcement; recheck it in the dashboard when enabling.

The real cost driver is reading the non-French text on 5,335 pages, not hosting. Measure it on a sample before choosing (Decision 3).

## Decisions at brick 1

1. **Login: Cloudflare Access on the whole Worker.** Scope "all traffic" covers the custom domain and the `workers.dev` hostname. Login is the email one-time PIN. The allow list lives in Cloudflare, never in this public repository. The reader's own reviewer sign-in stays as it is for saving. Hosted smoke tests use an Access service token kept in `.env`. Needs L.J.'s go-ahead and the email list.
2. **Intake tier, separate from the certification working set (recommended).** New pages are built in their own intake database and artifact tree, then loaded to D1/R2 as machine drafts. The progress database, span corpus, export and certification gate keep the 46-page working set until a page is deliberately promoted. Placement: code in `src-chirho/corpus-intake-chirho/` (`src-chirho/` already has 206 entries and must not grow), artifacts in `workspace-chirho/corpus-intake-chirho/`.
3. **Reading non-French text at scale: measure first.** Candidates: vol 5 straight from its born-digital text layer; the CRNN for vol 1-2 Hebrew; agent verdicts for the rest, in an order L.J. sets. Report the measured cost per page before running anything large.
4. **Bulk load, not per-page wrangler calls.** Generated, idempotent per-volume SQL that never touches a page with reviewer events, plus parallel R2 uploads by key with checksums. `sync-one-page-chirho.ts` makes about 60 wrangler calls a page, which is unworkable at this scale. Each production load needs L.J.'s go-ahead.

## Phase 0 — Login in front of the app

- [ ] L.J.'s go-ahead and the allow-list emails.
- [ ] Enable Access on the Worker, all traffic. Verify that an unlisted visitor gets the Access page on both hostnames, including images and the export; that a listed person gets in with a PIN; and that reviewer sign-in and saving still work behind it.
- [ ] Access service token for the hosted smoke harness; harness updated.
- [ ] `robots.txt` with `Disallow: /`, a backstop for well-behaved crawlers.

## Phase 1 — Pass A for every page, locally

- [x] Intake runner: resumable, bounded parallelism, idempotent per page. It refuses to touch the 46 working-set pages or any page with reviewer events. Built 2026-10-17 (row 2949) in `src-chirho/corpus-intake-chirho/`; workflow in `spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md`.
  - Protection is the 46-page working set plus any page the progress database shows events, segments or human-confirmed words on, read-only; a missing progress database fails closed. Dry run: 5,335 PDF pages, 46 protected, no extra protected pages, 5,289 targets.
  - The intake writes only its own SQLite (`workspace-chirho/corpus-intake-chirho/intake-chirho.sqlite`) and page images (`pages-chirho/vol-N-chirho/0100-chirho/page-0123-chirho.png`). Each page's row and lines are replaced in one transaction; a page whose boxes fall off its image is refused; pages from older geometry code (`GEOMETRY_VERSION_CHIRHO`) are redone.
  - Pass A geometry moved out of `pass1-extract-lines-chirho.ts` into `corpus-intake-chirho/page-geometry-chirho.ts`, so the working-set tool and the intake share one copy.
  - 11 tests / 84 assertions (`bun test src-chirho/corpus-intake-chirho/`); typecheck `bunx tsc --noEmit --project src-chirho/corpus-intake-chirho/tsconfig-chirho.json` clean, pass1 included.
  - Trial, 9 workers: vol 2 pp. 200-217 in 11.9 s (1.5 pages/s, about 5.4 CPU-seconds a page); vol 5 pp. 200-217 at 14 pages/s.
- [x] Found by the montage check and fixed: vol 5 line boxes came out 1.5 times too large. pdftohtml's XML units are points times its default zoom of 1.5 (confirmed byte-identical to `-zoom 1.5`), but Pass A scaled them by 300/72 as if they were points. The scale is now 300/(72 x 1.5), with the zoom passed explicitly. The working set's vol 5 rows keep the old scale; the reader (`coordinate-space-chirho.ts`) and `read_volume_page_chirho.py` already rescale only boxes that overflow the image, so correct boxes display as they are.
- [x] Keep the intake off the review VPS. `sync-human-review-vps-chirho.ts` rsyncs the whole project with `--delete` minus a short exclude list, and `workspace-chirho/` is synced, so the next station sync would have carried the intake's page images and database. It now excludes `workspace-chirho/corpus-intake-chirho/`. A local dry run of the real command builder into an empty directory sends 0 intake workspace paths, against 968 with the exclude removed (mid-run); the station and VPS-readiness guards pass. No host was contacted.
- [x] Inventory report per volume: pages, lines, blank or plate pages, failures, wall time and disk use. Final run (geometry 3), 2026-10-17, 9 workers, 49.5 minutes, 0 failures:

  | Vol | PDF pages | Protected | Extracted | Zero-line | Lines | Image MB |
  | --- | --- | --- | --- | --- | --- | --- |
  | 1 | 812 | 5 | 807 | 8 | 34,392 | 384 |
  | 2 | 1,106 | 5 | 1,101 | 6 | 46,603 | 440 |
  | 3 | 1,418 | 5 | 1,413 | 2 | 82,311 | 708 |
  | 4 | 990 | 5 | 985 | 1 | 37,129 | 354 |
  | 5 | 1,009 | 26 | 983 | 2 | 32,209 | 477 |

  5,289 pages and 232,644 lines; 2.4 GB of page images and 3.1 GB of intake disk in all. The first full run (geometry 2) also finished with 0 failures, and its checks found the hOCR parser bug below.
- [x] Found by the first full run and fixed (`f9eeeb6`): the hOCR parser matched only `ocr_line`, so tesseract's `ocr_header`, `ocr_caption` and `ocr_textfloat` lines lost their boxes and their words were appended to the line before. On vol 3, 2,343 lines on 350 pages had held 54,686 words from other lines (p1061 kept 10 of 55 lines); after the fix vol 3 has 7,023 more lines and 58 stray words. The rest are single marks tesseract itself puts in a line but boxes outside it (margin dots and punctuation): 6 on vol 1, 48 on vol 2, 58 on vol 3, 205 on vol 4. The working set's only strays are the margin line numbers 40 and 50 on vol 3 p151.
- [x] Vol 1 pp. 153-360, which the old Pass A had extracted into the progress database, come out identical on all 208 pages and 8,753 lines, boxes and text, after both fixes.
- [x] Eyeball a montage of every volume's line boxes: front matter, body, indexes. Done for all five volumes with `intake-montage-chirho.ts` (12 sampled pages each, plus vol 3 pp. 9, 15, 192 and 1061): every printed line is tinted, including margin line numbers, two-column bibliographies, and vol 5's Hebrew, Syriac and Greek lines at the corrected scale.

## Phase 2 — Draft segments

- [x] First step: `classify-french-chirho.ts` reads `known_words_chirho` through `db-chirho.ts`, which opens the progress database for writing on import. Pass the known-word set in instead (loaded read-only), keeping the Pass C callers' behavior identical, so the intake can classify without touching that database. Done 2026-10-17 (row 2950): `classifyPageChirho(lines, knownWords)` plus `loadKnownWordsFromChirho(db, volume)` for any connection; both callers updated. Verdicts on 69 progress-database pages (32,415 words, 512 of them decided by known words) are byte-identical before and after.
- [x] Draft segmenter and its measurement (row 2951). `draft-segments-chirho.ts` tiles each line by classifier verdict the way Pass C tiles spans, with an unknown tile over any gap wider than 80px (tesseract sometimes drops Hebrew entirely) and vol 5's font hints keeping Hebrew, Greek and Syriac. `draft-recall-chirho.ts` measures it on the 46 working-set pages against reviewed spans (vols 2-5) and reviewed word scripts (vol 1), with the known-word set empty because it was partly harvested from those pages:
  - Greek 220/220, Syriac 30/30, Hebrew 577/582 reviewed spans flagged for reading; vols 2-4 flag 100% of their non-Latin spans even without the gap rule.
  - The 5 Hebrew misses are vol 1 words tesseract turned into Latin-looking tokens (`man`, `17`, `72`, `ATANA.`, `OM`). Symbols 114/146: most misses are vol 1 word labels that are really verse references, brackets or punctuation. Unknown 52/63: the misses are English and German quotations on vol 5 p149 that the reference marked unknown; the PDF layer reads them correctly.
  - Flag precision is 28-57% on the scanned volumes, so readers will see many false "needs reading" flags; that is the safe direction for machine drafts.
  - A second witness in Phase 3 (the v8 Hebrew CNN gate reached 97.5% recall on word crops) could catch the Latin-looking Hebrew misses.
- [x] Run the deterministic French classifier on every line. Drafts version 2 on all 5,289 pages in 101 seconds, 0 failures: 693,530 segments, 258,530 of them (37%) flagged for reading (vol 1 39%, vol 2 37%, vol 3 38%, vol 4 41%, vol 5 30%).
  - Found and fixed on the way: tesseract lists a Hebrew run's words right to left, so tiling in list order produced about 8,800 zero-width tiles. Words are now tiled left to right, runs of Hebrew letters read right to left even when their script is unknown, and invisible direction marks are dropped from draft text. 168 zero-width tiles remain, from words tesseract boxes at the same position. Flag recall on the working set is unchanged (Hebrew 577/582, Greek 220/220, Syriac 30/30). Unresolved candidate words become "needs reading" segments, with the machine text kept as an unverified hint and never as accepted text.
- [ ] Vol 5: script hints and Unicode from the born-digital text layer, visually checked on a sample.

## Phase 3 — Machine reading

- [ ] Vol 5 candidate, likely exact and free: its Hebrew is set in NewJerusalemU and its Greek in SymbolGreekU, legacy Linguist's Software fonts embedded without a Unicode map, so the text layer holds key codes (vol 5 p149 line 1 has `. +@ $# . 3I. 04 -8` where the reviewed span reads מְלִיצַי רֵעָי). Check whether the embedded subsets keep glyph names and one code assignment across the volume; if so, decode code to glyph to Unicode (reordering the visually typed runs), and verify against vol 5's reviewed spans before trusting it.
  - Probe, 2026-10-17 (scratch, read-only): each subset is one PDF object shared by the whole volume, so a code means one glyph everywhere. The main Hebrew subset (YDQCAM, 71 glyphs: consonants, finals, precomposed dagesh forms, vowels, sigla 𝔐 𝔊 𝔙 𝔖 𝔗, ÷) lost its glyph names but was identified from a rendered glyph sheet; the second (NDFBXO, MacRoman: dagesh forms, shin and sin, word spaces) keeps its names. pdftohtml names the subset per text element, emits codes in visual order, and only the second subset carries real space glyphs. Decoding is: map per subset, reverse each run, mirror brackets, NFC.
  - First measurement against the 317 reviewed vol 5 Hebrew spans, compared per line because the spans bind phrase texts in reading order rather than to their own boxes: consonants agree on 292, exact text on 81. The remaining gaps are decoder work: word spaces and the attachment of a mark to its letter need per-glyph positions, which pdftohtml does not give.
  - Per-glyph positions from a small pikepdf interpreter of the page's text operators (text state saved and restored with q/Q): within each `TJ` the glyphs are drawn left to right with every mark drawn just before its letter, so marks attach by drawing order; a mark left at the end of a run attaches to the letter under its ink. Word breaks come from measured gaps and the second subset's space glyphs, phrase breaks from glyphs of other fonts (such as the `/` between verse halves), and holam drawn over a quiescent aleph moves to the letter before it. Glyph outline counts settled the dagesh forms (code `9` is plain pe; its inner tongue looked like a dot).
  - Current measurement over the 505 reviewed vol 5 Hebrew words, per line: consonants agree on 479 (94.9%), full pointing on 228 (45.1%). Of the pointing differences, 110 are unpointed print where the reviewed text adds points. For the 141 where the page is pointed, the WLC attests only the decoder's form 39 times and only the reviewed form 9 times (16 both, 77 neither, mostly Aramaic Targum quotations); among those 9 are reviewed words missing a maqaf, one decoder holam placement (`שׂנְֹאַי`) and one decoder hiriq for patah (`מְלִיצִי` for מְלִיצַי) still to fix.
  - Probe scripts, glyph sheets and the draft code table are kept locally in `workspace-chirho/corpus-intake-chirho/vol5-font-probe-chirho/` (gitignored) until they become a tested module.
  - Two disagreements checked on the page images, both read correctly by the decoder: vol 5 p51 line 9 prints צַמִּים (the span has צָמִים), and p54 line 22 prints unpointed אלא במאמר, אלא באבני ברד, אלא במעשים (the spans add pointing that is not printed). Those spans have provenance `vision-chirho` (2026-05-30) and sit in the expert-confirm pack, so they are unconfirmed machine text, not certified readings. A finished decoder could give the experts exact text, or flag vision errors before they review.
  - Greek is simpler: the main SymbolGreekU subset (BNVNFV, 141 glyphs) has one complete polytonic letter per glyph (ἐ, ῥ, ᾧ, Ὁ ...), and Greek runs left to right, so a code table alone should give exact text; spaces again come from the second subset. Syriac (EstrangeloEdessa, 88 glyphs) is not yet examined.
- [ ] Measure each candidate reader on a held-out sample per volume, with accuracy and cost per page.
- [ ] L.J. picks the reader and the order; run it in bounded batches.

## Phase 4 — Load to Cloudflare (each load needs L.J.'s go-ahead)

- [ ] Per-volume SQL plus R2 upload, with dry-run counts first.
- [ ] Verify row counts, image counts and a browser spot-check per volume. The working set's content hashes are unchanged.

## Phase 5 — Reader at scale

- [x] Volume page list: today each view selects every full page row, French text included, and aggregates every segment in the volume. Narrow the columns, paginate or precompute, and keep it indexed. Done by gpt_chirho in `8cb62c9` (row 2952): 24-page keyset windows on (volume, page) with counts for the visible pages only; on a synthetic 1,418-page, 184,340-segment volume a window reads 5,114 rows against 300,616 for one whole-volume count. Receipt: `spec-chirho/tasklists-chirho/reader-chirho/26-10-17_16-05-tasklist-reader_scale-chirho.md`.
- [x] Bound or gate `/api-chirho/export-chirho`, which reads everything. Done in the same slice: an explicit range of at most 24 pages, text fields bounded in SQL, 1 MiB output, refusal instead of truncation. Still public until the Access decision.
- [x] Home page totals: `app-chirho/src/routes/+page.server.ts` groups every page and every segment of the corpus on each view (about 700,000 segment rows once the intake is loaded). Bound it before any full load (found by gpt_chirho). Done locally 2026-10-17 (row 2953): `catalog-chirho/home-chirho.ts` counts pages and approved pages per volume in one pass and never reads lines or segments; the per-volume segment totals left the home page (per-page counts stay in the volume windows). The D1 proof, now built with migration 0002 as production has it, plans it as `SCAN pages_chirho USING COVERING INDEX idx_pages_vol_approved_chirho` and reads 1,471 index entries for 1,471 pages; its 8 cases pass, with svelte-check 0/0, the build and 42 reader unit tests. Not checked in a browser, to keep the protected local D1 copy untouched.
- [ ] Before deploying any of these changes, and as a gate before any load: confirm read-only on production that `pages_chirho` has the (volume, page) unique index and `idx_pages_vol_approved_chirho`, and that EXPLAIN QUERY PLAN matches the local proof for the volume windows, the export and the home summary.
- [ ] Jump by printed page and by biblical reference.
