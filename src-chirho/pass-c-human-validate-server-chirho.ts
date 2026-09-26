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
import { writePassCHumanValidationBackupChirho } from "./pass-c-human-validation-backup-chirho.ts";
import { parseRawHebrewPreReviewNotesChirho } from "./raw-hebrew-pre-review-notes-chirho.ts";
import {
  RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO,
  RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO,
  rawHebrewReviewTierForSpanChirho
} from "./raw-hebrew-review-tier-chirho.ts";
import {
  rawHebrewAttentionKindLabelChirho,
  rawHebrewAttentionKindsChirho,
  rawHebrewAttentionReasonsChirho,
  rawHebrewPreReviewMissingAttentionKindsChirho
} from "./raw-hebrew-review-triage-chirho.ts";
import {
  reviewServerNoStoreHeadersChirho,
  reviewServerSourceStaleErrorChirho,
  reviewServerStartupHealthChirho,
} from "./review-server-health-chirho.ts";
import {
  certifyingReviewerAttributionErrorChirho
} from "./reviewer-attribution-chirho.ts";
import {
  appendSegmentRepairProposalChirho,
  isSegmentRepairScriptChirho,
  parseSegmentRepairKindChirho,
  SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO,
  SEGMENT_REPAIR_SCRIPT_LABELS_CHIRHO,
  validateSegmentRepairProposalSpansChirho,
  type SegmentRepairProposalRecordChirho,
  type SegmentRepairProposalSpanChirho
} from "./segment-repair-proposals-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";
import {
  reviewNotesLookPlaceholderChirho
} from "./template-placeholder-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";
import { trustedReviewerIdentityChirho } from "./trusted-reviewer-identity-chirho.ts";

import { humanReviewPageChirho } from "./human-review-ui-chirho/page-chirho.ts";
import { spanImageResponseChirho } from "./human-review-ui-chirho/scan-images-chirho.ts";
import {
  ISSUE_FLAG_VALUES_CHIRHO,
  SCRIPT_VERDICT_VALUES_CHIRHO,
  type ContextPageChirho,
  type ExportReportChirho,
  type HumanValidationRowChirho,
  type LineWordBoxRowChirho,
  type LoadedQueueChirho,
  type MarkerGeometryChirho,
  type QueueCandidateWordChirho,
  type QueueItemChirho,
  type QueueModeChirho,
  type RawReviewDisplayGuardChirho,
  type RawReviewSubmitRequestChirho,
  type RawReviewUndoRequestChirho,
  type RawSegmentRepairProposalRequestChirho,
  type ReportSpanChirho,
  type SpanLineFileChirho,
  type ValidationReportChirho
} from "./human-review-ui-chirho/types-chirho.ts";

const MODULE_CHIRHO = "pass-c-human-validate-server-chirho";
const SERVER_HEALTH_CHIRHO = reviewServerStartupHealthChirho("raw-hebrew-chirho");
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
const RAW_HEBREW_HUMAN_CERTIFICATION_QUICKSTART_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "raw-hebrew-human-certification-quickstart-2026-06-05-chirho.md"
);
const HALLELUJAH_REVIEW_SESSION_GUIDE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "hallelujah-review-session-guide-2026-06-05-chirho.md"
);
const RAW_HEBREW_PRE_REVIEW_NOTES_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "codex-pre-review-raw-hebrew-2026-06-04-chirho.md"
);
const DEFAULT_SEGMENT_REPAIR_PROPOSALS_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "segment-repair-proposals-2026-07-02-chirho.json"
);

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  const matchedArgChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  if (matchedArgChirho === undefined) return undefined;
  const valueChirho = matchedArgChirho.slice(prefixChirho.length);
  if (valueChirho.length === 0) throw new Error(`--${nameChirho} must not be empty`);
  return valueChirho;
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

function fileSha256Chirho(pathChirho: string): string | null {
  if (!existsSync(pathChirho)) return null;
  return createHashChirho("sha256").update(readFileSync(pathChirho)).digest("hex");
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
  return rawHebrewReviewTierForSpanChirho(spanChirho);
}

function loadPreReviewNotesChirho(): Map<string, string> {
  if (!existsSync(RAW_HEBREW_PRE_REVIEW_NOTES_PATH_CHIRHO)) return new Map();
  return parseRawHebrewPreReviewNotesChirho(readFileSync(RAW_HEBREW_PRE_REVIEW_NOTES_PATH_CHIRHO, "utf8"));
}

function queuePriorityChirho(spanChirho: ReportSpanChirho): number {
  const tierChirho = tierForSpanChirho(spanChirho);
  if (tierChirho === "unknown-script-chirho") return 0;
  if (tierChirho === "suspect-text-chirho") return 0;
  if (tierChirho === RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_3_5_CHIRHO) return 0;
  if (tierChirho === RAW_HEBREW_REVIEW_TIER_PRIMARY_VOLS_1_2_CHIRHO) return 1000;
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
  return renderSpanLineTextChirho(lineChirho);
}

