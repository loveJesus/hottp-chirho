// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Report the difference between a structurally clean export and a fully
 * certified transcription.
 *
 * Default mode writes a status report and exits 0. Use --strict to make this a
 * gate: exit 1 until no raw Pass-C Hebrew spans and no vision-tier non-Latin
 * spans remain uncertified.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO,
  readLatinSymbolAcceptancePolicyFileChirho,
  summarizeLatinSymbolAcceptancePolicyChirho,
} from "./latin-symbol-vision-acceptance-policy-chirho.ts";
import {
  countByScriptChirho,
  hashTextChirho,
  latinSymbolVisionLiveSnapshotChirho,
  summarizeSymbolRiskChirho,
  type LatinSymbolVisionLiveItemChirho,
  type LatinSymbolVisionSymbolRiskSummaryChirho,
} from "./latin-symbol-vision-live-items-chirho.ts";
import {
  countPassCHumanValidationRowsMissingFromBackupChirho,
  passCHumanValidationBackupRowsChirho,
  passCHumanValidationBackupRowsFromDbPathChirho,
  passCHumanValidationBackupShapeOkChirho,
  PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO,
  readPassCHumanValidationBackupFileChirho,
} from "./pass-c-human-validation-backup-chirho.ts";
import {
  d1AuditFingerprintForDbPathChirho,
  latestLocalD1PathChirho,
} from "./d1-audit-fingerprint-chirho.ts";
import { spanSourceFingerprintForTargetsChirho } from "./source-fingerprint-chirho.ts";
import {
  scanNonNfcSpanTextFieldsChirho,
  scanSpanLinePathsChirho,
  spanLinePathChirho,
  type SpanLineLikeChirho,
  type SpanLikeChirho,
} from "./span-nfc-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";
import { normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";
import {
  readVisionTierExpertConfirmationFileChirho,
  summarizeVisionTierExpertConfirmationsChirho,
  VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO,
} from "./vision-tier-expert-confirmation-policy-chirho.ts";
import {
  countVisionTierExpertByScriptChirho,
  visionTierExpertLiveSnapshotChirho,
} from "./vision-tier-expert-live-items-chirho.ts";

const MODULE_CHIRHO = "transcription-certification-status-chirho";
const EXPORT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "markdown-chirho",
  "export-report-chirho.json"
);
const RAW_HEBREW_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho",
  "pass-c-hebrew-validation-chirho.json"
);
const EXPERT_PACK_MANIFEST_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho",
  "manifest-chirho.json"
);
const EXPERT_PACK_INDEX_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho",
  "index-chirho.md"
);
const RAW_HEBREW_PACK_INDEX_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-human-pack-chirho",
  "2026-05-31-chirho",
  "index-chirho.md"
);
const RAW_HEBREW_PACK_MANIFEST_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-human-pack-chirho",
  "2026-05-31-chirho",
  "manifest-chirho.json"
);
const LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "latin-symbol-vision-pack-chirho",
  "2026-05-31-chirho",
  "manifest-chirho.json"
);
const LATIN_SYMBOL_PACK_INDEX_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "latin-symbol-vision-pack-chirho",
  "2026-05-31-chirho",
  "index-chirho.md"
);
const REVIEWER_SCOPE_GUIDE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "reviewer-scope-and-primer-2026-06-02-chirho.md"
);
const ZECHARIAH_TIPCHA_CONFIRMATION_AID_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "zechariah-tipcha-confirmation-2026-06-03-chirho.md"
);
const LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "latin-symbol-vision-reviews-backup-2026-05-31-chirho.json"
);
const OUT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "certification-status-chirho");
const ALLOWED_WLC_CORRECTION_FLAGS_CHIRHO = new Set([
  "accents-chirho",
  "vowels-chirho",
  "hebrew-punctuation-chirho",
]);

interface ExportReportChirho {
  generatedAtChirho?: string;
  d1DbPathChirho?: string | null;
  spanSourceFileCountChirho?: number;
  spanSourceFingerprintChirho?: string;
  d1AuditFingerprintChirho?: string | null;
  d1AuditPageRowCountChirho?: number | null;
  d1AuditWordRowCountChirho?: number | null;
  d1AuditOcrSuggestionRowCountChirho?: number | null;
  strictPassedChirho?: boolean;
  issueCountChirho?: number;
  issuesChirho?: ExportIssueChirho[];
  pagesChirho?: ExportPageReportChirho[];
  unknownSpanCountChirho?: number;
  nonNfcSpanCountChirho?: number;
  hebrewSpanCountChirho?: number;
  passCOcrHebrewSpanCountChirho?: number;
  crnnValidatedHebrewSpanCountChirho?: number;
  d1PagesWithoutSpansChirho?: unknown[];
}

interface ExportPageReportChirho {
  volumeChirho?: number;
  pageChirho?: number;
}

interface ExportIssueChirho {
  severityChirho?: string;
  codeChirho?: string;
  messageChirho?: string;
  volumeChirho?: number;
  pageChirho?: number;
  lineIndexChirho?: number;
  segmentIndexChirho?: number;
}

interface GuardedWlcCorrectionCommandChirho {
  locationChirho: string;
  humanValidationIdChirho: number;
  suggestedTextChirho: string;
  commandChirho: string;
}

interface SuggestedCorrectionSpanChirho extends SpanLikeChirho {
  humanReviewStatusChirho?: string;
  humanIssueFlagsChirho?: string[];
  humanValidationIdChirho?: number;
  wlcSuggestionSourceChirho?: string;
}

interface SuggestedCorrectionLineChirho extends SpanLineLikeChirho {
  spansChirho?: SuggestedCorrectionSpanChirho[];
}

interface RawHebrewSpanChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  validationStatusChirho: string;
  textChirho: string;
  lineTextChirho: string;
}

interface RawHebrewReportChirho {
  generatedAtChirho?: string;
  sourceFilterChirho?: string;
  sourceCountsChirho?: Record<string, number>;
  spanCountChirho?: number;
  tokenCountChirho?: number;
  allTokenValidatedSpanCountChirho?: number;
  partialTokenValidatedSpanCountChirho?: number;
  unvalidatedSpanCountChirho?: number;
  validatedTokenCountChirho?: number;
  spansChirho?: RawHebrewSpanChirho[];
}

interface RawHebrewPackItemChirho {
  idChirho: string;
  validationStatusChirho: string;
  textChirho: string;
  lineTextChirho: string;
}

interface RawHebrewPackManifestChirho {
  generatedAtChirho?: string;
  reportGeneratedAtChirho?: string;
  sourceFilterChirho?: string;
  countsChirho?: Record<string, number>;
  itemsChirho?: RawHebrewPackItemChirho[];
}

interface RawHebrewReportLiveDriftChirho {
  idChirho: string;
  reasonChirho: string;
  reportTextChirho: string;
  liveTextChirho: string | null;
}

interface ExpertPackManifestChirho {
  generatedAtChirho?: string;
  priorityItemsChirho?: unknown[];
  completeVisionCountsChirho?: Record<string, number>;
  completeVisionItemsChirho?: ExpertPackVisionItemChirho[];
}

interface ExpertPackVisionItemChirho {
  idChirho: string;
  scriptChirho: string;
  visionSourceChirho: string;
  currentTextChirho: string;
  priorityMatchChirho?: boolean;
}

interface LatinSymbolPackItemChirho {
  idChirho: string;
  textChirho: string;
  lineTextChirho: string;
}

interface LatinSymbolPackManifestChirho {
  generatedAtChirho?: string;
  explicitSpanCountChirho?: number;
  d1DerivedWordCountChirho?: number;
  countsChirho?: Record<string, number>;
  itemsChirho?: LatinSymbolPackItemChirho[];
}

interface HumanValidationDbRowChirho {
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  verdict_chirho: string;
  applied_at_chirho: string | null;
  schema_version_chirho: number;
}

interface LatinSymbolReviewBackupReviewChirho {
  itemIdChirho?: string;
  currentTextHashChirho?: string;
  verdictChirho?: string;
  appliedAtChirho?: string | null;
  schemaVersionChirho?: number;
  updatedAtChirho?: string;
}

interface LatinSymbolReviewBackupChirho {
  schemaVersionChirho?: number;
  reviewsChirho?: LatinSymbolReviewBackupReviewChirho[];
}

interface LatinSymbolPolicySummaryForStatusChirho {
  policyFileExistsChirho: boolean;
  policyFileShapeOkChirho: boolean;
  acceptedPolicyCountChirho: number;
  acceptedPolicyItemCountChirho: number;
  validAcceptedPolicyItemCountChirho: number;
  staleAcceptedPolicyItemCountChirho: number;
  duplicateAcceptedPolicyItemCountChirho: number;
  shapeErrorsChirho: string[];
}

interface VisionTierExpertConfirmationSummaryForStatusChirho {
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
  shapeErrorsChirho: string[];
}

interface LatinSymbolReviewRowChirho {
  itemIdChirho: string;
  currentTextHashChirho: string;
  verdictChirho: string;
  appliedAtChirho: string | null;
  schemaVersionChirho: number;
  updatedAtChirho: string;
  rowSourceChirho: "db-chirho" | "backup-chirho";
}

interface HumanValidationSummaryChirho {
  currentSchema2RowsChirho: number;
  reviewedCleanRowsChirho: number;
  reviewedIssueRowsChirho: number;
  appliedRowsChirho: number;
  rawQueueCurrentRowsChirho: number;
  rawQueueCleanRowsChirho: number;
  rawQueueIssueRowsChirho: number;
  rawQueueAppliedRowsChirho: number;
  legacyCurrentRowsChirho: number;
}

interface PassCHumanValidationBackupSummaryChirho {
  backupRowsChirho: number;
  dbRowsChirho: number;
  localRowsMissingFromBackupChirho: number;
}

interface LatinSymbolReviewSummaryChirho {
  currentRowsChirho: number;
  validReviewedCleanRowsChirho: number;
  validReviewedIssueRowsChirho: number;
  staleRowsChirho: number;
  appliedRowsChirho: number;
}

interface LatinSymbolReviewBackupSummaryChirho {
  backupRowsChirho: number;
  dbRowsChirho: number;
  localRowsMissingFromBackupChirho: number;
}

interface CertificationStatusChirho {
  generatedAtChirho: string;
  artifactsChirho: {
    exportReportExistsChirho: boolean;
    rawHebrewReportExistsChirho: boolean;
    rawHebrewPackManifestExistsChirho: boolean;
    passCHumanValidationBackupExistsChirho: boolean;
    expertPackManifestExistsChirho: boolean;
    visionTierExpertConfirmationPolicyExistsChirho: boolean;
    latinSymbolPackManifestExistsChirho: boolean;
    latinSymbolReviewBackupExistsChirho: boolean;
    latinSymbolAcceptancePolicyExistsChirho: boolean;
    exportReportShapeOkChirho: boolean;
    rawHebrewReportShapeOkChirho: boolean;
    rawHebrewPackManifestShapeOkChirho: boolean;
    passCHumanValidationBackupShapeOkChirho: boolean;
    expertPackManifestShapeOkChirho: boolean;
    visionTierExpertConfirmationPolicyShapeOkChirho: boolean;
    latinSymbolPackManifestShapeOkChirho: boolean;
    latinSymbolReviewBackupShapeOkChirho: boolean;
    latinSymbolAcceptancePolicyShapeOkChirho: boolean;
  };
  structuralChirho: {
    exportGeneratedAtChirho: string | null;
    strictPassedChirho: boolean;
    issueCountChirho: number;
    issueCodeCountsChirho: Record<string, number>;
    issueSummariesChirho: string[];
    guardedWlcCorrectionCommandsChirho: GuardedWlcCorrectionCommandChirho[];
    spanSourceFileCountChirho: number | null;
    liveSpanSourceFileCountChirho: number;
    spanSourceFingerprintMatchesCurrentChirho: boolean;
    d1AuditDbPathChirho: string | null;
    liveD1AuditDbPathChirho: string | null;
    d1AuditPageRowCountChirho: number | null;
    liveD1AuditPageRowCountChirho: number | null;
    d1AuditWordRowCountChirho: number | null;
    liveD1AuditWordRowCountChirho: number | null;
    d1AuditOcrSuggestionRowCountChirho: number | null;
    liveD1AuditOcrSuggestionRowCountChirho: number | null;
    d1AuditFingerprintMatchesCurrentChirho: boolean | null;
    d1AuditFingerprintReadErrorChirho: string | null;
    unknownSpanCountChirho: number;
    nonNfcSpanCountChirho: number;
    d1GapPageCountChirho: number;
    hebrewSpanCountChirho: number;
    passCOcrHebrewSpanCountChirho: number;
    crnnValidatedHebrewSpanCountChirho: number;
  };
  rawHebrewChirho: {
    reportGeneratedAtChirho: string | null;
    sourceFilterChirho: string | null;
    reportSpanCountChirho: number;
    reportTokenCountChirho: number;
    unvalidatedSpanCountChirho: number;
    partialValidatedSpanCountChirho: number;
    allTokenValidatedSpanCountChirho: number;
    livePendingSpanCountChirho: number;
    livePendingUnvalidatedSpanCountChirho: number;
    livePendingPartialValidatedSpanCountChirho: number;
    livePendingAllTokenValidatedSpanCountChirho: number;
    validatedTokenCountChirho: number;
    sourceCountsChirho: Record<string, number>;
    exportPassCOcrMatchesReportChirho: boolean;
    packGeneratedAtChirho: string | null;
    packItemCountChirho: number;
    packCountMatchesCurrentChirho: boolean;
    packIdsMatchCurrentChirho: boolean;
    packTextMatchesCurrentChirho: boolean;
    packLineTextMatchesCurrentChirho: boolean;
    packStatusMatchesCurrentChirho: boolean;
    liveReportMatchesSpanFilesChirho: boolean;
    liveReportDriftCountChirho: number;
    liveReportDriftSamplesChirho: string[];
  };
  visionTierChirho: {
    d1ReadErrorChirho: string | null;
    manifestGeneratedAtChirho: string | null;
    priorityItemCountChirho: number;
    completeVisionItemCountChirho: number;
    completeVisionCountsChirho: Record<string, number>;
    liveVisionItemCountChirho: number;
    liveVisionCountsChirho: Record<string, number>;
    pendingVisionItemCountChirho: number;
    pendingVisionCountsChirho: Record<string, number>;
    pendingPriorityItemCountChirho: number;
    pendingAppendixItemCountChirho: number;
    manifestCountMatchesCurrentChirho: boolean;
    manifestIdsMatchCurrentChirho: boolean;
    manifestTextMatchesCurrentChirho: boolean;
    confirmedByPolicyCountChirho: number;
    reviewedIssueByPolicyCountChirho: number;
    remainingConfirmationCountChirho: number;
  };
  latinSymbolVisionChirho: {
    d1ReadErrorChirho: string | null;
    explicitVisionItemCountChirho: number;
    explicitVisionCountsChirho: Record<string, number>;
    d1DerivedVisionWordCountChirho: number;
    d1DerivedVisionCountsChirho: Record<string, number>;
    symbolRiskSummaryChirho: LatinSymbolVisionSymbolRiskSummaryChirho;
    reviewPacketItemCountChirho: number;
    reviewPacketCountMatchesCurrentChirho: boolean;
    reviewPacketIdsMatchCurrentChirho: boolean;
    reviewPacketTextMatchesCurrentChirho: boolean;
    reviewPacketLineTextMatchesCurrentChirho: boolean;
    reviewedCleanCountChirho: number;
    reviewedIssueCountChirho: number;
    acceptedByPolicyCountChirho: number;
    totalAcceptedDecisionCountChirho: number;
    issueOverriddenAcceptedDecisionCountChirho: number;
    staleReviewCountChirho: number;
    pendingDecisionCountChirho: number;
    pendingDecisionCountsChirho: Record<string, number>;
    pendingTrivialPunctuationSymbolItemCountChirho: number;
    pendingMixedScriptSymbolItemCountChirho: number;
    pendingNontrivialSymbolItemCountChirho: number;
    remainingDecisionCountChirho: number;
    includedInCompletionGateChirho: boolean;
  };
  normalizationChirho: {
    liveNonNfcSpanTextFieldCountChirho: number;
    liveNonNfcSpanFileCountChirho: number;
  };
  humanValidationDbChirho: HumanValidationSummaryChirho;
  passCHumanValidationBackupChirho: PassCHumanValidationBackupSummaryChirho;
  visionTierExpertConfirmationPolicyChirho: VisionTierExpertConfirmationSummaryForStatusChirho;
  latinSymbolReviewDbChirho: LatinSymbolReviewSummaryChirho;
  latinSymbolReviewBackupChirho: LatinSymbolReviewBackupSummaryChirho;
  latinSymbolAcceptancePolicyChirho: LatinSymbolPolicySummaryForStatusChirho;
  certificationCompleteChirho: boolean;
  remainingWorkChirho: string[];
}

