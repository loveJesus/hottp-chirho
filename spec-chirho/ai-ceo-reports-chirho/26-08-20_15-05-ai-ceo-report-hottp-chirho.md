<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP AI-CEO Report — 2026-08-20

**Status: a headline accuracy claim has been withdrawn and re-derived. No
production change. A retrain is now blocked pending an owner decision.**

Consensus artifact: drafted by `claude_chirho`, independently verified by
`gpt_chirho` (audits `557d0c6`, `f6b9b86`,
`crnn-batch-and-split-independent-audit-2026-08-20-chirho.md`) and
`gemini_chirho` (broker #14540/#14542/#14591/#14599).

## What changed

The project's OCR engine was reported at **exact 0.911 / char 0.978** on
held-out gold. That number does not survive audit.

| | exact | char |
|---|---|---|
| carried in project memory | 0.911 | 0.978 |
| what the checkpoint actually produced (batch 32) | 0.9186 | 0.9719 |
| deterministic, after fixing a padding defect | 0.9070 | 0.9694 |
| **deterministic + witness-corrected labels** | **0.8488** | **0.9567** |

**The published headline overstated real print accuracy by 7.0 points**, of
which 1.2 was an evaluation defect and 5.8 was corrupt training/eval labels.

## Why

`mint_gold_set_chirho.py` mints gold as tesseract text admitted by WLC
membership. That proves the string is *a* real Hebrew word, never that it is *the
word printed in the crop*. A tesseract misread landing on another valid form is
canonised. The dominant defect is lamed-for-yod, caused by ink bleeding down from
the line above into flush-cut crops.

`train_word_ocr_chirho.py` trains on and scores against the same manifest, so the
defect was invisible to the metric.

**20 corrupt labels are now named and pixel-verified** (8 held-out, 12 training),
each against a padded source-page re-cut, each with two or more agents agreeing.
Two are the divine name יהוה mislabelled להוה.

## The finding that matters most

Contamination is not a theoretical concern — it **measurably degraded the
model**. On the proven-corrupt crops:

| | reads the PRINT | reproduces the CORRUPTION |
|---|---|---|
| shipped model (behind prod suggestions) | 4 / 8 | 4 / 8 |
| current checkpoint | 1 / 8 | 7 / 8 |

Further fine-tuning against corrupt gold **improved the measured score while
worsening true reading**. The metric and the truth moved in opposite directions.

## Scale

Held-out is an MD5-on-filename split, so it is an as-if random sample:
**9.3% corruption → ~59 bad labels across the 629 gold records** (exact
hypergeometric 28–106). This sizes the remediation and rules out uncorrected
retraining; it does **not** identify which remaining labels are safe.

## Fixed this session (no production change)

- **Evaluation and inference are now deterministic.** A padding defect made
  reads depend on batch size *and* hardware; 12–24 of 400 production crops
  changed. Repaired by width-homogeneous batching, verified 0/400 divergence.
- Same repair applied to the inference and triage paths, which generate
  pseudo-gold and the production suggestions.
- Batch-bounded memory restored after a regression introduced during that fix.

## Risks for the owner

1. **Prod provenance gap.** The suggestions live in prod D1 came from a
   model/code state no longer on disk (195/512 reproduce). Reviewers are acting
   on reads we cannot regenerate or audit.
2. **Training is still length-unaware** (`ctc_step_chirho` passes full padded
   lengths). Fixing it implies a retrain.
3. **Automated detection does not work.** An ascender-count screen reached only
   73% because vocalisation points sit above letters. Finding the remaining ~39
   bad labels is human-in-the-loop work.

## Decisions required (owner)

1. Re-mint gold behind a second (vision) witness — build vs defer.
2. Witness / replace / exclude the corrupt labels, then retrain.
3. Regenerate the prod suggestions, or mark them provisional to reviewers.
4. Make the training path length-aware as part of any retrain.

Nothing in gold, models, or production was modified.
