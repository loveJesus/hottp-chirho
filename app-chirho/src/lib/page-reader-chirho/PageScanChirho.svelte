<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import { tick } from 'svelte';
  import type { BoxChirho, ReadingTokenChirho } from './model-chirho';
  import { boxFitsSpaceChirho, coordinateSpaceChirho } from './coordinate-space-chirho';
  let { volumeChirho, imageUrlChirho, tokensChirho, selectedChirho, boxChirho, repairChirho, onselectChirho, onboxChirho, onreadyChirho }: {
    volumeChirho: number;
    imageUrlChirho: string; tokensChirho: ReadingTokenChirho[]; selectedChirho: ReadingTokenChirho | null;
    boxChirho: BoxChirho | null; repairChirho: boolean;
    onselectChirho: (tokenChirho: ReadingTokenChirho) => void;
    onboxChirho: (boxChirho: BoxChirho) => void; onreadyChirho: (readyChirho: boolean) => void;
  } = $props();
  let imageWidthChirho = $state(0), imageHeightChirho = $state(0), zoomChirho = $state(1), boxesChirho = $state(false);
  const spaceChirho = $derived(coordinateSpaceChirho(volumeChirho, tokensChirho.map((tokenChirho) => tokenChirho.boxChirho), imageWidthChirho, imageHeightChirho));
  const widthChirho = $derived(spaceChirho.widthChirho), heightChirho = $derived(spaceChirho.heightChirho);
  let imageFailedChirho = $state(false);
  let canvasChirho: HTMLDivElement;
  let scrollChirho: HTMLDivElement;
  let dragChirho: { xChirho: number; yChirho: number; boxChirho: BoxChirho; resizeChirho: boolean; scaleXChirho: number; scaleYChirho: number } | null = null;
  const selectedFitsChirho = $derived(!boxChirho || boxFitsSpaceChirho(boxChirho, widthChirho, heightChirho));
  $effect(() => { onreadyChirho(spaceChirho.validChirho && selectedFitsChirho && !imageFailedChirho); });
  const cropChirho = $derived(boxChirho ? `${Math.max(0, boxChirho.xChirho - 16)} ${Math.max(0, boxChirho.yChirho - 12)} ${boxChirho.widthChirho + 32} ${boxChirho.heightChirho + 24}` : '0 0 1 1');
  function styleBoxChirho(boxChirho: BoxChirho): string {
    return `left:${boxChirho.xChirho / widthChirho * 100}%;top:${boxChirho.yChirho / heightChirho * 100}%;width:${boxChirho.widthChirho / widthChirho * 100}%;height:${boxChirho.heightChirho / heightChirho * 100}%`;
  }
  $effect(() => {
    const selectedKeyChirho = selectedChirho?.keyChirho;
    const imageWidthChirho = widthChirho;
    if (!selectedKeyChirho || !imageWidthChirho) return;
    void tick().then(() => {
      const boxElChirho = canvasChirho?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (!boxElChirho || !scrollChirho) return;
      const boxRectChirho = boxElChirho.getBoundingClientRect(), paneRectChirho = scrollChirho.getBoundingClientRect();
      if (boxRectChirho.top < paneRectChirho.top || boxRectChirho.bottom > paneRectChirho.bottom) scrollChirho.scrollTop += boxRectChirho.top - paneRectChirho.top - paneRectChirho.height / 2;
      if (boxRectChirho.left < paneRectChirho.left || boxRectChirho.right > paneRectChirho.right) scrollChirho.scrollLeft += boxRectChirho.left - paneRectChirho.left - paneRectChirho.width / 2;
    });
  });
  function startDragChirho(eventChirho: PointerEvent, resizeChirho: boolean): void {
    if (!repairChirho || !spaceChirho.validChirho || !boxChirho || eventChirho.button !== 0) return;
    eventChirho.preventDefault();
    (eventChirho.currentTarget as HTMLElement).setPointerCapture(eventChirho.pointerId);
    dragChirho = { xChirho: eventChirho.clientX, yChirho: eventChirho.clientY, boxChirho: { ...boxChirho }, resizeChirho,
      scaleXChirho: widthChirho / canvasChirho.getBoundingClientRect().width,
      scaleYChirho: heightChirho / canvasChirho.getBoundingClientRect().height };
  }
  // Workflow: page-reading-workflow-chirho.md. Pointer/keyboard changes only
  // update the parent's local draft. This component has no write transport.
  function moveDragChirho(eventChirho: PointerEvent): void {
    if (!dragChirho) return;
    const dxChirho = Math.round((eventChirho.clientX - dragChirho.xChirho) * dragChirho.scaleXChirho);
    const dyChirho = Math.round((eventChirho.clientY - dragChirho.yChirho) * dragChirho.scaleYChirho);
    adjustChirho(dragChirho.boxChirho, dxChirho, dyChirho, dragChirho.resizeChirho);
  }
  function adjustChirho(originalChirho: BoxChirho, dxChirho: number, dyChirho: number, resizeChirho: boolean): void {
    if (resizeChirho) onboxChirho({ ...originalChirho,
      widthChirho: Math.max(1, Math.min(widthChirho - originalChirho.xChirho, originalChirho.widthChirho + dxChirho)),
      heightChirho: Math.max(1, Math.min(heightChirho - originalChirho.yChirho, originalChirho.heightChirho + dyChirho)) });
    else onboxChirho({ ...originalChirho,
      xChirho: Math.max(0, Math.min(widthChirho - originalChirho.widthChirho, originalChirho.xChirho + dxChirho)),
      yChirho: Math.max(0, Math.min(heightChirho - originalChirho.heightChirho, originalChirho.yChirho + dyChirho)) });
  }
  function keyBoxChirho(eventChirho: KeyboardEvent, resizeChirho: boolean): void {
    if (!repairChirho || !boxChirho || !eventChirho.key.startsWith('Arrow')) return;
    eventChirho.preventDefault();
    const stepChirho = eventChirho.shiftKey ? 10 : 1;
    adjustChirho(boxChirho, eventChirho.key === 'ArrowLeft' ? -stepChirho : eventChirho.key === 'ArrowRight' ? stepChirho : 0,
      eventChirho.key === 'ArrowUp' ? -stepChirho : eventChirho.key === 'ArrowDown' ? stepChirho : 0, resizeChirho);
  }
