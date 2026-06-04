// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { createHash } from "crypto";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, relative } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const DEFAULT_SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const LINE_FILE_RE_CHIRHO = /^line-(\d+)-chirho\.json$/;

export interface FingerprintTargetChirho {
  volumeChirho: number;
  pageChirho: number;
}

export interface SourceFingerprintChirho {
  fileCountChirho: number;
  sha256Chirho: string;
}

function parseLineFileNameChirho(nameChirho: string): number | null {
  const matchChirho = nameChirho.match(LINE_FILE_RE_CHIRHO);
  return matchChirho ? Number.parseInt(matchChirho[1]!, 10) : null;
}

export function spanLinePathsForTargetsChirho(
  targetsChirho: FingerprintTargetChirho[],
  spansRootChirho = DEFAULT_SPANS_ROOT_CHIRHO
): string[] {
  const pathsChirho: string[] = [];
  for (const targetChirho of targetsChirho) {
    const pageDirChirho = join(
      spansRootChirho,
      `vol-${targetChirho.volumeChirho}-chirho`,
      `page-${String(targetChirho.pageChirho).padStart(4, "0")}-chirho`
    );
    if (!existsSync(pageDirChirho)) continue;
    const linePathsChirho = readdirSync(pageDirChirho)
      .map((fileChirho) => ({
        fileChirho,
        lineIndexChirho: parseLineFileNameChirho(fileChirho),
      }))
      .filter((itemChirho): itemChirho is { fileChirho: string; lineIndexChirho: number } =>
        itemChirho.lineIndexChirho !== null
      )
      .sort((aChirho, bChirho) => aChirho.lineIndexChirho - bChirho.lineIndexChirho)
      .map((itemChirho) => join(pageDirChirho, itemChirho.fileChirho));
    pathsChirho.push(...linePathsChirho);
  }
  return pathsChirho;
}

export function sourceFingerprintForPathsChirho(pathsChirho: string[]): SourceFingerprintChirho {
  const hashChirho = createHash("sha256");
  const sortedPathsChirho = [...pathsChirho].sort();
  for (const pathChirho of sortedPathsChirho) {
    hashChirho.update(relative(PROJECT_ROOT_CHIRHO, pathChirho));
    hashChirho.update("\0");
    hashChirho.update(readFileSync(pathChirho));
    hashChirho.update("\0");
  }
  return {
    fileCountChirho: sortedPathsChirho.length,
    sha256Chirho: hashChirho.digest("hex"),
  };
}

export function spanSourceFingerprintForTargetsChirho(
  targetsChirho: FingerprintTargetChirho[],
  spansRootChirho = DEFAULT_SPANS_ROOT_CHIRHO
): SourceFingerprintChirho {
  return sourceFingerprintForPathsChirho(spanLinePathsForTargetsChirho(targetsChirho, spansRootChirho));
}
