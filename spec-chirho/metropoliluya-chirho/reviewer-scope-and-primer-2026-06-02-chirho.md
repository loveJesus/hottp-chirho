<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Reviewer Scope And Primer Chirho

This guide keeps the certification boundary honest: use primers to orient your eye, but only certify text that is inside the reviewer’s real competence.

## Current Review Lanes

- Current counts move as reviews land; trust `workspace-chirho/certification-status-chirho/status-chirho.md` for live totals and pending counts.
- Hebrew/WLC and Greek: Hallelujah can work these first. Use `http://localhost:8766/` for raw Hebrew spans and `http://localhost:8771/` filtered to `hebrew-chirho` or `greek-chirho` for vision-tier expert confirmations.
- Hebrew-script Aramaic/Targum: do not treat this as ordinary Hebrew. Confirm consonants if clear, but route exact Aramaic vocalization, dagesh/sheen-dot details, and Targum wording to a Targum/Aramaic reviewer.
- Syriac: route to a Syriac reader. A non-reader can spot obvious crop/context problems, but should not certify letters, vowel points, or Peshitta punctuation.
- Arabic: route to an Arabist. A non-reader can spot segmentation/crop problems, but should not certify letters, dots, vowels, or lexical choices.
- Latin/symbol vision: use `http://localhost:8770/`. The `Symbol risk` filter separates accepted/pending trivial punctuation-like items from witness sigla, references, and ornament guesses that require actual proofread decisions.

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

## Raw Hebrew Validator Semantics

- Use the raw Hebrew validator for spans inside your Hebrew competence, but do not treat machine witnesses as certification. The crop and full line are the authority.
- `Continue` with no issue flags is a clean certification only when the clean-certification checkbox is also checked. If that checkbox is not checked, the server rejects the save.
- If anything is uncertain, do not clean-certify it. Either select the relevant issue flag with notes, or skip it for later review.
- `Letters` means a wrong consonant or base letter.
- `Vowels/niqqud` includes vowel points plus dagesh, mappiq, shuruk, and shin/sin dots.
- `Accents/meteg` means cantillation marks and meteg. It does not include dagesh, mappiq, shuruk, or shin/sin dots.
- `Hebrew punct.` includes maqqef, sof pasuq, Hebrew-side quote marks, and citation punctuation that belongs with the Hebrew span.
- `Segmentation` includes wrong boxes and wrong split/merge decisions: multiple Hebrew words lumped into one span, one word split across spans, spaces missing inside a span, or punctuation attached to the wrong neighboring span.
- A dot in the middle of a Hebrew letter is usually dagesh or mappiq; inside vav for `וּ` it is shuruk. These are `Vowels/niqqud`, not `Accents/meteg`.

## Primer Links

- Syriac script orientation: HMML School’s Serto lesson is useful for shape recognition and distinguishes Serto from Estrangela: https://hmmlschool.org/syriac-serto/
- Syriac alphabet table: Syriac World gives an alphabet table with Estrangela, Serto, Unicode, and letter names: https://www.syriac.world/
- Aramaic/Targum reference: CAL is the scholarly lexicon/corpus tool; its guide covers lexicon lookup, Peshitta browsing, and Targum browsing: https://cal.huc.edu/cal_new_user_guide.html
- Targum resources: IOTS points reviewers to CAL and Jastrow for Targumic work: https://targum.info/resources/
- Arabic romanization/reference boundary: the Library of Congress notes that Arabic romanization decisions use LC tables plus standard dictionaries and expert judgment when uncertain: https://www.loc.gov/catdir/cpso/arabic1.pdf

## Local Orientation Boundaries

These notes are only for orientation and triage. They do not make a non-reader competent to certify the scripts.

| Lane | What a non-reader can safely flag | What requires the expert |
|---|---|---|
| Syriac | Wrong script lane, clipped crop, missing box, obvious French/Greek/Hebrew bleed, or a blank span that needs a reader. Syriac is right-to-left and connected; plural dots/other dots can be visible above letters. | Exact letters, joined forms, dots, vowels, punctuation, word spacing, and whether a mark is part of the printed Syriac text. |
| Arabic | Wrong crop or segmentation, obvious clipping, French punctuation accidentally boxed into Arabic, or Arabic text spilling into a neighboring span. Arabic is right-to-left and connected; dot placement changes letters. | Exact letters, dot counts/positions, vowels, hamza/alif forms, ta marbuta vs ha, tatweel, punctuation, and lexical choice. |
| Hebrew-script Aramaic/Targum | Clear consonants if the print is legible and the issue is only crop/segmentation. Treat the item as related to Hebrew script, not as ordinary Hebrew vocabulary. | Exact Targum wording, vowels, dagesh, shin/sin dots, shewa choices, final-letter ambiguity, and whether a standard text is being followed or only corroborating the print. |

For the current blank Syriac blocker, use `spec-chirho/metropoliluya-chirho/syriac-blank-transcription-handoff-2026-06-04-chirho.md`. The handoff exists to make the unknown visible and actionable; it is not a proposed transcription.

## Confirmation Rule

Confirm only when the printed line and stored text agree at the level the queue is asking for. For non-Latin vision-tier items, that means the expert confirms the exact letters and relevant marks against the print, not merely that the word is plausible from a standard text.