</script>

<section class="scan-pane-chirho" aria-label="Source scan">
  <header>
    <h2>Source page</h2>
    <label class="boxes-label-chirho"><input type="checkbox" bind:checked={boxesChirho} /> Boxes</label>
    <label>Zoom <select bind:value={zoomChirho}><option value={1}>Fit width</option><option value={1.5}>150%</option><option value={2}>200%</option></select></label>
  </header>
  <div class="scan-scroll-chirho" bind:this={scrollChirho}>
    <div class="scan-canvas-chirho" bind:this={canvasChirho} style:width={`${zoomChirho * 100}%`}>
      <img src={imageUrlChirho} alt="Scanned source page" draggable="false" onload={(eventChirho) => {
        const imageChirho = eventChirho.currentTarget as HTMLImageElement;
        imageWidthChirho = imageChirho.naturalWidth; imageHeightChirho = imageChirho.naturalHeight;
        imageFailedChirho = false;
      }} onerror={() => { imageFailedChirho = true; }} />
      {#if spaceChirho.validChirho && !imageFailedChirho}
        {#each tokensChirho as tokenChirho (tokenChirho.keyChirho)}
          {@const chosenChirho = selectedChirho?.keyChirho === tokenChirho.keyChirho}
          {@const targetBoxChirho = chosenChirho ? boxChirho : tokenChirho.boxChirho}
          {#if targetBoxChirho && boxFitsSpaceChirho(targetBoxChirho, widthChirho, heightChirho)}
            <button type="button" class="scan-box-chirho" class:visible-chirho={boxesChirho} class:chosen-chirho={chosenChirho}
              class:repair-chirho={repairChirho && chosenChirho} style={styleBoxChirho(targetBoxChirho)}
              aria-label={`Select ${tokenChirho.textChirho || 'empty text'}, line ${tokenChirho.lineIndexChirho}`}
              aria-pressed={chosenChirho} tabindex={chosenChirho ? 0 : -1}
              onclick={() => { if (!chosenChirho || !repairChirho) onselectChirho(tokenChirho); }}
              onpointerdown={(eventChirho) => { if (chosenChirho) startDragChirho(eventChirho, false); }}
              onpointermove={moveDragChirho} onpointerup={() => { dragChirho = null; }} onpointercancel={() => { dragChirho = null; }}
              onkeydown={(eventChirho) => keyBoxChirho(eventChirho, false)}></button>
          {/if}
        {/each}
        {#if repairChirho && boxChirho}
          <button type="button" class="resize-box-chirho" aria-label="Resize selected box with arrow keys or drag"
            style={`left:${(boxChirho.xChirho + boxChirho.widthChirho) / widthChirho * 100}%;top:${(boxChirho.yChirho + boxChirho.heightChirho) / heightChirho * 100}%`}
            onpointerdown={(eventChirho) => startDragChirho(eventChirho, true)} onpointermove={moveDragChirho}
            onpointerup={() => { dragChirho = null; }} onpointercancel={() => { dragChirho = null; }}
            onkeydown={(eventChirho) => keyBoxChirho(eventChirho, true)}>↘</button>
        {/if}
      {/if}
    </div>
    {#if imageFailedChirho}<p role="alert">The source image could not load. Text confirmation is unavailable until you can compare the print.</p>{/if}
    {#if imageWidthChirho && !spaceChirho.validChirho}<p role="alert">The stored boxes do not fit this source image. Confirmation is held until its coordinates are checked.</p>{/if}
    {#if imageWidthChirho && spaceChirho.validChirho && !selectedFitsChirho}<p role="alert">This reading's box extends past the image edge. Confirmation is held for this reading; the rest of the page is available.</p>{/if}
  </div>
  <div class="focus-crop-chirho">
    <p>{selectedChirho ? `Selected print · line ${selectedChirho.lineIndexChirho}` : 'Select a word or phrase to inspect its print'}{repairChirho ? ' · box repair draft' : ''}</p>
    {#if boxChirho && selectedFitsChirho && spaceChirho.validChirho && !imageFailedChirho}
      <svg viewBox={cropChirho} role="img" aria-label="Magnified selected print with surrounding ink" preserveAspectRatio="xMidYMid meet">
        <image href={imageUrlChirho} width={widthChirho} height={heightChirho} preserveAspectRatio="none" />
        <rect x={boxChirho.xChirho} y={boxChirho.yChirho} width={boxChirho.widthChirho} height={boxChirho.heightChirho} />
      </svg>
    {:else}<div class="crop-empty-chirho">The page stays visible while you read and edit.</div>{/if}
  </div>
</section>

<style>
  .scan-pane-chirho { min-width: 0; display: flex; flex-direction: column; background: #e9e5db; border: 1px solid #cbc6b9; border-radius: 8px; overflow: hidden; height: 100%; }
  header { display:flex; align-items:center; gap:12px; padding:10px 14px; background:#f6f3ec; color:#393a35; font-size:.78rem; flex-wrap:wrap; }
  h2 {font-size:.92rem;margin-right:auto;} label {display:flex; align-items:center; gap:6px;} select {padding:5px; border:1px solid #b5b1a8;border-radius:4px;background:white;color:#303a39;} input {accent-color:#246f67;}
  .scan-scroll-chirho { overflow:auto; flex:1; min-height:120px; overscroll-behavior:contain; }
  .scan-scroll-chirho p {padding:20px;color:#8c2b23;}
  .scan-canvas-chirho {position:relative;min-width:100%;line-height:0;} img {width:100%;display:block;}
  .scan-box-chirho {position:absolute;background:transparent;border:1px solid transparent;cursor:pointer;padding:0;}
  .scan-box-chirho.visible-chirho {border-color:#54888188;} .scan-box-chirho:hover {background:#7cbdb633;border-color:#276e65;}
  .scan-box-chirho.chosen-chirho {border:2px solid #ba5619;background:#e4aa3726;z-index:2;}
  .scan-box-chirho.repair-chirho {border-style:dashed;cursor:move;touch-action:none;}
  .resize-box-chirho {position:absolute;transform:translate(-50%,-50%);z-index:3;width:24px;height:24px;background:#a74712;border:2px solid white;color:white;cursor:nwse-resize;touch-action:none;}
  .focus-crop-chirho {flex:0 0 156px;background:#f7f4ed;border-top:1px solid #c9c3b8;padding:8px 14px;overflow:hidden;color:#525650;font-size:.76rem;}
  .focus-crop-chirho p {margin-bottom:6px;} .focus-crop-chirho svg {display:block;width:100%;height:110px;background:#fff;}
  .focus-crop-chirho rect {fill:none;stroke:#ba5619;stroke-width:1;vector-effect:non-scaling-stroke;}
  .crop-empty-chirho {padding-top:28px;text-align:center;color:#71756e;}
  button:focus-visible {outline:3px solid #204eab;outline-offset:2px;}
  @media(max-width:700px) {.focus-crop-chirho {flex-basis:104px;} .focus-crop-chirho svg{height:66px;} header{padding:6px 10px;}}
</style>
