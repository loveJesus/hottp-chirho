// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16
//
// Glyph-review server: shows every clipped glyph PNG in the v3 bitmap font,
// upscaled, grouped by letter, with the automated suspect hints surfaced but
// NOT trusted. The human verdict is ground truth and is persisted to
// progress-chirho.sqlite (glyph_flags_chirho). A "bad" verdict moves the PNG
// (+ sidecar) into workspace-chirho/bitmap-font-quarantine-chirho/ so the
// synthesizer stops using it — the file is preserved, never deleted
// (persist-human-data / never-destroy-hard-to-regenerate-state).
//
//   bun src-chirho/glyph-review-server-chirho.ts   ->   http://localhost:8766/

import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
} from "fs";
import { join, dirname } from "path";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { parseGlyphKeyChirho } from "./glyph-key-chirho.ts";

const PORT_CHIRHO = 8766;
const FONT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "bitmap-font-v3-chirho");
const QUARANTINE_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "bitmap-font-quarantine-chirho",
);
const SUSPECTS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "models-chirho",
  "glyph-suspects-chirho.json",
);
const DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const REVIEWER_CHIRHO = "human-glyph-review-chirho";

const dbChirho = new Database(DB_PATH_CHIRHO);
dbChirho
  .prepare(
    `CREATE TABLE IF NOT EXISTS glyph_flags_chirho (
       id_chirho          INTEGER PRIMARY KEY AUTOINCREMENT,
       codepoint_chirho   TEXT NOT NULL,
       letter_chirho      TEXT NOT NULL,
       filename_chirho    TEXT NOT NULL,
       verdict_chirho     TEXT NOT NULL,
       reasons_chirho     TEXT,
       flagged_by_chirho  TEXT NOT NULL,
       ts_chirho          TEXT NOT NULL DEFAULT (datetime('now')),
       UNIQUE(codepoint_chirho, filename_chirho)
     )`,
  )
  .run();
const upsertVerdictStmtChirho = dbChirho.prepare(
  `INSERT INTO glyph_flags_chirho
     (codepoint_chirho, letter_chirho, filename_chirho, verdict_chirho, reasons_chirho, flagged_by_chirho, ts_chirho)
   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
   ON CONFLICT(codepoint_chirho, filename_chirho)
   DO UPDATE SET verdict_chirho=excluded.verdict_chirho,
                 reasons_chirho=excluded.reasons_chirho,
                 flagged_by_chirho=excluded.flagged_by_chirho,
                 ts_chirho=datetime('now')`,
);
const verdictRowsStmtChirho = dbChirho.prepare(
  `SELECT codepoint_chirho, filename_chirho, verdict_chirho FROM glyph_flags_chirho`,
);

let suspectsChirho: Record<string, { suspectChirho: boolean; reasonsChirho: string[] }> = {};
if (existsSync(SUSPECTS_PATH_CHIRHO)) {
  suspectsChirho = JSON.parse(readFileSync(SUSPECTS_PATH_CHIRHO, "utf8"));
}

function listGlyphsChirho() {
  const outChirho: {
    keyChirho: string;
    cpHexChirho: string;
    letterChirho: string;
    fileChirho: string;
    dataUriChirho: string;
    reasonsChirho: string[];
  }[] = [];
  if (!existsSync(FONT_DIR_CHIRHO)) return outChirho;
  for (const cpDirChirho of readdirSync(FONT_DIR_CHIRHO).sort()) {
    if (!cpDirChirho.startsWith("U+")) continue;
    const cpHexChirho = cpDirChirho.slice(2);
    const letterChirho = String.fromCodePoint(parseInt(cpHexChirho, 16));
    const dirPathChirho = join(FONT_DIR_CHIRHO, cpDirChirho);
    for (const fileChirho of readdirSync(dirPathChirho).sort()) {
      if (!fileChirho.endsWith(".png")) continue;
      const keyChirho = `${cpDirChirho}/${fileChirho}`;
      const bytesChirho = readFileSync(join(dirPathChirho, fileChirho));
      const dataUriChirho =
        "data:image/png;base64," + bytesChirho.toString("base64");
      outChirho.push({
        keyChirho,
        cpHexChirho,
        letterChirho,
        fileChirho,
        dataUriChirho,
        reasonsChirho: suspectsChirho[keyChirho]?.reasonsChirho ?? [],
      });
    }
  }
  return outChirho;
}

