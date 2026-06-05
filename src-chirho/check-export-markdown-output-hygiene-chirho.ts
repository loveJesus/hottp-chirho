// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify ignored exported transcription Markdown artifacts are present and sane.
 *
 * The export lives under workspace-chirho, so Git hygiene checks do not see it.
 * This checker ties generated page/volume Markdown files back to the export
 * report without certifying any text.
 */

import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative, resolve, sep } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  JOHN_316_BLOCK_MARKDOWN_HEADER_CHIRHO,
  assertGeneratedCheckChirho,
  assertGeneratedTextHygieneChirho,
  assertMarkdownHeaderChirho,
  countOccurrencesChirho,
} from "./generated-output-hygiene-chirho.ts";

const MODULE_CHIRHO = "check-export-markdown-output-hygiene-chirho";
const MARKDOWN_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "markdown-chirho");
const EXPORT_REPORT_PATH_CHIRHO = join(MARKDOWN_DIR_CHIRHO, "export-report-chirho.json");

interface ExportPageReportChirho {
  volumeChirho?: number;
  pageChirho?: number;
  markdownPathChirho?: string;
  markdownSha256Chirho?: string;
  lineCountChirho?: number;
  spanCountChirho?: number;
  unknownSpanCountChirho?: number;
  hebrewSpanCountChirho?: number;
  passCOcrHebrewSpanCountChirho?: number;
  crnnValidatedHebrewSpanCountChirho?: number;
  issueCountChirho?: number;
  qualityStatusChirho?: string;
}

interface ExportVolumeReportChirho {
  volumeChirho?: number;
  markdownPathChirho?: string;
  markdownSha256Chirho?: string;
  pageCountChirho?: number;
}

interface ExportIssueChirho {
  codeChirho?: string;
  volumeChirho?: number;
  pageChirho?: number;
  lineIndexChirho?: number;
  segmentIndexChirho?: number;
}

interface ExportReportChirho {
  pageCountChirho?: number;
  volumeCountChirho?: number;
  issueCountChirho?: number;
  pagesChirho?: ExportPageReportChirho[];
  volumesChirho?: ExportVolumeReportChirho[];
  issuesChirho?: ExportIssueChirho[];
}

function normalizedPathChirho(pathChirho: string): string {
  return resolve(pathChirho);
}

function assertInsideMarkdownDirChirho(pathChirho: string): void {
  const resolvedChirho = normalizedPathChirho(pathChirho);
  const rootChirho = normalizedPathChirho(MARKDOWN_DIR_CHIRHO);
  assertGeneratedCheckChirho(
    resolvedChirho === rootChirho || resolvedChirho.startsWith(`${rootChirho}${sep}`),
    `export Markdown path escapes markdown directory: ${pathChirho}`
  );
}

function collectMarkdownFilesChirho(dirChirho: string): string[] {
  const filesChirho: string[] = [];
  for (const entryChirho of readdirSync(dirChirho)) {
    const pathChirho = join(dirChirho, entryChirho);
    const statChirho = statSync(pathChirho);
    if (statChirho.isDirectory()) {
      filesChirho.push(...collectMarkdownFilesChirho(pathChirho));
    } else if (entryChirho.endsWith(".md")) {
      filesChirho.push(normalizedPathChirho(pathChirho));
    }
  }
  return filesChirho.sort();
}

function emptySpanMarkerChirho(issueChirho: ExportIssueChirho): string {
  return `[EMPTY-SPAN-CHIRHO line=${issueChirho.lineIndexChirho} segment=${issueChirho.segmentIndexChirho}]`;
}

function sha256TextChirho(textChirho: string): string {
  return createHash("sha256").update(textChirho, "utf8").digest("hex");
}

function assertSha256FieldChirho(valueChirho: unknown, labelChirho: string): void {
  assertGeneratedCheckChirho(
    typeof valueChirho === "string" && /^[0-9a-f]{64}$/.test(valueChirho),
    `${labelChirho} must be a lowercase sha256 hex digest`
  );
}

