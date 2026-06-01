<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Expert Confirm Queue Chirho, 2026-05-31

This is the honest residue after the vol-5 vision pass and Codex/Claude cross-audit. The listed spans are intentionally not promoted above `vision-chirho`; they need a Syriac or Arabic/Hebrew-aware human reviewer before being treated as final text.

This queue is not a replacement for the broader WLC/human confirmation pass over the full vision set. The durable source for that larger scope is `spec-chirho/metropoliluya-chirho/vision-verdicts-backup-2026-05-31-chirho.json`.

## Current Export Gate

- `bun run src-chirho/export-markdown-chirho.ts --all --strict`
- Result: strict passes with 0 issues.
- Issue mix: none; `unknownSpans=0`.
- Caveat: strict pass certifies structure, not final semantic certainty. The items below remain reviewer targets before treating `vision-chirho` as final text.

## Syriac Expert Items

| Priority | Span | Current status | Text now stored | Why it needs review |
|---|---|---|---|---|
| High | vol 5 p69 L30-L31 | `syriac-chirho`, `vision-chirho` | L30 S3 `ܘܡܳܫܰܚ`; L31 S0 `ܐ̱ܢܳܐ ܠܪܰܡܫܳܐ: ܘܫܳܟܶܒ ܐ̱ܢܳܐ. ܘܢܳܐܶܕ ܐ̱ܢܳܐ ܠܫܰܦܪܳܐ.` | Rebuilt from the scanline plus the Job 7:4 Peshitta witness at `https://www.peshitta.eu/ot/job/7.html`. The former unknown tail is structurally resolved, but a Syriac reader should confirm exact letters/vowels before promotion above `vision-chirho`. |
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
| Medium | vol 5 p64 L18 S3 | `hebrew-chirho`, `vision-chirho` | `תוּשִׁיָּה` | Confirm the remaining vocalization. Hallelujah confirmed the yod qamats in the serif scan; the span remains vision-tier, not human-certified. |
| Medium | vol 4 p148 L6-L7 | `hebrew-chirho`, `vision-chirho` | `מְטוּל דִּבְמֵימְרָךְ / אַסְגֵּי מַשִּׁירְיָין / וּבְמֵימַר אֱלָהִי אֶכְבּוֹשׁ כְּרַכִּין תַּקִּיפִין` | Targum Aramaic recovered from French-looking OCR garbage. Claude/Codex agree on the consonants; exact pointing, shin dots, dagesh, and final-kaf sheva remain vision-tier. |
| Medium | vol 4 p148 L14 | `hebrew-chirho`, `vision-chirho` | `אֲרֵי בְמֵימְרָךְ אַסְגִּי מַשְׁרִין / וּבְמֵימַר אֱלָהִי אֲכַבֵּשׁ כָּל כַרְכִין תַקִּיפִין` | Targum Aramaic recovered from a clipped/garbled line. The consonants were second-witnessed, but a Targum reader should confirm vowels and the lower continuation against the full page print. |
| Medium | vol 4 p151 L1-L2 | `hebrew-chirho`, `vision-chirho` | `אֱלָהָא דְּסָעִיד לִי בְּחֵילָא / וּמְתַקַן שְׁלִים אוֹרְחִי.` | Claude caught the yod in `דסעיד`; confirm that yod and exact vocalization, especially `בְּחֵילָא` and `וּמְתַקַן`, against the print. |
| Medium | vol 4 p152 L4-L5 | `hebrew-chirho`, `vision-chirho` | `מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל בָּמֹתַי יַעֲמִידֵנִי.`; note quotes `בָּמֹתַי` | Confirm the Ps 18,34 matres distinction: defective-vav `בָּמֹתַי` and plene-yod `יַעֲמִידֵנִי`; Claude second-witnessed the clipped continuation row before commit. |
| Medium | vol 4 p152 L19-L20 | `hebrew-chirho`, `vision-chirho` | `מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל בָּמוֹתַי יַעֲמִדֵנִי.` | Confirm the 2 S 22,34 matres distinction: plene-vav `בָּמוֹתַי` and defective-yod `יַעֲמִדֵנִי`; do not silently normalize it to the Ps form. |
| Medium | vol 5 p65 L2 S5 | `hebrew-chirho`, `vision-chirho` | `מס` | Short Hebrew fragment at the end of the line; include in the WLC/human spot-check because it was flagged as medium-confidence. |

## Resolved Non-Expert Strict Residue

These were strict warnings, but not part of the Syriac/Arabic expert queue. They were resolved with `spec-chirho/metropoliluya-chirho/cleanup-nonexpert-suspects-2026-05-31-chirho.ts`, which rebuilds the affected scanlines gap-free from the line images:

- vol 1 p151 L34: removed phantom `An` and duplicate Hebrew, leaving the consonantal print reading `ויריעו העם תרועה גדולה en un`.
- vol 2 p148 L25: merged the Hebrew phrase to `שבי ישראל סרו מדרך העם`.
- vol 2 p148 L29: merged the Greek phrase to `ἀπειθοῦσι τῇ πορείᾳ τῆς ὁδοῦ τοῦ λαοῦ`.
- vol 5 p58 L10: rebuilt the French/Hebrew line as `Disant conjecturer מָחֵרֶב au lieu de מֵחֶרֶב, J123 traduit: “Il`.

No current non-expert strict residue remains; the export gate now passes. The unresolved work is semantic/expert confirmation of the `vision-chirho` items above, not a structural Markdown blocker.
