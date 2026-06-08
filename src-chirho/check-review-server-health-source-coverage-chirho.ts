// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync } from "fs";
import { dirname, relative, resolve } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  reviewServerSourceStaleErrorChirho,
  reviewServerSourceFilesChirho,
  reviewServerStartupHealthChirho,
  type ReviewServerKeyChirho,
} from "./review-server-health-chirho.ts";

const MODULE_CHIRHO = "check-review-server-health-source-coverage-chirho";

const REVIEW_SERVER_KEYS_CHIRHO: ReviewServerKeyChirho[] = [
  "raw-hebrew-chirho",
  "latin-symbol-chirho",
  "expert-non-latin-chirho",
];

const FROM_IMPORT_RE_CHIRHO = /\bfrom\s+["'](\.[^"']+)["']/g;
const SIDE_EFFECT_IMPORT_RE_CHIRHO = /\bimport\s+["'](\.[^"']+)["']/g;

interface MissingSourceImportChirho {
  keyChirho: ReviewServerKeyChirho;
  sourceFileChirho: string;
  importedFileChirho: string;
}

function projectRelativePathChirho(absolutePathChirho: string): string {
  return relative(PROJECT_ROOT_CHIRHO, absolutePathChirho).split(/[\\/]+/).join("/");
}

function candidateImportPathsChirho(sourceFileChirho: string, specifierChirho: string): string[] {
  const sourceDirChirho = dirname(resolve(PROJECT_ROOT_CHIRHO, sourceFileChirho));
  const resolvedBaseChirho = resolve(sourceDirChirho, specifierChirho);
  return [
    resolvedBaseChirho,
    `${resolvedBaseChirho}.ts`,
    resolve(resolvedBaseChirho, "index.ts"),
  ];
}

function resolvedProjectImportPathChirho(sourceFileChirho: string, specifierChirho: string): string | null {
  for (const candidatePathChirho of candidateImportPathsChirho(sourceFileChirho, specifierChirho)) {
    if (!existsSync(candidatePathChirho)) {
      continue;
    }
    const relativePathChirho = projectRelativePathChirho(candidatePathChirho);
    if (relativePathChirho.startsWith("..")) {
      return null;
    }
    if (!relativePathChirho.endsWith(".ts")) {
      return null;
    }
    return relativePathChirho;
  }
  return null;
}

function localImportPathsChirho(sourceFileChirho: string): string[] {
  const sourceTextChirho = readFileSync(resolve(PROJECT_ROOT_CHIRHO, sourceFileChirho), "utf8");
  const importedPathsChirho = new Set<string>();
  for (const importReChirho of [FROM_IMPORT_RE_CHIRHO, SIDE_EFFECT_IMPORT_RE_CHIRHO]) {
    importReChirho.lastIndex = 0;
    let matchChirho: RegExpExecArray | null;
    while ((matchChirho = importReChirho.exec(sourceTextChirho)) !== null) {
      const importedPathChirho = resolvedProjectImportPathChirho(sourceFileChirho, matchChirho[1] ?? "");
      if (importedPathChirho !== null) {
        importedPathsChirho.add(importedPathChirho);
      }
    }
  }
  return [...importedPathsChirho].sort();
}

function missingSourceImportsForKeyChirho(keyChirho: ReviewServerKeyChirho): MissingSourceImportChirho[] {
  const sourceFilesChirho = reviewServerSourceFilesChirho(keyChirho);
  const sourceFileSetChirho = new Set(sourceFilesChirho);
  const missingChirho: MissingSourceImportChirho[] = [];
  for (const sourceFileChirho of sourceFilesChirho) {
    for (const importedFileChirho of localImportPathsChirho(sourceFileChirho)) {
      if (sourceFileSetChirho.has(importedFileChirho)) {
        continue;
      }
      missingChirho.push({ keyChirho, sourceFileChirho, importedFileChirho });
    }
  }
  return missingChirho;
}

function assertCheckChirho(conditionChirho: boolean, messageChirho: string): asserts conditionChirho {
  if (!conditionChirho) throw new Error(messageChirho);
}

function assertStaleSourceChecksChirho(): void {
  for (const keyChirho of REVIEW_SERVER_KEYS_CHIRHO) {
    const freshHealthChirho = reviewServerStartupHealthChirho(keyChirho);
    assertCheckChirho(
      reviewServerSourceStaleErrorChirho(freshHealthChirho) === null,
      `${keyChirho} fresh startup health unexpectedly reports stale source`
    );
    const staleHealthChirho = {
      ...freshHealthChirho,
      sourceFingerprintChirho: "0".repeat(freshHealthChirho.sourceFingerprintChirho.length),
    };
    const staleErrorChirho = reviewServerSourceStaleErrorChirho(staleHealthChirho);
    assertCheckChirho(
      staleErrorChirho !== null && staleErrorChirho.includes("review server source changed since startup"),
      `${keyChirho} stale startup health did not report source drift`
    );
  }
}

function mainChirho(): void {
  const missingChirho = REVIEW_SERVER_KEYS_CHIRHO.flatMap((keyChirho) => missingSourceImportsForKeyChirho(keyChirho));
  if (missingChirho.length > 0) {
    console.error(`[${MODULE_CHIRHO}] review server source fingerprint lists are missing imported local files:`);
    for (const itemChirho of missingChirho) {
      console.error(
        `[${MODULE_CHIRHO}] ${itemChirho.keyChirho}: ${itemChirho.sourceFileChirho} imports ${itemChirho.importedFileChirho}`
      );
    }
    process.exit(1);
  }
  assertStaleSourceChecksChirho();
  console.log(`[${MODULE_CHIRHO}] review server source fingerprint lists cover local imports`);
}

if (import.meta.main) {
  mainChirho();
}
