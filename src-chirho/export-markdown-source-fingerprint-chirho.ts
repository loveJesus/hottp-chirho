// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  sourceFingerprintForPathsChirho,
  type SourceFingerprintChirho,
} from "./source-fingerprint-chirho.ts";

export const EXPORT_MARKDOWN_SOURCE_PATHS_CHIRHO = [
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "export-markdown-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "export-markdown-source-fingerprint-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "span-line-text-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "text-normalization-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "config-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "source-fingerprint-chirho.ts"),
  join(PROJECT_ROOT_CHIRHO, "src-chirho", "d1-audit-fingerprint-chirho.ts"),
] as const;

export function exportMarkdownSourceFingerprintChirho(): SourceFingerprintChirho {
  return sourceFingerprintForPathsChirho([...EXPORT_MARKDOWN_SOURCE_PATHS_CHIRHO]);
}
