<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Pass C Hebrew Human Validation

Run the local validator:

```bash
bun run pass-c-human-validate-chirho
```

Open:

```text
http://localhost:8766/
```

## Queue

The queue contains all 126 Pass-C Hebrew spans from `pass-c-hebrew-validation-chirho.json`.

- `primary-vols-3-5-chirho`: highest priority; CRNN is weak on these volumes.
- `primary-vol-2-chirho`: unvalidated or partially validated vol-2 spans.
- `spot-check-chirho`: all-token skeleton-agreement spans; lower priority because correlated OCR errors remain possible.

The UI warning is intentional: machine witnesses validate consonantal skeletons only. Vowels and niqqud are unverified even when consonants agree.

## Verdicts

- `accept-chirho`: visible source matches the full vocalized Pass-C text.
- `correct-chirho`: store the full corrected vocalized UTF-8 text from the source.
- `needs-source-chirho`: crop is not sufficient; defer to the PDF/page source.
- `bad-segmentation-chirho`: span/crop does not isolate the intended source text.
- `skip-chirho`: leave for later.
- `undo-chirho`: append-only undo of the latest current verdict.

The correction box includes a Hebrew typewriter for meteg, maqaf, common niqqud,
dagesh, and shin/sin dots. Buttons insert at the correction cursor or replace
the selected text.

## Storage

Human decisions are append-only in `spec-chirho/progress-chirho.sqlite`,
table `pass_c_human_validations_chirho`.

Stable span key:

```text
(volume_chirho, page_chirho, line_index_chirho, segment_index_chirho)
```

Each decision stores:

- original live span-file text
- `original_text_hash_chirho` SHA-256 staleness guard over the live span-file text
- full line text
- full corrected vocalized text when corrected
- corrected consonantal skeleton
- witness snapshot
- queue generation timestamp
- supersession fields for append-only undo/writeback

Writeback must refuse blind re-apply when the current span text hash differs from `original_text_hash_chirho`.
