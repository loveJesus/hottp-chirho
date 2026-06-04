// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Localhost polygon-annotation server.
 *
 * Reads a polygon-batch manifest (from prepare_polygon_annotation_chirho.py),
 * serves a per-word page where the user can draw convex polygons around
 * individual non-touching letters and label each polygon with the Hebrew
 * letter it encloses. Submit → server masks the word image by the polygon,
 * tight-crops to ink extent, saves under workspace-chirho/bitmap-font-v3-chirho/
 * U+XXXX/word-<id>-poly-<n>-chirho.png with source='human-polygon-chirho'.
 *
 * Also logs each save to progress-chirho.sqlite steps_taken_chirho.
 *
 * Run:
 *   bun src-chirho/polygon-annotate-server-chirho.ts
 * Open http://localhost:8765/
 */

import { existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";
import { spawnSync } from "child_process";
import { tmpdir } from "os";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const PORT_CHIRHO = 8765;
const BATCHES_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "polygon-batches-chirho");
const DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const FONT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "bitmap-font-v3-chirho");

interface ManifestItemChirho {
  wordIdChirho: number;
  cropFileChirho: string;
  textChirho: string;
  consonantsChirho: string;
  lettersChirho: string[];
  volChirho: number;
  pageNumChirho: number;
  lineIdxChirho: number;
}

interface ManifestChirho {
  runIdChirho: string;
  createdAtChirho: string;
  itemsChirho: ManifestItemChirho[];
  alphabetCoveredChirho: string[];
  alphabetUncoveredChirho: string[];
}

const argsChirho = process.argv.slice(2);
const explicitBatchChirho = argsChirho.find((aChirho) => aChirho.startsWith("--batch="))?.split("=")[1];

function pickBatchChirho(): string {
  if (explicitBatchChirho) return join(BATCHES_DIR_CHIRHO, explicitBatchChirho);
  const candidatesChirho = readdirSync(BATCHES_DIR_CHIRHO).filter((nChirho) => nChirho.startsWith("polygons-")).sort();
  if (candidatesChirho.length === 0) {
    console.error(`No polygon batches in ${BATCHES_DIR_CHIRHO}. Run prepare_polygon_annotation_chirho.py first.`);
    process.exit(1);
  }
  return join(BATCHES_DIR_CHIRHO, candidatesChirho[candidatesChirho.length - 1]!);
}

const batchDirChirho = pickBatchChirho();
const manifestChirho = JSON.parse(await Bun.file(join(batchDirChirho, "manifest-chirho.json")).text()) as ManifestChirho;
console.log(`Loaded ${manifestChirho.runIdChirho}: ${manifestChirho.itemsChirho.length} source words`);

const dbChirho = new Database(DB_PATH_CHIRHO);
mkdirSync(FONT_DIR_CHIRHO, { recursive: true });

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

