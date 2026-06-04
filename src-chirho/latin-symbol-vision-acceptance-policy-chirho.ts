// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Shared parser/summarizer for explicit Latin/symbol vision acceptance policy.
 *
 * Policy acceptance is intentionally exact-item based: a policy retires only the
 * item IDs whose stored NFC text hash still matches current live span/D1 text.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  hashTextChirho,
  isNontrivialSymbolTextChirho,
  type LatinSymbolVisionLiveItemChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";

export const LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "latin-symbol-vision-acceptance-policy-2026-06-01-chirho.json"
);

export const LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO = "accepted-clean-policy-chirho";
export const LATIN_SYMBOL_POLICY_DECISION_DRAFT_CHIRHO = "draft-chirho";

export interface LatinSymbolAcceptancePolicyItemChirho {
  itemIdChirho?: string;
  itemKindChirho?: string;
  scriptChirho?: string;
  currentTextChirho?: string;
  currentTextHashChirho?: string;
}

export interface LatinSymbolAcceptancePolicyChirho {
  policyIdChirho?: string;
  decisionChirho?: string;
  reviewerChirho?: string;
  acceptedAtChirho?: string;
  rationaleChirho?: string;
  scopeChirho?: string;
  itemCountChirho?: number;
  itemsChirho?: LatinSymbolAcceptancePolicyItemChirho[];
}

export interface LatinSymbolAcceptancePolicyFileChirho {
  john316Chirho?: string;
  schemaVersionChirho?: number;
  generatedAtChirho?: string;
  policiesChirho?: LatinSymbolAcceptancePolicyChirho[];
}

export interface LatinSymbolAcceptancePolicySummaryChirho {
  policyFileExistsChirho: boolean;
  policyFileShapeOkChirho: boolean;
  acceptedPolicyCountChirho: number;
  acceptedPolicyItemCountChirho: number;
  validAcceptedPolicyItemCountChirho: number;
  staleAcceptedPolicyItemCountChirho: number;
  duplicateAcceptedPolicyItemCountChirho: number;
  acceptedItemIdsChirho: Set<string>;
  shapeErrorsChirho: string[];
}

export function readLatinSymbolAcceptancePolicyFileChirho(
  pathChirho = LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO
): LatinSymbolAcceptancePolicyFileChirho {
  if (!existsSync(pathChirho)) return {};
  return JSON.parse(readFileSync(pathChirho, "utf8")) as LatinSymbolAcceptancePolicyFileChirho;
}

function nonEmptyStringChirho(valueChirho: unknown): valueChirho is string {
  return typeof valueChirho === "string" && valueChirho.trim().length > 0;
}

function policyClaimsSafeSymbolsOnlyChirho(policyChirho: LatinSymbolAcceptancePolicyChirho): boolean {
  return typeof policyChirho.scopeChirho === "string" && /\bsafeSymbolsOnly=true\b/.test(policyChirho.scopeChirho);
}

