<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP reader provenance release Chirho

L.J. authorized continued development/deployment. Source `9a55a22` (provenance `2bb7d02` plus mobile CSS follow-up) is live at https://hottp-chirho.bible.systems on the existing Worker, version `7ef3d75d-1393-4d16-ab9b-ecadc3829cd2` at 100% (`2026-09-19T18:43:46Z`). No new hostname, source-content migration, OCR retrain or canonical repair.

## Product result

- Fixed a live save failure: 225 machine-reconciled words had event-implied confirmation flags that disagreed with D1 and permanently failed CAS. The reader now uses actual current rows and raw flags for saves.
- All 234 machine readings are clearly unverified and remain in attention. Anonymous historical activity and unattributed legacy marks cannot masquerade as human review. A confirmed badge requires a matching authenticated shared-reviewer receipt and current text/script/box/status. It is not independent certification or per-person attribution.
- Legacy event POST cannot mint those receipts: server-owned source, stripped proof fields, and historical type/aggregate allowlists. Claude's audits caught both forged-receipt fields and reserved segment event interference; both were fixed before deployment.
- Current page/indexed receipt reads replace snapshot replay on the default reader. A paired D1 index was added; actual remote query plans use record seeks. The advanced legacy tools remain accessible and retain their older sequential/non-CAS behavior, which does not earn a reader receipt badge.
- A final real phone viewport exposed inherited sticky-scan occlusion of the selected field. Removed that mobile stickiness; a rendered hit-visibility regression fails before and passes after at 320/390/700px. Earlier no-overflow checks did not prove visibility, and the release ledger records the correction.

## Evidence and preservation

App check: zero errors/warnings; frozen dependencies and Cloudflare build passed. Local: 24 unit tests, 13 D1 cases and 131 browser assertions, plus the three mobile visibility cases. Hosted on the final version: 47 read/refusal smoke assertions, 16 public browser assertions and three mobile visibility cases; no valid production confirmation was submitted. Build credential scan passed over 146 files. The deployed asset version matches the committed-source build.

Full-row hashes before and after release match for all seven reader content tables, including the legacy mutation tables not covered by the event ledger: 46 pages, 1,076 scanlines, 11,938 words, 1,925 segments, zero snippets, 275 known words and 237 events (max seq 752). The two unattributed legacy segment flags remain unchanged. Only the index DDL changed schema; it reported one schema row written. Local certification-witness fingerprint remains unchanged at `2584f948...` (46/11938/67). Test confirmations and the clipped-folio fixture existed only in an isolated disposable copy, never synced to production.

Release ledger: `spec-chirho/tasklists-chirho/reader-chirho/26-09-19_14-05-tasklist-reader_proof-chirho.md`. Row-hash evidence: `spec-chirho/page-reader-checks-chirho/proof-chirho/deploy-fingerprint-chirho.json`. Workflow: `spec-chirho/workflows-chirho/page-reading-workflow-chirho.md`.

## Boundaries

Andrew's hands-on acceptance remains open. Geometry repair stays a local export: free 2D boxes cannot be losslessly converted to the station's contiguous 1D tiling. A future station deep link is the safe integration direction. Raw-station dirty files were excluded. Station certification failures, OCR suggestion provenance, and witness/retrain decisions remain separate; this release does not close them.

Recovery is fix-forward preferred; the previous authenticated Worker retains security but reintroduces the provenance/save defect. The May anonymous-write Worker is not an automatic rollback target.

Local consensus: Claude's pre-release audits 23653 and 23656 independently verified the receipt query/raw-CAS design and closure of the mint route. Audit 23666 agreed with the initial hosted report, independently checking deployment/counts/specific legacy rows/index/build secrets/witness fingerprint, but not recomputing the full-row hashes (those are GPT's evidence). Final audit 23676 agreed with this revised report without amendments, independently confirming the CSS-only product change, active final deployment, unchanged counts/legacy rows/index count, no shared-reviewer events, and final build-secret exclusion. Ready for portfolio notification.
