<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Side-by-side page reading Chirho

The default Svelte page route is the reading workspace. `?view-chirho=tools-chirho` retains the previous word/language tools for volumes 1-4, including their existing write contracts behind the common reviewer gate. Volume 5 stays in the full-page reader because its old line-image crops are incorrect. The raw Pass-C station is separate; its approval and certification gates are not replaced by this interface.

```mermaid
flowchart TD
  PageChirho[Open one page] --> JoinChirho[Page-indexed scanline and segment join]
  JoinChirho --> TextChirho[French context plus non-French phrases]
  WordsChirho[Current page word rows and raw CAS flags] --> TextChirho
  ReceiptChirho[Indexed latest record receipt] --> ProofChirho{Matches current row, actor, source and scope?}
  WordsChirho --> ProofChirho
  JoinChirho --> ProofChirho
  ProofChirho -->|yes plus raw flag and no open flag| ColorChirho[Shared-reviewer confirmation badge]
  ProofChirho -->|no| AttentionChirho[Machine, anonymous or unattributed remains unverified]
  TextChirho --> SelectChirho[Select reading inline]
  ScanChirho[Source page on left] --> SelectChirho
  SelectChirho --> CropChirho[Linked highlight and padded magnifier]
  CropChirho --> DraftChirho[Edit text locally; Tab retains drafts]
  DraftChirho --> BackupChirho[Bounded tab-local session backup]
  BackupChirho --> RevisitChirho[Refresh or revisit page in same tab]
  RevisitChirho --> CompareChirho{Original source record and image key still match?}
  CompareChirho -->|yes| ResumeChirho[Recover draft and selected reading, unconfirmed]
  CompareChirho -->|no| StaleChirho[Hold draft; export or explicitly discard]
  BackupChirho -->|storage failure| WarnChirho[Keep edits in memory; warn and guard navigation]
  DraftChirho --> DownloadChirho[Download all unsubmitted reading drafts]
  DownloadChirho --> FileChirho[Choose backup on the same page in a fresh tab]
  FileChirho --> ValidateFileChirho[Bound file size and schema; discard unknown fields]
  ValidateFileChirho --> PreviewChirho[Preview only; no draft change or upload]
  PreviewChirho --> RestoreChirho[Explicit Restore drafts]
  RestoreChirho --> MergeChirho{Page and image match; merged count within limit?}
  MergeChirho -->|no| RefuseRestoreChirho[Explain refusal; preserve existing work and file]
  MergeChirho -->|yes| KeepExistingChirho[Keep every existing draft; add missing keys without rebasing]
  KeepExistingChirho --> CompareChirho
  KeepExistingChirho --> BackupChirho
  CropChirho --> BoxChirho[Move or resize box locally]
  BoxChirho --> HoldChirho[Hold text confirmation]
  HoldChirho --> ExportChirho[Download unsubmitted repair draft for review]
  HoldChirho --> DiscardChirho[Discard draft and restore source box]
  DraftChirho --> ConfirmChirho[Explicit Confirm and next or Ctrl/Cmd Enter]
  ConfirmChirho --> GateChirho{Image loaded; original box; no repair draft; no write in flight}
  GateChirho --> AuthChirho{Signed in; raw source and observed cursor still match}
  AuthChirho -->|yes| BatchChirho[Atomic event insert and projection with SQL rollback assertion]
  AuthChirho -->|no| RetainChirho[Retain draft; report unconfirmed save]
  BatchChirho -->|acknowledged success| RefreshChirho[Reload authoritative state and advance]
  BatchChirho -->|HTTP/network/ambiguous response| RetainChirho
  RefreshChirho -->|refresh failure| RefreshHoldChirho[Hold further confirmation until reload]
```

## Placement and scope

