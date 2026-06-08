// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Browser reviewer for non-Latin expert confirmations.
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
import {
  reviewServerNoStoreHeadersChirho,
  reviewServerSourceStaleErrorChirho,
  reviewServerStartupHealthChirho,
} from "./review-server-health-chirho.ts";
import { hashTextChirho } from "./text-normalization-chirho.ts";
import {
  EXPERT_MARKDOWN_PATH_PAIRS_CHIRHO,
  fileSha256Chirho,
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
const VISION_TIER_EXPERT_CONFIRMATION_QUICKSTART_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-tier-expert-confirmation-quickstart-2026-06-05-chirho.md"
);
const HALLELUJAH_REVIEW_SESSION_GUIDE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "hallelujah-review-session-guide-2026-06-05-chirho.md"
);

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
  sourceSha256Chirho: string;
  packetSha256Chirho: string;
  spanXMinPxChirho: number;
  spanWidthPxChirho: number;
  lineWidthPxChirho: number;
  markerLeftPctChirho: number;
  markerWidthPctChirho: number;
}

interface ConfirmRequestChirho {
  idChirho?: string;
  reviewerChirho?: string;
  reviewerRoleChirho?: string;
  rationaleChirho?: string;
  certifyExactChirho?: boolean;
  issueFlagsChirho?: unknown;
  expectedScriptChirho?: string;
  expectedReviewerChirho?: string;
  expectedVisionSourceChirho?: string;
  expectedCurrentTextChirho?: string;
  expectedSourcePathChirho?: string;
  expectedPacketPathChirho?: string;
  expectedMarkdownPathChirho?: string;
  expectedSpanXMinPxChirho?: number;
  expectedSpanWidthPxChirho?: number;
  expectedLineWidthPxChirho?: number;
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
  { valueChirho: "letters-chirho", labelChirho: "Letters", helpChirho: "Wrong or uncertain base letters for the displayed script." },
  { valueChirho: "marks-chirho", labelChirho: "Vowels/marks", helpChirho: "Vowels, dots, accents, breathing, pointing, or other script marks are wrong or uncertain." },
  { valueChirho: "punctuation-chirho", labelChirho: "Punctuation", helpChirho: "Printed punctuation, brackets, ellipses, maqaf/maqqef-like joins, or spacing marks are wrong or uncertain." },
  { valueChirho: "segmentation-chirho", labelChirho: "Segmentation", helpChirho: "The box splits a word, lumps multiple items incorrectly, or attaches neighboring context." },
  { valueChirho: "wrong-script-chirho", labelChirho: "Wrong script", helpChirho: "The item belongs in another script lane, such as Syriac, Arabic, Hebrew, or Greek." },
  { valueChirho: "wrong-source-chirho", labelChirho: "Wrong source", helpChirho: "The crop, source line, packet image, or displayed item does not match what should be reviewed." },
  { valueChirho: "uncertain-chirho", labelChirho: "Uncertain", helpChirho: "Use when you cannot certify the exact printed text from this view." },
] as const satisfies Array<{ valueChirho: (typeof VISION_TIER_EXPERT_ISSUE_FLAGS_CHIRHO)[number]; labelChirho: string; helpChirho: string }>;

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
    headers: reviewServerNoStoreHeadersChirho("application/json; charset=utf-8"),
  });
}

function staleReviewServerWriteResponseChirho(): Response | null {
  const staleErrorChirho = reviewServerSourceStaleErrorChirho(SERVER_HEALTH_CHIRHO);
  return staleErrorChirho === null ? null : jsonResponseChirho({ okChirho: false, errorChirho: staleErrorChirho }, 409);
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
  liveByIdChirho: Map<string, VisionTierExpertLiveItemChirho>,
  confirmedIdsChirho: Set<string>,
  reviewedIssueIdsChirho: Set<string>,
  openIssueDetailsByIdChirho: Map<string, ExpertOpenIssueChirho>
): ExpertReviewItemChirho[] {
  return (manifestChirho.completeVisionItemsChirho ?? []).map((itemChirho) => {
    const liveItemChirho = liveByIdChirho.get(itemChirho.idChirho);
    const lineWidthPxChirho = liveItemChirho?.lineWidthPxChirho ?? 1;
    const spanXMinPxChirho = liveItemChirho?.spanXMinPxChirho ?? 0;
    const spanWidthPxChirho = liveItemChirho?.spanWidthPxChirho ?? lineWidthPxChirho;
    return {
      ...itemChirho,
      confirmedChirho: confirmedIdsChirho.has(itemChirho.idChirho),
      issueReportedChirho: reviewedIssueIdsChirho.has(itemChirho.idChirho),
      openIssueChirho: openIssueDetailsByIdChirho.get(itemChirho.idChirho) ?? null,
      textIsBlankChirho: itemChirho.currentTextChirho.trim().length === 0,
      sourceSha256Chirho: fileSha256Chirho(itemChirho.sourcePathChirho),
      packetSha256Chirho: fileSha256Chirho(itemChirho.packetPathChirho),
      spanXMinPxChirho,
      spanWidthPxChirho,
      lineWidthPxChirho,
      markerLeftPctChirho: (spanXMinPxChirho / lineWidthPxChirho) * 100,
      markerWidthPctChirho: (spanWidthPxChirho / lineWidthPxChirho) * 100,
    };
  });
}

