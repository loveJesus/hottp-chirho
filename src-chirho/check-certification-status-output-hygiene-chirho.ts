// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify ignored certification status artifacts are well-formed.
 *
 * Git diff hygiene does not cover workspace-chirho, so this checks the generated
 * status Markdown/JSON directly after transcription-certification-status runs.
 */

import { existsSync, readFileSync } from "fs";
import { join, relative, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  JOHN_316_INLINE_MARKDOWN_HEADER_CHIRHO,
  assertGeneratedCheckChirho,
  assertGeneratedTextHygieneChirho,
  assertMarkdownHeaderChirho,
} from "./generated-output-hygiene-chirho.ts";

const MODULE_CHIRHO = "check-certification-status-output-hygiene-chirho";
const DEFAULT_STATUS_OUT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "certification-status-chirho");
const STATUS_LOCAL_ARTIFACT_PREFIXES_CHIRHO = [
  "workspace-chirho/",
  "spec-chirho/",
  "src-chirho/",
  "app-chirho/",
];
const STATUS_BACKTICK_RE_CHIRHO = /`([^`\n]+)`/g;
const REVIEW_SERVER_PORTS_CHIRHO = new Set([8766, 8770, 8771]);

interface CertificationStatusOutputChirho {
  generatedAtChirho?: string;
  certificationCompleteChirho?: boolean;
  remainingWorkChirho?: unknown;
  artifactsChirho?: unknown;
  reviewStartLinksChirho?: unknown;
  rawHebrewChirho?: unknown;
  latinSymbolVisionChirho?: unknown;
  latinSymbolReviewBackupChirho?: unknown;
  latinSymbolReviewDbChirho?: unknown;
  latinSymbolAcceptancePolicyChirho?: unknown;
  visionTierChirho?: unknown;
  expertSuppliedVisionTextBackupChirho?: unknown;
  visionTierExpertConfirmationPolicyChirho?: unknown;
  humanValidationDbChirho?: unknown;
  passCHumanValidationBackupChirho?: unknown;
  structuralChirho?: unknown;
  normalizationChirho?: unknown;
  strictBlindScansChirho?: unknown;
}

interface ReviewStartLinkCountCheckChirho {
  keyChirho: string;
  countChirho: number;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function isStatusLocalArtifactPathChirho(valueChirho: string): boolean {
  return STATUS_LOCAL_ARTIFACT_PREFIXES_CHIRHO.some((prefixChirho) => valueChirho.startsWith(prefixChirho));
}

function assertStatusLocalArtifactLinksChirho(markdownChirho: string): void {
  const projectRootChirho = resolve(PROJECT_ROOT_CHIRHO);
  for (const matchChirho of markdownChirho.matchAll(STATUS_BACKTICK_RE_CHIRHO)) {
    const valueChirho = matchChirho[1]!;
    if (!isStatusLocalArtifactPathChirho(valueChirho)) continue;
    const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, valueChirho);
    assertGeneratedCheckChirho(
      resolvedChirho === projectRootChirho || resolvedChirho.startsWith(`${projectRootChirho}${sep}`),
      `status Markdown local artifact path escapes project root: ${valueChirho}`
    );
    assertGeneratedCheckChirho(existsSync(resolvedChirho), `status Markdown local artifact path is missing: ${valueChirho}`);
  }
}

function assertReviewStartLinksRenderedChirho(markdownChirho: string, valueChirho: unknown): void {
  assertGeneratedCheckChirho(
    valueChirho !== null && typeof valueChirho === "object" && !Array.isArray(valueChirho),
    "status JSON missing reviewStartLinksChirho object"
  );
  for (const [keyChirho, linkChirho] of Object.entries(valueChirho)) {
    if (linkChirho === null) continue;
    assertGeneratedCheckChirho(
      typeof linkChirho === "string" && linkChirho.length > 0,
      `reviewStartLinksChirho.${keyChirho} must be a URL string or null`
    );
    const urlChirho = new URL(linkChirho);
    assertGeneratedCheckChirho(urlChirho.protocol === "http:", `reviewStartLinksChirho.${keyChirho} must use http`);
    assertGeneratedCheckChirho(urlChirho.hostname === "localhost", `reviewStartLinksChirho.${keyChirho} must target localhost`);
    assertGeneratedCheckChirho(
      REVIEW_SERVER_PORTS_CHIRHO.has(Number(urlChirho.port)),
      `reviewStartLinksChirho.${keyChirho} targets unexpected port ${urlChirho.port}`
    );
    assertGeneratedCheckChirho(
      markdownChirho.includes(linkChirho),
      `status Markdown does not display review start link ${keyChirho}: ${linkChirho}`
    );
  }
}

function objectRecordChirho(valueChirho: unknown, labelChirho: string): Record<string, unknown> {
  assertGeneratedCheckChirho(
    valueChirho !== null && typeof valueChirho === "object" && !Array.isArray(valueChirho),
    `${labelChirho} must be an object`
  );
  return valueChirho as Record<string, unknown>;
}

function numberFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): number {
  const objectChirho = objectRecordChirho(valueChirho, labelChirho);
  const fieldChirho = objectChirho[keyChirho];
  assertGeneratedCheckChirho(typeof fieldChirho === "number", `${labelChirho}.${keyChirho} must be a number`);
  return fieldChirho;
}

function nullableNumberFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): number | null {
  const objectChirho = objectRecordChirho(valueChirho, labelChirho);
  const fieldChirho = objectChirho[keyChirho];
  assertGeneratedCheckChirho(
    fieldChirho === null || typeof fieldChirho === "number",
    `${labelChirho}.${keyChirho} must be a number or null`
  );
  return fieldChirho;
}

function stringFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): string {
  const objectChirho = objectRecordChirho(valueChirho, labelChirho);
  const fieldChirho = objectChirho[keyChirho];
  assertGeneratedCheckChirho(typeof fieldChirho === "string", `${labelChirho}.${keyChirho} must be a string`);
  return fieldChirho;
}

function nullableStringFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): string | null {
  const objectChirho = objectRecordChirho(valueChirho, labelChirho);
  const fieldChirho = objectChirho[keyChirho];
  assertGeneratedCheckChirho(
    fieldChirho === null || typeof fieldChirho === "string",
    `${labelChirho}.${keyChirho} must be a string or null`
  );
  return fieldChirho;
}

function booleanFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): boolean {
  const objectChirho = objectRecordChirho(valueChirho, labelChirho);
  const fieldChirho = objectChirho[keyChirho];
  assertGeneratedCheckChirho(typeof fieldChirho === "boolean", `${labelChirho}.${keyChirho} must be a boolean`);
  return fieldChirho;
}

function arrayFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): unknown[] {
  const objectChirho = objectRecordChirho(valueChirho, labelChirho);
  const fieldChirho = objectChirho[keyChirho];
  assertGeneratedCheckChirho(Array.isArray(fieldChirho), `${labelChirho}.${keyChirho} must be an array`);
  return fieldChirho;
}

function numberArrayFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): number[] {
  const fieldChirho = arrayFieldChirho(valueChirho, keyChirho, labelChirho);
  assertGeneratedCheckChirho(
    fieldChirho.every((itemChirho) => typeof itemChirho === "number"),
    `${labelChirho}.${keyChirho} must contain only numbers`
  );
  return fieldChirho as number[];
}

function stringArrayFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): string[] {
  const fieldChirho = arrayFieldChirho(valueChirho, keyChirho, labelChirho);
  assertGeneratedCheckChirho(
    fieldChirho.every((itemChirho) => typeof itemChirho === "string"),
    `${labelChirho}.${keyChirho} must contain only strings`
  );
  return fieldChirho as string[];
}

function countMapFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): Record<string, number> {
  const objectChirho = objectRecordChirho(valueChirho, labelChirho);
  const fieldChirho = objectRecordChirho(objectChirho[keyChirho], `${labelChirho}.${keyChirho}`);
  const countsChirho: Record<string, number> = {};
  for (const [countKeyChirho, countValueChirho] of Object.entries(fieldChirho)) {
    assertGeneratedCheckChirho(
      typeof countValueChirho === "number",
      `${labelChirho}.${keyChirho}.${countKeyChirho} must be a number`
    );
    countsChirho[countKeyChirho] = countValueChirho;
  }
  return countsChirho;
}

function countMapValueChirho(valueChirho: unknown, keyChirho: string, itemKeyChirho: string, labelChirho: string): number {
  return countMapFieldChirho(valueChirho, keyChirho, labelChirho)[itemKeyChirho] ?? 0;
}

function shellSingleQuoteChirho(valueChirho: string): string {
  return `'${valueChirho.normalize("NFC").replace(/'/g, "'\"'\"'")}'`;
}

function assertMarkdownContainsChirho(markdownChirho: string, expectedChirho: string, labelChirho: string): void {
  assertGeneratedCheckChirho(markdownChirho.includes(expectedChirho), `status Markdown missing ${labelChirho}: ${expectedChirho}`);
}

function assertRemainingWorkToggleChirho(
  remainingWorkChirho: string[],
  shouldExistChirho: boolean,
  exactBlockerChirho: string,
  uniqueSnippetChirho: string
): void {
  const exactExistsChirho = remainingWorkChirho.includes(exactBlockerChirho);
  if (shouldExistChirho) {
    assertGeneratedCheckChirho(exactExistsChirho, `remainingWorkChirho missing blocker: ${exactBlockerChirho}`);
    return;
  }
  assertGeneratedCheckChirho(
    !remainingWorkChirho.some((itemChirho) => itemChirho.includes(uniqueSnippetChirho)),
    `remainingWorkChirho has stale blocker matching ${uniqueSnippetChirho}`
  );
}

function displayValueChirho(valueChirho: string | number | boolean | null): string {
  return valueChirho === null ? "unknown" : String(valueChirho);
}

function countMapDisplayChirho(countsChirho: Record<string, number>): string {
  return Object.entries(countsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ") || "none";
}

function relativeProjectPathForStatusChirho(pathChirho: string): string {
  const projectRootChirho = resolve(PROJECT_ROOT_CHIRHO);
  const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, pathChirho);
  assertGeneratedCheckChirho(
    resolvedChirho === projectRootChirho || resolvedChirho.startsWith(`${projectRootChirho}${sep}`),
    `status JSON local artifact path escapes project root: ${pathChirho}`
  );
  return relative(projectRootChirho, resolvedChirho).replaceAll(sep, "/");
}

function sha256OrNullFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): string | null {
  const hashChirho = nullableStringFieldChirho(valueChirho, keyChirho, labelChirho);
  assertGeneratedCheckChirho(
    hashChirho === null || /^[a-f0-9]{64}$/.test(hashChirho),
    `${labelChirho}.${keyChirho} must be a lowercase sha256 hex digest or null`
  );
  return hashChirho;
}

function volumeLinkCountChecksChirho(
  prefixChirho: string,
  countsChirho: Record<string, number>
): ReviewStartLinkCountCheckChirho[] {
  return [1, 2, 3, 4, 5].map((volumeChirho) => {
    const volumeKeyChirho = `vol-${volumeChirho}-chirho`;
    return {
      keyChirho: `${prefixChirho}Vol${volumeChirho}Chirho`,
      countChirho: countsChirho[volumeKeyChirho] ?? 0,
    };
  });
}