- `app-chirho/src/lib/page-reader-chirho/`: reading model, scan/crop/geometry component, page controller, explicit confirmation transport, extracted legacy component/styles. No new dependency.
- `app-chirho/src/lib/server-chirho/page-lines-chirho.ts`: shared bounded page query for the page reader and scanline route. Includes lines without segments. No per-line SQL calls.
- Fresh segment rows remain the non-French phrase layer; current D1 words supply individual editable targets elsewhere. The established overlapping phrase precedence remains; this is not a reconciliation of word and segment storage. Only the advanced legacy tools read snapshots/event tails.
- Missing current words fall back to segment rows, including French text. A line with no segments keeps its stored line text. No coordinates are invented for missing boxes.
- Tab/Shift-Tab traverse without submitting. The Move through selector chooses all readings, needs-attention readings, or a language; Next and Tab honor it without hiding any French context. Ctrl/Cmd-Enter explicitly confirms and advances. Plain Enter edits the field. In-flight confirmation blocks duplicate writes and selection changes.
- Geometry edits only affect tab-local drafts. Export retains record identity, original/proposed box and text, and `approved_chirho: false`. This export is **not** an approved repair proposal and is **not yet wired into the canonical repair intake**. A separate download includes all text/box drafts, including conflicts or records no longer available in the page.
- `drafts-chirho/session-store-chirho.ts` backs up each page in sessionStorage under one application-owned key. Text and box changes share the source record captured when editing began. Refresh/revisit restores selection and proposed values, never a confirmation. Changes to record identity, scanline, text, script, geometry, or image key hold recovered drafts; the reader must export/discard/review rather than overwrite changed source.
- Limits: eight unfinished pages, 200 draft entries per page, 8,192 UTF-16 code units per source/proposed text and 262,144 code units for the entire serialized shelf. Limits, quota denial, silently dropped writes, unsupported versions and malformed backups cause a visible warning; no automatic eviction or overwrite of unreadable state. Clearing one page preserves other pages. Edits remain in memory when backup fails, and navigation is cancellable in that case. Successful tab backup permits page navigation/revisit without a discard prompt.
- Tab storage is a convenience, not durable archival, account isolation, or an authorization boundary. Download before closing the tab or clearing browser data. Same-key replacement of an image is not detected cryptographically; image revision/provenance is still outside this UI proof.
- Downloaded reading backups can be explicitly restored on their original page. `drafts-chirho/file-backup-chirho.ts` shares the tab validator, discards unknown fields, and merges without replacing existing drafts. `DraftBackupChirho.svelte` owns file preview and feedback; the page controller alone owns draft state, source holds and confirmation. See the dated recovery evidence below.
- Human-confirmed color requires the raw flag and a source-matching shared-reviewer receipt, not merely a historical flag, dictionary validity, model confidence, or canonical match. It does not certify the page, publication, independent witness, or source image identity.

## Reference and fidelity boundary

Andrew's May 11 and July 9 saved voice notes request Lace-like source-left/full-text-right reading, direct inline editing, magnification, keyboard traversal and easier box correction. Reference: [Lace2 editing guide](https://github.com/brobertson/Lace2/blob/7a9a43b34f4eb870312c8d5b5a643f62e2c12f82/editing.html), inspected in a separate local checkout at commit `7a9a43b34f4eb870312c8d5b5a643f62e2c12f82`. No GPL implementation copied. The public trylace.org demo failed DNS; Lace was not run in this pass. This is an adaptation of documented interactions, not a claim of full Lace parity (zoning, CTS/TEI, etc.).

## Local evidence, 2026-09-18

- `bun run check` in app-chirho: zero errors, zero warnings; `bun run build`: successful Cloudflare-adapter build, no deployment.
- `bun test spec-chirho/page-reader-checks-chirho/model-chirho.test.ts`: 8 tests / 23 assertions, all pass. Covers fallback, missing geometry, event folding, orphan phrases, write payload scope, explicit word-event choice, HTTP/network/ambiguous-response refusal.
- Browser harness `spec-chirho/page-reader-checks-chirho/browser-chirho.js`: 29 assertions pass. Real local vol 3 / page 151: 600 snapshot-backed targets; earlier missing-snapshot run showed 91 segment targets and French context. All four attempted confirmation requests were intercepted: no reviewer action was persisted.
- Browser checks exercise draft retention across Tab/back, no modal, source/crop visibility, HTTP 409 and connection failure, in-flight deduplication, successful advance, pointer move, keyboard resize, repair hold after closing repair mode, export payload, cancelled navigation, restoration, and no body overflow at 1440/1024/768/390 pixels. No runtime page errors; expected failed-request console entries came from injected failure tests.
- Separate missing-image check: confirmation disabled; Ctrl-Enter issued zero writes.
- Browser testing caught and fixed a real reactive-state defect: `Object.hasOwn` did not subscribe to an absent draft property. The hold now reads the reactive property itself; the failing close-repair-mode case is retained in the harness.
- Source PNG and existing snapshot were copied into **local R2 emulator only**, for vol 3/page 151. Local D1 and canonical/prod reviewer records were not edited. Screenshot and JSON evidence are under `workspace-chirho/reviewer-ui-chirho/26-09-18-lace-*`.

