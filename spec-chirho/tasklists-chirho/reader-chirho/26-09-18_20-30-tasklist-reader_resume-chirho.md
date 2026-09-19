<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Resumable page reading Chirho

L.J.: likes the interface, asks whether it goes to a new subdomain/Worker, directs continued development.

Hosting: existing app config targets Worker `hottp-chirho`, custom hostname `hottp-chirho.bible.systems`; public HEAD returned 200. No separate deployment needed for the new reader. No DNS, Worker, D1, production or approval mutations authorized/performed in this unit.

- [x] Inspect current state, active workflow, deployment config and existing local implementation.
- [x] Normalize text/box drafts around their original source record, in a module under page-reader-chirho/drafts-chirho.
- [x] Add bounded tab-local session backup and reload recovery, with source-change holds and visible failure handling. Never silently evict unfinished work.
- [x] Add attention/language navigation without removing French context or changing confirmation semantics.
- [x] Prove refresh/revisit recovery, source-conflict hold, full/denied/malformed storage behavior, and existing interaction gates. Run check/build and browser tests.
- [x] Update workflow, progress and handoff with hosting/acceptance boundaries.

No new dependency or backend service. Tab backup is not submission, authentication, certification, an approved repair proposal, or durable archival. Export remains required before closing the tab. Runtime source/image revision proof remains limited to record identity, text/script/geometry and the existing image key.

Evidence: 17 unit tests / 62 assertions, 22 recovery browser assertions (zero writes), 29 regression browser assertions (four intercepted requests). Svelte check zero errors/warnings, build passed. Full workflow/evidence in `spec-chirho/workflows-chirho/page-reading-workflow-chirho.md`. Local preview remains port 5178. No commit, push, production write or repair approval performed.
