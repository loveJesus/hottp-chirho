<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import { beforeNavigate, invalidateAll } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  import PageScanChirho from './PageScanChirho.svelte';
  import { readingLinesChirho, isRtlChirho, sameBoxChirho, scriptLabelChirho, type BoxChirho, type ReadingTokenChirho } from './model-chirho';
  import { saveReadingChirho } from './save-reading-chirho';
  import { readPageDraftsChirho, writePageDraftsChirho, draftMatchesSourceChirho, editDraftChirho, type ReadingDraftChirho } from './drafts-chirho/session-store-chirho';
  import type { PageData } from '../../routes/volumes-chirho/[vol_chirho]/pages-chirho/[page_chirho]/$types';

  let { data }: { data: PageData } = $props();
  let selectedKeyChirho = $state<string | null>(null);
  let draftsChirho = $state<Record<string, ReadingDraftChirho>>({});
  let backupReadyChirho = $state(false), backupErrorChirho = $state(''), restoredChirho = $state(false);
  let backupImageKeyChirho = $state('');
  let reviewScopeChirho = $state('all-chirho');
  let refreshFailedChirho = $state(false);
  let repairChirho = $state(false), savingChirho = $state(false), imageReadyChirho = $state(false);
  let statusChirho = $state(''), errorChirho = $state('');
  let editorChirho = $state<HTMLTextAreaElement>();
  let transcriptChirho: HTMLDivElement;
  const linesChirho = $derived(readingLinesChirho(data.readerLinesChirho, data.snapshotChirho?.underlayJsonChirho ?? null, data.eventTailChirho));
  const tokensChirho = $derived(linesChirho.flatMap((lineChirho) => lineChirho.tokensChirho));
  const confirmationHeldChirho = $derived(!data.signedInChirho || !data.eventTailCompleteChirho || refreshFailedChirho);
  const accessUrlChirho = $derived(`/reviewer-chirho?return-chirho=${encodeURIComponent(`/volumes-chirho/${data.volumeNumberChirho}/pages-chirho/${data.pageNumberChirho}`)}`);
  const tokenMapChirho = $derived(new Map(tokensChirho.map((tokenChirho) => [tokenChirho.keyChirho, tokenChirho])));
  const selectedChirho = $derived(selectedKeyChirho ? tokenMapChirho.get(selectedKeyChirho) ?? null : null);
  const selectedDraftChirho = $derived(selectedKeyChirho ? draftsChirho[selectedKeyChirho] : undefined);
  const selectedBoxChirho = $derived(selectedDraftChirho?.boxChirho ?? selectedChirho?.boxChirho ?? null);
  const draftCountChirho = $derived(Object.keys(draftsChirho).length);
  const boxChangedChirho = $derived(!!selectedDraftChirho && !sameBoxChirho(selectedDraftChirho.boxChirho, selectedDraftChirho.sourceChirho.boxChirho));
  const imageChangedChirho = $derived(draftCountChirho > 0 && backupImageKeyChirho !== data.fullPageR2KeyChirho);
  const conflictingDraftsChirho = $derived(Object.values(draftsChirho).filter((draftChirho) => imageChangedChirho || !draftMatchesSourceChirho(draftChirho, tokenMapChirho.get(draftChirho.sourceChirho.keyChirho))));
  const selectedConflictChirho = $derived(imageChangedChirho || !!selectedDraftChirho && !draftMatchesSourceChirho(selectedDraftChirho, selectedChirho ?? undefined));
  const repairCountChirho = $derived(Object.values(draftsChirho).filter((draftChirho) => !sameBoxChirho(draftChirho.boxChirho, draftChirho.sourceChirho.boxChirho)).length);
  const imageUrlChirho = $derived(`/api-chirho/images-chirho?key-chirho=${encodeURIComponent(data.fullPageR2KeyChirho)}`);
  const confirmedCountChirho = $derived(tokensChirho.filter((tokenChirho) => tokenChirho.confirmedChirho).length);
  const reviewTokensChirho = $derived(tokensChirho.filter((tokenChirho) => reviewScopeChirho === 'all-chirho' ||
    reviewScopeChirho === 'attention-chirho' && (tokenChirho.flaggedChirho || !tokenChirho.confirmedChirho && !['french-chirho', 'latin-chirho'].includes(tokenChirho.scriptChirho)) || tokenChirho.scriptChirho === reviewScopeChirho));

  onMount(() => {
    backupImageKeyChirho = data.fullPageR2KeyChirho;
    try {
      const pageDraftsChirho = readPageDraftsChirho(sessionStorage, data.pageDataChirho.idChirho);
      if (pageDraftsChirho) {
        backupImageKeyChirho = pageDraftsChirho.imageKeyChirho;
        draftsChirho = Object.fromEntries(pageDraftsChirho.draftsChirho.map((draftChirho) => [draftChirho.sourceChirho.keyChirho, draftChirho]));
        restoredChirho = pageDraftsChirho.draftsChirho.length > 0;
        const tokenChirho = tokenMapChirho.get(pageDraftsChirho.selectedKeyChirho ?? '');
        if (tokenChirho) void selectChirho(tokenChirho);
      }
    } catch (caughtChirho) { backupErrorChirho = backupFailureChirho(caughtChirho); }
    backupReadyChirho = true;
  });
  function backupFailureChirho(caughtChirho: unknown): string {
    return `${caughtChirho instanceof Error ? caughtChirho.message : 'Tab backup is unavailable.'} Current drafts remain on screen; download them before leaving.`;
  }
  function backupChirho(): boolean {
    if (!backupReadyChirho) return false;
    try {
      writePageDraftsChirho(sessionStorage, { pageIdChirho: data.pageDataChirho.idChirho, imageKeyChirho: backupImageKeyChirho,
        selectedKeyChirho, draftsChirho: Object.values(draftsChirho) });
      backupErrorChirho = ''; return true;
    } catch (caughtChirho) { backupErrorChirho = backupFailureChirho(caughtChirho); return false; }
  }

  beforeNavigate((navigationChirho) => {
    if (savingChirho || (draftCountChirho && !backupChirho() && !window.confirm('The tab backup failed. Leaving may lose current drafts. Download them first, or leave anyway?'))) navigationChirho.cancel();
  });
  function beforeUnloadChirho(eventChirho: BeforeUnloadEvent): void {
    if (!savingChirho && (!draftCountChirho || backupChirho())) return;
    eventChirho.preventDefault(); eventChirho.returnValue = '';
  }
  async function selectChirho(tokenChirho: ReadingTokenChirho): Promise<void> {
    if (savingChirho) return;
    selectedKeyChirho = tokenChirho.keyChirho; repairChirho = false;
    if (draftCountChirho) backupChirho();
    await tick();
    fitEditorChirho();
    editorChirho?.focus({ preventScroll: true });
    editorChirho?.select();
    revealSelectionChirho();
  }
  function revealSelectionChirho(): void {
    const activeChirho = transcriptChirho?.querySelector<HTMLElement>('.active-line-chirho');
    if (activeChirho) {
      const activeRectChirho = activeChirho.getBoundingClientRect(), panelRectChirho = transcriptChirho.getBoundingClientRect();
      if (activeRectChirho.top < panelRectChirho.top || activeRectChirho.bottom > panelRectChirho.bottom) transcriptChirho.scrollTop += activeRectChirho.top - panelRectChirho.top - 24;
    }
  }
  function changeTextChirho(valueChirho: string): void {
    if (!selectedChirho || savingChirho || selectedConflictChirho) return;
    setDraftChirho({ textChirho: valueChirho });
    errorChirho = ''; statusChirho = '';
    fitEditorChirho();
  }
  function setDraftChirho(changesChirho: { textChirho?: string; boxChirho?: BoxChirho }): void {
    if (!selectedChirho) return;
    if (!draftCountChirho) backupImageKeyChirho = data.fullPageR2KeyChirho;
    const draftChirho = editDraftChirho(selectedChirho, selectedDraftChirho, changesChirho);
    if (draftChirho) draftsChirho[selectedChirho.keyChirho] = draftChirho;
    else delete draftsChirho[selectedChirho.keyChirho];
    backupChirho();
  }
  function fitEditorChirho(): void {
    if (!editorChirho) return;
    editorChirho.style.height = 'auto';
    editorChirho.style.height = `${Math.min(120, editorChirho.scrollHeight + 4)}px`;
  }
  function changeBoxChirho(boxChirho: BoxChirho): void {
    if (!selectedChirho || savingChirho || selectedConflictChirho) return;
    setDraftChirho({ boxChirho });
    statusChirho = 'Box repair draft only. Export it for review; the source has not changed.';
  }
  function moveChirho(directionChirho: number): boolean {
    const indexChirho = tokensChirho.findIndex((tokenChirho) => tokenChirho.keyChirho === selectedKeyChirho);
    const candidatesChirho = directionChirho > 0 ? tokensChirho.slice(indexChirho + 1) : tokensChirho.slice(0, indexChirho).reverse();
    const allowedChirho = new Set(reviewTokensChirho.map((tokenChirho) => tokenChirho.keyChirho));
    const nextChirho = candidatesChirho.find((tokenChirho) => allowedChirho.has(tokenChirho.keyChirho));
    if (!nextChirho) return false;
    void selectChirho(nextChirho); return true;
  }
  function keyChirho(eventChirho: KeyboardEvent): void {
    if (eventChirho.isComposing) return;
    if (eventChirho.key === 'Tab' && !eventChirho.ctrlKey && !eventChirho.metaKey && !eventChirho.altKey) {
      if (moveChirho(eventChirho.shiftKey ? -1 : 1)) eventChirho.preventDefault();
    } else if (eventChirho.key === 'Enter' && (eventChirho.ctrlKey || eventChirho.metaKey)) {
      eventChirho.preventDefault(); void confirmChirho(true);
    }
  }
  async function confirmChirho(advanceChirho: boolean): Promise<void> {
    if (!selectedChirho || confirmationHeldChirho || savingChirho || selectedConflictChirho || !imageReadyChirho || !selectedBoxChirho || boxChangedChirho || repairChirho) return;
    const tokenChirho = selectedChirho;
    const textChirho = selectedDraftChirho?.textChirho ?? tokenChirho.textChirho;
    savingChirho = true; errorChirho = ''; statusChirho = '';
    try {
      await saveReadingChirho(tokenChirho, textChirho, data.pageDataChirho.idChirho, fetch, data.observedEventSeqChirho);
      delete draftsChirho[tokenChirho.keyChirho];
      backupChirho();
      statusChirho = 'Reading confirmed. This does not certify the page or publication.';
      try { await invalidateAll(); } catch { refreshFailedChirho = true; statusChirho = 'Reading saved, but the page could not refresh. Reload before continuing.'; return; }
      savingChirho = false;
      if (advanceChirho) moveChirho(1);
    } catch (caughtChirho) {
      errorChirho = caughtChirho instanceof Error ? caughtChirho.message : 'Save unconfirmed. Your draft is still here.';
    } finally { savingChirho = false; }
  }
  function discardChirho(): void {
    if (!selectedChirho || savingChirho) return;
    delete draftsChirho[selectedChirho.keyChirho]; backupChirho();
    repairChirho = false; errorChirho = ''; statusChirho = 'Selected draft discarded. Stored reading and box are unchanged.';
  }
  function discardPageDraftsChirho(): void {
    if (savingChirho || !window.confirm('Discard every unsubmitted draft for this page, including recovered drafts? This cannot be undone.')) return;
    draftsChirho = {}; restoredChirho = false; repairChirho = false;
    backupImageKeyChirho = data.fullPageR2KeyChirho; backupChirho();
  }
  function downloadChirho(payloadChirho: unknown, filenameChirho: string): void {
    const urlChirho = URL.createObjectURL(new Blob([JSON.stringify(payloadChirho, null, 2)], { type: 'application/json' }));
    const anchorChirho = document.createElement('a'); anchorChirho.href = urlChirho; anchorChirho.download = filenameChirho;
    anchorChirho.click(); setTimeout(() => URL.revokeObjectURL(urlChirho), 1000);
  }
  function exportPageDraftsChirho(): void {
    downloadChirho({ kind_chirho: 'unsubmitted-reading-backup-chirho', approved_chirho: false,
      page_id_chirho: data.pageDataChirho.idChirho, image_key_chirho: backupImageKeyChirho, drafts_chirho: Object.values(draftsChirho) },
      `vol-${data.volumeNumberChirho}-page-${data.pageNumberChirho}-reading-drafts-chirho.json`);
  }
  function exportDraftsChirho(): void {
    const payloadChirho = { kind_chirho: 'unsubmitted-page-repair-draft-chirho', approved_chirho: false,
      page_id_chirho: data.pageDataChirho.idChirho, volume_number_chirho: data.volumeNumberChirho, page_number_chirho: data.pageNumberChirho,
      repairs_chirho: Object.values(draftsChirho).filter((draftChirho) => !sameBoxChirho(draftChirho.boxChirho, draftChirho.sourceChirho.boxChirho)).map((draftChirho) => ({
        ...repairIdentityChirho(draftChirho.sourceChirho),
        original_box_chirho: draftChirho.sourceChirho.boxChirho,
        proposed_box_chirho: draftChirho.boxChirho, original_text_chirho: draftChirho.sourceChirho.textChirho,
        proposed_text_chirho: draftChirho.textChirho,
      })) };
    downloadChirho(payloadChirho, `vol-${data.volumeNumberChirho}-page-${data.pageNumberChirho}-repair-draft-chirho.json`);
    statusChirho = 'Repair draft downloaded, not submitted or approved. The working draft remains here.';
  }
  function repairIdentityChirho(tokenChirho: ReadingTokenChirho) {
    return {
        kind_chirho: tokenChirho.kindChirho, record_id_chirho: tokenChirho.idChirho, scanline_id_chirho: tokenChirho.scanlineIdChirho,
        line_index_chirho: tokenChirho.lineIndexChirho,
    };
  }
