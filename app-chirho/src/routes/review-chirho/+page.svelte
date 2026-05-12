<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();

  function setFilterChirho(fChirho: string) {
    const urlChirho = new URL(window.location.href);
    urlChirho.searchParams.set("filter", fChirho);
    window.location.href = urlChirho.toString();
  }
</script>

<svelte:head>
  <title>Review queue · HOTTP</title>
</svelte:head>

<section class="container-chirho">
  <h1>Review queue</h1>
  <p class="hint-chirho">
    Pages with non-French segments grouped by BHS/LXX match confidence.
    <strong>Needs review</strong> = at least one segment lacks a high-confidence canonical match.
  </p>

  <div class="filters-chirho">
    <button class:active-chirho={data.filterChirho === "needs-review"} onclick={() => setFilterChirho("needs-review")}>
      Needs review
    </button>
    <button class:active-chirho={data.filterChirho === "high-confidence"} onclick={() => setFilterChirho("high-confidence")}>
      All-confirmed pages
    </button>
    <button class:active-chirho={data.filterChirho === "all"} onclick={() => setFilterChirho("all")}>
      All pages
    </button>
  </div>

  <table class="rollup-chirho">
    <thead>
      <tr>
        <th>Vol</th>
        <th>Page</th>
        <th>Total non-FR</th>
        <th class="conf-high-chirho">✓ High</th>
        <th class="conf-medium-chirho">◐ Medium</th>
        <th class="conf-low-chirho">? Low</th>
        <th class="conf-none-chirho">∅ None</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.pagesChirho as p}
        <tr>
          <td>{p.volChirho}</td>
          <td>{p.pageChirho}</td>
          <td>{p.totalChirho}</td>
          <td class="conf-high-chirho">{p.highChirho ?? 0}</td>
          <td class="conf-medium-chirho">{p.mediumChirho ?? 0}</td>
          <td class="conf-low-chirho">{p.lowChirho ?? 0}</td>
          <td class="conf-none-chirho">{p.noneChirho ?? 0}</td>
          <td>
            <a href="/volumes-chirho/{p.volChirho}/pages-chirho/{p.pageChirho}">Open</a>
          </td>
        </tr>
      {/each}
      {#if data.pagesChirho.length === 0}
        <tr><td colspan="8" class="empty-chirho">No pages match this filter.</td></tr>
      {/if}
    </tbody>
  </table>
</section>

<style>
  .container-chirho { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
  .hint-chirho { color: #555; font-size: 0.9rem; margin-bottom: 1rem; }
  .filters-chirho { margin-bottom: 1rem; display: flex; gap: 0.5rem; }
  .filters-chirho button {
    padding: 0.4rem 0.8rem; border: 1px solid #ccc; background: #fff;
    border-radius: 4px; cursor: pointer; font-size: 0.85rem;
  }
  .filters-chirho button.active-chirho { background: #2563eb; color: white; border-color: #2563eb; }
  .rollup-chirho { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .rollup-chirho th, .rollup-chirho td {
    padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee;
  }
  .rollup-chirho th { background: #f7f7f7; font-weight: 600; }
  .conf-high-chirho { color: #16a34a; font-weight: 500; }
  .conf-medium-chirho { color: #ca8a04; }
  .conf-low-chirho { color: #dc2626; }
  .conf-none-chirho { color: #6b7280; }
  .empty-chirho { text-align: center; color: #888; padding: 2rem; }
  a { color: #2563eb; }
</style>
