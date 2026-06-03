// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Browser reviewer for non-Latin vision-tier expert confirmations.
 *
 * Confirmations write the existing exact-item, hash-anchored expert policy
 * artifact. Wrong or uncertain items should be skipped rather than confirmed.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";
import {
  expectedVisionTierReviewerRoleChirho,
  readVisionTierExpertConfirmationFileChirho,
  reviewerRoleMatchesScriptChirho,
  summarizeVisionTierExpertConfirmationsChirho,
  VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
  VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO,
  VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO,
  VISION_TIER_EXPERT_ISSUE_FLAGS_CHIRHO,
  VISION_TIER_EXPERT_ISSUE_FLAG_VALUES_CHIRHO,
  type VisionTierExpertConfirmationFileChirho,
  type VisionTierExpertConfirmationItemChirho,
  type VisionTierExpertConfirmationPolicyChirho,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";
import {
  VISION_TIER_EXPERT_SCRIPT_ORDER_CHIRHO,
  visionTierExpertLiveItemsChirho,
  type VisionTierExpertLiveItemChirho,
} from "./vision-tier-expert-live-items-chirho.ts";

const MODULE_CHIRHO = "vision-tier-expert-review-server-chirho";
const DEFAULT_PORT_CHIRHO = 8771;
const EXPERT_PACK_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho"
);
const EXPERT_PACK_MANIFEST_PATH_CHIRHO = join(EXPERT_PACK_DIR_CHIRHO, "manifest-chirho.json");

interface ExpertPackItemChirho {
  idChirho: string;
  reviewerChirho: string;
  scriptChirho: string;
  visionSourceChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  currentTextChirho: string;
  markdownPathChirho: string;
  priorityMatchChirho?: boolean;
}

interface ExpertPackManifestChirho {
  generatedAtChirho?: string;
  priorityItemsChirho?: unknown[];
  completeVisionItemsChirho?: ExpertPackItemChirho[];
}

interface ExpertReviewItemChirho extends ExpertPackItemChirho {
  confirmedChirho: boolean;
  issueReportedChirho: boolean;
  openIssueChirho: ExpertOpenIssueChirho | null;
}

interface ConfirmRequestChirho {
  idChirho?: string;
  reviewerChirho?: string;
  reviewerRoleChirho?: string;
  rationaleChirho?: string;
}

interface IssueRequestChirho extends ConfirmRequestChirho {
  issueFlagsChirho?: unknown;
}

interface ExpertOpenIssueChirho {
  policyIdChirho: string;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  reviewedAtChirho: string;
  rationaleChirho: string;
  issueFlagsChirho: string[];
}

const ISSUE_FLAG_OPTIONS_CHIRHO = [
  { valueChirho: "letters-chirho", labelChirho: "Letters" },
  { valueChirho: "marks-chirho", labelChirho: "Vowels/marks" },
  { valueChirho: "punctuation-chirho", labelChirho: "Punctuation" },
  { valueChirho: "segmentation-chirho", labelChirho: "Segmentation" },
  { valueChirho: "wrong-script-chirho", labelChirho: "Wrong script" },
  { valueChirho: "wrong-source-chirho", labelChirho: "Wrong source" },
  { valueChirho: "uncertain-chirho", labelChirho: "Uncertain" },
] as const satisfies Array<{ valueChirho: (typeof VISION_TIER_EXPERT_ISSUE_FLAGS_CHIRHO)[number]; labelChirho: string }>;

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function parsePortChirho(argsChirho: string[]): number {
  const valueChirho = parseArgValueChirho(argsChirho, "port");
  if (valueChirho === undefined) return DEFAULT_PORT_CHIRHO;
  const portChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(portChirho) || portChirho <= 0) throw new Error(`port must be positive; got ${valueChirho}`);
  return portChirho;
}