function lineSegmentsForProposalChirho(lineChirho: SpanLineFileChirho): SegmentRepairProposalSpanChirho[] {
  return [...lineChirho.spansChirho]
    .sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho)
    .map((spanChirho, indexChirho) => ({
      segmentIndexChirho: indexChirho,
      xMinPxChirho: spanChirho.xMinPxChirho,
      widthPxChirho: spanChirho.widthPxChirho,
      scriptChirho: isSegmentRepairScriptChirho(spanChirho.scriptChirho) ? spanChirho.scriptChirho : "unknown-script-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
    }));
}

function queueItemsFromReportSpansChirho(spansChirho: ReportSpanChirho[]): QueueItemChirho[] {
  const preReviewNotesChirho = loadPreReviewNotesChirho();
  return spansChirho
    .map((spanChirho) => {
      const keyChirho = spanKeyChirho(spanChirho);
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
      const preReviewNoteChirho = preReviewNotesChirho.get(keyChirho) ?? null;
      const attentionKindsChirho = rawHebrewAttentionKindsChirho(spanChirho);
      const preReviewMissingAttentionKindsChirho = rawHebrewPreReviewMissingAttentionKindsChirho(
        spanChirho,
        preReviewNoteChirho
      );
      const currentScriptChirho = spanChirho.scriptChirho ?? spanGeometryChirho.scriptChirho;
      const candidateWordsChirho = candidateWordsForSpanChirho(
        spanChirho,
        spanGeometryChirho.xMinPxChirho,
        spanGeometryChirho.widthPxChirho
      );
      const hintSummaryChirho = scriptHintSummaryChirho(candidateWordsChirho);
      const lineImagePathChirho = scanlineImagePathChirho(spanChirho);
      const lineImageHashChirho = fileSha256Chirho(lineImagePathChirho);
      const lineImageSizeChirho = lineImageHashChirho !== null
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
        keyChirho,
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
        lineImageHashChirho,
        lineImageWidthPxChirho: lineImageSizeChirho.widthChirho,
        lineImageHeightPxChirho: lineImageSizeChirho.heightChirho,
        lineSegmentsChirho: lineSegmentsForProposalChirho(lineChirho),
        lineTextOrderChirho: lineChirho.lineTextOrderChirho,
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
        attentionKindsChirho,
        attentionReasonsChirho: rawHebrewAttentionReasonsChirho(spanChirho),
        preReviewNoteChirho,
        preReviewMissingAttentionKindsChirho,
        preReviewMissingAttentionLabelsChirho: preReviewMissingAttentionKindsChirho.map(rawHebrewAttentionKindLabelChirho),
        attributionTextStateChirho: "not-attribution-chirho",
        priorityChirho: queuePriorityChirho(spanChirho),
      };
    })
    .sort(compareQueueItemsChirho);
}

function compareQueueItemsChirho(aChirho: QueueItemChirho, bChirho: QueueItemChirho): number {
  return aChirho.priorityChirho - bChirho.priorityChirho ||
    aChirho.volumeChirho - bChirho.volumeChirho ||
    aChirho.pageChirho - bChirho.pageChirho ||
    aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
    aChirho.segmentIndexChirho - bChirho.segmentIndexChirho;
}

