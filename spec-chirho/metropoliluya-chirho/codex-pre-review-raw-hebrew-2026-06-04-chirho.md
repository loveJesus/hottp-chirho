<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Codex Raw Hebrew Pre-Review Chirho

Generated: 2026-06-04
Updated: 2026-06-05

This is a machine-assisted visual precheck, not a human certification. Do not use
this file to decrement the certification gate or apply a clean verdict. It is only
meant to help Hallelujah decide where to look first in the raw Hebrew queue.

Current scope: this file is now a historical pre-review note plus selected
current raw Hebrew targets. The live raw Hebrew vol 3 lane currently has one
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

## Raw Vol 1 Spot-Check Visual Precheck

This item is in the all-token spot-check lane. The token witness is useful
evidence, not certification.

- `vol 1 p152 L4 S4`:
  `http://localhost:8766/?validation-status-chirho=all-token-validated-chirho&tier-chirho=spot-check-chirho&volume-chirho=vol-1-chirho&item-chirho=1%3A152%3A4%3A4`
  - Live text: `למשפחות`
  - Current line text: `7,17A מִשְׁפַּחַת [D] MT // spont : m t plur / schem (assim 14) : G VS clav למשפחות`
  - Visual precheck: the crop cleanly boxes the final Hebrew word after `clav`; the neighboring sigla and French/Latin apparatus text sit outside the target box, and no obvious clipping or swallowed text is visible.
  - Human check still needed: exact consonants and whether the bare consonantal spelling is what the print intends in this apparatus context.

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

- `vol 5 p148 L29 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A148%3A29%3A1`
  - Live text: `מִלִּין`
  - Attention reason: none; this is the first current raw item in the no-pre-review-note lane.
  - Visual precheck: the packet target crop cleanly boxes the single Hebrew word between French `de` and `quand`; no adjacent French text, punctuation, or hidden neighboring Hebrew appears swallowed into the red box at packet resolution.
  - Human check still needed: exact letters, niqqud, dagesh, and whether this short Job-related form is exactly what the print says here. The direct OCR read is only a weak aid and should not be used as certification.

- `vol 5 p150 L6 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A150%3A6%3A1`
  - Live text: `קְבָרִים`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the target crop boxes the Hebrew word after `17,1C`; the following `{B}` witness marker begins outside the red box, and the `𝔐 𝔗 // facil-styl...` apparatus text is outside the Hebrew span.
  - Human check still needed: exact consonants, niqqud, dagesh/marks, and whether the `{B}` marker should remain outside the Hebrew span. The direct OCR read is not reliable enough for certification.

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

- `vol 5 p150 L11 S0`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A150%3A11%3A0`
  - Live text: `נִזְעָקוּ`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the target is the first Hebrew word in the Job 17 conjecture comparison line before `au lieu de`. The packet crop begins at the line edge, so it is useful for locating the target but the human should use the full printed line/page context when checking the rightmost edge of the word.
  - Human check still needed: exact consonants and pointing, especially the `ק/כ` distinction against the nearby `נִזְעָכוּ` contrast. Do not transfer a clean verdict from the similar forms later in the same line.

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

### Additional Current Attention Coverage

These entries cover the remaining current attention-lane items shown by the
status report on 2026-06-04. They are visual triage notes only; grouped line
entries do not transfer a clean verdict from one similar word or phrase to
another.

- `vol 2 p151 L42 S1`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=2%3A151%3A42%3A1`
  - Live text: `הַזֶּה הָעָם`
  - Attention reason: multi-token Hebrew span.
  - Visual precheck: the target crop boxes the two Hebrew words near the right end of the French line after `sous`; no obvious swallowed neighboring French word is visible in the packet crop.
  - Human check still needed: exact word order, consonants, niqqud, and whether this two-word span should stay grouped in this apparatus sentence.

- `vol 5 p148 L26 S1`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A148%3A26%3A1`
  - Live text: `מְלִיצַי רֵעָי`
  - Attention reason: multi-token Hebrew span.
  - Visual precheck: the crop cleanly boxes the two-word Hebrew phrase after `J12 vocalise`; the following French `et, avec` begins outside the target box.
  - Human check still needed: exact letters, niqqud, and word spacing. Do not carry a verdict automatically from the similar phrase elsewhere.

- `vol 5 p149 L1 S2`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A149%3A1%3A2`
  - Live text: `מְלִיצַי רֵעָי`
  - Attention reason: multi-token Hebrew span.
  - Visual precheck: the crop boxes the same two-word phrase in a different line after `au lieu de`; the comma and `[R]NEB` context sit outside the Hebrew target.
  - Human check still needed: exact letters, niqqud, and whether the print here matches the prior occurrence independently.

