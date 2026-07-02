// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Apply exact text supplied by an expert for an empty vision-tier span.
 *
 * This is intentionally narrow: it only resolves an explicit vision-tier item
 * whose current live text is empty, and it requires an exact item id, explicit
 * human reviewer, reviewer role, rationale, and supplied text. Dry-run is the
 * default.
 *
 * Applying text does not certify the item. The span remains vision-chirho so it
 * still needs an explicit expert confirmation policy after the pack is
 * regenerated with the supplied text.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  EXPERT_MARKDOWN_PATH_PAIRS_CHIRHO,
  fileSha256Chirho,
  packetMarkdownPathDriftsChirho,
  summarizePacketMarkdownPathDriftChirho,
} from "./packet-image-fingerprint-chirho.ts";
import { assertCertifyingReviewerAttributionChirho } from "./reviewer-attribution-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "./span-nfc-chirho.ts";
import { valueLooksTemplatePlaceholderChirho } from "./template-placeholder-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";
import {
  expectedVisionTierReviewerRoleChirho,
  reviewerRoleMatchesScriptChirho,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";
import {
  visionTierExpertLiveItemsChirho,
  type VisionTierExpertLiveItemChirho,
} from "./vision-tier-expert-live-items-chirho.ts";

const MODULE_CHIRHO = "apply-expert-supplied-vision-text-chirho";
const EXPERT_PACK_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho"
);
const EXPERT_PACK_MANIFEST_PATH_CHIRHO = join(EXPERT_PACK_DIR_CHIRHO, "manifest-chirho.json");
export const DEFAULT_EXPERT_SUPPLIED_VISION_TEXT_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "expert-supplied-vision-transcriptions-2026-06-04-chirho.json"
);
const EXPERT_SUPPLIED_TRANSCRIPTIONS_BACKUP_SCHEMA_VERSION_CHIRHO = 2;
const ITEM_ID_RE_CHIRHO = /^v(\d+)-p(\d{4})-l(\d{3})-s(\d+)$/;
const SUPPLIED_TEXT_PLACEHOLDER_VALUES_CHIRHO = new Set([
  "exact printed text",
  "exact printed syriac text",
  "placeholder",
  "todo",
  "tbd",
]);
const RATIONALE_PLACEHOLDER_VALUES_CHIRHO = new Set([
  "why this exact text is supplied",
  "rationale",
  "reason",
  "placeholder",
  "todo",
  "tbd",
]);

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionNotesChirho?: string;
  expertTranscriptionStatusChirho?: string;
  expertTranscribedAtChirho?: string;
  expertTranscriptionReviewerChirho?: string;
  expertTranscriptionReviewerRoleChirho?: string;
  expertTranscriptionRationaleChirho?: string;
  expertTranscriptionPreviousTextChirho?: string;
  expertTranscriptionPreviousProvenanceChirho?: string;
  expertTranscriptionSourceChirho?: string;
  [keyChirho: string]: unknown;
}

interface SpanLineChirho {
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  spansChirho: SpanChirho[];
  [keyChirho: string]: unknown;
}

interface ExpertPackItemChirho {
  idChirho: string;
  scriptChirho: string;
  visionSourceChirho: string;
  currentTextChirho: string;
  sourcePathChirho: string;
  packetPathChirho: string;
  markdownPathChirho: string;
}

interface ExpertPackManifestChirho {
  completeVisionItemsChirho?: ExpertPackItemChirho[];
}

interface ExpertSuppliedTranscriptionRecordChirho {
  itemIdChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  scriptChirho: string;
  previousTextChirho: string;
  suppliedTextChirho: string;
  suppliedTextHashChirho: string;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
  appliedAtChirho: string;
  sourcePathChirho: string;
  sourceSha256Chirho: string;
  packetPathChirho: string;
  packetSha256Chirho: string;
  markdownPathChirho: string;
  linePathChirho: string;
}

