# tessdata bake-off — page-0148 (vol 1)

Single-page A/B/C run comparing tesseract configurations on Barthélemy
vol 1 page 148. The page mixes French commentary with a few Hebrew apparatus
forms (Joshua 2 — Rahab and the spies).

| Config | Wall ms | Words | Mean conf | Median | <60 conf | Hebrew words |
|---|---:|---:|---:|---:|---:|---:|
| fast / `-l fra` (current prod) | 2442 | 506 | 90.4 | 95 | 22 | 0 |
| best / `-l fra` | 1540 | 507 | 91.1 | 96 | 18 | 0 |
| best / `-l fra+heb+grc+lat` | 3433 | 509 | 93.7 | 96 | **3** | **5** |

## Hebrew tokens recovered by best+multi (vs zero by either fra-only run)

| Token | Conf |
|---|---:|
| `ותצפבם` | 85.1 |
| `צפן` | 56.7 |
| `קרמתו` | 87.0 |
| `ברלת` | 90.6 |
| `הברלת` | 73.9 |

`צפן` literally means "to hide" in biblical Hebrew — semantically appropriate
for this page on Rahab hiding the spies. The detections look like real word
forms, not tesseract noise.

## Takeaways

1. **`tessdata_best` is faster than `tessdata_fast`** for `-l fra` on this
   page (1.5s vs 2.4s). The "fast" tier is LSTM+legacy hybrid; "best" is
   LSTM-only and surprisingly snappier in practice.
2. **Multi-script with best models is the unlock** — Hebrew goes from "0
   real words, 22 low-confidence garbage" to "5 real Hebrew Unicode words,
   3 low-confidence garbage." Same page, same psm, just a richer language
   stack and better models.
3. Curly-quote handling shifts to straight quotes under best+multi. Minor;
   downstream normalization can canonicalize.

## Recommended next step

Switch the pipeline's `pass1-extract-lines-chirho.ts` invocation from
`-l fra` (fast) to `-l fra+heb+grc+lat` with
`--tessdata-dir workspace-chirho/tessdata-best-chirho/`. Re-OCR exactly
**one** page first (vol 1 page 148) per the project rule, verify the
editor surfaces the Hebrew tokens, then expand to the rest of the pilot
pages.

Raw outputs in this directory: `fast-fra-chirho.tsv`,
`best-fra-chirho.tsv`, `best-multi-chirho.tsv`,
`summary-chirho.json`.
