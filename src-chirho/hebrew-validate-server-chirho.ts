// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Binary Hebrew accept/reject UI. One word at a time, big crop image + line
 * context, three keys:
 *   Y  → script=hebrew-chirho (Hebrew)
 *   L  → script=latin-chirho  (not Hebrew, probably Latin)
 *   O  → script=symbol-chirho (not Hebrew, looks like sigil/symbol)
 *   S  → skip
 * Auto-advance after each decision. Submit-on-keystroke; no batch button.
 *
 * Reads the most recent labeling-batches-chirho/batch-* manifest (which can
 * be a hebrew-only filtered batch produced by prepare_labeling_batch_chirho.py
 * with --only-script=hebrew-chirho).
 *
 * Run:
 *   bun src-chirho/hebrew-validate-server-chirho.ts
 */

import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";
import { spawnSync } from "child_process";
import { tmpdir } from "os";

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
  codepointClassChirho: string;
  codepointDisagreesChirho: boolean;
  allProbsChirho: Record<string, number>;
}

const argsChirho = process.argv.slice(2);
const explicitBatchChirho = argsChirho.find((aChirho) => aChirho.startsWith("--batch="))?.split("=")[1];

function pickBatchChirho(): string {
  if (explicitBatchChirho) return join(BATCHES_DIR_CHIRHO, explicitBatchChirho);
  const candidatesChirho = readdirSync(BATCHES_DIR_CHIRHO).filter((nChirho) => nChirho.startsWith("batch-")).sort();
  if (candidatesChirho.length === 0) {
    console.error("No batches found");
    process.exit(1);
  }
  return join(BATCHES_DIR_CHIRHO, candidatesChirho[candidatesChirho.length - 1]!);
}

const batchDirChirho = pickBatchChirho();
const manifestChirho = JSON.parse(await Bun.file(join(batchDirChirho, "manifest-chirho.json")).text()) as {
  itemsChirho: ManifestItemChirho[];
  runIdChirho: string;
};
console.log(`Loaded ${manifestChirho.runIdChirho}: ${manifestChirho.itemsChirho.length} items`);

const dbChirho = new Database(DB_PATH_CHIRHO);

const lineContextStmtChirho = dbChirho.prepare(
  `SELECT w.x_min_chirho AS w_x_min, w.x_max_chirho AS w_x_max,
          s.x_min_chirho AS s_x_min, s.y_min_chirho AS s_y_min,
          s.width_chirho AS s_w, s.height_chirho AS s_h,
          p.volume_number_chirho AS vol, p.page_number_chirho AS page_num
     FROM words_chirho w
     JOIN scanlines_chirho s ON s.id_chirho = w.scanline_id_chirho
     JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
     WHERE w.id_chirho = ?`
);

const insertStmtChirho = dbChirho.prepare(
  `INSERT OR IGNORE INTO training_pairs_chirho
    (word_id_chirho, scanline_id_chirho, page_id_chirho, vol_chirho, page_num_chirho,
     line_idx_chirho, word_idx_chirho,
     x_min_chirho, y_min_chirho, x_max_chirho, y_max_chirho,
     crop_path_chirho, text_chirho, script_chirho, source_chirho,
     certainty_chirho, tesseract_was_chirho)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'human-chirho', NULL, ?)`
);

const logStepStmtChirho = dbChirho.prepare(
  `INSERT INTO steps_taken_chirho (agent_code_chirho, timestamp_start_chirho, timestamp_end_chirho, action_taken_chirho, result_of_action_chirho, overview_of_result_chirho) VALUES (?,?,?,?,?,?)`
);

