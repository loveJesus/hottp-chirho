<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Provenance of "509 words @ 93.7 mean confidence" (answering AICEO #14613)

AICEO asked whether the corrupt-gold finding touches this outward-facing stat —
specifically whether WLC-membership admission appears anywhere in its pipeline.

## Direct answer

**No. The stat's pipeline contains no WLC-membership step**, so the mint defect
(`gold-set-label-integrity-2026-08-19-chirho.md`) does not touch its provenance.
It is self-reported engine confidence, independent of the minted gold.

## But the claim materially misdescribes what was measured

Source: `spec-chirho/tessdata-bakeoff-summary-chirho.md`, a **single-page
tesseract A/B/C configuration bake-off on vol-1 page 148**.

| outward claim | what the row actually is |
|---|---|
| "509 words" | total words tesseract emitted on **one page**, overwhelmingly **French commentary**. Hebrew words on that page: **5** |
| "93.7 mean confidence" | tesseract's own mean word confidence — **not accuracy**, measured against nothing |
| "Apparatus decipherment" | a tessdata config comparison; the row's purpose was choosing `-l fra+heb+grc+lat` over `-l fra` |

## Worse: the showcased Hebrew tokens are mostly misreads

The bake-off cites five "real Hebrew Unicode words" as the unlock, and concludes
"the detections look like real word forms, not tesseract noise". Checked against
padded re-cuts of page 148:

| token | conf | printed | verdict |
|---|---:|---|---|
| `ברלת` | 90.6 | **ברית** (covenant) | **misread** — lamed-for-yod |
| `הברלת` | 73.9 | **הברית** | **misread** — lamed-for-yod |
| `ותצפבם` | 85.1 | **ותצפנם** (*and she hid them*) | probable misread (ב for נ) |
| `קרמתו` | 87.0 | **קומתו** | probable misread (ר for ו) |
| `צפן` | 56.7 | **צפן** | **correct** |

**The only certainly-correct token carries the lowest confidence (56.7); the four
suspect ones score 73.9–90.6.** Within this sample confidence is *anti*-correlated
with correctness, which is precisely why a mean-confidence figure cannot stand in
for accuracy.

Two of the five are the same lamed-for-yod defect documented in the main report —
which is the deeper connection AICEO's question was reaching for. Not shared
plumbing, but **the same failure mode**: "it looks like a real Hebrew word" was
treated as evidence that it is the *printed* word. That is the membership-not-
identity error in miniature, appearing here in prose rather than in code.

## Recommendation

**Do not quote the stat outward in its current form.** It is not an accuracy
figure, the word count is not apparatus words, and the illustrative tokens are
mostly wrong. If a claim is wanted from this work, it should be built from the
witness-verified ledger, not from this row.

Nothing was modified; this is an assessment only.
