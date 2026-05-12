<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  let { data } = $props();

  const SCRIPT_COLORS_CHIRHO: Record<string, string> = {
    "hebrew-chirho": "#e34a4a",
    "greek-chirho": "#4cc24c",
    "syriac-chirho": "#a050c8",
    "arabic-chirho": "#b47828",
    "latin-non-french-chirho": "#e69014",
    "symbol-chirho": "#ddc81e",
    "unknown-chirho": "#888888",
  };

  function imageUrlChirho(r2KeyChirho: string | null): string {
    if (!r2KeyChirho) return "";
    return `/api-chirho/images-chirho?key-chirho=${encodeURIComponent(r2KeyChirho)}`;
  }

  function scriptLabelChirho(typeChirho: string | null): string {
    if (!typeChirho) return "Unknown";
    const baseChirho = typeChirho.replace("-chirho", "");
    const niceChirho: Record<string, string> = {
      "french": "French",
      "latin-non-french": "Latin (non-French)",
      "hebrew": "Hebrew",
      "greek": "Greek",
      "syriac": "Syriac",
      "arabic": "Arabic",
      "symbol": "Symbol",
      "unknown": "Unknown",
    };
    return niceChirho[baseChirho] ?? baseChirho;
  }

  function statusLabelChirho(statusChirho: string | null | undefined): string {
    if (!statusChirho) return "Pending";
    const niceChirho: Record<string, string> = {
      "agent-pending-chirho": "Agent suggested",
      "human-confirmed-chirho": "Confirmed",
      "flagged-chirho": "Flagged",
      "accepted-chirho": "Accepted",
      "rejected-chirho": "Rejected",
      "pending-chirho": "Pending",
    };
    return niceChirho[statusChirho] ?? statusChirho.replace("-chirho", "").replace(/-/g, " ");
  }

  // Cross-highlight state shared between page-image overlays and the list.
  let hoveredSegmentIdChirho = $state<number | null>(null);

  // Image natural dims (for percent-based overlay positioning that survives
  // the responsive page-image scaling).
  let imgNaturalWidthChirho = $state(0);
  let imgNaturalHeightChirho = $state(0);

  function onImageLoadChirho(eChirho: Event): void {
    const imgChirho = eChirho.currentTarget as HTMLImageElement;
    imgNaturalWidthChirho = imgChirho.naturalWidth;
    imgNaturalHeightChirho = imgChirho.naturalHeight;
  }

  type NonFrenchSegmentChirho = (typeof data.nonFrenchSegmentsChirho)[number];

  function pageBoxStyleChirho(segChirho: NonFrenchSegmentChirho): string {
    if (!imgNaturalWidthChirho || !imgNaturalHeightChirho) return "display: none;";
    const sxMinChirho = Number(segChirho.scanlineXMinChirho ?? 0);
    const syMinChirho = Number(segChirho.scanlineYMinChirho ?? 0);
    const slHeightChirho = Number(segChirho.scanlineHeightChirho ?? 0);
    const sxOffChirho = Number(segChirho.xMinPxChirho ?? 0);
    const swChirho = Number(segChirho.widthPxChirho ?? 0);
    const xMinChirho = sxMinChirho + sxOffChirho;
    const yMinChirho = syMinChirho;
    const heightChirho = Math.max(1, slHeightChirho);
    const colorChirho =
      SCRIPT_COLORS_CHIRHO[segChirho.scriptTypeChirho ?? "unknown-chirho"] ??
      "#888";
    const leftPctChirho = (xMinChirho / imgNaturalWidthChirho) * 100;
    const topPctChirho = (yMinChirho / imgNaturalHeightChirho) * 100;
    const widthPctChirho = (swChirho / imgNaturalWidthChirho) * 100;
    const heightPctChirho = (heightChirho / imgNaturalHeightChirho) * 100;
    return `left: ${leftPctChirho}%; top: ${topPctChirho}%; width: ${widthPctChirho}%; height: ${heightPctChirho}%; --seg-color: ${colorChirho};`;
  }

  // Group non-french segments by line for the right-hand list.
  const segmentsByLineChirho = $derived(() => {
    const mapChirho = new Map<number, NonFrenchSegmentChirho[]>();
    for (const segChirho of data.nonFrenchSegmentsChirho) {
      const arrChirho = mapChirho.get(segChirho.lineIndexChirho) ?? [];
      arrChirho.push(segChirho);
      mapChirho.set(segChirho.lineIndexChirho, arrChirho);
    }
    return [...mapChirho.entries()].sort(
      (aChirho, bChirho) => aChirho[0] - bChirho[0]
    );
  });

  const scriptDistributionChirho = $derived(() => {
    const countsChirho = new Map<string, number>();
    for (const segChirho of data.nonFrenchSegmentsChirho) {
      const kChirho = segChirho.scriptTypeChirho ?? "unknown-chirho";
      countsChirho.set(kChirho, (countsChirho.get(kChirho) ?? 0) + 1);
    }
    return [...countsChirho.entries()].sort(
      (aChirho, bChirho) => bChirho[1] - aChirho[1]
    );
  });

  // Edit modal state
  let editingSegmentChirho = $state<NonFrenchSegmentChirho | null>(null);
  let editTextChirho = $state("");
  let editScriptChirho = $state("");
  let savingChirho = $state(false);

  function openEditChirho(segChirho: NonFrenchSegmentChirho): void {
    editingSegmentChirho = segChirho;
    editTextChirho = segChirho.acceptedTextChirho ?? segChirho.ocrTextChirho ?? "";
    editScriptChirho = segChirho.scriptTypeChirho ?? "unknown-chirho";
  }
  function closeEditChirho(): void {
    editingSegmentChirho = null;
    editTextChirho = "";
    editScriptChirho = "";
  }
  async function saveEditChirho(): Promise<void> {
    if (!editingSegmentChirho) return;
    savingChirho = true;
    try {
      await fetch("/api-chirho/segments-chirho", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentIdChirho: editingSegmentChirho.segmentIdChirho,
          acceptedTextChirho: editTextChirho,
          statusChirho: "human-confirmed-chirho",
        }),
      });
      closeEditChirho();
      await invalidateAll();
    } finally {
      savingChirho = false;
    }
  }

  // ============================================================
  // Word-level event-sourced editor (additive over the legacy UI)
  // ============================================================

  interface SnapshotWordChirho {
    wordIdChirho: number;
    wordIndexChirho: number;
    xMinChirho: number;
    yMinChirho: number;
    xMaxChirho: number;
    yMaxChirho: number;
    originalOcrTextChirho: string | null;
    currentTextChirho: string | null;
    currentScriptChirho: string | null;
    currentSourceChirho: string | null;
    isHumanConfirmedChirho: boolean;
    pendingScriptFlagChirho: boolean;
  }
  interface SnapshotScanlineChirho {
    scanlineIdChirho: number;
    lineIndexChirho: number;
    xMinChirho: number;
    yMinChirho: number;
    widthChirho: number;
    heightChirho: number;
    wordsChirho: SnapshotWordChirho[];
  }
  interface SnapshotChirho {
    pageIdChirho: number;
    scanlinesChirho: SnapshotScanlineChirho[];
  }

  const snapshotParsedChirho = $derived.by((): SnapshotChirho | null => {
    const sChirho = (data as any).snapshotChirho;
    if (!sChirho?.underlayJsonChirho) return null;
    try { return JSON.parse(sChirho.underlayJsonChirho) as SnapshotChirho; }
    catch { return null; }
  });

  interface WordOverrideChirho {
    textChirho?: string;
    scriptChirho?: string;
    sourceChirho?: string;
    isHumanConfirmedChirho?: boolean;
    pendingScriptFlagChirho?: boolean;
  }
  const wordOverridesChirho = $derived.by((): Map<number, WordOverrideChirho> => {
    const mapChirho = new Map<number, WordOverrideChirho>();
    for (const evChirho of (data as any).eventTailChirho ?? []) {
      if (evChirho.wordIdChirho == null) continue;
      const curChirho = mapChirho.get(evChirho.wordIdChirho) ?? {};
      let payloadChirho: Record<string, unknown> = {};
      try { payloadChirho = JSON.parse(evChirho.payloadJsonChirho ?? "{}"); } catch {}
      switch (evChirho.eventTypeChirho) {
        case "word-text-corrected-chirho":
          if (typeof payloadChirho.newTextChirho === "string") curChirho.textChirho = payloadChirho.newTextChirho as string;
          curChirho.sourceChirho = "human-chirho";
          curChirho.isHumanConfirmedChirho = true;
          break;
        case "word-script-flagged-chirho":
          curChirho.pendingScriptFlagChirho = true;
          break;
        case "word-script-set-chirho":
          if (typeof payloadChirho.newScriptChirho === "string") curChirho.scriptChirho = payloadChirho.newScriptChirho as string;
          curChirho.pendingScriptFlagChirho = false;
          curChirho.sourceChirho = "human-chirho";
          break;
        case "word-verified-chirho":
          curChirho.isHumanConfirmedChirho = true;
          break;
      }
      mapChirho.set(evChirho.wordIdChirho, curChirho);
    }
    return mapChirho;
  });

  const linesNeedingAIChirho = $derived.by((): Set<number> => {
    const sChirho = new Set<number>();
    for (const evChirho of (data as any).eventTailChirho ?? []) {
      if (evChirho.eventTypeChirho === "scanline-needs-ai-review-chirho" && evChirho.scanlineIdChirho != null) {
        sChirho.add(evChirho.scanlineIdChirho);
      }
    }
    return sChirho;
  });

  interface MergedWordChirho extends SnapshotWordChirho {
    scanlineIdChirho: number;
    lineIndexChirho: number;
    displayTextChirho: string;
    displayScriptChirho: string;
    displaySourceChirho: string;
    displayConfirmedChirho: boolean;
    displayPendingScriptFlagChirho: boolean;
  }
  const mergedWordsChirho = $derived.by((): MergedWordChirho[] => {
    const snapChirho = snapshotParsedChirho;
    if (!snapChirho) return [];
    const overridesChirho = wordOverridesChirho;
    const outChirho: MergedWordChirho[] = [];
    for (const slChirho of snapChirho.scanlinesChirho) {
      for (const wChirho of slChirho.wordsChirho) {
        const oChirho = overridesChirho.get(wChirho.wordIdChirho) ?? {};
        outChirho.push({
          ...wChirho,
          scanlineIdChirho: slChirho.scanlineIdChirho,
          lineIndexChirho: slChirho.lineIndexChirho,
          displayTextChirho: oChirho.textChirho ?? wChirho.currentTextChirho ?? wChirho.originalOcrTextChirho ?? "",
          displayScriptChirho: oChirho.scriptChirho ?? wChirho.currentScriptChirho ?? "latin-chirho",
          displaySourceChirho: oChirho.sourceChirho ?? wChirho.currentSourceChirho ?? "ocr-chirho",
          displayConfirmedChirho: oChirho.isHumanConfirmedChirho ?? wChirho.isHumanConfirmedChirho ?? false,
          displayPendingScriptFlagChirho: oChirho.pendingScriptFlagChirho ?? wChirho.pendingScriptFlagChirho ?? false,
        });
      }
    }
    return outChirho;
  });

  // Word overlay toggle + interactions — on by default per request
  let showWordOverlayChirho = $state(true);
  let hoveredWordChirho = $state<MergedWordChirho | null>(null);

  // Word edit modal
  let editingWordChirho = $state<MergedWordChirho | null>(null);
  let wordEditTextChirho = $state("");
  let wordEditScriptChirho = $state("");
  let wordSavingChirho = $state(false);

  function openWordEditChirho(wChirho: MergedWordChirho): void {
    editingWordChirho = wChirho;
    wordEditTextChirho = wChirho.displayTextChirho;
    wordEditScriptChirho = wChirho.displayScriptChirho;
    hoveredWordChirho = null;
  }
  function closeWordEditChirho(): void {
    editingWordChirho = null;
    wordEditTextChirho = "";
    wordEditScriptChirho = "";
  }

  async function postEventChirho(payloadChirho: Record<string, unknown>): Promise<void> {
    await fetch("/api-chirho/events-chirho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadChirho),
    });
    await invalidateAll();
  }

  async function saveWordChirho(): Promise<void> {
    if (!editingWordChirho) return;
    wordSavingChirho = true;
    try {
      const newTextChirho = wordEditTextChirho.trim();
      const wordChirho = editingWordChirho;
      const pageIdChirho = (data as any).pageDataChirho.idChirho;
      // Only emit a text-corrected event if the text actually changed.
      if (newTextChirho !== (wordChirho.displayTextChirho ?? "").trim()) {
        await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wordChirho.scanlineIdChirho,
          wordIdChirho: wordChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-text-corrected-chirho",
          payloadChirho: { oldTextChirho: wordChirho.displayTextChirho, newTextChirho },
        });
      } else if (!wordChirho.displayConfirmedChirho) {
        // No text change but user is saying "OCR was correct" — emit verified.
        await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wordChirho.scanlineIdChirho,
          wordIdChirho: wordChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-verified-chirho",
          payloadChirho: { textChirho: wordChirho.displayTextChirho },
        });
      }
      if (wordEditScriptChirho !== wordChirho.displayScriptChirho) {
        await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wordChirho.scanlineIdChirho,
          wordIdChirho: wordChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-script-set-chirho",
          payloadChirho: { oldScriptChirho: wordChirho.displayScriptChirho, newScriptChirho: wordEditScriptChirho },
        });
      }
      closeWordEditChirho();
    } finally {
      wordSavingChirho = false;
    }
  }

  async function markWordNonLatinChirho(wChirho: MergedWordChirho): Promise<void> {
    await postEventChirho({
      pageIdChirho: (data as any).pageDataChirho.idChirho,
      scanlineIdChirho: wChirho.scanlineIdChirho,
      wordIdChirho: wChirho.wordIdChirho,
      aggregateTypeChirho: "word-chirho",
      eventTypeChirho: "word-script-flagged-chirho",
      payloadChirho: { noteChirho: "should-be-non-latin-chirho", currentTextChirho: wChirho.displayTextChirho },
    });
  }

  async function markLineNeedsAIChirho(scanlineIdChirho: number, lineIndexChirho: number): Promise<void> {
    await postEventChirho({
      pageIdChirho: (data as any).pageDataChirho.idChirho,
      scanlineIdChirho,
      aggregateTypeChirho: "scanline-chirho",
      eventTypeChirho: "scanline-needs-ai-review-chirho",
      payloadChirho: { lineIndexChirho },
    });
  }

  // Hover popup geometry
  function wordHoverStyleChirho(wChirho: MergedWordChirho | null): string {
    if (!wChirho || !imgNaturalWidthChirho || !imgNaturalHeightChirho) return "display: none;";
    const cxChirho = ((wChirho.xMinChirho + wChirho.xMaxChirho) / 2 / imgNaturalWidthChirho) * 100;
    const isUpperChirho = wChirho.yMinChirho < imgNaturalHeightChirho / 3;
    if (isUpperChirho) {
      const topPctChirho = (wChirho.yMaxChirho / imgNaturalHeightChirho) * 100;
      return `left: ${cxChirho}%; top: calc(${topPctChirho}% + 4px); transform: translateX(-50%);`;
    } else {
      const bottomPctChirho = 100 - (wChirho.yMinChirho / imgNaturalHeightChirho) * 100;
      return `left: ${cxChirho}%; bottom: calc(${bottomPctChirho}% + 4px); transform: translateX(-50%);`;
    }
  }

  function wordCropViewBoxChirho(wChirho: MergedWordChirho, padPxChirho = 2): string {
    const xChirho = Math.max(0, wChirho.xMinChirho - padPxChirho);
    const yChirho = Math.max(0, wChirho.yMinChirho - padPxChirho);
    const wPxChirho = (wChirho.xMaxChirho - wChirho.xMinChirho) + padPxChirho * 2;
    const hPxChirho = (wChirho.yMaxChirho - wChirho.yMinChirho) + padPxChirho * 2;
    return `${xChirho} ${yChirho} ${wPxChirho} ${hPxChirho}`;
  }
