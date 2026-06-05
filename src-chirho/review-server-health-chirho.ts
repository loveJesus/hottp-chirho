// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { createHash as createHashChirho } from "crypto";
import { readFileSync } from "fs";
import { join, relative } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

export type ReviewServerKeyChirho =
  | "raw-hebrew-chirho"
  | "latin-symbol-chirho"
  | "expert-non-latin-chirho";

export interface ReviewServerSourceFingerprintChirho {
  sourceFingerprintChirho: string;
  sourceFileCountChirho: number;
}

export interface ReviewServerHealthChirho extends ReviewServerSourceFingerprintChirho {
  schemaVersionChirho: 1;
  keyChirho: ReviewServerKeyChirho;
  startedAtChirho: string;
}

const COMMON_REVIEW_SERVER_SOURCE_FILES_CHIRHO = [
  "src-chirho/config-chirho.ts",
  "src-chirho/review-server-health-chirho.ts",
  "src-chirho/reviewer-attribution-chirho.ts",
  "src-chirho/text-normalization-chirho.ts",
] as const;

const REVIEW_SERVER_SOURCE_FILES_BY_KEY_CHIRHO: Record<ReviewServerKeyChirho, readonly string[]> = {
  "raw-hebrew-chirho": [
    ...COMMON_REVIEW_SERVER_SOURCE_FILES_CHIRHO,
    "src-chirho/pass-c-human-validate-server-chirho.ts",
    "src-chirho/pass-c-human-validation-backup-chirho.ts",
    "src-chirho/raw-hebrew-pre-review-notes-chirho.ts",
    "src-chirho/raw-hebrew-review-tier-chirho.ts",
    "src-chirho/raw-hebrew-review-triage-chirho.ts",
    "src-chirho/span-line-text-chirho.ts",
    "src-chirho/template-placeholder-chirho.ts",
    "src-chirho/atomic-json-chirho.ts",
  ],
  "latin-symbol-chirho": [
    ...COMMON_REVIEW_SERVER_SOURCE_FILES_CHIRHO,
    "src-chirho/latin-symbol-vision-review-server-chirho.ts",
    "src-chirho/latin-symbol-vision-acceptance-policy-chirho.ts",
    "src-chirho/latin-symbol-vision-live-items-chirho.ts",
    "src-chirho/latin-symbol-vision-review-store-chirho.ts",
    "src-chirho/packet-image-fingerprint-chirho.ts",
    "src-chirho/source-fingerprint-chirho.ts",
    "src-chirho/span-line-text-chirho.ts",
    "src-chirho/template-placeholder-chirho.ts",
    "src-chirho/atomic-json-chirho.ts",
  ],
  "expert-non-latin-chirho": [
    ...COMMON_REVIEW_SERVER_SOURCE_FILES_CHIRHO,
    "src-chirho/vision-tier-expert-review-server-chirho.ts",
    "src-chirho/vision-tier-expert-confirmation-policy-chirho.ts",
    "src-chirho/vision-tier-expert-live-items-chirho.ts",
    "src-chirho/packet-image-fingerprint-chirho.ts",
    "src-chirho/template-placeholder-chirho.ts",
    "src-chirho/atomic-json-chirho.ts",
  ],
};

export function reviewServerSourceFilesChirho(keyChirho: ReviewServerKeyChirho): string[] {
  return [...new Set(REVIEW_SERVER_SOURCE_FILES_BY_KEY_CHIRHO[keyChirho])].sort();
}

export function reviewServerSourceFingerprintChirho(
  keyChirho: ReviewServerKeyChirho
): ReviewServerSourceFingerprintChirho {
  const hashChirho = createHashChirho("sha256");
  const filesChirho = reviewServerSourceFilesChirho(keyChirho);
  for (const relativePathChirho of filesChirho) {
    const absolutePathChirho = join(PROJECT_ROOT_CHIRHO, relativePathChirho);
    const portablePathChirho = relative(PROJECT_ROOT_CHIRHO, absolutePathChirho);
    hashChirho.update(portablePathChirho);
    hashChirho.update("\0");
    hashChirho.update(readFileSync(absolutePathChirho));
    hashChirho.update("\0");
  }
  return {
    sourceFingerprintChirho: hashChirho.digest("hex"),
    sourceFileCountChirho: filesChirho.length,
  };
}

export function reviewServerStartupHealthChirho(keyChirho: ReviewServerKeyChirho): ReviewServerHealthChirho {
  return {
    schemaVersionChirho: 1,
    keyChirho,
    startedAtChirho: new Date().toISOString(),
    ...reviewServerSourceFingerprintChirho(keyChirho),
  };
}