function readJsonFileChirho<TChirho>(pathChirho: string, fallbackChirho: TChirho): TChirho {
  if (!existsSync(pathChirho)) return fallbackChirho;
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function shellSingleQuoteChirho(valueChirho: string): string {
  return `'${valueChirho.replace(/'/g, `'\\''`)}'`;
}

function urlQueryChirho(entriesChirho: Array<[string, string]>): string {
  return new URLSearchParams(entriesChirho).toString();
}

function latinSymbolReviewUrlChirho(scriptChirho: string, symbolRiskChirho?: string): string {
  const entriesChirho: Array<[string, string]> = [["script-chirho", scriptChirho]];
  if (symbolRiskChirho !== undefined) entriesChirho.push(["symbol-risk-chirho", symbolRiskChirho]);
  return `http://localhost:8770/?${urlQueryChirho(entriesChirho)}`;
}

function rawHebrewReviewUrlChirho(validationStatusChirho?: string, reviewStateChirho?: string): string {
  const entriesChirho: Array<[string, string]> = [];
  if (validationStatusChirho !== undefined) entriesChirho.push(["validation-status-chirho", validationStatusChirho]);
  if (reviewStateChirho !== undefined) entriesChirho.push(["review-state-chirho", reviewStateChirho]);
  const queryChirho = urlQueryChirho(entriesChirho);
  return queryChirho.length === 0 ? "http://localhost:8766/" : `http://localhost:8766/?${queryChirho}`;
}

function expertReviewUrlChirho(scriptChirho?: string, priorityChirho?: string): string {
  const entriesChirho: Array<[string, string]> = [];
  if (scriptChirho !== undefined) entriesChirho.push(["script-chirho", scriptChirho]);
  if (priorityChirho !== undefined) entriesChirho.push(["priority-chirho", priorityChirho]);
  const queryChirho = urlQueryChirho(entriesChirho);
  return queryChirho.length === 0 ? "http://localhost:8771/" : `http://localhost:8771/?${queryChirho}`;
}

function hebrewSkeletonChirho(textChirho: string): string {
  return textChirho
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^\u05D0-\u05EA]/g, "");
}

function allowedWlcCorrectionFlagsChirho(flagsChirho: unknown): boolean {
  return Array.isArray(flagsChirho) &&
    flagsChirho.length > 0 &&
    flagsChirho.every((flagChirho) => typeof flagChirho === "string" && ALLOWED_WLC_CORRECTION_FLAGS_CHIRHO.has(flagChirho));
}

function guardedWlcCorrectionCommandsChirho(): GuardedWlcCorrectionCommandChirho[] {
  const commandsChirho: GuardedWlcCorrectionCommandChirho[] = [];
  for (const linePathChirho of scanSpanLinePathsChirho()) {
    const lineChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as SuggestedCorrectionLineChirho;
    for (const spanChirho of lineChirho.spansChirho ?? []) {
      if (spanChirho.humanReviewStatusChirho !== "reviewed-issues-chirho") continue;
      if (spanChirho.scriptChirho !== "hebrew-chirho") continue;
      if (typeof spanChirho.humanValidationIdChirho !== "number") continue;
      if (!allowedWlcCorrectionFlagsChirho(spanChirho.humanIssueFlagsChirho)) continue;
      if (typeof spanChirho.utf8TextChirho !== "string") continue;
      if (typeof spanChirho.wlcSuggestedTextChirho !== "string") continue;
      if (typeof spanChirho.wlcSuggestionSourceChirho !== "string" || !spanChirho.wlcSuggestionSourceChirho.startsWith("WLC ")) continue;
      const currentTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
      const suggestedTextChirho = normalizeTextForStorageChirho(spanChirho.wlcSuggestedTextChirho);
      if (currentTextChirho === suggestedTextChirho) continue;
      if (hebrewSkeletonChirho(currentTextChirho) !== hebrewSkeletonChirho(suggestedTextChirho)) continue;
      const locationChirho =
        `vol ${lineChirho.volumeChirho ?? 0} p${lineChirho.pageChirho ?? 0} ` +
        `line ${lineChirho.lineIndexChirho ?? 0} seg ${spanChirho.segmentIndexChirho ?? -1}`;
      commandsChirho.push({
        locationChirho,
        humanValidationIdChirho: spanChirho.humanValidationIdChirho,
        suggestedTextChirho,
        commandChirho:
          "bun run apply-human-suggested-corrections-chirho -- --apply --certify-human " +
          `--validation-id-chirho=${spanChirho.humanValidationIdChirho} ` +
          `--suggested-text-chirho=${shellSingleQuoteChirho(suggestedTextChirho)}`,
      });
    }
  }
  return commandsChirho.sort((aChirho, bChirho) => aChirho.humanValidationIdChirho - bChirho.humanValidationIdChirho);
}

function spanKeyChirho(spanChirho: Pick<RawHebrewSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return [
    spanChirho.volumeChirho,
    spanChirho.pageChirho,
    spanChirho.lineIndexChirho,
    spanChirho.segmentIndexChirho,
  ].join(":");
}

function rawHebrewPackItemIdChirho(
  spanChirho: Pick<RawHebrewSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">
): string {
  return [
    `v${spanChirho.volumeChirho}`,
    `p${String(spanChirho.pageChirho).padStart(4, "0")}`,
    `l${String(spanChirho.lineIndexChirho).padStart(3, "0")}`,
    `s${spanChirho.segmentIndexChirho}`,
  ].join("-");
}

function clippedTextChirho(textChirho: string | null, maxLengthChirho = 80): string {
  if (textChirho === null) return "null";
  if (textChirho.length <= maxLengthChirho) return textChirho;
  return `${textChirho.slice(0, maxLengthChirho - 3)}...`;
}

function summarizeRawHebrewReportLiveDriftChirho(driftChirho: RawHebrewReportLiveDriftChirho): string {
  return [
    driftChirho.idChirho,
    driftChirho.reasonChirho,
    `report="${clippedTextChirho(driftChirho.reportTextChirho)}"`,
    `live="${clippedTextChirho(driftChirho.liveTextChirho)}"`,
  ].join(" ");
}

function liveLineTextForStatusChirho(lineChirho: SpanLineLikeChirho): string | null {
  if (!Array.isArray(lineChirho.spansChirho)) return null;
  const renderSpansChirho = [];
  for (const spanChirho of lineChirho.spansChirho) {
    if (
      typeof spanChirho.segmentIndexChirho !== "number" ||
      typeof spanChirho.scriptChirho !== "string" ||
      typeof spanChirho.utf8TextChirho !== "string"
    ) {
      return null;
    }
    const spanWithGeometryChirho = spanChirho as SpanLikeChirho & { xMinPxChirho?: unknown };
    renderSpansChirho.push({
      segmentIndexChirho: spanChirho.segmentIndexChirho,
      ...(typeof spanWithGeometryChirho.xMinPxChirho === "number" ? { xMinPxChirho: spanWithGeometryChirho.xMinPxChirho } : {}),
      scriptChirho: spanChirho.scriptChirho,
      utf8TextChirho: spanChirho.utf8TextChirho,
    });
  }
  return renderSpanLineTextChirho(
    { lineIndexChirho: lineChirho.lineIndexChirho, spansChirho: renderSpansChirho },
    { normalizeTextChirho: normalizeTextForStorageChirho }
  );
}

function rawHebrewReportLiveDriftsChirho(rawSpansChirho: RawHebrewSpanChirho[]): RawHebrewReportLiveDriftChirho[] {
  const driftsChirho: RawHebrewReportLiveDriftChirho[] = [];
  for (const spanChirho of rawSpansChirho) {
    const idChirho = rawHebrewPackItemIdChirho(spanChirho);
    const reportTextChirho = normalizeTextForStorageChirho(spanChirho.textChirho);
    const reportLineTextChirho = normalizeTextForStorageChirho(spanChirho.lineTextChirho);
    const linePathChirho = spanLinePathChirho(
      spanChirho.volumeChirho,
      spanChirho.pageChirho,
      spanChirho.lineIndexChirho
    );
    if (!existsSync(linePathChirho)) {
      driftsChirho.push({
        idChirho,
        reasonChirho: "missing-line-file-chirho",
        reportTextChirho,
        liveTextChirho: null,
      });
      continue;
    }

    let lineChirho: SpanLineLikeChirho;
    try {
      lineChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as SpanLineLikeChirho;
    } catch (errorChirho) {
      driftsChirho.push({
        idChirho,
        reasonChirho: `line-json-error-chirho:${errorChirho instanceof Error ? errorChirho.message : String(errorChirho)}`,
        reportTextChirho,
        liveTextChirho: null,
      });
      continue;
    }

    const liveSpanChirho = (lineChirho.spansChirho ?? []).find(
      (candidateChirho) => candidateChirho.segmentIndexChirho === spanChirho.segmentIndexChirho
    );
    if (liveSpanChirho === undefined) {
      driftsChirho.push({
        idChirho,
        reasonChirho: "missing-segment-chirho",
        reportTextChirho,
        liveTextChirho: null,
      });
      continue;
    }
    if (typeof liveSpanChirho.utf8TextChirho !== "string") {
      driftsChirho.push({
        idChirho,
        reasonChirho: "missing-live-text-chirho",
        reportTextChirho,
        liveTextChirho: null,
      });
      continue;
    }

    const liveTextChirho = normalizeTextForStorageChirho(liveSpanChirho.utf8TextChirho);
    if (liveTextChirho !== reportTextChirho) {
      driftsChirho.push({
        idChirho,
        reasonChirho: "text-drift-chirho",
        reportTextChirho,
        liveTextChirho,
      });
    }
    const liveLineTextChirho = liveLineTextForStatusChirho(lineChirho);
    if (liveLineTextChirho === null) {
      driftsChirho.push({
        idChirho,
        reasonChirho: "line-render-fields-missing-chirho",
        reportTextChirho: reportLineTextChirho,
        liveTextChirho: null,
      });
      continue;
    }
    if (liveLineTextChirho !== reportLineTextChirho) {
      driftsChirho.push({
        idChirho,
        reasonChirho: "line-text-drift-chirho",
        reportTextChirho: reportLineTextChirho,
        liveTextChirho: liveLineTextChirho,
      });
    }
  }
  return driftsChirho;
}

function rowKeyChirho(rowChirho: Pick<HumanValidationDbRowChirho, "volume_chirho" | "page_chirho" | "line_index_chirho" | "segment_index_chirho">): string {
  return [
    rowChirho.volume_chirho,
    rowChirho.page_chirho,
    rowChirho.line_index_chirho,
    rowChirho.segment_index_chirho,
  ].join(":");
}

function tableExistsChirho(dbChirho: Database, tableNameChirho: string): boolean {
  const rowChirho = dbChirho
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableNameChirho) as { name: string } | undefined;
  return rowChirho !== undefined;
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): string[] {
  if (!tableExistsChirho(dbChirho, tableNameChirho)) return [];
  return (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
    (rowChirho) => rowChirho.name
  );
}

function validationRowsChirho(dbPathChirho: string): HumanValidationDbRowChirho[] {
  if (!existsSync(dbPathChirho)) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const columnsChirho = new Set(tableColumnsChirho(dbChirho, "pass_c_human_validations_chirho"));
    if (columnsChirho.size === 0) return [];
    const hasSchemaVersionChirho = columnsChirho.has("schema_version_chirho");
    const hasAppliedAtChirho = columnsChirho.has("applied_at_chirho");
    return dbChirho
      .query(`
        SELECT volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
               verdict_chirho,
               ${hasAppliedAtChirho ? "applied_at_chirho" : "NULL AS applied_at_chirho"},
               ${hasSchemaVersionChirho ? "schema_version_chirho" : "1 AS schema_version_chirho"}
          FROM pass_c_human_validations_chirho
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'
         ORDER BY volume_chirho, page_chirho, line_index_chirho, segment_index_chirho`)
      .all() as HumanValidationDbRowChirho[];
  } finally {
    dbChirho.close();
  }
}

function latinSymbolReviewRowsChirho(dbPathChirho: string): LatinSymbolReviewRowChirho[] {
  if (!existsSync(dbPathChirho)) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const columnsChirho = new Set(tableColumnsChirho(dbChirho, "latin_symbol_vision_reviews_chirho"));
    if (columnsChirho.size === 0) return [];
    const hasAppliedAtChirho = columnsChirho.has("applied_at_chirho");
    const hasSchemaVersionChirho = columnsChirho.has("schema_version_chirho");
    const rowsChirho = dbChirho
      .query(`
        SELECT item_id_chirho, current_text_hash_chirho, verdict_chirho, updated_at_chirho,
               ${hasAppliedAtChirho ? "applied_at_chirho" : "NULL AS applied_at_chirho"},
               ${hasSchemaVersionChirho ? "schema_version_chirho" : "1 AS schema_version_chirho"}
          FROM latin_symbol_vision_reviews_chirho
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'
         ORDER BY item_id_chirho`)
      .all() as Array<{
        item_id_chirho: string;
        current_text_hash_chirho: string;
        verdict_chirho: string;
        updated_at_chirho: string;
        applied_at_chirho: string | null;
        schema_version_chirho: number;
      }>;
    return rowsChirho.map((rowChirho) => ({
      itemIdChirho: rowChirho.item_id_chirho,
      currentTextHashChirho: rowChirho.current_text_hash_chirho,
      verdictChirho: rowChirho.verdict_chirho,
      appliedAtChirho: rowChirho.applied_at_chirho,
      schemaVersionChirho: rowChirho.schema_version_chirho,
      updatedAtChirho: rowChirho.updated_at_chirho,
      rowSourceChirho: "db-chirho",
    }));
  } finally {
    dbChirho.close();
  }
}