function skipNewlinesChirho(textChirho: string, indexChirho: number): number {
  let nextIndexChirho = indexChirho;
  while (textChirho[nextIndexChirho] === "\n") {
    nextIndexChirho += 1;
  }
  return nextIndexChirho;
}

function metadataFromCommentChirho(commentChirho: string): Map<string, string> {
  const metadataChirho = new Map<string, string>();
  for (const partChirho of commentChirho.split(";")) {
    const trimmedChirho = partChirho.trim();
    const separatorIndexChirho = trimmedChirho.indexOf(":");
    if (separatorIndexChirho === -1) {
      continue;
    }
    const keyChirho = trimmedChirho.slice(0, separatorIndexChirho).trim();
    const valueChirho = trimmedChirho.slice(separatorIndexChirho + 1).trim();
    metadataChirho.set(keyChirho, valueChirho);
  }
  return metadataChirho;
}

function commentTextAtChirho(
  markdownPathChirho: string,
  textChirho: string,
  commentStartChirho: number,
  labelChirho: string
): string {
  assertGeneratedCheckChirho(
    commentStartChirho !== -1,
    `Markdown lacks ${labelChirho} metadata comment: ${relative(PROJECT_ROOT_CHIRHO, markdownPathChirho)}`
  );
  const commentEndChirho = textChirho.indexOf("-->", commentStartChirho);
  assertGeneratedCheckChirho(
    commentEndChirho !== -1,
    `Markdown ${labelChirho} metadata comment is not closed: ${relative(PROJECT_ROOT_CHIRHO, markdownPathChirho)}`
  );
  return textChirho.slice(commentStartChirho + "<!--".length, commentEndChirho).trim();
}

function metadataAtChirho(
  markdownPathChirho: string,
  textChirho: string,
  commentStartChirho: number,
  labelChirho: string
): Map<string, string> {
  return metadataFromCommentChirho(commentTextAtChirho(markdownPathChirho, textChirho, commentStartChirho, labelChirho));
}

function assertMetadataTextChirho(
  metadataChirho: Map<string, string>,
  keyChirho: string,
  expectedChirho: string,
  labelChirho: string
): void {
  assertGeneratedCheckChirho(
    metadataChirho.get(keyChirho) === expectedChirho,
    `${labelChirho} metadata ${keyChirho}=${metadataChirho.get(keyChirho) ?? "missing-chirho"} does not match expected ${expectedChirho}`
  );
}

function assertMetadataNumberChirho(
  metadataChirho: Map<string, string>,
  keyChirho: string,
  expectedChirho: number | undefined,
  labelChirho: string
): void {
  assertGeneratedCheckChirho(
    expectedChirho !== undefined,
    `${labelChirho} expected number for ${keyChirho} is missing from export report`
  );
  assertMetadataTextChirho(metadataChirho, keyChirho, String(expectedChirho), labelChirho);
}

function pageMarkdownBodyChirho(markdownPathChirho: string, textChirho: string): string {
  const sourceCommentStartChirho = textChirho.indexOf("<!-- source-chirho:");
  const sourceCommentEndChirho = textChirho.indexOf(
    "-->",
    sourceCommentStartChirho === -1 ? 0 : sourceCommentStartChirho
  );
  commentTextAtChirho(markdownPathChirho, textChirho, sourceCommentStartChirho, "page source-chirho");
  return textChirho.slice(skipNewlinesChirho(textChirho, sourceCommentEndChirho + 3)).trimEnd();
}

