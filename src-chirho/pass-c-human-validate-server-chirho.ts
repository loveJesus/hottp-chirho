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
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { writePassCHumanValidationBackupChirho } from "./pass-c-human-validation-backup-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "pass-c-human-validate-server-chirho";
const DEFAULT_PORT_CHIRHO = 8766;
const REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho",
  "pass-c-hebrew-validation-chirho.json"
);
const EXPORT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "markdown-chirho",
  "export-report-chirho.json"
);
const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const SCANLINES_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const PASS_C_CONTEXT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "pass-c-context-chirho");
const DEFAULT_DB_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "spec-chirho", "progress-chirho.sqlite");

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
  scriptChirho?: string;
  textChirho: string;
  lineTextChirho: string;
  tokenSkeletonsChirho: string[];
  tokenValidationsChirho: TokenValidationChirho[];
  directWordReadsChirho: DirectWordReadChirho[];
  validationStatusChirho: string;
  issueCodeChirho?: string;
  issueMessageChirho?: string;
}

interface ExportIssueChirho {
  severityChirho: string;
  codeChirho: string;
  messageChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho?: number;
  segmentIndexChirho?: number;
}

interface ExportReportChirho {
  generatedAtChirho?: string;
  issuesChirho: ExportIssueChirho[];
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
    scriptChirho: string;
    utf8TextChirho: string;
    wlcSuggestedTextChirho?: string;
    wlcSuggestionSourceChirho?: string;
  }>;
}

interface ContextWordChirho {
  wordIndexChirho: number;
  textChirho: string;
  xLocChirho: number;
  widthChirho: number;
  markerChirho: "FRENCH-AUTO" | "CANDIDATE";
  autoAcceptReasonChirho?: string;
  scriptHintChirho?: string;
}

interface ContextLineChirho {
  lineIndexChirho: number;
  wordsChirho: ContextWordChirho[];
}

interface ContextPageChirho {
  linesChirho: ContextLineChirho[];
}

interface QueueCandidateWordChirho {
  wordIndexChirho: number;
  textChirho: string;
  scriptHintChirho: string;
}