</script>

<div class="page-overview-chirho">
  <nav class="breadcrumb-chirho">
    <a href="/">Home</a> /
    <a href="/volumes-chirho/{data.volumeNumberChirho}">Vol {data.volumeNumberChirho}</a> /
    Page {data.pageNumberChirho}
  </nav>

  <div class="page-nav-chirho">
    {#if data.prevPageChirho}
      <a href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.prevPageChirho}" class="nav-btn-chirho">← Page {data.prevPageChirho}</a>
    {:else}<span></span>{/if}
    <h1>Vol {data.volumeNumberChirho} · Page {data.pageNumberChirho}</h1>
    {#if data.nextPageChirho}
      <a href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.nextPageChirho}" class="nav-btn-chirho">Page {data.nextPageChirho} →</a>
    {:else}<span></span>{/if}
  </div>

  <div class="action-row-chirho">
    <a href="/volumes-chirho/{data.volumeNumberChirho}/pages-chirho/{data.pageNumberChirho}/scanlines-chirho" class="btn-scanline-chirho">
      Open line-by-line editor →
    </a>
    <span class="non-french-count-chirho">
      {data.nonFrenchSegmentsChirho.length} non-French segment{data.nonFrenchSegmentsChirho.length === 1 ? "" : "s"}
    </span>
    <label class="toggle-words-chirho">
      <input type="checkbox" bind:checked={showWordOverlayChirho} />
      Show word boxes ({mergedWordsChirho.length})
    </label>
  </div>

  {#if data.nonFrenchSegmentsChirho.length > 0}
    <div class="script-chips-chirho">
      {#each scriptDistributionChirho() as [scriptChirho, countChirho]}
        <span class="chip-chirho" style="--chip-color: {SCRIPT_COLORS_CHIRHO[scriptChirho] ?? '#888'}">{scriptLabelChirho(scriptChirho)} · {countChirho}</span>
      {/each}
    </div>
  {/if}

  <div class="content-chirho">
    <div class="page-image-panel-chirho">
      <h2>Page image — hover or click overlays to edit</h2>
      <div class="image-container-chirho" class:word-overlay-on-chirho={showWordOverlayChirho}>
        <img
          onload={onImageLoadChirho}
          src={imageUrlChirho(data.fullPageR2KeyChirho)}
          alt="Page {data.pageNumberChirho}"
          class="full-page-img-chirho"
        />
        {#each data.nonFrenchSegmentsChirho as segChirho (segChirho.segmentIdChirho)}
          <button
            type="button"
            class="overlay-chirho"
            class:hovered-chirho={hoveredSegmentIdChirho === segChirho.segmentIdChirho}
            style={pageBoxStyleChirho(segChirho)}
            onmouseenter={() => (hoveredSegmentIdChirho = segChirho.segmentIdChirho)}
            onmouseleave={() => (hoveredSegmentIdChirho = null)}
            onclick={() => openEditChirho(segChirho)}
            title="Line {segChirho.lineIndexChirho} · {scriptLabelChirho(segChirho.scriptTypeChirho)}: {segChirho.acceptedTextChirho ?? ''} (click to edit)"
          ></button>
        {/each}

        {#if showWordOverlayChirho && snapshotParsedChirho && imgNaturalWidthChirho > 0}
          {#each snapshotParsedChirho.scanlinesChirho as slChirho (slChirho.scanlineIdChirho)}
            {@const yTopChirho = (slChirho.yMinChirho / imgNaturalHeightChirho) * 100}
            {@const slHeightChirho = (slChirho.heightChirho / imgNaturalHeightChirho) * 100}
            <button
              type="button"
              class="line-flag-btn-chirho"
              class:flagged-chirho={linesNeedingAIChirho.has(slChirho.scanlineIdChirho)}
              style="top: {yTopChirho}%; height: {slHeightChirho}%"
              onclick={() => markLineNeedsAIChirho(slChirho.scanlineIdChirho, slChirho.lineIndexChirho)}
              title="Line {slChirho.lineIndexChirho}: flag as needs AI review"
              aria-label="Flag line {slChirho.lineIndexChirho} for AI review"
            >🚩</button>
          {/each}
          <svg
            class="word-svg-chirho"
            viewBox="0 0 {imgNaturalWidthChirho} {imgNaturalHeightChirho}"
            preserveAspectRatio="none"
          >
            {#each mergedWordsChirho as wChirho (wChirho.wordIdChirho)}
              <g class="word-g-chirho">
                <rect
                  class="word-box-chirho"
                  class:confirmed-chirho={wChirho.displayConfirmedChirho}
                  class:flagged-chirho={wChirho.displayPendingScriptFlagChirho}
                  class:hovered-chirho={hoveredWordChirho?.wordIdChirho === wChirho.wordIdChirho}
                  x={wChirho.xMinChirho}
                  y={wChirho.yMinChirho}
                  width={wChirho.xMaxChirho - wChirho.xMinChirho}
                  height={wChirho.yMaxChirho - wChirho.yMinChirho}
                  onmouseenter={() => (hoveredWordChirho = wChirho)}
                  onmouseleave={() => { if (hoveredWordChirho?.wordIdChirho === wChirho.wordIdChirho) hoveredWordChirho = null; }}
                  onclick={() => openWordEditChirho(wChirho)}
                  oncontextmenu={(eChirho) => { eChirho.preventDefault(); markWordNonLatinChirho(wChirho); }}
                  role="button"
                  tabindex="0"
                  aria-label="Word at line {wChirho.lineIndexChirho}: {wChirho.displayTextChirho}"
                ></rect>
                {#if wChirho.displayConfirmedChirho}
                  <circle
                    class="word-dot-chirho"
                    cx={wChirho.xMaxChirho - 4}
                    cy={wChirho.yMinChirho + 4}
                    r="3"
                  ></circle>
                {/if}
              </g>
            {/each}
          </svg>

          {#if hoveredWordChirho}
            <div class="word-hover-popup-chirho" style={wordHoverStyleChirho(hoveredWordChirho)}>
              <div class="word-hover-text-chirho" dir="auto">{hoveredWordChirho.displayTextChirho || "(empty)"}</div>
              <div class="word-hover-meta-chirho">
                line {hoveredWordChirho.lineIndexChirho} ·
                {hoveredWordChirho.displaySourceChirho.replace("-chirho", "")}
                {#if hoveredWordChirho.displayConfirmedChirho}· ✓ confirmed{/if}
                {#if hoveredWordChirho.displayPendingScriptFlagChirho}· ⚠ script flag{/if}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>

    <div class="segments-panel-chirho">
      <h2>Non-French segments</h2>
      {#if data.nonFrenchSegmentsChirho.length === 0}
        <p class="empty-chirho">No non-French segments on this page.</p>
      {:else}
        {#each segmentsByLineChirho() as [lineIndexChirho, segsChirho]}
          <div class="line-block-chirho">
            <div class="line-header-chirho">Line {lineIndexChirho}</div>
            <div class="line-segments-chirho">
              {#each segsChirho as segChirho (segChirho.segmentIdChirho)}
                {@const colorChirho = SCRIPT_COLORS_CHIRHO[segChirho.scriptTypeChirho ?? 'unknown-chirho'] ?? '#888'}
                {@const confChirho = (segChirho as any).canonicalConfidenceChirho as string | null}
                {@const refChirho = (segChirho as any).canonicalReferenceChirho as string | null}
                {@const srcChirho = (segChirho as any).canonicalSourceChirho as string | null}
                <button
                  type="button"
                  class="segment-chip-chirho"
                  class:hovered-chirho={hoveredSegmentIdChirho === segChirho.segmentIdChirho}
                  style="--seg-color: {colorChirho}"
                  onmouseenter={() => (hoveredSegmentIdChirho = segChirho.segmentIdChirho)}
                  onmouseleave={() => (hoveredSegmentIdChirho = null)}
                  onclick={() => openEditChirho(segChirho)}
                  title={refChirho ? `${srcChirho?.toUpperCase()} ${refChirho} (${confChirho})` : 'no canonical match'}
                >
                  {#if confChirho === 'high'}
                    <span class="conf-badge-chirho conf-high-chirho" title="{srcChirho?.toUpperCase()} canonical match: {refChirho}">✓</span>
                  {:else if confChirho === 'medium'}
                    <span class="conf-badge-chirho conf-medium-chirho" title="{srcChirho?.toUpperCase()} near match: {refChirho}">◐</span>
                  {:else if confChirho === 'low'}
                    <span class="conf-badge-chirho conf-low-chirho" title="weak match (likely wrong)">?</span>
                  {:else}
                    <span class="conf-badge-chirho conf-none-chirho" title="no canonical reference">∅</span>
                  {/if}
                  <span class="seg-script-chirho">{scriptLabelChirho(segChirho.scriptTypeChirho)}</span>
                  <span class="seg-text-chirho" dir="auto">{segChirho.acceptedTextChirho ?? segChirho.ocrTextChirho ?? ""}</span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  {#if data.reconstructedTextChirho}
    <details class="recon-chirho" open>
      <summary>Reconstructed page text ({data.reconstructedTextChirho.length} chars)</summary>
      <pre>{data.reconstructedTextChirho}</pre>
    </details>
  {/if}
</div>

{#if editingWordChirho && snapshotParsedChirho}
  {@const wChirho = editingWordChirho}
  <div class="modal-backdrop-chirho" onclick={closeWordEditChirho} role="presentation">
    <div class="modal-chirho word-modal-chirho" onclick={(eChirho) => eChirho.stopPropagation()} role="dialog" aria-modal="true">
      <header class="modal-header-chirho">
        <h3>Edit word · line {wChirho.lineIndexChirho}</h3>
        <button class="close-btn-chirho" onclick={closeWordEditChirho} aria-label="Close">×</button>
      </header>
      <div class="modal-body-chirho">
        <div class="word-crop-preview-chirho">
          <svg
            viewBox={wordCropViewBoxChirho(wChirho)}
            preserveAspectRatio="xMidYMid meet"
            class="word-crop-svg-chirho"
          >
            <image
              href={imageUrlChirho(data.fullPageR2KeyChirho)}
              x="0"
              y="0"
              width={imgNaturalWidthChirho}
              height={imgNaturalHeightChirho}
            />
          </svg>
        </div>
        <div class="word-meta-chirho">
          <span class="meta-pill-chirho">OCR: <code dir="auto">{wChirho.originalOcrTextChirho ?? ""}</code></span>
          <span class="meta-pill-chirho">Source: {wChirho.displaySourceChirho.replace("-chirho", "")}</span>
          {#if wChirho.displayConfirmedChirho}
            <span class="meta-pill-chirho confirmed-pill-chirho">✓ confirmed</span>
          {/if}
          {#if wChirho.displayPendingScriptFlagChirho}
            <span class="meta-pill-chirho flagged-pill-chirho">⚠ script flagged</span>
          {/if}
        </div>
        <label>Text
          <input
            type="text"
            bind:value={wordEditTextChirho}
            dir="auto"
            placeholder="Type the correct word…"
            class="word-edit-input-chirho"
          />
        </label>
        <label>Script
          <select bind:value={wordEditScriptChirho}>
            <option value="latin-chirho">Latin (French/Latin alphabet)</option>
            <option value="latin-non-french-chirho">Latin — non-French</option>
            <option value="hebrew-chirho">Hebrew</option>
            <option value="greek-chirho">Greek</option>
            <option value="syriac-chirho">Syriac</option>
            <option value="arabic-chirho">Arabic</option>
            <option value="symbol-chirho">Symbol</option>
            <option value="unknown-chirho">Unknown</option>
          </select>
        </label>
        <p class="modal-hint-chirho">Saving emits a <code>word-text-corrected-chirho</code> event and marks the word confirmed.</p>
      </div>
      <footer class="modal-footer-chirho">
        <button class="btn-flag-chirho" onclick={() => markWordNonLatinChirho(wChirho)} disabled={wordSavingChirho}>
          ⚠ Flag as non-Latin
        </button>
        <button class="btn-cancel-chirho" onclick={closeWordEditChirho} disabled={wordSavingChirho}>Cancel</button>
        <button class="btn-save-chirho" onclick={saveWordChirho} disabled={wordSavingChirho}>
          {wordSavingChirho ? "Saving…" : "Save"}
        </button>
      </footer>
    </div>
  </div>
{/if}

{#if editingSegmentChirho}
  {@const segChirho = editingSegmentChirho}
  <div class="modal-backdrop-chirho" onclick={closeEditChirho} role="presentation">
    <div class="modal-chirho" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <header class="modal-header-chirho">
        <h3>Edit segment</h3>
        <button class="close-btn-chirho" onclick={closeEditChirho} aria-label="Close">×</button>
      </header>
      <div class="modal-body-chirho">
        <div class="modal-meta-chirho">
          <span class="meta-pill-chirho">Line {segChirho.lineIndexChirho}</span>
          <span class="meta-pill-chirho">{scriptLabelChirho(segChirho.scriptTypeChirho)}</span>
          <span class="meta-pill-chirho">Currently: {statusLabelChirho(segChirho.statusChirho)}</span>
        </div>
        <label>Text
          <textarea bind:value={editTextChirho} dir="auto" rows="4" placeholder="Edit the transcribed text…"></textarea>
        </label>
        <p class="modal-hint-chirho">Saving marks this segment as <strong>Confirmed</strong>.</p>
      </div>
      <footer class="modal-footer-chirho">
        <button class="btn-cancel-chirho" onclick={closeEditChirho} disabled={savingChirho}>Cancel</button>
        <button class="btn-save-chirho" onclick={saveEditChirho} disabled={savingChirho}>
          {savingChirho ? "Saving…" : "Save"}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .page-overview-chirho { max-width: 1400px; }
  .breadcrumb-chirho { font-size: 0.85rem; color: #666; margin-bottom: 0.5rem; }
  .breadcrumb-chirho a { color: #c9a84c; text-decoration: none; }
  .page-nav-chirho { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-nav-chirho h1 { font-size: 1.4rem; color: #c9a84c; margin: 0; }
  .nav-btn-chirho { padding: 0.4rem 0.8rem; background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 4px; color: #c9a84c; text-decoration: none; font-size: 0.85rem; }
  .nav-btn-chirho:hover { background: #2a2a4a; }
  .action-row-chirho { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; }
  .btn-scanline-chirho { padding: 0.5rem 1rem; background: #1a1a2e; border: 1px solid #c9a84c; border-radius: 6px; color: #c9a84c; text-decoration: none; font-size: 0.85rem; }
  .btn-scanline-chirho:hover { background: #2a2a4a; }
  .non-french-count-chirho { color: #888; font-size: 0.9rem; }
  .script-chips-chirho { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .chip-chirho { padding: 0.2rem 0.6rem; background: rgba(255,255,255,0.04); border: 1px solid var(--chip-color); border-radius: 12px; color: var(--chip-color); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .content-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
  .page-image-panel-chirho h2, .segments-panel-chirho h2 { font-size: 1rem; color: #ccc; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #2a2a4a; }
  .image-container-chirho { position: relative; border: 1px solid #2a2a4a; border-radius: 6px; background: #fff; }
  .full-page-img-chirho { width: 100%; display: block; }
  .overlay-chirho {
    position: absolute;
    background: color-mix(in srgb, var(--seg-color) 22%, transparent);
    border: 1px solid color-mix(in srgb, var(--seg-color) 60%, transparent);
    cursor: pointer;
    padding: 0;
    transition: background 0.12s, border-color 0.12s, box-shadow 0.12s;
  }
  .overlay-chirho:hover, .overlay-chirho.hovered-chirho {
    background: color-mix(in srgb, var(--seg-color) 55%, transparent);
    border-color: var(--seg-color);
    box-shadow: 0 0 8px var(--seg-color);
    z-index: 2;
  }
  .segments-panel-chirho { max-height: 90vh; overflow-y: auto; padding-right: 0.5rem; }
  .line-block-chirho { margin-bottom: 0.5rem; padding: 0.4rem 0.5rem; background: #12121f; border: 1px solid #2a2a4a; border-radius: 6px; }
  .line-header-chirho { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.3rem; }
  .line-segments-chirho { display: flex; flex-wrap: wrap; gap: 0.3rem; }
  .segment-chip-chirho {
    display: inline-flex;
    flex-direction: column;
    padding: 0.3rem 0.55rem;
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-left: 3px solid var(--seg-color);
    border-radius: 4px;
    cursor: pointer;
    color: inherit;
    font: inherit;
    text-align: left;
    transition: background 0.12s, border-color 0.12s, transform 0.12s;
  }
  .segment-chip-chirho:hover, .segment-chip-chirho.hovered-chirho {
    background: color-mix(in srgb, var(--seg-color) 18%, #1a1a2e);
    border-color: var(--seg-color);
    transform: translateY(-1px);
  }
  .seg-script-chirho { font-size: 0.65rem; color: var(--seg-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.15rem; }
  .conf-badge-chirho { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 0 0.3rem; margin-right: 0.3rem; border-radius: 3px; vertical-align: middle; }
  .conf-high-chirho { color: #16a34a; background: rgba(22, 163, 74, 0.15); }
  .conf-medium-chirho { color: #ca8a04; background: rgba(202, 138, 4, 0.15); }
  .conf-low-chirho { color: #dc2626; background: rgba(220, 38, 38, 0.15); }
  .conf-none-chirho { color: #6b7280; background: rgba(107, 114, 128, 0.15); }
  .seg-text-chirho { font-size: 1rem; color: #e0e0e0; font-family: "Georgia", "Noto Serif", "SBL Hebrew", "SBL Greek", serif; line-height: 1.4; }
  .empty-chirho { color: #666; padding: 2rem; text-align: center; }
  .recon-chirho { margin-top: 2rem; border: 1px solid #2a2a4a; border-radius: 6px; padding: 0.75rem 1rem; background: #12121f; }
  .recon-chirho summary { color: #c9a84c; cursor: pointer; font-size: 0.9rem; }
  .recon-chirho pre { white-space: pre-wrap; font-family: "Georgia", "Noto Serif", "SBL Hebrew", "SBL Greek", serif; font-size: 0.95rem; line-height: 1.6; color: #d0d0d0; margin-top: 0.75rem; }
  @media (max-width: 900px) { .content-chirho { grid-template-columns: 1fr; } }

  /* Modal */
  .modal-backdrop-chirho {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
  }
  .modal-chirho {
    background: #1a1a2e;
    border: 1px solid #c9a84c;
    border-radius: 8px;
    width: min(640px, 92vw);
    max-height: 90vh;
    overflow: auto;
    color: #e0e0e0;
  }
  .modal-header-chirho {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.75rem 1rem; border-bottom: 1px solid #2a2a4a;
  }
  .modal-header-chirho h3 { font-size: 1rem; color: #c9a84c; margin: 0; }
  .close-btn-chirho { background: none; border: none; color: #888; font-size: 1.5rem; cursor: pointer; line-height: 1; }
  .close-btn-chirho:hover { color: #c9a84c; }
  .modal-body-chirho { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .modal-body-chirho label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: #888; }
  .modal-meta-chirho { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
  .meta-pill-chirho { padding: 0.2rem 0.55rem; background: #12121f; border: 1px solid #2a2a4a; border-radius: 12px; color: #ccc; font-size: 0.75rem; }
  .modal-body-chirho textarea {
    background: #111; border: 1px solid #2a2a4a; border-radius: 4px;
    padding: 0.5rem; color: #e0e0e0; font-family: "Georgia", "Noto Serif", "SBL Hebrew", "SBL Greek", serif;
    font-size: 1.05rem; line-height: 1.6;
  }
  .modal-body-chirho textarea { min-height: 5rem; resize: vertical; }
  .modal-hint-chirho { font-size: 0.75rem; color: #666; margin: 0; }
  .modal-hint-chirho code { color: #c9a84c; background: #111; padding: 0.05rem 0.3rem; border-radius: 3px; }
  .modal-footer-chirho { display: flex; gap: 0.5rem; justify-content: flex-end; padding: 0.75rem 1rem; border-top: 1px solid #2a2a4a; background: #12121f; }
  .btn-save-chirho { padding: 0.4rem 1rem; background: #1b5e20; border: 1px solid #2e7d32; color: #a5d6a7; border-radius: 4px; cursor: pointer; }
  .btn-save-chirho:hover:not(:disabled) { background: #2e7d32; }
  .btn-cancel-chirho { padding: 0.4rem 1rem; background: #333; border: 1px solid #555; color: #999; border-radius: 4px; cursor: pointer; }
  .btn-cancel-chirho:hover:not(:disabled) { background: #444; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ===== Word-level overlay ===== */
  .toggle-words-chirho {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.8rem; color: #999;
    padding: 0.3rem 0.6rem; background: #12121f;
    border: 1px solid #2a2a4a; border-radius: 4px; cursor: pointer;
  }
  .toggle-words-chirho input { cursor: pointer; }

  .word-svg-chirho {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    pointer-events: none;
  }
  .word-box-chirho {
    fill: rgba(201, 168, 76, 0.10);
    stroke: rgba(201, 168, 76, 0.75);
    stroke-width: 1.5;
    pointer-events: auto;
    cursor: pointer;
    transition: fill 0.1s, stroke 0.1s;
  }
  .word-box-chirho:hover, .word-box-chirho.hovered-chirho {
    fill: rgba(201, 168, 76, 0.35);
    stroke: rgba(255, 226, 110, 1);
    stroke-width: 2.5;
  }
  /* When word overlay is on, pass pointer events through the segment buttons
     so the word boxes underneath get the hover (segments are still clickable
     when overlay is off). */
  .image-container-chirho.word-overlay-on-chirho .overlay-chirho {
    pointer-events: none;
  }
  .word-box-chirho.confirmed-chirho {
    stroke: rgba(34, 197, 94, 0.7);
    fill: rgba(34, 197, 94, 0.08);
  }
  .word-box-chirho.flagged-chirho {
    stroke: rgba(245, 158, 11, 0.85);
    fill: rgba(245, 158, 11, 0.12);
    stroke-dasharray: 4 2;
  }
  .word-dot-chirho {
    fill: #facc15;
    stroke: #78350f;
    stroke-width: 0.5;
    pointer-events: none;
  }

  .word-hover-popup-chirho {
    position: absolute;
    background: #0d0d18; color: #f5e7b8;
    border: 1px solid #c9a84c;
    border-radius: 4px;
    padding: 0.35rem 0.6rem;
    font-size: 0.85rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.6);
    z-index: 100;
    pointer-events: none;
    white-space: nowrap;
    max-width: 22rem;
  }
  .word-hover-text-chirho {
    font-family: "Georgia", "SBL Hebrew", "SBL Greek", serif;
    font-size: 1rem;
    overflow: hidden; text-overflow: ellipsis;
  }
  .word-hover-meta-chirho {
    color: #888; font-size: 0.7rem; margin-top: 0.15rem;
  }

  .line-flag-btn-chirho {
    position: absolute;
    right: -2rem;
    width: 1.6rem;
    background: transparent;
    border: 1px solid #2a2a4a;
    border-radius: 3px;
    color: #c9a84c;
    cursor: pointer;
    padding: 0;
    font-size: 0.8rem;
    line-height: 1;
    opacity: 0.4;
    transition: opacity 0.1s, background 0.1s;
  }
  .line-flag-btn-chirho:hover {
    opacity: 1;
    background: #2a2a4a;
  }
  .line-flag-btn-chirho.flagged-chirho {
    opacity: 1;
    background: rgba(245, 158, 11, 0.25);
    border-color: #f59e0b;
    color: #f59e0b;
  }

  /* ===== Word edit modal extras ===== */
  .word-modal-chirho .word-crop-preview-chirho {
    background: #fff;
    border: 1px solid #2a2a4a;
    border-radius: 4px;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }
  .word-crop-svg-chirho {
    width: 100%;
    height: 160px;
    max-width: 32rem;
    overflow: hidden;
    display: block;
  }
  .word-meta-chirho {
    display: flex; gap: 0.4rem; flex-wrap: wrap;
    margin-bottom: 0.6rem;
  }
  .word-meta-chirho code {
    background: #111; color: #c9a84c;
    padding: 0.05rem 0.3rem; border-radius: 3px;
    font-family: "Georgia", "SBL Hebrew", "SBL Greek", monospace;
  }
  .confirmed-pill-chirho {
    background: rgba(34, 197, 94, 0.2) !important;
    color: #4ade80 !important;
    border-color: #16a34a !important;
  }
  .flagged-pill-chirho {
    background: rgba(245, 158, 11, 0.2) !important;
    color: #fbbf24 !important;
    border-color: #f59e0b !important;
  }
  .word-edit-input-chirho {
    width: 100%; padding: 0.45rem 0.6rem;
    background: #0a0a14; border: 1px solid #2a2a4a; border-radius: 4px;
    color: #e0e0e0;
    font-family: "Georgia", "SBL Hebrew", "SBL Greek", serif;
    font-size: 1.1rem;
  }
  .btn-flag-chirho {
    padding: 0.4rem 0.8rem;
    background: #4a2c08; border: 1px solid #f59e0b;
    color: #fbbf24;
    border-radius: 4px; cursor: pointer;
    margin-right: auto;
  }
  .btn-flag-chirho:hover:not(:disabled) {
    background: #5e3a0a;
  }
</style>
