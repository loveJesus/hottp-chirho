<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Independent held-out witness and batching audit (2026-08-20)

## Verdict

All four requested print adjudications are confirmed from the original
volume-1 page pixels:

- both `להוה` labels cover printed `יהוה`;
- both allegedly truncated labels omit a printed final yod that is inside the
  labelled crop.

The witness-corrected score also reproduces exactly through per-item inference:
`78/86 = 0.9070` becomes `73/86 = 0.8488`, a reduction of 5.8 percentage
points exact, while character accuracy moves from `0.9694` to `0.9567`.
Therefore the direction—inflation—is independently confirmed.

The batching caveat needs one further correction. Two prediction strings move
between per-item and batch-32 inference, not one. One of those changes is the
second `יהוה` crop itself and changes its status from wrong-under-both-labels
to a false pass against corrupt gold. Consequently:

- per-item inference: 6 false passes, 1 false fail, 1 wrong under both targets;
  exact inflation is 5/86 = 5.8 points;
- default batch-32 inference: 7 false passes and 1 false fail; exact inflation
  is 6/86 = 7.0 points.

The qualitative conclusion is robust, but the exact magnitude is 5.8 or 7.0
points depending on the inference path. The report should not combine the
per-item 5.8-point delta with the batch-32 7-to-1 false-pass count.

## Inputs pinned

- Shared-tree HEAD at final evidence inspection: `6012d8f`.
- Held-out witness artifact SHA-256:
  `eec14c8846be9ec261bfa454599a1954305c150142ac26db771b9be393e2247b`.
- Gold manifest SHA-256:
  `c09ffd39f08d7d2440180dbfae8846f922147dbb0cb46afe29a347723345a9ca`.
- CRNN checkpoint SHA-256:
  `aa7a0ff937c3a38d205508dd8ad03293915b516b054b747e4aa3a531ede99fff`.

The workspace artifact, manifest, source pages, crops, and checkpoint are
gitignored mutable files. Hashes are therefore part of the result's identity.

## Source-page chain of custody

Each exact crop was independently re-cut from its manifest bbox on the original
volume-1 page. ImageMagick absolute-error comparison against the corpus crop
returned `AE=0` in all four cases.

| crop | bbox | page SHA-256 | crop SHA-256 |
|---|---|---|---|
| `p0291-x378-y1951-chirho.png` | `[378,1951,444,1974]` | `2d230f1bd0d3a81d0ac43bcfb8cb6f3acf5e1c52ad1badadc2060303d25c3f6f` | `391d30b8cbcd9e6e5b11416bf14b2b221b341a06e482d95177153283931006f8` |
| `p0342-x636-y1628-chirho.png` | `[636,1628,704,1653]` | `5f4cd6e0435fc7072007bf013d8f3c432fae4e3378e6bd39cefeab7e5f14e338` | `f6f293a92a12d8fec711d30d3edcbad1af39de7d9b001d6863092f77dfc32d7a` |
| `p0221-x881-y257-chirho.png` | `[881,257,976,281]` | `246a56314465e54f3e039c6e52b8d8030b589826dc2a43e2b6db4bad79192d09` | `050a0ab8757de46d6b1d75504c15d4f376671ef6381108a0fad76532ddce5377` |
| `p0311-x991-y1510-chirho.png` | `[991,1510,1088,1534]` | `8503e9b795cd415dcfd4f1e81b8fb536a2b22048da4bde8c977864c7dcc90bbf` | `3bac59fd28aa8eabaddd0cd9e186140231c44db6142ea0fba44b6927390fc03e` |

## Request 1: the two divine-name records

### `p0291-x378-y1951-chirho.png`

The padded source re-cut prints, in Hebrew reading order, yod + he + vav + he:
`יהוה`. The first reading-order glyph is short and ascender-free. It is a
yod, not a lamed. Manifest gold `להוה` is wrong.

### `p0342-x636-y1628-chirho.png`

