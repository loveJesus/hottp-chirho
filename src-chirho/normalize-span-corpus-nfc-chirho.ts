// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Normalize span text fields to NFC. This is intentionally limited to
 * canonical-equivalent Unicode normalization; it must not repair OCR text.
 *
 * Dry-run default:
 *   bun run normalize-span-corpus-nfc-chirho
 *
 * Apply:
 *   bun run normalize-span-corpus-nfc-chirho --apply
 */

import { readFileSync } from "fs";
import { join } from "path";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  normalizeSpanLineTextFieldsChirho,
  scanNonNfcSpanTextFieldsChirho,
  SPAN_NFC_TEXT_FIELDS_CHIRHO,
  type SpanLineLikeChirho,
} from "./span-nfc-chirho.ts";

const MODULE_CHIRHO = "normalize-span-corpus-nfc-chirho";
const REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "nfc-normalization-chirho",
  "report-chirho.json"
);

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const applyChirho = argsChirho.includes("--apply");
  const reportPathChirho = parseArgValueChirho(argsChirho, "report") ?? REPORT_PATH_CHIRHO;
  const findingsChirho = scanNonNfcSpanTextFieldsChirho();
  const changedFilesChirho = new Set(findingsChirho.map((findingChirho) => findingChirho.filePathChirho));

  if (applyChirho) {
    for (const filePathChirho of [...changedFilesChirho].sort()) {
      const lineChirho = JSON.parse(readFileSync(filePathChirho, "utf8")) as SpanLineLikeChirho;
      normalizeSpanLineTextFieldsChirho(lineChirho);
      writeJsonAtomicChirho(filePathChirho, lineChirho);
    }
  }

  const reportChirho = {
    john316Chirho:
      "For God so loved the world that he gave his only begotten Son, that whoever believes in him should not perish but have eternal life. John 3:16",
    generatedAtChirho: new Date().toISOString(),
    appliedChirho: applyChirho,
    scannedFieldsChirho: [...SPAN_NFC_TEXT_FIELDS_CHIRHO],
    nonNfcFieldCountChirho: findingsChirho.length,
    changedFileCountChirho: changedFilesChirho.size,
    canonicalEquivalenceChirho: "Every listed change is oldText.normalize('NFC') and NFD-equal to the old text.",
    findingsChirho: findingsChirho.map((findingChirho) => ({
      relativePathChirho: findingChirho.relativePathChirho,
      volumeChirho: findingChirho.volumeChirho,
      pageChirho: findingChirho.pageChirho,
      lineIndexChirho: findingChirho.lineIndexChirho,
      segmentIndexChirho: findingChirho.segmentIndexChirho,
      scriptChirho: findingChirho.scriptChirho,
      fieldNameChirho: findingChirho.fieldNameChirho,
      textChirho: findingChirho.textChirho,
      normalizedTextChirho: findingChirho.normalizedTextChirho,
    })),
  };

  writeJsonAtomicChirho(reportPathChirho, reportChirho);
  console.log(
    `[${MODULE_CHIRHO}] applied=${applyChirho} nonNfcFields=${findingsChirho.length} ` +
      `changedFiles=${changedFilesChirho.size} report=${reportPathChirho}`
  );
}

if (import.meta.main) mainChirho();