interface ExpertSuppliedTranscriptionsBackupChirho {
  john316Chirho?: string;
  schemaVersionChirho?: number;
  generatedAtChirho?: string;
  reapplyChirho?: string;
  recordsChirho?: ExpertSuppliedTranscriptionRecordChirho[];
}

interface WritableExpertSuppliedTranscriptionsBackupChirho extends ExpertSuppliedTranscriptionsBackupChirho {
  schemaVersionChirho: number;
  recordsChirho: ExpertSuppliedTranscriptionRecordChirho[];
}

interface ParsedItemIdChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
}

export interface ApplyOptionsChirho {
  applyChirho: boolean;
  itemIdChirho: string;
  suppliedTextChirho: string;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
  backupPathChirho: string;
  expectedSourceSha256Chirho: string | null;
  expectedPacketSha256Chirho: string | null;
}

export interface ApplyReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "planned-chirho" | "applied-chirho" | "already-applied-chirho" | "blocked-chirho";
  itemIdChirho: string;
  linePathChirho: string | null;
  scriptChirho: string | null;
  previousTextChirho: string | null;
  suppliedTextChirho: string;
  suppliedTextHashChirho: string;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
  messagesChirho: string[];
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function nonEmptyArgChirho(argsChirho: string[], nameChirho: string): string {
  const valueChirho = parseArgValueChirho(argsChirho, nameChirho);
  if (valueChirho === undefined || valueChirho.trim().length === 0) {
    throw new Error(`--${nameChirho} is required`);
  }
  return valueChirho.trim();
}

function optionalSha256ArgChirho(argsChirho: string[], nameChirho: string): string | null {
  const valueChirho = parseArgValueChirho(argsChirho, nameChirho)?.trim();
  if (valueChirho === undefined || valueChirho.length === 0) return null;
  if (!/^[a-f0-9]{64}$/.test(valueChirho)) {
    throw new Error(`--${nameChirho} must be a lowercase sha256 hex digest`);
  }
  return valueChirho;
}

function assertBackupFileWritableChirho(pathChirho: string): WritableExpertSuppliedTranscriptionsBackupChirho | null {
  if (!existsSync(pathChirho)) return null;
  const backupChirho = loadJsonChirho<ExpertSuppliedTranscriptionsBackupChirho>(pathChirho);
  if (backupChirho.schemaVersionChirho !== EXPERT_SUPPLIED_TRANSCRIPTIONS_BACKUP_SCHEMA_VERSION_CHIRHO) {
    throw new Error(`unsupported backup schemaVersionChirho ${backupChirho.schemaVersionChirho}`);
  }
  if (!Array.isArray(backupChirho.recordsChirho)) {
    throw new Error("backup recordsChirho must be an array");
  }
  return backupChirho as WritableExpertSuppliedTranscriptionsBackupChirho;
}

function parsedItemIdChirho(itemIdChirho: string): ParsedItemIdChirho {
  const matchChirho = itemIdChirho.match(ITEM_ID_RE_CHIRHO);
  if (matchChirho === null) throw new Error(`--id-chirho is not a supported expert item id: ${itemIdChirho}`);
  return {
    volumeChirho: Number.parseInt(matchChirho[1]!, 10),
    pageChirho: Number.parseInt(matchChirho[2]!, 10),
    lineIndexChirho: Number.parseInt(matchChirho[3]!, 10),
    segmentIndexChirho: Number.parseInt(matchChirho[4]!, 10),
  };
}

