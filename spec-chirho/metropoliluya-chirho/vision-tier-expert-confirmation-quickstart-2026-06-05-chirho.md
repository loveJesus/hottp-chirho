<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Vision-Tier Expert Confirmation Quickstart Chirho

This is a reviewer aid for the non-Latin expert lane, including vision-tier spans and non-Hebrew Pass-C OCR spans. It is not a certification record and does not decrement any gate by itself.

Use the live expert reviewer at http://localhost:8771/. Put an explicit human reviewer id in the Reviewer field and the exact lane role in Reviewer role.

## Source Filter

The Source filter changes review order only; it does not change what confirmation means.

- `explicit-span-chirho`: spans we recovered or boxed from the live span files. Review these as exact printed text, with special care for any repaired hidden-script or re-segmented lines.
- `pass-c-ocr-span-chirho`: non-Hebrew Pass-C OCR spans routed into the expert lane. These often already have text, but still need exact script-reader confirmation against the scanline.
- `d1-derived-chirho`: non-Latin D1 word-derived items. Confirm them only from the displayed scanline and crop, not from the database source alone.

## Target Crop

Use the `Target crop - red box is the item` panel as the exact review boundary. The `Printed line - red box in context` panel shows neighboring text for orientation only. The red box marks the span being reviewed; neighboring punctuation, French text, or other script text outside that box belongs to adjacent spans unless the printed mark is actually inside the red box.

For blank items, supply only the exact script text inside the red box. Do not include surrounding context just because it appears in the full printed line.

## Confirm Only If

Confirm only if you are competent for the displayed script and the current text exactly matches the printed scanline.

- Hebrew/WLC reviewer: confirm exact Hebrew letters, final forms, vowels, dagesh/mappiq/shuruk, shin/sin dots, accents/meteg, maqqef, punctuation, and word boundaries. Do not certify Hebrew-script Aramaic/Targum vocalization unless you are competent for it.
- Greek reviewer: confirm exact Greek letters, breathings, accents, iota subscripts, final sigma, punctuation, and word boundaries.
- Syriac reader: confirm exact Syriac letters, dots, vowels, seyame, punctuation, and word boundaries.
- Arabist: confirm exact Arabic letters, dots, vowels/marks, tatweel, punctuation, and word boundaries.

The confirmation is hash-anchored to the current text and live packet. It certifies the exact item shown, not merely that a standard text or expected reading is plausible.

## Report Issue

Report an issue instead of confirming when anything is wrong or uncertain.

- The crop or scanline does not show the target clearly.
- The box clips the item or includes extra text.
- The script is wrong or mixed in a way the lane does not cover.
- The text has wrong letters, marks, punctuation, word order, or spacing.
- The item has an open issue whose correction has not been resolved.
- You are not the right reader for the exact script or marks.

Issues override confirmations. A flagged item remains pending until the issue is resolved and the item is confirmed again.

## Blank Text

Blank items are known content holes. Do not confirm a blank item.

If a qualified script reader supplies exact text, use the displayed expert-supplied text command path first as a dry run, then apply only after the dry run verifies the source and packet hashes. Applying supplied text fills the blank span but does not confirm it; the item remains in the expert lane until separately confirmed.

## Competence Boundary

A non-reader may flag crop, source image, segmentation, or routing problems, but should not confirm exact letters, dots, vowels, punctuation, or word boundaries for Syriac, Arabic, or another script outside their competence.

When uncertain, skip or report an issue. Do not use confirmation to express "probably right."
