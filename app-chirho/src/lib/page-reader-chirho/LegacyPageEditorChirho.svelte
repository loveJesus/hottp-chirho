<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<script lang="ts">
  import "./legacy-styles-chirho.css";
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
      const responseChirho = await fetch("/api-chirho/segments-chirho", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentIdChirho: editingSegmentChirho.segmentIdChirho,
          acceptedTextChirho: editTextChirho,
          statusChirho: "human-confirmed-chirho",
        }),
      });
      if (!responseChirho.ok) { saveErrorChirho = `Save not confirmed (HTTP ${responseChirho.status}). Sign in if needed; your edit is retained.`; return; }
      closeEditChirho();
      await invalidateAll();
    } catch { saveErrorChirho = 'Connection failed. Save is unconfirmed; your edit is retained.'; } finally {
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
    // Pending vision suggestion from a flagged event — the user hasn't
    // accepted yet but Opus believes the word is this:
    visionSuggestionTextChirho?: string;
    visionSuggestionScriptChirho?: string;
    visionSuggestionCertaintyChirho?: number;
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
          // Vision-suggested flags carry the model's correction in payload.
          if (typeof payloadChirho.visionSpellingChirho === "string") {
            curChirho.visionSuggestionTextChirho = payloadChirho.visionSpellingChirho as string;
          }
          if (typeof payloadChirho.visionLanguageChirho === "string") {
            const langChirho = payloadChirho.visionLanguageChirho as string;
            const langToScriptChirho: Record<string, string> = {
              "hebrew": "hebrew-chirho",
              "greek": "greek-chirho",
              "syriac": "syriac-chirho",
              "arabic": "arabic-chirho",
              "latin-french": "latin-chirho",
              "latin-non-french": "latin-non-french-chirho",
              "symbol": "symbol-chirho",
              "unknown": "unknown-chirho",
            };
            curChirho.visionSuggestionScriptChirho = langToScriptChirho[langChirho] ?? "unknown-chirho";
          }
          if (typeof payloadChirho.certaintyChirho === "number") {
            curChirho.visionSuggestionCertaintyChirho = payloadChirho.certaintyChirho as number;
          }
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
    // Pending vision suggestion (null if no flagged-with-suggestion event).
    visionSuggestionTextChirho: string | null;
    visionSuggestionScriptChirho: string | null;
    visionSuggestionCertaintyChirho: number | null;
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
          visionSuggestionTextChirho: oChirho.visionSuggestionTextChirho ?? null,
          visionSuggestionScriptChirho: oChirho.visionSuggestionScriptChirho ?? null,
          visionSuggestionCertaintyChirho: oChirho.visionSuggestionCertaintyChirho ?? null,
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

  // Machine OCR suggestions (CRNN+CTC word reader) for this page, keyed by
  // word id. Read-only — accepting one just pre-fills the edit + saves via the
  // normal event path, so a machine read never auto-overwrites a reading.
  interface OcrSuggestionChirho {
    textChirho: string;
    confChirho: number;
    verdictChirho: string;
    bucketChirho: string;
  }
  let ocrSuggestionsChirho = $state<Map<number, OcrSuggestionChirho>>(new Map());
  let ocrFetchedChirho = false;
  $effect(() => {
    if (!browser || ocrFetchedChirho) return;
    const pageIdChirho = (data as any).pageDataChirho?.idChirho;
    if (pageIdChirho == null) return;
    ocrFetchedChirho = true;
    fetch(`/api-chirho/ocr-suggestions-chirho?page-id-chirho=${pageIdChirho}`)
      .then((rChirho) => (rChirho.ok ? rChirho.json() : null))
      .then((jChirho: any) => {
        const listChirho = jChirho?.suggestionsChirho;
        if (!Array.isArray(listChirho)) return;
        const mChirho = new Map<number, OcrSuggestionChirho>();
        for (const sChirho of listChirho as any[]) {
          if (mChirho.has(sChirho.wordIdChirho)) continue; // highest-conf first
          mChirho.set(sChirho.wordIdChirho, {
            textChirho: sChirho.suggestedTextChirho,
            confChirho: sChirho.confidenceChirho,
            verdictChirho: sChirho.wlcVerdictChirho,
            bucketChirho: sChirho.bucketChirho,
          });
        }
        ocrSuggestionsChirho = mChirho;
      })
      .catch(() => {});
  });

  function acceptOcrChirho(textChirho: string): void {
    wordEditTextChirho = textChirho;
    wordEditScriptChirho = "hebrew-chirho";
    void saveWordChirho();
  }

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
  function openWordEditFromKeyChirho(eChirho: KeyboardEvent, wChirho: MergedWordChirho): void {
    if (eChirho.key !== "Enter" && eChirho.key !== " ") return;
    eChirho.preventDefault();
    openWordEditChirho(wChirho);
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
    } else if (wChirho.visionSuggestionTextChirho) {
      // Vision flagged this with a specific suggestion — one-click accept it.
      // Emits both text-corrected (if text changed) and script-set (if script changed),
      // then projection logic on D1 marks the word confirmed.
      const pageIdChirho = (data as any).pageDataChirho.idChirho;
      if (wChirho.visionSuggestionTextChirho !== wChirho.displayTextChirho) {
        await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wChirho.scanlineIdChirho,
          wordIdChirho: wChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-text-corrected-chirho",
          payloadChirho: {
            oldTextChirho: wChirho.displayTextChirho,
            newTextChirho: wChirho.visionSuggestionTextChirho,
            viaChirho: "vision-suggestion-accept-chirho",
          },
        });
      }
      if (wChirho.visionSuggestionScriptChirho && wChirho.visionSuggestionScriptChirho !== wChirho.displayScriptChirho) {
        await postEventChirho({
          pageIdChirho,
          scanlineIdChirho: wChirho.scanlineIdChirho,
          wordIdChirho: wChirho.wordIdChirho,
          aggregateTypeChirho: "word-chirho",
          eventTypeChirho: "word-script-set-chirho",
          payloadChirho: {
            oldScriptChirho: wChirho.displayScriptChirho,
            newScriptChirho: wChirho.visionSuggestionScriptChirho,
            viaChirho: "vision-suggestion-accept-chirho",
          },
        });
      }
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
<div class="legacy-page-editor-chirho">


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
                  onkeydown={(eChirho) => openWordEditFromKeyChirho(eChirho, wChirho)}
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
                  onkeydown={(eChirho) => openWordEditFromKeyChirho(eChirho, wChirho)}
                  oncontextmenu={(eChirho) => wordContextMenuChirho(eChirho, wChirho)}
                  role="button"
                  tabindex="0"
                  aria-label="Word: {wChirho.displayTextChirho}"
                ></rect>
              {/each}
            </svg>
            <!-- dir="ltr" on the container keeps French order intact when a
                 Hebrew/Arabic token would otherwise flip the whole line via
                 dir="auto"; each non-Latin token is dir="rtl" inside so its own
                 glyphs read correctly. -->
            <div class="line-text-chirho" dir="ltr">
              {#each lineTokensChirho as tokChirho, tIdxChirho}
                {@const colChirho = SCRIPT_COLORS_CHIRHO[tokChirho.scriptChirho] ?? '#c9a84c'}
                {@const isRtlChirho = tokChirho.scriptChirho === 'hebrew-chirho' || tokChirho.scriptChirho === 'arabic-chirho' || tokChirho.scriptChirho === 'syriac-chirho'}
                {@const isNonLatinChirho = isRtlChirho || tokChirho.scriptChirho === 'greek-chirho' || tokChirho.scriptChirho === 'symbol-chirho'}
                {#if tokChirho.kindChirho === 'word-chirho'}
                  {@const wTokChirho = tokChirho.wordChirho!}
                  {@const mismatchChirho = hasScriptMismatchChirho(wTokChirho)}
                  {@const detectedRtlChirho = mismatchChirho && /[֐-׿؀-ۿ܀-ݏ]/.test(wTokChirho.displayTextChirho ?? '')}
                  {@const hasSuggestionChirho = wTokChirho.visionSuggestionTextChirho != null}
                  {@const suggestionRtlChirho = hasSuggestionChirho && /[֐-׿؀-ۿ܀-ݏ]/.test(wTokChirho.visionSuggestionTextChirho ?? '')}
                  {@const suggestionColChirho = wTokChirho.visionSuggestionScriptChirho ? (SCRIPT_COLORS_CHIRHO[wTokChirho.visionSuggestionScriptChirho] ?? '#c9a84c') : colChirho}
                  <button
                    type="button"
                    class="line-word-token-chirho"
                    class:confirmed-chirho={tokChirho.confirmedChirho}
                    class:flagged-chirho={tokChirho.flaggedChirho}
                    class:mismatch-chirho={mismatchChirho}
                    class:non-latin-chirho={isNonLatinChirho}
                    class:has-suggestion-chirho={hasSuggestionChirho}
                    dir={isRtlChirho || detectedRtlChirho ? 'rtl' : 'ltr'}
                    style="--word-color: {colChirho}"
                    onclick={() => openWordEditChirho(wTokChirho)}
                    oncontextmenu={(eChirho) => wordContextMenuChirho(eChirho, wTokChirho)}
                    onmouseenter={() => (hoveredWordChirho = wTokChirho)}
                    onmouseleave={() => { if (hoveredWordChirho?.wordIdChirho === wTokChirho.wordIdChirho) hoveredWordChirho = null; }}
                    title={`${scriptLabelChirho(tokChirho.scriptChirho)} · ${wTokChirho.displaySourceChirho.replace('-chirho','')}${tokChirho.confirmedChirho ? ' · ✓' : ''}${tokChirho.flaggedChirho ? ' · ⚠ flag' : ''}${mismatchChirho ? ' · ⚠ codepoint mismatch' : ''}${hasSuggestionChirho ? ' · vision suggests: ' + wTokChirho.visionSuggestionTextChirho + ' (right-click to accept)' : ''}`}
                  >{tokChirho.textChirho || '·'}{#if tokChirho.confirmedChirho}<span class="token-dot-chirho">●</span>{/if}{#if mismatchChirho && !hasSuggestionChirho}<span class="token-mismatch-chirho">⚠</span>{/if}{#if hasSuggestionChirho}<span class="vision-suggestion-chirho" dir={suggestionRtlChirho ? 'rtl' : 'ltr'} style="--suggestion-color: {suggestionColChirho}">→{wTokChirho.visionSuggestionTextChirho}</span>{/if}</button>
                {:else}
                  {@const segTokChirho = tokChirho.segmentChirho}
                  <button
                    type="button"
                    class="line-segment-token-chirho"
                    class:non-latin-chirho={isNonLatinChirho}
                    dir={isRtlChirho ? 'rtl' : 'ltr'}
                    style="--word-color: {colChirho}"
                    onclick={() => openEditChirho(segTokChirho as any)}
                    title={`${scriptLabelChirho(tokChirho.scriptChirho)} segment${tokChirho.referenceChirho ? ' · ' + tokChirho.referenceChirho : ''}${tokChirho.confidenceChirho ? ' (' + tokChirho.confidenceChirho + ')' : ''}`}
                  >
                    {#if tokChirho.confidenceChirho === 'high'}<span class="conf-mini-chirho conf-high-chirho">✓</span>
                    {:else if tokChirho.confidenceChirho === 'medium'}<span class="conf-mini-chirho conf-medium-chirho">◐</span>
                    {:else if tokChirho.confidenceChirho === 'low'}<span class="conf-mini-chirho conf-low-chirho">?</span>{/if}
                    <span class="seg-token-text-chirho" dir={isRtlChirho ? 'rtl' : 'ltr'}>{tokChirho.textChirho || '·'}</span>
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
    <div class="modal-chirho word-modal-chirho" onclick={(eChirho) => eChirho.stopPropagation()} onkeydown={(eChirho) => eChirho.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
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
        {#if ocrSuggestionsChirho.get(wChirho.wordIdChirho)}
          {@const sugChirho = ocrSuggestionsChirho.get(wChirho.wordIdChirho)!}
          <div class="ocr-suggestion-chirho" class:ocr-auto-chirho={sugChirho.bucketChirho === "AUTO"}>
            <span class="ocr-label-chirho">CRNN</span>
            <code dir="rtl" class="ocr-text-chirho">{sugChirho.textChirho}</code>
            <span class="ocr-conf-chirho">{Math.round(sugChirho.confChirho * 100)}% · {sugChirho.verdictChirho}</span>
            <button
              type="button"
              class="ocr-accept-chirho"
              onclick={() => acceptOcrChirho(sugChirho.textChirho)}
              disabled={wordSavingChirho}
            >Accept</button>
          </div>
        {/if}
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
    <div class="modal-chirho" onclick={(eChirho) => eChirho.stopPropagation()} onkeydown={(eChirho) => eChirho.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
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


</div>
