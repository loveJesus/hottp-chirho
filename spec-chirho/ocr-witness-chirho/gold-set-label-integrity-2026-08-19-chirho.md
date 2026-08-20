<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# GOLD_STRICT Label Integrity + Vision-Reader Benchmark (2026-08-19)

Triggered by L.J.'s request to benchmark Opus 5 vision against our CRNN on the
blind word-read harness. The benchmark ran; it also surfaced a defect in the
gold set that prices *both* numbers.

## 1. The defect

`mint_gold_set_chirho.py` mints gold as: **tesseract text whose consonant
skeleton is an exact WLC word form**. `goldConsonantsChirho` is the *normalized
skeleton* of `tessTextChirho` — skeleton-equal in 629/629 records, byte-equal in
only 112/629 (the rest differ by stripped RLM marks and folded final forms).
Either way there is **no print witness anywhere in the mint path**: the WLC check
proves the string is *a* real Hebrew word, never that it is *the word printed in
this crop*.

(An earlier revision of this file said "byte-identical in every record". That was
wrong — corrected after `gpt_chirho`'s independent audit; the substantive point,
that gold carries no print witness, is unchanged.)

So any tesseract misread that happens to land on another valid WLC form is
silently canonised as GOLD_STRICT.

The dominant instance is **ל→י**: the typeface's yod is a short ascender-free
stroke, and ink bleed from the line above (these crops are cut flush — e.g.
85x24 px with ink on row 0) fuses onto it and reads as a lamed.
`ויאמר` → `ולאמר` is the signature case: *wə-lēmōr* is a genuine WLC form, so
the guard passes.

### Confirmed wrong labels (visually verified against the source page, padded re-cut)

| crop | gold label | actually printed |
|---|---|---|
| p0150-x1217-y1462 | ולאמר | **ויאמר** |
| p0247-x291-y909 | ולאמר | **ויאמר** |
| p0221-x1358-y2147 | ולאמר | **ויאמר** |
| p0310-x1454-y1750 | ולאמרו | **ויאמרו** |
| p0157-x1137-y1422 | להושע | **יהושע** (Joshua) |
| p0157-x525-y1473 | להושע | **יהושע** |
| p0296-x890-y458 | למותו | **ימותו** |
| p0252-x1190-y1749 | לאבלו | **לאביו** |
| p0308-x497-y609 | ולשכב | **וישכב** |
| p0252-x235-y1797 | ולאמו | **ולאמר** (ר→ו, different class) |

**≥10 of 308 GOLD_STRICT = 3.2%, and that is a floor.** The screen only catches
labels ≥10x rarer in WLC than a one-substitution neighbour drawn from a
hand-picked confusion list; errors between comparably frequent words are
invisible to it.

Discrimination control: at p0252-x235-y1797 a real lamed ascender *is* present,
and that label was upheld — the finding is an ascender test, not a bias toward
the commoner word. Screen false positives confirmed correct: `שלשומ` (p0330),
`משפחה` (p0152-x172, p0153-x821, p0153-x709 — settled by an objective
final-letter ink-connectivity test after an eyeball call went the other way).

### Independent verification

