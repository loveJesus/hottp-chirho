// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared parser/summarizer for explicit expert confirmations of non-Latin
 * expert-lane items.
 *
 * Confirmation is item-exact and live-hash anchored; stale or malformed
 * policies retire zero items and block completion.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  certifyingReviewerAttributionErrorChirho,
  isGenericReviewerAttributionChirho,
} from "./reviewer-attribution-chirho.ts";
import { valueLooksTemplatePlaceholderChirho } from "./template-placeholder-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";
import {
  VISION_TIER_EXPERT_REVIEWER_LABELS_CHIRHO,
  type VisionTierExpertLiveItemChirho,
} from "./vision-tier-expert-live-items-chirho.ts";

export const VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-tier-expert-confirmations-2026-06-01-chirho.json"
);

export const VISION_TIER_EXPERT_CONFIRMATION_DRAFT_CHIRHO = "draft-chirho";
export const VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO = "confirmed-expert-chirho";
export const VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO = "reviewed-issues-expert-chirho";
export const VISION_TIER_EXPERT_RATIONALE_PLACEHOLDER_VALUES_CHIRHO = new Set([
  "why these exact items are confirmed",
  "why this exact item is confirmed",
  "why this issue is recorded",
  "why these issues are recorded",
  "why this exact text is supplied",
  "rationale",
  "reason",
  "placeholder",
  "todo",
  "tbd",
]);
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
  certifyExactChirho?: boolean;
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
  issueOverriddenConfirmedPolicyItemCountChirho: number;
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

export function expectedVisionTierReviewerRoleChirho(scriptChirho: string): string | null {
  return VISION_TIER_EXPERT_REVIEWER_LABELS_CHIRHO[scriptChirho] ?? null;
}

export function reviewerRoleMatchesScriptChirho(scriptChirho: string, reviewerRoleChirho: string): boolean {
  const expectedRoleChirho = expectedVisionTierReviewerRoleChirho(scriptChirho);
  return expectedRoleChirho !== null && reviewerRoleChirho.trim() === expectedRoleChirho;
}

export function visionTierExpertRationaleLooksPlaceholderChirho(rationaleChirho: string): boolean {
  return valueLooksTemplatePlaceholderChirho(
    rationaleChirho,
    VISION_TIER_EXPERT_RATIONALE_PLACEHOLDER_VALUES_CHIRHO
  );
}

function reviewerRoleShapeErrorsChirho(policyChirho: VisionTierExpertConfirmationPolicyChirho): string[] {
  const errorsChirho: string[] = [];
  const policyIdChirho = policyChirho.policyIdChirho ?? "<missing-policy-id-chirho>";
  if (!nonEmptyStringChirho(policyChirho.reviewerRoleChirho) || !Array.isArray(policyChirho.itemsChirho)) {
    return errorsChirho;
  }
  const checkedScriptsChirho = new Set<string>();
  for (const itemChirho of policyChirho.itemsChirho) {
    if (!nonEmptyStringChirho(itemChirho.scriptChirho) || checkedScriptsChirho.has(itemChirho.scriptChirho)) continue;
    checkedScriptsChirho.add(itemChirho.scriptChirho);
    const expectedRoleChirho = expectedVisionTierReviewerRoleChirho(itemChirho.scriptChirho);
    if (expectedRoleChirho === null) {
      errorsChirho.push(`${policyIdChirho}: ${itemChirho.scriptChirho} has no expected reviewerRoleChirho`);
      continue;
    }
    if (policyChirho.reviewerRoleChirho.trim() !== expectedRoleChirho) {
      errorsChirho.push(
        `${policyIdChirho}: reviewerRoleChirho must be "${expectedRoleChirho}" for ${itemChirho.scriptChirho}`
      );
    }
  }
  return errorsChirho;
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
      } else {
        const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(policyChirho.reviewerChirho);
        if (reviewerErrorChirho !== null) {
          errorsChirho.push(`${policyIdChirho}: confirmed policy ${reviewerErrorChirho}`);
        }
      }
      if (!nonEmptyStringChirho(policyChirho.reviewerRoleChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires reviewerRoleChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.confirmedAtChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires confirmedAtChirho`);
      }
      if (policyChirho.certifyExactChirho !== true) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires certifyExactChirho=true`);
      }
      if (!nonEmptyStringChirho(policyChirho.rationaleChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy requires rationaleChirho`);
      } else if (visionTierExpertRationaleLooksPlaceholderChirho(policyChirho.rationaleChirho)) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy rationaleChirho must not be a template placeholder`);
      }
      errorsChirho.push(...reviewerRoleShapeErrorsChirho(policyChirho));
    }
    if (policyChirho.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO) {
      if (!nonEmptyStringChirho(policyChirho.reviewerChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires reviewerChirho`);
      } else if (isGenericReviewerAttributionChirho(policyChirho.reviewerChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy reviewerChirho must identify the explicit reviewer`);
      }
      if (!nonEmptyStringChirho(policyChirho.reviewerRoleChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires reviewerRoleChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.reviewedAtChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires reviewedAtChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.rationaleChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy requires rationaleChirho`);
      } else if (visionTierExpertRationaleLooksPlaceholderChirho(policyChirho.rationaleChirho)) {
        errorsChirho.push(`${policyIdChirho}: reviewed-issues policy rationaleChirho must not be a template placeholder`);
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
      } else if (
        policyChirho.decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO &&
        itemChirho.currentTextChirho.trim().length === 0
      ) {
        errorsChirho.push(`${policyIdChirho}: confirmed policy cannot certify blank currentTextChirho; apply expert-supplied text first`);
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
      issueOverriddenConfirmedPolicyItemCountChirho: 0,
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

  let issueOverriddenConfirmedPolicyItemCountChirho = 0;
  for (const itemIdChirho of reviewedIssueItemIdsChirho) {
    if (confirmedItemIdsChirho.delete(itemIdChirho)) {
      issueOverriddenConfirmedPolicyItemCountChirho += 1;
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
    issueOverriddenConfirmedPolicyItemCountChirho,
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
