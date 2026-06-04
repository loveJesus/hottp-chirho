<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Codex Raw Hebrew Pre-Review Chirho

Generated: 2026-06-04
Updated: 2026-06-04

This is a machine-assisted visual precheck, not a human certification. Do not use
this file to decrement the certification gate or apply a clean verdict. It is only
meant to help Hallelujah decide where to look first in the raw Hebrew queue.

Current scope: this file is now a historical pre-review note plus one current
raw Hebrew vol 3 target. The live raw Hebrew vol 3 lane currently has one
pending item:
`http://localhost:8766/?volume-chirho=vol-3-chirho&item-chirho=3%3A151%3A36%3A2`.

Earlier vol 3 notes below are marked superseded where later repairs moved the
text into the expert/vision lane or resolved an open human issue. The live
review servers and certification status remain authoritative.

## Current Raw Vol 3 Target

- `vol 3 p151 L36 S2`:
  `http://localhost:8766/?validation-status-chirho=unvalidated-chirho&tier-chirho=primary-vols-3-5-chirho&item-chirho=3%3A151%3A36%3A2`
  - Live text: `גְּבוּל`
  - Current line text: `γεῖσος mot qui réapparaît en Éz 43,13.17 pour 13, en 1R 7 9 pour גְּבוּל et en Jr`
  - Visual precheck: crop is centered on the target word; no obvious crop or segmentation issue. The printed letters and visible pointing look plausible for the live text at review resolution.
  - Human check still needed: exact niqqud/marks against the print.

## Raw Attention-Lane Visual Precheck

These are machine visual prechecks from the new raw Hebrew attention lanes. They
are not certification, not a clean verdict, and not a substitute for the live
validator. They are only meant to save the human reviewer from re-triaging why a
span was surfaced.

- `vol 2 p148 L11 S1`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=2%3A148%3A11%3A1`
  - Live text: `(וְיַסִּירֵנִי)`
  - Attention reason: low direct-read confidence plus delimiter notation.
  - Visual precheck: the crop visibly contains a parenthesized Hebrew word matching the stored consonants at review resolution. The low CRNN score looks like a witness weakness, not an obvious transcription defect.
  - Human check still needed: exact vowels/marks and whether the parentheses are stored in the intended logical span.

- `vol 2 p148 L22 S1`:
  `http://localhost:8766/?attention-chirho=delimiter-notation-chirho&item-chirho=2%3A148%3A22%3A1`
  - Live text: `[מ̇ק̇[י`
  - Attention reason: damaged-text brackets and supralinear dots.
  - Visual precheck: the crop clearly shows damaged-text notation with brackets/dots; this is not ordinary continuous Hebrew and should be treated as DSS/Qumran notation, not rubber-stamped as a simple word.
  - Human check still needed: exact bracket order, dot codepoint convention, and whether this belongs with a DSS/Qumran-capable reviewer.

- `vol 1 p149 L10 S1`:
  `http://localhost:8766/?attention-chirho=no-direct-read-chirho&item-chirho=1%3A149%3A10%3A1`
  - Live text: `נִכְרְתוּ מֵי הַיַּרְדֵּן`
  - Attention reason: no direct CRNN crop read and partial token validation.
  - Visual precheck: the crop is a broad multi-word Hebrew phrase in an apparatus line; no obvious swallowed neighboring Latin/symbol span or clipped Hebrew word is visible. Treat this as a real human review target, not an automatic hidden-text repair.
  - Human check still needed: exact multi-word text, vowels/marks, and whether the shorter `מֵי` form is what the print says here.

- `vol 1 p149 L11 S1`:
  `http://localhost:8766/?attention-chirho=no-direct-read-chirho&item-chirho=1%3A149%3A11%3A1`
  - Live text: `נִכְרְתוּ מֵימֵי הַיַּרְדֵּן`
  - Attention reason: no direct CRNN crop read and multi-token Hebrew span.
  - Visual precheck: the target crop is a broad Hebrew phrase after French `dittographie de`; no obvious clipping or swallowed neighboring French is visible. This line appears to contrast with the prior shorter `מֵי` form, so do not merge the two notes.
  - Human check still needed: exact multi-word text, vowels/marks, and whether the longer `מֵימֵי` form is what the print says here.

