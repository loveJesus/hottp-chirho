// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Verify ignored exported transcription Markdown artifacts are present and sane.
 *
 * The export lives under workspace-chirho, so Git hygiene checks do not see it.
 * This checker ties generated page/volume Markdown files back to the export
 * report without certifying any text.
 */

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

function skipNewlinesChirho(textChirho: string, indexChirho: number): number {
  let nextIndexChirho = indexChirho;
  while (textChirho[nextIndexChirho] === "\n") {
    nextIndexChirho += 1;
  }
  return nextIndexChirho;
}

function pageMarkdownBodyChirho(markdownPathChirho: string, textChirho: string): string {
  const sourceCommentStartChirho = textChirho.indexOf("<!-- source-chirho:");
  assertGeneratedCheckChirho(
    sourceCommentStartChirho !== -1,
    `page Markdown lacks source metadata comment: ${relative(PROJECT_ROOT_CHIRHO, markdownPathChirho)}`
  );
  const sourceCommentEndChirho = textChirho.indexOf("-->", sourceCommentStartChirho);
  assertGeneratedCheckChirho(
    sourceCommentEndChirho !== -1,
    `page Markdown source metadata comment is not closed: ${relative(PROJECT_ROOT_CHIRHO, markdownPathChirho)}`
  );
  return textChirho.slice(skipNewlinesChirho(textChirho, sourceCommentEndChirho + 3)).trimEnd();
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
  const volumesChirho = new Set<number>();
  for (const pageChirho of reportChirho.pagesChirho) {
    assertGeneratedCheckChirho(Number.isInteger(pageChirho.volumeChirho), "export page volumeChirho must be an integer");
    assertGeneratedCheckChirho(Number.isInteger(pageChirho.pageChirho), "export page pageChirho must be an integer");
    assertGeneratedCheckChirho(
      typeof pageChirho.markdownPathChirho === "string",
      "export page markdownPathChirho must be a string"
    );
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
  assertGeneratedCheckChirho(
    reportChirho.volumeCountChirho === undefined || reportChirho.volumeCountChirho === volumesChirho.size,
    "export report volumeCountChirho does not match page volumes"
  );
  for (const volumeChirho of volumesChirho) {
    expectedMarkdownPathsChirho.add(
      normalizedPathChirho(join(MARKDOWN_DIR_CHIRHO, `vol-${volumeChirho}-chirho`, `volume-${volumeChirho}-chirho.md`))
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

  for (const volumeChirho of volumesChirho) {
    const volumePathChirho = normalizedPathChirho(
      join(MARKDOWN_DIR_CHIRHO, `vol-${volumeChirho}-chirho`, `volume-${volumeChirho}-chirho.md`)
    );
    const volumeTextChirho = markdownTextByPathChirho.get(volumePathChirho) ?? "";
    const pagesForVolumeChirho = (pagesByVolumeChirho.get(volumeChirho) ?? []).toSorted(
      (leftChirho, rightChirho) => leftChirho.pageChirho! - rightChirho.pageChirho!
    );
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
