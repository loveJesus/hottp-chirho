<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->
<script lang="ts">
  import { tick as tickChirho } from 'svelte';
  import type { BoxChirho, ReadingTokenChirho } from '../model-chirho';
  import type { coordinateSpaceChirho } from '../coordinate-space-chirho';
  import { INSPECTION_ZOOMS_CHIRHO, inspectionFrameChirho, inspectionScaleChirho, type InspectionZoomChirho } from './viewport-chirho';

  let { imageUrlChirho, imageWidthChirho, imageHeightChirho, spaceChirho, tokensChirho, selectedChirho, boxChirho, readyChirho }: {
    imageUrlChirho: string; imageWidthChirho: number; imageHeightChirho: number;
    spaceChirho: ReturnType<typeof coordinateSpaceChirho>;
    tokensChirho: ReadingTokenChirho[]; selectedChirho: ReadingTokenChirho | null; boxChirho: BoxChirho | null;
    readyChirho: boolean;
  } = $props();
  let dialogChirho = $state<HTMLDialogElement>();
  let openChirho = $state(false), failedChirho = $state(false);
  let contextChirho = $state('selection-chirho');
  let zoomChirho = $state<InspectionZoomChirho>(2);
  let viewportWidthChirho = $state(0), viewportHeightChirho = $state(0);
  let viewportChirho = $state<HTMLDivElement>();
  const panActionsChirho = [
    { labelChirho: 'Pan print left', xChirho: -1, yChirho: 0, glyphChirho: '←' },
    { labelChirho: 'Pan print right', xChirho: 1, yChirho: 0, glyphChirho: '→' },
    { labelChirho: 'Pan print up', xChirho: 0, yChirho: -1, glyphChirho: '↑' },
    { labelChirho: 'Pan print down', xChirho: 0, yChirho: 1, glyphChirho: '↓' }
  ];
  const contextBoxesChirho = $derived(contextChirho === 'line-chirho' ? tokensChirho
    .filter((tokenChirho) => tokenChirho.scanlineIdChirho === selectedChirho?.scanlineIdChirho)
    .map((tokenChirho) => tokenChirho.keyChirho === selectedChirho?.keyChirho ? boxChirho : tokenChirho.boxChirho)
    .filter((candidateChirho): candidateChirho is BoxChirho => candidateChirho !== null) : []);
  const frameChirho = $derived(inspectionFrameChirho(boxChirho, contextBoxesChirho, spaceChirho, imageWidthChirho, imageHeightChirho));
  const scaleChirho = $derived(frameChirho ? inspectionScaleChirho(frameChirho, zoomChirho, viewportWidthChirho - 24, viewportHeightChirho - 24) : 1);
  const availableChirho = $derived(readyChirho && selectedChirho !== null && frameChirho !== null);
  $effect(() => { if (!availableChirho && dialogChirho?.open) dialogChirho.close(); });
  $effect(() => {
    if (!openChirho || !frameChirho || !boxChirho || !(scaleChirho > 0) || !viewportChirho || viewportWidthChirho <= 0 || viewportHeightChirho <= 0) return;
    const viewportElementChirho = viewportChirho;
    let cancelledChirho = false;
    void tickChirho().then(() => {
      if (cancelledChirho) return;
      const targetChirho = viewportElementChirho.querySelector('rect')?.getBoundingClientRect();
      if (!targetChirho) return;
      const boundsChirho = viewportElementChirho.getBoundingClientRect();
      viewportElementChirho.scrollBy({
        left: targetChirho.left + targetChirho.width / 2 - boundsChirho.left - viewportElementChirho.clientWidth / 2,
        top: targetChirho.top + targetChirho.height / 2 - boundsChirho.top - viewportElementChirho.clientHeight / 2
      });
    });
    return () => { cancelledChirho = true; };
  });

  // Workflow: page-reading-workflow-chirho.md. Native dialog traps focus and
  // returns it to its opener. Inspection never calls the editor or a writer.
  function openInspectionChirho(): void {
    if (!availableChirho || !dialogChirho || dialogChirho.open) return;
    failedChirho = false;
    dialogChirho.showModal();
    openChirho = true;
  }
  function panChirho(xChirho: number, yChirho: number): void {
    viewportChirho?.scrollBy({ left: xChirho * Math.max(48, viewportWidthChirho / 2), top: yChirho * Math.max(48, viewportHeightChirho / 2) });
  }
</script>

