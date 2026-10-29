<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="find-page-chirho">
  <nav class="breadcrumb-chirho" aria-label="Breadcrumb"><a href="/">Home</a> / Find a reading</nav>
  <h1>Find a reading</h1>

  <!-- Workflow: page-reading-workflow-chirho.md. GET navigation never changes readings. -->
  <form method="GET" action="/find-chirho">
    <label for="find-query-chirho">Biblical reference, or volume:PDF page</label>
    <div class="find-fields-chirho">
      <input id="find-query-chirho" name="q-chirho" type="text" maxlength="80" required
        value={data.queryChirho ?? ''} placeholder="Isaiah 8:12 · Ps 22 · 3:151" aria-describedby="find-help-chirho" />
      <button type="submit">Find</button>
    </div>
    <small id="find-help-chirho">
      A reference finds loaded pages whose matched segments cite it (verse, chapter, or book).
      volume:page, like 3:151, opens that PDF page directly — PDF numbering, not the printed folio.
    </small>
  </form>

  {#if data.queryChirho === null}
    <p class="guide-chirho">
      Examples: <a href="/find-chirho?q-chirho=Isaiah+8:12">Isaiah 8:12</a> ·
      <a href="/find-chirho?q-chirho=2+Sam+7:4">2 Sam 7:4</a> ·
      <a href="/find-chirho?q-chirho=Psaumes+22,17">Psaumes 22,17</a> ·
      <a href="/find-chirho?q-chirho=3:151">3:151</a>
    </p>
  {:else if data.unparsedChirho}
    <p class="notice-chirho" role="status">
      “{data.queryChirho}” was not recognized. Use a book name with optional chapter and verse
      (Isaiah 8:12, Ps 22, 2 Sam 7), or volume:PDF page (3:151). French names and common
      abbreviations work; chapter and verse may be separated by “:” or “,”.
    </p>
  {:else if data.refusedChirho}
    <p class="notice-chirho" role="status">{data.refusedChirho}</p>
  {:else if data.pagesChirho && data.pagesChirho.length === 0}
    <p class="notice-chirho" role="status">
      No loaded page cites {data.referenceChirho}. This searches canonically matched segments
      of loaded pages only — not the full text, and not pages the intake has not loaded yet.
    </p>
  {:else if data.pagesChirho}
    <p class="summary-chirho" role="status">
      {data.referenceChirho}: {data.segmentCountChirho} matched
      {data.segmentCountChirho === 1 ? 'segment' : 'segments'} on {data.pagesChirho.length}
      {data.pagesChirho.length === 1 ? 'page' : 'pages'}.
    </p>
    <ul class="matches-chirho">
      {#each data.pagesChirho as matchChirho (matchChirho.volumeNumberChirho + ':' + matchChirho.pageNumberChirho)}
        <li>
          <a href="/volumes-chirho/{matchChirho.volumeNumberChirho}/pages-chirho/{matchChirho.pageNumberChirho}">
            Volume {matchChirho.volumeNumberChirho}, PDF page {matchChirho.pageNumberChirho}
          </a>
          <span>{matchChirho.segmentCountChirho} matched {matchChirho.segmentCountChirho === 1 ? 'segment' : 'segments'}</span>
        </li>
      {/each}
    </ul>
    <p class="scope-note-chirho">
      Matches come from canonical matching of detected segments, not certified readings.
      Open a page and use its local search to land on the exact span.
    </p>
  {/if}
</div>

<style>
  .find-page-chirho{max-width:1000px;}.breadcrumb-chirho{font-size:.85rem;color:#aaa;margin-bottom:1rem;}
  a{color:#c9a84c;text-decoration:none;}a:hover{text-decoration:underline;}h1{font-size:1.5rem;color:#c9a84c;margin-bottom:.75rem;}
  form{display:grid;gap:.4rem;margin:1.5rem 0;max-width:100%;}label{font-size:.85rem;color:#e0e0e0;}
  .find-fields-chirho{display:flex;gap:.5rem;flex-wrap:wrap;}
  input,button{font:inherit;border:1px solid #666680;border-radius:5px;padding:.45rem .65rem;background:#1a1a2e;color:#e0e0e0;}
  input{width:18rem;min-width:0;max-width:100%;}button{cursor:pointer;color:#e3c875;}
  small,.guide-chirho,.notice-chirho,.summary-chirho,.scope-note-chirho{font-size:.9rem;color:#b8b8c5;line-height:1.5;}
  small{font-size:.75rem;max-width:34rem;}
  a:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid #e3c875;outline-offset:3px;}
  .matches-chirho{list-style:none;padding:0;display:grid;gap:.5rem;margin:1rem 0;}
  .matches-chirho li{display:flex;flex-wrap:wrap;gap:.35rem .75rem;align-items:baseline;background:#1a1a2e;border:1px solid #41415b;border-radius:6px;padding:.6rem .75rem;}
  .matches-chirho span{font-size:.75rem;color:#b8b8c5;}.scope-note-chirho{margin-top:1rem;}
</style>
