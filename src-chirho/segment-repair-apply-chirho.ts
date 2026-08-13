// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Apply engine for approved segment repair proposals (reviewer UX v2 Phase 4).
 * Workflow doc: spec-chirho/workflows-chirho/segment-repair-apply-lane-chirho.md
 *
 * An approved proposal rewrites one live span line file. Order of operations
 * is fail-closed:
 *   1. every refusal gate re-checked against live state (stale line-image
 *      hash, stale line text, before-state span mismatch, tiling),
 *   2. backup written FIRST (byte-exact copy of the line file + manifest),
 *   3. validation rows invalidated BEFORE the file changes (a crash between
 *      the two loses certification, never keeps a wrong certification),
 *   4. live span line file rewritten atomically,
 *   5. proposal record marked applied under the store lock.
 *
 * The documented reverse path is revert-segment-repair-chirho.ts, which
 * restores the backed-up bytes under the same discipline.
 *
 * Validation invalidation rule: a current validation row survives the apply
 * iff the span at its segment index is identical (geometry, script, text)
 * before and after. Every other current row of the line is superseded by an
 * appended non-certifying tombstone row, so certification counts can only
 * move through visible review-state transitions.
 */

import type { Database } from "bun:sqlite";
import { createHash as createHashChirho } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { writeJsonAtomicChirho, writeTextAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { certifyingReviewerAttributionErrorChirho } from "./reviewer-attribution-chirho.ts";
import {
  updateSegmentRepairProposalChirho,
  validateSegmentRepairProposalSpansChirho,
  SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_REVERTED_CHIRHO,
  type SegmentRepairProposalRecordChirho,
  type SegmentRepairProposalSpanChirho,
} from "./segment-repair-proposals-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "./span-nfc-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "segment-repair-apply-chirho";

export const DEFAULT_SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
export const DEFAULT_SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
export const DEFAULT_APPLY_BACKUP_ROOT_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "segment-repair-apply-backups-chirho"
);

export const SEGMENT_REPAIR_INVALIDATED_VERDICT_CHIRHO = "invalidated-by-segment-repair-chirho";
export const SEGMENT_REPAIR_REVERT_INVALIDATED_VERDICT_CHIRHO = "invalidated-by-segment-repair-revert-chirho";
export const MISSING_LINE_IMAGE_HASH_SENTINEL_CHIRHO = "missing-line-image-hash-chirho";

const APPLY_MANIFEST_FILE_NAME_CHIRHO = "manifest-chirho.json";
const APPLY_BACKUP_LINE_FILE_NAME_CHIRHO = "line-before-chirho.json";

export interface SegmentRepairApplyManifestChirho {
  schemaVersionChirho: 1;
  proposalIdChirho: string;
  itemKeyChirho: string;
  lineFilePathChirho: string;
  beforeFileSha256Chirho: string;
  afterFileSha256Chirho: string;
  lineImageHashChirho: string;
  appliedAtChirho: string;
  appliedByChirho: string;
  preservedValidationIdsChirho: number[];
  invalidatedValidationIdsChirho: number[];
  reversePathChirho: string;
}

export interface SegmentRepairApplyOutcomeChirho {
  proposalChirho: SegmentRepairProposalRecordChirho;
  backupDirChirho: string;
  manifestChirho: SegmentRepairApplyManifestChirho;
  lineTextAfterChirho: string;
}

export interface SegmentRepairRevertOutcomeChirho {
  proposalChirho: SegmentRepairProposalRecordChirho;
  restoredFileSha256Chirho: string;
  invalidatedValidationIdsChirho: number[];
  preservedValidationIdsChirho: number[];
}

interface SpanLineFileRecordChirho {
  lineWidthPxChirho: number;
  lineHeightPxChirho?: number;
  lineTextOrderChirho?: string;
  spansChirho: Array<Record<string, unknown>>;
  [otherFieldChirho: string]: unknown;
}

interface CurrentValidationRowChirho {
  id_chirho: number;
  segment_index_chirho: number;
  verdict_chirho: string;
}

