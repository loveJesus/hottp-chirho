// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared parser/summarizer for explicit expert confirmations of non-Latin
 * vision-tier items.
 *
 * Confirmation is item-exact and live-hash anchored; stale or malformed
 * policies retire zero items and block completion.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";
import { type VisionTierExpertLiveItemChirho } from "./vision-tier-expert-live-items-chirho.ts";

export const VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-tier-expert-confirmations-2026-06-01-chirho.json"
);

export const VISION_TIER_EXPERT_CONFIRMATION_DRAFT_CHIRHO = "draft-chirho";
export const VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO = "confirmed-expert-chirho";
export const VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO = "reviewed-issues-expert-chirho";
export const VISION_TIER_EXPERT_ISSUE_FLAGS_CHIRHO = [
  "letters-chirho",
  "marks-chirho",
  "punctuation-chirho",
  "segmentation-chirho",
  "wrong-script-chirho",
  "wrong-source-chirho",
  "uncertain-chirho",
] as const;
export const VISION_TIER_EXPERT_ISSUE_FLAG_VALUES_CHIRHO = new Set<string>(
  VISION_TIER_EXPERT_ISSUE_FLAGS_CHIRHO
);

export interface VisionTierExpertConfirmationItemChirho {
  itemIdChirho?: string;
  scriptChirho?: string;
  visionSourceChirho?: string;
  currentTextChirho?: string;
  currentTextHashChirho?: string;
}

export interface VisionTierExpertConfirmationPolicyChirho {
  policyIdChirho?: string;
  decisionChirho?: string;
  reviewerChirho?: string;
  reviewerRoleChirho?: string;
  confirmedAtChirho?: string;
  reviewedAtChirho?: string;
  rationaleChirho?: string;
  issueFlagsChirho?: string[];
  scopeChirho?: string;
  itemCountChirho?: number;
  itemsChirho?: VisionTierExpertConfirmationItemChirho[];
}

export interface VisionTierExpertConfirmationFileChirho {
  john316Chirho?: string;
  schemaVersionChirho?: number;
  generatedAtChirho?: string;
  policiesChirho?: VisionTierExpertConfirmationPolicyChirho[];
}

export interface VisionTierExpertConfirmationSummaryChirho {
  policyFileExistsChirho: boolean;
  policyFileShapeOkChirho: boolean;
  confirmedPolicyCountChirho: number;
  confirmedPolicyItemCountChirho: number;
  validConfirmedPolicyItemCountChirho: number;
  staleConfirmedPolicyItemCountChirho: number;
  duplicateConfirmedPolicyItemCountChirho: number;
  reviewedIssuePolicyCountChirho: number;
  reviewedIssuePolicyItemCountChirho: number;
  validReviewedIssuePolicyItemCountChirho: number;
  staleReviewedIssuePolicyItemCountChirho: number;
  duplicateReviewedIssuePolicyItemCountChirho: number;
  confirmedItemIdsChirho: Set<string>;
  reviewedIssueItemIdsChirho: Set<string>;
  shapeErrorsChirho: string[];
}

export function readVisionTierExpertConfirmationFileChirho(
  pathChirho = VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO
): VisionTierExpertConfirmationFileChirho {
  if (!existsSync(pathChirho)) return {};
  return JSON.parse(readFileSync(pathChirho, "utf8")) as VisionTierExpertConfirmationFileChirho;
}

function nonEmptyStringChirho(valueChirho: unknown): valueChirho is string {
  return typeof valueChirho === "string" && valueChirho.trim().length > 0;
}

