<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Reviewer Scope And Primer Chirho

This guide keeps the certification boundary honest: use primers to orient your eye, but only certify text that is inside the reviewer’s real competence.

## Current Review Lanes

- Hebrew/WLC and Greek: Hallelujah can work these first. Use `http://localhost:8766/` for the 126 raw Hebrew spans and `http://localhost:8771/` filtered to `hebrew-chirho` or `greek-chirho` for vision-tier expert confirmations.
- Hebrew-script Aramaic/Targum: do not treat this as ordinary Hebrew. Confirm consonants if clear, but route exact Aramaic vocalization, dagesh/sheen-dot details, and Targum wording to a Targum/Aramaic reviewer.
- Syriac: route to a Syriac reader. A non-reader can spot obvious crop/context problems, but should not certify letters, vowel points, or Peshitta punctuation.
- Arabic: route to an Arabist. A non-reader can spot segmentation/crop problems, but should not certify letters, dots, vowels, or lexical choices.
- Latin/symbol vision: use `http://localhost:8770/`. The `Symbol risk` filter separates the five trivial punctuation-like items from witness sigla, references, and ornament guesses that require actual proofread decisions.

## Live Tools

- Raw Hebrew validator: `bun run pass-c-human-validate-chirho` then open `http://localhost:8766/`.
- Latin/symbol reviewer: `bun run latin-symbol-vision-review-chirho` then open `http://localhost:8770/`.
- Non-Latin expert reviewer: `bun run vision-tier-expert-review-chirho` then open `http://localhost:8771/`.
- Hallelujah’s Hebrew vision lane: `http://localhost:8771/?script-chirho=hebrew-chirho`.
- Hallelujah’s Greek vision lane: `http://localhost:8771/?script-chirho=greek-chirho`.
- Syriac expert lane: `http://localhost:8771/?script-chirho=syriac-chirho`.
- Arabist lane: `http://localhost:8771/?script-chirho=arabic-chirho`.
- Static raw Hebrew packet: `workspace-chirho/pass-c-hebrew-human-pack-chirho/2026-05-31-chirho/index-chirho.md`.
- Static expert packet: `workspace-chirho/expert-confirm-pack-chirho/2026-05-31-chirho/index-chirho.md`.

## Primer Links

- Syriac script orientation: HMML School’s Serto lesson is useful for shape recognition and distinguishes Serto from Estrangela: https://hmmlschool.org/syriac-serto/
- Syriac alphabet table: Syriac World gives an alphabet table with Estrangela, Serto, Unicode, and letter names: https://www.syriac.world/
- Aramaic/Targum reference: CAL is the scholarly lexicon/corpus tool; its guide covers lexicon lookup, Peshitta browsing, and Targum browsing: https://cal.huc.edu/cal_new_user_guide.html
- Targum resources: IOTS points reviewers to CAL and Jastrow for Targumic work: https://targum.info/resources/
- Arabic romanization/reference boundary: the Library of Congress notes that Arabic romanization decisions use LC tables plus standard dictionaries and expert judgment when uncertain: https://www.loc.gov/catdir/cpso/arabic1.pdf

## Confirmation Rule

Confirm only when the printed line and stored text agree at the level the queue is asking for. For non-Latin vision-tier items, that means the expert confirms the exact letters and relevant marks against the print, not merely that the word is plausible from a standard text.