export function fileSha256OrNullChirho(pathChirho: string): string | null {
  if (!existsSync(pathChirho)) return null;
  return createHashChirho("sha256").update(readFileSync(pathChirho)).digest("hex");
}

export function scanlineImagePathForLineChirho(
  volumeChirho: number,
  pageChirho: number,
  lineIndexChirho: number,
  scanlinesRootChirho = DEFAULT_SCANLINES_ROOT_CHIRHO
): string {
  return join(
    scanlinesRootChirho,
    `vol-${volumeChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.png`
  );
}

function loadSpanLineFileChirho(pathChirho: string): SpanLineFileRecordChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineFileRecordChirho;
}

function normalizedComparableSpansChirho(
  lineChirho: SpanLineFileRecordChirho
): SegmentRepairProposalSpanChirho[] {
  return [...lineChirho.spansChirho]
    .sort(
      (aChirho, bChirho) => Number(aChirho.segmentIndexChirho ?? 0) - Number(bChirho.segmentIndexChirho ?? 0)
    )
    .map((spanChirho, indexChirho) => ({
      segmentIndexChirho: indexChirho,
      xMinPxChirho: Number(spanChirho.xMinPxChirho),
      widthPxChirho: Number(spanChirho.widthPxChirho),
      scriptChirho: String(spanChirho.scriptChirho) as SegmentRepairProposalSpanChirho["scriptChirho"],
      utf8TextChirho: normalizeTextForStorageChirho(String(spanChirho.utf8TextChirho ?? "")),
    }));
}

function spansEqualChirho(
  aChirho: SegmentRepairProposalSpanChirho,
  bChirho: SegmentRepairProposalSpanChirho
): boolean {
  return (
    aChirho.xMinPxChirho === bChirho.xMinPxChirho &&
    aChirho.widthPxChirho === bChirho.widthPxChirho &&
    aChirho.scriptChirho === bChirho.scriptChirho &&
    aChirho.utf8TextChirho === bChirho.utf8TextChirho
  );
}

export interface SegmentRepairLiveStateChirho {
  refusalChirho: string | null;
  lineFilePathChirho: string;
  scanlineImagePathChirho: string;
  liveLineChirho: SpanLineFileRecordChirho | null;
  liveSpansChirho: SegmentRepairProposalSpanChirho[];
}

/**
 * Re-checks every apply precondition against the live tree. Shared by the
 * approval station UI (readiness display) and the apply path (hard gate), so
 * what the reviewer sees refused is exactly what the engine refuses.
 */