function validatePolicyShapeChirho(fileChirho: LatinSymbolAcceptancePolicyFileChirho): string[] {
  const errorsChirho: string[] = [];
  if (fileChirho.schemaVersionChirho !== 1) {
    errorsChirho.push("schemaVersionChirho must be 1");
  }
  if (!Array.isArray(fileChirho.policiesChirho)) {
    errorsChirho.push("policiesChirho must be an array");
    return errorsChirho;
  }
  for (const policyChirho of fileChirho.policiesChirho) {
    const policyIdChirho = policyChirho.policyIdChirho ?? "<missing-policy-id-chirho>";
    const safeSymbolsOnlyChirho = policyClaimsSafeSymbolsOnlyChirho(policyChirho);
    if (!nonEmptyStringChirho(policyChirho.policyIdChirho)) {
      errorsChirho.push(`${policyIdChirho}: policyIdChirho must be non-empty`);
    }
    if (
      policyChirho.decisionChirho !== LATIN_SYMBOL_POLICY_DECISION_DRAFT_CHIRHO &&
      policyChirho.decisionChirho !== LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO
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
    if (policyChirho.decisionChirho === LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO) {
      if (!nonEmptyStringChirho(policyChirho.reviewerChirho)) {
        errorsChirho.push(`${policyIdChirho}: accepted policy requires reviewerChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.acceptedAtChirho)) {
        errorsChirho.push(`${policyIdChirho}: accepted policy requires acceptedAtChirho`);
      }
      if (!nonEmptyStringChirho(policyChirho.rationaleChirho)) {
        errorsChirho.push(`${policyIdChirho}: accepted policy requires rationaleChirho`);
      }
    }
    for (const itemChirho of policyChirho.itemsChirho) {
      if (!nonEmptyStringChirho(itemChirho.itemIdChirho)) {
        errorsChirho.push(`${policyIdChirho}: itemIdChirho must be non-empty`);
      }
      if (!nonEmptyStringChirho(itemChirho.itemKindChirho)) {
        errorsChirho.push(`${policyIdChirho}: itemKindChirho must be non-empty`);
      }
      if (!nonEmptyStringChirho(itemChirho.scriptChirho)) {
        errorsChirho.push(`${policyIdChirho}: scriptChirho must be non-empty`);
      }
      if (typeof itemChirho.currentTextChirho !== "string") {
        errorsChirho.push(`${policyIdChirho}: currentTextChirho must be a string`);
      }
      if (!nonEmptyStringChirho(itemChirho.currentTextHashChirho)) {
        errorsChirho.push(`${policyIdChirho}: currentTextHashChirho must be non-empty`);
      }
      if (
        safeSymbolsOnlyChirho &&
        typeof itemChirho.currentTextChirho === "string" &&
        (itemChirho.scriptChirho !== "symbol-chirho" ||
          isNontrivialSymbolTextChirho({
            scriptChirho: itemChirho.scriptChirho ?? "",
            textChirho: itemChirho.currentTextChirho,
          }))
      ) {
        errorsChirho.push(`${policyIdChirho}: safeSymbolsOnly=true item ${itemChirho.itemIdChirho ?? "<missing-item-id-chirho>"} is not trivial symbol punctuation`);
      }
    }
  }
  return errorsChirho;
}

export function summarizeLatinSymbolAcceptancePolicyChirho(
  fileChirho: LatinSymbolAcceptancePolicyFileChirho,
  policyFileExistsChirho: boolean,
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): LatinSymbolAcceptancePolicySummaryChirho {
  const shapeErrorsChirho = policyFileExistsChirho ? validatePolicyShapeChirho(fileChirho) : [];
  const policyFileShapeOkChirho = shapeErrorsChirho.length === 0;
  const acceptedItemIdsChirho = new Set<string>();
  if (!policyFileShapeOkChirho) {
    return {
      policyFileExistsChirho,
      policyFileShapeOkChirho,
      acceptedPolicyCountChirho: 0,
      acceptedPolicyItemCountChirho: 0,
      validAcceptedPolicyItemCountChirho: 0,
      staleAcceptedPolicyItemCountChirho: 0,
      duplicateAcceptedPolicyItemCountChirho: 0,
      acceptedItemIdsChirho,
      shapeErrorsChirho,
    };
  }

  const liveByIdChirho = new Map(liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho]));
  let acceptedPolicyCountChirho = 0;
  let acceptedPolicyItemCountChirho = 0;
  let staleAcceptedPolicyItemCountChirho = 0;
  let duplicateAcceptedPolicyItemCountChirho = 0;
  for (const policyChirho of fileChirho.policiesChirho ?? []) {
    if (policyChirho.decisionChirho !== LATIN_SYMBOL_POLICY_DECISION_ACCEPTED_CHIRHO) continue;
    acceptedPolicyCountChirho += 1;
    for (const itemChirho of policyChirho.itemsChirho ?? []) {
      acceptedPolicyItemCountChirho += 1;
      const itemIdChirho = itemChirho.itemIdChirho!;
      if (acceptedItemIdsChirho.has(itemIdChirho)) {
        duplicateAcceptedPolicyItemCountChirho += 1;
        continue;
      }
      const liveItemChirho = liveByIdChirho.get(itemIdChirho);
      const liveHashChirho = liveItemChirho === undefined ? null : hashTextChirho(liveItemChirho.textChirho);
      const freshChirho =
        liveItemChirho !== undefined &&
        liveItemChirho.itemKindChirho === itemChirho.itemKindChirho &&
        liveItemChirho.scriptChirho === itemChirho.scriptChirho &&
        liveItemChirho.textChirho === itemChirho.currentTextChirho &&
        liveHashChirho === itemChirho.currentTextHashChirho;
      if (!freshChirho) {
        staleAcceptedPolicyItemCountChirho += 1;
        continue;
      }
      acceptedItemIdsChirho.add(itemIdChirho);
    }
  }

  return {
    policyFileExistsChirho,
    policyFileShapeOkChirho,
    acceptedPolicyCountChirho,
    acceptedPolicyItemCountChirho,
    validAcceptedPolicyItemCountChirho: acceptedItemIdsChirho.size,
    staleAcceptedPolicyItemCountChirho,
    duplicateAcceptedPolicyItemCountChirho,
    acceptedItemIdsChirho,
    shapeErrorsChirho,
  };
}
