// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Prepare exact-item expert confirmations for non-Latin vision-tier items.
 *
 * Default mode prints a draft JSON policy. Writing a confirmed policy requires
 * --write-chirho, --decision-chirho=confirmed-expert-chirho, reviewer, role,
 * rationale, --certify-exact-chirho, --expected-item-count-chirho, and exact
 * expected item ids.
 */

import { existsSync, readFileSync } from "fs";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import {
  assertExpectedItemIdsChirho,
  expectedItemGuardArgsChirho,
  parseExpectedItemIdsChirho,
} from "./expected-item-guard-chirho.ts";
import { assertCertifyingReviewerAttributionChirho } from "./reviewer-attribution-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";
import {
  expectedVisionTierReviewerRoleChirho,
  reviewerRoleMatchesScriptChirho,
  VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
  VISION_TIER_EXPERT_CONFIRMATION_DRAFT_CHIRHO,
  VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO,
  visionTierExpertRationaleLooksPlaceholderChirho,
  type VisionTierExpertConfirmationFileChirho,
  type VisionTierExpertConfirmationPolicyChirho,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";
import { visionTierExpertLiveItemsChirho } from "./vision-tier-expert-live-items-chirho.ts";

const MODULE_CHIRHO = "prepare-vision-tier-expert-confirmation-policy-chirho";

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function splitCsvChirho(valueChirho: string | undefined): string[] {
  return (valueChirho ?? "")
    .split(",")
    .map((partChirho) => partChirho.trim())
    .filter((partChirho) => partChirho.length > 0);
}

function parseExpectedItemCountChirho(argsChirho: string[]): number | null {
  const valueChirho = parseArgValueChirho(argsChirho, "expected-item-count-chirho");
  if (valueChirho === undefined) return null;
  const countChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(countChirho) || countChirho < 0 || String(countChirho) !== valueChirho) {
    throw new Error(`--expected-item-count-chirho must be a non-negative integer; got ${valueChirho}`);
  }
  return countChirho;
}

