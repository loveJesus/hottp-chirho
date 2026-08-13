<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Segment Repair Apply Lane Chirho

This Mermaid DAG describes the audited path that turns a draft segment repair
proposal into a live data change (reviewer UX v2 Phase 4). Code:
`src-chirho/segment-repair-approval-server-chirho.ts` (station, port 8772),
`src-chirho/segment-repair-apply-chirho.ts` (engine),
`src-chirho/revert-segment-repair-chirho.ts` (documented reverse path),
`src-chirho/segment-repair-store-lock-chirho.ts` (store mutual exclusion).
Guards: `src-chirho/check-segment-repair-approval-server-guards-chirho.ts`,
run inside `bun run check-certification-chirho`.

Drafting is a separate workflow:
`segment-repair-proposal-workflow-chirho.md`.

```mermaid
flowchart TD
  DraftChirho([Draft proposal in store])
  OpenStationChirho[Open approval station: crop, full line, old vs proposed spans, exact geometry]
  HumanDecideChirho{Certifying human decision with rationale}
  RejectedChirho[Rejected: terminal, live data untouched]
  ApprovedChirho[Approved: decision recorded, still no data change]
  ApplyGateChirho{Apply gates: image hash live, line text unchanged, before-state spans match, tiling contiguous}
  RefusedChirho[Apply refused with reason; proposal stays approved]
  BackupChirho[Backup FIRST: byte-exact line copy + manifest with reverse command]
  InvalidateChirho[Invalidate validations: rows whose segment changed get non-certifying tombstones; identical segments keep their rows]
  RewriteChirho[Atomic span line rewrite; changed spans shed stale human metadata]
  AppliedChirho[Proposal marked applied under store lock]
  ReReviewChirho[Touched segments return to the pending review queues]
  RevertChirho{Reverse path needed?}
  RevertCliChirho[revert CLI: dry-run manifest, double-entry after-hash, tombstone re-reviews, restore exact bytes]
  RevertedChirho[Proposal marked reverted: terminal]

  DraftChirho --> OpenStationChirho
  OpenStationChirho --> HumanDecideChirho
  HumanDecideChirho -- reject --> RejectedChirho
  HumanDecideChirho -- approve --> ApprovedChirho
  ApprovedChirho --> ApplyGateChirho
  ApplyGateChirho -- any gate fails --> RefusedChirho
  RefusedChirho --> ApplyGateChirho
  ApplyGateChirho -- all pass --> BackupChirho
  BackupChirho --> InvalidateChirho
  InvalidateChirho --> RewriteChirho
  RewriteChirho --> AppliedChirho
  AppliedChirho --> ReReviewChirho
  AppliedChirho --> RevertChirho
  RevertChirho -- yes --> RevertCliChirho
  RevertCliChirho --> RevertedChirho
```

Fail-closed ordering: validations are invalidated **before** the file rewrite,
so an interruption between the two can only leave the line under-certified
against unchanged data — never certified against changed data. Machine
reviewers can draft; only explicit humans can approve, apply, or revert
(same attribution guard as every certifying write). Certification counts move
only through these visible transitions.