function assertPageMetadataChirho(pageChirho: ExportPageReportChirho, pagePathChirho: string, pageTextChirho: string): void {
  const metadataChirho = metadataAtChirho(
    pagePathChirho,
    pageTextChirho,
    pageTextChirho.indexOf("<!-- source-chirho:"),
    "page source-chirho"
  );
  const labelChirho = `page Markdown ${pageChirho.volumeChirho}:${pageChirho.pageChirho}`;
  assertMetadataTextChirho(metadataChirho, "status-chirho", pageChirho.qualityStatusChirho ?? "", labelChirho);
  assertMetadataNumberChirho(metadataChirho, "lines-chirho", pageChirho.lineCountChirho, labelChirho);
  assertMetadataNumberChirho(metadataChirho, "spans-chirho", pageChirho.spanCountChirho, labelChirho);
  assertMetadataNumberChirho(metadataChirho, "unknown-spans-chirho", pageChirho.unknownSpanCountChirho, labelChirho);
  assertMetadataNumberChirho(metadataChirho, "hebrew-spans-chirho", pageChirho.hebrewSpanCountChirho, labelChirho);
  assertMetadataNumberChirho(
    metadataChirho,
    "pass-c-ocr-hebrew-spans-chirho",
    pageChirho.passCOcrHebrewSpanCountChirho,
    labelChirho
  );
  assertMetadataNumberChirho(
    metadataChirho,
    "crnn-validated-hebrew-spans-chirho",
    pageChirho.crnnValidatedHebrewSpanCountChirho,
    labelChirho
  );
}

function volumeMarkdownPageBodyChirho(
  volumePathChirho: string,
  textChirho: string,
  pageNumberChirho: number
): string {
  const headingChirho = `\n## Page ${pageNumberChirho}\n\n`;
  const headingStartChirho = textChirho.indexOf(headingChirho);
  assertGeneratedCheckChirho(
    headingStartChirho !== -1,
    `volume Markdown lacks page section ${pageNumberChirho}: ${relative(PROJECT_ROOT_CHIRHO, volumePathChirho)}`
  );
  assertGeneratedCheckChirho(
    textChirho.indexOf(headingChirho, headingStartChirho + headingChirho.length) === -1,
    `volume Markdown repeats page section ${pageNumberChirho}: ${relative(PROJECT_ROOT_CHIRHO, volumePathChirho)}`
  );

  const statusStartChirho = headingStartChirho + headingChirho.length;
  assertGeneratedCheckChirho(
    textChirho.startsWith("<!-- status-chirho:", statusStartChirho),
    `volume Markdown page ${pageNumberChirho} lacks status metadata comment: ${relative(PROJECT_ROOT_CHIRHO, volumePathChirho)}`
  );
  const statusEndChirho = textChirho.indexOf("-->", statusStartChirho);
  assertGeneratedCheckChirho(
    statusEndChirho !== -1,
    `volume Markdown page ${pageNumberChirho} status metadata comment is not closed: ${relative(PROJECT_ROOT_CHIRHO, volumePathChirho)}`
  );

  const bodyStartChirho = skipNewlinesChirho(textChirho, statusEndChirho + 3);
  const nextPageStartChirho = textChirho.indexOf("\n---\n\n## Page ", bodyStartChirho);
  const bodyEndChirho = nextPageStartChirho === -1 ? textChirho.length : nextPageStartChirho;
  return textChirho.slice(bodyStartChirho, bodyEndChirho).trimEnd();
}

function volumePageMetadataChirho(
  volumePathChirho: string,
  textChirho: string,
  pageNumberChirho: number
): Map<string, string> {
  const headingChirho = `\n## Page ${pageNumberChirho}\n\n`;
  const headingStartChirho = textChirho.indexOf(headingChirho);
  assertGeneratedCheckChirho(
    headingStartChirho !== -1,
    `volume Markdown lacks page section ${pageNumberChirho}: ${relative(PROJECT_ROOT_CHIRHO, volumePathChirho)}`
  );
  const statusStartChirho = headingStartChirho + headingChirho.length;
  assertGeneratedCheckChirho(
    textChirho.startsWith("<!-- status-chirho:", statusStartChirho),
    `volume Markdown page ${pageNumberChirho} lacks status metadata comment: ${relative(PROJECT_ROOT_CHIRHO, volumePathChirho)}`
  );
  return metadataAtChirho(volumePathChirho, textChirho, statusStartChirho, `volume page ${pageNumberChirho} status-chirho`);
}