function spanLinePathChirho(parsedChirho: ParsedItemIdChirho): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "spans-chirho",
    `vol-${parsedChirho.volumeChirho}-chirho`,
    `page-${String(parsedChirho.pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(parsedChirho.lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function sortedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function targetSpanChirho(lineChirho: SpanLineChirho, parsedChirho: ParsedItemIdChirho): SpanChirho {
  const spanChirho = sortedSpansChirho(lineChirho).find(
    (candidateChirho) => candidateChirho.segmentIndexChirho === parsedChirho.segmentIndexChirho
  );
  if (spanChirho === undefined) throw new Error(`target segment ${parsedChirho.segmentIndexChirho} missing`);
  return spanChirho;
}

function validateLineChirho(lineChirho: SpanLineChirho, parsedChirho: ParsedItemIdChirho): void {
  if (
    lineChirho.volumeChirho !== parsedChirho.volumeChirho ||
    lineChirho.pageChirho !== parsedChirho.pageChirho ||
    lineChirho.lineIndexChirho !== parsedChirho.lineIndexChirho
  ) {
    throw new Error("line file does not match target id");
  }
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortedSpansChirho(lineChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) throw new Error(`segment ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    if (spanChirho.xMinPxChirho !== expectedXChirho) throw new Error(`span ${indexChirho} xMin ${spanChirho.xMinPxChirho} !== ${expectedXChirho}`);
    if (spanChirho.widthPxChirho <= 0) throw new Error(`span ${indexChirho} has non-positive width`);
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
  }
}

function loadExpertPackItemMatchingTextChirho(
  itemIdChirho: string,
  liveItemChirho: VisionTierExpertLiveItemChirho,
  expectedPackTextsChirho: string[]
): ExpertPackItemChirho {
  const manifestChirho = loadJsonChirho<ExpertPackManifestChirho>(EXPERT_PACK_MANIFEST_PATH_CHIRHO);
  if (!Array.isArray(manifestChirho.completeVisionItemsChirho)) {
    throw new Error("expert pack manifest malformed: completeVisionItemsChirho missing");
  }
  const packItemChirho = manifestChirho.completeVisionItemsChirho.find((itemChirho) => itemChirho.idChirho === itemIdChirho);
  if (packItemChirho === undefined) throw new Error(`expert pack item missing: ${itemIdChirho}; regenerate make-expert-confirm-pack-chirho`);
  if (packItemChirho.scriptChirho !== liveItemChirho.scriptChirho) throw new Error(`${itemIdChirho} script drifted; regenerate expert pack`);
  if (packItemChirho.visionSourceChirho !== liveItemChirho.visionSourceChirho) throw new Error(`${itemIdChirho} source drifted; regenerate expert pack`);
  if (!expectedPackTextsChirho.includes(packItemChirho.currentTextChirho)) throw new Error(`${itemIdChirho} text drifted; regenerate expert pack`);
  if (!existsSync(packItemChirho.sourcePathChirho)) throw new Error(`${itemIdChirho} source image missing; regenerate expert pack`);
  if (!existsSync(packItemChirho.packetPathChirho)) throw new Error(`${itemIdChirho} packet image missing; regenerate expert pack`);
  if (!readFileSync(packItemChirho.sourcePathChirho).equals(readFileSync(packItemChirho.packetPathChirho))) {
    throw new Error(`${itemIdChirho} packet image differs from source scanline; regenerate expert pack`);
  }
  const markdownPathDriftsChirho = packetMarkdownPathDriftsChirho(
    [packItemChirho],
    EXPERT_PACK_DIR_CHIRHO,
    EXPERT_MARKDOWN_PATH_PAIRS_CHIRHO
  );
  if (markdownPathDriftsChirho.length !== 0) {
    throw new Error(
      `${itemIdChirho} markdown image path differs from packet image; regenerate expert pack: ${summarizePacketMarkdownPathDriftChirho(markdownPathDriftsChirho[0]!)}`
    );
  }
  return packItemChirho;
}

function loadFreshExpertPackItemChirho(itemIdChirho: string, liveItemChirho: VisionTierExpertLiveItemChirho): ExpertPackItemChirho {
  return loadExpertPackItemMatchingTextChirho(itemIdChirho, liveItemChirho, [liveItemChirho.currentTextChirho]);
}

function loadReconciliationExpertPackItemChirho(
  itemIdChirho: string,
  liveItemChirho: VisionTierExpertLiveItemChirho,
  metadataChirho: { previousTextChirho: string },
  optionsChirho: ApplyOptionsChirho
): ExpertPackItemChirho {
  return loadExpertPackItemMatchingTextChirho(itemIdChirho, liveItemChirho, [
    metadataChirho.previousTextChirho,
    optionsChirho.suppliedTextChirho,
  ]);
}

