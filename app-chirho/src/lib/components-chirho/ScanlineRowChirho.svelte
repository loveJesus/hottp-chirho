<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<!--
  ScanlineRowChirho: Renders a single scanline (text line) with:
  - Line image strip with segment overlays
  - List of segments (French auto-accepted, non-French with edit/accept)
  - Accept Line button to accept all segments at once
-->

<script lang="ts">
  import SegmentOverlayChirho from "./SegmentOverlayChirho.svelte";
  import SegmentEditorChirho from "./SegmentEditorChirho.svelte";
  import { invalidateAll } from "$app/navigation";

  interface ScanlineRowPropsChirho {
    scanlineChirho: {
      idChirho: number;
      lineIndexChirho: number;
      pdftotextChirho: string | null;
      imageR2KeyChirho: string | null;
      wordsJsonChirho: string | null;
      statusChirho: string;
      xMinChirho: number | null;
      widthChirho: number | null;
    };
    segmentsChirho: Array<{
      idChirho: number;
      segmentIndexChirho: number;
      pdftotextChirho: string | null;
      ocrTextChirho: string | null;
      acceptedTextChirho: string | null;
      scriptTypeChirho: string | null;
      imageR2KeyChirho: string | null;
      statusChirho: string;
      xMinPxChirho: number | null;
      widthPxChirho: number | null;
      wordStartIndexChirho: number | null;
      wordEndIndexChirho: number | null;
    }>;
  }

  /** A segment is French when its scriptTypeChirho is the french-chirho marker. */
  function isFrenchSegmentChirho(
    segChirho: { scriptTypeChirho: string | null }
  ): boolean {
    return segChirho.scriptTypeChirho === "french-chirho";
  }

  let { scanlineChirho, segmentsChirho }: ScanlineRowPropsChirho = $props();

  let expandedChirho = $state(false);
  let acceptingLineChirho = $state(false);

  const hasNonFrenchChirho = $derived(
    segmentsChirho.some((sChirho) => !isFrenchSegmentChirho(sChirho))
  );

  const allAcceptedChirho = $derived(
    segmentsChirho.length > 0 &&
    segmentsChirho.every(
      (sChirho) =>
        isFrenchSegmentChirho(sChirho) ||
        sChirho.statusChirho === "accepted-chirho"
    )
  );

  // Scanline width is stored directly (was previously derived as xMax - xMin).
  const lineWidthPxChirho = $derived(
    Math.round(scanlineChirho.widthChirho ?? 0)
  );

  // Reconstructed text for this line — assembler stores best-text in
  // accepted_text_chirho for both French (tesseract OCR) and non-French
  // (agent transcription); fall through to ocr/pdftotext only if accepted
  // is missing.
  const reconstructedTextChirho = $derived(() => {
    if (segmentsChirho.length === 0) return scanlineChirho.pdftotextChirho ?? "";
    return segmentsChirho
      .map((segChirho) => {
        return (
          segChirho.acceptedTextChirho ??
          segChirho.ocrTextChirho ??
          segChirho.pdftotextChirho ??
          ""
        );
      })
      .join(" ");
  });

  function imageUrlChirho(keyChirho: string | null): string {
    if (!keyChirho) return "";
    return `/api-chirho/images-chirho?key-chirho=${encodeURIComponent(keyChirho)}`;
  }

  function onSegmentAcceptChirho(_segmentIdChirho: number, _textChirho: string) {
    invalidateAll();
  }

  async function acceptAllSegmentsChirho() {
    acceptingLineChirho = true;
    try {
      for (const segChirho of segmentsChirho) {
        if (!isFrenchSegmentChirho(segChirho) && segChirho.statusChirho !== "accepted-chirho") {
          const bestTextChirho =
            segChirho.acceptedTextChirho ??
            segChirho.ocrTextChirho ??
            segChirho.pdftotextChirho ??
            "";

          await fetch("/api-chirho/segments-chirho", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              segmentIdChirho: segChirho.idChirho,
              acceptedTextChirho: bestTextChirho,
              statusChirho: "accepted-chirho",
            }),
          });
        }
      }

      // Update scanline status
      await fetch("/api-chirho/scanlines-chirho", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanlineIdChirho: scanlineChirho.idChirho,
          reconstructedTextChirho: reconstructedTextChirho(),
          statusChirho: "accepted-chirho",
        }),
      });

      await invalidateAll();
    } finally {
      acceptingLineChirho = false;
    }
  }
