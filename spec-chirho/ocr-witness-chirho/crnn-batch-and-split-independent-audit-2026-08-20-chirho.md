<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Independent CRNN batching and hash-split audit

Date: 2026-08-20  
Auditor: `HOTTP_CHIRHO/gpt_chirho`

## Verdict

The narrow held-out string claim in `36b1a0c` reproduced, but its original
inference-wide claim did not. On the default 400 un-gold inference sample,
mixed-width batch 32 changed 24 strings on CPU and crossed one complete
pseudo-gold acceptance gate. Claude reproduced and retracted that claim.

The width-homogeneous repair in `ae29b24` does reproduce. Batching only crops
with the same canonical padded width preserved all 400 strings against the
singleton reference on CPU and MPS. Confidence differences fell to ordinary
floating execution-order noise and crossed neither the `0.90` triage threshold
nor the `0.95` pseudo-gold threshold.

The held-out corruption-rate estimate is statistically usable for deciding
that remediation is necessary. The split is best described as **as-if random**:
MD5 is deterministic, but unique pre-existing crop names are hashed without
using label text or quality, and no evidence shows adaptive naming or gold
selection based on split membership. Conditional on the observed sample size,
the random-oracle model is a simple random sample of the 629-record gold set.

The estimate does not identify safe training labels. It supports stopping
uncorrected retraining and sizing the remediation; it does not remove the need
to witness, replace, or exclude labels before retraining.

## Batch-path evidence

### Held-out 86

- Batch sizes `1, 2, 3, 4, 8, 16, 32, 86` under `36b1a0c` produced the same
  86-string SHA-256:
  `e790f8ee937b3f1f3eac6c73a22f13baa906382f66ed9c95c2757a14212dc5d8`.
- Twenty shuffled orders across seven non-singleton batch sizes produced zero
  string differences in 140 sweeps.
- All 34 attainable held-out canvas widths, plus forced widths 512 and 1024,
  produced zero held-out string differences.
- The broad claim still failed because batch 1 versus 86 changed every valid
  prefix logit tensor and every confidence; maximum absolute differences were
  `5.1051` for logits and `0.01104` for confidence.

### Default 400 un-gold inference sample

Before width bucketing, batch 1 versus mixed-width batch 32 on CPU produced:

- 24/400 changed strings;
- 379/400 changed confidences;
- maximum confidence delta `0.61549`, mean delta `0.02056`;
- eight crossings of confidence `0.95`; and
- one complete pseudo-gold gate crossing:
  `p0188-x288-y2051-chirho.png`, singleton `רחמור` / `0.90777` / `substr`,
  mixed batch `חמור` / `0.99380` / `exact`.

Using the committed `width_bucketed_batches_chirho` helper at batch sizes 8,
32, and 64 produced zero string differences against singleton. On CPU the
largest confidence delta was `7.63e-6`; on MPS at batch 64 it was `1.19e-6`.
Neither backend produced a `0.90` or `0.95` threshold crossing.

`score_heldout_chirho` reproduced the same metrics at every tested batch size
from 1 through 86: exact `78/86 = 0.906976744`, character `0.969387755`.
With all eight print-witness corrections folded through `fold_chirho`, the
score is exact `73/86 = 0.848837209`, character `0.956743003`.

The canonical-grid path changes one held-out string relative to the original
unrounded singleton path (`p0252-x820-y1049`, `עפוו` to `אפוו`) while leaving
both published-label metrics unchanged. This confirms the grid has a behavior
cost even though the aggregate exact and character scores happen to match.

### Remaining implementation boundaries

- `ctc_step_chirho` still calls model forward without widths and supplies the
  shared padded timestep count to CTC. A direct in-memory smoke step completed
  with finite loss, confirming compatibility, but training remains
  intentionally length-unaware.
- `triage_corpus_chirho.py` now materializes every resized tensor before
  bucketing. The current 10,342-record corpus carries about 227.5 MiB of raw
  tensor payload, before Python and allocator overhead. Correctness improved,
  but memory growth changed from batch-bounded to corpus-sized. A bounded
  version should bucket lightweight path/size metadata first and materialize at
  most one inference batch at a time.

## Independent p0159 print witness

For `p0159-x644-y459-chirho.png`, an exact `108x36+644+459` re-cut from Volume 1
page 159 has ImageMagick absolute error `AE=0` against the corpus crop. A padded
6x re-cut shows print `(ד)בית`, not gold `(ד)בלת`. The disputed yod has no lamed
ascender; the merged tav/yod component contains no ink in rows 0–5, while its
neighboring body begins at rows 6–7. This independently confirms the ninth
label defect reported at that stage; after p0238 was correctly rejected, the
current confirmed total is 20.

## Hash-split inference

`load_gold_split_chirho` hashes only each unique crop filename. It takes the
first 24 MD5 bits, reduces modulo 1000, and assigns residues 0–149 to held-out.
The exact modeled inclusion probability is `0.1500070`; the realized split is
86 held-out and 543 training records. Manual recomputation matched membership
for all 629 unique names.

The mint path does not inspect this hash or split. It selects records from
Tesseract/WLC agreement before the training code applies the filename hash.
The later witness audit covered all 86 held-out records, rather than a
quality-selected subset.

Simple diagnostics found no relation between split membership and page,
horizontal coordinate, vertical coordinate, or label length (`p > 0.31` for
each point-biserial check). The held-out set contains more `GOLD_OK` records
than expected (`53/86`; tier-balance chi-square `p = 0.0456`), but observed
corruption is almost identical by tier:

- `GOLD_STRICT`: `3/33 = 9.09%`;
- `GOLD_OK`: `5/53 = 9.43%`.

The tier-stratified point estimate is therefore essentially unchanged at about
58.3 corrupt records across the gold set.

The reported Wilson calculation reproduces:

- rate: `8/86 = 9.302%`, Wilson 95% interval `[4.789%, 17.296%]`;
- point estimate: `58.51` corrupt records across 629 and `50.51` in the
  remaining 543;
- approximate Wilson-translated ranges: `30–109` overall and `26–94` in
  training.

Because the target is one fixed finite population sampled without replacement,
an exact equal-tail hypergeometric inversion is preferable for count language:

- total corrupt records: 95% confidence set `28–106`;
- corrupt records in the 543-record complement: `20–98`.

The Wilson and finite-population intervals differ modestly and support the same
remediation decision. The report should call the Wilson count ranges
approximate rather than implying that multiplying a rate interval creates an
exact confidence interval for the fixed complement.

Gold manifests, checkpoints, production data, and deployed systems were not
modified by this audit.