export function segmentRepairLiveStateChirho(
  proposalChirho: SegmentRepairProposalRecordChirho,
  spansRootChirho = DEFAULT_SPANS_ROOT_CHIRHO,
  scanlinesRootChirho = DEFAULT_SCANLINES_ROOT_CHIRHO
): SegmentRepairLiveStateChirho {
  const lineFilePathChirho = spanLinePathChirho(
    proposalChirho.volumeChirho,
    proposalChirho.pageChirho,
    proposalChirho.lineIndexChirho,
    spansRootChirho
  );
  const scanlineImagePathChirho = scanlineImagePathForLineChirho(
    proposalChirho.volumeChirho,
    proposalChirho.pageChirho,
    proposalChirho.lineIndexChirho,
    scanlinesRootChirho
  );
  const stateChirho: SegmentRepairLiveStateChirho = {
    refusalChirho: null,
    lineFilePathChirho,
    scanlineImagePathChirho,
    liveLineChirho: null,
    liveSpansChirho: [],
  };
  if (proposalChirho.lineImageHashChirho === MISSING_LINE_IMAGE_HASH_SENTINEL_CHIRHO) {
    stateChirho.refusalChirho = "proposal was drafted without a line-image hash; re-draft it from a live review session";
    return stateChirho;
  }
  if (!existsSync(lineFilePathChirho)) {
    stateChirho.refusalChirho = `live span line file missing: ${lineFilePathChirho}`;
    return stateChirho;
  }
  const liveImageHashChirho = fileSha256OrNullChirho(scanlineImagePathChirho);
  if (liveImageHashChirho === null) {
    stateChirho.refusalChirho = `scanline image missing: ${scanlineImagePathChirho}`;
    return stateChirho;
  }
  if (liveImageHashChirho !== proposalChirho.lineImageHashChirho) {
    stateChirho.refusalChirho = "stale line-image hash: the scanline image changed since this proposal was drafted";
    return stateChirho;
  }
  const liveLineChirho = loadSpanLineFileChirho(lineFilePathChirho);
  stateChirho.liveLineChirho = liveLineChirho;
  if (liveLineChirho.lineWidthPxChirho !== proposalChirho.lineWidthPxChirho) {
    stateChirho.refusalChirho =
      `stale line geometry: live width ${liveLineChirho.lineWidthPxChirho}px, proposal expects ${proposalChirho.lineWidthPxChirho}px`;
    return stateChirho;
  }
  const liveSpansChirho = normalizedComparableSpansChirho(liveLineChirho);
  stateChirho.liveSpansChirho = liveSpansChirho;
  const liveLineTextChirho = renderSpanLineTextChirho({
    lineTextOrderChirho: liveLineChirho.lineTextOrderChirho,
    spansChirho: liveSpansChirho,
  });
  if (liveLineTextChirho !== proposalChirho.lineTextBeforeChirho) {
    stateChirho.refusalChirho = "stale line text: the live line no longer reads as it did when this proposal was drafted";
    return stateChirho;
  }
  if (liveSpansChirho.length !== proposalChirho.oldSpansChirho.length) {
    stateChirho.refusalChirho =
      `stale before-state: live line has ${liveSpansChirho.length} span(s), proposal recorded ${proposalChirho.oldSpansChirho.length}`;
    return stateChirho;
  }
  for (const [indexChirho, oldSpanChirho] of proposalChirho.oldSpansChirho.entries()) {
    if (!spansEqualChirho(liveSpansChirho[indexChirho]!, oldSpanChirho)) {
      stateChirho.refusalChirho = `stale before-state: live span ${indexChirho} no longer matches the proposal's recorded old span`;
      return stateChirho;
    }
  }
  try {
    validateSegmentRepairProposalSpansChirho(
      proposalChirho.proposedSpansChirho,
      proposalChirho.lineWidthPxChirho,
      liveLineChirho.lineTextOrderChirho
    );
  } catch (errorChirho) {
    stateChirho.refusalChirho = `proposed spans no longer validate: ${
      errorChirho instanceof Error ? errorChirho.message : String(errorChirho)
    }`;
    return stateChirho;
  }
  return stateChirho;
}

/**
 * Mirror of the raw review station's append-only validation DDL so scratch
 * databases used by guard scripts behave like the shared progress DB.
 */
export function ensurePassCHumanValidationsTableChirho(dbChirho: Database): void {
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
  dbChirho.run(`
CREATE TABLE IF NOT EXISTS steps_taken_chirho (
  id_chirho INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_code_chirho TEXT NOT NULL,
  timestamp_start_chirho TEXT NOT NULL,
  timestamp_end_chirho TEXT,
  action_taken_chirho TEXT NOT NULL,
  result_of_action_chirho TEXT NOT NULL DEFAULT '',
  overview_of_result_chirho TEXT NOT NULL DEFAULT ''
)`);
}

function currentLineValidationRowsChirho(
  dbChirho: Database,
  proposalChirho: Pick<SegmentRepairProposalRecordChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho">
): CurrentValidationRowChirho[] {
  return dbChirho
    .query(
      `SELECT id_chirho, segment_index_chirho, verdict_chirho
         FROM pass_c_human_validations_chirho
        WHERE volume_chirho = ? AND page_chirho = ? AND line_index_chirho = ?
          AND is_current_chirho = 1
        ORDER BY segment_index_chirho, id_chirho`
    )
    .all(proposalChirho.volumeChirho, proposalChirho.pageChirho, proposalChirho.lineIndexChirho) as CurrentValidationRowChirho[];
}

