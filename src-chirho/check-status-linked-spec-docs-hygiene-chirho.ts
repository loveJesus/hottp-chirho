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
const RAW_HEBREW_QUICKSTART_DOC_CHIRHO = "spec-chirho/metropoliluya-chirho/raw-hebrew-human-certification-quickstart-2026-06-05-chirho.md";
const HALLELUJAH_SESSION_GUIDE_DOC_CHIRHO = "spec-chirho/metropoliluya-chirho/hallelujah-review-session-guide-2026-06-05-chirho.md";
const LOCAL_ARTIFACT_PREFIXES_CHIRHO = [
  "workspace-chirho/",
  "spec-chirho/",
  "src-chirho/",
  "app-chirho/",
];
const RAW_HEBREW_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "If no issue boxes are selected, a save is clean only when the clean-certification acknowledgement is checked.",
  "A dot inside a Hebrew letter is dagesh, mappiq, or shuruk, so classify it under Vowels/niqqud.",
  "Several Hebrew words in one span are acceptable only when the box intentionally covers exactly those words",
  "Flag segmentation when one of these is true:",
  "The stored text collapses or splits words differently from the print.",
  "If the row is not clearly attributable to you, do not reattribute it.",
  "If the current live text no longer matches the row's originally reviewed text, use Attribution re-review by default.",
  "When uncertain, skip or save an issue. Do not use a clean review to express \"probably right.\"",
] as const;
const HALLELUJAH_SESSION_GUIDE_SNIPPETS_CHIRHO = [
  "Leaving all issue boxes unchecked is clean only when the clean-certification acknowledgement is checked.",
  "A dot inside a Hebrew letter is usually dagesh or mappiq; inside vav for `וּ` it is shuruk.",
  "Flag `Segmentation` when the box or text has a wrong word boundary",
  "If the text is wrong, report an issue; do not confirm and hope a later correction fixes it.",
  "Attribution cleanup is not a shortcut around review.",
  "If the status report says live text changed, prefer re-review.",
  "If you are not sure who made the original decision, re-review instead of reattributing.",
  "Stop or skip when the crop is unclear, the script is outside your competence, the exact marks are uncertain",
] as const;

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

function assertDocContainsSnippetsChirho(docPathChirho: string, textChirho: string, snippetsChirho: readonly string[]): void {
  for (const snippetChirho of snippetsChirho) {
    assertGeneratedCheckChirho(
      textChirho.includes(snippetChirho),
      `${docPathChirho} is missing required review guidance: ${snippetChirho}`
    );
  }
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

  if (docPathChirho === RAW_HEBREW_QUICKSTART_DOC_CHIRHO) {
    assertDocContainsSnippetsChirho(docPathChirho, textChirho, RAW_HEBREW_REVIEW_GUIDANCE_SNIPPETS_CHIRHO);
  }
  if (docPathChirho === HALLELUJAH_SESSION_GUIDE_DOC_CHIRHO) {
    assertDocContainsSnippetsChirho(docPathChirho, textChirho, HALLELUJAH_SESSION_GUIDE_SNIPPETS_CHIRHO);
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