function validateConfirmationShapeChirho(fileChirho: VisionTierExpertConfirmationFileChirho): string[] {
  const errorsChirho: string[] = [];
  if (fileChirho.schemaVersionChirho !== 1) errorsChirho.push("schemaVersionChirho must be 1");
  if (!Array.isArray(fileChirho.policiesChirho)) {
    errorsChirho.push("policiesChirho must be an array");
    return errorsChirho;
  }
  for (const policyChirho of fileChirho.policiesChirho) {
    const policyIdChirho = policyChirho.policyIdChirho ?? "<missing-policy-id-chirho>";
    if (!nonEmptyStringChirho(policyChirho.policyIdChirho)) {
      errorsChirho.push(`${policyIdChirho}: policyIdChirho must be non-empty`);
    }
    if (
      policyChirho.decisionChirho !== VISION_TIER_EXPERT_CONFIRMATION_DRAFT_CHIRHO &&
      policyChirho.decisionChirho !== VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO &&
      policyChirho.decisionChirho !== VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO
    ) {
      errorsChirho.push(`${policyIdChirho}: decisionChirho is invalid`);
    }
    if (!Array.isArray(policyChirho.itemsChirho)) {
      errorsChirho.push(`${policyIdChirho}: itemsChirho must be an array`);
      continue;
    }
    if (policyChirho.itemCountChirho !== undefined && policyChirho.itemCountChirho !== policyChirho.itemsChirho.length) {
      errorsChirho.push(`${policyIdChirho}: itemCountChirho does not match itemsChirho.length`);
    }
    if (policyChirho.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO) {
      if (!nonEmptyStringChirho(policyChirho.reviewerChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires reviewerChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.reviewerRoleChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires reviewerRoleChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.confirmedAtChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires confirmedAtChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.rationaleChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires rationaleChirho`);
      }
    }
    if (policyChirho.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO) {
      if (!nonEmptyStringChirho(policyChirho.reviewerChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires reviewerChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.reviewerRoleChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires reviewerRoleChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.reviewedAtChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires reviewedAtChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.rationaleChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires rationaleChirho`);
      }
      if (
        !Array.isArray(policyChirho.issueFlagsChirho) ||
        policyChirho.issueFlagsChirho.length === 0 ||
        !policyChirho.issueFlagsChirho.every((flagChirho) => VISION_TIER_EXPERT_ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho))
      ) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires valid issueFlagsChirho`);
      }
    }
    for (const itemChirho of policyChirho.itemsChirho) {
      if (!nonEmptyStringChirho(itemChirho.itemIdChirho)) {
        errorsChirho.push(`${policyIdChirho}: itemIdChirho must be non-empty`);
      }
      if (!nonEmptyStringChirho(itemChirho.scriptChirho)) {
        errorsChirho.push(`${policyIdChirho}: scriptChirho must be non-empty`);
      }
      if (!nonEmptyStringChirho(itemChirho.visionSourceChirho)) {
        errorsChirho.push(`${policyIdChirho}: visionSourceChirho must be non-empty`);
      }
      if (typeof itemChirho.currentTextChirho !== "string") {
        errorsChirho.push(`${policyIdChirho}: currentTextChirho must be a string`);
      }
      if (!nonEmptyStringChirho(itemChirho.currentTextHashChirho)) {
        errorsChirho.push(`${policyIdChirho}: currentTextHashChirho must be non-empty`);
      }
    }
  }
  return errorsChirho;
}

export function summarizeVisionTierExpertConfirmationsChirho(
  fileChirho: VisionTierExpertConfirmationFileChirho,
  policyFileExistsChirho: boolean,
  liveItemsChirho: VisionTierExpertLiveItemChirho[]
): VisionTierExpertConfirmationSummaryChirho {
  const shapeErrorsChirho = policyFileExistsChirho ? validateConfirmationShapeChirho(fileChirho) : [];
  const policyFileShapeOkChirho = shapeErrorsChirho.length === 0;
  const confirmedItemIdsChirho = new Set<string>();
  const reviewedIssueItemIdsChirho = new Set<string>();
  if (!policyFileShapeOkChirho) {
    return {
      policyFileExistsChirho,
      policyFileShapeOkChirho,
      confirmedPolicyCountChirho: 0,
      confirmedPolicyItemCountChirho: 0,
      validConfirmedPolicyItemCountChirho: 0,
      staleConfirmedPolicyItemCountChirho: 0,
      duplicateConfirmedPolicyItemCountChirho: 0,
      reviewedIssuePolicyCountChirho: 0,
      reviewedIssuePolicyItemCountChirho: 0,
      validReviewedIssuePolicyItemCountChirho: 0,
      staleReviewedIssuePolicyItemCountChirho: 0,
      duplicateReviewedIssuePolicyItemCountChirho: 0,
      confirmedItemIdsChirho,
      reviewedIssueItemIdsChirho,
      shapeErrorsChirho,
    };
  }

  const liveByIdChirho = new Map(liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho]));
  let confirmedPolicyCountChirho = 0;
  let confirmedPolicyItemCountChirho = 0;
  let staleConfirmedPolicyItemCountChirho = 0;
  let duplicateConfirmedPolicyItemCountChirho = 0;
  let reviewedIssuePolicyCountChirho = 0;
  let reviewedIssuePolicyItemCountChirho = 0;
  let staleReviewedIssuePolicyItemCountChirho = 0;
  let duplicateReviewedIssuePolicyItemCountChirho = 0;
  for (const policyChirho of fileChirho.policiesChirho ?? []) {
    const isConfirmedChirho = policyChirho.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO;
    const isReviewedIssuesChirho =
      policyChirho.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO;
    if (!isConfirmedChirho && !isReviewedIssuesChirho) continue;
    if (isConfirmedChirho) confirmedPolicyCountChirho += 1;
    if (isReviewedIssuesChirho) reviewedIssuePolicyCountChirho += 1;
    for (const itemChirho of policyChirho.itemsChirho ?? []) {
      if (isConfirmedChirho) confirmedPolicyItemCountChirho += 1;
      if (isReviewedIssuesChirho) reviewedIssuePolicyItemCountChirho += 1;
      const itemIdChirho = itemChirho.itemIdChirho!;
      const targetSetChirho = isConfirmedChirho ? confirmedItemIdsChirho : reviewedIssueItemIdsChirho;
      if (targetSetChirho.has(itemIdChirho)) {
        if (isConfirmedChirho) duplicateConfirmedPolicyItemCountChirho += 1;
        if (isReviewedIssuesChirho) duplicateReviewedIssuePolicyItemCountChirho += 1;
        continue;
      }
      const liveItemChirho = liveByIdChirho.get(itemIdChirho);
      const liveHashChirho = liveItemChirho === undefined ? null : hashTextChirho(liveItemChirho.currentTextChirho);
      const freshChirho =
        liveItemChirho !== undefined &&
        liveItemChirho.scriptChirho === itemChirho.scriptChirho &&
        liveItemChirho.visionSourceChirho === itemChirho.visionSourceChirho &&
        liveItemChirho.currentTextChirho === itemChirho.currentTextChirho &&
        liveHashChirho === itemChirho.currentTextHashChirho;
      if (!freshChirho) {
        if (isConfirmedChirho) staleConfirmedPolicyItemCountChirho += 1;
        if (isReviewedIssuesChirho) staleReviewedIssuePolicyItemCountChirho += 1;
        continue;
      }
      targetSetChirho.add(itemIdChirho);
    }
  }

  return {
    policyFileExistsChirho,
    policyFileShapeOkChirho,
    confirmedPolicyCountChirho,
    confirmedPolicyItemCountChirho,
    validConfirmedPolicyItemCountChirho: confirmedItemIdsChirho.size,
    staleConfirmedPolicyItemCountChirho,
    duplicateConfirmedPolicyItemCountChirho,
    reviewedIssuePolicyCountChirho,
    reviewedIssuePolicyItemCountChirho,
    validReviewedIssuePolicyItemCountChirho: reviewedIssueItemIdsChirho.size,
    staleReviewedIssuePolicyItemCountChirho,
    duplicateReviewedIssuePolicyItemCountChirho,
    confirmedItemIdsChirho,
    reviewedIssueItemIdsChirho,
    shapeErrorsChirho,
  };
}
