// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Export assembled Pass C spans to UTF-8 Markdown.
 *
 * Span JSON is the current full-text source for the 25 Pass C pilot pages
 * because vols 2-5 Hebrew exists there but not in words_chirho. Local D1 is
 * used as an audit witness only: canonical/vision provenance, current page
 * coverage gaps, and gated CRNN suggestion skeleton cross-checks.
 *
 * Outputs:
 *   workspace-chirho/markdown-chirho/vol-N-chirho/page-NNNN-chirho.md
 *   workspace-chirho/markdown-chirho/vol-N-chirho/volume-N-chirho.md
 *   workspace-chirho/markdown-chirho/export-report-chirho.json
 *
 * CLI:
 *   bun src-chirho/export-markdown-chirho.ts --all
 *   bun src-chirho/export-markdown-chirho.ts --vol=4
 *   bun src-chirho/export-markdown-chirho.ts --vol=4 --page=148 --strict
 *   bun src-chirho/export-markdown-chirho.ts --all --no-d1-audit
 */

import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO, VOLUMES_CHIRHO } from "./config-chirho.ts";
import { isNfcTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

const MODULE_CHIRHO = "export-markdown-chirho";
const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const CONTEXT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "pass-c-context-chirho");
const DEFAULT_MARKDOWN_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "markdown-chirho");
const LOCAL_D1_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "app-chirho",
  ".wrangler",
  "state",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject"
);
const JOHN_COMMENT_CHIRHO = [
  "<!--",
  "For God so loved the world that he gave his only begotten Son,",
  "that whoever believes in him should not perish but have eternal life. John 3:16",
  "-->",
  "",
].join("\n");
const LINE_FILE_RE_CHIRHO = /^line-(\d+)-chirho\.json$/;
const PAGE_DIR_RE_CHIRHO = /^page-(\d+)-chirho$/;
const VOL_DIR_RE_CHIRHO = /^vol-(\d+)-chirho$/;
const RTL_SCRIPTS_CHIRHO = new Set<string>([
  "hebrew-chirho",
  "syriac-chirho",
  "arabic-chirho",
]);
const PASS_C_OCR_SCRIPTS_CHIRHO = new Set<string>([
  "hebrew-chirho",
  "greek-chirho",
  "syriac-chirho",
  "arabic-chirho",
]);
const LATIN_TEXT_SCRIPTS_CHIRHO = new Set<string>([
  "french-chirho",
  "latin-chirho",
  "latin-non-french-chirho",
]);
const NON_LATIN_SCRIPT_IN_LATIN_TEXT_RE_CHIRHO =
  /[\p{Script=Greek}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Arabic}]/u;
const GREEK_SCRIPT_IN_LATIN_TEXT_RE_CHIRHO = /[\p{Script=Greek}]/u;
const NON_GREEK_NON_LATIN_SCRIPT_IN_LATIN_TEXT_RE_CHIRHO =
  /[\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Arabic}]/u;
const LETTER_RE_CHIRHO = /\p{L}/u;
const EXPECTED_SCRIPT_CHAR_RE_CHIRHO: Record<string, RegExp> = {
  "hebrew-chirho": /[\u0590-\u05FF]/u,
  "greek-chirho": /[\u0370-\u03FF\u1F00-\u1FFF]/u,
  "syriac-chirho": /[\u0700-\u074F]/u,
  "arabic-chirho": /[\u0600-\u06FF]/u,
};
const SHORT_FRENCH_WORD_ALLOWLIST_CHIRHO = new Set<string>([
  "a",
  "à",
  "ce",
  "de",
  "des",
  "du",
  "en",
  "et",
  "la",
  "le",
  "les",
  "ne",
  "ni",
  "on",
  "or",
  "ou",
  "où",
  "que",
  "qui",
  "se",
  "si",
  "un",
  "une",
]);

type ProvenanceChirho =
  | "pdftotext-chirho"
  | "canonical-chirho"
  | "human-chirho"
  | "vision-chirho"
  | "pass-c-ocr-chirho"
  | "unknown-chirho"
  | "none-chirho";

const EXPLICIT_PROVENANCE_VALUES_CHIRHO = new Set<string>([
  "canonical-chirho",
  "human-chirho",
  "vision-chirho",
]);

interface CliOptionsChirho {
  allChirho: boolean;
  volumeChirho?: number;
  pageChirho?: number;
  outDirChirho: string;
  strictChirho: boolean;
  dbPathChirho?: string;
  d1AuditChirho: boolean;
  spanCommentsChirho: boolean;
}

interface TargetPageChirho {
  volumeChirho: number;
  pageChirho: number;
}

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  humanValidationIdChirho?: number;
  humanValidationVerdictChirho?: string;
  humanValidatedAtChirho?: string;
  needsSourceChirho?: boolean;
  badSegmentationChirho?: boolean;
  humanReviewStatusChirho?: string;
  humanIssueFlagsChirho?: string[];
  humanSuggestedTextChirho?: string;
  wlcSuggestedTextChirho?: string;
  wlcSuggestionSourceChirho?: string;
}

interface SpanLineChirho {
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  agentChirho: string;
  spansChirho: SpanChirho[];
}

interface PageContextSummaryChirho {
  totalLinesChirho?: number;
  totalWordsChirho?: number;
  totalCandidatesChirho?: number;
}

interface SpanIssueChirho {
  severityChirho: "warning-chirho" | "error-chirho";
  codeChirho: string;
  messageChirho: string;
  lineIndexChirho?: number;
  segmentIndexChirho?: number;
}

interface UnknownSpanChirho {
  lineIndexChirho: number;
  segmentIndexChirho: number;
  textChirho: string;
}

interface SpanAuditChirho {
  lineIndexChirho: number;
  segmentIndexChirho: number;
  scriptChirho: string;
  provenanceChirho: ProvenanceChirho;
  xMinPxChirho: number;
  widthPxChirho: number;
  textPreviewChirho: string;
  crnnSuggestionMatchCountChirho: number;
  crnnSuggestionTextsChirho: string[];
}

interface PageExportChirho {
  targetChirho: TargetPageChirho;
  markdownChirho: string;
  markdownBodyChirho: string;
  plainTextChirho: string;
  lineCountChirho: number;
  spanCountChirho: number;
  unknownSpanCountChirho: number;
  replacementCharCountChirho: number;
  nonNfcSpanCountChirho: number;
  rtlDominantLineCountChirho: number;
  hebrewSpanCountChirho: number;
  passCOcrHebrewSpanCountChirho: number;
  crnnValidatedHebrewSpanCountChirho: number;
  provenanceCountsChirho: Record<string, number>;
  contextChirho: PageContextSummaryChirho;
  issuesChirho: SpanIssueChirho[];
  unknownSpansChirho: UnknownSpanChirho[];
  spanAuditChirho: SpanAuditChirho[];
}

interface PageReportChirho {
  volumeChirho: number;
  pageChirho: number;
  markdownPathChirho: string;
  lineCountChirho: number;
  expectedLineCountChirho: number | null;
  spanCountChirho: number;
  unknownSpanCountChirho: number;
  replacementCharCountChirho: number;
  nonNfcSpanCountChirho: number;
  rtlDominantLineCountChirho: number;
  hebrewSpanCountChirho: number;
  passCOcrHebrewSpanCountChirho: number;
  crnnValidatedHebrewSpanCountChirho: number;
  provenanceCountsChirho: Record<string, number>;
  issueCountChirho: number;
  qualityStatusChirho: "complete-chirho" | "needs-review-chirho";
}

