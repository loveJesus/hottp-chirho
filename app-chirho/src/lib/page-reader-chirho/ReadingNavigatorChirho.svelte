<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import type { ReadingLineChirho, ReadingTokenChirho } from './model-chirho';
  import { matchingReadingsChirho, nextMatchChirho } from './navigation-chirho';

  let { linesChirho, tokensChirho, selectedKeyChirho, selectedLinkChirho, disabledChirho, onselectChirho }: {
    linesChirho: ReadingLineChirho[];
    tokensChirho: ReadingTokenChirho[];
    selectedKeyChirho: string | null;
    selectedLinkChirho: string;
    disabledChirho: boolean;
    onselectChirho: (tokenChirho: ReadingTokenChirho) => void;
  } = $props();
  let queryChirho = $state(''), lineNumberChirho = $state<number>();
  let messageChirho = $state(''), copiedLinkChirho = $state('');
  const matchesChirho = $derived(matchingReadingsChirho(tokensChirho, queryChirho));
  const matchIndexChirho = $derived(matchesChirho.findIndex((tokenChirho) => tokenChirho.keyChirho === selectedKeyChirho));
  $effect(() => { selectedKeyChirho; copiedLinkChirho = ''; messageChirho = ''; });

  function findChirho(directionChirho: 1 | -1): void {
    if (disabledChirho) return;
    const tokenChirho = nextMatchChirho(matchesChirho, selectedKeyChirho, directionChirho);
    if (tokenChirho) onselectChirho(tokenChirho);
  }
  function jumpChirho(): void {
    if (disabledChirho) return;
    const lineChirho = linesChirho.find((candidateChirho) => candidateChirho.indexChirho === lineNumberChirho);
    const tokenChirho = lineChirho?.tokensChirho[0];
    if (tokenChirho) { onselectChirho(tokenChirho); messageChirho = ''; }
    else messageChirho = lineChirho ? 'That line has no selectable reading. Its context remains in the transcription.' : 'That line is not available on this page.';
  }
  // Workflow: page-reading-workflow-chirho.md. Copy identity only, never a draft.
  async function copyChirho(): Promise<void> {
    if (disabledChirho || !selectedLinkChirho) return;
    const linkChirho = selectedLinkChirho;
    copiedLinkChirho = linkChirho;
    try {
      await navigator.clipboard.writeText(linkChirho);
      if (selectedLinkChirho === linkChirho) messageChirho = 'Link copied. It opens the stored reading, not your drafts.';
    } catch { if (selectedLinkChirho === linkChirho) messageChirho = 'Clipboard unavailable. Select and copy the link below; it does not include drafts.'; }
  }
</script>

<div class="reading-navigator-chirho" aria-label="Find a reading">
  <form onsubmit={(eventChirho) => { eventChirho.preventDefault(); findChirho(1); }}>
    <label class="search-label-chirho">Find on this page
      <input type="search" bind:value={queryChirho} maxlength="200" disabled={disabledChirho} placeholder="Stored word or phrase" aria-describedby="find-help-chirho" />
    </label>
    <div class="find-actions-chirho">
      <button type="button" aria-label="Previous match" disabled={disabledChirho || !matchesChirho.length} onclick={() => findChirho(-1)}>←</button>
      <button type="submit" aria-label="Next match" disabled={disabledChirho || !matchesChirho.length}>Find next →</button>
      <span role="status">{queryChirho.trim() ? `${matchIndexChirho < 0 ? '' : `${matchIndexChirho + 1} / `}${matchesChirho.length} matching readings` : 'Full page context stays visible'}</span>
    </div>
  </form>
  <p id="find-help-chirho">Search ignores accents and vowel marks. Unsubmitted drafts are not searched.</p>
  <div class="location-actions-chirho">
    <form onsubmit={(eventChirho) => { eventChirho.preventDefault(); jumpChirho(); }}>
      <label>Line <input type="number" bind:value={lineNumberChirho} min="0" step="1" required disabled={disabledChirho} aria-label="Line number" /></label>
      <button type="submit" disabled={disabledChirho || lineNumberChirho === undefined}>Go</button>
    </form>
    <button type="button" disabled={disabledChirho || !selectedLinkChirho} onclick={copyChirho}>Copy reading link</button>
  </div>
  {#if copiedLinkChirho}<label class="copied-link-chirho">Reading link <input readonly value={copiedLinkChirho} onclick={(eventChirho) => eventChirho.currentTarget.select()} /></label>{/if}
  {#if messageChirho}<p role="status">{messageChirho}</p>{/if}
</div>

<style>
  .reading-navigator-chirho{flex-shrink:0;padding:9px 12px;border-bottom:1px solid #ddd7cb;font-size:.74rem;background:#f9f7f1;}
  form,.find-actions-chirho,.location-actions-chirho{display:flex;align-items:end;gap:7px;flex-wrap:wrap;}
  label{display:flex;align-items:center;gap:6px;}.search-label-chirho{flex:1;min-width:130px;display:grid;gap:4px;}
  input,button{font:inherit;color:#295c4e;background:#fffdf6;border:1px solid #aebbb1;border-radius:4px;padding:5px 8px;min-height:30px;}
  input{min-width:0;max-width:100%;}input[type="search"]{width:100%;}input[type="number"]{width:65px;}
  button{cursor:pointer;white-space:nowrap;}button:disabled{opacity:.45;cursor:not-allowed;}
  input:focus-visible,button:focus-visible{outline:3px solid #3061b5;outline-offset:2px;}
  .find-actions-chirho{align-items:center;}.find-actions-chirho span{font-size:.68rem;color:#586459;}
  p{font-size:.68rem;color:#586459;margin:5px 0;}.location-actions-chirho{margin-top:6px;justify-content:space-between;}
  .copied-link-chirho{display:grid;gap:4px;margin-top:7px;}.copied-link-chirho input{width:100%;font-size:.7rem;}
</style>