/**
 * Supersedes and tombstones every current validation row of the line whose
 * segment is not identical before/after the rewrite. Runs BEFORE the span
 * file changes so an interruption can only under-certify, never over-certify.
 */
function invalidateLineValidationsChirho(paramsChirho: {
  dbChirho: Database;
  proposalChirho: SegmentRepairProposalRecordChirho;
  beforeSpansChirho: SegmentRepairProposalSpanChirho[];
  afterSpansChirho: SegmentRepairProposalSpanChirho[];
  lineTextAfterChirho: string;
  verdictChirho: string;
  reviewerChirho: string;
  nowChirho: string;
  reasonChirho: string;
}): { preservedIdsChirho: number[]; invalidatedIdsChirho: number[] } {
  const preservedIdsChirho: number[] = [];
  const invalidatedIdsChirho: number[] = [];
  const rowsChirho = currentLineValidationRowsChirho(paramsChirho.dbChirho, paramsChirho.proposalChirho);
  const rowsBySegmentChirho = new Map<number, CurrentValidationRowChirho[]>();
  for (const rowChirho of rowsChirho) {
    const segmentRowsChirho = rowsBySegmentChirho.get(rowChirho.segment_index_chirho) ?? [];
    segmentRowsChirho.push(rowChirho);
    rowsBySegmentChirho.set(rowChirho.segment_index_chirho, segmentRowsChirho);
  }
  const supersedeSegmentStmtChirho = paramsChirho.dbChirho.prepare(`
UPDATE pass_c_human_validations_chirho
   SET is_current_chirho = 0
 WHERE volume_chirho = ? AND page_chirho = ? AND line_index_chirho = ? AND segment_index_chirho = ?
   AND is_current_chirho = 1`);
  const tombstoneStmtChirho = paramsChirho.dbChirho.prepare(`
INSERT INTO pass_c_human_validations_chirho
  (volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
   original_text_chirho, original_text_hash_chirho, line_text_chirho, verdict_chirho, certify_clean_chirho,
   corrected_text_chirho, corrected_skeleton_chirho, script_verdict_chirho, issue_flags_chirho, notes_chirho, witness_snapshot_chirho,
   queue_generated_at_chirho, reviewer_chirho, created_at_chirho, updated_at_chirho,
   supersedes_id_chirho, is_current_chirho, schema_version_chirho)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, ?, ?, ?, NULL, ?, ?, ?, ?, 1, 2)`);
  const runAllChirho = paramsChirho.dbChirho.transaction(() => {
    for (const [indexChirho, segmentRowsChirho] of rowsBySegmentChirho) {
      // Only rows that carry review meaning decide anything; existing
      // tombstones and undo markers never certify, so they are not re-tombstoned.
      const meaningfulRowsChirho = segmentRowsChirho.filter(
        (rowChirho) =>
          rowChirho.verdict_chirho !== "undo-chirho" &&
          rowChirho.verdict_chirho !== SEGMENT_REPAIR_INVALIDATED_VERDICT_CHIRHO &&
          rowChirho.verdict_chirho !== SEGMENT_REPAIR_REVERT_INVALIDATED_VERDICT_CHIRHO
      );
      if (meaningfulRowsChirho.length === 0) continue;
      const beforeSpanChirho = paramsChirho.beforeSpansChirho[indexChirho];
      const afterSpanChirho = paramsChirho.afterSpansChirho[indexChirho];
      const survivesChirho =
        beforeSpanChirho !== undefined &&
        afterSpanChirho !== undefined &&
        spansEqualChirho(beforeSpanChirho, afterSpanChirho);
      if (survivesChirho) {
        preservedIdsChirho.push(...meaningfulRowsChirho.map((rowChirho) => rowChirho.id_chirho));
        continue;
      }
      const meaningfulIdsChirho = meaningfulRowsChirho.map((rowChirho) => rowChirho.id_chirho);
      // Same idiom as a fresh human save: every current row of the segment is
      // superseded so exactly one current tombstone remains.
      supersedeSegmentStmtChirho.run(
        paramsChirho.proposalChirho.volumeChirho,
        paramsChirho.proposalChirho.pageChirho,
        paramsChirho.proposalChirho.lineIndexChirho,
        indexChirho
      );
      const beforeTextChirho = beforeSpanChirho?.utf8TextChirho ?? "";
      tombstoneStmtChirho.run(
        paramsChirho.proposalChirho.volumeChirho,
        paramsChirho.proposalChirho.pageChirho,
        paramsChirho.proposalChirho.lineIndexChirho,
        indexChirho,
        beforeTextChirho,
        hashTextChirho(beforeTextChirho),
        paramsChirho.lineTextAfterChirho,
        paramsChirho.verdictChirho,
        JSON.stringify([]),
        `${paramsChirho.reasonChirho} (proposal ${paramsChirho.proposalChirho.proposalIdChirho})`,
        JSON.stringify({
          proposalIdChirho: paramsChirho.proposalChirho.proposalIdChirho,
          invalidatedRowIdsChirho: meaningfulIdsChirho,
          reasonChirho: paramsChirho.reasonChirho,
        }),
        paramsChirho.reviewerChirho,
        paramsChirho.nowChirho,
        paramsChirho.nowChirho,
        meaningfulIdsChirho[meaningfulIdsChirho.length - 1]!
      );
      invalidatedIdsChirho.push(...meaningfulIdsChirho);
    }
  });
  runAllChirho();
  return { preservedIdsChirho, invalidatedIdsChirho };
}

