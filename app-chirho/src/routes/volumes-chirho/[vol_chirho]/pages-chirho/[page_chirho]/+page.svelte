<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { browser } from "$app/environment";

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
    queueMicrotask(() => {
      segmentTextareaElChirho?.focus();
      segmentTextareaElChirho?.select();
    });
  }
  function closeEditChirho(): void {
    editingSegmentChirho = null;
    editTextChirho = "";
    editScriptChirho = "";
  }
  function onSegmentKeyChirho(eChirho: KeyboardEvent): void {
    // Cmd/Ctrl+Enter saves (multi-line text — bare Enter must stay as newline).
    if (eChirho.key === "Enter" && (eChirho.metaKey || eChirho.ctrlKey)) {
      eChirho.preventDefault();
      if (!savingChirho) saveEditChirho();
    } else if (eChirho.key === "Escape") {
      eChirho.preventDefault();
      closeEditChirho();
    }
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

  // Flag state per scanline. Latest event of either type wins — events arrive
  // in seq order so we can fold left.
  const linesNeedingAIChirho = $derived.by((): Set<number> => {
    const sChirho = new Set<number>();
    for (const evChirho of (data as any).eventTailChirho ?? []) {
      if (evChirho.scanlineIdChirho == null) continue;
      if (evChirho.eventTypeChirho === "scanline-needs-ai-review-chirho") {
        sChirho.add(evChirho.scanlineIdChirho);
      } else if (evChirho.eventTypeChirho === "scanline-needs-ai-review-resolved-chirho") {
        sChirho.delete(evChirho.scanlineIdChirho);
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

  // Image-size preference (localStorage memoized). Lines panel is center stage;
  // the page image is a smaller right-side aside with an enlarge toggle.
  let pageImageSizeChirho = $state<"small-chirho" | "medium-chirho" | "large-chirho">("small-chirho");
  const PAGE_IMAGE_SIZE_KEY_CHIRHO = "hottp-page-image-size-chirho";
  if (browser) {
    const storedChirho = localStorage.getItem(PAGE_IMAGE_SIZE_KEY_CHIRHO);
    if (storedChirho === "small-chirho" || storedChirho === "medium-chirho" || storedChirho === "large-chirho") {
      pageImageSizeChirho = storedChirho;
    }
  }
  function cyclePageImageSizeChirho(): void {
    pageImageSizeChirho = pageImageSizeChirho === "small-chirho"
      ? "medium-chirho"
      : pageImageSizeChirho === "medium-chirho" ? "large-chirho" : "small-chirho";
    if (browser) localStorage.setItem(PAGE_IMAGE_SIZE_KEY_CHIRHO, pageImageSizeChirho);
  }
  let hoveredWordChirho = $state<MergedWordChirho | null>(null);

  // Word edit modal
  let editingWordChirho = $state<MergedWordChirho | null>(null);
  let wordEditTextChirho = $state("");
  let wordEditScriptChirho = $state("");
  let wordSavingChirho = $state(false);
  // Focus capture for keyboard-driven triage (autofocus on open, Enter saves, Esc closes).
  let wordInputElChirho = $state<HTMLInputElement | null>(null);
  let segmentTextareaElChirho = $state<HTMLTextAreaElement | null>(null);
  // Surfaces save failures (network or D1 errors) — silent failure was masking lost edits.
  let saveErrorChirho = $state<string | null>(null);

  function openWordEditChirho(wChirho: MergedWordChirho): void {
    editingWordChirho = wChirho;
    wordEditTextChirho = wChirho.displayTextChirho;
    wordEditScriptChirho = wChirho.displayScriptChirho;
    hoveredWordChirho = null;
    queueMicrotask(() => {
      wordInputElChirho?.focus();
      wordInputElChirho?.select();
    });
  }
  function onWordKeyChirho(eChirho: KeyboardEvent): void {
    if (eChirho.key === "Enter") {
      eChirho.preventDefault();
      if (wordSavingChirho) return;
      if (eChirho.shiftKey) saveAndNextWordChirho();
      else saveWordChirho();
    } else if (eChirho.key === "Escape") {
      eChirho.preventDefault();
      closeWordEditChirho();
    }
  }
  function closeWordEditChirho(): void {
    editingWordChirho = null;
    wordEditTextChirho = "";
    wordEditScriptChirho = "";
  }

  async function postEventChirho(payloadChirho: Record<string, unknown>): Promise<boolean> {
    try {
      const resChirho = await fetch("/api-chirho/events-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadChirho),
      });
      if (!resChirho.ok) {
        const txtChirho = (await resChirho.text()).slice(0, 200);
        saveErrorChirho = `Save failed (HTTP ${resChirho.status}): ${txtChirho}`;
        return false;
      }
      await invalidateAll();
      return true;
    } catch (errChirho) {
      const msgChirho = errChirho instanceof Error ? errChirho.message : String(errChirho);
      saveErrorChirho = `Network error: ${msgChirho}`;
      return false;
    }
  }

  async function saveWordChirho(): Promise<boolean> {
    if (!editingWordChirho) return false;
    wordSavingChirho = true;
    let okChirho = true;
    try {
      const newTextChirho = wordEditTextChirho.trim();
      const wordChirho = editingWordChirho;
      const pageIdChirho = (data as any).pageDataChirho.idChirho;
      // Only emit a text-corrected event if the text actually changed.
      if (newTextChirho !== (wordChirho.displayTextChirho ?? "").trim()) {
        okChirho = (await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wordChirho.scanlineIdChirho,
          wordIdChirho: wordChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-text-corrected-chirho",
          payloadChirho: { oldTextChirho: wordChirho.displayTextChirho, newTextChirho },
        })) && okChirho;
      } else if (!wordChirho.displayConfirmedChirho) {
        // No text change but user is saying "OCR was correct" — emit verified.
        okChirho = (await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wordChirho.scanlineIdChirho,
          wordIdChirho: wordChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-verified-chirho",
          payloadChirho: { textChirho: wordChirho.displayTextChirho },
        })) && okChirho;
      }
      if (wordEditScriptChirho !== wordChirho.displayScriptChirho) {
        okChirho = (await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wordChirho.scanlineIdChirho,
          wordIdChirho: wordChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-script-set-chirho",
          payloadChirho: { oldScriptChirho: wordChirho.displayScriptChirho, newScriptChirho: wordEditScriptChirho },
        })) && okChirho;
      }
      // Only close on full success — keep the user in the modal if anything failed
      // so they can retry without losing their typed text.
      if (okChirho) closeWordEditChirho();
    } finally {
      wordSavingChirho = false;
    }
    return okChirho;
  }

  // Triage advance: save current, then open the next word that still needs human
  // attention (script mismatch OR pending non-Latin flag). Confirmed and already-
  // OK words are skipped. Forward-only — at end of page, modal just closes.
  function findNextProblemWordChirho(fromWordIdChirho: number): MergedWordChirho | null {
    const allChirho = mergedWordsChirho;
    const idxChirho = allChirho.findIndex((wChirho) => wChirho.wordIdChirho === fromWordIdChirho);
    if (idxChirho === -1) return null;
    for (let iChirho = idxChirho + 1; iChirho < allChirho.length; iChirho++) {
      const wChirho = allChirho[iChirho];
      if (hasScriptMismatchChirho(wChirho) || wChirho.displayPendingScriptFlagChirho) return wChirho;
    }
    return null;
  }
  async function saveAndNextWordChirho(): Promise<void> {
    if (!editingWordChirho) return;
    const currentIdChirho = editingWordChirho.wordIdChirho;
    const okChirho = await saveWordChirho();
    if (!okChirho) return; // toast already surfaced; keep current modal open
    const nextChirho = findNextProblemWordChirho(currentIdChirho);
    if (nextChirho) openWordEditChirho(nextChirho);
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

  async function toggleLineNeedsAIChirho(scanlineIdChirho: number, lineIndexChirho: number): Promise<void> {
    const currentlyFlaggedChirho = linesNeedingAIChirho.has(scanlineIdChirho);
    await postEventChirho({
      pageIdChirho: (data as any).pageDataChirho.idChirho,
      scanlineIdChirho,
      aggregateTypeChirho: "scanline-chirho",
      eventTypeChirho: currentlyFlaggedChirho
        ? "scanline-needs-ai-review-resolved-chirho"
        : "scanline-needs-ai-review-chirho",
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

  function lineCropViewBoxChirho(slChirho: { xMinChirho: number; yMinChirho: number; widthChirho: number; heightChirho: number; }, padPxChirho = 4): string {
    const xChirho = Math.max(0, slChirho.xMinChirho - padPxChirho);
    const yChirho = Math.max(0, slChirho.yMinChirho - padPxChirho);
    const wPxChirho = slChirho.widthChirho + padPxChirho * 2;
    const hPxChirho = slChirho.heightChirho + padPxChirho * 2;
    return `${xChirho} ${yChirho} ${wPxChirho} ${hPxChirho}`;
  }

  // ============================================================
  // Codepoint script inference (cross-check against declared script)
  // ============================================================
  function detectScriptFromCodepointsChirho(textChirho: string | null | undefined): string {
    if (!textChirho) return "unknown-chirho";
    let hebChirho = 0, grkChirho = 0, syrChirho = 0, arbChirho = 0, latChirho = 0, otherChirho = 0;
    for (const chChirho of textChirho) {
      const cChirho = chChirho.codePointAt(0)!;
      if (cChirho >= 0x0590 && cChirho <= 0x05FF) hebChirho++;
      else if ((cChirho >= 0x0370 && cChirho <= 0x03FF) || (cChirho >= 0x1F00 && cChirho <= 0x1FFF)) grkChirho++;
      else if (cChirho >= 0x0700 && cChirho <= 0x074F) syrChirho++;
      else if (cChirho >= 0x0600 && cChirho <= 0x06FF) arbChirho++;
      else if ((cChirho >= 0x0041 && cChirho <= 0x024F) || (cChirho >= 0x1E00 && cChirho <= 0x1EFF)) latChirho++;
      else otherChirho++;
    }
    const totalChirho = hebChirho + grkChirho + syrChirho + arbChirho + latChirho;
    if (totalChirho === 0) return "unknown-chirho";
    if (hebChirho >= Math.max(grkChirho, syrChirho, arbChirho, latChirho)) return "hebrew-chirho";
    if (grkChirho >= Math.max(syrChirho, arbChirho, latChirho)) return "greek-chirho";
    if (syrChirho >= Math.max(arbChirho, latChirho)) return "syriac-chirho";
    if (arbChirho >= latChirho) return "arabic-chirho";
    return "latin-chirho";
  }

  function hasScriptMismatchChirho(wChirho: MergedWordChirho): boolean {
    if (!wChirho.displayTextChirho) return false;
    const detectedChirho = detectScriptFromCodepointsChirho(wChirho.displayTextChirho);
    if (detectedChirho === "unknown-chirho") return false;
    // latin-chirho and latin-non-french-chirho both look "latin" to codepoints
    const declaredChirho = wChirho.displayScriptChirho;
    if (detectedChirho === "latin-chirho" && (declaredChirho === "latin-chirho" || declaredChirho === "latin-non-french-chirho" || declaredChirho === "symbol-chirho")) return false;
    return detectedChirho !== declaredChirho;
  }

  // ============================================================
  // Paintbrush mode: sticky language palette + drag rect on image
  // ============================================================
  let activePaintScriptChirho = $state<string | null>(null);
  const PAINT_PALETTE_CHIRHO: { scriptChirho: string; labelChirho: string }[] = [
    { scriptChirho: "hebrew-chirho", labelChirho: "Hebrew" },
    { scriptChirho: "greek-chirho", labelChirho: "Greek" },
    { scriptChirho: "latin-non-french-chirho", labelChirho: "Latin (non-French)" },
    { scriptChirho: "latin-chirho", labelChirho: "Latin/French" },
    { scriptChirho: "syriac-chirho", labelChirho: "Syriac" },
    { scriptChirho: "arabic-chirho", labelChirho: "Arabic" },
    { scriptChirho: "symbol-chirho", labelChirho: "Symbol" },
    { scriptChirho: "unknown-chirho", labelChirho: "Unknown" },
  ];

  // Drag rect (image pixel coords, not percentage)
  let paintRectChirho = $state<{ xMinChirho: number; yMinChirho: number; xMaxChirho: number; yMaxChirho: number; } | null>(null);
  let paintDraggingChirho = $state(false);
  let paintStartChirho: { xChirho: number; yChirho: number; } | null = null;

  function imageEventToImageCoordsChirho(eChirho: MouseEvent): { xChirho: number; yChirho: number; } | null {
    const containerChirho = (eChirho.currentTarget as HTMLElement).closest(".image-container-chirho") as HTMLElement | null;
    if (!containerChirho || imgNaturalWidthChirho === 0 || imgNaturalHeightChirho === 0) return null;
    const rectChirho = containerChirho.getBoundingClientRect();
    const fxChirho = (eChirho.clientX - rectChirho.left) / rectChirho.width;
    const fyChirho = (eChirho.clientY - rectChirho.top) / rectChirho.height;
    return {
      xChirho: fxChirho * imgNaturalWidthChirho,
      yChirho: fyChirho * imgNaturalHeightChirho,
    };
  }

  function onImageMouseDownChirho(eChirho: MouseEvent): void {
    if (!activePaintScriptChirho || eChirho.button !== 0) return;
    const ptChirho = imageEventToImageCoordsChirho(eChirho);
    if (!ptChirho) return;
    eChirho.preventDefault();
    paintDraggingChirho = true;
    paintStartChirho = ptChirho;
    paintRectChirho = { xMinChirho: ptChirho.xChirho, yMinChirho: ptChirho.yChirho, xMaxChirho: ptChirho.xChirho, yMaxChirho: ptChirho.yChirho };
  }
  function onImageMouseMoveChirho(eChirho: MouseEvent): void {
    if (!paintDraggingChirho || !paintStartChirho) return;
    const ptChirho = imageEventToImageCoordsChirho(eChirho);
    if (!ptChirho) return;
    paintRectChirho = {
      xMinChirho: Math.min(paintStartChirho.xChirho, ptChirho.xChirho),
      yMinChirho: Math.min(paintStartChirho.yChirho, ptChirho.yChirho),
      xMaxChirho: Math.max(paintStartChirho.xChirho, ptChirho.xChirho),
      yMaxChirho: Math.max(paintStartChirho.yChirho, ptChirho.yChirho),
    };
  }
  async function onImageMouseUpChirho(_eChirho: MouseEvent): Promise<void> {
    if (!paintDraggingChirho) return;
    paintDraggingChirho = false;
    const rectChirho = paintRectChirho;
    const scriptChirho = activePaintScriptChirho;
    paintRectChirho = null;
    paintStartChirho = null;
    if (!rectChirho || !scriptChirho) return;
    if (rectChirho.xMaxChirho - rectChirho.xMinChirho < 4 && rectChirho.yMaxChirho - rectChirho.yMinChirho < 4) return;
    // find every word whose bbox intersects the rect, emit script-set events
    const hitsChirho: MergedWordChirho[] = [];
    for (const wChirho of mergedWordsChirho) {
      if (wChirho.xMaxChirho < rectChirho.xMinChirho) continue;
      if (wChirho.xMinChirho > rectChirho.xMaxChirho) continue;
      if (wChirho.yMaxChirho < rectChirho.yMinChirho) continue;
      if (wChirho.yMinChirho > rectChirho.yMaxChirho) continue;
      hitsChirho.push(wChirho);
    }
    if (hitsChirho.length === 0) return;
    const pageIdChirho = (data as any).pageDataChirho.idChirho;
    // Fire sequentially so events are written in seq order; small N so it's fine.
    for (const wChirho of hitsChirho) {
      if (wChirho.displayScriptChirho === scriptChirho) continue;
      await fetch("/api-chirho/events-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageIdChirho,
          scanlineIdChirho: wChirho.scanlineIdChirho,
          wordIdChirho: wChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-script-set-chirho",
          payloadChirho: { oldScriptChirho: wChirho.displayScriptChirho, newScriptChirho: scriptChirho, viaChirho: "paintbrush-chirho" },
        }),
      });
    }
    await invalidateAll();
  }

  // ============================================================
  // Line render tokens: merge words + segments into one stream
  // ============================================================
  interface LineRenderTokenChirho {
    kindChirho: "word-chirho" | "segment-chirho";
    textChirho: string;
    scriptChirho: string;
    confirmedChirho: boolean;
    flaggedChirho: boolean;
    wordChirho?: MergedWordChirho;
    segmentChirho?: any;
    confidenceChirho?: string | null;
    referenceChirho?: string | null;
  }

  function buildLineTokensChirho(slChirho: any, lineWordsChirho: MergedWordChirho[]): LineRenderTokenChirho[] {
    const segmentsChirho = (slChirho.segmentsChirho ?? []) as any[];
    if (segmentsChirho.length === 0) {
      return lineWordsChirho.map((wChirho) => ({
        kindChirho: "word-chirho",
        textChirho: wChirho.displayTextChirho,
        scriptChirho: wChirho.displayScriptChirho,
        confirmedChirho: wChirho.displayConfirmedChirho,
        flaggedChirho: wChirho.displayPendingScriptFlagChirho,
        wordChirho: wChirho,
      }));
    }
    const slXChirho = (slChirho.xMinChirho ?? 0) as number;
    const segBboxChirho = segmentsChirho.map((sChirho) => ({
      segChirho: sChirho,
      absLeftChirho: slXChirho + ((sChirho.xMinChirho ?? 0) as number),
      absRightChirho: slXChirho + ((sChirho.xMinChirho ?? 0) as number) + ((sChirho.widthChirho ?? 0) as number),
    }));
    const emittedChirho = new Set<number>();
    const outChirho: LineRenderTokenChirho[] = [];
    for (const wChirho of lineWordsChirho) {
      const midXChirho = (wChirho.xMinChirho + wChirho.xMaxChirho) / 2;
      const matchChirho = segBboxChirho.find((bbChirho) => midXChirho >= bbChirho.absLeftChirho && midXChirho <= bbChirho.absRightChirho);
      if (matchChirho) {
        const segIdChirho = matchChirho.segChirho.segmentIdChirho as number;
        if (!emittedChirho.has(segIdChirho)) {
          emittedChirho.add(segIdChirho);
          outChirho.push({
            kindChirho: "segment-chirho",
            textChirho: (matchChirho.segChirho.acceptedTextChirho as string | null) ?? (matchChirho.segChirho.ocrTextChirho as string | null) ?? "",
            scriptChirho: (matchChirho.segChirho.scriptTypeChirho as string | null) ?? "unknown-chirho",
            confirmedChirho: false,
            flaggedChirho: false,
            segmentChirho: matchChirho.segChirho,
            confidenceChirho: matchChirho.segChirho.canonicalChirho?.confidenceChirho ?? null,
            referenceChirho: matchChirho.segChirho.canonicalChirho?.referenceChirho ?? null,
          });
        }
      } else {
        outChirho.push({
          kindChirho: "word-chirho",
          textChirho: wChirho.displayTextChirho,
          scriptChirho: wChirho.displayScriptChirho,
          confirmedChirho: wChirho.displayConfirmedChirho,
          flaggedChirho: wChirho.displayPendingScriptFlagChirho,
          wordChirho: wChirho,
        });
      }
    }
    return outChirho;
  }

  async function wordContextMenuChirho(eChirho: MouseEvent, wChirho: MergedWordChirho): Promise<void> {
    eChirho.preventDefault();
    if (activePaintScriptChirho) {
      // Paintbrush armed → quick-assign that language to this word
      if (wChirho.displayScriptChirho === activePaintScriptChirho) return;
      await postEventChirho({
        pageIdChirho: (data as any).pageDataChirho.idChirho,
        scanlineIdChirho: wChirho.scanlineIdChirho,
        wordIdChirho: wChirho.wordIdChirho,
        aggregateTypeChirho: "word-chirho",
        eventTypeChirho: "word-script-set-chirho",
        payloadChirho: { oldScriptChirho: wChirho.displayScriptChirho, newScriptChirho: activePaintScriptChirho, viaChirho: "right-click-chirho" },
      });
    } else if (hasScriptMismatchChirho(wChirho)) {
      // Codepoints disagree with declared script — one-click adopt the codepoint
      // verdict. Common case: a Hebrew word currently tagged latin-chirho.
      const detectedChirho = detectScriptFromCodepointsChirho(wChirho.displayTextChirho);
      if (detectedChirho === wChirho.displayScriptChirho) return;
      await postEventChirho({
        pageIdChirho: (data as any).pageDataChirho.idChirho,
        scanlineIdChirho: wChirho.scanlineIdChirho,
        wordIdChirho: wChirho.wordIdChirho,
        aggregateTypeChirho: "word-chirho",
        eventTypeChirho: "word-script-set-chirho",
        payloadChirho: { oldScriptChirho: wChirho.displayScriptChirho, newScriptChirho: detectedChirho, viaChirho: "codepoint-quick-fix-chirho" },
      });
    } else {
      // No active paint, no mismatch → legacy "needs vision" flag
      await markWordNonLatinChirho(wChirho);
    }
  }
</script>

<div class="paintbrush-bar-chirho">
  <span class="paintbrush-label-chirho">🖌 Paint language:</span>
  {#each PAINT_PALETTE_CHIRHO as palItemChirho}
    {@const colChirho = SCRIPT_COLORS_CHIRHO[palItemChirho.scriptChirho] ?? "#888"}
    <button
      type="button"
      class="paint-chip-chirho"
      class:active-chirho={activePaintScriptChirho === palItemChirho.scriptChirho}
      style="--chip-color: {colChirho}"
      onclick={() => (activePaintScriptChirho = activePaintScriptChirho === palItemChirho.scriptChirho ? null : palItemChirho.scriptChirho)}
      title="Toggle {palItemChirho.labelChirho} brush — drag on image to paint, right-click word for quick assign"
    >
      <span class="paint-swatch-chirho" style="--chip-color: {colChirho}"></span>
      {palItemChirho.labelChirho}
    </button>
  {/each}
  {#if activePaintScriptChirho}
    <span class="paint-hint-chirho">drag image · right-click word to assign · click chip to disarm</span>
  {:else}
    <span class="paint-hint-chirho paint-hint-dim-chirho">click a chip to arm; right-click word will flag-as-non-Latin when disarmed</span>
  {/if}
</div>

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

  <div class="content-chirho" class:img-small-chirho={pageImageSizeChirho === 'small-chirho'} class:img-medium-chirho={pageImageSizeChirho === 'medium-chirho'} class:img-large-chirho={pageImageSizeChirho === 'large-chirho'}>
    <aside class="page-image-panel-chirho">
      <div class="image-aside-header-chirho">
        <h2>Page</h2>
        <button
          type="button"
          class="image-size-btn-chirho"
          onclick={cyclePageImageSizeChirho}
          title="Cycle size (saved locally): small → medium → large"
        >
          {pageImageSizeChirho === 'small-chirho' ? '↗ Enlarge' : pageImageSizeChirho === 'medium-chirho' ? '↗ Larger' : '↙ Shrink'}
        </button>
      </div>
      <div
        class="image-container-chirho"
        class:word-overlay-on-chirho={showWordOverlayChirho}
        class:paint-armed-chirho={activePaintScriptChirho != null}
        onmousedown={onImageMouseDownChirho}
        onmousemove={onImageMouseMoveChirho}
        onmouseup={onImageMouseUpChirho}
        onmouseleave={onImageMouseUpChirho}
        role="presentation"
      >
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
            {@const isFlaggedChirho = linesNeedingAIChirho.has(slChirho.scanlineIdChirho)}
            <button
              type="button"
              class="line-flag-btn-chirho"
              class:flagged-chirho={isFlaggedChirho}
              style="top: {yTopChirho}%; height: {slHeightChirho}%"
              onclick={() => toggleLineNeedsAIChirho(slChirho.scanlineIdChirho, slChirho.lineIndexChirho)}
              title={isFlaggedChirho ? `Line ${slChirho.lineIndexChirho}: click to unflag` : `Line ${slChirho.lineIndexChirho}: flag as needs AI review`}
              aria-label={isFlaggedChirho ? `Unflag line ${slChirho.lineIndexChirho}` : `Flag line ${slChirho.lineIndexChirho} for AI review`}
            >{isFlaggedChirho ? "✅" : "🚩"}</button>
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
                  style="--word-color: {SCRIPT_COLORS_CHIRHO[wChirho.displayScriptChirho] ?? '#c9a84c'}"
                  x={wChirho.xMinChirho}
                  y={wChirho.yMinChirho}
                  width={wChirho.xMaxChirho - wChirho.xMinChirho}
                  height={wChirho.yMaxChirho - wChirho.yMinChirho}
                  onmouseenter={() => (hoveredWordChirho = wChirho)}
                  onmouseleave={() => { if (hoveredWordChirho?.wordIdChirho === wChirho.wordIdChirho) hoveredWordChirho = null; }}
                  onclick={(eChirho) => { if (paintDraggingChirho) { eChirho.preventDefault(); return; } openWordEditChirho(wChirho); }}
                  oncontextmenu={(eChirho) => wordContextMenuChirho(eChirho, wChirho)}
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
                {scriptLabelChirho(hoveredWordChirho.displayScriptChirho)} ·
                {hoveredWordChirho.displaySourceChirho.replace("-chirho", "")}
                {#if hoveredWordChirho.displayConfirmedChirho}· ✓ confirmed{/if}
                {#if hoveredWordChirho.displayPendingScriptFlagChirho}· ⚠ script flag{/if}
                {#if hasScriptMismatchChirho(hoveredWordChirho)}· ⚠ codepoint mismatch{/if}
              </div>
            </div>
          {/if}
        {/if}

        {#if paintRectChirho && imgNaturalWidthChirho > 0}
          {@const pctLeftChirho = (paintRectChirho.xMinChirho / imgNaturalWidthChirho) * 100}
          {@const pctTopChirho = (paintRectChirho.yMinChirho / imgNaturalHeightChirho) * 100}
          {@const pctWChirho = ((paintRectChirho.xMaxChirho - paintRectChirho.xMinChirho) / imgNaturalWidthChirho) * 100}
          {@const pctHChirho = ((paintRectChirho.yMaxChirho - paintRectChirho.yMinChirho) / imgNaturalHeightChirho) * 100}
          {@const paintColorChirho = SCRIPT_COLORS_CHIRHO[activePaintScriptChirho ?? "unknown-chirho"] ?? "#888"}
          <div
            class="paint-rect-chirho"
            style="left: {pctLeftChirho}%; top: {pctTopChirho}%; width: {pctWChirho}%; height: {pctHChirho}%; --paint-color: {paintColorChirho}"
          ></div>
        {/if}
      </div>
    </aside>

    <div class="lines-panel-chirho">
      <h2>Lines · image strip + editable transcription</h2>
      {#if !snapshotParsedChirho}
        <p class="empty-chirho">No snapshot yet for this page — rebuild snapshots from the pipeline.</p>
      {:else}
        {#each snapshotParsedChirho.scanlinesChirho as slChirho (slChirho.scanlineIdChirho)}
          {@const lineWordsChirho = mergedWordsChirho.filter((wChirho) => wChirho.scanlineIdChirho === slChirho.scanlineIdChirho)}
          {@const isFlaggedChirho = linesNeedingAIChirho.has(slChirho.scanlineIdChirho)}
          {@const lineTokensChirho = buildLineTokensChirho(slChirho, lineWordsChirho)}
          <div class="line-block-chirho" class:flagged-line-chirho={isFlaggedChirho}>
            <div class="line-header-chirho">
              <span class="line-num-chirho">Line {slChirho.lineIndexChirho}</span>
              <span class="line-meta-chirho">{lineWordsChirho.length} word{lineWordsChirho.length === 1 ? '' : 's'}</span>
              <button
                type="button"
                class="line-flag-toggle-chirho"
                class:flagged-chirho={isFlaggedChirho}
                onclick={() => toggleLineNeedsAIChirho(slChirho.scanlineIdChirho, slChirho.lineIndexChirho)}
                title={isFlaggedChirho ? 'Click to unflag' : 'Flag this line as needs AI review'}
              >
                {isFlaggedChirho ? '✅ flagged' : '🚩 flag'}
              </button>
            </div>
            <svg
              viewBox={lineCropViewBoxChirho({
                xMinChirho: slChirho.xMinChirho ?? 0,
                yMinChirho: slChirho.yMinChirho ?? 0,
                widthChirho: slChirho.widthChirho ?? imgNaturalWidthChirho,
                heightChirho: slChirho.heightChirho ?? 40,
              })}
              preserveAspectRatio="xMidYMid meet"
              class="line-strip-svg-chirho"
            >
              <image
                href={imageUrlChirho(data.fullPageR2KeyChirho)}
                x="0" y="0"
                width={imgNaturalWidthChirho}
                height={imgNaturalHeightChirho}
              />
              {#each lineWordsChirho as wChirho (wChirho.wordIdChirho)}
                <rect
                  class="word-box-chirho line-word-box-chirho"
                  class:confirmed-chirho={wChirho.displayConfirmedChirho}
                  class:flagged-chirho={wChirho.displayPendingScriptFlagChirho}
                  style="--word-color: {SCRIPT_COLORS_CHIRHO[wChirho.displayScriptChirho] ?? '#c9a84c'}"
                  x={wChirho.xMinChirho}
                  y={wChirho.yMinChirho}
                  width={wChirho.xMaxChirho - wChirho.xMinChirho}
                  height={wChirho.yMaxChirho - wChirho.yMinChirho}
                  onclick={() => openWordEditChirho(wChirho)}
                  oncontextmenu={(eChirho) => wordContextMenuChirho(eChirho, wChirho)}
                  role="button"
                  tabindex="0"
                  aria-label="Word: {wChirho.displayTextChirho}"
                ></rect>
              {/each}
            </svg>
            <div class="line-text-chirho" dir="auto">
              {#each lineTokensChirho as tokChirho, tIdxChirho}
                {@const colChirho = SCRIPT_COLORS_CHIRHO[tokChirho.scriptChirho] ?? '#c9a84c'}
                {#if tokChirho.kindChirho === 'word-chirho'}
                  {@const wTokChirho = tokChirho.wordChirho!}
                  {@const mismatchChirho = hasScriptMismatchChirho(wTokChirho)}
                  <button
                    type="button"
                    class="line-word-token-chirho"
                    class:confirmed-chirho={tokChirho.confirmedChirho}
                    class:flagged-chirho={tokChirho.flaggedChirho}
                    class:mismatch-chirho={mismatchChirho}
                    style="--word-color: {colChirho}"
                    onclick={() => openWordEditChirho(wTokChirho)}
                    oncontextmenu={(eChirho) => wordContextMenuChirho(eChirho, wTokChirho)}
                    onmouseenter={() => (hoveredWordChirho = wTokChirho)}
                    onmouseleave={() => { if (hoveredWordChirho?.wordIdChirho === wTokChirho.wordIdChirho) hoveredWordChirho = null; }}
                    title={`${scriptLabelChirho(tokChirho.scriptChirho)} · ${wTokChirho.displaySourceChirho.replace('-chirho','')}${tokChirho.confirmedChirho ? ' · ✓' : ''}${tokChirho.flaggedChirho ? ' · ⚠ flag' : ''}${mismatchChirho ? ' · ⚠ codepoint mismatch' : ''}`}
                  >{tokChirho.textChirho || '·'}{#if tokChirho.confirmedChirho}<span class="token-dot-chirho">●</span>{/if}{#if mismatchChirho}<span class="token-mismatch-chirho">⚠</span>{/if}</button>
                {:else}
                  {@const segTokChirho = tokChirho.segmentChirho}
                  <button
                    type="button"
                    class="line-segment-token-chirho"
                    style="--word-color: {colChirho}"
                    onclick={() => openEditChirho(segTokChirho as any)}
                    title={`${scriptLabelChirho(tokChirho.scriptChirho)} segment${tokChirho.referenceChirho ? ' · ' + tokChirho.referenceChirho : ''}${tokChirho.confidenceChirho ? ' (' + tokChirho.confidenceChirho + ')' : ''}`}
                  >
                    {#if tokChirho.confidenceChirho === 'high'}<span class="conf-mini-chirho conf-high-chirho">✓</span>
                    {:else if tokChirho.confidenceChirho === 'medium'}<span class="conf-mini-chirho conf-medium-chirho">◐</span>
                    {:else if tokChirho.confidenceChirho === 'low'}<span class="conf-mini-chirho conf-low-chirho">?</span>{/if}
                    <span class="seg-token-text-chirho" dir="auto">{tokChirho.textChirho || '·'}</span>
                  </button>
                {/if}{tIdxChirho < lineTokensChirho.length - 1 ? ' ' : ''}
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
  {@const wPxChirho = wChirho.xMaxChirho - wChirho.xMinChirho}
  {@const hPxChirho = wChirho.yMaxChirho - wChirho.yMinChirho}
  {@const cropScaleChirho = hPxChirho > 0 ? 120 / hPxChirho : 1}
  <div class="modal-backdrop-chirho" onclick={closeWordEditChirho} role="presentation">
    <div class="modal-chirho word-modal-chirho" onclick={(eChirho) => eChirho.stopPropagation()} role="dialog" aria-modal="true">
      <header class="modal-header-chirho">
        <h3>Edit word · line {wChirho.lineIndexChirho}</h3>
        <button class="close-btn-chirho" onclick={closeWordEditChirho} aria-label="Close">×</button>
      </header>
      <div class="modal-body-chirho">
        <div
          class="word-crop-bg-chirho"
          style="
            background-image: url('{imageUrlChirho(data.fullPageR2KeyChirho)}');
            background-size: {imgNaturalWidthChirho * cropScaleChirho}px {imgNaturalHeightChirho * cropScaleChirho}px;
            background-position: -{wChirho.xMinChirho * cropScaleChirho}px -{wChirho.yMinChirho * cropScaleChirho}px;
            width: {wPxChirho * cropScaleChirho}px;
            height: {hPxChirho * cropScaleChirho}px;
            max-width: 100%;
          "
        ></div>
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
            bind:this={wordInputElChirho}
            onkeydown={onWordKeyChirho}
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
        <p class="modal-hint-chirho"><kbd>Enter</kbd> saves · <kbd>Shift</kbd>+<kbd>Enter</kbd> save &amp; jump to next problem · <kbd>Esc</kbd> closes. Right-click a word with <span class="hint-warn-chirho">⚠</span> in the line text to auto-set its script to the detected codepoint.</p>
      </div>
      <footer class="modal-footer-chirho">
        <button class="btn-flag-chirho" onclick={() => markWordNonLatinChirho(wChirho)} disabled={wordSavingChirho}>
          ⚠ Flag as non-Latin
        </button>
        <button class="btn-cancel-chirho" onclick={closeWordEditChirho} disabled={wordSavingChirho}>Cancel</button>
        <button class="btn-save-chirho" onclick={saveWordChirho} disabled={wordSavingChirho}>
          {wordSavingChirho ? "Saving…" : "Save"}
        </button>
        <button class="btn-save-next-chirho" onclick={saveAndNextWordChirho} disabled={wordSavingChirho} title="Shift+Enter">
          Save &amp; next →
        </button>
      </footer>
    </div>
  </div>
{/if}

{#if saveErrorChirho}
  <div class="save-error-toast-chirho" role="alert">
    <span class="toast-icon-chirho">⚠</span>
    <span class="toast-msg-chirho">{saveErrorChirho}</span>
    <button class="toast-close-chirho" onclick={() => (saveErrorChirho = null)} aria-label="Dismiss error">×</button>
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
          <textarea
            bind:value={editTextChirho}
            bind:this={segmentTextareaElChirho}
            onkeydown={onSegmentKeyChirho}
            dir="auto"
            rows="4"
            placeholder="Edit the transcribed text…"
          ></textarea>
        </label>
        <p class="modal-hint-chirho"><kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> saves · <kbd>Esc</kbd> closes. Saving marks this segment as <strong>Confirmed</strong>.</p>
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
  /* Lines panel (interlinear) takes center stage; page image is the aside.
     The grid-template-columns flips based on user's saved image-size pref. */
  .content-chirho {
    display: grid;
    gap: 1.5rem;
    align-items: start;
  }
  .content-chirho.img-small-chirho   { grid-template-columns: 1fr 25%; }
  .content-chirho.img-medium-chirho  { grid-template-columns: 1fr 40%; }
  .content-chirho.img-large-chirho   { grid-template-columns: 1fr 60%; }
  .content-chirho > .page-image-panel-chirho { order: 2; }
  .content-chirho > .lines-panel-chirho      { order: 1; }
  .page-image-panel-chirho {
    position: sticky; top: 4rem;
    max-height: calc(100vh - 6rem);
    overflow: hidden;
    display: flex; flex-direction: column;
  }
  .image-aside-header-chirho {
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.5rem; margin-bottom: 0.5rem;
  }
  .image-aside-header-chirho h2 {
    margin: 0; padding: 0; border: none;
    font-size: 0.95rem;
  }
  .image-size-btn-chirho {
    padding: 0.25rem 0.65rem;
    background: #1a1a2e; border: 1px solid #2a2a4a;
    color: #c9a84c; border-radius: 4px; cursor: pointer;
    font-size: 0.75rem;
  }
  .image-size-btn-chirho:hover { background: #2a2a4a; }
  .page-image-panel-chirho .image-container-chirho {
    flex: 1 1 auto;
    overflow: auto;
  }
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
  .modal-hint-chirho kbd {
    display: inline-block;
    padding: 0 0.3rem;
    background: #1a1a2e;
    border: 1px solid #2a2a4a;
    border-bottom-width: 2px;
    border-radius: 3px;
    color: #c9a84c;
    font-family: ui-monospace, "SF Mono", "Menlo", monospace;
    font-size: 0.7rem;
    line-height: 1.3;
  }
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
    overflow: auto;
  }
  .word-crop-bg-chirho {
    display: block;
    background-repeat: no-repeat;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
    border-radius: 2px;
    margin: auto;
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
  .btn-save-next-chirho {
    padding: 0.4rem 0.9rem;
    background: #0f3060; border: 1px solid #2563eb;
    color: #93c5fd;
    border-radius: 4px; cursor: pointer;
  }
  .btn-save-next-chirho:hover:not(:disabled) { background: #163d7c; }
  .hint-warn-chirho { color: #fca5a5; }

  /* ===== Save error toast — bottom-right, sticky until dismissed ===== */
  .save-error-toast-chirho {
    position: fixed;
    bottom: 1rem; right: 1rem;
    z-index: 1000;
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.55rem 0.7rem 0.55rem 0.8rem;
    background: #4a1010;
    border: 1px solid #dc2626;
    color: #fecaca;
    border-radius: 6px;
    max-width: min(34rem, calc(100vw - 2rem));
    font-size: 0.85rem;
    box-shadow: 0 4px 14px rgba(0,0,0,0.55);
  }
  .toast-icon-chirho { font-size: 1.1rem; flex: 0 0 auto; }
  .toast-msg-chirho { flex: 1 1 auto; word-break: break-word; }
  .toast-close-chirho {
    background: none; border: none;
    color: #fecaca; font-size: 1.3rem; line-height: 1;
    cursor: pointer; padding: 0 0.25rem;
  }
  .toast-close-chirho:hover { color: #fff; }

  /* ===== Sticky paintbrush palette ===== */
  .paintbrush-bar-chirho {
    position: sticky; top: 0; z-index: 200;
    display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem;
    padding: 0.5rem 0.8rem;
    background: #0d0d18; border-bottom: 1px solid #2a2a4a;
    margin: -1rem -1rem 1rem -1rem;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }
  .paintbrush-label-chirho {
    color: #c9a84c; font-size: 0.85rem; font-weight: 600; margin-right: 0.3rem;
  }
  .paint-chip-chirho {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.25rem 0.55rem; border-radius: 999px;
    background: #1a1a2e; border: 1px solid #2a2a4a; color: #ccc;
    cursor: pointer; font-size: 0.78rem;
    transition: background 0.1s, border-color 0.1s;
  }
  .paint-chip-chirho:hover {
    background: #2a2a4a;
    border-color: var(--chip-color);
  }
  .paint-chip-chirho.active-chirho {
    background: color-mix(in srgb, var(--chip-color) 25%, #1a1a2e);
    border-color: var(--chip-color);
    color: #fff;
    box-shadow: 0 0 0 1px var(--chip-color), 0 0 8px color-mix(in srgb, var(--chip-color) 50%, transparent);
  }
  .paint-swatch-chirho {
    width: 0.9rem; height: 0.9rem; border-radius: 50%;
    background: var(--chip-color);
    border: 1px solid rgba(255,255,255,0.4);
    display: inline-block;
  }
  .paint-hint-chirho {
    margin-left: auto; color: #888; font-size: 0.72rem; font-style: italic;
  }
  .paint-hint-dim-chirho { opacity: 0.6; }

  .image-container-chirho.paint-armed-chirho {
    cursor: crosshair;
  }
  .image-container-chirho.paint-armed-chirho .word-box-chirho {
    pointer-events: none; /* paint takes precedence; right-click still works via word-text below */
  }
  .paint-rect-chirho {
    position: absolute;
    background: color-mix(in srgb, var(--paint-color) 18%, transparent);
    border: 2px dashed var(--paint-color);
    pointer-events: none;
    z-index: 50;
  }

  /* ===== Lines panel (Lace-style line-by-line) ===== */
  .lines-panel-chirho {
    max-height: 90vh; overflow-y: auto;
    padding-right: 0.5rem;
  }
  .lines-panel-chirho h2 {
    font-size: 1rem; color: #ccc;
    margin-bottom: 0.75rem; padding-bottom: 0.5rem;
    border-bottom: 1px solid #2a2a4a;
    position: sticky; top: 0; background: #0a0a14; z-index: 5;
  }
  /* override the prior .line-block-chirho rule */
  .lines-panel-chirho .line-block-chirho {
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.6rem;
    background: #12121f;
    border: 1px solid #2a2a4a;
    border-left: 3px solid transparent;
    border-radius: 6px;
  }
  .lines-panel-chirho .line-block-chirho.flagged-line-chirho {
    border-left-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }
  .lines-panel-chirho .line-header-chirho {
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 0.75rem;
    color: #888; text-transform: uppercase; letter-spacing: 0.5px;
    margin-bottom: 0.4rem;
  }
  .line-num-chirho { font-weight: 600; color: #c9a84c; }
  .line-meta-chirho { color: #666; font-size: 0.7rem; }
  .line-flag-toggle-chirho {
    margin-left: auto;
    padding: 0.15rem 0.5rem;
    background: #1a1a2e; border: 1px solid #2a2a4a; color: #999;
    border-radius: 3px; font-size: 0.7rem; cursor: pointer;
  }
  .line-flag-toggle-chirho:hover { background: #2a2a4a; }
  .line-flag-toggle-chirho.flagged-chirho {
    background: rgba(245, 158, 11, 0.2);
    border-color: #f59e0b;
    color: #fbbf24;
  }
  .line-strip-svg-chirho {
    display: block;
    width: 100%;
    height: 44px;            /* uniform line strip height — narrow lines letterbox to white */
    background: #fff;
    border: 1px solid #2a2a4a;
    border-radius: 3px;
    margin-bottom: 0.4rem;
  }
  .line-word-box-chirho {
    fill: rgba(201, 168, 76, 0.05);
    stroke: color-mix(in srgb, var(--word-color, #c9a84c) 80%, transparent);
    stroke-width: 1;
  }
  .line-word-box-chirho:hover {
    fill: color-mix(in srgb, var(--word-color, #c9a84c) 30%, transparent);
    stroke-width: 2;
  }
  .line-text-chirho {
    font-family: "Georgia", "SBL Hebrew", "SBL Greek", "Noto Serif", serif;
    font-size: 1.05rem;
    line-height: 1.7;
    padding: 0.3rem 0.2rem;
    background: #0a0a14;
    border-radius: 3px;
  }
  .line-word-token-chirho {
    display: inline-block;
    padding: 0 0.25rem;
    margin: 0 0.05rem;
    border: 1px solid transparent;
    border-bottom: 2px solid var(--word-color, transparent);
    background: transparent;
    color: #e0e0e0;
    cursor: pointer;
    font: inherit;
    border-radius: 2px;
    position: relative;
    transition: background 0.1s, border-color 0.1s;
  }
  .line-word-token-chirho:hover {
    background: color-mix(in srgb, var(--word-color, #c9a84c) 25%, transparent);
    border-color: var(--word-color, #c9a84c);
  }
  .line-word-token-chirho.confirmed-chirho {
    background: rgba(34, 197, 94, 0.08);
  }
  .line-word-token-chirho.flagged-chirho {
    background: rgba(245, 158, 11, 0.12);
    border-bottom-style: dashed;
  }
  .line-word-token-chirho.mismatch-chirho {
    border-bottom-color: #dc2626;
    border-bottom-style: dotted;
  }
  .token-dot-chirho {
    display: inline-block;
    margin-left: 0.15rem;
    color: #facc15;
    font-size: 0.65rem;
    vertical-align: super;
  }
  .token-mismatch-chirho {
    display: inline-block;
    margin-left: 0.15rem;
    color: #fca5a5;
    font-size: 0.65rem;
    vertical-align: super;
  }

  /* Segment-merged tokens: Hebrew/Greek phrase chunks within a line */
  .line-segment-token-chirho {
    display: inline-block;
    padding: 0.05rem 0.4rem;
    margin: 0 0.15rem;
    background: color-mix(in srgb, var(--word-color, #c9a84c) 18%, transparent);
    border: 1px solid var(--word-color, #c9a84c);
    border-radius: 4px;
    color: #f5e7b8;
    cursor: pointer;
    font: inherit;
    font-size: 1.05rem;
    line-height: 1.4;
  }
  .line-segment-token-chirho:hover {
    background: color-mix(in srgb, var(--word-color, #c9a84c) 35%, transparent);
  }
  .conf-mini-chirho {
    display: inline-block;
    padding: 0 0.2rem;
    margin-right: 0.25rem;
    border-radius: 2px;
    font-size: 0.7rem;
    vertical-align: middle;
  }
  .seg-token-text-chirho {
    font-family: "SBL Hebrew", "SBL Greek", "Noto Serif", "Georgia", serif;
  }
</style>
