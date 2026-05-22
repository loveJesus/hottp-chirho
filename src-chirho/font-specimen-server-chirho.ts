// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16
//
// Font-specimen server (:8770). Renders every saved spine
// (glyph_spines_chirho) through the real stroke pipeline; you mark the
// KEEPers and one button backs up + deletes every spine you did NOT keep.
// Backups append to glyph-spines-chirho/_pruned-backup-chirho.jsonl
// (recoverable — never hard-lost).
//
//   bun src-chirho/font-specimen-server-chirho.ts

import { Database } from "bun:sqlite";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { join, dirname } from "path";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const PORT_CHIRHO = 8770;
const SRC_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "src-chirho");
const PY_CHIRHO = join(
  PROJECT_ROOT_CHIRHO, "workspace-chirho", "classifier-venv-chirho", "bin", "python3",
);
const HTML_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO, "workspace-chirho", "strokes-view-chirho", "specimen-chirho.html",
);
const DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");
const SPINES_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "glyph-spines-chirho");
const BACKUP_PATH_CHIRHO = join(SPINES_DIR_CHIRHO, "_pruned-backup-chirho.jsonl");

function regenSpecimenChirho() {
  const procChirho = Bun.spawnSync({
    cmd: [PY_CHIRHO, "font_specimen_chirho.py"],
    cwd: SRC_DIR_CHIRHO,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (procChirho.exitCode !== 0) {
    console.error("specimen regen failed:", procChirho.stderr.toString().slice(-800));
  }
}

const dbChirho = new Database(DB_PATH_CHIRHO);
const allRowsStmtChirho = dbChirho.prepare(
  "SELECT id_chirho, codepoint_chirho, letter_chirho, filename_chirho, " +
  "pen_radius_chirho, strokes_json_chirho FROM glyph_spines_chirho",
);
const delStmtChirho = dbChirho.prepare(
  "DELETE FROM glyph_spines_chirho WHERE codepoint_chirho=? AND filename_chirho=?",
);

console.log("generating initial specimen…");
regenSpecimenChirho();

Bun.serve({
  port: PORT_CHIRHO,
  async fetch(reqChirho) {
    const uChirho = new URL(reqChirho.url);

    if (uChirho.pathname === "/") {
      if (!existsSync(HTML_PATH_CHIRHO)) regenSpecimenChirho();
      return new Response(readFileSync(HTML_PATH_CHIRHO), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (uChirho.pathname === "/purge-unkept-chirho" && reqChirho.method === "POST") {
      try {
        const bodyChirho = (await reqChirho.json()) as {
          keptChirho: { cpChirho: string; fnChirho: string }[];
        };
        const keepSetChirho = new Set(
          bodyChirho.keptChirho.map((k_chirho) => `${k_chirho.cpChirho}/${k_chirho.fnChirho}`),
        );
        const rowsChirho = allRowsStmtChirho.all() as any[];
        let deletedChirho = 0;
        mkdirSync(dirname(BACKUP_PATH_CHIRHO), { recursive: true });
        for (const rChirho of rowsChirho) {
          const keyChirho = `${rChirho.codepoint_chirho}/${rChirho.filename_chirho}`;
          if (keepSetChirho.has(keyChirho)) continue;
          // backup the full row first (never hard-lost)
          appendFileSync(
            BACKUP_PATH_CHIRHO,
            JSON.stringify({
              tsChirho: new Date().toISOString(),
              viaChirho: "font-specimen-purge-chirho",
              idChirho: rChirho.id_chirho,
              codepointChirho: rChirho.codepoint_chirho,
              letterChirho: rChirho.letter_chirho,
              filenameChirho: rChirho.filename_chirho,
              penRadiusChirho: rChirho.pen_radius_chirho,
              strokesJsonChirho: rChirho.strokes_json_chirho,
            }) + "\n",
          );
          delStmtChirho.run(rChirho.codepoint_chirho, rChirho.filename_chirho);
          const sidecarChirho = join(
            SPINES_DIR_CHIRHO,
            `U+${rChirho.codepoint_chirho}`,
            rChirho.filename_chirho.replace(/\.png$/, ".json"),
          );
          if (existsSync(sidecarChirho)) rmSync(sidecarChirho);
          deletedChirho++;
        }
        regenSpecimenChirho();
        return Response.json({
          okChirho: true,
          deletedChirho,
          keptChirho: keepSetChirho.size,
        });
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
console.log(`font-specimen-server-chirho on http://localhost:${PORT_CHIRHO}/`);
