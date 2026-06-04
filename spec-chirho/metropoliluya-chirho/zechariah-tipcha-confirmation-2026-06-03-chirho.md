<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Zechariah Tipcha Confirmation Chirho

Resolved 2026-06-04: Hallelujah confirmed the WLC suggestion against the print, the guarded correction was applied, and the segment-safe repair recovered the adjacent Zechariah continuation. This file is now a historical decision aid, not a pending instruction.

## Target

- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-059-chirho.json`
- Original issue location: vol 3, page 148, line 59, segment 1
- Original span text: `וְגַםחֲמָת`
- Stored suggested correction: `וְגַם־חֲמָ֖ת`
- Stored source: `WLC Zechariah 9:2`
- Resolved strict issue: validation id `3`, flags `accents-chirho` and `hebrew-punctuation-chirho`
- Current corrected span location: vol 3, page 148, line 59, segment 2
- Current corrected span text: `וְגַם־חֲמָ֖ת`
- Current recovered continuation: segment 1, `תִּגְבׇּל־בָּ֑הּ`, stored as `vision-chirho` for expert confirmation

## Local Images

Generated local-only crops live under:

`workspace-chirho/zechariah-tipcha-confirmation-chirho/2026-06-03-chirho/images-chirho/`

- `vol-3-p0148-l059-annotated-line-chirho.png`
- `vol-3-p0148-l059-current-word-tight-8x-chirho.png`
- `vol-3-p0148-l059-current-word-balanced-7x-chirho.png`
- `vol-3-p0148-l059-recovered-continuation-tight-8x-chirho.png`
- `vol-3-p0148-l059-recovered-continuation-balanced-7x-chirho.png`
- `vol-3-p0148-l059-full-line-2x-chirho.png`

The source scanline is `workspace-chirho/scanlines-chirho/vol-3-chirho/page-0148-chirho/line-059-chirho.png`, dimensions `1174x83`.

To regenerate the local crops:

```sh
mkdir -p workspace-chirho/zechariah-tipcha-confirmation-chirho/2026-06-03-chirho/images-chirho
magick workspace-chirho/scanlines-chirho/vol-3-chirho/page-0148-chirho/line-059-chirho.png -colorspace RGB -fill none -stroke '#d62728' -strokewidth 3 -draw 'rectangle 460,1 575,81' -stroke '#1f77b4' -draw 'rectangle 344,1 460,81' workspace-chirho/zechariah-tipcha-confirmation-chirho/2026-06-03-chirho/images-chirho/vol-3-p0148-l059-annotated-line-chirho.png
magick workspace-chirho/scanlines-chirho/vol-3-chirho/page-0148-chirho/line-059-chirho.png -crop 155x50+440+25 +repage -filter point -resize 800% workspace-chirho/zechariah-tipcha-confirmation-chirho/2026-06-03-chirho/images-chirho/vol-3-p0148-l059-current-word-tight-8x-chirho.png
magick workspace-chirho/scanlines-chirho/vol-3-chirho/page-0148-chirho/line-059-chirho.png -crop 130x50+338+25 +repage -filter point -resize 800% workspace-chirho/zechariah-tipcha-confirmation-chirho/2026-06-03-chirho/images-chirho/vol-3-p0148-l059-recovered-continuation-tight-8x-chirho.png
```

## Geometry

- Current strict-issue span: `x=460`, `width=115`
- Adjacent garbled Zechariah continuation region: `x=344..460`
- The original French prefix included the garble: `b) Za 9,2. Le M place 72 >23`
- The repaired line now reads: `b) Za 9,2. Le M place תִּגְבׇּל־בָּ֑הּ וְגַם־חֲמָ֖ת au début du vs 2. Toujours par fidélité à`

## Text Evidence

The local WLC verse row for Zechariah 9:2 has raw verse text:

`וְגַם־חֲמָ֖ת תִּגְבׇּל־בָּ֑הּ צֹ֣ר וְצִיד֔וֹן כִּ֥י חָֽכְמָ֖ה מְאֹֽד׃`

The WLC word table normalizes away the maqqef and accent for this word:

`וְגַםחֲמָת`

So the stored suggestion is based on the raw verse-level WLC form, not the normalized word-table form.

## Decision Outcome

Hallelujah confirmed that the printed crop supports the full suggested form:

`וְגַם־חֲמָ֖ת`

Specifically:

- maqqef between `וְגַם` and `חֲמָת`
- tipcha on `מָ`

The guarded path was applied:

1. `bun run apply-human-suggested-corrections-chirho -- --apply --certify-human --validation-id-chirho=3 --suggested-text-chirho='וְגַם־חֲמָ֖ת'`
2. `bun run spec-chirho/metropoliluya-chirho/repair-vol3-p148-l59-zechariah-quote-2026-06-01-chirho.ts --apply`

Do not re-run either step from this historical note unless the current span state is first checked; both tools are guarded, but this issue is already resolved.