</script>

<svelte:window onbeforeunload={beforeUnloadChirho} onresize={revealSelectionChirho} />
<div class="reader-chirho">
  <nav class="reader-nav-chirho" aria-label="Page navigation">
    <a href="/volumes-chirho/{data.volumeNumberChirho}">← Volume {data.volumeNumberChirho}</a>
    <div>{#if data.prevPageChirho}<a href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.prevPageChirho}" aria-label="Previous page">←</a>{/if}
      <h1>Page {data.pageNumberChirho}</h1>
      {#if data.nextPageChirho}<a href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.nextPageChirho}" aria-label="Next page">→</a>{/if}</div>
    <a href="?view-chirho=tools-chirho">Word &amp; language tools</a>
  </nav>
  <div class="reader-intro-chirho"><p>Read the page. Correct the text in place.</p><span>{confirmedCountChirho} / {tokensChirho.length} readings confirmed · not page certification</span>
    <a href={accessUrlChirho}>{data.signedInChirho ? 'Reviewer access · signed in' : 'Sign in to confirm · drafts stay here'}</a></div>
  {#if !data.eventTailCompleteChirho}<p role="alert">This page has more recent changes than can be safely loaded. Confirmation is held until its snapshot is refreshed.</p>{/if}
  <div class="reader-workspace-chirho">
    <PageScanChirho volumeChirho={data.volumeNumberChirho} {imageUrlChirho} {tokensChirho} {selectedChirho} boxChirho={selectedBoxChirho} repairChirho={repairChirho && !savingChirho && !selectedConflictChirho}
      onselectChirho={(tokenChirho) => { void selectChirho(tokenChirho); }} onboxChirho={changeBoxChirho} onreadyChirho={(readyChirho) => { imageReadyChirho = readyChirho; }} />
    <section class="transcript-pane-chirho" aria-label="Page transcription">
      <header><h2>Transcription</h2><span class="legend-chirho"><i class="legend-confirmed-chirho"></i> Human-confirmed <i class="legend-review-chirho"></i> Needs review</span></header>
      <div class="review-navigation-chirho">
        <label>Move through <select bind:value={reviewScopeChirho} disabled={savingChirho}>
          <option value="all-chirho">All readings</option><option value="attention-chirho">Needs attention</option>
          {#each [...new Set(tokensChirho.map((tokenChirho) => tokenChirho.scriptChirho))].sort() as scriptChirho}<option value={scriptChirho}>{scriptLabelChirho(scriptChirho)}</option>{/each}
        </select></label>
        <button type="button" disabled={!backupReadyChirho || savingChirho || !reviewTokensChirho.length} onclick={() => { if (!moveChirho(1)) statusChirho = 'End of this review selection on this page. Choose another scope or go to the next page.'; }}>Next →</button>
        <span>{reviewTokensChirho.length} readings · full context stays visible</span>
      </div>
      <div class="reader-lines-chirho" bind:this={transcriptChirho}>
        {#each linesChirho as lineChirho (lineChirho.idChirho)}
          <div class="reading-line-chirho" class:active-line-chirho={selectedChirho?.scanlineIdChirho === lineChirho.idChirho}>
            <span class="line-number-chirho" aria-label={`Line ${lineChirho.indexChirho}`}>{lineChirho.indexChirho}</span>
            <div class="reading-text-chirho" dir="ltr">
              {#each lineChirho.tokensChirho as sourceTokenChirho (sourceTokenChirho.keyChirho)}
                {@const tokenChirho = tokenMapChirho.get(sourceTokenChirho.keyChirho)!}
                {@const activeChirho = selectedKeyChirho === tokenChirho.keyChirho}
                {#if activeChirho}
                  <textarea class="inline-reading-chirho" rows="1" aria-label={`Edit reading, line ${tokenChirho.lineIndexChirho}`}
                    bind:this={editorChirho} dir={isRtlChirho(tokenChirho) ? 'rtl' : 'ltr'} disabled={savingChirho || selectedConflictChirho}
                    value={draftsChirho[tokenChirho.keyChirho]?.textChirho ?? tokenChirho.textChirho}
                    style:width={`${Math.min(48, Math.max(7, (draftsChirho[tokenChirho.keyChirho]?.textChirho ?? tokenChirho.textChirho).length + 2))}ch`}
                    oninput={(eventChirho) => changeTextChirho(eventChirho.currentTarget.value)} onkeydown={keyChirho}></textarea>
                {:else}
                  <button type="button" class="reading-token-chirho" class:confirmed-chirho={tokenChirho.confirmedChirho}
                    class:review-chirho={tokenChirho.flaggedChirho || !['french-chirho', 'latin-chirho'].includes(tokenChirho.scriptChirho)}
                    class:draft-chirho={draftsChirho[tokenChirho.keyChirho] !== undefined}
                    dir={isRtlChirho(tokenChirho) ? 'rtl' : 'ltr'} disabled={!backupReadyChirho || savingChirho}
                    title={`${scriptLabelChirho(tokenChirho.scriptChirho)} · ${tokenChirho.confirmedChirho ? 'Human-confirmed' : 'Not human-confirmed'} · line ${tokenChirho.lineIndexChirho}`}
                    onclick={() => selectChirho(tokenChirho)}>{(draftsChirho[tokenChirho.keyChirho]?.textChirho ?? tokenChirho.textChirho) || '∅'}</button>
                {/if}{' '}
              {:else}<span class="unlinked-text-chirho">{lineChirho.textChirho || '(No transcription for this line)'}</span>{/each}
            </div>
          </div>
        {:else}<p class="reader-empty-chirho">{data.reconstructedTextChirho || 'No transcription is available for this page yet.'}</p>{/each}
      </div>
      <div class="reading-controls-chirho">
        {#if selectedChirho}
          <div class="selection-label-chirho"><strong>Line {selectedChirho.lineIndexChirho} · {scriptLabelChirho(selectedChirho.scriptChirho)}</strong>
            <span>{draftCountChirho ? `${draftCountChirho} unsubmitted draft${draftCountChirho === 1 ? '' : 's'}` : 'No unsaved changes'}</span></div>
          <p>Compare the highlighted print. Confirm only if the box and text match.</p>
          <div class="reading-actions-chirho">
            <button type="button" disabled={confirmationHeldChirho || savingChirho || selectedConflictChirho || !imageReadyChirho || !selectedBoxChirho || boxChangedChirho || repairChirho} class="confirm-reading-chirho" onclick={() => confirmChirho(true)}>{savingChirho ? 'Saving…' : 'Confirm & next →'}</button>
            <button type="button" disabled={savingChirho || selectedConflictChirho || !selectedBoxChirho || !imageReadyChirho} aria-pressed={repairChirho} onclick={() => { repairChirho = !repairChirho; }}>Adjust box</button>
            <button type="button" disabled={savingChirho} onclick={discardChirho}>Discard draft</button>
          </div>
          {#if selectedConflictChirho}<p class="repair-hint-chirho">Source changed since this draft began. Stored reading now: <bdi>{selectedChirho.textChirho}</bdi>. Download your draft, then discard it and compare the current print again.</p>{/if}
          {#if repairChirho}<p class="repair-hint-chirho">Drag the orange box; drag its corner to resize. Arrow keys move it; Shift moves 10 pixels. This is a local repair draft, not an approved change.</p>{/if}
          {#if boxChangedChirho}<p class="repair-hint-chirho">Box changed: text confirmation is held. Export the repair draft for review, or discard it.</p>{/if}
          {#if !selectedBoxChirho}<p>No reliable box is available for this reading. Use the advanced tools to investigate; do not confirm it here.</p>{/if}
          <p class="keyboard-hint-chirho"><kbd>Tab</kbd> / <kbd>Shift Tab</kbd> next / previous reading · <kbd>⌘/Ctrl Enter</kbd> confirm &amp; next. Moving focus never saves.</p>
        {:else}<p>Select any word or phrase in the text or scan to begin. French context stays in place.</p>{/if}
        {#if repairCountChirho}<button type="button" class="export-repair-chirho" onclick={exportDraftsChirho}>Export box-repair draft ({repairCountChirho})</button>{/if}
        {#if errorChirho}<p class="reading-error-chirho" role="alert">{errorChirho}</p>{/if}
        {#if !data.signedInChirho}<p><a href={accessUrlChirho}>Sign in to confirm readings.</a> Editing and downloading drafts remain available.</p>{/if}
        <p class="reading-status-chirho" role="status">{statusChirho}</p>
      </div>
    </section>
  </div>
  {#if draftCountChirho || backupErrorChirho}
    <aside class="draft-backup-chirho" aria-label="Draft backup">
      <div><strong>{draftCountChirho} unsubmitted draft{draftCountChirho === 1 ? '' : 's'}</strong>
        <span>{backupErrorChirho ? 'Not backed up' : restoredChirho ? 'Recovered in this tab' : 'Kept in this tab through refresh'}</span></div>
      {#if draftCountChirho}<button type="button" onclick={exportPageDraftsChirho}>Download all drafts</button><button type="button" disabled={savingChirho} onclick={discardPageDraftsChirho}>Discard page drafts</button>{/if}
      {#if conflictingDraftsChirho.length}<p role="alert">{conflictingDraftsChirho.length} recovered draft{conflictingDraftsChirho.length === 1 ? '' : 's'} no longer match the source. They are held, not applied. Download the backup before discarding or redoing them.</p>{/if}
      {#if backupErrorChirho}<p role="alert">{backupErrorChirho}</p>{/if}
    </aside>
  {/if}
  <p class="reader-footnote-chirho">Color guides attention, not OCR accuracy. Drafts are kept in this browser tab, not submitted. Download drafts before closing the tab. Word &amp; language tools retain the advanced workflow.</p>
</div>

<style>
  .reader-chirho {color:#253c37;background:#f7f5ef;border:1px solid #d2cbbd;border-radius:12px;padding:18px;}
  .reader-nav-chirho{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;} .reader-nav-chirho div{display:flex;align-items:center;gap:20px;}
  a{color:#246a61;text-decoration:none;font-size:.85rem;} a:hover{text-decoration:underline;} h1{font-size:1.4rem;font-weight:600;}
  .reader-intro-chirho{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 0 16px;} .reader-intro-chirho span{font-size:.76rem;color:#646e65;}
  .draft-backup-chirho{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;margin-top:12px;border:1px solid #cfbf98;background:#f7efdf;border-radius:6px;font-size:.76rem;}
  .draft-backup-chirho div{display:flex;gap:10px;flex-wrap:wrap;margin-right:auto;}.draft-backup-chirho p{width:100%;color:#873c24;}
  .draft-backup-chirho button,.review-navigation-chirho button,.review-navigation-chirho select{padding:5px 8px;border:1px solid #b6c1b8;border-radius:4px;background:#fffdf6;color:#295c4e;font:inherit;}
  .review-navigation-chirho{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid #ddd7cb;font-size:.74rem;}.review-navigation-chirho label{display:flex;align-items:center;gap:6px;}.review-navigation-chirho span{font-size:.68rem;color:#6d736b;}
  .reader-workspace-chirho{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;height:calc(100dvh - 244px);min-height:480px;}
  .transcript-pane-chirho{min-width:0;display:flex;flex-direction:column;border:1px solid #d6d0c5;border-radius:8px;overflow:hidden;background:#fffefb;}
  header{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 14px;background:#f3f0e8;border-bottom:1px solid #d6d0c5;}
  h2{font-size:.92rem;} .legend-chirho{display:flex;gap:6px;align-items:center;font-size:.68rem;color:#667166;}
  .legend-chirho i{width:9px;height:9px;border-radius:50%;} .legend-confirmed-chirho{background:#75ab9e;} .legend-review-chirho{background:#e4ba79;}
  .reader-lines-chirho{flex:1;overflow:auto;min-height:130px;padding:18px 12px;overscroll-behavior:contain;}
  .reading-line-chirho{display:grid;grid-template-columns:24px minmax(0,1fr);gap:7px;padding:3px 4px;border-left:2px solid transparent;}
  .reading-line-chirho.active-line-chirho{background:#eef4ee;border-left-color:#277c6f;}
  .line-number-chirho{font:11px/2.8 ui-monospace,monospace;color:#939388;user-select:none;}
  .reading-text-chirho{font-family:Georgia,'SBL Hebrew','SBL Greek',serif;font-size:17px;line-height:1.9;overflow-wrap:anywhere;}
  .reading-token-chirho{font:inherit;color:#293c34;border:0;border-bottom:1px solid transparent;background:transparent;padding:0 1px;cursor:text;unicode-bidi:isolate;text-align:start;max-width:100%;}
  .reading-token-chirho.review-chirho{background:#faeacd;border-bottom-color:#d3a455;}
  .reading-token-chirho.confirmed-chirho{background:#e4f0e9;border-bottom-color:#79aa98;}
  .reading-token-chirho.draft-chirho{background:#f7e1d4;border-bottom:2px dashed #bb6637;}
  .reading-token-chirho:hover{outline:1px solid #428379;border-radius:2px;}
  .inline-reading-chirho{font:inherit;line-height:1.5;color:#183b31;background:white;border:2px solid #277c6f;border-radius:3px;padding:1px 4px;max-width:100%;vertical-align:middle;resize:vertical;min-height:34px;}
  .reading-controls-chirho{padding:12px 16px;border-top:1px solid #d6d0c5;background:#f7f5ee;font-size:.77rem;line-height:1.5;}
  .selection-label-chirho{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:5px;} .selection-label-chirho span{color:#806137;}
  .reading-actions-chirho{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}
  .reading-controls-chirho button{padding:7px 11px;border:1px solid #aebbb1;border-radius:5px;background:#fffef8;color:#295c4e;font:inherit;cursor:pointer;}
  .reading-controls-chirho .confirm-reading-chirho{background:#246d5f;color:white;border-color:#246d5f;}
  button:disabled{opacity:.45;cursor:not-allowed;} button:focus-visible,a:focus-visible{outline:3px solid #3061b5;outline-offset:2px;}
  .keyboard-hint-chirho{color:#697466;font-size:.69rem;margin-top:8px;} kbd{font:inherit;font-weight:600;}
  .repair-hint-chirho{color:#864823;margin:6px 0;} .reading-error-chirho{padding:8px;margin-top:8px;color:#8b2920;background:#ffe9e2;border-radius:4px;}
  .reading-status-chirho{color:#426859;margin-top:5px;}.reading-status-chirho:empty{display:none;}
  .reader-footnote-chirho{font-size:.7rem;color:#717567;margin-top:10px;} .reader-empty-chirho{white-space:pre-wrap;}
  @media(max-width:1000px){.reader-chirho{padding:12px;}.reader-workspace-chirho{gap:10px;}.legend-chirho{font-size:.62rem;}.reading-controls-chirho{padding:10px;}}
  @media(max-width:700px){.reader-workspace-chirho{grid-template-columns:minmax(0,1fr);height:auto;min-height:0;}.reader-workspace-chirho :global(.scan-pane-chirho){height:42dvh;min-height:260px;position:sticky;top:58px;z-index:5;}.transcript-pane-chirho{height:65dvh;min-height:440px;}.reader-nav-chirho{gap:8px;}.reader-intro-chirho{font-size:.85rem;}.reader-chirho{padding:8px;}.reader-nav-chirho a{font-size:.75rem;}.reading-text-chirho{font-size:16px;}.reader-lines-chirho{padding:10px 5px;}}
</style>