- `vol 2 p149 L19 S3`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=2%3A149%3A19%3A3`
  - Live text: `אָמַר`
  - Attention reason: low direct-read confidence.
  - Visual precheck: the crop is centered on the short Hebrew word and no obvious segmentation problem is visible.
  - Human check still needed: exact vowels/marks and letter confirmation.

- `vol 2 p150 L37 S1`:
  `http://localhost:8766/?attention-chirho=delimiter-notation-chirho&item-chirho=2%3A150%3A37%3A1`
  - Live text: `(לְמִקְדָּשׁ`
  - Attention reason: delimiter notation.
  - Visual precheck: the crop includes the opening parenthesis and the Hebrew word; the following French `au vs 14)` is outside the Hebrew box, so the closing parenthesis is not part of this span's target crop.
  - Human check still needed: exact vowels/marks and whether the opening parenthesis belongs inside the Hebrew span or should be treated as adjacent punctuation.

- `vol 2 p150 L39 S1`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=2%3A150%3A39%3A1`
  - Live text: `מַעֲרִיץ`
  - Attention reason: low direct-read confidence.
  - Visual precheck: the crop visibly contains the target Hebrew word between French context; no obvious extra or missing word is visible.
  - Human check still needed: exact final letters and pointing, especially the tight yod/tsade region.

- `vol 5 p149 L28 S1`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A149%3A28%3A1`
  - Live text: `ליץ`
  - Attention reason: low direct-read confidence.
  - Visual precheck: the crop visibly contains a short Hebrew root matching the stored consonants at review resolution.
  - Human check still needed: exact letters and whether the bare consonantal form is the intended transcription.

- `vol 5 p148 L25 S5`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A148%3A25%3A5`
  - Live text: `מְלִיצַי רֵעָי`
  - Attention reason: multi-token Hebrew span.
  - Visual precheck: the target crop cleanly boxes the two Hebrew words after the slash; the following period is already its own neighboring French/punctuation span. No additional maqqef-like repair is visible in this target crop.
  - Human check still needed: exact consonants, niqqud, word spacing, and whether the two-word span should stay grouped for this apparatus line.

- `vol 5 p149 L2 S3`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A149%3A2%3A3`
  - Live text: `יִמְצָא רֵעִי`
  - Attention reason: low direct-read confidence and multi-token Hebrew span.
  - Visual precheck: the crop is centered on the two Hebrew words after `𝔊 :`; the adjacent French word `quand` starts outside the box, so no obvious French bleed or missing Hebrew neighbor is visible.
  - Human check still needed: exact vowels/marks and confirmation that the two printed words match the stored text.

- `vol 5 p150 L4 S1`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A150%3A4%3A1`
  - Live text: `יָמַי`
  - Attention reason: low direct-read confidence.
  - Visual precheck: the crop is centered on the word and the visible letters/points look plausible for the stored text.
  - Human check still needed: exact niqqud/marks.

- `vol 5 p150 L5 S1`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A150%3A5%3A1`
  - Live text: `נִזְעָכוּ`
  - Attention reason: low direct-read confidence.
  - Visual precheck: the crop is centered on the word and no obvious segmentation issue is visible.
  - Human check still needed: exact consonants and pointing, especially the `כ/ק` class distinction.

- `vol 5 p150 L10 S1/S3`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A150%3A10%3A1`
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A150%3A10%3A3`
  - Item IDs: `v5-p0150-l010-s1`, `v5-p0150-l010-s3`
  - Live texts: `עָמִי` and `יָמַי`
  - Attention reason: low direct-read confidence on both short words.
  - Visual precheck: the two crops sit in the expected French phrase "d'abord ... au lieu de ..."; no word swap or segmentation defect is obvious from the packet crops.
  - Human check still needed: exact letters/marks for both short words.

