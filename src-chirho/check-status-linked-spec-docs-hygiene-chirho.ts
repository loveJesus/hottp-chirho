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
const STATUS_JSON_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "certification-status-chirho",
  "status-chirho.json"
);
const STATUS_SPEC_DOC_RE_CHIRHO = /`(spec-chirho\/metropoliluya-chirho\/[^`\n]+\.md)`/g;
const MARKDOWN_IMAGE_RE_CHIRHO = /!\[[^\]\n]*\]\(([^)\n]+)\)/g;
const BACKTICK_RE_CHIRHO = /`([^`\n]+)`/g;
const RAW_HEBREW_QUICKSTART_DOC_CHIRHO = "spec-chirho/metropoliluya-chirho/raw-hebrew-human-certification-quickstart-2026-06-05-chirho.md";
const LATIN_SYMBOL_QUICKSTART_DOC_CHIRHO = "spec-chirho/metropoliluya-chirho/latin-symbol-human-review-quickstart-2026-06-05-chirho.md";
const EXPERT_QUICKSTART_DOC_CHIRHO = "spec-chirho/metropoliluya-chirho/vision-tier-expert-confirmation-quickstart-2026-06-05-chirho.md";
const HALLELUJAH_SESSION_GUIDE_DOC_CHIRHO = "spec-chirho/metropoliluya-chirho/hallelujah-review-session-guide-2026-06-05-chirho.md";
const REVIEWER_SCOPE_PRIMER_DOC_CHIRHO = "spec-chirho/metropoliluya-chirho/reviewer-scope-and-primer-2026-06-02-chirho.md";
const TRANSCRIPTION_STATUS_PRODUCTION_PATH_DOC_CHIRHO =
  "spec-chirho/metropoliluya-chirho/transcription-status-and-production-path-2026-06-03-chirho.md";
const LOCAL_ARTIFACT_PREFIXES_CHIRHO = [
  "workspace-chirho/",
  "spec-chirho/",
  "src-chirho/",
  "app-chirho/",
];
const RAW_HEBREW_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "Before a review session, run `bun run publication-readiness-summary-chirho` for the current first-pending raw Hebrew links",
  "The summary is a live triage aid only; it does not certify text",
  "`Target crop - red box is the item` and `Full line - red box in context` panels",
  "If no issue boxes are selected, a save is clean only when the clean-certification acknowledgement is checked.",
  "A dot inside a Hebrew letter is dagesh, mappiq, or shuruk, so classify it under Vowels/niqqud.",
  "Several Hebrew words in one span are acceptable only when the box intentionally covers exactly those words",
  "Flag segmentation when one of these is true:",
  "The stored text collapses or splits words differently from the print.",
  "If the row is not clearly attributable to you, do not reattribute it.",
  "If the current live text no longer matches the row's originally reviewed text, use Attribution re-review by default.",
  "When uncertain, skip or save an issue. Do not use a clean review to express \"probably right.\"",
] as const;
const LATIN_SYMBOL_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "Accept as clean only when the `Target crop - red box is the item`, `Full line - red box in context`, current text, codepoints, script, and box all match the print exactly.",
  "Witness sigla matter.",
  "Digits and references matter.",
  "The displayed image path and crop are part of the review.",
  "When uncertain, skip or save an issue. Do not use clean review to express \"probably right.\"",
] as const;
const EXPERT_REVIEW_GUIDANCE_SNIPPETS_CHIRHO = [
  "Use the `Target crop - red box is the item` panel as the exact review boundary.",
  "`Printed line - red box in context` panel shows neighboring text for orientation only.",
  "The red box marks the span being reviewed",
  "For blank items, supply only the exact script text inside the red box.",
  "Do not include surrounding context just because it appears in the full printed line.",
  "Confirm only if you are competent for the displayed script and the current text exactly matches the printed scanline.",
  "Blank items are known content holes. Do not confirm a blank item.",
] as const;
const HALLELUJAH_SESSION_GUIDE_SNIPPETS_CHIRHO = [
  "Run `bun run publication-readiness-summary-chirho` for the current first-pending links and blocker counts.",
  "This summary does not certify anything; it is a live triage map.",
  "Leaving all issue boxes unchecked is clean only when the clean-certification acknowledgement is checked.",
  "A dot inside a Hebrew letter is usually dagesh or mappiq; inside vav for `וּ` it is shuruk.",
  "Flag `Segmentation` when the box or text has a wrong word boundary",
  "If the text is wrong, report an issue; do not confirm and hope a later correction fixes it.",
  "Attribution cleanup is not a shortcut around review.",
  "If the status report says live text changed, prefer re-review.",
  "If you are not sure who made the original decision, re-review instead of reattributing.",
  "Stop or skip when the crop is unclear, the script is outside your competence, the exact marks are uncertain",
] as const;
const REVIEWER_SCOPE_PRIMER_SNIPPETS_CHIRHO = [
  "Hebrew-script Aramaic/Targum: do not treat this as ordinary Hebrew.",
  "Syriac: route to a Syriac reader.",
  "Arabic: route to an Arabist.",
  "Syriac script orientation: HMML School",
  "Aramaic/Targum reference: CAL",
  "Arabic romanization/reference boundary",
  "These notes are only for orientation and triage. They do not make a non-reader competent to certify the scripts.",
  "Exact letters, joined forms, dots, vowels, punctuation, word spacing",
  "Confirm only when the printed line and stored text agree at the level the queue is asking for.",
] as const;