</script>

<div class="scanline-row-chirho" class:has-nonfrench-chirho={hasNonFrenchChirho} class:all-accepted-chirho={allAcceptedChirho}>
  <!-- Line header -->
  <div class="line-header-chirho">
    <button
      class="expand-btn-chirho"
      onclick={() => expandedChirho = !expandedChirho}
    >
      {expandedChirho ? "▾" : "▸"}
    </button>
    <span class="line-label-chirho">Line {scanlineChirho.lineIndexChirho}</span>

    {#if hasNonFrenchChirho}
      <span class="nonfrench-count-chirho">
        {segmentsChirho.filter((sChirho) => !isFrenchSegmentChirho(sChirho)).length} non-French
      </span>
    {/if}

    {#if allAcceptedChirho}
      <span class="line-accepted-chirho">All accepted</span>
    {/if}
  </div>

  <!-- Line image with overlays -->
  {#if scanlineChirho.imageR2KeyChirho}
    <div class="line-image-wrapper-chirho">
      <img
        src={imageUrlChirho(scanlineChirho.imageR2KeyChirho)}
        alt="Line {scanlineChirho.lineIndexChirho}"
        class="line-image-chirho"
      />
      <SegmentOverlayChirho
        segmentsChirho={segmentsChirho}
        lineWidthPxChirho={lineWidthPxChirho}
      />
    </div>
  {/if}

  <!-- Reconstructed text preview -->
  <div class="line-text-chirho" dir="auto">
    {reconstructedTextChirho()}
  </div>

  <!-- Expanded segments -->
  {#if expandedChirho}
    <div class="segments-list-chirho">
      {#each segmentsChirho as segChirho (segChirho.idChirho)}
        <SegmentEditorChirho
          segmentChirho={segChirho}
          onacceptChirho={onSegmentAcceptChirho}
        />
      {/each}

      {#if hasNonFrenchChirho && !allAcceptedChirho}
        <div class="line-actions-chirho">
          <button
            class="btn-accept-line-chirho"
            onclick={acceptAllSegmentsChirho}
            disabled={acceptingLineChirho}
          >
            {acceptingLineChirho ? "Accepting..." : "Accept Line"}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .scanline-row-chirho {
    border: 1px solid #2a2a4a;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    background: #12121f;
    overflow: hidden;
  }

  .scanline-row-chirho.has-nonfrench-chirho {
    border-color: #3a3a5a;
  }

  .scanline-row-chirho.all-accepted-chirho {
    border-color: #2e7d32;
    background: #111a11;
  }

  .line-header-chirho {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: #1a1a2e;
    cursor: pointer;
  }

  .expand-btn-chirho {
    background: none;
    border: none;
    color: #888;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0 0.2rem;
  }

  .line-label-chirho {
    font-size: 0.78rem;
    font-weight: 600;
    color: #888;
  }

  .nonfrench-count-chirho {
    font-size: 0.68rem;
    color: #ffb74d;
    padding: 0.05rem 0.3rem;
    border-radius: 8px;
    background: rgba(255, 183, 77, 0.1);
  }

  .line-accepted-chirho {
    font-size: 0.65rem;
    color: #66bb6a;
    margin-left: auto;
  }

  .line-image-wrapper-chirho {
    position: relative;
    background: #fff;
    border-bottom: 1px solid #2a2a4a;
  }

  .line-image-chirho {
    width: 100%;
    display: block;
  }

  .line-text-chirho {
    padding: 0.35rem 0.6rem;
    font-size: 0.82rem;
    color: #ccc;
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: "Georgia", "Noto Serif", "SBL Hebrew", "SBL Greek", serif;
  }

  .segments-list-chirho {
    padding: 0.4rem 0.6rem;
    border-top: 1px solid #2a2a4a;
  }

  .line-actions-chirho {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.4rem;
  }

  .btn-accept-line-chirho {
    padding: 0.3rem 0.8rem;
    background: #1b5e20;
    border: 1px solid #2e7d32;
    border-radius: 4px;
    color: #a5d6a7;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-accept-line-chirho:hover { background: #2e7d32; }

  .btn-accept-line-chirho:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
