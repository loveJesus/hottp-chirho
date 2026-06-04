<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# Pass C Hebrew Human Validation

Run the local validator:

```bash
bun run pass-c-human-validate-chirho
```

Run the suspect-text validator for exporter warnings:

```bash
bun run pass-c-suspect-validate-chirho
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

The suspect-text queue is loaded from `workspace-chirho/markdown-chirho/export-report-chirho.json`
and contains current `suspect-text-chirho` exporter warnings. Clean review of a
suspect span marks that warning as a false positive after source review; checked
issues keep the span warning-active for correction/training.

## Human Review

Use `Continue` for every span.

- no issue boxes checked plus the explicit clean-certification checkbox: stores `reviewed-clean-chirho`; the visible source matches the Pass-C text closely enough for the current review pass.
- one or more issue boxes checked: stores `reviewed-issues-chirho` plus `issue_flags_chirho`.
- `undo-chirho`: append-only undo of the latest schema-v2 review row.

Current issue flags:

- `letters-chirho`
- `vowels-chirho`
- `accents-chirho`
- `hebrew-punctuation-chirho`
- `latin-punctuation-chirho`
- `missing-hebrew-chirho`
- `extra-latin-chirho`
- `wrong-script-chirho`
- `garbled-text-chirho`
- `missing-greek-chirho`
- `extra-symbol-chirho`
- `wrong-language-chirho`
- `segmentation-chirho`

The correction box includes a Hebrew typewriter for meteg, maqaf, common niqqud,
dagesh, and shin/sin dots. Buttons insert at the correction cursor or replace
the selected text. Corrected text is optional in this pass; the primary signal is
explicit clean review vs checked issue flags.

The review surface displays and pre-fills the live span-file text, not a stale
report copy. If the report text ever drifts from the live span text, clean review
is blocked until an issue box is checked.

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
- optional corrected vocalized text when supplied
- optional corrected consonantal skeleton
- issue flags as JSON
- witness snapshot
- queue generation timestamp
- supersession fields for append-only undo/writeback

Writeback must refuse blind re-apply when the current span text hash differs from `original_text_hash_chirho`.

Dry-run writeback:

```bash
bun run apply-pass-c-human-validations-chirho
```

Live writeback, only after review:

```bash
bun run apply-pass-c-human-validations-chirho -- --apply --id=<validation-id-chirho> --expected-row-count-chirho=1 --expected-validation-id-chirho=<validation-id-chirho>
```

Bulk writeback is only appropriate when every selected row has just been
reviewed as intended. It must include `--expected-row-count-chirho=<count>` and
one `--expected-validation-id-chirho=<id>` flag for each selected row, so a
same-filter command cannot silently apply a different set of rows.

Writeback stamps `reviewed-clean-chirho` spans as `provenanceChirho=human-chirho`
and `humanReviewStatusChirho=reviewed-clean-chirho`. The exporter suppresses
machine suspect-text warnings for those clean human-reviewed spans. Issue-marked
spans keep their original text/provenance and receive review flags for downstream
training and export warnings.
