<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP reader Chirho

The SvelteKit 2 page reader for Barthélemy's *Critique textuelle de l'Ancien Testament*, deployed as the Cloudflare Worker `hottp-chirho` (custom domain `hottp-chirho.bible.systems`). Bindings live in `wrangler-chirho.toml`: D1 `DB_CHIRHO`, R2 `R2_CHIRHO` and the reviewer sign-in rate limiter.

Bun only, at the version pinned in `../.bun-version`.

```bash
bun install --frozen-lockfile
bun run dev -- --port 5180   # local reader; 5173 is often taken by other projects
bun run check                # svelte-check: must report 0 errors and 0 warnings
bun run build                # Cloudflare Worker bundle in .svelte-kit/cloudflare
```

Reader tests and browser checks live in `../spec-chirho/page-reader-checks-chirho/`; the reading workflow is `../spec-chirho/workflows-chirho/page-reading-workflow-chirho.md`.

Production deploys and D1 loads happen only on L.J.'s go-ahead. Apply schema files with `wrangler d1 execute --file`, never `wrangler d1 migrations apply --remote`.