The whole finding rests on one perceptual call (lamed ascender vs ascender-free
yod), so it was put to a second reader with a deliberate control: two crops that
must yield opposite answers. `gemini_chirho` re-cut both from the source pages
and inspected the pixels without being given the gold values first
(broker #14341 -> #14342):

| crop | gemini verdict | agrees with |
|---|---|---|
| p0157-x1137-y1422 | first letter is a short yod, zero ascender -> **יהושע** | gold label `להושע` is WRONG |
| p0252-x235-y1797 | second letter is a tall lamed, distinct ascender -> **ולאמר** | gold label upheld |

The control held: opposite verdicts on the two crops, matching the claims made
here before verification. Two independent readers, same conclusion.

`gpt_chirho` then ran a separate audit (broker #14349, evidence in
`gold-set-independent-audit-2026-08-20-chirho.md`): re-cut p0150 and p0308 from
the source pages (ImageMagick AE=0 against the corpus crops, so the crops do
match their manifest bboxes) and independently confirmed both bad labels. That
audit also produced the two corrections applied above — the byte-equality
wording and the withdrawal of the quantitative inflation claim. Both were
verified here before adopting them.

## 2. Why it inflates the CRNN headline

`train_word_ocr_chirho.py:227` fine-tunes on `goldConsonantsChirho` and scores
against `goldConsonantsChirho` from the same manifest. Train signal and eval
signal share the defect, so the error is invisible to the metric.

Probed the trained `crnn-chirho.pt` (sha256 `aa7a0ff937c3a38d`) directly on the
ten proven-wrong crops: **9 of 10 — the CRNN emits the corrupt tesseract
reading.**

Split membership (verified): **8 of the 10 are in the training split, 2 are
held out.** The eight training cases prove the *learned target* is contaminated —
the model was taught tesseract's misreads as truth. That claim stands.

**They do not quantify held-out metric inflation, and an earlier revision of this
file wrongly asserted that they did.** The two held-out defects point in opposite
directions:

| crop | gold | CRNN emits | print truth | effect on the metric |
|---|---|---|---|---|
| p0150-x1217-y1462 | ולאמר | ולאמר | ויאמר | **false pass** (scored right, actually wrong) |
| p0308-x497-y609 | ולשכב | וישכב | וישכב | **false fail** (scored wrong, actually right) |

They cancel. Correcting both leaves the held-out score unchanged.

Reproduced from the live checkpoint this session:
**exact 79/86 = 0.9186, char 0.9719.** Note this is *not* the 0.911 / 0.978 pair
carried in project memory and hardcoded in the eval harness banner; that pair
does not reproduce against this checkpoint and lacks the provenance to bind it.

The defensible conclusion is therefore qualitative, not numeric:
**the headline measures agreement with tesseract-derived, WLC-filtered labels —
not certified print accuracy.** The direction and magnitude of the held-out
effect are *unknown* and stay unknown until the full held-out split is
witness-relabelled. Independent readers are still penalised on the specific
corrupt items, which is why the reader corrections in §3 stand.

`load_pseudo_gold_chirho` compounds this — it promotes "CRNN high-confidence
WLC-exact reads" to training labels through the same filter that admitted the
error, a self-reinforcing channel.

## 2b. RESOLVED (2026-08-20): the held-out split, witness-relabelled

§2 left the direction and magnitude unknown "until the full held-out split is
witness-relabelled". That is now done — all 86 held-out records.

**Protocol.** 71 crops read blind at 6x and locked before any label was seen;
12 reused from this session's earlier blind locks; 3 taken from Fable 5's blind
reads (crops this session had already spoiled for me). Every witness/gold
disagreement was then adjudicated against a **padded re-cut of the vol-1 source
page**, and marginal calls were settled by objective pixel tests rather than by
eye (ink-group widths, he-vs-tav component counts, yod-vs-comma vertical
position).

**Result: 55 agree, 31 disagree.** Of the 31 — **22 were MY errors** (gold
upheld), **8 are gold labels proven wrong**, and **1 is a crop-scope defect**.

| crop | gold | printed | defect |
|---|---|---|---|
| p0150-x1217-y1462 | ולאמר | **ויאמר** | lamed-for-yod |
| p0244-x1486-y361 | אלכה | **איכה** | lamed-for-yod |
| p0291-x378-y1951 | להוה | **יהוה** | lamed-for-yod — *the divine name* |
| p0342-x636-y1628 | להוה | **יהוה** | lamed-for-yod — *the divine name* |
| p0308-x497-y609 | ולשכב | **וישכב** | lamed-for-yod |
| p0221-x881-y257 | האמר | **האמרי** | dropped a printed final yod |
| p0311-x991-y1510 | המטר | **המטרי** | dropped a printed final yod |
| p0323-x937-y2402 | שלשים | **שלשם** | inserted a yod that is not printed |

Plus p0157-x1285-y1264, where the **bbox spans two words** (`וילך — העמק`)
while the label covers only one — a segmentation defect, not a spelling one.

**Corrupt-label rate on held-out: 8/86 = 9.3%** (9/86 = 10.5% including the
crop defect). That is ~3x the 3.2% floor the §1 heuristic screen produced,
because that screen only caught labels >=10x rarer than a one-substitution
neighbour.

**Re-scoring the CRNN (checkpoint `aa7a0ff9`) against the witness-corrected
labels.** `gpt_chirho`'s audit (f6b9b86) caught that an earlier revision of this
section mixed two evaluation paths; re-derived here, both are reported
separately.

| path | as-published gold | witness-corrected | delta |
|---|---|---|---|
| **batch 32** (what `score_heldout_chirho` actually runs, and the source of the quoted headline) | 79/86 = 0.9186 | **73/86 = 0.8488** | **−0.070** |
| per-item (batch 1) | 78/86 = 0.9070 | 73/86 = 0.8488 | −0.058 |

The corrected score is **73/86 in both paths** — the correction is stable; only
the *baseline* moves. So **the published headline is inflated by 7.0 points of
exact accuracy**, and the −5.8 figure quoted earlier belongs to the per-item
path only.

Per-item status of the eight corrupt labels: **6 false passes, 1 false fail
(p0308), and 1 wrong under both** (p0342 decodes `ילהוה`, matching neither).
Net −5 = 6 − 1. Under batch 32 p0342 decodes `להוה`, becoming a seventh false
pass: net −6 = 7 − 1. An earlier revision paired the per-item delta with the
batch-32 breakdown; that is corrected.

**The batching wrinkle is a defect, and it is now fixed.** Two predictions
changed with batch size: p0252-x820-y1049 and p0342-x636-y1628, the latter
manufacturing a false pass against corrupt gold. Diagnosis took three passes,
and the first two were wrong:

1. *Decode-time masking is insufficient.* Truncating each row to its valid
   timesteps leaves both flips intact — the BiLSTM is **bidirectional**, so its
   backward pass has already consumed the padded tail and carried that state
   into the real timesteps. Post-hoc masking cannot undo it. (`gpt_chirho`
   measured 4.14 max-abs logit divergence on the valid prefix of p0252.)
2. *Packing the BiLSTM is also insufficient.* `pack_padded_sequence` removes the
   p0342 flip but not p0252: its **CNN features already differ** (1.89 max-abs
   here, 1.44 in gpt's prototype), concentrated at the right edge.
3. *The root cause is the pooling grid.* At an odd width the final `MaxPool2d`
   **discards** the trailing column when a crop is alone, but **pairs it with
   padding** when the crop shares a batch — so the boundary timestep is a
   different function of the image depending on its batch-mates.

Fix landed: `collate_chirho` rounds the canvas up to a multiple of
`WIDTH_DOWNSAMPLE_CHIRHO`, `valid_timesteps_chirho` is a **ceiling** on that
grid, `CRNNChirho.forward` packs the BiLSTM when given widths, and decode +
confidence truncate to those lengths. **RETRACTED — the claim "eval and inference are batch-invariant" was too broad.**
It holds only for the 86 held-out *strings*. `gpt_chirho` produced a direct
counterexample on the default 400-crop production sample: mixed-width batch 32
vs solo differed on **24/400 decoded strings (CPU) / 12/400 (MPS — the count is
backend dependent)**, with confidence differing on ~370/400 up to 0.55, and one
crop crossing the complete pseudo-gold acceptance gate. Reproduced here.

Root cause of the *residual*: rounding only the batch **maximum** does not give
each crop a canonical CNN boundary. A narrow crop sharing a canvas with a wider
one still gets extra background columns inside its convolutional receptive
field, and those reach its boundary timestep **before** packing isolates the
BiLSTM. Packing fixes the recurrence; it cannot undo CNN divergence.

**Repair: width-homogeneous batching** (`width_bucketed_batches_chirho`) — batch
only crops of equal padded width, so every crop gets the canvas it would get
alone. Verified on the same 400-crop production sample at batch 8/32/64:
**0/400 string differences vs singleton, max confidence delta 1.7e-06** (float
execution-order noise). Held-out remains 78/86 = 0.9070. Applied to
`score_heldout_chirho`, `infer_word_ocr_chirho.py`, and
`triage_corpus_chirho.py` — the last two generate the pseudo-gold and the
triage output behind `ocr_suggestions_chirho`.

Per-item remains the strict reference; bucketing is what makes batched reads
equal it.

Bucketing by header-derived width keeps this batch-bounded. `gpt_chirho`
exercised it over the **full 10,342-crop corpus** (not a sample): header width
matched `img_to_tensor_chirho` on 10,342/10,342, every index yielded exactly
once, zero mixed-width bucket violations, and peak live collated payload
**3.375 MiB against ~227.5 MiB** for the corpus-wide materialisation it replaced.
Production 400-sample, bs64 vs singleton: 0 string differences on both CPU
(max conf delta 7.6e-06) and MPS (1.2e-06), no 0.90/0.95 gate crossings.

*Correction:* an earlier revision of this file said the pad value "is not the
image background". That is inverted — `img_to_tensor_chirho` does `1.0 - arr`,
so background **is** 0 and the pad is neutral **at the input**. The tail becomes
non-neutral downstream, via CNN/BatchNorm features and the pooling grid, not at
the pixel level. Caught by `gpt_chirho`.

**The deterministic number, and what the published headline actually contained:**

| | exact | vs published |
|---|---|---|
| published headline (batch 32, defective path) | 0.9186 | — |
| deterministic, same gold labels | 0.9070 | −1.2 pts = **batching artifact** |
| deterministic + witness-corrected labels | **0.8488** | −5.8 pts = **label corruption** |
| **total overstatement** | | **−7.0 pts** |

That decomposes the 5.8-vs-7.0 question cleanly: **7.0 points is the full gap
from the published figure; 5.8 of it is label corruption and 1.2 is the padding
artifact.** The fixed path agrees with the old per-item path (78/86), confirming
batch-1 was the correct reference all along.

*Not yet fixed:* `ctc_step_chirho` still passes the full padded length as
`input_lengths` for every item and calls `forward` without widths, so **training
remains length-unaware**. The current checkpoint was trained that way. Evaluation
and inference are now deterministic; a retrain should make the training path
length-aware too, and would need re-measuring afterwards.

*Independent verification status (per item, 2026-08-20):*

| crop | second witness |
|---|---|
| p0150-x1217-y1462 | `gpt_chirho` (audit 557d0c6) — confirmed |
| p0308-x497-y609 | `gpt_chirho` (audit 557d0c6) — confirmed |
| p0291-x378-y1951 | `gemini_chirho` (#14540) — confirmed **יהוה** |
| p0342-x636-y1628 | `gemini_chirho` (#14540) — confirmed **יהוה** |
| p0221-x881-y257 | `gemini_chirho` (#14540) — confirmed **האמרי** |
| p0311-x991-y1510 | `gemini_chirho` (#14540) — confirmed **המטרי** |
| p0244-x1486-y361 | `gemini_chirho` (#14542) — confirmed **איכה** |
| p0323-x937-y2402 | `gemini_chirho` (#14542) — confirmed **שלשם**, zero ink between ש and ם |

**All 8 of 8 corrections are two-witness confirmed** (`gpt_chirho` f6b9b86
independently re-cut p0291/p0342/p0221/p0311 and reproduced the column
arithmetic, centroids 7.18 and 7.33), so the inflation figure is fully
evidenced. p0323 was verified deliberately last: it is the only correction that
runs *against* the defect pattern (gold inserting a yod rather than substituting
one), so confirming it is evidence the audit was reading pixels rather than
pattern-matching to the defect it had already found.

*Batch-padding item:* independently reproduced and extended by `gpt_chirho`
(f6b9b86), which found the second changed string and the code mechanism.
`gemini_chirho` acknowledged rather than reproduced this point.
Artifact: `workspace-chirho/blind-vision-eval-chirho/heldout-witness-audit-chirho.json`.

## 2c. Contamination measurably degrades the real task (2026-08-20)

Attempting to measure the decode fix's blast radius on the shipped corpus
produced a **retraction and two findings**.

**RETRACTED:** an intermediate analysis here reported that ~58% of the 10,342
stored triage readings change under the fixed decode. That number is void — it
compared the current checkpoint against a stored file that the current
checkpoint does not reproduce, so it measured checkpoint drift, not the fix.
Deleted rather than corrected, because the comparison was not meaningful.

**Finding 1 — the shipped reads have a provenance gap.** The readings in
`triage-chirho.json` (which generate `ocr_suggestions_chirho`, now live in prod
D1) do **not** reproduce from `crnn-chirho.pt` + current code: 195/512 at
batch 64, 198/512 solo. They were produced by a model/code state that no longer
exists on disk. Those production suggestions therefore cannot be regenerated or
audited against any checkpoint we hold.

**Finding 2 — the current checkpoint is MORE contaminated than the shipped one,
and that is measurable on the real task.** On the eight crops whose gold labels
are proven wrong:

| | reads the PRINT | reproduces the CORRUPTION |
|---|---|---|
| shipped model (behind prod suggestions) | **4 / 8** | 4 / 8 |
| current checkpoint `aa7a0ff9` | **1 / 8** | 7 / 8 |

The shipped model read **both `יהוה` records correctly**; the current checkpoint
reads neither. Yet on the 629 gold-labelled records the current checkpoint scores
*higher* (0.9873 vs 0.9587 — inflated by training-split memorisation).

**So further fine-tuning against corrupt gold improved the measured score while
degrading true print accuracy on exactly the defect class.** The metric and the
truth moved in opposite directions. This is the concrete harm the §1 mint defect
causes, not a hypothetical one, and it is the strongest argument for
witness-relabelling before any retrain.

**Ninth corrupt label — CONFIRMED** by `gemini_chirho` from the source page:
p0159-x644-y459 prints `דבית` (third letter a short top-hanging yod, zero
ascender); gold `דבלת` is wrong. The shipped model read it correctly; the
current checkpoint reproduces the corruption. **This one sits in the TRAINING
split**, so the mint defect is confirmed on both sides of the split and the
training-split rate is still unmeasured.

**Cost of the decode fix, measured honestly.** The canonical pooling grid is a
real behaviour change, not a no-op: 56 of 86 held-out crops have a width that is
not a multiple of 4. Against the original unrounded solo reference it preserves
**85/86 = 98.8%** of held-out reads with **identical accuracy** (78/86, char
0.9694), but only ~87% on a 512-crop slice of the noisy full corpus — it flips
reads where the model was already unconfident. Exact batch-invariance requires a
canonical grid, and adopting one necessarily changes odd-width crops; the
checkpoint was trained without it, so a retrain should adopt the same grid.

## 2d. The TRAINING split carries the same defect (2026-08-20)

The held-out split is an MD5-hash split of the same gold set on crop names, and
`mint_gold_set_chirho.py` never consults the hash. Under the standard
random-oracle treatment of MD5 over these pre-existing, non-adversarial
filenames, conditioning on n=86 gives an **as-if simple random sample**. (An
earlier revision of this file said the split and corruption are "independent by
construction"; `gpt_chirho` correctly notes that is stronger than a
deterministic hash warrants — **"as-if random, absent adaptive selection"** is
the precise claim. Image-content corruption may well correlate with page/x/y;
the MD5 avalanche severs that structure from allocation.)

> 8/86 = 9.30%, Wilson 95% CI **[4.8%, 17.3%]**
> → **≈59 corrupt labels across all 629 gold records**
> → **≈51 in the 543-record training split**

Count ranges from multiplying the rate interval are **approximate** — a binomial
rate interval is not an exact CI for a fixed finite population. `gpt_chirho`
inverted the exact hypergeometric for the one fixed population sampled without
replacement: **total corrupt 28–106, training-split complement 20–98.** The
conclusion is unchanged.

Independently checked by `gpt_chirho` (audit
`crnn-batch-and-split-independent-audit-2026-08-20-chirho.md`): 629 unique crop
names, 543/86, manual MD5-prefix membership matches `load_gold_split_chirho`
exactly, modelled inclusion probability .150007, and no detectable split relation
to page, x, y or label length (all p>.31). The held-out sample is mildly enriched
for GOLD_OK (tier chi-square p=.0456), but corruption rates are near-identical by
tier — STRICT 3/33 = 9.09%, OK 5/53 = 9.43% — so a tier-stratified estimate lands
at 58.3, essentially the same number.

**Decision boundary (important):** this is enough to stop uncorrected retraining
and to size the remediation. It is **not** enough to identify *which* remaining
labels are safe. Witness / replace / exclude is still required before any
retrain.

**A cheap high-yield screen names them.** Every confirmed corrupt label shows the
same signature: the *shipped* model read the print while the *current* checkpoint
memorised the corrupt gold. Screening all 629 gold records for
`shipped ≠ current AND current == gold AND shipped ≠ gold` yields **20
candidates, 16 of them in the training split**.

Adjudicated all 16 against padded source-page re-cuts: **12 gold-wrong, 4 screen
false positives — 75% precision.** (Calibration held: on the screen's 4 held-out
candidates, 3 were already-confirmed corrupt and 1, p0345, was one I had already
proven *not* corrupt.)

Newly confirmed corrupt **training-split** labels:

| crop | gold | printed | note |
|---|---|---|---|
| p0157-x525-y1473 | להושע | **יהושע** | |
| p0190-x425-y2097 | הארכ | **הארכי** | dropped final yod |
| p0209-x605-y1690 | לבלעמ | **יבלעם** | only ONE lamed ascender; gold needs two |
| p0244-x737-y1309 | אלכה | **איכה** | |
| p0257-x128-y550 | כשלת | **כשית** | |
| p0310-x930-y1792 | למלכ | **ימלך** | only ONE lamed ascender; gold needs two |
| p0332-x369-y2046 | לשנו | **ישנו** | no lamed ascender at all |
| p0347-x669-y1898 | אלתא | **איתא** | |
| p0352-x250-y304 | לשבר | **ישבר** | no lamed ascender |

Plus p0157-x1137, p0159 and p0252-x1190 already confirmed. **Total named across
the gold set: 20** (8 held-out + 12 training).

Two of these are decided by **counting ascenders**, which is as objective as this
gets: `יבלעם` and `ימלך` each show exactly one tall lamed where the gold spelling
requires two.

Screen false positives, for honesty about the tool: p0200 (`קראלה` — first glyph
has a qof descender), p0241 (`ולקחו` — a real lamed ascender is present), p0339
(`ממלט` — gold right, the shipped model *inserted* a yod), and p0238 (`השבי` —
initially recorded here as *probable* gold-wrong; the column-run test was
inconclusive because the glyphs are merged, and at 12x the disputed letter is a
**wide bet**, not a narrow nun. Gold is right and my `השני` was wrong). The screen finds
corrupt labels; it does not certify them. Each still needs a source re-cut.

**Bottom line:** 20 named, ~59 expected across the gold set, and the screen is a
reusable way to surface the rest cheaply — at ~75% precision, so every hit still
needs a source re-cut. Note that the one item this file first recorded as
*probable* turned out to be a false positive: on a width call rather than an
ascender call, only magnification settled it.
Artifact: `workspace-chirho/blind-vision-eval-chirho/training-split-suspects-chirho.json`.

## 3. Benchmark results

All runs blind (crop paths only, labels sealed until scoring), n=40, disjoint
samples from the 308-crop GOLD_STRICT pool. Fable 5's earlier readings were in
the Opus 5 session context, so Opus 5 drew provably disjoint samples
(`--exclude-chirho`) rather than re-reading contaminated crops.

| reader | input | exact | char | corrected exact |
|---|---|---|---|---|
| CRNN (held-out gold) | native crop | 0.9186 | 0.9719 | **0.8488** (−7.0) — see §2b |
| Fable 5 | native crop | 0.800 | 0.939 | **0.900** (4 bad labels in its 40) |
| Opus 5 | native crop | 0.675 | 0.874 | 0.700 (1 bad label) |
| Opus 5 | 6x LANCZOS upscale | **0.850** | **0.957** | 0.850 (0 bad labels) |

Opus 5 native-vs-magnified on same-difficulty samples: **0.675 → 0.850 exact,
0.874 → 0.957 char.** The crops are ~85x24 px; at native size the binding
constraint is resolution, not knowledge. Every native-res miss re-checked at 6x
was read correctly (`ואבלו`, `ולקחו`, `בתרמה`, `ובבאר`, `מגבורתם`, `בפרים`).

Residual Opus 5 misses at 6x: `ואקחם`→ולקחתם, `משפחה`→משפחת, `ולחמס`→ולחממ
(ס/ם closure), `והרקונ`→והירקונ (language prior inserted a yod that isn't
printed), `ותאמרו`→ותאמר (dropped final vav), `מצרימ`→העצים.

## 4. What this does and does not say

- It does **not** say the CRNN is bad. It is a strong reader and still the
  production engine; ~97% of GOLD_STRICT is sound.
- It **does** say the headline number cannot be quoted as print accuracy, and
  that no independent reader can be fairly compared against this gold as-is.
- Vision-model reading is resolution-bound, not competence-bound — feeding
  models the raw tight crop understates them badly.

## 5. Recommended next steps (L.J.'s call — nothing here was changed)

1. Do not re-mint or edit the gold set unilaterally; it is the calibration
   target for several claims.
2. Add a **second witness** at mint time: require a vision read to agree with
   the tesseract skeleton before GOLD_STRICT, or route disagreements to review.
3. Re-cut crops with vertical padding (or reject crops with ink on row 0) so
   ascenders are not clipped and neighbouring-line bleed is separable.
4. Re-state the CRNN metric against a witness-agreed gold before it is used in
   any completion or certification claim, and re-derive the headline pair from a
   named checkpoint rather than carrying it forward by memory.
5. Treat `load_pseudo_gold_chirho` as suspect until (2) lands.

## Artifacts

Harness: `src-chirho/blind-word-read-eval-chirho.ts` (gained `--exclude-chirho`
and `--label-chirho` this session so later readers can draw provably disjoint
blind samples). Readings/scores live in
`workspace-chirho/blind-vision-eval-chirho/` (gitignored, rsync-carried):
`opus5-reads-40-disjoint-chirho.json`, `opus5-score-40-disjoint-chirho.txt`,
`opus5-reads-40-magnified-chirho.json`, `opus5-score-40-magnified-chirho.txt`.