interface StatusLinkedSpecDocsStatusChirho {
  structuralChirho?: unknown;
  strictBlindScansChirho?: unknown;
  visionTierChirho?: unknown;
  latinSymbolVisionChirho?: unknown;
  humanValidationDbChirho?: unknown;
}

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

function assertDocOmitsSnippetsChirho(docPathChirho: string, textChirho: string, snippetsChirho: readonly string[]): void {
  for (const snippetChirho of snippetsChirho) {
    assertGeneratedCheckChirho(
      !textChirho.includes(snippetChirho),
      `${docPathChirho} contains deprecated or overclaiming wording: ${snippetChirho}`
    );
  }
}

function recordFieldChirho(valueChirho: unknown, labelChirho: string): Record<string, unknown> {
  assertGeneratedCheckChirho(
    valueChirho !== null && typeof valueChirho === "object" && !Array.isArray(valueChirho),
    `${labelChirho} must be an object`
  );
  return valueChirho as Record<string, unknown>;
}

function numberFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): number {
  const recordChirho = recordFieldChirho(valueChirho, labelChirho);
  const fieldChirho = recordChirho[keyChirho];
  assertGeneratedCheckChirho(typeof fieldChirho === "number", `${labelChirho}.${keyChirho} must be a number`);
  return fieldChirho;
}

function booleanFieldChirho(valueChirho: unknown, keyChirho: string, labelChirho: string): boolean {
  const recordChirho = recordFieldChirho(valueChirho, labelChirho);
  const fieldChirho = recordChirho[keyChirho];
  assertGeneratedCheckChirho(typeof fieldChirho === "boolean", `${labelChirho}.${keyChirho} must be a boolean`);
  return fieldChirho;
}

function countMapValueChirho(valueChirho: unknown, keyChirho: string, itemKeyChirho: string, labelChirho: string): number {
  const recordChirho = recordFieldChirho(valueChirho, labelChirho);
  const fieldChirho = recordFieldChirho(recordChirho[keyChirho], `${labelChirho}.${keyChirho}`);
  const countChirho = fieldChirho[itemKeyChirho];
  assertGeneratedCheckChirho(
    typeof countChirho === "number" || countChirho === undefined,
    `${labelChirho}.${keyChirho}.${itemKeyChirho} must be a number when present`
  );
  return countChirho ?? 0;
}

function formattedNumberChirho(valueChirho: number): string {
  return valueChirho.toLocaleString("en-US");
}