function normalizedSha256OptionChirho(valueChirho: string | null, nameChirho: string): string | null {
  if (valueChirho === null) return null;
  const trimmedChirho = valueChirho.trim();
  if (!/^[a-f0-9]{64}$/.test(trimmedChirho)) {
    throw new Error(`--${nameChirho} must be a lowercase sha256 hex digest`);
  }
  return trimmedChirho;
}

function validateApplyOptionsChirho(optionsChirho: ApplyOptionsChirho): ApplyOptionsChirho {
  const itemIdChirho = optionsChirho.itemIdChirho.trim();
  if (itemIdChirho.length === 0) throw new Error("--id-chirho is required");
  const suppliedTextChirho = normalizeTextForStorageChirho(optionsChirho.suppliedTextChirho);
  if (suppliedTextChirho.trim().length === 0) throw new Error("--supplied-text-chirho must not normalize to empty text");
  if (valueLooksTemplatePlaceholderChirho(suppliedTextChirho, SUPPLIED_TEXT_PLACEHOLDER_VALUES_CHIRHO)) {
    throw new Error("--supplied-text-chirho must be the exact printed transcription, not a template placeholder");
  }
  const reviewerChirho = optionsChirho.reviewerChirho.trim();
  if (reviewerChirho.length === 0) throw new Error("--reviewer-chirho is required");
  assertCertifyingReviewerAttributionChirho(reviewerChirho, "--reviewer-chirho");
  const reviewerRoleChirho = optionsChirho.reviewerRoleChirho.trim();
  if (reviewerRoleChirho.length === 0) throw new Error("--reviewer-role-chirho is required");
  const rationaleChirho = optionsChirho.rationaleChirho.trim();
  if (rationaleChirho.length === 0) throw new Error("--rationale-chirho is required");
  if (valueLooksTemplatePlaceholderChirho(rationaleChirho, RATIONALE_PLACEHOLDER_VALUES_CHIRHO)) {
    throw new Error("--rationale-chirho must explain why this exact text is supplied, not a template placeholder");
  }
  const expectedSourceSha256Chirho = normalizedSha256OptionChirho(
    optionsChirho.expectedSourceSha256Chirho,
    "expected-source-sha256-chirho"
  );
  const expectedPacketSha256Chirho = normalizedSha256OptionChirho(
    optionsChirho.expectedPacketSha256Chirho,
    "expected-packet-sha256-chirho"
  );
  if (optionsChirho.applyChirho && expectedSourceSha256Chirho === null) {
    throw new Error("--expected-source-sha256-chirho is required with --apply");
  }
  if (optionsChirho.applyChirho && expectedPacketSha256Chirho === null) {
    throw new Error("--expected-packet-sha256-chirho is required with --apply");
  }
  const backupPathChirho = optionsChirho.backupPathChirho.trim();
  if (backupPathChirho.length === 0) throw new Error("--backup-chirho must not be empty");
  if (optionsChirho.applyChirho) {
    assertBackupFileWritableChirho(backupPathChirho);
  }
  return {
    applyChirho: optionsChirho.applyChirho,
    itemIdChirho,
    suppliedTextChirho,
    reviewerChirho,
    reviewerRoleChirho,
    rationaleChirho,
    backupPathChirho,
    expectedSourceSha256Chirho,
    expectedPacketSha256Chirho,
  };
}

