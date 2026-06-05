<!-- For God so loved the world that he gave his only begotten Son,
that whoever believes in him should not perish but have eternal life. John 3:16 -->

# HOTTP Transcription — Status & Path to Production (updated 2026-06-05)

## TL;DR (share-sized)

We've built the full machine for turning the Barthélemy PDFs into *flawless* UTF-8 markdown, and it's working: the current 46-page working set (all 5 volumes) is transcribed into structured "spans" with **0 unknown characters, 0 broken characters, and 0 Unicode-normalization issues**, exported to markdown, and watched by a strict gate. The engineering is essentially done — what's left is **human/expert eyes confirming the non-Latin text against the printed page**, which the system now makes safe, attributable, and impossible to fake. To keep us honest, the certification gate is **deliberately RED** and will not turn green until that review actually happens — "the export passes != the text is certified."

The path to production is now mostly **review, not building**. Three review stations are live: raw Hebrew (90 spans), Latin/symbol (563 remaining decisions), and non-Latin expert (645: Hebrew 336, Greek 267, Syriac 29, Arabic 13). Hebrew and Greek are yours to confirm; Syriac/Arabic and exact Aramaic/Targum vocalization route to experts. As each item is confirmed against the print (with the reviewer's name + rationale, anchored to the exact text), the gate counts down; when it reaches zero the **certified flawless markdown is the production artifact** — the published digital critical edition. The supporting web app and OCR suggestions are already deployed; the certified text is the thing we're now reviewing toward.

---

## 1. What "production" means here

Two distinct things are sometimes both called "production":

1. **The live web infrastructure** — the Cloudflare Worker review/OCR app (`hottp-chirho.lovejesus.workers.dev` / `hottp-chirho.bible.systems`), with all 5 volumes segmented + coordinates and OCR suggestions served. This is *already deployed and running*.
2. **The certified flawless transcription** — the actual UTF-8 markdown of Barthélemy's *Critique textuelle de l'Ancien Testament*, certified correct against the print. This is the real "landing," and it is **not done yet**: it is gated on human/expert review, by design.

This report is mostly about (2), because that is where the remaining work is.

## 2. What we have today (verified 2026-06-05)

**Transcription corpus (current working set):**
- 5 volumes · 46 pages · 1,789 span-line files · **4,511 spans**
- **0 unknown spans · 0 replacement characters · 0 non-NFC spans** (Unicode normalization is enforced and gate-checked)
- Export to markdown is span-first (the spans are the source of truth; D1 is an audit witness)
- Strict-blind scanner reports are current and clear: hidden-Hebrew candidates **0**, non-Latin-residue candidates **0**, Hebrew close-before-open delimiter suspects **0**. These reports are fail-closed: stale scanner code, stale spans, malformed summaries, nonzero hidden/residue candidates, or delimiter rows not covered by raw/expert review block completion. The one neighbor-unbalanced Hebrew delimiter row is a damaged-text/Qumran notation review target already covered by the raw Hebrew queue, not a certification.

**The certification gate** (`bun run transcription-certification-status-chirho`) currently reports **complete = false**, with three outstanding review categories:

| Category | Count | Where |
|---|---|---|
| Raw Pass-C Hebrew spans | **90** | live validator `:8766` |
| Non-Latin expert items | **645** (Hebrew 336 · Greek 267 · Syriac 29 · Arabic 13) | expert reviewer `:8771` |
| Latin/symbol vision decisions | **563 remaining** (567 total, 4 trivial punctuation accepted by explicit policy) | reviewer `:8770` |

**Additional attribution blocker:** 10 current Pass-C human validation rows use the generic reviewer id `human-chirho`. They remain gate-blocking until they are re-reviewed or append-only reattributed to the explicit human reviewer with the live-text/hash guards emitted by the status report. Do not bulk reattribute them unless every selected row is genuinely attributable to the same named human reviewer.

**Review progress so far:** 10 schema-v2 human validation rows exist, including the applied `וְגַם־חֲמָ֖ת` correction, but all 10 currently need explicit reviewer attribution before they can help certification; 4 trivial Latin/symbol punctuation items have been accepted by explicit policy; and there are 0 expert confirmations / 0 expert issue records. Large portions of the apparent count movement came from strict-blind repairs and re-routing recovered text into expert queues, not from expert certification. So review has effectively just begun — **~0% certified** — which is exactly why the gate is red.

**Strict export is intentionally red:** the prior vol 3 p148 line 59 issue was resolved after print confirmation (`וְגַם־חֲמָ֖ת`), but the export now has one honest structural blocker: vol 3 p151 line 10 segment 3 is a boxed Syriac span with no supplied UTF-8 text. It is visible in markdown as an empty-span marker and routed to the Syriac reader with an expert-supplied-text apply path. Applying supplied text removes only the structural blank; formal expert confirmation still remains separate.

## 3. What we built this round (the apparatus, ~22 commits)

All of this was built and cross-audited via the two-witness ("metropoliluya") discipline — GPT builds, Claude audits before/after each commit, and vice versa:

- **Span-first export + strict gates** — structural (tiling, segment order, unknowns, blank spans) and semantic checks; markdown is regenerated from spans.
- **NFC normalization invariant** — one shared hash/normalize helper; a one-time corpus pass proved character-preserving (NFD-equal) on all Hebrew; non-NFC text now blocks strict + completion.
- **A fail-closed certification gate** across all three categories — nothing is ever counted "done" unless a real, attributable, hash-fresh human/expert decision says so; missing/malformed/stale/duplicate inputs all *block*, never silently pass.
- **Three live review servers** — raw Hebrew (`:8766`), Latin/symbol with a risk filter (`:8770`), non-Latin expert with per-script lanes (`:8771`) — plus static image packets for offline review.
- **Non-Hebrew Pass-C OCR is now expert-gated** — Greek/Syriac/Arabic spans that came from Pass-C OCR without explicit human/canonical provenance are included in the expert queue as `pass-c-ocr-span-chirho`, not silently trusted.
- **Acceptance / confirmation policies** — explicit, committed, reviewer-attributed, hash-anchored to the live text (so any later edit auto-invalidates a stale confirmation).
- **Non-certifying expert issue records** — the expert reviewer can flag letters/marks/punctuation/segmentation/wrong-script/wrong-source/uncertain without certifying the item. Issue records fail closed: a valid issue overrides a coexisting confirm, and the server cross-supersedes so the latest action is the only current browser-created record.
- **Guarded correction tools** — a WLC-suggestion applier (only adjusts vowels/accents/punctuation, never consonants) and a segment-safe line-repair script (migrates review keys instead of orphaning them).
- **A reviewer competence-routing guide** — Hebrew/Greek → Hallelujah; Syriac/Arabic/Targum vocalization → experts; with primers and the rule "confirm the exact letters against the print, not because the word is plausible from a standard text."
- **Strict-blind scanners** — hidden-Hebrew and non-Latin-residue scanners now report zero candidates and are fingerprinted against both current spans and current detector/helper code. The Hebrew delimiter-order audit is also fingerprinted, blocks close-before-open visual-order suspects, and proves any neighbor-unbalanced damaged-text row is still covered by raw/expert review. Missing, stale, malformed, or uncovered scanner/audit findings block completion.

## 4. Honesty disciplines baked in (why this is trustworthy)

- **"Strict passing ≠ certified."** The export can be clean while the text is still uncertified; the gate tracks the difference.
- **Fail-closed everywhere.** Missing data, stale manifests, malformed policies, D1 read errors → the gate *blocks*; it never defaults to "done."
- **Live-anchored.** Every confirmation stores the exact text + its hash; change the text and the confirmation drops automatically.
- **Attributable.** Confirmations require a reviewer + role + rationale; experts confirm only inside their competence.
- **Issue-overrides-confirm.** If an item has both a fresh expert issue and a fresh expert confirmation, the issue wins and the confirmation is not counted. That keeps "flagged problem" from being silently out-voted by "confirmed."
- **Visually verified.** Sacred text changes are checked against the print scan (this caught, e.g., that a "🕮" symbol was actually a printer's fleuron, and that ~145 "symbols" are really witness sigla 𝔐𝔊𝔙𝔖𝔗 where a misread = wrong witness).

## 5. Path to production (remaining work)

1. **Review passes** *(the bulk of the remaining effort)*:
   - **You:** 90 raw Hebrew (`:8766`) + Hebrew/Greek expert lanes (`:8771?script-chirho=hebrew-chirho` / `=greek-chirho`, 336 + 267).
   - **Experts:** Syriac (29, including the blank span), Arabic (13), and exact Aramaic/Targum vocalization.
   - **Latin/symbol (563 remaining):** mostly real proofreading — only 4 items have been accepted as trivial punctuation; the witness sigla, references, ornament-guesses, French, and proper nouns each need a look.
2. **Attribution cleanup.** Re-review or append-only reattribute the 10 generic `human-chirho` Pass-C rows to the actual human reviewer, using the status report's guarded commands and a real rationale.
3. **Gate goes green.** When all three categories are certified and attribution is explicit, `transcription-certification-status-chirho` reports **complete = true**.
4. **Ship.** The certified markdown is the production artifact — the published, citable, flawless digital edition. (Scaling beyond the current 46-page set reuses the exact same pipeline + gate.)

## 6. Current review entry points

- Raw Hebrew live validator: `http://localhost:8766/`
- Latin/symbol reviewer: `http://localhost:8770/`
- Expert Hebrew lane: `http://localhost:8771/?script-chirho=hebrew-chirho`
- Expert Greek lane: `http://localhost:8771/?script-chirho=greek-chirho`
- Expert Syriac lane: `http://localhost:8771/?script-chirho=syriac-chirho`
- Expert Arabic lane: `http://localhost:8771/?script-chirho=arabic-chirho`
- Certification status report: `workspace-chirho/certification-status-chirho/status-chirho.md`

## 7. Honest risks / notes

- **Scope:** the certified set is the current 46-page working sample across the 5 volumes, not yet the whole corpus; the machinery is built to scale, but more pages = more review.
- **The bottleneck is human/expert availability**, not code. Syriac and Arabic specifically need qualified readers.
- **Don't blanket-trust labels:** "symbol"-tagged items are mostly witness sigla, not punctuation; the system now forces these through review rather than auto-accepting them.
- **Production deploy of the certified text** has not been done and will require explicit authorization (and the gate green) before publishing.

*"Thy word is a lamp unto my feet, and a light unto my path." (Psalm 119:105) — To God be the glory.*