<button type="button" class="inspect-open-chirho" disabled={!availableChirho} onclick={openInspectionChirho}>Inspect print</button>
<dialog bind:this={dialogChirho} aria-labelledby="print-inspector-title-chirho" onclose={() => { openChirho = false; }}>
  <header>
    <div><h2 id="print-inspector-title-chirho">Inspect print</h2><p>Line {selectedChirho?.lineIndexChirho} · source scan</p></div>
    <button type="button" class="close-inspection-chirho" onclick={() => dialogChirho?.close()}>Close inspection</button>
  </header>
  <div class="inspection-controls-chirho">
    <label>Print context<select aria-label="Print context" bind:value={contextChirho}><option value="selection-chirho">Selected reading</option><option value="line-chirho">Full line</option></select></label>
    <label>Print zoom<select aria-label="Print zoom" bind:value={zoomChirho}><option value="fit-chirho">Fit view</option>{#each INSPECTION_ZOOMS_CHIRHO as optionChirho}<option value={optionChirho}>{optionChirho * 100}%</option>{/each}</select></label>
    <div class="pan-controls-chirho" role="group" aria-label="Pan print">
      {#each panActionsChirho as actionChirho}<button type="button" aria-label={actionChirho.labelChirho}
        onclick={() => panChirho(actionChirho.xChirho, actionChirho.yChirho)}>{actionChirho.glyphChirho}</button>{/each}
    </div>
    <p>100% = source image pixels. Scroll or use the pan buttons to inspect.</p>
  </div>
  <div class="inspection-viewer-chirho" role="region" aria-label="Scrollable print inspection" bind:this={viewportChirho}
    bind:clientWidth={viewportWidthChirho} bind:clientHeight={viewportHeightChirho}>
    {#if openChirho && frameChirho && boxChirho}
      <svg viewBox={[frameChirho.cropChirho.xChirho, frameChirho.cropChirho.yChirho, frameChirho.cropChirho.widthChirho, frameChirho.cropChirho.heightChirho].join(' ')}
        style:width={frameChirho.pixelWidthChirho * scaleChirho + 'px'} style:height={frameChirho.pixelHeightChirho * scaleChirho + 'px'}
        preserveAspectRatio="none" role="img" aria-label="Enlarged source print with the selected reading outlined">
        <image href={imageUrlChirho} width={spaceChirho.widthChirho} height={spaceChirho.heightChirho} preserveAspectRatio="none"
          onerror={() => { failedChirho = true; }} />
        <rect x={boxChirho.xChirho} y={boxChirho.yChirho} width={boxChirho.widthChirho} height={boxChirho.heightChirho} />
      </svg>
    {/if}
  </div>
  {#if failedChirho}<p role="alert" class="inspection-error-chirho">The enlarged scan could not load. Close and try again; your draft is unchanged.</p>{/if}
  <footer>Read-only inspection. Close to edit or confirm in the reader. Escape also closes this view.</footer>
</dialog>

<style>
  button, select {font:inherit;color:#293c34;border:1px solid #aab9b0;border-radius:4px;background:#fff;}
  button {cursor:pointer;padding:6px 10px;} button:disabled {opacity:.5;cursor:default;}
  .inspect-open-chirho {font-size:.74rem;line-height:1.2;padding:3px 8px;white-space:nowrap;}
  dialog {width:min(1100px,calc(100vw - 24px));height:min(850px,calc(100dvh - 24px));max-width:none;max-height:none;margin:auto;padding:0;border:1px solid #8a9d90;border-radius:8px;background:#faf8f2;color:#293c34;overflow:hidden;box-sizing:border-box;}
  dialog[open] {display:flex;flex-direction:column;}
  dialog::backdrop {background:#10201ad6;}
  header {display:flex;align-items:center;gap:12px;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #cbc6b9;}
  h2 {font-size:1.05rem;margin:0;} header p {margin:3px 0 0;font-size:.8rem;}
  .close-inspection-chirho {font-size:.8rem;}
  .inspection-controls-chirho {display:flex;align-items:end;flex-wrap:wrap;gap:12px;padding:10px 16px;}
  label {display:flex;flex-direction:column;gap:4px;font-size:.78rem;} select {padding:6px 8px;min-height:32px;}
  .pan-controls-chirho {display:flex;gap:4px;}.pan-controls-chirho button {min-width:32px;min-height:32px;padding:4px;}
  .inspection-controls-chirho p {font-size:.76rem;max-width:26rem;margin:0 0 6px;color:#52625a;}
  .inspection-viewer-chirho {flex:1;min-height:0;overflow:auto;padding:12px;background:#d9d5cb;overscroll-behavior:contain;}
  svg {display:block;max-width:none;flex-shrink:0;background:#fff;}
  rect {fill:none;stroke:#ba5619;stroke-width:2;vector-effect:non-scaling-stroke;}
  footer, .inspection-error-chirho {padding:10px 16px;font-size:.76rem;margin:0;}
  .inspection-error-chirho {color:#8c2b23;}
  button:focus-visible, select:focus-visible, .inspection-viewer-chirho:focus-visible {outline:3px solid #204eab;outline-offset:-3px;}
  @media(max-width:700px) {header,.inspection-controls-chirho {padding:10px;}.inspection-controls-chirho {gap:8px;}.inspection-controls-chirho p {flex-basis:100%;}footer {padding:8px 10px;}}
</style>
