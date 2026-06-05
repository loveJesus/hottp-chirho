<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Raw Hebrew Human Certification Quickstart Chirho

This is a reviewer aid for the Pass-C Hebrew lane. It is not a certification record and does not decrement any gate by itself.

Use the live validator at http://localhost:8766/. Put an explicit human reviewer id in the Reviewer field, for example `hallelujah-chirho`; do not use `human-chirho`, role labels, template text, or a machine id.

## Clean Review

Save as clean only when all of these match the printed crop and full line:

- Base letters and final forms.
- Vowels/niqqud, including dagesh, mappiq, shuruk, and shin/sin dots.
- Accents/meteg, meaning cantillation marks and meteg, not dagesh or shin/sin dots.
- Hebrew punctuation, including maqqef, sof pasuq, quotes, and citation punctuation attached to the Hebrew span.
- Spacing, maqqef, word boundaries, and word order.
- The red box geometry: it covers exactly the printed content represented by the span.
- Script lane: Hebrew, not Syriac, Greek, Arabic, French, symbol, or Targum/Aramaic outside your competence.

If nothing is wrong, leave issue boxes unchecked and check the clean-certification acknowledgement before saving. A clean save is a certification of that exact span, not just a note that it looks plausible.

## When To Flag

Check an issue box whenever anything is wrong or uncertain. Notes should say what you saw and what should be checked next.

- Letters: wrong consonant or base letter, including wrong final form.
- Vowels/niqqud: vowel points, dagesh, mappiq, shuruk, and shin/sin dots. A dot inside a letter belongs here.
- Accents/meteg: cantillation marks and meteg only.
- Hebrew punct.: maqqef, sof pasuq, Hebrew-side quotes, brackets, or citation punctuation.
- Latin punct.: French/Latin-side comma, period, parentheses, brackets, or spacing punctuation.
- Missing Heb.: printed Hebrew is absent from stored text.
- Extra Latin: OCR garbage or Latin text is included where the span should be non-Latin.
- Segmentation: the box or stored text has a wrong split, wrong merge, clipped word, extra word, wrong space, wrong maqqef, or punctuation attached to the wrong span.

## Multiple Words

Several Hebrew words in one span are acceptable only when the box intentionally covers exactly those words and the stored text has the correct logical reading order and separators. A lumped span is not automatically wrong.

Flag segmentation when one of these is true:

- The red box cuts through a word.
- The box includes French/symbol content not represented by the stored Hebrew.
- The box omits a printed Hebrew word that belongs to the quote.
- The stored text has spaces where the print has maqqef, or maqqef where the print has a space.
- The stored text collapses or splits words differently from the print.

## Attribution Cleanup

The Attribution blocked review lane shows older saved rows whose reviewer id is generic, blank, or machine-like. Those rows are read-only in the validator and do not count for certification until they are reattributed or re-reviewed.

Use that lane only when you can honestly identify who made the existing review:

- Inspect the crop and full line again.
- If the row is genuinely yours, enter your explicit reviewer id and a rationale, copy the dry-run reattribution command, run it, inspect the output, then copy/run the apply command.
- If the row is not clearly attributable to you, do not reattribute it. Re-review the item in the pending lane instead.
- Reattribution does not change the reviewed text, verdict, issue flags, or correction status. It only replaces the generic reviewer id with an explicit human attribution.

## Competence Boundary

Hebrew and Greek items can be certified by a reviewer competent in those scripts. Hebrew-script Aramaic/Targum can be checked for clear consonants, but exact Aramaic vocalization and Targum wording should be routed to a Targum/Aramaic reviewer. Syriac and Arabic should be flagged for crop or segmentation problems by non-readers, but exact letters, dots, vowels, and punctuation require the script expert.

When uncertain, skip or save an issue. Do not use a clean review to express "probably right."
