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

- `vol 2 p149 L19 S1/S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A149%3A19%3A1`
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=2%3A149%3A19%3A3`
  - Item IDs: `v2-p0149-l019-s1`, `v2-p0149-l019-s3`
  - Live texts: `כְּחֶזְקַת` and `אָמַר`
  - Attention reason: S1 is a current raw item in the no-pre-review-note lane; S3 has low direct-read confidence.
  - Visual precheck: S1 is boxed after the preceding `Ta` context and before French `mais`; S3 is boxed before French `qui pré-`. The red boxes do not visibly swallow neighboring French/Latin text. Treat S1 as a real human review target because the direct OCR read `חהקת` is too weak for the exact letters/marks.
  - Human check still needed: S1 exact consonants and pointing, especially the opening kaf/dagesh and middle consonants; S3 exact vowels/marks and letter confirmation.

- `vol 2 p149 L26 S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A149%3A26%3A3`
  - Live text: `סור`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the crop cleanly boxes the Hebrew root between French `hifil de` and the following parenthesis; no neighboring French or apparatus sigla appear swallowed by the Hebrew target box. The direct read and token witnesses are strong aids, not certification.
  - Human check still needed: exact samekh-vav-resh letters, whether the bare consonantal form is what the print intends here, and whether the following parenthesis stays outside the Hebrew span.

- `vol 2 p149 L29 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A149%3A29%3A1`
  - Live text: `סור`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the short line reads French `de`, then the boxed Hebrew root, then French `avec cette préposition est fréquente.` No obvious crop clipping, neighboring French bleed, or extra hidden Hebrew is visible at packet resolution.
  - Human check still needed: exact samekh-vav-resh letters, whether this occurrence should remain bare consonantal, and whether a clean verdict on the nearby `vol 2 p149 L26 S3` occurrence should not be transferred automatically.

- `vol 2 p149 L37 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A149%3A37%3A1`
  - Live text: `תַקְדִּישׁוּ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the compact apparatus line reads `8,13`, then the boxed Hebrew word, then the witness list `[A] M 1Q-a 4Q-h G Sym V ST`. The target box is tight between the verse reference and `[A]`; no obvious missing neighboring Hebrew is visible, but the human should still look carefully at both crop edges.
  - Human check still needed: exact tav/qof/dalet-yod-shin-vav sequence, dagesh, vowels, shin-dot, and whether the adjacent `[A]` witness marker remains outside the Hebrew span.

- `vol 2 p149 L38 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A149%3A38%3A1`
  - Live text: `לְמִקְדָּשׁ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the compact apparatus line reads `8,14`, then the boxed Hebrew word, then `[A] M 1Q-a G Aq Sym VS // paraphr : T`. The Hebrew target is centered and the adjacent reference/witness text remains outside the stored Hebrew text, but the crop edge next to `[A]` is tight.
  - Human check still needed: exact lamed-sheva, mem-hiriq, qof/dalet-shin sequence, dagesh/shin-dot, and whether the `[A]` witness marker is correctly excluded from the Hebrew span.

- `vol 2 p150 L7 S1/S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A7%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A7%3A3`
  - Item IDs: `v2-p0150-l007-s1`, `v2-p0150-l007-s3`
  - Live texts: `לְמָקְשֵׁר` and `תָּקְשִׁרוּ`
  - Attention reason: none; these are current raw items in the no-pre-review-note lane.
  - Visual precheck: the line reads `que cela suppose :`, then S1, then French `et`, then S3. Both red boxes bracket their own Hebrew form and leave the separator/context outside the target boxes. The direct OCR reads confuse the two forms, so the paired human comparison is more important than the machine read.
  - Human check still needed: exact letter order in both forms, especially lamed/tav openings and qof-shin-resh sequence, plus all vowels/dagesh/shin-dot marks.

- `vol 2 p150 L9 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A9%3A1`
  - Live text: `קֶשֶׁר`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the Hebrew root is boxed after French `la racine` and before French `Considérant`; the printed crop visibly shows a terminal period immediately after the Hebrew word. No neighboring French appears swallowed by the Hebrew box.
  - Human check still needed: exact qof-shin-resh letters, segol/shin-dot marks, and whether the visible terminal period should be included with this Hebrew span or recorded as adjacent punctuation before `Considérant`.