interface QueueItemChirho extends ReportSpanChirho {
  keyChirho: string;
  currentScriptChirho: string;
  liveSpanTextChirho: string;
  hasLiveSpanTextDriftChirho: boolean;
  wlcSuggestedTextChirho?: string;
  wlcSuggestionSourceChirho?: string;
  candidateWordsChirho: QueueCandidateWordChirho[];
  scriptHintSummaryChirho: string;
  defaultScriptVerdictChirho: string | null;
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
  script_verdict_chirho: string | null;
  issue_flags_chirho: string | null;
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

interface LoadedQueueChirho {
  titleChirho: string;
  queueGeneratedAtChirho: string | null;
  queueChirho: QueueItemChirho[];
}

type QueueModeChirho = "hebrew-chirho" | "suspect-text-chirho" | "unknown-script-chirho";

const ISSUE_FLAG_OPTIONS_CHIRHO = [
  { valueChirho: "letters-chirho", labelChirho: "Letters" },
  { valueChirho: "vowels-chirho", labelChirho: "Vowels" },
  { valueChirho: "accents-chirho", labelChirho: "Accents/meteg" },
  { valueChirho: "hebrew-punctuation-chirho", labelChirho: "Hebrew punct." },
  { valueChirho: "latin-punctuation-chirho", labelChirho: "Latin punct." },
  { valueChirho: "missing-hebrew-chirho", labelChirho: "Missing Heb." },
  { valueChirho: "extra-latin-chirho", labelChirho: "Extra Latin" },
  { valueChirho: "wrong-script-chirho", labelChirho: "Wrong script" },
  { valueChirho: "garbled-text-chirho", labelChirho: "Garbled text" },
  { valueChirho: "missing-greek-chirho", labelChirho: "Missing Greek" },
  { valueChirho: "extra-symbol-chirho", labelChirho: "Extra symbol" },
  { valueChirho: "wrong-language-chirho", labelChirho: "Wrong lang." },
  { valueChirho: "segmentation-chirho", labelChirho: "Segmentation" },
];
const ISSUE_FLAG_VALUES_CHIRHO = new Set(ISSUE_FLAG_OPTIONS_CHIRHO.map((optionChirho) => optionChirho.valueChirho));
const SCRIPT_VERDICT_OPTIONS_CHIRHO = [
  { valueChirho: "", labelChirho: "Defer script" },
  { valueChirho: "latin-non-french-chirho", labelChirho: "Latin non-French" },
  { valueChirho: "french-chirho", labelChirho: "French" },
  { valueChirho: "hebrew-chirho", labelChirho: "Hebrew" },
  { valueChirho: "greek-chirho", labelChirho: "Greek" },
  { valueChirho: "syriac-chirho", labelChirho: "Syriac" },
  { valueChirho: "symbol-chirho", labelChirho: "Symbol" },
];
const SCRIPT_VERDICT_VALUES_CHIRHO = new Set(
  SCRIPT_VERDICT_OPTIONS_CHIRHO
    .map((optionChirho) => optionChirho.valueChirho)
    .filter((valueChirho) => valueChirho.length > 0)
);
const REVIEW_STATE_FILTER_OPTIONS_CHIRHO = [
  { valueChirho: "pending-chirho", labelChirho: "Pending" },
  { valueChirho: "saved-issues-chirho", labelChirho: "Saved issues" },
] as const;

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

function parseQueueModeChirho(valueChirho: string | undefined): QueueModeChirho {
  if (valueChirho === undefined || valueChirho === "hebrew-chirho" || valueChirho === "hebrew") {
    return "hebrew-chirho";
  }
  if (valueChirho === "suspect-text-chirho" || valueChirho === "suspect-text" || valueChirho === "suspect") {
    return "suspect-text-chirho";
  }
  if (valueChirho === "unknown-script-chirho" || valueChirho === "unknown-script" || valueChirho === "unknown") {
    return "unknown-script-chirho";
  }
  throw new Error(`queue must be hebrew-chirho, suspect-text-chirho, or unknown-script-chirho; got ${valueChirho}`);
}

function defaultPortForQueueChirho(modeChirho: QueueModeChirho, valueChirho: string | undefined): number {
  if (valueChirho !== undefined) return positivePortChirho(valueChirho);
  if (modeChirho === "suspect-text-chirho") return 8767;
  if (modeChirho === "unknown-script-chirho") return 8768;
  return DEFAULT_PORT_CHIRHO;
}

function spanKeyChirho(spanChirho: Pick<ReportSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return [
    spanChirho.volumeChirho,
    spanChirho.pageChirho,
    spanChirho.lineIndexChirho,
    spanChirho.segmentIndexChirho,
  ].join(":");
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

function lineFilePathChirho(
  spanChirho: Pick<ReportSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho">
): string {
  return join(
    SPANS_DIR_CHIRHO,
    `vol-${spanChirho.volumeChirho}-chirho`,
    `page-${String(spanChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(spanChirho.lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function scanlineImagePathChirho(
  spanChirho: Pick<ReportSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho">
): string {
  return join(
    SCANLINES_DIR_CHIRHO,
    `vol-${spanChirho.volumeChirho}-chirho`,
    `page-${String(spanChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(spanChirho.lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function contextFilePathChirho(spanChirho: Pick<ReportSpanChirho, "volumeChirho" | "pageChirho">): string {
  return join(
    PASS_C_CONTEXT_DIR_CHIRHO,
    `vol-${spanChirho.volumeChirho}-chirho`,
    `page-${String(spanChirho.pageChirho).padStart(4, "0")}-chirho.json`
  );
}

const contextPageCacheChirho = new Map<string, ContextPageChirho | null>();

function loadContextPageChirho(pathChirho: string): ContextPageChirho | null {
  if (contextPageCacheChirho.has(pathChirho)) return contextPageCacheChirho.get(pathChirho) ?? null;
  if (!existsSync(pathChirho)) {
    contextPageCacheChirho.set(pathChirho, null);
    return null;
  }
  const pageChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as ContextPageChirho;
  contextPageCacheChirho.set(pathChirho, pageChirho);
  return pageChirho;
}

function candidateWordsForSpanChirho(
  spanChirho: ReportSpanChirho,
  spanXMinPxChirho: number,
  spanWidthPxChirho: number
): QueueCandidateWordChirho[] {
  const contextPageChirho = loadContextPageChirho(contextFilePathChirho(spanChirho));
  const contextLineChirho = contextPageChirho?.linesChirho.find(
    (lineChirho) => lineChirho.lineIndexChirho === spanChirho.lineIndexChirho
  );
  if (!contextLineChirho) return [];
  const spanEndPxChirho = spanXMinPxChirho + spanWidthPxChirho;
  return contextLineChirho.wordsChirho
    .filter((wordChirho) => {
      if (wordChirho.markerChirho !== "CANDIDATE") return false;
      const wordCenterPxChirho = wordChirho.xLocChirho + wordChirho.widthChirho / 2;
      return wordCenterPxChirho >= spanXMinPxChirho - 1 && wordCenterPxChirho <= spanEndPxChirho + 1;
    })
    .map((wordChirho) => ({
      wordIndexChirho: wordChirho.wordIndexChirho,
      textChirho: wordChirho.textChirho,
      scriptHintChirho: wordChirho.scriptHintChirho ?? "none-chirho",
    }));
}

function scriptHintSummaryChirho(candidateWordsChirho: QueueCandidateWordChirho[]): string {
  const hintsChirho = [...new Set(candidateWordsChirho.map((wordChirho) => wordChirho.scriptHintChirho))];
  return hintsChirho.length > 0 ? hintsChirho.join("+") : "none-chirho";
}

function defaultScriptVerdictChirho(statusChirho: string, hintSummaryChirho: string): string | null {
  if (statusChirho !== "unknown-script-chirho") return null;
  if (hintSummaryChirho === "latin-chirho") return "latin-non-french-chirho";
  if (hintSummaryChirho === "symbol-chirho") return "symbol-chirho";
  return null;
}

function tierForSpanChirho(spanChirho: ReportSpanChirho): string {
  if (spanChirho.validationStatusChirho === "unknown-script-chirho") return "unknown-script-chirho";
  if (spanChirho.validationStatusChirho === "suspect-text-chirho") return "suspect-text-chirho";
  if (spanChirho.validationStatusChirho === "all-token-validated-chirho") return "spot-check-chirho";
  if (spanChirho.volumeChirho >= 3) return "primary-vols-3-5-chirho";
  return "primary-vol-2-chirho";
}

function queuePriorityChirho(spanChirho: ReportSpanChirho): number {
  const tierChirho = tierForSpanChirho(spanChirho);
  if (tierChirho === "unknown-script-chirho") return 0;
  if (tierChirho === "suspect-text-chirho") return 0;
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

function loadExportReportChirho(): ExportReportChirho {
  if (!existsSync(EXPORT_REPORT_PATH_CHIRHO)) {
    throw new Error(`Export report not found: ${EXPORT_REPORT_PATH_CHIRHO}`);
  }
  return JSON.parse(readFileSync(EXPORT_REPORT_PATH_CHIRHO, "utf8")) as ExportReportChirho;
}

function lineTextFromSpanLineChirho(lineChirho: SpanLineFileChirho): string {
  return [...lineChirho.spansChirho]
    .sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join("");
}

function queueItemsFromReportSpansChirho(spansChirho: ReportSpanChirho[]): QueueItemChirho[] {
  return spansChirho
    .map((spanChirho) => {
      const linePathChirho = lineFilePathChirho(spanChirho);
      const lineChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as SpanLineFileChirho;
      const spanGeometryChirho = lineChirho.spansChirho.find(
        (itemChirho) => itemChirho.segmentIndexChirho === spanChirho.segmentIndexChirho
      );
      if (!spanGeometryChirho) {
        throw new Error(`Missing span geometry for ${spanKeyChirho(spanChirho)}`);
      }
      const liveSpanTextChirho = normalizeTextForStorageChirho(spanGeometryChirho.utf8TextChirho);
      const reportTextChirho = normalizeTextForStorageChirho(spanChirho.textChirho);
      const currentScriptChirho = spanChirho.scriptChirho ?? spanGeometryChirho.scriptChirho;
      const candidateWordsChirho = candidateWordsForSpanChirho(
        spanChirho,
        spanGeometryChirho.xMinPxChirho,
        spanGeometryChirho.widthPxChirho
      );
      const hintSummaryChirho = scriptHintSummaryChirho(candidateWordsChirho);
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
        currentScriptChirho,
        liveSpanTextChirho,
        hasLiveSpanTextDriftChirho: liveSpanTextChirho !== reportTextChirho,
        wlcSuggestedTextChirho: spanGeometryChirho.wlcSuggestedTextChirho,
        wlcSuggestionSourceChirho: spanGeometryChirho.wlcSuggestionSourceChirho,
        candidateWordsChirho,
        scriptHintSummaryChirho: hintSummaryChirho,
        defaultScriptVerdictChirho: defaultScriptVerdictChirho(spanChirho.validationStatusChirho, hintSummaryChirho),
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

function loadHebrewQueueChirho(): LoadedQueueChirho {
  const reportChirho = loadReportChirho();
  return {
    titleChirho: "Pass C Hebrew Validation",
    queueGeneratedAtChirho: reportChirho.generatedAtChirho ?? null,
    queueChirho: queueItemsFromReportSpansChirho(reportChirho.spansChirho),
  };
}

function loadSuspectTextQueueChirho(): LoadedQueueChirho {
  const reportChirho = loadExportReportChirho();
  const spansChirho: ReportSpanChirho[] = [];
  const seenKeysChirho = new Set<string>();
  for (const issueChirho of reportChirho.issuesChirho) {
    if (issueChirho.codeChirho !== "suspect-text-chirho") continue;
    if (issueChirho.lineIndexChirho === undefined || issueChirho.segmentIndexChirho === undefined) continue;
    const spanStubChirho = {
      volumeChirho: issueChirho.volumeChirho,
      pageChirho: issueChirho.pageChirho,
      lineIndexChirho: issueChirho.lineIndexChirho,
      segmentIndexChirho: issueChirho.segmentIndexChirho,
    };
    const keyChirho = spanKeyChirho(spanStubChirho);
    if (seenKeysChirho.has(keyChirho)) continue;
    seenKeysChirho.add(keyChirho);
    const lineChirho = JSON.parse(readFileSync(lineFilePathChirho(spanStubChirho), "utf8")) as SpanLineFileChirho;
    const spanChirho = lineChirho.spansChirho.find(
      (candidateChirho) => candidateChirho.segmentIndexChirho === issueChirho.segmentIndexChirho
    );
    if (!spanChirho) throw new Error(`Missing suspect span geometry for ${keyChirho}`);
    const tokenSkeletonChirho = spanChirho.scriptChirho === "hebrew-chirho"
      ? [hebrewSkeletonChirho(spanChirho.utf8TextChirho)].filter((skeletonChirho) => skeletonChirho.length > 0)
      : [];
    spansChirho.push({
      ...spanStubChirho,
      scriptChirho: spanChirho.scriptChirho,
      textChirho: spanChirho.utf8TextChirho,
      lineTextChirho: lineTextFromSpanLineChirho(lineChirho),
      tokenSkeletonsChirho: tokenSkeletonChirho,
      tokenValidationsChirho: [],
      directWordReadsChirho: [],
      validationStatusChirho: "suspect-text-chirho",
      issueCodeChirho: issueChirho.codeChirho,
      issueMessageChirho: issueChirho.messageChirho,
    });
  }
  return {
    titleChirho: "Pass C Suspect Text Validation",
    queueGeneratedAtChirho: reportChirho.generatedAtChirho ?? null,
    queueChirho: queueItemsFromReportSpansChirho(spansChirho),
  };
}

function loadUnknownScriptQueueChirho(): LoadedQueueChirho {
  const reportChirho = loadExportReportChirho();
  const spansChirho: ReportSpanChirho[] = [];
  const seenKeysChirho = new Set<string>();
  for (const issueChirho of reportChirho.issuesChirho) {
    if (issueChirho.codeChirho !== "unknown-script-chirho") continue;
    if (issueChirho.lineIndexChirho === undefined || issueChirho.segmentIndexChirho === undefined) continue;
    const spanStubChirho = {
      volumeChirho: issueChirho.volumeChirho,
      pageChirho: issueChirho.pageChirho,
      lineIndexChirho: issueChirho.lineIndexChirho,
      segmentIndexChirho: issueChirho.segmentIndexChirho,
    };
    const keyChirho = spanKeyChirho(spanStubChirho);
    if (seenKeysChirho.has(keyChirho)) continue;
    seenKeysChirho.add(keyChirho);
    const lineChirho = JSON.parse(readFileSync(lineFilePathChirho(spanStubChirho), "utf8")) as SpanLineFileChirho;
    const spanChirho = lineChirho.spansChirho.find(
      (candidateChirho) => candidateChirho.segmentIndexChirho === issueChirho.segmentIndexChirho
    );
    if (!spanChirho) throw new Error(`Missing unknown-script span geometry for ${keyChirho}`);
    const tokenSkeletonChirho = spanChirho.scriptChirho === "hebrew-chirho"
      ? [hebrewSkeletonChirho(spanChirho.utf8TextChirho)].filter((skeletonChirho) => skeletonChirho.length > 0)
      : [];
    spansChirho.push({
      ...spanStubChirho,
      scriptChirho: spanChirho.scriptChirho,
      textChirho: spanChirho.utf8TextChirho,
      lineTextChirho: lineTextFromSpanLineChirho(lineChirho),
      tokenSkeletonsChirho: tokenSkeletonChirho,
      tokenValidationsChirho: [],
      directWordReadsChirho: [],
      validationStatusChirho: "unknown-script-chirho",
      issueCodeChirho: issueChirho.codeChirho,
      issueMessageChirho: issueChirho.messageChirho,
    });
  }
  return {
    titleChirho: "Pass C Unknown Script Validation",
    queueGeneratedAtChirho: reportChirho.generatedAtChirho ?? null,
    queueChirho: queueItemsFromReportSpansChirho(spansChirho),
  };
}

function loadQueueForModeChirho(modeChirho: QueueModeChirho): LoadedQueueChirho {
  if (modeChirho === "suspect-text-chirho") return loadSuspectTextQueueChirho();
  if (modeChirho === "unknown-script-chirho") return loadUnknownScriptQueueChirho();
  return loadHebrewQueueChirho();
}

const argsChirho = process.argv.slice(2);
const queueModeChirho = parseQueueModeChirho(parseArgValueChirho(argsChirho, "queue"));
const portChirho = defaultPortForQueueChirho(queueModeChirho, parseArgValueChirho(argsChirho, "port"));
const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? DEFAULT_DB_PATH_CHIRHO;
const backupPathChirho = parseArgValueChirho(argsChirho, "backup");
const dbChirho = new Database(dbPathChirho);
const loadedQueueChirho = loadQueueForModeChirho(queueModeChirho);
const queueGeneratedAtChirho = loadedQueueChirho.queueGeneratedAtChirho;
const queueTitleChirho = loadedQueueChirho.titleChirho;
const queueChirho = loadedQueueChirho.queueChirho;
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
  script_verdict_chirho     TEXT,
  issue_flags_chirho        TEXT,
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

function addColumnIfMissingChirho(tableNameChirho: string, columnNameChirho: string, definitionChirho: string): void {
  const columnsChirho = new Set(tableColumnsChirho(tableNameChirho));
  if (!columnsChirho.has(columnNameChirho)) {
    dbChirho.run(`ALTER TABLE ${tableNameChirho} ADD COLUMN ${definitionChirho}`);
  }
}

addColumnIfMissingChirho(
  "pass_c_human_validations_chirho",
  "issue_flags_chirho",
  "issue_flags_chirho TEXT"
);
addColumnIfMissingChirho(
  "pass_c_human_validations_chirho",
  "script_verdict_chirho",
  "script_verdict_chirho TEXT"
);

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
   corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho, witness_snapshot_chirho,
   queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
   supersedes_id_chirho, is_current_chirho, schema_version_chirho)
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 2)`);

const validationRowsStmtChirho = dbChirho.prepare(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
       original_text_chirho, original_text_hash_chirho, line_text_chirho,
       verdict_chirho, corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho,
       witness_snapshot_chirho, queue_generated_at_chirho, reviewer_chirho,
       created_at_chirho, updated_at_chirho, supersedes_id_chirho, is_current_chirho,
       applied_at_chirho, applied_to_file_chirho, schema_version_chirho
  FROM pass_c_human_validations_chirho
 WHERE is_current_chirho = 1 AND verdict_chirho <> 'undo-chirho' AND schema_version_chirho >= 2
 ORDER BY updated_at_chirho DESC, id_chirho DESC`);

const validationByIdStmtChirho = dbChirho.prepare(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
       original_text_chirho, original_text_hash_chirho, line_text_chirho,
       verdict_chirho, corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho,
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
 WHERE is_current_chirho = 1 AND verdict_chirho <> 'undo-chirho' AND schema_version_chirho >= 2
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
    currentScriptChirho: itemChirho.currentScriptChirho,
    scriptHintSummaryChirho: itemChirho.scriptHintSummaryChirho,
    candidateWordsChirho: itemChirho.candidateWordsChirho,
    tokenSkeletonsChirho: itemChirho.tokenSkeletonsChirho,
    tokenValidationsChirho: itemChirho.tokenValidationsChirho,
    directWordReadsChirho: itemChirho.directWordReadsChirho,
    lineImagePathChirho: itemChirho.lineImagePathChirho,
  });
}

function sanitizeIssueFlagsChirho(issueFlagsChirho: unknown): string[] {
  if (!Array.isArray(issueFlagsChirho)) return [];
  const cleanFlagsChirho: string[] = [];
  for (const flagChirho of issueFlagsChirho) {
    if (typeof flagChirho !== "string" || !ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho)) continue;
    if (!cleanFlagsChirho.includes(flagChirho)) cleanFlagsChirho.push(flagChirho);
  }
  return cleanFlagsChirho;
}

function sanitizeScriptVerdictChirho(scriptVerdictChirho: unknown): string | null {
  if (typeof scriptVerdictChirho !== "string" || scriptVerdictChirho.length === 0) return null;
  return SCRIPT_VERDICT_VALUES_CHIRHO.has(scriptVerdictChirho) ? scriptVerdictChirho : null;
}

function saveDecisionChirho(
  itemChirho: QueueItemChirho,
  verdictChirho: string,
  correctedTextChirho: string | null,
  scriptVerdictChirho: string | null,
  issueFlagsChirho: string[],
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
    scriptVerdictChirho,
    JSON.stringify(issueFlagsChirho),
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
  <title>${queueTitleChirho} Chirho</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f5f5f2; color: #1f2933; }
    button, textarea, input { font: inherit; }
    .shell-chirho { max-width: 1220px; margin: 0 auto; padding: 18px; }
    .top-chirho { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #d8d4c8; padding-bottom: 12px; }
    .title-chirho { font-size: 20px; font-weight: 700; }
    .summary-chirho { color: #59636f; font-size: 14px; }
    .main-chirho { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 18px; padding-top: 18px; }
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
    .span-text-chirho { direction: ltr; unicode-bidi: plaintext; font-size: 24px; line-height: 1.35; background: white; border: 1px solid #d6d9dd; padding: 12px; min-height: 52px; }
    .line-text-chirho { font-size: 17px; line-height: 1.5; background: white; border: 1px solid #d6d9dd; padding: 10px; }
    .edit-chirho { direction: rtl; unicode-bidi: plaintext; min-height: 76px; resize: vertical; width: 100%; box-sizing: border-box; border: 1px solid #b8bec7; padding: 10px; background: #fff; font-size: 25px; line-height: 1.35; }
    .typewriter-chirho { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; background: #fff; border: 1px solid #d6d9dd; padding: 8px; }
    .typewriter-button-chirho { min-width: 38px; height: 34px; border: 1px solid #aab1b9; background: #fff; cursor: pointer; font-size: 20px; line-height: 1; }
    .typewriter-button-chirho:hover { background: #edf1f4; }
    .typewriter-button-chirho:focus-visible { outline: 2px solid #bd7a1b; outline-offset: 1px; }
    .toolbar-chirho { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .toolbar-chirho select, .toolbar-chirho button { border: 1px solid #aab1b9; background: #fff; min-height: 34px; padding: 5px 8px; }
    .side-chirho { display: flex; flex-direction: column; gap: 12px; }
    .box-chirho { border: 1px solid #d6d9dd; background: #fff; padding: 12px; }
    .meta-grid-chirho { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; font-size: 13px; }
    .mono-chirho { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .command-chirho { overflow-wrap: anywhere; white-space: pre-wrap; }
    .candidate-words-chirho { overflow-wrap: anywhere; }
    .witness-list-chirho { display: flex; flex-direction: column; gap: 6px; font-size: 13px; margin-top: 8px; }
    .witness-chirho { border-left: 3px solid #8aa399; padding-left: 8px; }
    .warning-chirho { border-left: 4px solid #bd7a1b; background: #fff7e8; padding: 10px; font-size: 13px; color: #704000; }
    .tier-chirho { display: inline-block; padding: 2px 6px; border: 1px solid #b8bec7; background: #f5f7f8; font-size: 12px; }
    .issue-grid-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .script-grid-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
    .issue-option-chirho { display: flex; gap: 7px; align-items: center; border: 1px solid #d6d9dd; padding: 8px; min-height: 38px; box-sizing: border-box; cursor: pointer; }
    .issue-option-chirho input { margin: 0; }
    .issue-option-chirho:has(input:checked) { border-color: #bd7a1b; background: #fff7e8; }
    .actions-chirho { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
    .actions-chirho button { border: 1px solid #aab1b9; background: #fff; padding: 10px; cursor: pointer; min-height: 42px; }
    .actions-chirho button:hover { background: #edf1f4; }
    .continue-chirho { color: #116149; border-color: #499b7f !important; font-weight: 700; }
    .undo-chirho { color: #59636f; }
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
        <div class="title-chirho">${queueTitleChirho}</div>
        <div class="summary-chirho" id="summary-chirho"></div>
      </div>
      <div class="status-chirho" id="status-chirho"></div>
    </div>
    <div class="toolbar-chirho">
      <label class="label-chirho" for="review-state-filter-chirho">Review</label>
      <select id="review-state-filter-chirho">
        ${REVIEW_STATE_FILTER_OPTIONS_CHIRHO.map((optionChirho) => `<option value="${optionChirho.valueChirho}">${optionChirho.labelChirho}</option>`).join("")}
      </select>
      <label class="label-chirho" for="validation-status-filter-chirho">Status</label>
      <select id="validation-status-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="unvalidated-chirho">Unvalidated</option>
        <option value="partial-token-validated-chirho">Partial</option>
        <option value="all-token-validated-chirho">All-token spot check</option>
      </select>
      <label class="label-chirho" for="tier-filter-chirho">Tier</label>
      <select id="tier-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="primary-vols-3-5-chirho">Primary vols 3-5</option>
        <option value="primary-vol-2-chirho">Primary vol 2</option>
        <option value="spot-check-chirho">Spot check</option>
        <option value="suspect-text-chirho">Suspect text</option>
        <option value="unknown-script-chirho">Unknown script</option>
      </select>
    </div>
    <section class="main-chirho" id="app-chirho"></section>
  </main>
  <script>
    const queueChirho = ${scriptJsonChirho(queueChirho)};
    const queueModeChirho = ${scriptJsonChirho(queueModeChirho)};
    const issueFlagOptionsChirho = ${scriptJsonChirho(ISSUE_FLAG_OPTIONS_CHIRHO)};
    const scriptVerdictOptionsChirho = ${scriptJsonChirho(SCRIPT_VERDICT_OPTIONS_CHIRHO)};
    let validationsChirho = new Map();
    let indexChirho = 0;
    const initialSearchParamsChirho = new URLSearchParams(window.location.search);

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
    function selectValueOrDefaultChirho(selectIdChirho, valueChirho, defaultChirho) {
      const selectChirho = document.getElementById(selectIdChirho);
      if (typeof valueChirho !== "string") return defaultChirho;
      return [...selectChirho.options].some((optionChirho) => optionChirho.value === valueChirho) ? valueChirho : defaultChirho;
    }
    function parseJsonArrayChirho(valueChirho) {
      if (typeof valueChirho !== "string" || valueChirho.length === 0) return [];
      try {
        const parsedChirho = JSON.parse(valueChirho);
        return Array.isArray(parsedChirho) ? parsedChirho.filter((itemChirho) => typeof itemChirho === "string") : [];
      } catch (_errorChirho) {
        return [];
      }
    }
    function shellSingleQuoteChirho(valueChirho) {
      return "'" + String(valueChirho).normalize("NFC").replace(/'/g, "'\\"'\\"'") + "'";
    }
    let reviewStateFilterChirho = selectValueOrDefaultChirho(
      "review-state-filter-chirho",
      initialSearchParamsChirho.get("review-state-chirho"),
      "pending-chirho"
    );
    let validationStatusFilterChirho = selectValueOrDefaultChirho(
      "validation-status-filter-chirho",
      initialSearchParamsChirho.get("validation-status-chirho"),
      "all-chirho"
    );
    let tierFilterChirho = selectValueOrDefaultChirho(
      "tier-filter-chirho",
      initialSearchParamsChirho.get("tier-chirho"),
      "all-chirho"
    );
    function syncFilterControlsChirho() {
      document.getElementById("review-state-filter-chirho").value = reviewStateFilterChirho;
      document.getElementById("validation-status-filter-chirho").value = validationStatusFilterChirho;
      document.getElementById("tier-filter-chirho").value = tierFilterChirho;
    }
    function syncUrlChirho() {
      const paramsChirho = new URLSearchParams();
      if (reviewStateFilterChirho !== "pending-chirho") paramsChirho.set("review-state-chirho", reviewStateFilterChirho);
      if (validationStatusFilterChirho !== "all-chirho") paramsChirho.set("validation-status-chirho", validationStatusFilterChirho);
      if (tierFilterChirho !== "all-chirho") paramsChirho.set("tier-chirho", tierFilterChirho);
      const queryChirho = paramsChirho.toString();
      window.history.replaceState(null, "", queryChirho ? window.location.pathname + "?" + queryChirho : window.location.pathname);
    }
    function activeQueueChirho() {
      return queueChirho.filter((itemChirho) =>
        (
          reviewStateFilterChirho === "pending-chirho"
            ? !validationsChirho.has(itemChirho.keyChirho)
            : validationsChirho.get(itemChirho.keyChirho)?.verdict_chirho === "reviewed-issues-chirho"
        ) &&
        (validationStatusFilterChirho === "all-chirho" || itemChirho.validationStatusChirho === validationStatusFilterChirho) &&
        (tierFilterChirho === "all-chirho" || itemChirho.tierChirho === tierFilterChirho)
      );
    }
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
      const activeCountChirho = activeQueueChirho().length;
      const modeLabelChirho = reviewStateFilterChirho === "pending-chirho" ? "remaining" : "saved issue row(s)";
      document.getElementById("summary-chirho").textContent =
        activeCountChirho + " " + modeLabelChirho + " in filter of " + queueChirho.length + " review spans, " + validationsChirho.size + " saved";
    }
    function witnessTextChirho(tokenChirho) {
      if (tokenChirho.witnessesChirho.length === 0) return "none";
      return tokenChirho.witnessesChirho
        .map((wChirho) => wChirho.sourceChirho + ": " + wChirho.textChirho + (wChirho.confidenceChirho == null ? "" : " @" + wChirho.confidenceChirho))
        .join(" | ");
    }
    function spanTextClassChirho(itemChirho) {
      return itemChirho.currentScriptChirho === "hebrew-chirho" || queueModeChirho === "hebrew-chirho"
        ? "hebrew-chirho"
        : "span-text-chirho";
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
      const savedValidationChirho = validationsChirho.get(itemChirho.keyChirho);
      const savedIssueFlagsChirho = new Set(parseJsonArrayChirho(savedValidationChirho?.issue_flags_chirho));
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
      targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Live span text" }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: itemChirho.liveSpanTextChirho }));
      if (itemChirho.hasLiveSpanTextDriftChirho) {
        targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Report text" }));
        targetRowChirho.appendChild(elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: itemChirho.textChirho }));
      }
      targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Line text" }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: "line-text-chirho", textChirho: itemChirho.lineTextChirho }));
      targetRowChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Optional suggested text" }));
      const editChirho = elChirho("textarea", { classChirho: "edit-chirho", id: "edit-chirho" });
      editChirho.value = savedValidationChirho?.corrected_text_chirho ?? itemChirho.liveSpanTextChirho;
      if (reviewStateFilterChirho !== "pending-chirho") editChirho.setAttribute("readonly", "true");
      targetRowChirho.appendChild(editChirho);
      targetRowChirho.appendChild(typewriterChirho());
      leftChirho.appendChild(targetRowChirho);

      const sideChirho = elChirho("aside", { classChirho: "side-chirho" });
      if (queueModeChirho === "hebrew-chirho") {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Machine witnesses validate consonants only. Vowels and niqqud are UNVERIFIED even when consonants agree." }));
      } else if (queueModeChirho === "suspect-text-chirho") {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "No issue boxes checked means this suspect-text warning is a false positive after source review." }));
      } else {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Choose a script only when the live text is usable for that script. Latin and symbol clean reviews certify the text; Hebrew, Greek, and Syriac clean reviews only resolve the script and still need script-specific text validation." }));
      }
      if (itemChirho.hasLiveSpanTextDriftChirho) {
        sideChirho.appendChild(elChirho("div", { classChirho: "warning-chirho", textChirho: "Live span text differs from this report. Check the relevant issue box; clean review is blocked." }));
      }
      if (reviewStateFilterChirho !== "pending-chirho" && savedValidationChirho) {
        sideChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: "Saved issue row shown read-only. Inspect the crop and use the guarded status-report correction command only after explicit confirmation."
        }));
        if (typeof itemChirho.wlcSuggestedTextChirho === "string" && itemChirho.wlcSuggestedTextChirho.length > 0) {
          const guardedCommandChirho =
            "bun run apply-human-suggested-corrections-chirho -- --apply --certify-human " +
            "--validation-id-chirho=" + savedValidationChirho.id_chirho + " " +
            "--suggested-text-chirho=" + shellSingleQuoteChirho(itemChirho.wlcSuggestedTextChirho);
          const suggestionBoxChirho = elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
            elChirho("div", { textChirho: "WLC suggestion" }),
            elChirho("div", { classChirho: spanTextClassChirho(itemChirho), textChirho: itemChirho.wlcSuggestedTextChirho }),
            elChirho("div", { textChirho: "Source" }),
            elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.wlcSuggestionSourceChirho ?? "unknown-chirho" }),
            elChirho("div", { textChirho: "After confirmation" }),
            elChirho("div", { classChirho: "mono-chirho command-chirho", textChirho: guardedCommandChirho })
          ]);
          sideChirho.appendChild(suggestionBoxChirho);
        }
      }
      const metaChirho = elChirho("div", { classChirho: "box-chirho meta-grid-chirho" }, [
        elChirho("div", { textChirho: "Location" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: "vol " + itemChirho.volumeChirho + " p" + itemChirho.pageChirho + " L" + itemChirho.lineIndexChirho + " S" + itemChirho.segmentIndexChirho }),
        elChirho("div", { textChirho: "Status" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.validationStatusChirho }),
        elChirho("div", { textChirho: "Current script" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.currentScriptChirho }),
        elChirho("div", { textChirho: "Script hints" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.scriptHintSummaryChirho }),
        elChirho("div", { textChirho: "Tier" }),
        elChirho("div", { classChirho: "tier-chirho", textChirho: itemChirho.tierChirho }),
        elChirho("div", { textChirho: "Hash" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.originalTextHashChirho.slice(0, 16) }),
        elChirho("div", { textChirho: "Skeletons" }),
        elChirho("div", { classChirho: "mono-chirho", textChirho: itemChirho.tokenSkeletonsChirho.join(" ") })
      ]);
      sideChirho.appendChild(metaChirho);

      if (itemChirho.issueMessageChirho) {
        sideChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: itemChirho.issueMessageChirho
        }));
      }

      if (itemChirho.candidateWordsChirho.length > 0) {
        const candidateBoxChirho = elChirho("div", { classChirho: "box-chirho" });
        candidateBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Candidate words" }));
        candidateBoxChirho.appendChild(elChirho("div", {
          classChirho: "mono-chirho candidate-words-chirho",
          textChirho: itemChirho.candidateWordsChirho
            .map((wordChirho) => "#" + wordChirho.wordIndexChirho + " " + wordChirho.scriptHintChirho + " " + wordChirho.textChirho)
            .join(" | ")
        }));
        sideChirho.appendChild(candidateBoxChirho);
      }

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

      if (queueModeChirho === "unknown-script-chirho") {
        const scriptBoxChirho = elChirho("div", { classChirho: "box-chirho" });
        scriptBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Script verdict" }));
        const scriptGridChirho = elChirho("div", { classChirho: "script-grid-chirho" });
        for (const optionChirho of scriptVerdictOptionsChirho) {
          const inputChirho = elChirho("input", {
            id: "script-" + (optionChirho.valueChirho || "defer-chirho"),
            name: "script-verdict-chirho",
            type: "radio",
            value: optionChirho.valueChirho
          });
          if ((itemChirho.defaultScriptVerdictChirho ?? "") === optionChirho.valueChirho) {
            inputChirho.checked = true;
          }
          scriptGridChirho.appendChild(elChirho("label", { classChirho: "issue-option-chirho", for: "script-" + (optionChirho.valueChirho || "defer-chirho") }, [
            inputChirho,
            elChirho("span", { textChirho: optionChirho.labelChirho })
          ]));
        }
        scriptBoxChirho.appendChild(scriptGridChirho);
        sideChirho.appendChild(scriptBoxChirho);
      }

      const issuesBoxChirho = elChirho("div", { classChirho: "box-chirho" });
      issuesBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Issues" }));
      const issueGridChirho = elChirho("div", { classChirho: "issue-grid-chirho" });
      for (const optionChirho of issueFlagOptionsChirho) {
        const inputChirho = elChirho("input", {
          classChirho: "issue-checkbox-chirho",
          id: "issue-" + optionChirho.valueChirho,
          type: "checkbox",
          value: optionChirho.valueChirho
        });
        if (savedIssueFlagsChirho.has(optionChirho.valueChirho)) inputChirho.checked = true;
        if (reviewStateFilterChirho !== "pending-chirho") inputChirho.disabled = true;
        issueGridChirho.appendChild(elChirho("label", { classChirho: "issue-option-chirho", for: "issue-" + optionChirho.valueChirho }, [
          inputChirho,
          elChirho("span", { textChirho: optionChirho.labelChirho })
        ]));
      }
      issuesBoxChirho.appendChild(issueGridChirho);
      sideChirho.appendChild(issuesBoxChirho);

      const notesBoxChirho = elChirho("div", { classChirho: "box-chirho" });
      notesBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Notes" }));
      const notesChirho = elChirho("textarea", { id: "notes-chirho", style: "width:100%;min-height:58px;box-sizing:border-box;" });
      notesChirho.value = savedValidationChirho?.notes_chirho ?? "";
      if (reviewStateFilterChirho !== "pending-chirho") notesChirho.setAttribute("readonly", "true");
      notesBoxChirho.appendChild(notesChirho);
      sideChirho.appendChild(notesBoxChirho);

      const actionsChirho = elChirho("div", { classChirho: "actions-chirho" });
      if (reviewStateFilterChirho === "pending-chirho") {
        const continueButtonChirho = elChirho("button", { classChirho: "continue-chirho", textChirho: "Continue" });
        continueButtonChirho.addEventListener("click", () => submitReviewChirho());
        actionsChirho.appendChild(continueButtonChirho);
        const undoButtonChirho = elChirho("button", { classChirho: "undo-chirho", textChirho: "Undo last" });
        undoButtonChirho.addEventListener("click", () => undoLastChirho());
        actionsChirho.appendChild(undoButtonChirho);
      } else {
        actionsChirho.appendChild(elChirho("button", { disabled: "true", textChirho: "Read-only saved issue" }));
      }
      sideChirho.appendChild(actionsChirho);

      appChirho.appendChild(leftChirho);
      appChirho.appendChild(sideChirho);
    }
    async function submitReviewChirho() {
      if (reviewStateFilterChirho !== "pending-chirho") {
        setStatusChirho("Saved issue view is read-only");
        return;
      }
      const itemChirho = currentItemChirho();
      if (!itemChirho) return;
      const correctedTextChirho = document.getElementById("edit-chirho").value;
      const notesChirho = document.getElementById("notes-chirho").value;
      const issueFlagsChirho = Array.from(document.querySelectorAll(".issue-checkbox-chirho:checked"))
        .map((inputChirho) => inputChirho.value);
      const scriptVerdictChirho = document.querySelector("input[name='script-verdict-chirho']:checked")?.value ?? "";
      const responseChirho = await fetch("/api-chirho/submit-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyChirho: itemChirho.keyChirho, issueFlagsChirho, correctedTextChirho, notesChirho, scriptVerdictChirho })
      });
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) {
        setStatusChirho(dataChirho.errorChirho || "Save failed");
        return;
      }
      validationsChirho.set(itemChirho.keyChirho, dataChirho.rowChirho);
      setStatusChirho("Saved " + dataChirho.rowChirho.verdict_chirho);
      if (indexChirho >= activeQueueChirho().length) indexChirho = Math.max(0, activeQueueChirho().length - 1);
      renderChirho();
    }
    async function undoLastChirho() {
      if (reviewStateFilterChirho !== "pending-chirho") {
        setStatusChirho("Saved issue view is read-only");
        return;
      }
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
      if (keyChirho === "enter") submitReviewChirho();
      if (keyChirho === "u") undoLastChirho();
      if (keyChirho === "arrowright") { indexChirho = Math.min(activeQueueChirho().length - 1, indexChirho + 1); renderChirho(); }
      if (keyChirho === "arrowleft") { indexChirho = Math.max(0, indexChirho - 1); renderChirho(); }
    });
    document.getElementById("review-state-filter-chirho").addEventListener("change", (eventChirho) => {
      reviewStateFilterChirho = eventChirho.target.value;
      indexChirho = 0;
      syncUrlChirho();
      renderChirho();
    });
    document.getElementById("validation-status-filter-chirho").addEventListener("change", (eventChirho) => {
      validationStatusFilterChirho = eventChirho.target.value;
      indexChirho = 0;
      syncUrlChirho();
      renderChirho();
    });
    document.getElementById("tier-filter-chirho").addEventListener("change", (eventChirho) => {
      tierFilterChirho = eventChirho.target.value;
      indexChirho = 0;
      syncUrlChirho();
      renderChirho();
    });
    syncFilterControlsChirho();
    syncUrlChirho();
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
        issueFlagsChirho?: unknown;
        scriptVerdictChirho?: unknown;
        correctedTextChirho: string;
        notesChirho: string;
      };
      const itemChirho = queueByKeyChirho.get(bodyChirho.keyChirho);
      if (!itemChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown key" }, 404);
      const issueFlagsChirho = sanitizeIssueFlagsChirho(bodyChirho.issueFlagsChirho);
      const scriptVerdictChirho = queueModeChirho === "unknown-script-chirho"
        ? sanitizeScriptVerdictChirho(bodyChirho.scriptVerdictChirho)
        : null;
      const editedTextChirho = normalizeTextForStorageChirho(
        bodyChirho.correctedTextChirho ?? itemChirho.liveSpanTextChirho
      );
      const hasEditedTextChirho = editedTextChirho !== itemChirho.liveSpanTextChirho;
      if (itemChirho.hasLiveSpanTextDriftChirho && issueFlagsChirho.length === 0) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "Live span text drifted; check at least one issue box",
        }, 400);
      }
      if (hasEditedTextChirho && issueFlagsChirho.length === 0) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "Text changed; check at least one issue box",
        }, 400);
      }
      if (queueModeChirho === "unknown-script-chirho" && !scriptVerdictChirho && issueFlagsChirho.length === 0 && !hasEditedTextChirho) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "Unknown-script review needs a script verdict or at least one issue box",
        }, 400);
      }
      const verdictChirho = issueFlagsChirho.length === 0 && !hasEditedTextChirho
        ? "reviewed-clean-chirho"
        : "reviewed-issues-chirho";
      const correctedTextChirho = hasEditedTextChirho ? editedTextChirho : null;
      const currentChirho = currentValidationStmtChirho.get(
        itemChirho.volumeChirho,
        itemChirho.pageChirho,
        itemChirho.lineIndexChirho,
        itemChirho.segmentIndexChirho
      ) as { id_chirho: number } | undefined;
      const rowChirho = saveDecisionChirho(
        itemChirho,
        verdictChirho,
        correctedTextChirho,
        scriptVerdictChirho,
        issueFlagsChirho,
        bodyChirho.notesChirho,
        currentChirho?.id_chirho ?? null
      );
      writePassCHumanValidationBackupChirho(dbChirho, backupPathChirho);
      const nowChirho = new Date().toISOString();
      logStepStmtChirho.run(
        MODULE_CHIRHO,
        nowChirho,
        nowChirho,
        `Human validation ${verdictChirho} for ${itemChirho.keyChirho}`,
        `stored pass_c_human_validations_chirho row with issue_flags=${JSON.stringify(issueFlagsChirho)} script_verdict=${scriptVerdictChirho ?? "none-chirho"}`,
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
        null,
        [],
        "undo latest validation",
        latestChirho.id_chirho
      );
      writePassCHumanValidationBackupChirho(dbChirho, backupPathChirho);
      return jsonResponseChirho({ okChirho: true, rowChirho });
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`[${MODULE_CHIRHO}] loaded ${queueChirho.length} review span(s)`);
console.log(`[${MODULE_CHIRHO}] http://localhost:${portChirho}/`);