function reviewStartLinkCountChecksChirho(statusChirho: CertificationStatusOutputChirho): ReviewStartLinkCountCheckChirho[] {
  const rawChirho = statusChirho.rawHebrewChirho;
  const latinChirho = statusChirho.latinSymbolVisionChirho;
  const expertChirho = statusChirho.visionTierChirho;
  return [
    {
      keyChirho: "rawHebrewAllChirho",
      countChirho: numberFieldChirho(rawChirho, "livePendingSpanCountChirho", "rawHebrewChirho"),
    },
    {
      keyChirho: "rawHebrewUnvalidatedChirho",
      countChirho: numberFieldChirho(rawChirho, "livePendingUnvalidatedSpanCountChirho", "rawHebrewChirho"),
    },
    {
      keyChirho: "rawHebrewVols35UnvalidatedChirho",
      countChirho: countMapValueChirho(
        rawChirho,
        "livePendingValidationTierCountsChirho",
        "unvalidated-chirho|primary-vols-3-5-chirho",
        "rawHebrewChirho"
      ),
    },
    {
      keyChirho: "rawHebrewVols12UnvalidatedChirho",
      countChirho: countMapValueChirho(
        rawChirho,
        "livePendingValidationTierCountsChirho",
        "unvalidated-chirho|primary-vol-2-chirho",
        "rawHebrewChirho"
      ),
    },
    {
      keyChirho: "rawHebrewPartialChirho",
      countChirho: numberFieldChirho(rawChirho, "livePendingPartialValidatedSpanCountChirho", "rawHebrewChirho"),
    },
    {
      keyChirho: "rawHebrewVols12PartialChirho",
      countChirho: countMapValueChirho(
        rawChirho,
        "livePendingValidationTierCountsChirho",
        "partial-token-validated-chirho|primary-vol-2-chirho",
        "rawHebrewChirho"
      ),
    },
    {
      keyChirho: "rawHebrewSpotCheckChirho",
      countChirho: countMapValueChirho(
        rawChirho,
        "livePendingValidationTierCountsChirho",
        "all-token-validated-chirho|spot-check-chirho",
        "rawHebrewChirho"
      ),
    },
    {
      keyChirho: "rawHebrewLowConfidenceChirho",
      countChirho: numberFieldChirho(
        objectRecordChirho(rawChirho, "rawHebrewChirho").triageChirho,
        "lowConfidenceItemCountChirho",
        "rawHebrewChirho.triageChirho"
      ),
    },
    {
      keyChirho: "rawHebrewMultiTokenChirho",
      countChirho: numberFieldChirho(
        objectRecordChirho(rawChirho, "rawHebrewChirho").triageChirho,
        "multiTokenItemCountChirho",
        "rawHebrewChirho.triageChirho"
      ),
    },
    {
      keyChirho: "rawHebrewDelimiterNotationChirho",
      countChirho: numberFieldChirho(
        objectRecordChirho(rawChirho, "rawHebrewChirho").triageChirho,
        "delimiterNotationItemCountChirho",
        "rawHebrewChirho.triageChirho"
      ),
    },
    {
      keyChirho: "rawHebrewNoDirectReadChirho",
      countChirho: numberFieldChirho(
        objectRecordChirho(rawChirho, "rawHebrewChirho").triageChirho,
        "noDirectReadItemCountChirho",
        "rawHebrewChirho.triageChirho"
      ),
    },
    ...volumeLinkCountChecksChirho(
      "rawHebrewChirho",
      countMapFieldChirho(rawChirho, "livePendingVolumeCountsChirho", "rawHebrewChirho")
    ),
    {
      keyChirho: "latinSymbolAllChirho",
      countChirho: numberFieldChirho(latinChirho, "remainingDecisionCountChirho", "latinSymbolVisionChirho"),
    },
    {
      keyChirho: "latinSymbolFrenchChirho",
      countChirho: countMapValueChirho(latinChirho, "pendingDecisionCountsChirho", "french-chirho", "latinSymbolVisionChirho"),
    },
    {
      keyChirho: "latinSymbolNonFrenchChirho",
      countChirho: countMapValueChirho(latinChirho, "pendingDecisionCountsChirho", "latin-non-french-chirho", "latinSymbolVisionChirho"),
    },
    {
      keyChirho: "latinSymbolTrivialPunctuationChirho",
      countChirho: numberFieldChirho(
        latinChirho,
        "pendingTrivialPunctuationSymbolItemCountChirho",
        "latinSymbolVisionChirho"
      ),
    },
    {
      keyChirho: "latinSymbolSiglumSymbolChirho",
      countChirho: numberFieldChirho(
        latinChirho,
        "pendingMixedScriptSymbolItemCountChirho",
        "latinSymbolVisionChirho"
      ),
    },
    {
      keyChirho: "latinSymbolNontrivialSymbolChirho",
      countChirho: numberFieldChirho(
        latinChirho,
        "pendingNontrivialSymbolItemCountChirho",
        "latinSymbolVisionChirho"
      ),
    },
    ...volumeLinkCountChecksChirho(
      "latinSymbolChirho",
      countMapFieldChirho(latinChirho, "pendingDecisionVolumeCountsChirho", "latinSymbolVisionChirho")
    ),
    {
      keyChirho: "expertAllChirho",
      countChirho: numberFieldChirho(expertChirho, "remainingConfirmationCountChirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertNonblankChirho",
      countChirho: numberFieldChirho(expertChirho, "pendingNonblankTextItemCountChirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertBlankChirho",
      countChirho: numberFieldChirho(expertChirho, "pendingBlankTextItemCountChirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertPriorityChirho",
      countChirho: numberFieldChirho(expertChirho, "pendingPriorityItemCountChirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertAppendixChirho",
      countChirho: numberFieldChirho(expertChirho, "pendingAppendixItemCountChirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertHebrewChirho",
      countChirho: countMapValueChirho(expertChirho, "pendingVisionCountsChirho", "hebrew-chirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertGreekChirho",
      countChirho: countMapValueChirho(expertChirho, "pendingVisionCountsChirho", "greek-chirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertSyriacChirho",
      countChirho: countMapValueChirho(expertChirho, "pendingVisionCountsChirho", "syriac-chirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertSyriacNonblankChirho",
      countChirho: countMapValueChirho(expertChirho, "pendingNonblankTextCountsChirho", "syriac-chirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertSyriacBlankChirho",
      countChirho: countMapValueChirho(expertChirho, "pendingBlankTextCountsChirho", "syriac-chirho", "visionTierChirho"),
    },
    {
      keyChirho: "expertArabicChirho",
      countChirho: countMapValueChirho(expertChirho, "pendingVisionCountsChirho", "arabic-chirho", "visionTierChirho"),
    },
    ...volumeLinkCountChecksChirho(
      "expertChirho",
      countMapFieldChirho(expertChirho, "pendingVolumeCountsChirho", "visionTierChirho")
    ),
  ];
}

function assertReviewStartLinkCoverageChirho(statusChirho: CertificationStatusOutputChirho): void {
  const linksChirho = objectRecordChirho(statusChirho.reviewStartLinksChirho, "reviewStartLinksChirho");
  const expectedKeysChirho = new Set<string>();
  for (const checkChirho of reviewStartLinkCountChecksChirho(statusChirho)) {
    expectedKeysChirho.add(checkChirho.keyChirho);
    const linkChirho = linksChirho[checkChirho.keyChirho];
    assertGeneratedCheckChirho(
      Object.hasOwn(linksChirho, checkChirho.keyChirho),
      `reviewStartLinksChirho missing ${checkChirho.keyChirho}`
    );
    assertGeneratedCheckChirho(checkChirho.countChirho >= 0, `${checkChirho.keyChirho} pending count must be non-negative`);
    if (checkChirho.countChirho === 0) {
      assertGeneratedCheckChirho(
        linkChirho === null,
        `reviewStartLinksChirho.${checkChirho.keyChirho} must be null when the lane has no pending work`
      );
    } else {
      assertGeneratedCheckChirho(
        typeof linkChirho === "string" && linkChirho.length > 0,
        `reviewStartLinksChirho.${checkChirho.keyChirho} must link a first pending item for ${checkChirho.countChirho} pending item(s)`
      );
    }
  }
  for (const keyChirho of Object.keys(linksChirho)) {
    assertGeneratedCheckChirho(expectedKeysChirho.has(keyChirho), `reviewStartLinksChirho has unexpected key ${keyChirho}`);
  }
}

function reattributeSingleCommandChirho(rowChirho: unknown, applyChirho: boolean): string {
  const labelChirho = "humanValidationDbChirho.genericReviewerRowDetailsChirho[]";
  const idChirho = numberFieldChirho(rowChirho, "idChirho", labelChirho);
  const liveTextChirho = nullableStringFieldChirho(rowChirho, "liveTextChirho", labelChirho);
  const commandPartsChirho = [
    "bun run reattribute-pass-c-human-validations-chirho --",
    `--validation-id-chirho=${idChirho}`,
    "--reviewer-chirho='<explicit-human-reviewer-id-chirho>'",
    "--rationale-chirho='<why this existing row is attributable to that reviewer>'",
    ...(liveTextChirho === null ? [] : [`--expected-live-text-chirho=${shellSingleQuoteChirho(liveTextChirho)}`]),
    ...(applyChirho ? ["--apply-chirho"] : []),
  ];
  return commandPartsChirho.join(" ");
}

function reattributeBatchCommandChirho(groupChirho: unknown, applyChirho: boolean): string {
  const labelChirho = "humanValidationDbChirho.genericReviewerRowGroupsChirho[]";
  const idsChirho = numberArrayFieldChirho(groupChirho, "idsChirho", labelChirho);
  const expectedHashArgsChirho = stringArrayFieldChirho(groupChirho, "expectedLiveTextHashArgsChirho", labelChirho);
  const commandPartsChirho = [
    "bun run reattribute-pass-c-human-validations-chirho --",
    ...idsChirho.map((idChirho) => `--validation-id-chirho=${idChirho}`),
    "--reviewer-chirho='<explicit-human-reviewer-id-chirho>'",
    "--rationale-chirho='<why every selected row is attributable to that reviewer>'",
    ...expectedHashArgsChirho,
    ...(applyChirho ? ["--apply-chirho"] : []),
  ];
  return commandPartsChirho.join(" ");
}

function blankExpertSuppliedCommandTemplateChirho(handoffChirho: unknown, applyChirho: boolean): string {
  const labelChirho = "structuralChirho.blankVisionTierHandoffsChirho[]";
  const idChirho = stringFieldChirho(handoffChirho, "idChirho", labelChirho);
  const expectedRoleChirho = nullableStringFieldChirho(handoffChirho, "expectedReviewerRoleChirho", labelChirho);
  const sourceShaChirho = sha256OrNullFieldChirho(handoffChirho, "sourceSha256Chirho", labelChirho);
  const packetShaChirho = sha256OrNullFieldChirho(handoffChirho, "packetSha256Chirho", labelChirho);
  const commandPartsChirho = [
    "bun run apply-expert-supplied-vision-text-chirho --",
    `--id-chirho=${shellSingleQuoteChirho(idChirho)}`,
    "--supplied-text-chirho='<exact printed text>'",
    "--reviewer-chirho='<explicit-human-reviewer-id-chirho>'",
    `--reviewer-role-chirho=${shellSingleQuoteChirho(expectedRoleChirho ?? "<expected-script-role-chirho>")}`,
    "--rationale-chirho='<why this exact text is supplied>'",
    ...(sourceShaChirho === null ? [] : [`--expected-source-sha256-chirho=${sourceShaChirho}`]),
    ...(packetShaChirho === null ? [] : [`--expected-packet-sha256-chirho=${packetShaChirho}`]),
    ...(applyChirho ? ["--apply"] : []),
  ];
  return commandPartsChirho.join(" ");
}

function assertBlankExpertHandoffPathsChirho(markdownChirho: string, handoffChirho: unknown): void {
  const labelChirho = "structuralChirho.blankVisionTierHandoffsChirho[]";
  const sourcePathChirho = nullableStringFieldChirho(handoffChirho, "sourcePathChirho", labelChirho);
  const packetPathChirho = nullableStringFieldChirho(handoffChirho, "packetPathChirho", labelChirho);
  const markdownPathChirho = nullableStringFieldChirho(handoffChirho, "markdownPathChirho", labelChirho);
  const handoffDocumentPathChirho = nullableStringFieldChirho(handoffChirho, "handoffDocumentPathChirho", labelChirho);
  const handoffCropPathChirho = nullableStringFieldChirho(handoffChirho, "handoffCropPathChirho", labelChirho);
  const sourceShaChirho = sha256OrNullFieldChirho(handoffChirho, "sourceSha256Chirho", labelChirho);
  const packetShaChirho = sha256OrNullFieldChirho(handoffChirho, "packetSha256Chirho", labelChirho);
  const cropShaChirho = sha256OrNullFieldChirho(handoffChirho, "handoffCropSha256Chirho", labelChirho);
  const documentExistsChirho = booleanFieldChirho(handoffChirho, "handoffDocumentExistsChirho", labelChirho);
  const cropExistsChirho = booleanFieldChirho(handoffChirho, "handoffCropExistsChirho", labelChirho);

  if (sourcePathChirho !== null) {
    assertGeneratedCheckChirho(existsSync(sourcePathChirho), `${labelChirho}.sourcePathChirho file is missing`);
  }
  if (packetPathChirho !== null) {
    assertGeneratedCheckChirho(existsSync(packetPathChirho), `${labelChirho}.packetPathChirho file is missing`);
  }
  if (handoffDocumentPathChirho !== null) {
    assertGeneratedCheckChirho(
      existsSync(handoffDocumentPathChirho) === documentExistsChirho,
      `${labelChirho}.handoffDocumentExistsChirho does not match filesystem`
    );
  }
  if (handoffCropPathChirho !== null) {
    assertGeneratedCheckChirho(
      existsSync(handoffCropPathChirho) === cropExistsChirho,
      `${labelChirho}.handoffCropExistsChirho does not match filesystem`
    );
  }

  assertMarkdownContainsChirho(
    markdownChirho,
    `Source scanline: \`${sourcePathChirho === null ? "missing-manifest-source-chirho" : relativeProjectPathForStatusChirho(sourcePathChirho)}\``,
    "blank expert handoff source path"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `Source scanline SHA-256: ${sourceShaChirho ?? "missing-source-hash-chirho"}`,
    "blank expert handoff source hash"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `Packet image: \`${packetPathChirho === null ? "missing-manifest-packet-chirho" : relativeProjectPathForStatusChirho(packetPathChirho)}\``,
    "blank expert handoff packet path"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `Packet image SHA-256: ${packetShaChirho ?? "missing-packet-hash-chirho"}`,
    "blank expert handoff packet hash"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `Markdown image path: \`${markdownPathChirho ?? "missing-manifest-markdown-path-chirho"}\``,
    "blank expert handoff markdown image path"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `Dedicated handoff document: \`${handoffDocumentPathChirho === null ? "missing-dedicated-handoff-document-chirho" : relativeProjectPathForStatusChirho(handoffDocumentPathChirho)}\` (present: ${documentExistsChirho})`,
    "blank expert handoff document path"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `Dedicated handoff crop: \`${handoffCropPathChirho === null ? "missing-dedicated-handoff-crop-chirho" : relativeProjectPathForStatusChirho(handoffCropPathChirho)}\` (present: ${cropExistsChirho})`,
    "blank expert handoff crop path"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `Dedicated handoff crop SHA-256: ${cropShaChirho ?? "missing-crop-hash-chirho"}`,
    "blank expert handoff crop hash"
  );
}

function assertBlankExpertHandoffCoverageChirho(markdownChirho: string, statusChirho: CertificationStatusOutputChirho): void {
  const structuralChirho = statusChirho.structuralChirho;
  const handoffsChirho = arrayFieldChirho(structuralChirho, "blankVisionTierHandoffsChirho", "structuralChirho");
  const blankIssueCountChirho = countMapValueChirho(
    structuralChirho,
    "issueCodeCountsChirho",
    "blank-span-text-chirho",
    "structuralChirho"
  );
  assertGeneratedCheckChirho(
    handoffsChirho.length === blankIssueCountChirho,
    "structuralChirho.blankVisionTierHandoffsChirho must cover every blank-span-text-chirho issue"
  );
  assertMarkdownContainsChirho(markdownChirho, "### Blank Expert Transcription Handoff", "blank expert handoff heading");
  if (handoffsChirho.length === 0) {
    assertMarkdownContainsChirho(markdownChirho, "### Blank Expert Transcription Handoff\n\n- None.", "empty blank expert handoff section");
    return;
  }
  for (const handoffChirho of handoffsChirho) {
    const labelChirho = "structuralChirho.blankVisionTierHandoffsChirho[]";
    const idChirho = stringFieldChirho(handoffChirho, "idChirho", labelChirho);
    const locationChirho = stringFieldChirho(handoffChirho, "locationChirho", labelChirho);
    const scriptChirho = nullableStringFieldChirho(handoffChirho, "scriptChirho", labelChirho);
    const expectedRoleChirho = nullableStringFieldChirho(handoffChirho, "expectedReviewerRoleChirho", labelChirho);
    const expertReviewUrlChirho = stringFieldChirho(handoffChirho, "expertReviewUrlChirho", labelChirho);
    const dryRunCommandChirho = stringFieldChirho(handoffChirho, "dryRunCommandTemplateChirho", labelChirho);
    const applyCommandChirho = stringFieldChirho(handoffChirho, "applyCommandTemplateChirho", labelChirho);
    const manifestFreshChirho = booleanFieldChirho(handoffChirho, "manifestItemFreshChirho", labelChirho);
    const documentMatchesChirho = booleanFieldChirho(handoffChirho, "handoffDocumentMatchesCurrentChirho", labelChirho);
    const missingSnippetsChirho = stringArrayFieldChirho(handoffChirho, "handoffDocumentMissingSnippetsChirho", labelChirho);
    assertGeneratedCheckChirho(
      dryRunCommandChirho === blankExpertSuppliedCommandTemplateChirho(handoffChirho, false),
      `${labelChirho}.dryRunCommandTemplateChirho does not match the handoff fields`
    );
    assertGeneratedCheckChirho(
      applyCommandChirho === blankExpertSuppliedCommandTemplateChirho(handoffChirho, true),
      `${labelChirho}.applyCommandTemplateChirho does not match the handoff fields`
    );
    const urlChirho = new URL(expertReviewUrlChirho);
    assertGeneratedCheckChirho(urlChirho.protocol === "http:", `${labelChirho}.expertReviewUrlChirho must use http`);
    assertGeneratedCheckChirho(urlChirho.hostname === "localhost", `${labelChirho}.expertReviewUrlChirho must target localhost`);
    assertGeneratedCheckChirho(urlChirho.port === "8771", `${labelChirho}.expertReviewUrlChirho must target the expert reviewer`);
    assertGeneratedCheckChirho(
      urlChirho.searchParams.get("item-chirho") === idChirho,
      `${labelChirho}.expertReviewUrlChirho must target the blank item`
    );
    assertGeneratedCheckChirho(
      scriptChirho === null || urlChirho.searchParams.get("script-chirho") === scriptChirho,
      `${labelChirho}.expertReviewUrlChirho must include the blank item script`
    );
    assertMarkdownContainsChirho(
      markdownChirho,
      `- ${idChirho} (${locationChirho}; script ${scriptChirho ?? "unknown-chirho"}; expected role ${expectedRoleChirho ?? "unknown-chirho"})`,
      `blank expert handoff ${idChirho} header`
    );
    assertMarkdownContainsChirho(markdownChirho, `Expert review URL: ${expertReviewUrlChirho}`, `blank expert handoff ${idChirho} URL`);
    assertBlankExpertHandoffPathsChirho(markdownChirho, handoffChirho);
    assertMarkdownContainsChirho(
      markdownChirho,
      `Dedicated handoff document matches current blank span: ${documentMatchesChirho}`,
      `blank expert handoff ${idChirho} document freshness`
    );
    assertMarkdownContainsChirho(
      markdownChirho,
      `Dedicated handoff missing snippet(s): ${missingSnippetsChirho.length === 0 ? "none" : missingSnippetsChirho.map((snippetChirho) => `\`${snippetChirho}\``).join("; ")}`,
      `blank expert handoff ${idChirho} missing snippets`
    );
    assertMarkdownContainsChirho(
      markdownChirho,
      `Manifest item fresh against live queue: ${manifestFreshChirho}`,
      `blank expert handoff ${idChirho} manifest freshness`
    );
    assertMarkdownContainsChirho(
      markdownChirho,
      `Expert-supplied text dry-run after exact script-reader transcription: \`${dryRunCommandChirho}\``,
      `blank expert handoff ${idChirho} dry-run command`
    );
    assertMarkdownContainsChirho(
      markdownChirho,
      `Expert-supplied text apply after dry-run verification: \`${applyCommandChirho}\``,
      `blank expert handoff ${idChirho} apply command`
    );
    assertMarkdownContainsChirho(markdownChirho, "Replace every placeholder before running", `blank expert handoff ${idChirho} placeholder warning`);
    assertMarkdownContainsChirho(
      markdownChirho,
      "Applying supplied text removes only the EMPTY-SPAN structural marker; the item remains vision-tier until explicit expert confirmation.",
      `blank expert handoff ${idChirho} no-over-cert warning`
    );
  }
}

function assertRawHebrewQueueMarkdownCoverageChirho(markdownChirho: string, statusChirho: CertificationStatusOutputChirho): void {
  const rawChirho = statusChirho.rawHebrewChirho;
  const artifactsChirho = statusChirho.artifactsChirho;
  const passCBackupChirho = statusChirho.passCHumanValidationBackupChirho;
  const triageChirho = objectRecordChirho(
    objectRecordChirho(rawChirho, "rawHebrewChirho").triageChirho,
    "rawHebrewChirho.triageChirho"
  );

  const rawReportExistsChirho = booleanFieldChirho(artifactsChirho, "rawHebrewReportExistsChirho", "artifactsChirho");
  const rawReportShapeOkChirho = booleanFieldChirho(artifactsChirho, "rawHebrewReportShapeOkChirho", "artifactsChirho");
  const rawPackExistsChirho = booleanFieldChirho(artifactsChirho, "rawHebrewPackManifestExistsChirho", "artifactsChirho");
  const rawPackShapeOkChirho = booleanFieldChirho(artifactsChirho, "rawHebrewPackManifestShapeOkChirho", "artifactsChirho");
  const backupExistsChirho = booleanFieldChirho(artifactsChirho, "passCHumanValidationBackupExistsChirho", "artifactsChirho");
  const backupShapeOkChirho = booleanFieldChirho(artifactsChirho, "passCHumanValidationBackupShapeOkChirho", "artifactsChirho");

  assertMarkdownContainsChirho(markdownChirho, "## Raw Hebrew Human Queue", "raw Hebrew queue heading");
  assertMarkdownContainsChirho(markdownChirho, `- Raw Hebrew report exists: ${rawReportExistsChirho}`, "raw Hebrew report existence");
  assertMarkdownContainsChirho(markdownChirho, `- Raw Hebrew report shape OK: ${rawReportShapeOkChirho}`, "raw Hebrew report shape");
  assertMarkdownContainsChirho(markdownChirho, `- Raw Hebrew packet manifest exists: ${rawPackExistsChirho}`, "raw Hebrew packet existence");
  assertMarkdownContainsChirho(markdownChirho, `- Raw Hebrew packet manifest shape OK: ${rawPackShapeOkChirho}`, "raw Hebrew packet shape");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Report spans: ${numberFieldChirho(rawChirho, "reportSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew report spans"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet items: ${numberFieldChirho(rawChirho, "packItemCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet items"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet generated: ${nullableStringFieldChirho(rawChirho, "packGeneratedAtChirho", "rawHebrewChirho") ?? "unknown"}`,
    "raw Hebrew packet generated"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet count matches current report: ${booleanFieldChirho(rawChirho, "packCountMatchesCurrentChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet count freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet IDs match current report: ${booleanFieldChirho(rawChirho, "packIdsMatchCurrentChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet id freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet text matches current report: ${booleanFieldChirho(rawChirho, "packTextMatchesCurrentChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet text freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet line text matches current report: ${booleanFieldChirho(rawChirho, "packLineTextMatchesCurrentChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet line text freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet image hashes match current files: ${booleanFieldChirho(rawChirho, "packImagesMatchCurrentChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet image hash freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet image hash drift items: ${numberFieldChirho(rawChirho, "packImageDriftCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet image drift count"
  );
  for (const sampleChirho of stringArrayFieldChirho(rawChirho, "packImageDriftSamplesChirho", "rawHebrewChirho")) {
    assertMarkdownContainsChirho(markdownChirho, `  - ${sampleChirho}`, `raw Hebrew packet image drift sample ${sampleChirho}`);
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet markdown image paths match hashed files: ${booleanFieldChirho(rawChirho, "packMarkdownPathsMatchCurrentChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet markdown path freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet markdown image path drift items: ${numberFieldChirho(rawChirho, "packMarkdownPathDriftCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet markdown path drift count"
  );
  for (const sampleChirho of stringArrayFieldChirho(rawChirho, "packMarkdownPathDriftSamplesChirho", "rawHebrewChirho")) {
    assertMarkdownContainsChirho(markdownChirho, `  - ${sampleChirho}`, `raw Hebrew packet markdown path drift sample ${sampleChirho}`);
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Packet validation statuses match current report: ${booleanFieldChirho(rawChirho, "packStatusMatchesCurrentChirho", "rawHebrewChirho")}`,
    "raw Hebrew packet status freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Raw report matches live span files: ${booleanFieldChirho(rawChirho, "liveReportMatchesSpanFilesChirho", "rawHebrewChirho")}`,
    "raw Hebrew report live freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Raw report live drift items: ${numberFieldChirho(rawChirho, "liveReportDriftCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew report live drift count"
  );
  for (const sampleChirho of stringArrayFieldChirho(rawChirho, "liveReportDriftSamplesChirho", "rawHebrewChirho")) {
    assertMarkdownContainsChirho(markdownChirho, `  - ${sampleChirho}`, `raw Hebrew report live drift sample ${sampleChirho}`);
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending spans: ${numberFieldChirho(rawChirho, "livePendingSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew live pending spans"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Tokens: ${numberFieldChirho(rawChirho, "reportTokenCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew token count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Unvalidated spans: ${numberFieldChirho(rawChirho, "unvalidatedSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew unvalidated count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending unvalidated spans: ${numberFieldChirho(rawChirho, "livePendingUnvalidatedSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew live pending unvalidated count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Partial spans: ${numberFieldChirho(rawChirho, "partialValidatedSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew partial count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending partial spans: ${numberFieldChirho(rawChirho, "livePendingPartialValidatedSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew live pending partial count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- All-token spot checks: ${numberFieldChirho(rawChirho, "allTokenValidatedSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew all-token spot count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending all-token spot checks: ${numberFieldChirho(rawChirho, "livePendingAllTokenValidatedSpanCountChirho", "rawHebrewChirho")}`,
    "raw Hebrew live pending spot count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Tier counts: ${countMapDisplayChirho(countMapFieldChirho(rawChirho, "tierCountsChirho", "rawHebrewChirho"))}`,
    "raw Hebrew tier counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending tier counts: ${countMapDisplayChirho(countMapFieldChirho(rawChirho, "livePendingTierCountsChirho", "rawHebrewChirho"))}`,
    "raw Hebrew live pending tier counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending validation+tier counts: ${countMapDisplayChirho(countMapFieldChirho(rawChirho, "livePendingValidationTierCountsChirho", "rawHebrewChirho"))}`,
    "raw Hebrew live pending validation tier counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Source counts before filter: ${countMapDisplayChirho(countMapFieldChirho(rawChirho, "sourceCountsChirho", "rawHebrewChirho"))}`,
    "raw Hebrew source counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Export/report count match: ${booleanFieldChirho(rawChirho, "exportPassCOcrMatchesReportChirho", "rawHebrewChirho")}`,
    "raw Hebrew export report count match"
  );

  assertMarkdownContainsChirho(markdownChirho, "### Raw Hebrew Review Triage", "raw Hebrew triage heading");
  assertMarkdownContainsChirho(
    markdownChirho,
    "This is a display-only prioritization aid from the current raw Hebrew packet.",
    "raw Hebrew triage non-certification warning"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Low-confidence direct CRNN reads (<0.75): ${numberFieldChirho(triageChirho, "lowConfidenceItemCountChirho", "rawHebrewChirho.triageChirho")}`,
    "raw Hebrew triage low-confidence count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Multi-token Hebrew spans: ${numberFieldChirho(triageChirho, "multiTokenItemCountChirho", "rawHebrewChirho.triageChirho")}`,
    "raw Hebrew triage multi-token count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Delimiter/damaged-text notation spans: ${numberFieldChirho(triageChirho, "delimiterNotationItemCountChirho", "rawHebrewChirho.triageChirho")}`,
    "raw Hebrew triage delimiter count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- No direct CRNN crop reads: ${numberFieldChirho(triageChirho, "noDirectReadItemCountChirho", "rawHebrewChirho.triageChirho")}`,
    "raw Hebrew triage no-direct-read count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Attention items with at least one flag: ${numberFieldChirho(triageChirho, "attentionItemCountChirho", "rawHebrewChirho.triageChirho")}`,
    "raw Hebrew triage attention count"
  );
  const triageNotesAvailableChirho = booleanFieldChirho(
    triageChirho,
    "preReviewNotesAvailableChirho",
    "rawHebrewChirho.triageChirho"
  );
  const triageCoveredCountChirho = numberFieldChirho(
    triageChirho,
    "preReviewCoveredAttentionItemCountChirho",
    "rawHebrewChirho.triageChirho"
  );
  const triageAttentionCountChirho = numberFieldChirho(triageChirho, "attentionItemCountChirho", "rawHebrewChirho.triageChirho");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Non-certifying pre-review note coverage: ${triageNotesAvailableChirho ? `${triageCoveredCountChirho}/${triageAttentionCountChirho} current attention item(s)` : "notes unavailable"}`,
    "raw Hebrew triage pre-review coverage"
  );
  const triageUncoveredCountChirho = numberFieldChirho(
    triageChirho,
    "preReviewUncoveredAttentionItemCountChirho",
    "rawHebrewChirho.triageChirho"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Current attention items not mentioned in the pre-review note: ${triageUncoveredCountChirho}`,
    "raw Hebrew triage uncovered count"
  );
  const triageUncoveredSamplesChirho = stringArrayFieldChirho(
    triageChirho,
    "preReviewUncoveredSamplesChirho",
    "rawHebrewChirho.triageChirho"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Pre-review uncovered attention samples: ${triageUncoveredSamplesChirho.length === 0 ? "none" : triageUncoveredSamplesChirho.join(", ")}`,
    "raw Hebrew triage uncovered samples"
  );

  assertMarkdownContainsChirho(markdownChirho, "## Pass-C Human Validation Backup", "Pass-C backup heading");
  assertMarkdownContainsChirho(markdownChirho, `- Backup exists: ${backupExistsChirho}`, "Pass-C backup existence");
  assertMarkdownContainsChirho(markdownChirho, `- Backup shape OK: ${backupShapeOkChirho}`, "Pass-C backup shape");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Local DB rows: ${numberFieldChirho(passCBackupChirho, "dbRowsChirho", "passCHumanValidationBackupChirho")}`,
    "Pass-C backup DB rows"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Backup rows: ${numberFieldChirho(passCBackupChirho, "backupRowsChirho", "passCHumanValidationBackupChirho")}`,
    "Pass-C backup rows"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Local rows missing from backup: ${numberFieldChirho(passCBackupChirho, "localRowsMissingFromBackupChirho", "passCHumanValidationBackupChirho")}`,
    "Pass-C backup missing row count"
  );
}

function assertRawHebrewQueueRemainingWorkCoverageChirho(
  statusChirho: CertificationStatusOutputChirho,
  remainingWorkChirho: string[]
): void {
  const rawChirho = statusChirho.rawHebrewChirho;
  const artifactsChirho = statusChirho.artifactsChirho;
  const passCBackupChirho = statusChirho.passCHumanValidationBackupChirho;
  const rawReportExistsChirho = booleanFieldChirho(artifactsChirho, "rawHebrewReportExistsChirho", "artifactsChirho");
  const rawReportShapeOkChirho = booleanFieldChirho(artifactsChirho, "rawHebrewReportShapeOkChirho", "artifactsChirho");
  const rawPackExistsChirho = booleanFieldChirho(artifactsChirho, "rawHebrewPackManifestExistsChirho", "artifactsChirho");
  const rawPackShapeOkChirho = booleanFieldChirho(artifactsChirho, "rawHebrewPackManifestShapeOkChirho", "artifactsChirho");
  const passCBackupExistsChirho = booleanFieldChirho(
    artifactsChirho,
    "passCHumanValidationBackupExistsChirho",
    "artifactsChirho"
  );
  const passCBackupShapeOkChirho = booleanFieldChirho(
    artifactsChirho,
    "passCHumanValidationBackupShapeOkChirho",
    "artifactsChirho"
  );
  const rawSpanCountChirho = numberFieldChirho(rawChirho, "reportSpanCountChirho", "rawHebrewChirho");
  const passCBackupDbRowsChirho = numberFieldChirho(
    passCBackupChirho,
    "dbRowsChirho",
    "passCHumanValidationBackupChirho"
  );
  const missingBackupRowsChirho = numberFieldChirho(
    passCBackupChirho,
    "localRowsMissingFromBackupChirho",
    "passCHumanValidationBackupChirho"
  );
  const rawPackExistsAndShapeOkChirho = rawSpanCountChirho !== 0 && rawPackExistsChirho && rawPackShapeOkChirho;
  const rawPackIdsMatchChirho = booleanFieldChirho(rawChirho, "packIdsMatchCurrentChirho", "rawHebrewChirho");

  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !rawReportExistsChirho,
    "raw Hebrew validation report is missing; run validate-pass-c-hebrew-chirho --all",
    "raw Hebrew validation report is missing"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawSpanCountChirho !== 0 && !rawPackExistsChirho,
    "raw Hebrew human review packet is missing; run make-pass-c-hebrew-human-pack-chirho",
    "raw Hebrew human review packet is missing"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawReportExistsChirho && !rawReportShapeOkChirho,
    "raw Hebrew validation report is malformed; regenerate validate-pass-c-hebrew-chirho --all",
    "raw Hebrew validation report is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsChirho && !rawPackShapeOkChirho,
    "raw Hebrew human review packet is malformed; regenerate make-pass-c-hebrew-human-pack-chirho",
    "raw Hebrew human review packet is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    passCBackupExistsChirho && !passCBackupShapeOkChirho,
    "Pass-C human validation backup is malformed; regenerate backup-pass-c-human-validations-chirho",
    "Pass-C human validation backup is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(rawChirho, "liveReportDriftCountChirho", "rawHebrewChirho") !== 0,
    `${numberFieldChirho(rawChirho, "liveReportDriftCountChirho", "rawHebrewChirho")} raw Hebrew validation report item(s) do not match live span files; regenerate validate-pass-c-hebrew-chirho --all and make-pass-c-hebrew-human-pack-chirho`,
    "raw Hebrew validation report item(s) do not match live span files"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsAndShapeOkChirho && !booleanFieldChirho(rawChirho, "packCountMatchesCurrentChirho", "rawHebrewChirho"),
    "raw Hebrew human review packet count does not match current report; regenerate make-pass-c-hebrew-human-pack-chirho",
    "raw Hebrew human review packet count does not match current report"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsAndShapeOkChirho &&
      booleanFieldChirho(rawChirho, "packCountMatchesCurrentChirho", "rawHebrewChirho") &&
      !rawPackIdsMatchChirho,
    "raw Hebrew human review packet item IDs do not match current report; regenerate make-pass-c-hebrew-human-pack-chirho",
    "raw Hebrew human review packet item IDs do not match current report"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsAndShapeOkChirho &&
      rawPackIdsMatchChirho &&
      !booleanFieldChirho(rawChirho, "packTextMatchesCurrentChirho", "rawHebrewChirho"),
    "raw Hebrew human review packet text does not match current report; regenerate make-pass-c-hebrew-human-pack-chirho",
    "raw Hebrew human review packet text does not match current report"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsAndShapeOkChirho &&
      rawPackIdsMatchChirho &&
      !booleanFieldChirho(rawChirho, "packLineTextMatchesCurrentChirho", "rawHebrewChirho"),
    "raw Hebrew human review packet line text does not match current report; regenerate make-pass-c-hebrew-human-pack-chirho",
    "raw Hebrew human review packet line text does not match current report"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsAndShapeOkChirho && numberFieldChirho(rawChirho, "packImageDriftCountChirho", "rawHebrewChirho") !== 0,
    `${numberFieldChirho(rawChirho, "packImageDriftCountChirho", "rawHebrewChirho")} raw Hebrew human review packet image hash drift(s); regenerate make-pass-c-hebrew-human-pack-chirho`,
    "raw Hebrew human review packet image hash drift(s)"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsAndShapeOkChirho &&
      numberFieldChirho(rawChirho, "packMarkdownPathDriftCountChirho", "rawHebrewChirho") !== 0,
    `${numberFieldChirho(rawChirho, "packMarkdownPathDriftCountChirho", "rawHebrewChirho")} raw Hebrew human review packet markdown image path drift(s); regenerate make-pass-c-hebrew-human-pack-chirho`,
    "raw Hebrew human review packet markdown image path drift(s)"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    rawPackExistsAndShapeOkChirho &&
      rawPackIdsMatchChirho &&
      !booleanFieldChirho(rawChirho, "packStatusMatchesCurrentChirho", "rawHebrewChirho"),
    "raw Hebrew human review packet validation statuses do not match current report; regenerate make-pass-c-hebrew-human-pack-chirho",
    "raw Hebrew human review packet validation statuses do not match current report"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !booleanFieldChirho(rawChirho, "exportPassCOcrMatchesReportChirho", "rawHebrewChirho"),
    "raw Hebrew validation report count does not match the latest export report; regenerate validation artifacts",
    "raw Hebrew validation report count does not match the latest export report"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    passCBackupDbRowsChirho !== 0 && !passCBackupExistsChirho,
    "Pass-C human validation backup is missing; run backup-pass-c-human-validations-chirho",
    "Pass-C human validation backup is missing"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    missingBackupRowsChirho !== 0,
    `${missingBackupRowsChirho} local Pass-C human validation row(s) need backup before certification can complete on a fresh checkout`,
    "local Pass-C human validation row(s) need backup before certification can complete on a fresh checkout"
  );
}

function assertVisionTierExpertQueueMarkdownCoverageChirho(
  markdownChirho: string,
  statusChirho: CertificationStatusOutputChirho
): void {
  const expertChirho = statusChirho.visionTierChirho;
  const artifactsChirho = statusChirho.artifactsChirho;
  const suppliedBackupChirho = statusChirho.expertSuppliedVisionTextBackupChirho;
  const confirmationPolicyChirho = statusChirho.visionTierExpertConfirmationPolicyChirho;
  const expertManifestExistsChirho = booleanFieldChirho(artifactsChirho, "expertPackManifestExistsChirho", "artifactsChirho");
  const expertManifestShapeOkChirho = booleanFieldChirho(artifactsChirho, "expertPackManifestShapeOkChirho", "artifactsChirho");
  const suppliedBackupExistsChirho = booleanFieldChirho(
    artifactsChirho,
    "expertSuppliedVisionTextBackupExistsChirho",
    "artifactsChirho"
  );
  const suppliedBackupShapeOkChirho = booleanFieldChirho(
    artifactsChirho,
    "expertSuppliedVisionTextBackupShapeOkChirho",
    "artifactsChirho"
  );

  assertMarkdownContainsChirho(markdownChirho, "## Vision-Tier Expert Queue", "expert queue heading");
  assertMarkdownContainsChirho(markdownChirho, `- Expert manifest exists: ${expertManifestExistsChirho}`, "expert manifest existence");
  assertMarkdownContainsChirho(markdownChirho, `- Expert manifest shape OK: ${expertManifestShapeOkChirho}`, "expert manifest shape");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- D1 scan error: ${nullableStringFieldChirho(expertChirho, "d1ReadErrorChirho", "visionTierChirho") ?? "none"}`,
    "expert queue D1 scan error"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Priority items: ${numberFieldChirho(expertChirho, "priorityItemCountChirho", "visionTierChirho")}`,
    "expert priority count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Complete vision-tier items: ${numberFieldChirho(expertChirho, "completeVisionItemCountChirho", "visionTierChirho")}`,
    "expert complete item count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Counts: ${countMapDisplayChirho(countMapFieldChirho(expertChirho, "completeVisionCountsChirho", "visionTierChirho"))}`,
    "expert complete counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live vision-tier items: ${numberFieldChirho(expertChirho, "liveVisionItemCountChirho", "visionTierChirho")}`,
    "expert live item count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live counts: ${countMapDisplayChirho(countMapFieldChirho(expertChirho, "liveVisionCountsChirho", "visionTierChirho"))}`,
    "expert live counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending items: ${numberFieldChirho(expertChirho, "pendingVisionItemCountChirho", "visionTierChirho")}`,
    "expert pending item count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending text states: nonblank-chirho=${numberFieldChirho(expertChirho, "pendingNonblankTextItemCountChirho", "visionTierChirho")}, blank-chirho=${numberFieldChirho(expertChirho, "pendingBlankTextItemCountChirho", "visionTierChirho")}`,
    "expert pending text states"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending nonblank counts: ${countMapDisplayChirho(countMapFieldChirho(expertChirho, "pendingNonblankTextCountsChirho", "visionTierChirho"))}`,
    "expert pending nonblank counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending blank counts: ${countMapDisplayChirho(countMapFieldChirho(expertChirho, "pendingBlankTextCountsChirho", "visionTierChirho"))}`,
    "expert pending blank counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending counts: ${countMapDisplayChirho(countMapFieldChirho(expertChirho, "pendingVisionCountsChirho", "visionTierChirho"))}`,
    "expert pending counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Manifest count matches current state: ${booleanFieldChirho(expertChirho, "manifestCountMatchesCurrentChirho", "visionTierChirho")}`,
    "expert manifest count freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Manifest IDs match current state: ${booleanFieldChirho(expertChirho, "manifestIdsMatchCurrentChirho", "visionTierChirho")}`,
    "expert manifest ID freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Manifest text matches current state: ${booleanFieldChirho(expertChirho, "manifestTextMatchesCurrentChirho", "visionTierChirho")}`,
    "expert manifest text freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Manifest images match source scanlines: ${booleanFieldChirho(expertChirho, "manifestImagesMatchCurrentChirho", "visionTierChirho")}`,
    "expert manifest image freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Manifest image drift items: ${numberFieldChirho(expertChirho, "manifestImageDriftCountChirho", "visionTierChirho")}`,
    "expert manifest image drift count"
  );
  for (const sampleChirho of stringArrayFieldChirho(expertChirho, "manifestImageDriftSamplesChirho", "visionTierChirho")) {
    assertMarkdownContainsChirho(markdownChirho, `  - ${sampleChirho}`, `expert manifest image drift sample ${sampleChirho}`);
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Manifest markdown image paths match packet files: ${booleanFieldChirho(expertChirho, "manifestMarkdownPathsMatchCurrentChirho", "visionTierChirho")}`,
    "expert manifest markdown path freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Manifest markdown image path drift items: ${numberFieldChirho(expertChirho, "manifestMarkdownPathDriftCountChirho", "visionTierChirho")}`,
    "expert manifest markdown path drift count"
  );
  for (const sampleChirho of stringArrayFieldChirho(expertChirho, "manifestMarkdownPathDriftSamplesChirho", "visionTierChirho")) {
    assertMarkdownContainsChirho(markdownChirho, `  - ${sampleChirho}`, `expert manifest markdown path drift sample ${sampleChirho}`);
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Confirmed by explicit policy: ${numberFieldChirho(expertChirho, "confirmedByPolicyCountChirho", "visionTierChirho")}`,
    "expert confirmed policy count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Reviewed issues by explicit policy: ${numberFieldChirho(expertChirho, "reviewedIssueByPolicyCountChirho", "visionTierChirho")}`,
    "expert reviewed-issue policy count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Remaining confirmations: ${numberFieldChirho(expertChirho, "remainingConfirmationCountChirho", "visionTierChirho")}`,
    "expert remaining confirmations"
  );

  assertMarkdownContainsChirho(markdownChirho, "## Expert-Supplied Vision Text Backup", "expert-supplied backup heading");
  assertMarkdownContainsChirho(markdownChirho, `- Backup exists: ${suppliedBackupExistsChirho}`, "expert-supplied backup existence");
  assertMarkdownContainsChirho(markdownChirho, `- Backup shape OK: ${suppliedBackupShapeOkChirho}`, "expert-supplied backup shape");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Backup records: ${numberFieldChirho(suppliedBackupChirho, "backupRecordsChirho", "expertSuppliedVisionTextBackupChirho")}`,
    "expert-supplied backup record count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live supplied-text spans: ${numberFieldChirho(suppliedBackupChirho, "liveAppliedSpansChirho", "expertSuppliedVisionTextBackupChirho")}`,
    "expert-supplied live applied count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Duplicate backup records: ${numberFieldChirho(suppliedBackupChirho, "duplicateBackupRecordCountChirho", "expertSuppliedVisionTextBackupChirho")}`,
    "expert-supplied duplicate count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Backup records missing live span: ${numberFieldChirho(suppliedBackupChirho, "backupRecordsMissingLiveSpanChirho", "expertSuppliedVisionTextBackupChirho")}`,
    "expert-supplied backup missing live count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live supplied-text spans missing backup: ${numberFieldChirho(suppliedBackupChirho, "liveAppliedSpansMissingBackupChirho", "expertSuppliedVisionTextBackupChirho")}`,
    "expert-supplied live missing backup count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Stale backup records: ${numberFieldChirho(suppliedBackupChirho, "staleBackupRecordCountChirho", "expertSuppliedVisionTextBackupChirho")}`,
    "expert-supplied stale count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Attribution-blocked reviewer records: ${numberFieldChirho(suppliedBackupChirho, "genericReviewerRecordCountChirho", "expertSuppliedVisionTextBackupChirho")}`,
    "expert-supplied generic reviewer count"
  );
  const suppliedShapeErrorsChirho = stringArrayFieldChirho(
    suppliedBackupChirho,
    "shapeErrorsChirho",
    "expertSuppliedVisionTextBackupChirho"
  );
  const suppliedDriftSamplesChirho = stringArrayFieldChirho(
    suppliedBackupChirho,
    "driftSamplesChirho",
    "expertSuppliedVisionTextBackupChirho"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Shape errors: ${suppliedShapeErrorsChirho.length === 0 ? "none" : suppliedShapeErrorsChirho.join("; ")}`,
    "expert-supplied shape errors"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Drift samples: ${suppliedDriftSamplesChirho.length === 0 ? "none" : suppliedDriftSamplesChirho.join("; ")}`,
    "expert-supplied drift samples"
  );

  assertMarkdownContainsChirho(markdownChirho, "## Vision-Tier Expert Confirmation Policy", "expert confirmation policy heading");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Policy exists: ${booleanFieldChirho(confirmationPolicyChirho, "policyFileExistsChirho", "visionTierExpertConfirmationPolicyChirho")}`,
    "expert confirmation policy existence"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Policy shape OK: ${booleanFieldChirho(confirmationPolicyChirho, "policyFileShapeOkChirho", "visionTierExpertConfirmationPolicyChirho")}`,
    "expert confirmation policy shape"
  );
  for (const [fieldChirho, labelChirho] of [
    ["confirmedPolicyCountChirho", "Confirmed policies"],
    ["confirmedPolicyItemCountChirho", "Confirmed policy items"],
    ["validConfirmedPolicyItemCountChirho", "Valid confirmed policy items"],
    ["staleConfirmedPolicyItemCountChirho", "Stale confirmed policy items"],
    ["duplicateConfirmedPolicyItemCountChirho", "Duplicate confirmed policy items"],
    ["issueOverriddenConfirmedPolicyItemCountChirho", "Confirmed policy items overridden by open issues"],
    ["reviewedIssuePolicyCountChirho", "Reviewed-issue policies"],
    ["reviewedIssuePolicyItemCountChirho", "Reviewed-issue policy items"],
    ["validReviewedIssuePolicyItemCountChirho", "Valid reviewed-issue policy items"],
    ["staleReviewedIssuePolicyItemCountChirho", "Stale reviewed-issue policy items"],
    ["duplicateReviewedIssuePolicyItemCountChirho", "Duplicate reviewed-issue policy items"],
  ] as const) {
    assertMarkdownContainsChirho(
      markdownChirho,
      `- ${labelChirho}: ${numberFieldChirho(confirmationPolicyChirho, fieldChirho, "visionTierExpertConfirmationPolicyChirho")}`,
      `expert confirmation policy ${fieldChirho}`
    );
  }
  const policyShapeErrorsChirho = stringArrayFieldChirho(
    confirmationPolicyChirho,
    "shapeErrorsChirho",
    "visionTierExpertConfirmationPolicyChirho"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Shape errors: ${policyShapeErrorsChirho.length === 0 ? "none" : policyShapeErrorsChirho.join("; ")}`,
    "expert confirmation policy shape errors"
  );
}

function assertVisionTierExpertQueueRemainingWorkCoverageChirho(
  statusChirho: CertificationStatusOutputChirho,
  remainingWorkChirho: string[]
): void {
  const expertChirho = statusChirho.visionTierChirho;
  const artifactsChirho = statusChirho.artifactsChirho;
  const suppliedBackupChirho = statusChirho.expertSuppliedVisionTextBackupChirho;
  const confirmationPolicyChirho = statusChirho.visionTierExpertConfirmationPolicyChirho;
  const expertManifestExistsChirho = booleanFieldChirho(artifactsChirho, "expertPackManifestExistsChirho", "artifactsChirho");
  const expertManifestShapeOkChirho = booleanFieldChirho(artifactsChirho, "expertPackManifestShapeOkChirho", "artifactsChirho");
  const suppliedBackupExistsChirho = booleanFieldChirho(
    artifactsChirho,
    "expertSuppliedVisionTextBackupExistsChirho",
    "artifactsChirho"
  );
  const suppliedBackupShapeOkChirho = booleanFieldChirho(
    artifactsChirho,
    "expertSuppliedVisionTextBackupShapeOkChirho",
    "artifactsChirho"
  );
  const confirmationPolicyExistsChirho = booleanFieldChirho(
    confirmationPolicyChirho,
    "policyFileExistsChirho",
    "visionTierExpertConfirmationPolicyChirho"
  );
  const confirmationPolicyShapeOkChirho = booleanFieldChirho(
    confirmationPolicyChirho,
    "policyFileShapeOkChirho",
    "visionTierExpertConfirmationPolicyChirho"
  );
  const d1ReadErrorChirho = nullableStringFieldChirho(expertChirho, "d1ReadErrorChirho", "visionTierChirho");
  const manifestCountMatchesChirho = booleanFieldChirho(expertChirho, "manifestCountMatchesCurrentChirho", "visionTierChirho");
  const manifestIdsMatchChirho = booleanFieldChirho(expertChirho, "manifestIdsMatchCurrentChirho", "visionTierChirho");

  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !expertManifestExistsChirho,
    "expert confirmation manifest is missing; run make-expert-confirm-pack-chirho",
    "expert confirmation manifest is missing"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    expertManifestExistsChirho && !expertManifestShapeOkChirho,
    "expert confirmation manifest is malformed; regenerate make-expert-confirm-pack-chirho",
    "expert confirmation manifest is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    suppliedBackupExistsChirho && !suppliedBackupShapeOkChirho,
    "expert-supplied vision text backup is malformed; fix or rerun apply-expert-supplied-vision-text-chirho for the affected item",
    "expert-supplied vision text backup is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    confirmationPolicyExistsChirho && !confirmationPolicyShapeOkChirho,
    "vision-tier expert confirmation policy is malformed; fix or regenerate prepare-vision-tier-expert-confirmation-policy-chirho",
    "vision-tier expert confirmation policy is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho !== null,
    `D1-derived vision-tier expert item scan failed: ${d1ReadErrorChirho}`,
    "D1-derived vision-tier expert item scan failed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho === null && expertManifestExistsChirho && expertManifestShapeOkChirho && !manifestCountMatchesChirho,
    "expert confirmation manifest count does not match current vision-tier span/D1 state; regenerate make-expert-confirm-pack-chirho",
    "expert confirmation manifest count does not match current vision-tier span/D1 state"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho === null &&
      expertManifestExistsChirho &&
      expertManifestShapeOkChirho &&
      manifestCountMatchesChirho &&
      !manifestIdsMatchChirho,
    "expert confirmation manifest item IDs do not match current vision-tier span/D1 state; regenerate make-expert-confirm-pack-chirho",
    "expert confirmation manifest item IDs do not match current vision-tier span/D1 state"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho === null &&
      expertManifestExistsChirho &&
      expertManifestShapeOkChirho &&
      manifestIdsMatchChirho &&
      !booleanFieldChirho(expertChirho, "manifestTextMatchesCurrentChirho", "visionTierChirho"),
    "expert confirmation manifest text does not match current live vision-tier span text; regenerate make-expert-confirm-pack-chirho",
    "expert confirmation manifest text does not match current live vision-tier span text"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    expertManifestExistsChirho &&
      expertManifestShapeOkChirho &&
      numberFieldChirho(expertChirho, "manifestImageDriftCountChirho", "visionTierChirho") !== 0,
    `${numberFieldChirho(expertChirho, "manifestImageDriftCountChirho", "visionTierChirho")} expert confirmation packet image(s) do not match source scanline images; regenerate make-expert-confirm-pack-chirho`,
    "expert confirmation packet image(s) do not match source scanline images"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    expertManifestExistsChirho &&
      expertManifestShapeOkChirho &&
      numberFieldChirho(expertChirho, "manifestMarkdownPathDriftCountChirho", "visionTierChirho") !== 0,
    `${numberFieldChirho(expertChirho, "manifestMarkdownPathDriftCountChirho", "visionTierChirho")} expert confirmation packet markdown image path drift(s); regenerate make-expert-confirm-pack-chirho`,
    "expert confirmation packet markdown image path drift(s)"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(suppliedBackupChirho, "liveAppliedSpansChirho", "expertSuppliedVisionTextBackupChirho") !== 0 &&
      !suppliedBackupExistsChirho,
    "expert-supplied vision text backup is missing for live supplied-text span(s); rerun apply-expert-supplied-vision-text-chirho or restore the backup",
    "expert-supplied vision text backup is missing for live supplied-text span(s)"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    suppliedBackupShapeOkChirho &&
      numberFieldChirho(suppliedBackupChirho, "duplicateBackupRecordCountChirho", "expertSuppliedVisionTextBackupChirho") !== 0,
    `${numberFieldChirho(suppliedBackupChirho, "duplicateBackupRecordCountChirho", "expertSuppliedVisionTextBackupChirho")} duplicate expert-supplied vision text backup record(s) need cleanup`,
    "duplicate expert-supplied vision text backup record(s) need cleanup"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    suppliedBackupShapeOkChirho &&
      numberFieldChirho(suppliedBackupChirho, "backupRecordsMissingLiveSpanChirho", "expertSuppliedVisionTextBackupChirho") !== 0,
    `${numberFieldChirho(suppliedBackupChirho, "backupRecordsMissingLiveSpanChirho", "expertSuppliedVisionTextBackupChirho")} expert-supplied vision text backup record(s) no longer match a live supplied-text span`,
    "expert-supplied vision text backup record(s) no longer match a live supplied-text span"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    suppliedBackupShapeOkChirho &&
      numberFieldChirho(suppliedBackupChirho, "liveAppliedSpansMissingBackupChirho", "expertSuppliedVisionTextBackupChirho") !== 0,
    `${numberFieldChirho(suppliedBackupChirho, "liveAppliedSpansMissingBackupChirho", "expertSuppliedVisionTextBackupChirho")} live expert-supplied vision text span(s) are missing from the backup`,
    "live expert-supplied vision text span(s) are missing from the backup"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    suppliedBackupShapeOkChirho &&
      numberFieldChirho(suppliedBackupChirho, "staleBackupRecordCountChirho", "expertSuppliedVisionTextBackupChirho") !== 0,
    `${numberFieldChirho(suppliedBackupChirho, "staleBackupRecordCountChirho", "expertSuppliedVisionTextBackupChirho")} expert-supplied vision text backup record(s) are stale against live span/manifest state`,
    "expert-supplied vision text backup record(s) are stale against live span/manifest state"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(confirmationPolicyChirho, "staleConfirmedPolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho") !== 0,
    `${numberFieldChirho(confirmationPolicyChirho, "staleConfirmedPolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho")} vision-tier expert confirmation item(s) are stale against current live span text`,
    "vision-tier expert confirmation item(s) are stale against current live span text"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(confirmationPolicyChirho, "duplicateConfirmedPolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho") !== 0,
    `${numberFieldChirho(confirmationPolicyChirho, "duplicateConfirmedPolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho")} duplicate vision-tier expert confirmation item(s) need cleanup`,
    "duplicate vision-tier expert confirmation item(s) need cleanup"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(confirmationPolicyChirho, "issueOverriddenConfirmedPolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho") !== 0,
    `${numberFieldChirho(confirmationPolicyChirho, "issueOverriddenConfirmedPolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho")} vision-tier expert confirmation item(s) are overridden by open expert issue record(s)`,
    "vision-tier expert confirmation item(s) are overridden by open expert issue record(s)"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(confirmationPolicyChirho, "staleReviewedIssuePolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho") !== 0,
    `${numberFieldChirho(confirmationPolicyChirho, "staleReviewedIssuePolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho")} vision-tier expert issue record item(s) are stale against current live span text`,
    "vision-tier expert issue record item(s) are stale against current live span text"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(confirmationPolicyChirho, "duplicateReviewedIssuePolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho") !== 0,
    `${numberFieldChirho(confirmationPolicyChirho, "duplicateReviewedIssuePolicyItemCountChirho", "visionTierExpertConfirmationPolicyChirho")} duplicate vision-tier expert issue record item(s) need cleanup`,
    "duplicate vision-tier expert issue record item(s) need cleanup"
  );
}

function assertLatinSymbolQueueMarkdownCoverageChirho(
  markdownChirho: string,
  statusChirho: CertificationStatusOutputChirho
): void {
  const latinChirho = statusChirho.latinSymbolVisionChirho;
  const artifactsChirho = statusChirho.artifactsChirho;
  const reviewDbChirho = statusChirho.latinSymbolReviewDbChirho;
  const reviewBackupChirho = statusChirho.latinSymbolReviewBackupChirho;
  const policyChirho = statusChirho.latinSymbolAcceptancePolicyChirho;
  const symbolRiskChirho = objectRecordChirho(
    objectRecordChirho(latinChirho, "latinSymbolVisionChirho").symbolRiskSummaryChirho,
    "latinSymbolVisionChirho.symbolRiskSummaryChirho"
  );
  const packetExistsChirho = booleanFieldChirho(artifactsChirho, "latinSymbolPackManifestExistsChirho", "artifactsChirho");
  const packetShapeOkChirho = booleanFieldChirho(artifactsChirho, "latinSymbolPackManifestShapeOkChirho", "artifactsChirho");
  const reviewBackupExistsChirho = booleanFieldChirho(artifactsChirho, "latinSymbolReviewBackupExistsChirho", "artifactsChirho");
  const reviewBackupShapeOkChirho = booleanFieldChirho(artifactsChirho, "latinSymbolReviewBackupShapeOkChirho", "artifactsChirho");

  assertMarkdownContainsChirho(markdownChirho, "## Latin/Symbol Vision Scope", "Latin/symbol scope heading");
  assertMarkdownContainsChirho(
    markdownChirho,
    "These spans are not in the non-Latin expert pack, but they still matter for a project-wide flawless-transcription claim.",
    "Latin/symbol scope warning"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Included in completion gate: ${booleanFieldChirho(latinChirho, "includedInCompletionGateChirho", "latinSymbolVisionChirho")}`,
    "Latin/symbol completion-gate inclusion"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- D1 scan error: ${nullableStringFieldChirho(latinChirho, "d1ReadErrorChirho", "latinSymbolVisionChirho") ?? "none"}`,
    "Latin/symbol D1 scan error"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Explicit vision-tier Latin/symbol items: ${numberFieldChirho(latinChirho, "explicitVisionItemCountChirho", "latinSymbolVisionChirho")}`,
    "Latin/symbol explicit item count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Counts: ${countMapDisplayChirho(countMapFieldChirho(latinChirho, "explicitVisionCountsChirho", "latinSymbolVisionChirho"))}`,
    "Latin/symbol explicit counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- D1-derived Latin/symbol vision words: ${numberFieldChirho(latinChirho, "d1DerivedVisionWordCountChirho", "latinSymbolVisionChirho")}`,
    "Latin/symbol D1-derived count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- D1-derived counts: ${countMapDisplayChirho(countMapFieldChirho(latinChirho, "d1DerivedVisionCountsChirho", "latinSymbolVisionChirho"))}`,
    "Latin/symbol D1-derived counts"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Symbol items total: ${numberFieldChirho(symbolRiskChirho, "totalSymbolItemsChirho", "latinSymbolVisionChirho.symbolRiskSummaryChirho")}`,
    "Latin/symbol symbol total"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Symbol items safe-symbols-only: ${numberFieldChirho(symbolRiskChirho, "trivialPunctuationSymbolItemsChirho", "latinSymbolVisionChirho.symbolRiskSummaryChirho")}`,
    "Latin/symbol trivial symbol count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Symbol items requiring review/override: ${numberFieldChirho(symbolRiskChirho, "nontrivialSymbolItemsChirho", "latinSymbolVisionChirho.symbolRiskSummaryChirho")}`,
    "Latin/symbol nontrivial symbol count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Symbol items containing script letters/sigla: ${numberFieldChirho(symbolRiskChirho, "mixedScriptSymbolItemsChirho", "latinSymbolVisionChirho.symbolRiskSummaryChirho")}`,
    "Latin/symbol mixed script symbol count"
  );
  assertMarkdownContainsChirho(markdownChirho, `- Review packet exists: ${packetExistsChirho}`, "Latin/symbol packet existence");
  assertMarkdownContainsChirho(markdownChirho, `- Review packet shape OK: ${packetShapeOkChirho}`, "Latin/symbol packet shape");
  for (const [fieldChirho, labelChirho] of [
    ["reviewPacketItemCountChirho", "Review packet items"],
    ["reviewedCleanCountChirho", "Accepted-clean reviews"],
    ["reviewedIssueCountChirho", "Reviewed-issues rows"],
    ["acceptedByPolicyCountChirho", "Accepted by explicit policy"],
    ["totalAcceptedDecisionCountChirho", "Total accepted decisions"],
    ["issueOverriddenAcceptedDecisionCountChirho", "Accepted decisions overridden by open issues"],
    ["staleReviewCountChirho", "Stale review rows"],
    ["pendingDecisionCountChirho", "Live pending decisions"],
    ["remainingDecisionCountChirho", "Remaining decisions"],
  ] as const) {
    assertMarkdownContainsChirho(
      markdownChirho,
      `- ${labelChirho}: ${numberFieldChirho(latinChirho, fieldChirho, "latinSymbolVisionChirho")}`,
      `Latin/symbol ${fieldChirho}`
    );
  }
  for (const [fieldChirho, labelChirho] of [
    ["reviewPacketCountMatchesCurrentChirho", "Review packet count matches current state"],
    ["reviewPacketIdsMatchCurrentChirho", "Review packet IDs match current state"],
    ["reviewPacketTextMatchesCurrentChirho", "Review packet text matches current state"],
    ["reviewPacketLineTextMatchesCurrentChirho", "Review packet line text matches current state"],
    ["reviewPacketImagesMatchCurrentChirho", "Review packet image hashes match current files"],
  ] as const) {
    assertMarkdownContainsChirho(
      markdownChirho,
      `- ${labelChirho}: ${booleanFieldChirho(latinChirho, fieldChirho, "latinSymbolVisionChirho")}`,
      `Latin/symbol ${fieldChirho}`
    );
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Review packet image hash drift items: ${numberFieldChirho(latinChirho, "reviewPacketImageDriftCountChirho", "latinSymbolVisionChirho")}`,
    "Latin/symbol packet image drift count"
  );
  for (const sampleChirho of stringArrayFieldChirho(latinChirho, "reviewPacketImageDriftSamplesChirho", "latinSymbolVisionChirho")) {
    assertMarkdownContainsChirho(markdownChirho, `  - ${sampleChirho}`, `Latin/symbol packet image drift sample ${sampleChirho}`);
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Review packet markdown image paths match hashed files: ${booleanFieldChirho(latinChirho, "reviewPacketMarkdownPathsMatchCurrentChirho", "latinSymbolVisionChirho")}`,
    "Latin/symbol packet markdown path freshness"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Review packet markdown image path drift items: ${numberFieldChirho(latinChirho, "reviewPacketMarkdownPathDriftCountChirho", "latinSymbolVisionChirho")}`,
    "Latin/symbol packet markdown path drift count"
  );
  for (const sampleChirho of stringArrayFieldChirho(latinChirho, "reviewPacketMarkdownPathDriftSamplesChirho", "latinSymbolVisionChirho")) {
    assertMarkdownContainsChirho(markdownChirho, `  - ${sampleChirho}`, `Latin/symbol packet markdown path drift sample ${sampleChirho}`);
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Live pending counts: ${countMapDisplayChirho(countMapFieldChirho(latinChirho, "pendingDecisionCountsChirho", "latinSymbolVisionChirho"))}`,
    "Latin/symbol pending counts"
  );

  assertMarkdownContainsChirho(markdownChirho, "## Latin/Symbol Review Store", "Latin/symbol review store heading");
  assertMarkdownContainsChirho(markdownChirho, `- Backup exists: ${reviewBackupExistsChirho}`, "Latin/symbol review backup existence");
  assertMarkdownContainsChirho(markdownChirho, `- Backup shape OK: ${reviewBackupShapeOkChirho}`, "Latin/symbol review backup shape");
  for (const [objectChirho, objectLabelChirho, fieldChirho, labelChirho] of [
    [reviewDbChirho, "latinSymbolReviewDbChirho", "currentRowsChirho", "Current merged rows"],
    [reviewBackupChirho, "latinSymbolReviewBackupChirho", "dbRowsChirho", "Local DB rows"],
    [reviewBackupChirho, "latinSymbolReviewBackupChirho", "backupRowsChirho", "Backup rows"],
    [reviewBackupChirho, "latinSymbolReviewBackupChirho", "localRowsMissingFromBackupChirho", "Local rows missing from backup"],
    [reviewDbChirho, "latinSymbolReviewDbChirho", "validReviewedCleanRowsChirho", "Valid accepted-clean rows"],
    [reviewDbChirho, "latinSymbolReviewDbChirho", "validReviewedIssueRowsChirho", "Valid reviewed-issues rows"],
    [reviewDbChirho, "latinSymbolReviewDbChirho", "invalidReviewRowsChirho", "Invalid review rows"],
    [reviewDbChirho, "latinSymbolReviewDbChirho", "staleRowsChirho", "Stale rows"],
    [reviewDbChirho, "latinSymbolReviewDbChirho", "appliedRowsChirho", "Applied rows"],
    [reviewDbChirho, "latinSymbolReviewDbChirho", "genericReviewerRowsChirho", "Attribution-blocked reviewer rows"],
  ] as const) {
    assertMarkdownContainsChirho(
      markdownChirho,
      `- ${labelChirho}: ${numberFieldChirho(objectChirho, fieldChirho, objectLabelChirho)}`,
      `Latin/symbol review store ${fieldChirho}`
    );
  }

  assertMarkdownContainsChirho(markdownChirho, "## Latin/Symbol Acceptance Policy", "Latin/symbol acceptance policy heading");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Policy exists: ${booleanFieldChirho(policyChirho, "policyFileExistsChirho", "latinSymbolAcceptancePolicyChirho")}`,
    "Latin/symbol acceptance policy existence"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Policy shape OK: ${booleanFieldChirho(policyChirho, "policyFileShapeOkChirho", "latinSymbolAcceptancePolicyChirho")}`,
    "Latin/symbol acceptance policy shape"
  );
  for (const [fieldChirho, labelChirho] of [
    ["acceptedPolicyCountChirho", "Accepted policies"],
    ["acceptedPolicyItemCountChirho", "Accepted policy items"],
    ["validAcceptedPolicyItemCountChirho", "Valid accepted policy items"],
    ["staleAcceptedPolicyItemCountChirho", "Stale accepted policy items"],
    ["duplicateAcceptedPolicyItemCountChirho", "Duplicate accepted policy items"],
  ] as const) {
    assertMarkdownContainsChirho(
      markdownChirho,
      `- ${labelChirho}: ${numberFieldChirho(policyChirho, fieldChirho, "latinSymbolAcceptancePolicyChirho")}`,
      `Latin/symbol acceptance policy ${fieldChirho}`
    );
  }
  const policyShapeErrorsChirho = stringArrayFieldChirho(policyChirho, "shapeErrorsChirho", "latinSymbolAcceptancePolicyChirho");
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Shape errors: ${policyShapeErrorsChirho.length === 0 ? "none" : policyShapeErrorsChirho.join("; ")}`,
    "Latin/symbol acceptance policy shape errors"
  );
}

function assertLatinSymbolQueueRemainingWorkCoverageChirho(
  statusChirho: CertificationStatusOutputChirho,
  remainingWorkChirho: string[]
): void {
  const latinChirho = statusChirho.latinSymbolVisionChirho;
  const artifactsChirho = statusChirho.artifactsChirho;
  const reviewDbChirho = statusChirho.latinSymbolReviewDbChirho;
  const reviewBackupChirho = statusChirho.latinSymbolReviewBackupChirho;
  const policyChirho = statusChirho.latinSymbolAcceptancePolicyChirho;
  const d1ReadErrorChirho = nullableStringFieldChirho(latinChirho, "d1ReadErrorChirho", "latinSymbolVisionChirho");
  const currentDecisionCountChirho =
    numberFieldChirho(latinChirho, "explicitVisionItemCountChirho", "latinSymbolVisionChirho") +
    numberFieldChirho(latinChirho, "d1DerivedVisionWordCountChirho", "latinSymbolVisionChirho");
  const packetExistsChirho = booleanFieldChirho(artifactsChirho, "latinSymbolPackManifestExistsChirho", "artifactsChirho");
  const packetShapeOkChirho = booleanFieldChirho(artifactsChirho, "latinSymbolPackManifestShapeOkChirho", "artifactsChirho");
  const packetCountMatchesChirho = booleanFieldChirho(latinChirho, "reviewPacketCountMatchesCurrentChirho", "latinSymbolVisionChirho");
  const packetIdsMatchChirho = booleanFieldChirho(latinChirho, "reviewPacketIdsMatchCurrentChirho", "latinSymbolVisionChirho");
  const reviewBackupExistsChirho = booleanFieldChirho(artifactsChirho, "latinSymbolReviewBackupExistsChirho", "artifactsChirho");
  const reviewBackupShapeOkChirho = booleanFieldChirho(artifactsChirho, "latinSymbolReviewBackupShapeOkChirho", "artifactsChirho");
  const policyExistsChirho = booleanFieldChirho(policyChirho, "policyFileExistsChirho", "latinSymbolAcceptancePolicyChirho");
  const policyShapeOkChirho = booleanFieldChirho(policyChirho, "policyFileShapeOkChirho", "latinSymbolAcceptancePolicyChirho");

  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    currentDecisionCountChirho !== 0 && !packetExistsChirho,
    "Latin/symbol vision review packet is missing; run make-latin-symbol-vision-pack-chirho",
    "Latin/symbol vision review packet is missing"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho !== null,
    `D1-derived Latin/symbol vision word scan failed: ${d1ReadErrorChirho}`,
    "D1-derived Latin/symbol vision word scan failed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    packetExistsChirho && !packetShapeOkChirho,
    "Latin/symbol vision review packet is malformed; regenerate make-latin-symbol-vision-pack-chirho",
    "Latin/symbol vision review packet is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    reviewBackupExistsChirho && !reviewBackupShapeOkChirho,
    "Latin/symbol review backup is malformed; regenerate record-latin-symbol-vision-review-chirho -- --export-backup",
    "Latin/symbol review backup is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    policyExistsChirho && !policyShapeOkChirho,
    "Latin/symbol acceptance policy is malformed; fix or regenerate prepare-latin-symbol-vision-acceptance-policy-chirho",
    "Latin/symbol acceptance policy is malformed"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho === null && currentDecisionCountChirho !== 0 && packetExistsChirho && packetShapeOkChirho && !packetCountMatchesChirho,
    "Latin/symbol vision review packet count does not match current span/D1 state; regenerate make-latin-symbol-vision-pack-chirho",
    "Latin/symbol vision review packet count does not match current span/D1 state"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho === null &&
      currentDecisionCountChirho !== 0 &&
      packetExistsChirho &&
      packetShapeOkChirho &&
      packetCountMatchesChirho &&
      !packetIdsMatchChirho,
    "Latin/symbol vision review packet item IDs do not match current span/D1 state; regenerate make-latin-symbol-vision-pack-chirho",
    "Latin/symbol vision review packet item IDs do not match current span/D1 state"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho === null &&
      currentDecisionCountChirho !== 0 &&
      packetExistsChirho &&
      packetShapeOkChirho &&
      packetIdsMatchChirho &&
      !booleanFieldChirho(latinChirho, "reviewPacketTextMatchesCurrentChirho", "latinSymbolVisionChirho"),
    "Latin/symbol vision review packet text does not match current live span/D1 text; regenerate make-latin-symbol-vision-pack-chirho",
    "Latin/symbol vision review packet text does not match current live span/D1 text"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1ReadErrorChirho === null &&
      currentDecisionCountChirho !== 0 &&
      packetExistsChirho &&
      packetShapeOkChirho &&
      packetIdsMatchChirho &&
      !booleanFieldChirho(latinChirho, "reviewPacketLineTextMatchesCurrentChirho", "latinSymbolVisionChirho"),
    "Latin/symbol vision review packet line text does not match current live span/D1 context; regenerate make-latin-symbol-vision-pack-chirho",
    "Latin/symbol vision review packet line text does not match current live span/D1 context"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    currentDecisionCountChirho !== 0 &&
      packetExistsChirho &&
      packetShapeOkChirho &&
      numberFieldChirho(latinChirho, "reviewPacketImageDriftCountChirho", "latinSymbolVisionChirho") !== 0,
    `${numberFieldChirho(latinChirho, "reviewPacketImageDriftCountChirho", "latinSymbolVisionChirho")} Latin/symbol vision review packet image hash drift(s); regenerate make-latin-symbol-vision-pack-chirho`,
    "Latin/symbol vision review packet image hash drift(s)"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    currentDecisionCountChirho !== 0 &&
      packetExistsChirho &&
      packetShapeOkChirho &&
      numberFieldChirho(latinChirho, "reviewPacketMarkdownPathDriftCountChirho", "latinSymbolVisionChirho") !== 0,
    `${numberFieldChirho(latinChirho, "reviewPacketMarkdownPathDriftCountChirho", "latinSymbolVisionChirho")} Latin/symbol vision review packet markdown image path drift(s); regenerate make-latin-symbol-vision-pack-chirho`,
    "Latin/symbol vision review packet markdown image path drift(s)"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(reviewDbChirho, "staleRowsChirho", "latinSymbolReviewDbChirho") !== 0,
    `${numberFieldChirho(reviewDbChirho, "staleRowsChirho", "latinSymbolReviewDbChirho")} Latin/symbol review row(s) are stale against current live span/D1 text`,
    "Latin/symbol review row(s) are stale against current live span/D1 text"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(reviewDbChirho, "invalidReviewRowsChirho", "latinSymbolReviewDbChirho") !== 0,
    `${numberFieldChirho(reviewDbChirho, "invalidReviewRowsChirho", "latinSymbolReviewDbChirho")} Latin/symbol review row(s) have malformed or verdict-inconsistent issue metadata`,
    "Latin/symbol review row(s) have malformed or verdict-inconsistent issue metadata"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(reviewDbChirho, "genericReviewerRowsChirho", "latinSymbolReviewDbChirho") !== 0,
    `${numberFieldChirho(reviewDbChirho, "genericReviewerRowsChirho", "latinSymbolReviewDbChirho")} Latin/symbol review row(s) use blank/generic/machine reviewer attribution; re-review explicitly before certification`,
    "Latin/symbol review row(s) use blank/generic/machine reviewer attribution"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(reviewBackupChirho, "localRowsMissingFromBackupChirho", "latinSymbolReviewBackupChirho") !== 0,
    `${numberFieldChirho(reviewBackupChirho, "localRowsMissingFromBackupChirho", "latinSymbolReviewBackupChirho")} local Latin/symbol review row(s) need export-backup before certification can complete on a fresh checkout`,
    "local Latin/symbol review row(s) need export-backup before certification can complete on a fresh checkout"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(policyChirho, "staleAcceptedPolicyItemCountChirho", "latinSymbolAcceptancePolicyChirho") !== 0,
    `${numberFieldChirho(policyChirho, "staleAcceptedPolicyItemCountChirho", "latinSymbolAcceptancePolicyChirho")} Latin/symbol policy item(s) are stale against current live span/D1 text`,
    "Latin/symbol policy item(s) are stale against current live span/D1 text"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(policyChirho, "duplicateAcceptedPolicyItemCountChirho", "latinSymbolAcceptancePolicyChirho") !== 0,
    `${numberFieldChirho(policyChirho, "duplicateAcceptedPolicyItemCountChirho", "latinSymbolAcceptancePolicyChirho")} duplicate Latin/symbol policy item(s) need cleanup`,
    "duplicate Latin/symbol policy item(s) need cleanup"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    numberFieldChirho(latinChirho, "issueOverriddenAcceptedDecisionCountChirho", "latinSymbolVisionChirho") !== 0,
    `${numberFieldChirho(latinChirho, "issueOverriddenAcceptedDecisionCountChirho", "latinSymbolVisionChirho")} Latin/symbol accepted decision(s) are overridden by open issue review(s)`,
    "Latin/symbol accepted decision(s) are overridden by open issue review(s)"
  );
}

function assertCoreRemainingWorkCoverageChirho(
  statusChirho: CertificationStatusOutputChirho,
  remainingWorkChirho: string[]
): void {
  const structuralChirho = statusChirho.structuralChirho;
  const strictPassedChirho = booleanFieldChirho(structuralChirho, "strictPassedChirho", "structuralChirho");
  const issueCountChirho = numberFieldChirho(structuralChirho, "issueCountChirho", "structuralChirho");
  const unknownSpanCountChirho = numberFieldChirho(structuralChirho, "unknownSpanCountChirho", "structuralChirho");
  const nonNfcSpanCountChirho = numberFieldChirho(structuralChirho, "nonNfcSpanCountChirho", "structuralChirho");
  const d1GapPageCountChirho = numberFieldChirho(structuralChirho, "d1GapPageCountChirho", "structuralChirho");
  const passCOcrHebrewSpanCountChirho = numberFieldChirho(
    structuralChirho,
    "passCOcrHebrewSpanCountChirho",
    "structuralChirho"
  );
  const liveNonNfcSpanTextFieldCountChirho = numberFieldChirho(
    statusChirho.normalizationChirho,
    "liveNonNfcSpanTextFieldCountChirho",
    "normalizationChirho"
  );
  const visionRemainingChirho = numberFieldChirho(
    statusChirho.visionTierChirho,
    "remainingConfirmationCountChirho",
    "visionTierChirho"
  );
  const latinRemainingChirho = numberFieldChirho(
    statusChirho.latinSymbolVisionChirho,
    "remainingDecisionCountChirho",
    "latinSymbolVisionChirho"
  );

  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !strictPassedChirho || issueCountChirho !== 0,
    "structural export strict gate is not clean",
    "structural export strict gate is not clean"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    unknownSpanCountChirho !== 0,
    `${unknownSpanCountChirho} unknown span(s) remain`,
    "unknown span(s) remain"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    nonNfcSpanCountChirho !== 0,
    `${nonNfcSpanCountChirho} non-NFC span(s) remain in the latest export report`,
    "non-NFC span(s) remain in the latest export report"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    liveNonNfcSpanTextFieldCountChirho !== 0,
    `${liveNonNfcSpanTextFieldCountChirho} live span text field(s) are not NFC-normalized`,
    "live span text field(s) are not NFC-normalized"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    d1GapPageCountChirho !== 0,
    `${d1GapPageCountChirho} D1 page gap(s) remain`,
    "D1 page gap(s) remain"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    passCOcrHebrewSpanCountChirho !== 0,
    `${passCOcrHebrewSpanCountChirho} raw Pass-C Hebrew span(s) still need human certification`,
    "raw Pass-C Hebrew span(s) still need human certification"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    visionRemainingChirho !== 0,
    `${visionRemainingChirho} vision-tier non-Latin span(s) still need expert/human confirmation`,
    "vision-tier non-Latin span(s) still need expert/human confirmation"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    latinRemainingChirho !== 0,
    `${latinRemainingChirho} Latin/symbol vision-tier span/word decision(s) still need accepted-clean review or explicit acceptance policy`,
    "Latin/symbol vision-tier span/word decision(s) still need accepted-clean review or explicit acceptance policy"
  );

  const handoffsChirho = arrayFieldChirho(structuralChirho, "blankVisionTierHandoffsChirho", "structuralChirho");
  const missingDocumentCountChirho = handoffsChirho.filter((handoffChirho) =>
    nullableStringFieldChirho(handoffChirho, "handoffDocumentPathChirho", "structuralChirho.blankVisionTierHandoffsChirho[]") === null ||
    !booleanFieldChirho(handoffChirho, "handoffDocumentExistsChirho", "structuralChirho.blankVisionTierHandoffsChirho[]")
  ).length;
  const missingCropCountChirho = handoffsChirho.filter((handoffChirho) =>
    nullableStringFieldChirho(handoffChirho, "handoffCropPathChirho", "structuralChirho.blankVisionTierHandoffsChirho[]") === null ||
    !booleanFieldChirho(handoffChirho, "handoffCropExistsChirho", "structuralChirho.blankVisionTierHandoffsChirho[]")
  ).length;
  const staleDocumentCountChirho = handoffsChirho.filter((handoffChirho) =>
    booleanFieldChirho(handoffChirho, "handoffDocumentExistsChirho", "structuralChirho.blankVisionTierHandoffsChirho[]") &&
    !booleanFieldChirho(handoffChirho, "handoffDocumentMatchesCurrentChirho", "structuralChirho.blankVisionTierHandoffsChirho[]")
  ).length;
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    missingDocumentCountChirho !== 0,
    `${missingDocumentCountChirho} blank expert transcription handoff document(s) are missing`,
    "blank expert transcription handoff document(s) are missing"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    missingCropCountChirho !== 0,
    `${missingCropCountChirho} blank expert transcription handoff crop image(s) are missing`,
    "blank expert transcription handoff crop image(s) are missing"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    staleDocumentCountChirho !== 0,
    `${staleDocumentCountChirho} blank expert transcription handoff document(s) do not match current blank span state`,
    "blank expert transcription handoff document(s) do not match current blank span state"
  );
}

function assertCandidateScanMarkdownCoverageChirho(markdownChirho: string, labelChirho: string, scanChirho: unknown): void {
  const scanLabelChirho = `strictBlindScansChirho.${labelChirho}`;
  const reportPathChirho = stringFieldChirho(scanChirho, "reportPathChirho", scanLabelChirho);
  const reportExistsChirho = booleanFieldChirho(scanChirho, "reportExistsChirho", scanLabelChirho);
  const reportShapeOkChirho = booleanFieldChirho(scanChirho, "reportShapeOkChirho", scanLabelChirho);
  const generatedAtChirho = nullableStringFieldChirho(scanChirho, "generatedAtChirho", scanLabelChirho);
  const scannerSourceFileCountChirho = nullableNumberFieldChirho(scanChirho, "scannerSourceFileCountChirho", scanLabelChirho);
  const liveScannerSourceFileCountChirho = numberFieldChirho(scanChirho, "liveScannerSourceFileCountChirho", scanLabelChirho);
  const scannerFingerprintMatchesChirho = booleanFieldChirho(
    scanChirho,
    "scannerSourceFingerprintMatchesCurrentChirho",
    scanLabelChirho
  );
  const spanSourceFileCountChirho = nullableNumberFieldChirho(scanChirho, "spanSourceFileCountChirho", scanLabelChirho);
  const liveSpanSourceFileCountChirho = numberFieldChirho(scanChirho, "liveSpanSourceFileCountChirho", scanLabelChirho);
  const spanFingerprintMatchesChirho = booleanFieldChirho(scanChirho, "spanSourceFingerprintMatchesCurrentChirho", scanLabelChirho);
  const candidateLineCountChirho = nullableNumberFieldChirho(scanChirho, "candidateLineCountChirho", scanLabelChirho);
  const renderedCandidateLineCountChirho = numberFieldChirho(scanChirho, "renderedCandidateLineCountChirho", scanLabelChirho);
  const summaryCountsMatchChirho = booleanFieldChirho(scanChirho, "summaryCountsMatchRenderedCandidatesChirho", scanLabelChirho);
  const highCountChirho = nullableNumberFieldChirho(scanChirho, "highPriorityCountChirho", scanLabelChirho);
  const mediumCountChirho = nullableNumberFieldChirho(scanChirho, "mediumPriorityCountChirho", scanLabelChirho);
  const lowCountChirho = nullableNumberFieldChirho(scanChirho, "lowPriorityCountChirho", scanLabelChirho);
  const renderedHighCountChirho = numberFieldChirho(scanChirho, "renderedHighPriorityCountChirho", scanLabelChirho);
  const renderedMediumCountChirho = numberFieldChirho(scanChirho, "renderedMediumPriorityCountChirho", scanLabelChirho);
  const renderedLowCountChirho = numberFieldChirho(scanChirho, "renderedLowPriorityCountChirho", scanLabelChirho);

  assertMarkdownContainsChirho(markdownChirho, `- ${labelChirho}: \`${reportPathChirho}\``, `${labelChirho} report path`);
  assertMarkdownContainsChirho(markdownChirho, `  - Report exists: ${reportExistsChirho}`, `${labelChirho} exists`);
  assertMarkdownContainsChirho(markdownChirho, `  - Report shape OK: ${reportShapeOkChirho}`, `${labelChirho} shape`);
  assertMarkdownContainsChirho(markdownChirho, `  - Generated: ${generatedAtChirho ?? "unknown"}`, `${labelChirho} generated`);
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Scanner source files in report: ${displayValueChirho(scannerSourceFileCountChirho)}`,
    `${labelChirho} scanner source count`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Live scanner source files: ${liveScannerSourceFileCountChirho}`,
    `${labelChirho} live scanner source count`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Scanner source fingerprint matches current scanner: ${scannerFingerprintMatchesChirho}`,
    `${labelChirho} scanner fingerprint`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Span source files in report: ${displayValueChirho(spanSourceFileCountChirho)}`,
    `${labelChirho} span source count`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Live span source files: ${liveSpanSourceFileCountChirho}`,
    `${labelChirho} live span source count`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Span source fingerprint matches current spans: ${spanFingerprintMatchesChirho}`,
    `${labelChirho} span fingerprint`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Candidate lines: ${displayValueChirho(candidateLineCountChirho)}`,
    `${labelChirho} candidate count`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Rendered candidate headings: ${renderedCandidateLineCountChirho}`,
    `${labelChirho} rendered candidate count`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Summary counts match rendered candidates: ${summaryCountsMatchChirho}`,
    `${labelChirho} summary match`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - High/medium/low: ${[displayValueChirho(highCountChirho), displayValueChirho(mediumCountChirho), displayValueChirho(lowCountChirho)].join("/")}`,
    `${labelChirho} priority counts`
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Rendered high/medium/low: ${[renderedHighCountChirho, renderedMediumCountChirho, renderedLowCountChirho].join("/")}`,
    `${labelChirho} rendered priority counts`
  );
}

function assertCandidateScanRemainingWorkCoverageChirho(
  remainingWorkChirho: string[],
  blockerLabelChirho: string,
  regenerateCommandChirho: string,
  scanChirho: unknown
): void {
  const scanLabelChirho = `strictBlindScansChirho.${blockerLabelChirho}`;
  const reportExistsChirho = booleanFieldChirho(scanChirho, "reportExistsChirho", scanLabelChirho);
  const reportShapeOkChirho = booleanFieldChirho(scanChirho, "reportShapeOkChirho", scanLabelChirho);
  const scannerFingerprintMatchesChirho = booleanFieldChirho(
    scanChirho,
    "scannerSourceFingerprintMatchesCurrentChirho",
    scanLabelChirho
  );
  const spanFingerprintMatchesChirho = booleanFieldChirho(scanChirho, "spanSourceFingerprintMatchesCurrentChirho", scanLabelChirho);
  const candidateLineCountChirho = nullableNumberFieldChirho(scanChirho, "candidateLineCountChirho", scanLabelChirho) ?? 0;
  if (!reportExistsChirho) {
    assertRemainingWorkToggleChirho(
      remainingWorkChirho,
      true,
      `${blockerLabelChirho} scanner report is missing; run ${regenerateCommandChirho}`,
      `${blockerLabelChirho} scanner report is missing`
    );
    return;
  }
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    false,
    "",
    `${blockerLabelChirho} scanner report is missing`
  );
  if (!reportShapeOkChirho) {
    assertRemainingWorkToggleChirho(
      remainingWorkChirho,
      true,
      `${blockerLabelChirho} scanner report is malformed; regenerate with ${regenerateCommandChirho}`,
      `${blockerLabelChirho} scanner report is malformed`
    );
    return;
  }
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    false,
    "",
    `${blockerLabelChirho} scanner report is malformed`
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !scannerFingerprintMatchesChirho,
    `${blockerLabelChirho} scanner report source-code fingerprint does not match current scanner; rerun ${regenerateCommandChirho}`,
    `${blockerLabelChirho} scanner report source-code fingerprint does not match current scanner`
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !spanFingerprintMatchesChirho,
    `${blockerLabelChirho} scanner report span-source fingerprint does not match current spans; rerun ${regenerateCommandChirho}`,
    `${blockerLabelChirho} scanner report span-source fingerprint does not match current spans`
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    candidateLineCountChirho !== 0,
    `${candidateLineCountChirho} ${blockerLabelChirho} strict-blind candidate line(s) remain; visually review and repair or justify before certification`,
    `${blockerLabelChirho} strict-blind candidate line(s) remain`
  );
}

function assertDelimiterAuditMarkdownCoverageChirho(markdownChirho: string, scanChirho: unknown): void {
  const scanLabelChirho = "strictBlindScansChirho.hebrewDelimiterOrderChirho";
  const reportPathChirho = stringFieldChirho(scanChirho, "reportPathChirho", scanLabelChirho);
  const reportExistsChirho = booleanFieldChirho(scanChirho, "reportExistsChirho", scanLabelChirho);
  const reportShapeOkChirho = booleanFieldChirho(scanChirho, "reportShapeOkChirho", scanLabelChirho);
  const generatedAtChirho = nullableStringFieldChirho(scanChirho, "generatedAtChirho", scanLabelChirho);
  const scannerSourceFileCountChirho = nullableNumberFieldChirho(scanChirho, "scannerSourceFileCountChirho", scanLabelChirho);
  const liveScannerSourceFileCountChirho = numberFieldChirho(scanChirho, "liveScannerSourceFileCountChirho", scanLabelChirho);
  const scannerFingerprintMatchesChirho = booleanFieldChirho(
    scanChirho,
    "scannerSourceFingerprintMatchesCurrentChirho",
    scanLabelChirho
  );
  const spanSourceFileCountChirho = nullableNumberFieldChirho(scanChirho, "spanSourceFileCountChirho", scanLabelChirho);
  const liveSpanSourceFileCountChirho = numberFieldChirho(scanChirho, "liveSpanSourceFileCountChirho", scanLabelChirho);
  const spanFingerprintMatchesChirho = booleanFieldChirho(scanChirho, "spanSourceFingerprintMatchesCurrentChirho", scanLabelChirho);
  const delimiterSpanCountChirho = nullableNumberFieldChirho(scanChirho, "hebrewDelimiterSpanCountChirho", scanLabelChirho);
  const renderedDelimiterRowsChirho = numberFieldChirho(scanChirho, "renderedHebrewDelimiterSpanCountChirho", scanLabelChirho);
  const summaryCountsMatchChirho = booleanFieldChirho(scanChirho, "summaryCountsMatchRenderedRowsChirho", scanLabelChirho);
  const closeBeforeOpenCountChirho = nullableNumberFieldChirho(scanChirho, "closeBeforeOpenSuspectCountChirho", scanLabelChirho);
  const renderedCloseBeforeOpenCountChirho = numberFieldChirho(
    scanChirho,
    "renderedCloseBeforeOpenSuspectCountChirho",
    scanLabelChirho
  );
  const neighborUnbalancedCountChirho = nullableNumberFieldChirho(
    scanChirho,
    "neighborUnbalancedReviewCountChirho",
    scanLabelChirho
  );
  const renderedNeighborUnbalancedCountChirho = numberFieldChirho(
    scanChirho,
    "renderedNeighborUnbalancedReviewCountChirho",
    scanLabelChirho
  );
  const coveredCountChirho = numberFieldChirho(scanChirho, "neighborUnbalancedCoveredByReviewCountChirho", scanLabelChirho);
  const uncoveredCountChirho = numberFieldChirho(scanChirho, "neighborUnbalancedUncoveredByReviewCountChirho", scanLabelChirho);
  const coveredSamplesChirho = stringArrayFieldChirho(scanChirho, "neighborUnbalancedCoveredSamplesChirho", scanLabelChirho);
  const uncoveredSamplesChirho = stringArrayFieldChirho(scanChirho, "neighborUnbalancedUncoveredSamplesChirho", scanLabelChirho);

  assertMarkdownContainsChirho(markdownChirho, `- Hebrew delimiter-order audit: \`${reportPathChirho}\``, "delimiter audit report path");
  assertMarkdownContainsChirho(markdownChirho, `  - Report exists: ${reportExistsChirho}`, "delimiter audit exists");
  assertMarkdownContainsChirho(markdownChirho, `  - Report shape OK: ${reportShapeOkChirho}`, "delimiter audit shape");
  assertMarkdownContainsChirho(markdownChirho, `  - Generated: ${generatedAtChirho ?? "unknown"}`, "delimiter audit generated");
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Scanner source files in report: ${displayValueChirho(scannerSourceFileCountChirho)}`,
    "delimiter audit scanner source count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Live scanner source files: ${liveScannerSourceFileCountChirho}`,
    "delimiter audit live scanner source count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Scanner source fingerprint matches current scanner: ${scannerFingerprintMatchesChirho}`,
    "delimiter audit scanner fingerprint"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Span source files in report: ${displayValueChirho(spanSourceFileCountChirho)}`,
    "delimiter audit span source count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Live span source files: ${liveSpanSourceFileCountChirho}`,
    "delimiter audit live span source count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Span source fingerprint matches current spans: ${spanFingerprintMatchesChirho}`,
    "delimiter audit span fingerprint"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Hebrew delimiter spans: ${displayValueChirho(delimiterSpanCountChirho)}`,
    "delimiter audit span count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Rendered delimiter rows: ${renderedDelimiterRowsChirho}`,
    "delimiter audit rendered rows"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Summary counts match rendered rows: ${summaryCountsMatchChirho}`,
    "delimiter audit summary match"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Close-before-open suspects: ${displayValueChirho(closeBeforeOpenCountChirho)} (rendered ${renderedCloseBeforeOpenCountChirho})`,
    "delimiter audit close-before-open count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Neighbor-unbalanced review rows: ${displayValueChirho(neighborUnbalancedCountChirho)} (rendered ${renderedNeighborUnbalancedCountChirho})`,
    "delimiter audit neighbor-unbalanced count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Neighbor-unbalanced rows covered by raw/expert review: ${coveredCountChirho}`,
    "delimiter audit covered count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Neighbor-unbalanced covered samples: ${coveredSamplesChirho.length === 0 ? "none" : coveredSamplesChirho.join(", ")}`,
    "delimiter audit covered samples"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Neighbor-unbalanced rows not covered by raw/expert review: ${uncoveredCountChirho}`,
    "delimiter audit uncovered count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    `  - Neighbor-unbalanced uncovered samples: ${uncoveredSamplesChirho.length === 0 ? "none" : uncoveredSamplesChirho.join(", ")}`,
    "delimiter audit uncovered samples"
  );
}

function assertDelimiterAuditRemainingWorkCoverageChirho(remainingWorkChirho: string[], scanChirho: unknown): void {
  const scanLabelChirho = "strictBlindScansChirho.hebrewDelimiterOrderChirho";
  const regenerateCommandChirho = "bun run scan-hebrew-delimiter-order-chirho";
  const reportExistsChirho = booleanFieldChirho(scanChirho, "reportExistsChirho", scanLabelChirho);
  const reportShapeOkChirho = booleanFieldChirho(scanChirho, "reportShapeOkChirho", scanLabelChirho);
  const scannerFingerprintMatchesChirho = booleanFieldChirho(
    scanChirho,
    "scannerSourceFingerprintMatchesCurrentChirho",
    scanLabelChirho
  );
  const spanFingerprintMatchesChirho = booleanFieldChirho(scanChirho, "spanSourceFingerprintMatchesCurrentChirho", scanLabelChirho);
  const closeBeforeOpenCountChirho = nullableNumberFieldChirho(scanChirho, "closeBeforeOpenSuspectCountChirho", scanLabelChirho) ?? 0;
  const uncoveredCountChirho = numberFieldChirho(scanChirho, "neighborUnbalancedUncoveredByReviewCountChirho", scanLabelChirho);
  if (!reportExistsChirho) {
    assertRemainingWorkToggleChirho(
      remainingWorkChirho,
      true,
      `Hebrew delimiter-order audit report is missing; run ${regenerateCommandChirho}`,
      "Hebrew delimiter-order audit report is missing"
    );
    return;
  }
  assertRemainingWorkToggleChirho(remainingWorkChirho, false, "", "Hebrew delimiter-order audit report is missing");
  if (!reportShapeOkChirho) {
    assertRemainingWorkToggleChirho(
      remainingWorkChirho,
      true,
      `Hebrew delimiter-order audit report is malformed; regenerate with ${regenerateCommandChirho}`,
      "Hebrew delimiter-order audit report is malformed"
    );
    return;
  }
  assertRemainingWorkToggleChirho(remainingWorkChirho, false, "", "Hebrew delimiter-order audit report is malformed");
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !scannerFingerprintMatchesChirho,
    `Hebrew delimiter-order audit source-code fingerprint does not match current scanner; rerun ${regenerateCommandChirho}`,
    "Hebrew delimiter-order audit source-code fingerprint does not match current scanner"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    !spanFingerprintMatchesChirho,
    `Hebrew delimiter-order audit span-source fingerprint does not match current spans; rerun ${regenerateCommandChirho}`,
    "Hebrew delimiter-order audit span-source fingerprint does not match current spans"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    closeBeforeOpenCountChirho !== 0,
    `${closeBeforeOpenCountChirho} Hebrew close-before-open delimiter suspect(s) remain; visually review and repair or justify before certification`,
    "Hebrew close-before-open delimiter suspect(s) remain"
  );
  assertRemainingWorkToggleChirho(
    remainingWorkChirho,
    uncoveredCountChirho !== 0,
    `${uncoveredCountChirho} Hebrew delimiter neighbor-unbalanced row(s) are not covered by raw/expert review; repair, route, or justify before certification`,
    "Hebrew delimiter neighbor-unbalanced row(s) are not covered by raw/expert review"
  );
}

function assertStrictBlindScanCoverageChirho(
  markdownChirho: string,
  statusChirho: CertificationStatusOutputChirho,
  remainingWorkChirho: string[]
): void {
  const scansChirho = objectRecordChirho(statusChirho.strictBlindScansChirho, "strictBlindScansChirho");
  assertMarkdownContainsChirho(markdownChirho, "## Strict-Blind Scanner Reports", "strict-blind scanner heading");
  assertMarkdownContainsChirho(
    markdownChirho,
    "These heuristic reports do not certify text.",
    "strict-blind scanner non-certification warning"
  );
  const hiddenHebrewChirho = scansChirho.hiddenHebrewChirho;
  const nonLatinResidueChirho = scansChirho.nonLatinResidueChirho;
  const delimiterAuditChirho = scansChirho.hebrewDelimiterOrderChirho;
  assertCandidateScanMarkdownCoverageChirho(markdownChirho, "Hidden Hebrew detector", hiddenHebrewChirho);
  assertCandidateScanRemainingWorkCoverageChirho(
    remainingWorkChirho,
    "hidden Hebrew",
    "bun run spec-chirho/metropoliluya-chirho/find-hidden-hebrew-candidates-2026-06-04-chirho.ts",
    hiddenHebrewChirho
  );
  assertCandidateScanMarkdownCoverageChirho(markdownChirho, "Non-Latin residue detector", nonLatinResidueChirho);
  assertCandidateScanRemainingWorkCoverageChirho(
    remainingWorkChirho,
    "non-Latin residue",
    "bun run spec-chirho/metropoliluya-chirho/find-nonlatin-residue-candidates-2026-06-04-chirho.ts",
    nonLatinResidueChirho
  );
  assertDelimiterAuditMarkdownCoverageChirho(markdownChirho, delimiterAuditChirho);
  assertDelimiterAuditRemainingWorkCoverageChirho(remainingWorkChirho, delimiterAuditChirho);
}

function assertPassCHumanReattributionHandoffChirho(
  markdownChirho: string,
  statusChirho: CertificationStatusOutputChirho,
  remainingWorkChirho: string[]
): void {
  const humanDbChirho = statusChirho.humanValidationDbChirho;
  const genericRowCountChirho = numberFieldChirho(humanDbChirho, "genericReviewerRowsChirho", "humanValidationDbChirho");
  const genericRowsChirho = arrayFieldChirho(
    humanDbChirho,
    "genericReviewerRowDetailsChirho",
    "humanValidationDbChirho"
  );
  const genericGroupsChirho = arrayFieldChirho(
    humanDbChirho,
    "genericReviewerRowGroupsChirho",
    "humanValidationDbChirho"
  );
  assertGeneratedCheckChirho(
    genericRowsChirho.length === genericRowCountChirho,
    "humanValidationDbChirho.genericReviewerRowsChirho must match row details length"
  );
  const blockerChirho = `${genericRowCountChirho} current Pass-C human validation row(s) use blank/generic/machine reviewer attribution; re-review or reattribute explicitly before certification`;
  const passCAttributionBlockersChirho = remainingWorkChirho.filter((itemChirho) =>
    itemChirho.includes("current Pass-C human validation row(s) use blank/generic/machine reviewer attribution")
  );
  if (genericRowCountChirho === 0) {
    assertGeneratedCheckChirho(
      passCAttributionBlockersChirho.length === 0,
      "remainingWorkChirho must not include a Pass-C generic reviewer blocker when none remain"
    );
  } else {
    assertGeneratedCheckChirho(
      passCAttributionBlockersChirho.includes(blockerChirho),
      "remainingWorkChirho missing exact Pass-C generic reviewer blocker"
    );
  }
  assertMarkdownContainsChirho(
    markdownChirho,
    `- Attribution-blocked reviewer rows: ${genericRowCountChirho}`,
    "Pass-C reattribution row count"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    "Reattribution commands reject copied template placeholders",
    "Pass-C reattribution placeholder warning"
  );
  assertMarkdownContainsChirho(
    markdownChirho,
    "Do not bulk reattribute these rows unless every selected row is genuinely attributable to the same explicit human reviewer.",
    "Pass-C reattribution bulk warning"
  );

  const genericIdsChirho = genericRowsChirho.map((rowChirho) =>
    numberFieldChirho(rowChirho, "idChirho", "humanValidationDbChirho.genericReviewerRowDetailsChirho[]")
  );
  for (const rowChirho of genericRowsChirho) {
    const idChirho = numberFieldChirho(rowChirho, "idChirho", "humanValidationDbChirho.genericReviewerRowDetailsChirho[]");
    const locationChirho = stringFieldChirho(
      rowChirho,
      "locationChirho",
      "humanValidationDbChirho.genericReviewerRowDetailsChirho[]"
    );
    assertMarkdownContainsChirho(markdownChirho, `  - id ${idChirho} (${locationChirho};`, `Pass-C row ${idChirho} detail`);
    assertMarkdownContainsChirho(
      markdownChirho,
      `Reattribute dry-run command: \`${reattributeSingleCommandChirho(rowChirho, false)}\``,
      `Pass-C row ${idChirho} dry-run command`
    );
    assertMarkdownContainsChirho(
      markdownChirho,
      `Reattribute apply command: \`${reattributeSingleCommandChirho(rowChirho, true)}\``,
      `Pass-C row ${idChirho} apply command`
    );
  }

  const groupedIdsChirho = genericGroupsChirho.flatMap((groupChirho) =>
    numberArrayFieldChirho(groupChirho, "idsChirho", "humanValidationDbChirho.genericReviewerRowGroupsChirho[]")
  );
  assertGeneratedCheckChirho(
    genericIdsChirho.slice().sort((aChirho, bChirho) => aChirho - bChirho).join(",") ===
      groupedIdsChirho.slice().sort((aChirho, bChirho) => aChirho - bChirho).join(","),
    "humanValidationDbChirho generic reviewer groups must cover the same IDs as row details"
  );
  const bulkExpectedHashArgsChirho = genericRowsChirho.flatMap((rowChirho) => {
    const idChirho = numberFieldChirho(rowChirho, "idChirho", "humanValidationDbChirho.genericReviewerRowDetailsChirho[]");
    const hashChirho = nullableStringFieldChirho(
      rowChirho,
      "liveTextHashChirho",
      "humanValidationDbChirho.genericReviewerRowDetailsChirho[]"
    );
    return hashChirho === null ? [] : [`--expected-live-text-hash-chirho=${idChirho}:${hashChirho}`];
  });
  const bulkBaseCommandChirho = [
    "bun run reattribute-pass-c-human-validations-chirho --",
    `--all-generic-chirho --expected-generic-row-count-chirho=${genericRowCountChirho}`,
    ...bulkExpectedHashArgsChirho,
    "--reviewer-chirho='<explicit-human-reviewer-id-chirho>'",
    "--rationale-chirho='<why every current attribution-blocked row is attributable to that reviewer>'",
  ].join(" ");
  assertMarkdownContainsChirho(markdownChirho, `${bulkBaseCommandChirho}\``, "Pass-C bulk dry-run command");
  assertMarkdownContainsChirho(markdownChirho, `${bulkBaseCommandChirho} --apply-chirho\``, "Pass-C bulk apply command");

  for (const groupChirho of genericGroupsChirho) {
    const rowCountChirho = numberFieldChirho(groupChirho, "rowCountChirho", "humanValidationDbChirho.genericReviewerRowGroupsChirho[]");
    if (rowCountChirho <= 1) continue;
    const idsChirho = numberArrayFieldChirho(groupChirho, "idsChirho", "humanValidationDbChirho.genericReviewerRowGroupsChirho[]");
    assertMarkdownContainsChirho(
      markdownChirho,
      `Batch dry-run command: \`${reattributeBatchCommandChirho(groupChirho, false)}\``,
      `Pass-C batch ${idsChirho.join(",")} dry-run command`
    );
    assertMarkdownContainsChirho(
      markdownChirho,
      `Batch apply command: \`${reattributeBatchCommandChirho(groupChirho, true)}\``,
      `Pass-C batch ${idsChirho.join(",")} apply command`
    );
  }
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const outDirChirho = parseArgValueChirho(argsChirho, "out-dir") ?? DEFAULT_STATUS_OUT_DIR_CHIRHO;
  const markdownPathChirho = join(outDirChirho, "status-chirho.md");
  const jsonPathChirho = join(outDirChirho, "status-chirho.json");
  assertGeneratedCheckChirho(existsSync(markdownPathChirho), `missing generated status Markdown: ${markdownPathChirho}`);
  assertGeneratedCheckChirho(existsSync(jsonPathChirho), `missing generated status JSON: ${jsonPathChirho}`);

  const markdownChirho = readFileSync(markdownPathChirho, "utf8");
  const jsonTextChirho = readFileSync(jsonPathChirho, "utf8");
  assertGeneratedTextHygieneChirho(markdownPathChirho, markdownChirho);
  assertGeneratedTextHygieneChirho(jsonPathChirho, jsonTextChirho);
  assertMarkdownHeaderChirho(markdownPathChirho, markdownChirho, JOHN_316_INLINE_MARKDOWN_HEADER_CHIRHO);
  assertStatusLocalArtifactLinksChirho(markdownChirho);

  const statusChirho = JSON.parse(jsonTextChirho) as CertificationStatusOutputChirho;
  assertGeneratedCheckChirho(typeof statusChirho.generatedAtChirho === "string", "status JSON missing generatedAtChirho");
  assertGeneratedCheckChirho(
    typeof statusChirho.certificationCompleteChirho === "boolean",
    "status JSON missing certificationCompleteChirho boolean"
  );
  assertReviewStartLinksRenderedChirho(markdownChirho, statusChirho.reviewStartLinksChirho);
  assertReviewStartLinkCoverageChirho(statusChirho);
  assertGeneratedCheckChirho(Array.isArray(statusChirho.remainingWorkChirho), "status JSON missing remainingWorkChirho array");
  const remainingWorkChirho = statusChirho.remainingWorkChirho;
  assertGeneratedCheckChirho(
    remainingWorkChirho.every((itemChirho) => typeof itemChirho === "string" && itemChirho.trim().length > 0),
    "status JSON remainingWorkChirho must contain only non-empty strings"
  );
  const remainingWorkStringsChirho = remainingWorkChirho as string[];
  assertGeneratedCheckChirho(
    statusChirho.certificationCompleteChirho === (remainingWorkStringsChirho.length === 0),
    "certificationCompleteChirho must match remainingWorkChirho emptiness"
  );
  if (!statusChirho.certificationCompleteChirho) {
    assertGeneratedCheckChirho(remainingWorkChirho.length > 0, "incomplete status JSON has no remainingWorkChirho blockers");
  }
  for (const itemChirho of remainingWorkStringsChirho) {
    assertGeneratedCheckChirho(
      markdownChirho.includes(itemChirho),
      `status Markdown does not display remaining-work blocker: ${itemChirho}`
    );
  }
  assertCoreRemainingWorkCoverageChirho(statusChirho, remainingWorkStringsChirho);
  assertRawHebrewQueueMarkdownCoverageChirho(markdownChirho, statusChirho);
  assertRawHebrewQueueRemainingWorkCoverageChirho(statusChirho, remainingWorkStringsChirho);
  assertVisionTierExpertQueueMarkdownCoverageChirho(markdownChirho, statusChirho);
  assertVisionTierExpertQueueRemainingWorkCoverageChirho(statusChirho, remainingWorkStringsChirho);
  assertLatinSymbolQueueMarkdownCoverageChirho(markdownChirho, statusChirho);
  assertLatinSymbolQueueRemainingWorkCoverageChirho(statusChirho, remainingWorkStringsChirho);
  assertStrictBlindScanCoverageChirho(markdownChirho, statusChirho, remainingWorkStringsChirho);
  assertBlankExpertHandoffCoverageChirho(markdownChirho, statusChirho);
  assertPassCHumanReattributionHandoffChirho(markdownChirho, statusChirho, remainingWorkStringsChirho);
  assertGeneratedCheckChirho(
    markdownChirho.includes(`Generated: ${statusChirho.generatedAtChirho}`),
    "status Markdown Generated line does not match status JSON generatedAtChirho"
  );
  assertGeneratedCheckChirho(
    markdownChirho.includes(`Certification complete: ${statusChirho.certificationCompleteChirho ? "yes" : "no"}`),
    "status Markdown certification-complete line does not match status JSON"
  );
  console.log(`[${MODULE_CHIRHO}] status output hygiene passed`);
}

if (import.meta.main) {
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