- `vol 2 p150 L13 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A13%3A1`
  - Live text: `קֶשֶׁר`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the target crop boxes the first Hebrew root after French `de remplacer les deux` and before `du vs 12`. The same line later has the recovered vision-tier `קדש` after French `par`; keep the two roots distinct and do not let the later repair substitute for reviewing this raw `קֶשֶׁר`.
  - Human check still needed: exact qof-shin-resh letters and segol/shin-dot marks for this first Hebrew word, plus confirmation that the following `du vs 12` remains outside the Hebrew span.

- `vol 2 p150 L19 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A19%3A1`
  - Live text: `קשׁר`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the target crop boxes the Hebrew root after French `*M de la racine` and before `Lowth`; the printed crop visibly shows a terminal period immediately after the Hebrew root.
  - Human check still needed: exact qof-shin-resh letters, shin-dot, intentionally bare/unpointed root status, and whether the visible terminal period should be included with this Hebrew span or treated as adjacent punctuation before `Lowth`.

- `vol 2 p150 L26 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A26%3A1`
  - Live text: `קדשׁ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the target crop boxes the bare Hebrew root after French `deux emplois de la racine`; the following opening parenthesis for `(en 13 et 14)` remains outside the Hebrew box. The same printed line later has a separate Hebrew span `תַקְדִּישׁוּ` near the right edge, so keep these two targets distinct.
  - Human check still needed: exact qof-dalet-shin letters, shin-dot, intentionally bare/unpointed root status, and confirmation that the following parenthesis belongs to the French context rather than this Hebrew span.

- `vol 2 p150 L26 S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A26%3A3`
  - Live text: `תַקְדִּישׁוּ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane; the direct OCR read is weak and not usable as a certification witness.
  - Visual precheck: the target crop boxes the Hebrew verb after French `qui sont inauthentiques :` and before French `(au vs`; the nearby colon and following parenthesis remain outside the target box. The earlier `קדשׁ` root on the same line is a separate target and should not be conflated with this verb form.
  - Human check still needed: exact tav/dagesh, qof-dalet-shin sequence, final vav, all vowels and shin-dot marks, plus confirmation that the French colon and following parenthesis stay outside this Hebrew span.

- `vol 2 p150 L27 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A27%3A1`
  - Live text: `תָּקְשִׁרוּ`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the Hebrew word is cleanly boxed between French `corruption de` and `qu'il comprend`; no neighboring French appears swallowed by the Hebrew target box. The direct OCR read `מקשלרה` is weak and should not be used for certification.
  - Human check still needed: exact tav/dagesh, qof-shin-resh sequence, final vav, and all vowels/shin-dot marks.

- `vol 2 p150 L28 S2`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A28%3A2`
  - Live text: `לְמִקְדָּשׁ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the target crop boxes the Hebrew word after French `Quant à` and before French `(au vs 14)`; the opening parenthesis stays outside the Hebrew target box. No neighboring Latin/French text appears swallowed by the Hebrew span.
  - Human check still needed: exact lamed-prefix, mem-hiriq, qof-sheva, dalet-dagesh/qamats, shin-dot, and whether the following parenthesis remains adjacent French punctuation rather than part of the Hebrew span.

- `vol 2 p150 L30 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A30%3A1`
  - Live text: `וּלְמוֹקֵשׁ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane; the direct OCR read omits the leading vav/shuruk, so it should not be used alone for certification.
  - Visual precheck: the target crop boxes the Hebrew word after French `c'est une fausse variante pour` and before French `Dans les premières`; the leading vav/shuruk is visible at the right edge of the boxed Hebrew. No French text appears swallowed by the Hebrew span.
  - Human check still needed: exact leading vav/shuruk, lamed-sheva, mem-holam, qof-tsere, shin-dot, and whether a sentence boundary or punctuation mark is intended between the Hebrew word and following `Dans`.

