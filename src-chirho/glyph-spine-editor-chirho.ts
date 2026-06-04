// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16
//
// Red/blue/green Bezier-spine editor for the v3 glyph library.
//   BLUE  = original scan ink (target)
//   RED   = editable Bezier spine + draggable control points (seeded from the
//           auto route-inspection decomposition)
//   GREEN = live fill: the red spine stroked with the round pen-brush; drag
//           the red until GREEN covers BLUE.
// Saved spines are raw human ground truth -> sidecar JSON + glyph_spines_chirho
// (persist-human-data: never discard the corrected control points).
//
//   bun src-chirho/glyph-spine-editor-chirho.ts  ->  http://localhost:8768/

import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { writeTextAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { parseGlyphKeyChirho } from "./glyph-key-chirho.ts";

const PORT_CHIRHO = 8768;
const FONT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "bitmap-font-v3-chirho");
const SPINES_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "glyph-spines-chirho");
const SEEDS_PATH_CHIRHO = join(SPINES_DIR_CHIRHO, "seeds-chirho.json");
const DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const EDITOR_CHIRHO = "human-spine-editor-chirho";

const seedsChirho: Record<
  string,
  { penRadiusChirho: number; wChirho: number; hChirho: number; strokesChirho: number[][][] }
> = existsSync(SEEDS_PATH_CHIRHO) ? JSON.parse(readFileSync(SEEDS_PATH_CHIRHO, "utf8")) : {};

const dbChirho = new Database(DB_PATH_CHIRHO);
dbChirho
  .prepare(
    `CREATE TABLE IF NOT EXISTS glyph_spines_chirho (
       id_chirho          INTEGER PRIMARY KEY AUTOINCREMENT,
       codepoint_chirho   TEXT NOT NULL,
       letter_chirho      TEXT NOT NULL,
       filename_chirho    TEXT NOT NULL,
       pen_radius_chirho  REAL NOT NULL,
       strokes_json_chirho TEXT NOT NULL,
       saved_by_chirho    TEXT NOT NULL,
       ts_chirho          TEXT NOT NULL DEFAULT (datetime('now')),
       UNIQUE(codepoint_chirho, filename_chirho)
     )`,
  )
  .run();
const upsertSpineStmtChirho = dbChirho.prepare(
  `INSERT INTO glyph_spines_chirho
     (codepoint_chirho, letter_chirho, filename_chirho, pen_radius_chirho, strokes_json_chirho, saved_by_chirho, ts_chirho)
   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
   ON CONFLICT(codepoint_chirho, filename_chirho) DO UPDATE SET
     pen_radius_chirho=excluded.pen_radius_chirho,
     strokes_json_chirho=excluded.strokes_json_chirho,
     saved_by_chirho=excluded.saved_by_chirho,
     ts_chirho=datetime('now')`,
);
const getSpineStmtChirho = dbChirho.prepare(
  `SELECT pen_radius_chirho, strokes_json_chirho FROM glyph_spines_chirho
     WHERE codepoint_chirho=? AND filename_chirho=?`,
);
const savedKeysStmtChirho = dbChirho.prepare(
  `SELECT codepoint_chirho, filename_chirho FROM glyph_spines_chirho`,
);

function glyphListChirho() {
  const savedChirho = new Set(
    (savedKeysStmtChirho.all() as any[]).map(
      (r_chirho) => `U+${r_chirho.codepoint_chirho}/${r_chirho.filename_chirho}`,
    ),
  );
  return Object.keys(seedsChirho)
    .sort()
    .map((k_chirho) => ({
      keyChirho: k_chirho,
      letterChirho: String.fromCodePoint(parseInt(k_chirho.slice(2, 6), 16)),
      savedChirho: savedChirho.has(k_chirho),
    }));
}

