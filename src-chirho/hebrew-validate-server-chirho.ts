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

// Two insert paths: clean human labels go to source='human-chirho'; bad-bbox
// flags go to source='human-bad-bbox-chirho' so the re-segmentation pipeline
// can target them without polluting the classifier training set.
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
  // All client identifiers carry the Chirho suffix per project AGENTS.md.
  const manifestChirho = ${JSON.stringify(manifestChirho)};
  let idxChirho = 0;
  let countsChirho = { hebrewChirho: 0, latinChirho: 0, greekChirho: 0, symbolChirho: 0, skipChirho: 0, badBboxChirho: 0 };
  // Set of word IDs already labeled by the user (loaded from server on init,
  // refreshed locally as the user goes). Used so refresh skips past prior work.
  let labeledSetChirho = new Set();

  async function loadLabeledFromServerChirho() {
    try {
      const rChirho = await fetch('/labeled-set');
      const jChirho = await rChirho.json();
      labeledSetChirho = new Set(jChirho.labeledChirho);
      if (jChirho.byScriptChirho) {
        countsChirho.hebrewChirho = jChirho.byScriptChirho['hebrew-chirho'] || 0;
        countsChirho.latinChirho  = jChirho.byScriptChirho['latin-chirho']  || 0;
        countsChirho.greekChirho  = jChirho.byScriptChirho['greek-chirho']  || 0;
        countsChirho.symbolChirho = jChirho.byScriptChirho['symbol-chirho'] || 0;
      }
      if (typeof jChirho.badBboxCountChirho === 'number') countsChirho.badBboxChirho = jChirho.badBboxCountChirho;
      while (idxChirho < manifestChirho.itemsChirho.length && labeledSetChirho.has(manifestChirho.itemsChirho[idxChirho].wordIdChirho)) {
        idxChirho++;
      }
    } catch (errChirho) { /* non-fatal */ }
  }

  function elChirho(tagChirho, optsChirho, childrenChirho) {
    const eChirho = document.createElement(tagChirho);
    if (optsChirho) {
      if (optsChirho.cls) eChirho.className = optsChirho.cls;
      if (optsChirho.text != null) eChirho.textContent = optsChirho.text;
      if (optsChirho.id) eChirho.id = optsChirho.id;
      if (optsChirho.attrs) for (const kChirho of Object.keys(optsChirho.attrs)) eChirho.setAttribute(kChirho, optsChirho.attrs[kChirho]);
      if (optsChirho.style) eChirho.setAttribute('style', optsChirho.style);
    }
    if (childrenChirho) for (const cChirho of childrenChirho) if (cChirho) eChirho.appendChild(cChirho);
    return eChirho;
  }

  function clearNodeChirho(nChirho) { while (nChirho.firstChild) nChirho.removeChild(nChirho.firstChild); }

  function updateChirho() {
    const totalChirho = manifestChirho.itemsChirho.length;
    document.getElementById('progress').textContent = (idxChirho + 1) + ' / ' + totalChirho;
    const sChirho = document.getElementById('stats');
    clearNodeChirho(sChirho);
    sChirho.appendChild(document.createTextNode('Hebrew: '));
    sChirho.appendChild(elChirho('span', { cls: 'yes', text: String(countsChirho.hebrewChirho) }));
    sChirho.appendChild(document.createTextNode(' · Latin: '));
    sChirho.appendChild(elChirho('span', { cls: 'no', text: String(countsChirho.latinChirho) }));
    sChirho.appendChild(document.createTextNode(' · Greek: ' + countsChirho.greekChirho + ' · Symbol: ' + countsChirho.symbolChirho + ' · Bad bbox: ' + countsChirho.badBboxChirho + ' · Skipped: ' + countsChirho.skipChirho));
  }

  function renderChirho() {
    const stageChirho = document.getElementById('stage');
    clearNodeChirho(stageChirho);
    if (idxChirho >= manifestChirho.itemsChirho.length) {
      const doneDivChirho = elChirho('div', { cls: 'done' });
      doneDivChirho.appendChild(document.createTextNode('Done — labeled '));
      doneDivChirho.appendChild(elChirho('span', { cls: 'yes', text: String(countsChirho.hebrewChirho) }));
      doneDivChirho.appendChild(document.createTextNode(' Hebrew, '));
      doneDivChirho.appendChild(elChirho('span', { cls: 'no', text: String(countsChirho.latinChirho) }));
      doneDivChirho.appendChild(document.createTextNode(' Latin, ' + countsChirho.greekChirho + ' Greek, ' + countsChirho.symbolChirho + ' Symbol, ' + countsChirho.badBboxChirho + ' bad-bbox, ' + countsChirho.skipChirho + ' skipped.'));
      stageChirho.appendChild(doneDivChirho);
      updateChirho();
      return;
    }
    const itemChirho = manifestChirho.itemsChirho[idxChirho];
    const cropWrapChirho = elChirho('div', { cls: 'crop-wrap' });
    const imgChirho = elChirho('img', { attrs: { src: '/crop/' + itemChirho.cropFileChirho + '?t=' + Date.now(), alt: '' } });
    cropWrapChirho.appendChild(imgChirho);
    stageChirho.appendChild(cropWrapChirho);

    const metaChirho = elChirho('div', { cls: 'meta' });
    metaChirho.appendChild(elChirho('span', { cls: 'tess', text: 'tesseract: "' + itemChirho.tesseractTextChirho + '"' }));
    metaChirho.appendChild(elChirho('span', { cls: 'prob', text: '  ·  p(hebrew) = ' + (itemChirho.allProbsChirho.hebrew * 100).toFixed(0) + '%' }));
    metaChirho.appendChild(elChirho('span', { text: '  ·  vol ' + itemChirho.volChirho + ' p' + itemChirho.pageNumChirho + ' line ' + itemChirho.lineIdxChirho }));
    stageChirho.appendChild(metaChirho);

    const lineWrapChirho = elChirho('div', { cls: 'line-wrap' });
    const lineImgChirho = elChirho('img', { attrs: { id: 'line-img', alt: '' } });
    const markerChirho = elChirho('div', { cls: 'line-marker', id: 'line-marker', style: 'display:none' });
    lineWrapChirho.appendChild(lineImgChirho);
    lineWrapChirho.appendChild(markerChirho);
    stageChirho.appendChild(lineWrapChirho);
    lineImgChirho.onload = () => {
      fetch('/line-context-meta/' + itemChirho.wordIdChirho).then(rChirho => rChirho.json()).then(metaRespChirho => {
        if (!metaRespChirho.okChirho) return;
        const lineWChirho = metaRespChirho.lineWidthChirho + metaRespChirho.linePadChirho * 2;
        const wordLeftChirho = (metaRespChirho.wordXMinChirho - (metaRespChirho.lineXMinChirho - metaRespChirho.linePadChirho)) / lineWChirho;
        const wordWChirho = (metaRespChirho.wordXMaxChirho - metaRespChirho.wordXMinChirho) / lineWChirho;
        const renderedWChirho = lineImgChirho.offsetWidth;
        markerChirho.style.left = (wordLeftChirho * renderedWChirho + 4) + 'px';
        markerChirho.style.width = (wordWChirho * renderedWChirho) + 'px';
        markerChirho.style.display = 'block';
      });
    };
    lineImgChirho.src = '/line-context/' + itemChirho.wordIdChirho + '?t=' + Date.now();

    const actionsChirho = elChirho('div', { cls: 'actions' });
    const yesBtnChirho = elChirho('button', { cls: 'btn-yes', text: '✓ Hebrew (Y)' });
    yesBtnChirho.addEventListener('click', () => decideChirho('hebrew'));
    actionsChirho.appendChild(yesBtnChirho);
    const latinBtnChirho = elChirho('button', { cls: 'btn-no', text: 'Latin (L)' });
    latinBtnChirho.addEventListener('click', () => decideChirho('latin'));
    actionsChirho.appendChild(latinBtnChirho);
    const greekBtnChirho = elChirho('button', { cls: 'btn-no', text: 'Greek (G)', attrs: { style: 'border-color:#4cc24c;color:#4cc24c' } });
    greekBtnChirho.addEventListener('click', () => decideChirho('greek'));
    actionsChirho.appendChild(greekBtnChirho);
    const symBtnChirho = elChirho('button', { cls: 'btn-sym', text: 'Symbol (O)' });
    symBtnChirho.addEventListener('click', () => decideChirho('symbol'));
    actionsChirho.appendChild(symBtnChirho);
    const skipBtnChirho = elChirho('button', { cls: 'btn-skip', text: 'Skip (S)' });
    skipBtnChirho.addEventListener('click', () => decideChirho('skip'));
    actionsChirho.appendChild(skipBtnChirho);
    const bboxBtnChirho = elChirho('button', { cls: 'btn-skip', text: '✂ Bad bbox (B)', attrs: { style: 'border-color:#f59e0b;color:#fbbf24' } });
    bboxBtnChirho.addEventListener('click', () => decideChirho('bad-bbox'));
    actionsChirho.appendChild(bboxBtnChirho);
    const undoBtnChirho = elChirho('button', { cls: 'btn-skip', text: '↶ Undo last (U)' });
    undoBtnChirho.addEventListener('click', undoLastChirho);
    actionsChirho.appendChild(undoBtnChirho);
    stageChirho.appendChild(actionsChirho);

    const keysChirho = elChirho('div', { cls: 'keys' });
    const tipChirho = elChirho('span');
    tipChirho.appendChild(document.createTextNode('Press '));
    tipChirho.appendChild(elChirho('kbd', { text: 'Y' }));
    tipChirho.appendChild(document.createTextNode(' Hebrew · '));
    tipChirho.appendChild(elChirho('kbd', { text: 'L' }));
    tipChirho.appendChild(document.createTextNode(' Latin · '));
    tipChirho.appendChild(elChirho('kbd', { text: 'G' }));
    tipChirho.appendChild(document.createTextNode(' Greek · '));
    tipChirho.appendChild(elChirho('kbd', { text: 'O' }));
    tipChirho.appendChild(document.createTextNode(' Symbol · '));
    tipChirho.appendChild(elChirho('kbd', { text: 'S' }));
    tipChirho.appendChild(document.createTextNode(' Skip · '));
    tipChirho.appendChild(elChirho('kbd', { text: 'B' }));
    tipChirho.appendChild(document.createTextNode(' Bad bbox · '));
    tipChirho.appendChild(elChirho('kbd', { text: 'U' }));
    tipChirho.appendChild(document.createTextNode(' Undo last'));
    keysChirho.appendChild(tipChirho);
    stageChirho.appendChild(keysChirho);

    updateChirho();
  }

  async function decideChirho(verdictChirho) {
    const itemChirho = manifestChirho.itemsChirho[idxChirho];
    let scriptChirho;
    // Note: bad-bbox is a special skip that still writes a row to
    // training_pairs_chirho (with source='human-bad-bbox-chirho') so the
    // pipeline can later re-segment those crops without polluting training.
    let badBboxFlagChirho = false;
    if (verdictChirho === 'hebrew') { scriptChirho = 'hebrew-chirho'; countsChirho.hebrewChirho++; }
    else if (verdictChirho === 'latin') { scriptChirho = 'latin-chirho'; countsChirho.latinChirho++; }
    else if (verdictChirho === 'greek') { scriptChirho = 'greek-chirho'; countsChirho.greekChirho++; }
    else if (verdictChirho === 'symbol') { scriptChirho = 'symbol-chirho'; countsChirho.symbolChirho++; }
    else if (verdictChirho === 'bad-bbox') {
      // Use 'unknown-chirho' as the script tag; the source tag is what carries
      // the semantic of "do not trust this crop".
      scriptChirho = 'unknown-chirho';
      badBboxFlagChirho = true;
      countsChirho.badBboxChirho++;
    }
    else {
      countsChirho.skipChirho++;
      idxChirho++;
      while (idxChirho < manifestChirho.itemsChirho.length && labeledSetChirho.has(manifestChirho.itemsChirho[idxChirho].wordIdChirho)) idxChirho++;
      renderChirho();
      return;
    }
    try {
      const rChirho = await fetch('/submit-one', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ itemChirho, scriptChirho, badBboxFlagChirho })
      });
      const jChirho = await rChirho.json();
      const statusChirho = document.getElementById('status');
      if (jChirho.okChirho) {
        statusChirho.className = '';
        statusChirho.textContent = 'Saved as ' + verdictChirho;
        labeledSetChirho.add(itemChirho.wordIdChirho);
      } else {
        statusChirho.className = 'error';
        statusChirho.textContent = 'Save failed: ' + (jChirho.errorChirho || 'unknown');
      }
    } catch (errChirho) {
      document.getElementById('status').className = 'error';
      document.getElementById('status').textContent = 'Network: ' + errChirho.message;
    }
    idxChirho++;
    while (idxChirho < manifestChirho.itemsChirho.length && labeledSetChirho.has(manifestChirho.itemsChirho[idxChirho].wordIdChirho)) idxChirho++;
    renderChirho();
  }

  async function undoLastChirho() {
    try {
      const rChirho = await fetch('/undo-last', { method: 'POST' });
      const jChirho = await rChirho.json();
      const statusChirho = document.getElementById('status');
      if (jChirho.okChirho) {
        if (jChirho.deletedScriptChirho === 'hebrew-chirho') countsChirho.hebrewChirho = Math.max(0, countsChirho.hebrewChirho - 1);
        else if (jChirho.deletedScriptChirho === 'latin-chirho') countsChirho.latinChirho = Math.max(0, countsChirho.latinChirho - 1);
        else if (jChirho.deletedScriptChirho === 'greek-chirho') countsChirho.greekChirho = Math.max(0, countsChirho.greekChirho - 1);
        else if (jChirho.deletedScriptChirho === 'symbol-chirho') countsChirho.symbolChirho = Math.max(0, countsChirho.symbolChirho - 1);
        if (jChirho.deletedWordIdChirho != null) labeledSetChirho.delete(jChirho.deletedWordIdChirho);
        idxChirho = Math.max(0, idxChirho - 1);
        while (idxChirho > 0 && labeledSetChirho.has(manifestChirho.itemsChirho[idxChirho].wordIdChirho)) idxChirho--;
        statusChirho.className = '';
        statusChirho.textContent = 'Undid: ' + jChirho.deletedScriptChirho + ' (' + (jChirho.deletedWordIdChirho || '?') + ')';
        renderChirho();
      } else {
        statusChirho.className = 'error';
        statusChirho.textContent = 'Undo failed: ' + (jChirho.errorChirho || 'no recent labels');
      }
    } catch (errChirho) {
      document.getElementById('status').className = 'error';
      document.getElementById('status').textContent = 'Network: ' + errChirho.message;
    }
  }

  document.addEventListener('keydown', evtChirho => {
    if (evtChirho.target.tagName === 'INPUT' || evtChirho.target.tagName === 'TEXTAREA') return;
    const kChirho = evtChirho.key.toLowerCase();
    if (kChirho === 'y') { evtChirho.preventDefault(); decideChirho('hebrew'); }
    else if (kChirho === 'l') { evtChirho.preventDefault(); decideChirho('latin'); }
    else if (kChirho === 'g') { evtChirho.preventDefault(); decideChirho('greek'); }
    else if (kChirho === 'o') { evtChirho.preventDefault(); decideChirho('symbol'); }
    else if (kChirho === 's') { evtChirho.preventDefault(); decideChirho('skip'); }
    else if (kChirho === 'b') { evtChirho.preventDefault(); decideChirho('bad-bbox'); }
    else if (kChirho === 'u' || kChirho === 'backspace') { evtChirho.preventDefault(); undoLastChirho(); }
    else if (kChirho === 'arrowleft' || kChirho === 'p') {
      if (idxChirho > 0) { idxChirho--; renderChirho(); }
    }
  });

  // Initial load: pull labeled-set + counts from server BEFORE first render so
  // we land on the first unlabeled item.
  loadLabeledFromServerChirho().then(() => { renderChirho(); });
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
  hostname: "127.0.0.1",
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
    // Returns the set of word IDs in this manifest that already have a
    // human-chirho label in training_pairs_chirho — so the UI can fast-forward
    // past items the user already decided on. Survives browser refresh.
    if (urlChirho.pathname === "/labeled-set") {
      const wordIdsChirho = manifestChirho.itemsChirho.map((iChirho) => iChirho.wordIdChirho);
      if (wordIdsChirho.length === 0) {
        return new Response(JSON.stringify({ labeledChirho: [], byScriptChirho: {} }), { headers: { "Content-Type": "application/json" } });
      }
      const placeholdersChirho = wordIdsChirho.map(() => "?").join(",");
      // Include both human-chirho and human-bad-bbox-chirho — both mean
      // "the user has decided on this item, don't show it again."
      const rowsChirho = dbChirho
        .prepare(
          `SELECT word_id_chirho, script_chirho, source_chirho FROM training_pairs_chirho
             WHERE source_chirho IN ('human-chirho','human-bad-bbox-chirho')
               AND word_id_chirho IN (${placeholdersChirho})`
        )
        .all(...wordIdsChirho) as Array<{ word_id_chirho: number; script_chirho: string; source_chirho: string }>;
      const labeledChirho = rowsChirho.map((rChirho) => rChirho.word_id_chirho);
      const byScriptChirho: Record<string, number> = {};
      let badBboxCountChirho = 0;
      for (const rChirho of rowsChirho) {
        if (rChirho.source_chirho === "human-bad-bbox-chirho") {
          badBboxCountChirho++;
        } else {
          byScriptChirho[rChirho.script_chirho] = (byScriptChirho[rChirho.script_chirho] ?? 0) + 1;
        }
      }
      return new Response(JSON.stringify({ labeledChirho, byScriptChirho, badBboxCountChirho }), { headers: { "Content-Type": "application/json" } });
    }
    if (urlChirho.pathname === "/undo-last" && reqChirho.method === "POST") {
      try {
        // Delete the most-recent human-chirho row (server has no notion of
        // session, so this is approximate — undoes the global latest human
        // label, which in practice is the one the user just inserted).
        const lastChirho = dbChirho.prepare(
          `SELECT id_chirho, word_id_chirho, script_chirho FROM training_pairs_chirho
             WHERE source_chirho = 'human-chirho'
             ORDER BY id_chirho DESC LIMIT 1`
        ).get() as { id_chirho: number; word_id_chirho: number; script_chirho: string } | undefined;
        if (!lastChirho) {
          return new Response(JSON.stringify({ okChirho: false, errorChirho: "no recent human-chirho rows" }), { headers: { "Content-Type": "application/json" } });
        }
        dbChirho.run(`DELETE FROM training_pairs_chirho WHERE id_chirho = ?`, [lastChirho.id_chirho]);
        const nowChirho = new Date().toISOString();
        logStepStmtChirho.run(
          "hebrew-validate-chirho",
          nowChirho, nowChirho,
          `UNDO label on word ${lastChirho.word_id_chirho} (was script=${lastChirho.script_chirho})`,
          `deleted training_pairs_chirho row id=${lastChirho.id_chirho}`,
          "user pressed undo to retract the most recent labeling decision"
        );
        return new Response(
          JSON.stringify({ okChirho: true, deletedScriptChirho: lastChirho.script_chirho, deletedWordIdChirho: lastChirho.word_id_chirho }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (errChirho) {
        return new Response(JSON.stringify({ okChirho: false, errorChirho: String(errChirho) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    if (urlChirho.pathname === "/submit-one" && reqChirho.method === "POST") {
      try {
        const bodyChirho = (await reqChirho.json()) as { itemChirho: ManifestItemChirho; scriptChirho: string; badBboxFlagChirho?: boolean };
        const itemChirho = bodyChirho.itemChirho;
        const cropPathChirho = join(batchDirChirho, itemChirho.cropFileChirho);
        const stmtChirho = bodyChirho.badBboxFlagChirho ? insertBadBboxStmtChirho : insertHumanStmtChirho;
        const resChirho = stmtChirho.run(
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
