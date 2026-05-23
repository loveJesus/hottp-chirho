<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  import ScanlineRowChirho from "$lib/components-chirho/ScanlineRowChirho.svelte";

  let { data } = $props();

  let showReconstructedChirho = $state(false);
  let reconstructedTextChirho = $state("");
  let loadingReconstructChirho = $state(false);

  /** A segment is French when its scriptTypeChirho is the french-chirho marker. */
  function isFrenchSegmentChirho(
    segChirho: { scriptTypeChirho: string | null }
  ): boolean {
    return segChirho.scriptTypeChirho === "french-chirho";
  }

  const totalScanlinesChirho = $derived(data.scanlinesChirho.length);

  const nonFrenchLineCountChirho = $derived(
    data.scanlinesChirho.filter((slChirho) => {
      const segsChirho = data.segmentsByLineChirho[slChirho.idChirho] ?? [];
      return segsChirho.some((sChirho) => !isFrenchSegmentChirho(sChirho));
    }).length
  );

  const acceptedLineCountChirho = $derived(
    data.scanlinesChirho.filter((slChirho) => {
      const segsChirho = data.segmentsByLineChirho[slChirho.idChirho] ?? [];
      if (segsChirho.length === 0) return true;
      return segsChirho.every(
        (sChirho) =>
          isFrenchSegmentChirho(sChirho) ||
          sChirho.statusChirho === "accepted-chirho"
      );
    }).length
  );

  const progressPercentChirho = $derived(
    totalScanlinesChirho > 0
      ? Math.round((acceptedLineCountChirho / totalScanlinesChirho) * 100)
      : 100
  );

  async function loadReconstructedTextChirho() {
    loadingReconstructChirho = true;
    try {
      const responseChirho = await fetch(
        `/api-chirho/reconstruct-chirho?volume-chirho=${data.volumeNumberChirho}&page-chirho=${data.pageNumberChirho}`
      );
      const resultChirho = (await responseChirho.json()) as {
        reconstructedTextChirho?: string;
      };
      reconstructedTextChirho = resultChirho.reconstructedTextChirho ?? "";
      showReconstructedChirho = true;
    } finally {
      loadingReconstructChirho = false;
    }
  }
</script>

<div class="scanline-review-chirho">
  <!-- Navigation -->
  <nav class="breadcrumb-chirho">
    <a href="/">Dashboard</a> /
    <a href="/volumes-chirho/{data.volumeNumberChirho}">Volume {data.volumeNumberChirho}</a> /
    <a href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.pageNumberChirho}">Page {data.pageNumberChirho}</a> /
    Scanlines
  </nav>

  <div class="page-nav-chirho">
    {#if data.prevPageChirho}
      <a
        href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.prevPageChirho}/scanlines-chirho"
        class="nav-btn-chirho"
      >
        &larr; Page {data.prevPageChirho}
      </a>
    {:else}
      <span></span>
    {/if}

    <h1>Page {data.pageNumberChirho} — Scanline Review</h1>

    {#if data.nextPageChirho}
      <a
        href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.nextPageChirho}/scanlines-chirho"
        class="nav-btn-chirho"
      >
        Page {data.nextPageChirho} &rarr;
      </a>
    {:else}
      <span></span>
    {/if}
  </div>

  <!-- Progress -->
  <div class="progress-section-chirho">
    <div class="progress-text-chirho">
      {acceptedLineCountChirho} / {totalScanlinesChirho} lines complete ({progressPercentChirho}%)
      | {nonFrenchLineCountChirho} lines with non-French text
    </div>
    <div class="progress-bar-chirho">
      <div class="progress-fill-chirho" style="width: {progressPercentChirho}%"></div>
    </div>
  </div>

  <!-- Scanlines list -->
  <div class="scanlines-list-chirho">
    {#each data.scanlinesChirho as scanlineChirho (scanlineChirho.idChirho)}
      <ScanlineRowChirho
        scanlineChirho={scanlineChirho}
        segmentsChirho={data.segmentsByLineChirho[scanlineChirho.idChirho] ?? []}
      />
    {/each}

    {#if data.scanlinesChirho.length === 0}
      <p class="no-data-chirho">No scanlines found. Run the scanline pipeline first.</p>
    {/if}
  </div>

  <!-- Reconstructed text -->
  <div class="reconstruct-section-chirho">
    <button
      class="btn-reconstruct-chirho"
      onclick={loadReconstructedTextChirho}
      disabled={loadingReconstructChirho}
    >
      {loadingReconstructChirho
        ? "Loading..."
        : showReconstructedChirho
          ? "Refresh Reconstruction"
          : "View Reconstructed Text"}
    </button>

    {#if showReconstructedChirho}
      <div class="reconstructed-body-chirho" dir="auto">
        <pre>{reconstructedTextChirho}</pre>
      </div>
    {/if}
  </div>
</div>

<style>
  .scanline-review-chirho {
    max-width: 1100px;
  }

  .breadcrumb-chirho {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .breadcrumb-chirho a {
    color: #c9a84c;
    text-decoration: none;
  }

  .page-nav-chirho {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .page-nav-chirho h1 {
    font-size: 1.3rem;
    color: #c9a84c;
  }

  .nav-btn-chirho {
    padding: 0.4rem 0.8rem;
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-radius: 4px;
    color: #c9a84c;
    text-decoration: none;
    font-size: 0.85rem;
  }

  .nav-btn-chirho:hover {
    background: #2a2a4a;
  }

  .progress-section-chirho {
    margin-bottom: 1.25rem;
  }

  .progress-text-chirho {
    font-size: 0.82rem;
    color: #888;
    margin-bottom: 0.3rem;
  }

  .progress-bar-chirho {
    height: 4px;
    background: #2a2a4a;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill-chirho {
    height: 100%;
    background: #c9a84c;
    border-radius: 2px;
    transition: width 0.3s;
  }

  .scanlines-list-chirho {
    margin-bottom: 2rem;
  }

  .no-data-chirho {
    color: #666;
    text-align: center;
    padding: 3rem;
  }

  .reconstruct-section-chirho {
    border: 1px solid #2a2a4a;
    border-radius: 8px;
    background: #12121f;
    overflow: hidden;
  }

  .btn-reconstruct-chirho {
    display: block;
    width: 100%;
    padding: 0.6rem;
    background: #1a1a2e;
    border: none;
    border-bottom: 1px solid #2a2a4a;
    color: #c9a84c;
    font-size: 0.85rem;
    cursor: pointer;
    text-align: center;
    transition: background 0.2s;
  }

  .btn-reconstruct-chirho:hover { background: #2a2a4a; }
  .btn-reconstruct-chirho:disabled { opacity: 0.5; cursor: not-allowed; }

  .reconstructed-body-chirho {
    padding: 1rem 1.5rem;
    max-height: 50vh;
    overflow-y: auto;
  }

  .reconstructed-body-chirho pre {
    font-family: "Georgia", "Noto Serif", "SBL Hebrew", "SBL Greek", serif;
    font-size: 0.92rem;
    line-height: 1.8;
    color: #d0d0d0;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>