function spinePayloadChirho(keyChirho: string) {
  const seedChirho = seedsChirho[keyChirho];
  if (!seedChirho) return null;
  const keyPartsChirho = parseGlyphKeyChirho(keyChirho);
  const pngChirho = join(FONT_DIR_CHIRHO, keyChirho);
  const dataUriChirho = existsSync(pngChirho)
    ? "data:image/png;base64," + readFileSync(pngChirho).toString("base64")
    : "";
  const rowChirho = getSpineStmtChirho.get(
    keyPartsChirho.cpHexChirho,
    keyPartsChirho.fileChirho,
  ) as any;
  const savedChirho = !!rowChirho;
  return {
    keyChirho,
    letterChirho: keyPartsChirho.letterChirho,
    wChirho: seedChirho.wChirho,
    hChirho: seedChirho.hChirho,
    penRadiusChirho: savedChirho ? rowChirho.pen_radius_chirho : seedChirho.penRadiusChirho,
    strokesChirho: savedChirho
      ? JSON.parse(rowChirho.strokes_json_chirho)
      : seedChirho.strokesChirho,
    dataUriChirho,
    savedChirho,
  };
}

const PAGE_CHIRHO = `<!doctype html><html><head><meta charset="utf-8">
<title>Glyph spine editor</title><style>
 body{margin:0;background:#0a0a14;color:#dde;font-family:system-ui;display:flex;height:100vh}
 #side-chirho{width:160px;overflow:auto;border-right:1px solid #243;padding:.4rem}
 #side-chirho button{display:block;width:100%;text-align:left;margin:1px 0;background:#13131f;color:#cde;border:0;padding:.3rem;border-radius:3px;cursor:pointer;font-size:.8rem}
 #side-chirho button.cur-chirho{background:#2a5}
 #side-chirho button.has-chirho{outline:1px solid #3a7}
 #main-chirho{flex:1;display:flex;flex-direction:column;padding:.5rem;overflow:auto}
 #bar-chirho{display:flex;gap:.4rem;align-items:center;flex-wrap:wrap;margin-bottom:.4rem;font-size:.8rem}
 #bar-chirho button{background:#1f5e3a;color:#dfe;border:0;border-radius:4px;padding:.35rem .6rem;cursor:pointer}
 #bar-chirho button.warn-chirho{background:#7a2230;color:#fde}
 #bar-chirho button.alt-chirho{background:#234;color:#cde}
 canvas{background:#fff;border-radius:4px;image-rendering:pixelated;cursor:crosshair}
 .hint-chirho{color:#89a;font-size:.72rem;margin-top:.35rem;max-width:760px;line-height:1.35}
 #stat-chirho{color:#7c9;font-size:.78rem}
</style></head><body>
<div id="side-chirho"></div>
<div id="main-chirho">
 <div id="bar-chirho">
  <strong id="title-chirho">—</strong>
  <button id="prev-chirho" class="alt-chirho">◀ prev</button>
  <button id="next-chirho" class="alt-chirho">next ▶</button>
  <button id="newstroke-chirho" class="alt-chirho">+ new stroke</button>
  <button id="ext-chirho" class="alt-chirho">↳ extend end</button>
  <button id="delstroke-chirho" class="warn-chirho">⌫ stroke</button>
  <button id="reset-chirho" class="alt-chirho">reset seed</button>
  <label>pen <input id="pen-chirho" type="range" min="0.5" max="6" step="0.1" style="width:90px"><span id="penv-chirho"></span></label>
  <button id="save-chirho">💾 save (S)</button>
  <b id="mode-chirho" style="color:#ffcf3f"></b>
  <span id="scount-chirho"></span>
  <span id="stat-chirho"></span>
 </div>
 <canvas id="cv-chirho" width="800" height="520"></canvas>
 <div class="hint-chirho">
  <b>Goal: make every inked pixel CYAN.</b> Additive channels —
  <span style="color:#39f">BLUE</span> = scan ink the spine hasn't covered (under) ·
  <span style="color:#3e6">GREEN</span> = spine fill spilling outside the ink (over) ·
  <span style="color:#3dd">CYAN</span> = matched. Faint red line = the control
  polygon (straight hops between control points), NOT the stroke itself.
  <br>The bold yellow line above the canvas always shows the current
  <b>mode</b>. <b>EDIT</b> (default): click a point to select its stroke,
  drag to move, double-click the spine to insert a mid-point, Del removes the
  selected point. <b>+ new stroke</b> → ADDING: each click drops a point,
  Enter finishes, Esc cancels. <b>↳ extend end</b> → APPEND: clicks add
  points onto the nearest end of the selected stroke (lengthen it), Esc when
  done. <b>⌫ stroke</b> deletes the selected stroke. Seeds now start at the
  canonical count (aleph = 3, stroke 1 = the long diagonal). pen slider =
  brush width · S = save · n/p or list = change glyph.
 </div>
</div>
<script>
let SCALE_CHIRHO = 20;            // per-glyph, set in loadCurChirho to fit
const PAD_CHIRHO = 24;
let stateChirho = null, selStrokeChirho = 0, selPtChirho = -1,
    draggingChirho = false, modeChirho = 'edit', listChirho = [], curIdxChirho = 0;
const cvChirho = document.getElementById('cv-chirho');
const ctxChirho = cvChirho.getContext('2d');

function toCanvasChirho(p_chirho){ return [p_chirho[0]*SCALE_CHIRHO+PAD_CHIRHO, p_chirho[1]*SCALE_CHIRHO+PAD_CHIRHO]; }
function toNativeChirho(x_chirho,y_chirho){ return [(x_chirho-PAD_CHIRHO)/SCALE_CHIRHO, (y_chirho-PAD_CHIRHO)/SCALE_CHIRHO]; }
// The canvas is displayed at CSS size != its internal 800x520; mouse coords
// must be scaled by that ratio or every click is offset (was the "can't drag
// / points land random" bug).
function evCanvasChirho(e_chirho){
  const rb_chirho=cvChirho.getBoundingClientRect();
  return [ (e_chirho.clientX-rb_chirho.left)*(cvChirho.width/rb_chirho.width),
           (e_chirho.clientY-rb_chirho.top)*(cvChirho.height/rb_chirho.height) ];
}

function catmullChirho(ptsChirho, samplesChirho){
  if(ptsChirho.length < 3) return ptsChirho.slice();
  const outChirho=[]; const e_chirho=[ptsChirho[0],...ptsChirho,ptsChirho[ptsChirho.length-1]];
  for(let i_chirho=1;i_chirho<e_chirho.length-2;i_chirho++){
    const p0=e_chirho[i_chirho-1],p1=e_chirho[i_chirho],p2=e_chirho[i_chirho+1],p3=e_chirho[i_chirho+2];
    for(let s_chirho=0;s_chirho<samplesChirho;s_chirho++){
      const t=s_chirho/samplesChirho,t2=t*t,t3=t2*t;
      outChirho.push([
        0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
        0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
      ]);
    }
  }
  outChirho.push(ptsChirho[ptsChirho.length-1].slice());
  return outChirho;
}

// Native-resolution ink COVERAGE 0..1 (BLUE channel target) — grayscale,
// not thresholded, so edges fade at subpixel level.
let inkCovChirho = null, inkWChirho = 0, inkHChirho = 0;
const composeCanvasChirho = document.createElement('canvas');
function loadInkChirho(uriChirho, wChirho, hChirho, cbChirho){
  const imgChirho = new Image();
  imgChirho.onload = ()=>{
    const oc_chirho = document.createElement('canvas');
    oc_chirho.width=wChirho; oc_chirho.height=hChirho;
    const ox_chirho=oc_chirho.getContext('2d'); ox_chirho.drawImage(imgChirho,0,0);
    const d_chirho=ox_chirho.getImageData(0,0,wChirho,hChirho).data;
    const c_chirho=new Float32Array(wChirho*hChirho);
    for(let i_chirho=0,p_chirho=0;i_chirho<d_chirho.length;i_chirho+=4,p_chirho++){
      const lum_chirho=(d_chirho[i_chirho]+d_chirho[i_chirho+1]+d_chirho[i_chirho+2])/3;
      c_chirho[p_chirho]=Math.max(0,Math.min(1,(255-lum_chirho)/255));
    }
    inkCovChirho=c_chirho; inkWChirho=wChirho; inkHChirho=hChirho; cbChirho();
  };
  imgChirho.src=uriChirho;
}

function renderChirho(){
  if(!stateChirho) return;
  ctxChirho.clearRect(0,0,cvChirho.width,cvChirho.height);
  const wChirho=stateChirho.wChirho, hChirho=stateChirho.hChirho;
  const prChirho=stateChirho.penRadiusChirho;
  // Dense spine samples (native coords) for distance-based AA coverage.
  const sampChirho=[];
  for(const stChirho of stateChirho.strokesChirho){
    if(stChirho.length<2) continue;
    for(const q_chirho of catmullChirho(stChirho,12)) sampChirho.push(q_chirho);
  }
  // Additive RGB at native res, both channels SUBPIXEL (0..255 coverage):
  //   B = scan-ink grayscale coverage (soft edges from the scan)
  //   G = 1px-feathered fill = clamp(penR + 0.5 - dist-to-spine)
  // Equal coverage ⇒ identical B and G ⇒ pure cyan that fades cleanly.
  composeCanvasChirho.width=wChirho; composeCanvasChirho.height=hChirho;
  const cc_chirho=composeCanvasChirho.getContext('2d');
  const im_chirho=cc_chirho.createImageData(wChirho,hChirho);
  for(let yy_chirho=0;yy_chirho<hChirho;yy_chirho++){
    for(let xx_chirho=0;xx_chirho<wChirho;xx_chirho++){
      const p_chirho=yy_chirho*wChirho+xx_chirho;
      const px_chirho=xx_chirho+0.5, py_chirho=yy_chirho+0.5;
      let d2min_chirho=1e12;
      for(let s_chirho=0;s_chirho<sampChirho.length;s_chirho++){
        const dx_chirho=sampChirho[s_chirho][0]-px_chirho;
        const dy_chirho=sampChirho[s_chirho][1]-py_chirho;
        const d2_chirho=dx_chirho*dx_chirho+dy_chirho*dy_chirho;
        if(d2_chirho<d2min_chirho) d2min_chirho=d2_chirho;
      }
      const gCov_chirho = sampChirho.length
        ? Math.max(0,Math.min(1, prChirho+0.5-Math.sqrt(d2min_chirho))) : 0;
      const bCov_chirho = inkCovChirho ? inkCovChirho[p_chirho] : 0;
      im_chirho.data[p_chirho*4]=0;
      im_chirho.data[p_chirho*4+1]=Math.round(gCov_chirho*255);
      im_chirho.data[p_chirho*4+2]=Math.round(bCov_chirho*255);
      im_chirho.data[p_chirho*4+3]=255;
    }
  }
  cc_chirho.putImageData(im_chirho,0,0);
  ctxChirho.fillStyle='#000';
  ctxChirho.fillRect(PAD_CHIRHO,PAD_CHIRHO,wChirho*SCALE_CHIRHO,hChirho*SCALE_CHIRHO);
  ctxChirho.imageSmoothingEnabled=true;          // bilinear ⇒ subpixel fade
  ctxChirho.drawImage(composeCanvasChirho, PAD_CHIRHO, PAD_CHIRHO,
    wChirho*SCALE_CHIRHO, hChirho*SCALE_CHIRHO);
  document.getElementById('scount-chirho').textContent =
    'strokes: '+stateChirho.strokesChirho.length+' · sel #'+(selStrokeChirho+1);
  // RED spine + control points
  stateChirho.strokesChirho.forEach((stChirho,si_chirho)=>{
    const isSel_chirho = si_chirho===selStrokeChirho;
    ctxChirho.strokeStyle=isSel_chirho?'#ff3b30':'#c0394b';
    ctxChirho.lineWidth=isSel_chirho?2:1;
    ctxChirho.beginPath();
    stChirho.forEach((p_chirho,k_chirho)=>{ const c_chirho=toCanvasChirho(p_chirho);
      if(k_chirho===0) ctxChirho.moveTo(c_chirho[0],c_chirho[1]); else ctxChirho.lineTo(c_chirho[0],c_chirho[1]); });
    ctxChirho.stroke();
    stChirho.forEach((p_chirho,k_chirho)=>{
      const c_chirho=toCanvasChirho(p_chirho);
      const endC_chirho = (k_chirho===0||k_chirho===stChirho.length-1);
      const selThis_chirho = isSel_chirho && k_chirho===selPtChirho;
      ctxChirho.fillStyle = selThis_chirho?'#ffd400':(endC_chirho?'#e3144a':'#11b7d6');
      const r_chirho = selThis_chirho?7:(endC_chirho?6:5);
      ctxChirho.beginPath();
      if(endC_chirho){ ctxChirho.arc(c_chirho[0],c_chirho[1],r_chirho,0,7); ctxChirho.fill(); }
      else { ctxChirho.fillRect(c_chirho[0]-r_chirho,c_chirho[1]-r_chirho,2*r_chirho,2*r_chirho); }
    });
  });
}

function statChirho(msgChirho){ document.getElementById('stat-chirho').textContent = msgChirho||''; }

function buildSideChirho(){
  const sChirho=document.getElementById('side-chirho'); sChirho.replaceChildren();
  listChirho.forEach((it_chirho,i_chirho)=>{
    const b_chirho=document.createElement('button');
    b_chirho.textContent=it_chirho.letterChirho+'  '+it_chirho.keyChirho.split('/')[1].replace('-chirho.png','').replace('vol-1-word-','w');
    if(i_chirho===curIdxChirho) b_chirho.classList.add('cur-chirho');
    if(it_chirho.savedChirho) b_chirho.classList.add('has-chirho');
    b_chirho.onclick=()=>{ curIdxChirho=i_chirho; loadCurChirho(); };
    sChirho.appendChild(b_chirho);
  });
}

async function loadCurChirho(){
  const itChirho=listChirho[curIdxChirho];
  const rChirho=await fetch('/spine-chirho?key='+encodeURIComponent(itChirho.keyChirho));
  stateChirho=await rChirho.json();
  // Fit the WHOLE glyph (incl. long descenders like final-nun) in view —
  // pick a scale so w*scale and h*scale stay within the box, then size the
  // canvas to match so nothing drops below the fold.
  const maxWChirho=940, maxHChirho=700;
  SCALE_CHIRHO = Math.max(6, Math.min(30, Math.floor(Math.min(
    (maxWChirho-2*PAD_CHIRHO)/Math.max(1,stateChirho.wChirho),
    (maxHChirho-2*PAD_CHIRHO)/Math.max(1,stateChirho.hChirho)))));
  cvChirho.width  = stateChirho.wChirho*SCALE_CHIRHO + 2*PAD_CHIRHO;
  cvChirho.height = stateChirho.hChirho*SCALE_CHIRHO + 2*PAD_CHIRHO;
  selStrokeChirho=0; selPtChirho=-1; setModeChirho('edit');
  document.getElementById('title-chirho').textContent =
    stateChirho.letterChirho+'  '+stateChirho.keyChirho+(stateChirho.savedChirho?'  ✓saved':'  (seed)');
  document.getElementById('pen-chirho').value=stateChirho.penRadiusChirho;
  document.getElementById('penv-chirho').textContent=stateChirho.penRadiusChirho.toFixed(1);
  buildSideChirho();
  loadInkChirho(stateChirho.dataUriChirho, stateChirho.wChirho, stateChirho.hChirho, renderChirho);
  statChirho('');
}

function hitChirho(mx_chirho,my_chirho){
  for(let si_chirho=0;si_chirho<stateChirho.strokesChirho.length;si_chirho++){
    const st_chirho=stateChirho.strokesChirho[si_chirho];
    for(let k_chirho=0;k_chirho<st_chirho.length;k_chirho++){
      const c_chirho=toCanvasChirho(st_chirho[k_chirho]);
      if(Math.hypot(c_chirho[0]-mx_chirho,c_chirho[1]-my_chirho)<9) return [si_chirho,k_chirho];
    }
  }
  return null;
}

function setModeChirho(m_chirho){
  modeChirho=m_chirho;
  const el_chirho=document.getElementById('mode-chirho');
  document.getElementById('newstroke-chirho').style.outline = m_chirho==='add'?'2px solid #ffcf3f':'none';
  document.getElementById('ext-chirho').style.outline = m_chirho==='append'?'2px solid #ffcf3f':'none';
  cvChirho.style.cursor = m_chirho==='edit'?'crosshair':'copy';
  el_chirho.textContent =
    m_chirho==='add' ? '● ADDING STROKE — click to place points · Enter finish · Esc cancel'
    : m_chirho==='append' ? '● APPEND stroke #'+(selStrokeChirho+1)+' — click near an end · Esc done'
    : '✎ EDIT — click point=select · drag=move · dbl-click spine=insert pt · Del=remove pt';
}
function nearestEndChirho(st_chirho,mx_chirho,my_chirho){
  const a_chirho=toCanvasChirho(st_chirho[0]), b_chirho=toCanvasChirho(st_chirho[st_chirho.length-1]);
  return Math.hypot(a_chirho[0]-mx_chirho,a_chirho[1]-my_chirho) <=
         Math.hypot(b_chirho[0]-mx_chirho,b_chirho[1]-my_chirho) ? 'start':'end';
}

cvChirho.addEventListener('mousedown',(e_chirho)=>{
  if(!stateChirho) return;
  const [mx_chirho,my_chirho]=evCanvasChirho(e_chirho);
  const np_chirho=toNativeChirho(mx_chirho,my_chirho);
  if(modeChirho==='add'){
    stateChirho.strokesChirho[selStrokeChirho].push(np_chirho); renderChirho(); return;
  }
  if(modeChirho==='append'){
    const st_chirho=stateChirho.strokesChirho[selStrokeChirho];
    if(st_chirho && st_chirho.length){
      if(nearestEndChirho(st_chirho,mx_chirho,my_chirho)==='start') st_chirho.unshift(np_chirho);
      else st_chirho.push(np_chirho);
      renderChirho();
    }
    return;
  }
  const h_chirho=hitChirho(mx_chirho,my_chirho);
  if(h_chirho){ selStrokeChirho=h_chirho[0]; selPtChirho=h_chirho[1]; draggingChirho=true; renderChirho(); }
});
cvChirho.addEventListener('mousemove',(e_chirho)=>{
  if(!draggingChirho||selPtChirho<0) return;
  const [mx_chirho,my_chirho]=evCanvasChirho(e_chirho);
  stateChirho.strokesChirho[selStrokeChirho][selPtChirho]=toNativeChirho(mx_chirho,my_chirho);
  renderChirho();
});
window.addEventListener('mouseup',()=>{ draggingChirho=false; });

cvChirho.addEventListener('dblclick',(e_chirho)=>{
  if(!stateChirho || modeChirho!=='edit') return;
  const [mx_chirho,my_chirho]=evCanvasChirho(e_chirho);
  const np_chirho=toNativeChirho(mx_chirho,my_chirho);
  const st_chirho=stateChirho.strokesChirho[selStrokeChirho]; if(!st_chirho||st_chirho.length<2) return;
  let bestI_chirho=1, bestD_chirho=1e9;
  for(let k_chirho=1;k_chirho<st_chirho.length;k_chirho++){
    const a_chirho=toCanvasChirho(st_chirho[k_chirho-1]), b_chirho=toCanvasChirho(st_chirho[k_chirho]);
    const mid_chirho=[(a_chirho[0]+b_chirho[0])/2,(a_chirho[1]+b_chirho[1])/2];
    const d_chirho=Math.hypot(mid_chirho[0]-mx_chirho,mid_chirho[1]-my_chirho);
    if(d_chirho<bestD_chirho){bestD_chirho=d_chirho;bestI_chirho=k_chirho;}
  }
  st_chirho.splice(bestI_chirho,0,np_chirho); selPtChirho=bestI_chirho; renderChirho();
});

function finishAddChirho(discardShortChirho){
  const st_chirho=stateChirho.strokesChirho[selStrokeChirho];
  if(st_chirho && st_chirho.length<2){
    stateChirho.strokesChirho.splice(selStrokeChirho,1); selStrokeChirho=0; selPtChirho=-1;
  }
  setModeChirho('edit'); renderChirho();
}
window.addEventListener('keydown',(e_chirho)=>{
  if(!stateChirho) return;
  if(e_chirho.key==='Escape'){ finishAddChirho(true); statChirho('cancelled'); return; }
  if(e_chirho.key==='Enter' && modeChirho==='add'){ finishAddChirho(false); statChirho('stroke added'); return; }
  if(e_chirho.key==='Delete'||e_chirho.key==='Backspace'){
    const st_chirho=stateChirho.strokesChirho[selStrokeChirho];
    if(st_chirho && selPtChirho>=0 && st_chirho.length>2){ st_chirho.splice(selPtChirho,1); selPtChirho=-1; renderChirho(); }
    e_chirho.preventDefault(); return;
  }
  if(e_chirho.key==='s'){ document.getElementById('save-chirho').click(); }
  else if(e_chirho.key==='n'){ document.getElementById('next-chirho').click(); }
  else if(e_chirho.key==='p'){ document.getElementById('prev-chirho').click(); }
});

document.getElementById('newstroke-chirho').onclick=()=>{
  stateChirho.strokesChirho.push([]); selStrokeChirho=stateChirho.strokesChirho.length-1;
  selPtChirho=-1; setModeChirho('add'); renderChirho();
};
document.getElementById('ext-chirho').onclick=()=>{
  const st_chirho=stateChirho.strokesChirho[selStrokeChirho];
  if(!st_chirho||!st_chirho.length){ statChirho('select a stroke first (click one of its points)'); return; }
  setModeChirho('append'); renderChirho();
};
document.getElementById('delstroke-chirho').onclick=()=>{
  if(stateChirho.strokesChirho.length<=1) return;
  stateChirho.strokesChirho.splice(selStrokeChirho,1); selStrokeChirho=0; selPtChirho=-1;
  setModeChirho('edit'); renderChirho();
};
document.getElementById('reset-chirho').onclick=async()=>{
  const rChirho=await fetch('/spine-chirho?key='+encodeURIComponent(stateChirho.keyChirho)+'&seed=1');
  const sChirho=await rChirho.json(); stateChirho.strokesChirho=sChirho.strokesChirho;
  stateChirho.penRadiusChirho=sChirho.penRadiusChirho;
  document.getElementById('pen-chirho').value=stateChirho.penRadiusChirho;
  document.getElementById('penv-chirho').textContent=stateChirho.penRadiusChirho.toFixed(1);
  selStrokeChirho=0;selPtChirho=-1; setModeChirho('edit'); renderChirho(); statChirho('reset to seed');
};
document.getElementById('pen-chirho').oninput=(e_chirho)=>{
  stateChirho.penRadiusChirho=parseFloat(e_chirho.target.value);
  document.getElementById('penv-chirho').textContent=stateChirho.penRadiusChirho.toFixed(1);
  renderChirho();
};
document.getElementById('next-chirho').onclick=()=>{ curIdxChirho=(curIdxChirho+1)%listChirho.length; loadCurChirho(); };
document.getElementById('prev-chirho').onclick=()=>{ curIdxChirho=(curIdxChirho-1+listChirho.length)%listChirho.length; loadCurChirho(); };
document.getElementById('save-chirho').onclick=async()=>{
  statChirho('saving…');
  const rChirho=await fetch('/save-spine-chirho',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({keyChirho:stateChirho.keyChirho,penRadiusChirho:stateChirho.penRadiusChirho,strokesChirho:stateChirho.strokesChirho})});
  const jChirho=await rChirho.json();
  if(jChirho.okChirho){ listChirho[curIdxChirho].savedChirho=true; buildSideChirho();
    document.getElementById('title-chirho').textContent=stateChirho.letterChirho+'  '+stateChirho.keyChirho+'  ✓saved';
    statChirho('saved'); } else statChirho('ERR '+(jChirho.errorChirho||'?'));
};

(async function initChirho(){
  listChirho=await (await fetch('/glyph-list-chirho')).json();
  if(listChirho.length){ buildSideChirho(); loadCurChirho(); }
})();
</script></body></html>`;

