// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Browser reviewer for non-Latin vision-tier expert confirmations.
 *
 * Confirmations write the existing exact-item, hash-anchored expert policy
 * artifact. Wrong or uncertain items should be skipped rather than confirmed.
 */

import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  certifyingReviewerAttributionErrorChirho,
  explicitReviewerAttributionErrorChirho,
  GENERIC_REVIEWER_IDS_CHIRHO,
  MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO,
  MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO,
  REVIEWER_TEMPLATE_PLACEHOLDER_RE_FLAGS_CHIRHO,
  REVIEWER_TEMPLATE_PLACEHOLDER_RE_SOURCE_CHIRHO,
} from "./reviewer-attribution-chirho.ts";
import { reviewServerStartupHealthChirho } from "./review-server-health-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";
import {
  EXPERT_MARKDOWN_PATH_PAIRS_CHIRHO,
  packetMarkdownPathDriftsChirho,
} from "./packet-image-fingerprint-chirho.ts";
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
  VISION_TIER_EXPERT_RATIONALE_PLACEHOLDER_VALUES_CHIRHO,
  visionTierExpertRationaleLooksPlaceholderChirho,
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
const SERVER_HEALTH_CHIRHO = reviewServerStartupHealthChirho("expert-non-latin-chirho");
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
  sourcePathChirho: string;
  packetPathChirho: string;
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
  textIsBlankChirho: boolean;
}

interface ConfirmRequestChirho {
  idChirho?: string;
  reviewerChirho?: string;
  reviewerRoleChirho?: string;
  rationaleChirho?: string;
  certifyExactChirho?: boolean;
  expectedScriptChirho?: string;
  expectedReviewerChirho?: string;
  expectedVisionSourceChirho?: string;
  expectedCurrentTextChirho?: string;
  expectedSourcePathChirho?: string;
  expectedPacketPathChirho?: string;
  expectedMarkdownPathChirho?: string;
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
  if (!Array.isArray(valueChirho)) {
    throw new Error("issueFlagsChirho must be an array");
  }
  const flagsChirho: string[] = [];
  for (const flagChirho of valueChirho) {
    if (typeof flagChirho !== "string" || !VISION_TIER_EXPERT_ISSUE_FLAG_VALUES_CHIRHO.has(flagChirho)) {
      throw new Error(`unsupported issue flag: ${String(flagChirho)}`);
    }
    if (!flagsChirho.includes(flagChirho)) flagsChirho.push(flagChirho);
  }
  return flagsChirho;
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
    if (
      typeof packetItemChirho.sourcePathChirho !== "string" ||
      typeof packetItemChirho.packetPathChirho !== "string" ||
      typeof packetItemChirho.markdownPathChirho !== "string"
    ) {
      throw new Error(`Expert pack manifest malformed: ${packetItemChirho.idChirho} image path fields missing; regenerate make-expert-confirm-pack-chirho`);
    }
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
    if (!existsSync(packetItemChirho.sourcePathChirho)) {
      throw new Error(`Expert pack is stale: ${packetItemChirho.idChirho} source image missing; regenerate make-expert-confirm-pack-chirho`);
    }
    if (!existsSync(packetItemChirho.packetPathChirho)) {
      throw new Error(`Expert pack is stale: ${packetItemChirho.idChirho} packet image missing; regenerate make-expert-confirm-pack-chirho`);
    }
    if (!readFileSync(packetItemChirho.sourcePathChirho).equals(readFileSync(packetItemChirho.packetPathChirho))) {
      throw new Error(`Expert pack is stale: ${packetItemChirho.idChirho} packet image differs from source scanline; regenerate make-expert-confirm-pack-chirho`);
    }
  }
  const markdownPathDriftsChirho = packetMarkdownPathDriftsChirho(
    packetItemsChirho,
    EXPERT_PACK_DIR_CHIRHO,
    EXPERT_MARKDOWN_PATH_PAIRS_CHIRHO
  );
  if (markdownPathDriftsChirho.length !== 0) {
    throw new Error(
      `Expert pack is stale: ${markdownPathDriftsChirho.length} markdown image path drift(s); regenerate make-expert-confirm-pack-chirho`
    );
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
  writeJsonAtomicChirho(pathChirho, fileChirho);
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
    certifyExactChirho: true,
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
    textIsBlankChirho: itemChirho.currentTextChirho.trim().length === 0,
  }));
}

