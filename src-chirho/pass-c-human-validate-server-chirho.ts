// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Human validation server for remaining Pass C Hebrew spans.
 *
 * Run:
 *   bun run pass-c-human-validate-chirho
 *
 * Then open:
 *   http://localhost:8766/
 */

import { Database } from "bun:sqlite";
import { createHash as createHashChirho } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "pass-c-human-validate-server-chirho";
const DEFAULT_PORT_CHIRHO = 8766;
const REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho",
  "pass-c-hebrew-validation-chirho.json"
);
const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const SCANLINES_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");

interface TokenWitnessChirho {
  sourceChirho: string;
  textChirho: string;
  confidenceChirho: number | null;
  cropChirho: string | null;
  gateReasonChirho: string | null;
  fileChirho: string | null;
}

interface TokenValidationChirho {
  tokenIndexChirho: number;
  skeletonChirho: string;
  witnessesChirho: TokenWitnessChirho[];
  validatedChirho: boolean;
}

interface DirectWordReadChirho {
  textChirho: string;
  confidenceChirho: number;
  cropChirho: string | null;
  wlcVerdictChirho: string | null;
  fileChirho: string | null;
}

interface ReportSpanChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  textChirho: string;
  lineTextChirho: string;
  tokenSkeletonsChirho: string[];
  tokenValidationsChirho: TokenValidationChirho[];
  directWordReadsChirho: DirectWordReadChirho[];
  validationStatusChirho: string;
}

interface ValidationReportChirho {
  generatedAtChirho?: string;
  spansChirho: ReportSpanChirho[];
}

interface SpanLineFileChirho {
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  spansChirho: Array<{
    segmentIndexChirho: number;
    xMinPxChirho: number;
    widthPxChirho: number;
    utf8TextChirho: string;
  }>;
}

interface QueueItemChirho extends ReportSpanChirho {
  keyChirho: string;
  liveSpanTextChirho: string;
  hasLiveSpanTextDriftChirho: boolean;
  spanXMinPxChirho: number;
  spanWidthPxChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  lineImagePathChirho: string;
  lineImageWidthPxChirho: number;
  lineImageHeightPxChirho: number;
  zoomCropXMinPxChirho: number;
  zoomCropYMinPxChirho: number;
  zoomCropWidthPxChirho: number;
  zoomCropHeightPxChirho: number;
  zoomMarkerLeftPctChirho: number;
  zoomMarkerWidthPctChirho: number;
  zoomMarkerTopPctChirho: number;
  zoomMarkerHeightPctChirho: number;
  lineMarkerLeftPctChirho: number;
  lineMarkerWidthPctChirho: number;
  lineMarkerTopPctChirho: number;
  lineMarkerHeightPctChirho: number;
  originalTextHashChirho: string;
  tierChirho: string;
  priorityChirho: number;
}

interface LineWordBoxRowChirho {
  line_x_min_chirho: number | null;
  line_y_min_chirho: number | null;
  word_x_min_chirho: number | null;
  word_y_min_chirho: number | null;
  word_x_max_chirho: number | null;
  word_y_max_chirho: number | null;
}

interface MarkerGeometryChirho {
  cropXMinPxChirho: number;
  cropYMinPxChirho: number;
  cropWidthPxChirho: number;
  cropHeightPxChirho: number;
  zoomMarkerLeftPctChirho: number;
  zoomMarkerWidthPctChirho: number;
  zoomMarkerTopPctChirho: number;
  zoomMarkerHeightPctChirho: number;
  lineMarkerLeftPctChirho: number;
  lineMarkerWidthPctChirho: number;
  lineMarkerTopPctChirho: number;
  lineMarkerHeightPctChirho: number;
}

interface HumanValidationRowChirho {
  key_chirho: string;
  id_chirho: number;
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  original_text_chirho: string;
  original_text_hash_chirho: string;
  line_text_chirho: string | null;
  verdict_chirho: string;
  corrected_text_chirho: string | null;
  corrected_skeleton_chirho: string | null;
  notes_chirho: string | null;
  witness_snapshot_chirho: string | null;
  queue_generated_at_chirho: string | null;
  reviewer_chirho: string;
  created_at_chirho: string;
  updated_at_chirho: string;
  supersedes_id_chirho: number | null;
  is_current_chirho: number;
  applied_at_chirho: string | null;
  applied_to_file_chirho: string | null;
  schema_version_chirho: number;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function positivePortChirho(valueChirho: string | undefined): number {
  if (valueChirho === undefined) return DEFAULT_PORT_CHIRHO;
  const portChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(portChirho) || portChirho <= 0) {
    throw new Error(`port must be positive; got ${valueChirho}`);
  }
  return portChirho;
}

function spanKeyChirho(spanChirho: Pick<ReportSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return [
    spanChirho.volumeChirho,
    spanChirho.pageChirho,
    spanChirho.lineIndexChirho,
    spanChirho.segmentIndexChirho,
  ].join(":");
}

function hashTextChirho(textChirho: string): string {
  return createHashChirho("sha256").update(textChirho, "utf8").digest("hex");
}

function hebrewSkeletonChirho(textChirho: string): string {
  return textChirho
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^\u05D0-\u05EA]/g, "");
}

function clampChirho(valueChirho: number, minChirho: number, maxChirho: number): number {
  return Math.min(maxChirho, Math.max(minChirho, valueChirho));
}

function pngSizeChirho(pathChirho: string): { widthChirho: number; heightChirho: number } {
  const bytesChirho = readFileSync(pathChirho);
  const signatureChirho = bytesChirho.subarray(0, 8).toString("hex");
  if (signatureChirho !== "89504e470d0a1a0a") {
    throw new Error(`Expected PNG image: ${pathChirho}`);
  }
  return {
    widthChirho: bytesChirho.readUInt32BE(16),
    heightChirho: bytesChirho.readUInt32BE(20),
  };
}

