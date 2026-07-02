<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Script Reviewer Quickstarts Chirho

This is a role-specific handoff for human reviewers. It is not a certification record and does not decrement any gate by itself. The live review servers and the certification status gate remain authoritative.

## Shared Rule

Confirm only exact printed text inside the red target box. If the crop, box, script, letters, marks, spacing, punctuation, or competence boundary is uncertain, skip or report an issue. Do not use a clean confirmation to mean "probably right."

## Hebrew/WLC Reviewer

Use raw Hebrew at `http://localhost:8766/` and the Hebrew expert lane at `http://localhost:8771/?script-chirho=hebrew-chirho`.

- In raw Hebrew, a clean save requires the clean-certification acknowledgement. No checked issue boxes plus no acknowledgement is rejected.
- Verify base letters, final forms, vowels/niqqud, dagesh, mappiq, shuruk, shin/sin dots, accents/meteg, maqqef, punctuation, word order, and segmentation against the print.
- A dot inside a Hebrew letter is vowels/niqqud, not accents/meteg.
- Several words in one box can be correct only when the box intentionally covers exactly those printed words and the stored text has the correct logical order and separators.
- Hebrew-script Aramaic/Targum is not ordinary Hebrew for certification. Confirm clear consonants only when appropriate; route exact vocalization or Targum wording to a competent Aramaic/Targum reviewer.

## Greek Reviewer

Use `http://localhost:8771/?script-chirho=greek-chirho`.

- Confirm exact Greek letters, breathings, accents, iota subscripts, final sigma, punctuation, and word boundaries.
- Check whether the target box includes the whole Greek word or phrase and excludes apparatus symbols that belong to the Latin/symbol lane.
- Do not normalize a printed variant to a standard edition reading. Confirm what Barthelemy printed.

## Syriac Reader

Use `http://localhost:8771/?script-chirho=syriac-chirho`. For the blank item, use `http://localhost:8771/?script-chirho=syriac-chirho&text-state-chirho=blank-chirho`.

- Confirm exact Syriac letters, joined forms, dots, seyame, vowels if present, punctuation, and word boundaries.
- Blank items must receive expert-supplied text before confirmation. Supplying text fills the hole only; it is not a confirmation.
- Non-readers may report crop, routing, or segmentation issues, but must not confirm Syriac letters or marks.

## Arabic Reviewer

Use `http://localhost:8771/?script-chirho=arabic-chirho`.

- Confirm exact Arabic letters, dots, vowels/marks, tatweel, punctuation, and word boundaries.
- Check that French punctuation and verse references outside the Arabic box are not pulled into the Arabic span.
- Non-readers may flag crop, routing, or segmentation issues, but must not confirm Arabic letters or marks.

## Latin/Symbol Reviewer

Use `http://localhost:8770/`.

- Review French, Latin non-French, references, witness sigla, apparatus operators, ornaments, and punctuation directly against the crop and full line.
- Witness sigla are content, not decoration. A wrong siglum can assign a reading to the wrong witness.
- Digits and references matter. A wrong digit can point to the wrong citation or manuscript.
- Symbol risk filters are triage aids only. Human clean acceptance still requires exact visual agreement.

## Segment Repair Proposals

Use the raw Hebrew segment repair proposal panel when a line needs split, merge, rebox, script change, provisional text, punctuation attachment, or unreadable-script handling. A saved repair proposal is draft-only: it records proposed geometry and rationale, but it does not edit live spans and does not certify text.
