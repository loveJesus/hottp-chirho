<!-- For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. (John 3:16) -->

# Brief for GPT/Codex — what happened while you were offline + where we collaborate

**From:** Claude (HOTTP_CHIRHO:1) — **To:** Codex/GPT (HOTTP_CHIRHO:3) · 2026-05-31
Welcome back. Hallelujah asked us to resume metropoliluya. Here's the catch-up.

## What I did solo (the vol5 non-French vision pass)
The 765 `unknown-script-chirho` spans (vol5 garble) were **legible non-Latin that pdftotext mangled** — Hebrew, vocalized **Aramaic Targum**, **Arabic** (Karaite commentators, Yéfet ben Ély etc.), Greek, Syriac, plus CTAT Fraktur witness sigla.

- **New tool (committed 9ee7af9):** `src-chirho/vision-transcribe-unknown-chirho.ts` — `--vol --page --crop` emits a verdicts template + per-span crops; fill `scriptChirho`+`utf8TextChirho`; `--verdicts=… --apply` stamps `scriptChirho` + `utf8TextChirho` + **`provenanceChirho="vision-chirho"`** (honest 2nd-witness tier, NOT human-chirho) into span files with an append-only audit table `pass_c_vision_validations_chirho`. Dry-run default, staleness-guarded.
- **Method:** verified-subagent pass — I validated on 2 pages (opus), then one Sonnet subagent per page (shared instructions `workspace-chirho/vision-unknown-chirho/vision-instructions-chirho.md`), I normalized siglum codepoints + spot-verified vs images + applied.
- **Canonical CTAT sigla** (ground-truth from p148 spans): 𝔐 U+1D510, 𝔊 U+1D50A, 𝔙 U+1D519, 𝔖 U+1D516, 𝔗 U+1D517; hexaplaric α′/σ′/θ′. Decoded the **`≠` disjunction mark** (pdftotext → Z/4/Æ).
- **Arabic re-segmentation (`workspace-chirho/vision-unknown-chirho/merge-p64-arabic-chirho.ts`):** the segmenter shreds one Arabic citation into ~15 alternating garble fragments → merge the run into ONE `arabic-chirho` span over the combined x-range (tiling stays gap-free), trim boundary garble, then **renumber segmentIndex contiguous** (else `segment-index-gap-chirho` fires).

**Result: export issues 795 → 27; unknown-script 765 → 20; `vision-chirho` spans = 745; Hebrew/Aramaic spans 165 → 433.** d1GapPages still 0.

## Residue (27) — the genuinely-hard tail
~8 Syriac Estrangela (needs a Syriac reader); 2 heuristic FPs (vol3 french spans now holding CORRECT embedded Greek κλήρῳ/αιλαμ but still suspect-flagged); ~6 symbols/fragments; 2 ambiguous French; 3 uncertain suspect singletons; 1 blank; 1 glued mixed span (v5p58 "ecturer מָחֵרֶב").

## Where I'd value your help (metropoliluya cross-check)
The single most valuable thing: **you are an INDEPENDENT 2nd witness.** The 745 `vision-chirho` spans are MY (Claude/sonnet) reads — a different model family cross-checking them catches correlated errors before they reach Hallelujah's WLC-confirm step.

1. **Independent audit of a sample of the `vision-chirho` transcriptions** — especially the **Arabic** (p64 L7/L16/L33 + the merged spans; I was least confident there) and a **Hebrew/Aramaic** sample. Read the span text vs the line image, flag disagreements. The audit table `pass_c_vision_validations_chirho` + span files have everything; line images in `workspace-chirho/scanlines-chirho/vol-5-chirho/`.
2. **Refine the suspect-text heuristic** so a french span carrying vision-corrected embedded Greek (κλήρῳ/αιλαμ) isn't a false-positive (or honor an explicit vision/human reviewed-clean). You build, I audit — our usual split.
3. **Durability:** the vision spans live in workspace (gitignored). Worth deciding how to persist (D1 sync? a committed manifest?).

Tell me which you'll take and I'll take a complementary piece + audit yours. To God be the glory.
