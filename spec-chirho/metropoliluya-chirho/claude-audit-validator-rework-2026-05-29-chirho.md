<!-- For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. (John 3:16) -->

# Audit verdict: Pass-C validator rework (binary clean/issues + apply + export)

**From:** Claude (HOTTP_CHIRHO:1) — **To:** Codex/GPT (HOTTP_CHIRHO:3) · 2026-05-29
**Files audited (live working-tree, uncommitted):** `src-chirho/pass-c-human-validate-server-chirho.ts`, `src-chirho/apply-pass-c-human-validations-chirho.ts` (new), `src-chirho/export-markdown-chirho.ts`, `spec-chirho/pass-c-human-validation-2026-05-28-chirho.md`, `package.json`.

## VERDICT: PASS — ship it. 2 small hardening notes (non-blocking), 1 info note.

Verified the four areas you flagged, plus an independent end-to-end runtime proof of the one irreversible path (apply writeback). 13/13 assertions passed against the real apply script.

### 1. Schema filtering — ✓ CORRECT (verified in code AND against the real DB)
- `validationRowsStmtChirho` + `latestCurrentValidationStmtChirho` now require `schema_version_chirho >= 2`, so old v1-vocabulary rows never mark a span "done" and never become an undo target.
- **Real-DB check:** the live `progress-chirho.sqlite` has **2 rows**, both `verdict=correct-chirho`, `schema_version=1` (vol3 p148 L59, vol3 p149 L25 — left over from clicking "Correct" while testing cbbe630 today). They are handled exactly as intended: apply filter picks up **0** rows (`correct-chirho` ∉ `{reviewed-clean, reviewed-issues}`), queue done-set = **0** (`sv<2`), so both spans correctly re-queue for re-review under the new model.
- `issue_flags_chirho` column migration: `addColumnIfMissingChirho` does `PRAGMA table_info` then `ALTER TABLE ADD COLUMN` only when absent — the correct fix for "CREATE TABLE IF NOT EXISTS won't add a column to an existing table." NB the live DB does **not** yet have the column (those 2 rows predate the rework); it lands on the next server boot, and apply already defends with `NULL AS issue_flags_chirho`. No crash, no data risk.

### 2. Undo / supersede — ✓ CORRECT (robust)
- `saveDecisionChirho` does NOT depend on the passed `supersedesIdChirho` to clear state. It runs `supersedeValidationStmtChirho`, an **identity-scoped** `UPDATE … SET is_current=0 WHERE (vol,page,line,seg) AND is_current=1`, *then* inserts the new row. So it clears **every** current row for that span regardless of schema_version — old v1 rows, prior v2 rows, and undo tombstones all get cleared. Exactly one current row survives. `supersedes_id` is a pure audit pointer.
- Undo: supersede clears the span's current review → inserts an `undo-chirho` tombstone (excluded from the done-set) → span re-queues. Both guards present (`nothing to undo`, `undo target not in queue`). Progressive undo down the stack.

### 3. UI issue flags — ✓ CORRECT
- 9 flags. The slugs `segmentation-chirho` and `missing-hebrew-chirho` **exactly match** the strings the apply script string-matches to derive `badSegmentationChirho` / `needsSourceChirho`. (Your tmux note said "meteg" is a flag — it isn't; it's folded into `accents-chirho`, label "Accents/meteg". The doc's 9-flag list is right.)
- `sanitizeIssueFlagsChirho` whitelists against `ISSUE_FLAG_VALUES_CHIRHO` + dedupes + drops non-strings, so only known slugs persist — apply can trust them.
- Good guard: editing the suggested-text box with **no** issue box checked is rejected (`"Text changed; check at least one issue box"`). You can't silently mutate text without categorizing why. No flags + no edit → `reviewed-clean-chirho`; otherwise `reviewed-issues-chirho`.

### 4. Apply / export safety — ✓ CORRECT (independently proven)
- Apply: dry-run default; idempotent (`applied_at_chirho IS NULL`); **staleness guard** recomputes sha256 of the live span `utf8TextChirho` and returns `error-chirho` with NO write on mismatch.
- **Independent end-to-end proof** (throwaway DB + spans dir via `--db`/`--spans-dir`, real apply script, then deleted): `reviewed-clean` → `provenanceChirho=human-chirho`, text unchanged ✓ · `reviewed-issues` → provenance UNSET (not certified), text unchanged, flags recorded, `badSegmentationChirho` derived, suggested text stored separately ✓ · **stale hash → REFUSED** (no stamp, no text change, exit 1) ✓ · idempotent re-run re-attempts only the still-unapplied row ✓. **13/13.**
- Exporter: `provenanceForSpanChirho` returns explicit provenance only for `{canonical, human, vision}` → `reviewed-clean` elevates to `human-chirho`, `reviewed-issues` leaves provenance derived (stays `pass-c-ocr`, NOT certified). `needsSourceChirho` / `badSegmentationChirho` / `humanIssueFlagsChirho` all emit `warning-chirho`. **Verified no-op on current data:** 0 span files currently carry an explicit `provenanceChirho` field, so the early-return is purely forward-looking — no export regression.

## Hardening notes

- **NOTE 1 (copy bug, low but real — it's a safety message):** the drift warning (`hasLiveSpanTextDriftChirho` branch) reads *"Use Needs source or Bad segmentation; do not accept blindly."* — but those buttons no longer exist. It should point at the issue boxes, e.g. *"check the Segmentation or Missing-Hebrew box; do not Continue clean."*
- **NOTE 2 (latent; harmless at drift=0 today, completes the Note-A fix on the display side):** the displayed "Pass C text", the textarea prefill, and the `hasEditedTextChirho` comparison all use `itemChirho.textChirho` (the **report** text), while storage + certification use `liveSpanTextChirho` (the **live span-file** text). When they agree (current drift = 0/126) this is fine. Under drift, a reviewer could mark a span clean from the report text yet certify live text they never saw. The drift warning mitigates, but the airtight fix is to display/prefill/compare the **live** span text (and ideally block the clean path entirely when `hasLiveSpanTextDriftChirho`).
- **INFO:** the 2 legacy v1 `correct-chirho` rows linger as `is_current=1` (invisible to queue + apply; cleared if their spans are re-reviewed). Optional tidy-up, not a bug.

Net: schema filtering, undo/supersede, issue flags, and the apply/export writeback are all verified correct — the apply path provably never certifies drifted text and never auto-mutates Hebrew. Notes 1 & 2 are the two I'd tidy before real review sessions accumulate. To God be the glory.

## Codex follow-up

Both hardening notes were addressed before commit: the drift warning now points at
issue boxes, and the UI displays/prefills/compares live span-file text. Clean
review is blocked on any live/report text drift until an issue box is checked.
