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
    .cell button { font-size: 0.7rem; padding: 0.15rem 0.4rem; background: #1a1a2e; border: 1px solid #2a2a4a; color: #ccc; border-radius: 3px; cursor: pointer; }
    .cell button.x-btn { background: #4a1010; border-color: #dc2626; color: #fca5a5; }
    .cell button.x-btn.active { background: #dc2626; color: white; }
    .cell select { font-size: 0.7rem; padding: 0.1rem; background: #1a1a2e; border: 1px solid #2a2a4a; color: #ccc; border-radius: 3px; }
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

  <script>
  const manifest = ${JSON.stringify(manifestChirho)};
  const scriptLabels = ${JSON.stringify(SCRIPT_LABELS_CHIRHO)};
  const scriptColors = ${JSON.stringify(SCRIPT_COLORS_CHIRHO)};
  const columnsByScript = ['latin-chirho','hebrew-chirho','greek-chirho','symbol-chirho'];

  const state = manifest.itemsChirho.map(it => ({
    item: it,
    finalScript: it.predictedScriptChirho,
    wrong: false,
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
      const items = state.filter(s => s.item.predictedScriptChirho === script);
      const correctCount = items.filter(s => !s.wrong).length;
      const h2 = el('h2', { text: scriptLabels[script] + ' · ' + correctCount + '/' + items.length, style: 'border-bottom-color:' + scriptColors[script] });
      colDiv.appendChild(h2);
      for (const s of items) {
        const cell = el('div', { cls: 'cell' + (s.wrong ? ' wrong' : '') });
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

        const actions = el('div', { cls: 'actions' });
        const xBtn = el('button', {
          cls: 'x-btn' + (s.wrong ? ' active' : ''),
          text: s.wrong ? '↺ keep' : '✕ wrong',
          attrs: { 'data-action': 'toggle-wrong', 'data-id': String(s.item.wordIdChirho) },
        });
        actions.appendChild(xBtn);
        const sel = el('select', { attrs: { 'data-action': 'reclassify', 'data-id': String(s.item.wordIdChirho) } });
        for (const c of columnsByScript) {
          const opt = el('option', { text: scriptLabels[c], attrs: { value: c } });
          if (s.finalScript === c) opt.selected = true;
          sel.appendChild(opt);
        }
        actions.appendChild(sel);
        cell.appendChild(actions);

        colDiv.appendChild(cell);
      }
      columns.appendChild(colDiv);
    }
    document.getElementById('counts').textContent = state.length + ' items · ' + state.filter(s => !s.wrong).length + ' kept';
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'toggle-wrong') {
      const s = state.find(x => x.item.wordIdChirho == btn.dataset.id);
      if (s) { s.wrong = !s.wrong; render(); }
    }
  });
  document.addEventListener('change', e => {
    if (e.target.tagName === 'SELECT' && e.target.dataset.action === 'reclassify') {
      const s = state.find(x => x.item.wordIdChirho == e.target.dataset.id);
      if (s) { s.finalScript = e.target.value; render(); }
    }
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
      }));
    try {
      const r = await fetch('/submit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ runIdChirho: manifest.runIdChirho, labelsChirho: payload }) });
      const j = await r.json();
      if (j.okChirho) {
        status.textContent = 'Saved ' + j.insertedChirho + ' labels, ' + j.skippedChirho + ' already-present';
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

const insertStmtChirho = dbChirho.prepare(
  `INSERT OR IGNORE INTO training_pairs_chirho
    (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
     line_idx_chirho, word_idx_chirho,
     x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
     crop_path_chirho, text_chirho, script_chirho, source_chirho,
     certainty_chirho, tesseract_was_chirho)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'human-chirho', NULL, ?)`
);

Bun.serve({
  port: PORT_CHIRHO,
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
          }>;
        };
        let insertedChirho = 0;
        let skippedChirho = 0;
        for (const labelChirho of bodyChirho.labelsChirho) {
          const cropPathChirho = join(batchDirChirho, labelChirho.cropFileChirho);
          const resChirho = insertStmtChirho.run(
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
          else insertedChirho++;
        }
        return new Response(JSON.stringify({ okChirho: true, insertedChirho, skippedChirho }), {
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