function staleDisplayMismatchChirho(
  requestChirho: ConfirmRequestChirho,
  packetItemChirho: ExpertPackItemChirho
): string | null {
  const comparisonsChirho = [
    ["expectedScriptChirho", packetItemChirho.scriptChirho],
    ["expectedReviewerChirho", packetItemChirho.reviewerChirho],
    ["expectedVisionSourceChirho", packetItemChirho.visionSourceChirho],
    ["expectedCurrentTextChirho", packetItemChirho.currentTextChirho],
    ["expectedSourcePathChirho", packetItemChirho.sourcePathChirho],
    ["expectedPacketPathChirho", packetItemChirho.packetPathChirho],
    ["expectedMarkdownPathChirho", packetItemChirho.markdownPathChirho],
  ] as const;
  for (const [fieldChirho, currentValueChirho] of comparisonsChirho) {
    const submittedValueChirho = requestChirho[fieldChirho];
    if (typeof submittedValueChirho !== "string") return `${fieldChirho} is missing`;
    if (submittedValueChirho !== currentValueChirho) return `${fieldChirho} no longer matches current packet`;
  }
  return null;
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
    .codepoints-chirho { direction: ltr; white-space: pre-wrap; font-size: 12px; color: #3d4650; }
    .input-grid-chirho { display: grid; gap: 8px; }
    .input-grid-chirho input, .input-grid-chirho textarea { width: 100%; box-sizing: border-box; border: 1px solid #b8bec7; padding: 8px; }
    .input-grid-chirho textarea { min-height: 76px; resize: vertical; }
    .issue-grid-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .issue-option-chirho { display: flex; gap: 7px; align-items: center; border: 1px solid #d6d9dd; padding: 8px; min-height: 38px; box-sizing: border-box; cursor: pointer; }
    .issue-option-chirho input { width: auto; margin: 0; }
    .issue-option-chirho:has(input:checked) { border-color: #bd7a1b; background: #fff7e8; }
    .certify-option-chirho { display: flex; gap: 8px; align-items: flex-start; border: 1px solid #b8d5ca; background: #f2fbf7; padding: 10px; font-size: 13px; line-height: 1.35; cursor: pointer; }
    .certify-option-chirho input { width: auto; margin: 3px 0 0; }
    .actions-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .actions-chirho button, .toolbar-chirho button { border: 1px solid #aab1b9; background: white; padding: 10px; cursor: pointer; min-height: 42px; }
    .actions-chirho button:hover, .toolbar-chirho button:hover { background: #edf1f4; }
    .actions-chirho button:disabled, .actions-chirho button:disabled:hover { color: #8a9199; border-color: #cfd4d9 !important; background: #f0f2f4; cursor: not-allowed; }
    .confirm-chirho { color: #116149; border-color: #499b7f !important; font-weight: 750; }
    .issue-chirho { color: #704000; border-color: #bd7a1b !important; font-weight: 750; }
    .warning-chirho { border-left: 4px solid #bd7a1b; background: #fff7e8; padding: 10px; font-size: 13px; color: #704000; }
    .command-chirho { white-space: pre-wrap; overflow-wrap: anywhere; background: #f5f6f7; border: 1px solid #d6d9dd; padding: 10px; font-size: 12px; line-height: 1.35; }
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
      <label class="label-chirho" for="volume-filter-chirho">Volume</label>
      <select id="volume-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="vol-1-chirho">Vol 1</option>
        <option value="vol-2-chirho">Vol 2</option>
        <option value="vol-3-chirho">Vol 3</option>
        <option value="vol-4-chirho">Vol 4</option>
        <option value="vol-5-chirho">Vol 5</option>
      </select>
      <label class="label-chirho" for="text-state-filter-chirho">Text</label>
      <select id="text-state-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="nonblank-chirho">Has text</option>
        <option value="blank-chirho">Blank</option>
      </select>
      <button type="button" id="prev-chirho">Previous</button>
      <button type="button" id="next-chirho">Skip</button>
      <button type="button" id="copy-link-chirho">Copy link</button>
    </div>
    <section class="main-chirho" id="app-chirho"></section>
  </main>
  <script>
    const issueFlagOptionsChirho = ${scriptJsonChirho(ISSUE_FLAG_OPTIONS_CHIRHO)};
    const genericReviewerIdsChirho = new Set(${scriptJsonChirho([...GENERIC_REVIEWER_IDS_CHIRHO])});
    const machineReviewerIdReChirho = new RegExp(
      ${scriptJsonChirho(MACHINE_REVIEWER_ID_RE_SOURCE_CHIRHO)},
      ${scriptJsonChirho(MACHINE_REVIEWER_ID_RE_FLAGS_CHIRHO)}
    );
    const reviewerTemplatePlaceholderReChirho = new RegExp(
      ${scriptJsonChirho(REVIEWER_TEMPLATE_PLACEHOLDER_RE_SOURCE_CHIRHO)},
      ${scriptJsonChirho(REVIEWER_TEMPLATE_PLACEHOLDER_RE_FLAGS_CHIRHO)}
    );
    const rationalePlaceholderValuesChirho = new Set(${scriptJsonChirho([...VISION_TIER_EXPERT_RATIONALE_PLACEHOLDER_VALUES_CHIRHO])});
    let itemsChirho = [];
    let indexChirho = 0;
    const queryChirho = new URLSearchParams(window.location.search);
    let scriptFilterChirho = queryChirho.get("script-chirho") || "all-chirho";
    let priorityFilterChirho = queryChirho.get("priority-chirho") || "all-chirho";
    let volumeFilterChirho = queryChirho.get("volume-chirho") || "all-chirho";
    let textStateFilterChirho = queryChirho.get("text-state-chirho") || "all-chirho";
    let requestedItemIdChirho = queryChirho.get("item-chirho");

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
    function currentPositionTextChirho(activeCountChirho) {
      return activeCountChirho === 0 ? "item 0 of 0" : "item " + (indexChirho + 1) + " of " + activeCountChirho;
    }
    async function copyCurrentLinkChirho() {
      const linkChirho = window.location.href;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(linkChirho);
        setStatusChirho("Copied current item link");
      } catch (_errorChirho) {
        const textareaChirho = document.createElement("textarea");
        textareaChirho.value = linkChirho;
        textareaChirho.style.position = "fixed";
        textareaChirho.style.left = "-9999px";
        document.body.appendChild(textareaChirho);
        textareaChirho.select();
        const copiedChirho = document.execCommand("copy");
        textareaChirho.remove();
        setStatusChirho(copiedChirho ? "Copied current item link" : "Copy failed; URL bar already has current item link");
      }
    }
    function selectHasValueChirho(idChirho, valueChirho) {
      return [...document.getElementById(idChirho).options].some((optionChirho) => optionChirho.value === valueChirho);
    }
    if (!selectHasValueChirho("script-filter-chirho", scriptFilterChirho)) scriptFilterChirho = "all-chirho";
    if (!selectHasValueChirho("priority-filter-chirho", priorityFilterChirho)) priorityFilterChirho = "all-chirho";
    if (!selectHasValueChirho("volume-filter-chirho", volumeFilterChirho)) volumeFilterChirho = "all-chirho";
    if (!selectHasValueChirho("text-state-filter-chirho", textStateFilterChirho)) textStateFilterChirho = "all-chirho";
    function syncFilterControlsChirho() {
      document.getElementById("script-filter-chirho").value = scriptFilterChirho;
      document.getElementById("priority-filter-chirho").value = priorityFilterChirho;
      document.getElementById("volume-filter-chirho").value = volumeFilterChirho;
      document.getElementById("text-state-filter-chirho").value = textStateFilterChirho;
    }
    function volumeFilterNumberChirho() {
      if (volumeFilterChirho === "all-chirho") return null;
      const matchChirho = volumeFilterChirho.match(/^vol-(\\d+)-chirho$/);
      return matchChirho ? Number.parseInt(matchChirho[1], 10) : null;
    }
    function syncUrlChirho() {
      const paramsChirho = new URLSearchParams();
      if (scriptFilterChirho !== "all-chirho") paramsChirho.set("script-chirho", scriptFilterChirho);
      if (priorityFilterChirho !== "all-chirho") paramsChirho.set("priority-chirho", priorityFilterChirho);
      if (volumeFilterChirho !== "all-chirho") paramsChirho.set("volume-chirho", volumeFilterChirho);
      if (textStateFilterChirho !== "all-chirho") paramsChirho.set("text-state-chirho", textStateFilterChirho);
      const itemChirho = currentItemChirho();
      if (itemChirho) paramsChirho.set("item-chirho", itemChirho.idChirho);
      const queryStringChirho = paramsChirho.toString();
      window.history.replaceState(null, "", queryStringChirho ? window.location.pathname + "?" + queryStringChirho : window.location.pathname);
    }
    function itemMatchesTextStateChirho(itemChirho) {
      if (textStateFilterChirho === "all-chirho") return true;
      const blankChirho = itemTextIsBlankChirho(itemChirho);
      return textStateFilterChirho === "blank-chirho" ? blankChirho : !blankChirho;
    }
    function activeItemsChirho() {
      const volumeChirho = volumeFilterNumberChirho();
      return itemsChirho.filter((itemChirho) =>
        !itemChirho.confirmedChirho &&
        (scriptFilterChirho === "all-chirho" || itemChirho.scriptChirho === scriptFilterChirho) &&
        (priorityFilterChirho === "all-chirho" ||
          (priorityFilterChirho === "priority-chirho" && itemChirho.priorityMatchChirho) ||
          (priorityFilterChirho === "appendix-chirho" && !itemChirho.priorityMatchChirho)) &&
        (volumeChirho === null || itemChirho.volumeChirho === volumeChirho) &&
        itemMatchesTextStateChirho(itemChirho)
      );
    }
    function activeIndexForItemIdChirho(itemIdChirho) {
      if (typeof itemIdChirho !== "string" || itemIdChirho.length === 0) return -1;
      return activeItemsChirho().findIndex((itemChirho) => itemChirho.idChirho === itemIdChirho);
    }
    function applyRequestedItemIdChirho() {
      let requestedIndexChirho = activeIndexForItemIdChirho(requestedItemIdChirho);
      const requestedItemChirho = itemsChirho.find((itemChirho) => itemChirho.idChirho === requestedItemIdChirho);
      if (requestedIndexChirho < 0 && requestedItemChirho) {
        let changedFiltersChirho = false;
        const volumeChirho = volumeFilterNumberChirho();
        if (scriptFilterChirho !== "all-chirho" && requestedItemChirho.scriptChirho !== scriptFilterChirho) {
          scriptFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (
          priorityFilterChirho !== "all-chirho" &&
          (
            (priorityFilterChirho === "priority-chirho" && !requestedItemChirho.priorityMatchChirho) ||
            (priorityFilterChirho === "appendix-chirho" && requestedItemChirho.priorityMatchChirho)
          )
        ) {
          priorityFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (volumeChirho !== null && requestedItemChirho.volumeChirho !== volumeChirho) {
          volumeFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (textStateFilterChirho !== "all-chirho" && !itemMatchesTextStateChirho(requestedItemChirho)) {
          textStateFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (changedFiltersChirho) syncFilterControlsChirho();
        requestedIndexChirho = activeIndexForItemIdChirho(requestedItemIdChirho);
      }
      if (requestedIndexChirho >= 0) indexChirho = requestedIndexChirho;
      requestedItemIdChirho = null;
    }
    function currentItemChirho() { return activeItemsChirho()[indexChirho]; }
    function imageSrcChirho(pathChirho) { return "/asset-chirho?path=" + encodeURIComponent(pathChirho); }
    function fieldValueChirho(idChirho) { return document.getElementById(idChirho)?.value ?? ""; }
    const hebrewBaseLetterNameByValueChirho = new Map([
      ["א", "Hebrew letter alef"],
      ["ב", "Hebrew letter bet"],
      ["ג", "Hebrew letter gimel"],
      ["ד", "Hebrew letter dalet"],
      ["ה", "Hebrew letter he"],
      ["ו", "Hebrew letter vav"],
      ["ז", "Hebrew letter zayin"],
      ["ח", "Hebrew letter het"],
      ["ט", "Hebrew letter tet"],
      ["י", "Hebrew letter yod"],
      ["ך", "Hebrew letter final kaf"],
      ["כ", "Hebrew letter kaf"],
      ["ל", "Hebrew letter lamed"],
      ["ם", "Hebrew letter final mem"],
      ["מ", "Hebrew letter mem"],
      ["ן", "Hebrew letter final nun"],
      ["נ", "Hebrew letter nun"],
      ["ס", "Hebrew letter samekh"],
      ["ע", "Hebrew letter ayin"],
      ["ף", "Hebrew letter final pe"],
      ["פ", "Hebrew letter pe"],
      ["ץ", "Hebrew letter final tsadi"],
      ["צ", "Hebrew letter tsadi"],
      ["ק", "Hebrew letter qof"],
      ["ר", "Hebrew letter resh"],
      ["ש", "Hebrew letter shin"],
      ["ת", "Hebrew letter tav"]
    ]);
    const hebrewMarkNameByValueChirho = new Map([
      ["֑", "Etnachta"],
      ["֖", "Tipcha"],
      ["ֽ", "Meteg"],
      ["־", "Maqqef"],
      ["׃", "Sof pasuq"],
      ["ְ", "Sheva"],
      ["ֱ", "Hataf segol"],
      ["ֲ", "Hataf patah"],
      ["ֳ", "Hataf qamats"],
      ["ִ", "Hiriq"],
      ["ֵ", "Tsere"],
      ["ֶ", "Segol"],
      ["ַ", "Patah"],
      ["ָ", "Qamats"],
      ["ֹ", "Holam"],
      ["ֻ", "Qubuts"],
      ["ּ", "Dagesh/mappiq/shuruk"],
      ["ׁ", "Shin dot"],
      ["ׂ", "Sin dot"],
      ["ׇ", "Qamats qatan"]
    ]);
    const greekBaseLetterNameByValueChirho = new Map([
      ["Α", "Greek capital alpha"], ["α", "Greek alpha"],
      ["Β", "Greek capital beta"], ["β", "Greek beta"],
      ["Γ", "Greek capital gamma"], ["γ", "Greek gamma"],
      ["Δ", "Greek capital delta"], ["δ", "Greek delta"],
      ["Ε", "Greek capital epsilon"], ["ε", "Greek epsilon"],
      ["Ζ", "Greek capital zeta"], ["ζ", "Greek zeta"],
      ["Η", "Greek capital eta"], ["η", "Greek eta"],
      ["Θ", "Greek capital theta"], ["θ", "Greek theta"],
      ["Ι", "Greek capital iota"], ["ι", "Greek iota"],
      ["Κ", "Greek capital kappa"], ["κ", "Greek kappa"],
      ["Λ", "Greek capital lambda"], ["λ", "Greek lambda"],
      ["Μ", "Greek capital mu"], ["μ", "Greek mu"],
      ["Ν", "Greek capital nu"], ["ν", "Greek nu"],
      ["Ξ", "Greek capital xi"], ["ξ", "Greek xi"],
      ["Ο", "Greek capital omicron"], ["ο", "Greek omicron"],
      ["Π", "Greek capital pi"], ["π", "Greek pi"],
      ["Ρ", "Greek capital rho"], ["ρ", "Greek rho"],
      ["Σ", "Greek capital sigma"], ["σ", "Greek sigma"],
      ["ς", "Greek final sigma"],
      ["Τ", "Greek capital tau"], ["τ", "Greek tau"],
      ["Υ", "Greek capital upsilon"], ["υ", "Greek upsilon"],
      ["Φ", "Greek capital phi"], ["φ", "Greek phi"],
      ["Χ", "Greek capital chi"], ["χ", "Greek chi"],
      ["Ψ", "Greek capital psi"], ["ψ", "Greek psi"],
      ["Ω", "Greek capital omega"], ["ω", "Greek omega"]
    ]);
    const combiningMarkNameByValueChirho = new Map([
      ["̀", "grave"],
      ["́", "acute"],
      ["̈", "diaeresis"],
      ["̓", "smooth breathing"],
      ["̔", "rough breathing"],
      ["͂", "circumflex/perispomeni"],
      ["ͅ", "iota subscript"]
    ]);
    const combiningMarkReChirho = /[\u0300-\u036F\u0591-\u05BD\u05BF-\u05C7]/u;
    function displayCodepointCharChirho(charChirho) {
      return (combiningMarkReChirho.test(charChirho) ? "◌" : "") + charChirho;
    }
    function codepointNamePartChirho(charChirho) {
      const directNameChirho =
        hebrewBaseLetterNameByValueChirho.get(charChirho) ??
        hebrewMarkNameByValueChirho.get(charChirho) ??
        greekBaseLetterNameByValueChirho.get(charChirho) ??
        combiningMarkNameByValueChirho.get(charChirho);
      if (directNameChirho) return " " + directNameChirho;
      const decomposedChirho = Array.from(charChirho.normalize("NFD"));
      if (decomposedChirho.length <= 1) return "";
      const partsChirho = decomposedChirho
        .map((partChirho) =>
          greekBaseLetterNameByValueChirho.get(partChirho) ??
          combiningMarkNameByValueChirho.get(partChirho) ??
          hebrewBaseLetterNameByValueChirho.get(partChirho) ??
          hebrewMarkNameByValueChirho.get(partChirho)
        )
        .filter((partChirho) => typeof partChirho === "string" && partChirho.length > 0);
      return partsChirho.length > 0 ? " " + partsChirho.join(" + ") : "";
    }
    function codepointTextChirho(valueChirho) {
      const charsChirho = Array.from(String(valueChirho ?? "").normalize("NFC"));
      if (charsChirho.length === 0) return "(empty)";
      return charsChirho.map((charChirho) => {
        const codepointChirho = charChirho.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
        return "U+" + codepointChirho + " " + displayCodepointCharChirho(charChirho) + codepointNamePartChirho(charChirho);
      }).join(" | ");
    }
    function shellSingleQuoteChirho(valueChirho) {
      return "'" + String(valueChirho).normalize("NFC").replace(/'/g, "'\\"'\\"'") + "'";
    }
    function expertSuppliedTextCommandChirho(itemChirho, applyChirho) {
      const commandPartsChirho = [
        "bun run apply-expert-supplied-vision-text-chirho",
        "--",
        "--id-chirho=" + shellSingleQuoteChirho(itemChirho.idChirho),
        "--supplied-text-chirho='<exact printed text>'",
        "--reviewer-chirho='<explicit-human-reviewer-id-chirho>'",
        "--reviewer-role-chirho=" + shellSingleQuoteChirho(itemChirho.reviewerChirho),
        "--rationale-chirho='<why this exact text is supplied>'"
      ];
      if (applyChirho) commandPartsChirho.push("--apply");
      return commandPartsChirho.join(" ");
    }
    function reviewerAttributionErrorChirho(valueChirho) {
      const trimmedChirho = String(valueChirho || "").trim();
      const normalizedChirho = trimmedChirho.toLowerCase();
      if (trimmedChirho.length === 0) return "Reviewer is required.";
      if (genericReviewerIdsChirho.has(normalizedChirho)) {
        return "Reviewer must identify the explicit reviewer, not " + trimmedChirho + ".";
      }
      if (reviewerTemplatePlaceholderReChirho.test(trimmedChirho)) {
        return "Reviewer must identify the explicit reviewer, not template placeholder " + trimmedChirho + ".";
      }
      return null;
    }
    function valueLooksTemplatePlaceholderChirho(valueChirho, placeholderValuesChirho) {
      const normalizedChirho = String(valueChirho || "").trim().toLowerCase().replace(/\\s+/g, " ");
      const unwrappedChirho = normalizedChirho.replace(/^<(.+)>$/u, "$1").trim();
      return placeholderValuesChirho.has(normalizedChirho) || placeholderValuesChirho.has(unwrappedChirho);
    }
    function rationaleAttributionErrorChirho(valueChirho) {
      const trimmedChirho = String(valueChirho || "").trim();
      if (trimmedChirho.length === 0) return "Rationale is required.";
      if (valueLooksTemplatePlaceholderChirho(trimmedChirho, rationalePlaceholderValuesChirho)) {
        return "Rationale must explain the exact review decision, not a template placeholder.";
      }
      return null;
    }
    function isMachineReviewerAttributionChirho(valueChirho) {
      return machineReviewerIdReChirho.test(String(valueChirho || "").trim().toLowerCase());
    }
    function certifyingReviewerAttributionErrorChirho(valueChirho) {
      const explicitErrorChirho = reviewerAttributionErrorChirho(valueChirho);
      if (explicitErrorChirho !== null) return explicitErrorChirho;
      if (isMachineReviewerAttributionChirho(valueChirho)) {
        return "Reviewer must identify a human reviewer; machine reviewer " + String(valueChirho || "").trim() + " cannot certify.";
      }
      return null;
    }
    function reviewerRoleValueChirho(itemChirho) {
      const savedRoleChirho = localStorage.getItem("expertReviewerRoleChirho") || "";
      return savedRoleChirho === itemChirho.reviewerChirho ? savedRoleChirho : itemChirho.reviewerChirho;
    }
    function certifyExactCheckedChirho() {
      return document.getElementById("certify-exact-chirho")?.checked === true;
    }
    function itemTextIsBlankChirho(itemChirho) {
      return typeof itemChirho.currentTextChirho !== "string" || itemChirho.currentTextChirho.trim().length === 0 || itemChirho.textIsBlankChirho === true;
    }
    function currentIssueFlagsChirho() {
      return [...document.querySelectorAll(".issue-option-chirho input:checked")].map((nodeChirho) => nodeChirho.value);
    }
    function reviewerFieldsCompleteChirho() {
      return reviewerAttributionErrorChirho(fieldValueChirho("reviewer-chirho")) === null &&
        fieldValueChirho("reviewer-role-chirho").trim().length > 0 &&
        rationaleAttributionErrorChirho(fieldValueChirho("rationale-chirho")) === null;
    }
    function reviewerRoleMatchesItemChirho(itemChirho) {
      return fieldValueChirho("reviewer-role-chirho").trim() === itemChirho.reviewerChirho;
    }
    function confirmationCanSubmitChirho(itemChirho) {
      return !itemTextIsBlankChirho(itemChirho) &&
        certifyExactCheckedChirho() &&
        certifyingReviewerAttributionErrorChirho(fieldValueChirho("reviewer-chirho")) === null &&
        reviewerFieldsCompleteChirho() &&
        reviewerRoleMatchesItemChirho(itemChirho);
    }
    function issueCanSubmitChirho() {
      return reviewerFieldsCompleteChirho() && currentIssueFlagsChirho().length > 0;
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
      applyRequestedItemIdChirho();
      if (indexChirho >= activeItemsChirho().length) indexChirho = Math.max(0, activeItemsChirho().length - 1);
      renderChirho();
    }
    function renderSummaryChirho() {
      const activeChirho = activeItemsChirho().length;
      const confirmedChirho = itemsChirho.filter((itemChirho) => itemChirho.confirmedChirho).length;
      const issueReportedChirho = itemsChirho.filter((itemChirho) => itemChirho.issueReportedChirho).length;
      document.getElementById("summary-chirho").textContent =
        activeChirho + " pending in filter, " + confirmedChirho + " confirmed, " +
        issueReportedChirho + " issue-reported, " + itemsChirho.length + " total, " +
        currentPositionTextChirho(activeChirho);
    }
    function renderChirho() {
      syncUrlChirho();
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
      leftChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Current codepoints" }));
      leftChirho.appendChild(elChirho("div", { classChirho: "text-box-chirho mono-chirho codepoints-chirho", textChirho: codepointTextChirho(itemChirho.currentTextChirho) }));

      const sideChirho = elChirho("div", { classChirho: "side-chirho" });
      const metaChirho = elChirho("div", { classChirho: "box-chirho" });
      const metaGridChirho = elChirho("div", { classChirho: "meta-grid-chirho" });
      for (const [labelChirho, valueChirho] of [
        ["ID", itemChirho.idChirho],
        ["Location", "vol " + itemChirho.volumeChirho + " p" + itemChirho.pageChirho + " L" + itemChirho.lineIndexChirho + " S" + itemChirho.segmentIndexChirho],
        ["Script", itemChirho.scriptChirho],
        ["Required role", itemChirho.reviewerChirho],
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
        textChirho: "Confirm only if you can certify this script's exact letters and relevant marks against the printed line. If this is outside your competence or uncertain, use Report issue for crop/source/segmentation problems or Skip."
      }));
      if (itemTextIsBlankChirho(itemChirho)) {
        sideChirho.appendChild(elChirho("div", {
          classChirho: "warning-chirho",
          textChirho: "This item has no current text. Do not confirm an empty transcription; use Report issue or the expert-supplied text dry-run/apply path after a script reader supplies the exact printed text."
        }));
        const blankCommandBoxChirho = elChirho("div", { classChirho: "box-chirho" });
        blankCommandBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Dry-run after exact script-reader transcription" }));
        blankCommandBoxChirho.appendChild(elChirho("div", {
          classChirho: "mono-chirho command-chirho",
          textChirho: expertSuppliedTextCommandChirho(itemChirho, false)
        }));
        blankCommandBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Apply after dry-run verification" }));
        blankCommandBoxChirho.appendChild(elChirho("div", {
          classChirho: "mono-chirho command-chirho",
          textChirho: expertSuppliedTextCommandChirho(itemChirho, true)
        }));
        sideChirho.appendChild(blankCommandBoxChirho);
      }

      const formChirho = elChirho("div", { classChirho: "box-chirho input-grid-chirho" });
      formChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "reviewer-chirho", textChirho: "Reviewer" }));
      const reviewerInputChirho = elChirho("input", { id: "reviewer-chirho", value: localStorage.getItem("expertReviewerChirho") || "" });
      formChirho.appendChild(reviewerInputChirho);
      const reviewerStatusChirho = elChirho("div", { classChirho: "label-chirho reviewer-status-chirho", textChirho: "" });
      formChirho.appendChild(reviewerStatusChirho);
      formChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "reviewer-role-chirho", textChirho: "Role" }));
      const reviewerRoleInputChirho = elChirho("input", { id: "reviewer-role-chirho", value: reviewerRoleValueChirho(itemChirho) });
      formChirho.appendChild(reviewerRoleInputChirho);
      const reviewerRoleStatusChirho = elChirho("div", { classChirho: "label-chirho reviewer-role-status-chirho", textChirho: "" });
      formChirho.appendChild(reviewerRoleStatusChirho);
      formChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "rationale-chirho", textChirho: "Rationale" }));
      formChirho.appendChild(elChirho("textarea", { id: "rationale-chirho", textChirho: localStorage.getItem("expertRationaleChirho") || "" }));
      const certifyInputChirho = elChirho("input", { id: "certify-exact-chirho", type: "checkbox" });
      if (itemTextIsBlankChirho(itemChirho)) certifyInputChirho.disabled = true;
      const certifyLabelChirho = elChirho("label", { classChirho: "certify-option-chirho", for: "certify-exact-chirho" }, [
        certifyInputChirho,
        document.createTextNode("I can certify this item's exact printed letters and relevant marks for the displayed script.")
      ]);
      formChirho.appendChild(certifyLabelChirho);
      formChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Issue flags" }));
      const issueGridChirho = elChirho("div", { classChirho: "issue-grid-chirho" });
      for (const optionChirho of issueFlagOptionsChirho) {
        const inputChirho = elChirho("input", { type: "checkbox", value: optionChirho.valueChirho });
        const labelChirho = elChirho("label", { classChirho: "issue-option-chirho" }, [inputChirho, document.createTextNode(optionChirho.labelChirho)]);
        issueGridChirho.appendChild(labelChirho);
      }
      formChirho.appendChild(issueGridChirho);
      const actionStatusChirho = elChirho("div", { classChirho: "label-chirho action-status-chirho", textChirho: "" });
      formChirho.appendChild(actionStatusChirho);
      const actionsChirho = elChirho("div", { classChirho: "actions-chirho" });
      const confirmChirho = elChirho("button", { classChirho: "confirm-chirho", type: "button", textChirho: "Confirm" });
      confirmChirho.disabled = true;
      const issueChirho = elChirho("button", { classChirho: "issue-chirho", type: "button", textChirho: "Report issue" });
      const updateActionButtonsChirho = () => {
        const explicitReviewerErrorChirho = reviewerAttributionErrorChirho(fieldValueChirho("reviewer-chirho"));
        const certifyingReviewerErrorChirho = certifyingReviewerAttributionErrorChirho(fieldValueChirho("reviewer-chirho"));
        reviewerStatusChirho.textContent = explicitReviewerErrorChirho !== null
          ? explicitReviewerErrorChirho
          : certifyingReviewerErrorChirho !== null
            ? certifyingReviewerErrorChirho + " Issue reporting remains available."
            : "Reviewer attribution OK.";
        reviewerRoleStatusChirho.textContent = reviewerRoleMatchesItemChirho(itemChirho)
          ? "Confirmation role OK."
          : "Confirm role must be " + itemChirho.reviewerChirho + ".";
        const actionMessagesChirho = [];
        const rationaleErrorChirho = rationaleAttributionErrorChirho(fieldValueChirho("rationale-chirho"));
        if (rationaleErrorChirho !== null) actionMessagesChirho.push(rationaleErrorChirho);
        if (certifyingReviewerErrorChirho !== null) actionMessagesChirho.push("Confirm needs explicit human reviewer");
        if (itemTextIsBlankChirho(itemChirho)) actionMessagesChirho.push("Confirm needs expert-supplied text first");
        else if (!certifyExactCheckedChirho()) actionMessagesChirho.push("Confirm needs exact-certification checkbox");
        if (currentIssueFlagsChirho().length === 0) actionMessagesChirho.push("Report issue needs an issue flag");
        actionStatusChirho.textContent = actionMessagesChirho.length === 0
          ? "Confirm and Report issue requirements are currently satisfied."
          : "Action requirements: " + actionMessagesChirho.join("; ") + ".";
        confirmChirho.disabled = !confirmationCanSubmitChirho(itemChirho);
        issueChirho.disabled = !issueCanSubmitChirho();
      };
      certifyInputChirho.addEventListener("change", updateActionButtonsChirho);
      for (const inputChirho of formChirho.querySelectorAll("#reviewer-chirho, #reviewer-role-chirho, #rationale-chirho")) {
        inputChirho.addEventListener("input", updateActionButtonsChirho);
      }
      for (const inputChirho of issueGridChirho.querySelectorAll("input")) {
        inputChirho.addEventListener("change", updateActionButtonsChirho);
      }
      confirmChirho.addEventListener("click", () => confirmCurrentChirho(itemChirho));
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
      updateActionButtonsChirho();
    }
    async function confirmCurrentChirho(itemChirho) {
      if (itemTextIsBlankChirho(itemChirho)) {
        setStatusChirho("Blank current text cannot be confirmed; apply expert-supplied text first.");
        return;
      }
      if (!certifyExactCheckedChirho()) {
        setStatusChirho("Check the exact-certification box before confirming this item.");
        return;
      }
      const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(fieldValueChirho("reviewer-chirho"));
      if (reviewerErrorChirho !== null) {
        setStatusChirho(reviewerErrorChirho);
        return;
      }
      const rationaleErrorChirho = rationaleAttributionErrorChirho(fieldValueChirho("rationale-chirho"));
      if (rationaleErrorChirho !== null) {
        setStatusChirho(rationaleErrorChirho);
        return;
      }
      saveReviewerFieldsChirho();
      setStatusChirho("Saving...");
      const responseChirho = await fetch("/api-chirho/confirm-chirho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idChirho: itemChirho.idChirho,
          reviewerChirho: fieldValueChirho("reviewer-chirho"),
          reviewerRoleChirho: fieldValueChirho("reviewer-role-chirho"),
          rationaleChirho: fieldValueChirho("rationale-chirho"),
          certifyExactChirho: certifyExactCheckedChirho(),
          expectedScriptChirho: itemChirho.scriptChirho,
          expectedReviewerChirho: itemChirho.reviewerChirho,
          expectedVisionSourceChirho: itemChirho.visionSourceChirho,
          expectedCurrentTextChirho: itemChirho.currentTextChirho,
          expectedSourcePathChirho: itemChirho.sourcePathChirho,
          expectedPacketPathChirho: itemChirho.packetPathChirho,
          expectedMarkdownPathChirho: itemChirho.markdownPathChirho
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
      const flagsChirho = currentIssueFlagsChirho();
      const reviewerErrorChirho = reviewerAttributionErrorChirho(fieldValueChirho("reviewer-chirho"));
      if (reviewerErrorChirho !== null) {
        setStatusChirho(reviewerErrorChirho);
        return;
      }
      const rationaleErrorChirho = rationaleAttributionErrorChirho(fieldValueChirho("rationale-chirho"));
      if (rationaleErrorChirho !== null) {
        setStatusChirho(rationaleErrorChirho);
        return;
      }
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
          issueFlagsChirho: flagsChirho,
          expectedScriptChirho: itemChirho.scriptChirho,
          expectedReviewerChirho: itemChirho.reviewerChirho,
          expectedVisionSourceChirho: itemChirho.visionSourceChirho,
          expectedCurrentTextChirho: itemChirho.currentTextChirho,
          expectedSourcePathChirho: itemChirho.sourcePathChirho,
          expectedPacketPathChirho: itemChirho.packetPathChirho,
          expectedMarkdownPathChirho: itemChirho.markdownPathChirho
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
      requestedItemIdChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("priority-filter-chirho").addEventListener("change", (eventChirho) => {
      priorityFilterChirho = eventChirho.target.value;
      requestedItemIdChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("volume-filter-chirho").addEventListener("change", (eventChirho) => {
      volumeFilterChirho = eventChirho.target.value;
      requestedItemIdChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("text-state-filter-chirho").addEventListener("change", (eventChirho) => {
      textStateFilterChirho = eventChirho.target.value;
      requestedItemIdChirho = null;
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
    document.getElementById("copy-link-chirho").addEventListener("click", () => copyCurrentLinkChirho());
    syncFilterControlsChirho();
    loadStateChirho().catch((errorChirho) => setStatusChirho(String(errorChirho)));
  </script>
</body>
</html>`;
}

const argsChirho = process.argv.slice(2);
const portChirho = parsePortChirho(argsChirho);
const policyPathChirho = parseArgValueChirho(argsChirho, "policy") ?? VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO;

const serverChirho = Bun.serve({
  port: portChirho,
  async fetch(reqChirho) {
    const urlChirho = new URL(reqChirho.url);
    try {
      if (urlChirho.pathname === "/") {
        return new Response(htmlChirho(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      if (urlChirho.pathname === "/favicon.ico") {
        return new Response(null, { status: 204 });
      }
      if (urlChirho.pathname === "/api-chirho/server-health-chirho") {
        return jsonResponseChirho(SERVER_HEALTH_CHIRHO);
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
        if (bodyChirho.certifyExactChirho !== true) {
          return jsonResponseChirho({ okChirho: false, errorChirho: "certifyExactChirho acknowledgement is required" }, 400);
        }
        if (reviewerChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
        const reviewerErrorChirho = certifyingReviewerAttributionErrorChirho(reviewerChirho);
        if (reviewerErrorChirho !== null) return jsonResponseChirho({ okChirho: false, errorChirho: reviewerErrorChirho }, 400);
        if (reviewerRoleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerRoleChirho is required" }, 400);
        if (rationaleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "rationaleChirho is required" }, 400);
        if (visionTierExpertRationaleLooksPlaceholderChirho(rationaleChirho)) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: "rationaleChirho must explain the exact review decision, not a template placeholder",
          }, 400);
        }
        const { manifestChirho, liveItemsChirho, liveByIdChirho } = loadCurrentStateChirho(policyPathChirho);
        const liveItemChirho = liveByIdChirho.get(itemIdChirho);
        if (liveItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown item" }, 404);
        const packetItemChirho = (manifestChirho.completeVisionItemsChirho ?? []).find((itemChirho) => itemChirho.idChirho === itemIdChirho);
        if (packetItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown packet item" }, 404);
        const staleDisplayChirho = staleDisplayMismatchChirho(bodyChirho, packetItemChirho);
        if (staleDisplayChirho !== null) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: `Expert review item is stale: ${staleDisplayChirho}; reload review state`,
          }, 409);
        }
        if (liveItemChirho.currentTextChirho.trim().length === 0) {
          return jsonResponseChirho({ okChirho: false, errorChirho: "blank currentTextChirho cannot be confirmed; apply expert-supplied text first" }, 400);
        }
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
        let issueFlagsChirho: string[];
        try {
          issueFlagsChirho = parseIssueFlagsChirho(bodyChirho.issueFlagsChirho);
        } catch (errorChirho) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: errorChirho instanceof Error ? errorChirho.message : String(errorChirho),
          }, 400);
        }
        if (itemIdChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "missing idChirho" }, 400);
        if (reviewerChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerChirho is required" }, 400);
        const reviewerErrorChirho = explicitReviewerAttributionErrorChirho(reviewerChirho);
        if (reviewerErrorChirho !== null) return jsonResponseChirho({ okChirho: false, errorChirho: reviewerErrorChirho }, 400);
        if (reviewerRoleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "reviewerRoleChirho is required" }, 400);
        if (rationaleChirho === null) return jsonResponseChirho({ okChirho: false, errorChirho: "rationaleChirho is required" }, 400);
        if (visionTierExpertRationaleLooksPlaceholderChirho(rationaleChirho)) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: "rationaleChirho must explain the exact review decision, not a template placeholder",
          }, 400);
        }
        if (issueFlagsChirho.length === 0) return jsonResponseChirho({ okChirho: false, errorChirho: "at least one issue flag is required" }, 400);
        const { manifestChirho, liveItemsChirho, liveByIdChirho } = loadCurrentStateChirho(policyPathChirho);
        const liveItemChirho = liveByIdChirho.get(itemIdChirho);
        if (liveItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown item" }, 404);
        const packetItemChirho = (manifestChirho.completeVisionItemsChirho ?? []).find((itemChirho) => itemChirho.idChirho === itemIdChirho);
        if (packetItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown packet item" }, 404);
        const staleDisplayChirho = staleDisplayMismatchChirho(bodyChirho, packetItemChirho);
        if (staleDisplayChirho !== null) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: `Expert review item is stale: ${staleDisplayChirho}; reload review state`,
          }, 409);
        }
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

console.log(`[${MODULE_CHIRHO}] http://localhost:${serverChirho.port}/`);
