<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<!--
  SegmentOverlayChirho: Colored translucent rectangles overlaid on a line image
  to indicate French vs non-French word segments. Non-French segments are highlighted.
-->

<script lang="ts">
  interface SegmentOverlayPropsChirho {
    segmentsChirho: Array<{
      segmentIndexChirho: number;
      xMinPxChirho: number | null;
      widthPxChirho: number | null;
      scriptTypeChirho: string | null;
    }>;
    /** Pixel width of the displayed line image — span pcts are computed against this */
    lineWidthPxChirho: number;
  }

  /** A segment is French when its scriptTypeChirho is the french-chirho marker. */
  function isFrenchSegmentChirho(
    segChirho: { scriptTypeChirho: string | null }
  ): boolean {
    return segChirho.scriptTypeChirho === "french-chirho";
  }

  let {
    segmentsChirho,
    lineWidthPxChirho,
  }: SegmentOverlayPropsChirho = $props();

  const SCRIPT_COLORS_CHIRHO: Record<string, string> = {
    "hebrew-chirho": "rgba(79, 195, 247, 0.25)",
    "greek-chirho": "rgba(129, 199, 132, 0.25)",
    "syriac-chirho": "rgba(255, 183, 77, 0.25)",
    "arabic-chirho": "rgba(240, 98, 146, 0.25)",
    "mixed-chirho": "rgba(206, 147, 216, 0.25)",
    "unknown-chirho": "rgba(153, 153, 153, 0.25)",
  };

  function overlayColorChirho(scriptTypeChirho: string | null): string {
    return SCRIPT_COLORS_CHIRHO[scriptTypeChirho ?? "unknown-chirho"] ?? SCRIPT_COLORS_CHIRHO["unknown-chirho"];
  }

  function segmentStyleChirho(segChirho: SegmentOverlayPropsChirho["segmentsChirho"][0]): string {
    if (isFrenchSegmentChirho(segChirho) || segChirho.xMinPxChirho == null || segChirho.widthPxChirho == null) {
      return "display: none;";
    }

    // Span coords are line-local (relative to the line crop), so no page-offset subtraction.
    const leftPctChirho = (segChirho.xMinPxChirho / lineWidthPxChirho) * 100;
    const widthPctChirho = (segChirho.widthPxChirho / lineWidthPxChirho) * 100;

    return `left: ${Math.max(0, leftPctChirho)}%; width: ${Math.min(widthPctChirho, 100 - leftPctChirho)}%; background: ${overlayColorChirho(segChirho.scriptTypeChirho)};`;
  }
</script>

<div class="overlay-container-chirho">
  {#each segmentsChirho as segChirho (segChirho.segmentIndexChirho)}
    {#if !isFrenchSegmentChirho(segChirho)}
      <div
        class="segment-overlay-chirho"
        style={segmentStyleChirho(segChirho)}
        title="Seg {segChirho.segmentIndexChirho} [{segChirho.scriptTypeChirho?.replace('-chirho', '') ?? 'unknown'}]"
      ></div>
    {/if}
  {/each}
</div>

<style>
  .overlay-container-chirho {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .segment-overlay-chirho {
    position: absolute;
    top: 0;
    bottom: 0;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    transition: background 0.2s;
  }
</style>