interface D1PageWitnessChirho {
  targetChirho: TargetPageChirho;
  pageIdChirho: number;
  wordCountChirho: number;
  hebrewWordCountChirho: number;
  textSourceByExactTextChirho: Map<string, string>;
  textSourceByHebrewSkeletonChirho: Map<string, string>;
  crnnSuggestionsBySkeletonChirho: Map<string, string[]>;
}

interface D1AuditChirho {
  dbPathChirho: string;
  pagesInD1Chirho: TargetPageChirho[];
  pagesWithWordsChirho: TargetPageChirho[];
  pagesWithoutSpansChirho: TargetPageChirho[];
  pageWitnessesChirho: Map<string, D1PageWitnessChirho>;
}

interface ExportReportChirho {
  generatedAtChirho: string;
  sourceDirChirho: string;
  outDirChirho: string;
  d1DbPathChirho: string | null;
  d1PageCountChirho: number | null;
  d1WordPageCountChirho: number | null;
  d1PagesWithoutSpansChirho: TargetPageChirho[];
  pageCountChirho: number;
  volumeCountChirho: number;
  lineCountChirho: number;
  spanCountChirho: number;
  unknownSpanCountChirho: number;
  replacementCharCountChirho: number;
  nonNfcSpanCountChirho: number;
  rtlDominantLineCountChirho: number;
  hebrewSpanCountChirho: number;
  passCOcrHebrewSpanCountChirho: number;
  crnnValidatedHebrewSpanCountChirho: number;
  provenanceCountsChirho: Record<string, number>;
  issueCountChirho: number;
  strictPassedChirho: boolean;
  pagesChirho: PageReportChirho[];
  issuesChirho: Array<SpanIssueChirho & TargetPageChirho>;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function parsePositiveIntChirho(valueChirho: string | undefined, labelChirho: string): number | undefined {
  if (valueChirho === undefined) return undefined;
  const parsedChirho = Number.parseInt(valueChirho, 10);
  if (!Number.isInteger(parsedChirho) || parsedChirho <= 0) {
    throw new Error(`${labelChirho} must be a positive integer; got ${valueChirho}`);
  }
  return parsedChirho;
}

function latestLocalD1PathChirho(): string | undefined {
  if (!existsSync(LOCAL_D1_DIR_CHIRHO)) return undefined;
  const sqliteFilesChirho = readdirSync(LOCAL_D1_DIR_CHIRHO)
    .filter((fileChirho) => fileChirho.endsWith(".sqlite"))
    .map((fileChirho) => join(LOCAL_D1_DIR_CHIRHO, fileChirho))
    .sort((aChirho, bChirho) => statSync(bChirho).mtimeMs - statSync(aChirho).mtimeMs);
  return sqliteFilesChirho[0];
}

function parseCliOptionsChirho(argsChirho: string[]): CliOptionsChirho {
  const volumeChirho = parsePositiveIntChirho(parseArgValueChirho(argsChirho, "vol"), "vol");
  const pageChirho = parsePositiveIntChirho(parseArgValueChirho(argsChirho, "page"), "page");
  const allChirho = argsChirho.includes("--all");
  const outDirChirho = parseArgValueChirho(argsChirho, "out-dir") ?? DEFAULT_MARKDOWN_DIR_CHIRHO;
  const strictChirho = argsChirho.includes("--strict");
  const d1AuditChirho = !argsChirho.includes("--no-d1-audit");
  const explicitDbPathChirho = parseArgValueChirho(argsChirho, "db");
  const dbPathChirho = explicitDbPathChirho ?? (d1AuditChirho ? latestLocalD1PathChirho() : undefined);
  const spanCommentsChirho = !argsChirho.includes("--no-span-comments");

  if (!allChirho && volumeChirho === undefined) {
    throw new Error("Pass --all, --vol=N, or --vol=N --page=P");
  }
  if (allChirho && (volumeChirho !== undefined || pageChirho !== undefined)) {
    throw new Error("--all cannot be combined with --vol or --page");
  }
  if (pageChirho !== undefined && volumeChirho === undefined) {
    throw new Error("--page requires --vol");
  }
  if (explicitDbPathChirho !== undefined && !existsSync(explicitDbPathChirho)) {
    throw new Error(`D1 sqlite database not found: ${explicitDbPathChirho}`);
  }

  return {
    allChirho,
    volumeChirho,
    pageChirho,
    outDirChirho,
    strictChirho,
    dbPathChirho,
    d1AuditChirho: d1AuditChirho && dbPathChirho !== undefined,
    spanCommentsChirho,
  };
}

function ensureDirChirho(pathChirho: string): void {
  if (!existsSync(pathChirho)) mkdirSync(pathChirho, { recursive: true });
}

function targetKeyChirho(targetChirho: TargetPageChirho): string {
  return `${targetChirho.volumeChirho}:${targetChirho.pageChirho}`;
}

function parseVolumeDirNameChirho(nameChirho: string): number | null {
  const matchChirho = nameChirho.match(VOL_DIR_RE_CHIRHO);
  return matchChirho ? Number.parseInt(matchChirho[1]!, 10) : null;
}

function parsePageDirNameChirho(nameChirho: string): number | null {
  const matchChirho = nameChirho.match(PAGE_DIR_RE_CHIRHO);
  return matchChirho ? Number.parseInt(matchChirho[1]!, 10) : null;
}

function parseLineFileNameChirho(nameChirho: string): number | null {
  const matchChirho = nameChirho.match(LINE_FILE_RE_CHIRHO);
  return matchChirho ? Number.parseInt(matchChirho[1]!, 10) : null;
}

function discoverTargetsChirho(optionsChirho: CliOptionsChirho): TargetPageChirho[] {
  if (!existsSync(SPANS_DIR_CHIRHO)) {
    throw new Error(`Span source directory not found: ${SPANS_DIR_CHIRHO}`);
  }

  const volumeNumbersChirho = optionsChirho.allChirho
    ? readdirSync(SPANS_DIR_CHIRHO)
        .map(parseVolumeDirNameChirho)
        .filter((vChirho): vChirho is number => vChirho !== null)
        .sort((aChirho, bChirho) => aChirho - bChirho)
    : [optionsChirho.volumeChirho!];

  const targetsChirho: TargetPageChirho[] = [];
  for (const volumeChirho of volumeNumbersChirho) {
    const volumeDirChirho = join(SPANS_DIR_CHIRHO, `vol-${volumeChirho}-chirho`);
    if (!existsSync(volumeDirChirho)) {
      throw new Error(`Span volume directory not found: ${volumeDirChirho}`);
    }

    const pagesChirho = optionsChirho.pageChirho !== undefined
      ? [optionsChirho.pageChirho]
      : readdirSync(volumeDirChirho)
          .map(parsePageDirNameChirho)
          .filter((pChirho): pChirho is number => pChirho !== null)
          .sort((aChirho, bChirho) => aChirho - bChirho);

    for (const pageChirho of pagesChirho) {
      targetsChirho.push({ volumeChirho, pageChirho });
    }
  }

  return targetsChirho;
}

function pageDirChirho(targetChirho: TargetPageChirho): string {
  return join(
    SPANS_DIR_CHIRHO,
    `vol-${targetChirho.volumeChirho}-chirho`,
    `page-${String(targetChirho.pageChirho).padStart(4, "0")}-chirho`
  );
}

function contextPathChirho(targetChirho: TargetPageChirho): string {
  return join(
    CONTEXT_DIR_CHIRHO,
    `vol-${targetChirho.volumeChirho}-chirho`,
    `page-${String(targetChirho.pageChirho).padStart(4, "0")}-chirho.json`
  );
}

function readContextSummaryChirho(targetChirho: TargetPageChirho): PageContextSummaryChirho {
  const pathChirho = contextPathChirho(targetChirho);
  if (!existsSync(pathChirho)) return {};
  const parsedChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as PageContextSummaryChirho;
  return {
    totalLinesChirho: parsedChirho.totalLinesChirho,
    totalWordsChirho: parsedChirho.totalWordsChirho,
    totalCandidatesChirho: parsedChirho.totalCandidatesChirho,
  };
}

function readSpanLinesChirho(targetChirho: TargetPageChirho): SpanLineChirho[] {
  const dirChirho = pageDirChirho(targetChirho);
  if (!existsSync(dirChirho)) {
    throw new Error(`Span page directory not found: ${dirChirho}`);
  }
  const lineFilesChirho = readdirSync(dirChirho)
    .map((fileChirho) => ({
      fileChirho,
      lineIndexChirho: parseLineFileNameChirho(fileChirho),
    }))
    .filter((itemChirho): itemChirho is { fileChirho: string; lineIndexChirho: number } =>
      itemChirho.lineIndexChirho !== null
    )
    .sort((aChirho, bChirho) => aChirho.lineIndexChirho - bChirho.lineIndexChirho);

  return lineFilesChirho.map((itemChirho) => {
    const pathChirho = join(dirChirho, itemChirho.fileChirho);
    return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho;
  });
}

function stripHebrewMarksChirho(textChirho: string): string {
  return textChirho.normalize("NFKD").replace(/[\u0591-\u05C7]/g, "");
}

function hebrewSkeletonChirho(textChirho: string): string {
  return stripHebrewMarksChirho(textChirho).replace(/[^\u05D0-\u05EA]/g, "");
}

function hebrewTokenSkeletonsChirho(textChirho: string): string[] {
  const tokenMatchesChirho = textChirho.match(/[\u0591-\u05C7\u05D0-\u05EA]+/g) ?? [];
  return tokenMatchesChirho
    .map(hebrewSkeletonChirho)
    .filter((tokenChirho) => tokenChirho.length > 0);
}

function normalizedExactTextChirho(textChirho: string): string {
  return normalizeTextForStorageChirho(textChirho.trim());
}

function addCountChirho(countsChirho: Record<string, number>, keyChirho: string): void {
  countsChirho[keyChirho] = (countsChirho[keyChirho] ?? 0) + 1;
}

function mergeCountsChirho(targetChirho: Record<string, number>, sourceChirho: Record<string, number>): void {
  for (const [keyChirho, valueChirho] of Object.entries(sourceChirho)) {
    targetChirho[keyChirho] = (targetChirho[keyChirho] ?? 0) + valueChirho;
  }
}

function readD1AuditChirho(dbPathChirho: string, spanTargetsChirho: TargetPageChirho[]): D1AuditChirho {
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  const spanTargetKeysChirho = new Set(spanTargetsChirho.map(targetKeyChirho));
  const pageRowsChirho = dbChirho
    .query(
      `SELECT p.id_chirho AS page_id_chirho,
              p.volume_number_chirho AS volume_chirho,
              p.page_number_chirho AS page_chirho,
              COUNT(w.id_chirho) AS word_count_chirho,
              COALESCE(SUM(CASE WHEN w.current_script_chirho = 'hebrew-chirho' THEN 1 ELSE 0 END), 0) AS hebrew_word_count_chirho
         FROM pages_chirho p
         LEFT JOIN scanlines_chirho sl ON sl.page_id_chirho = p.id_chirho
         LEFT JOIN words_chirho w ON w.scanline_id_chirho = sl.id_chirho
        GROUP BY p.id_chirho, p.volume_number_chirho, p.page_number_chirho
        ORDER BY p.volume_number_chirho, p.page_number_chirho`
    )
    .all() as Array<{
      page_id_chirho: number;
      volume_chirho: number;
      page_chirho: number;
      word_count_chirho: number;
      hebrew_word_count_chirho: number;
    }>;

  const pagesInD1Chirho = pageRowsChirho.map((rowChirho) => ({
    volumeChirho: rowChirho.volume_chirho,
    pageChirho: rowChirho.page_chirho,
  }));
  const pagesWithWordsChirho = pageRowsChirho
    .filter((rowChirho) => rowChirho.word_count_chirho > 0)
    .map((rowChirho) => ({
      volumeChirho: rowChirho.volume_chirho,
      pageChirho: rowChirho.page_chirho,
    }));
  const pagesWithoutSpansChirho = pagesInD1Chirho.filter(
    (targetChirho) => !spanTargetKeysChirho.has(targetKeyChirho(targetChirho))
  );
  const pageWitnessesChirho = new Map<string, D1PageWitnessChirho>();

  for (const rowChirho of pageRowsChirho) {
    const targetChirho = {
      volumeChirho: rowChirho.volume_chirho,
      pageChirho: rowChirho.page_chirho,
    };
    const pageKeyChirho = targetKeyChirho(targetChirho);
    if (!spanTargetKeysChirho.has(pageKeyChirho)) continue;

    const textSourceByExactTextChirho = new Map<string, string>();
    const textSourceByHebrewSkeletonChirho = new Map<string, string>();
    const wordRowsChirho = dbChirho
      .query(
        `SELECT current_text_chirho, current_script_chirho, current_source_chirho
           FROM words_chirho w
           JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
          WHERE sl.page_id_chirho = ?`
      )
      .all(rowChirho.page_id_chirho) as Array<{
        current_text_chirho: string | null;
        current_script_chirho: string | null;
        current_source_chirho: string | null;
      }>;

    for (const wordChirho of wordRowsChirho) {
      const textChirho = normalizedExactTextChirho(wordChirho.current_text_chirho ?? "");
      const sourceChirho = wordChirho.current_source_chirho ?? "none-chirho";
      if (textChirho.length > 0) textSourceByExactTextChirho.set(textChirho, sourceChirho);
      if (wordChirho.current_script_chirho === "hebrew-chirho") {
        const skeletonChirho = hebrewSkeletonChirho(textChirho);
        if (skeletonChirho.length > 0) textSourceByHebrewSkeletonChirho.set(skeletonChirho, sourceChirho);
      }
    }

    const crnnSuggestionsBySkeletonChirho = new Map<string, string[]>();
    const suggestionRowsChirho = dbChirho
      .query(
        `SELECT suggested_text_chirho
           FROM ocr_suggestions_chirho
          WHERE page_id_chirho = ? AND bucket_chirho IN ('AUTO', 'REVIEW')`
      )
      .all(rowChirho.page_id_chirho) as Array<{ suggested_text_chirho: string }>;
    for (const suggestionChirho of suggestionRowsChirho) {
      const skeletonChirho = hebrewSkeletonChirho(suggestionChirho.suggested_text_chirho);
      if (skeletonChirho.length === 0) continue;
      const existingChirho = crnnSuggestionsBySkeletonChirho.get(skeletonChirho) ?? [];
      existingChirho.push(suggestionChirho.suggested_text_chirho);
      crnnSuggestionsBySkeletonChirho.set(skeletonChirho, existingChirho);
    }

    pageWitnessesChirho.set(pageKeyChirho, {
      targetChirho,
      pageIdChirho: rowChirho.page_id_chirho,
      wordCountChirho: rowChirho.word_count_chirho,
      hebrewWordCountChirho: rowChirho.hebrew_word_count_chirho ?? 0,
      textSourceByExactTextChirho,
      textSourceByHebrewSkeletonChirho,
      crnnSuggestionsBySkeletonChirho,
    });
  }

  dbChirho.close();
  return {
    dbPathChirho,
    pagesInD1Chirho,
    pagesWithWordsChirho,
    pagesWithoutSpansChirho,
    pageWitnessesChirho,
  };
}

function addIssueChirho(
  issuesChirho: SpanIssueChirho[],
  severityChirho: "warning-chirho" | "error-chirho",
  codeChirho: string,
  messageChirho: string,
  lineIndexChirho?: number,
  segmentIndexChirho?: number
): void {
  issuesChirho.push({
    severityChirho,
    codeChirho,
    messageChirho,
    lineIndexChirho,
    segmentIndexChirho,
  });
}

function provenanceForSpanChirho(
  targetChirho: TargetPageChirho,
  spanChirho: SpanChirho,
  d1AuditChirho?: D1AuditChirho
): ProvenanceChirho {
  if (
    spanChirho.provenanceChirho !== undefined &&
    EXPLICIT_PROVENANCE_VALUES_CHIRHO.has(spanChirho.provenanceChirho)
  ) {
    return spanChirho.provenanceChirho as ProvenanceChirho;
  }
  if (spanChirho.scriptChirho === "unknown-chirho") return "unknown-chirho";
  if (
    spanChirho.scriptChirho === "french-chirho" ||
    spanChirho.scriptChirho === "latin-chirho" ||
    spanChirho.scriptChirho === "latin-non-french-chirho"
  ) {
    return "pdftotext-chirho";
  }

  const pageWitnessChirho = d1AuditChirho?.pageWitnessesChirho.get(targetKeyChirho(targetChirho));
  if (pageWitnessChirho) {
    if (spanChirho.scriptChirho === "hebrew-chirho") {
      const exactSourceChirho = pageWitnessChirho.textSourceByExactTextChirho.get(
        normalizedExactTextChirho(spanChirho.utf8TextChirho)
      );
      if (
        exactSourceChirho === "canonical-chirho" ||
        exactSourceChirho === "human-chirho" ||
        exactSourceChirho === "vision-chirho"
      ) {
        return exactSourceChirho;
      }

      const tokenSkeletonsChirho = hebrewTokenSkeletonsChirho(spanChirho.utf8TextChirho);
      const tokenSourcesChirho = tokenSkeletonsChirho
        .map((skeletonChirho) => pageWitnessChirho.textSourceByHebrewSkeletonChirho.get(skeletonChirho))
        .filter((sourceChirho): sourceChirho is string => sourceChirho !== undefined);
      if (tokenSkeletonsChirho.length > 0 && tokenSourcesChirho.length === tokenSkeletonsChirho.length) {
        if (tokenSourcesChirho.includes("human-chirho")) return "human-chirho";
        if (tokenSourcesChirho.includes("vision-chirho")) return "vision-chirho";
        if (tokenSourcesChirho.every((sourceChirho) => sourceChirho === "canonical-chirho")) {
          return "canonical-chirho";
        }
      }
    }
  }

  if (PASS_C_OCR_SCRIPTS_CHIRHO.has(spanChirho.scriptChirho)) return "pass-c-ocr-chirho";
  return "none-chirho";
}

function crnnSuggestionTextsForSpanChirho(
  targetChirho: TargetPageChirho,
  spanChirho: SpanChirho,
  d1AuditChirho?: D1AuditChirho
): string[] {
  if (spanChirho.scriptChirho !== "hebrew-chirho") return [];
  const pageWitnessChirho = d1AuditChirho?.pageWitnessesChirho.get(targetKeyChirho(targetChirho));
  if (!pageWitnessChirho) return [];
  const matchedTextsChirho = new Set<string>();
  for (const skeletonChirho of hebrewTokenSkeletonsChirho(spanChirho.utf8TextChirho)) {
    const suggestionTextsChirho = pageWitnessChirho.crnnSuggestionsBySkeletonChirho.get(skeletonChirho) ?? [];
    for (const textChirho of suggestionTextsChirho) matchedTextsChirho.add(textChirho);
  }
  return [...matchedTextsChirho].sort();
}

function isRtlDominantLineChirho(spansChirho: SpanChirho[]): boolean {
  let rtlCharsChirho = 0;
  let nonRtlCharsChirho = 0;
  let rtlSpanCountChirho = 0;
  for (const spanChirho of spansChirho) {
    const charCountChirho = [...spanChirho.utf8TextChirho.replace(/\s+/g, "")].length;
    if (RTL_SCRIPTS_CHIRHO.has(spanChirho.scriptChirho)) {
      rtlCharsChirho += charCountChirho;
      if (charCountChirho > 0) rtlSpanCountChirho++;
    } else {
      nonRtlCharsChirho += charCountChirho;
    }
  }
  return rtlSpanCountChirho >= 2 && rtlCharsChirho > 0 && nonRtlCharsChirho === 0;
}

function orderedSpansForTextChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  const spansChirho = [...lineChirho.spansChirho].sort(
    (aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );
  if (!isRtlDominantLineChirho(spansChirho)) return spansChirho;
  return [...spansChirho].sort((aChirho, bChirho) => bChirho.xMinPxChirho - aChirho.xMinPxChirho);
}

function textForSpanChirho(spanChirho: SpanChirho, lineIndexChirho: number): string {
  const textChirho = spanChirho.utf8TextChirho.trim();
  if (textChirho.length > 0) return textChirho;
  return `[EMPTY-SPAN-CHIRHO line=${lineIndexChirho} segment=${spanChirho.segmentIndexChirho}]`;
}

function lettersOnlyChirho(textChirho: string): string {
  return [...textChirho.normalize("NFC")]
    .filter((charChirho) => LETTER_RE_CHIRHO.test(charChirho))
    .join("");
}

function isVerifiedGreekEmbeddedInLatinTextChirho(spanChirho: SpanChirho): boolean {
  if (
    spanChirho.provenanceChirho !== "vision-chirho" &&
    spanChirho.provenanceChirho !== "human-chirho"
  ) {
    return false;
  }
  const textChirho = spanChirho.utf8TextChirho;
  return (
    GREEK_SCRIPT_IN_LATIN_TEXT_RE_CHIRHO.test(textChirho) &&
    !NON_GREEK_NON_LATIN_SCRIPT_IN_LATIN_TEXT_RE_CHIRHO.test(textChirho)
  );
}

function suspectTextReasonChirho(
  spanChirho: SpanChirho,
  previousSpanChirho: SpanChirho | undefined,
  nextSpanChirho: SpanChirho | undefined
): string | null {
  const textChirho = spanChirho.utf8TextChirho.trim();
  if (textChirho.length === 0 || spanChirho.scriptChirho === "unknown-chirho") return null;

  if (LATIN_TEXT_SCRIPTS_CHIRHO.has(spanChirho.scriptChirho)) {
    if (textChirho.includes("\\")) {
      return `Latin-script span contains a backslash, often indicating pdftotext garble: ${JSON.stringify(textChirho)}`;
    }
    if (NON_LATIN_SCRIPT_IN_LATIN_TEXT_RE_CHIRHO.test(textChirho)) {
      if (isVerifiedGreekEmbeddedInLatinTextChirho(spanChirho)) return null;
      return `Latin-script span contains non-Latin script codepoints: ${JSON.stringify(textChirho)}`;
    }
  }

  if (
    spanChirho.scriptChirho === "french-chirho" &&
    previousSpanChirho &&
    nextSpanChirho &&
    previousSpanChirho.scriptChirho === nextSpanChirho.scriptChirho &&
    PASS_C_OCR_SCRIPTS_CHIRHO.has(previousSpanChirho.scriptChirho)
  ) {
    const lettersChirho = lettersOnlyChirho(textChirho);
    if (
      lettersChirho.length > 0 &&
      lettersChirho.length <= 2 &&
      !SHORT_FRENCH_WORD_ALLOWLIST_CHIRHO.has(lettersChirho.toLocaleLowerCase("fr-FR"))
    ) {
      return `Short French span is sandwiched between ${previousSpanChirho.scriptChirho} spans; review for OCR split garble: ${JSON.stringify(textChirho)}`;
    }
  }

  const expectedScriptReChirho = EXPECTED_SCRIPT_CHAR_RE_CHIRHO[spanChirho.scriptChirho];
  if (expectedScriptReChirho && !expectedScriptReChirho.test(textChirho)) {
    return `${spanChirho.scriptChirho} span contains no codepoints from its declared script: ${JSON.stringify(textChirho)}`;
  }

  return null;
}

function spanCommentChirho(
  lineChirho: SpanLineChirho,
  auditsChirho: SpanAuditChirho[],
  rtlDominantChirho: boolean
): string {
  const lineAuditChirho = auditsChirho
    .filter((auditChirho) => auditChirho.lineIndexChirho === lineChirho.lineIndexChirho)
    .sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho)
    .map((auditChirho) => ({
      segmentIndexChirho: auditChirho.segmentIndexChirho,
      scriptChirho: auditChirho.scriptChirho,
      provenanceChirho: auditChirho.provenanceChirho,
      xMinPxChirho: auditChirho.xMinPxChirho,
      widthPxChirho: auditChirho.widthPxChirho,
      crnnSuggestionMatchCountChirho: auditChirho.crnnSuggestionMatchCountChirho,
      crnnSuggestionTextsChirho: auditChirho.crnnSuggestionTextsChirho,
    }));
  return `<!-- line-provenance-chirho: ${JSON.stringify({
    lineIndexChirho: lineChirho.lineIndexChirho,
    rtlDominantChirho,
    spansChirho: lineAuditChirho,
  })} -->`;
}

