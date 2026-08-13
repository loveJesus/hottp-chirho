<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Mistral OCR4 Line Witness Probe Chirho

Generated from a read-only local probe on 2026-06-24. This is a machine-witness evaluation, not a certification artifact. It must not decrement the transcription certification gate, create acceptance policies, or replace human/expert review against the print.

## Scope

- Input images came from the current HOTTP workspace line/page images.
- Raw responses were saved under ignored scratch output: `workspace-chirho/mistral-ocr-probe-chirho/`.
- The probe used the saved `MISTRAL_API_KEY_CHIRHO`; the key is not recorded here.
- No span JSON, review policy, certification status logic, D1 row, or markdown export was intentionally changed.

## Current Gate Context

The current status command still reports the transcription goal as incomplete:

- `complete=false`
- `strictExport=false`
- `rawHebrew=90`
- `visionTier=645`
- `liveNonNfc=0`
- Latin/symbol remaining decisions shown in the status report: `563`
- Attribution-blocked human rows shown in the status report: `10`

The active structural strict-export blocker is the intentionally blank Syriac span `v3-p0151-l010-s3`, which needs a Syriac reader supplied text path before formal expert confirmation.

## Full-Page Probe

OCR4 was run on `workspace-chirho/images-chirho/vol-3-chirho/page-0151-chirho.png` and on a 2x upscaled scratch copy. Both full-page attempts returned only the header/footer:

```text
cxxvi

Le papyrus 967
```

This is not useful as a full-page transcription witness. The reported confidence was high despite missing the page body, so page-level OCR4 confidence is not a coverage proof.

## Line Probe Results

The line-level probe was more useful but not authoritative.

| Item | Current expected text | OCR4 output | Result |
|---|---|---|---|
| `v3-p0152-l021` | `f) en 45,18a: λέγει κύριος .967 ≠ + ὁ θεός Cpl et rel.[6]` | `f) en 45,18a: λέγει κύριος.967 ≠ + ὁ θεός Cpl et rel.[6]` | Nearly exact Greek/symbol read; collapsed spacing before `.967`. |
| `v3-p0152-l022` | `g) en 46,1a: λέγει κύριος .967 ≠ + ὁ θεός Cpl et rel.[7]` | `g) en 46,1a: λέγει κύριος.967 ≠ + ὁ θεός Cpl et rel.[7]` | Nearly exact Greek/symbol read; collapsed spacing before `.967`. |
| `v3-p0151-l042` | `sont seuls à donner la leçon πήχεων au lieu de mi πήχεις de tous les témoins connus 40 parZi.` | `sont seuls à donner la leçon πηχῶν au lieu de ἐπὶ πήχεις de tous les témoins connus` | Greek normalized/misread; tail omitted. |
| `v1-p0149-l038` | `4,10 כְּכֹל אֲשֶׁר־צִוָּה מֹשֶׁה אֶת־יְהוֹשֻׁעַ [B] M g(S) T // abr-elus : G om / lic : V` | `4,10 [B] M g (S) T // abr-elus : G om / lic : V` | Long Hebrew phrase omitted entirely. |
| `v3-p0149-l025` | `est de l'hébreu, il est vrai que c'est par קוֹל יְהוָה לָעִיר יִקְרָא וְתוּשִׁיָּה יִרְאֶה שְׁמֶךָ que les mss` | `est de l'hébreu, il est vrai que c'est par שמך קוֹל יְהוָה לָעִיר יִקְרָא וְחוּשִׁיָּה יִרְאֶה שְׁמֶךָ` | Detected Hebrew but reordered/duplicated and changed a word. |
| `v2-p0148-l024` | `בְּרִיתָם אֲשֶׁר סָרוּ מִלֶּכֶת בְּדֶרֶךְ הָעָם. Des allusions sous une forme simplifiée se ren-` | `Des allusions sous une forme simplifiée se ren-` | Hebrew citation omitted entirely. |
| `v2-p0151-l033` | `à l'intérieur de l'expression צוּר מִכְשׁוֹל qui suit. Le Seigneur en tant que “roc” est le` | `à l'intérieur de l'expression צוּר מִכְשׁוֹל qui suit. Le Seigneur en tant que “roc” est le` | Exact useful Hebrew line read. |
| `v1-p0150-l032` | `6,18 cor תחרמו [C] G // assim-ctext : M V ST תחרימו` | `6,18 cor תַּחְמְדוּ [C] G // assim-ctext : M V S T תַּחְרִימוּ` | Helpful on final word, but reintroduced the known wrong-root issue on the first Hebrew word. |

## Syriac Boundary

On the current blank Syriac line `v3-p0151-l010-s3`, OCR4 detected mixed-script text but misread the Syriac region as Hebrew. This confirms it can be a "something non-Latin is here" signal, but it is not a Syriac transcription source for this project.

## Conclusion

OCR4 should be considered only as a non-authoritative machine witness:

- Useful: line-level disagreement detection, non-Latin presence hints, Greek/symbol sanity checks, and prioritizing review candidates.
- Unsafe: full-page coverage, certification, Syriac transcription, exact Hebrew pointing, and anything where confidence is treated as truth.

Recommended integration, if pursued, is a read-only line-witness scanner that writes candidate reports and never writes spans, policies, review rows, or gate-subtracting decisions.