function latinSymbolReviewBackupRowsChirho(
  backupChirho: LatinSymbolReviewBackupChirho,
  shapeOkChirho: boolean
): LatinSymbolReviewRowChirho[] {
  if (!shapeOkChirho) return [];
  return (backupChirho.reviewsChirho ?? [])
    .filter(
      (rowChirho) =>
        typeof rowChirho.itemIdChirho === "string" &&
        typeof rowChirho.currentTextHashChirho === "string" &&
        typeof rowChirho.verdictChirho === "string" &&
        typeof rowChirho.updatedAtChirho === "string"
    )
    .map((rowChirho) => ({
      itemIdChirho: rowChirho.itemIdChirho!,
      currentTextHashChirho: rowChirho.currentTextHashChirho!,
      verdictChirho: rowChirho.verdictChirho!,
      appliedAtChirho: rowChirho.appliedAtChirho ?? null,
      schemaVersionChirho: rowChirho.schemaVersionChirho ?? 1,
      updatedAtChirho: rowChirho.updatedAtChirho!,
      rowSourceChirho: "backup-chirho",
    }));
}

function reviewDurabilityKeyChirho(rowChirho: LatinSymbolReviewRowChirho): string {
  return [
    rowChirho.itemIdChirho,
    rowChirho.currentTextHashChirho,
    rowChirho.verdictChirho,
    rowChirho.updatedAtChirho,
  ].join("\u0000");
}

function mergeReviewRowsChirho(rowsChirho: LatinSymbolReviewRowChirho[]): LatinSymbolReviewRowChirho[] {
  const rowsByItemChirho = new Map<string, LatinSymbolReviewRowChirho>();
  for (const rowChirho of rowsChirho) {
    const existingChirho = rowsByItemChirho.get(rowChirho.itemIdChirho);
    if (
      existingChirho === undefined ||
      rowChirho.updatedAtChirho > existingChirho.updatedAtChirho ||
      (rowChirho.updatedAtChirho === existingChirho.updatedAtChirho && rowChirho.rowSourceChirho === "db-chirho")
    ) {
      rowsByItemChirho.set(rowChirho.itemIdChirho, rowChirho);
    }
  }
  return [...rowsByItemChirho.values()].sort((aChirho, bChirho) => aChirho.itemIdChirho.localeCompare(bChirho.itemIdChirho));
}

function countLocalRowsMissingFromBackupChirho(
  dbRowsChirho: LatinSymbolReviewRowChirho[],
  backupRowsChirho: LatinSymbolReviewRowChirho[]
): number {
  const backupKeysChirho = new Set(backupRowsChirho.map(reviewDurabilityKeyChirho));
  return dbRowsChirho.filter((rowChirho) => !backupKeysChirho.has(reviewDurabilityKeyChirho(rowChirho))).length;
}

function summarizeHumanValidationsChirho(
  rowsChirho: HumanValidationDbRowChirho[],
  rawSpansChirho: RawHebrewSpanChirho[]
): HumanValidationSummaryChirho {
  const rawKeysChirho = new Set(rawSpansChirho.map(spanKeyChirho));
  const schema2RowsChirho = rowsChirho.filter((rowChirho) => rowChirho.schema_version_chirho >= 2);
  const rawRowsChirho = schema2RowsChirho.filter((rowChirho) => rawKeysChirho.has(rowKeyChirho(rowChirho)));
  return {
    currentSchema2RowsChirho: schema2RowsChirho.length,
    reviewedCleanRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-clean-chirho").length,
    reviewedIssueRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-issues-chirho").length,
    appliedRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.applied_at_chirho !== null).length,
    rawQueueCurrentRowsChirho: rawRowsChirho.length,
    rawQueueCleanRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-clean-chirho").length,
    rawQueueIssueRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-issues-chirho").length,
    rawQueueAppliedRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.applied_at_chirho !== null).length,
    legacyCurrentRowsChirho: rowsChirho.filter((rowChirho) => rowChirho.schema_version_chirho < 2).length,
  };
}

function rawPendingSpansChirho(
  rawSpansChirho: RawHebrewSpanChirho[],
  rowsChirho: HumanValidationDbRowChirho[]
): RawHebrewSpanChirho[] {
  const rawKeysChirho = new Set(rawSpansChirho.map(spanKeyChirho));
  const savedRawKeysChirho = new Set(
    rowsChirho
      .filter((rowChirho) => rowChirho.schema_version_chirho >= 2 && rawKeysChirho.has(rowKeyChirho(rowChirho)))
      .map(rowKeyChirho)
  );
  return rawSpansChirho.filter((spanChirho) => !savedRawKeysChirho.has(spanKeyChirho(spanChirho)));
}

function sumCountsChirho(countsChirho: Record<string, number>): number {
  return Object.values(countsChirho).reduce((sumChirho, countChirho) => sumChirho + countChirho, 0);
}

function countIssueCodesChirho(issuesChirho: ExportIssueChirho[]): Record<string, number> {
  const countsChirho: Record<string, number> = {};
  for (const issueChirho of issuesChirho) {
    const codeChirho = issueChirho.codeChirho ?? "unknown-issue-chirho";
    countsChirho[codeChirho] = (countsChirho[codeChirho] ?? 0) + 1;
  }
  return countsChirho;
}

function exportReportTargetsChirho(exportReportChirho: ExportReportChirho): Array<{ volumeChirho: number; pageChirho: number }> {
  return (exportReportChirho.pagesChirho ?? [])
    .filter(
      (pageChirho): pageChirho is { volumeChirho: number; pageChirho: number } =>
        typeof pageChirho.volumeChirho === "number" && typeof pageChirho.pageChirho === "number"
    )
    .map((pageChirho) => ({
      volumeChirho: pageChirho.volumeChirho,
      pageChirho: pageChirho.pageChirho,
    }));
}

function summarizeIssueChirho(issueChirho: ExportIssueChirho): string {
  const locationChirho = [
    typeof issueChirho.volumeChirho === "number" ? `vol ${issueChirho.volumeChirho}` : null,
    typeof issueChirho.pageChirho === "number" ? `p${issueChirho.pageChirho}` : null,
    typeof issueChirho.lineIndexChirho === "number" ? `line ${issueChirho.lineIndexChirho}` : null,
    typeof issueChirho.segmentIndexChirho === "number" ? `seg ${issueChirho.segmentIndexChirho}` : null,
  ]
    .filter((partChirho): partChirho is string => partChirho !== null)
    .join(" ");
  const prefixChirho = [
    issueChirho.severityChirho ?? "unknown-severity-chirho",
    issueChirho.codeChirho ?? "unknown-issue-chirho",
  ].join(" ");
  const messageChirho = issueChirho.messageChirho ?? "";
  return `${locationChirho.length === 0 ? "no-location-chirho" : locationChirho}: ${prefixChirho}${messageChirho.length === 0 ? "" : ` - ${messageChirho}`}`;
}

function relativeProjectPathChirho(pathChirho: string): string {
  return pathChirho.startsWith(PROJECT_ROOT_CHIRHO)
    ? pathChirho.slice(PROJECT_ROOT_CHIRHO.length + 1)
    : pathChirho;
}

function summarizeLatinSymbolReviewsChirho(
  rowsChirho: LatinSymbolReviewRowChirho[],
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[]
): LatinSymbolReviewSummaryChirho {
  const hashByIdChirho = new Map(liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, hashTextChirho(itemChirho.textChirho)]));
  const schemaRowsChirho = rowsChirho.filter((rowChirho) => rowChirho.schemaVersionChirho >= 1);
  let validReviewedCleanRowsChirho = 0;
  let validReviewedIssueRowsChirho = 0;
  let staleRowsChirho = 0;
  let appliedRowsChirho = 0;
  for (const rowChirho of schemaRowsChirho) {
    const currentHashChirho = hashByIdChirho.get(rowChirho.itemIdChirho);
    const currentAndFreshChirho =
      currentHashChirho !== undefined && currentHashChirho === rowChirho.currentTextHashChirho;
    if (!currentAndFreshChirho) {
      staleRowsChirho += 1;
      continue;
    }
    if (rowChirho.verdictChirho === "accepted-clean-chirho") validReviewedCleanRowsChirho += 1;
    if (rowChirho.verdictChirho === "reviewed-issues-chirho") validReviewedIssueRowsChirho += 1;
    if (rowChirho.appliedAtChirho !== null) appliedRowsChirho += 1;
  }
  return {
    currentRowsChirho: schemaRowsChirho.length,
    validReviewedCleanRowsChirho,
    validReviewedIssueRowsChirho,
    staleRowsChirho,
    appliedRowsChirho,
  };
}

function validLatinSymbolReviewIdsChirho(
  rowsChirho: LatinSymbolReviewRowChirho[],
  liveItemsChirho: LatinSymbolVisionLiveItemChirho[],
  verdictChirho: string
): Set<string> {
  const hashByIdChirho = new Map(
    liveItemsChirho.map((itemChirho) => [itemChirho.idChirho, hashTextChirho(itemChirho.textChirho)])
  );
  const idsChirho = new Set<string>();
  for (const rowChirho of rowsChirho) {
    if (rowChirho.verdictChirho !== verdictChirho) continue;
    const currentHashChirho = hashByIdChirho.get(rowChirho.itemIdChirho);
    if (currentHashChirho === undefined || currentHashChirho !== rowChirho.currentTextHashChirho) continue;
    idsChirho.add(rowChirho.itemIdChirho);
  }
  return idsChirho;
}

