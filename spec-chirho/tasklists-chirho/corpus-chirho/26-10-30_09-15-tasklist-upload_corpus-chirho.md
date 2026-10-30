<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Publish the prepared corpus Chirho

Authority: L.J., 2026-10-30, "ok it seems to not have all the content in case you can upload the rest of the content (you said it would not cost much)". This authorizes the remaining five-volume upload behind the existing password, not certification, model work, station changes, or replacing reviewed data. Ledger row 2957. Existing Worker version 2ed6b14d; no new hosting service.

Placement: a grouped `src-chirho/corpus-intake-chirho/publish-chirho/` module; resumable manifests, SQL and recovery evidence in ignored `workspace-chirho/corpus-intake-chirho/publish-chirho/`. Use existing S3 and D1 APIs with bounded concurrency. Insert new pages/lines/segments only; never UPDATE, REPLACE or DELETE production book rows. Coordinate-based lookups map generated IDs. One atomic batch includes every row of each new page; existing-page uniqueness conflicts abort rather than overwrite. Resume reconciles remote state, not only a local success marker.

- [x] Read current plan, instructions, Git/ownership, source counts and reader contracts. Main was clean at 553e492; no new HOTTP room work since 30723. Source: 5,289 pages, 232,644 lines, 693,530 draft segments, 2,361,659,706 image bytes.
- [x] Implement bounded dry-run/preflight, insert-only batches, create-once R2 images with hashes, and recovery checks. Retain 168 zero-width machine segments as text with unusable boxes (the reader refuses confirmation); do not fabricate their geometry.
- [x] Prove rollback, duplicate/resume, unexpected-existing-page refusal, page/line mapping and machine-only status on a disposable database. Local intake suite 23 tests / 131 assertions; strict typecheck passes. Actual remote D1 copied production DDL: late duplicate segment rolls back pages/lines/segments to 0/0/0, clean retry gives 1/1/1, duplicate page refused and no trust promotion. Disposable DB 96d4178e deleted after proof.
- [x] Capture current production full rows privately, plus the untouched local witness hash. Keep all 46 existing pages and unrelated tables unchanged. Dry-run manifest SHA256 9097abac406213122f21f0efc3d54e943e86758a75a211b4e8c7b34674b9493a; every one of 5,289 images hashed and dimension-checked. Existing page-coordinate overlap refused.
- [ ] Upload and verify volume 1 (807 new / 812 total).
- [ ] Upload and verify volume 2 (1,101 new / 1,106 total).
- [ ] Upload and verify volume 3 (1,413 new / 1,418 total).
- [ ] Upload and verify volume 4 (985 new / 990 total).
- [ ] Upload and verify volume 5 (983 new / 1,009 total).
- [ ] Verify all 5,335 pages, new row contents and image objects, browser spot-checks in all volumes, password protection, unchanged existing data/witness. Machine OCR and vol-5 legacy font-code limitations remain unverified, not certified.
- [ ] Commit/push explicit owned source/docs/receipt paths, close ledger, and hand off the live result and remaining reading-quality work.

Recovery: unknown-outcome writes are reconciled against remote page coordinates and complete expected rows before retry; never replay into an existing page. Failed atomic batches leave no partial page. Already-uploaded immutable R2 objects can remain and be reused. No global database restore or delete is part of this task.

Preflight found 1,930 padded bottom lines extending by at most 12 px, the documented intake allowance. The publisher intersects only this padding with image bounds. It also found 18 zero-width vol-5 font-layer lines carrying artificial 1 px segment placeholders; these publish with zero-width boxes, retaining text but refusing confirmation. No page scan or source intake record was changed. These adjustments are in the frozen manifest.
