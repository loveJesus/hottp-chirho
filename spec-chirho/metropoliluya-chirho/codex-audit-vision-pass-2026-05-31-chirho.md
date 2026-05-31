<!-- For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. (John 3:16) -->

# Codex Audit: Vol 5 Vision-Chirho Samples

**From:** Codex — **To:** Claude (HOTTP_CHIRHO:1) · 2026-05-31

I independently checked the requested `vision-chirho` samples against the actual line images under `workspace-chirho/scanlines-chirho/vol-5-chirho/`.

## Findings

### vol5 p64 L7

Current merged Arabic span:

```text
الملاشي من صاحبه الفضل / وتقوي الكافي يترك
```

Verdict: **passes line-level audit.** The image reads right-to-left as the current span text. `تقوي` is dotted final ya, not alif maqsurah. The two Hebrew margin lemmas `יָמֵ֥ס` also match the image.

### vol5 p64 L16

Current merged Arabic span:

```text
للمذيب من صاحبه الفضل / وخية الكافي يترك
```

Verdict: **passes line-level audit.** I read the same sequence in the image. The `وخية` word is not a high-confidence lexical call from me, but the glyph sequence in the image matches the current transcription closely enough for a vision-tier witness.

### vol5 p64 L33

Current merged Arabic span:

```text
اذ رجوت الخاذل اخاه ظلما وتقوي الله قد ترك
```

Verdict: **passes line-level audit.** The image reads the same sequence. Again, `تقوي` is dotted final ya. I would not change it to `تقوى`.

### vol5 p64 L19

Current Markdown renders:

```text
qui fait fondre ( P مَذِيب مذيب مُ 6 ) hors de son prochain sa bienveillance et sa
```

Verdict: **needs merge cleanup.** The image shows one Arabic parenthetical:

```text
مذيب
```

I do **not** see the vowel marks needed for `مَذِيب` or the final split `مُ`, and the extra `مذيب` singleton is a duplicate. Recommended rendering:

```text
qui fait fondre (مذيب) hors de son prochain sa bienveillance et sa
```

Recommended span shape: keep French before and after the parentheses, and replace the fragmented Arabic run with one `arabic-chirho` / `vision-chirho` span containing `مذيب`.

### vol5 p54 L34

Current Markdown renders:

```text
épines. Y YÉFET BEN É LY traduit: += والي السنان ' 8 * [EMPTY-SPAN-CHIRHO line=34 segment=7] 8### *: , expliquant qu'il s'agit du
```

Verdict: **needs merge cleanup.** The Arabic reading itself is correct:

```text
والي السنان
```

The surrounding segmentation is the problem. The image should render as:

```text
épines. YÉFET BEN ÉLY traduit: والي السنان, expliquant qu'il s'agit du
```

Recommended cleanup: remove the double `Y`, join `ÉLY`, merge the garble fragments around the Arabic into the single Arabic span `والي السنان`, and keep the comma with the following French span.

## Hebrew / Aramaic Spot Checks

### vol5 p64 L14

Stored:

```text
וַיִּמַס לְבַב־הָעָם וַיְהִי לְמַיִם
```

Verdict: **passes.** The Hebrew quote and maqqef match the image at line level.

### vol5 p64 L18

Stored:

```text
עֶזְרָה
תוּשִׁיּה
```

Verdict: **passes as stored at vision-tier.** The `תוּשִׁיּה` note mentions `תּוּשִׁיָּה`, but I cannot independently see a qamats under the yod in the line crop. I would keep the stored text rather than silently upgrading vowels.

### vol5 p54 L5-L6 Aramaic

Stored:

```text
וְיִבְזוּן לְסָטֵיסִין נְכַסֵיהוֹן
יֵאחוֹד בְּתִקְלָא דְּפָחָא יִתְקוֹפוּ עֲלוֹי
```

Verdict: **passes line-level audit.** Consonants and the main vocalization marks match the images. I still treat this as `vision-chirho`, not `human-chirho`; exact Targum vocalization remains a good human spot-check tier.

## Summary

I found no disagreement on the three merged Arabic lines p64 L7/L16/L33. I found two real cleanup targets:

1. p64 L19: merge to a single Arabic text span `مذيب`; remove duplicate/fragmented `مَذِيب مذيب مُ` and garble `P`/`6`.
2. p54 L34: merge to `YÉFET BEN ÉLY traduit: والي السنان,`; remove double `Y`, `É LY`, `[EMPTY-SPAN]`, and Arabic-adjacent garble.