## Acceptance boundary as of 2026-09-18, superseded below for release security

Andrew has not tried this iteration. His trackpad walkthrough and actual Lace session remain open. Production deployment is not authorized here. Existing application API authorization, reviewer attribution, event/segment concurrency and snapshot-tail limits have not been certified by this UI pass; do not treat mocked-write browser tests as end-to-end production write acceptance. Known source box/text defects and production OCR provenance remain unresolved. The page-local repair export must be connected to the approved repair intake before it can replace that workflow.

## Continued development, 2026-09-18 evening

- Hosting checked: `app-chirho/wrangler-chirho.toml` still targets Worker `hottp-chirho` and `hottp-chirho.bible.systems`; public HEAD returned HTTP 200. No new Worker/subdomain, DNS change or deployment. A separate preview deployment is optional, not required by this interface.
- `bun test spec-chirho/page-reader-checks-chirho/`: 17 tests / 62 assertions pass, including bounded storage and non-eviction, source comparison and malformed/denied backup refusal.
- Recovery browser harness: 22 assertions pass on an isolated local browser tab, zero API mutations, zero runtime errors. Tests refresh/geometry/revisit, stale-source and changed-image-key holds, conflict export, explicit discard, Greek/attention traversal, quota-denial recovery, malformed-state preservation and guarded navigation. Conflict fixtures are injected before hydration, after the old document flushes its backup.
- Existing browser harness: 29 assertions still pass, four confirmation requests intercepted. Its navigation case now injects a failed tab backup, because normal successful backup intentionally permits navigation. Existing responsive checks still cover 1440/1024/768/390 widths.
- Final Svelte check reports zero errors/warnings; final Cloudflare-adapter build passes. Browser checks exposed an early-hydration click being ignored; selectable reading buttons now remain disabled until the client draft recovery has initialized. The backup banner is below the fixed workspace so creating the first box draft does not shift the scan during a drag.
- Session evidence: `workspace-chirho/reviewer-ui-chirho/26-09-18-draft-recovery-evidence-chirho.json`, `26-09-18-resumable-reader-chirho.png`, and the failure-case screenshot. None is proof of production write acceptance.

## Release contract, 2026-09-19

Authority: L.J.'s direct instruction, "continue dev and even deploy". Existing Worker `hottp-chirho`, existing hostname `hottp-chirho.bible.systems`; no new service, schema migration, gold/model change, production content test write or R2 source rewrite. Tasklist: `26-09-19_00-10-tasklist-reader_release-chirho.md`.

```mermaid
flowchart TD
  PublicChirho[Public page and local drafts] --> LoginChirho[Existing shared reviewer credential]
  LoginChirho --> LimitChirho[Per-IP login limit and bounded form]
  LimitChirho --> SessionChirho[Signed 8-hour HttpOnly Secure SameSite Strict cookie]
  SessionChirho --> RouteChirho[Decoded route identity plus handler-level reviewer check]
  RouteChirho --> OriginChirho[Exact Origin and JSON required for API mutation]
  OriginChirho --> SourceChirho[Raw expected text, status, script, box, identity and cursor]
  SourceChirho --> TransactionChirho[Conditional insert plus projection plus rollback assertion]
  TransactionChirho --> ActorChirho[Fixed shared-reviewer-chirho actor; no individual certification]
  PublicChirho --> UnitsChirho{Known volume-5 unit mismatch?}
  UnitsChirho -->|yes| ScaleChirho[Display in XML 892 by 1263 at 300/72 coordinate world]
  UnitsChirho -->|no| NativeChirho[Native image coordinate world]
  ScaleChirho --> BoundsChirho[Strict individual bounds; page-scale mismatch threshold 1 percent]
  NativeChirho --> BoundsChirho
  BoundsChirho --> ConfirmChirho[Only visible in-bounds print can be confirmed]
  BoundsChirho --> RawChirho[Drafts and CAS keep raw stored coordinates]
```

