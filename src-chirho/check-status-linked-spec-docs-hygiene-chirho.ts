// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify the current spec/handoff Markdown documents linked by certification
 * status. Older audit notes can remain archival; this checks the live handoff
 * surface reviewers are directed to use.
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  assertGeneratedCheckChirho,
  assertGeneratedTextHygieneChirho,
} from "./generated-output-hygiene-chirho.ts";

const MODULE_CHIRHO = "check-status-linked-spec-docs-hygiene-chirho";
const STATUS_MARKDOWN_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "status-chirho.md"
);
const STATUS_SPEC_DOC_RE_CHIRHO = /`(spec-chirho\/metropoliluya-chirho\/[^`\n]+\.md)`/g;
const MARKDOWN_IMAGE_RE_CHIRHO = /!\[[^\]\n]*\]\(([^)\n]+)\)/g;
const BACKTICK_RE_CHIRHO = /`([^`\n]+)`/g;
const LOCAL_ARTIFACT_PREFIXES_CHIRHO = [
  "workspace-chirho/",
  "spec-chirho/",
  "src-chirho/",
  "app-chirho/",
];

function isLocalArtifactPathChirho(valueChirho: string): boolean {
  return LOCAL_ARTIFACT_PREFIXES_CHIRHO.some((prefixChirho) => valueChirho.startsWith(prefixChirho));
}

function assertProjectRelativePathExistsChirho(pathChirho: string, contextChirho: string): void {
  const projectRootChirho = resolve(PROJECT_ROOT_CHIRHO);
  const resolvedChirho = resolve(PROJECT_ROOT_CHIRHO, pathChirho);
  assertGeneratedCheckChirho(
    resolvedChirho === projectRootChirho || resolvedChirho.startsWith(`${projectRootChirho}${sep}`),
    `${contextChirho} escapes project root: ${pathChirho}`
  );
  assertGeneratedCheckChirho(existsSync(resolvedChirho), `${contextChirho} is missing: ${pathChirho}`);
}

function assertRelativeDocImageExistsChirho(docPathChirho: string, imagePathChirho: string): void {
  assertGeneratedCheckChirho(
    !imagePathChirho.startsWith("/") && !/^[a-z][a-z0-9+.-]*:/i.test(imagePathChirho),
    `${docPathChirho} image path must be relative: ${imagePathChirho}`
  );
  const docDirChirho = dirname(docPathChirho);
  const resolvedChirho = resolve(docDirChirho, imagePathChirho);
  const projectRootChirho = resolve(PROJECT_ROOT_CHIRHO);
  assertGeneratedCheckChirho(
    resolvedChirho === projectRootChirho || resolvedChirho.startsWith(`${projectRootChirho}${sep}`),
    `${docPathChirho} image path escapes project root: ${imagePathChirho}`
  );
  assertGeneratedCheckChirho(existsSync(resolvedChirho), `${docPathChirho} image path is missing: ${imagePathChirho}`);
}

function linkedSpecDocPathsChirho(statusMarkdownChirho: string): string[] {
  return [...new Set([...statusMarkdownChirho.matchAll(STATUS_SPEC_DOC_RE_CHIRHO)].map((matchChirho) => matchChirho[1]!))].sort();
}

function checkSpecDocChirho(docPathChirho: string): void {
  assertProjectRelativePathExistsChirho(docPathChirho, "status-linked spec document");
  const absolutePathChirho = join(PROJECT_ROOT_CHIRHO, docPathChirho);
  const textChirho = readFileSync(absolutePathChirho, "utf8");
  assertGeneratedTextHygieneChirho(absolutePathChirho, textChirho);
  assertGeneratedCheckChirho(
    textChirho.slice(0, 300).includes("For God so loved the world") &&
      textChirho.slice(0, 350).includes("John 3:16"),
    `${docPathChirho} is missing the John 3:16 header`
  );

  for (const matchChirho of textChirho.matchAll(BACKTICK_RE_CHIRHO)) {
    const valueChirho = matchChirho[1]!;
    if (isLocalArtifactPathChirho(valueChirho)) {
      assertProjectRelativePathExistsChirho(valueChirho, `${docPathChirho} local artifact reference`);
    }
  }
  for (const matchChirho of textChirho.matchAll(MARKDOWN_IMAGE_RE_CHIRHO)) {
    assertRelativeDocImageExistsChirho(absolutePathChirho, matchChirho[1]!);
  }
}

function mainChirho(): void {
  assertGeneratedCheckChirho(existsSync(STATUS_MARKDOWN_PATH_CHIRHO), `missing status Markdown: ${STATUS_MARKDOWN_PATH_CHIRHO}`);
  const statusMarkdownChirho = readFileSync(STATUS_MARKDOWN_PATH_CHIRHO, "utf8");
  const docsChirho = linkedSpecDocPathsChirho(statusMarkdownChirho);
  assertGeneratedCheckChirho(docsChirho.length > 0, "status Markdown does not link any spec/handoff documents");
  for (const docPathChirho of docsChirho) {
    checkSpecDocChirho(docPathChirho);
  }
  console.log(`[${MODULE_CHIRHO}] status-linked spec document hygiene passed for ${docsChirho.length} document(s)`);
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