function assertVolumePageMetadataChirho(
  pageChirho: ExportPageReportChirho,
  volumePathChirho: string,
  volumeTextChirho: string
): void {
  const metadataChirho = volumePageMetadataChirho(volumePathChirho, volumeTextChirho, pageChirho.pageChirho!);
  const labelChirho = `volume Markdown ${pageChirho.volumeChirho}:${pageChirho.pageChirho}`;
  assertMetadataTextChirho(metadataChirho, "status-chirho", pageChirho.qualityStatusChirho ?? "", labelChirho);
  assertMetadataNumberChirho(metadataChirho, "lines-chirho", pageChirho.lineCountChirho, labelChirho);
  assertMetadataNumberChirho(metadataChirho, "spans-chirho", pageChirho.spanCountChirho, labelChirho);
  assertMetadataNumberChirho(metadataChirho, "unknown-spans-chirho", pageChirho.unknownSpanCountChirho, labelChirho);
  assertMetadataNumberChirho(metadataChirho, "hebrew-spans-chirho", pageChirho.hebrewSpanCountChirho, labelChirho);
  assertMetadataNumberChirho(
    metadataChirho,
    "pass-c-ocr-hebrew-spans-chirho",
    pageChirho.passCOcrHebrewSpanCountChirho,
    labelChirho
  );
  assertMetadataNumberChirho(
    metadataChirho,
    "crnn-validated-hebrew-spans-chirho",
    pageChirho.crnnValidatedHebrewSpanCountChirho,
    labelChirho
  );
  assertMetadataNumberChirho(metadataChirho, "issues-chirho", pageChirho.issueCountChirho, labelChirho);
}

function assertVolumeMetadataChirho(
  volumeChirho: number,
  volumePathChirho: string,
  volumeTextChirho: string,
  pageCountChirho: number
): void {
  const metadataChirho = metadataAtChirho(
    volumePathChirho,
    volumeTextChirho,
    volumeTextChirho.indexOf("<!-- source-chirho:"),
    "volume source-chirho"
  );
  assertMetadataNumberChirho(metadataChirho, "pages-chirho", pageCountChirho, `volume Markdown ${volumeChirho}`);
}