- Auth lives in `server-chirho/review-chirho`, the hook, and `/reviewer-chirho`. Cookie signing uses a dedicated new secret. Rotate that secret with credential changes to revoke sessions; password rotation alone does not. Login limiter is best-effort per Cloudflare location, not a globally serialized counter. Public GET events remains available to `sync-from-d1-chirho.ts`.
- Hook authorization and private-cache selection use decoded `route.id`, including percent-encoded paths. Every mutating handler checks the session again. Shared writes store the fixed actor, never the credential username. This shared account grants no repair approval or per-person station attribution.
- `/api-chirho/reading-confirmations-chirho` validates bounded input, refuses empty new text, NFC-normalizes only new text, compares legacy expected text raw, and uses one D1 transaction. The third SQL statement deliberately fails if an inserted event has no projection, rolling back both. Word and segment concurrency use the observed event cursor plus raw source match. Existing legacy tool mutation contracts are gated, but have not all been upgraded to this transactional contract.
- Page event tails are bounded at 2,000; a truncated tail holds confirmation. A successful save removes the local draft only after acknowledgment; reload reads server state, never an optimistic overlay. Failed refresh holds further confirmation. Stale/failed/ambiguous saves retain the draft.
- `coordinate-space-chirho.ts` mirrors `read_volume_page_chirho.py` for volume 5. The actual image dimensions map into the raw coordinate world; the SVG uses independent x/y scales. Pointer edits and exports remain in raw units, so no display-scaled coordinates enter CAS. Small padded folio overshoots hold only their individual boxes. The five clipped segment boxes can be absent from the displayed word layer because the corresponding word boxes fit; the missing-snapshot fallback exercises their hold.
- Volume-5 legacy line-image navigation redirects to the calibrated full-page reader. Its 158 old R2 line images remain unchanged and need a separately authorized re-cut; this release does not certify those assets.

### Executed release evidence

- `bun test spec-chirho/page-reader-checks-chirho/`: 24 tests, 101 assertions pass. Svelte check: zero errors/warnings. Cloudflare-adapter build passes. Frozen install makes no dependency changes.
- Seven D1 integration cases pass against local Miniflare and a disposable remote D1: mismatched source refusal, competing writer, SQL-error rollback, zero-row projection rollback, segment audit/geometry preservation, NFC and empty-input behavior. The disposable remote database was deleted after exact ID/name verification. This tests remote D1 SQL semantics, not a successful write through the production Worker.
- Local browser suites: 29 interaction checks, 22 recovery checks, 31 release/auth checks (two real confirmations against a copied local D1 only), and 12 coordinate checks. Encoded-path auth, origin/content-type refusal, stale-tab conflict, persisted word/segment reload and sign-out are exercised. Original interaction tests intercept confirmations; recovery/coordinate tests issue no content mutations.
- Coordinate preflight against a copy of the witness and live PNG headers: 25 pages, all five volume-5 pages calibrated, zero whole-page holds, exactly five clipped segment boxes. Browser check covers calibrated overlay/magnifier/drag/export, hidden bad line views, clipped folio hold and another same-page confirmation remaining enabled. Responsive widths 1440/1024/768/390 were exercised by the interaction suite.
- Test corrections were not product evidence: Bun 1.4's Miniflare spawn failed with EBADF, so the D1 suite runs under Node after a Bun bundle. Pointer tests now wait for the repair target to become actionable and for its reactive style update. The initial folio browser fixture used an in-bounds snapshot word; it was replaced by the actual missing-snapshot segment fallback. All failed attempts are excluded from passing counts.
- Local testing uses `HOTTP_LOCAL_PERSIST_CHIRHO` pointing to a copied `/v3` directory. Canonical witness file bytes changed through WAL checkpointing, but its logical certification fingerprint remains `2584f94848864b77ab75d9cbd4743474d5f861c835ec87140df65c7e1cca53cb` (46 pages, 11,938 words, 67 suggestions); no reviewer test writes landed there. Do not claim byte-level untouchedness.
- Claude's earlier read-only audits 23622-23628 caught an encoded-path authentication deploy blocker, shared credential username exposure, a zero-row projection rollback gap, the NFC gap, vol-5 mis-scaling and excessive page-level folio holds. All were fixed before deployment. The final sweeps checked encoded-route gating, actor privacy, live D1 schema compatibility, build secret exclusion, witness fingerprint and all 25 page-coordinate inputs; no release blockers remained in 23630/23632. Unrelated raw/approval fingerprint staleness and latin/expert station HTTP 500s are outside this release; the whole-project certification gate is not claimed green.

