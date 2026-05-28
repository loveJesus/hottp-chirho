<!--
For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16
-->

# Pass C Hebrew Validation Chirho

2026-05-28 checkpoint for validating vols 2-5 Pass-C-OCR Hebrew spans against
independent CRNN witnesses.

## Artifacts

- Verifier: `src-chirho/validate-pass-c-hebrew-chirho.ts`
- Raw OCR emitter: `src-chirho/read_volume_page_chirho.py`
- Generated report: `workspace-chirho/pass-c-hebrew-validation-chirho/pass-c-hebrew-validation-chirho.json`
- Human-readable report: `workspace-chirho/pass-c-hebrew-validation-chirho/pass-c-hebrew-validation-chirho.md`
- Dry triage inputs: `workspace-chirho/pass-c-hebrew-validation-chirho/ocr-triage-chirho/`

## Method

The verifier reads Pass C span JSON for vols 2-5, tokenizes each Hebrew span
into consonantal skeleton tokens, and checks each token against three witness
classes:

- Local D1 `ocr_suggestions_chirho` gated CRNN suggestions.
- Dry-run gated triage JSON from `read_volume_page_chirho.py`.
- Direct CRNN raw reads from the exact underlying line/word positions, counted
  only when the raw read skeleton matches the Pass C token and confidence is at
  least `0.90`.

The direct raw-read witness matters because the page-level suggestion table only
contains WLC-exact AUTO/REVIEW candidates. It cannot validate non-WLC or
non-suggestion Hebrew tokens even when the CRNN read at the exact word position
agrees with Pass C.

## Result

Command:

```bash
bun run validate-pass-c-hebrew-chirho --vols=2,3,4,5
```

Result:

- Hebrew spans checked: 126
- Hebrew tokens checked: 161
- All-token validated spans: 30
- Partial-token validated spans: 4
- Unvalidated spans: 92
- Validated tokens: 34/161
- Direct CRNN raw-read witnesses: 25 token witnesses, improving the all-token
  count from 27 to 30 at the `0.90` confidence floor.
- Direct CRNN matching is order-independent within a span. This avoids
  undercounting embedded RTL Hebrew where Pass C tokens are logical RTL but D1
  word indices are visual LTR.

At lower exploratory direct confidence floors, coverage rises only in vol 2:

- `--direct-conf=0.80`: 33 all-token spans, 37/161 tokens.
- `--direct-conf=0.70`: 35 all-token spans, 39/161 tokens.

Those lower-confidence matches are useful review candidates, but they are not
counted in the default validation report.

## Caveat

The CRNN/WLC suggestion path is still not a sufficient validator for most vols
3-5 Pass-C Hebrew. The dry triage pass produced very sparse gated Hebrew
witnesses outside vol 2, and direct CRNN raw reads at the exact Pass C word
positions did not validate vols 3-5 at the `0.90` confidence floor. Those spans
remain a human/source-validation queue, not completed transcription proof.