function staleDisplayMismatchChirho(
  requestChirho: ConfirmRequestChirho,
  packetItemChirho: ExpertPackItemChirho,
  liveItemChirho: VisionTierExpertLiveItemChirho
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
  const numericComparisonsChirho = [
    ["expectedSpanXMinPxChirho", liveItemChirho.spanXMinPxChirho],
    ["expectedSpanWidthPxChirho", liveItemChirho.spanWidthPxChirho],
    ["expectedLineWidthPxChirho", liveItemChirho.lineWidthPxChirho],
  ] as const;
  for (const [fieldChirho, currentValueChirho] of numericComparisonsChirho) {
    const submittedValueChirho = requestChirho[fieldChirho];
    if (typeof submittedValueChirho !== "number") return `${fieldChirho} is missing`;
    if (submittedValueChirho !== currentValueChirho) return `${fieldChirho} no longer matches current live span`;
  }
  return null;
}

function htmlChirho(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Expert Non-Latin Review Chirho</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f6f5ef; color: #1f2933; }
    button, input, select, textarea { font: inherit; }
    .shell-chirho { max-width: 1240px; margin: 0 auto; padding: 18px; }
    .top-chirho { display: flex; align-items: center; justify-content: space-between; gap: 14px; border-bottom: 1px solid #d8d4c8; padding-bottom: 12px; }
    .title-chirho { font-size: 20px; font-weight: 750; }
    .summary-chirho, .status-chirho { color: #59636f; font-size: 13px; }
    .server-health-chirho { color: #59636f; font-size: 12px; text-align: right; margin-bottom: 4px; }
    .toolbar-chirho { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .toolbar-chirho select, .toolbar-chirho input, .toolbar-chirho button, .toolbar-link-chirho { border: 1px solid #aab1b9; background: white; min-height: 34px; padding: 5px 8px; box-sizing: border-box; }
    .toolbar-chirho input { width: 180px; }
    .toolbar-link-chirho { display: inline-flex; align-items: center; color: #1f2933; text-decoration: none; font-size: 13px; }
    .toolbar-link-chirho:hover { background: #edf1f4; }
    .lane-shortcuts-chirho { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; margin-top: 10px; font-size: 12px; color: #59636f; }
    .lane-shortcuts-chirho a { color: #1f2933; text-decoration: none; border: 1px solid #c8cdd3; background: #fff; padding: 4px 7px; }
    .lane-shortcuts-chirho a:hover { background: #edf1f4; }
    .main-chirho { display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 18px; padding-top: 18px; }
    .image-label-chirho { color: #59636f; font-size: 13px; font-weight: 650; margin: 0 0 6px; }
    .image-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: auto; margin-bottom: 12px; }
    .target-crop-wrap-chirho { background: white; border: 1px solid #d6d9dd; overflow: hidden; margin-bottom: 12px; }
    .target-crop-frame-chirho { position: relative; width: 100%; overflow: hidden; }
    .target-crop-image-chirho { display: block; height: auto; image-rendering: -webkit-optimize-contrast; transform-origin: top left; }
    .target-crop-marker-chirho { position: absolute; top: 0; bottom: 0; border: 4px solid #c9251f; background: rgba(201, 37, 31, 0.07); box-shadow: inset 0 0 0 2px rgba(255,255,255,0.72); box-sizing: border-box; pointer-events: none; }
    .target-boundary-note-chirho { margin: -4px 0 12px; border: 1px solid #d6d9dd; border-top: 0; background: #fff; color: #3d4650; font-size: 12px; line-height: 1.35; padding: 8px 10px; }
    .line-image-frame-chirho { position: relative; width: 100%; }
    .line-image-chirho { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
    .span-marker-chirho { position: absolute; top: 0; bottom: 0; border: 3px solid #c9251f; background: rgba(201, 37, 31, 0.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.72); box-sizing: border-box; pointer-events: none; }
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
    .issue-option-chirho { display: flex; gap: 7px; align-items: flex-start; border: 1px solid #d6d9dd; padding: 8px; min-height: 38px; box-sizing: border-box; cursor: pointer; }
    .issue-option-chirho input { width: auto; margin: 2px 0 0; }
    .issue-option-chirho:has(input:checked) { border-color: #bd7a1b; background: #fff7e8; }
    .issue-label-text-chirho { display: block; font-size: 13px; font-weight: 650; line-height: 1.2; }
    .issue-help-chirho { display: block; color: #59636f; font-size: 11px; line-height: 1.25; margin-top: 3px; }
    .certify-option-chirho { display: flex; gap: 8px; align-items: flex-start; border: 1px solid #b8d5ca; background: #f2fbf7; padding: 10px; font-size: 13px; line-height: 1.35; cursor: pointer; }
    .certify-option-chirho input { width: auto; margin: 3px 0 0; }
    .actions-chirho { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .actions-chirho button, .toolbar-chirho button { cursor: pointer; }
    .actions-chirho button { border: 1px solid #aab1b9; background: white; padding: 10px; min-height: 42px; }
    .actions-chirho button:hover, .toolbar-chirho button:hover { background: #edf1f4; }
    .actions-chirho button:disabled, .actions-chirho button:disabled:hover { color: #8a9199; border-color: #cfd4d9 !important; background: #f0f2f4; cursor: not-allowed; }
    .confirm-chirho { color: #116149; border-color: #499b7f !important; font-weight: 750; }
    .issue-chirho { color: #704000; border-color: #bd7a1b !important; font-weight: 750; }
    .warning-chirho { border-left: 4px solid #bd7a1b; background: #fff7e8; padding: 10px; font-size: 13px; color: #704000; }
    .command-chirho { white-space: pre-wrap; overflow-wrap: anywhere; background: #f5f6f7; border: 1px solid #d6d9dd; padding: 10px; font-size: 12px; line-height: 1.35; }
    .command-row-chirho { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: start; }
    .copy-command-chirho { border: 1px solid #aab1b9; background: white; padding: 7px 9px; cursor: pointer; font-size: 12px; }
    .copy-command-chirho:hover { background: #edf1f4; }
    .command-helper-note-chirho { font-size: 12px; color: #59636f; }
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
        <div class="title-chirho">Expert Non-Latin Review</div>
        <div class="summary-chirho" id="summary-chirho"></div>
      </div>
      <div>
        <div class="server-health-chirho">Review server source: ${SERVER_HEALTH_CHIRHO.sourceFingerprintChirho.slice(0, 12)}; started: ${SERVER_HEALTH_CHIRHO.startedAtChirho}</div>
        <div class="status-chirho" id="status-chirho"></div>
      </div>
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
      <label class="label-chirho" for="source-filter-chirho">Source</label>
      <select id="source-filter-chirho">
        <option value="all-chirho">All</option>
        <option value="explicit-span-chirho">Explicit span</option>
        <option value="pass-c-ocr-span-chirho">Pass-C OCR</option>
        <option value="d1-derived-chirho">D1-derived</option>
      </select>
      <label class="label-chirho" for="exact-text-filter-chirho">Exact text</label>
      <input id="exact-text-filter-chirho" placeholder="optional exact current text">
      <button type="button" id="prev-chirho">Previous</button>
      <button type="button" id="next-chirho">Skip</button>
      <button type="button" id="copy-link-chirho">Copy link</button>
      <a class="toolbar-link-chirho" href="/quickstart-chirho" target="_blank" rel="noreferrer">Quickstart</a>
      <a class="toolbar-link-chirho" href="/session-guide-chirho" target="_blank" rel="noreferrer">Session guide</a>
    </div>
    <div class="lane-shortcuts-chirho" aria-label="Recommended expert review lanes">
      <span>Recommended expert lanes</span>
      <a href="/?text-state-chirho=blank-chirho&script-chirho=syriac-chirho">Blank Syriac handoff</a>
      <a href="/?script-chirho=hebrew-chirho">Hebrew/WLC</a>
      <a href="/?script-chirho=hebrew-chirho&source-chirho=explicit-span-chirho">Hebrew explicit</a>
      <a href="/?script-chirho=hebrew-chirho&source-chirho=d1-derived-chirho">Hebrew D1</a>
      <a href="/?script-chirho=greek-chirho">Greek</a>
      <a href="/?script-chirho=greek-chirho&source-chirho=pass-c-ocr-span-chirho">Greek Pass-C</a>
      <a href="/?script-chirho=greek-chirho&source-chirho=explicit-span-chirho">Greek explicit</a>
      <a href="/?script-chirho=syriac-chirho&text-state-chirho=nonblank-chirho">Syriac has text</a>
      <a href="/?script-chirho=syriac-chirho&source-chirho=explicit-span-chirho">Syriac explicit</a>
      <a href="/?script-chirho=syriac-chirho&source-chirho=pass-c-ocr-span-chirho">Syriac Pass-C</a>
      <a href="/?script-chirho=arabic-chirho">Arabic</a>
      <a href="/?script-chirho=arabic-chirho&source-chirho=explicit-span-chirho">Arabic explicit</a>
      <a href="/?source-chirho=pass-c-ocr-span-chirho">Pass-C OCR</a>
      <a href="/?priority-chirho=priority-chirho">Priority</a>
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
    let sourceFilterChirho = queryChirho.get("source-chirho") || "all-chirho";
    let exactTextFilterChirho = queryChirho.get("exact-text-chirho") || "";
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
    async function copyTextChirho(valueChirho, successMessageChirho, failureMessageChirho) {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(valueChirho);
        setStatusChirho(successMessageChirho);
      } catch (_errorChirho) {
        const textareaChirho = document.createElement("textarea");
        textareaChirho.value = valueChirho;
        textareaChirho.style.position = "fixed";
        textareaChirho.style.left = "-9999px";
        document.body.appendChild(textareaChirho);
        textareaChirho.select();
        const copiedChirho = document.execCommand("copy");
        textareaChirho.remove();
        setStatusChirho(copiedChirho ? successMessageChirho : failureMessageChirho);
      }
    }
    async function copyCurrentLinkChirho() {
      await copyTextChirho(window.location.href, "Copied current item link", "Copy failed; URL bar already has current item link");
    }
    function commandTextValueChirho(commandTextOrProviderChirho) {
      return typeof commandTextOrProviderChirho === "function"
        ? commandTextOrProviderChirho()
        : String(commandTextOrProviderChirho);
    }
    function commandRowChirho(commandTextOrProviderChirho) {
      const commandTextNodeChirho = elChirho("div", {
        classChirho: "mono-chirho command-chirho",
        textChirho: commandTextValueChirho(commandTextOrProviderChirho)
      });
      const refreshCommandChirho = () => {
        commandTextNodeChirho.textContent = commandTextValueChirho(commandTextOrProviderChirho);
      };
      const copyButtonChirho = elChirho("button", { classChirho: "copy-command-chirho", type: "button", textChirho: "Copy command" });
      copyButtonChirho.addEventListener("click", () => {
        refreshCommandChirho();
        copyTextChirho(commandTextNodeChirho.textContent ?? "", "Copied command", "Copy failed; select the command text manually");
      });
      const rowChirho = elChirho("div", { classChirho: "command-row-chirho" }, [
        commandTextNodeChirho,
        copyButtonChirho
      ]);
      rowChirho.refreshCommandChirho = refreshCommandChirho;
      return rowChirho;
    }
    function refreshCommandRowsChirho(rootChirho) {
      for (const rowChirho of rootChirho.querySelectorAll(".command-row-chirho")) {
        if (typeof rowChirho.refreshCommandChirho === "function") rowChirho.refreshCommandChirho();
      }
    }
    function selectHasValueChirho(idChirho, valueChirho) {
      return [...document.getElementById(idChirho).options].some((optionChirho) => optionChirho.value === valueChirho);
    }
    if (!selectHasValueChirho("script-filter-chirho", scriptFilterChirho)) scriptFilterChirho = "all-chirho";
    if (!selectHasValueChirho("priority-filter-chirho", priorityFilterChirho)) priorityFilterChirho = "all-chirho";
    if (!selectHasValueChirho("volume-filter-chirho", volumeFilterChirho)) volumeFilterChirho = "all-chirho";
    if (!selectHasValueChirho("text-state-filter-chirho", textStateFilterChirho)) textStateFilterChirho = "all-chirho";
    if (!selectHasValueChirho("source-filter-chirho", sourceFilterChirho)) sourceFilterChirho = "all-chirho";
    function syncFilterControlsChirho() {
      document.getElementById("script-filter-chirho").value = scriptFilterChirho;
      document.getElementById("priority-filter-chirho").value = priorityFilterChirho;
      document.getElementById("volume-filter-chirho").value = volumeFilterChirho;
      document.getElementById("text-state-filter-chirho").value = textStateFilterChirho;
      document.getElementById("source-filter-chirho").value = sourceFilterChirho;
      document.getElementById("exact-text-filter-chirho").value = exactTextFilterChirho;
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
      if (sourceFilterChirho !== "all-chirho") paramsChirho.set("source-chirho", sourceFilterChirho);
      if (exactTextFilterChirho !== "") paramsChirho.set("exact-text-chirho", exactTextFilterChirho);
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
        (sourceFilterChirho === "all-chirho" || itemChirho.visionSourceChirho === sourceFilterChirho) &&
        (exactTextFilterChirho === "" || itemChirho.currentTextChirho === exactTextFilterChirho) &&
        itemMatchesTextStateChirho(itemChirho)
      );
    }
    function repeatClusterItemsChirho(itemChirho) {
      return itemsChirho.filter((candidateChirho) =>
        !candidateChirho.confirmedChirho &&
        candidateChirho.currentTextChirho === itemChirho.currentTextChirho &&
        candidateChirho.scriptChirho === itemChirho.scriptChirho
      );
    }
    function exactTextClusterUrlChirho(itemChirho) {
      const paramsChirho = new URLSearchParams();
      paramsChirho.set("script-chirho", itemChirho.scriptChirho);
      if (itemTextIsBlankChirho(itemChirho)) {
        paramsChirho.set("text-state-chirho", "blank-chirho");
      } else {
        paramsChirho.set("exact-text-chirho", itemChirho.currentTextChirho);
      }
      paramsChirho.set("item-chirho", itemChirho.idChirho);
      return window.location.pathname + "?" + paramsChirho.toString();
    }
    function repeatClusterTextChirho(itemChirho) {
      const clusterCountChirho = repeatClusterItemsChirho(itemChirho).length;
      if (itemTextIsBlankChirho(itemChirho)) {
        return clusterCountChirho +
          " pending blank item(s) share this script. Planning aid only; blank text still needs expert-supplied text before confirmation.";
      }
      if (clusterCountChirho <= 1) {
        return "Singleton exact text for this script. Planning aid only; every item still needs exact print confirmation and a policy row.";
      }
      return clusterCountChirho +
        " pending item(s) share this exact text/script. Planning aid only; every item still needs exact print confirmation and a policy row.";
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
        if (sourceFilterChirho !== "all-chirho" && requestedItemChirho.visionSourceChirho !== sourceFilterChirho) {
          sourceFilterChirho = "all-chirho";
          changedFiltersChirho = true;
        }
        if (exactTextFilterChirho !== "" && requestedItemChirho.currentTextChirho !== exactTextFilterChirho) {
          exactTextFilterChirho = "";
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
    const syriacLetterNameByValueChirho = new Map([
      ["ܐ", "Syriac letter alaph"],
      ["ܒ", "Syriac letter beth"],
      ["ܓ", "Syriac letter gamal"],
      ["ܔ", "Syriac letter gamal garshuni"],
      ["ܕ", "Syriac letter dalath"],
      ["ܖ", "Syriac letter dotless dalath rish"],
      ["ܗ", "Syriac letter he"],
      ["ܘ", "Syriac letter waw"],
      ["ܙ", "Syriac letter zain"],
      ["ܚ", "Syriac letter heth"],
      ["ܛ", "Syriac letter teth"],
      ["ܜ", "Syriac letter teth garshuni"],
      ["ܝ", "Syriac letter yudh"],
      ["ܞ", "Syriac letter yudh he"],
      ["ܟ", "Syriac letter kaph"],
      ["ܠ", "Syriac letter lamadh"],
      ["ܡ", "Syriac letter mim"],
      ["ܢ", "Syriac letter nun"],
      ["ܣ", "Syriac letter semkath"],
      ["ܤ", "Syriac letter final semkath"],
      ["ܥ", "Syriac letter e"],
      ["ܦ", "Syriac letter pe"],
      ["ܧ", "Syriac letter reversed pe"],
      ["ܨ", "Syriac letter sadhe"],
      ["ܩ", "Syriac letter qaph"],
      ["ܪ", "Syriac letter rish"],
      ["ܫ", "Syriac letter shin"],
      ["ܬ", "Syriac letter taw"],
      ["ݍ", "Syriac letter sogdian zhain"],
      ["ݎ", "Syriac letter sogdian khaph"],
      ["ݏ", "Syriac letter sogdian fe"]
    ]);
    const syriacMarkNameByValueChirho = new Map([
      ["܏", "Syriac abbreviation mark"],
      ["ܑ", "Syriac supralinear full stop"],
      ["ܰ", "Syriac pthaha above"],
      ["ܱ", "Syriac pthaha below"],
      ["ܲ", "Syriac pthaha dotted"],
      ["ܳ", "Syriac zqapha above"],
      ["ܴ", "Syriac zqapha below"],
      ["ܵ", "Syriac zqapha dotted"],
      ["ܶ", "Syriac rbasa above"],
      ["ܷ", "Syriac rbasa below"],
      ["ܸ", "Syriac dotted zlama horizontal"],
      ["ܹ", "Syriac dotted zlama angular"],
      ["ܺ", "Syriac hbasa above"],
      ["ܻ", "Syriac hbasa below"],
      ["ܼ", "Syriac hbasa-esasa dotted"],
      ["ܽ", "Syriac esasa above"],
      ["ܾ", "Syriac esasa below"],
      ["ܿ", "Syriac rwaha"],
      ["݀", "Syriac feminine dot"],
      ["݁", "Syriac qushshaya"],
      ["݂", "Syriac rukkakha"],
      ["݃", "Syriac two vertical dots above"],
      ["݄", "Syriac two vertical dots below"],
      ["݅", "Syriac three dots above"],
      ["݆", "Syriac three dots below"],
      ["݇", "Syriac oblique line above"],
      ["݈", "Syriac oblique line below"],
      ["݊", "Syriac barrekh"]
    ]);
    const arabicLetterNameByValueChirho = new Map([
      ["ء", "Arabic letter hamza"],
      ["آ", "Arabic letter alef with madda above"],
      ["أ", "Arabic letter alef with hamza above"],
      ["ؤ", "Arabic letter waw with hamza above"],
      ["إ", "Arabic letter alef with hamza below"],
      ["ئ", "Arabic letter yeh with hamza above"],
      ["ا", "Arabic letter alef"],
      ["ب", "Arabic letter beh"],
      ["ة", "Arabic letter teh marbuta"],
      ["ت", "Arabic letter teh"],
      ["ث", "Arabic letter theh"],
      ["ج", "Arabic letter jeem"],
      ["ح", "Arabic letter hah"],
      ["خ", "Arabic letter khah"],
      ["د", "Arabic letter dal"],
      ["ذ", "Arabic letter thal"],
      ["ر", "Arabic letter reh"],
      ["ز", "Arabic letter zain"],
      ["س", "Arabic letter seen"],
      ["ش", "Arabic letter sheen"],
      ["ص", "Arabic letter sad"],
      ["ض", "Arabic letter dad"],
      ["ط", "Arabic letter tah"],
      ["ظ", "Arabic letter zah"],
      ["ع", "Arabic letter ain"],
      ["غ", "Arabic letter ghain"],
      ["ـ", "Arabic tatweel"],
      ["ف", "Arabic letter feh"],
      ["ق", "Arabic letter qaf"],
      ["ك", "Arabic letter kaf"],
      ["ل", "Arabic letter lam"],
      ["م", "Arabic letter meem"],
      ["ن", "Arabic letter noon"],
      ["ه", "Arabic letter heh"],
      ["و", "Arabic letter waw"],
      ["ى", "Arabic letter alef maksura"],
      ["ي", "Arabic letter yeh"],
      ["ٱ", "Arabic letter alef wasla"],
      ["پ", "Arabic letter peh"],
      ["چ", "Arabic letter tcheh"],
      ["ژ", "Arabic letter jeh"],
      ["ک", "Arabic letter keheh"],
      ["گ", "Arabic letter gaf"],
      ["ی", "Arabic letter farsi yeh"]
    ]);
    const arabicMarkNameByValueChirho = new Map([
      ["ً", "Arabic fathatan"],
      ["ٌ", "Arabic dammatan"],
      ["ٍ", "Arabic kasratan"],
      ["َ", "Arabic fatha"],
      ["ُ", "Arabic damma"],
      ["ِ", "Arabic kasra"],
      ["ّ", "Arabic shadda"],
      ["ْ", "Arabic sukun"],
      ["ٰ", "Arabic superscript alef"]
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
    const combiningMarkReChirho = /[\u0300-\u036F\u0591-\u05BD\u05BF-\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u070F\u0730-\u074A]/u;
    function displayCodepointCharChirho(charChirho) {
      return (combiningMarkReChirho.test(charChirho) ? "◌" : "") + charChirho;
    }
    function codepointNamePartChirho(charChirho) {
      const directNameChirho =
        hebrewBaseLetterNameByValueChirho.get(charChirho) ??
        hebrewMarkNameByValueChirho.get(charChirho) ??
        greekBaseLetterNameByValueChirho.get(charChirho) ??
        syriacLetterNameByValueChirho.get(charChirho) ??
        syriacMarkNameByValueChirho.get(charChirho) ??
        arabicLetterNameByValueChirho.get(charChirho) ??
        arabicMarkNameByValueChirho.get(charChirho) ??
        combiningMarkNameByValueChirho.get(charChirho);
      if (directNameChirho) return " " + directNameChirho;
      const decomposedChirho = Array.from(charChirho.normalize("NFD"));
      if (decomposedChirho.length <= 1) return "";
      const partsChirho = decomposedChirho
        .map((partChirho) =>
          greekBaseLetterNameByValueChirho.get(partChirho) ??
          combiningMarkNameByValueChirho.get(partChirho) ??
          hebrewBaseLetterNameByValueChirho.get(partChirho) ??
          hebrewMarkNameByValueChirho.get(partChirho) ??
          syriacLetterNameByValueChirho.get(partChirho) ??
          syriacMarkNameByValueChirho.get(partChirho) ??
          arabicLetterNameByValueChirho.get(partChirho) ??
          arabicMarkNameByValueChirho.get(partChirho)
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
    function shellArgOrPlaceholderChirho(valueChirho, placeholderChirho) {
      const trimmedChirho = String(valueChirho ?? "").trim();
      return shellSingleQuoteChirho(trimmedChirho.length > 0 ? trimmedChirho : placeholderChirho);
    }
    function expertSuppliedTextCommandChirho(itemChirho, applyChirho) {
      const commandPartsChirho = [
        "bun run apply-expert-supplied-vision-text-chirho",
        "--",
        "--id-chirho=" + shellSingleQuoteChirho(itemChirho.idChirho),
        "--supplied-text-chirho=" + shellArgOrPlaceholderChirho(fieldValueChirho("supplied-text-command-chirho"), "<exact printed text>"),
        "--reviewer-chirho=" + shellArgOrPlaceholderChirho(fieldValueChirho("reviewer-chirho"), "<explicit-human-reviewer-id-chirho>"),
        "--reviewer-role-chirho=" + shellSingleQuoteChirho(itemChirho.reviewerChirho),
        "--rationale-chirho=" + shellArgOrPlaceholderChirho(fieldValueChirho("rationale-chirho"), "<why this exact text is supplied>"),
        "--expected-source-sha256-chirho=" + itemChirho.sourceSha256Chirho,
        "--expected-packet-sha256-chirho=" + itemChirho.packetSha256Chirho
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
        currentIssueFlagsChirho().length === 0 &&
        certifyExactCheckedChirho() &&
        certifyingReviewerAttributionErrorChirho(fieldValueChirho("reviewer-chirho")) === null &&
        reviewerFieldsCompleteChirho() &&
        reviewerRoleMatchesItemChirho(itemChirho);
    }
    function issueCanSubmitChirho() {
      return reviewerFieldsCompleteChirho() && currentIssueFlagsChirho().length > 0 && !certifyExactCheckedChirho();
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
    function markerStyleChirho(itemChirho) {
      return "left:" + itemChirho.markerLeftPctChirho.toFixed(4) + "%;width:" + itemChirho.markerWidthPctChirho.toFixed(4) + "%;";
    }
    function targetCropGeometryChirho(itemChirho) {
      const lineWidthChirho = Math.max(1, Number(itemChirho.lineWidthPxChirho) || 1);
      const spanStartChirho = Math.max(0, Math.min(lineWidthChirho, Number(itemChirho.spanXMinPxChirho) || 0));
      const spanWidthChirho = Math.max(1, Number(itemChirho.spanWidthPxChirho) || 1);
      const spanEndChirho = Math.max(spanStartChirho + 1, Math.min(lineWidthChirho, spanStartChirho + spanWidthChirho));
      const contextPxChirho = Math.max(48, Math.min(120, spanWidthChirho * 0.5));
      const cropStartChirho = Math.max(0, Math.floor(spanStartChirho - contextPxChirho));
      const cropEndChirho = Math.min(lineWidthChirho, Math.ceil(spanEndChirho + contextPxChirho));
      const cropWidthChirho = Math.max(1, cropEndChirho - cropStartChirho);
      return { lineWidthChirho, spanStartChirho, spanEndChirho, cropStartChirho, cropWidthChirho };
    }
    function targetCropImageStyleChirho(itemChirho) {
      const cropChirho = targetCropGeometryChirho(itemChirho);
      const imageWidthPctChirho = (cropChirho.lineWidthChirho / cropChirho.cropWidthChirho) * 100;
      const translatePctChirho = (cropChirho.cropStartChirho / cropChirho.lineWidthChirho) * 100;
      return "width:" + imageWidthPctChirho.toFixed(4) + "%;transform:translateX(-" + translatePctChirho.toFixed(4) + "%);";
    }
    function targetCropMarkerStyleChirho(itemChirho) {
      const cropChirho = targetCropGeometryChirho(itemChirho);
      const leftPctChirho = ((cropChirho.spanStartChirho - cropChirho.cropStartChirho) / cropChirho.cropWidthChirho) * 100;
      const widthPctChirho = ((cropChirho.spanEndChirho - cropChirho.spanStartChirho) / cropChirho.cropWidthChirho) * 100;
      return "left:" + leftPctChirho.toFixed(4) + "%;width:" + widthPctChirho.toFixed(4) + "%;";
    }
    function targetBoundaryTextChirho(itemChirho) {
      const cropChirho = targetCropGeometryChirho(itemChirho);
      const partsChirho = [
        "Target span: x" + cropChirho.spanStartChirho + ".." + cropChirho.spanEndChirho + " of " + cropChirho.lineWidthChirho + "px",
        "script " + itemChirho.scriptChirho,
        "segment " + itemChirho.segmentIndexChirho
      ];
      if (itemTextIsBlankChirho(itemChirho)) {
        partsChirho.push("blank text means supply only the script text inside the red box, not neighboring punctuation or context");
      }
      return partsChirho.join("; ") + ".";
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
      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Target crop - red box is the item" }));
      const targetCropWrapChirho = elChirho("div", { classChirho: "target-crop-wrap-chirho" });
      const targetCropFrameChirho = elChirho("div", { classChirho: "target-crop-frame-chirho" });
      targetCropFrameChirho.appendChild(elChirho("img", {
        classChirho: "target-crop-image-chirho",
        src: imageSrcChirho(itemChirho.markdownPathChirho),
        style: targetCropImageStyleChirho(itemChirho),
        alt: ""
      }));
      targetCropFrameChirho.appendChild(elChirho("div", {
        classChirho: "target-crop-marker-chirho",
        style: targetCropMarkerStyleChirho(itemChirho),
        "aria-label": "Target span"
      }));
      targetCropWrapChirho.appendChild(targetCropFrameChirho);
      leftChirho.appendChild(targetCropWrapChirho);
      leftChirho.appendChild(elChirho("div", { classChirho: "target-boundary-note-chirho", textChirho: targetBoundaryTextChirho(itemChirho) }));
      leftChirho.appendChild(elChirho("div", { classChirho: "image-label-chirho", textChirho: "Printed line - red box in context" }));
      const imageWrapChirho = elChirho("div", { classChirho: "image-wrap-chirho" });
      const imageFrameChirho = elChirho("div", { classChirho: "line-image-frame-chirho" });
      imageFrameChirho.appendChild(elChirho("img", { classChirho: "line-image-chirho", src: imageSrcChirho(itemChirho.markdownPathChirho), alt: "" }));
      imageFrameChirho.appendChild(elChirho("div", {
        classChirho: "span-marker-chirho",
        style: markerStyleChirho(itemChirho),
        "aria-label": "Target span"
      }));
      imageWrapChirho.appendChild(imageFrameChirho);
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
      const repeatClusterChirho = elChirho("div", { classChirho: "box-chirho" });
      repeatClusterChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Repeat cluster" }));
      repeatClusterChirho.appendChild(elChirho("div", { textChirho: repeatClusterTextChirho(itemChirho) }));
      repeatClusterChirho.appendChild(elChirho("a", {
        classChirho: "toolbar-link-chirho",
        href: exactTextClusterUrlChirho(itemChirho),
        textChirho: itemTextIsBlankChirho(itemChirho) ? "Open blank-text lane" : "Open exact-text cluster"
      }));
      sideChirho.appendChild(repeatClusterChirho);
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
        blankCommandBoxChirho.appendChild(elChirho("label", { classChirho: "label-chirho", for: "supplied-text-command-chirho", textChirho: "Exact supplied text for command" }));
        const suppliedTextCommandInputChirho = elChirho("textarea", {
          id: "supplied-text-command-chirho",
          placeholder: "exact printed text"
        });
        blankCommandBoxChirho.appendChild(suppliedTextCommandInputChirho);
        blankCommandBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Supplied text codepoints" }));
        const suppliedTextCodepointsChirho = elChirho("div", {
          classChirho: "text-box-chirho mono-chirho codepoints-chirho",
          textChirho: codepointTextChirho("")
        });
        blankCommandBoxChirho.appendChild(suppliedTextCodepointsChirho);
        blankCommandBoxChirho.appendChild(elChirho("div", {
          classChirho: "command-helper-note-chirho",
          textChirho: "This helper field only updates the copied command; it does not save, apply, confirm, or certify."
        }));
        blankCommandBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Dry-run after exact script-reader transcription" }));
        blankCommandBoxChirho.appendChild(commandRowChirho(() => expertSuppliedTextCommandChirho(itemChirho, false)));
        blankCommandBoxChirho.appendChild(elChirho("div", { classChirho: "label-chirho", textChirho: "Apply after dry-run verification" }));
        blankCommandBoxChirho.appendChild(commandRowChirho(() => expertSuppliedTextCommandChirho(itemChirho, true)));
        suppliedTextCommandInputChirho.addEventListener("input", () => {
          suppliedTextCodepointsChirho.textContent = codepointTextChirho(suppliedTextCommandInputChirho.value);
          refreshCommandRowsChirho(blankCommandBoxChirho);
        });
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
      formChirho.appendChild(elChirho("div", {
        classChirho: "issue-help-chirho",
        textChirho: "Issue reports block confirmation; use them for uncertainty, crop/source problems, wrong script, or segmentation."
      }));
      const issueGridChirho = elChirho("div", { classChirho: "issue-grid-chirho" });
      for (const optionChirho of issueFlagOptionsChirho) {
        const inputChirho = elChirho("input", { type: "checkbox", value: optionChirho.valueChirho });
        const textWrapChirho = elChirho("span", {}, [
          elChirho("span", { classChirho: "issue-label-text-chirho", textChirho: optionChirho.labelChirho }),
          elChirho("span", { classChirho: "issue-help-chirho", textChirho: optionChirho.helpChirho })
        ]);
        const labelChirho = elChirho("label", {
          classChirho: "issue-option-chirho",
          title: optionChirho.helpChirho,
          "aria-label": optionChirho.labelChirho + ": " + optionChirho.helpChirho
        }, [inputChirho, textWrapChirho]);
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
        if (currentIssueFlagsChirho().length > 0) actionMessagesChirho.push("Confirm requires no issue flags; use Report issue for flagged items");
        if (currentIssueFlagsChirho().length === 0) actionMessagesChirho.push("Report issue needs an issue flag");
        if (currentIssueFlagsChirho().length > 0 && certifyExactCheckedChirho()) actionMessagesChirho.push("Report issue cannot carry the exact-certification checkbox");
        actionStatusChirho.textContent = actionMessagesChirho.length === 0
          ? "Confirm and Report issue requirements are currently satisfied."
          : "Action requirements: " + actionMessagesChirho.join("; ") + ".";
        confirmChirho.disabled = !confirmationCanSubmitChirho(itemChirho);
        issueChirho.disabled = !issueCanSubmitChirho();
      };
      certifyInputChirho.addEventListener("change", updateActionButtonsChirho);
      for (const inputChirho of formChirho.querySelectorAll("#reviewer-chirho, #reviewer-role-chirho, #rationale-chirho")) {
        inputChirho.addEventListener("input", () => {
          updateActionButtonsChirho();
          refreshCommandRowsChirho(sideChirho);
        });
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
          expectedMarkdownPathChirho: itemChirho.markdownPathChirho,
          expectedSpanXMinPxChirho: itemChirho.spanXMinPxChirho,
          expectedSpanWidthPxChirho: itemChirho.spanWidthPxChirho,
          expectedLineWidthPxChirho: itemChirho.lineWidthPxChirho
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
      if (certifyExactCheckedChirho()) {
        setStatusChirho("Uncheck the exact-certification box before reporting an issue.");
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
          expectedMarkdownPathChirho: itemChirho.markdownPathChirho,
          expectedSpanXMinPxChirho: itemChirho.spanXMinPxChirho,
          expectedSpanWidthPxChirho: itemChirho.spanWidthPxChirho,
          expectedLineWidthPxChirho: itemChirho.lineWidthPxChirho
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
    document.getElementById("source-filter-chirho").addEventListener("change", (eventChirho) => {
      sourceFilterChirho = eventChirho.target.value;
      requestedItemIdChirho = null;
      indexChirho = 0;
      renderChirho();
    });
    document.getElementById("exact-text-filter-chirho").addEventListener("change", (eventChirho) => {
      exactTextFilterChirho = eventChirho.target.value;
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
        return new Response(htmlChirho(), { headers: reviewServerNoStoreHeadersChirho("text/html; charset=utf-8") });
      }
      if (urlChirho.pathname === "/favicon.ico") {
        return new Response(null, { status: 204 });
      }
      if (urlChirho.pathname === "/api-chirho/server-health-chirho") {
        return jsonResponseChirho(SERVER_HEALTH_CHIRHO);
      }
      if (urlChirho.pathname === "/quickstart-chirho") {
        if (!existsSync(VISION_TIER_EXPERT_CONFIRMATION_QUICKSTART_PATH_CHIRHO)) {
          return new Response("quickstart not found", { status: 404 });
        }
        return new Response(readFileSync(VISION_TIER_EXPERT_CONFIRMATION_QUICKSTART_PATH_CHIRHO, "utf8"), {
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
      if (urlChirho.pathname === "/asset-chirho") {
        const relativePathChirho = urlChirho.searchParams.get("path");
        if (!relativePathChirho) return new Response("missing path", { status: 400 });
        const assetPathChirho = safeAssetPathChirho(relativePathChirho);
        if (assetPathChirho === null || !existsSync(assetPathChirho)) return new Response("not found", { status: 404 });
        return new Response(Bun.file(assetPathChirho), { headers: reviewServerNoStoreHeadersChirho("image/png") });
      }
      if (urlChirho.pathname === "/api-chirho/state-chirho") {
        const { manifestChirho, liveByIdChirho, confirmedIdsChirho, reviewedIssueIdsChirho, openIssueDetailsByIdChirho } =
          loadCurrentStateChirho(policyPathChirho);
        return jsonResponseChirho({
          okChirho: true,
          generatedAtChirho: manifestChirho.generatedAtChirho ?? null,
          itemsChirho: reviewItemsForStateChirho(
            manifestChirho,
            liveByIdChirho,
            confirmedIdsChirho,
            reviewedIssueIdsChirho,
            openIssueDetailsByIdChirho
          ),
        });
      }
      if (urlChirho.pathname === "/api-chirho/confirm-chirho" && reqChirho.method === "POST") {
        const staleServerResponseChirho = staleReviewServerWriteResponseChirho();
        if (staleServerResponseChirho !== null) return staleServerResponseChirho;
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
        if (bodyChirho.issueFlagsChirho !== undefined) {
          let confirmIssueFlagsChirho: string[];
          try {
            confirmIssueFlagsChirho = parseIssueFlagsChirho(bodyChirho.issueFlagsChirho);
          } catch (errorChirho) {
            return jsonResponseChirho({
              okChirho: false,
              errorChirho: errorChirho instanceof Error ? errorChirho.message : String(errorChirho),
            }, 400);
          }
          if (confirmIssueFlagsChirho.length > 0) {
            return jsonResponseChirho({
              okChirho: false,
              errorChirho: "confirm-chirho cannot include issue flags; use Report issue for flagged items",
            }, 400);
          }
        }
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
        const staleDisplayChirho = staleDisplayMismatchChirho(bodyChirho, packetItemChirho, liveItemChirho);
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
        const staleServerResponseChirho = staleReviewServerWriteResponseChirho();
        if (staleServerResponseChirho !== null) return staleServerResponseChirho;
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
        if (bodyChirho.certifyExactChirho === true) {
          return jsonResponseChirho({
            okChirho: false,
            errorChirho: "issue-chirho cannot include certifyExactChirho=true; use Confirm only for exact confirmed items",
          }, 400);
        }
        const { manifestChirho, liveItemsChirho, liveByIdChirho } = loadCurrentStateChirho(policyPathChirho);
        const liveItemChirho = liveByIdChirho.get(itemIdChirho);
        if (liveItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown item" }, 404);
        const packetItemChirho = (manifestChirho.completeVisionItemsChirho ?? []).find((itemChirho) => itemChirho.idChirho === itemIdChirho);
        if (packetItemChirho === undefined) return jsonResponseChirho({ okChirho: false, errorChirho: "unknown packet item" }, 404);
        const staleDisplayChirho = staleDisplayMismatchChirho(bodyChirho, packetItemChirho, liveItemChirho);
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