### Remaining boundaries and recovery

Andrew's hands-on acceptance is open. Box-repair exports remain unsubmitted drafts, not canonical approvals. Worker confirmations remain outside the canonical certification/training DB. Gold relabelling, OCR provenance and length-aware retraining are unchanged.

Post-release audit 23634 identified two prod segments with unattributed legacy `human-confirmed-chirho` status and no event: 9782 and 9793. Treat these readings as unverified; their actor/date and exact origin are unknown. Hosted tests did not target them and made no signed-in legacy PATCH calls. Their status was rechecked read-only, not reset. Event-count/max-sequence comparisons cover only event-producing paths: legacy segment/scanline/snippet/known-word PATCH writes cannot be excluded by that ledger alone. Hosted refusal evidence and request scope are recorded separately in the release tasklist/report.

The prior hosted version `6644c9ec-517b-4bdd-aeb5-411c95e690d2` permits anonymous writes and is **not a safe automatic rollback target**. Prefer a scoped fix-forward or an authenticated prior-reader presentation. If emergency rollback is needed, first retain an authenticated mutation gate or explicitly disable mutation routes; do not silently reopen anonymous writes. Deployment version and read-only/refused-write hosted smoke evidence are recorded in the release tasklist after deployment.

## Current-row confirmation evidence, 2026-09-19 afternoon

The new reader no longer derives save preconditions from event replay. Audit 23643 identified 225 machine `word-text-corrected` events replayed as human-confirmed while their D1 flags remained zero, making every save conflict. All 234 machine events (225 reconciliation, 9 vision) remain readable but unverified and eligible for attention. Anonymous historical events and unattributed flags also remain unverified. Stored statuses are not migrated or reset.

`review-chirho/reading-evidence-chirho.ts` classifies the current source and latest receipt in the same SQL read. A recorded badge requires the current raw flag, page/line/record identity, allowed confirmation type, fixed shared actor, server-minted source/scope, new text, script, and raw x/y/width/height; words also require the row's last-event pointer. Open script flags remain attention items. Unknown/malformed/mismatching evidence fails conservatively. The raw flag still goes to CAS, including true legacy flags, so a fresh legitimate confirmation can replace uncertainty without falsifying preconditions.

The loader observes the page event cursor before reading current rows; concurrent updates may cause a conservative 409, not authorization from a newer cursor over older data. Receipt queries seek by record identity with one result per current row, independent of snapshot sequence or historical tail size. The JSON segment expression uses an affinity-free correlated ID (unary plus) so SQLite selects the expression index instead of walking page history. Responses carry a state label, not receipt payloads. Costs scale with current page rows, not the corpus or accumulated event history; no per-record network round trips.

