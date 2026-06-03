<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Zechariah Tipcha Confirmation Chirho

This is a read-only decision aid for the one current strict export issue. It does not certify or apply anything.

## Target

- Span file: `workspace-chirho/spans-chirho/vol-3-chirho/page-0148-chirho/line-059-chirho.json`
- Location: vol 3, page 148, line 59, segment 1
- Current span text: `וְגַםחֲמָת`
- Stored suggested correction: `וְגַם־חֲמָ֖ת`
- Stored source: `WLC Zechariah 9:2`
- Current strict issue: `human-review-issues-chirho`, flags `accents-chirho` and `hebrew-punctuation-chirho`

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
- Existing French prefix currently includes the garble: `b) Za 9,2. Le M place 72 >23`
- The guarded repair script is intentionally blocked until the current strict-issue span is first certified in place.

## Text Evidence

The local WLC verse row for Zechariah 9:2 has raw verse text:

`וְגַם־חֲמָ֖ת תִּגְבׇּל־בָּ֑הּ צֹ֣ר וְצִיד֔וֹן כִּ֥י חָֽכְמָ֖ה מְאֹֽד׃`

The WLC word table normalizes away the maqqef and accent for this word:

`וְגַםחֲמָת`

So the stored suggestion is based on the raw verse-level WLC form, not the normalized word-table form.

## Decision Needed

Hallelujah should confirm whether the printed crop supports the full suggested form:

`וְגַם־חֲמָ֖ת`

Specifically:

- maqqef between `וְגַם` and `חֲמָת`
- tipcha on `מָ`

After explicit confirmation, the guarded path is:

1. `bun run apply-human-suggested-corrections-chirho -- --apply --certify-human`
2. `bun run spec-chirho/metropoliluya-chirho/repair-vol3-p148-l59-zechariah-quote-2026-06-01-chirho.ts -- --apply`

Do not run either step from this note alone.