function lineWordBoxesForSpanChirho(
  spanChirho: ReportSpanChirho,
  spanXMinPxChirho: number,
  spanWidthPxChirho: number
): LineWordBoxRowChirho[] {
  const rowsChirho = dbChirho
    .query(`
      SELECT sl.x_min_chirho AS line_x_min_chirho,
             sl.y_min_chirho AS line_y_min_chirho,
             w.x_min_chirho AS word_x_min_chirho,
             w.y_min_chirho AS word_y_min_chirho,
             w.x_max_chirho AS word_x_max_chirho,
             w.y_max_chirho AS word_y_max_chirho
        FROM words_chirho w
        JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
        JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
       WHERE p.volume_number_chirho = ?
         AND p.page_number_chirho = ?
         AND sl.line_index_chirho = ?
         AND w.x_min_chirho IS NOT NULL
       ORDER BY w.word_index_chirho`)
    .all(spanChirho.volumeChirho, spanChirho.pageChirho, spanChirho.lineIndexChirho) as LineWordBoxRowChirho[];
  const spanEndPxChirho = spanXMinPxChirho + spanWidthPxChirho;
  return rowsChirho.filter((rowChirho) => {
    const lineXMinChirho = Number(rowChirho.line_x_min_chirho ?? 0);
    const wordXMinChirho = Number(rowChirho.word_x_min_chirho ?? 0) - lineXMinChirho;
    const wordXMaxChirho = Number(rowChirho.word_x_max_chirho ?? 0) - lineXMinChirho;
    const wordCenterChirho = (wordXMinChirho + wordXMaxChirho) / 2;
    return wordCenterChirho >= spanXMinPxChirho - 1 && wordCenterChirho <= spanEndPxChirho + 1;
  });
}

function markerGeometryChirho(
  spanChirho: ReportSpanChirho,
  lineWidthPxChirho: number,
  lineHeightPxChirho: number,
  imageWidthPxChirho: number,
  imageHeightPxChirho: number,
  spanXMinPxChirho: number,
  spanWidthPxChirho: number
): MarkerGeometryChirho {
  const safeLineWidthPxChirho = Math.max(1, lineWidthPxChirho);
  const safeLineHeightPxChirho = Math.max(1, lineHeightPxChirho);
  const scaleXChirho = imageWidthPxChirho / safeLineWidthPxChirho;
  const scaleYChirho = imageHeightPxChirho / safeLineHeightPxChirho;
  const wordBoxesChirho = lineWordBoxesForSpanChirho(spanChirho, spanXMinPxChirho, spanWidthPxChirho);

  let targetXMinChirho = spanXMinPxChirho * scaleXChirho;
  let targetXMaxChirho = (spanXMinPxChirho + spanWidthPxChirho) * scaleXChirho;
  let targetYMinChirho = safeLineHeightPxChirho * 0.25 * scaleYChirho;
  let targetYMaxChirho = safeLineHeightPxChirho * 0.82 * scaleYChirho;
  if (wordBoxesChirho.length > 0) {
    const lineXMinChirho = Number(wordBoxesChirho[0]!.line_x_min_chirho ?? 0);
    const lineYMinChirho = Number(wordBoxesChirho[0]!.line_y_min_chirho ?? 0);
    targetXMinChirho =
      Math.min(...wordBoxesChirho.map((rowChirho) => Number(rowChirho.word_x_min_chirho ?? 0) - lineXMinChirho)) *
      scaleXChirho;
    targetXMaxChirho =
      Math.max(...wordBoxesChirho.map((rowChirho) => Number(rowChirho.word_x_max_chirho ?? 0) - lineXMinChirho)) *
      scaleXChirho;
    targetYMinChirho =
      Math.min(...wordBoxesChirho.map((rowChirho) => Number(rowChirho.word_y_min_chirho ?? 0) - lineYMinChirho)) *
      scaleYChirho;
    targetYMaxChirho =
      Math.max(...wordBoxesChirho.map((rowChirho) => Number(rowChirho.word_y_max_chirho ?? 0) - lineYMinChirho)) *
      scaleYChirho;
  }

  const paddedXMinChirho = clampChirho(targetXMinChirho - 8, 0, imageWidthPxChirho);
  const paddedXMaxChirho = clampChirho(targetXMaxChirho + 8, paddedXMinChirho + 1, imageWidthPxChirho);
  const paddedYMinChirho = clampChirho(targetYMinChirho - 7, 0, imageHeightPxChirho);
  const paddedYMaxChirho = clampChirho(targetYMaxChirho + 7, paddedYMinChirho + 1, imageHeightPxChirho);
  const targetWidthPxChirho = Math.max(1, paddedXMaxChirho - paddedXMinChirho);
  const targetHeightPxChirho = Math.max(1, paddedYMaxChirho - paddedYMinChirho);

  const cropWidthPxChirho = Math.round(Math.min(imageWidthPxChirho, Math.max(520, targetWidthPxChirho + 280)));
  const cropHeightPxChirho = Math.round(Math.min(imageHeightPxChirho, Math.max(52, targetHeightPxChirho + 10)));
  const targetCenterXChirho = paddedXMinChirho + targetWidthPxChirho / 2;
  const targetCenterYChirho = paddedYMinChirho + targetHeightPxChirho / 2;
  const cropXMinPxChirho = Math.round(
    clampChirho(targetCenterXChirho - cropWidthPxChirho / 2, 0, imageWidthPxChirho - cropWidthPxChirho)
  );
  const cropYMinPxChirho = Math.round(
    clampChirho(targetCenterYChirho - cropHeightPxChirho / 2, 0, imageHeightPxChirho - cropHeightPxChirho)
  );

  return {
    cropXMinPxChirho,
    cropYMinPxChirho,
    cropWidthPxChirho,
    cropHeightPxChirho,
    zoomMarkerLeftPctChirho: ((paddedXMinChirho - cropXMinPxChirho) / cropWidthPxChirho) * 100,
    zoomMarkerWidthPctChirho: (targetWidthPxChirho / cropWidthPxChirho) * 100,
    zoomMarkerTopPctChirho: ((paddedYMinChirho - cropYMinPxChirho) / cropHeightPxChirho) * 100,
    zoomMarkerHeightPctChirho: (targetHeightPxChirho / cropHeightPxChirho) * 100,
    lineMarkerLeftPctChirho: (paddedXMinChirho / imageWidthPxChirho) * 100,
    lineMarkerWidthPctChirho: (targetWidthPxChirho / imageWidthPxChirho) * 100,
    lineMarkerTopPctChirho: (paddedYMinChirho / imageHeightPxChirho) * 100,
    lineMarkerHeightPctChirho: (targetHeightPxChirho / imageHeightPxChirho) * 100,
  };
}