function lookupLineContextChirho(wordIdChirho: number): {
  pageImagePathChirho: string;
  lineXMinChirho: number;
  lineYMinChirho: number;
  lineWidthChirho: number;
  lineHeightChirho: number;
  linePadChirho: number;
  wordXMinChirho: number;
  wordXMaxChirho: number;
} | null {
  const rowChirho = lineContextStmtChirho.get(wordIdChirho) as {
    w_x_min: number; w_x_max: number;
    s_x_min: number; s_y_min: number; s_w: number; s_h: number;
    vol: number; page_num: number;
  } | undefined;
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

const HEBREW_LETTERS_CHIRHO = [
  ["א", "alef"], ["ב", "bet"], ["ג", "gimel"], ["ד", "dalet"], ["ה", "he"],
  ["ו", "vav"], ["ז", "zayin"], ["ח", "chet"], ["ט", "tet"], ["י", "yod"],
  ["כ", "kaf"], ["ך", "kaf-final"], ["ל", "lamed"], ["מ", "mem"], ["ם", "mem-final"],
  ["נ", "nun"], ["ן", "nun-final"], ["ס", "samekh"], ["ע", "ayin"], ["פ", "pe"],
  ["ף", "pe-final"], ["צ", "tsadi"], ["ץ", "tsadi-final"], ["ק", "qof"], ["ר", "resh"],
  ["ש", "shin"], ["ת", "tav"],
];

// DOM-only construction in client JS — no innerHTML — so user-provided word
// text can't break out as HTML.
const indexHtmlChirho = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>HOTTP polygon annotation</title>
  <style>
    :root { color-scheme: dark; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a14; color: #e0e0e0; margin: 0; padding: 1rem; }
    h1 { font-size: 1rem; color: #c9a84c; margin: 0; }
    .toolbar { position: sticky; top: 0; background: #0d0d18; padding: 0.6rem 1rem; border-bottom: 1px solid #2a2a4a; margin: -1rem -1rem 0 -1rem; z-index: 100; display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap; }
    .toolbar .progress { color: #888; font-size: 0.8rem; }
    .toolbar button { padding: 0.35rem 0.85rem; border-radius: 4px; cursor: pointer; font-weight: 600; border: 1px solid; }
    .btn-prev, .btn-next, .btn-skip { background: #1a1a2e; border-color: #2a2a4a; color: #ccc; }
    .btn-save { background: #1b5e20; border-color: #2e7d32; color: #a5d6a7; }
    .stage { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; margin-top: 1rem; }
    .canvas-wrap { background: #12121f; padding: 0.5rem; border-radius: 6px; border: 1px solid #2a2a4a; }
    .canvas-wrap canvas { display: block; background: white; cursor: crosshair; image-rendering: -webkit-optimize-contrast; max-width: 100%; }
    .canvas-meta { font-size: 0.75rem; color: #888; margin-top: 0.4rem; }
    .panel { background: #12121f; border: 1px solid #2a2a4a; border-radius: 6px; padding: 0.8rem; }
    .panel h2 { font-size: 0.85rem; color: #c9a84c; margin: 0 0 0.5rem 0; }
    .canon-text { font-family: "SBL Hebrew", "Noto Serif", serif; font-size: 1.5rem; color: #e0e0e0; padding: 0.3rem 0.5rem; background: #0a0a14; border-radius: 4px; direction: rtl; text-align: right; }
    .letter-pick { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-top: 0.5rem; }
    .letter-pick button { font-family: "SBL Hebrew", "Noto Serif", serif; font-size: 1.1rem; padding: 0.3rem; background: #0a0a14; border: 1px solid #2a2a4a; color: #e0e0e0; border-radius: 3px; cursor: pointer; }
    .letter-pick button.armed { background: #c9a84c; color: #1a1a2e; border-color: #c9a84c; font-weight: 700; }
    .polygons-list { display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.5rem; }
    .poly-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; padding: 0.3rem 0.5rem; background: #0a0a14; border: 1px solid #2a2a4a; border-radius: 3px; }
    .poly-row .swatch { width: 14px; height: 14px; border-radius: 2px; flex: 0 0 auto; }
    .poly-row .letter { font-family: "SBL Hebrew", serif; font-size: 1.1rem; }
    .poly-row .points-count { color: #888; font-size: 0.75rem; }
    .poly-row .x-btn { background: #4a1010; border: 1px solid #dc2626; color: #fca5a5; padding: 0 0.4rem; border-radius: 3px; cursor: pointer; font-size: 0.7rem; }
    .hint { font-size: 0.7rem; color: #888; line-height: 1.5; }
    .status { color: #4ade80; font-size: 0.8rem; }
    .status.error { color: #fca5a5; }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>HOTTP polygon annotation</strong>
    <span class="progress" id="progress"></span>
    <button class="btn-prev" id="btn-prev">← Prev</button>
    <button class="btn-skip" id="btn-skip">Skip →</button>
    <button class="btn-save" id="btn-save">Save & next →</button>
    <span class="status" id="status"></span>
  </div>
  <div class="stage">
    <div class="canvas-wrap">
      <canvas id="canvas" width="900" height="200"></canvas>
      <div class="canvas-meta" id="canvas-meta"></div>
      <h2 style="margin-top:0.6rem;font-size:0.8rem;color:#888">Line context (red box = this word)</h2>
      <div id="line-context-wrap" style="position:relative;background:white;padding:4px;border-radius:4px;border:1px solid #2a2a4a;overflow:auto">
        <img id="line-context-img" style="display:block;max-width:100%;image-rendering:-webkit-optimize-contrast" alt="">
        <div id="line-context-marker" style="position:absolute;border:2px solid #dc2626;background:rgba(220,38,38,0.15);pointer-events:none"></div>
      </div>
    </div>
    <div class="panel">
      <h2>Canonical word</h2>
      <div class="canon-text" id="canon-text"></div>
      <h2 style="margin-top:1rem">Pick a letter for the polygon you're drawing</h2>
      <div class="letter-pick" id="letter-pick"></div>
      <h2 style="margin-top:1rem">Polygons in this word</h2>
      <div class="polygons-list" id="polygons-list"></div>
      <p class="hint">
        Click points around a non-touching letter to draw a polygon (≥3 points).<br>
        Press <strong>Enter</strong> or click <strong>Close</strong> to commit. <strong>Z</strong> undoes the last point.<br>
        Pick a letter first or just after; you can re-label any polygon.<br>
        Letters with finals (kaf, mem, nun, pe, tsadi) need the correct final form.
      </p>
    </div>
  </div>

  <script>
  const manifest = ${JSON.stringify(manifestChirho)};
  const hebrewLetters = ${JSON.stringify(HEBREW_LETTERS_CHIRHO)};
  let idx = 0;
  // Per-item polygon state: { polygons: [{letter, points: [[x,y],...]}], currentPoints: [] }
  const itemState = manifest.itemsChirho.map(() => ({ polygons: [], currentPoints: [] }));
  let armedLetter = null;

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#e34a4a', '#4cc24c', '#2563eb', '#c9a84c', '#a050c8', '#b47828', '#06b6d4', '#ec4899'];

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

  // Image cache, drawn behind polygons
  const imageCache = new Image();
  let imgScale = 1;

  function loadCurrent() {
    const item = manifest.itemsChirho[idx];
    document.getElementById('progress').textContent = (idx + 1) + ' / ' + manifest.itemsChirho.length + ' · ' + item.consonantsChirho;
    document.getElementById('canon-text').textContent = item.textChirho;
    document.getElementById('canvas-meta').textContent = 'vol ' + item.volChirho + ' p' + item.pageNumChirho + ' line ' + item.lineIdxChirho + ' · ' + item.cropFileChirho;
    imageCache.onload = () => {
      // Scale image up 4x so polygons can be drawn precisely on small word crops.
      imgScale = 4;
      canvas.width = imageCache.naturalWidth * imgScale;
      canvas.height = imageCache.naturalHeight * imgScale;
      redraw();
    };
    imageCache.src = '/crop/' + item.cropFileChirho + '?t=' + Date.now();
    renderLetterPick();
    renderPolygonsList();
    loadLineContext(item.wordIdChirho);
  }

  function loadLineContext(wordId) {
    const img = document.getElementById('line-context-img');
    const marker = document.getElementById('line-context-marker');
    marker.style.display = 'none';
    img.src = '/line-context/' + wordId + '?t=' + Date.now();
    img.onload = () => {
      fetch('/line-context-meta/' + wordId).then(r => r.json()).then(meta => {
        if (!meta.okChirho) { marker.style.display = 'none'; return; }
        // Compute marker rect inside the rendered line image
        const lineW = meta.lineWidthChirho + meta.linePadChirho * 2;
        const wordLeft = (meta.wordXMinChirho - (meta.lineXMinChirho - meta.linePadChirho)) / lineW;
        const wordW = (meta.wordXMaxChirho - meta.wordXMinChirho) / lineW;
        const imgRect = img.getBoundingClientRect();
        const parent = img.parentElement.getBoundingClientRect();
        marker.style.left = (imgRect.left - parent.left + wordLeft * imgRect.width) + 'px';
        marker.style.top = (imgRect.top - parent.top) + 'px';
        marker.style.width = (wordW * imgRect.width) + 'px';
        marker.style.height = imgRect.height + 'px';
        marker.style.display = 'block';
      });
    };
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imageCache, 0, 0, canvas.width, canvas.height);
    const s = itemState[idx];
    // Finalized polygons
    s.polygons.forEach((poly, i) => {
      const color = COLORS[i % COLORS.length];
      ctx.beginPath();
      poly.points.forEach((p, j) => {
        if (j === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.fillStyle = color + '33';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Letter label at centroid
      const cx = poly.points.reduce((a, p) => a + p[0], 0) / poly.points.length;
      const cy = poly.points.reduce((a, p) => a + p[1], 0) / poly.points.length;
      ctx.font = 'bold 18px serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(poly.letter, cx, cy);
    });
    // Current in-progress polygon
    if (s.currentPoints.length > 0) {
      ctx.beginPath();
      s.currentPoints.forEach((p, j) => {
        if (j === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Vertex dots
      s.currentPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
      });
    }
  }

  function renderLetterPick() {
    const wrap = document.getElementById('letter-pick');
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    for (const [letter, name] of hebrewLetters) {
      const btn = el('button', { text: letter, attrs: { title: name } });
      if (armedLetter === letter) btn.classList.add('armed');
      btn.addEventListener('click', () => { armedLetter = letter; renderLetterPick(); });
      wrap.appendChild(btn);
    }
  }

  function renderPolygonsList() {
    const wrap = document.getElementById('polygons-list');
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    const s = itemState[idx];
    if (s.polygons.length === 0) {
      wrap.appendChild(el('div', { cls: 'hint', text: '(no polygons yet)' }));
      return;
    }
    s.polygons.forEach((poly, i) => {
      const row = el('div', { cls: 'poly-row' });
      const swatch = el('div', { cls: 'swatch', style: 'background:' + COLORS[i % COLORS.length] });
      row.appendChild(swatch);
      row.appendChild(el('span', { cls: 'letter', text: poly.letter }));
      row.appendChild(el('span', { cls: 'points-count', text: poly.points.length + ' pts' }));
      // Re-label dropdown
      const sel = document.createElement('select');
      for (const [letter, name] of hebrewLetters) {
        const opt = document.createElement('option');
        opt.value = letter; opt.textContent = letter + ' (' + name + ')';
        if (poly.letter === letter) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener('change', () => { poly.letter = sel.value; redraw(); });
      row.appendChild(sel);
      const xBtn = el('button', { cls: 'x-btn', text: '✕' });
      xBtn.addEventListener('click', () => { itemState[idx].polygons.splice(i, 1); redraw(); renderPolygonsList(); });
      row.appendChild(xBtn);
      wrap.appendChild(row);
    });
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    itemState[idx].currentPoints.push([x, y]);
    redraw();
  });
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    commitCurrent();
  });

  function commitCurrent() {
    const s = itemState[idx];
    if (s.currentPoints.length < 3) {
      setStatus('Need ≥3 points', true);
      return;
    }
    if (!armedLetter) {
      setStatus('Pick a letter first', true);
      return;
    }
    s.polygons.push({ letter: armedLetter, points: s.currentPoints.slice() });
    s.currentPoints = [];
    redraw();
    renderPolygonsList();
    setStatus('Committed polygon for ' + armedLetter);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { commitCurrent(); }
    else if (e.key === 'z' || e.key === 'Z') {
      const s = itemState[idx];
      if (s.currentPoints.length > 0) { s.currentPoints.pop(); redraw(); }
    }
    else if (e.key === 'Escape') {
      itemState[idx].currentPoints = []; redraw();
    }
  });

  function setStatus(msg, isError) {
    const s = document.getElementById('status');
    s.className = isError ? 'status error' : 'status';
    s.textContent = msg;
  }

  document.getElementById('btn-prev').addEventListener('click', () => {
    if (idx > 0) { idx--; loadCurrent(); }
  });
  document.getElementById('btn-skip').addEventListener('click', () => {
    if (idx < manifest.itemsChirho.length - 1) { idx++; loadCurrent(); }
  });
  document.getElementById('btn-save').addEventListener('click', async () => {
    const s = itemState[idx];
    const item = manifest.itemsChirho[idx];
    if (s.polygons.length === 0) {
      // skip
      if (idx < manifest.itemsChirho.length - 1) { idx++; loadCurrent(); }
      return;
    }
    setStatus('Saving…');
    try {
      const r = await fetch('/save-polygons', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          runIdChirho: manifest.runIdChirho,
          wordIdChirho: item.wordIdChirho,
          cropFileChirho: item.cropFileChirho,
          volChirho: item.volChirho,
          imageScaleChirho: imgScale,
          polygonsChirho: s.polygons.map(p => ({ letterChirho: p.letter, pointsChirho: p.points })),
        })
      });
      const j = await r.json();
      if (j.okChirho) {
        setStatus('Saved ' + j.savedChirho + ' glyphs');
        if (idx < manifest.itemsChirho.length - 1) { idx++; loadCurrent(); }
      } else {
        setStatus('Error: ' + (j.errorChirho || 'unknown'), true);
      }
    } catch (err) { setStatus('Network: ' + err.message, true); }
  });

  loadCurrent();
  </script>
</body>
</html>`;

// ===== Server =====
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
    // GET /line-context/<wordId>: returns a PNG crop of the line strip the
    // word sits on, cached in /tmp. Lookups go through the local sqlite to
    // map word_id -> scanline bbox -> page image.
    if (urlChirho.pathname.startsWith("/line-context/")) {
      const wordIdChirho = parseInt(urlChirho.pathname.slice("/line-context/".length), 10);
      if (!wordIdChirho) return new Response("bad id", { status: 400 });
      const metaChirho = lookupLineContextChirho(wordIdChirho);
      if (!metaChirho) return new Response("not found", { status: 404 });
      const cachePathChirho = join(tmpdir(), `hottp-line-${wordIdChirho}-chirho.png`);
      if (!existsSync(cachePathChirho)) {
        const pad = metaChirho.linePadChirho;
        const x = Math.max(0, metaChirho.lineXMinChirho - pad);
        const y = Math.max(0, metaChirho.lineYMinChirho - pad);
        const w = metaChirho.lineWidthChirho + pad * 2;
        const h = metaChirho.lineHeightChirho + pad * 2;
        const rChirho = spawnSync("magick", [
          metaChirho.pageImagePathChirho,
          "-crop", `${w}x${h}+${x}+${y}`,
          "+repage",
          cachePathChirho,
        ]);
        if (rChirho.status !== 0) return new Response("crop failed", { status: 500 });
      }
      return new Response(Bun.file(cachePathChirho));
    }
    if (urlChirho.pathname.startsWith("/line-context-meta/")) {
      const wordIdChirho = parseInt(urlChirho.pathname.slice("/line-context-meta/".length), 10);
      if (!wordIdChirho) return new Response(JSON.stringify({ okChirho: false }), { status: 400 });
      const metaChirho = lookupLineContextChirho(wordIdChirho);
      if (!metaChirho) return new Response(JSON.stringify({ okChirho: false }), { status: 404 });
      return new Response(JSON.stringify({ okChirho: true, ...metaChirho }), { headers: { "Content-Type": "application/json" } });
    }
    if (urlChirho.pathname === "/save-polygons" && reqChirho.method === "POST") {
      try {
        const bodyChirho = (await reqChirho.json()) as {
          runIdChirho: string;
          wordIdChirho: number;
          cropFileChirho: string;
          volChirho: number;
          imageScaleChirho: number;
          polygonsChirho: Array<{ letterChirho: string; pointsChirho: number[][] }>;
        };
        // Hand off to a Python helper that does the actual masking + crop.
        // Easier to use PIL.ImageDraw.polygon than to recreate that in TS.
        const scriptPathChirho = join(PROJECT_ROOT_CHIRHO, "src-chirho", "save_polygons_chirho.py");
        const payloadChirho = JSON.stringify({
          batchDirChirho,
          fontDirChirho: FONT_DIR_CHIRHO,
          wordIdChirho: bodyChirho.wordIdChirho,
          cropFileChirho: bodyChirho.cropFileChirho,
          volChirho: bodyChirho.volChirho,
          imageScaleChirho: bodyChirho.imageScaleChirho,
          polygonsChirho: bodyChirho.polygonsChirho,
        });
        const resChirho = spawnSync(
          join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "classifier-venv-chirho", "bin", "python3"),
          [scriptPathChirho],
          { input: payloadChirho, encoding: "utf8" }
        );
        if (resChirho.status !== 0) {
          return new Response(JSON.stringify({ okChirho: false, errorChirho: resChirho.stderr }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
        const outChirho = JSON.parse(resChirho.stdout);
        // Log step
        try {
          dbChirho.run(
            `INSERT INTO steps_taken_chirho (agent_code_chirho, timestamp_start_chirho, timestamp_end_chirho, action_taken_chirho, result_of_action_chirho, overview_of_result_chirho) VALUES (?,?,?,?,?,?)`,
            [
              "polygon-annotate-chirho",
              new Date().toISOString(),
              new Date().toISOString(),
              `human polygon annotation: word_id=${bodyChirho.wordIdChirho} ${bodyChirho.polygonsChirho.length} polygons`,
              `saved ${outChirho.savedChirho} glyph PNGs to ${FONT_DIR_CHIRHO}`,
              "user-confirmed per-character labels via convex polygon drawing",
            ]
          );
        } catch (errChirho) {
          // logging failure shouldn't fail the request
        }
        return new Response(JSON.stringify({ okChirho: true, savedChirho: outChirho.savedChirho }), { headers: { "Content-Type": "application/json" } });
      } catch (errChirho) {
        return new Response(JSON.stringify({ okChirho: false, errorChirho: String(errChirho) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`Polygon annotation server: http://localhost:${PORT_CHIRHO}/`);
