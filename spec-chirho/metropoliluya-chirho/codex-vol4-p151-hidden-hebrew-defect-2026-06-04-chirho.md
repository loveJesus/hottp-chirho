<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Vol 4 P151 Hidden Hebrew Defect Chirho

Generated: 2026-06-04

This is a machine-assisted defect note, not a human certification and not a span
repair. Do not use it to decrement any certification gate or apply a clean
verdict. It records a strict-blind transcription problem discovered while
prechecking the raw Hebrew vol 4 queue.

## Summary

Vol 4 page 151 lines 14-17 contain Hebrew words that are visibly present in the
scanlines but are either omitted or garbled as French/Latin text in the current
span JSON and markdown. The structural export is still strict-clean because the
affected spans have known scripts and non-empty text; this is a text-correctness
defect, not a structural-gate defect.

Source scanlines:

- `workspace-chirho/scanlines-chirho/vol-4-chirho/page-0151-chirho/line-014-chirho.png`
- `workspace-chirho/scanlines-chirho/vol-4-chirho/page-0151-chirho/line-015-chirho.png`
- `workspace-chirho/scanlines-chirho/vol-4-chirho/page-0151-chirho/line-016-chirho.png`
- `workspace-chirho/scanlines-chirho/vol-4-chirho/page-0151-chirho/line-017-chirho.png`

Current markdown excerpt:

```text
voit en D. "DD une construction archaïque semblable à
שָׁלוֹם "n°2 de Nb 25,12 (expression modernisée en N°73
"D par Is 54,10) ou 11} 72771 de Éz 16,27 ou encore
יְשׁוּעָה + 772279 de Ha 3, 8. Étant donné le relatif isolement
```

## Observations

- `vol 4 p151 L14`:
  - Current live span text: `voit en D. "DD une construction archaïque semblable à`
  - Visual precheck: after `voit en`, the scanline visibly contains a Hebrew phrase, not `D. "DD`.
  - Human/second-witness check still needed: exact letters and niqqud for the phrase. I am not certifying the phrase from this pass.

- `vol 4 p151 L15`:
  - Current live spans: `שָׁלוֹם` + `"n°2 de Nb 25,12 (expression modernisée en N°73`
  - Visual precheck: the scanline visibly reads `שָׁלוֹם בְּרִיתִי de Nb 25,12 (expression modernisée en בְּרִית...`.
  - WLC corroboration: Numbers 25:12 contains `אֶת־בְּרִיתִי שָׁלֽוֹם`, so the printed `בְּרִיתִי` next to `שָׁלוֹם` is expected.
  - Human/second-witness check still needed: exact printed marks, the line split around `בְּרִית`, and how to segment newly recovered Hebrew while existing `שָׁלוֹם` remains raw-Hebrew pending.

- `vol 4 p151 L16`:
  - Current live span text: `"D par Is 54,10) ou 11} 72771 de Éz 16,27 ou encore`
  - Visual precheck: the scanline visibly contains Hebrew around the Is 54:10 and Ezek 16:27 citations.
  - WLC corroboration: Isaiah 54:10 contains `וּבְרִית שְׁלוֹמִי`; Ezekiel 16:27 contains `מִדַּרְכֵּךְ זִמָּה`.
  - Human/second-witness check still needed: exact text and segmentation against the print.

- `vol 4 p151 L17`:
  - Current live spans: `יְשׁוּעָה` + `+ 772279 de Ha 3, 8. Étant donné le relatif isolement`
  - Visual precheck: the scanline visibly contains the Hab 3:8 phrase including `מַרְכְּבֹתֶיךָ` next to `יְשׁוּעָה`; the current `+ 772279` is OCR garbage.
  - WLC corroboration: Habakkuk 3:8 contains `מַרְכְּבֹתֶיךָ יְשׁוּעָֽה`.
  - Human/second-witness check still needed: exact printed marks and the visual/logical order for the embedded Hebrew phrase.

## Recommended Next Step

Do not record a human verdict from this note. The safer path is:

1. Ask Claude/Hallelujah for a second visual witness of lines 14-17.
2. If confirmed, write a guarded cleanup script that rebuilds only these lines,
   marks recovered Hebrew as `vision-chirho`, leaves any existing raw Pass-C
   Hebrew spans pending unless Hallelujah certifies them, and keeps x-tiling and
   segment indices contiguous.
3. Regenerate markdown, the raw Hebrew validation report/packet, the expert
   confirmation pack, and the certification status so the new vision-tier Hebrew
   is tracked rather than silently treated as certified.

## Result

No span files, review rows, validation rows, or certification gates were changed
by this note.