function validateLineChirho(
  targetChirho: TargetPageChirho,
  lineChirho: SpanLineChirho,
  expectedLineIndexChirho: number | null,
  issuesChirho: SpanIssueChirho[],
  unknownSpansChirho: UnknownSpanChirho[],
  provenanceCountsChirho: Record<string, number>,
  d1AuditChirho?: D1AuditChirho
): {
  textChirho: string;
  spanCountChirho: number;
  unknownSpanCountChirho: number;
  replacementCharCountChirho: number;
  nonNfcSpanCountChirho: number;
  rtlDominantLineCountChirho: number;
  hebrewSpanCountChirho: number;
  passCOcrHebrewSpanCountChirho: number;
  crnnValidatedHebrewSpanCountChirho: number;
  spanAuditChirho: SpanAuditChirho[];
} {
  if (lineChirho.schemaVersionChirho !== 2) {
    addIssueChirho(
      issuesChirho,
      "error-chirho",
      "schema-version-chirho",
      `Expected schemaVersionChirho=2, got ${lineChirho.schemaVersionChirho}`,
      lineChirho.lineIndexChirho
    );
  }
  if (lineChirho.volumeChirho !== targetChirho.volumeChirho || lineChirho.pageChirho !== targetChirho.pageChirho) {
    addIssueChirho(
      issuesChirho,
      "error-chirho",
      "target-mismatch-chirho",
      `Line file declares vol ${lineChirho.volumeChirho} p${lineChirho.pageChirho}`,
      lineChirho.lineIndexChirho
    );
  }
  if (expectedLineIndexChirho !== null && lineChirho.lineIndexChirho !== expectedLineIndexChirho) {
    addIssueChirho(
      issuesChirho,
      "warning-chirho",
      "line-gap-chirho",
      `Expected next line index ${expectedLineIndexChirho}, got ${lineChirho.lineIndexChirho}`,
      lineChirho.lineIndexChirho
    );
  }
  if (!Array.isArray(lineChirho.spansChirho) || lineChirho.spansChirho.length === 0) {
    addIssueChirho(
      issuesChirho,
      "error-chirho",
      "empty-spans-chirho",
      "Line has no spans",
      lineChirho.lineIndexChirho
    );
  }

  let unknownSpanCountChirho = 0;
  let replacementCharCountChirho = 0;
  let nonNfcSpanCountChirho = 0;
  let hebrewSpanCountChirho = 0;
  let passCOcrHebrewSpanCountChirho = 0;
  let crnnValidatedHebrewSpanCountChirho = 0;
  let expectedXChirho = 0;
  const spanAuditChirho: SpanAuditChirho[] = [];

  const spansBySegmentChirho = [...lineChirho.spansChirho].sort(
    (aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );

  for (let spanArrayIndexChirho = 0; spanArrayIndexChirho < spansBySegmentChirho.length; spanArrayIndexChirho++) {
    const spanChirho = spansBySegmentChirho[spanArrayIndexChirho]!;
    const previousSpanChirho = spansBySegmentChirho[spanArrayIndexChirho - 1];
    const nextSpanChirho = spansBySegmentChirho[spanArrayIndexChirho + 1];
    if (spanChirho.segmentIndexChirho !== spanAuditChirho.length) {
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "segment-index-gap-chirho",
        `Expected segment index ${spanAuditChirho.length}, got ${spanChirho.segmentIndexChirho}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }
    if (Math.abs(spanChirho.xMinPxChirho - expectedXChirho) > 1) {
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "span-tiling-gap-chirho",
        `Expected xMin ${expectedXChirho}, got ${spanChirho.xMinPxChirho}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }
    if (spanChirho.widthPxChirho <= 0) {
      addIssueChirho(
        issuesChirho,
        "error-chirho",
        "span-width-chirho",
        `Span width must be positive, got ${spanChirho.widthPxChirho}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }
    expectedXChirho = spanChirho.xMinPxChirho + spanChirho.widthPxChirho;

    if (spanChirho.utf8TextChirho.trim().length === 0) {
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "blank-span-text-chirho",
        "Span has no visible UTF-8 text; Markdown includes an EMPTY-SPAN marker",
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }

    if (spanChirho.needsSourceChirho) {
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "needs-source-chirho",
        `Human reviewer marked span as needing source review: ${JSON.stringify(spanChirho.utf8TextChirho)}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }
    if (spanChirho.badSegmentationChirho) {
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "bad-segmentation-chirho",
        `Human reviewer marked span as bad segmentation: ${JSON.stringify(spanChirho.utf8TextChirho)}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }
    if (Array.isArray(spanChirho.humanIssueFlagsChirho) && spanChirho.humanIssueFlagsChirho.length > 0) {
      const suggestedTextChirho = spanChirho.wlcSuggestedTextChirho ?? spanChirho.humanSuggestedTextChirho;
      const suggestionSourceChirho = spanChirho.wlcSuggestionSourceChirho ??
        (spanChirho.humanSuggestedTextChirho ? "human-suggested-text-chirho" : null);
      const suggestionMessageChirho = suggestedTextChirho
        ? `; suggested correction ${JSON.stringify(suggestedTextChirho)}${suggestionSourceChirho ? ` from ${suggestionSourceChirho}` : ""}`
        : "";
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "human-review-issues-chirho",
        `Human reviewer flagged ${spanChirho.humanIssueFlagsChirho.join(", ")}: ${JSON.stringify(spanChirho.utf8TextChirho)}${suggestionMessageChirho}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }

    const suspectTextMessageChirho = spanChirho.humanReviewStatusChirho === "reviewed-clean-chirho"
      ? null
      : suspectTextReasonChirho(spanChirho, previousSpanChirho, nextSpanChirho);
    if (suspectTextMessageChirho) {
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "suspect-text-chirho",
        suspectTextMessageChirho,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }

    if (spanChirho.scriptChirho === "unknown-chirho") {
      unknownSpanCountChirho++;
      unknownSpansChirho.push({
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        textChirho: spanChirho.utf8TextChirho,
      });
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "unknown-script-chirho",
        `Unknown script span still needs review: ${JSON.stringify(spanChirho.utf8TextChirho)}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }

    const provenanceChirho = provenanceForSpanChirho(targetChirho, spanChirho, d1AuditChirho);
    addCountChirho(provenanceCountsChirho, provenanceChirho);
    const crnnSuggestionTextsChirho = crnnSuggestionTextsForSpanChirho(targetChirho, spanChirho, d1AuditChirho);
    if (spanChirho.scriptChirho === "hebrew-chirho") {
      hebrewSpanCountChirho++;
      if (provenanceChirho === "pass-c-ocr-chirho") passCOcrHebrewSpanCountChirho++;
      if (crnnSuggestionTextsChirho.length > 0) crnnValidatedHebrewSpanCountChirho++;
    }

    const replacementMatchesChirho = spanChirho.utf8TextChirho.match(/\uFFFD/g);
    replacementCharCountChirho += replacementMatchesChirho?.length ?? 0;
    if (replacementMatchesChirho) {
      addIssueChirho(
        issuesChirho,
        "error-chirho",
        "replacement-char-chirho",
        "Span contains Unicode replacement character U+FFFD",
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }
    if (!isNfcTextChirho(spanChirho.utf8TextChirho)) {
      nonNfcSpanCountChirho++;
      addIssueChirho(
        issuesChirho,
        "warning-chirho",
        "non-nfc-text-chirho",
        `Span text is not Unicode NFC-normalized: ${JSON.stringify(spanChirho.utf8TextChirho)}`,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
    }

    spanAuditChirho.push({
      lineIndexChirho: lineChirho.lineIndexChirho,
      segmentIndexChirho: spanChirho.segmentIndexChirho,
      scriptChirho: spanChirho.scriptChirho,
      provenanceChirho,
      xMinPxChirho: spanChirho.xMinPxChirho,
      widthPxChirho: spanChirho.widthPxChirho,
      textPreviewChirho: spanChirho.utf8TextChirho.slice(0, 80),
      crnnSuggestionMatchCountChirho: crnnSuggestionTextsChirho.length,
      crnnSuggestionTextsChirho,
    });
  }

  if (Math.abs(expectedXChirho - lineChirho.lineWidthPxChirho) > 1) {
    addIssueChirho(
      issuesChirho,
      "warning-chirho",
      "line-width-coverage-chirho",
      `Spans end at ${expectedXChirho}, line width is ${lineChirho.lineWidthPxChirho}`,
      lineChirho.lineIndexChirho
    );
  }

  const rtlDominantChirho = isRtlDominantLineChirho(lineChirho.spansChirho);
  const orderedTextSpansChirho = orderedSpansForTextChirho(lineChirho);

  return {
    textChirho: orderedTextSpansChirho
      .map((spanChirho) => textForSpanChirho(spanChirho, lineChirho.lineIndexChirho))
      .filter((textChirho) => textChirho.length > 0)
      .join(" "),
    spanCountChirho: lineChirho.spansChirho.length,
    unknownSpanCountChirho,
    replacementCharCountChirho,
    nonNfcSpanCountChirho,
    rtlDominantLineCountChirho: rtlDominantChirho ? 1 : 0,
    hebrewSpanCountChirho,
    passCOcrHebrewSpanCountChirho,
    crnnValidatedHebrewSpanCountChirho,
    spanAuditChirho,
  };
}

function buildPageBodyMarkdownChirho(
  linesChirho: Array<{ lineChirho: SpanLineChirho; textChirho: string; rtlDominantChirho: boolean }>,
  pageExportChirho: Omit<PageExportChirho, "markdownChirho" | "markdownBodyChirho" | "plainTextChirho">,
  spanCommentsChirho: boolean
): string {
  const bodyChirho: string[] = [];
  for (const lineChirho of linesChirho) {
    if (spanCommentsChirho) {
      bodyChirho.push(spanCommentChirho(lineChirho.lineChirho, pageExportChirho.spanAuditChirho, lineChirho.rtlDominantChirho));
    }
    bodyChirho.push(lineChirho.textChirho);
  }
  return `${bodyChirho.join("\n")}\n`;
}

function buildPageMarkdownChirho(
  targetChirho: TargetPageChirho,
  pageExportChirho: Omit<PageExportChirho, "markdownChirho" | "markdownBodyChirho" | "plainTextChirho">,
  markdownBodyChirho: string
): string {
  const volumeMetaChirho = VOLUMES_CHIRHO[targetChirho.volumeChirho];
  const titleChirho = `Volume ${targetChirho.volumeChirho}, Page ${targetChirho.pageChirho}`;
  const statusChirho = pageExportChirho.issuesChirho.length === 0 ? "complete-chirho" : "needs-review-chirho";
  const headerChirho = [
    JOHN_COMMENT_CHIRHO.trimEnd(),
    "",
    `# ${titleChirho}`,
    "",
    `<!-- source-chirho: Pass C spans; volume-year-chirho: ${volumeMetaChirho?.yearChirho ?? "unknown"}; status-chirho: ${statusChirho}; lines-chirho: ${pageExportChirho.lineCountChirho}; spans-chirho: ${pageExportChirho.spanCountChirho}; unknown-spans-chirho: ${pageExportChirho.unknownSpanCountChirho}; hebrew-spans-chirho: ${pageExportChirho.hebrewSpanCountChirho}; pass-c-ocr-hebrew-spans-chirho: ${pageExportChirho.passCOcrHebrewSpanCountChirho}; crnn-validated-hebrew-spans-chirho: ${pageExportChirho.crnnValidatedHebrewSpanCountChirho} -->`,
    "",
  ];
  return `${headerChirho.join("\n")}${markdownBodyChirho}`;
}

function exportPageChirho(
  targetChirho: TargetPageChirho,
  optionsChirho: CliOptionsChirho,
  d1AuditChirho?: D1AuditChirho
): PageExportChirho {
  const contextChirho = readContextSummaryChirho(targetChirho);
  const linesChirho = readSpanLinesChirho(targetChirho);
  const issuesChirho: SpanIssueChirho[] = [];
  const unknownSpansChirho: UnknownSpanChirho[] = [];
  const renderedLinesChirho: Array<{ lineChirho: SpanLineChirho; textChirho: string; rtlDominantChirho: boolean }> = [];
  const spanAuditChirho: SpanAuditChirho[] = [];
  const provenanceCountsChirho: Record<string, number> = {};

  if (contextChirho.totalLinesChirho !== undefined && linesChirho.length !== contextChirho.totalLinesChirho) {
    addIssueChirho(
      issuesChirho,
      "error-chirho",
      "context-line-count-mismatch-chirho",
      `Span line count ${linesChirho.length} does not match context totalLinesChirho ${contextChirho.totalLinesChirho}`
    );
  }

  let expectedLineIndexChirho: number | null = linesChirho.length > 0 ? linesChirho[0]!.lineIndexChirho : null;
  let spanCountChirho = 0;
  let unknownSpanCountChirho = 0;
  let replacementCharCountChirho = 0;
  let nonNfcSpanCountChirho = 0;
  let rtlDominantLineCountChirho = 0;
  let hebrewSpanCountChirho = 0;
  let passCOcrHebrewSpanCountChirho = 0;
  let crnnValidatedHebrewSpanCountChirho = 0;

  for (const lineChirho of linesChirho) {
    const validatedChirho = validateLineChirho(
      targetChirho,
      lineChirho,
      expectedLineIndexChirho,
      issuesChirho,
      unknownSpansChirho,
      provenanceCountsChirho,
      d1AuditChirho
    );
    renderedLinesChirho.push({
      lineChirho,
      textChirho: validatedChirho.textChirho,
      rtlDominantChirho: validatedChirho.rtlDominantLineCountChirho > 0,
    });
    spanAuditChirho.push(...validatedChirho.spanAuditChirho);
    spanCountChirho += validatedChirho.spanCountChirho;
    unknownSpanCountChirho += validatedChirho.unknownSpanCountChirho;
    replacementCharCountChirho += validatedChirho.replacementCharCountChirho;
    nonNfcSpanCountChirho += validatedChirho.nonNfcSpanCountChirho;
    rtlDominantLineCountChirho += validatedChirho.rtlDominantLineCountChirho;
    hebrewSpanCountChirho += validatedChirho.hebrewSpanCountChirho;
    passCOcrHebrewSpanCountChirho += validatedChirho.passCOcrHebrewSpanCountChirho;
    crnnValidatedHebrewSpanCountChirho += validatedChirho.crnnValidatedHebrewSpanCountChirho;
    expectedLineIndexChirho = lineChirho.lineIndexChirho + 1;
  }

  const plainTextChirho = `${renderedLinesChirho.map((lineChirho) => lineChirho.textChirho).join("\n")}\n`;
  const pageWithoutMarkdownChirho = {
    targetChirho,
    lineCountChirho: linesChirho.length,
    spanCountChirho,
    unknownSpanCountChirho,
    replacementCharCountChirho,
    nonNfcSpanCountChirho,
    rtlDominantLineCountChirho,
    hebrewSpanCountChirho,
    passCOcrHebrewSpanCountChirho,
    crnnValidatedHebrewSpanCountChirho,
    provenanceCountsChirho,
    contextChirho,
    issuesChirho,
    unknownSpansChirho,
    spanAuditChirho,
  };
  const markdownBodyChirho = buildPageBodyMarkdownChirho(
    renderedLinesChirho,
    pageWithoutMarkdownChirho,
    optionsChirho.spanCommentsChirho
  );
  const markdownChirho = buildPageMarkdownChirho(
    targetChirho,
    pageWithoutMarkdownChirho,
    markdownBodyChirho
  );

  return {
    ...pageWithoutMarkdownChirho,
    markdownChirho,
    markdownBodyChirho,
    plainTextChirho,
  };
}

function pageMarkdownPathChirho(outDirChirho: string, targetChirho: TargetPageChirho): string {
  return join(
    outDirChirho,
    `vol-${targetChirho.volumeChirho}-chirho`,
    `page-${String(targetChirho.pageChirho).padStart(4, "0")}-chirho.md`
  );
}

function volumeMarkdownPathChirho(outDirChirho: string, volumeChirho: number): string {
  return join(outDirChirho, `vol-${volumeChirho}-chirho`, `volume-${volumeChirho}-chirho.md`);
}

function buildVolumeMarkdownChirho(
  volumeChirho: number,
  pagesChirho: PageExportChirho[]
): string {
  const volumeMetaChirho = VOLUMES_CHIRHO[volumeChirho];
  const bodyChirho: string[] = [
    JOHN_COMMENT_CHIRHO.trimEnd(),
    "",
    `# Barthélemy — Critique textuelle de l'Ancien Testament — Volume ${volumeChirho}`,
    "",
    `<!-- source-chirho: Pass C spans; volume-year-chirho: ${volumeMetaChirho?.yearChirho ?? "unknown"}; pages-chirho: ${pagesChirho.length}; description-chirho: ${volumeMetaChirho?.descriptionChirho ?? "unknown"} -->`,
    "",
  ];

  for (const pageChirho of pagesChirho) {
    const statusChirho = pageChirho.issuesChirho.length === 0 ? "complete-chirho" : "needs-review-chirho";
    bodyChirho.push(
      "",
      "---",
      "",
      `## Page ${pageChirho.targetChirho.pageChirho}`,
      "",
      `<!-- status-chirho: ${statusChirho}; lines-chirho: ${pageChirho.lineCountChirho}; spans-chirho: ${pageChirho.spanCountChirho}; unknown-spans-chirho: ${pageChirho.unknownSpanCountChirho}; hebrew-spans-chirho: ${pageChirho.hebrewSpanCountChirho}; pass-c-ocr-hebrew-spans-chirho: ${pageChirho.passCOcrHebrewSpanCountChirho}; crnn-validated-hebrew-spans-chirho: ${pageChirho.crnnValidatedHebrewSpanCountChirho}; issues-chirho: ${pageChirho.issuesChirho.length} -->`,
      "",
      pageChirho.markdownBodyChirho.trimEnd(),
      ""
    );
  }

  return `${bodyChirho.join("\n").replace(/\n{4,}/g, "\n\n\n").trimEnd()}\n`;
}

function pageReportChirho(outDirChirho: string, pageChirho: PageExportChirho): PageReportChirho {
  return {
    volumeChirho: pageChirho.targetChirho.volumeChirho,
    pageChirho: pageChirho.targetChirho.pageChirho,
    markdownPathChirho: pageMarkdownPathChirho(outDirChirho, pageChirho.targetChirho),
    lineCountChirho: pageChirho.lineCountChirho,
    expectedLineCountChirho: pageChirho.contextChirho.totalLinesChirho ?? null,
    spanCountChirho: pageChirho.spanCountChirho,
    unknownSpanCountChirho: pageChirho.unknownSpanCountChirho,
    replacementCharCountChirho: pageChirho.replacementCharCountChirho,
    nonNfcSpanCountChirho: pageChirho.nonNfcSpanCountChirho,
    rtlDominantLineCountChirho: pageChirho.rtlDominantLineCountChirho,
    hebrewSpanCountChirho: pageChirho.hebrewSpanCountChirho,
    passCOcrHebrewSpanCountChirho: pageChirho.passCOcrHebrewSpanCountChirho,
    crnnValidatedHebrewSpanCountChirho: pageChirho.crnnValidatedHebrewSpanCountChirho,
    provenanceCountsChirho: pageChirho.provenanceCountsChirho,
    issueCountChirho: pageChirho.issuesChirho.length,
    qualityStatusChirho: pageChirho.issuesChirho.length === 0 ? "complete-chirho" : "needs-review-chirho",
  };
}

async function runExportChirho(optionsChirho: CliOptionsChirho): Promise<ExportReportChirho> {
  const targetsChirho = discoverTargetsChirho(optionsChirho);
  const coverageTargetsChirho = discoverTargetsChirho({
    ...optionsChirho,
    allChirho: true,
    volumeChirho: undefined,
    pageChirho: undefined,
  });
  const d1AuditChirho = optionsChirho.d1AuditChirho && optionsChirho.dbPathChirho
    ? readD1AuditChirho(optionsChirho.dbPathChirho, coverageTargetsChirho)
    : undefined;
  const pageExportsChirho = targetsChirho.map((targetChirho) =>
    exportPageChirho(targetChirho, optionsChirho, d1AuditChirho)
  );
  const pagesByVolumeChirho = new Map<number, PageExportChirho[]>();

  for (const pageChirho of pageExportsChirho) {
    const volumePagesChirho = pagesByVolumeChirho.get(pageChirho.targetChirho.volumeChirho) ?? [];
    volumePagesChirho.push(pageChirho);
    pagesByVolumeChirho.set(pageChirho.targetChirho.volumeChirho, volumePagesChirho);

    const pagePathChirho = pageMarkdownPathChirho(optionsChirho.outDirChirho, pageChirho.targetChirho);
    ensureDirChirho(join(optionsChirho.outDirChirho, `vol-${pageChirho.targetChirho.volumeChirho}-chirho`));
    await Bun.write(pagePathChirho, pageChirho.markdownChirho);
  }

  for (const [volumeChirho, pagesChirho] of [...pagesByVolumeChirho.entries()].sort((aChirho, bChirho) => aChirho[0] - bChirho[0])) {
    const sortedPagesChirho = pagesChirho.sort((aChirho, bChirho) => aChirho.targetChirho.pageChirho - bChirho.targetChirho.pageChirho);
    const volumePathChirho = volumeMarkdownPathChirho(optionsChirho.outDirChirho, volumeChirho);
    ensureDirChirho(join(optionsChirho.outDirChirho, `vol-${volumeChirho}-chirho`));
    await Bun.write(volumePathChirho, buildVolumeMarkdownChirho(volumeChirho, sortedPagesChirho));
  }

  const pageReportsChirho = pageExportsChirho.map((pageChirho) => pageReportChirho(optionsChirho.outDirChirho, pageChirho));
  const issuesChirho = pageExportsChirho.flatMap((pageChirho) =>
    pageChirho.issuesChirho.map((issueChirho) => ({
      ...issueChirho,
      volumeChirho: pageChirho.targetChirho.volumeChirho,
      pageChirho: pageChirho.targetChirho.pageChirho,
    }))
  );
  const provenanceCountsChirho: Record<string, number> = {};
  for (const pageChirho of pageExportsChirho) {
    mergeCountsChirho(provenanceCountsChirho, pageChirho.provenanceCountsChirho);
  }
  const strictPassedChirho = issuesChirho.length === 0;
  const reportChirho: ExportReportChirho = {
    generatedAtChirho: new Date().toISOString(),
    sourceDirChirho: SPANS_DIR_CHIRHO,
    outDirChirho: optionsChirho.outDirChirho,
    d1DbPathChirho: d1AuditChirho?.dbPathChirho ?? null,
    d1PageCountChirho: d1AuditChirho?.pagesInD1Chirho.length ?? null,
    d1WordPageCountChirho: d1AuditChirho?.pagesWithWordsChirho.length ?? null,
    d1PagesWithoutSpansChirho: d1AuditChirho?.pagesWithoutSpansChirho ?? [],
    pageCountChirho: pageReportsChirho.length,
    volumeCountChirho: pagesByVolumeChirho.size,
    lineCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.lineCountChirho, 0),
    spanCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.spanCountChirho, 0),
    unknownSpanCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.unknownSpanCountChirho, 0),
    replacementCharCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.replacementCharCountChirho, 0),
    nonNfcSpanCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.nonNfcSpanCountChirho, 0),
    rtlDominantLineCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.rtlDominantLineCountChirho, 0),
    hebrewSpanCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.hebrewSpanCountChirho, 0),
    passCOcrHebrewSpanCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.passCOcrHebrewSpanCountChirho, 0),
    crnnValidatedHebrewSpanCountChirho: pageReportsChirho.reduce((sumChirho, pageChirho) => sumChirho + pageChirho.crnnValidatedHebrewSpanCountChirho, 0),
    provenanceCountsChirho,
    issueCountChirho: issuesChirho.length,
    strictPassedChirho,
    pagesChirho: pageReportsChirho,
    issuesChirho,
  };

  ensureDirChirho(optionsChirho.outDirChirho);
  await Bun.write(
    join(optionsChirho.outDirChirho, "export-report-chirho.json"),
    `${JSON.stringify(reportChirho, null, 2)}\n`
  );

  if (optionsChirho.strictChirho && !strictPassedChirho) {
    throw new Error(`Strict export failed: ${issuesChirho.length} issue(s); see export-report-chirho.json`);
  }

  return reportChirho;
}