**Schema prerequisite:** apply only `app-chirho/src/lib/server-chirho/review-chirho/reading-evidence-index-chirho.sql` to D1 before this release. It creates `events_segment_receipt_chirho`; it changes no content/status. The paired DDL lives beside its query because the inherited flat migration directory already has 15 entries and production was seeded outside migration tracking. Do not replay the historical migration set on production. Fresh local database setup must apply this paired index after the words/events schema. Missing index remains functionally compatible but falls back to page-history scanning; verify the actual query plan before claiming indexed performance.

The legacy events POST preserves its historical nine event types and three aggregates, validates that allowlist at runtime, overwrites payload source to `legacy-editor-chirho`, and removes receipt scope/expected-source/attempt fields. It cannot mint or shadow segment receipts. Both forged word-confirmation payloads were exercised through actual HTTP on disposable data. Legacy writes still have their older non-CAS/sequential projection behavior and cannot earn a recorded-reader badge. D1-admin writes remain trusted infrastructure, not an app-auth boundary. Never sync a test copy back to production.

Proof: 24 model/session/security tests, seven atomic D1 tests, six current-row/evidence D1 tests, and 131 browser assertions (29 interaction, 22 recovery, 31 release/auth, 12 coordinates, 29 provenance, eight legacy refusal). The D1 evidence fixture advances snapshot sequence beyond receipts and adds 2,100 unrelated events, then checks the actual generated query plans. The browser re-confirms a machine word with raw false and a legacy segment with raw true, checks stale-tab refusal and full-reload proof, then attempts forged legacy receipts; only the disposable copy is modified. A missing-current-word folio fixture removes copied word 4978 to expose the clipped segment fallback; absent R2 snapshots no longer drive that behavior. Desktop/mobile screenshots were visually inspected. Local witness logical fingerprint remains `2584f94848864b77ab75d9cbd4743474d5f861c835ec87140df65c7e1cca53cb` (46/11938/67).

New proof runners live under `spec-chirho/page-reader-checks-chirho/proof-chirho/`. Bundle `evidence-d1-chirho.ts` with Bun (`--target=node --packages=external`) into `app-chirho/.svelte-kit/`, then run `node --test` from the repo root. Browser functions use a disposable reader on port 5182 with synthetic fixture credentials; seed PNGs 1:148, 3:151, 5:148 and 2:151, and copy the two legacy segment statuses only into that fixture. Stop its server before replacing/resetting the copied database. The legacy refusal runner is repeatable without content writes; the provenance/release runners require a fresh fixture.

Remaining product work: Andrew's hands-on acceptance and a lossless station deep link. Do not adapt free 2D reader boxes into contiguous 1D Pass-C tilings: that would invent neighbour boundaries and drop y/height. Repair drafts remain local exports, not approved proposals. OCR/gold/training/prod-suggestion provenance remain separate owner decisions.

## Find and share a reading, 2026-09-19 development

```mermaid
flowchart TD
  FindChirho[Stored-text search or line jump] --> SelectChirho[Select a current page token; keep all context and drafts]
  SelectChirho --> CopyChirho[Copy page plus word/segment identity and source digest]
  CopyChirho --> OpenChirho[Open public reading link]
  OpenChirho --> MatchChirho{Current stored source matches?}
  MatchChirho -->|yes| FocusChirho[Select exact reading; recover this tab's drafts independently]
  MatchChirho -->|no| NoticeChirho[Explain changed or missing source; select no substitute]
  FocusChirho --> LoginChirho[Optional sign-in retains strictly validated fragment]
  LoginChirho --> ConfirmChirho[Existing explicit confirmation and source CAS, unchanged]
```

`ReadingNavigatorChirho.svelte` owns only page-local navigation. The parent owns selection, draft recovery, confirmation and access. `navigation-chirho.ts` folds case, combining marks and bidi controls for literal substring search over stored tokens, not drafts; an empty folded query matches nothing. Search result traversal wraps, while normal review-scope traversal retains its existing behavior. Line numbers are transcription indices, not an assertion about printed folios. No search term, draft text, raw box, or credential is embedded in copied URLs, and navigation issues no content mutation requests.