function parseOptionsChirho(): ApplyOptionsChirho {
  const argsChirho = process.argv.slice(2);
  return validateApplyOptionsChirho({
    applyChirho: argsChirho.includes("--apply"),
    itemIdChirho: nonEmptyArgChirho(argsChirho, "id-chirho"),
    suppliedTextChirho: nonEmptyArgChirho(argsChirho, "supplied-text-chirho"),
    reviewerChirho: nonEmptyArgChirho(argsChirho, "reviewer-chirho"),
    reviewerRoleChirho: nonEmptyArgChirho(argsChirho, "reviewer-role-chirho"),
    rationaleChirho: nonEmptyArgChirho(argsChirho, "rationale-chirho"),
    backupPathChirho:
      parseArgValueChirho(argsChirho, "backup-chirho") ?? DEFAULT_EXPERT_SUPPLIED_VISION_TEXT_BACKUP_PATH_CHIRHO,
    expectedSourceSha256Chirho: optionalSha256ArgChirho(argsChirho, "expected-source-sha256-chirho"),
    expectedPacketSha256Chirho: optionalSha256ArgChirho(argsChirho, "expected-packet-sha256-chirho"),
  });
}

function stateChirho(spanChirho: SpanChirho, optionsChirho: ApplyOptionsChirho): "pre-apply-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const currentTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
  if (
    currentTextChirho.length === 0 &&
    spanChirho.provenanceChirho === "vision-chirho"
  ) {
    return "pre-apply-chirho";
  }
  if (
    currentTextChirho === optionsChirho.suppliedTextChirho &&
    spanChirho.provenanceChirho === "vision-chirho" &&
    spanChirho.expertTranscriptionStatusChirho === "expert-supplied-text-applied-chirho"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function writeBackupRecordChirho(
  pathChirho: string,
  recordChirho: ExpertSuppliedTranscriptionRecordChirho,
  generatedAtChirho: string
): void {
  const backupChirho =
    assertBackupFileWritableChirho(pathChirho) ??
    {
        john316Chirho:
          "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
        schemaVersionChirho: EXPERT_SUPPLIED_TRANSCRIPTIONS_BACKUP_SCHEMA_VERSION_CHIRHO,
        recordsChirho: [],
      };
  const recordsChirho = backupChirho.recordsChirho.filter(
    (candidateChirho) => candidateChirho.itemIdChirho !== recordChirho.itemIdChirho
  );
  recordsChirho.push(recordChirho);
  backupChirho.schemaVersionChirho = EXPERT_SUPPLIED_TRANSCRIPTIONS_BACKUP_SCHEMA_VERSION_CHIRHO;
  backupChirho.generatedAtChirho = generatedAtChirho;
  backupChirho.reapplyChirho = "bun run apply-expert-supplied-vision-text-chirho -- --apply ...";
  backupChirho.recordsChirho = recordsChirho;
  writeJsonAtomicChirho(pathChirho, backupChirho);
}

function requiredSpanMetadataChirho(spanChirho: SpanChirho, keyChirho: keyof SpanChirho, itemIdChirho: string): string {
  const valueChirho = spanChirho[keyChirho];
  if (typeof valueChirho !== "string") {
    throw new Error(`${itemIdChirho} already-applied span is missing ${String(keyChirho)}`);
  }
  return valueChirho;
}

function appliedMetadataChirho(
  spanChirho: SpanChirho,
  optionsChirho: ApplyOptionsChirho
): {
  appliedAtChirho: string;
  previousTextChirho: string;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
} {
  const appliedAtChirho = requiredSpanMetadataChirho(spanChirho, "expertTranscribedAtChirho", optionsChirho.itemIdChirho);
  const previousTextChirho = requiredSpanMetadataChirho(
    spanChirho,
    "expertTranscriptionPreviousTextChirho",
    optionsChirho.itemIdChirho
  );
  const reviewerChirho = requiredSpanMetadataChirho(
    spanChirho,
    "expertTranscriptionReviewerChirho",
    optionsChirho.itemIdChirho
  );
  const reviewerRoleChirho = requiredSpanMetadataChirho(
    spanChirho,
    "expertTranscriptionReviewerRoleChirho",
    optionsChirho.itemIdChirho
  );
  const rationaleChirho = requiredSpanMetadataChirho(
    spanChirho,
    "expertTranscriptionRationaleChirho",
    optionsChirho.itemIdChirho
  );
  if (reviewerChirho !== optionsChirho.reviewerChirho) {
    throw new Error(`${optionsChirho.itemIdChirho} already-applied reviewer does not match --reviewer-chirho`);
  }
  if (reviewerRoleChirho !== optionsChirho.reviewerRoleChirho) {
    throw new Error(`${optionsChirho.itemIdChirho} already-applied reviewer role does not match --reviewer-role-chirho`);
  }
  if (rationaleChirho !== optionsChirho.rationaleChirho) {
    throw new Error(`${optionsChirho.itemIdChirho} already-applied rationale does not match --rationale-chirho`);
  }
  return {
    appliedAtChirho,
    previousTextChirho,
    reviewerChirho,
    reviewerRoleChirho,
    rationaleChirho,
  };
}

function backupRecordChirho(paramsChirho: {
  optionsChirho: ApplyOptionsChirho;
  parsedChirho: ParsedItemIdChirho;
  liveItemChirho: VisionTierExpertLiveItemChirho;
  packItemChirho: ExpertPackItemChirho;
  linePathChirho: string;
  previousTextChirho: string;
  appliedAtChirho: string;
  reviewerChirho: string;
  reviewerRoleChirho: string;
  rationaleChirho: string;
}): ExpertSuppliedTranscriptionRecordChirho {
  return {
    itemIdChirho: paramsChirho.optionsChirho.itemIdChirho,
    volumeChirho: paramsChirho.parsedChirho.volumeChirho,
    pageChirho: paramsChirho.parsedChirho.pageChirho,
    lineIndexChirho: paramsChirho.parsedChirho.lineIndexChirho,
    segmentIndexChirho: paramsChirho.parsedChirho.segmentIndexChirho,
    scriptChirho: paramsChirho.liveItemChirho.scriptChirho,
    previousTextChirho: paramsChirho.previousTextChirho,
    suppliedTextChirho: paramsChirho.optionsChirho.suppliedTextChirho,
    suppliedTextHashChirho: hashTextChirho(paramsChirho.optionsChirho.suppliedTextChirho),
    reviewerChirho: paramsChirho.reviewerChirho,
    reviewerRoleChirho: paramsChirho.reviewerRoleChirho,
    rationaleChirho: paramsChirho.rationaleChirho,
    appliedAtChirho: paramsChirho.appliedAtChirho,
    sourcePathChirho: paramsChirho.packItemChirho.sourcePathChirho,
    sourceSha256Chirho: fileSha256Chirho(paramsChirho.packItemChirho.sourcePathChirho),
    packetPathChirho: paramsChirho.packItemChirho.packetPathChirho,
    packetSha256Chirho: fileSha256Chirho(paramsChirho.packItemChirho.packetPathChirho),
    markdownPathChirho: paramsChirho.packItemChirho.markdownPathChirho,
    linePathChirho: paramsChirho.linePathChirho,
  };
}

function assertExpectedImageHashesChirho(
  itemIdChirho: string,
  packItemChirho: ExpertPackItemChirho,
  optionsChirho: ApplyOptionsChirho
): void {
  if (optionsChirho.expectedSourceSha256Chirho !== null) {
    const actualSourceSha256Chirho = fileSha256Chirho(packItemChirho.sourcePathChirho);
    if (actualSourceSha256Chirho !== optionsChirho.expectedSourceSha256Chirho) {
      throw new Error(
        `${itemIdChirho} source image hash mismatch; expected ${optionsChirho.expectedSourceSha256Chirho}, current ${actualSourceSha256Chirho}`
      );
    }
  }
  if (optionsChirho.expectedPacketSha256Chirho !== null) {
    const actualPacketSha256Chirho = fileSha256Chirho(packItemChirho.packetPathChirho);
    if (actualPacketSha256Chirho !== optionsChirho.expectedPacketSha256Chirho) {
      throw new Error(
        `${itemIdChirho} packet image hash mismatch; expected ${optionsChirho.expectedPacketSha256Chirho}, current ${actualPacketSha256Chirho}`
      );
    }
  }
}

function reportChirho(paramsChirho: {
  optionsChirho: ApplyOptionsChirho;
  statusChirho: ApplyReportChirho["statusChirho"];
  linePathChirho: string | null;
  scriptChirho: string | null;
  previousTextChirho: string | null;
  messagesChirho: string[];
}): ApplyReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho: paramsChirho.optionsChirho.applyChirho ? "apply-chirho" : "dry-run-chirho",
    statusChirho: paramsChirho.statusChirho,
    itemIdChirho: paramsChirho.optionsChirho.itemIdChirho,
    linePathChirho: paramsChirho.linePathChirho,
    scriptChirho: paramsChirho.scriptChirho,
    previousTextChirho: paramsChirho.previousTextChirho,
    suppliedTextChirho: paramsChirho.optionsChirho.suppliedTextChirho,
    suppliedTextHashChirho: hashTextChirho(paramsChirho.optionsChirho.suppliedTextChirho),
    reviewerChirho: paramsChirho.optionsChirho.reviewerChirho,
    reviewerRoleChirho: paramsChirho.optionsChirho.reviewerRoleChirho,
    rationaleChirho: paramsChirho.optionsChirho.rationaleChirho,
    messagesChirho: paramsChirho.messagesChirho,
  };
}

