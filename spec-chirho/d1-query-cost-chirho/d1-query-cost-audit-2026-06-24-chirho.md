<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# D1 Query Cost Audit — 2026-06-24

## Scope Chirho

Audited the Cloudflare-facing SvelteKit/D1 routes under `app-chirho/src/routes`.
The goal is to keep the public reader on Cloudflare while avoiding accidental
wide scans, malformed numeric parameters, or public GET writes.

## Changes Chirho

- Centralized numeric query parsing in `query-params-chirho.ts`; malformed ids,
  cursors, limits, and offsets now fail with HTTP 400 before reaching D1.
- Bounded cursor-style reads:
  - events: default 1000, maximum 5000 rows.
  - OCR suggestions: maximum 1000 rows per page.
  - known words offset: maximum 5000 rows skipped.
  - page list/export routes: maximum 5000 pages.
- Removed D1 mutation from `GET /api-chirho/reconstruct-chirho`; it now returns
  reconstructed text without updating `pages_chirho`.
- Added D1 indexes for page-scoped OCR suggestions and volume-only known-word
  paging in `0014-d1-query-cost-guards-chirho.sql`.

## Current Route Cost Shape Chirho

- Page/scanline/segment/snippet routes are bounded by a page id, scanline id, or
  volume+page lookup and use existing page/scanline/segment indexes.
- Event sync is bounded by cursor+limit and uses the page+sequence or primary
  sequence indexes already present.
- OCR suggestions are page-scoped and now indexed for page+bucket+confidence.
- Known-word listing remains offset-based for now, but the offset is capped; if
  this table grows materially, migrate it to cursor pagination.
- The review rollup route intentionally aggregates all non-French segments. It
  is useful for admin review, but should not become an unauthenticated hot public
  dashboard without caching or a precomputed rollup.
- Homepage and volume dashboards still compute live aggregate counts. These are
  acceptable at current corpus size, but published high-traffic usage should
  cache or precompute the count summaries.

## Deployment Boundary Chirho

Cloudflare D1 is appropriate for the read-mostly reader. The authoring/review
servers should remain on a VPS or local box because they need filesystem assets,
SQLite single-writer state, and native/OCR tooling. Do not port those write-heavy
review stations to Workers without a separate D1 design.
