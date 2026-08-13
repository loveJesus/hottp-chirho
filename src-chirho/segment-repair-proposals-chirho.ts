// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

import { existsSync, readFileSync } from "fs";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { withSegmentRepairStoreLockChirho } from "./segment-repair-store-lock-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";
import { normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

export const SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO = 1;
export const SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO = "draft-chirho";
export const SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO = "approved-chirho";
export const SEGMENT_REPAIR_PROPOSAL_STATUS_REJECTED_CHIRHO = "rejected-chirho";
export const SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO = "applied-chirho";
export const SEGMENT_REPAIR_PROPOSAL_STATUS_REVERTED_CHIRHO = "reverted-chirho";

export const SEGMENT_REPAIR_PROPOSAL_STATUS_VALUES_CHIRHO = [
  SEGMENT_REPAIR_PROPOSAL_STATUS_DRAFT_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_REJECTED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO,
  SEGMENT_REPAIR_PROPOSAL_STATUS_REVERTED_CHIRHO,
] as const;

export type SegmentRepairProposalStatusChirho = (typeof SEGMENT_REPAIR_PROPOSAL_STATUS_VALUES_CHIRHO)[number];

// One-way lifecycle: a draft is decided (approved/rejected) by a human, an
// approved proposal may be applied to the live span files, and an applied
// proposal may only move to reverted through the documented reverse path.
const SEGMENT_REPAIR_STATUS_TRANSITIONS_CHIRHO: Record<SegmentRepairProposalStatusChirho, SegmentRepairProposalStatusChirho[]> = {
  "draft-chirho": [SEGMENT_REPAIR_PROPOSAL_STATUS_APPROVED_CHIRHO, SEGMENT_REPAIR_PROPOSAL_STATUS_REJECTED_CHIRHO],
  "approved-chirho": [SEGMENT_REPAIR_PROPOSAL_STATUS_APPLIED_CHIRHO],
  "rejected-chirho": [],
  "applied-chirho": [SEGMENT_REPAIR_PROPOSAL_STATUS_REVERTED_CHIRHO],
  "reverted-chirho": [],
};

export const SEGMENT_REPAIR_KIND_VALUES_CHIRHO = [
  "split-chirho",
  "merge-chirho",
  "rebox-chirho",
  "script-text-chirho",
  "punctuation-attachment-chirho",
  "unreadable-script-chirho",
] as const;

export const SEGMENT_REPAIR_SCRIPT_VALUES_CHIRHO = [
  "french-chirho",
  "latin-non-french-chirho",
  "hebrew-chirho",
  "greek-chirho",
  "syriac-chirho",
  "arabic-chirho",
  "symbol-chirho",
  "unknown-script-chirho",
] as const;

export type SegmentRepairKindChirho = (typeof SEGMENT_REPAIR_KIND_VALUES_CHIRHO)[number];
export type SegmentRepairScriptChirho = (typeof SEGMENT_REPAIR_SCRIPT_VALUES_CHIRHO)[number];

// Reviewer-facing dropdown labels. Stored values above stay the wire format;
// only these plain-language labels reach human eyes (no -chirho suffix noise).
export const SEGMENT_REPAIR_KIND_LABELS_CHIRHO: Record<SegmentRepairKindChirho, string> = {
  "split-chirho": "Split box (one box covers two things)",
  "merge-chirho": "Merge boxes (one thing split across boxes)",
  "rebox-chirho": "Move/resize box (box is on the wrong spot)",
  "script-text-chirho": "Wrong script or wrong text",
  "punctuation-attachment-chirho": "Punctuation attached to the wrong word",
  "unreadable-script-chirho": "Unreadable script",
};

export const SEGMENT_REPAIR_SCRIPT_LABELS_CHIRHO: Record<SegmentRepairScriptChirho, string> = {
  "french-chirho": "French",
  "latin-non-french-chirho": "Latin (non-French)",
  "hebrew-chirho": "Hebrew",
  "greek-chirho": "Greek",
  "syriac-chirho": "Syriac",
  "arabic-chirho": "Arabic",
  "symbol-chirho": "Symbol",
  "unknown-script-chirho": "Unknown script",
};

export interface SegmentRepairProposalSpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: SegmentRepairScriptChirho;
  utf8TextChirho: string;
}