function buildStatusChirho(dbPathChirho: string): CertificationStatusChirho {
  const exportReportExistsChirho = existsSync(EXPORT_REPORT_PATH_CHIRHO);
  const rawHebrewReportExistsChirho = existsSync(RAW_HEBREW_REPORT_PATH_CHIRHO);
  const rawHebrewPackManifestExistsChirho = existsSync(RAW_HEBREW_PACK_MANIFEST_PATH_CHIRHO);
  const passCHumanValidationBackupExistsChirho = existsSync(PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO);
  const expertPackManifestExistsChirho = existsSync(EXPERT_PACK_MANIFEST_PATH_CHIRHO);
  const visionTierExpertConfirmationPolicyExistsChirho = existsSync(VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO);
  const latinSymbolPackManifestExistsChirho = existsSync(LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO);
  const latinSymbolReviewBackupExistsChirho = existsSync(LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO);
  const latinSymbolAcceptancePolicyExistsChirho = existsSync(LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO);
  const exportReportChirho = readJsonFileChirho<ExportReportChirho>(EXPORT_REPORT_PATH_CHIRHO, {});
  const rawReportChirho = readJsonFileChirho<RawHebrewReportChirho>(RAW_HEBREW_REPORT_PATH_CHIRHO, {});
  const rawHebrewPackManifestChirho = readJsonFileChirho<RawHebrewPackManifestChirho>(
    RAW_HEBREW_PACK_MANIFEST_PATH_CHIRHO,
    {}
  );
  const passCHumanValidationBackupFileChirho = readPassCHumanValidationBackupFileChirho();
  const expertManifestChirho = readJsonFileChirho<ExpertPackManifestChirho>(EXPERT_PACK_MANIFEST_PATH_CHIRHO, {});
  const visionTierExpertConfirmationFileChirho = readVisionTierExpertConfirmationFileChirho();
  const latinSymbolManifestChirho = readJsonFileChirho<LatinSymbolPackManifestChirho>(
    LATIN_SYMBOL_PACK_MANIFEST_PATH_CHIRHO,
    {}
  );
  const latinSymbolReviewBackupFileChirho = readJsonFileChirho<LatinSymbolReviewBackupChirho>(
    LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO,
    {}
  );
  const latinSymbolAcceptancePolicyFileChirho = readLatinSymbolAcceptancePolicyFileChirho();
  const nonNfcSpanTextFieldsChirho = scanNonNfcSpanTextFieldsChirho();
  const nonNfcSpanFilesChirho = new Set(
    nonNfcSpanTextFieldsChirho.map((findingChirho) => findingChirho.relativePathChirho)
  );
  const exportReportShapeOkChirho =
    !exportReportExistsChirho ||
    (typeof exportReportChirho.strictPassedChirho === "boolean" &&
      typeof exportReportChirho.issueCountChirho === "number");
  const exportReportTargetsResultChirho = exportReportTargetsChirho(exportReportChirho);
  const liveSpanSourceFingerprintChirho = spanSourceFingerprintForTargetsChirho(exportReportTargetsResultChirho);
  const exportReportHasSpanSourceFingerprintChirho =
    typeof exportReportChirho.spanSourceFileCountChirho === "number" &&
    typeof exportReportChirho.spanSourceFingerprintChirho === "string";
  const exportReportSpanSourceFingerprintMatchesCurrentChirho =
    exportReportHasSpanSourceFingerprintChirho &&
    exportReportChirho.spanSourceFileCountChirho === liveSpanSourceFingerprintChirho.fileCountChirho &&
    exportReportChirho.spanSourceFingerprintChirho === liveSpanSourceFingerprintChirho.sha256Chirho;
  const exportReportUsesD1AuditChirho =
    exportReportChirho.d1DbPathChirho !== null && exportReportChirho.d1DbPathChirho !== undefined;
  const liveD1AuditDbPathChirho = latestLocalD1PathChirho();
  let liveD1AuditFingerprintChirho: ReturnType<typeof d1AuditFingerprintForDbPathChirho> = null;
  let d1AuditFingerprintReadErrorChirho: string | null = null;
  try {
    liveD1AuditFingerprintChirho = d1AuditFingerprintForDbPathChirho(liveD1AuditDbPathChirho);
  } catch (errorChirho) {
    d1AuditFingerprintReadErrorChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
  }
  const exportReportHasD1AuditFingerprintChirho =
    typeof exportReportChirho.d1AuditFingerprintChirho === "string" &&
    typeof exportReportChirho.d1AuditPageRowCountChirho === "number" &&
    typeof exportReportChirho.d1AuditWordRowCountChirho === "number" &&
    typeof exportReportChirho.d1AuditOcrSuggestionRowCountChirho === "number";
  const exportReportD1AuditFingerprintMatchesCurrentChirho =
    d1AuditFingerprintReadErrorChirho === null &&
    exportReportHasD1AuditFingerprintChirho &&
    liveD1AuditFingerprintChirho !== null &&
    exportReportChirho.d1AuditPageRowCountChirho === liveD1AuditFingerprintChirho.pageRowCountChirho &&
    exportReportChirho.d1AuditWordRowCountChirho === liveD1AuditFingerprintChirho.wordRowCountChirho &&
    exportReportChirho.d1AuditOcrSuggestionRowCountChirho === liveD1AuditFingerprintChirho.ocrSuggestionRowCountChirho &&
    exportReportChirho.d1AuditFingerprintChirho === liveD1AuditFingerprintChirho.sha256Chirho;
  const rawHebrewReportShapeOkChirho =
    !rawHebrewReportExistsChirho ||
    (Array.isArray(rawReportChirho.spansChirho) &&
      typeof rawReportChirho.sourceFilterChirho === "string" &&
      rawReportChirho.spansChirho.every(
        (spanChirho) => typeof spanChirho.textChirho === "string" && typeof spanChirho.lineTextChirho === "string"
      ));
  const rawHebrewPackManifestShapeOkChirho =
    !rawHebrewPackManifestExistsChirho ||
    (Array.isArray(rawHebrewPackManifestChirho.itemsChirho) &&
      rawHebrewPackManifestChirho.itemsChirho.every(
        (itemChirho) =>
          typeof itemChirho.idChirho === "string" &&
          typeof itemChirho.validationStatusChirho === "string" &&
          typeof itemChirho.textChirho === "string" &&
          typeof itemChirho.lineTextChirho === "string"
      ));
  const passCHumanValidationBackupShapeOkResultChirho = passCHumanValidationBackupShapeOkChirho(
    passCHumanValidationBackupFileChirho,
    passCHumanValidationBackupExistsChirho
  );
  const expertPackManifestShapeOkChirho =
    !expertPackManifestExistsChirho ||
    (Array.isArray(expertManifestChirho.completeVisionItemsChirho) &&
      Array.isArray(expertManifestChirho.priorityItemsChirho) &&
      expertManifestChirho.completeVisionItemsChirho.every(
        (itemChirho) =>
          typeof itemChirho.idChirho === "string" &&
          typeof itemChirho.scriptChirho === "string" &&
          typeof itemChirho.visionSourceChirho === "string" &&
          typeof itemChirho.currentTextChirho === "string"
      ));
  const latinSymbolPackManifestShapeOkChirho =
    !latinSymbolPackManifestExistsChirho ||
    (Array.isArray(latinSymbolManifestChirho.itemsChirho) &&
      typeof latinSymbolManifestChirho.explicitSpanCountChirho === "number" &&
      typeof latinSymbolManifestChirho.d1DerivedWordCountChirho === "number" &&
      latinSymbolManifestChirho.itemsChirho.every(
        (itemChirho) => typeof itemChirho.idChirho === "string" &&
          typeof itemChirho.textChirho === "string" &&
          typeof itemChirho.lineTextChirho === "string"
      ));
  const latinSymbolReviewBackupShapeOkChirho =
    !latinSymbolReviewBackupExistsChirho ||
    (latinSymbolReviewBackupFileChirho.schemaVersionChirho === 1 &&
      Array.isArray(latinSymbolReviewBackupFileChirho.reviewsChirho));
  const rawSpansChirho = rawHebrewReportShapeOkChirho ? rawReportChirho.spansChirho ?? [] : [];
  const rawHebrewPackItemsChirho = rawHebrewPackManifestShapeOkChirho
    ? rawHebrewPackManifestChirho.itemsChirho ?? []
    : [];
  const rawHebrewPackItemsByIdChirho = new Map(
    rawHebrewPackItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho])
  );
  const rawHebrewReportIdsChirho = new Set(rawSpansChirho.map(rawHebrewPackItemIdChirho));
  const rawHebrewPackCountMatchesCurrentChirho = rawHebrewPackItemsChirho.length === rawSpansChirho.length;
  const rawHebrewPackIdsMatchCurrentChirho =
    rawHebrewPackCountMatchesCurrentChirho &&
    rawHebrewPackItemsChirho.every((itemChirho) => rawHebrewReportIdsChirho.has(itemChirho.idChirho)) &&
    rawSpansChirho.every((spanChirho) => rawHebrewPackItemsByIdChirho.has(rawHebrewPackItemIdChirho(spanChirho)));
  const rawHebrewPackTextMatchesCurrentChirho =
    rawHebrewPackIdsMatchCurrentChirho &&
    rawSpansChirho.every((spanChirho) => {
      const packetItemChirho = rawHebrewPackItemsByIdChirho.get(rawHebrewPackItemIdChirho(spanChirho));
      return packetItemChirho !== undefined && packetItemChirho.textChirho === spanChirho.textChirho;
    });
  const rawHebrewPackLineTextMatchesCurrentChirho =
    rawHebrewPackIdsMatchCurrentChirho &&
    rawSpansChirho.every((spanChirho) => {
      const packetItemChirho = rawHebrewPackItemsByIdChirho.get(rawHebrewPackItemIdChirho(spanChirho));
      return packetItemChirho !== undefined && packetItemChirho.lineTextChirho === spanChirho.lineTextChirho;
    });
  const rawHebrewPackStatusMatchesCurrentChirho =
    rawHebrewPackIdsMatchCurrentChirho &&
    rawSpansChirho.every((spanChirho) => {
      const packetItemChirho = rawHebrewPackItemsByIdChirho.get(rawHebrewPackItemIdChirho(spanChirho));
      return packetItemChirho !== undefined && packetItemChirho.validationStatusChirho === spanChirho.validationStatusChirho;
    });
  const rawHebrewReportLiveDriftsResultChirho = rawHebrewReportLiveDriftsChirho(rawSpansChirho);
  const humanValidationRowsChirho = validationRowsChirho(dbPathChirho);
  const humanSummaryChirho = summarizeHumanValidationsChirho(humanValidationRowsChirho, rawSpansChirho);
  const livePendingRawSpansChirho = rawPendingSpansChirho(rawSpansChirho, humanValidationRowsChirho);
  const passCHumanValidationDbBackupRowsChirho = passCHumanValidationBackupRowsFromDbPathChirho(dbPathChirho);
  const passCHumanValidationBackupRowsResultChirho = passCHumanValidationBackupRowsChirho(
    passCHumanValidationBackupFileChirho,
    passCHumanValidationBackupShapeOkResultChirho
  );
  const passCHumanValidationLocalRowsMissingFromBackupChirho =
    countPassCHumanValidationRowsMissingFromBackupChirho(
      passCHumanValidationDbBackupRowsChirho,
      passCHumanValidationBackupRowsResultChirho
    );
  const passCHumanValidationBackupSummaryChirho = {
    backupRowsChirho: passCHumanValidationBackupRowsResultChirho.length,
    dbRowsChirho: passCHumanValidationDbBackupRowsChirho.length,
    localRowsMissingFromBackupChirho: passCHumanValidationLocalRowsMissingFromBackupChirho,
  };
  const structuralChirho = {
    exportGeneratedAtChirho: exportReportChirho.generatedAtChirho ?? null,
    strictPassedChirho: exportReportChirho.strictPassedChirho === true,
    issueCountChirho: exportReportChirho.issueCountChirho ?? 0,
    issueCodeCountsChirho: countIssueCodesChirho(exportReportChirho.issuesChirho ?? []),
    issueSummariesChirho: (exportReportChirho.issuesChirho ?? []).slice(0, 12).map(summarizeIssueChirho),
    guardedWlcCorrectionCommandsChirho: guardedWlcCorrectionCommandsChirho(),
    spanSourceFileCountChirho: exportReportChirho.spanSourceFileCountChirho ?? null,
    liveSpanSourceFileCountChirho: liveSpanSourceFingerprintChirho.fileCountChirho,
    spanSourceFingerprintMatchesCurrentChirho: exportReportSpanSourceFingerprintMatchesCurrentChirho,
    d1AuditDbPathChirho: exportReportChirho.d1DbPathChirho ?? null,
    liveD1AuditDbPathChirho,
    d1AuditPageRowCountChirho: exportReportChirho.d1AuditPageRowCountChirho ?? null,
    liveD1AuditPageRowCountChirho: liveD1AuditFingerprintChirho?.pageRowCountChirho ?? null,
    d1AuditWordRowCountChirho: exportReportChirho.d1AuditWordRowCountChirho ?? null,
    liveD1AuditWordRowCountChirho: liveD1AuditFingerprintChirho?.wordRowCountChirho ?? null,
    d1AuditOcrSuggestionRowCountChirho: exportReportChirho.d1AuditOcrSuggestionRowCountChirho ?? null,
    liveD1AuditOcrSuggestionRowCountChirho: liveD1AuditFingerprintChirho?.ocrSuggestionRowCountChirho ?? null,
    d1AuditFingerprintMatchesCurrentChirho:
      liveD1AuditFingerprintChirho === null ? null : exportReportD1AuditFingerprintMatchesCurrentChirho,
    d1AuditFingerprintReadErrorChirho,
    unknownSpanCountChirho: exportReportChirho.unknownSpanCountChirho ?? 0,
    nonNfcSpanCountChirho: exportReportChirho.nonNfcSpanCountChirho ?? 0,
    d1GapPageCountChirho: exportReportChirho.d1PagesWithoutSpansChirho?.length ?? 0,
    hebrewSpanCountChirho: exportReportChirho.hebrewSpanCountChirho ?? 0,
    passCOcrHebrewSpanCountChirho: exportReportChirho.passCOcrHebrewSpanCountChirho ?? 0,
    crnnValidatedHebrewSpanCountChirho: exportReportChirho.crnnValidatedHebrewSpanCountChirho ?? 0,
  };
  const rawHebrewChirho = {
    reportGeneratedAtChirho: rawReportChirho.generatedAtChirho ?? null,
    sourceFilterChirho: rawReportChirho.sourceFilterChirho ?? null,
    reportSpanCountChirho: rawReportChirho.spanCountChirho ?? rawSpansChirho.length,
    reportTokenCountChirho: rawReportChirho.tokenCountChirho ?? 0,
    unvalidatedSpanCountChirho: rawReportChirho.unvalidatedSpanCountChirho ?? 0,
    partialValidatedSpanCountChirho: rawReportChirho.partialTokenValidatedSpanCountChirho ?? 0,
    allTokenValidatedSpanCountChirho: rawReportChirho.allTokenValidatedSpanCountChirho ?? 0,
    livePendingSpanCountChirho: livePendingRawSpansChirho.length,
    livePendingUnvalidatedSpanCountChirho: livePendingRawSpansChirho.filter(
      (spanChirho) => spanChirho.validationStatusChirho === "unvalidated-chirho"
    ).length,
    livePendingPartialValidatedSpanCountChirho: livePendingRawSpansChirho.filter(
      (spanChirho) => spanChirho.validationStatusChirho === "partial-token-validated-chirho"
    ).length,
    livePendingAllTokenValidatedSpanCountChirho: livePendingRawSpansChirho.filter(
      (spanChirho) => spanChirho.validationStatusChirho === "all-token-validated-chirho"
    ).length,
    validatedTokenCountChirho: rawReportChirho.validatedTokenCountChirho ?? 0,
    sourceCountsChirho: rawReportChirho.sourceCountsChirho ?? {},
    exportPassCOcrMatchesReportChirho:
      structuralChirho.passCOcrHebrewSpanCountChirho === (rawReportChirho.spanCountChirho ?? rawSpansChirho.length),
    packGeneratedAtChirho: rawHebrewPackManifestChirho.generatedAtChirho ?? null,
    packItemCountChirho: rawHebrewPackItemsChirho.length,
    packCountMatchesCurrentChirho: rawHebrewPackCountMatchesCurrentChirho,
    packIdsMatchCurrentChirho: rawHebrewPackIdsMatchCurrentChirho,
    packTextMatchesCurrentChirho: rawHebrewPackTextMatchesCurrentChirho,
    packLineTextMatchesCurrentChirho: rawHebrewPackLineTextMatchesCurrentChirho,
    packStatusMatchesCurrentChirho: rawHebrewPackStatusMatchesCurrentChirho,
    liveReportMatchesSpanFilesChirho: rawHebrewReportLiveDriftsResultChirho.length === 0,
    liveReportDriftCountChirho: rawHebrewReportLiveDriftsResultChirho.length,
    liveReportDriftSamplesChirho: rawHebrewReportLiveDriftsResultChirho
      .slice(0, 8)
      .map(summarizeRawHebrewReportLiveDriftChirho),
  };
  const visionTierLiveSnapshotChirho = visionTierExpertLiveSnapshotChirho();
  const visionTierLiveItemsChirho = visionTierLiveSnapshotChirho.itemsChirho;
  const visionTierLiveItemsByIdChirho = new Map(
    visionTierLiveItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho])
  );
  const expertManifestItemsChirho = expertPackManifestShapeOkChirho
    ? expertManifestChirho.completeVisionItemsChirho ?? []
    : [];
  const expertManifestItemIdsChirho = new Set(expertManifestItemsChirho.map((itemChirho) => itemChirho.idChirho));
  const visionTierManifestCountMatchesCurrentChirho =
    expertManifestItemsChirho.length === visionTierLiveItemsChirho.length;
  const visionTierManifestIdsMatchCurrentChirho =
    visionTierManifestCountMatchesCurrentChirho &&
    expertManifestItemsChirho.every((itemChirho) => visionTierLiveItemsByIdChirho.has(itemChirho.idChirho)) &&
    visionTierLiveItemsChirho.every((itemChirho) => expertManifestItemIdsChirho.has(itemChirho.idChirho));
  const visionTierManifestTextMatchesCurrentChirho =
    visionTierManifestIdsMatchCurrentChirho &&
    expertManifestItemsChirho.every((itemChirho) => {
      const liveItemChirho = visionTierLiveItemsByIdChirho.get(itemChirho.idChirho);
      return (
        liveItemChirho !== undefined &&
        liveItemChirho.scriptChirho === itemChirho.scriptChirho &&
        liveItemChirho.visionSourceChirho === itemChirho.visionSourceChirho &&
        liveItemChirho.currentTextChirho === itemChirho.currentTextChirho
      );
    });
  const visionTierConfirmationSummaryChirho = summarizeVisionTierExpertConfirmationsChirho(
    visionTierExpertConfirmationFileChirho,
    visionTierExpertConfirmationPolicyExistsChirho,
    visionTierLiveItemsChirho
  );
  const visionTierCurrentDecisionCountChirho =
    visionTierLiveSnapshotChirho.d1ReadErrorChirho !== null
      ? Math.max(visionTierLiveItemsChirho.length, expertManifestItemsChirho.length)
      : visionTierLiveItemsChirho.length;
  const pendingVisionTierLiveItemsChirho = visionTierLiveItemsChirho.filter(
    (itemChirho) => !visionTierConfirmationSummaryChirho.confirmedItemIdsChirho.has(itemChirho.idChirho)
  );
  const pendingExpertManifestItemsChirho = expertManifestItemsChirho.filter(
    (itemChirho) => !visionTierConfirmationSummaryChirho.confirmedItemIdsChirho.has(itemChirho.idChirho)
  );
  const visionTierRemainingConfirmationCountChirho =
    visionTierLiveSnapshotChirho.d1ReadErrorChirho !== null
      ? visionTierCurrentDecisionCountChirho
      : Math.max(
          0,
          visionTierCurrentDecisionCountChirho - visionTierConfirmationSummaryChirho.confirmedItemIdsChirho.size
        );
  const visionTierConfirmationSummaryForStatusChirho = {
    policyFileExistsChirho: visionTierConfirmationSummaryChirho.policyFileExistsChirho,
    policyFileShapeOkChirho: visionTierConfirmationSummaryChirho.policyFileShapeOkChirho,
    confirmedPolicyCountChirho: visionTierConfirmationSummaryChirho.confirmedPolicyCountChirho,
    confirmedPolicyItemCountChirho: visionTierConfirmationSummaryChirho.confirmedPolicyItemCountChirho,
    validConfirmedPolicyItemCountChirho: visionTierConfirmationSummaryChirho.validConfirmedPolicyItemCountChirho,
    staleConfirmedPolicyItemCountChirho: visionTierConfirmationSummaryChirho.staleConfirmedPolicyItemCountChirho,
    duplicateConfirmedPolicyItemCountChirho: visionTierConfirmationSummaryChirho.duplicateConfirmedPolicyItemCountChirho,
    issueOverriddenConfirmedPolicyItemCountChirho:
      visionTierConfirmationSummaryChirho.issueOverriddenConfirmedPolicyItemCountChirho,
    reviewedIssuePolicyCountChirho: visionTierConfirmationSummaryChirho.reviewedIssuePolicyCountChirho,
    reviewedIssuePolicyItemCountChirho: visionTierConfirmationSummaryChirho.reviewedIssuePolicyItemCountChirho,
    validReviewedIssuePolicyItemCountChirho: visionTierConfirmationSummaryChirho.validReviewedIssuePolicyItemCountChirho,
    staleReviewedIssuePolicyItemCountChirho: visionTierConfirmationSummaryChirho.staleReviewedIssuePolicyItemCountChirho,
    duplicateReviewedIssuePolicyItemCountChirho: visionTierConfirmationSummaryChirho.duplicateReviewedIssuePolicyItemCountChirho,
    shapeErrorsChirho: visionTierConfirmationSummaryChirho.shapeErrorsChirho,
  };
  const visionTierChirho = {
    d1ReadErrorChirho: visionTierLiveSnapshotChirho.d1ReadErrorChirho,
    manifestGeneratedAtChirho: expertManifestChirho.generatedAtChirho ?? null,
    priorityItemCountChirho: expertManifestItemsChirho.filter((itemChirho) => itemChirho.priorityMatchChirho).length,
    completeVisionItemCountChirho: expertManifestItemsChirho.length,
    completeVisionCountsChirho: expertManifestChirho.completeVisionCountsChirho ?? {},
    liveVisionItemCountChirho: visionTierLiveItemsChirho.length,
    liveVisionCountsChirho: countVisionTierExpertByScriptChirho(visionTierLiveItemsChirho),
    pendingVisionItemCountChirho: pendingVisionTierLiveItemsChirho.length,
    pendingVisionCountsChirho: countVisionTierExpertByScriptChirho(pendingVisionTierLiveItemsChirho),
    pendingPriorityItemCountChirho: pendingExpertManifestItemsChirho.filter((itemChirho) => itemChirho.priorityMatchChirho).length,
    pendingAppendixItemCountChirho: pendingExpertManifestItemsChirho.filter((itemChirho) => !itemChirho.priorityMatchChirho).length,
    manifestCountMatchesCurrentChirho: visionTierManifestCountMatchesCurrentChirho,
    manifestIdsMatchCurrentChirho: visionTierManifestIdsMatchCurrentChirho,
    manifestTextMatchesCurrentChirho: visionTierManifestTextMatchesCurrentChirho,
    confirmedByPolicyCountChirho: visionTierConfirmationSummaryChirho.validConfirmedPolicyItemCountChirho,
    reviewedIssueByPolicyCountChirho: visionTierConfirmationSummaryChirho.validReviewedIssuePolicyItemCountChirho,
    remainingConfirmationCountChirho: visionTierRemainingConfirmationCountChirho,
  };
  const latinSymbolLiveSnapshotChirho = latinSymbolVisionLiveSnapshotChirho();
  const latinSymbolLiveItemsChirho = latinSymbolLiveSnapshotChirho.itemsChirho;
  const latinSymbolD1ReadErrorChirho = latinSymbolLiveSnapshotChirho.d1ReadErrorChirho;
  const explicitLatinSymbolLiveItemsChirho = latinSymbolLiveItemsChirho.filter(
    (itemChirho) => itemChirho.itemKindChirho === "span-chirho"
  );
  const d1DerivedLatinSymbolLiveItemsChirho = latinSymbolLiveItemsChirho.filter(
    (itemChirho) => itemChirho.itemKindChirho === "d1-word-chirho"
  );
  const latinSymbolVisionCountsResultChirho = countByScriptChirho(explicitLatinSymbolLiveItemsChirho);
  const d1DerivedLatinSymbolVisionCountsResultChirho = countByScriptChirho(d1DerivedLatinSymbolLiveItemsChirho);
  const latinSymbolRiskSummaryChirho = summarizeSymbolRiskChirho(latinSymbolLiveItemsChirho);
  const currentLatinSymbolDecisionCountChirho =
    sumCountsChirho(latinSymbolVisionCountsResultChirho) + sumCountsChirho(d1DerivedLatinSymbolVisionCountsResultChirho);
  const latinSymbolPacketItemsChirho = latinSymbolPackManifestShapeOkChirho
    ? latinSymbolManifestChirho.itemsChirho ?? []
    : [];
  const latinSymbolDbRowsChirho = latinSymbolReviewRowsChirho(dbPathChirho);
  const latinSymbolBackupRowsChirho = latinSymbolReviewBackupRowsChirho(
    latinSymbolReviewBackupFileChirho,
    latinSymbolReviewBackupShapeOkChirho
  );
  const latinSymbolMergedRowsChirho = mergeReviewRowsChirho([...latinSymbolBackupRowsChirho, ...latinSymbolDbRowsChirho]);
  const latinSymbolLocalRowsMissingFromBackupChirho = countLocalRowsMissingFromBackupChirho(
    latinSymbolDbRowsChirho,
    latinSymbolBackupRowsChirho
  );
  const latinSymbolReviewSummaryChirho = summarizeLatinSymbolReviewsChirho(latinSymbolMergedRowsChirho, latinSymbolLiveItemsChirho);
  const latinSymbolAcceptedReviewIdsChirho = validLatinSymbolReviewIdsChirho(
    latinSymbolMergedRowsChirho,
    latinSymbolLiveItemsChirho,
    "accepted-clean-chirho"
  );
  const latinSymbolReviewedIssueIdsChirho = validLatinSymbolReviewIdsChirho(
    latinSymbolMergedRowsChirho,
    latinSymbolLiveItemsChirho,
    "reviewed-issues-chirho"
  );
  const latinSymbolPolicySummaryChirho = summarizeLatinSymbolAcceptancePolicyChirho(
    latinSymbolAcceptancePolicyFileChirho,
    latinSymbolAcceptancePolicyExistsChirho,
    latinSymbolLiveItemsChirho
  );
  const latinSymbolAcceptedDecisionIdsChirho = new Set([
    ...latinSymbolAcceptedReviewIdsChirho,
    ...latinSymbolPolicySummaryChirho.acceptedItemIdsChirho,
  ]);
  let latinSymbolIssueOverriddenAcceptedDecisionCountChirho = 0;
  for (const itemIdChirho of latinSymbolReviewedIssueIdsChirho) {
    if (latinSymbolAcceptedDecisionIdsChirho.delete(itemIdChirho)) {
      latinSymbolIssueOverriddenAcceptedDecisionCountChirho += 1;
    }
  }
  const pendingLatinSymbolLiveItemsChirho = latinSymbolLiveItemsChirho.filter(
    (itemChirho) => !latinSymbolAcceptedDecisionIdsChirho.has(itemChirho.idChirho)
  );
  const pendingLatinSymbolRiskSummaryChirho = summarizeSymbolRiskChirho(pendingLatinSymbolLiveItemsChirho);
  const latinSymbolPolicySummaryForStatusChirho = {
    policyFileExistsChirho: latinSymbolPolicySummaryChirho.policyFileExistsChirho,
    policyFileShapeOkChirho: latinSymbolPolicySummaryChirho.policyFileShapeOkChirho,
    acceptedPolicyCountChirho: latinSymbolPolicySummaryChirho.acceptedPolicyCountChirho,
    acceptedPolicyItemCountChirho: latinSymbolPolicySummaryChirho.acceptedPolicyItemCountChirho,
    validAcceptedPolicyItemCountChirho: latinSymbolPolicySummaryChirho.validAcceptedPolicyItemCountChirho,
    staleAcceptedPolicyItemCountChirho: latinSymbolPolicySummaryChirho.staleAcceptedPolicyItemCountChirho,
    duplicateAcceptedPolicyItemCountChirho: latinSymbolPolicySummaryChirho.duplicateAcceptedPolicyItemCountChirho,
    shapeErrorsChirho: latinSymbolPolicySummaryChirho.shapeErrorsChirho,
  };
  const latinSymbolReviewBackupSummaryChirho = {
    backupRowsChirho: latinSymbolBackupRowsChirho.length,
    dbRowsChirho: latinSymbolDbRowsChirho.length,
    localRowsMissingFromBackupChirho: latinSymbolLocalRowsMissingFromBackupChirho,
  };
  const latinSymbolLiveItemsByIdChirho = new Map(
    latinSymbolLiveItemsChirho.map((itemChirho) => [itemChirho.idChirho, itemChirho])
  );
  const latinSymbolPacketItemIdsChirho = new Set(latinSymbolPacketItemsChirho.map((itemChirho) => itemChirho.idChirho));
  const latinSymbolReviewPacketCountMatchesCurrentChirho =
    latinSymbolPacketItemsChirho.length === currentLatinSymbolDecisionCountChirho;
  const latinSymbolReviewPacketIdsMatchCurrentChirho =
    latinSymbolReviewPacketCountMatchesCurrentChirho &&
    latinSymbolPacketItemsChirho.every((itemChirho) => latinSymbolLiveItemsByIdChirho.has(itemChirho.idChirho)) &&
    latinSymbolLiveItemsChirho.every((itemChirho) => latinSymbolPacketItemIdsChirho.has(itemChirho.idChirho));
  const latinSymbolReviewPacketTextMatchesCurrentChirho =
    latinSymbolReviewPacketIdsMatchCurrentChirho &&
    latinSymbolPacketItemsChirho.every((itemChirho) => {
      const liveItemChirho = latinSymbolLiveItemsByIdChirho.get(itemChirho.idChirho);
      return liveItemChirho !== undefined && liveItemChirho.textChirho === itemChirho.textChirho;
    });
  const latinSymbolReviewPacketLineTextMatchesCurrentChirho =
    latinSymbolReviewPacketIdsMatchCurrentChirho &&
    latinSymbolPacketItemsChirho.every((itemChirho) => {
      const liveItemChirho = latinSymbolLiveItemsByIdChirho.get(itemChirho.idChirho);
      return liveItemChirho !== undefined && liveItemChirho.lineTextChirho === itemChirho.lineTextChirho;
    });
  const latinSymbolRemainingDecisionCountChirho =
    latinSymbolD1ReadErrorChirho !== null
      ? Math.max(currentLatinSymbolDecisionCountChirho, latinSymbolPacketItemsChirho.length)
      : latinSymbolReviewPacketTextMatchesCurrentChirho && latinSymbolReviewPacketLineTextMatchesCurrentChirho
      ? Math.max(0, currentLatinSymbolDecisionCountChirho - latinSymbolAcceptedDecisionIdsChirho.size)
      : currentLatinSymbolDecisionCountChirho;
  const latinSymbolVisionChirho = {
    d1ReadErrorChirho: latinSymbolD1ReadErrorChirho,
    explicitVisionItemCountChirho: sumCountsChirho(latinSymbolVisionCountsResultChirho),
    explicitVisionCountsChirho: latinSymbolVisionCountsResultChirho,
    d1DerivedVisionWordCountChirho: sumCountsChirho(d1DerivedLatinSymbolVisionCountsResultChirho),
    d1DerivedVisionCountsChirho: d1DerivedLatinSymbolVisionCountsResultChirho,
    symbolRiskSummaryChirho: latinSymbolRiskSummaryChirho,
    reviewPacketItemCountChirho: latinSymbolPacketItemsChirho.length,
    reviewPacketCountMatchesCurrentChirho: latinSymbolReviewPacketCountMatchesCurrentChirho,
    reviewPacketIdsMatchCurrentChirho: latinSymbolReviewPacketIdsMatchCurrentChirho,
    reviewPacketTextMatchesCurrentChirho: latinSymbolReviewPacketTextMatchesCurrentChirho,
    reviewPacketLineTextMatchesCurrentChirho: latinSymbolReviewPacketLineTextMatchesCurrentChirho,
    reviewedCleanCountChirho: latinSymbolReviewSummaryChirho.validReviewedCleanRowsChirho,
    reviewedIssueCountChirho: latinSymbolReviewSummaryChirho.validReviewedIssueRowsChirho,
    acceptedByPolicyCountChirho: latinSymbolPolicySummaryChirho.validAcceptedPolicyItemCountChirho,
    totalAcceptedDecisionCountChirho: latinSymbolAcceptedDecisionIdsChirho.size,
    issueOverriddenAcceptedDecisionCountChirho: latinSymbolIssueOverriddenAcceptedDecisionCountChirho,
    staleReviewCountChirho: latinSymbolReviewSummaryChirho.staleRowsChirho,
    pendingDecisionCountChirho: pendingLatinSymbolLiveItemsChirho.length,
    pendingDecisionCountsChirho: countByScriptChirho(pendingLatinSymbolLiveItemsChirho),
    pendingTrivialPunctuationSymbolItemCountChirho:
      pendingLatinSymbolRiskSummaryChirho.trivialPunctuationSymbolItemsChirho,
    pendingMixedScriptSymbolItemCountChirho: pendingLatinSymbolRiskSummaryChirho.mixedScriptSymbolItemsChirho,
    pendingNontrivialSymbolItemCountChirho:
      pendingLatinSymbolRiskSummaryChirho.nontrivialSymbolItemsChirho -
      pendingLatinSymbolRiskSummaryChirho.mixedScriptSymbolItemsChirho,
    remainingDecisionCountChirho: latinSymbolRemainingDecisionCountChirho,
    includedInCompletionGateChirho: true,
  };
  const normalizationChirho = {
    liveNonNfcSpanTextFieldCountChirho: nonNfcSpanTextFieldsChirho.length,
    liveNonNfcSpanFileCountChirho: nonNfcSpanFilesChirho.size,
  };
  const remainingWorkChirho: string[] = [];
  if (!exportReportExistsChirho) {
    remainingWorkChirho.push("strict export report is missing; run export-markdown-chirho --all --strict");
  }
  if (!rawHebrewReportExistsChirho) {
    remainingWorkChirho.push("raw Hebrew validation report is missing; run validate-pass-c-hebrew-chirho --all");
  }
  if (rawSpansChirho.length !== 0 && !rawHebrewPackManifestExistsChirho) {
    remainingWorkChirho.push("raw Hebrew human review packet is missing; run make-pass-c-hebrew-human-pack-chirho");
  }
  if (!expertPackManifestExistsChirho) {
    remainingWorkChirho.push("expert confirmation manifest is missing; run make-expert-confirm-pack-chirho");
  }
  if (currentLatinSymbolDecisionCountChirho !== 0 && !latinSymbolPackManifestExistsChirho) {
    remainingWorkChirho.push("Latin/symbol vision review packet is missing; run make-latin-symbol-vision-pack-chirho");
  }
  if (latinSymbolD1ReadErrorChirho !== null) {
    remainingWorkChirho.push(`D1-derived Latin/symbol vision word scan failed: ${latinSymbolD1ReadErrorChirho}`);
  }
  if (exportReportExistsChirho && !exportReportShapeOkChirho) {
    remainingWorkChirho.push("strict export report is malformed; regenerate export-markdown-chirho --all --strict");
  }
  if (rawHebrewReportExistsChirho && !rawHebrewReportShapeOkChirho) {
    remainingWorkChirho.push("raw Hebrew validation report is malformed; regenerate validate-pass-c-hebrew-chirho --all");
  }
  if (rawHebrewPackManifestExistsChirho && !rawHebrewPackManifestShapeOkChirho) {
    remainingWorkChirho.push("raw Hebrew human review packet is malformed; regenerate make-pass-c-hebrew-human-pack-chirho");
  }
  if (passCHumanValidationBackupExistsChirho && !passCHumanValidationBackupShapeOkResultChirho) {
    remainingWorkChirho.push("Pass-C human validation backup is malformed; regenerate backup-pass-c-human-validations-chirho");
  }
  if (expertPackManifestExistsChirho && !expertPackManifestShapeOkChirho) {
    remainingWorkChirho.push("expert confirmation manifest is malformed; regenerate make-expert-confirm-pack-chirho");
  }
  if (
    visionTierExpertConfirmationPolicyExistsChirho &&
    !visionTierConfirmationSummaryChirho.policyFileShapeOkChirho
  ) {
    remainingWorkChirho.push("vision-tier expert confirmation policy is malformed; fix or regenerate prepare-vision-tier-expert-confirmation-policy-chirho");
  }
  if (latinSymbolPackManifestExistsChirho && !latinSymbolPackManifestShapeOkChirho) {
    remainingWorkChirho.push("Latin/symbol vision review packet is malformed; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (latinSymbolReviewBackupExistsChirho && !latinSymbolReviewBackupShapeOkChirho) {
    remainingWorkChirho.push("Latin/symbol review backup is malformed; regenerate record-latin-symbol-vision-review-chirho --export-backup");
  }
  if (latinSymbolAcceptancePolicyExistsChirho && !latinSymbolPolicySummaryChirho.policyFileShapeOkChirho) {
    remainingWorkChirho.push("Latin/symbol acceptance policy is malformed; fix or regenerate prepare-latin-symbol-vision-acceptance-policy-chirho");
  }
  if (
    exportReportExistsChirho &&
    exportReportShapeOkChirho &&
    !exportReportHasSpanSourceFingerprintChirho
  ) {
    remainingWorkChirho.push("strict export report lacks a span-source fingerprint; regenerate export-markdown-chirho --all --strict");
  }
  if (
    exportReportExistsChirho &&
    exportReportShapeOkChirho &&
    exportReportHasSpanSourceFingerprintChirho &&
    !exportReportSpanSourceFingerprintMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("strict export report span-source fingerprint does not match live span files; regenerate export-markdown-chirho --all --strict");
  }
  if (
    exportReportExistsChirho &&
    exportReportShapeOkChirho &&
    exportReportUsesD1AuditChirho &&
    d1AuditFingerprintReadErrorChirho !== null
  ) {
    remainingWorkChirho.push(`D1 audit fingerprint scan failed: ${d1AuditFingerprintReadErrorChirho}`);
  }
  if (
    exportReportExistsChirho &&
    exportReportShapeOkChirho &&
    exportReportUsesD1AuditChirho &&
    !exportReportHasD1AuditFingerprintChirho
  ) {
    remainingWorkChirho.push("strict export report lacks a D1 audit fingerprint; regenerate export-markdown-chirho --all --strict");
  }
  if (
    exportReportExistsChirho &&
    exportReportShapeOkChirho &&
    exportReportUsesD1AuditChirho &&
    exportReportHasD1AuditFingerprintChirho &&
    d1AuditFingerprintReadErrorChirho === null &&
    liveD1AuditFingerprintChirho === null
  ) {
    remainingWorkChirho.push("strict export report used D1, but no current local D1 sqlite is available for fingerprint comparison");
  }
  if (
    exportReportExistsChirho &&
    exportReportShapeOkChirho &&
    exportReportUsesD1AuditChirho &&
    exportReportHasD1AuditFingerprintChirho &&
    liveD1AuditFingerprintChirho !== null &&
    !exportReportD1AuditFingerprintMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("strict export report D1 audit fingerprint does not match current D1 witness rows; regenerate export-markdown-chirho --all --strict");
  }
  if (!structuralChirho.strictPassedChirho || structuralChirho.issueCountChirho !== 0) {
    remainingWorkChirho.push("structural export strict gate is not clean");
  }
  if (structuralChirho.unknownSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.unknownSpanCountChirho} unknown span(s) remain`);
  }
  if (structuralChirho.nonNfcSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.nonNfcSpanCountChirho} non-NFC span(s) remain in the latest export report`);
  }
  if (normalizationChirho.liveNonNfcSpanTextFieldCountChirho !== 0) {
    remainingWorkChirho.push(
      `${normalizationChirho.liveNonNfcSpanTextFieldCountChirho} live span text field(s) are not NFC-normalized`
    );
  }
  if (structuralChirho.d1GapPageCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.d1GapPageCountChirho} D1 page gap(s) remain`);
  }
  if (structuralChirho.passCOcrHebrewSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.passCOcrHebrewSpanCountChirho} raw Pass-C Hebrew span(s) still need human certification`);
  }
  if (rawHebrewReportLiveDriftsResultChirho.length !== 0) {
    remainingWorkChirho.push(
      `${rawHebrewReportLiveDriftsResultChirho.length} raw Hebrew validation report item(s) do not match live span files; regenerate validate-pass-c-hebrew-chirho --all and make-pass-c-hebrew-human-pack-chirho`
    );
  }
  if (
    rawSpansChirho.length !== 0 &&
    rawHebrewPackManifestExistsChirho &&
    rawHebrewPackManifestShapeOkChirho &&
    !rawHebrewPackCountMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("raw Hebrew human review packet count does not match current report; regenerate make-pass-c-hebrew-human-pack-chirho");
  }
  if (
    rawSpansChirho.length !== 0 &&
    rawHebrewPackManifestExistsChirho &&
    rawHebrewPackManifestShapeOkChirho &&
    rawHebrewPackCountMatchesCurrentChirho &&
    !rawHebrewPackIdsMatchCurrentChirho
  ) {
    remainingWorkChirho.push("raw Hebrew human review packet item IDs do not match current report; regenerate make-pass-c-hebrew-human-pack-chirho");
  }
  if (
    rawSpansChirho.length !== 0 &&
    rawHebrewPackManifestExistsChirho &&
    rawHebrewPackManifestShapeOkChirho &&
    rawHebrewPackIdsMatchCurrentChirho &&
    !rawHebrewPackTextMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("raw Hebrew human review packet text does not match current report; regenerate make-pass-c-hebrew-human-pack-chirho");
  }
  if (
    rawSpansChirho.length !== 0 &&
    rawHebrewPackManifestExistsChirho &&
    rawHebrewPackManifestShapeOkChirho &&
    rawHebrewPackIdsMatchCurrentChirho &&
    !rawHebrewPackLineTextMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("raw Hebrew human review packet line text does not match current report; regenerate make-pass-c-hebrew-human-pack-chirho");
  }
  if (
    rawSpansChirho.length !== 0 &&
    rawHebrewPackManifestExistsChirho &&
    rawHebrewPackManifestShapeOkChirho &&
    rawHebrewPackIdsMatchCurrentChirho &&
    !rawHebrewPackStatusMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("raw Hebrew human review packet validation statuses do not match current report; regenerate make-pass-c-hebrew-human-pack-chirho");
  }
  if (visionTierLiveSnapshotChirho.d1ReadErrorChirho !== null) {
    remainingWorkChirho.push(`D1-derived vision-tier expert item scan failed: ${visionTierLiveSnapshotChirho.d1ReadErrorChirho}`);
  }
  if (
    visionTierLiveSnapshotChirho.d1ReadErrorChirho === null &&
    expertPackManifestExistsChirho &&
    expertPackManifestShapeOkChirho &&
    !visionTierManifestCountMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("expert confirmation manifest count does not match current vision-tier span/D1 state; regenerate make-expert-confirm-pack-chirho");
  }
  if (
    visionTierLiveSnapshotChirho.d1ReadErrorChirho === null &&
    expertPackManifestExistsChirho &&
    expertPackManifestShapeOkChirho &&
    visionTierManifestCountMatchesCurrentChirho &&
    !visionTierManifestIdsMatchCurrentChirho
  ) {
    remainingWorkChirho.push("expert confirmation manifest item IDs do not match current vision-tier span/D1 state; regenerate make-expert-confirm-pack-chirho");
  }
  if (
    visionTierLiveSnapshotChirho.d1ReadErrorChirho === null &&
    expertPackManifestExistsChirho &&
    expertPackManifestShapeOkChirho &&
    visionTierManifestIdsMatchCurrentChirho &&
    !visionTierManifestTextMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("expert confirmation manifest text does not match current live vision-tier span text; regenerate make-expert-confirm-pack-chirho");
  }
  if (visionTierConfirmationSummaryChirho.staleConfirmedPolicyItemCountChirho !== 0) {
    remainingWorkChirho.push(
      `${visionTierConfirmationSummaryChirho.staleConfirmedPolicyItemCountChirho} vision-tier expert confirmation item(s) are stale against current live span text`
    );
  }
  if (visionTierConfirmationSummaryChirho.duplicateConfirmedPolicyItemCountChirho !== 0) {
    remainingWorkChirho.push(
      `${visionTierConfirmationSummaryChirho.duplicateConfirmedPolicyItemCountChirho} duplicate vision-tier expert confirmation item(s) need cleanup`
    );
  }
  if (visionTierConfirmationSummaryChirho.issueOverriddenConfirmedPolicyItemCountChirho !== 0) {
    remainingWorkChirho.push(
      `${visionTierConfirmationSummaryChirho.issueOverriddenConfirmedPolicyItemCountChirho} vision-tier expert confirmation item(s) are overridden by open expert issue record(s)`
    );
  }
  if (visionTierConfirmationSummaryChirho.staleReviewedIssuePolicyItemCountChirho !== 0) {
    remainingWorkChirho.push(
      `${visionTierConfirmationSummaryChirho.staleReviewedIssuePolicyItemCountChirho} vision-tier expert issue record item(s) are stale against current live span text`
    );
  }
  if (visionTierConfirmationSummaryChirho.duplicateReviewedIssuePolicyItemCountChirho !== 0) {
    remainingWorkChirho.push(
      `${visionTierConfirmationSummaryChirho.duplicateReviewedIssuePolicyItemCountChirho} duplicate vision-tier expert issue record item(s) need cleanup`
    );
  }
  if (visionTierRemainingConfirmationCountChirho !== 0) {
    remainingWorkChirho.push(`${visionTierRemainingConfirmationCountChirho} vision-tier non-Latin span(s) still need expert/human confirmation`);
  }
  if (
    latinSymbolD1ReadErrorChirho === null &&
    currentLatinSymbolDecisionCountChirho !== 0 &&
    latinSymbolPackManifestExistsChirho &&
    latinSymbolPackManifestShapeOkChirho &&
    !latinSymbolReviewPacketCountMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("Latin/symbol vision review packet count does not match current span/D1 state; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (
    latinSymbolD1ReadErrorChirho === null &&
    currentLatinSymbolDecisionCountChirho !== 0 &&
    latinSymbolPackManifestExistsChirho &&
    latinSymbolPackManifestShapeOkChirho &&
    latinSymbolReviewPacketCountMatchesCurrentChirho &&
    !latinSymbolReviewPacketIdsMatchCurrentChirho
  ) {
    remainingWorkChirho.push("Latin/symbol vision review packet item IDs do not match current span/D1 state; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (
    latinSymbolD1ReadErrorChirho === null &&
    currentLatinSymbolDecisionCountChirho !== 0 &&
    latinSymbolPackManifestExistsChirho &&
    latinSymbolPackManifestShapeOkChirho &&
    latinSymbolReviewPacketIdsMatchCurrentChirho &&
    !latinSymbolReviewPacketTextMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("Latin/symbol vision review packet text does not match current live span/D1 text; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (
    latinSymbolD1ReadErrorChirho === null &&
    currentLatinSymbolDecisionCountChirho !== 0 &&
    latinSymbolPackManifestExistsChirho &&
    latinSymbolPackManifestShapeOkChirho &&
    latinSymbolReviewPacketIdsMatchCurrentChirho &&
    !latinSymbolReviewPacketLineTextMatchesCurrentChirho
  ) {
    remainingWorkChirho.push("Latin/symbol vision review packet line text does not match current live span/D1 context; regenerate make-latin-symbol-vision-pack-chirho");
  }
  if (latinSymbolReviewSummaryChirho.staleRowsChirho !== 0) {
    remainingWorkChirho.push(`${latinSymbolReviewSummaryChirho.staleRowsChirho} Latin/symbol review row(s) are stale against current live span/D1 text`);
  }
  if (latinSymbolLocalRowsMissingFromBackupChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolLocalRowsMissingFromBackupChirho} local Latin/symbol review row(s) need export-backup before certification can complete on a fresh checkout`
    );
  }
  if (latinSymbolPolicySummaryChirho.staleAcceptedPolicyItemCountChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolPolicySummaryChirho.staleAcceptedPolicyItemCountChirho} Latin/symbol policy item(s) are stale against current live span/D1 text`
    );
  }
  if (latinSymbolPolicySummaryChirho.duplicateAcceptedPolicyItemCountChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolPolicySummaryChirho.duplicateAcceptedPolicyItemCountChirho} duplicate Latin/symbol policy item(s) need cleanup`
    );
  }
  if (latinSymbolIssueOverriddenAcceptedDecisionCountChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolIssueOverriddenAcceptedDecisionCountChirho} Latin/symbol accepted decision(s) are overridden by open issue review(s)`
    );
  }
  if (latinSymbolRemainingDecisionCountChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolRemainingDecisionCountChirho} Latin/symbol vision-tier span/word decision(s) still need accepted-clean review or explicit acceptance policy`
    );
  }
  if (!rawHebrewChirho.exportPassCOcrMatchesReportChirho) {
    remainingWorkChirho.push("raw Hebrew validation report count does not match the latest export report; regenerate validation artifacts");
  }
  if (passCHumanValidationDbBackupRowsChirho.length !== 0 && !passCHumanValidationBackupExistsChirho) {
    remainingWorkChirho.push("Pass-C human validation backup is missing; run backup-pass-c-human-validations-chirho");
  }
  if (passCHumanValidationLocalRowsMissingFromBackupChirho !== 0) {
    remainingWorkChirho.push(
      `${passCHumanValidationLocalRowsMissingFromBackupChirho} local Pass-C human validation row(s) need backup before certification can complete on a fresh checkout`
    );
  }
  const certificationCompleteChirho = remainingWorkChirho.length === 0;
  return {
    generatedAtChirho: new Date().toISOString(),
    artifactsChirho: {
      exportReportExistsChirho,
      rawHebrewReportExistsChirho,
      rawHebrewPackManifestExistsChirho,
      passCHumanValidationBackupExistsChirho,
      expertPackManifestExistsChirho,
      visionTierExpertConfirmationPolicyExistsChirho,
      latinSymbolPackManifestExistsChirho,
      latinSymbolReviewBackupExistsChirho,
      latinSymbolAcceptancePolicyExistsChirho,
      exportReportShapeOkChirho,
      rawHebrewReportShapeOkChirho,
      rawHebrewPackManifestShapeOkChirho,
      passCHumanValidationBackupShapeOkChirho: passCHumanValidationBackupShapeOkResultChirho,
      expertPackManifestShapeOkChirho,
      visionTierExpertConfirmationPolicyShapeOkChirho: visionTierConfirmationSummaryChirho.policyFileShapeOkChirho,
      latinSymbolPackManifestShapeOkChirho,
      latinSymbolReviewBackupShapeOkChirho,
      latinSymbolAcceptancePolicyShapeOkChirho: latinSymbolPolicySummaryChirho.policyFileShapeOkChirho,
    },
    structuralChirho,
    rawHebrewChirho,
    visionTierChirho,
    latinSymbolVisionChirho,
    normalizationChirho,
    humanValidationDbChirho: humanSummaryChirho,
    passCHumanValidationBackupChirho: passCHumanValidationBackupSummaryChirho,
    visionTierExpertConfirmationPolicyChirho: visionTierConfirmationSummaryForStatusChirho,
    latinSymbolReviewDbChirho: latinSymbolReviewSummaryChirho,
    latinSymbolReviewBackupChirho: latinSymbolReviewBackupSummaryChirho,
    latinSymbolAcceptancePolicyChirho: latinSymbolPolicySummaryForStatusChirho,
    certificationCompleteChirho,
    remainingWorkChirho,
  };
}

function markdownChirho(statusChirho: CertificationStatusChirho): string {
  const remainingLinesChirho = statusChirho.remainingWorkChirho.length === 0
    ? ["- None."]
    : statusChirho.remainingWorkChirho.map((itemChirho) => `- ${itemChirho}`);
  const visionCountsChirho = Object.entries(statusChirho.visionTierChirho.completeVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const liveVisionCountsChirho = Object.entries(statusChirho.visionTierChirho.liveVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const sourceCountsChirho = Object.entries(statusChirho.rawHebrewChirho.sourceCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const latinSymbolCountsChirho = Object.entries(statusChirho.latinSymbolVisionChirho.explicitVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const d1LatinSymbolCountsChirho = Object.entries(statusChirho.latinSymbolVisionChirho.d1DerivedVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const latinSymbolScriptCountChirho = (scriptChirho: string) =>
    (statusChirho.latinSymbolVisionChirho.explicitVisionCountsChirho[scriptChirho] ?? 0) +
    (statusChirho.latinSymbolVisionChirho.d1DerivedVisionCountsChirho[scriptChirho] ?? 0);
  const pendingLatinSymbolScriptCountChirho = (scriptChirho: string) =>
    statusChirho.latinSymbolVisionChirho.pendingDecisionCountsChirho[scriptChirho] ?? 0;
  const latinSymbolFrenchCountChirho = latinSymbolScriptCountChirho("french-chirho");
  const latinSymbolNonFrenchCountChirho = latinSymbolScriptCountChirho("latin-non-french-chirho");
  const latinSymbolTrivialSymbolCountChirho =
    statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.trivialPunctuationSymbolItemsChirho;
  const latinSymbolSiglumSymbolCountChirho =
    statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.mixedScriptSymbolItemsChirho;
  const latinSymbolNontrivialSymbolCountChirho =
    statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.nontrivialSymbolItemsChirho -
    statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.mixedScriptSymbolItemsChirho;
  const expertScriptCountChirho = (scriptChirho: string): number =>
    statusChirho.visionTierChirho.liveVisionCountsChirho[scriptChirho] ?? 0;
  const pendingExpertScriptCountChirho = (scriptChirho: string): number =>
    statusChirho.visionTierChirho.pendingVisionCountsChirho[scriptChirho] ?? 0;
  const expertPriorityCountChirho = statusChirho.visionTierChirho.priorityItemCountChirho;
  const expertAppendixCountChirho = Math.max(
    0,
    statusChirho.visionTierChirho.liveVisionItemCountChirho - expertPriorityCountChirho
  );
  const issueCodeCountsChirho = Object.entries(statusChirho.structuralChirho.issueCodeCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const issueSummaryLinesChirho = statusChirho.structuralChirho.issueSummariesChirho.length === 0
    ? ["- None."]
    : statusChirho.structuralChirho.issueSummariesChirho.map((issueChirho) => `- ${issueChirho}`);
  const guardedWlcCorrectionCommandLinesChirho = statusChirho.structuralChirho.guardedWlcCorrectionCommandsChirho.length === 0
    ? ["- Guarded WLC correction commands: none pending"]
    : statusChirho.structuralChirho.guardedWlcCorrectionCommandsChirho.map(
      (commandChirho) =>
        `- Guarded WLC correction command after explicit human confirmation (${commandChirho.locationChirho}): \`${commandChirho.commandChirho}\``
    );
  const guardedWlcCorrectionRoutingLinesChirho = statusChirho.structuralChirho.guardedWlcCorrectionCommandsChirho.length === 0
    ? ["- No guarded WLC correction is currently pending; if a new saved issue appears, confirm it against the print before applying any generated command."]
    : ["- Apply guarded WLC corrections only after each displayed print-confirmation question is explicitly settled."];
  const hallelujahReviewCountChirho =
    statusChirho.rawHebrewChirho.livePendingSpanCountChirho +
    pendingExpertScriptCountChirho("hebrew-chirho") +
    pendingExpertScriptCountChirho("greek-chirho");
  const externalExpertReviewCountChirho =
    pendingExpertScriptCountChirho("syriac-chirho") +
    pendingExpertScriptCountChirho("arabic-chirho");
  return [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Transcription Certification Status Chirho",
    "",
    `Generated: ${statusChirho.generatedAtChirho}`,
    "",
    `Certification complete: ${statusChirho.certificationCompleteChirho ? "yes" : "no"}`,
    "",
    "## Review Entry Points",
    "",
    `- Raw Hebrew live validator: http://localhost:8766/ (${statusChirho.rawHebrewChirho.livePendingSpanCountChirho} pending of ${statusChirho.rawHebrewChirho.reportSpanCountChirho} report span(s); command: \`bun run pass-c-human-validate-chirho\`)`,
    `- Raw Hebrew unvalidated lane: ${rawHebrewReviewUrlChirho("unvalidated-chirho")} (${statusChirho.rawHebrewChirho.livePendingUnvalidatedSpanCountChirho} pending of ${statusChirho.rawHebrewChirho.unvalidatedSpanCountChirho} report span(s))`,
    `- Raw Hebrew partial-validation lane: ${rawHebrewReviewUrlChirho("partial-token-validated-chirho")} (${statusChirho.rawHebrewChirho.livePendingPartialValidatedSpanCountChirho} pending of ${statusChirho.rawHebrewChirho.partialValidatedSpanCountChirho} report span(s))`,
    `- Raw Hebrew all-token spot-check lane: ${rawHebrewReviewUrlChirho("all-token-validated-chirho")} (${statusChirho.rawHebrewChirho.livePendingAllTokenValidatedSpanCountChirho} pending of ${statusChirho.rawHebrewChirho.allTokenValidatedSpanCountChirho} report span(s))`,
    `- Raw Hebrew saved issue lane: ${rawHebrewReviewUrlChirho(undefined, "saved-issues-chirho")} (${statusChirho.humanValidationDbChirho.rawQueueIssueRowsChirho} read-only current issue row(s))`,
    "- Raw Hebrew pending counts match the live validator; report totals include already-saved rows.",
    `- Raw Hebrew image packet: \`${relativeProjectPathChirho(RAW_HEBREW_PACK_INDEX_PATH_CHIRHO)}\``,
    `- Latin/symbol live reviewer: http://localhost:8770/ (${statusChirho.latinSymbolVisionChirho.remainingDecisionCountChirho} remaining decision(s); command: \`bun run latin-symbol-vision-review-chirho\`)`,
    `- Latin/symbol French lane: ${latinSymbolReviewUrlChirho("french-chirho")} (${pendingLatinSymbolScriptCountChirho("french-chirho")} pending of ${latinSymbolFrenchCountChirho} item(s))`,
    `- Latin/symbol non-French lane: ${latinSymbolReviewUrlChirho("latin-non-french-chirho")} (${pendingLatinSymbolScriptCountChirho("latin-non-french-chirho")} pending of ${latinSymbolNonFrenchCountChirho} item(s))`,
    `- Latin/symbol trivial punctuation lane: ${latinSymbolReviewUrlChirho("symbol-chirho", "trivial-punctuation-chirho")} (${statusChirho.latinSymbolVisionChirho.pendingTrivialPunctuationSymbolItemCountChirho} pending of ${latinSymbolTrivialSymbolCountChirho} item(s))`,
    `- Latin/symbol witness-sigla/script-symbol lane: ${latinSymbolReviewUrlChirho("symbol-chirho", "script-or-siglum-symbol-chirho")} (${statusChirho.latinSymbolVisionChirho.pendingMixedScriptSymbolItemCountChirho} pending of ${latinSymbolSiglumSymbolCountChirho} item(s))`,
    `- Latin/symbol nontrivial-symbol lane: ${latinSymbolReviewUrlChirho("symbol-chirho", "nontrivial-symbol-chirho")} (${statusChirho.latinSymbolVisionChirho.pendingNontrivialSymbolItemCountChirho} pending of ${latinSymbolNontrivialSymbolCountChirho} item(s))`,
    "- Latin/symbol pending counts subtract accepted-clean reviews and accepted explicit policies; open issue reviews keep items pending.",
    `- Latin/symbol image packet: \`${relativeProjectPathChirho(LATIN_SYMBOL_PACK_INDEX_PATH_CHIRHO)}\``,
    `- Expert non-Latin live reviewer: http://localhost:8771/ (${statusChirho.visionTierChirho.remainingConfirmationCountChirho} remaining confirmation(s); command: \`bun run vision-tier-expert-review-chirho\`)`,
    `- Expert priority lane: ${expertReviewUrlChirho(undefined, "priority-chirho")} (${statusChirho.visionTierChirho.pendingPriorityItemCountChirho} pending of ${expertPriorityCountChirho} item(s))`,
    `- Expert appendix lane: ${expertReviewUrlChirho(undefined, "appendix-chirho")} (${statusChirho.visionTierChirho.pendingAppendixItemCountChirho} pending of ${expertAppendixCountChirho} item(s))`,
    `- Expert Hebrew/WLC lane: ${expertReviewUrlChirho("hebrew-chirho")} (${pendingExpertScriptCountChirho("hebrew-chirho")} pending of ${expertScriptCountChirho("hebrew-chirho")} item(s))`,
    `- Expert Greek lane: ${expertReviewUrlChirho("greek-chirho")} (${pendingExpertScriptCountChirho("greek-chirho")} pending of ${expertScriptCountChirho("greek-chirho")} item(s))`,
    `- Expert Syriac reader lane: ${expertReviewUrlChirho("syriac-chirho")} (${pendingExpertScriptCountChirho("syriac-chirho")} pending of ${expertScriptCountChirho("syriac-chirho")} item(s))`,
    `- Expert Arabist lane: ${expertReviewUrlChirho("arabic-chirho")} (${pendingExpertScriptCountChirho("arabic-chirho")} pending of ${expertScriptCountChirho("arabic-chirho")} item(s))`,
    `- Expert non-Latin image packet: \`${relativeProjectPathChirho(EXPERT_PACK_INDEX_PATH_CHIRHO)}\` (${statusChirho.visionTierChirho.remainingConfirmationCountChirho} remaining confirmation(s))`,
    `- Reviewer scope and primer guide: \`${relativeProjectPathChirho(REVIEWER_SCOPE_GUIDE_PATH_CHIRHO)}\``,
    `- Resolved Zechariah historical aid: \`${relativeProjectPathChirho(ZECHARIAH_TIPCHA_CONFIRMATION_AID_PATH_CHIRHO)}\``,
    ...guardedWlcCorrectionCommandLinesChirho,
    "",
    "## Suggested Review Routing",
    "",
    `- Hallelujah starting lanes: pending raw Hebrew + Hebrew/WLC vision + Greek vision (${hallelujahReviewCountChirho} review target(s)). Start with raw Hebrew unvalidated, then raw Hebrew partial, then Hebrew/WLC vision and Greek vision; flag or skip Hebrew-script Aramaic/Targum details outside your competence.`,
    `- External script-expert lanes: Syriac reader + Arabist (${externalExpertReviewCountChirho} item(s)). A non-reader can flag crop or segmentation problems, but should not confirm exact letters, dots, vowels, or punctuation.`,
    "- Hebrew-script Aramaic/Targum: confirm consonants only when the print is clear; route exact Aramaic vocalization, dagesh/shin-dot details, and Targum wording to a Targum/Aramaic reviewer.",
    `- Latin/symbol proofing: ${statusChirho.latinSymbolVisionChirho.remainingDecisionCountChirho} item(s) remain. Use the symbol-risk lanes because witness sigla, references, and ornament guesses are not blanket-safe.`,
    ...guardedWlcCorrectionRoutingLinesChirho,
    "",
    "## Structural Export",
    "",
    `- Export report exists: ${statusChirho.artifactsChirho.exportReportExistsChirho}`,
    `- Export report shape OK: ${statusChirho.artifactsChirho.exportReportShapeOkChirho}`,
    `- Export span-source files in report: ${statusChirho.structuralChirho.spanSourceFileCountChirho ?? "unknown"}`,
    `- Live span-source files for report pages: ${statusChirho.structuralChirho.liveSpanSourceFileCountChirho}`,
    `- Export span-source fingerprint matches live spans: ${statusChirho.structuralChirho.spanSourceFingerprintMatchesCurrentChirho}`,
    `- Export D1 audit path: ${statusChirho.structuralChirho.d1AuditDbPathChirho ?? "none"}`,
    `- Live D1 audit path: ${statusChirho.structuralChirho.liveD1AuditDbPathChirho ?? "none"}`,
    `- D1 audit fingerprint read error: ${statusChirho.structuralChirho.d1AuditFingerprintReadErrorChirho ?? "none"}`,
    `- Export D1 page/word/OCR-suggestion rows: ${[
      statusChirho.structuralChirho.d1AuditPageRowCountChirho ?? "unknown",
      statusChirho.structuralChirho.d1AuditWordRowCountChirho ?? "unknown",
      statusChirho.structuralChirho.d1AuditOcrSuggestionRowCountChirho ?? "unknown",
    ].join("/")}`,
    `- Live D1 page/word/OCR-suggestion rows: ${[
      statusChirho.structuralChirho.liveD1AuditPageRowCountChirho ?? "unknown",
      statusChirho.structuralChirho.liveD1AuditWordRowCountChirho ?? "unknown",
      statusChirho.structuralChirho.liveD1AuditOcrSuggestionRowCountChirho ?? "unknown",
    ].join("/")}`,
    `- Export D1 audit fingerprint matches live D1: ${statusChirho.structuralChirho.d1AuditFingerprintMatchesCurrentChirho ?? "not-applicable"}`,
    `- Strict passed: ${statusChirho.structuralChirho.strictPassedChirho}`,
    `- Issues: ${statusChirho.structuralChirho.issueCountChirho}`,
    `- Issue code counts: ${issueCodeCountsChirho || "none"}`,
    `- Unknown spans: ${statusChirho.structuralChirho.unknownSpanCountChirho}`,
    `- Non-NFC spans in export report: ${statusChirho.structuralChirho.nonNfcSpanCountChirho}`,
    `- D1 gap pages: ${statusChirho.structuralChirho.d1GapPageCountChirho}`,
    `- Hebrew spans: ${statusChirho.structuralChirho.hebrewSpanCountChirho}`,
    `- Raw Pass-C Hebrew spans: ${statusChirho.structuralChirho.passCOcrHebrewSpanCountChirho}`,
    "",
    "### Strict Issue Details",
    "",
    ...issueSummaryLinesChirho,
    "",
    "## Unicode Normalization",
    "",
    `- Live non-NFC span text fields: ${statusChirho.normalizationChirho.liveNonNfcSpanTextFieldCountChirho}`,
    `- Live files with non-NFC span text: ${statusChirho.normalizationChirho.liveNonNfcSpanFileCountChirho}`,
    "",
    "## Raw Hebrew Human Queue",
    "",
    `- Raw Hebrew report exists: ${statusChirho.artifactsChirho.rawHebrewReportExistsChirho}`,
    `- Raw Hebrew report shape OK: ${statusChirho.artifactsChirho.rawHebrewReportShapeOkChirho}`,
    `- Raw Hebrew packet manifest exists: ${statusChirho.artifactsChirho.rawHebrewPackManifestExistsChirho}`,
    `- Raw Hebrew packet manifest shape OK: ${statusChirho.artifactsChirho.rawHebrewPackManifestShapeOkChirho}`,
    `- Report spans: ${statusChirho.rawHebrewChirho.reportSpanCountChirho}`,
    `- Packet items: ${statusChirho.rawHebrewChirho.packItemCountChirho}`,
    `- Packet generated: ${statusChirho.rawHebrewChirho.packGeneratedAtChirho ?? "unknown"}`,
    `- Packet count matches current report: ${statusChirho.rawHebrewChirho.packCountMatchesCurrentChirho}`,
    `- Packet IDs match current report: ${statusChirho.rawHebrewChirho.packIdsMatchCurrentChirho}`,
    `- Packet text matches current report: ${statusChirho.rawHebrewChirho.packTextMatchesCurrentChirho}`,
    `- Packet line text matches current report: ${statusChirho.rawHebrewChirho.packLineTextMatchesCurrentChirho}`,
    `- Packet validation statuses match current report: ${statusChirho.rawHebrewChirho.packStatusMatchesCurrentChirho}`,
    `- Raw report matches live span files: ${statusChirho.rawHebrewChirho.liveReportMatchesSpanFilesChirho}`,
    `- Raw report live drift items: ${statusChirho.rawHebrewChirho.liveReportDriftCountChirho}`,
    ...statusChirho.rawHebrewChirho.liveReportDriftSamplesChirho.map(
      (sampleChirho) => `  - ${sampleChirho}`
    ),
    `- Live pending spans: ${statusChirho.rawHebrewChirho.livePendingSpanCountChirho}`,
    `- Tokens: ${statusChirho.rawHebrewChirho.reportTokenCountChirho}`,
    `- Unvalidated spans: ${statusChirho.rawHebrewChirho.unvalidatedSpanCountChirho}`,
    `- Live pending unvalidated spans: ${statusChirho.rawHebrewChirho.livePendingUnvalidatedSpanCountChirho}`,
    `- Partial spans: ${statusChirho.rawHebrewChirho.partialValidatedSpanCountChirho}`,
    `- Live pending partial spans: ${statusChirho.rawHebrewChirho.livePendingPartialValidatedSpanCountChirho}`,
    `- All-token spot checks: ${statusChirho.rawHebrewChirho.allTokenValidatedSpanCountChirho}`,
    `- Live pending all-token spot checks: ${statusChirho.rawHebrewChirho.livePendingAllTokenValidatedSpanCountChirho}`,
    `- Source counts before filter: ${sourceCountsChirho || "none"}`,
    `- Export/report count match: ${statusChirho.rawHebrewChirho.exportPassCOcrMatchesReportChirho}`,
    "",
    "## Human Validation DB",
    "",
    `- Current schema-v2 rows: ${statusChirho.humanValidationDbChirho.currentSchema2RowsChirho}`,
    `- Raw queue rows: ${statusChirho.humanValidationDbChirho.rawQueueCurrentRowsChirho}`,
    `- Raw queue clean rows: ${statusChirho.humanValidationDbChirho.rawQueueCleanRowsChirho}`,
    `- Raw queue issue rows: ${statusChirho.humanValidationDbChirho.rawQueueIssueRowsChirho}`,
    `- Raw queue applied rows: ${statusChirho.humanValidationDbChirho.rawQueueAppliedRowsChirho}`,
    `- Legacy current rows ignored by apply/certification: ${statusChirho.humanValidationDbChirho.legacyCurrentRowsChirho}`,
    "",
    "## Pass-C Human Validation Backup",
    "",
    `- Backup exists: ${statusChirho.artifactsChirho.passCHumanValidationBackupExistsChirho}`,
    `- Backup shape OK: ${statusChirho.artifactsChirho.passCHumanValidationBackupShapeOkChirho}`,
    `- Local DB rows: ${statusChirho.passCHumanValidationBackupChirho.dbRowsChirho}`,
    `- Backup rows: ${statusChirho.passCHumanValidationBackupChirho.backupRowsChirho}`,
    `- Local rows missing from backup: ${statusChirho.passCHumanValidationBackupChirho.localRowsMissingFromBackupChirho}`,
    "",
    "## Vision-Tier Expert Queue",
    "",
    `- Expert manifest exists: ${statusChirho.artifactsChirho.expertPackManifestExistsChirho}`,
    `- Expert manifest shape OK: ${statusChirho.artifactsChirho.expertPackManifestShapeOkChirho}`,
    `- D1 scan error: ${statusChirho.visionTierChirho.d1ReadErrorChirho ?? "none"}`,
    `- Priority items: ${statusChirho.visionTierChirho.priorityItemCountChirho}`,
    `- Complete vision-tier items: ${statusChirho.visionTierChirho.completeVisionItemCountChirho}`,
    `- Counts: ${visionCountsChirho || "none"}`,
    `- Live vision-tier items: ${statusChirho.visionTierChirho.liveVisionItemCountChirho}`,
    `- Live counts: ${liveVisionCountsChirho || "none"}`,
    `- Live pending items: ${statusChirho.visionTierChirho.pendingVisionItemCountChirho}`,
    `- Live pending counts: ${Object.entries(statusChirho.visionTierChirho.pendingVisionCountsChirho).map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`).join(", ") || "none"}`,
    `- Manifest count matches current state: ${statusChirho.visionTierChirho.manifestCountMatchesCurrentChirho}`,
    `- Manifest IDs match current state: ${statusChirho.visionTierChirho.manifestIdsMatchCurrentChirho}`,
    `- Manifest text matches current state: ${statusChirho.visionTierChirho.manifestTextMatchesCurrentChirho}`,
    `- Confirmed by explicit policy: ${statusChirho.visionTierChirho.confirmedByPolicyCountChirho}`,
    `- Reviewed issues by explicit policy: ${statusChirho.visionTierChirho.reviewedIssueByPolicyCountChirho}`,
    `- Remaining confirmations: ${statusChirho.visionTierChirho.remainingConfirmationCountChirho}`,
    "",
    "## Vision-Tier Expert Confirmation Policy",
    "",
    `- Policy exists: ${statusChirho.visionTierExpertConfirmationPolicyChirho.policyFileExistsChirho}`,
    `- Policy shape OK: ${statusChirho.visionTierExpertConfirmationPolicyChirho.policyFileShapeOkChirho}`,
    `- Confirmed policies: ${statusChirho.visionTierExpertConfirmationPolicyChirho.confirmedPolicyCountChirho}`,
    `- Confirmed policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.confirmedPolicyItemCountChirho}`,
    `- Valid confirmed policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.validConfirmedPolicyItemCountChirho}`,
    `- Stale confirmed policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.staleConfirmedPolicyItemCountChirho}`,
    `- Duplicate confirmed policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.duplicateConfirmedPolicyItemCountChirho}`,
    `- Confirmed policy items overridden by open issues: ${statusChirho.visionTierExpertConfirmationPolicyChirho.issueOverriddenConfirmedPolicyItemCountChirho}`,
    `- Reviewed-issue policies: ${statusChirho.visionTierExpertConfirmationPolicyChirho.reviewedIssuePolicyCountChirho}`,
    `- Reviewed-issue policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.reviewedIssuePolicyItemCountChirho}`,
    `- Valid reviewed-issue policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.validReviewedIssuePolicyItemCountChirho}`,
    `- Stale reviewed-issue policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.staleReviewedIssuePolicyItemCountChirho}`,
    `- Duplicate reviewed-issue policy items: ${statusChirho.visionTierExpertConfirmationPolicyChirho.duplicateReviewedIssuePolicyItemCountChirho}`,
    `- Shape errors: ${statusChirho.visionTierExpertConfirmationPolicyChirho.shapeErrorsChirho.length === 0 ? "none" : statusChirho.visionTierExpertConfirmationPolicyChirho.shapeErrorsChirho.join("; ")}`,
    "",
    "## Latin/Symbol Vision Scope",
    "",
    "These spans are not in the non-Latin expert pack, but they still matter for a project-wide flawless-transcription claim.",
    "",
    `- Included in completion gate: ${statusChirho.latinSymbolVisionChirho.includedInCompletionGateChirho}`,
    `- D1 scan error: ${statusChirho.latinSymbolVisionChirho.d1ReadErrorChirho ?? "none"}`,
    `- Explicit vision-tier Latin/symbol items: ${statusChirho.latinSymbolVisionChirho.explicitVisionItemCountChirho}`,
    `- Counts: ${latinSymbolCountsChirho || "none"}`,
    `- D1-derived Latin/symbol vision words: ${statusChirho.latinSymbolVisionChirho.d1DerivedVisionWordCountChirho}`,
    `- D1-derived counts: ${d1LatinSymbolCountsChirho || "none"}`,
    `- Symbol items total: ${statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.totalSymbolItemsChirho}`,
    `- Symbol items safe-symbols-only: ${statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.trivialPunctuationSymbolItemsChirho}`,
    `- Symbol items requiring review/override: ${statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.nontrivialSymbolItemsChirho}`,
    `- Symbol items containing script letters/sigla: ${statusChirho.latinSymbolVisionChirho.symbolRiskSummaryChirho.mixedScriptSymbolItemsChirho}`,
    `- Review packet exists: ${statusChirho.artifactsChirho.latinSymbolPackManifestExistsChirho}`,
    `- Review packet shape OK: ${statusChirho.artifactsChirho.latinSymbolPackManifestShapeOkChirho}`,
    `- Review packet items: ${statusChirho.latinSymbolVisionChirho.reviewPacketItemCountChirho}`,
    `- Review packet count matches current state: ${statusChirho.latinSymbolVisionChirho.reviewPacketCountMatchesCurrentChirho}`,
    `- Review packet IDs match current state: ${statusChirho.latinSymbolVisionChirho.reviewPacketIdsMatchCurrentChirho}`,
    `- Review packet text matches current state: ${statusChirho.latinSymbolVisionChirho.reviewPacketTextMatchesCurrentChirho}`,
    `- Review packet line text matches current state: ${statusChirho.latinSymbolVisionChirho.reviewPacketLineTextMatchesCurrentChirho}`,
    `- Accepted-clean reviews: ${statusChirho.latinSymbolVisionChirho.reviewedCleanCountChirho}`,
    `- Reviewed-issues rows: ${statusChirho.latinSymbolVisionChirho.reviewedIssueCountChirho}`,
    `- Accepted by explicit policy: ${statusChirho.latinSymbolVisionChirho.acceptedByPolicyCountChirho}`,
    `- Total accepted decisions: ${statusChirho.latinSymbolVisionChirho.totalAcceptedDecisionCountChirho}`,
    `- Accepted decisions overridden by open issues: ${statusChirho.latinSymbolVisionChirho.issueOverriddenAcceptedDecisionCountChirho}`,
    `- Stale review rows: ${statusChirho.latinSymbolVisionChirho.staleReviewCountChirho}`,
    `- Live pending decisions: ${statusChirho.latinSymbolVisionChirho.pendingDecisionCountChirho}`,
    `- Live pending counts: ${Object.entries(statusChirho.latinSymbolVisionChirho.pendingDecisionCountsChirho).map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`).join(", ") || "none"}`,
    `- Remaining decisions: ${statusChirho.latinSymbolVisionChirho.remainingDecisionCountChirho}`,
    "",
    "## Latin/Symbol Review Store",
    "",
    `- Backup exists: ${statusChirho.artifactsChirho.latinSymbolReviewBackupExistsChirho}`,
    `- Backup shape OK: ${statusChirho.artifactsChirho.latinSymbolReviewBackupShapeOkChirho}`,
    `- Current merged rows: ${statusChirho.latinSymbolReviewDbChirho.currentRowsChirho}`,
    `- Local DB rows: ${statusChirho.latinSymbolReviewBackupChirho.dbRowsChirho}`,
    `- Backup rows: ${statusChirho.latinSymbolReviewBackupChirho.backupRowsChirho}`,
    `- Local rows missing from backup: ${statusChirho.latinSymbolReviewBackupChirho.localRowsMissingFromBackupChirho}`,
    `- Valid accepted-clean rows: ${statusChirho.latinSymbolReviewDbChirho.validReviewedCleanRowsChirho}`,
    `- Valid reviewed-issues rows: ${statusChirho.latinSymbolReviewDbChirho.validReviewedIssueRowsChirho}`,
    `- Stale rows: ${statusChirho.latinSymbolReviewDbChirho.staleRowsChirho}`,
    `- Applied rows: ${statusChirho.latinSymbolReviewDbChirho.appliedRowsChirho}`,
    "",
    "## Latin/Symbol Acceptance Policy",
    "",
    `- Policy exists: ${statusChirho.latinSymbolAcceptancePolicyChirho.policyFileExistsChirho}`,
    `- Policy shape OK: ${statusChirho.latinSymbolAcceptancePolicyChirho.policyFileShapeOkChirho}`,
    `- Accepted policies: ${statusChirho.latinSymbolAcceptancePolicyChirho.acceptedPolicyCountChirho}`,
    `- Accepted policy items: ${statusChirho.latinSymbolAcceptancePolicyChirho.acceptedPolicyItemCountChirho}`,
    `- Valid accepted policy items: ${statusChirho.latinSymbolAcceptancePolicyChirho.validAcceptedPolicyItemCountChirho}`,
    `- Stale accepted policy items: ${statusChirho.latinSymbolAcceptancePolicyChirho.staleAcceptedPolicyItemCountChirho}`,
    `- Duplicate accepted policy items: ${statusChirho.latinSymbolAcceptancePolicyChirho.duplicateAcceptedPolicyItemCountChirho}`,
    `- Shape errors: ${statusChirho.latinSymbolAcceptancePolicyChirho.shapeErrorsChirho.length === 0 ? "none" : statusChirho.latinSymbolAcceptancePolicyChirho.shapeErrorsChirho.join("; ")}`,
    "",
    "## Remaining Work",
    "",
    ...remainingLinesChirho,
    "",
  ].join("\n");
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const strictChirho = argsChirho.includes("--strict");
  const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? PROGRESS_DB_PATH_CHIRHO;
  const outDirChirho = parseArgValueChirho(argsChirho, "out-dir") ?? OUT_DIR_CHIRHO;
  mkdirSync(outDirChirho, { recursive: true });
  const statusChirho = buildStatusChirho(dbPathChirho);
  writeFileSync(join(outDirChirho, "status-chirho.json"), `${JSON.stringify(statusChirho, null, 2)}\n`);
  writeFileSync(join(outDirChirho, "status-chirho.md"), markdownChirho(statusChirho));
  console.log(
    `[${MODULE_CHIRHO}] complete=${statusChirho.certificationCompleteChirho} ` +
      `strictMode=${strictChirho} ` +
      `strictExport=${statusChirho.structuralChirho.strictPassedChirho} ` +
      `rawHebrew=${statusChirho.structuralChirho.passCOcrHebrewSpanCountChirho} ` +
      `visionTier=${statusChirho.visionTierChirho.completeVisionItemCountChirho} ` +
      `liveNonNfc=${statusChirho.normalizationChirho.liveNonNfcSpanTextFieldCountChirho} ` +
      `report=${join(outDirChirho, "status-chirho.md")}`
  );
  if (strictChirho && !statusChirho.certificationCompleteChirho) process.exitCode = 1;
}

if (import.meta.main) mainChirho();