function assertScannerFreshChirho(scanChirho: Record<string, unknown>, labelChirho: string, summaryFieldChirho: string): void {
  assertGeneratedCheckChirho(booleanFieldChirho(scanChirho, "reportShapeOkChirho", labelChirho), `${labelChirho} report shape is not OK`);
  assertGeneratedCheckChirho(
    booleanFieldChirho(scanChirho, "scannerSourceFingerprintMatchesCurrentChirho", labelChirho),
    `${labelChirho} scanner source fingerprint does not match current source`
  );
  assertGeneratedCheckChirho(
    booleanFieldChirho(scanChirho, "spanSourceFingerprintMatchesCurrentChirho", labelChirho),
    `${labelChirho} span source fingerprint does not match current spans`
  );
  assertGeneratedCheckChirho(
    booleanFieldChirho(scanChirho, summaryFieldChirho, labelChirho),
    `${labelChirho} rendered summary counts do not match report rows`
  );
}

function assertProductionPathCountsChirho(
  docPathChirho: string,
  textChirho: string,
  statusChirho: StatusLinkedSpecDocsStatusChirho
): void {
  const structuralChirho = statusChirho.structuralChirho;
  const visionTierChirho = statusChirho.visionTierChirho;
  const latinSymbolChirho = statusChirho.latinSymbolVisionChirho;
  const humanValidationDbChirho = statusChirho.humanValidationDbChirho;
  const strictBlindScansChirho = recordFieldChirho(statusChirho.strictBlindScansChirho, "strictBlindScansChirho");
  const hiddenHebrewScanChirho = recordFieldChirho(
    strictBlindScansChirho.hiddenHebrewChirho,
    "strictBlindScansChirho.hiddenHebrewChirho"
  );
  const nonLatinResidueScanChirho = recordFieldChirho(
    strictBlindScansChirho.nonLatinResidueChirho,
    "strictBlindScansChirho.nonLatinResidueChirho"
  );
  const hebrewDelimiterScanChirho = recordFieldChirho(
    strictBlindScansChirho.hebrewDelimiterOrderChirho,
    "strictBlindScansChirho.hebrewDelimiterOrderChirho"
  );
  assertScannerFreshChirho(
    hiddenHebrewScanChirho,
    "strictBlindScansChirho.hiddenHebrewChirho",
    "summaryCountsMatchRenderedCandidatesChirho"
  );
  assertScannerFreshChirho(
    nonLatinResidueScanChirho,
    "strictBlindScansChirho.nonLatinResidueChirho",
    "summaryCountsMatchRenderedCandidatesChirho"
  );
  assertScannerFreshChirho(
    hebrewDelimiterScanChirho,
    "strictBlindScansChirho.hebrewDelimiterOrderChirho",
    "summaryCountsMatchRenderedRowsChirho"
  );
  const volumeCountChirho = numberFieldChirho(structuralChirho, "markdownVolumeFingerprintCountChirho", "structuralChirho");
  const pageCountChirho = numberFieldChirho(structuralChirho, "markdownPageFingerprintCountChirho", "structuralChirho");
  const spanLineFileCountChirho = numberFieldChirho(structuralChirho, "liveSpanSourceFileCountChirho", "structuralChirho");
  const liveSpanCountChirho = numberFieldChirho(structuralChirho, "liveSpanCountChirho", "structuralChirho");
  const unknownSpanCountChirho = numberFieldChirho(structuralChirho, "unknownSpanCountChirho", "structuralChirho");
  const replacementCharCountChirho = numberFieldChirho(structuralChirho, "replacementCharCountChirho", "structuralChirho");
  const nonNfcSpanCountChirho = numberFieldChirho(structuralChirho, "nonNfcSpanCountChirho", "structuralChirho");
  const rawHebrewCountChirho = numberFieldChirho(structuralChirho, "passCOcrHebrewSpanCountChirho", "structuralChirho");
  const expertCountChirho = numberFieldChirho(visionTierChirho, "remainingConfirmationCountChirho", "visionTierChirho");
  const latinSymbolCountChirho = numberFieldChirho(latinSymbolChirho, "remainingDecisionCountChirho", "latinSymbolVisionChirho");
  const attributionBlockedCountChirho = numberFieldChirho(humanValidationDbChirho, "genericReviewerRowsChirho", "humanValidationDbChirho");
  const attributionUnchangedCountChirho = numberFieldChirho(
    humanValidationDbChirho,
    "genericReviewerLiveTextMatchRowsChirho",
    "humanValidationDbChirho"
  );
  const attributionChangedCountChirho = numberFieldChirho(
    humanValidationDbChirho,
    "genericReviewerLiveTextMismatchRowsChirho",
    "humanValidationDbChirho"
  );
  const attributionUnknownCountChirho = numberFieldChirho(
    humanValidationDbChirho,
    "genericReviewerLiveTextUnknownRowsChirho",
    "humanValidationDbChirho"
  );
  const expertHebrewCountChirho = countMapValueChirho(visionTierChirho, "pendingVisionCountsChirho", "hebrew-chirho", "visionTierChirho");
  const expertGreekCountChirho = countMapValueChirho(visionTierChirho, "pendingVisionCountsChirho", "greek-chirho", "visionTierChirho");
  const expertSyriacCountChirho = countMapValueChirho(visionTierChirho, "pendingVisionCountsChirho", "syriac-chirho", "visionTierChirho");
  const expertArabicCountChirho = countMapValueChirho(visionTierChirho, "pendingVisionCountsChirho", "arabic-chirho", "visionTierChirho");
  const hiddenHebrewCandidateCountChirho = numberFieldChirho(
    hiddenHebrewScanChirho,
    "candidateLineCountChirho",
    "strictBlindScansChirho.hiddenHebrewChirho"
  );
  const nonLatinResidueCandidateCountChirho = numberFieldChirho(
    nonLatinResidueScanChirho,
    "candidateLineCountChirho",
    "strictBlindScansChirho.nonLatinResidueChirho"
  );
  const closeBeforeOpenSuspectCountChirho = numberFieldChirho(
    hebrewDelimiterScanChirho,
    "closeBeforeOpenSuspectCountChirho",
    "strictBlindScansChirho.hebrewDelimiterOrderChirho"
  );
  const neighborUnbalancedReviewCountChirho = numberFieldChirho(
    hebrewDelimiterScanChirho,
    "neighborUnbalancedReviewCountChirho",
    "strictBlindScansChirho.hebrewDelimiterOrderChirho"
  );
  assertDocContainsSnippetsChirho(docPathChirho, textChirho, [
    "# HOTTP Transcription — Status & Path to Production (updated 2026-06-08)",
    "## 2. What we have today (verified 2026-06-08)",
    `${formattedNumberChirho(volumeCountChirho)} volumes · ${formattedNumberChirho(pageCountChirho)} pages · ${formattedNumberChirho(spanLineFileCountChirho)} span-line files · **${formattedNumberChirho(liveSpanCountChirho)} spans**`,
    `**${unknownSpanCountChirho} unknown spans · ${replacementCharCountChirho} replacement characters · ${nonNfcSpanCountChirho} non-NFC spans**`,
    `hidden-Hebrew candidates **${hiddenHebrewCandidateCountChirho}**, non-Latin-residue candidates **${nonLatinResidueCandidateCountChirho}**, Hebrew close-before-open delimiter suspects **${closeBeforeOpenSuspectCountChirho}**, neighbor-unbalanced damaged-text review rows **${neighborUnbalancedReviewCountChirho}**`,
    `raw Hebrew (${rawHebrewCountChirho} spans)`,
    `Latin/symbol (${latinSymbolCountChirho} remaining decisions)`,
    `non-Latin expert (${expertCountChirho}: Hebrew ${expertHebrewCountChirho}, Greek ${expertGreekCountChirho}, Syriac ${expertSyriacCountChirho}, Arabic ${expertArabicCountChirho})`,
    `| Raw Pass-C Hebrew spans | **${rawHebrewCountChirho}** |`,
    `| Non-Latin expert items | **${expertCountChirho}** (Hebrew ${expertHebrewCountChirho} · Greek ${expertGreekCountChirho} · Syriac ${expertSyriacCountChirho} · Arabic ${expertArabicCountChirho}) |`,
    `| Latin/symbol vision decisions | **${latinSymbolCountChirho} remaining**`,
    `${attributionBlockedCountChirho} current Pass-C human validation rows use the generic reviewer id \`human-chirho\``,
    `${attributionUnchangedCountChirho} still match the currently live text, ${attributionChangedCountChirho} have changed since the original review, and ${attributionUnknownCountChirho} are currently unknown`,
    `The ${attributionUnchangedCountChirho} unchanged-live-text rows are the only normal reattribution candidates; the ${attributionChangedCountChirho} changed-live-text rows should go through Attribution re-review`,
    "The public app URLs currently respond, but app availability is separate from the certified-text gate",
    "does not prove the current working corpus is published or certified.",
    "**Review app release readiness:** `bun run check-app-publication-readiness-chirho`",
    "A passing app preflight means the review app is build-ready; it does **not** mean the corpus is certified.",
    "**Certified markdown publication gate:** `bun run check-certified-markdown-publication-chirho`",
    "exits nonzero until the content-certification gate is green",
    "**Quick triage only:** `bun run publication-readiness-summary-chirho`",
    "It is useful for status checks, not for a publication claim.",
  ]);
  assertDocOmitsSnippetsChirho(docPathChirho, textChirho, [
    "This is *already deployed and running*.",
    "with all 5 volumes segmented + coordinates and OCR suggestions served",
    "The supporting web app and OCR suggestions are already deployed",
  ]);
}