function volumeMarkdownPageHeadingsChirho(textChirho: string): Map<number, number> {
  const countsChirho = new Map<number, number>();
  for (const matchChirho of textChirho.matchAll(/^## Page ([0-9]+)$/gm)) {
    const pageNumberChirho = Number(matchChirho[1]);
    countsChirho.set(pageNumberChirho, (countsChirho.get(pageNumberChirho) ?? 0) + 1);
  }
  return countsChirho;
}

function mainChirho(): void {
  assertGeneratedCheckChirho(existsSync(EXPORT_REPORT_PATH_CHIRHO), `missing export report: ${EXPORT_REPORT_PATH_CHIRHO}`);
  const reportTextChirho = readFileSync(EXPORT_REPORT_PATH_CHIRHO, "utf8");
  assertGeneratedTextHygieneChirho(EXPORT_REPORT_PATH_CHIRHO, reportTextChirho);
  const reportChirho = JSON.parse(reportTextChirho) as ExportReportChirho;
  assertGeneratedCheckChirho(Array.isArray(reportChirho.pagesChirho), "export report pagesChirho must be an array");
  assertGeneratedCheckChirho(Array.isArray(reportChirho.volumesChirho), "export report volumesChirho must be an array");
  assertGeneratedCheckChirho(Array.isArray(reportChirho.issuesChirho), "export report issuesChirho must be an array");
  assertGeneratedCheckChirho(
    reportChirho.pageCountChirho === reportChirho.pagesChirho.length,
    "export report pageCountChirho does not match pagesChirho.length"
  );
  assertGeneratedCheckChirho(
    reportChirho.issueCountChirho === reportChirho.issuesChirho.length,
    "export report issueCountChirho does not match issuesChirho.length"
  );

  const expectedMarkdownPathsChirho = new Set<string>();
  const pagesByKeyChirho = new Map<string, ExportPageReportChirho>();
  const pagesByVolumeChirho = new Map<number, ExportPageReportChirho[]>();
  const volumeReportsByVolumeChirho = new Map<number, ExportVolumeReportChirho>();
  const volumesChirho = new Set<number>();
  for (const pageChirho of reportChirho.pagesChirho) {
    assertGeneratedCheckChirho(Number.isInteger(pageChirho.volumeChirho), "export page volumeChirho must be an integer");
    assertGeneratedCheckChirho(Number.isInteger(pageChirho.pageChirho), "export page pageChirho must be an integer");
    assertGeneratedCheckChirho(
      typeof pageChirho.markdownPathChirho === "string",
      "export page markdownPathChirho must be a string"
    );
    assertSha256FieldChirho(pageChirho.markdownSha256Chirho, `export page ${pageChirho.volumeChirho}:${pageChirho.pageChirho} markdownSha256Chirho`);
    assertInsideMarkdownDirChirho(pageChirho.markdownPathChirho);
    const markdownPathChirho = normalizedPathChirho(pageChirho.markdownPathChirho);
    const keyChirho = `${pageChirho.volumeChirho}:${pageChirho.pageChirho}`;
    assertGeneratedCheckChirho(!pagesByKeyChirho.has(keyChirho), `duplicate export page report key ${keyChirho}`);
    pagesByKeyChirho.set(keyChirho, pageChirho);
    const pagesForVolumeChirho = pagesByVolumeChirho.get(pageChirho.volumeChirho!) ?? [];
    pagesForVolumeChirho.push(pageChirho);
    pagesByVolumeChirho.set(pageChirho.volumeChirho!, pagesForVolumeChirho);
    expectedMarkdownPathsChirho.add(markdownPathChirho);
    volumesChirho.add(pageChirho.volumeChirho!);
  }
  for (const volumeReportChirho of reportChirho.volumesChirho) {
    assertGeneratedCheckChirho(Number.isInteger(volumeReportChirho.volumeChirho), "export volume volumeChirho must be an integer");
    assertGeneratedCheckChirho(
      typeof volumeReportChirho.markdownPathChirho === "string",
      "export volume markdownPathChirho must be a string"
    );
    assertGeneratedCheckChirho(
      Number.isInteger(volumeReportChirho.pageCountChirho),
      "export volume pageCountChirho must be an integer"
    );
    assertSha256FieldChirho(
      volumeReportChirho.markdownSha256Chirho,
      `export volume ${volumeReportChirho.volumeChirho} markdownSha256Chirho`
    );
    assertInsideMarkdownDirChirho(volumeReportChirho.markdownPathChirho);
    assertGeneratedCheckChirho(
      !volumeReportsByVolumeChirho.has(volumeReportChirho.volumeChirho!),
      `duplicate export volume report key ${volumeReportChirho.volumeChirho}`
    );
    volumeReportsByVolumeChirho.set(volumeReportChirho.volumeChirho!, volumeReportChirho);
  }
  assertGeneratedCheckChirho(
    reportChirho.volumeCountChirho === undefined || reportChirho.volumeCountChirho === volumesChirho.size,
    "export report volumeCountChirho does not match page volumes"
  );
  assertGeneratedCheckChirho(
    volumeReportsByVolumeChirho.size === volumesChirho.size,
    "export report volumesChirho count does not match page volumes"
  );
  for (const volumeChirho of volumesChirho) {
    const volumeReportChirho = volumeReportsByVolumeChirho.get(volumeChirho);
    assertGeneratedCheckChirho(volumeReportChirho !== undefined, `missing export volume report for volume ${volumeChirho}`);
    expectedMarkdownPathsChirho.add(normalizedPathChirho(volumeReportChirho.markdownPathChirho!));
    assertGeneratedCheckChirho(
      normalizedPathChirho(volumeReportChirho.markdownPathChirho!) ===
        normalizedPathChirho(join(MARKDOWN_DIR_CHIRHO, `vol-${volumeChirho}-chirho`, `volume-${volumeChirho}-chirho.md`)),
      `export volume ${volumeChirho} markdownPathChirho is not the canonical volume path`
    );
  }

  const actualMarkdownPathsChirho = new Set(collectMarkdownFilesChirho(MARKDOWN_DIR_CHIRHO));
  for (const expectedPathChirho of expectedMarkdownPathsChirho) {
    assertGeneratedCheckChirho(existsSync(expectedPathChirho), `expected exported Markdown file missing: ${expectedPathChirho}`);
  }
  for (const actualPathChirho of actualMarkdownPathsChirho) {
    assertGeneratedCheckChirho(
      expectedMarkdownPathsChirho.has(actualPathChirho),
      `unexpected stale exported Markdown file: ${relative(PROJECT_ROOT_CHIRHO, actualPathChirho)}`
    );
  }

  const markdownTextByPathChirho = new Map<string, string>();
  for (const markdownPathChirho of actualMarkdownPathsChirho) {
    const textChirho = readFileSync(markdownPathChirho, "utf8");
    assertGeneratedTextHygieneChirho(markdownPathChirho, textChirho);
    assertMarkdownHeaderChirho(markdownPathChirho, textChirho, JOHN_316_BLOCK_MARKDOWN_HEADER_CHIRHO);
    markdownTextByPathChirho.set(markdownPathChirho, textChirho);
  }

  for (const pageChirho of reportChirho.pagesChirho) {
    const pagePathChirho = normalizedPathChirho(pageChirho.markdownPathChirho!);
    const pageTextChirho = markdownTextByPathChirho.get(pagePathChirho) ?? "";
    assertGeneratedCheckChirho(
      sha256TextChirho(pageTextChirho) === pageChirho.markdownSha256Chirho,
      `page Markdown SHA-256 does not match export report for volume ${pageChirho.volumeChirho}, page ${pageChirho.pageChirho}`
    );
  }

  for (const volumeReportChirho of reportChirho.volumesChirho) {
    const volumePathChirho = normalizedPathChirho(volumeReportChirho.markdownPathChirho!);
    const volumeTextChirho = markdownTextByPathChirho.get(volumePathChirho) ?? "";
    assertGeneratedCheckChirho(
      sha256TextChirho(volumeTextChirho) === volumeReportChirho.markdownSha256Chirho,
      `volume Markdown SHA-256 does not match export report for volume ${volumeReportChirho.volumeChirho}`
    );
  }

  for (const volumeChirho of volumesChirho) {
    const volumePathChirho = normalizedPathChirho(
      volumeReportsByVolumeChirho.get(volumeChirho)!.markdownPathChirho!
    );
    const volumeTextChirho = markdownTextByPathChirho.get(volumePathChirho) ?? "";
    const pagesForVolumeChirho = (pagesByVolumeChirho.get(volumeChirho) ?? []).toSorted(
      (leftChirho, rightChirho) => leftChirho.pageChirho! - rightChirho.pageChirho!
    );
    assertGeneratedCheckChirho(
      volumeReportsByVolumeChirho.get(volumeChirho)!.pageCountChirho === pagesForVolumeChirho.length,
      `export volume ${volumeChirho} pageCountChirho does not match report page count`
    );
    assertVolumeMetadataChirho(volumeChirho, volumePathChirho, volumeTextChirho, pagesForVolumeChirho.length);
    const headingCountsChirho = volumeMarkdownPageHeadingsChirho(volumeTextChirho);
    assertGeneratedCheckChirho(
      headingCountsChirho.size === pagesForVolumeChirho.length,
      `volume Markdown page section count ${headingCountsChirho.size} does not match report page count ${pagesForVolumeChirho.length} for volume ${volumeChirho}`
    );
    for (const pageChirho of pagesForVolumeChirho) {
      const pageNumberChirho = pageChirho.pageChirho!;
      assertGeneratedCheckChirho(
        headingCountsChirho.get(pageNumberChirho) === 1,
        `volume Markdown page section ${pageNumberChirho} is missing or duplicated for volume ${volumeChirho}`
      );
      const pagePathChirho = normalizedPathChirho(pageChirho.markdownPathChirho!);
      const pageTextChirho = markdownTextByPathChirho.get(pagePathChirho) ?? "";
      assertPageMetadataChirho(pageChirho, pagePathChirho, pageTextChirho);
      assertVolumePageMetadataChirho(pageChirho, volumePathChirho, volumeTextChirho);
      const pageBodyChirho = pageMarkdownBodyChirho(pagePathChirho, pageTextChirho);
      const volumeBodyChirho = volumeMarkdownPageBodyChirho(volumePathChirho, volumeTextChirho, pageNumberChirho);
      assertGeneratedCheckChirho(
        pageBodyChirho === volumeBodyChirho,
        `volume Markdown page body does not match page Markdown for volume ${volumeChirho}, page ${pageNumberChirho}`
      );
    }
  }

  const blankIssuesChirho = reportChirho.issuesChirho.filter((issueChirho) => issueChirho.codeChirho === "blank-span-text-chirho");
  let expectedEmptyMarkerTotalChirho = 0;
  for (const issueChirho of blankIssuesChirho) {
    const pageKeyChirho = `${issueChirho.volumeChirho}:${issueChirho.pageChirho}`;
    const pageChirho = pagesByKeyChirho.get(pageKeyChirho);
    assertGeneratedCheckChirho(
      pageChirho !== undefined,
      `blank-span issue does not resolve to an exported page: ${pageKeyChirho}`
    );
    const markerChirho = emptySpanMarkerChirho(issueChirho);
    const pagePathChirho = normalizedPathChirho(pageChirho.markdownPathChirho!);
    const volumePathChirho = normalizedPathChirho(
      join(MARKDOWN_DIR_CHIRHO, `vol-${issueChirho.volumeChirho}-chirho`, `volume-${issueChirho.volumeChirho}-chirho.md`)
    );
    assertGeneratedCheckChirho(
      countOccurrencesChirho(markdownTextByPathChirho.get(pagePathChirho) ?? "", markerChirho) === 1,
      `blank-span marker ${markerChirho} is not rendered exactly once in page Markdown`
    );
    assertGeneratedCheckChirho(
      countOccurrencesChirho(markdownTextByPathChirho.get(volumePathChirho) ?? "", markerChirho) === 1,
      `blank-span marker ${markerChirho} is not rendered exactly once in volume Markdown`
    );
    expectedEmptyMarkerTotalChirho += 2;
  }
  let actualEmptyMarkerTotalChirho = 0;
  for (const textChirho of markdownTextByPathChirho.values()) {
    actualEmptyMarkerTotalChirho += countOccurrencesChirho(textChirho, "[EMPTY-SPAN-CHIRHO ");
  }
  assertGeneratedCheckChirho(
    actualEmptyMarkerTotalChirho === expectedEmptyMarkerTotalChirho,
    `exported Markdown EMPTY-SPAN marker count ${actualEmptyMarkerTotalChirho} does not match report count ${expectedEmptyMarkerTotalChirho}`
  );

  console.log(
    `[${MODULE_CHIRHO}] export Markdown output hygiene passed for ${actualMarkdownPathsChirho.size} Markdown file(s)`
  );
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
