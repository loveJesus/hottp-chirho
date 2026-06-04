// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Vision transcription of unknown-script Pass-C spans.
 *
 * pdftotext mangles non-Latin (Hebrew / Arabic / Greek / Syriac) into garble,
 * which assembles as scriptChirho="unknown-chirho" spans. The content is still
 * legible in the page images, so a vision model (Claude) reads each span crop
 * and supplies the correct script + UTF-8 text. Recorded honestly as
 * provenanceChirho="vision-chirho" — a machine 2nd-witness, NOT human-chirho;
 * vocalized Hebrew still wants a human/WLC confirmation pass downstream.
 *
 * Two modes:
 *   --vol=5 --page=54 --crop
 *     Crop every unknown-script span out of its local line image into
 *     workspace-chirho/vision-unknown-chirho/vol-V-page-PPPP-chirho/ and emit a
 *     verdicts template JSON (one entry per span; scriptChirho/utf8TextChirho blank).
 *   --verdicts=<path> [--apply] [--reviewer=codex-vision-chirho]
 *     Read the filled template, staleness-check each span, and (with --apply)
 *     stamp scriptChirho + utf8TextChirho + provenanceChirho="vision-chirho" into
 *     the span file, appending an audit row. Dry-run by default.
 */

import { Database } from "bun:sqlite";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "./span-nfc-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "vision-transcribe-unknown-chirho";
const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const SCANLINES_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const OUT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "vision-unknown-chirho");
const EXPORT_REPORT_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "markdown-chirho", "export-report-chirho.json");
const DEFAULT_REVIEWER_CHIRHO = "claude-opus-vision-chirho";
const ALLOWED_SCRIPTS_CHIRHO = new Set([
  "hebrew-chirho", "arabic-chirho", "greek-chirho", "syriac-chirho",
  "latin-non-french-chirho", "french-chirho", "symbol-chirho",
]);

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
}
interface SpanLineChirho {
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho?: number;
  spansChirho: SpanChirho[];
}
interface VerdictChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  garbleTextChirho: string;
  scriptChirho: string;
  utf8TextChirho: string;
  notesChirho?: string;
}

function argChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const pChirho = `--${nameChirho}=`;
  return argsChirho.find((aChirho) => aChirho.startsWith(pChirho))?.slice(pChirho.length);
}
function lineFilePathChirho(volChirho: number, pageChirho: number, lineChirho: number): string {
  return join(SPANS_DIR_CHIRHO, `vol-${volChirho}-chirho`, `page-${String(pageChirho).padStart(4, "0")}-chirho`, `line-${String(lineChirho).padStart(3, "0")}-chirho.json`);
}
function lineImagePathChirho(volChirho: number, pageChirho: number, lineChirho: number): string {
  return join(SCANLINES_DIR_CHIRHO, `vol-${volChirho}-chirho`, `page-${String(pageChirho).padStart(4, "0")}-chirho`, `line-${String(lineChirho).padStart(3, "0")}-chirho.png`);
}
function imageWidthChirho(pathChirho: string): number | null {
  const rChirho = spawnSync("magick", ["identify", "-format", "%w", pathChirho], { encoding: "utf8" });
  if (rChirho.status !== 0) return null;
  const wChirho = parseInt((rChirho.stdout || "").trim(), 10);
  return Number.isFinite(wChirho) ? wChirho : null;
}

function ensureAuditTableChirho(dbChirho: Database): void {
  dbChirho.run(`CREATE TABLE IF NOT EXISTS pass_c_vision_validations_chirho (
    id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
    volume_chirho INTEGER NOT NULL, page_chirho INTEGER NOT NULL,
    line_index_chirho INTEGER NOT NULL, segment_index_chirho INTEGER NOT NULL,
    original_text_chirho TEXT NOT NULL, original_text_hash_chirho TEXT NOT NULL,
    vision_script_chirho TEXT NOT NULL, vision_text_chirho TEXT,
    notes_chirho TEXT, reviewer_chirho TEXT NOT NULL,
    created_at_chirho TEXT NOT NULL, applied_at_chirho TEXT, applied_to_file_chirho TEXT)`);
}