function checkSpecDocChirho(docPathChirho: string, statusChirho: StatusLinkedSpecDocsStatusChirho): void {
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
  if (docPathChirho === LATIN_SYMBOL_QUICKSTART_DOC_CHIRHO) {
    assertDocContainsSnippetsChirho(docPathChirho, textChirho, LATIN_SYMBOL_REVIEW_GUIDANCE_SNIPPETS_CHIRHO);
  }
  if (docPathChirho === EXPERT_QUICKSTART_DOC_CHIRHO) {
    assertDocContainsSnippetsChirho(docPathChirho, textChirho, EXPERT_REVIEW_GUIDANCE_SNIPPETS_CHIRHO);
  }
  if (docPathChirho === HALLELUJAH_SESSION_GUIDE_DOC_CHIRHO) {
    assertDocContainsSnippetsChirho(docPathChirho, textChirho, HALLELUJAH_SESSION_GUIDE_SNIPPETS_CHIRHO);
  }
  if (docPathChirho === REVIEWER_SCOPE_PRIMER_DOC_CHIRHO) {
    assertDocContainsSnippetsChirho(docPathChirho, textChirho, REVIEWER_SCOPE_PRIMER_SNIPPETS_CHIRHO);
  }
  if (docPathChirho === TRANSCRIPTION_STATUS_PRODUCTION_PATH_DOC_CHIRHO) {
    assertProductionPathCountsChirho(docPathChirho, textChirho, statusChirho);
  }
}

function mainChirho(): void {
  assertGeneratedCheckChirho(existsSync(STATUS_MARKDOWN_PATH_CHIRHO), `missing status Markdown: ${STATUS_MARKDOWN_PATH_CHIRHO}`);
  assertGeneratedCheckChirho(existsSync(STATUS_JSON_PATH_CHIRHO), `missing status JSON: ${STATUS_JSON_PATH_CHIRHO}`);
  const statusMarkdownChirho = readFileSync(STATUS_MARKDOWN_PATH_CHIRHO, "utf8");
  const statusChirho = JSON.parse(readFileSync(STATUS_JSON_PATH_CHIRHO, "utf8")) as StatusLinkedSpecDocsStatusChirho;
  const docsChirho = linkedSpecDocPathsChirho(statusMarkdownChirho);
  assertGeneratedCheckChirho(docsChirho.length > 0, "status Markdown does not link any spec/handoff documents");
  for (const docPathChirho of docsChirho) {
    checkSpecDocChirho(docPathChirho, statusChirho);
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