- `vol 5 p149 L18 S4/S6`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A149%3A18%3A4`
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A149%3A18%3A6`
  - Item IDs: `v5-p0149-l018-s4`, `v5-p0149-l018-s6`
  - Live texts: `פְּרַקְלִיטַי חַבְרִי` and `קֳדָם אֱלָהָא זַלְגַת עֵינִי`
  - Attention reason: multi-token Hebrew-script spans.
  - Visual precheck: the two target crops sit on either side of the printed slash in a `𝔗` line; each crop contains only its own Hebrew-script phrase, with the colon, slash, and final period outside the respective target boxes.
  - Human check still needed: exact letters, vowels, and word division. Because this is Targum/Aramaic-style Hebrew-script material, exact wording/vocalization should be checked by a competent Targum/Aramaic reviewer, not inferred from ordinary Hebrew familiarity.

- `vol 5 p150 L8 S5`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A150%3A8%3A5`
  - Item ID: `v5-p0150-l008-s5`
  - Live text: `יָמַי נִזְעָכוּ`
  - Attention reason: multi-token Hebrew spans.
  - Visual precheck: the crop sits on the middle phrase in the slash-separated `Le 𝔐 porte pour ce verset` line; the neighboring slash separators sit outside the red box. Earlier S3/S7 crop review found a geometry/text assignment swap, so those two spans were moved out of raw Pass-C and into vision-tier expert review before this note was updated.
  - Human check still needed: exact niqqud/marks and word spacing for this middle phrase independently.

- `vol 5 p150 L9 S0`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A150%3A9%3A0`
  - Live text: `לִי`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the tiny continuation line contains only this Hebrew form and the following period. The enlarged scanline appears to show lamed with hiriq plus final yod, fitting Job 17:1 `קְבָרִים לִי`; however, the direct OCR read reports `לו`, so this should be checked by eye rather than accepted from the machine read.
  - Human check still needed: final letter yod vs vav, exact hiriq placement under the lamed, and whether the following period remains outside the Hebrew span.

- `vol 5 p151 L1 S5`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A151%3A1%3A5`
  - Item ID: `v5-p0151-l001-s5`
  - Superseded by `repair-vol5-p151-targum-quote-2026-06-05-chirho.ts`.
  - Old live text at the time of this note: `יָמַ֣י נִזְעָ֑כוּ`
  - Revision note: the full-page crop shows this is a `Quant au 𝔗` Targum/Aramaic-style quote, not an ordinary Hebrew/WLC line. S3/S5/S7 and the line-2 continuation are now vision-tier consonantal Targum readings pending expert confirmation.
  - Certification remains pending in the expert lane; do not use this historical raw pre-review note as a clean verdict.

- `vol 5 p151 L16 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A151%3A16%3A1`
  - Live text: `תְרֹמֵם`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the red box cleanly brackets the Hebrew word between `Jb 17,4` and `{B}`. The printed consonants look like tav-resh-mem-final mem at review resolution; the direct read `הרהמ` appears to be OCR weakness rather than a neighboring-span or clipping problem.
  - Human check still needed: exact first letter, vowels/marks, and whether the printed form is `תְרֹמֵם` as stored rather than a visually similar Job 17:4 form.

- `vol 5 p151 L18 S3/S5`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A151%3A18%3A3`
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A151%3A18%3A5`
  - Item IDs: `v5-p0151-l018-s3`, `v5-p0151-l018-s5`
  - Live texts: `כִּילִבָּם צָפַנְתָּ מִשָּׂכֶל` and `עַלכֵּן לֹא תְרֹמֵם`
  - Attention reason: multi-token Hebrew spans.
  - Visual precheck: the line shows two slash-separated Hebrew phrases after `Le 𝔐 porte ici`; the target boxes are separated by the printed slash and do not visibly overlap each other.
  - Human check still needed: exact word division, especially the `עַלכֵּן` spacing/attachment, plus all vowels and marks.

- `vol 5 p151 L19 S1/S3`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A151%3A19%3A1`
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A151%3A19%3A3`
  - Item IDs: `v5-p0151-l019-s1`, `v5-p0151-l019-s3`
  - Live texts: `לֹא תְרוֹמֵם` and `לֹא תְרוּמַם`
  - Attention reason: multi-token Hebrew spans.
  - Visual precheck: the two crops sit on opposite sides of the French `J123 conjecture`; the line appears to contrast two near-identical forms, so the vowel distinction is the point rather than a reason to merge the targets.
  - Human check still needed: exact vowels/marks and whether the two forms are correctly distinguished.

- `vol 5 p152 L13 S3/S5`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A152%3A13%3A3`
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=5%3A152%3A13%3A5`
  - Item IDs: `v5-p0152-l013-s3`, `v5-p0152-l013-s5`
  - Live texts: `אֲרוּם לְבְהוֹן אֲטֶשְׁתָּא מִסַּכְּלָתָנוּ` and `מָטוּל הֵיכְנָא לָא תְּרוֹמֵם`
  - Attention reason: multi-token Hebrew-script spans.
  - Visual precheck: the two long Hebrew-script targets sit in a `𝔗 traduit` line and are separated by the printed slash; the packet crops show the intended phrase boundaries at review resolution.
  - Human check still needed: exact Targum/Aramaic wording, vowels, and word division by a competent reviewer. These should not be certified merely as ordinary Hebrew words.

- `vol 2 p151 L15 S1`:
  `http://localhost:8766/?attention-chirho=multi-token-chirho&item-chirho=2%3A151%3A15%3A1`
  - Live text: `תימרון קדיש`
  - Attention reason: multi-token Hebrew span.
  - Visual precheck: the crop boxes the final two-word Hebrew-script phrase after `en 13 par`; no obvious neighboring French bleed or clipped Hebrew letter is visible.
  - Human check still needed: exact Targum/Aramaic wording and whether the unpointed spelling is what the print intends.

