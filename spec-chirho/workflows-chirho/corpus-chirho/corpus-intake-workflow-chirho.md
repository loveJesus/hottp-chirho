<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Corpus Intake Workflow Chirho

How a PDF page outside the certified working set becomes a machine draft in the intake tier. Code: `src-chirho/corpus-intake-chirho/`. Artifacts: `workspace-chirho/corpus-intake-chirho/` (gitignored). Plan and decisions: `spec-chirho/tasklists-chirho/corpus-chirho/26-10-16_13-45-tasklist-full_corpus_intake-chirho.md`.

The intake never writes the progress database, the span corpus, the export, the review stations, D1 or R2. Nodes marked "planned" do not exist yet.

```mermaid
flowchart TD
  StartChirho([intake-runner-chirho.ts --all or --vol=N])
  ProtectChirho[protected-pages-chirho.ts: working set of 46 pages, plus any page the progress database shows events, segments or confirmed words on; read-only; missing database fails closed]
  PlanChirho[planTargetsChirho: every PDF page from pdfinfo, minus protected pages, minus pages already extracted whose image is still on disk]
  DryChirho{--dry-run?}
  CountsChirho[Print target, protected and done counts; no writes]
  PoolChirho[Bounded worker pool; one thread per tesseract and ImageMagick process]
  RenderChirho[page-geometry-chirho.ts renderPageImageToPathChirho: pdftoppm 300 dpi; deskew and trim on scanned vols 1-4]
  LinesChirho[pageLineBboxesChirho: tesseract hOCR on vols 1-4, PDF font layer on vol 5; asymmetric padding]
  TextChirho[pdftotext -layout: the page's text layer]
  HashChirho[PNG size from the header, sha256 of the image]
  DoneChirho[(recordPageDoneChirho: page row and lines replaced in one transaction)]
  FailChirho[(recordPageFailedChirho: failed status and error; earlier lines removed)]
  StopChirho{Ctrl-C?}
  RunEndChirho[(finishRunChirho: run counts, tool versions)]
  InventoryChirho[intake-inventory-chirho.ts: per-volume counts, zero-line pages, errors, disk use]
  MontageChirho[intake-montage-chirho.ts: line boxes drawn on sampled pages for an eyeball check]
  DraftRunChirho([intake-drafts-chirho.ts --all])
  DraftPagesChirho[pagesNeedingDraftsChirho: extracted pages without drafts from the current DRAFTS_VERSION_CHIRHO]
  ClassifyChirho[classifyPageChirho: hunspell fr, citations, hyphenation, known words read-only from the progress database]
  TileChirho[draft-segments-chirho.ts: words sorted left to right, same-script runs tiled across the line; gaps over 80px become unknown tiles; vol 5 font hints keep Hebrew, Greek, Syriac; Hebrew-letter runs read right to left]
  DraftStoreChirho[(recordPageDraftsChirho: segments and the page's draft marker in one transaction)]
  RecallChirho[draft-recall-chirho.ts: flag recall against reviewed spans and words on the working set]
  ReadChirho[planned: measured machine reading, L.J. picks reader and order]
  LoadChirho[planned: per-volume D1 SQL and R2 upload, each load on L.J.'s go-ahead]

  StartChirho --> ProtectChirho --> PlanChirho --> DryChirho
  DryChirho -- yes --> CountsChirho
  DryChirho -- no --> PoolChirho
  PoolChirho --> RenderChirho --> LinesChirho --> TextChirho --> HashChirho --> DoneChirho
  RenderChirho -- error --> FailChirho
  LinesChirho -- error --> FailChirho
  DoneChirho --> StopChirho
  FailChirho --> StopChirho
  StopChirho -- no, more pages --> PoolChirho
  StopChirho -- yes or queue empty --> RunEndChirho
  RunEndChirho --> InventoryChirho --> MontageChirho
  MontageChirho --> DraftRunChirho --> DraftPagesChirho --> ClassifyChirho --> TileChirho --> DraftStoreChirho
  RecallChirho -. sets the gap threshold .-> TileChirho
  DraftStoreChirho -. later phases .-> ReadChirho -.-> LoadChirho
  DoneChirho -. re-extraction drops the page's drafts .-> DraftPagesChirho
```

Re-running is safe: an extracted page with its image on disk is skipped, a failed page is retried unless `--skip-failed` is given, and a page whose image went missing is redone from scratch. Re-extracting a page deletes its draft segments (they cascade with its lines) and its draft marker, so drafts are always made from the page's current lines.

Drafts are machine hints. A draft segment's text is the unverified machine text; "french" and "latin-non-french" tiles are what the classifier accepted, and every other tile is flagged for reading. Measured on the 46 working-set pages (known words empty, 80px gaps): Greek 220/220, Syriac 30/30 and Hebrew 577/582 reviewed spans flagged; the Hebrew misses are vol 1 words tesseract turned into Latin-looking tokens.