function jsonResponseChirho(dataChirho: unknown, statusChirho = 200): Response {
  return new Response(JSON.stringify(dataChirho), {
    status: statusChirho,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function scriptJsonChirho(valueChirho: unknown): string {
  return JSON.stringify(valueChirho)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function nonEmptyTrimmedChirho(valueChirho: unknown): string | null {
  if (typeof valueChirho !== "string") return null;
  const trimmedChirho = valueChirho.trim();
  return trimmedChirho.length === 0 ? null : trimmedChirho;
}

function reviewerRoleErrorChirho(itemChirho: VisionTierExpertLiveItemChirho, reviewerRoleChirho: string): string | null {
  if (reviewerRoleMatchesScriptChirho(itemChirho.scriptChirho, reviewerRoleChirho)) return null;
  const expectedRoleChirho = expectedVisionTierReviewerRoleChirho(itemChirho.scriptChirho);
  return `reviewerRoleChirho must be "${expectedRoleChirho ?? "<no-role-chirho>"}" for ${itemChirho.scriptChirho}`;
}

function parseIssueFlagsChirho(valueChirho: unknown): string[] {
  if (!Array.isArray(valueChirho)) return [];
  return valueChirho
    .filter((flagChirho): flagChirho is string => typeof flagChirho === "string")
    .filter((flagChirho) => VISION_TIER_EXPERT_ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho));
}

function slugChirho(valueChirho: string): string {
  return valueChirho
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadExpertPackManifestChirho(): ExpertPackManifestChirho {
  if (!existsSync(EXPERT_PACK_MANIFEST_PATH_CHIRHO)) {
    throw new Error(`Expert pack manifest missing: ${EXPERT_PACK_MANIFEST_PATH_CHIRHO}`);
  }
  const manifestChirho = JSON.parse(readFileSync(EXPERT_PACK_MANIFEST_PATH_CHIRHO, "utf8")) as ExpertPackManifestChirho;
  if (!Array.isArray(manifestChirho.completeVisionItemsChirho)) {
    throw new Error(`Expert pack manifest malformed: completeVisionItemsChirho missing`);
  }
  return manifestChirho;
}

function assertExpertPackMatchesLiveChirho(
  manifestChirho: ExpertPackManifestChirho,
  liveItemsChirho: VisionTierExpertLiveItemChirho[]
): Map<string, VisionTierExpertLiveItemChirho> {
  const packetItemsChirho = manifestChirho.completeVisionItemsChirho ?? [];
  const liveByIdChirho = new Map(liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho]));
  if (packetItemsChirho.length !== liveItemsChirho.length) {
    throw new Error(
      `Expert pack is stale: packet has ${packetItemsChirho.length} item(s), live state has ${liveItemsChirho.length}; regenerate make-expert-confirm-pack-chirho`
    );
  }
  for (const packetItemChirho of packetItemsChirho) {
    const liveItemChirho = liveByIdChirho.get(packetItemChirho.idChirho);
    if (liveItemChirho === undefined) {
      throw new Error(`Expert pack is stale: ${packetItemChirho.idChirho} is not present in live state; regenerate make-expert-confirm-pack-chirho`);
    }
    if (liveItemChirho.scriptChirho !== packetItemChirho.scriptChirho) {
      throw new Error(`Expert pack is stale: ${packetItemChirho.idChirho} script changed; regenerate make-expert-confirm-pack-chirho`);
    }
    if (liveItemChirho.visionSourceChirho !== packetItemChirho.visionSourceChirho) {
      throw new Error(`Expert pack is stale: ${packetItemChirho.idChirho} source changed; regenerate make-expert-confirm-pack-chirho`);
    }
    if (liveItemChirho.currentTextChirho !== packetItemChirho.currentTextChirho) {
      throw new Error(`Expert pack is stale: ${packetItemChirho.idChirho} text changed; regenerate make-expert-confirm-pack-chirho`);
    }
  }
  return liveByIdChirho;
}

function loadPolicyFileForWriteChirho(pathChirho: string): VisionTierExpertConfirmationFileChirho & Record<string, unknown> {
  if (!existsSync(pathChirho)) {
    return {
      john316Chirho:
        "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
      schemaVersionChirho: 1,
      generatedAtChirho: new Date().toISOString(),
      policiesChirho: [],
    };
  }
  return JSON.parse(readFileSync(pathChirho, "utf8")) as VisionTierExpertConfirmationFileChirho & Record<string, unknown>;
}

function writePolicyFileAtomicChirho(pathChirho: string, fileChirho: VisionTierExpertConfirmationFileChirho & Record<string, unknown>): void {
  mkdirSync(dirname(pathChirho), { recursive: true });
  const tempPathChirho = `${pathChirho}.tmp-${process.pid}-${Date.now()}-chirho`;
  writeFileSync(tempPathChirho, `${JSON.stringify(fileChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function policyIdForItemChirho(itemChirho: VisionTierExpertLiveItemChirho): string {
  return `expert-confirm-${slugChirho(itemChirho.idChirho)}-chirho`;
}

function issuePolicyIdForItemChirho(itemChirho: VisionTierExpertLiveItemChirho): string {
  return `expert-issue-${slugChirho(itemChirho.idChirho)}-chirho`;
}

function policyItemMatchesLiveChirho(
  itemChirho: VisionTierExpertConfirmationItemChirho,
  liveItemChirho: VisionTierExpertLiveItemChirho
): boolean {
  return liveItemChirho.scriptChirho === itemChirho.scriptChirho &&
    liveItemChirho.visionSourceChirho === itemChirho.visionSourceChirho &&
    liveItemChirho.currentTextChirho === itemChirho.currentTextChirho &&
    hashTextChirho(liveItemChirho.currentTextChirho) === itemChirho.currentTextHashChirho;
}

function openIssueDetailsByIdChirho(paramsChirho: {
  policyFileChirho: VisionTierExpertConfirmationFileChirho;
  reviewedIssueIdsChirho: Set<string>;
  liveByIdChirho: Map<string, VisionTierExpertLiveItemChirho>;
}): Map<string, ExpertOpenIssueChirho> {
  const detailsByIdChirho = new Map<string, ExpertOpenIssueChirho>();
  for (const policyChirho of paramsChirho.policyFileChirho.policiesChirho ?? []) {
    if (policyChirho.decisionChirho !== VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO) continue;
    if (
      typeof policyChirho.policyIdChirho !== "string" ||
      typeof policyChirho.reviewerChirho !== "string" ||
      typeof policyChirho.reviewerRoleChirho !== "string" ||
      typeof policyChirho.reviewedAtChirho !== "string" ||
      typeof policyChirho.rationaleChirho !== "string" ||
      !Array.isArray(policyChirho.issueFlagsChirho)
    ) {
      continue;
    }
    for (const itemChirho of policyChirho.itemsChirho ?? []) {
      const itemIdChirho = itemChirho.itemIdChirho;
      if (
        typeof itemIdChirho !== "string" ||
        !paramsChirho.reviewedIssueIdsChirho.has(itemIdChirho) ||
        detailsByIdChirho.has(itemIdChirho)
      ) {
        continue;
      }
      const liveItemChirho = paramsChirho.liveByIdChirho.get(itemIdChirho);
      if (liveItemChirho === undefined || !policyItemMatchesLiveChirho(itemChirho, liveItemChirho)) continue;
      detailsByIdChirho.set(itemIdChirho, {
        policyIdChirho: policyChirho.policyIdChirho,
        reviewerChirho: policyChirho.reviewerChirho,
        reviewerRoleChirho: policyChirho.reviewerRoleChirho,
        reviewedAtChirho: policyChirho.reviewedAtChirho,
        rationaleChirho: policyChirho.rationaleChirho,
        issueFlagsChirho: policyChirho.issueFlagsChirho.filter((flagChirho) => VISION_TIER_EXPERT_ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho)),
      });
    }
  }
  return detailsByIdChirho;
}

function confirmedPolicyForItemChirho(paramsChirho: {
  itemChirho: VisionTierExpertLiveItemChirho;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
}): VisionTierExpertConfirmationPolicyChirho {
  const itemChirho = paramsChirho.itemChirho;
  return {
    policyIdChirho: policyIdForItemChirho(itemChirho),
    decisionChirho: VISION_TIER_EXPERT_CONFIRMATION_CONFIRMED_CHIRHO,
    reviewerChirho: paramsChirho.reviewerChirho,
    reviewerRoleChirho: paramsChirho.reviewerRoleChirho,
    confirmedAtChirho: new Date().toISOString(),
    rationaleChirho: paramsChirho.rationaleChirho,
    scopeChirho: `id=${itemChirho.idChirho}; script=${itemChirho.scriptChirho}; visionSource=${itemChirho.visionSourceChirho}`,
    itemCountChirho: 1,
    itemsChirho: [
      {
        itemIdChirho: itemChirho.idChirho,
        scriptChirho: itemChirho.scriptChirho,
        visionSourceChirho: itemChirho.visionSourceChirho,
        currentTextChirho: itemChirho.currentTextChirho,
        currentTextHashChirho: hashTextChirho(itemChirho.currentTextChirho),
      },
    ],
  };
}

function reviewedIssuePolicyForItemChirho(paramsChirho: {
  itemChirho: VisionTierExpertLiveItemChirho;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
  issueFlagsChirho: string[];
}): VisionTierExpertConfirmationPolicyChirho {
  const itemChirho = paramsChirho.itemChirho;
  return {
    policyIdChirho: issuePolicyIdForItemChirho(itemChirho),
    decisionChirho: VISION_TIER_EXPERT_CONFIRMATION_REVIEWED_ISSUES_CHIRHO,
    reviewerChirho: paramsChirho.reviewerChirho,
    reviewerRoleChirho: paramsChirho.reviewerRoleChirho,
    reviewedAtChirho: new Date().toISOString(),
    rationaleChirho: paramsChirho.rationaleChirho,
    issueFlagsChirho: paramsChirho.issueFlagsChirho,
    scopeChirho: `id=${itemChirho.idChirho}; script=${itemChirho.scriptChirho}; visionSource=${itemChirho.visionSourceChirho}`,
    itemCountChirho: 1,
    itemsChirho: [
      {
        itemIdChirho: itemChirho.idChirho,
        scriptChirho: itemChirho.scriptChirho,
        visionSourceChirho: itemChirho.visionSourceChirho,
        currentTextChirho: itemChirho.currentTextChirho,
        currentTextHashChirho: hashTextChirho(itemChirho.currentTextChirho),
      },
    ],
  };
}

function saveConfirmationChirho(paramsChirho: {
  policyPathChirho: string;
  manifestChirho: ExpertPackManifestChirho;
  liveItemsChirho: VisionTierExpertLiveItemChirho[];
  liveItemChirho: VisionTierExpertLiveItemChirho;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
}): VisionTierExpertConfirmationPolicyChirho {
  assertExpertPackMatchesLiveChirho(paramsChirho.manifestChirho, paramsChirho.liveItemsChirho);
  const policyChirho = confirmedPolicyForItemChirho({
    itemChirho: paramsChirho.liveItemChirho,
    reviewerChirho: paramsChirho.reviewerChirho,
    reviewerRoleChirho: paramsChirho.reviewerRoleChirho,
    rationaleChirho: paramsChirho.rationaleChirho,
  });
  const fileChirho = loadPolicyFileForWriteChirho(paramsChirho.policyPathChirho);
  fileChirho.schemaVersionChirho = 1;
  fileChirho.generatedAtChirho = new Date().toISOString();
  const issuePolicyIdChirho = issuePolicyIdForItemChirho(paramsChirho.liveItemChirho);
  fileChirho.policiesChirho = (fileChirho.policiesChirho ?? []).filter(
    (existingChirho) =>
      existingChirho.policyIdChirho !== policyChirho.policyIdChirho &&
      existingChirho.policyIdChirho !== issuePolicyIdChirho
  );
  fileChirho.policiesChirho.push(policyChirho);
  writePolicyFileAtomicChirho(paramsChirho.policyPathChirho, fileChirho);
  return policyChirho;
}

function saveReviewedIssueChirho(paramsChirho: {
  policyPathChirho: string;
  manifestChirho: ExpertPackManifestChirho;
  liveItemsChirho: VisionTierExpertLiveItemChirho[];
  liveItemChirho: VisionTierExpertLiveItemChirho;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
  issueFlagsChirho: string[];
}): VisionTierExpertConfirmationPolicyChirho {
  assertExpertPackMatchesLiveChirho(paramsChirho.manifestChirho, paramsChirho.liveItemsChirho);
  const policyChirho = reviewedIssuePolicyForItemChirho({
    itemChirho: paramsChirho.liveItemChirho,
    reviewerChirho: paramsChirho.reviewerChirho,
    reviewerRoleChirho: paramsChirho.reviewerRoleChirho,
    rationaleChirho: paramsChirho.rationaleChirho,
    issueFlagsChirho: paramsChirho.issueFlagsChirho,
  });
  const fileChirho = loadPolicyFileForWriteChirho(paramsChirho.policyPathChirho);
  fileChirho.schemaVersionChirho = 1;
  fileChirho.generatedAtChirho = new Date().toISOString();
  const confirmationPolicyIdChirho = policyIdForItemChirho(paramsChirho.liveItemChirho);
  fileChirho.policiesChirho = (fileChirho.policiesChirho ?? []).filter(
    (existingChirho) =>
      existingChirho.policyIdChirho !== policyChirho.policyIdChirho &&
      existingChirho.policyIdChirho !== confirmationPolicyIdChirho
  );
  fileChirho.policiesChirho.push(policyChirho);
  writePolicyFileAtomicChirho(paramsChirho.policyPathChirho, fileChirho);
  return policyChirho;
}

function safeAssetPathChirho(relativePathChirho: string): string | null {
  const resolvedChirho = resolve(EXPERT_PACK_DIR_CHIRHO, relativePathChirho);
  const packRootChirho = resolve(EXPERT_PACK_DIR_CHIRHO);
  if (resolvedChirho !== packRootChirho && !resolvedChirho.startsWith(`${packRootChirho}/`)) return null;
  return resolvedChirho;
}

function loadCurrentStateChirho(policyPathChirho: string): {
  manifestChirho: ExpertPackManifestChirho;
  liveItemsChirho: VisionTierExpertLiveItemChirho[];
  liveByIdChirho: Map<string, VisionTierExpertLiveItemChirho>;
  confirmedIdsChirho: Set<string>;
  reviewedIssueIdsChirho: Set<string>;
  openIssueDetailsByIdChirho: Map<string, ExpertOpenIssueChirho>;
} {
  const manifestChirho = loadExpertPackManifestChirho();
  const liveItemsChirho = visionTierExpertLiveItemsChirho();
  const liveByIdChirho = assertExpertPackMatchesLiveChirho(manifestChirho, liveItemsChirho);
  const policyExistsChirho = existsSync(policyPathChirho);
  const policyFileChirho = readVisionTierExpertConfirmationFileChirho(policyPathChirho);
  const summaryChirho = summarizeVisionTierExpertConfirmationsChirho(policyFileChirho, policyExistsChirho, liveItemsChirho);
  const openIssueDetailsChirho = openIssueDetailsByIdChirho({
    policyFileChirho,
    reviewedIssueIdsChirho: summaryChirho.reviewedIssueItemIdsChirho,
    liveByIdChirho,
  });
  return {
    manifestChirho,
    liveItemsChirho,
    liveByIdChirho,
    confirmedIdsChirho: summaryChirho.confirmedItemIdsChirho,
    reviewedIssueIdsChirho: summaryChirho.reviewedIssueItemIdsChirho,
    openIssueDetailsByIdChirho: openIssueDetailsChirho,
  };
}

function reviewItemsForStateChirho(
  manifestChirho: ExpertPackManifestChirho,
  confirmedIdsChirho: Set<string>,
  reviewedIssueIdsChirho: Set<string>,
  openIssueDetailsByIdChirho: Map<string, ExpertOpenIssueChirho>
): ExpertReviewItemChirho[] {
  return (manifestChirho.completeVisionItemsChirho ?? []).map((itemChirho) => ({
    ...itemChirho,
    confirmedChirho: confirmedIdsChirho.has(itemChirho.idChirho),
    issueReportedChirho: reviewedIssueIdsChirho.has(itemChirho.idChirho),
    openIssueChirho: openIssueDetailsByIdChirho.get(itemChirho.idChirho) ?? null,
  }));
}

function htmlChirho(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vision-Tier Expert Review Chirho</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f6f5ef; color: #1f2933; }
    button, input, select, textarea { font: inherit; }
    .shell-chirho { max-width: 1240px; margin: 0 auto; padding: 18px; }
    .top-chirho { display: flex; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid #d8d4c8; padding-bottom: 12px; }
    .title-chirho { font-size: 20px; font-weight: 750; }
    .summary-chirho, .status-chirho { color: #59636f; font-size: 13px; }
    .toolbar-chirho { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .toolbar-chirho select, .toolbar-chirho button { border: 1px solid #aab1b9; background: white; min-height: 34px; padding: 5px 8px; }
    .main-chirho { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 18px; padding-top: 18px; }
    .image-label-chirho { color: #59636f; font-size: 13px; font-weight: 650; margin: 0 0 6px; }
    .image-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: auto; margin-bottom: 12px; }
    .line-image-chirho { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
    .text-box-chirho { background: white; border: 1px solid #d6d9dd; padding: 10px; line-height: 1.45; overflow-wrap: anywhere; }
    .current-text-chirho { font-size: 24px; direction: auto; }
    .side-chirho { display: flex; flex-direction: column; gap: 12px; }
    .box-chirho { border: 1px solid #d6d9dd; background: white; padding: 12px; }
    .meta-grid-chirho { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; font-size: 13px; }
    .label-chirho { color: #59636f; font-size: 13px; font-weight: 650; }
    .mono-chirho { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
    .input-grid-chirho { display: grid; gap: 8px; }
    .input-grid-chirho input, .input-grid-chirho textarea { width: 100%; box-sizing: border-box; border: 1px solid #b8bec7; padding: 8px; }
    .input-grid-chirho textarea { min-height: 76px; resize: vertical; }
    .issue-grid-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .issue-option-chirho { display: flex; gap: 7px; align-items: center; border: 1px solid #d6d9dd; padding: 8px; min-height: 38px; box-sizing: border-box; cursor: pointer; }
    .issue-option-chirho input { width: auto; margin: 0; }
    .issue-option-chirho:has(input:checked) { border-color: #bd7a1b; background: #fff7e8; }
    .actions-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .actions-chirho button, .toolbar-chirho button { border: 1px solid #aab1b9; background: white; padding: 10px; cursor: pointer; min-height: 42px; }
    .actions-chirho button:hover, .toolbar-chirho button:hover { background: #edf1f4; }
    .confirm-chirho { color: #116149; border-color: #499b7f !important; font-weight: 750; }
    .issue-chirho { color: #704000; border-color: #bd7a1b !important; font-weight: 750; }
    .warning-chirho { border-left: 4px solid #bd7a1b; background: #fff7e8; padding: 10px; font-size: 13px; color: #704000; }
    .done-chirho { padding: 42px 0; color: #59636f; font-size: 18px; }
    @media (max-width: 900px) {
      .main-chirho { grid-template-columns: 1fr; }
      .side-chirho { order: -1; }
    }
  </style>
</head>
<body>
  <main class="shell-chirho">
    <div class="top-chirho">
      <div>
        <div class="title-chirho">Vision-Tier Expert Review</div>
        <div class="summary-chirho" id="summary-chirho"></div>
      </div>
      <div class="status-chirho" id="status-chirho"></div>
    </div>
    <div class="toolbar-chirho">
      <label class="label-chirho" for="script-filter-chirho">Script</label>
      <select id="script-filter-chirho">
        <option value="all-chirho">All</option>
        ${VISION_TIER_EXPERT_SCRIPT_ORDER_CHIRHO.map((scriptChirho) => `<option value="${scriptChirho}">${scriptChirho}</option>`).join("")}
      </select>
      <label class="label-chirho" for="priority-filter-chirho">Priority</label>
      <select id="priority-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="priority-chirho">Priority</option>
        <option value="appendix-chirho">Appendix</option>
      </select>
      <button type="button" id="prev-chirho">Previous</button>
      <button type="button" id="next-chirho">Skip</button>
    </div>
    <section class="main-chirho" id="app-chirho"></section>
  </main>
  <script>
    const issueFlagOptionsChirho = ${scriptJsonChirho(ISSUE_FLAG_OPTIONS_CHIRHO)};
    let itemsChirho = [];
    let indexChirho = 0;
    const queryChirho = new URLSearchParams(window.location.search);
    let scriptFilterChirho = queryChirho.get("script-chirho") || "all-chirho";
    let priorityFilterChirho = queryChirho.get("priority-chirho") || "all-chirho";

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
    function setStatusChirho(messageChirho) { document.getElementById("status-chirho").textContent = messageChirho; }
    function selectHasValueChirho(idChirho, valueChirho) {
      return [...document.getElementById(idChirho).options].some((optionChirho) => optionChirho.value === valueChirho);
    }
    if (!selectHasValueChirho("script-filter-chirho", scriptFilterChirho)) scriptFilterChirho = "all-chirho";
    if (!selectHasValueChirho("priority-filter-chirho", priorityFilterChirho)) priorityFilterChirho = "all-chirho";
    document.getElementById("script-filter-chirho").value = scriptFilterChirho;
    document.getElementById("priority-filter-chirho").value = priorityFilterChirho;
    function activeItemsChirho() {
      return itemsChirho.filter((itemChirho) =>
        !itemChirho.confirmedChirho &&
        (scriptFilterChirho === "all-chirho" || itemChirho.scriptChirho === scriptFilterChirho) &&
        (priorityFilterChirho === "all-chirho" ||
          (priorityFilterChirho === "priority-chirho" && itemChirho.priorityMatchChirho) ||
          (priorityFilterChirho === "appendix-chirho" && !itemChirho.priorityMatchChirho))
      );
    }
    function currentItemChirho() { return activeItemsChirho()[indexChirho]; }
    function imageSrcChirho(pathChirho) { return "/asset-chirho?path=" + encodeURIComponent(pathChirho); }
    function fieldValueChirho(idChirho) { return document.getElementById(idChirho)?.value ?? ""; }
    function reviewerRoleValueChirho(itemChirho) {
      const savedRoleChirho = localStorage.getItem("expertReviewerRoleChirho") || "";
      return savedRoleChirho === itemChirho.reviewerChirho ? savedRoleChirho : itemChirho.reviewerChirho;
    }
    function saveReviewerFieldsChirho() {
      localStorage.setItem("expertReviewerChirho", fieldValueChirho("reviewer-chirho"));
      localStorage.setItem("expertReviewerRoleChirho", fieldValueChirho("reviewer-role-chirho"));
      localStorage.setItem("expertRationaleChirho", fieldValueChirho("rationale-chirho"));
    }
    async function loadStateChirho() {
      const responseChirho = await fetch("/api-chirho/state-chirho");
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) throw new Error(dataChirho.errorChirho || "state failed");
      itemsChirho = dataChirho.itemsChirho;
      if (indexChirho >= activeItemsChirho().length) indexChirho = Math.max(0, activeItemsChirho().length - 1);
      renderChirho();
    }
    function renderSummaryChirho() {
      const activeChirho = activeItemsChirho().length;
      const confirmedChirho = itemsChirho.filter((itemChirho) => itemChirho.confirmedChirho).length;
      const issueReportedChirho = itemsChirho.filter((itemChirho) => itemChirho.issueReportedChirho).length;
      document.getElementById("summary-chirho").textContent =
        activeChirho + " pending in filter, " + confirmedChirho + " confirmed, " + issueReportedChirho + " issue-reported, " + itemsChirho.length + " total";
    }
    function renderChirho() {
      const appChirho = document.getElementById("app-chirho");
      clearChirho(appChirho);
      renderSummaryChirho();
      const itemChirho = currentItemChirho();
      if (!itemChirho) {
        appChirho.appendChild(elChirho("div", { classChirho: "done-chirho", textChirho: "No pending items in this filter." }));
        return;
      }
      const leftChirho = elChirho("div");
      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Printed line" }));
      const imageWrapChirho = elChirho("div", { classChirho: "image-wrap-chirho" });
      imageWrapChirho.appendChild(elChirho("img", { classChirho: "line-image-chirho", src: imageSrcChirho(itemChirho.markdownPathChirho), alt: "" }));
      leftChirho.appendChild(imageWrapChirho);
      leftChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Current text" }));
      leftChirho.appendChild(elChirho("div", { classChirho: "text-box-chirho current-text-chirho", textChirho: itemChirho.currentTextChirho }));

      const sideChirho = elChirho("div", { classChirho: "side-chirho" });
      const metaChirho = elChirho("div", { classChirho: "box-chirho" });
      const metaGridChirho = elChirho("div", { classChirho: "meta-grid-chirho" });
      for (const [labelChirho, valueChirho] of [
        ["ID", itemChirho.idChirho],
        ["Location", "vol " + itemChirho.volumeChirho + " p" + itemChirho.pageChirho + " L" + itemChirho.lineIndexChirho + " S" + itemChirho.segmentIndexChirho],
        ["Script", itemChirho.scriptChirho],
        ["Reviewer", itemChirho.reviewerChirho],
        ["Source", itemChirho.visionSourceChirho],
        ["Priority", itemChirho.priorityMatchChirho ? "yes" : "no"],
        ["Issue reported", itemChirho.issueReportedChirho ? "yes" : "no"]
      ]) {
        metaGridChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: labelChirho }));
        metaGridChirho.appendChild(elChirho("div", { classChirho: "mono-chirho", textChirho: valueChirho }));
      }
      metaChirho.appendChild(metaGridChirho);
      sideChirho.appendChild(metaChirho);
      if (itemChirho.openIssueChirho) {
        const issueBoxChirho = elChirho("div", { classChirho: "box-chirho" });
        issueBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Open issue" }));
        const issueMetaChirho = elChirho("div", { classChirho: "meta-grid-chirho" });
        for (const [labelChirho, valueChirho] of [
          ["Policy", itemChirho.openIssueChirho.policyIdChirho],
          ["Reviewer", itemChirho.openIssueChirho.reviewerChirho],
          ["Role", itemChirho.openIssueChirho.reviewerRoleChirho],
          ["Reviewed", itemChirho.openIssueChirho.reviewedAtChirho],
          ["Flags", itemChirho.openIssueChirho.issueFlagsChirho.join(", ")]
        ]) {
          issueMetaChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: labelChirho }));
          issueMetaChirho.appendChild(elChirho("div", { classChirho: "mono-chirho", textChirho: valueChirho }));
        }
        issueBoxChirho.appendChild(issueMetaChirho);
        issueBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Rationale" }));
        issueBoxChirho.appendChild(elChirho("div", { classChirho: "text-box-chirho", textChirho: itemChirho.openIssueChirho.rationaleChirho }));
        sideChirho.appendChild(issueBoxChirho);
      }
      sideChirho.appendChild(elChirho("div", {
        classChirho: "warning-chirho",
        textChirho: "Confirm only if you can certify this script's exact letters and relevant marks against the printed line. If this is outside your competence or uncertain, use Skip."
      }));

      const formChirho = elChirho("div", { classChirho: "box-chirho input-grid-chirho" });
      formChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "reviewer-chirho", textChirho: "Reviewer" }));
      formChirho.appendChild(elChirho("input", { id: "reviewer-chirho", value: localStorage.getItem("expertReviewerChirho") || "" }));
      formChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "reviewer-role-chirho", textChirho: "Role" }));
      formChirho.appendChild(elChirho("input", { id: "reviewer-role-chirho", value: reviewerRoleValueChirho(itemChirho) }));
      formChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "rationale-chirho", textChirho: "Rationale" }));
      formChirho.appendChild(elChirho("textarea", { id: "rationale-chirho", textChirho: localStorage.getItem("expertRationaleChirho") || "" }));
      formChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Issue flags" }));
      const issueGridChirho = elChirho("div", { classChirho: "issue-grid-chirho" });
      for (const optionChirho of issueFlagOptionsChirho) {
        const inputChirho = elChirho("input", { type: "checkbox", value: optionChirho.valueChirho });
        const labelChirho = elChirho("label", { classChirho: "issue-option-chirho" }, [inputChirho, document.createTextNode(optionChirho.labelChirho)]);
        issueGridChirho.appendChild(labelChirho);
      }
      formChirho.appendChild(issueGridChirho);
      const actionsChirho = elChirho("div", { classChirho: "actions-chirho" });
      const confirmChirho = elChirho("button", { classChirho: "confirm-chirho", type: "button", textChirho: "Confirm" });
      confirmChirho.addEventListener("click", () => confirmCurrentChirho(itemChirho));
      const issueChirho = elChirho("button", { classChirho: "issue-chirho", type: "button", textChirho: "Report issue" });
      issueChirho.addEventListener("click", () => reportIssueCurrentChirho(itemChirho));
      const skipChirho = elChirho("button", { type: "button", textChirho: "Skip" });
      skipChirho.addEventListener("click", () => { indexChirho = Math.min(indexChirho + 1, Math.max(0, activeItemsChirho().length - 1)); renderChirho(); });
      actionsChirho.appendChild(confirmChirho);
      actionsChirho.appendChild(issueChirho);
      actionsChirho.appendChild(skipChirho);
      formChirho.appendChild(actionsChirho);
      sideChirho.appendChild(formChirho);
      appChirho.appendChild(leftChirho);
      appChirho.appendChild(sideChirho);
    }
    async function confirmCurrentChirho(itemChirho) {
      saveReviewerFieldsChirho();
      setStatusChirho("Saving...");
      const responseChirho = await fetch("/api-chirho/confirm-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idChirho: itemChirho.idChirho,
          reviewerChirho: fieldValueChirho("reviewer-chirho"),
          reviewerRoleChirho: fieldValueChirho("reviewer-role-chirho"),
          rationaleChirho: fieldValueChirho("rationale-chirho")
        })
      });
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) {
        setStatusChirho(dataChirho.errorChirho || "Save failed");
        return;
      }
      itemChirho.confirmedChirho = true;
      if (indexChirho >= activeItemsChirho().length) indexChirho = Math.max(0, activeItemsChirho().length - 1);
      setStatusChirho("Confirmed " + dataChirho.policyChirho.policyIdChirho);
      renderChirho();
    }
    async function reportIssueCurrentChirho(itemChirho) {
      const flagsChirho = [...document.querySelectorAll(".issue-option-chirho input:checked")].map((nodeChirho) => nodeChirho.value);
      saveReviewerFieldsChirho();
      setStatusChirho("Saving issue...");
      const responseChirho = await fetch("/api-chirho/issue-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idChirho: itemChirho.idChirho,
          reviewerChirho: fieldValueChirho("reviewer-chirho"),
          reviewerRoleChirho: fieldValueChirho("reviewer-role-chirho"),
          rationaleChirho: fieldValueChirho("rationale-chirho"),
          issueFlagsChirho: flagsChirho
        })
      });
      const dataChirho = await responseChirho.json();
      if (!dataChirho.okChirho) {
        setStatusChirho(dataChirho.errorChirho || "Save failed");
        return;
      }
      itemChirho.issueReportedChirho = true;
      indexChirho = Math.min(indexChirho + 1, Math.max(0, activeItemsChirho().length - 1));
      setStatusChirho("Recorded issue " + dataChirho.policyChirho.policyIdChirho + "; item remains pending until corrected/confirmed.");
      renderChirho();
    }
    document.getElementById("script-filter-chirho").addEventListener("change", (eventChirho) => {
      scriptFilterChirho = eventChirho.target.value;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("priority-filter-chirho").addEventListener("change", (eventChirho) => {
      priorityFilterChirho = eventChirho.target.value;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("prev-chirho").addEventListener("click", () => {
      indexChirho = Math.max(0, indexChirho - 1);
      renderChirho();
    });
    document.getElementById("next-chirho").addEventListener("click", () => {
      indexChirho = Math.min(indexChirho + 1, Math.max(0, activeItemsChirho().length - 1));
      renderChirho();
    });
    loadStateChirho().catch((errorChirho) => setStatusChirho(String(errorChirho)));
  </script>
</body>
</html>`;
}

const argsChirho = process.argv.slice(2);
const portChirho = parsePortChirho(argsChirho);
const policyPathChirho = parseArgValueChirho(argsChirho, "policy") ?? VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO;

Bun.serve({
  port: portChirho,
  async fetch(reqChirho) {
    const urlChirho = new URL(reqChirho.url);
    try {
      if (urlChirho.pathname === "/") {
        return new Response(htmlChirho(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      if (urlChirho.pathname === "/asset-chirho") {
        const relativePathChirho = urlChirho.searchParams.get("path");
        if (!relativePathChirho) return new Response("missing path", { status: 400 });
        const assetPathChirho = safeAssetPathChirho(relativePathChirho);
        if (assetPathChirho === null || !existsSync(assetPathChirho)) return new Response("not found", { status: 404 });
        return new Response(Bun.file(assetPathChirho));
      }
      if (urlChirho.pathname === "/api-chirho/state-chirho") {
        const { manifestChirho, confirmedIdsChirho, reviewedIssueIdsChirho, openIssueDetailsByIdChirho } = loadCurrentStateChirho(policyPathChirho);
        return jsonResponseChirho({
          okChirho: true,
          generatedAtChirho: manifestChirho.generatedAtChirho ?? null,
          itemsChirho: reviewItemsForStateChirho(
            manifestChirho,
            confirmedIdsChirho,
            reviewedIssueIdsChirho,
            openIssueDetailsByIdChirho
          ),
        });
      }
      if (urlChirho.pathname === "/api-chirho/confirm-chirho" && reqChirho.method === "POST") {
        const bodyChirho = (await reqChirho.json()) as ConfirmRequestChirho;
        const itemIdChirho = nonEmptyTrimmedChirho(bodyChirho.idChirho);
        const reviewerChirho = nonEmptyTrimmedChirho(bodyChirho.reviewerChirho);
        const reviewerRoleChirho = nonEmptyTrimmedChirho(bodyChirho.reviewerRoleChirho);
        const rationaleChirho = nonEmptyTrimmedChirho(bodyChirho.rationaleChirho);
        if (itemIdChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "missing idChirho" }, 400);
        if (reviewerChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
        if (reviewerRoleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerRoleChirho is required" }, 400);
        if (rationaleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "rationaleChirho is required" }, 400);
        const { manifestChirho, liveItemsChirho, liveByIdChirho } = loadCurrentStateChirho(policyPathChirho);
        const liveItemChirho = liveByIdChirho.get(itemIdChirho);
        if (liveItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown item" }, 404);
        const roleErrorChirho = reviewerRoleErrorChirho(liveItemChirho, reviewerRoleChirho);
        if (roleErrorChirho !== null) return jsonResponseChirho({ okChirho: false, errorChirho: roleErrorChirho }, 400);
        const policyChirho = saveConfirmationChirho({
          policyPathChirho,
          manifestChirho,
          liveItemsChirho,
          liveItemChirho,
          reviewerChirho,
          reviewerRoleChirho,
          rationaleChirho,
        });
        return jsonResponseChirho({ okChirho: true, policyChirho });
      }
      if (urlChirho.pathname === "/api-chirho/issue-chirho" && reqChirho.method === "POST") {
        const bodyChirho = (await reqChirho.json()) as IssueRequestChirho;
        const itemIdChirho = nonEmptyTrimmedChirho(bodyChirho.idChirho);
        const reviewerChirho = nonEmptyTrimmedChirho(bodyChirho.reviewerChirho);
        const reviewerRoleChirho = nonEmptyTrimmedChirho(bodyChirho.reviewerRoleChirho);
        const rationaleChirho = nonEmptyTrimmedChirho(bodyChirho.rationaleChirho);
        const issueFlagsChirho = parseIssueFlagsChirho(bodyChirho.issueFlagsChirho);
        if (itemIdChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "missing idChirho" }, 400);
        if (reviewerChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
        if (reviewerRoleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerRoleChirho is required" }, 400);
        if (rationaleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "rationaleChirho is required" }, 400);
        if (issueFlagsChirho.length === 0) return jsonResponseChirho({ okChirho: false, errorChirho: "at least one issue flag is required" }, 400);
        const { manifestChirho, liveItemsChirho, liveByIdChirho } = loadCurrentStateChirho(policyPathChirho);
        const liveItemChirho = liveByIdChirho.get(itemIdChirho);
        if (liveItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown item" }, 404);
        const roleErrorChirho = reviewerRoleErrorChirho(liveItemChirho, reviewerRoleChirho);
        if (roleErrorChirho !== null) return jsonResponseChirho({ okChirho: false, errorChirho: roleErrorChirho }, 400);
        const policyChirho = saveReviewedIssueChirho({
          policyPathChirho,
          manifestChirho,
          liveItemsChirho,
          liveItemChirho,
          reviewerChirho,
          reviewerRoleChirho,
          rationaleChirho,
          issueFlagsChirho,
        });
        return jsonResponseChirho({ okChirho: true, policyChirho });
      }
      return new Response("not found", { status: 404 });
    } catch (errorChirho) {
      return jsonResponseChirho({ okChirho: false, errorChirho: String(errorChirho) }, 500);
    }
  },
});

console.log(`[${MODULE_CHIRHO}] http://localhost:${portChirho}/`);
