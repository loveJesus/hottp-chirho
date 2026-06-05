// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify active certification JSON decision artifacts are clean and aligned
 * with the latest generated status report. Archival diagnostic JSON is
 * intentionally out of scope.
 */

import { existsSync, readFileSync } from "fs";
import { join, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  assertGeneratedCheckChirho,
  assertGeneratedTextHygieneChirho,
} from "./generated-output-hygiene-chirho.ts";
import { LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO } from "./latin-symbol-vision-acceptance-policy-chirho.ts";
import { LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO } from "./latin-symbol-vision-review-store-chirho.ts";
import { PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO } from "./pass-c-human-validation-backup-chirho.ts";
import { VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO } from "./vision-tier-expert-confirmation-policy-chirho.ts";

const MODULE_CHIRHO = "check-active-certification-json-artifacts-hygiene-chirho";
const STATUS_JSON_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "status-chirho.json"
);
const EXPERT_SUPPLIED_VISION_TEXT_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "expert-supplied-vision-transcriptions-2026-06-04-chirho.json"
);
const LOCAL_PATH_FIELD_NAMES_CHIRHO = new Set(["appliedToFileChirho"]);

interface ActiveCertificationJsonArtifactChirho {
  labelChirho: string;
  pathChirho: string;
  existsKeyChirho: string;
  shapeOkKeyChirho: string;
  requiredChirho: boolean;
}

interface CertificationStatusArtifactsChirho {
  [keyChirho: string]: unknown;
}

interface CertificationStatusJsonChirho {
  artifactsChirho?: CertificationStatusArtifactsChirho;
}

const ACTIVE_CERTIFICATION_JSON_ARTIFACTS_CHIRHO: ActiveCertificationJsonArtifactChirho[] = [
  {
    labelChirho: "Pass-C human validation backup",
    pathChirho: PASS_C_HUMAN_VALIDATION_BACKUP_PATH_CHIRHO,
    existsKeyChirho: "passCHumanValidationBackupExistsChirho",
    shapeOkKeyChirho: "passCHumanValidationBackupShapeOkChirho",
    requiredChirho: true,
  },
  {
    labelChirho: "Latin/symbol review backup",
    pathChirho: LATIN_SYMBOL_REVIEW_BACKUP_PATH_CHIRHO,
    existsKeyChirho: "latinSymbolReviewBackupExistsChirho",
    shapeOkKeyChirho: "latinSymbolReviewBackupShapeOkChirho",
    requiredChirho: true,
  },
  {
    labelChirho: "Latin/symbol acceptance policy",
    pathChirho: LATIN_SYMBOL_ACCEPTANCE_POLICY_PATH_CHIRHO,
    existsKeyChirho: "latinSymbolAcceptancePolicyExistsChirho",
    shapeOkKeyChirho: "latinSymbolAcceptancePolicyShapeOkChirho",
    requiredChirho: true,
  },
  {
    labelChirho: "vision-tier expert confirmation policy",
    pathChirho: VISION_TIER_EXPERT_CONFIRMATION_POLICY_PATH_CHIRHO,
    existsKeyChirho: "visionTierExpertConfirmationPolicyExistsChirho",
    shapeOkKeyChirho: "visionTierExpertConfirmationPolicyShapeOkChirho",
    requiredChirho: true,
  },
  {
    labelChirho: "expert-supplied vision text backup",
    pathChirho: EXPERT_SUPPLIED_VISION_TEXT_BACKUP_PATH_CHIRHO,
    existsKeyChirho: "expertSuppliedVisionTextBackupExistsChirho",
    shapeOkKeyChirho: "expertSuppliedVisionTextBackupShapeOkChirho",
    requiredChirho: false,
  },
];

function parseJsonObjectChirho(pathChirho: string, textChirho: string): Record<string, unknown> {
  const parsedChirho = JSON.parse(textChirho) as unknown;
  assertGeneratedCheckChirho(
    parsedChirho !== null && typeof parsedChirho === "object" && !Array.isArray(parsedChirho),
    `${pathChirho} must contain a top-level JSON object`
  );
  return parsedChirho as Record<string, unknown>;
}

function assertJohn316MetadataChirho(pathChirho: string, artifactChirho: Record<string, unknown>): void {
  assertGeneratedCheckChirho(
    typeof artifactChirho.john316Chirho === "string" &&
      artifactChirho.john316Chirho.includes("For God so loved the world") &&
      artifactChirho.john316Chirho.includes("John 3:16"),
    `${pathChirho} is missing john316Chirho metadata`
  );
  assertGeneratedCheckChirho(
    typeof artifactChirho.schemaVersionChirho === "number" && Number.isInteger(artifactChirho.schemaVersionChirho),
    `${pathChirho} is missing integer schemaVersionChirho metadata`
  );
  assertGeneratedCheckChirho(
    typeof artifactChirho.generatedAtChirho === "string" && artifactChirho.generatedAtChirho.trim().length > 0,
    `${pathChirho} is missing generatedAtChirho metadata`
  );
}

function isLocalPathFieldChirho(keyChirho: string): boolean {
  return keyChirho.endsWith("PathChirho") || LOCAL_PATH_FIELD_NAMES_CHIRHO.has(keyChirho);
}