export interface SegmentRepairProposalRecordChirho {
  schemaVersionChirho: typeof SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO;
  proposalIdChirho: string;
  statusChirho: SegmentRepairProposalStatusChirho;
  repairKindChirho: SegmentRepairKindChirho;
  reviewerChirho: string;
  rationaleChirho: string;
  createdAtChirho: string;
  itemKeyChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  targetSegmentIndexChirho: number;
  lineWidthPxChirho: number;
  lineTextBeforeChirho: string;
  lineTextPreviewChirho: string;
  lineImageHashChirho: string;
  oldSpansChirho: SegmentRepairProposalSpanChirho[];
  proposedSpansChirho: SegmentRepairProposalSpanChirho[];
  notesChirho: string;
  decidedAtChirho?: string;
  decidedByChirho?: string;
  decisionRationaleChirho?: string;
  appliedAtChirho?: string;
  appliedByChirho?: string;
  applyBackupDirChirho?: string;
  appliedLineFileSha256Chirho?: string;
  revertedAtChirho?: string;
  revertedByChirho?: string;
  revertRationaleChirho?: string;
}

export interface SegmentRepairProposalStoreChirho {
  schemaVersionChirho: typeof SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO;
  proposalsChirho: SegmentRepairProposalRecordChirho[];
}

const SEGMENT_REPAIR_KIND_SET_CHIRHO = new Set<string>(SEGMENT_REPAIR_KIND_VALUES_CHIRHO);
const SEGMENT_REPAIR_SCRIPT_SET_CHIRHO = new Set<string>(SEGMENT_REPAIR_SCRIPT_VALUES_CHIRHO);

export function isSegmentRepairScriptChirho(valueChirho: string): valueChirho is SegmentRepairScriptChirho {
  return SEGMENT_REPAIR_SCRIPT_SET_CHIRHO.has(valueChirho);
}

function recordChirho(valueChirho: unknown, labelChirho: string): Record<string, unknown> {
  if (valueChirho === null || typeof valueChirho !== "object" || Array.isArray(valueChirho)) {
    throw new Error(`${labelChirho} must be an object`);
  }
  return valueChirho as Record<string, unknown>;
}

function finiteIntegerChirho(valueChirho: unknown, labelChirho: string): number {
  if (!Number.isInteger(valueChirho)) throw new Error(`${labelChirho} must be an integer`);
  return valueChirho as number;
}

function stringChirho(valueChirho: unknown, labelChirho: string): string {
  if (typeof valueChirho !== "string") throw new Error(`${labelChirho} must be a string`);
  return valueChirho;
}

export function parseSegmentRepairKindChirho(valueChirho: unknown): SegmentRepairKindChirho {
  const kindChirho = stringChirho(valueChirho, "repairKindChirho");
  if (!SEGMENT_REPAIR_KIND_SET_CHIRHO.has(kindChirho)) {
    throw new Error(`unsupported repairKindChirho: ${kindChirho}`);
  }
  return kindChirho as SegmentRepairKindChirho;
}

export function validateSegmentRepairProposalSpansChirho(
  valueChirho: unknown,
  lineWidthPxChirho: number,
  lineTextOrderChirho?: string
): { proposedSpansChirho: SegmentRepairProposalSpanChirho[]; lineTextPreviewChirho: string } {
  if (!Array.isArray(valueChirho) || valueChirho.length === 0) {
    throw new Error("proposedSpansChirho must be a non-empty array");
  }
  if (!Number.isInteger(lineWidthPxChirho) || lineWidthPxChirho <= 0) {
    throw new Error("lineWidthPxChirho must be a positive integer");
  }
  const proposedSpansChirho = valueChirho.map((spanValueChirho, indexChirho) => {
    const spanChirho = recordChirho(spanValueChirho, `proposedSpansChirho[${indexChirho}]`);
    const segmentIndexChirho = finiteIntegerChirho(
      spanChirho.segmentIndexChirho,
      `proposedSpansChirho[${indexChirho}].segmentIndexChirho`
    );
    const xMinPxChirho = finiteIntegerChirho(spanChirho.xMinPxChirho, `proposedSpansChirho[${indexChirho}].xMinPxChirho`);
    const widthPxChirho = finiteIntegerChirho(spanChirho.widthPxChirho, `proposedSpansChirho[${indexChirho}].widthPxChirho`);
    const scriptChirho = stringChirho(spanChirho.scriptChirho, `proposedSpansChirho[${indexChirho}].scriptChirho`);
    if (!SEGMENT_REPAIR_SCRIPT_SET_CHIRHO.has(scriptChirho)) {
      throw new Error(`unsupported scriptChirho at proposedSpansChirho[${indexChirho}]: ${scriptChirho}`);
    }
    if (segmentIndexChirho !== indexChirho) {
      throw new Error(`proposedSpansChirho[${indexChirho}].segmentIndexChirho must equal its row index`);
    }
    if (xMinPxChirho < 0) throw new Error(`proposedSpansChirho[${indexChirho}].xMinPxChirho must be non-negative`);
    if (widthPxChirho <= 0) throw new Error(`proposedSpansChirho[${indexChirho}].widthPxChirho must be positive`);
    return {
      segmentIndexChirho,
      xMinPxChirho,
      widthPxChirho,
      scriptChirho: scriptChirho as SegmentRepairScriptChirho,
      utf8TextChirho: normalizeTextForStorageChirho(stringChirho(spanChirho.utf8TextChirho, `proposedSpansChirho[${indexChirho}].utf8TextChirho`)),
    };
  });
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of proposedSpansChirho.entries()) {
    if (spanChirho.xMinPxChirho !== expectedXChirho) {
      throw new Error(`proposedSpansChirho[${indexChirho}] starts at ${spanChirho.xMinPxChirho}, expected ${expectedXChirho}`);
    }
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineWidthPxChirho) {
    throw new Error(`proposedSpansChirho ends at ${expectedXChirho}, expected line width ${lineWidthPxChirho}`);
  }
  const lineTextPreviewChirho = renderSpanLineTextChirho({
    lineTextOrderChirho,
    spansChirho: proposedSpansChirho,
  });
  return { proposedSpansChirho, lineTextPreviewChirho };
}

