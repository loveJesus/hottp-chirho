<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP unused build cleanup

Owner approval: L.J.'s direct request, "hallelujah can you free up space from unused builds etc?" on 2026-09-19. Progress row 2933.

Scope: completed HOTTP reader test dependencies, generated outputs, and disposable test-state copies only. Keep worktree sources and branches, the current release artifact, retained acceptance evidence, canonical databases, source scans, models, Python toolchains, and all unrelated dirty paths. AICEO owns shared user-cache cleanup; this seat does not touch it.

- [x] Inventory allocated sizes and coordinate ownership. Claude #23763 has no dependency on the reader temporary copies; AICEO #23755/#23761 scopes shared caches separately.
- [x] Verify exact candidates are ignored/generated or disposable copies, with no active users; stop only our completed test server if necessary. Proof build paths contain no tracked files; source commit is an ancestor of main. Stopped our Vite 5178 process (93817), whose parent command explicitly named the regression copy; its child processes exited.
- [x] Remove validated explicit targets and record allocated bytes (not an aggregate claim from concurrent free-space changes).
- [x] Verify retained source/worktree state, deployed artifact, canonical witness, and unrelated dirty paths; report recovery instructions and cleanup receipt.

## Candidate targets

Within `/private/tmp/hottp-reader-proof-chirho-es5yAv`, retain the registered worktree but remove its ignored `app-chirho/node_modules` and `app-chirho/.svelte-kit` once inactive. The worktree is at 9a55a22 and its source is included in main.

Within `/private/tmp/hottp-reader-release-chirho-5M6P8r`, inspect `state-chirho` and `regression-state-chirho` as local test database/R2 copies. Within `/private/tmp/hottp-reader-evidence-chirho-eKss3X`, inspect `state-chirho` similarly. Retain other scripts, release evidence, and old deployment snapshots in these directories for this cleanup.

## Result

Removed these five explicit directories after `lsof +D` returned no open files and the old test-server process tree had exited. Checked each target was a real directory, not a root symlink. All five are absent after cleanup.

| Exact path | Allocated KiB before removal |
| --- | ---: |
| `/private/tmp/hottp-reader-proof-chirho-es5yAv/app-chirho/node_modules` | 242084 |
| `/private/tmp/hottp-reader-proof-chirho-es5yAv/app-chirho/.svelte-kit` | 8664 |
| `/private/tmp/hottp-reader-release-chirho-5M6P8r/state-chirho` | 9604 |
| `/private/tmp/hottp-reader-release-chirho-5M6P8r/regression-state-chirho` | 10692 |
| `/private/tmp/hottp-reader-evidence-chirho-eKss3X/state-chirho` | 10692 |

Total removed allocation measured by `du -sk`: **281736 KiB / 288497664 bytes / 275.13 MiB**. This is target allocation, not a claim of exclusively reclaimed physical APFS blocks; clones, shared blocks, snapshots, and concurrent cleanup can affect free-space changes. Data-volume free space after this operation was 98 GiB; other seats were cleaning concurrently, so that overall increase is not attributed to HOTTP.

The registered proof worktree remains at 9a55a22 with empty `git status --short`; its source, branch, test source, and lockfile remain. Main's unrelated raw-station edits and untracked files remain unmodified by this cleanup. Current main dependencies, workspace data, Python environments, old deployment snapshots, and retained screenshots/scripts were not removed.

Protected byte hashes, identical before/after:

- Canonical witness sqlite: `3c9ab06d0305035305b9f525307b600e22ea9f07554e959cb8aa2acca3827d40` (no sidecars at either check). No database opening or writes were used for this comparison.
- Current release adapter: `42013ad7ef2dee1bb1cddade4c6ae6e1b228c535c0219fb2c72ac8bd34526134`, 41 files, matching the retained release receipt. Hash concatenates sorted relative paths and file bytes.

Removal is permanent, not Trash. Dependencies/output can be recreated in the retained proof app using `bun install --frozen-lockfile` and the documented build/test commands with a fresh isolated `HOTTP_LOCAL_PERSIST_CHIRHO` directory. Disposable synthetic test writes were intentionally discarded; acceptance evidence and canonical inputs remain. No production or remote deletion occurred. Metropoleluya coordination kept shared-cache ownership separate and confirmed no peer depended on these targets.
