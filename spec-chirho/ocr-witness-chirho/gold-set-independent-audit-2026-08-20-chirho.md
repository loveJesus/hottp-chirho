<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Independent GOLD_STRICT label and CRNN probe audit (2026-08-20)

## Verdict

The core defect is confirmed: `GOLD_STRICT` certifies that Tesseract's
normalized consonant string is a real WLC form, not that it is the word printed
in the crop. The current CRNN checkpoint also reproduces the corrupt manifest
reading on 9 of the 10 reported bad labels.

The quantitative conclusion needs narrowing. The ten labels prove training and
evaluation-label contamination, but they do not establish that the held-out
headline is inflated by roughly 3.2% or that `0.911` should be corrected to
about `0.88`. Eight of the ten records are in the training split. Of the two in
the held-out split, one wrong label gives the current checkpoint false credit
and the other wrong label gives it a false penalty. Correcting those two labels
is net-neutral for both exact and character accuracy under the current scoring
path.

The defensible statement is therefore: the historical headline measures
agreement with Tesseract-derived, WLC-filtered labels and is not a certified
estimate of print accuracy. Its bias direction and magnitude remain unknown
until the complete held-out split is relabeled by independent witnesses.

## Inputs pinned for this audit

- Git HEAD inspected: `3fa24fa`.
- Gold manifest SHA-256:
  `c09ffd39f08d7d2440180dbfae8846f922147dbb0cb46afe29a347723345a9ca`.
- CRNN checkpoint SHA-256:
  `aa7a0ff937c3a38d205508dd8ad03293915b516b054b747e4aa3a531ede99fff`.
- Volume-1 page 150 SHA-256:
  `4bf4ceb8742d2b7545954de3b234a07f6c06a0da5045a2ed6ca23a8623f5d56d`.
- Volume-1 page 308 SHA-256:
  `dea96a99f8f7d31f9888f914a6d18524e6e477d31bc0242afc8a2869c3c4cd18`.

The checkpoint and workspace manifests are gitignored mutable artifacts, so
these hashes are required to make the probe result identifiable.

## Independent source-page verification

Both corpus crops were re-cut from their original volume-1 page images using
the manifest bounding boxes. ImageMagick absolute-error comparison returned
`AE=0` for each exact re-cut, proving that the inspected page pixels and corpus
crops are identical.

| crop | manifest bbox | manifest gold | source-page reading | verdict |
|---|---:|---|---|---|
| `p0150-x1217-y1462-chirho.png` | `[1217,1462,1302,1486]` | `ולאמר` | `ויאמר` | wrong label |
| `p0308-x497-y609-chirho.png` | `[497,609,588,632]` | `ולשכב` | `וישכב` | wrong label |

For page 150, the padded source re-cut shows, in reading order, vav + short
yod + aleph + mem + resh. There is no lamed ascender. The existing page-150
line provenance independently places canonical `ויאמר` at x=1205 with width
98, overlapping the crop's x=1217..1302 box.

For page 308, the padded source re-cut shows vav + short yod + shin + kaf +
bet. Again, the disputed character is an ascender-free yod, not a lamed. The
current CRNN reads this crop as `וישכב`, which is correct against the page but
is marked wrong by the manifest label `ולשכב`.

## Minting-path check

`src-chirho/mint_gold_set_chirho.py` performs this sequence:

1. Read `tessTextChirho` from the corpus manifest.
2. Normalize it to a consonant skeleton.
3. Accept it when that skeleton is an exact WLC word form and has the required
   length.
4. Store that same normalized skeleton as `goldConsonantsChirho`.

No image witness participates in minting. A Tesseract substitution that lands
on another valid WLC form therefore becomes gold exactly as reported.

One wording correction: raw `tessTextChirho` is not byte-identical to
`goldConsonantsChirho` in every record. It is raw-byte-equal in 112 of 629 gold
records and differs in 517 because normalization removes marks or folds forms.
The normalized Tesseract skeleton equals `goldConsonantsChirho` in all 629 of
629 records. This does not weaken the defect; it states the mechanism exactly.

## Split and checkpoint probe

`load_gold_split_chirho()` deterministically splits all 629 gold records (308
`GOLD_STRICT` plus 321 `GOLD_OK`) by an MD5-derived crop-name value:

- real fine-tune split: 543 records;
- held-out split: 86 records.

The reported ten bad labels divide 8 train / 2 held-out:

| crop | split | manifest gold | printed | current checkpoint |
|---|---|---|---|---|
| `p0150-x1217-y1462-chirho.png` | held-out | `ולאמר` | `ויאמר` | `ולאמר` |
| `p0247-x291-y909-chirho.png` | train | `ולאמר` | `ויאמר` | `ולאמר` |
| `p0221-x1358-y2147-chirho.png` | train | `ולאמר` | `ויאמר` | `ולאמר` |
| `p0310-x1454-y1750-chirho.png` | train | `ולאמרו` | `ויאמרו` | `ולאמרו` |
| `p0157-x1137-y1422-chirho.png` | train | `להושע` | `יהושע` | `להושע` |
| `p0157-x525-y1473-chirho.png` | train | `להושע` | `יהושע` | `להושע` |
| `p0296-x890-y458-chirho.png` | train | `למותו` | `ימותו` | `למותו` |
| `p0252-x1190-y1749-chirho.png` | train | `לאבלו` | `לאביו` | `לאבלו` |
| `p0308-x497-y609-chirho.png` | held-out | `ולשכב` | `וישכב` | `וישכב` |
| `p0252-x235-y1797-chirho.png` | train | `ולאמו` | `ולאמר` | `ולאמו` |

The 8/10 training membership is the point for the training-contamination
claim: those images were explicitly optimized toward wrong targets, so the
checkpoint's agreement demonstrates that the corruption was learned. It is not
evidence that eight held-out scores were inflated, because those eight crops do
not enter the held-out score.

The two held-out cases show both possible directions of label-noise bias:

- page 150: wrong prediction receives false credit;
- page 308: correct prediction receives false penalty.

Using the current checkpoint and the current `score_heldout_chirho()` batching
path gives the following result:

| target set | exact | character accuracy |
|---|---:|---:|
| current manifest | 79/86 = 0.918605 | 0.971939 |
| only the two independently verified held-out labels corrected | 79/86 = 0.918605 | 0.971939 |

Thus the known held-out corrections are net-neutral. More undiscovered errors
may move the metric in either direction, but their direction cannot be inferred
from the strict-tier error rate alone.

## Headline provenance caveat

The current checkpoint and current code reproduce `0.919` exact / `0.972`
character accuracy, consistent with commit `09547e2`'s recorded `0.919` exact
run. They do not reproduce the older `0.911` exact / `0.978` character pair.
Because the model file is gitignored and its checkpoint stores weights and the
alphabet but no manifest hash, split hash, training configuration, or final
metrics, the historical pair cannot presently be tied to an immutable model
artifact.

## Recommended report wording

Replace any numerical corrected headline such as `~0.88` with:

> The CRNN score is agreement with a Tesseract-derived, WLC-filtered manifest,
> not certified print accuracy. At least two labels in the deterministic
> held-out split are demonstrably wrong, and the known pair creates one false
> pass and one false fail. Relabel the full held-out split with independent
> witnesses before asserting the direction or magnitude of bias.

Gold manifests and model artifacts were not modified by this audit.