function quarantineChirho(keyChirho: string): string {
  const srcChirho = join(FONT_DIR_CHIRHO, keyChirho);
  const dstChirho = join(QUARANTINE_DIR_CHIRHO, keyChirho);
  mkdirSync(dirname(dstChirho), { recursive: true });
  if (existsSync(srcChirho)) renameSync(srcChirho, dstChirho);
  const sidecarChirho = srcChirho.replace(/\.png$/, ".json");
  if (existsSync(sidecarChirho)) {
    renameSync(sidecarChirho, dstChirho.replace(/\.png$/, ".json"));
  }
  return dstChirho;
}

function restoreChirho(keyChirho: string): string {
  const srcChirho = join(QUARANTINE_DIR_CHIRHO, keyChirho);
  const dstChirho = join(FONT_DIR_CHIRHO, keyChirho);
  mkdirSync(dirname(dstChirho), { recursive: true });
  if (existsSync(srcChirho)) renameSync(srcChirho, dstChirho);
  const sidecarChirho = srcChirho.replace(/\.png$/, ".json");
  if (existsSync(sidecarChirho)) {
    renameSync(sidecarChirho, dstChirho.replace(/\.png$/, ".json"));
  }
  return dstChirho;
}

function renderPageChirho(): string {
  const glyphsChirho = listGlyphsChirho();
  const verdictMapChirho = new Map<string, string>();
  for (const rChirho of verdictRowsStmtChirho.all() as any[]) {
    verdictMapChirho.set(
      `U+${rChirho.codepoint_chirho}/${rChirho.filename_chirho}`,
      rChirho.verdict_chirho,
    );
  }
  const byLetterChirho = new Map<string, typeof glyphsChirho>();
  for (const gChirho of glyphsChirho) {
    if (!byLetterChirho.has(gChirho.cpHexChirho))
      byLetterChirho.set(gChirho.cpHexChirho, []);
    byLetterChirho.get(gChirho.cpHexChirho)!.push(gChirho);
  }

  const sectionsChirho: string[] = [];
  for (const [cpHexChirho, listChirho] of byLetterChirho) {
    const letterChirho = String.fromCodePoint(parseInt(cpHexChirho, 16));
    const cardsChirho = listChirho
      .map((gChirho) => {
        const vChirho = verdictMapChirho.get(gChirho.keyChirho) ?? "";
        const suspectChirho = gChirho.reasonsChirho.length > 0;
        const badgeChirho = suspectChirho
          ? `<div class="reasons-chirho">⚠ ${gChirho.reasonsChirho.join(", ")}</div>`
          : "";
        return `<div class="card-chirho ${suspectChirho ? "suspect-chirho" : ""} ${
          vChirho ? "done-" + vChirho : ""
        }" data-key-chirho="${gChirho.keyChirho}">
          <img src="${gChirho.dataUriChirho}" class="glyph-chirho" alt="">
          <div class="fn-chirho">${gChirho.fileChirho}</div>
          ${badgeChirho}
          <div class="btns-chirho">
            <button class="good-chirho" onclick="verdictChirho(this,'good-chirho')">✓ good</button>
            <button class="bad-chirho" onclick="verdictChirho(this,'bad-cut-chirho')">✗ bad cut</button>
          </div>
          <div class="state-chirho">${vChirho}</div>
        </div>`;
      })
      .join("");
    sectionsChirho.push(
      `<section><h2>${letterChirho} <span class="cp-chirho">U+${cpHexChirho}</span> <span class="n-chirho">${listChirho.length}</span></h2><div class="grid-chirho">${cardsChirho}</div></section>`,
    );
  }

  const suspectCountChirho = glyphsChirho.filter(
    (gChirho) => gChirho.reasonsChirho.length > 0,
  ).length;

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Glyph review — flag bad cuts</title><style>
  body{background:#0a0a14;color:#e0e0e0;font-family:system-ui,sans-serif;margin:0;padding:1rem}
  h1{font-size:1rem;color:#c9a84c}
  .meta-chirho{color:#888;font-size:.8rem;margin:.3rem 0 1rem}
  section{margin-bottom:1.5rem;border-top:1px solid #2a2a4a;padding-top:.6rem}
  h2{font-size:1.4rem;margin:.2rem 0;color:#e0e0e0}
  .cp-chirho{font-size:.8rem;color:#666}.n-chirho{font-size:.8rem;color:#888}
  .grid-chirho{display:flex;flex-wrap:wrap;gap:.6rem}
  .card-chirho{background:#11111e;border:2px solid #222;border-radius:6px;padding:.4rem;width:130px;text-align:center}
  .card-chirho.suspect-chirho{border-color:#9a6b1c}
  .card-chirho.done-bad-cut-chirho{opacity:.32;border-color:#a33}
  .card-chirho.done-good-chirho{border-color:#3a7}
  .glyph-chirho{height:120px;width:auto;background:#fff;image-rendering:pixelated;border-radius:3px}
  .fn-chirho{font-size:.55rem;color:#777;word-break:break-all;margin:.25rem 0}
  .reasons-chirho{font-size:.62rem;color:#e0a93c;margin-bottom:.25rem}
  .btns-chirho{display:flex;gap:.25rem;justify-content:center}
  button{cursor:pointer;border:0;border-radius:4px;padding:.3rem .4rem;font-size:.7rem}
  .good-chirho{background:#1f5e3a;color:#dfe}.bad-chirho{background:#7a2230;color:#fde}
  .state-chirho{font-size:.62rem;color:#9aa;margin-top:.25rem;min-height:.8rem}
</style></head><body>
<h1>Glyph review — flag erroneous clipped PNGs</h1>
<p class="meta-chirho">${glyphsChirho.length} glyphs · ${suspectCountChirho} auto-suspect (⚠ hint only — Hebrew flat toplines false-trigger "clipped"; trust your eye). "✗ bad cut" quarantines the file (preserved, not deleted) and stops the synthesizer using it. Verdicts saved to glyph_flags_chirho.</p>
${sectionsChirho.join("")}
<script>
async function verdictChirho(btnChirho, vChirho){
  const cardChirho = btnChirho.closest('.card-chirho');
  const keyChirho = cardChirho.getAttribute('data-key-chirho');
  const stateChirho = cardChirho.querySelector('.state-chirho');
  stateChirho.textContent = '…';
  try{
    const respChirho = await fetch('/verdict-chirho', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({keyChirho: keyChirho, verdictChirho: vChirho})
    });
    const jChirho = await respChirho.json();
    if(jChirho.okChirho){
      cardChirho.classList.remove('done-good-chirho','done-bad-cut-chirho');
      cardChirho.classList.add('done-'+vChirho);
      stateChirho.textContent = (vChirho==='bad-cut-chirho')
        ? 'quarantined' : 'kept (good)';
    } else {
      stateChirho.textContent = 'ERR: ' + (jChirho.errorChirho||'?');
    }
  }catch(eChirho){ stateChirho.textContent = 'ERR'; }
}
</script>
</body></html>`;
}

Bun.serve({
  port: PORT_CHIRHO,
  async fetch(reqChirho) {
    const urlChirho = new URL(reqChirho.url);
    if (urlChirho.pathname === "/") {
      return new Response(renderPageChirho(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    if (urlChirho.pathname === "/verdict-chirho" && reqChirho.method === "POST") {
      try {
        const bodyChirho = (await reqChirho.json()) as {
          keyChirho: string;
          verdictChirho: string;
        };
        const keyChirho = bodyChirho.keyChirho;
        const verdictChirho = bodyChirho.verdictChirho;
        const keyPartsChirho = parseGlyphKeyChirho(keyChirho);
        const reasonsChirho = (suspectsChirho[keyChirho]?.reasonsChirho ?? []).join(
          ",",
        );
        if (verdictChirho === "bad-cut-chirho") {
          quarantineChirho(keyChirho);
        } else if (verdictChirho === "restored-chirho") {
          restoreChirho(keyChirho);
        }
        upsertVerdictStmtChirho.run(
          keyPartsChirho.cpHexChirho,
          keyPartsChirho.letterChirho,
          keyPartsChirho.fileChirho,
          verdictChirho,
          reasonsChirho,
          REVIEWER_CHIRHO,
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
console.log(`glyph-review-server-chirho on http://localhost:${PORT_CHIRHO}/`);