function cropModeChirho(volChirho: number, pageChirho: number): void {
  const reportChirho = JSON.parse(readFileSync(EXPORT_REPORT_PATH_CHIRHO, "utf8")) as {
    issuesChirho: Array<{ codeChirho: string; volumeChirho: number; pageChirho: number; lineIndexChirho?: number; segmentIndexChirho?: number }>;
  };
  const unknownChirho = reportChirho.issuesChirho.filter(
    (iChirho) => iChirho.codeChirho === "unknown-script-chirho" && iChirho.volumeChirho === volChirho && iChirho.pageChirho === pageChirho && iChirho.lineIndexChirho !== undefined
  );
  const outPageDirChirho = join(OUT_DIR_CHIRHO, `vol-${volChirho}-page-${String(pageChirho).padStart(4, "0")}-chirho`);
  mkdirSync(outPageDirChirho, { recursive: true });
  const templateChirho: VerdictChirho[] = [];
  const imgWidthCacheChirho = new Map<number, number | null>();
  let croppedChirho = 0;
  for (const issueChirho of unknownChirho) {
    const lineChirho = issueChirho.lineIndexChirho!;
    const linePathChirho = lineFilePathChirho(volChirho, pageChirho, lineChirho);
    if (!existsSync(linePathChirho)) continue;
    const lineObjChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as SpanLineChirho;
    const spanChirho = lineObjChirho.spansChirho.find((sChirho) => sChirho.segmentIndexChirho === issueChirho.segmentIndexChirho);
    if (!spanChirho) continue;
    const imgPathChirho = lineImagePathChirho(volChirho, pageChirho, lineChirho);
    const cropPathChirho = join(outPageDirChirho, `line-${String(lineChirho).padStart(3, "0")}-seg-${String(spanChirho.segmentIndexChirho).padStart(2, "0")}-chirho.png`);
    if (existsSync(imgPathChirho) && lineObjChirho.lineWidthPxChirho) {
      if (!imgWidthCacheChirho.has(lineChirho)) imgWidthCacheChirho.set(lineChirho, imageWidthChirho(imgPathChirho));
      const imgWChirho = imgWidthCacheChirho.get(lineChirho);
      if (imgWChirho) {
        const scaleChirho = imgWChirho / lineObjChirho.lineWidthPxChirho;
        const xChirho = Math.max(0, Math.round((spanChirho.xMinPxChirho - 4) * scaleChirho));
        const wChirho = Math.round((spanChirho.widthPxChirho + 8) * scaleChirho);
        spawnSync("magick", [imgPathChirho, "-crop", `${wChirho}x100%+${xChirho}+0`, "+repage", cropPathChirho], { encoding: "utf8" });
        croppedChirho++;
      }
    }
    templateChirho.push({
      volumeChirho: volChirho, pageChirho, lineIndexChirho: lineChirho, segmentIndexChirho: spanChirho.segmentIndexChirho,
      garbleTextChirho: spanChirho.utf8TextChirho, scriptChirho: "", utf8TextChirho: "",
    });
  }
  const templatePathChirho = join(outPageDirChirho, "verdicts-template-chirho.json");
  writeJsonAtomicChirho(templatePathChirho, templateChirho);
  console.log(`[${MODULE_CHIRHO}] crop mode: ${templateChirho.length} unknown span(s), ${croppedChirho} crop(s) → ${outPageDirChirho}`);
  console.log(`  line images: ${join(SCANLINES_DIR_CHIRHO, `vol-${volChirho}-chirho`, `page-${String(pageChirho).padStart(4, "0")}-chirho`)}`);
  console.log(`  fill scriptChirho + utf8TextChirho in ${templatePathChirho}, then run --verdicts=... --apply`);
}