## Raw Vol 2 Starting-Lane Visual Precheck

These items were checked only as packet crops and line-context aids. They are not
certification, and they should not be used to carry a verdict from one similar
word to another.

- `vol 2 p148 L14 S1`:
  `http://localhost:8766/?volume-chirho=vol-2-chirho&item-chirho=2%3A148%3A14%3A1`
  - Live text: `וְיַסִּירֵנִי`
  - Current line text: `lit ici וְיַסִּירֵנִי C'est inexact. Sa leçon est יוסרנו. Il est probable que la confusion yod/`
  - Visual precheck: the crop is centered on the Hebrew word after `lit ici` and before `C'est`; no obvious clipping, swallowed neighboring text, or hidden-script overflow is visible in the packet crop.
  - Human check still needed: exact letters, niqqud, and marks against the print. Review this independently from the other `וְיַסִּירֵנִי` occurrence.

- `vol 2 p148 L37 S1`:
  `http://localhost:8766/?volume-chirho=vol-2-chirho&item-chirho=2%3A148%3A37%3A1`
  - Live text: `וְיַסִּירֵנִי`
  - Current line text: `lon moi, וְיַסִּירֵנִי est un futur de יסר dont la première radicale a été insérée dans la`
  - Visual precheck: the crop is centered between the preceding French comma/context and the following French explanation; no obvious geometry defect or missing neighboring Hebrew word is visible.
  - Human check still needed: exact letters, niqqud, and marks against the print. Do not auto-copy a verdict from `vol 2 p148 L14 S1`.

- `vol 2 p148 L38 S1`:
  `http://localhost:8766/?volume-chirho=vol-2-chirho&item-chirho=2%3A148%3A38%3A1`
  - Live text: `יִצְּרֵהוּ`
  - Current line text: `deuxième, comme dans יִצְּרֵהוּ (Is 44,12). On en fait d'ordinaire le parfait d’une forme`
  - Visual precheck: the crop is centered on the Hebrew word before `(Is 44,12)`; the parenthetical citation begins outside the target crop, and no obvious clipping or swallowed text is visible.
  - Human check still needed: exact consonants, niqqud, dagesh/marks, and whether this line's form matches the print independently from the later repeat.

- `vol 2 p149 L14 S1`:
  `http://localhost:8766/?volume-chirho=vol-2-chirho&item-chirho=2%3A149%3A14%3A1`
  - Live text: `יִצְּרֵהוּ`
  - Current line text: `‘samek’ dagueshé, comme en יִצְּרֵהוּ (Is 44,12)."`
  - Visual precheck: the crop is centered on the repeated Hebrew word before `(Is 44,12)`; no obvious crop or segmentation issue is visible in the packet crop.
  - Human check still needed: exact consonants, niqqud, dagesh/marks, and whether this repeat should receive the same judgment only after direct visual confirmation.

- `vol 2 p149 L30 S1`:
  `http://localhost:8766/?volume-chirho=vol-2-chirho&item-chirho=2%3A149%3A30%3A1`
  - Live text: `וַיְסִירֵנִי`
  - Current line text: `La leçon וַיְסִירֵנִי lue ici par Sym, a paru préférable au comité, comme tenant une`
  - Visual precheck: the crop is centered on the Hebrew word after `La leçon` and before `lue ici`; no neighboring French text or additional Hebrew word appears swallowed into the target crop.
  - Human check still needed: exact letters, niqqud, and especially the opening vowel/conjunction form. This is distinct from the `וְיַסִּירֵנִי` targets above.

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
