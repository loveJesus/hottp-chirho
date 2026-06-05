<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Latin/Symbol Human Review Quickstart Chirho

This is a reviewer aid for the Latin/symbol lane. It is not a certification record and does not decrement any gate by itself.

Use the live reviewer at http://localhost:8770/. Put an explicit human reviewer id in the Reviewer field, for example `hallelujah-chirho`; do not use `human-chirho`, role labels, template text, or a machine id.

## Clean Review

Accept as clean only when the crop, full line, current text, codepoints, script, and box all match the print exactly.

- French and Latin words matter. Proper names, accents, ligatures, apostrophes, and case are transcription content.
- Witness sigla matter. Fraktur/math letters such as M/G/V/S/T-style sigla can name different witnesses and must not be treated as decoration.
- Digits and references matter. A wrong digit in a verse reference or manuscript number is a real transcription error.
- Apparatus operators matter. Signs such as `=`, `+`, `//`, `:`, and parentheses can be meaningful even when visually simple.
- Ornament and dingbat codepoints require review. A printer's ornament should not be accepted as a guessed icon without a transcription decision.
- The displayed image path and crop are part of the review. If the crop is clipped, includes the wrong item, or points to the wrong line, flag it.

If nothing is wrong, leave issue boxes unchecked and check the clean-acceptance acknowledgement before saving. A clean save is an exact item decision, not a note that the text is plausible.

## When To Flag

Check an issue box whenever anything is wrong or uncertain. Notes should say what you saw and what should be checked next.

- Letters: wrong base letters, digits, witness sigla, final sigma, diacritics, or codepoint choice.
- Punctuation: wrong comma, period, bracket, quote, operator, apparatus sign, or ornament codepoint.
- Spacing: missing or extra space between words, references, sigla, or operators.
- Wrong script: the item belongs in a different review lane.
- Segmentation: wrong split, wrong merge, clipped item, extra item, or wrong crop.
- Garbled text: the stored item is unreadable or not what the print shows.
- Missing text: printed text or symbol is absent from the stored item.
- Extra text: stored text includes pixels that are not part of this item.
- Wrong language: the script is plausible, but the item is in the wrong language/category.

## Symbol Risk

The symbol filters are triage aids, not blanket permission.

- Trivial punctuation is quick to verify, but still must be checked against the crop.
- Script/siglum symbols include real letters or witness sigla and can change the apparatus meaning.
- Nontrivial symbols include references, ornaments, operators, and codepoint-sensitive marks that need visual review.

When uncertain, skip or save an issue. Do not use clean review to express "probably right."
