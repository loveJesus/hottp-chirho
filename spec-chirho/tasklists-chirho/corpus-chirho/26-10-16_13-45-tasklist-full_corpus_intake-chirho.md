<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Full corpus intake Chirho

Direction, L.J. 2026-10-16: "continue dev so we can fully work on the whole hottp thing", then "how much would it cost to host it all on cloudflare, and protect it with some kind of password i don't want a bot spamming our app".

Today the reader holds 46 of the 5,335 PDF pages: vols 1-4 pp. 148-152 and vol 5 pp. 50-70 and 148-152. The local progress database also has Pass A lines for vol 1 pp. 148-360. The certification gate, the span corpus, the Markdown export and the four review stations all cover the same 46-page working set.

Goal: every page of all five volumes can be read and worked in the reader, behind a login. Machine text is plainly marked unverified, the certified working set does not change, and no gate is weakened.

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
2. **Intake tier, separate from the certified working set (recommended).** New pages are built in their own intake database and artifact tree, then loaded to D1/R2 as machine drafts. The progress database, span corpus, export and certification gate keep the 46-page working set until a page is deliberately promoted. Placement: code in `src-chirho/corpus-intake-chirho/` (`src-chirho/` already has 206 entries and must not grow), artifacts in `workspace-chirho/corpus-intake-chirho/`.
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
- [ ] Inventory report per volume: pages, lines, blank or plate pages, failures, wall time and disk use.
- [ ] Eyeball a montage of every volume's line boxes: front matter, body, indexes.

## Phase 2 — Draft segments

- [ ] Run the deterministic French classifier on every line. Unresolved candidate words become "needs reading" segments, with the machine text kept as an unverified hint and never as accepted text.
- [ ] Vol 5: script hints and Unicode from the born-digital text layer, visually checked on a sample.

## Phase 3 — Machine reading

- [ ] Measure each candidate reader on a held-out sample per volume, with accuracy and cost per page.
- [ ] L.J. picks the reader and the order; run it in bounded batches.

## Phase 4 — Load to Cloudflare (each load needs L.J.'s go-ahead)

- [ ] Per-volume SQL plus R2 upload, with dry-run counts first.
- [ ] Verify row counts, image counts and a browser spot-check per volume. The working set's content hashes are unchanged.

## Phase 5 — Reader at scale

- [ ] Volume page list: today each view selects every full page row, French text included, and aggregates every segment in the volume. Narrow the columns, paginate or precompute, and keep it indexed.
- [ ] Bound or gate `/api-chirho/export-chirho`, which reads everything.
- [ ] Jump by printed page and by biblical reference.
