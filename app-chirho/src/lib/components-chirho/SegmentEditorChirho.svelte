<!-- For God so loved the world that he gave his only begotten Son,
     that whoever believes in him should not perish but have eternal life. John 3:16 -->

<!--
  SegmentEditorChirho: Zoomed segment image, editable OCR text, script badge.
  Handles accept/edit/reject actions for a single segment.
-->

<script lang="ts">
  interface SegmentEditorPropsChirho {
    segmentChirho: {
      idChirho: number;
      segmentIndexChirho: number;
      pdftotextChirho: string | null;
      ocrTextChirho: string | null;
      acceptedTextChirho: string | null;
      scriptTypeChirho: string | null;
      imageR2KeyChirho: string | null;
      statusChirho: string;
    };
    onacceptChirho: (segmentIdChirho: number, textChirho: string) => void;
  }

  let { segmentChirho, onacceptChirho }: SegmentEditorPropsChirho = $props();

  let editingChirho = $state(false);
  let editTextChirho = $state("");
  let savingChirho = $state(false);

  const displayTextChirho = $derived(
    segmentChirho.acceptedTextChirho ??
    segmentChirho.ocrTextChirho ??
    segmentChirho.pdftotextChirho ??
    ""
  );

  const isAcceptedChirho = $derived(segmentChirho.statusChirho === "accepted-chirho");
  const isFrenchChirho = $derived(segmentChirho.scriptTypeChirho === "french-chirho");

  const SCRIPT_COLORS_CHIRHO: Record<string, string> = {
    "hebrew-chirho": "#4fc3f7",
    "greek-chirho": "#81c784",
    "syriac-chirho": "#ffb74d",
    "arabic-chirho": "#f06292",
    "mixed-chirho": "#ce93d8",
    "unknown-chirho": "#999",
  };

  function scriptLabelChirho(typeChirho: string | null): string {
    if (!typeChirho) return "Unknown";
    return typeChirho.replace("-chirho", "").charAt(0).toUpperCase() +
      typeChirho.replace("-chirho", "").slice(1);
  }

  function imageUrlChirho(keyChirho: string | null): string {
    if (!keyChirho) return "";
    return `/api-chirho/images-chirho?key-chirho=${encodeURIComponent(keyChirho)}`;
  }

  function startEditChirho() {
    editingChirho = true;
    editTextChirho = displayTextChirho;
  }

  function cancelEditChirho() {
    editingChirho = false;
    editTextChirho = "";
  }

  async function acceptChirho() {
    savingChirho = true;
    try {
      await fetch("/api-chirho/segments-chirho", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentIdChirho: segmentChirho.idChirho,
          acceptedTextChirho: displayTextChirho,
          statusChirho: "accepted-chirho",
        }),
      });
      onacceptChirho(segmentChirho.idChirho, displayTextChirho);
    } finally {
      savingChirho = false;
    }
  }

  async function saveEditChirho() {
    savingChirho = true;
    try {
      await fetch("/api-chirho/segments-chirho", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentIdChirho: segmentChirho.idChirho,
          acceptedTextChirho: editTextChirho,
          statusChirho: "accepted-chirho",
        }),
      });
      editingChirho = false;
      onacceptChirho(segmentChirho.idChirho, editTextChirho);
    } finally {
      savingChirho = false;
    }
  }
</script>