function serializedSpanLineFileChirho(lineChirho: SpanLineFileRecordChirho): string {
  return `${JSON.stringify(lineChirho, null, 2)}\n`;
}

function sha256OfTextChirho(textChirho: string): string {
  return createHashChirho("sha256").update(textChirho).digest("hex");
}

function logEngineStepChirho(
  dbChirho: Database,
  actionChirho: string,
  resultChirho: string,
  overviewChirho: string
): void {
  const nowChirho = new Date().toISOString();
  dbChirho
    .prepare(
      `INSERT INTO steps_taken_chirho
         (agent_code_chirho, timestamp_start_chirho, timestamp_end_chirho,
          action_taken_chirho, result_of_action_chirho, overview_of_result_chirho)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(MODULE_CHIRHO, nowChirho, nowChirho, actionChirho, resultChirho, overviewChirho);
}

/**
 * Builds the rewritten span line file. Spans identical before/after at the
 * same segment index carry over their full old span object (human review
 * metadata included); changed spans start clean with only the proposed
 * geometry, script, and text, so no stale certification metadata survives a
 * geometry change.
 */
function rewrittenSpanLineChirho(
  liveLineChirho: SpanLineFileRecordChirho,
  liveSpansChirho: SegmentRepairProposalSpanChirho[],
  proposedSpansChirho: SegmentRepairProposalSpanChirho[]
): SpanLineFileRecordChirho {
  const oldSpanRecordsByIndexChirho = new Map<number, Record<string, unknown>>();
  for (const spanRecordChirho of liveLineChirho.spansChirho) {
    oldSpanRecordsByIndexChirho.set(Number(spanRecordChirho.segmentIndexChirho), spanRecordChirho);
  }
  const spansChirho = proposedSpansChirho.map((proposedChirho, indexChirho) => {
    const liveSpanChirho = liveSpansChirho[indexChirho];
    if (liveSpanChirho !== undefined && spansEqualChirho(liveSpanChirho, proposedChirho)) {
      const carriedChirho = { ...oldSpanRecordsByIndexChirho.get(indexChirho)! };
      carriedChirho.segmentIndexChirho = indexChirho;
      return carriedChirho;
    }
    return {
      segmentIndexChirho: indexChirho,
      xMinPxChirho: proposedChirho.xMinPxChirho,
      widthPxChirho: proposedChirho.widthPxChirho,
      scriptChirho: proposedChirho.scriptChirho,
      utf8TextChirho: proposedChirho.utf8TextChirho,
    } as Record<string, unknown>;
  });
  const rewrittenChirho: SpanLineFileRecordChirho = { ...liveLineChirho, spansChirho };
  normalizeSpanLineTextFieldsChirho(rewrittenChirho);
  return rewrittenChirho;
}

export function applySegmentRepairProposalChirho(paramsChirho: {
  storePathChirho: string;
  proposalChirho: SegmentRepairProposalRecordChirho;
  applyReviewerChirho: string;
  dbChirho: Database;
  spansRootChirho?: string;
  scanlinesRootChirho?: string;
  backupRootChirho?: string;
}): SegmentRepairApplyOutcomeChirho {
  const spansRootChirho = paramsChirho.spansRootChirho ?? DEFAULT_SPANS_ROOT_CHIRHO;
  const scanlinesRootChirho = paramsChirho.scanlinesRootChirho ?? DEFAULT_SCANLINES_ROOT_CHIRHO;
  const backupRootChirho = paramsChirho.backupRootChirho ?? DEFAULT_APPLY_BACKUP_ROOT_CHIRHO;
  const proposalChirho = paramsChirho.proposalChirho;
  if (proposalChirho.statusChirho !== SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO) {
    throw new Error(`only approved proposals can be applied; ${proposalChirho.proposalIdChirho} is ${proposalChirho.statusChirho}`);
  }
  const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(paramsChirho.applyReviewerChirho);
  if (reviewerErrorChirho !== null) throw new Error(reviewerErrorChirho);
  ensurePassCHumanValidationsTableChirho(paramsChirho.dbChirho);

  const liveStateChirho = segmentRepairLiveStateChirho(proposalChirho, spansRootChirho, scanlinesRootChirho);
  if (liveStateChirho.refusalChirho !== null) {
    throw new Error(`apply refused: ${liveStateChirho.refusalChirho}`);
  }
  const liveLineChirho = liveStateChirho.liveLineChirho!;
  const nowChirho = new Date().toISOString();

  const rewrittenLineChirho = rewrittenSpanLineChirho(
    liveLineChirho,
    liveStateChirho.liveSpansChirho,
    proposalChirho.proposedSpansChirho
  );
  const beforeBytesChirho = readFileSync(liveStateChirho.lineFilePathChirho, "utf8");
  const afterBytesChirho = serializedSpanLineFileChirho(rewrittenLineChirho);
  const lineTextAfterChirho = renderSpanLineTextChirho({
    lineTextOrderChirho: rewrittenLineChirho.lineTextOrderChirho,
    spansChirho: proposalChirho.proposedSpansChirho,
  });

  // Backup FIRST: byte-exact before-copy plus the manifest the reverse path reads.
  const backupDirChirho = join(backupRootChirho, proposalChirho.proposalIdChirho);
  writeTextAtomicChirho(join(backupDirChirho, APPLY_BACKUP_LINE_FILE_NAME_CHIRHO), beforeBytesChirho);

  // Invalidate BEFORE the file write: interruption between the two steps can
  // only leave the line under-certified against unchanged data.
  const invalidationChirho = invalidateLineValidationsChirho({
    dbChirho: paramsChirho.dbChirho,
    proposalChirho,
    beforeSpansChirho: liveStateChirho.liveSpansChirho,
    afterSpansChirho: proposalChirho.proposedSpansChirho,
    lineTextAfterChirho,
    verdictChirho: SEGMENT_REPAIR_INVALIDATED_VERDICT_CHIRHO,
    reviewerChirho: paramsChirho.applyReviewerChirho,
    nowChirho,
    reasonChirho: "segment geometry/text rewritten by approved segment repair",
  });

  const manifestChirho: SegmentRepairApplyManifestChirho = {
    schemaVersionChirho: 1,
    proposalIdChirho: proposalChirho.proposalIdChirho,
    itemKeyChirho: proposalChirho.itemKeyChirho,
    lineFilePathChirho: liveStateChirho.lineFilePathChirho,
    beforeFileSha256Chirho: sha256OfTextChirho(beforeBytesChirho),
    afterFileSha256Chirho: sha256OfTextChirho(afterBytesChirho),
    lineImageHashChirho: proposalChirho.lineImageHashChirho,
    appliedAtChirho: nowChirho,
    appliedByChirho: paramsChirho.applyReviewerChirho,
    preservedValidationIdsChirho: invalidationChirho.preservedIdsChirho,
    invalidatedValidationIdsChirho: invalidationChirho.invalidatedIdsChirho,
    reversePathChirho:
      `bun run revert-segment-repair-chirho -- --proposal-id-chirho=${proposalChirho.proposalIdChirho} ` +
      `--expected-after-sha256-chirho=${sha256OfTextChirho(afterBytesChirho)} --apply`,
  };
  writeJsonAtomicChirho(join(backupDirChirho, APPLY_MANIFEST_FILE_NAME_CHIRHO), manifestChirho);

  writeTextAtomicChirho(liveStateChirho.lineFilePathChirho, afterBytesChirho);

  const updatedProposalChirho = updateSegmentRepairProposalChirho(
    paramsChirho.storePathChirho,
    proposalChirho.proposalIdChirho,
    `apply-${proposalChirho.proposalIdChirho}`,
    (currentChirho) => ({
      ...currentChirho,
      statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO,
      appliedAtChirho: nowChirho,
      appliedByChirho: paramsChirho.applyReviewerChirho,
      applyBackupDirChirho: backupDirChirho,
      appliedLineFileSha256Chirho: manifestChirho.afterFileSha256Chirho,
    })
  );
  logEngineStepChirho(
    paramsChirho.dbChirho,
    `Apply segment repair ${proposalChirho.proposalIdChirho} to ${proposalChirho.itemKeyChirho}`,
    `rewrote ${liveStateChirho.lineFilePathChirho}; invalidated validation rows [${invalidationChirho.invalidatedIdsChirho.join(",")}]; preserved [${invalidationChirho.preservedIdsChirho.join(",")}]; backup ${backupDirChirho}`,
    `approved segment repair applied by ${paramsChirho.applyReviewerChirho} with backup-first + validation invalidation`
  );
  return {
    proposalChirho: updatedProposalChirho,
    backupDirChirho,
    manifestChirho,
    lineTextAfterChirho,
  };
}

export function loadSegmentRepairApplyManifestChirho(backupDirChirho: string): SegmentRepairApplyManifestChirho {
  const manifestPathChirho = join(backupDirChirho, APPLY_MANIFEST_FILE_NAME_CHIRHO);
  if (!existsSync(manifestPathChirho)) {
    throw new Error(`apply manifest missing: ${manifestPathChirho}`);
  }
  const parsedChirho = JSON.parse(readFileSync(manifestPathChirho, "utf8")) as Partial<SegmentRepairApplyManifestChirho>;
  if (parsedChirho.schemaVersionChirho !== 1 || typeof parsedChirho.proposalIdChirho !== "string") {
    throw new Error(`${manifestPathChirho} is not a segment repair apply manifest`);
  }
  return parsedChirho as SegmentRepairApplyManifestChirho;
}

export function revertSegmentRepairApplicationChirho(paramsChirho: {
  storePathChirho: string;
  proposalChirho: SegmentRepairProposalRecordChirho;
  revertReviewerChirho: string;
  revertRationaleChirho: string;
  dbChirho: Database;
  expectedAfterSha256Chirho: string;
}): SegmentRepairRevertOutcomeChirho {
  const proposalChirho = paramsChirho.proposalChirho;
  if (proposalChirho.statusChirho !== SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO) {
    throw new Error(`only applied proposals can be reverted; ${proposalChirho.proposalIdChirho} is ${proposalChirho.statusChirho}`);
  }
  const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(paramsChirho.revertReviewerChirho);
  if (reviewerErrorChirho !== null) throw new Error(reviewerErrorChirho);
  if (paramsChirho.revertRationaleChirho.trim().length === 0) {
    throw new Error("revert rationale is required");
  }
  if (proposalChirho.applyBackupDirChirho === undefined) {
    throw new Error(`applied proposal has no recorded backup dir: ${proposalChirho.proposalIdChirho}`);
  }
  ensurePassCHumanValidationsTableChirho(paramsChirho.dbChirho);
  const manifestChirho = loadSegmentRepairApplyManifestChirho(proposalChirho.applyBackupDirChirho);
  if (manifestChirho.afterFileSha256Chirho !== paramsChirho.expectedAfterSha256Chirho) {
    throw new Error(
      "revert refused: --expected-after-sha256-chirho does not match the apply manifest; read the manifest before reverting"
    );
  }
  const currentBytesChirho = existsSync(manifestChirho.lineFilePathChirho)
    ? readFileSync(manifestChirho.lineFilePathChirho, "utf8")
    : null;
  if (currentBytesChirho === null) {
    throw new Error(`revert refused: live span line file missing: ${manifestChirho.lineFilePathChirho}`);
  }
  if (sha256OfTextChirho(currentBytesChirho) !== manifestChirho.afterFileSha256Chirho) {
    throw new Error(
      "revert refused: the live span line file changed after this apply; resolve the newer state before reverting"
    );
  }
  const backupBytesChirho = readFileSync(
    join(proposalChirho.applyBackupDirChirho, APPLY_BACKUP_LINE_FILE_NAME_CHIRHO),
    "utf8"
  );
  if (sha256OfTextChirho(backupBytesChirho) !== manifestChirho.beforeFileSha256Chirho) {
    throw new Error("revert refused: backup bytes do not match the manifest's before-hash; backup may be damaged");
  }
  const nowChirho = new Date().toISOString();
  const restoredLineChirho = JSON.parse(backupBytesChirho) as SpanLineFileRecordChirho;
  const restoredSpansChirho = normalizedComparableSpansChirho(restoredLineChirho);
  const lineTextRestoredChirho = renderSpanLineTextChirho({
    lineTextOrderChirho: restoredLineChirho.lineTextOrderChirho,
    spansChirho: restoredSpansChirho,
  });
  // Same fail-closed order as apply: revert is itself a geometry change, so
  // rows certifying the applied state are tombstoned before the restore.
  const invalidationChirho = invalidateLineValidationsChirho({
    dbChirho: paramsChirho.dbChirho,
    proposalChirho,
    beforeSpansChirho: proposalChirho.proposedSpansChirho,
    afterSpansChirho: restoredSpansChirho,
    lineTextAfterChirho: lineTextRestoredChirho,
    verdictChirho: SEGMENT_REPAIR_REVERT_INVALIDATED_VERDICT_CHIRHO,
    reviewerChirho: paramsChirho.revertReviewerChirho,
    nowChirho,
    reasonChirho: "segment repair application reverted from backup",
  });
  writeTextAtomicChirho(manifestChirho.lineFilePathChirho, backupBytesChirho);
  const updatedProposalChirho = updateSegmentRepairProposalChirho(
    paramsChirho.storePathChirho,
    proposalChirho.proposalIdChirho,
    `revert-${proposalChirho.proposalIdChirho}`,
    (currentChirho) => ({
      ...currentChirho,
      statusChirho: SEGMENT_REPAIR_PROPOSAL_STATUS_REVERTED_CHIRHO,
      revertedAtChirho: nowChirho,
      revertedByChirho: paramsChirho.revertReviewerChirho,
      revertRationaleChirho: paramsChirho.revertRationaleChirho,
    })
  );
  logEngineStepChirho(
    paramsChirho.dbChirho,
    `Revert segment repair ${proposalChirho.proposalIdChirho} on ${proposalChirho.itemKeyChirho}`,
    `restored ${manifestChirho.lineFilePathChirho} from ${proposalChirho.applyBackupDirChirho}; invalidated validation rows [${invalidationChirho.invalidatedIdsChirho.join(",")}]`,
    `applied segment repair reverted by ${paramsChirho.revertReviewerChirho}: ${paramsChirho.revertRationaleChirho}`
  );
  return {
    proposalChirho: updatedProposalChirho,
    restoredFileSha256Chirho: manifestChirho.beforeFileSha256Chirho,
    invalidatedValidationIdsChirho: invalidationChirho.invalidatedIdsChirho,
    preservedValidationIdsChirho: invalidationChirho.preservedIdsChirho,
  };
}
