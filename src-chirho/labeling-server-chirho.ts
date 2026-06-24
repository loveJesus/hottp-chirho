// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Localhost labeling server for active classifier improvement.
 *
 * Reads a pre-prepared batch (produced by prepare_labeling_batch_chirho.py),
 * serves a grid view in the browser where each row is a word crop + the v3
 * classifier's predicted script + a dropdown to override. The user X's wrong
 * ones, optionally re-classifies, then submits. Submissions become
 * training_pairs_chirho rows with source='human-chirho'.
 *
 * Run:
 *   bun src-chirho/labeling-server-chirho.ts
 * Then open http://localhost:8765/ in a browser.
 *
 * Pick a batch with --batch=<dir-name>, or it auto-picks the most recent.
 */

import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const PORT_CHIRHO = 8765;
const BATCHES_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "labeling-batches-chirho");
const DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");

interface ManifestItemChirho {
  wordIdChirho: number;
  scanlineIdChirho: number;
  pageIdChirho: number;
  volChirho: number;
  pageNumChirho: number;
  lineIdxChirho: number;
  wordIdxChirho: number;
  bboxChirho: { xMinChirho: number; yMinChirho: number; xMaxChirho: number; yMaxChirho: number };
  cropFileChirho: string;
  tesseractTextChirho: string;
  predictedClassChirho: string;
  predictedScriptChirho: string;
  predictedConfidenceChirho: number;
  allProbsChirho: Record<string, number>;
}

interface ManifestChirho {
  runIdChirho: string;
  modelChirho: string;
  classNamesChirho: string[];
  createdAtChirho: string;
  itemsChirho: ManifestItemChirho[];
}

const argsChirho = process.argv.slice(2);
const explicitBatchChirho = argsChirho.find((aChirho) => aChirho.startsWith("--batch="))?.split("=")[1];

function pickBatchChirho(): string {
  if (explicitBatchChirho) return join(BATCHES_DIR_CHIRHO, explicitBatchChirho);
  const candidatesChirho = readdirSync(BATCHES_DIR_CHIRHO).filter((nChirho) => nChirho.startsWith("batch-")).sort();
  if (candidatesChirho.length === 0) {
    console.error(`No batches found in ${BATCHES_DIR_CHIRHO}. Run prepare_labeling_batch_chirho.py first.`);
    process.exit(1);
  }
  return join(BATCHES_DIR_CHIRHO, candidatesChirho[candidatesChirho.length - 1]!);
}

const batchDirChirho = pickBatchChirho();
const manifestPathChirho = join(batchDirChirho, "manifest-chirho.json");
if (!existsSync(manifestPathChirho)) {
  console.error(`manifest not found: ${manifestPathChirho}`);
  process.exit(1);
}
const manifestChirho = JSON.parse(await Bun.file(manifestPathChirho).text()) as ManifestChirho;
console.log(`Loaded batch ${manifestChirho.runIdChirho} with ${manifestChirho.itemsChirho.length} items`);

const dbChirho = new Database(DB_PATH_CHIRHO);

const SCRIPT_LABELS_CHIRHO: Record<string, string> = {
  "latin-chirho": "Latin/French",
  "hebrew-chirho": "Hebrew",
  "greek-chirho": "Greek",
  "symbol-chirho": "Symbol/Siglum",
  "latin-non-french-chirho": "Latin (non-French)",
  "syriac-chirho": "Syriac",
  "arabic-chirho": "Arabic",
  "unknown-chirho": "Unknown",
};

const SCRIPT_COLORS_CHIRHO: Record<string, string> = {
  "latin-chirho": "#c9a84c",
  "hebrew-chirho": "#e34a4a",
  "greek-chirho": "#4cc24c",
  "symbol-chirho": "#ddc81e",
  "syriac-chirho": "#a050c8",
  "arabic-chirho": "#b47828",
  "unknown-chirho": "#888888",
};

