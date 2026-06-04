// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { join } from "path";
import { fileURLToPath } from "url";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { sourceFingerprintForPathsChirho, type SourceFingerprintChirho } from "./source-fingerprint-chirho.ts";

const STRICT_BLIND_SCANNER_SOURCE_FINGERPRINT_HELPER_PATH_CHIRHO = fileURLToPath(import.meta.url);

const STRICT_BLIND_SCANNER_DEPENDENCY_PATHS_CHIRHO = [
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "config-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "source-fingerprint-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "span-line-text-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "span-nfc-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "text-normalization-chirho.ts"),
  STRICT_BLIND_SCANNER_SOURCE_FINGERPRINT_HELPER_PATH_CHIRHO,
] as const;

export function strictBlindScannerSourceFingerprintChirho(scannerPathChirho: string): SourceFingerprintChirho {
  return sourceFingerprintForPathsChirho([
    scannerPathChirho,
    ...STRICT_BLIND_SCANNER_DEPENDENCY_PATHS_CHIRHO,
  ]);
}