function assertQueueItemStillLiveChirho(itemChirho: QueueItemChirho): void {
  if (itemChirho.lineImageHashChirho === null) {
    throw new Error(`Raw Hebrew review queue is stale: line image was missing at startup for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  const liveLineImageHashChirho = fileSha256Chirho(itemChirho.lineImagePathChirho);
  if (liveLineImageHashChirho === null) {
    throw new Error(`Raw Hebrew review queue is stale: line image missing for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  if (liveLineImageHashChirho !== itemChirho.lineImageHashChirho) {
    throw new Error(`Raw Hebrew review queue is stale: line image changed for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  const lineChirho = JSON.parse(readFileSync(lineFilePathChirho(itemChirho), "utf8")) as SpanLineFileChirho;
  const spanChirho = lineChirho.spansChirho.find(
    (candidateChirho) => candidateChirho.segmentIndexChirho === itemChirho.segmentIndexChirho
  );
  if (spanChirho === undefined) {
    throw new Error(`Raw Hebrew review queue is stale: live segment missing for ${itemChirho.keyChirho}`);
  }
  if (
    lineChirho.lineWidthPxChirho !== itemChirho.lineWidthPxChirho ||
    lineChirho.lineHeightPxChirho !== itemChirho.lineHeightPxChirho
  ) {
    throw new Error(`Raw Hebrew review queue is stale: live line geometry changed for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  if (
    spanChirho.xMinPxChirho !== itemChirho.spanXMinPxChirho ||
    spanChirho.widthPxChirho !== itemChirho.spanWidthPxChirho
  ) {
    throw new Error(`Raw Hebrew review queue is stale: live span geometry changed for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  const liveTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
  if (liveTextChirho !== itemChirho.liveSpanTextChirho) {
    throw new Error(`Raw Hebrew review queue is stale: live text changed for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  if (spanChirho.scriptChirho !== itemChirho.currentScriptChirho) {
    throw new Error(`Raw Hebrew review queue is stale: live script changed for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  const liveLineTextChirho = lineTextFromSpanLineChirho(lineChirho);
  if (liveLineTextChirho !== itemChirho.lineTextChirho) {
    throw new Error(`Raw Hebrew review queue is stale: live line text changed for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
  const liveHashChirho = hashTextChirho(liveTextChirho);
  if (liveHashChirho !== itemChirho.originalTextHashChirho) {
    throw new Error(`Raw Hebrew review queue is stale: live text hash changed for ${itemChirho.keyChirho}; restart/regenerate review state`);
  }
}

function rawDisplayMismatchChirho(
  requestChirho: RawReviewDisplayGuardChirho,
  itemChirho: QueueItemChirho
): string | null {
  const stringComparisonsChirho = [
    ["expectedLiveSpanTextChirho", itemChirho.liveSpanTextChirho],
    ["expectedReportTextChirho", itemChirho.textChirho],
    ["expectedLineTextChirho", itemChirho.lineTextChirho],
    ["expectedValidationStatusChirho", itemChirho.validationStatusChirho],
    ["expectedCurrentScriptChirho", itemChirho.currentScriptChirho],
    ["expectedOriginalTextHashChirho", itemChirho.originalTextHashChirho],
  ] as const;
  for (const [fieldChirho, currentValueChirho] of stringComparisonsChirho) {
    const submittedValueChirho = requestChirho[fieldChirho];
    if (typeof submittedValueChirho !== "string") return `${fieldChirho} is missing`;
    if (submittedValueChirho !== currentValueChirho) return `${fieldChirho} no longer matches current queue item`;
  }
  const numberComparisonsChirho = [
    ["expectedSpanXMinPxChirho", itemChirho.spanXMinPxChirho],
    ["expectedSpanWidthPxChirho", itemChirho.spanWidthPxChirho],
    ["expectedLineWidthPxChirho", itemChirho.lineWidthPxChirho],
    ["expectedLineHeightPxChirho", itemChirho.lineHeightPxChirho],
    ["expectedLineImageWidthPxChirho", itemChirho.lineImageWidthPxChirho],
    ["expectedLineImageHeightPxChirho", itemChirho.lineImageHeightPxChirho],
  ] as const;
  for (const [fieldChirho, currentValueChirho] of numberComparisonsChirho) {
    const submittedValueChirho = requestChirho[fieldChirho];
    if (typeof submittedValueChirho !== "number") return `${fieldChirho} is missing`;
    if (submittedValueChirho !== currentValueChirho) return `${fieldChirho} no longer matches current queue item`;
  }
  if (typeof requestChirho.expectedLineImageHashChirho !== "string") return "expectedLineImageHashChirho is missing";
  if (requestChirho.expectedLineImageHashChirho !== itemChirho.lineImageHashChirho) {
    return "expectedLineImageHashChirho no longer matches current queue item";
  }
  return null;
}

function segmentRepairProposalRecordChirho(paramsChirho: {
  itemChirho: QueueItemChirho;
  reviewerChirho: string;
  repairKindChirho: unknown;
  proposedSpansChirho: unknown;
  rationaleChirho: string;
}): SegmentRepairProposalRecordChirho {
  const repairKindChirho = parseSegmentRepairKindChirho(paramsChirho.repairKindChirho);
  const { proposedSpansChirho, lineTextPreviewChirho } = validateSegmentRepairProposalSpansChirho(
    paramsChirho.proposedSpansChirho,
    paramsChirho.itemChirho.lineWidthPxChirho,
    paramsChirho.itemChirho.lineTextOrderChirho
  );
  const createdAtChirho = new Date().toISOString();
  const proposalHashChirho = createHashChirho("sha256")
    .update([
      paramsChirho.itemChirho.keyChirho,
      createdAtChirho,
      repairKindChirho,
      paramsChirho.rationaleChirho,
      lineTextPreviewChirho,
    ].join("\0"))
    .digest("hex")
    .slice(0, 16);
  return {
    schemaVersionChirho: SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
    proposalIdChirho: `segment-repair-${createdAtChirho.replace(/[:.]/g, "-")}-${proposalHashChirho}-chirho`,
    statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO,
    repairKindChirho,
    reviewerChirho: paramsChirho.reviewerChirho,
    rationaleChirho: paramsChirho.rationaleChirho,
    createdAtChirho,
    itemKeyChirho: paramsChirho.itemChirho.keyChirho,
    volumeChirho: paramsChirho.itemChirho.volumeChirho,
    pageChirho: paramsChirho.itemChirho.pageChirho,
    lineIndexChirho: paramsChirho.itemChirho.lineIndexChirho,
    targetSegmentIndexChirho: paramsChirho.itemChirho.segmentIndexChirho,
    lineWidthPxChirho: paramsChirho.itemChirho.lineWidthPxChirho,
    lineTextBeforeChirho: paramsChirho.itemChirho.lineTextChirho,
    lineTextPreviewChirho,
    lineImageHashChirho: paramsChirho.itemChirho.lineImageHashChirho ?? "missing-line-image-hash-chirho",
    oldSpansChirho: paramsChirho.itemChirho.lineSegmentsChirho,
    proposedSpansChirho,
    notesChirho: "Draft browser segment repair proposal only; live span files and certification rows are unchanged.",
  };
}

function latestValidationMismatchChirho(
  requestChirho: RawReviewUndoRequestChirho,
  latestChirho: {
    id_chirho: number;
    volume_chirho: number;
    page_chirho: number;
    line_index_chirho: number;
    segment_index_chirho: number;
    reviewer_chirho: string;
    updated_at_chirho: string;
  }
): string | null {
  if (typeof requestChirho.expectedLatestValidationIdChirho !== "number") {
    return "expectedLatestValidationIdChirho is missing";
  }
  if (requestChirho.expectedLatestValidationIdChirho !== latestChirho.id_chirho) {
    return "expectedLatestValidationIdChirho no longer matches latest validation";
  }
  const keyChirho = spanKeyChirho({
    volumeChirho: latestChirho.volume_chirho,
    pageChirho: latestChirho.page_chirho,
    lineIndexChirho: latestChirho.line_index_chirho,
    segmentIndexChirho: latestChirho.segment_index_chirho,
  });
  const stringComparisonsChirho = [
    ["expectedLatestValidationKeyChirho", keyChirho],
    ["expectedLatestValidationReviewerChirho", latestChirho.reviewer_chirho],
    ["expectedLatestValidationUpdatedAtChirho", latestChirho.updated_at_chirho],
  ] as const;
  for (const [fieldChirho, currentValueChirho] of stringComparisonsChirho) {
    const submittedValueChirho = requestChirho[fieldChirho];
    if (typeof submittedValueChirho !== "string") return `${fieldChirho} is missing`;
    if (submittedValueChirho !== currentValueChirho) return `${fieldChirho} no longer matches latest validation`;
  }
  return null;
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
const segmentRepairProposalsPathChirho =
  parseArgValueChirho(argsChirho, "segment-repair-proposals-chirho") ?? DEFAULT_SEGMENT_REPAIR_PROPOSALS_PATH_CHIRHO;
const reviewerChirho = parseArgValueChirho(argsChirho, "reviewer")?.trim() ?? "";
const dbChirho = new Database(dbPathChirho);

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
  certify_clean_chirho      INTEGER NOT NULL DEFAULT 0,
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
addColumnIfMissingChirho(
  "pass_c_human_validations_chirho",
  "certify_clean_chirho",
  "certify_clean_chirho INTEGER NOT NULL DEFAULT 0"
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
   original_text_chirho, original_text_hash_chirho, line_text_chirho, verdict_chirho, certify_clean_chirho,
   corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho, witness_snapshot_chirho,
   queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
   supersedes_id_chirho, is_current_chirho, schema_version_chirho)
VALUES
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 2)`);

const validationRowsStmtChirho = dbChirho.prepare(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
       original_text_chirho, original_text_hash_chirho, line_text_chirho,
       verdict_chirho, certify_clean_chirho, corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho,
       witness_snapshot_chirho, queue_generated_at_chirho, reviewer_chirho,
       created_at_chirho, updated_at_chirho, supersedes_id_chirho, is_current_chirho,
       applied_at_chirho, applied_to_file_chirho, schema_version_chirho
  FROM pass_c_human_validations_chirho
 WHERE is_current_chirho = 1 AND verdict_chirho <> 'undo-chirho' AND schema_version_chirho >= 2
 ORDER BY updated_at_chirho DESC, id_chirho DESC`);

const validationByIdStmtChirho = dbChirho.prepare(`
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
       original_text_chirho, original_text_hash_chirho, line_text_chirho,
       verdict_chirho, certify_clean_chirho, corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho,
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
SELECT id_chirho, volume_chirho, page_chirho, line_index_chirho, segment_index_chirho, reviewer_chirho, updated_at_chirho
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

function validationRowCountsAsSavedChirho(rowChirho: HumanValidationRowChirho): boolean {
  if (rowChirho.verdict_chirho === "reviewed-clean-chirho") return rowChirho.certify_clean_chirho === 1;
  return rowChirho.verdict_chirho === "reviewed-issues-chirho";
}

function validationRowCountsAsAttributionBlockedChirho(rowChirho: HumanValidationRowChirho): boolean {
  return validationRowCountsAsSavedChirho(rowChirho) &&
    certifyingReviewerAttributionErrorChirho(rowChirho.reviewer_chirho) !== null;
}

function currentValidationRowForItemChirho(itemChirho: QueueItemChirho): HumanValidationRowChirho | null {
  const currentChirho = currentValidationStmtChirho.get(
    itemChirho.volumeChirho,
    itemChirho.pageChirho,
    itemChirho.lineIndexChirho,
    itemChirho.segmentIndexChirho
  ) as { id_chirho: number } | null | undefined;
  if (currentChirho === null || currentChirho === undefined) return null;
  const rowChirho = validationByIdStmtChirho.get(currentChirho.id_chirho) as
    | Omit<HumanValidationRowChirho, "key_chirho">
    | null
    | undefined;
  return rowChirho === null || rowChirho === undefined ? null : rowWithKeyChirho(rowChirho);
}

function attributionTextStateForQueueItemChirho(itemChirho: QueueItemChirho): string {
  const rowChirho = currentValidationRowForItemChirho(itemChirho);
  if (rowChirho === null || !validationRowCountsAsAttributionBlockedChirho(rowChirho)) return "not-attribution-chirho";
  if (rowChirho.original_text_hash_chirho !== itemChirho.originalTextHashChirho) return "changed-chirho";
  if (rowChirho.original_text_chirho !== itemChirho.liveSpanTextChirho) return "changed-chirho";
  return "unchanged-chirho";
}

function attributionBlockedReportSpanFromRowChirho(rowChirho: HumanValidationRowChirho): ReportSpanChirho | null {
  if (!validationRowCountsAsAttributionBlockedChirho(rowChirho)) return null;
  const spanStubChirho = {
    volumeChirho: rowChirho.volume_chirho,
    pageChirho: rowChirho.page_chirho,
    lineIndexChirho: rowChirho.line_index_chirho,
    segmentIndexChirho: rowChirho.segment_index_chirho,
  };
  const lineChirho = JSON.parse(readFileSync(lineFilePathChirho(spanStubChirho), "utf8")) as SpanLineFileChirho;
  const spanChirho = lineChirho.spansChirho.find(
    (candidateChirho) => candidateChirho.segmentIndexChirho === rowChirho.segment_index_chirho
  );
  if (spanChirho === undefined) return null;
  const liveTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
  return {
    ...spanStubChirho,
    scriptChirho: spanChirho.scriptChirho,
    textChirho: liveTextChirho,
    lineTextChirho: lineTextFromSpanLineChirho(lineChirho),
    tokenSkeletonsChirho: spanChirho.scriptChirho === "hebrew-chirho"
      ? [hebrewSkeletonChirho(liveTextChirho)].filter((skeletonChirho) => skeletonChirho.length > 0)
      : [],
    tokenValidationsChirho: [],
    directWordReadsChirho: [],
    validationStatusChirho: "attribution-blocked-chirho",
    issueCodeChirho: "attribution-blocked-reviewer-chirho",
    issueMessageChirho: "Saved row has blank/generic/machine reviewer attribution and must be reattributed explicitly before certification.",
  };
}

function loadedQueueWithAttributionBlockedRowsChirho(baseQueueChirho: LoadedQueueChirho): LoadedQueueChirho {
  if (queueModeChirho !== "hebrew-chirho") return baseQueueChirho;
  const existingKeysChirho = new Set(baseQueueChirho.queueChirho.map((itemChirho) => itemChirho.keyChirho));
  const attributionBlockedSpansChirho = validationsChirho()
    .filter((rowChirho) => !existingKeysChirho.has(rowChirho.key_chirho))
    .map(attributionBlockedReportSpanFromRowChirho)
    .filter((spanChirho): spanChirho is ReportSpanChirho => spanChirho !== null);
  if (attributionBlockedSpansChirho.length === 0) return baseQueueChirho;
  return {
    ...baseQueueChirho,
    queueChirho: [
      ...baseQueueChirho.queueChirho,
      ...queueItemsFromReportSpansChirho(attributionBlockedSpansChirho),
    ].sort(compareQueueItemsChirho),
  };
}

const loadedQueueChirho = loadedQueueWithAttributionBlockedRowsChirho(loadQueueForModeChirho(queueModeChirho));
const queueGeneratedAtChirho = loadedQueueChirho.queueGeneratedAtChirho;
const queueTitleChirho = loadedQueueChirho.titleChirho;
const queueChirho = loadedQueueChirho.queueChirho.map((itemChirho) => ({
  ...itemChirho,
  attributionTextStateChirho: attributionTextStateForQueueItemChirho(itemChirho),
}));
const queueByKeyChirho = new Map(queueChirho.map((itemChirho) => [itemChirho.keyChirho, itemChirho]));

// Phase 3 item I: a volunteer sweeps one language at a time. Options come from
// the scripts this queue actually holds, so no dead option is ever offered, and
// every label is plain language - internal suffixes never reach the reviewer.
function scriptFilterLabelChirho(scriptChirho: string): string {
  if (isSegmentRepairScriptChirho(scriptChirho)) return SEGMENT_REPAIR_SCRIPT_LABELS_CHIRHO[scriptChirho];
  const wordsChirho = scriptChirho.replace(/-chirho$/, "").split("-").filter((wordChirho) => wordChirho.length > 0);
  if (wordsChirho.length === 0) return "Unknown script";
  return wordsChirho
    .map((wordChirho, indexChirho) => (indexChirho === 0 ? wordChirho.charAt(0).toUpperCase() + wordChirho.slice(1) : wordChirho))
    .join(" ");
}

const QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO = [
  ...new Set(
    queueChirho
      .map((itemChirho) => itemChirho.currentScriptChirho)
      .filter((scriptChirho): scriptChirho is string => typeof scriptChirho === "string" && scriptChirho.length > 0)
  ),
]
  .sort()
  .map((scriptChirho) => ({ valueChirho: scriptChirho, labelChirho: scriptFilterLabelChirho(scriptChirho) }));

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
    lineImageHashChirho: itemChirho.lineImageHashChirho,
  });
}

function parseIssueFlagsChirho(issueFlagsChirho: unknown): string[] {
  if (!Array.isArray(issueFlagsChirho)) {
    throw new Error("issueFlagsChirho must be an array");
  }
  const cleanFlagsChirho: string[] = [];
  for (const flagChirho of issueFlagsChirho) {
    if (typeof flagChirho !== "string" || !ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho)) {
      throw new Error(`unsupported issue flag: ${String(flagChirho)}`);
    }
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
  supersedesIdChirho: number | null,
  certifyCleanChirho: boolean,
  reviewerChirho: string
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
    certifyCleanChirho ? 1 : 0,
    correctedTextChirho,
    correctedTextChirho ? hebrewSkeletonChirho(correctedTextChirho) : null,
    scriptVerdictChirho,
    JSON.stringify(issueFlagsChirho),
    notesChirho,
    witnessSnapshotChirho(itemChirho),
    queueGeneratedAtChirho,
    reviewerChirho,
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
  return humanReviewPageChirho({
    queueTitleChirho, queueChirho, queueModeChirho, reviewerChirho,
    serverHealthChirho: SERVER_HEALTH_CHIRHO, scriptOptionsChirho: QUEUE_SCRIPT_FILTER_OPTIONS_CHIRHO,
  });
}

function jsonResponseChirho(dataChirho: unknown, statusChirho = 200): Response {
  return new Response(JSON.stringify(dataChirho), {
    status: statusChirho,
    headers: reviewServerNoStoreHeadersChirho("application/json; charset=utf-8"),
  });
}

function staleReviewServerWriteResponseChirho(): Response | null {
  const staleErrorChirho = reviewServerSourceStaleErrorChirho(SERVER_HEALTH_CHIRHO);
  return staleErrorChirho === null ? null : jsonResponseChirho({ okChirho: false, errorChirho: staleErrorChirho }, 409);
}


const serverChirho = Bun.serve({
  port: portChirho,
  hostname: "127.0.0.1",
  async fetch(reqChirho: Request) {
    const urlChirho = new URL(reqChirho.url);
    if (urlChirho.pathname === "/") {
      return new Response(pageHtmlChirho(), { headers: reviewServerNoStoreHeadersChirho("text/html; charset=utf-8") });
    }
    if (urlChirho.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    if (urlChirho.pathname === "/api-chirho/server-health-chirho") {
      return jsonResponseChirho(SERVER_HEALTH_CHIRHO);
    }
    if (urlChirho.pathname === "/quickstart-chirho") {
      if (!existsSync(RAW_HEBREW_HUMAN_CERTIFICATION_QUICKSTART_PATH_CHIRHO)) {
        return new Response("quickstart not found", { status: 404 });
      }
      return new Response(readFileSync(RAW_HEBREW_HUMAN_CERTIFICATION_QUICKSTART_PATH_CHIRHO, "utf8"), {
        headers: reviewServerNoStoreHeadersChirho("text/markdown; charset=utf-8"),
      });
    }
    if (urlChirho.pathname === "/session-guide-chirho") {
      if (!existsSync(HALLELUJAH_REVIEW_SESSION_GUIDE_PATH_CHIRHO)) {
        return new Response("session guide not found", { status: 404 });
      }
      return new Response(readFileSync(HALLELUJAH_REVIEW_SESSION_GUIDE_PATH_CHIRHO, "utf8"), {
        headers: reviewServerNoStoreHeadersChirho("text/markdown; charset=utf-8"),
      });
    }
    if (urlChirho.pathname.startsWith("/line-image-chirho/")) {
      const keyChirho = decodeURIComponent(urlChirho.pathname.slice("/line-image-chirho/".length));
      const itemChirho = queueByKeyChirho.get(keyChirho);
      if (!itemChirho || !existsSync(itemChirho.lineImagePathChirho)) return new Response("not found", { status: 404 });
      return new Response(Bun.file(itemChirho.lineImagePathChirho), {
        headers: reviewServerNoStoreHeadersChirho("image/png"),
      });
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
    if (urlChirho.pathname === "/api-chirho/segment-repair-proposal-chirho" && reqChirho.method === "POST") {
      const staleServerResponseChirho = staleReviewServerWriteResponseChirho();
      if (staleServerResponseChirho !== null) return staleServerResponseChirho;
      const bodyChirho = (await reqChirho.json()) as RawSegmentRepairProposalRequestChirho;
      if (typeof bodyChirho.keyChirho !== "string") {
        return jsonResponseChirho({ okChirho: false, errorChirho: "keyChirho is required" }, 400);
      }
      if (
        bodyChirho.reviewStateChirho !== "pending-chirho" &&
        bodyChirho.reviewStateChirho !== "attribution-rereview-chirho"
      ) {
        return jsonResponseChirho({ okChirho: false, errorChirho: "segment repair proposals require a write-capable review state" }, 400);
      }
      const itemChirho = queueByKeyChirho.get(bodyChirho.keyChirho);
      if (!itemChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown key" }, 404);
      try {
        assertQueueItemStillLiveChirho(itemChirho);
      } catch (errorChirho) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: errorChirho instanceof Error ? errorChirho.message : String(errorChirho),
        }, 409);
      }
      const staleDisplayChirho = rawDisplayMismatchChirho(bodyChirho, itemChirho);
      if (staleDisplayChirho !== null) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: `Raw Hebrew repair proposal item is stale: ${staleDisplayChirho}; reload review state`,
        }, 409);
      }
      const effectiveReviewerChirho = trustedReviewerIdentityChirho(reqChirho.headers, reviewerChirho);
      if (effectiveReviewerChirho.length === 0) {
        return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
      }
      const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(effectiveReviewerChirho);
      if (reviewerErrorChirho !== null) {
        return jsonResponseChirho({ okChirho: false, errorChirho: reviewerErrorChirho }, 400);
      }
      const rationaleChirho = typeof bodyChirho.rationaleChirho === "string" ? bodyChirho.rationaleChirho.trim() : "";
      if (rationaleChirho.length === 0) {
        return jsonResponseChirho({ okChirho: false, errorChirho: "rationaleChirho is required for segment repair proposals" }, 400);
      }
      if (reviewNotesLookPlaceholderChirho(rationaleChirho)) {
        return jsonResponseChirho({ okChirho: false, errorChirho: "rationaleChirho must explain the segment repair proposal" }, 400);
      }
      let proposalChirho: SegmentRepairProposalRecordChirho;
      try {
        proposalChirho = segmentRepairProposalRecordChirho({
          itemChirho,
          reviewerChirho: effectiveReviewerChirho,
          repairKindChirho: bodyChirho.repairKindChirho,
          proposedSpansChirho: bodyChirho.proposedSpansChirho,
          rationaleChirho,
        });
        appendSegmentRepairProposalChirho(segmentRepairProposalsPathChirho, proposalChirho);
      } catch (errorChirho) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: errorChirho instanceof Error ? errorChirho.message : String(errorChirho),
        }, 400);
      }
      return jsonResponseChirho({ okChirho: true, proposalChirho });
    }
    if (urlChirho.pathname === "/api-chirho/submit-chirho" && reqChirho.method === "POST") {
      const staleServerResponseChirho = staleReviewServerWriteResponseChirho();
      if (staleServerResponseChirho !== null) return staleServerResponseChirho;
      const bodyChirho = (await reqChirho.json()) as RawReviewSubmitRequestChirho;
      const itemChirho = queueByKeyChirho.get(bodyChirho.keyChirho);
      if (!itemChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown key" }, 404);
      const supersedeAttributionBlockedChirho = bodyChirho.supersedeAttributionBlockedChirho === true;
      if (itemChirho.validationStatusChirho === "attribution-blocked-chirho") {
        if (!supersedeAttributionBlockedChirho) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: "Attribution-blocked rows are read-only in this server; use the guarded reattribution command or Attribution re-review mode",
          }, 400);
        }
      } else if (supersedeAttributionBlockedChirho) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "supersedeAttributionBlockedChirho is only allowed for attribution-blocked rows",
        }, 400);
      }
      try {
        assertQueueItemStillLiveChirho(itemChirho);
      } catch (errorChirho) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: errorChirho instanceof Error ? errorChirho.message : String(errorChirho),
        }, 409);
      }
      const staleDisplayChirho = rawDisplayMismatchChirho(bodyChirho, itemChirho);
      if (staleDisplayChirho !== null) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: `Raw Hebrew review item is stale: ${staleDisplayChirho}; reload review state`,
        }, 409);
      }
      const currentRowChirho = currentValidationRowForItemChirho(itemChirho);
      if (supersedeAttributionBlockedChirho && currentRowChirho === null) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "Attribution re-review target has no current row; reload review state",
        }, 409);
      }
      if (
        supersedeAttributionBlockedChirho &&
        currentRowChirho !== null &&
        !validationRowCountsAsAttributionBlockedChirho(currentRowChirho)
      ) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "Attribution re-review target is no longer attribution-blocked; reload review state",
        }, 409);
      }
      let issueFlagsChirho: string[];
      try {
        issueFlagsChirho = parseIssueFlagsChirho(bodyChirho.issueFlagsChirho);
      } catch (errorChirho) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: errorChirho instanceof Error ? errorChirho.message : String(errorChirho),
        }, 400);
      }
      if (issueFlagsChirho.length > 0 && bodyChirho.certifyCleanChirho === true) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "certifyCleanChirho cannot be true when issueFlagsChirho are present; save the row as reviewed-issues",
        }, 400);
      }
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
          errorChirho: "Current text drifted; check at least one issue box",
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
      const cleanReviewChirho = issueFlagsChirho.length === 0 && !hasEditedTextChirho;
      if (cleanReviewChirho && bodyChirho.certifyCleanChirho !== true) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "certifyCleanChirho acknowledgement is required for reviewed-clean",
        }, 400);
      }
      const notesChirho = typeof bodyChirho.notesChirho === "string" ? bodyChirho.notesChirho.trim() : "";
      if (issueFlagsChirho.length > 0 && notesChirho.length === 0) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "notesChirho is required for reviewed-issues",
        }, 400);
      }
      if (issueFlagsChirho.length > 0 && reviewNotesLookPlaceholderChirho(notesChirho)) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: "notesChirho must explain the issue, not a template placeholder",
        }, 400);
      }
      const effectiveReviewerChirho = trustedReviewerIdentityChirho(reqChirho.headers, reviewerChirho);
      if (effectiveReviewerChirho.length === 0) {
        return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
      }
      const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(effectiveReviewerChirho);
      if (reviewerErrorChirho !== null) {
        return jsonResponseChirho({ okChirho: false, errorChirho: reviewerErrorChirho }, 400);
      }
      const verdictChirho = cleanReviewChirho
        ? "reviewed-clean-chirho"
        : "reviewed-issues-chirho";
      const correctedTextChirho = hasEditedTextChirho ? editedTextChirho : null;
      const rowChirho = saveDecisionChirho(
        itemChirho,
        verdictChirho,
        correctedTextChirho,
        scriptVerdictChirho,
        issueFlagsChirho,
        notesChirho.length === 0 ? null : notesChirho,
        currentRowChirho?.id_chirho ?? null,
        cleanReviewChirho,
        effectiveReviewerChirho
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
      const staleServerResponseChirho = staleReviewServerWriteResponseChirho();
      if (staleServerResponseChirho !== null) return staleServerResponseChirho;
      const bodyChirho = (await reqChirho.json().catch(() => ({}))) as RawReviewUndoRequestChirho;
      const latestChirho = latestCurrentValidationStmtChirho.get() as
        | {
            id_chirho: number;
            volume_chirho: number;
            page_chirho: number;
            line_index_chirho: number;
            segment_index_chirho: number;
            reviewer_chirho: string;
            updated_at_chirho: string;
          }
        | undefined;
      if (!latestChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "nothing to undo" }, 404);
      const latestMismatchChirho = latestValidationMismatchChirho(bodyChirho, latestChirho);
      if (latestMismatchChirho !== null) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: `Raw Hebrew undo target is stale: ${latestMismatchChirho}; reload review state`,
        }, 409);
      }
      const keyChirho = spanKeyChirho({
        volumeChirho: latestChirho.volume_chirho,
        pageChirho: latestChirho.page_chirho,
        lineIndexChirho: latestChirho.line_index_chirho,
        segmentIndexChirho: latestChirho.segment_index_chirho,
      });
      const itemChirho = queueByKeyChirho.get(keyChirho);
      if (!itemChirho) return jsonResponseChirho({ okChirho: false, errorChirho: "undo target not in queue" }, 404);
      try {
        assertQueueItemStillLiveChirho(itemChirho);
      } catch (errorChirho) {
        return jsonResponseChirho({
          okChirho: false,
          errorChirho: errorChirho instanceof Error ? errorChirho.message : String(errorChirho),
        }, 409);
      }
      const rowChirho = saveDecisionChirho(
        itemChirho,
        "undo-chirho",
        null,
        null,
        [],
        "undo latest validation",
        latestChirho.id_chirho,
        false,
        latestChirho.reviewer_chirho
      );
      writePassCHumanValidationBackupChirho(dbChirho, backupPathChirho);
      return jsonResponseChirho({ okChirho: true, rowChirho });
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`[${MODULE_CHIRHO}] loaded ${queueChirho.length} review span(s)`);
console.log(`[${MODULE_CHIRHO}] http://localhost:${serverChirho.port}/`);