// All DOM in the page is built via createElement/textContent — never
// innerHTML — so user-supplied tesseract text can't break out into HTML.
const indexHtmlChirho = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>HOTTP Script Labeling</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a14; color: #e0e0e0; margin: 0; padding: 1rem; }
    h1 { font-size: 1.1rem; color: #c9a84c; }
    .meta { font-size: 0.8rem; color: #888; }
    .columns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 1rem; }
    .column { background: #12121f; border: 1px solid #2a2a4a; border-radius: 6px; padding: 0.5rem; min-height: 40rem; }
    .column h2 { font-size: 0.85rem; color: #c9a84c; margin: 0 0 0.5rem 0; padding-bottom: 0.3rem; border-bottom: 1px solid #2a2a4a; }
    .cell { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.45rem; margin-bottom: 0.4rem; background: #0a0a14; border: 1px solid #2a2a4a; border-radius: 4px; }
    .cell.wrong { background: rgba(220, 38, 38, 0.18); border-color: #dc2626; opacity: 0.6; }
    .cell .crop { background: white; padding: 4px; border-radius: 3px; }
    .cell img { display: block; image-rendering: -webkit-optimize-contrast; max-width: 100%; }
    .cell .meta-row { display: flex; gap: 0.3rem; font-size: 0.7rem; color: #888; align-items: center; flex-wrap: wrap; }
    .cell .tess { color: #aaa; font-family: ui-monospace, "SF Mono", monospace; font-size: 0.8rem; }
    .cell .conf { background: #1a1a2e; padding: 0.05rem 0.3rem; border-radius: 3px; }
    .cell .actions { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    .cell button { font-size: 0.7rem; padding: 0.15rem 0.4rem; background: #1a1a2e; border: 1px solid #2a2a4a; color: #ccc; border-radius: 3px; cursor: pointer; transition: opacity 0.1s; }
    /* Color-coded script buttons. Inactive: faint tinted background. Active:
       full saturation + light text. One click sets finalScript. */
    .cell .script-btn { font-weight: 600; }
    .cell .script-btn[data-script='latin-chirho']  { background: color-mix(in srgb, #c9a84c 20%, #1a1a2e); border-color: #c9a84c; color: #c9a84c; }
    .cell .script-btn[data-script='hebrew-chirho'] { background: color-mix(in srgb, #e34a4a 20%, #1a1a2e); border-color: #e34a4a; color: #e34a4a; }
    .cell .script-btn[data-script='greek-chirho']  { background: color-mix(in srgb, #4cc24c 20%, #1a1a2e); border-color: #4cc24c; color: #4cc24c; }
    .cell .script-btn[data-script='symbol-chirho'] { background: color-mix(in srgb, #ddc81e 20%, #1a1a2e); border-color: #ddc81e; color: #ddc81e; }
    .cell .script-btn.active[data-script='latin-chirho']  { background: #c9a84c; color: #1a1a2e; }
    .cell .script-btn.active[data-script='hebrew-chirho'] { background: #e34a4a; color: white; }
    .cell .script-btn.active[data-script='greek-chirho']  { background: #4cc24c; color: #1a1a2e; }
    .cell .script-btn.active[data-script='symbol-chirho'] { background: #ddc81e; color: #1a1a2e; }
    .cell button.x-btn { background: #4a1010; border-color: #dc2626; color: #fca5a5; }
    .cell button.x-btn.active { background: #dc2626; color: white; }
    .cell button.bbox-btn { background: #3a2c08; border-color: #f59e0b; color: #fbbf24; }
    .cell button.bbox-btn.active { background: #f59e0b; color: #1a1a2e; }
    .cell .codepoint-hint { font-size: 0.65rem; color: #888; }
    .cell.disagree { box-shadow: 0 0 0 2px #f59e0b inset; }
    .cell.reclassified { box-shadow: 0 0 0 2px #2563eb inset; }
    /* Column header bulk-action buttons. Click one to set finalScript on every
       item currently in that column to the chosen target. */
    .col-bulk { display: flex; gap: 0.2rem; flex-wrap: wrap; margin: 0 0 0.45rem 0; padding-bottom: 0.35rem; border-bottom: 1px dashed #2a2a4a; }
    .col-bulk .bulk-label { font-size: 0.65rem; color: #888; align-self: center; margin-right: 0.2rem; }
    .col-bulk button { font-size: 0.65rem; padding: 0.12rem 0.4rem; border-radius: 3px; cursor: pointer; border: 1px solid #2a2a4a; }
    .col-bulk button[data-target='latin-chirho']  { background: color-mix(in srgb, #c9a84c 30%, #1a1a2e); color: #c9a84c; border-color: #c9a84c; }
    .col-bulk button[data-target='hebrew-chirho'] { background: color-mix(in srgb, #e34a4a 30%, #1a1a2e); color: #fca5a5; border-color: #e34a4a; }
    .col-bulk button[data-target='greek-chirho']  { background: color-mix(in srgb, #4cc24c 30%, #1a1a2e); color: #4cc24c; border-color: #4cc24c; }
    .col-bulk button[data-target='symbol-chirho'] { background: color-mix(in srgb, #ddc81e 30%, #1a1a2e); color: #ddc81e; border-color: #ddc81e; }
    /* Line context popup on hover — appears beside the cell when you hover */
    .line-popup {
      position: fixed; z-index: 1000;
      background: white; border: 2px solid #c9a84c;
      padding: 4px; border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.7);
      pointer-events: none;
      max-width: 90vw;
      display: none;
    }
    .line-popup img { display: block; max-width: 100%; max-height: 80px; image-rendering: -webkit-optimize-contrast; }
    .line-popup .word-marker {
      position: absolute; top: 4px; bottom: 4px;
      border: 2px solid #dc2626; pointer-events: none;
      background: rgba(220, 38, 38, 0.15);
    }
    .line-popup-wrap { position: relative; display: inline-block; }
    .toolbar { position: sticky; top: 0; background: #0d0d18; padding: 0.75rem 1rem; border-bottom: 1px solid #2a2a4a; margin: -1rem -1rem 0 -1rem; z-index: 100; display: flex; gap: 1rem; align-items: center; }
    .toolbar button { padding: 0.4rem 1rem; background: #1b5e20; border: 1px solid #2e7d32; color: #a5d6a7; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .toolbar .counts { color: #888; font-size: 0.8rem; }
    #status { color: #4ade80; font-size: 0.8rem; }
    #status.error { color: #fca5a5; }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>HOTTP Script Labeling</strong>
    <span class="counts" id="counts"></span>
    <button id="submit-btn">Submit labels</button>
    <span id="status"></span>
  </div>
  <p class="meta" id="manifest-meta"></p>
  <div class="columns" id="columns"></div>
  <div class="line-popup" id="line-popup"><div class="line-popup-wrap"><img id="line-popup-img" alt=""><div class="word-marker" id="line-popup-marker"></div></div></div>

  <script>
  const manifest = ${JSON.stringify(manifestChirho)};
  const scriptLabels = ${JSON.stringify(SCRIPT_LABELS_CHIRHO)};
  const scriptColors = ${JSON.stringify(SCRIPT_COLORS_CHIRHO)};
  const columnsByScript = ['latin-chirho','hebrew-chirho','greek-chirho','symbol-chirho'];

  const state = manifest.itemsChirho.map(it => ({
    item: it,
    finalScript: it.predictedScriptChirho,
    wrong: false,
    badBbox: false,
  }));

  function el(tag, opts, children) {
    const e = document.createElement(tag);
    if (opts) {
      if (opts.cls) e.className = opts.cls;
      if (opts.text != null) e.textContent = opts.text;
      if (opts.attrs) for (const k of Object.keys(opts.attrs)) e.setAttribute(k, opts.attrs[k]);
      if (opts.style) e.setAttribute('style', opts.style);
    }
    if (children) for (const c of children) if (c) e.appendChild(c);
    return e;
  }

  function render() {
    const columns = document.getElementById('columns');
    while (columns.firstChild) columns.removeChild(columns.firstChild);
    for (const script of columnsByScript) {
      const colDiv = el('div', { cls: 'column' });
      // Group by FINAL script — cells move to their corrected column as you
      // re-label. Previously grouped by predictedScriptChirho which kept Greek
      // misclassifications hidden in the Latin column.
      const items = state.filter(s => s.finalScript === script);
      const correctCount = items.filter(s => !s.wrong).length;
      const h2 = el('h2', { text: scriptLabels[script] + ' · ' + correctCount + '/' + items.length, style: 'border-bottom-color:' + scriptColors[script] });
      colDiv.appendChild(h2);
      // Bulk-action row: set every item in this column to a chosen target. Use
      // when an entire column is mostly mis-classified (e.g. 49 of 50 'Symbol'
      // predictions are actually Latin words/digits).
      const bulk = el('div', { cls: 'col-bulk' });
      bulk.appendChild(el('span', { cls: 'bulk-label', text: 'Set all →' }));
      for (const tgt of columnsByScript) {
        if (tgt === script) continue;
        const b = el('button', {
          text: scriptLabels[tgt],
          attrs: { 'data-action': 'bulk-set', 'data-source-col': script, 'data-target': tgt },
        });
        bulk.appendChild(b);
      }
      colDiv.appendChild(bulk);
      for (const s of items) {
        // Highlight cells: amber if prediction disagrees with codepoints,
        // blue if user has re-classified away from the model's prediction.
        const disagreeFlag = s.item.codepointDisagreesChirho ? ' disagree' : '';
        const reclassifiedFlag = s.finalScript !== s.item.predictedScriptChirho ? ' reclassified' : '';
        const cellCls = 'cell' + (s.wrong ? ' wrong' : '') + disagreeFlag + reclassifiedFlag;
        const cell = el('div', { cls: cellCls });
        if (s.item.lineCropChirho) {
          cell.setAttribute('data-line-crop', s.item.lineCropChirho.fileChirho);
          cell.setAttribute('data-line-x-min', String(s.item.lineCropChirho.xMinChirho));
          cell.setAttribute('data-line-width', String(s.item.lineCropChirho.widthChirho));
          cell.setAttribute('data-line-pad', String(s.item.lineCropChirho.padChirho));
          cell.setAttribute('data-word-x-min', String(s.item.bboxChirho.xMinChirho));
          cell.setAttribute('data-word-x-max', String(s.item.bboxChirho.xMaxChirho));
        }
        const cropWrap = el('div', { cls: 'crop' });
        const img = el('img', { attrs: { src: '/crop/' + s.item.cropFileChirho, alt: '' } });
        cropWrap.appendChild(img);
        cell.appendChild(cropWrap);

        const meta1 = el('div', { cls: 'meta-row' }, [
          el('span', { cls: 'tess', text: s.item.tesseractTextChirho || '—' }),
          el('span', { cls: 'conf', text: (s.item.predictedConfidenceChirho * 100).toFixed(0) + '%' }),
        ]);
        cell.appendChild(meta1);

        const meta2 = el('div', { cls: 'meta-row', text: 'vol ' + s.item.volChirho + ' p' + s.item.pageNumChirho + ' line ' + s.item.lineIdxChirho });
        cell.appendChild(meta2);

        // Show codepoint-detected script as a hint if it disagrees with model.
        if (s.item.codepointDisagreesChirho) {
          const hint = el('div', { cls: 'codepoint-hint', text: 'codepoints look ' + s.item.codepointClassChirho });
          cell.appendChild(hint);
        }

        // Color-coded script buttons (one per class). Click sets finalScript.
        const scriptBtns = el('div', { cls: 'actions' });
        for (const c of columnsByScript) {
          const btn = el('button', {
            cls: 'script-btn' + (s.finalScript === c ? ' active' : ''),
            text: scriptLabels[c],
            attrs: { 'data-action': 'set-script', 'data-id': String(s.item.wordIdChirho), 'data-script': c },
          });
          scriptBtns.appendChild(btn);
        }
        cell.appendChild(scriptBtns);

        // Secondary actions row: drop entirely, or flag bbox as bad.
        const otherBtns = el('div', { cls: 'actions' });
        const xBtn = el('button', {
          cls: 'x-btn' + (s.wrong ? ' active' : ''),
          text: s.wrong ? '↺ keep' : '✕ drop',
          attrs: { 'data-action': 'toggle-wrong', 'data-id': String(s.item.wordIdChirho) },
        });
        otherBtns.appendChild(xBtn);
        const bboxBtn = el('button', {
          cls: 'bbox-btn' + (s.badBbox ? ' active' : ''),
          text: s.badBbox ? '↺ bbox ok' : '✂ bad bbox',
          attrs: { 'data-action': 'toggle-bbox', 'data-id': String(s.item.wordIdChirho) },
        });
        otherBtns.appendChild(bboxBtn);
        cell.appendChild(otherBtns);

        colDiv.appendChild(cell);
      }
      columns.appendChild(colDiv);
    }
    document.getElementById('counts').textContent = state.length + ' items · ' + state.filter(s => !s.wrong).length + ' kept';
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'bulk-set') {
      // Move every item currently displayed in the source column to the target
      // script. Useful when a whole column is mostly mis-classified.
      const sourceCol = btn.dataset.sourceCol;
      const target = btn.dataset.target;
      let n = 0;
      for (const s of state) {
        if (s.finalScript === sourceCol) { s.finalScript = target; n++; }
      }
      if (n > 0) render();
      return;
    }
    const s = state.find(x => x.item.wordIdChirho == btn.dataset.id);
    if (!s) return;
    if (btn.dataset.action === 'toggle-wrong') {
      s.wrong = !s.wrong;
    } else if (btn.dataset.action === 'toggle-bbox') {
      s.badBbox = !s.badBbox;
    } else if (btn.dataset.action === 'set-script') {
      s.finalScript = btn.dataset.script;
    }
    render();
  });

  // Line context hover: show the cropped scanline strip in a fixed popup with
  // a red marker over the word's position within the line.
  const popup = document.getElementById('line-popup');
  const popupImg = document.getElementById('line-popup-img');
  const popupMarker = document.getElementById('line-popup-marker');
  document.addEventListener('mouseover', e => {
    const cell = e.target.closest('.cell[data-line-crop]');
    if (!cell) return;
    const file = cell.getAttribute('data-line-crop');
    const lineXMin = parseFloat(cell.getAttribute('data-line-x-min') || '0');
    const lineWidth = parseFloat(cell.getAttribute('data-line-width') || '1');
    const linePad = parseFloat(cell.getAttribute('data-line-pad') || '0');
    const wordXMin = parseFloat(cell.getAttribute('data-word-x-min') || '0');
    const wordXMax = parseFloat(cell.getAttribute('data-word-x-max') || '0');
    popupImg.src = '/crop/' + file;
    popupImg.onload = () => {
      // Compute marker position as a percentage of the rendered line image.
      // The line crop spans (lineXMin - linePad) to (lineXMin + lineWidth + linePad)
      // in page-pixel coords. Map word bbox into that range.
      const lineSpan = lineWidth + linePad * 2;
      const wordLeftInLine = (wordXMin - (lineXMin - linePad)) / lineSpan;
      const wordWidthInLine = (wordXMax - wordXMin) / lineSpan;
      const imgWidth = popupImg.offsetWidth || popupImg.naturalWidth;
      popupMarker.style.left = (wordLeftInLine * imgWidth + 4) + 'px';
      popupMarker.style.width = (wordWidthInLine * imgWidth) + 'px';
    };
    const rect = cell.getBoundingClientRect();
    popup.style.left = Math.max(8, rect.left) + 'px';
    popup.style.top = (rect.bottom + 6) + 'px';
    popup.style.display = 'block';
  });
  document.addEventListener('mouseout', e => {
    const cell = e.target.closest('.cell');
    const related = e.relatedTarget;
    if (cell && related && cell.contains(related)) return;
    popup.style.display = 'none';
  });

  document.getElementById('submit-btn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.className = '';
    status.textContent = 'Submitting…';
    const payload = state
      .filter(s => !s.wrong)
      .map(s => ({
        wordIdChirho: s.item.wordIdChirho,
        scanlineIdChirho: s.item.scanlineIdChirho,
        pageIdChirho: s.item.pageIdChirho,
        volChirho: s.item.volChirho,
        pageNumChirho: s.item.pageNumChirho,
        lineIdxChirho: s.item.lineIdxChirho,
        wordIdxChirho: s.item.wordIdxChirho,
        bboxChirho: s.item.bboxChirho,
        cropFileChirho: s.item.cropFileChirho,
        textChirho: s.item.tesseractTextChirho,
        scriptChirho: s.finalScript,
        modelPredictedScriptChirho: s.item.predictedScriptChirho,
        modelConfidenceChirho: s.item.predictedConfidenceChirho,
        badBboxChirho: s.badBbox,
      }));
    try {
      const r = await fetch('/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ runIdChirho: manifest.runIdChirho, labelsChirho: payload }) });
      const j = await r.json();
      if (j.okChirho) {
        status.textContent = 'Saved ' + j.insertedChirho + ' labels, ' + j.badBboxCountChirho + ' bad-bbox flags, ' + j.skippedChirho + ' already-present';
      } else {
        status.className = 'error';
        status.textContent = 'Error: ' + (j.errorChirho || 'unknown');
      }
    } catch (err) {
      status.className = 'error';
      status.textContent = 'Network error: ' + err.message;
    }
  });

  document.getElementById('manifest-meta').textContent =
    'batch ' + manifest.runIdChirho + ' · model ' + manifest.modelChirho + ' · created ' + manifest.createdAtChirho;
  render();
  </script>
</body>
</html>`;

// Two distinct insert paths: clean human labels go to source='human-chirho';
// bad-bbox flags go to source='human-bad-bbox-chirho' so the re-segmentation
// pipeline can query them later without polluting the training set.
const insertHumanStmtChirho = dbChirho.prepare(
  `INSERT OR IGNORE INTO training_pairs_chirho
    (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
     line_idx_chirho, word_idx_chirho,
     x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
     crop_path_chirho, text_chirho, script_chirho, source_chirho,
     certainty_chirho, tesseract_was_chirho)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'human-chirho', NULL, ?)`
);
const insertBadBboxStmtChirho = dbChirho.prepare(
  `INSERT OR IGNORE INTO training_pairs_chirho
    (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
     line_idx_chirho, word_idx_chirho,
     x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
     crop_path_chirho, text_chirho, script_chirho, source_chirho,
     certainty_chirho, tesseract_was_chirho)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'human-bad-bbox-chirho', NULL, ?)`
);

Bun.serve({
  port: PORT_CHIRHO,
  hostname: "127.0.0.1",
  async fetch(reqChirho: Request) {
    const urlChirho = new URL(reqChirho.url);
    if (urlChirho.pathname === "/") {
      return new Response(indexHtmlChirho, { headers: { "Content-Type": "text/html" } });
    }
    if (urlChirho.pathname.startsWith("/crop/")) {
      const fileChirho = urlChirho.pathname.slice("/crop/".length);
      const pathChirho = join(batchDirChirho, fileChirho);
      if (!existsSync(pathChirho)) return new Response("not found", { status: 404 });
      return new Response(Bun.file(pathChirho));
    }
    if (urlChirho.pathname === "/submit" && reqChirho.method === "POST") {
      try {
        const bodyChirho = (await reqChirho.json()) as {
          runIdChirho: string;
          labelsChirho: Array<{
            wordIdChirho: number;
            scanlineIdChirho: number;
            pageIdChirho: number;
            volChirho: number;
            pageNumChirho: number;
            lineIdxChirho: number;
            wordIdxChirho: number;
            bboxChirho: { xMinChirho: number; yMinChirho: number; xMaxChirho: number; yMaxChirho: number };
            cropFileChirho: string;
            textChirho: string;
            scriptChirho: string;
            modelPredictedScriptChirho: string;
            modelConfidenceChirho: number;
            badBboxChirho: boolean;
          }>;
        };
        let insertedChirho = 0;
        let badBboxCountChirho = 0;
        let skippedChirho = 0;
        for (const labelChirho of bodyChirho.labelsChirho) {
          const cropPathChirho = join(batchDirChirho, labelChirho.cropFileChirho);
          const stmtChirho = labelChirho.badBboxChirho ? insertBadBboxStmtChirho : insertHumanStmtChirho;
          const resChirho = stmtChirho.run(
            labelChirho.wordIdChirho,
            labelChirho.scanlineIdChirho,
            labelChirho.pageIdChirho,
            labelChirho.volChirho,
            labelChirho.pageNumChirho,
            labelChirho.lineIdxChirho,
            labelChirho.wordIdxChirho,
            labelChirho.bboxChirho.xMinChirho,
            labelChirho.bboxChirho.yMinChirho,
            labelChirho.bboxChirho.xMaxChirho,
            labelChirho.bboxChirho.yMaxChirho,
            cropPathChirho,
            labelChirho.textChirho,
            labelChirho.scriptChirho,
            labelChirho.modelPredictedScriptChirho,
          );
          if (resChirho.changes === 0) skippedChirho++;
          else if (labelChirho.badBboxChirho) badBboxCountChirho++;
          else insertedChirho++;
        }
        return new Response(JSON.stringify({ okChirho: true, insertedChirho, badBboxCountChirho, skippedChirho }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (errChirho) {
        return new Response(
          JSON.stringify({ okChirho: false, errorChirho: String(errChirho) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`Labeling server: http://localhost:${PORT_CHIRHO}/`);
