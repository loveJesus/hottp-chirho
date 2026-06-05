// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify the durable vision-verdict provenance backup is mechanically clean.
 *
 * This backup records non-certifying vision/provenance reads, including some
 * deliberately blank deferred spans. It is not a certification-retiring policy.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  assertGeneratedCheckChirho,
  assertGeneratedTextHygieneChirho,
} from "./generated-output-hygiene-chirho.ts";

const MODULE_CHIRHO = "check-vision-verdict-backup-hygiene-chirho";
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const VISION_VERDICT_BACKUP_SCHEMA_VERSION_CHIRHO = 1;
const VISION_VERDICT_SCRIPT_VALUES_CHIRHO = new Set([
  "arabic-chirho",
  "french-chirho",
  "greek-chirho",
  "hebrew-chirho",
  "latin-non-french-chirho",
  "symbol-chirho",
  "syriac-chirho",
]);

interface VisionVerdictBackupFileChirho {
  john316Chirho?: unknown;
  schemaVersionChirho?: unknown;
  generatedAtChirho?: unknown;
  sourceChirho?: unknown;
  countChirho?: unknown;
  reapplyChirho?: unknown;
  verdictsChirho?: unknown;
}

interface VisionVerdictRowChirho {
  volumeChirho?: unknown;
  pageChirho?: unknown;
  lineIndexChirho?: unknown;
  segmentIndexChirho?: unknown;
  garbleTextChirho?: unknown;
  scriptChirho?: unknown;
  utf8TextChirho?: unknown;
  notesChirho?: unknown;
}

function parseJsonObjectChirho(pathChirho: string, textChirho: string): Record<string, unknown> {
  const parsedChirho = JSON.parse(textChirho) as unknown;
  assertGeneratedCheckChirho(
    parsedChirho !== null && typeof parsedChirho === "object" && !Array.isArray(parsedChirho),
    `${pathChirho} must contain a top-level JSON object`
  );
  return parsedChirho as Record<string, unknown>;
}

function nonEmptyStringChirho(valueChirho: unknown): valueChirho is string {
  return typeof valueChirho === "string" && valueChirho.trim().length > 0;
}

function positiveIntegerChirho(valueChirho: unknown): valueChirho is number {
  return Number.isInteger(valueChirho) && (valueChirho as number) > 0;
}

function nonNegativeIntegerChirho(valueChirho: unknown): valueChirho is number {
  return Number.isInteger(valueChirho) && (valueChirho as number) >= 0;
}

function rowKeyChirho(rowChirho: VisionVerdictRowChirho): string {
  return [
    rowChirho.volumeChirho,
    rowChirho.pageChirho,
    rowChirho.lineIndexChirho,
    rowChirho.segmentIndexChirho,
  ].join(":");
}

function assertBackupMetadataChirho(pathChirho: string, backupChirho: VisionVerdictBackupFileChirho): void {
  assertGeneratedCheckChirho(
    nonEmptyStringChirho(backupChirho.john316Chirho) &&
      backupChirho.john316Chirho.includes("For God so loved the world") &&
      backupChirho.john316Chirho.includes("John 3:16"),
    `${pathChirho} is missing john316Chirho metadata`
  );
  assertGeneratedCheckChirho(
    backupChirho.schemaVersionChirho === VISION_VERDICT_BACKUP_SCHEMA_VERSION_CHIRHO,
    `${pathChirho} schemaVersionChirho must be ${VISION_VERDICT_BACKUP_SCHEMA_VERSION_CHIRHO}`
  );
  assertGeneratedCheckChirho(nonEmptyStringChirho(backupChirho.generatedAtChirho), `${pathChirho} missing generatedAtChirho`);
  assertGeneratedCheckChirho(nonEmptyStringChirho(backupChirho.sourceChirho), `${pathChirho} missing sourceChirho`);
  assertGeneratedCheckChirho(nonEmptyStringChirho(backupChirho.reapplyChirho), `${pathChirho} missing reapplyChirho`);
  assertGeneratedCheckChirho(Array.isArray(backupChirho.verdictsChirho), `${pathChirho} verdictsChirho must be an array`);
  assertGeneratedCheckChirho(
    backupChirho.countChirho === backupChirho.verdictsChirho.length,
    `${pathChirho} countChirho does not match verdictsChirho length`
  );
}

function assertVisionVerdictRowChirho(rowChirho: unknown, indexChirho: number, seenKeysChirho: Set<string>): void {
  const prefixChirho = `verdictsChirho[${indexChirho}]`;
  assertGeneratedCheckChirho(
    rowChirho !== null && typeof rowChirho === "object" && !Array.isArray(rowChirho),
    `${prefixChirho} must be an object`
  );
  const rowObjectChirho = rowChirho as VisionVerdictRowChirho;
  assertGeneratedCheckChirho(positiveIntegerChirho(rowObjectChirho.volumeChirho), `${prefixChirho}.volumeChirho must be positive integer`);
  assertGeneratedCheckChirho(positiveIntegerChirho(rowObjectChirho.pageChirho), `${prefixChirho}.pageChirho must be positive integer`);
  assertGeneratedCheckChirho(nonNegativeIntegerChirho(rowObjectChirho.lineIndexChirho), `${prefixChirho}.lineIndexChirho must be non-negative integer`);
  assertGeneratedCheckChirho(nonNegativeIntegerChirho(rowObjectChirho.segmentIndexChirho), `${prefixChirho}.segmentIndexChirho must be non-negative integer`);
  assertGeneratedCheckChirho(nonEmptyStringChirho(rowObjectChirho.garbleTextChirho), `${prefixChirho}.garbleTextChirho must be non-empty string`);
  assertGeneratedCheckChirho(
    nonEmptyStringChirho(rowObjectChirho.scriptChirho) && VISION_VERDICT_SCRIPT_VALUES_CHIRHO.has(rowObjectChirho.scriptChirho),
    `${prefixChirho}.scriptChirho has unexpected value`
  );
  assertGeneratedCheckChirho(typeof rowObjectChirho.utf8TextChirho === "string", `${prefixChirho}.utf8TextChirho must be a string`);
  assertGeneratedCheckChirho(nonEmptyStringChirho(rowObjectChirho.notesChirho), `${prefixChirho}.notesChirho must be non-empty string`);
  const keyChirho = rowKeyChirho(rowObjectChirho);
  assertGeneratedCheckChirho(!seenKeysChirho.has(keyChirho), `${prefixChirho} duplicates span key ${keyChirho}`);
  seenKeysChirho.add(keyChirho);
}

function mainChirho(): void {
  assertGeneratedCheckChirho(existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO), `missing vision verdict backup: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const textChirho = readFileSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO, "utf8");
  assertGeneratedTextHygieneChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, textChirho);
  const backupChirho = parseJsonObjectChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, textChirho) as VisionVerdictBackupFileChirho;
  assertBackupMetadataChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  const seenKeysChirho = new Set<string>();
  const verdictRowsChirho = backupChirho.verdictsChirho;
  assertGeneratedCheckChirho(Array.isArray(verdictRowsChirho), `${VISION_VERDICTS_BACKUP_PATH_CHIRHO} verdictsChirho must be an array`);
  verdictRowsChirho.forEach((rowChirho: unknown, indexChirho: number) =>
    assertVisionVerdictRowChirho(rowChirho, indexChirho, seenKeysChirho)
  );
  console.log(`[${MODULE_CHIRHO}] vision verdict backup hygiene passed for ${seenKeysChirho.size} row(s)`);
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