function slugChirho(valueChirho: string): string {
  return valueChirho
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadPolicyFileChirho(pathChirho: string): VisionTierExpertConfirmationFileChirho {
  if (!existsSync(pathChirho)) {
    return {
      john316Chirho:
        "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
      schemaVersionChirho: 1,
      generatedAtChirho: new Date().toISOString(),
      policiesChirho: [],
    };
  }
  return JSON.parse(readFileSync(pathChirho, "utf8")) as VisionTierExpertConfirmationFileChirho;
}

function writePolicyFileChirho(pathChirho: string, fileChirho: VisionTierExpertConfirmationFileChirho): void {
  writeJsonAtomicChirho(pathChirho, fileChirho);
}

function assertReviewerRoleMatchesSelectedItemsChirho(selectedItemsChirho: { scriptChirho: string }[], reviewerRoleChirho: string): void {
  const scriptsChirho = [...new Set(selectedItemsChirho.map((itemChirho) => itemChirho.scriptChirho))].sort();
  for (const scriptChirho of scriptsChirho) {
    const expectedRoleChirho = expectedVisionTierReviewerRoleChirho(scriptChirho);
    if (expectedRoleChirho === null || !reviewerRoleMatchesScriptChirho(scriptChirho, reviewerRoleChirho)) {
      throw new Error(
        `--reviewer-role-chirho must be "${expectedRoleChirho ?? "<no-role-chirho>"}" for ${scriptChirho}; split multi-script confirmations by --script-chirho`
      );
    }
  }
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const writeChirho = argsChirho.includes("--write-chirho");
  const certifyExactChirho = argsChirho.includes("--certify-exact-chirho");
  const scriptFiltersChirho = new Set(splitCsvChirho(parseArgValueChirho(argsChirho, "script-chirho")));
  const idFiltersChirho = new Set(splitCsvChirho(parseArgValueChirho(argsChirho, "id-chirho")));
  const decisionChirho = parseArgValueChirho(argsChirho, "decision-chirho") ?? VISION_TIER_EXPERT_CONFIRMATION_DRAFT_CHIRHO;
  const reviewerChirho = parseArgValueChirho(argsChirho, "reviewer-chirho") ?? "";
  const reviewerRoleChirho = parseArgValueChirho(argsChirho, "reviewer-role-chirho") ?? "";
  const rationaleChirho = parseArgValueChirho(argsChirho, "rationale-chirho") ?? "";
  const outPathChirho = parseArgValueChirho(argsChirho, "out-chirho") ?? VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO;
  const expectedItemCountChirho = parseExpectedItemCountChirho(argsChirho);
  const expectedItemIdsChirho = parseExpectedItemIdsChirho(argsChirho);
  const scopePartsChirho = [
    scriptFiltersChirho.size === 0 ? "all-scripts-chirho" : [...scriptFiltersChirho].sort().join("-"),
    idFiltersChirho.size === 0 ? "all-items-chirho" : `${idFiltersChirho.size}-ids-chirho`,
  ];
  const policyIdChirho =
    parseArgValueChirho(argsChirho, "policy-id-chirho") ??
    `${scopePartsChirho.map(slugChirho).join("-")}-${new Date().toISOString().slice(0, 10)}-chirho`;

  if (
    decisionChirho !== VISION_TIER_EXPERT_CONFIRMATION_DRAFT_CHIRHO &&
    decisionChirho !== VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO
  ) {
    throw new Error(`--decision-chirho must be ${VISION_TIER_EXPERT_CONFIRMATION_DRAFT_CHIRHO} or ${VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO}`);
  }
  if (decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO) {
    if (reviewerChirho.trim().length === 0) throw new Error("--reviewer-chirho is required for confirmed policy");
    assertCertifyingReviewerAttributionChirho(reviewerChirho, "--reviewer-chirho");
    if (reviewerRoleChirho.trim().length === 0) throw new Error("--reviewer-role-chirho is required for confirmed policy");
    if (rationaleChirho.trim().length === 0) throw new Error("--rationale-chirho is required for confirmed policy");
    if (visionTierExpertRationaleLooksPlaceholderChirho(rationaleChirho)) {
      throw new Error("--rationale-chirho must explain the exact expert confirmation, not a template placeholder");
    }
    if (!certifyExactChirho) {
      throw new Error(
        "--certify-exact-chirho is required for confirmed policy after checking the exact printed letters and relevant marks"
      );
    }
  }

  const liveItemsChirho = visionTierExpertLiveItemsChirho();
  const selectedItemsChirho = liveItemsChirho.filter((itemChirho) => {
    const scriptOkChirho = scriptFiltersChirho.size === 0 || scriptFiltersChirho.has(itemChirho.scriptChirho);
    const idOkChirho = idFiltersChirho.size === 0 || idFiltersChirho.has(itemChirho.idChirho);
    return scriptOkChirho && idOkChirho;
  });
  if (decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO) {
    if (writeChirho && expectedItemCountChirho === null) {
      throw new Error("--expected-item-count-chirho is required when writing a confirmed expert policy");
    }
    if (writeChirho && expectedItemCountChirho !== selectedItemsChirho.length) {
      throw new Error(
        `selected item count ${selectedItemsChirho.length} does not match --expected-item-count-chirho=${expectedItemCountChirho}`
      );
    }
    if (writeChirho) {
      assertExpectedItemIdsChirho(
        selectedItemsChirho.map((itemChirho) => itemChirho.idChirho),
        expectedItemIdsChirho
      );
    }
    assertReviewerRoleMatchesSelectedItemsChirho(selectedItemsChirho, reviewerRoleChirho);
    const blankItemsChirho = selectedItemsChirho
      .filter((itemChirho) => itemChirho.currentTextChirho.trim().length === 0)
      .map((itemChirho) => itemChirho.idChirho);
    if (blankItemsChirho.length !== 0) {
      throw new Error(
        `confirmed expert policy cannot certify blank currentTextChirho item(s): ${blankItemsChirho.join(", ")}; apply expert-supplied text first`
      );
    }
  }
  const nowChirho = new Date().toISOString();
  const policyChirho: VisionTierExpertConfirmationPolicyChirho = {
    policyIdChirho,
    decisionChirho,
    scopeChirho: `script=${scriptFiltersChirho.size === 0 ? "all-chirho" : [...scriptFiltersChirho].sort().join(",")}; ids=${idFiltersChirho.size === 0 ? "all-chirho" : [...idFiltersChirho].sort().join(",")}`,
    itemCountChirho: selectedItemsChirho.length,
    itemsChirho: selectedItemsChirho.map((itemChirho) => ({
      itemIdChirho: itemChirho.idChirho,
      scriptChirho: itemChirho.scriptChirho,
      visionSourceChirho: itemChirho.visionSourceChirho,
      currentTextChirho: itemChirho.currentTextChirho,
      currentTextHashChirho: hashTextChirho(itemChirho.currentTextChirho),
    })),
  };
  if (reviewerChirho.length !== 0) policyChirho.reviewerChirho = reviewerChirho;
  if (reviewerRoleChirho.length !== 0) policyChirho.reviewerRoleChirho = reviewerRoleChirho;
  if (rationaleChirho.length !== 0) policyChirho.rationaleChirho = rationaleChirho;
  if (decisionChirho === VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO) {
    policyChirho.confirmedAtChirho = nowChirho;
    policyChirho.certifyExactChirho = true;
  }

  if (!writeChirho) {
    console.log(JSON.stringify(policyChirho, null, 2));
    console.error(
      `[${MODULE_CHIRHO}] previewed ${selectedItemsChirho.length} item(s); add --write-chirho to merge into ${outPathChirho}`
    );
    console.error(
      `[${MODULE_CHIRHO}] write guard args: ${expectedItemGuardArgsChirho(selectedItemsChirho.map((itemChirho) => itemChirho.idChirho)).join(" ")}`
    );
    return;
  }

  const fileChirho = loadPolicyFileChirho(outPathChirho);
  fileChirho.schemaVersionChirho = 1;
  fileChirho.generatedAtChirho = nowChirho;
  fileChirho.policiesChirho = (fileChirho.policiesChirho ?? []).filter(
    (existingChirho) => existingChirho.policyIdChirho !== policyIdChirho
  );
  fileChirho.policiesChirho.push(policyChirho);
  writePolicyFileChirho(outPathChirho, fileChirho);
  console.log(`[${MODULE_CHIRHO}] wrote policy ${policyIdChirho} with ${selectedItemsChirho.length} item(s) to ${outPathChirho}`);
}

if (import.meta.main) mainChirho();
