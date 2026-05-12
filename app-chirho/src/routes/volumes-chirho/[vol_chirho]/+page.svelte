<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  let { data } = $props();

  function statusLabelChirho(statusChirho: string): string {
    switch (statusChirho) {
      case "lines-extracted-chirho": return "Lines extracted";
      case "lines-approved-chirho": return "Lines approved";
      case "complete-chirho": return "Complete";
      case "ocr-done-chirho": return "OCR done";
      case "cropped-chirho": return "Cropped";
      case "pending-chirho": return "Pending";
      default: return statusChirho.replace("-chirho", "").replace(/-/g, " ");
    }
  }

  function statusColorChirho(statusChirho: string): string {
    switch (statusChirho) {
      case "complete-chirho":
      case "lines-approved-chirho": return "#4caf50";
      case "ocr-done-chirho":
      case "lines-extracted-chirho": return "#2196f3";
      case "cropped-chirho": return "#ff9800";
      default: return "#666";
    }
  }
</script>

<div class="volume-page-chirho">
  <nav class="breadcrumb-chirho">
    <a href="/">Home</a> / Volume {data.volumeNumberChirho}
  </nav>

  <h1>Volume {data.volumeNumberChirho} — pages ({data.pagesChirho.length})</h1>

  <div class="pages-grid-chirho">
    {#each data.pagesChirho as pageChirho}
      <a
        href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{pageChirho.pageNumberChirho}"
        class="page-card-chirho"
        title="{statusLabelChirho(pageChirho.statusChirho)} · {pageChirho.totalSegmentCountChirho} segments"
      >
        <div class="page-num-chirho">p. {pageChirho.pageNumberChirho}</div>
        <div class="page-info-chirho">
          <span class="non-french-count-chirho">
            {pageChirho.nonFrenchSegmentCountChirho} non-french
          </span>
          <span
            class="status-dot-chirho"
            style="background: {statusColorChirho(pageChirho.statusChirho)}"
          ></span>
        </div>
      </a>
    {/each}
  </div>

  {#if data.pagesChirho.length === 0}
    <p class="empty-chirho">No pages synced for this volume yet.</p>
  {/if}

  <div class="actions-chirho">
    <a href="/api-chirho/export-chirho?volume-chirho={data.volumeNumberChirho}" class="export-btn-chirho">
      Export Markdown (legacy)
    </a>
  </div>
</div>

<style>
  .volume-page-chirho { max-width: 1000px; }
  .breadcrumb-chirho { font-size: 0.85rem; color: #666; margin-bottom: 1rem; }
  .breadcrumb-chirho a { color: #c9a84c; text-decoration: none; }
  h1 { font-size: 1.5rem; color: #c9a84c; margin-bottom: 1.5rem; }
  .pages-grid-chirho { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
  .page-card-chirho { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 6px; padding: 0.75rem; text-decoration: none; color: inherit; transition: border-color 0.2s; text-align: center; }
  .page-card-chirho:hover { border-color: #c9a84c; }
  .page-num-chirho { font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem; color: #e0e0e0; }
  .page-info-chirho { display: flex; justify-content: center; align-items: center; gap: 0.4rem; }
  .non-french-count-chirho { font-size: 0.75rem; color: #888; }
  .status-dot-chirho { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .empty-chirho { color: #666; text-align: center; padding: 2rem; }
  .actions-chirho { margin-top: 2rem; display: flex; gap: 1rem; }
  .export-btn-chirho { padding: 0.5rem 1.25rem; background: #1a3a1a; color: #4caf50; border: 1px solid #2a4a2a; border-radius: 6px; text-decoration: none; font-size: 0.9rem; transition: background 0.2s; }
  .export-btn-chirho:hover { background: #2a4a2a; }
</style>