- `vol 2 p150 L33 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A33%3A1`
  - Live text: `וּלְמוֹקֵשׁ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane; as with L30, the direct OCR read omits the leading vav/shuruk, so it should not be used alone for certification.
  - Visual precheck: the target crop boxes the Hebrew word after French `plaçait par` and before French `qui se trouverait`; the Hebrew/French boundaries are clean, though the leading vav/shuruk sits tight against the right edge of the boxed word.
  - Human check still needed: exact leading vav/shuruk, lamed-sheva, mem-holam, qof-tsere, shin-dot, and confirmation that the following French `qui` remains outside the Hebrew span.

- `vol 2 p150 L37 S1/S3`:
  `http://localhost:8766/?attention-chirho=delimiter-notation-chirho&item-chirho=2%3A150%3A37%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A37%3A3`
  - Item IDs: `v2-p0150-l037-s1`, `v2-p0150-l037-s3`
  - Live texts: `(לְמִקְדָּשׁ` and `מַקְשִׁר`
  - Attention reason: S1 has delimiter notation; S3 is a current raw item in the no-pre-review-note lane.
  - Visual precheck: S1 includes the opening parenthesis and the Hebrew word, while the following French `au vs 14)` is outside that Hebrew box. S3 is separately boxed after French `de lire` and before the French opening quote; no neighboring French appears swallowed by the S3 target box. The direct OCR read `מקשלר` is close to S3's consonants but still not a certification witness for exact marks.
  - Human check still needed: for S1, exact vowels/marks and whether the opening parenthesis belongs inside the Hebrew span or should be treated as adjacent punctuation; for S3, exact mem/qof-shin-resh sequence and all vowel/shin-dot marks.

- `vol 2 p150 L39 S1/S3`:
  `http://localhost:8766/?attention-chirho=low-confidence-direct-read-chirho&item-chirho=2%3A150%3A39%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A39%3A3`
  - Item IDs: `v2-p0150-l039-s1`, `v2-p0150-l039-s3`
  - Live texts: `מַעֲרִיץ` and `מַקְשִׁר`
  - Attention reason: S1 has low direct-read confidence; S3 is all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the line explicitly presents S3 `מַקְשִׁר` in parallel with S1 `מַעֲרִיץ`. S1 is boxed after French `en parallèle avec`; S3 is separately boxed after French `du vs 13)` and before `que NEB retiendra`. No obvious extra or missing Hebrew word is visible between the two boxes.
  - Human check still needed: for S1, exact final letters and pointing, especially the tight yod/tsade region; for S3, exact mem/qof-shin-resh sequence and all vowels/shin-dot marks, plus confirmation that `du vs 13)` and `que NEB` remain outside the Hebrew span.

- `vol 2 p150 L42 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A150%3A42%3A1`
  - Live text: `תַקְדִּישׁוּ`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane.
  - Visual precheck: the target crop boxes the Hebrew word after French `les trois premières lettres de` and before French `qui, seules`; the Hebrew/French boundaries are clean, with no adjacent French swallowed by the Hebrew span.
  - Human check still needed: exact tav/qof/dalet-yod-shin-vav sequence, dagesh, vowels, shin-dot, and confirmation that the surrounding French phrase remains outside this Hebrew span.