function assertLocalArtifactPathChirho(valueChirho: string, contextChirho: string): void {
  assertGeneratedCheckChirho(valueChirho.trim().length > 0, `${contextChirho} is an empty path`);
  assertGeneratedCheckChirho(
    !/^[a-z][a-z0-9+.-]*:/i.test(valueChirho),
    `${contextChirho} must be a local filesystem path: ${valueChirho}`
  );
  const projectRootChirho = resolve(PROJECT_ROOT_CHIRHO);
  const resolvedChirho = valueChirho.startsWith("/")
    ? resolve(valueChirho)
    : resolve(PROJECT_ROOT_CHIRHO, valueChirho);
  assertGeneratedCheckChirho(
    resolvedChirho === projectRootChirho || resolvedChirho.startsWith(`${projectRootChirho}${sep}`),
    `${contextChirho} escapes project root: ${valueChirho}`
  );
  assertGeneratedCheckChirho(existsSync(resolvedChirho), `${contextChirho} is missing: ${valueChirho}`);
}

function assertLocalPathFieldsChirho(pathChirho: string, valueChirho: unknown, contextChirho: string): void {
  if (Array.isArray(valueChirho)) {
    valueChirho.forEach((itemChirho, indexChirho) =>
      assertLocalPathFieldsChirho(pathChirho, itemChirho, `${contextChirho}[${indexChirho}]`)
    );
    return;
  }
  if (valueChirho === null || typeof valueChirho !== "object") return;
  for (const [keyChirho, childChirho] of Object.entries(valueChirho)) {
    const childContextChirho = `${contextChirho}.${keyChirho}`;
    if (isLocalPathFieldChirho(keyChirho) && typeof childChirho === "string") {
      assertLocalArtifactPathChirho(childChirho, childContextChirho);
    }
    assertLocalPathFieldsChirho(pathChirho, childChirho, childContextChirho);
  }
}

function artifactStatusBooleanChirho(
  artifactsChirho: CertificationStatusArtifactsChirho,
  keyChirho: string,
  labelChirho: string
): boolean {
  const valueChirho = artifactsChirho[keyChirho];
  assertGeneratedCheckChirho(typeof valueChirho === "boolean", `status artifacts missing boolean ${labelChirho}.${keyChirho}`);
  return valueChirho;
}

function checkArtifactChirho(
  artifactChirho: ActiveCertificationJsonArtifactChirho,
  artifactsChirho: CertificationStatusArtifactsChirho
): boolean {
  const actualExistsChirho = existsSync(artifactChirho.pathChirho);
  const statusExistsChirho = artifactStatusBooleanChirho(
    artifactsChirho,
    artifactChirho.existsKeyChirho,
    artifactChirho.labelChirho
  );
  const statusShapeOkChirho = artifactStatusBooleanChirho(
    artifactsChirho,
    artifactChirho.shapeOkKeyChirho,
    artifactChirho.labelChirho
  );
  assertGeneratedCheckChirho(
    statusExistsChirho === actualExistsChirho,
    `${artifactChirho.labelChirho} status existence does not match filesystem`
  );
  if (!actualExistsChirho) {
    assertGeneratedCheckChirho(!artifactChirho.requiredChirho, `${artifactChirho.labelChirho} is required but missing`);
    return false;
  }
  assertGeneratedCheckChirho(statusShapeOkChirho, `${artifactChirho.labelChirho} status shape check is not OK`);
  const textChirho = readFileSync(artifactChirho.pathChirho, "utf8");
  assertGeneratedTextHygieneChirho(artifactChirho.pathChirho, textChirho);
  const parsedChirho = parseJsonObjectChirho(artifactChirho.pathChirho, textChirho);
  assertJohn316MetadataChirho(artifactChirho.pathChirho, parsedChirho);
  assertLocalPathFieldsChirho(artifactChirho.pathChirho, parsedChirho, artifactChirho.labelChirho);
  return true;
}

function mainChirho(): void {
  assertGeneratedCheckChirho(existsSync(STATUS_JSON_PATH_CHIRHO), `missing generated status JSON: ${STATUS_JSON_PATH_CHIRHO}`);
  const statusTextChirho = readFileSync(STATUS_JSON_PATH_CHIRHO, "utf8");
  const statusJsonChirho = parseJsonObjectChirho(STATUS_JSON_PATH_CHIRHO, statusTextChirho) as CertificationStatusJsonChirho;
  assertGeneratedCheckChirho(
    statusJsonChirho.artifactsChirho !== null &&
      typeof statusJsonChirho.artifactsChirho === "object" &&
      !Array.isArray(statusJsonChirho.artifactsChirho),
    "status JSON missing artifactsChirho object"
  );
  let checkedCountChirho = 0;
  for (const artifactChirho of ACTIVE_CERTIFICATION_JSON_ARTIFACTS_CHIRHO) {
    if (checkArtifactChirho(artifactChirho, statusJsonChirho.artifactsChirho)) checkedCountChirho += 1;
  }
  console.log(`[${MODULE_CHIRHO}] active certification JSON artifact hygiene passed for ${checkedCountChirho} file(s)`);
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