function lineFilePathChirho(spanChirho: ReportSpanChirho): string {
  return join(
    SPANS_DIR_CHIRHO,
    `vol-${spanChirho.volumeChirho}-chirho`,
    `page-${String(spanChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(spanChirho.lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function scanlineImagePathChirho(spanChirho: ReportSpanChirho): string {
  return join(
    SCANLINES_DIR_CHIRHO,
    `vol-${spanChirho.volumeChirho}-chirho`,
    `page-${String(spanChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(spanChirho.lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function tierForSpanChirho(spanChirho: ReportSpanChirho): string {
  if (spanChirho.validationStatusChirho === "all-token-validated-chirho") return "spot-check-chirho";
  if (spanChirho.volumeChirho >= 3) return "primary-vols-3-5-chirho";
  return "primary-vol-2-chirho";
}

function queuePriorityChirho(spanChirho: ReportSpanChirho): number {
  const tierChirho = tierForSpanChirho(spanChirho);
  if (tierChirho === "primary-vols-3-5-chirho") return 0;
  if (tierChirho === "primary-vol-2-chirho") return 1000;
  return 2000;
}

function loadReportChirho(): ValidationReportChirho {
  if (!existsSync(REPORT_PATH_CHIRHO)) {
    throw new Error(`Validation report not found: ${REPORT_PATH_CHIRHO}`);
  }
  return JSON.parse(readFileSync(REPORT_PATH_CHIRHO, "utf8")) as ValidationReportChirho;
}

function loadQueueChirho(reportChirho: ValidationReportChirho): QueueItemChirho[] {
  return reportChirho.spansChirho
    .map((spanChirho) => {
      const linePathChirho = lineFilePathChirho(spanChirho);
      const lineChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as SpanLineFileChirho;
      const spanGeometryChirho = lineChirho.spansChirho.find(
        (itemChirho) => itemChirho.segmentIndexChirho === spanChirho.segmentIndexChirho
      );
      if (!spanGeometryChirho) {
        throw new Error(`Missing span geometry for ${spanKeyChirho(spanChirho)}`);
      }
      const liveSpanTextChirho = spanGeometryChirho.utf8TextChirho;
      const lineImagePathChirho = scanlineImagePathChirho(spanChirho);
      const lineImageSizeChirho = existsSync(lineImagePathChirho)
        ? pngSizeChirho(lineImagePathChirho)
        : {
            widthChirho: lineChirho.lineWidthPxChirho,
            heightChirho: lineChirho.lineHeightPxChirho,
          };
      const zoomChirho = markerGeometryChirho(
        spanChirho,
        lineChirho.lineWidthPxChirho,
        lineChirho.lineHeightPxChirho,
        lineImageSizeChirho.widthChirho,
        lineImageSizeChirho.heightChirho,
        spanGeometryChirho.xMinPxChirho,
        spanGeometryChirho.widthPxChirho
      );
      return {
        ...spanChirho,
        keyChirho: spanKeyChirho(spanChirho),
        liveSpanTextChirho,
        hasLiveSpanTextDriftChirho: liveSpanTextChirho !== spanChirho.textChirho,
        spanXMinPxChirho: spanGeometryChirho.xMinPxChirho,
        spanWidthPxChirho: spanGeometryChirho.widthPxChirho,
        lineWidthPxChirho: lineChirho.lineWidthPxChirho,
        lineHeightPxChirho: lineChirho.lineHeightPxChirho,
        lineImagePathChirho,
        lineImageWidthPxChirho: lineImageSizeChirho.widthChirho,
        lineImageHeightPxChirho: lineImageSizeChirho.heightChirho,
        zoomCropXMinPxChirho: zoomChirho.cropXMinPxChirho,
        zoomCropYMinPxChirho: zoomChirho.cropYMinPxChirho,
        zoomCropWidthPxChirho: zoomChirho.cropWidthPxChirho,
        zoomCropHeightPxChirho: zoomChirho.cropHeightPxChirho,
        zoomMarkerLeftPctChirho: zoomChirho.zoomMarkerLeftPctChirho,
        zoomMarkerWidthPctChirho: zoomChirho.zoomMarkerWidthPctChirho,
        zoomMarkerTopPctChirho: zoomChirho.zoomMarkerTopPctChirho,
        zoomMarkerHeightPctChirho: zoomChirho.zoomMarkerHeightPctChirho,
        lineMarkerLeftPctChirho: zoomChirho.lineMarkerLeftPctChirho,
        lineMarkerWidthPctChirho: zoomChirho.lineMarkerWidthPctChirho,
        lineMarkerTopPctChirho: zoomChirho.lineMarkerTopPctChirho,
        lineMarkerHeightPctChirho: zoomChirho.lineMarkerHeightPctChirho,
        originalTextHashChirho: hashTextChirho(liveSpanTextChirho),
        tierChirho: tierForSpanChirho(spanChirho),
        priorityChirho: queuePriorityChirho(spanChirho),
      };
    })
    .sort((aChirho, bChirho) =>
      aChirho.priorityChirho - bChirho.priorityChirho ||
      aChirho.volumeChirho - bChirho.volumeChirho ||
      aChirho.pageChirho - bChirho.pageChirho ||
      aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
      aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
    );
}

const portChirho = positivePortChirho(parseArgValueChirho(process.argv.slice(2), "port"));
const dbChirho = new Database(DB_PATH_CHIRHO);
const reportChirho = loadReportChirho();
const queueGeneratedAtChirho = reportChirho.generatedAtChirho ?? null;
const queueChirho = loadQueueChirho(reportChirho);
const queueByKeyChirho = new Map(queueChirho.map((itemChirho) => [itemChirho.keyChirho, itemChirho]));

function tableColumnsChirho(tableNameChirho: string): string[] {
  return (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
    (rowChirho) => rowChirho.name
  );
}

function ensureAppendOnlySchemaChirho(): void {
  const tableRowsChirho = dbChirho
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='pass_c_human_validations_chirho'")
    .all() as Array<{ name: string }>;
  if (tableRowsChirho.length === 0) return;
  const columnsChirho = new Set(tableColumnsChirho("pass_c_human_validations_chirho"));
  if (columnsChirho.has("original_text_hash_chirho") && columnsChirho.has("is_current_chirho")) return;
  const legacyNameChirho = `pass_c_human_validations_legacy_${Date.now()}_chirho`;
  dbChirho.run(`ALTER TABLE pass_c_human_validations_chirho RENAME TO ${legacyNameChirho}`);
  console.warn(`[${MODULE_CHIRHO}] moved old validation table to ${legacyNameChirho}`);
}

ensureAppendOnlySchemaChirho();

dbChirho.run(`
CREATE TABLE IF NOT EXISTS pass_c_human_validations_chirho (
  id_chirho                 INTEGER PRIMARY KEY AUTOINCREMENT,
  volume_chirho             INTEGER NOT NULL,
  page_chirho               INTEGER NOT NULL,
  line_index_chirho         INTEGER NOT NULL,
  segment_index_chirho      INTEGER NOT NULL,
  original_text_chirho      TEXT NOT NULL,
  original_text_hash_chirho TEXT NOT NULL,
  line_text_chirho          TEXT,
  verdict_chirho            TEXT NOT NULL,
  corrected_text_chirho     TEXT,
  corrected_skeleton_chirho TEXT,
  notes_chirho              TEXT,
  witness_snapshot_chirho   TEXT,
  queue_generated_at_chirho TEXT,
  reviewer_chirho           TEXT NOT NULL,
  created_at_chirho         TEXT NOT NULL,
  updated_at_chirho         TEXT NOT NULL,
  supersedes_id_chirho      INTEGER,
  is_current_chirho         INTEGER NOT NULL DEFAULT 1,
  applied_at_chirho         TEXT,
  applied_to_file_chirho    TEXT,
  schema_version_chirho     INTEGER NOT NULL DEFAULT 1
)`);

dbChirho.run(`
CREATE INDEX IF NOT EXISTS idx_pchv_span_chirho
  ON pass_c_human_validations_chirho(volume_chirho, page_chirho, line_index_chirho, segment_index_chirho, is_current_chirho)`);

dbChirho.run(`
CREATE INDEX IF NOT EXISTS idx_pchv_current_chirho
  ON pass_c_human_validations_chirho(is_current_chirho, verdict_chirho)`);

const saveValidationStmtChirho = dbChirho.prepare(`
INSERT INTO pass_c_human_validations_chirho
  (volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
   original_text_chirho, original_text_hash_chirho, line_text_chirho, verdict_chirho,
   corrected_text_chirho, corrected_skeleton_chirho, notes_chirho, witness_snapshot_chirho,
   queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
   supersedes_id_chirho, is_current_chirho, schema_version_chirho)
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`);

const validationRowsStmtChirho = dbChirho.prepare(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
       original_text_chirho, original_text_hash_chirho, line_text_chirho,
       verdict_chirho, corrected_text_chirho, corrected_skeleton_chirho, notes_chirho,
       witness_snapshot_chirho, queue_generated_at_chirho, reviewer_chirho,
       created_at_chirho, updated_at_chirho, supersedes_id_chirho, is_current_chirho,
       applied_at_chirho, applied_to_file_chirho, schema_version_chirho
  FROM pass_c_human_validations_chirho
 WHERE is_current_chirho = 1 AND verdict_chirho <> 'undo-chirho'
 ORDER BY updated_at_chirho DESC, id_chirho DESC`);

const validationByIdStmtChirho = dbChirho.prepare(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
       original_text_chirho, original_text_hash_chirho, line_text_chirho,
       verdict_chirho, corrected_text_chirho, corrected_skeleton_chirho, notes_chirho,
       witness_snapshot_chirho, queue_generated_at_chirho, reviewer_chirho,
       created_at_chirho, updated_at_chirho, supersedes_id_chirho, is_current_chirho,
       applied_at_chirho, applied_to_file_chirho, schema_version_chirho
  FROM pass_c_human_validations_chirho
 WHERE id_chirho = ?`);

const currentValidationStmtChirho = dbChirho.prepare(`
SELECT id_chirho FROM pass_c_human_validations_chirho
 WHERE volume_chirho = ? AND page_chirho = ? AND line_index_chirho = ? AND segment_index_chirho = ?
   AND is_current_chirho = 1
 ORDER BY id_chirho DESC
 LIMIT 1`);

const latestCurrentValidationStmtChirho = dbChirho.prepare(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho
  FROM pass_c_human_validations_chirho
 WHERE is_current_chirho = 1 AND verdict_chirho <> 'undo-chirho'
 ORDER BY updated_at_chirho DESC, id_chirho DESC
 LIMIT 1`);

const supersedeValidationStmtChirho = dbChirho.prepare(`
UPDATE pass_c_human_validations_chirho
   SET is_current_chirho = 0
 WHERE volume_chirho = ? AND page_chirho = ? AND line_index_chirho = ? AND segment_index_chirho = ?
   AND is_current_chirho = 1`);

const logStepStmtChirho = dbChirho.prepare(`
INSERT INTO steps_taken_chirho
  (agent_code_chirho, timestamp_start_chirho, timestamp_end_chirho,
   action_taken_chirho, result_of_action_chirho, overview_of_result_chirho)
VALUES (?, ?, ?, ?, ?, ?)`);

function rowWithKeyChirho(rowChirho: Omit<HumanValidationRowChirho, "key_chirho">): HumanValidationRowChirho {
  return {
    ...rowChirho,
    key_chirho: spanKeyChirho({
      volumeChirho: rowChirho.volume_chirho,
      pageChirho: rowChirho.page_chirho,
      lineIndexChirho: rowChirho.line_index_chirho,
      segmentIndexChirho: rowChirho.segment_index_chirho,
    }),
  };
}

function validationsChirho(): HumanValidationRowChirho[] {
  return (validationRowsStmtChirho.all() as Array<Omit<HumanValidationRowChirho, "key_chirho">>).map(rowWithKeyChirho);
}

function scriptJsonChirho(valueChirho: unknown): string {
  return JSON.stringify(valueChirho)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function witnessSnapshotChirho(itemChirho: QueueItemChirho): string {
  return JSON.stringify({
    keyChirho: itemChirho.keyChirho,
    liveSpanTextChirho: itemChirho.liveSpanTextChirho,
    reportTextChirho: itemChirho.textChirho,
    hasLiveSpanTextDriftChirho: itemChirho.hasLiveSpanTextDriftChirho,
    validationStatusChirho: itemChirho.validationStatusChirho,
    tokenSkeletonsChirho: itemChirho.tokenSkeletonsChirho,
    tokenValidationsChirho: itemChirho.tokenValidationsChirho,
    directWordReadsChirho: itemChirho.directWordReadsChirho,
    lineImagePathChirho: itemChirho.lineImagePathChirho,
  });
}

function saveDecisionChirho(
  itemChirho: QueueItemChirho,
  verdictChirho: string,
  correctedTextChirho: string | null,
  notesChirho: string | null,
  supersedesIdChirho: number | null
): HumanValidationRowChirho {
  const nowChirho = new Date().toISOString();
  supersedeValidationStmtChirho.run(
    itemChirho.volumeChirho,
    itemChirho.pageChirho,
    itemChirho.lineIndexChirho,
    itemChirho.segmentIndexChirho
  );
  const resultChirho = saveValidationStmtChirho.run(
    itemChirho.volumeChirho,
    itemChirho.pageChirho,
    itemChirho.lineIndexChirho,
    itemChirho.segmentIndexChirho,
    itemChirho.liveSpanTextChirho,
    hashTextChirho(itemChirho.liveSpanTextChirho),
    itemChirho.lineTextChirho,
    verdictChirho,
    correctedTextChirho,
    correctedTextChirho ? hebrewSkeletonChirho(correctedTextChirho) : null,
    notesChirho,
    witnessSnapshotChirho(itemChirho),
    queueGeneratedAtChirho,
    "human-chirho",
    nowChirho,
    nowChirho,
    supersedesIdChirho
  );
  const rowChirho = validationByIdStmtChirho.get(Number(resultChirho.lastInsertRowid)) as
    | Omit<HumanValidationRowChirho, "key_chirho">
    | undefined;
  if (!rowChirho) throw new Error("Inserted validation row could not be reloaded");
  return rowWithKeyChirho(rowChirho);
}

function pageHtmlChirho(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pass C Hebrew Validation Chirho</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f5f5f2; color: #1f2933; }
    button, textarea, input { font: inherit; }
    .shell-chirho { max-width: 1220px; margin: 0 auto; padding: 18px; }
    .top-chirho { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #d8d4c8; padding-bottom: 12px; }
    .title-chirho { font-size: 20px; font-weight: 700; }
    .summary-chirho { color: #59636f; font-size: 14px; }
    .main-chirho { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; padding-top: 18px; }
    .line-panel-chirho { min-width: 0; }
    .image-label-chirho { color: #59636f; font-size: 13px; font-weight: 650; margin: 0 0 6px; }
    .target-image-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: hidden; margin-bottom: 12px; }
    .target-image-frame-chirho { position: relative; max-width: 100%; }
    .target-image-chirho { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
    .line-image-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: hidden; margin-bottom: 12px; }
    .line-image-frame-chirho { position: relative; }
    .line-image-chirho { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
    .span-marker-chirho { position: absolute; border: 2px solid #d23f31; background: rgba(210, 63, 49, 0.16); box-sizing: border-box; pointer-events: none; }
    .target-row-chirho { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 14px; }
    .label-chirho { color: #59636f; font-size: 13px; font-weight: 650; }
    .hebrew-chirho { direction: rtl; unicode-bidi: plaintext; font-size: 32px; line-height: 1.35; background: white; border: 1px solid #d6d9dd; padding: 12px; min-height: 56px; }
    .line-text-chirho { font-size: 17px; line-height: 1.5; background: white; border: 1px solid #d6d9dd; padding: 10px; }
    .edit-chirho { direction: rtl; unicode-bidi: plaintext; min-height: 76px; resize: vertical; width: 100%; box-sizing: border-box; border: 1px solid #b8bec7; padding: 10px; background: #fff; font-size: 25px; line-height: 1.35; }
    .typewriter-chirho { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; background: #fff; border: 1px solid #d6d9dd; padding: 8px; }
    .typewriter-button-chirho { min-width: 38px; height: 34px; border: 1px solid #aab1b9; background: #fff; cursor: pointer; font-size: 20px; line-height: 1; }
    .typewriter-button-chirho:hover { background: #edf1f4; }
    .typewriter-button-chirho:focus-visible { outline: 2px solid #bd7a1b; outline-offset: 1px; }
    .side-chirho { display: flex; flex-direction: column; gap: 12px; }
    .box-chirho { border: 1px solid #d6d9dd; background: #fff; padding: 12px; }
    .meta-grid-chirho { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; font-size: 13px; }
    .mono-chirho { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .witness-list-chirho { display: flex; flex-direction: column; gap: 6px; font-size: 13px; margin-top: 8px; }
    .witness-chirho { border-left: 3px solid #8aa399; padding-left: 8px; }
    .warning-chirho { border-left: 4px solid #bd7a1b; background: #fff7e8; padding: 10px; font-size: 13px; color: #704000; }
    .tier-chirho { display: inline-block; padding: 2px 6px; border: 1px solid #b8bec7; background: #f5f7f8; font-size: 12px; }
    .actions-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .actions-chirho button { border: 1px solid #aab1b9; background: #fff; padding: 10px; cursor: pointer; min-height: 42px; }
    .actions-chirho button:hover { background: #edf1f4; }
    .accept-chirho { color: #116149; border-color: #499b7f !important; }
    .correct-chirho { color: #874900; border-color: #bd7a1b !important; }
    .source-chirho { color: #923434; border-color: #c15c5c !important; }
    .skip-chirho { color: #59636f; }
    .status-chirho { min-height: 22px; color: #116149; font-size: 13px; }
    .done-chirho { padding: 42px 0; color: #59636f; font-size: 18px; }
    @media (max-width: 900px) {
      .main-chirho { grid-template-columns: 1fr; }
      .side-chirho { order: -1; }
      .hebrew-chirho { font-size: 28px; }
    }
  </style>
</head>
<body>
  <main class="shell-chirho">
    <div class="top-chirho">
      <div>
        <div class="title-chirho">Pass C Hebrew Validation</div>
        <div class="summary-chirho" id="summary-chirho"></div>
      </div>
      <div class="status-chirho" id="status-chirho"></div>
    </div>
    <section class="main-chirho" id="app-chirho"></section>
  </main>
  <script>
    const queueChirho = ${scriptJsonChirho(queueChirho)};
    let validationsChirho = new Map();
    let indexChirho = 0;

    function textChirho(valueChirho) { return document.createTextNode(valueChirho); }
    function elChirho(tagChirho, attrsChirho = {}, childrenChirho = []) {
      const nodeChirho = document.createElement(tagChirho);
      for (const [keyChirho, valueChirho] of Object.entries(attrsChirho)) {
        if (keyChirho === "classChirho") nodeChirho.className = valueChirho;
        else if (keyChirho === "textChirho") nodeChirho.textContent = valueChirho;
        else nodeChirho.setAttribute(keyChirho, valueChirho);
      }
      for (const childChirho of childrenChirho) nodeChirho.appendChild(childChirho);
      return nodeChirho;
    }
    function clearChirho(nodeChirho) { while (nodeChirho.firstChild) nodeChirho.removeChild(nodeChirho.firstChild); }
    function activeQueueChirho() { return queueChirho.filter((itemChirho) => !validationsChirho.has(itemChirho.keyChirho)); }
    function currentItemChirho() { return activeQueueChirho()[indexChirho]; }
    const hebrewTypewriterMarksChirho = [
      { labelChirho: "◌ֽ", valueChirho: "ֽ", titleChirho: "Meteg U+05BD" },
      { labelChirho: "־", valueChirho: "־", titleChirho: "Maqaf U+05BE" },
      { labelChirho: "◌ְ", valueChirho: "ְ", titleChirho: "Sheva U+05B0" },
      { labelChirho: "◌ֱ", valueChirho: "ֱ", titleChirho: "Hataf segol U+05B1" },
      { labelChirho: "◌ֲ", valueChirho: "ֲ", titleChirho: "Hataf patah U+05B2" },
      { labelChirho: "◌ֳ", valueChirho: "ֳ", titleChirho: "Hataf qamats U+05B3" },
      { labelChirho: "◌ִ", valueChirho: "ִ", titleChirho: "Hiriq U+05B4" },
      { labelChirho: "◌ֵ", valueChirho: "ֵ", titleChirho: "Tsere U+05B5" },
      { labelChirho: "◌ֶ", valueChirho: "ֶ", titleChirho: "Segol U+05B6" },
      { labelChirho: "◌ַ", valueChirho: "ַ", titleChirho: "Patah U+05B7" },
      { labelChirho: "◌ָ", valueChirho: "ָ", titleChirho: "Qamats U+05B8" },
      { labelChirho: "◌ֹ", valueChirho: "ֹ", titleChirho: "Holam U+05B9" },
      { labelChirho: "◌ֻ", valueChirho: "ֻ", titleChirho: "Qubuts U+05BB" },
      { labelChirho: "◌ּ", valueChirho: "ּ", titleChirho: "Dagesh U+05BC" },
      { labelChirho: "◌ׁ", valueChirho: "ׁ", titleChirho: "Shin dot U+05C1" },
      { labelChirho: "◌ׂ", valueChirho: "ׂ", titleChirho: "Sin dot U+05C2" }
    ];
    async function loadValidationsChirho() {
      const responseChirho = await fetch("/api-chirho/validations-chirho");
      const dataChirho = await responseChirho.json();
      validationsChirho = new Map(dataChirho.validationsChirho.map((rowChirho) => [rowChirho.key_chirho, rowChirho]));
      if (indexChirho >= activeQueueChirho().length) indexChirho = Math.max(0, activeQueueChirho().length - 1);
    }
    function setStatusChirho(messageChirho) { document.getElementById("status-chirho").textContent = messageChirho; }
    function renderSummaryChirho() {
      const remainingChirho = activeQueueChirho().length;
      document.getElementById("summary-chirho").textContent =
        remainingChirho + " remaining of " + queueChirho.length + " review spans, " + validationsChirho.size + " saved";
    }
    function witnessTextChirho(tokenChirho) {
      if (tokenChirho.witnessesChirho.length === 0) return "none";
      return tokenChirho.witnessesChirho
        .map((wChirho) => wChirho.sourceChirho + ": " + wChirho.textChirho + (wChirho.confidenceChirho == null ? "" : " @" + wChirho.confidenceChirho))
        .join(" | ");
    }
    function insertCorrectionTextChirho(valueChirho) {
      const editChirho = document.getElementById("edit-chirho");
      if (!editChirho) return;
      const selectionStartChirho = editChirho.selectionStart ?? editChirho.value.length;
      const selectionEndChirho = editChirho.selectionEnd ?? selectionStartChirho;
      editChirho.setRangeText(valueChirho, selectionStartChirho, selectionEndChirho, "end");
      editChirho.dispatchEvent(new Event("input", { bubbles: true }));
      editChirho.focus();
    }
    function typewriterChirho() {
      const wrapChirho = elChirho("div", { classChirho: "typewriter-chirho" });
      for (const markChirho of hebrewTypewriterMarksChirho) {
        const buttonChirho = elChirho("button", {
          classChirho: "typewriter-button-chirho",
          type: "button",
          title: markChirho.titleChirho,
          "aria-label": markChirho.titleChirho,
          textChirho: markChirho.labelChirho
        });
        buttonChirho.addEventListener("click", () => insertCorrectionTextChirho(markChirho.valueChirho));
        wrapChirho.appendChild(buttonChirho);
      }
      return wrapChirho;
    }
    function renderChirho() {
      const appChirho = document.getElementById("app-chirho");
      clearChirho(appChirho);
      renderSummaryChirho();
      const itemChirho = currentItemChirho();
      if (!itemChirho) {
        appChirho.appendChild(elChirho("div", { classChirho: "done-chirho", textChirho: "Queue complete." }));
        return;
      }

      const leftChirho = elChirho("div", { classChirho: "line-panel-chirho" });
      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Target crop" }));
      const targetWrapChirho = elChirho("div", { classChirho: "target-image-wrap-chirho" });
      const targetFrameChirho = elChirho("div", { classChirho: "target-image-frame-chirho" });
      targetFrameChirho.style.width = Math.min(itemChirho.zoomCropWidthPxChirho * 2, 1040) + "px";
      const targetImageChirho = elChirho("img", { classChirho: "target-image-chirho", src: "/span-image-chirho/" + encodeURIComponent(itemChirho.keyChirho), alt: "" });
      const targetMarkerChirho = elChirho("div", { classChirho: "span-marker-chirho" });
      targetMarkerChirho.style.left = itemChirho.zoomMarkerLeftPctChirho + "%";
      targetMarkerChirho.style.width = itemChirho.zoomMarkerWidthPctChirho + "%";
      targetMarkerChirho.style.top = itemChirho.zoomMarkerTopPctChirho + "%";
      targetMarkerChirho.style.height = itemChirho.zoomMarkerHeightPctChirho + "%";
      targetFrameChirho.appendChild(targetImageChirho);
      targetFrameChirho.appendChild(targetMarkerChirho);
      targetWrapChirho.appendChild(targetFrameChirho);
      leftChirho.appendChild(targetWrapChirho);

      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Full line" }));
      const imageWrapChirho = elChirho("div", { classChirho: "line-image-wrap-chirho" });
      const imageFrameChirho = elChirho("div", { classChirho: "line-image-frame-chirho" });
      imageFrameChirho.style.width = "100%";
      const imageChirho = elChirho("img", { classChirho: "line-image-chirho", src: "/line-image-chirho/" + encodeURIComponent(itemChirho.keyChirho), alt: "" });
      const markerChirho = elChirho("div", { classChirho: "span-marker-chirho" });
      markerChirho.style.left = itemChirho.lineMarkerLeftPctChirho + "%";
      markerChirho.style.width = itemChirho.lineMarkerWidthPctChirho + "%";
      markerChirho.style.top = itemChirho.lineMarkerTopPctChirho + "%";
      markerChirho.style.height = itemChirho.lineMarkerHeightPctChirho + "%";
      imageFrameChirho.appendChild(imageChirho);
      imageFrameChirho.appendChild(markerChirho);
      imageWrapChirho.appendChild(imageFrameChirho);
      leftChirho.appendChild(imageWrapChirho);

      const targetRowChirho = elChirho("div", { classChirho: "target-row-chirho" });
      targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Pass C text" }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: "hebrew-chirho", textChirho: itemChirho.textChirho }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Line text" }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: "line-text-chirho", textChirho: itemChirho.lineTextChirho }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Correction" }));
      const editChirho = elChirho("textarea", { classChirho: "edit-chirho", id: "edit-chirho" });
      editChirho.value = itemChirho.textChirho;
      targetRowChirho.appendChild(editChirho);
      targetRowChirho.appendChild(typewriterChirho());
      leftChirho.appendChild(targetRowChirho);

      const sideChirho = elChirho("aside", { classChirho: "side-chirho" });
      sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Machine witnesses validate consonants only. Vowels and niqqud are UNVERIFIED even when consonants agree." }));
      if (itemChirho.hasLiveSpanTextDriftChirho) {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Live span text differs from this report. Use Needs source or Bad segmentation; do not accept blindly." }));
      }
      const metaChirho = elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
        elChirho("div", { textChirho: "Location" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: "vol " + itemChirho.volumeChirho + " p" + itemChirho.pageChirho + " L" + itemChirho.lineIndexChirho + " S" + itemChirho.segmentIndexChirho }),
        elChirho("div", { textChirho: "Status" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.validationStatusChirho }),
        elChirho("div", { textChirho: "Tier" }),
        elChirho("div", { classChirho: "tier-chirho", textChirho: itemChirho.tierChirho }),
        elChirho("div", { textChirho: "Hash" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.originalTextHashChirho.slice(0, 16) }),
        elChirho("div", { textChirho: "Skeletons" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.tokenSkeletonsChirho.join(" ") })
      ]);
      sideChirho.appendChild(metaChirho);

      const witnessBoxChirho = elChirho("div", { classChirho: "box-chirho" });
      witnessBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Witnesses" }));
      const witnessListChirho = elChirho("div", { classChirho: "witness-list-chirho" });
      for (const tokenChirho of itemChirho.tokenValidationsChirho) {
        witnessListChirho.appendChild(elChirho("div", { classChirho: "witness-chirho", textChirho: tokenChirho.skeletonChirho + " -> " + witnessTextChirho(tokenChirho) }));
      }
      if (itemChirho.directWordReadsChirho.length > 0) {
        witnessListChirho.appendChild(elChirho("div", { classChirho: "witness-chirho", textChirho: "direct reads: " + itemChirho.directWordReadsChirho.map((readChirho) => readChirho.textChirho + " @" + readChirho.confidenceChirho).join(" | ") }));
      }
      witnessBoxChirho.appendChild(witnessListChirho);
      sideChirho.appendChild(witnessBoxChirho);

      const notesBoxChirho = elChirho("div", { classChirho: "box-chirho" });
      notesBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Notes" }));
      const notesChirho = elChirho("textarea", { id: "notes-chirho", style: "width:100%;min-height:58px;box-sizing:border-box;" });
      notesBoxChirho.appendChild(notesChirho);
      sideChirho.appendChild(notesBoxChirho);

      const actionsChirho = elChirho("div", { classChirho: "actions-chirho" });
      const buttonDataChirho = [
        ["accept-chirho", "Accept", "accept-chirho"],
        ["correct-chirho", "Correct", "correct-chirho"],
        ["source-chirho", "Needs source", "needs-source-chirho"],
        ["source-chirho", "Bad segmentation", "bad-segmentation-chirho"],
        ["skip-chirho", "Skip", "skip-chirho"],
        ["skip-chirho", "Undo last", "undo-chirho"]
      ];
      for (const [classChirho, labelChirho, verdictChirho] of buttonDataChirho) {
        const buttonChirho = elChirho("button", { classChirho, textChirho: labelChirho });
        buttonChirho.addEventListener("click", () => verdictChirho === "undo-chirho" ? undoLastChirho() : submitChirho(verdictChirho));
        actionsChirho.appendChild(buttonChirho);
      }
      sideChirho.appendChild(actionsChirho);

      appChirho.appendChild(leftChirho);
      appChirho.appendChild(sideChirho);
    }
    async function submitChirho(verdictChirho) {
      const itemChirho = currentItemChirho();
      if (!itemChirho) return;
      const correctedTextChirho = document.getElementById("edit-chirho").value;
      const notesChirho = document.getElementById("notes-chirho").value;
      const responseChirho = await fetch("/api-chirho/submit-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyChirho: itemChirho.keyChirho, verdictChirho, correctedTextChirho, notesChirho })
      });
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) {
        setStatusChirho("Save failed");
        return;
      }
      validationsChirho.set(itemChirho.keyChirho, dataChirho.rowChirho);
      setStatusChirho("Saved " + verdictChirho);
      if (indexChirho >= activeQueueChirho().length) indexChirho = Math.max(0, activeQueueChirho().length - 1);
      renderChirho();
    }
    async function undoLastChirho() {
      const responseChirho = await fetch("/api-chirho/undo-last-chirho", { method: "POST" });
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) {
        setStatusChirho("Undo failed");
        return;
      }
      await loadValidationsChirho();
      setStatusChirho("Undone");
      renderChirho();
    }
    document.addEventListener("keydown", (eventChirho) => {
      if (eventChirho.target && ["TEXTAREA", "INPUT"].includes(eventChirho.target.tagName)) return;
      const keyChirho = eventChirho.key.toLowerCase();
      if (keyChirho === "a") submitChirho("accept-chirho");
      if (keyChirho === "c") submitChirho("correct-chirho");
      if (keyChirho === "n") submitChirho("needs-source-chirho");
      if (keyChirho === "b") submitChirho("bad-segmentation-chirho");
      if (keyChirho === "s") submitChirho("skip-chirho");
      if (keyChirho === "u") undoLastChirho();
      if (keyChirho === "arrowright") { indexChirho = Math.min(activeQueueChirho().length - 1, indexChirho + 1); renderChirho(); }
      if (keyChirho === "arrowleft") { indexChirho = Math.max(0, indexChirho - 1); renderChirho(); }
    });
    loadValidationsChirho().then(renderChirho);
  </script>
</body>
</html>`;
}

function jsonResponseChirho(dataChirho: unknown, statusChirho = 200): Response {
  return new Response(JSON.stringify(dataChirho), {
    status: statusChirho,
    headers: { "Content-Type": "application/json" },
  });
}

async function spanImageResponseChirho(itemChirho: QueueItemChirho): Promise<Response> {
  if (!existsSync(itemChirho.lineImagePathChirho)) return new Response("not found", { status: 404 });
  const cropSpecChirho =
    `${itemChirho.zoomCropWidthPxChirho}x${itemChirho.zoomCropHeightPxChirho}` +
    `+${itemChirho.zoomCropXMinPxChirho}+${itemChirho.zoomCropYMinPxChirho}`;
  const procChirho = Bun.spawn([
    "magick",
    itemChirho.lineImagePathChirho,
    "-crop",
    cropSpecChirho,
    "+repage",
    "png:-",
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const outputChirho = await new Response(procChirho.stdout).arrayBuffer();
  const errorOutputChirho = await new Response(procChirho.stderr).text();
  const exitCodeChirho = await procChirho.exited;
  if (exitCodeChirho !== 0) {
    return new Response(errorOutputChirho || "crop failed", { status: 500 });
  }
  return new Response(outputChirho, { headers: { "Content-Type": "image/png" } });
}

Bun.serve({
  port: portChirho,
  async fetch(reqChirho: Request) {
    const urlChirho = new URL(reqChirho.url);
    if (urlChirho.pathname === "/") {
      return new Response(pageHtmlChirho(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (urlChirho.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    if (urlChirho.pathname.startsWith("/line-image-chirho/")) {
      const keyChirho = decodeURIComponent(urlChirho.pathname.slice("/line-image-chirho/".length));
      const itemChirho = queueByKeyChirho.get(keyChirho);
      if (!itemChirho || !existsSync(itemChirho.lineImagePathChirho)) return new Response("not found", { status: 404 });
      return new Response(Bun.file(itemChirho.lineImagePathChirho));
    }
    if (urlChirho.pathname.startsWith("/span-image-chirho/")) {
      const keyChirho = decodeURIComponent(urlChirho.pathname.slice("/span-image-chirho/".length));
      const itemChirho = queueByKeyChirho.get(keyChirho);
      if (!itemChirho) return new Response("not found", { status: 404 });
      return spanImageResponseChirho(itemChirho);
    }
    if (urlChirho.pathname === "/api-chirho/validations-chirho") {
      return jsonResponseChirho({ validationsChirho: validationsChirho() });
    }
    if (urlChirho.pathname === "/api-chirho/submit-chirho" && reqChirho.method === "POST") {
      const bodyChirho = (await reqChirho.json()) as {
        keyChirho: string;
        verdictChirho: string;
        correctedTextChirho: string;
        notesChirho: string;
      };
      const itemChirho = queueByKeyChirho.get(bodyChirho.keyChirho);
      if (!itemChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown key" }, 404);
      const correctedTextChirho = bodyChirho.verdictChirho === "correct-chirho"
        ? bodyChirho.correctedTextChirho
        : null;
      if (bodyChirho.verdictChirho === "correct-chirho" && !correctedTextChirho?.trim()) {
        return jsonResponseChirho({ okChirho: false, errorChirho: "corrected text is required" }, 400);
      }
      const currentChirho = currentValidationStmtChirho.get(
        itemChirho.volumeChirho,
        itemChirho.pageChirho,
        itemChirho.lineIndexChirho,
        itemChirho.segmentIndexChirho
      ) as { id_chirho: number } | undefined;
      const rowChirho = saveDecisionChirho(
        itemChirho,
        bodyChirho.verdictChirho,
        correctedTextChirho,
        bodyChirho.notesChirho,
        currentChirho?.id_chirho ?? null
      );
      const nowChirho = new Date().toISOString();
      logStepStmtChirho.run(
        MODULE_CHIRHO,
        nowChirho,
        nowChirho,
        `Human validation ${bodyChirho.verdictChirho} for ${itemChirho.keyChirho}`,
        `stored pass_c_human_validations_chirho row for original=${JSON.stringify(itemChirho.textChirho)}`,
        "human review decision captured for Pass C Hebrew transcription validation"
      );
      return jsonResponseChirho({ okChirho: true, rowChirho });
    }
    if (urlChirho.pathname === "/api-chirho/undo-last-chirho" && reqChirho.method === "POST") {
      const latestChirho = latestCurrentValidationStmtChirho.get() as
        | {
            id_chirho: number;
            volume_chirho: number;
            page_chirho: number;
            line_index_chirho: number;
            segment_index_chirho: number;
          }
        | undefined;
      if (!latestChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "nothing to undo" }, 404);
      const keyChirho = spanKeyChirho({
        volumeChirho: latestChirho.volume_chirho,
        pageChirho: latestChirho.page_chirho,
        lineIndexChirho: latestChirho.line_index_chirho,
        segmentIndexChirho: latestChirho.segment_index_chirho,
      });
      const itemChirho = queueByKeyChirho.get(keyChirho);
      if (!itemChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "undo target not in queue" }, 404);
      const rowChirho = saveDecisionChirho(
        itemChirho,
        "undo-chirho",
        null,
        "undo latest validation",
        latestChirho.id_chirho
      );
      return jsonResponseChirho({ okChirho: true, rowChirho });
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`[${MODULE_CHIRHO}] loaded ${queueChirho.length} review span(s)`);
console.log(`[${MODULE_CHIRHO}] http://localhost:${portChirho}/`);
