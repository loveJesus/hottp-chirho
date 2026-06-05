// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify ignored certification status artifacts are well-formed.
 *
 * Git diff hygiene does not cover workspace-chirho, so this checks the generated
 * status Markdown/JSON directly after transcription-certification-status runs.
 */

import { existsSync, readFileSync } from "fs";
import { join, resolve, sep } from "path";

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
  reviewStartLinksChirho?: unknown;
  rawHebrewChirho?: unknown;
  latinSymbolVisionChirho?: unknown;
  visionTierChirho?: unknown;
  humanValidationDbChirho?: unknown;
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
  if (!statusChirho.certificationCompleteChirho) {
    assertGeneratedCheckChirho(remainingWorkChirho.length > 0, "incomplete status JSON has no remainingWorkChirho blockers");
  }
  for (const itemChirho of remainingWorkStringsChirho) {
    assertGeneratedCheckChirho(
      markdownChirho.includes(itemChirho),
      `status Markdown does not display remaining-work blocker: ${itemChirho}`
    );
  }
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