Bun.serve({
  port: PORT_CHIRHO,
  async fetch(reqChirho) {
    const uChirho = new URL(reqChirho.url);
    if (uChirho.pathname === "/") {
      return new Response(PAGE_CHIRHO, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (uChirho.pathname === "/glyph-list-chirho") {
      return Response.json(glyphListChirho());
    }
    if (uChirho.pathname === "/spine-chirho") {
      const keyChirho = uChirho.searchParams.get("key") || "";
      if (uChirho.searchParams.get("seed") === "1") {
        const sChirho = seedsChirho[keyChirho];
        return Response.json(
          sChirho
            ? { strokesChirho: sChirho.strokesChirho, penRadiusChirho: sChirho.penRadiusChirho }
            : { strokesChirho: [], penRadiusChirho: 2 },
        );
      }
      const pChirho = spinePayloadChirho(keyChirho);
      return pChirho
        ? Response.json(pChirho)
        : new Response("not found", { status: 404 });
    }
    if (uChirho.pathname === "/save-spine-chirho" && reqChirho.method === "POST") {
      try {
        const bChirho = (await reqChirho.json()) as {
          keyChirho: string;
          penRadiusChirho: number;
          strokesChirho: number[][][];
        };
        const keyPartsChirho = parseGlyphKeyChirho(bChirho.keyChirho);
        const strokesJsonChirho = JSON.stringify(bChirho.strokesChirho);
        upsertSpineStmtChirho.run(
          keyPartsChirho.cpHexChirho,
          keyPartsChirho.letterChirho,
          keyPartsChirho.fileChirho,
          bChirho.penRadiusChirho,
          strokesJsonChirho,
          EDITOR_CHIRHO,
        );
        const sidecarChirho = join(
          SPINES_DIR_CHIRHO,
          keyPartsChirho.cpDirChirho,
          keyPartsChirho.fileChirho.replace(/\.png$/, ".json"),
        );
        writeTextAtomicChirho(
          sidecarChirho,
          JSON.stringify(
            {
              keyChirho: bChirho.keyChirho,
              letterChirho: keyPartsChirho.letterChirho,
              penRadiusChirho: bChirho.penRadiusChirho,
              strokesChirho: bChirho.strokesChirho,
              savedByChirho: EDITOR_CHIRHO,
              tsChirho: new Date().toISOString(),
            },
            null,
            1,
          ),
        );
        return Response.json({ okChirho: true });
      } catch (errorChirho: any) {
        return Response.json({
          okChirho: false,
          errorChirho: String(errorChirho?.message ?? errorChirho),
        });
      }
    }
    return new Response("not found", { status: 404 });
  },
});
console.log(`glyph-spine-editor-chirho on http://localhost:${PORT_CHIRHO}/`);