if (import.meta.main) {
  try {
    const optionsChirho = parseCliOptionsChirho(process.argv.slice(2));
    const reportChirho = await runExportChirho(optionsChirho);
    console.log(
      `[${MODULE_CHIRHO}] wrote ${reportChirho.pageCountChirho} page markdown file(s), ` +
        `${reportChirho.volumeCountChirho} volume markdown file(s), ` +
        `${reportChirho.lineCountChirho} line(s), ${reportChirho.spanCountChirho} span(s).`
    );
    console.log(
      `[${MODULE_CHIRHO}] issues=${reportChirho.issueCountChirho}, ` +
        `unknownSpans=${reportChirho.unknownSpanCountChirho}, ` +
        `hebrewSpans=${reportChirho.hebrewSpanCountChirho}, ` +
        `passCOcrHebrewSpans=${reportChirho.passCOcrHebrewSpanCountChirho}, ` +
        `crnnValidatedHebrewSpans=${reportChirho.crnnValidatedHebrewSpanCountChirho}, ` +
        `d1GapPages=${reportChirho.d1PagesWithoutSpansChirho.length}, ` +
        `report=${join(optionsChirho.outDirChirho, "export-report-chirho.json")}`
    );
  } catch (errorChirho) {
    console.error(`[${MODULE_CHIRHO}] ${errorChirho instanceof Error ? errorChirho.message : String(errorChirho)}`);
    process.exit(1);
  }
}