- `vol 2 p151 L1 S1/S4`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A1%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A1%3A4`
  - Item IDs: `v2-p0151-l001-s1`, `v2-p0151-l001-s4`
  - Live texts: `תַקְדִּישׁוּ` and `לְמִקְדָּשׁ`
  - Attention reason: both are current raw items in the no-pre-review-note lane; S4 is all-token-validated and line-final.
  - Visual precheck: S1 is boxed after French `traduction de` and before Greek `(ἁγιάσατε)`, with adjacent Greek outside the Hebrew target. S4 is boxed after French `et de` at the right edge of the scanline; no intervening Greek/French text appears swallowed by the S4 Hebrew box.
  - Human check still needed: for S1, exact tav/qof/dalet-yod-shin-vav sequence, dagesh, vowels, and shin-dot; for S4, exact lamed-prefix, mem-hiriq, qof-sheva, dalet-dagesh/qamats, shin-dot, and whether the right-edge crop fully preserves the line-final Hebrew word with no missing terminal punctuation.

- `vol 2 p151 L4 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A4%3A1`
  - Live text: `קֶשֶׁר`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane; the direct OCR read `לשר` is weak and not a certification witness.
  - Visual precheck: the target crop boxes the short Hebrew word after French `emplois de` and before `Sym`; the adjacent French and witness label sit outside the Hebrew target. The line then continues with Greek `ἄνταρσις`, which is a separate span later in the same line.
  - Human check still needed: exact qof-shin-resh consonants, segol vowels, shin-dot, and whether this short word remains cleanly separated from both the preceding French phrase and following `Sym` witness label.

- `vol 2 p151 L8 S1/S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A8%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A8%3A3`
  - Item IDs: `v2-p0151-l008-s1`, `v2-p0151-l008-s3`
  - Live texts: `קָשָׁה` and `קֶשֶׁר`
  - Attention reason: S1 is unvalidated; S3 is all-token-validated, but both are current raw items in the no-pre-review-note lane.
  - Visual precheck: the line explicitly contrasts the root `קָשָׁה` with the source reading `קֶשֶׁר`; both red boxes are centered on their own Hebrew word and leave the intervening French parenthetical outside the target boxes. Treat the two roots as separate review targets, not as interchangeable similar shapes.
  - Human check still needed: for S1, exact qamats/shin-dot and final he; for S3, exact segol/shin-dot and final resh; and whether both short words remain correctly separated from the French parenthetical.

- `vol 2 p151 L9 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A9%3A1`
  - Live text: `קדש`
  - Attention reason: all-token-validated but still in the current raw no-pre-review-note lane; the crop also shows visible closing punctuation after the Hebrew word.
  - Visual precheck: the short line reads French `que de` followed by the boxed Hebrew word at the line end. The packet crop visibly includes closing parenthesis/period-shaped punctuation after `קדש`, while the stored live text is bare `קדש`.
  - Human check still needed: exact qof-dalet-shin letters and whether the visible `).` should be included with this Hebrew span, split into an adjacent punctuation span, or otherwise represented before any clean verdict is recorded.

- `vol 2 p151 L16 S1/S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A16%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A16%3A3`
  - Item IDs: `v2-p0151-l016-s1`, `v2-p0151-l016-s3`
  - Live texts: `לְפוּצֶךָ` and `לְמִקְדָּשׁ`
  - Attention reason: S1 is unvalidated with a weak direct read; S3 is all-token-validated, but both are current raw items in the no-pre-review-note lane.
  - Visual precheck: the line says `En 14, c'est`, then S1, then French `qui y tient la place de`, then S3. Both target boxes are separate from the French text and from each other. The S1 direct OCR read `לפורעכ` is weak, and S3's stronger witnesses still do not certify the exact printed marks.
  - Human check still needed: for S1, exact pe/vav/tsade/final-kaf sequence and all vowels; for S3, exact mem-qof-dalet-shin sequence, dagesh, shin-dot, and whether the final mark/dot belongs to the Hebrew word rather than adjacent punctuation.

- `vol 2 p151 L17 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A17%3A1`
  - Live text: `וּלְמוֹקֵשׁ`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the Hebrew word is boxed between French `Vorlage` and `puisque`; no neighboring French appears swallowed by the target box. The direct OCR read `למוקש` is close on the base word but does not preserve the prefixed vav/shuruk or certify the vowel marks.
  - Human check still needed: exact prefixed vav/shuruk, lamed sheva, mem-vav-qof-shin sequence, tsere/holam placement, and shin-dot/final marks against the print.

- `vol 2 p151 L18 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A18%3A1`
  - Live text: `לְתַקְלָא`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: this short line ends with the Hebrew target after French `loin en ce même vs, par`; the red box covers the target word to the line edge without a following neighboring span. The direct OCR read `להקלא` is weak at the tav/hey position and does not certify the printed vowels.
  - Human check still needed: exact lamed-sheva opening, tav vs he at the second letter, qof-lamed-alef sequence, qamats/patah/sheva marks, and whether any terminal dot-like ink is a Hebrew mark rather than punctuation.

- `vol 2 p151 L36 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A36%3A1`
  - Live text: `תַקְדִּישׁוּ`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the Hebrew word is boxed between French `authenticité de` and `en 13`; no neighboring French appears swallowed by the target box. This repeats the same stored form as `vol 2 p151 L1 S1`, but the direct OCR read here `תקדלשת` is weaker around the yod/shin/final-vav region.
  - Human check still needed: exact tav/qof/dalet-yod-shin-vav sequence, dagesh, vowels, and shin-dot against this occurrence of the print; do not transfer a clean verdict automatically from the earlier `תַקְדִּישׁוּ`.

- `vol 2 p151 L37 S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=2%3A151%3A37%3A3`
  - Live text: `ערץ`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the Hebrew root is boxed after French `au hifil de`; no neighboring French appears swallowed by the target box. The same line also contains the earlier recovered vision-tier `קדש`, so do not let that repair substitute for reviewing this raw `ערץ` item.
  - Human check still needed: exact ayin-resh-tsade letters and whether the visible terminal period after the Hebrew word should be included with this Hebrew span or recorded as adjacent punctuation before French `Or`.

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

