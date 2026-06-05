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
  assertGeneratedCheckChirho(Array.isArray(statusChirho.remainingWorkChirho), "status JSON missing remainingWorkChirho array");
  const remainingWorkChirho = statusChirho.remainingWorkChirho;
  assertGeneratedCheckChirho(
    remainingWorkChirho.every((itemChirho) => typeof itemChirho === "string" && itemChirho.trim().length > 0),
    "status JSON remainingWorkChirho must contain only non-empty strings"
  );
  if (!statusChirho.certificationCompleteChirho) {
    assertGeneratedCheckChirho(remainingWorkChirho.length > 0, "incomplete status JSON has no remainingWorkChirho blockers");
  }
  for (const itemChirho of remainingWorkChirho as string[]) {
    assertGeneratedCheckChirho(
      markdownChirho.includes(itemChirho),
      `status Markdown does not display remaining-work blocker: ${itemChirho}`
    );
  }
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
