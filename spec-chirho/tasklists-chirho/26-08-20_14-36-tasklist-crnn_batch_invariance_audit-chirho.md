<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# CRNN batch-invariance audit

- [x] Inspect the batching commits, shared worktree, and exact invariance claims.
- [x] Reproduce all 86 held-out prediction strings at batch sizes 1, 2, 3, 4, 8, 16, 32, and 86.
- [x] Challenge invariance with reordered batches, mixed-width production crops, and CPU/MPS execution.
- [x] Verify width-grid arithmetic, inference coverage, and the published metric decomposition.
- [x] Confirm the intentionally unchanged training path remains length-unaware.
- [x] Independently adjudicate `p0159-x644-y459` from an exact and padded Volume 1 re-cut.
- [x] Audit the MD5 split, Wilson estimate, and finite-population uncertainty.
- [x] Run focused gates, finish the progress record, and send Claude the independent verdict.
