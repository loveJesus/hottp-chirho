<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { readDraftFileChirho } from './file-backup-chirho';
  import type { PageDraftsChirho } from './session-store-chirho';

  let { draftCountChirho, conflictingCountChirho, backupErrorChirho, restoredChirho, disabledChirho,
    ondownloadChirho, ondiscardChirho, onrestoreChirho }: {
    draftCountChirho: number; conflictingCountChirho: number; backupErrorChirho: string;
    restoredChirho: boolean; disabledChirho: boolean;
    ondownloadChirho: () => void; ondiscardChirho: () => void;
    onrestoreChirho: (pageChirho: PageDraftsChirho) => { messageChirho: string; backedUpChirho: boolean };
  } = $props();
  let pendingChirho = $state<PageDraftsChirho | null>(null);
  let readingChirho = $state(false), fileNameChirho = $state(''), errorChirho = $state('');
  let resultChirho = $state<{ messageChirho: string; backedUpChirho: boolean } | null>(null);
  let fileInputChirho: HTMLInputElement;
  let readRevisionChirho = 0;
  onDestroy(() => { readRevisionChirho += 1; });
  $effect(() => { if (!draftCountChirho) resultChirho = null; });

  // Workflow: page-reading-workflow-chirho.md. Selection previews a local file;
  // only the separate restore action can merge it into this tab's drafts.
  async function chooseFileChirho(fileChirho: File | undefined): Promise<void> {
    const revisionChirho = ++readRevisionChirho;
    pendingChirho = null; errorChirho = ''; resultChirho = null; fileNameChirho = ''; readingChirho = false;
    if (!fileChirho || disabledChirho) return;
    readingChirho = true;
    try {
      const pageChirho = await readDraftFileChirho(fileChirho);
      if (revisionChirho !== readRevisionChirho) return;
      pendingChirho = pageChirho; fileNameChirho = fileChirho.name;
    } catch (caughtChirho) {
      if (revisionChirho === readRevisionChirho) errorChirho = caughtChirho instanceof Error ? caughtChirho.message : 'The file could not be read. Existing drafts are unchanged.';
    } finally { if (revisionChirho === readRevisionChirho) readingChirho = false; }
  }
  function restoreChirho(): void {
    if (!pendingChirho || disabledChirho || readingChirho) return;
    try {
      resultChirho = onrestoreChirho(pendingChirho);
      pendingChirho = null; errorChirho = ''; fileNameChirho = ''; fileInputChirho.value = '';
    } catch (caughtChirho) { errorChirho = caughtChirho instanceof Error ? caughtChirho.message : 'Restore failed. Existing drafts are unchanged.'; }
  }
</script>

<aside class="draft-backup-chirho" aria-label="Draft backup">
  {#if draftCountChirho || backupErrorChirho}
    <div class="backup-summary-chirho"><strong>{draftCountChirho} unsubmitted draft{draftCountChirho === 1 ? '' : 's'}</strong>
      <span>{backupErrorChirho ? 'Not backed up' : restoredChirho ? 'Recovered in this tab' : 'Kept in this tab through refresh'}</span></div>
    {#if draftCountChirho}<button type="button" onclick={ondownloadChirho}>Download all drafts</button>
      <button type="button" disabled={disabledChirho} onclick={ondiscardChirho}>Discard page drafts</button>{/if}
  {/if}
  <details>
    <summary>Restore from a download</summary>
    <p id="draft-file-help-chirho">Choose a reading backup for this page, up to 4 MB. It stays in your browser. Existing drafts are kept; nothing is submitted.</p>
    <label>Draft backup file <input type="file" accept=".json,application/json" aria-describedby="draft-file-help-chirho"
      bind:this={fileInputChirho} disabled={disabledChirho} onchange={(eventChirho) => { void chooseFileChirho(eventChirho.currentTarget.files?.[0]); }} /></label>
    {#if readingChirho}<p role="status">Reading backup…</p>{/if}
    {#if pendingChirho}<p class="backup-preview-chirho">{fileNameChirho}: {pendingChirho.draftsChirho.length} unsubmitted draft{pendingChirho.draftsChirho.length === 1 ? '' : 's'}. Compare restored readings with the print before confirming.</p>
      <button type="button" disabled={disabledChirho || readingChirho || !pendingChirho.draftsChirho.length} onclick={restoreChirho}>Restore drafts</button>{/if}
    {#if errorChirho}<p class="backup-error-chirho" role="alert">{errorChirho}</p>{/if}
    <p class="backup-status-chirho" role="status">{#if resultChirho}{resultChirho.messageChirho}
      {#if backupErrorChirho} In memory only: tab backup failed. Keep the original file and download all current drafts before leaving.
      {:else if !resultChirho.backedUpChirho} Tab backup is available again.
      {:else} Kept in this tab through refresh.{/if}{/if}</p>
  </details>
  {#if conflictingCountChirho}<p role="alert">{conflictingCountChirho} recovered draft{conflictingCountChirho === 1 ? '' : 's'} no longer match the source. They are held, not applied. Download the backup before discarding or redoing them.</p>{/if}
  {#if backupErrorChirho}<p role="alert">{backupErrorChirho}</p>{/if}
</aside>

<style>
  .draft-backup-chirho{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;margin-top:12px;border:1px solid #cfbf98;background:#f7efdf;border-radius:6px;font-size:.76rem;}
  .backup-summary-chirho{display:flex;gap:8px;flex-wrap:wrap;}.backup-summary-chirho span{color:#765f35;}
  button,input{font:inherit;color:#295c4e;max-width:100%;}button{padding:5px 8px;border:1px solid #b6c1b8;border-radius:4px;background:#fffdf6;cursor:pointer;}
  button:disabled{opacity:.45;cursor:not-allowed;}button:focus-visible,summary:focus-visible,input:focus-visible{outline:3px solid #3061b5;outline-offset:2px;}
  details{width:100%;min-width:0;}summary{cursor:pointer;color:#295c4e;width:fit-content;}p{margin:8px 0;line-height:1.5;overflow-wrap:anywhere;}
  label{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}input{min-width:0;width: min(100%, 26rem);padding:5px;border:1px solid #b6c1b8;border-radius:4px;background:#fffdf6;}
  .backup-error-chirho{color:#8b2920;}.backup-status-chirho{color:#426859;}.backup-status-chirho:empty{margin:0;}
</style>