- `vol 5 p152 L14 S0/S2`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A14%3A0`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A14%3A2`
  - Item IDs: `v5-p0152-l014-s0`, `v5-p0152-l014-s2`
  - Live texts: `תְּרוֹמֵם` and `תְּרוֹמֵם`
  - Attention reason: none; these are current raw items in the no-pre-review-note lane.
  - Visual precheck: S0 is the line-opening Hebrew word before the period; S2 is the comparison word after `Au lieu de`. Both red boxes bracket their own Hebrew word cleanly and leave the period/French outside the target boxes. The same-line repetition means the human should compare the two forms directly rather than rely on the direct OCR read, which is weak for S0 and stronger for S2.
  - Human check still needed: exact dagesh/sheva and holam-vav placement in both occurrences, plus whether the two printed forms are truly identical as stored.

- `vol 5 p152 L15 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A15%3A1`
  - Live text: `תִּתְרוֹרַם`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the compact line reads French `écrivent`, then one Hebrew word, then a period. The red box cleanly brackets the Hebrew word and does not include the period. The stored consonantal pattern with repeated tav/resh-like strokes is plausible at review resolution, but the direct OCR read is not reliable enough to certify it.
  - Human check still needed: exact first two letters, the middle resh/vav sequence, final mem, and all vowel/dagesh marks.

- `vol 5 p152 L17 S1/S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A17%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A17%3A3`
  - Item IDs: `v5-p0152-l017-s1`, `v5-p0152-l017-s3`
  - Live texts: `רוֹם` and `לֵב`
  - Attention reason: none; these are current raw items in the no-pre-review-note lane.
  - Visual precheck: the line reads `Le qal de`, then `רוֹם`, then French `a comme sujet normal le substantif`, then `לֵב`, then the parenthesized reference. Both target boxes are centered on their Hebrew words and the surrounding French/reference text starts outside the boxes. The direct OCR read saw only `רו` for S1 and read S3 as `לכ`, so neither ending should be certified from OCR alone.
  - Human check still needed: S1 final mem and holam-vav placement; S3 final bet and tsere; and whether both boxes fully enclose their final letters without clipping.

- `vol 5 p152 L19 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A19%3A1`
  - Live text: `לִבָּם`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the word is boxed cleanly between French `le complément` and `ayant déjà`. The direct OCR read `להמ` is close enough to show why this needs human checking but not enough to certify the bet/dagesh; no neighboring French appears swallowed by the Hebrew box.
  - Human check still needed: bet vs visually similar shapes, dagesh inside bet, hiriq/qamats placement, and final mem.

- `vol 5 p152 L21 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A21%3A1`
  - Live text: `תְּרֹמֵם`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the Hebrew word is cleanly boxed after French `du polel`; the following period and French `Il semble...` are outside the target box. This line appears to contrast with nearby `תְּרוֹמֵם` forms, so the missing/present vav and the holam placement are the review point, not a segmentation issue.
  - Human check still needed: tav/dagesh, sheva, holam placement, whether there is no vav in this printed form, and final mem.

- `vol 5 p152 L22 S1`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A22%3A1`
  - Live text: `תְּרֹמְמֵם`
  - Attention reason: none; this is a current raw item in the no-pre-review-note lane.
  - Visual precheck: the line itself discusses a haplography of one of the `mem` letters, and the red box cleanly brackets the Hebrew form after French `d'une forme`. The printed cluster shows the repeated mem sequence at review resolution; the following period is outside the Hebrew box.
  - Human check still needed: exact count/order of the mem letters, sheva/holam/tsere placement, and final mem.

- `vol 5 p152 L24 S1/S3`:
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A24%3A1`
  `http://localhost:8766/?pre-review-note-chirho=without-note-chirho&item-chirho=5%3A152%3A24%3A3`
  - Item IDs: `v5-p0152-l024-s1`, `v5-p0152-l024-s3`
  - Live texts: `תְּרְמָם` and `תִּרְמֵם`
  - Attention reason: none; these are current raw items in the no-pre-review-note lane.
  - Visual precheck: the line says the versions would not have vocalized one form `ou` the other; both target boxes cleanly bracket their Hebrew words and leave the French separator/comma outside. This is a same-line vowel/pointing contrast, not a visible segmentation issue.
  - Human check still needed: exact tav-vowel/dagesh, resh sheva, qamats vs tsere on the mem, and whether the two printed forms are correctly distinguished.

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