The second padded source re-cut independently shows the same four printed
letters, `יהוה`. Its first reading-order glyph is again a short yod with no
lamed ascender. Manifest gold `להוה` is wrong.

WLC frequency is not used to decide the pixels, but it is a consistency check:
the local WLC has 4,623 instances of `יהוה` and one of `להוה`.

## Request 2: dropped final yods

At a grayscale threshold of `<128`, the alleged final character has the same
stable geometry in both original-resolution crops:

| crop | left-edge ink group | centroid row | word-body bottom | printed reading |
|---|---|---:|---:|---|
| `p0221-x881-y257-chirho.png` | columns 0–11, rows 1–16 | 7.18 | row 23 | `האמרי` |
| `p0311-x991-y1510-chirho.png` | columns 0–11, rows 1–16 | 7.33 | row 23 | `המטרי` |

The groups remain 12–13 pixels wide and confined to rows 1–16 across thresholds
from `<96` through `<224`. They hang near the top of the word while the body
letters reach rows 22–23. A baseline comma would occupy the lower part of the
box; these components do not. Padded source context also places each component
immediately after the resh in Hebrew reading order. They are printed final
yods inside the labelled bboxes.

Therefore manifest gold `האמר` and `המטר` are wrong; the page prints
`האמרי` and `המטרי`.

## Score reproduction

The current deterministic MD5 split contains 86 held-out records. Applying the
eight corrections in `goldProvenWrongChirho` and leaving the separately marked
crop-scope defect out of the spelling correction gives:

| inference path | manifest exact | corrected exact | exact delta | manifest char | corrected char |
|---|---:|---:|---:|---:|---:|
| one crop at a time | 78/86 = 0.906977 | 73/86 = 0.848837 | -0.058140 | 0.969388 | 0.956743 |
| `score_heldout_chirho`, batch 32 | 79/86 = 0.918605 | 73/86 = 0.848837 | -0.069767 | 0.971939 | 0.956743 |

The one-at-a-time row reproduces commit `c3645c6`'s published 5.8-point delta
exactly. The default scorer's internally consistent delta is instead 7.0
points. Both establish inflation.

## Batch-padding diagnosis

Two strings differ between batch size 1 and batch size 32:

| crop | batch 1 | batch 32 | scoring consequence |
|---|---|---|---|
| `p0252-x820-y1049-chirho.png` | `עפוו` | `אפוו` | wrong under both; aggregate unchanged |
| `p0342-x636-y1628-chirho.png` | `ילהוה` | `להוה` | batch 32 gains a false pass against corrupt gold |

Batch-size sweep results:

- batch 1: `78 -> 73`, delta 5.8 points;
- batch 2 or 4: one string changes, scores remain `78 -> 73`;
- batch 8, 16, 32, 64, or 86: two strings change, scores become `79 -> 73`,
  delta 7.0 points.

The implementation provides a direct mechanism. `collate_chirho()` pads every
image to the widest item in its batch and returns the original widths, but
`score_heldout_chirho()` discards those widths. `greedy_decode_chirho()` then
decodes every padded timestep. Because the recurrent layer is bidirectional,
right-side padding can also alter backward states over real image columns, not
only append harmless blanks. Training similarly supplies the batch maximum as
the CTC input length for every image.

This is a model/inference defect separate from label integrity. No fix was made
in this audit.

## Reconciliation for the project report

The report can state either of these, provided it stays internally consistent:

1. Per-item protocol: `78/86 -> 73/86`, 5.8-point inflation, with 6 false
   passes, 1 false fail, and 1 record wrong under both labels.
2. Default batch-32 protocol: `79/86 -> 73/86`, 7.0-point inflation, with 7
   false passes and 1 false fail.

The present report mixes option 1's metric with option 2's false-pass count and
says only one prediction moves. Those details should be corrected. Gold,
source-page, audit, and model artifacts were not modified by this audit.
