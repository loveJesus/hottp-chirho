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
labels:**

| labels | exact | char |
|---|---|---|
| as-published gold | 78/86 = 0.9070 | 0.9694 |
| **witness-corrected** | **73/86 = 0.8488** | **0.9567** |
| delta | **−0.058** | **−0.013** |

**So the direction is inflation and the magnitude is about 5.8 points of exact
accuracy.** 7 of the 8 corrupt labels are false passes — the CRNN reproduces
the corrupt reading and is scored correct. Only p0308 is a false fail. The
earlier cancellation argument held only because it rested on the 2 defects the
heuristic screen happened to surface; with the full split witnessed, the false
passes dominate almost 7:1.

*Reproducibility wrinkle:* `score_heldout_chirho` (batched) reports 79/86 while
a per-item loop on the same labels and checkpoint gives 78/86 — one prediction
changes with batch padding. The delta above is computed within one consistent
loop, so it is unaffected, but the headline is not stable to batching either.

*Standing:* one witness (Opus 5) plus objective pixel tests, not yet
independently re-verified item-by-item. The two divine-name records are the
most consequential and should be checked first.
Artifact: `workspace-chirho/blind-vision-eval-chirho/heldout-witness-audit-chirho.json`.

## 3. Benchmark results

All runs blind (crop paths only, labels sealed until scoring), n=40, disjoint
samples from the 308-crop GOLD_STRICT pool. Fable 5's earlier readings were in
the Opus 5 session context, so Opus 5 drew provably disjoint samples
(`--exclude-chirho`) rather than re-reading contaminated crops.

| reader | input | exact | char | corrected exact |
|---|---|---|---|---|
| CRNN (held-out gold) | native crop | 0.9186 | 0.9719 | **0.8488** — see §2b |
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