const indexHtmlChirho = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>HOTTP Hebrew validate</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a14; color: #e0e0e0; margin: 0; padding: 1rem; }
    .toolbar { position: sticky; top: 0; background: #0d0d18; padding: 0.6rem 1rem; border-bottom: 1px solid #2a2a4a; margin: -1rem -1rem 0 -1rem; z-index: 100; display: flex; gap: 0.8rem; align-items: center; }
    .toolbar strong { color: #c9a84c; }
    .progress { color: #888; font-size: 0.85rem; }
    .stats { color: #aaa; font-size: 0.8rem; }
    .stats .yes { color: #e34a4a; font-weight: 600; }
    .stats .no { color: #c9a84c; font-weight: 600; }
    .stage { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1.5rem; max-width: 1100px; margin-left: auto; margin-right: auto; }
    .crop-wrap { background: white; padding: 12px; border-radius: 6px; text-align: center; }
    .crop-wrap img { display: block; image-rendering: -webkit-optimize-contrast; max-height: 220px; margin: 0 auto; }
    .meta { text-align: center; color: #aaa; font-size: 0.85rem; margin-top: 0.5rem; }
    .meta .tess { font-family: ui-monospace, "SF Mono", monospace; color: #ccc; }
    .meta .prob { color: #e34a4a; font-weight: 600; }
    .line-wrap { background: white; padding: 4px; border-radius: 4px; position: relative; overflow: auto; max-width: 100%; }
    .line-wrap img { display: block; max-width: 100%; image-rendering: -webkit-optimize-contrast; }
    .line-marker { position: absolute; top: 4px; bottom: 4px; border: 2px solid #dc2626; background: rgba(220,38,38,0.18); pointer-events: none; }
    .actions { display: flex; gap: 0.8rem; justify-content: center; margin-top: 0.6rem; flex-wrap: wrap; }
    .actions button { font-size: 1.05rem; font-weight: 700; padding: 0.7rem 1.3rem; border-radius: 5px; cursor: pointer; border: 2px solid; min-width: 9rem; }
    .btn-yes { background: #4a1010; border-color: #e34a4a; color: #fca5a5; }
    .btn-yes:hover { background: #e34a4a; color: #1a1a2e; }
    .btn-no  { background: #2c2c08; border-color: #c9a84c; color: #c9a84c; }
    .btn-no:hover { background: #c9a84c; color: #1a1a2e; }
    .btn-sym { background: #2c2c08; border-color: #ddc81e; color: #ddc81e; }
    .btn-sym:hover { background: #ddc81e; color: #1a1a2e; }
    .btn-skip { background: #1a1a2e; border-color: #2a2a4a; color: #888; }
    .keys { color: #888; font-size: 0.75rem; text-align: center; margin-top: 0.4rem; }
    .keys kbd { display: inline-block; padding: 0.05rem 0.35rem; background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 3px; font-family: ui-monospace, monospace; color: #c9a84c; }
    #status { color: #4ade80; font-size: 0.85rem; }
    #status.error { color: #fca5a5; }
    .done { text-align: center; padding: 4rem 1rem; font-size: 1.2rem; color: #888; }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>Hebrew validate</strong>
    <span class="progress" id="progress"></span>
    <span class="stats" id="stats"></span>
    <span id="status"></span>
  </div>
  <div class="stage" id="stage"></div>

  <script>
  const manifest = ${JSON.stringify(manifestChirho)};
  let idx = 0;
  let counts = { hebrew: 0, latin: 0, symbol: 0, skip: 0 };

  function el(tag, opts, children) {
    const e = document.createElement(tag);
    if (opts) {
      if (opts.cls) e.className = opts.cls;
      if (opts.text != null) e.textContent = opts.text;
      if (opts.id) e.id = opts.id;
      if (opts.attrs) for (const k of Object.keys(opts.attrs)) e.setAttribute(k, opts.attrs[k]);
      if (opts.style) e.setAttribute('style', opts.style);
    }
    if (children) for (const c of children) if (c) e.appendChild(c);
    return e;
  }

  function clearNode(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  function update() {
    const total = manifest.itemsChirho.length;
    document.getElementById('progress').textContent = (idx + 1) + ' / ' + total;
    const s = document.getElementById('stats');
    clearNode(s);
    s.appendChild(document.createTextNode('Hebrew: '));
    s.appendChild(el('span', { cls: 'yes', text: String(counts.hebrew) }));
    s.appendChild(document.createTextNode(' · Latin: '));
    s.appendChild(el('span', { cls: 'no', text: String(counts.latin) }));
    s.appendChild(document.createTextNode(' · Symbol: ' + counts.symbol + ' · Skipped: ' + counts.skip));
  }

  function render() {
    const stage = document.getElementById('stage');
    clearNode(stage);
    if (idx >= manifest.itemsChirho.length) {
      const doneDiv = el('div', { cls: 'done' });
      doneDiv.appendChild(document.createTextNode('Done — labeled '));
      doneDiv.appendChild(el('span', { cls: 'yes', text: String(counts.hebrew) }));
      doneDiv.appendChild(document.createTextNode(' Hebrew, '));
      doneDiv.appendChild(el('span', { cls: 'no', text: String(counts.latin) }));
      doneDiv.appendChild(document.createTextNode(' Latin, ' + counts.symbol + ' Symbol, ' + counts.skip + ' skipped.'));
      stage.appendChild(doneDiv);
      update();
      return;
    }
    const item = manifest.itemsChirho[idx];
    const cropWrap = el('div', { cls: 'crop-wrap' });
    const img = el('img', { attrs: { src: '/crop/' + item.cropFileChirho + '?t=' + Date.now(), alt: '' } });
    cropWrap.appendChild(img);
    stage.appendChild(cropWrap);

    const meta = el('div', { cls: 'meta' });
    meta.appendChild(el('span', { cls: 'tess', text: 'tesseract: "' + item.tesseractTextChirho + '"' }));
    meta.appendChild(el('span', { cls: 'prob', text: '  ·  p(hebrew) = ' + (item.allProbsChirho.hebrew * 100).toFixed(0) + '%' }));
    meta.appendChild(el('span', { text: '  ·  vol ' + item.volChirho + ' p' + item.pageNumChirho + ' line ' + item.lineIdxChirho }));
    stage.appendChild(meta);

    // Line context
    const lineWrap = el('div', { cls: 'line-wrap' });
    const lineImg = el('img', { attrs: { id: 'line-img', alt: '' } });
    const marker = el('div', { cls: 'line-marker', id: 'line-marker', style: 'display:none' });
    lineWrap.appendChild(lineImg);
    lineWrap.appendChild(marker);
    stage.appendChild(lineWrap);
    lineImg.onload = () => {
      fetch('/line-context-meta/' + item.wordIdChirho).then(r => r.json()).then(meta => {
        if (!meta.okChirho) return;
        const lineW = meta.lineWidthChirho + meta.linePadChirho * 2;
        const wordLeft = (meta.wordXMinChirho - (meta.lineXMinChirho - meta.linePadChirho)) / lineW;
        const wordW = (meta.wordXMaxChirho - meta.wordXMinChirho) / lineW;
        const w = lineImg.offsetWidth;
        marker.style.left = (wordLeft * w + 4) + 'px';
        marker.style.width = (wordW * w) + 'px';
        marker.style.display = 'block';
      });
    };
    lineImg.src = '/line-context/' + item.wordIdChirho + '?t=' + Date.now();

    const actions = el('div', { cls: 'actions' });
    const yes = el('button', { cls: 'btn-yes', text: '✓ Hebrew (Y)' });
    yes.addEventListener('click', () => decide('hebrew'));
    actions.appendChild(yes);
    const latin = el('button', { cls: 'btn-no', text: 'Latin (L)' });
    latin.addEventListener('click', () => decide('latin'));
    actions.appendChild(latin);
    const sym = el('button', { cls: 'btn-sym', text: 'Symbol (O)' });
    sym.addEventListener('click', () => decide('symbol'));
    actions.appendChild(sym);
    const skip = el('button', { cls: 'btn-skip', text: 'Skip (S)' });
    skip.addEventListener('click', () => decide('skip'));
    actions.appendChild(skip);
    stage.appendChild(actions);

    const keys = el('div', { cls: 'keys' });
    const tip = el('span');
    tip.appendChild(document.createTextNode('Press '));
    tip.appendChild(el('kbd', { text: 'Y' }));
    tip.appendChild(document.createTextNode(' Hebrew · '));
    tip.appendChild(el('kbd', { text: 'L' }));
    tip.appendChild(document.createTextNode(' Latin · '));
    tip.appendChild(el('kbd', { text: 'O' }));
    tip.appendChild(document.createTextNode(' Symbol · '));
    tip.appendChild(el('kbd', { text: 'S' }));
    tip.appendChild(document.createTextNode(' Skip'));
    keys.appendChild(tip);
    stage.appendChild(keys);

    update();
  }

  async function decide(verdict) {
    const item = manifest.itemsChirho[idx];
    let script;
    if (verdict === 'hebrew') { script = 'hebrew-chirho'; counts.hebrew++; }
    else if (verdict === 'latin') { script = 'latin-chirho'; counts.latin++; }
    else if (verdict === 'symbol') { script = 'symbol-chirho'; counts.symbol++; }
    else { counts.skip++; idx++; render(); return; }
    try {
      const r = await fetch('/submit-one', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ itemChirho: item, scriptChirho: script })
      });
      const j = await r.json();
      const status = document.getElementById('status');
      if (j.okChirho) {
        status.className = '';
        status.textContent = 'Saved as ' + verdict;
      } else {
        status.className = 'error';
        status.textContent = 'Save failed: ' + (j.errorChirho || 'unknown');
      }
    } catch (err) {
      document.getElementById('status').className = 'error';
      document.getElementById('status').textContent = 'Network: ' + err.message;
    }
    idx++;
    render();
  }

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if (k === 'y') { e.preventDefault(); decide('hebrew'); }
    else if (k === 'l') { e.preventDefault(); decide('latin'); }
    else if (k === 'o') { e.preventDefault(); decide('symbol'); }
    else if (k === 's') { e.preventDefault(); decide('skip'); }
    else if (k === 'arrowleft' || k === 'p') { if (idx > 0) { idx--; render(); } }
  });

  render();
  </script>
</body>
</html>`;

function lookupLineContextChirho(wordIdChirho: number) {
  const rowChirho = lineContextStmtChirho.get(wordIdChirho) as any;
  if (!rowChirho) return null;
  const pageImagePathChirho = join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "images-chirho",
    `vol-${rowChirho.vol}-chirho`,
    `page-${String(rowChirho.page_num).padStart(4, "0")}-chirho.png`
  );
  return {
    pageImagePathChirho,
    lineXMinChirho: rowChirho.s_x_min,
    lineYMinChirho: rowChirho.s_y_min,
    lineWidthChirho: rowChirho.s_w,
    lineHeightChirho: rowChirho.s_h,
    linePadChirho: 8,
    wordXMinChirho: rowChirho.w_x_min,
    wordXMaxChirho: rowChirho.w_x_max,
  };
}

Bun.serve({
  port: PORT_CHIRHO,
  async fetch(reqChirho: Request) {
    const urlChirho = new URL(reqChirho.url);
    if (urlChirho.pathname === "/") {
      return new Response(indexHtmlChirho, { headers: { "Content-Type": "text/html" } });
    }
    if (urlChirho.pathname.startsWith("/crop/")) {
      const fileChirho = urlChirho.pathname.slice("/crop/".length);
      const pChirho = join(batchDirChirho, fileChirho);
      if (!existsSync(pChirho)) return new Response("not found", { status: 404 });
      return new Response(Bun.file(pChirho));
    }
    if (urlChirho.pathname.startsWith("/line-context/")) {
      const wordIdChirho = parseInt(urlChirho.pathname.slice("/line-context/".length), 10);
      const metaChirho = lookupLineContextChirho(wordIdChirho);
      if (!metaChirho) return new Response("not found", { status: 404 });
      const cacheChirho = join(tmpdir(), `hottp-line-${wordIdChirho}-chirho.png`);
      if (!existsSync(cacheChirho)) {
        const pad = metaChirho.linePadChirho;
        const x = Math.max(0, metaChirho.lineXMinChirho - pad);
        const y = Math.max(0, metaChirho.lineYMinChirho - pad);
        const w = metaChirho.lineWidthChirho + pad * 2;
        const h = metaChirho.lineHeightChirho + pad * 2;
        const rChirho = spawnSync("magick", [metaChirho.pageImagePathChirho, "-crop", `${w}x${h}+${x}+${y}`, "+repage", cacheChirho]);
        if (rChirho.status !== 0) return new Response("crop failed", { status: 500 });
      }
      return new Response(Bun.file(cacheChirho));
    }
    if (urlChirho.pathname.startsWith("/line-context-meta/")) {
      const wordIdChirho = parseInt(urlChirho.pathname.slice("/line-context-meta/".length), 10);
      const metaChirho = lookupLineContextChirho(wordIdChirho);
      if (!metaChirho) return new Response(JSON.stringify({ okChirho: false }), { status: 404 });
      return new Response(JSON.stringify({ okChirho: true, ...metaChirho }), { headers: { "Content-Type": "application/json" } });
    }
    if (urlChirho.pathname === "/submit-one" && reqChirho.method === "POST") {
      try {
        const bodyChirho = (await reqChirho.json()) as { itemChirho: ManifestItemChirho; scriptChirho: string };
        const itemChirho = bodyChirho.itemChirho;
        const cropPathChirho = join(batchDirChirho, itemChirho.cropFileChirho);
        const resChirho = insertStmtChirho.run(
          itemChirho.wordIdChirho,
          itemChirho.scanlineIdChirho,
          itemChirho.pageIdChirho,
          itemChirho.volChirho,
          itemChirho.pageNumChirho,
          itemChirho.lineIdxChirho,
          itemChirho.wordIdxChirho,
          itemChirho.bboxChirho.xMinChirho,
          itemChirho.bboxChirho.yMinChirho,
          itemChirho.bboxChirho.xMaxChirho,
          itemChirho.bboxChirho.yMaxChirho,
          cropPathChirho,
          itemChirho.tesseractTextChirho,
          bodyChirho.scriptChirho,
          itemChirho.predictedScriptChirho,
        );
        const nowChirho = new Date().toISOString();
        logStepStmtChirho.run(
          "hebrew-validate-chirho",
          nowChirho, nowChirho,
          `word ${itemChirho.wordIdChirho} (vol ${itemChirho.volChirho} p${itemChirho.pageNumChirho}) labeled ${bodyChirho.scriptChirho} (predicted ${itemChirho.predictedScriptChirho} @ ${(itemChirho.predictedConfidenceChirho*100).toFixed(0)}%)`,
          resChirho.changes === 0 ? "skipped (already present)" : "inserted training pair",
          `binary Hebrew validation`
        );
        return new Response(JSON.stringify({ okChirho: true, insertedChirho: resChirho.changes }), { headers: { "Content-Type": "application/json" } });
      } catch (errChirho) {
        return new Response(JSON.stringify({ okChirho: false, errorChirho: String(errChirho) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`Hebrew validate: http://localhost:${PORT_CHIRHO}/`);
