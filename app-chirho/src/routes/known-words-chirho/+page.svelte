<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  let { data } = $props();

  let busyIdChirho = $state<number | null>(null);

  async function setStatusChirho(idChirho: number, statusChirho: string): Promise<void> {
    busyIdChirho = idChirho;
    try {
      await fetch("/api-chirho/known-words-chirho", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idChirho, statusChirho }),
      });
      await invalidateAll();
    } finally {
      busyIdChirho = null;
    }
  }

  async function deleteRowChirho(idChirho: number): Promise<void> {
    if (!confirm("Delete this entry permanently?")) return;
    busyIdChirho = idChirho;
    try {
      await fetch(`/api-chirho/known-words-chirho?id-chirho=${idChirho}`, {
        method: "DELETE",
      });
      await invalidateAll();
    } finally {
      busyIdChirho = null;
    }
  }

  function statusBadgeColorChirho(s: string): string {
    if (s === "human-confirmed-chirho") return "#1a3a1a";
    if (s === "flagged-chirho") return "#3a1a1a";
    return "#2a2a4a";
  }
</script>

<div class="kw-chirho">
  <h1>Known Words ({data.totalChirho})</h1>

  <div class="status-chips-chirho">
    <a class:selected-chirho={data.filterStatusChirho === ""} href="/known-words-chirho">all</a>
    {#each data.statusCountsChirho as scChirho}
      <a
        class:selected-chirho={data.filterStatusChirho === scChirho.statusChirho}
        href="/known-words-chirho?status-chirho={scChirho.statusChirho}"
      >
        {scChirho.statusChirho.replace("-chirho", "")} ({scChirho.countChirho})
      </a>
    {/each}
  </div>

  <table>
    <thead>
      <tr>
        <th>word</th>
        <th>category</th>
        <th>vol</th>
        <th>status</th>
        <th>source</th>
        <th>added</th>
        <th>actions</th>
      </tr>
    </thead>
    <tbody>
      {#each data.rowsChirho as rowChirho}
        <tr>
          <td class="word-cell-chirho">{rowChirho.wordChirho}</td>
          <td class="meta-chirho">{rowChirho.categoryChirho.replace("-chirho", "")}</td>
          <td class="meta-chirho">{rowChirho.volumeNumberChirho === 0 ? "global" : rowChirho.volumeNumberChirho}</td>
          <td>
            <span class="status-pill-chirho" style="background:{statusBadgeColorChirho(rowChirho.statusChirho)}">
              {rowChirho.statusChirho.replace("-chirho", "")}
            </span>
          </td>
          <td class="meta-chirho">
            {#if rowChirho.sourcePageIdChirho}
              p{rowChirho.sourcePageIdChirho} L{rowChirho.sourceLineIndexChirho ?? "?"}
            {:else}
              —
            {/if}
          </td>
          <td class="meta-chirho">{rowChirho.addedAtChirho?.slice(0, 10) ?? "—"}</td>
          <td class="actions-chirho">
            {#if rowChirho.statusChirho !== "human-confirmed-chirho"}
              <button disabled={busyIdChirho === rowChirho.idChirho} onclick={() => setStatusChirho(rowChirho.idChirho, "human-confirmed-chirho")}>✓ confirm</button>
            {/if}
            {#if rowChirho.statusChirho !== "flagged-chirho"}
              <button disabled={busyIdChirho === rowChirho.idChirho} onclick={() => setStatusChirho(rowChirho.idChirho, "flagged-chirho")}>⚑ flag</button>
            {/if}
            <button class="delete-chirho" disabled={busyIdChirho === rowChirho.idChirho} onclick={() => deleteRowChirho(rowChirho.idChirho)}>×</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if data.totalChirho > data.pageSizeChirho}
    <div class="pagination-chirho">
      {#if data.offsetChirho > 0}
        <a href="?status-chirho={data.filterStatusChirho}&volume-chirho={data.filterVolumeChirho}&offset-chirho={Math.max(0, data.offsetChirho - data.pageSizeChirho)}">← prev</a>
      {/if}
      <span>{data.offsetChirho + 1}–{Math.min(data.offsetChirho + data.pageSizeChirho, data.totalChirho)} / {data.totalChirho}</span>
      {#if data.offsetChirho + data.pageSizeChirho < data.totalChirho}
        <a href="?status-chirho={data.filterStatusChirho}&volume-chirho={data.filterVolumeChirho}&offset-chirho={data.offsetChirho + data.pageSizeChirho}">next →</a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .kw-chirho { max-width: 1100px; }
  h1 { color: #c9a84c; font-size: 1.4rem; }
  .status-chips-chirho { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .status-chips-chirho a { padding: 0.3rem 0.8rem; background: #1a1a2e; border-radius: 12px; color: #888; text-decoration: none; font-size: 0.85rem; }
  .status-chips-chirho a.selected-chirho { background: #c9a84c; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { text-align: left; padding: 0.5rem; border-bottom: 1px solid #2a2a4a; color: #888; font-weight: normal; text-transform: uppercase; font-size: 0.7rem; }
  td { padding: 0.5rem; border-bottom: 1px solid #1a1a2e; }
  .word-cell-chirho { font-family: "Georgia", "Noto Serif", "SBL Hebrew", "SBL Greek", serif; font-size: 1rem; color: #e0e0e0; }
  .meta-chirho { color: #888; font-size: 0.8rem; }
  .status-pill-chirho { padding: 0.15rem 0.5rem; border-radius: 8px; font-size: 0.7rem; color: #ccc; }
  .actions-chirho { display: flex; gap: 0.3rem; }
  .actions-chirho button { padding: 0.2rem 0.5rem; background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 4px; color: #ccc; font-size: 0.75rem; cursor: pointer; }
  .actions-chirho button:hover:not(:disabled) { border-color: #c9a84c; }
  .actions-chirho button:disabled { opacity: 0.5; cursor: not-allowed; }
  .actions-chirho button.delete-chirho:hover:not(:disabled) { border-color: #c93c3c; color: #f88; }
  .pagination-chirho { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; align-items: center; color: #888; }
  .pagination-chirho a { color: #c9a84c; text-decoration: none; }
</style>