export function applyExpertSuppliedVisionTextChirho(rawOptionsChirho: ApplyOptionsChirho): ApplyReportChirho {
  const optionsChirho = validateApplyOptionsChirho(rawOptionsChirho);
  const parsedChirho = parsedItemIdChirho(optionsChirho.itemIdChirho);
  const linePathChirho = spanLinePathChirho(parsedChirho);
  const lineChirho = loadJsonChirho<SpanLineChirho>(linePathChirho);
  validateLineChirho(lineChirho, parsedChirho);
  const spanChirho = targetSpanChirho(lineChirho, parsedChirho);
  const liveItemChirho = visionTierExpertLiveItemsChirho().find((itemChirho) => itemChirho.idChirho === optionsChirho.itemIdChirho);
  const currentStateChirho = stateChirho(spanChirho, optionsChirho);
  if (currentStateChirho === "pre-apply-chirho" && liveItemChirho === undefined) {
    throw new Error(`${optionsChirho.itemIdChirho} is not in the live vision-tier expert queue`);
  }
  if (currentStateChirho === "unknown-chirho") {
    return reportChirho({
      optionsChirho,
      statusChirho: "blocked-chirho",
      linePathChirho,
      scriptChirho: spanChirho.scriptChirho,
      previousTextChirho: spanChirho.utf8TextChirho,
      messagesChirho: ["target span is neither an empty vision-tier item nor the already-applied expert-supplied text"],
    });
  }
  const liveItemPresentChirho = liveItemChirho;
  if (liveItemPresentChirho === undefined) {
    throw new Error(`${optionsChirho.itemIdChirho} is not in the live vision-tier expert queue`);
  }
  if (!reviewerRoleMatchesScriptChirho(liveItemPresentChirho.scriptChirho, optionsChirho.reviewerRoleChirho)) {
    throw new Error(
      `--reviewer-role-chirho must be "${expectedVisionTierReviewerRoleChirho(liveItemPresentChirho.scriptChirho)}" for ${liveItemPresentChirho.scriptChirho}`
    );
  }
  if (currentStateChirho === "already-applied-chirho") {
    const metadataChirho = appliedMetadataChirho(spanChirho, optionsChirho);
    const packItemChirho = loadReconciliationExpertPackItemChirho(
      optionsChirho.itemIdChirho,
      liveItemPresentChirho,
      metadataChirho,
      optionsChirho
    );
    assertExpectedImageHashesChirho(optionsChirho.itemIdChirho, packItemChirho, optionsChirho);
    if (optionsChirho.applyChirho) {
      writeBackupRecordChirho(
        optionsChirho.backupPathChirho,
        backupRecordChirho({
          optionsChirho,
          parsedChirho,
          liveItemChirho: liveItemPresentChirho,
          packItemChirho,
          linePathChirho,
          previousTextChirho: metadataChirho.previousTextChirho,
          appliedAtChirho: metadataChirho.appliedAtChirho,
          reviewerChirho: metadataChirho.reviewerChirho,
          reviewerRoleChirho: metadataChirho.reviewerRoleChirho,
          rationaleChirho: metadataChirho.rationaleChirho,
        }),
        new Date().toISOString()
      );
    }
    return reportChirho({
      optionsChirho,
      statusChirho: "already-applied-chirho",
      linePathChirho,
      scriptChirho: spanChirho.scriptChirho,
      previousTextChirho: metadataChirho.previousTextChirho,
      messagesChirho: [
        optionsChirho.applyChirho
          ? "expert-supplied text is already applied; durable backup record reconciled"
          : "expert-supplied text is already applied",
      ],
    });
  }
  const packItemChirho = loadFreshExpertPackItemChirho(optionsChirho.itemIdChirho, liveItemPresentChirho);
  assertExpectedImageHashesChirho(optionsChirho.itemIdChirho, packItemChirho, optionsChirho);
  if (liveItemPresentChirho.currentTextChirho.length !== 0) {
    throw new Error(`${optionsChirho.itemIdChirho} is not empty; this tool only resolves blank expert transcription items`);
  }
  if (!optionsChirho.applyChirho) {
    return reportChirho({
      optionsChirho,
      statusChirho: "planned-chirho",
      linePathChirho,
      scriptChirho: spanChirho.scriptChirho,
      previousTextChirho: spanChirho.utf8TextChirho,
      messagesChirho: ["ready to apply expert-supplied text; add --apply after verifying the exact printed transcription"],
    });
  }

  const appliedAtChirho = new Date().toISOString();
  const previousTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
  const previousProvenanceChirho = spanChirho.provenanceChirho ?? "";
  spanChirho.utf8TextChirho = optionsChirho.suppliedTextChirho;
  spanChirho.provenanceChirho = "vision-chirho";
  spanChirho.expertTranscriptionStatusChirho = "expert-supplied-text-applied-chirho";
  spanChirho.expertTranscribedAtChirho = appliedAtChirho;
  spanChirho.expertTranscriptionReviewerChirho = optionsChirho.reviewerChirho;
  spanChirho.expertTranscriptionReviewerRoleChirho = optionsChirho.reviewerRoleChirho;
  spanChirho.expertTranscriptionRationaleChirho = optionsChirho.rationaleChirho;
  spanChirho.expertTranscriptionPreviousTextChirho = previousTextChirho;
  spanChirho.expertTranscriptionPreviousProvenanceChirho = previousProvenanceChirho;
  spanChirho.expertTranscriptionSourceChirho = "expert-supplied-vision-text-chirho";
  normalizeSpanLineTextFieldsChirho(lineChirho);
  validateLineChirho(lineChirho, parsedChirho);
  writeJsonAtomicChirho(linePathChirho, lineChirho);
  writeBackupRecordChirho(
    optionsChirho.backupPathChirho,
    backupRecordChirho({
      optionsChirho,
      parsedChirho,
      liveItemChirho: liveItemPresentChirho,
      packItemChirho,
      linePathChirho,
      previousTextChirho,
      reviewerChirho: optionsChirho.reviewerChirho,
      reviewerRoleChirho: optionsChirho.reviewerRoleChirho,
      rationaleChirho: optionsChirho.rationaleChirho,
      appliedAtChirho,
    }),
    appliedAtChirho
  );
  return reportChirho({
    optionsChirho,
    statusChirho: "applied-chirho",
    linePathChirho,
    scriptChirho: spanChirho.scriptChirho,
    previousTextChirho,
    messagesChirho: [
      "applied expert-supplied text and wrote durable backup record; item remains vision-chirho until explicit expert confirmation",
    ],
  });
}

function mainChirho(): void {
  const reportResultChirho = applyExpertSuppliedVisionTextChirho(parseOptionsChirho());
  console.log(JSON.stringify(reportResultChirho, null, 2));
  if (reportResultChirho.statusChirho === "blocked-chirho") process.exitCode = 1;
}

if (import.meta.main) mainChirho();