<div class="seg-editor-chirho" class:french-chirho={isFrenchChirho} class:accepted-chirho={isAcceptedChirho}>
  <div class="seg-header-chirho">
    <span class="seg-idx-chirho">Seg {segmentChirho.segmentIndexChirho}</span>

    {#if isFrenchChirho}
      <span class="type-badge-french-chirho">French</span>
      <span class="auto-marker-chirho">auto</span>
    {:else}
      <span
        class="type-badge-chirho"
        style="color: {SCRIPT_COLORS_CHIRHO[segmentChirho.scriptTypeChirho ?? 'unknown-chirho'] ?? '#999'}"
      >
        {scriptLabelChirho(segmentChirho.scriptTypeChirho)}
      </span>
    {/if}

    {#if isAcceptedChirho}
      <span class="status-accepted-chirho">Accepted</span>
    {/if}
  </div>

  {#if !isFrenchChirho && segmentChirho.imageR2KeyChirho}
    <div class="seg-image-chirho">
      <img
        src={imageUrlChirho(segmentChirho.imageR2KeyChirho)}
        alt="Segment {segmentChirho.segmentIndexChirho}"
      />
    </div>
  {/if}

  {#if editingChirho}
    <div class="edit-area-chirho">
      <textarea
        bind:value={editTextChirho}
        class="edit-textarea-chirho"
        rows="2"
        dir="auto"
      ></textarea>
      <div class="edit-actions-chirho">
        <button class="btn-save-chirho" onclick={saveEditChirho} disabled={savingChirho}>Save</button>
        <button class="btn-cancel-chirho" onclick={cancelEditChirho}>Cancel</button>
      </div>
    </div>
  {:else}
    <div class="seg-text-chirho" dir="auto">
      {#if isFrenchChirho}
        <span class="french-text-chirho">{displayTextChirho}</span>
      {:else}
        <span class="nonfrench-text-chirho">{displayTextChirho}</span>
      {/if}
    </div>
  {/if}

  {#if !isFrenchChirho && !editingChirho && !isAcceptedChirho}
    <div class="seg-actions-chirho">
      <button class="btn-accept-chirho" onclick={acceptChirho} disabled={savingChirho}>Accept</button>
      <button class="btn-edit-chirho" onclick={startEditChirho}>Edit</button>
    </div>
  {/if}
</div>

<style>
  .seg-editor-chirho {
    padding: 0.4rem 0.6rem;
    border-left: 3px solid #333;
    margin-bottom: 0.3rem;
    font-size: 0.85rem;
  }

  .seg-editor-chirho.french-chirho {
    border-left-color: #2a4a2a;
    opacity: 0.7;
  }

  .seg-editor-chirho.accepted-chirho {
    border-left-color: #2e7d32;
    background: rgba(30, 70, 30, 0.15);
  }

  .seg-header-chirho {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.25rem;
  }

  .seg-idx-chirho {
    font-size: 0.7rem;
    color: #666;
    font-weight: 600;
  }

  .type-badge-chirho {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .type-badge-french-chirho {
    font-size: 0.65rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .auto-marker-chirho {
    font-size: 0.6rem;
    color: #555;
    margin-left: auto;
  }

  .status-accepted-chirho {
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
    border-radius: 6px;
    background: #1b5e20;
    color: #66bb6a;
    margin-left: auto;
  }

  .seg-image-chirho {
    margin: 0.25rem 0;
    border: 1px solid #333;
    border-radius: 3px;
    overflow: hidden;
    background: #fff;
    max-width: 100%;
  }

  .seg-image-chirho img {
    max-width: 100%;
    display: block;
  }

  .seg-text-chirho {
    padding: 0.2rem 0;
    line-height: 1.6;
  }

  .french-text-chirho {
    color: #999;
    font-size: 0.82rem;
  }

  .nonfrench-text-chirho {
    color: #e0e0e0;
    font-family: "SBL Hebrew", "SBL Greek", "Noto Sans Hebrew", "Noto Sans", serif;
    font-size: 1rem;
  }

  .edit-area-chirho {
    margin: 0.25rem 0;
  }

  .edit-textarea-chirho {
    width: 100%;
    padding: 0.3rem;
    background: #111;
    border: 1px solid #c9a84c;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 1rem;
    font-family: "SBL Hebrew", "SBL Greek", "Noto Sans Hebrew", "Noto Sans", serif;
    line-height: 1.6;
    resize: vertical;
  }

  .edit-actions-chirho {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.3rem;
  }

  .seg-actions-chirho {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .btn-accept-chirho, .btn-edit-chirho, .btn-save-chirho, .btn-cancel-chirho {
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    border: 1px solid;
    font-size: 0.72rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-accept-chirho {
    background: #1b5e20;
    border-color: #2e7d32;
    color: #a5d6a7;
  }

  .btn-accept-chirho:hover { background: #2e7d32; }

  .btn-edit-chirho {
    background: #1a1a2e;
    border-color: #c9a84c;
    color: #c9a84c;
  }

  .btn-edit-chirho:hover { background: #2a2a4a; }

  .btn-save-chirho {
    background: #1b5e20;
    border-color: #2e7d32;
    color: #a5d6a7;
  }

  .btn-save-chirho:hover { background: #2e7d32; }

  .btn-cancel-chirho {
    background: #333;
    border-color: #555;
    color: #999;
  }

  .btn-cancel-chirho:hover { background: #444; }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