Reader fragments use `#reading-chirho=<word/segment-key>&source-chirho=<sha256>`. The digest binds page pathname, record key, line index, stored text, script and raw box; it is a stale-source check, not authorization or proof of human review. A re-seed that removes/reuses an ID, changed source or malformed target does not select a guessed replacement. These links deliberately remain distinct from station item identifiers; no 2D-to-1D repair adapter is implied. Changing pathname conventions can invalidate existing digests. The exact same pathname on the two hosting aliases remains compatible.

Explicit valid links take precedence over backed-up selection without replacing drafts. Unrelated fragments such as `#top` are ignored. A cancelled asynchronous check cannot override a newer selection. The sign-in return-path allowlist accepts only existing numeric volume/page routes and this exact bounded fragment; arbitrary queries, external URLs, repeated delimiters and malformed fingerprints are refused. Clipboard denial leaves a selectable link on screen.

The mobile transcription now grows with its controls while its text area keeps a bounded scroll viewport. On shorter desktop layouts the transcription panel can scroll rather than clipping controls. The global app header is in normal flow: its previous sticky overlay covered a focused reading after viewport changes. Browser checks now hit-test both the active field and confirmation button, not only horizontal overflow. Mutation authorization, confirmation and source geometry behavior remain unchanged; only the strict sign-in return location gains the validated fragment.

Local development proof is recorded in `spec-chirho/tasklists-chirho/reader-chirho/26-09-19_16-15-tasklist-reader_navigation-chirho.md`. Navigation subsequently shipped on September 26; its hosted evidence is in `spec-chirho/page-reader-checks-chirho/navigation-chirho/release-2026-09-26-chirho.json`. Andrew's hands-on acceptance remains open.

### Earlier mobile viewport follow-up (deployed before navigation)

The source scan stays in normal document flow on the stacked mobile layout. Sticky positioning previously overlaid the active textarea even though the page had no horizontal overflow. A real hosted viewport caught it; `proof-chirho/mobile-visibility-chirho.js` fails before the change and passes afterward at 320/390/700px by checking the element actually hit at the editor's center. Inspect the actual scrolled viewport as well as a top-reset full-page screenshot; a screenshot assembled across sticky positions is not proof that the active field is unobstructed. Source `9a55a22` is the final CSS follow-up to provenance source `2bb7d02`.

## Restore a downloaded draft, 2026-10-15 local development

Download all drafts before closing a tab. To resume, open the original page, expand **Restore from a download**, choose that JSON file, inspect the draft count, and press **Restore drafts**. File selection alone changes nothing. Reading backups from the September release still work without a selected-record field. Repair-proposal exports are a different format and cannot be restored as reading backups.

- File bytes never leave the browser. The input is capped at 4,194,304 bytes before reading, with a second UTF-8 size check before JSON parsing; shared per-page/draft/text/box validation still applies. Unknown properties at every draft/source/box level are discarded so a large unrelated property cannot wedge the tab shelf. No new dependency, API, database migration or source write.
- Restore merges against state at the click, not the earlier preview. Every existing draft wins an overlap; repeats are idempotent. Wrong page/image, malformed entries, duplicate identities or a merge above 200 entries refuse without replacing anything. Earlier-image drafts already in the tab receive their own download/discard guidance rather than an error blaming the incoming file.
- Original source identity, text, script and raw box stay attached to imported drafts. Stale or missing records remain held and downloadable, never silently rebased or assigned to a replacement token. A box edit retains the existing confirmation hold. Confirmation badges and CAS expectations still come from current server data, never imported flags. Anonymous drafting is supported, but explicit authenticated confirmation remains a separate operation.
- Tab-storage failure does not throw away imported or pre-existing in-memory edits. The result reports memory-only recovery, keeps the original file available, and preserves the navigation warning. The status updates when storage recovers and clears after drafts are discarded. The live status element remains rendered while empty. Eight-page and total-shelf limits are unchanged; oversized genuine draft sets may remain memory-only, visibly, until reduced or exported.
- An older asynchronous file read cannot replace a newer file preview; destroying the page invalidates pending reads. The page component remains keyed by page identity. No draft text is added to shared links.

