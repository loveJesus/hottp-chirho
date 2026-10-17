<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const firstChirho = $derived(data.pagesChirho[0]?.pageNumberChirho);
  const lastChirho = $derived(data.pagesChirho.at(-1)?.pageNumberChirho);
  function statusLabelChirho(statusChirho: string): string {
    switch (statusChirho) {
      case 'lines-extracted-chirho': return 'Lines extracted';
      case 'lines-approved-chirho': return 'Lines approved';
      case 'complete-chirho': return 'Complete';
      case 'ocr-done-chirho': return 'OCR done';
      case 'cropped-chirho': return 'Cropped';
      case 'pending-chirho': return 'Pending';
      default: return statusChirho.replace('-chirho', '').replace(/-/g, ' ');
    }
  }
</script>

<div class="volume-page-chirho">
  <nav class="breadcrumb-chirho" aria-label="Breadcrumb"><a href="/">Home</a> / Volume {data.volumeNumberChirho}</nav>
  <h1>Volume {data.volumeNumberChirho}</h1>
  <p class="window-summary-chirho" role="status">
    {#if data.pagesChirho.length}
      Showing {data.pagesChirho.length} loaded pages, PDF pages {firstChirho}–{lastChirho}.
    {:else}No loaded pages in this window.{/if}
    Up to {data.windowSizeChirho} pages are shown at a time.
  </p>
  <!-- Workflow: page-reading-workflow-chirho.md. GET navigation never changes readings. -->
  <div class="browse-controls-chirho">
    <nav class="pagination-chirho" aria-label="Page windows">
      <a href="/volumes-chirho/{data.volumeNumberChirho}">First pages</a>
      {#if data.previousBeforeChirho !== null}
        <a href="?before-chirho={data.previousBeforeChirho}" rel="prev">← Previous pages</a>
      {:else}<span aria-disabled="true">← Previous pages</span>{/if}
      {#if data.nextFromChirho !== null}
        <a href="?from-chirho={data.nextFromChirho}" rel="next">Next pages →</a>
      {:else}<span aria-disabled="true">Next pages →</span>{/if}
    </nav>
    <form method="GET" action="/volumes-chirho/{data.volumeNumberChirho}">
      <label for="from-page-chirho">Start at PDF page</label>
      <div class="jump-fields-chirho">
        <input id="from-page-chirho" name="from-chirho" type="number" min="1" step="1" max="9007199254740991" required
          value={firstChirho ?? data.requestedFromChirho} aria-describedby="page-number-help-chirho" />
        <button type="submit">Go</button>
      </div>
      <small id="page-number-help-chirho">PDF page number, not the printed folio. Gaps skip to the next loaded page.</small>
    </form>
  </div>

  <div class="pages-grid-chirho">
    {#each data.pagesChirho as pageChirho (pageChirho.idChirho)}
      <a href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{pageChirho.pageNumberChirho}" class="page-card-chirho">
        <strong>p. {pageChirho.pageNumberChirho}</strong>
        <span>{pageChirho.totalSegmentCountChirho} segments · {pageChirho.nonFrenchSegmentCountChirho} non-French</span>
        <span>{statusLabelChirho(pageChirho.statusChirho)}</span>
      </a>
    {/each}
  </div>
  {#if !data.pagesChirho.length}<p class="empty-chirho">Try First pages or a lower PDF page number. New intake pages appear only after they are loaded.</p>{/if}
  <p class="scope-note-chirho">Segment counts describe detected text, not confirmed readings. Machine drafts still need comparison with the print.</p>
  {#if firstChirho !== undefined && lastChirho !== undefined}
    <div class="actions-chirho">
      <a href="/api-chirho/export-chirho?volume-chirho={data.volumeNumberChirho}&from-chirho={firstChirho}&to-chirho={lastChirho}" class="export-btn-chirho">
        Download these pages (legacy Markdown)
      </a>
      <p>Only the displayed range, not the whole volume. Unverified stored text may lag reader edits; this is not a certified export.</p>
    </div>
  {/if}
</div>

<style>
  .volume-page-chirho{max-width:1000px;}.breadcrumb-chirho{font-size:.85rem;color:#aaa;margin-bottom:1rem;}
  a{color:#c9a84c;text-decoration:none;}a:hover{text-decoration:underline;}h1{font-size:1.5rem;color:#c9a84c;margin-bottom:.75rem;}
  .window-summary-chirho,.scope-note-chirho,.empty-chirho{color:#b8b8c5;font-size:.9rem;line-height:1.5;}
  .browse-controls-chirho{display:flex;flex-wrap:wrap;align-items:start;gap:1.5rem;margin:1.5rem 0;}
  .pagination-chirho{display:flex;flex-wrap:wrap;gap:.5rem;}.pagination-chirho a,.pagination-chirho span{padding:.5rem .65rem;border:1px solid #4a4a63;border-radius:5px;font-size:.85rem;}
  .pagination-chirho span{color:#8d8d9f;border-color:#303043;}form{display:grid;gap:.4rem;max-width:100%;}label{font-size:.85rem;color:#e0e0e0;}
  .jump-fields-chirho{display:flex;gap:.5rem;}input,button{font:inherit;border:1px solid #666680;border-radius:5px;padding:.45rem .65rem;background:#1a1a2e;color:#e0e0e0;}
  input{width:9rem;min-width:0;max-width:100%;}button{cursor:pointer;color:#e3c875;}small{font-size:.75rem;color:#b8b8c5;max-width:24rem;}
  a:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid #e3c875;outline-offset:3px;}
  .pages-grid-chirho{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;}
  .page-card-chirho{display:flex;flex-direction:column;gap:.4rem;background:#1a1a2e;border:1px solid #41415b;border-radius:6px;padding:.75rem;text-align:center;color:#e0e0e0;}
  .page-card-chirho:hover{border-color:#c9a84c;}.page-card-chirho span{font-size:.75rem;color:#b8b8c5;}.scope-note-chirho{margin-top:1.25rem;}
  .actions-chirho{margin-top:1.5rem;}.export-btn-chirho{display:inline-block;max-width:100%;padding:.5rem .8rem;background:#1a3a1a;color:#9ed29f;border:1px solid #4d6d4d;border-radius:6px;font-size:.9rem;}
  .actions-chirho p{max-width:44rem;color:#b8b8c5;font-size:.8rem;line-height:1.5;}
</style>