export function loadSegmentRepairProposalStoreChirho(pathChirho: string): SegmentRepairProposalStoreChirho {
  if (!existsSync(pathChirho)) {
    return {
      schemaVersionChirho: SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
      proposalsChirho: [],
    };
  }
  const parsedChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as Partial<SegmentRepairProposalStoreChirho>;
  if (
    parsedChirho.schemaVersionChirho !== SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO ||
    !Array.isArray(parsedChirho.proposalsChirho)
  ) {
    throw new Error(`${pathChirho} is not a segment repair proposal store`);
  }
  return parsedChirho as SegmentRepairProposalStoreChirho;
}

export function assertSegmentRepairStatusTransitionChirho(
  fromChirho: SegmentRepairProposalStatusChirho,
  toChirho: SegmentRepairProposalStatusChirho
): void {
  const allowedChirho = SEGMENT_REPAIR_STATUS_TRANSITIONS_CHIRHO[fromChirho] ?? [];
  if (!allowedChirho.includes(toChirho)) {
    throw new Error(`segment repair proposal cannot move from ${fromChirho} to ${toChirho}`);
  }
}

export function appendSegmentRepairProposalChirho(pathChirho: string, proposalChirho: SegmentRepairProposalRecordChirho): void {
  withSegmentRepairStoreLockChirho(pathChirho, `append-${proposalChirho.proposalIdChirho}`, () => {
    const storeChirho = loadSegmentRepairProposalStoreChirho(pathChirho);
    if (storeChirho.proposalsChirho.some((existingChirho) => existingChirho.proposalIdChirho === proposalChirho.proposalIdChirho)) {
      throw new Error(`segment repair proposal id already exists: ${proposalChirho.proposalIdChirho}`);
    }
    writeJsonAtomicChirho(pathChirho, {
      schemaVersionChirho: SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
      proposalsChirho: [...storeChirho.proposalsChirho, proposalChirho],
    });
  });
}

/**
 * Locked read-modify-write of one proposal record. The mutator receives the
 * current record and returns the replacement; a status change must be a legal
 * lifecycle transition (asserted here, not left to callers).
 */
export function updateSegmentRepairProposalChirho(
  pathChirho: string,
  proposalIdChirho: string,
  ownerChirho: string,
  mutateChirho: (proposalChirho: SegmentRepairProposalRecordChirho) => SegmentRepairProposalRecordChirho
): SegmentRepairProposalRecordChirho {
  return withSegmentRepairStoreLockChirho(pathChirho, ownerChirho, () => {
    const storeChirho = loadSegmentRepairProposalStoreChirho(pathChirho);
    const indexChirho = storeChirho.proposalsChirho.findIndex(
      (proposalChirho) => proposalChirho.proposalIdChirho === proposalIdChirho
    );
    if (indexChirho < 0) {
      throw new Error(`segment repair proposal not found: ${proposalIdChirho}`);
    }
    const currentChirho = storeChirho.proposalsChirho[indexChirho]!;
    const updatedChirho = mutateChirho(currentChirho);
    if (updatedChirho.proposalIdChirho !== currentChirho.proposalIdChirho) {
      throw new Error("segment repair proposal id cannot change during update");
    }
    if (updatedChirho.statusChirho !== currentChirho.statusChirho) {
      assertSegmentRepairStatusTransitionChirho(currentChirho.statusChirho, updatedChirho.statusChirho);
    }
    const proposalsChirho = [...storeChirho.proposalsChirho];
    proposalsChirho[indexChirho] = updatedChirho;
    writeJsonAtomicChirho(pathChirho, {
      schemaVersionChirho: SEGMENT_REPAIR_PROPOSAL_SCHEMA_VERSION_CHIRHO,
      proposalsChirho,
    });
    return updatedChirho;
  });
}