Proof and remaining boundaries are recorded in `spec-chirho/tasklists-chirho/reader-chirho/26-10-15_19-47-tasklist-reader_draft_restore-chirho.md`. Browser checks use copied D1/R2 with synthetic reviewer credentials and intercept every content mutation. This development does not publish the feature or constitute Andrew's acceptance, canonical review, source-image certification or model remediation.

## Bounded volume browsing and legacy export, 2026-10-17 local development

```mermaid
flowchart TD
  VolumeChirho[Open volume or jump to PDF page number] --> CursorChirho[Validate one forward or backward cursor]
  CursorChirho --> WindowChirho[Composite index seek: 24 pages plus one overfetch]
  WindowChirho --> CountsChirho[One indexed count over visible page IDs only]
  WindowChirho --> OppositeChirho[One opposite-direction page seek]
  CountsChirho --> CardsChirho[Page cards with detected segment counts]
  OppositeChirho --> CardsChirho
  CardsChirho --> ReadChirho[Open one page in the existing reading workspace]
  CardsChirho --> RangeChirho[Request displayed PDF page range as legacy Markdown]
  RangeChirho --> BoundChirho[Require explicit volume and bounds; cap rows and SQL fields]
  BoundChirho -->|missing, invalid or oversized| RefuseChirho[Explain refusal; emit no partial download]
  BoundChirho --> TextChirho[Use reconstructed text or mark French fallback as needs review]
  TextChirho --> BytesChirho{UTF-8 output at most 1 MiB?}
  BytesChirho -->|no| RefuseChirho
  BytesChirho -->|yes| DownloadChirho[Range-named unverified download; private no-store]
```

`server-chirho/catalog-chirho/` separates strict request parsing, window queries and range export. The volume route selects only identity, page number and status; no French/reconstructed text crosses that listing boundary. A single scanline/segment join is restricted to at most 24 visible page IDs, using existing indexes. No volume total or schema migration is required. Forward cursors are inclusive (`from-chirho`); backward cursors are exclusive (`before-chirho`), descending during selection and ascending on screen. Gaps skip to the next loaded PDF page. Empty windows offer a first-page reset and no download. Browsing does not change readings or review provenance.

The web Markdown endpoint now requires `volume-chirho`, `from-chirho` and `to-chirho`, each a single positive safe decimal integer. It refuses more than 24 loaded pages, suppresses text fields over 64 KiB inside SQL and refuses if a required text field exceeds that bound. A large unused French field does not reject a valid small reconstructed reading. Final UTF-8 output is capped at 1 MiB; failures never return truncated Markdown. Volume-only legacy URLs receive a 400 before DB access; the volume UI supplies its displayed bounds. Existing offline/certification full-volume exports are unchanged.

Every successful web download labels itself a range, unverified legacy stored text and potentially behind current reader edits; its filename includes the range. NULL/blank reconstructed text retains the existing French fallback plus needs-review marker. Volume-5 fallback can still contain legacy PDF font codes. Counts/status/downloads are not evidence of human confirmation, transcription accuracy or certification. This endpoint remains public pending the separate Access decision; bounding a response is not access control or a global scraping/rate limit.

Local proof: 42 unit tests / 208 assertions; seven real local D1 scale/export tests; 34 actual browser/HTTP/download checks with zero content mutations or page runtime errors. On a synthetic 1,418-page / 184,340-segment volume, the measured three-query window reads 5,114 rows versus 300,616 for one whole-volume count. Complete traversal and sparse backward navigation pass. See `spec-chirho/tasklists-chirho/reader-chirho/26-10-17_16-05-tasklist-reader_scale-chirho.md` for commands, screenshots and scope. This is not production performance evidence or a deployment.

Before deploying, verify production's actual composite page index and query plans read-only; production was seeded outside migration tracking. The home-page summary (`catalog-chirho/home-chirho.ts`, row 2953) no longer aggregates segments: it counts pages and approved pages per volume in one pass, which the local proof (now including migration 0002) answers from the covering index `idx_pages_vol_approved_chirho`, reading one entry per page. Production must show the same plan, and that index must exist there, before the home page counts as bounded. Neither these changes nor the synthetic fixture certify readiness to load the whole corpus.