- `vol 5 p150 L11 S2`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A150%3A11%3A2`
  - Live text: `נִזְעָכוּ`
  - Attention reason: low direct-read confidence.
  - Visual precheck: the crop is centered on the word and no obvious segmentation issue is visible.
  - Human check still needed: exact consonants and pointing, especially the `כ/ק` class distinction.

- `vol 5 p150 L11 S4/S6`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A150%3A11%3A4`
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=5%3A150%3A11%3A6`
  - Item IDs: `v5-p0150-l011-s4`, `v5-p0150-l011-s6`
  - Live texts: `קְבָרִים` and `קְבָרִים`
  - Attention reason: low direct-read confidence on both occurrences.
  - Visual precheck: the line is an "au lieu de" comparison with two separately boxed occurrences of the same Hebrew word. Both target crops are centered on their respective Hebrew words; the surrounding French `et enfin`, `au lieu de`, and `Elle traduit` sit outside the boxes.
  - Human check still needed: exact vowels/marks for both occurrences, and whether the printed punctuation after the second occurrence is represented in the intended neighboring span.

- `vol 2 p152 L12 S1`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=2%3A152%3A12%3A1`
  - Live text: `בָּהּ`
  - Attention reason: low direct-read confidence on a short Hebrew word.
  - Visual precheck: the crop tightly boxes the short Hebrew word after `8,21` and before the apparatus sigla; no adjacent Latin/symbol text appears swallowed into the Hebrew box.
  - Human check still needed: exact consonants and pointing, especially the final he/mappiq-class detail.

## Historical Superseded Notes

- `vol 3 p149 L25 S1/S3`:
  - Superseded by the hidden-text repair script `repair-vol3-p149-l25-micah-hidden-hebrew-2026-06-04-chirho.ts`.
  - The old separate raw Pass-C islands `וְתוּשִׁיָּה` and `יִקְרָא` were not clean standalone certification targets. The line now stores the continuous Micah 6:9 quote `קוֹל יְהוָה לָעִיר יִקְרָא וְתוּשִׁיָּה יִרְאֶה שְׁמֶךָ` as `vision-chirho`.
  - Certification remains pending through the Hebrew/WLC expert lane; these old notes must not be used as raw-Hebrew clean verdicts.

- `vol 3 p151 L10 S1/S3`:
  - Superseded by `repair-vol3-p151-l10-syriac-expert-placeholder-2026-06-04-chirho.ts`.
  - The Hebrew word `שִׁלְחוֹת` was reboxed and moved to `vision-chirho` for Hebrew/WLC expert confirmation. The same line also has a boxed blank Syriac span, `v3-p0151-l010-s3`, waiting for a Syriac reader to supply exact UTF-8 text.
  - The current structural blank is intentionally blocking strict export; use the Syriac handoff document, not this raw pre-review note, for that item.

- `vol 3 p151 L21 S2`:
  - Superseded by the hidden-text repair script `repair-vol3-p151-l21-hidden-greek-hebrew-2026-06-04-chirho.ts`.
  - The old raw Pass-C span was not a clean `אֶת־עַמִּי` target; its crop showed the neighboring Hebrew word. The line now stores `נְשִׂיאֵי אֶת־עַמִּי` as `vision-chirho`, plus the swallowed Greek `μου` and printed period.
  - Certification remains pending through the expert/vision review lane; this pre-review note should not be used as a raw-Hebrew clean verdict.

- `vol 3 p151 L46 S2`:
  - Superseded by `repair-open-human-letter-issues-2026-06-04-chirho.ts`.
  - The old raw text `פְּאֵר` was flagged by human review as wrong letters/vowels. The line now stores consonantal `אתיק` as `vision-chirho` with exact vowels/marks pending Hebrew/WLC expert confirmation.
  - This note must not be used to validate the former `פְּאֵר` span.

## Result

No review verdicts were recorded. Certification remains pending on the live human
review and expert-confirmation workflows.