function applyModeChirho(verdictsPathChirho: string, applyChirho: boolean, reviewerChirho: string): void {
  const verdictsChirho = JSON.parse(readFileSync(verdictsPathChirho, "utf8")) as VerdictChirho[];
  const dbChirho = new Database(PROGRESS_DB_PATH_CHIRHO);
  ensureAuditTableChirho(dbChirho);
  const insertChirho = dbChirho.prepare(`INSERT INTO pass_c_vision_validations_chirho
    (volume_chirho,page_chirho,line_index_chirho,segment_index_chirho,original_text_chirho,original_text_hash_chirho,vision_script_chirho,vision_text_chirho,notes_chirho,reviewer_chirho,created_at_chirho,applied_at_chirho,applied_to_file_chirho)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const nowChirho = new Date().toISOString();
  let plannedChirho = 0, appliedChirho = 0, skippedChirho = 0, errorChirho = 0;
  for (const vChirho of verdictsChirho) {
    if (!vChirho.scriptChirho) { skippedChirho++; continue; } // deferred / not yet filled
    const keyChirho = `${vChirho.volumeChirho}:${vChirho.pageChirho}:${vChirho.lineIndexChirho}:${vChirho.segmentIndexChirho}`;
    if (!ALLOWED_SCRIPTS_CHIRHO.has(vChirho.scriptChirho)) { console.log(`[error] ${keyChirho} bad script ${vChirho.scriptChirho}`); errorChirho++; continue; }
    const linePathChirho = lineFilePathChirho(vChirho.volumeChirho, vChirho.pageChirho, vChirho.lineIndexChirho);
    if (!existsSync(linePathChirho)) { console.log(`[error] ${keyChirho} line file missing`); errorChirho++; continue; }
    const lineObjChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as SpanLineChirho;
    const spanChirho = lineObjChirho.spansChirho.find((sChirho) => sChirho.segmentIndexChirho === vChirho.segmentIndexChirho);
    if (!spanChirho) { console.log(`[error] ${keyChirho} segment not found`); errorChirho++; continue; }
    // staleness guard: the span text must still equal the garble we cropped
    if (
      normalizeTextForStorageChirho(spanChirho.utf8TextChirho) !==
      normalizeTextForStorageChirho(vChirho.garbleTextChirho)
    ) {
      console.log(`[error] ${keyChirho} span text drifted since crop; refusing`); errorChirho++; continue;
    }
    const newTextChirho = normalizeTextForStorageChirho(vChirho.utf8TextChirho ?? "");
    if (newTextChirho.length === 0) {
      console.log(`[error] ${keyChirho} supplied text normalizes to empty; omit scriptChirho to defer`);
      errorChirho++;
      continue;
    }
    console.log(`[${applyChirho ? "applied" : "planned"}] ${keyChirho} ${vChirho.scriptChirho} "${spanChirho.utf8TextChirho}" -> "${newTextChirho}"`);
    if (applyChirho) {
      const origChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
      spanChirho.scriptChirho = vChirho.scriptChirho;
      spanChirho.utf8TextChirho = newTextChirho;
      spanChirho.provenanceChirho = "vision-chirho";
      spanChirho.visionTranscribedAtChirho = nowChirho;
      normalizeSpanLineTextFieldsChirho(lineObjChirho);
      writeJsonAtomicChirho(linePathChirho, lineObjChirho);
      insertChirho.run(vChirho.volumeChirho, vChirho.pageChirho, vChirho.lineIndexChirho, vChirho.segmentIndexChirho, origChirho, hashTextChirho(origChirho), vChirho.scriptChirho, newTextChirho, vChirho.notesChirho ?? null, reviewerChirho, nowChirho, nowChirho, linePathChirho);
      appliedChirho++;
    } else plannedChirho++;
  }
  console.log(`[${MODULE_CHIRHO}] mode=${applyChirho ? "apply" : "dry-run"} planned=${plannedChirho} applied=${appliedChirho} skipped(deferred)=${skippedChirho} errors=${errorChirho}`);
  if (errorChirho > 0) process.exitCode = 1;
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const verdictsPathChirho = argChirho(argsChirho, "verdicts");
  const reviewerChirho = argChirho(argsChirho, "reviewer") ?? DEFAULT_REVIEWER_CHIRHO;
  if (verdictsPathChirho) { applyModeChirho(verdictsPathChirho, argsChirho.includes("--apply"), reviewerChirho); return; }
  if (argsChirho.includes("--crop")) {
    const volChirho = parseInt(argChirho(argsChirho, "vol") ?? "0", 10);
    const pageChirho = parseInt(argChirho(argsChirho, "page") ?? "0", 10);
    if (!volChirho || !pageChirho) { console.error("need --vol and --page for --crop"); process.exit(1); }
    cropModeChirho(volChirho, pageChirho); return;
  }
  console.error("usage: --vol=V --page=P --crop  |  --verdicts=path [--apply] [--reviewer=name-chirho]");
  process.exit(1);
}
if (import.meta.main) mainChirho();
