// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

export const HUMAN_REVIEW_STYLES_CHIRHO = `    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f6f5f0; color: #243934; }
    button, textarea, input, select { font: inherit; }
    button { cursor: pointer; }
    button, select, input, textarea { border-radius: 5px; }
    button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, summary:focus-visible, a:focus-visible, [tabindex]:focus-visible { outline: 3px solid #a66319; outline-offset: 3px; }
    button:disabled { cursor: not-allowed; }
    .shell-chirho { max-width: 1540px; margin: 0 auto; padding: 28px 32px; }
    .top-chirho { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #d8d4c8; padding-bottom: 20px; }
    .title-chirho { font-family: Georgia, serif; font-size: 30px; font-weight: 500; margin: 6px 0 8px; }
    .eyebrow-chirho { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #52655c; font-weight: 700; }
    .panel-heading-chirho { font-size: 17px; font-weight: 650; margin: 0 0 5px; }
    .summary-chirho { color: #59636f; font-size: 14px; }
    .server-health-chirho { color: #59636f; font-size: 12px; overflow-wrap: anywhere; }
    .main-chirho { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(390px, 0.85fr); gap: 24px; align-items: start; }
    .line-panel-chirho { min-width: 0; display: flex; flex-direction: column; gap: 12px; position: sticky; top: 16px; }
    .review-column-chirho { min-width: 0; }
    .review-mode-nav-chirho { display: flex; gap: 6px; padding: 4px; background: #eaece4; border-radius: 7px; margin-bottom: 12px; }
    .review-mode-nav-chirho button { flex: 1; border: 1px solid transparent; background: transparent; color: #405b4f; padding: 9px; font-weight: 650; }
    .review-mode-nav-chirho button[aria-pressed="true"] { background: white; border-color: #c8d0c5; }
    [data-review-mode-chirho="text-chirho"] .repair-panel-chirho, [data-review-mode-chirho="repair-chirho"] .review-text-body-chirho { display: none; }
    .review-identity-chirho { margin-top: 12px; }
    .review-identity-chirho .box-chirho { display: grid; grid-template-columns: auto minmax(140px, 240px); gap: 4px 10px; align-items: center; padding: 0; border: 0; background: transparent; }
    .review-identity-chirho input { margin: 0; min-height: 36px; }
    .review-identity-chirho .reviewer-status-chirho { grid-column: 2; font-size: 11px; font-weight: 400; }
    .queue-tools-chirho { margin: 16px 0; border-bottom: 1px solid #deded3; padding-bottom: 14px; }
    summary { cursor: pointer; font-size: 13px; font-weight: 650; }
    .queue-tools-chirho summary span { font-size: 12px; font-weight: 400; margin-left: 16px; }
    .workspace-context-chirho { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 13px; margin-bottom: 18px; }
    #item-context-chirho { font-weight: 650; }
    .workspace-context-chirho .summary-chirho { font-size: 12px; }
    .review-footer-chirho { border-top: 1px solid #deded3; margin-top: 28px; padding-top: 16px; color: #59636f; }
    .disclosure-chirho { background: #fff; border: 1px solid #d6d9dd; border-radius: 6px; padding: 12px; min-width: 0; }
    .disclosure-chirho[open] > summary { margin-bottom: 12px; }
    .disclosure-chirho > .box-chirho { border: 0; padding: 10px 0; }
    .disclosure-chirho > div + div { margin-top: 8px; }
    .field-help-chirho { font-size: 12px; line-height: 1.5; color: #59636f; }
    .intent-actions-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .intent-actions-chirho button { min-height: 42px; padding: 8px; border: 1px solid #9caea5; color: #244e42; background: #f5f8f5; }
    .intent-actions-chirho button:hover { background: #eaf1ea; }
    .repair-panel-chirho { border-color: #b7854d; }
    .repair-grid-scroll-chirho { overflow-x: auto; }
    .repair-panel-chirho .meta-grid-chirho { grid-template-columns: minmax(0, 1fr); }
    .repair-panel-chirho select, .repair-panel-chirho textarea { width: 100%; min-width: 0; min-height: 40px; padding: 8px; box-sizing: border-box; border: 1px solid #b8bec7; }
    .image-label-chirho { color: #59636f; font-size: 13px; font-weight: 650; margin: 0 0 6px; }
    .target-image-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: auto; margin-bottom: 0; transition: border-color 120ms ease, box-shadow 120ms ease; }
    .target-image-wrap-chirho.focus-magnify-chirho { border-color: #bd7a1b; box-shadow: 0 0 0 3px rgba(189, 122, 27, 0.18); }
    .target-image-frame-chirho { position: relative; max-width: 100%; }
    .target-image-chirho { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
    .line-image-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: auto; max-height: 260px; margin-bottom: 0; }
    .line-image-frame-chirho { position: relative; }
    .line-image-chirho { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
    .span-marker-chirho { position: absolute; border: 2px solid #d23f31; background: rgba(210, 63, 49, 0.16); box-sizing: border-box; pointer-events: none; }
    .target-span-marker-chirho { pointer-events: auto; cursor: grab; touch-action: none; }
    .target-span-marker-chirho.dragging-rebox-chirho { cursor: grabbing; }
    .rebox-handle-chirho { position: absolute; top: -4px; bottom: -4px; width: 12px; border: 2px solid #9f2f25; background: rgba(255, 255, 255, 0.82); box-sizing: border-box; }
    .rebox-handle-left-chirho { left: -7px; cursor: ew-resize; }
    .rebox-handle-right-chirho { right: -7px; cursor: ew-resize; }
    .target-boundary-note-chirho { margin: -12px 0 0; border: 1px solid #d6d9dd; border-top: 0; background: #fff; color: #3d4650; font-size: 12px; line-height: 1.35; padding: 8px 10px; }
    .target-row-chirho { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .label-chirho { color: #59636f; font-size: 13px; font-weight: 650; }
    .hebrew-chirho { direction: rtl; unicode-bidi: plaintext; font-size: 32px; line-height: 1.35; background: #f7f8f4; border: 1px solid #d6d9dd; padding: 10px; min-height: 42px; }
    .span-text-chirho { direction: ltr; unicode-bidi: plaintext; font-size: 24px; line-height: 1.35; background: white; border: 1px solid #d6d9dd; padding: 12px; min-height: 52px; }
    .line-text-chirho { font-size: 17px; line-height: 1.55; background: white; border: 1px solid #d6d9dd; padding: 10px; }
    .reconstructed-line-chirho { display: flex; flex-wrap: wrap; gap: 4px 5px; align-items: baseline; white-space: normal; }
    .line-text-segment-chirho { display: inline-flex; align-items: baseline; min-height: 26px; border: 1px solid transparent; border-radius: 4px; padding: 1px 4px; unicode-bidi: plaintext; overflow-wrap: anywhere; }
    .line-text-segment-rtl-chirho { direction: rtl; }
    .line-text-segment-target-chirho { border-color: #d23f31; box-shadow: inset 0 0 0 1px rgba(210, 63, 49, 0.18); }
    .line-confidence-certain-chirho { background: #edf8f1; }
    .line-confidence-borderline-chirho { background: #fff6d7; }
    .line-confidence-questionable-chirho { background: #ffe8ec; }
    .confidence-legend-chirho { display: flex; flex-wrap: wrap; gap: 8px; color: #59636f; font-size: 12px; margin-top: -4px; }
    .confidence-legend-chip-chirho { display: inline-flex; align-items: center; gap: 4px; }
    .confidence-swatch-chirho { width: 14px; height: 14px; border: 1px solid #c8cdd3; border-radius: 3px; }
    .edit-chirho { direction: rtl; unicode-bidi: plaintext; min-height: 76px; resize: vertical; width: 100%; box-sizing: border-box; border: 1px solid #708f82; padding: 10px; background: #fff; font-size: 28px; line-height: 1.35; }
    .typewriter-chirho { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; background: #fff; border: 1px solid #d6d9dd; padding: 8px; }
    .typewriter-button-chirho { min-width: 38px; height: 34px; border: 1px solid #aab1b9; background: #fff; cursor: pointer; font-size: 20px; line-height: 1; }
    .typewriter-button-chirho:hover { background: #edf1f4; }
    .typewriter-button-chirho:focus-visible { outline: 2px solid #bd7a1b; outline-offset: 1px; }
    .toolbar-chirho { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .top-chirho .toolbar-chirho { margin-top: 0; }
    .toolbar-chirho select, .toolbar-chirho button, .toolbar-link-chirho { border: 1px solid #aab1b9; background: #fff; min-height: 34px; padding: 5px 8px; box-sizing: border-box; }
    .toolbar-link-chirho { display: inline-flex; align-items: center; color: #1f2933; text-decoration: none; font-size: 13px; }
    .toolbar-link-chirho:hover { background: #edf1f4; }
    .lane-shortcuts-chirho { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; margin-top: 10px; font-size: 12px; color: #59636f; }
    .lane-shortcuts-chirho a { color: #1f2933; text-decoration: none; border: 1px solid #c8cdd3; background: #fff; padding: 4px 7px; }
    .lane-shortcuts-chirho a:hover { background: #edf1f4; }
    .lane-shortcut-count-chirho { color: #59636f; margin-left: 4px; }
    .side-chirho { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
    .review-primary-chirho { display: grid; gap: 10px; }
    .box-chirho { border: 1px solid #d6d9dd; background: #fff; border-radius: 6px; padding: 14px; }
    .meta-grid-chirho { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; font-size: 13px; }
    .mono-chirho { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .command-chirho { overflow-wrap: anywhere; white-space: pre-wrap; }
    .command-row-chirho { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: start; }
    .copy-command-chirho { border: 1px solid #aab1b9; background: white; padding: 7px 9px; cursor: pointer; font-size: 12px; }
    .copy-command-chirho:hover { background: #edf1f4; }
    .command-helper-note-chirho { font-size: 12px; color: #59636f; }
    .segment-repair-grid-chirho { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; margin: 12px 0; }
    .repair-select-cell-chirho { display: flex; align-items: center; justify-content: center; }
    .segment-repair-row-selected-chirho input, .segment-repair-row-selected-chirho select, .segment-repair-row-selected-chirho textarea { border-color: #0b6b3a; background: #f2fbf5; }
    .segment-repair-row-chirho { display: grid; grid-template-columns: 26px minmax(0, 1fr) 34px; gap: 8px; border: 1px solid #d6d9dd; padding: 10px; border-radius: 5px; background: #fafbf8; }
    .segment-repair-row-chirho .repair-index-chirho { display: none; }
    .segment-repair-row-chirho .repair-text-chirho { grid-column: 1 / -1; font-size: 19px; }
    .repair-coordinates-chirho { grid-column: 1 / -1; padding: 6px 8px; }
    .repair-coordinates-chirho[open] { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .repair-coordinates-chirho summary { grid-column: 1 / -1; font-weight: 400; font-size: 12px; color: #59636f; }
    .repair-coordinates-chirho label { font-size: 12px; }
    .segment-repair-grid-chirho input, .segment-repair-grid-chirho select, .segment-repair-grid-chirho textarea { width: 100%; box-sizing: border-box; border: 1px solid #b8bec7; padding: 5px; min-height: 32px; }
    .segment-repair-grid-chirho textarea { resize: vertical; min-height: 34px; unicode-bidi: plaintext; }
    .segment-repair-preview-chirho { border: 1px solid #d6d9dd; background: #f8fafb; padding: 8px; min-height: 34px; unicode-bidi: plaintext; }
    .repair-tools-chirho { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
    .repair-tools-chirho button { border: 1px solid #aab1b9; background: #fff; padding: 9px 11px; cursor: pointer; min-height: 40px; }
    .repair-tools-chirho button:hover { background: #edf1f4; }
    .repair-tools-chirho select { border: 1px solid #b8bec7; background: #fff; padding: 8px; min-height: 40px; box-sizing: border-box; }
    .repair-tools-label-chirho { color: #59636f; font-size: 12px; }
    .draw-box-armed-chirho { border-color: #0b6b3a !important; background: #e8f6ee !important; font-weight: 700; }
    .target-image-frame-chirho.drawing-armed-chirho { cursor: crosshair; }
    .target-image-frame-chirho.drawing-armed-chirho .span-marker-chirho { cursor: crosshair; }
    .draw-box-band-chirho { position: absolute; top: 0; height: 100%; background: rgba(11, 107, 58, 0.22); border: 2px solid #0b6b3a; box-sizing: border-box; pointer-events: none; }
    .rebox-readout-chirho { border: 1px solid #d6d9dd; background: #f8fafb; color: #3d4650; font-size: 12px; line-height: 1.35; padding: 8px; }
    .codepoints-chirho { font-size: 12px; color: #3d4650; direction: ltr; overflow-wrap: anywhere; white-space: pre-wrap; }
    .codepoints-details-chirho { border: 1px dashed #d6d9dd; background: #fbfbfc; padding: 8px; }
    .codepoints-details-chirho summary { cursor: pointer; font-size: 12px; color: #3d4650; }
    .codepoints-details-chirho .label-chirho { margin-top: 6px; }
    .how-to-review-chirho { display: grid; gap: 6px; font-size: 14px; line-height: 1.45; }
    .candidate-words-chirho { overflow-wrap: anywhere; }
    .witness-list-chirho { display: flex; flex-direction: column; gap: 6px; font-size: 13px; margin-top: 8px; }
    .witness-chirho { border-left: 3px solid #8aa399; padding-left: 8px; }
    .warning-chirho { border-left: 4px solid #bd7a1b; background: #fff7e8; padding: 10px; font-size: 13px; color: #704000; }
    .tier-chirho { display: inline-block; padding: 2px 6px; border: 1px solid #b8bec7; background: #f5f7f8; font-size: 12px; }
    .issue-grid-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .script-grid-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .issue-option-chirho { display: flex; gap: 7px; align-items: flex-start; border: 1px solid #d6d9dd; padding: 8px; min-height: 38px; box-sizing: border-box; cursor: pointer; }
    .issue-option-chirho input { margin: 0; }
    .issue-label-text-chirho { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .issue-help-chirho { color: #59636f; font-size: 11px; line-height: 1.25; overflow-wrap: anywhere; }
    .issue-option-chirho:has(input:checked) { border-color: #bd7a1b; background: #fff7e8; }
    .clean-certify-option-chirho { display: flex; gap: 8px; align-items: flex-start; border: 1px solid #b8d5ca; background: #f2fbf7; padding: 10px; font-size: 13px; line-height: 1.35; cursor: pointer; }
    .clean-certify-option-chirho input { width: auto; margin: 3px 0 0; }
    .reviewer-input-chirho { width: 100%; box-sizing: border-box; border: 1px solid #b8bec7; padding: 8px; margin-top: 6px; }
    textarea.reviewer-input-chirho { min-height: 72px; resize: vertical; }
    .actions-chirho { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
    .actions-chirho button { border: 1px solid #aab1b9; background: #fff; padding: 10px; cursor: pointer; min-height: 42px; }
    .actions-chirho button:disabled { cursor: not-allowed; opacity: 0.55; }
    .actions-chirho button:hover { background: #edf1f4; }
    .actions-chirho .continue-chirho { color: #fff; border-color: #245c4c; background: #245c4c; font-weight: 700; }
    .actions-chirho .continue-chirho:hover { background: #194334; }
    .undo-chirho { color: #59636f; }
    .status-chirho { color: #116149; font-size: 13px; line-height: 1.5; }
    #status-chirho:not(:empty) { border-left: 3px solid #a66319; background: #fff5e5; color: #704000; padding: 10px 14px; margin-bottom: 16px; }
    .keyboard-hint-chirho { color: #59636f; font-size: 12px; line-height: 1.35; }
    .done-chirho { padding: 42px 0; color: #59636f; font-size: 18px; }
    @media (max-width: 900px) {
      .main-chirho { grid-template-columns: 1fr; }
      .line-panel-chirho { position: static; }
      .shell-chirho { padding: 18px; }
      .top-chirho { align-items: flex-start; flex-direction: column; gap: 12px; }
      .workspace-context-chirho > .summary-chirho { display: none; }
      .hebrew-chirho { font-size: 28px; }
    }
    @media (max-width: 480px) {
      .shell-chirho { padding: 16px 12px; }
      .title-chirho { font-size: 26px; }
      .issue-grid-chirho, .script-grid-chirho { grid-template-columns: 1fr; }
      .queue-filters-chirho { display: grid; grid-template-columns: 92px minmax(0, 1fr); }
      .queue-filters-chirho select, .queue-filters-chirho input { width: 100%; min-width: 0; }
      .queue-tools-chirho summary span { display: block; margin: 8px 0 0; }
      .command-row-chirho { grid-template-columns: minmax(0, 1fr); }
    }
`;
