<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Expert Confirm Queue Chirho, 2026-05-31

This is the honest residue after the vol-5 vision pass and Codex/Claude cross-audit. The listed spans are intentionally not promoted above `vision-chirho`; they need a Syriac or Arabic/Hebrew-aware human reviewer before being treated as final text.

This queue is not a replacement for the broader WLC/human confirmation pass over the full vision set. The durable source for that larger scope is `spec-chirho/metropoliluya-chirho/vision-verdicts-backup-2026-05-31-chirho.json`.

## Current Export Gate

- `bun run src-chirho/export-markdown-chirho.ts --all --strict`
- Result: strict fails with 1 issue.
- Issue mix: 1 `unknown-script-chirho` warning.

## Syriac Expert Items

| Priority | Span | Current status | Text now stored | Why it needs review |
|---|---|---|---|---|
| High | vol 5 p69 L30 S5 | `unknown-chirho` | `](KE N"'E ?A 7<'E8 "P 7H$ >E/` | Narrow tail of a Syriac line after `La 𝔖 porte: ܐܶܢ ܕܡܳܟ̰`; Codex deferred it because the glyphs were not independently readable enough. |
| High | vol 5 p69 L30-L31 | `syriac-chirho`, `vision-chirho` plus one unknown tail | L30 S3 `ܐܶܢ ܕܡܳܟ̰`; L31 S0 `ܟܽܘܪ ܡܺܝܬܳܐ ܟܽܘܪ ܣܶܕܪܳܐ ܟܽܘܪ ܪܰܒܺܝܠ ܟܽܘܪ.` | Review the whole Peshitta line as one unit so the deferred tail can be merged or corrected in context. |
| Medium | vol 5 p50 L4 S8 | `syriac-chirho`, `vision-chirho` | `ܘܳܐܒܕܳܐ` | Claude and Codex agree the crop is genuinely Syriac/Serto and context matches Job 5:3 Peshitta, but exact letters/vowels remain machine-tier. |
| Medium | vol 5 p50 L5 S0 | `syriac-chirho`, `vision-chirho` | `ܕܰܝܪܶܗ ܡܶܢ ܫܶܠܝ` | Continuation of the same Job 5:3 Peshitta citation; exact letters/vowels need Syriac-reader confirmation. |
| Medium | vol 5 p53 L8 S1 | `syriac-chirho`, `vision-chirho` | `ܘܠܗ ܢܫܩܠܘܢ ܙܝܢܬܢܐ` | Claude confirmed script and context, but neither agent certifies exact Estrangela/Serto letters. |
| Medium | vol 5 p66 L19 S5 | `syriac-chirho`, `vision-chirho` | `ܘܳܐܦ ܐܰܢܬܽܘܢ ܗܘܰܝܬܽܘܢ ܥܠܰܝ` | Script/context agree with Job 6:21 Peshitta; exact letters/vowels need Syriac-reader confirmation. |
| Medium | vol 5 p66 L20 S2 | `syriac-chirho`, `vision-chirho` | `ܛܥܢܐ` | Short Syriac word in an Ambrosianus note; tesseract and crop agree at machine level, but it should be checked. |

## Arabic Expert Items

| Priority | Span | Current status | Text now stored | Alternatives to check | Why it needs review |
|---|---|---|---|---|---|
| High | vol 5 p55 L32 S1 | `arabic-chirho`, `vision-chirho` | `ضِمَار` | `ضِمَام`, `ضِمَاد` | Full-resolution crop leaves the final letter genuinely ambiguous. Claude leaned `ضِمَام`; `ضِمَاد` is lexically plausible in context; Codex originally stored `ضِمَار`. Do not silently change without Arabist/Hallelujah review. |
| Medium | vol 5 p64 L16 S1 | `arabic-chirho`, `vision-chirho` | `للمذيب من صاحبه الفضل / وخية الكافي يترك` | Confirm `وخية` | Codex's image audit passed the whole Arabic line at vision-tier, but explicitly noted `وخية` was not a high-confidence lexical call. Ask the same Arabist reviewer to confirm this word while checking p55 L32. |

## Hebrew/WLC Confirmation Pointers

These are not additional strict-export blockers, but they should be called out during the broader WLC/human pass because earlier audits flagged them as less certain than ordinary vision-tier Hebrew.

| Priority | Span | Current status | Text now stored | Question |
|---|---|---|---|---|
| Medium | vol 5 p64 L18 S3 | `hebrew-chirho`, `vision-chirho` | `תוּשִׁיּה` | Confirm the vocalization. Claude's note had `תּוּשִׁיָּה`, while Codex could not independently see the qamats under the yod and intentionally did not upgrade the stored vowels. |
| Medium | vol 5 p65 L2 S5 | `hebrew-chirho`, `vision-chirho` | `מס` | Short Hebrew fragment at the end of the line; include in the WLC/human spot-check because it was flagged as medium-confidence. |

## Resolved Non-Expert Strict Residue

These were strict warnings, but not part of the Syriac/Arabic expert queue. They were resolved with `spec-chirho/metropoliluya-chirho/cleanup-nonexpert-suspects-2026-05-31-chirho.ts`, which rebuilds the affected scanlines gap-free from the line images:

- vol 1 p151 L34: removed phantom `An` and duplicate Hebrew, leaving the consonantal print reading `ויריעו העם תרועה גדולה en un`.
- vol 2 p148 L25: merged the Hebrew phrase to `שבי ישראל סרו מדרך העם`.
- vol 2 p148 L29: merged the Greek phrase to `ἀπειθοῦσι τῇ πορείᾳ τῆς ὁδοῦ τοῦ λαοῦ`.
- vol 5 p58 L10: rebuilt the French/Hebrew line as `Disant conjecturer מָחֵרֶב au lieu de מֵחֶרֶב, J123 traduit: “Il`.

No current non-expert strict residue remains; the export gate is blocked only by the p69 Syriac tail.
