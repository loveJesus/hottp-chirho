// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Report the difference between a structurally clean export and a fully
 * certified transcription.
 *
 * Default mode writes a status report and exits 0. Use --strict to make this a
 * gate: exit 1 until no raw Pass-C Hebrew spans and no vision-tier non-Latin
 * spans remain uncertified.
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

import { PROGRESS_DB_PATH_CHIRHO, PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MODULE_CHIRHO = "transcription-certification-status-chirho";
const EXPORT_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "markdown-chirho",
  "export-report-chirho.json"
);
const RAW_HEBREW_REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho",
  "pass-c-hebrew-validation-chirho.json"
);
const EXPERT_PACK_MANIFEST_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho",
  "manifest-chirho.json"
);
const OUT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "certification-status-chirho");
const SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const LOCAL_D1_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "app-chirho",
  ".wrangler",
  "state",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject"
);
const VOL_DIR_RE_CHIRHO = /^vol-(\d+)-chirho$/;
const PAGE_DIR_RE_CHIRHO = /^page-(\d+)-chirho$/;
const LINE_FILE_RE_CHIRHO = /^line-(\d+)-chirho\.json$/;
const EXPERT_REVIEW_SCRIPT_VALUES_CHIRHO = new Set([
  "hebrew-chirho",
  "greek-chirho",
  "arabic-chirho",
  "syriac-chirho",
]);

interface ExportReportChirho {
  generatedAtChirho?: string;
  strictPassedChirho?: boolean;
  issueCountChirho?: number;
  unknownSpanCountChirho?: number;
  hebrewSpanCountChirho?: number;
  passCOcrHebrewSpanCountChirho?: number;
  crnnValidatedHebrewSpanCountChirho?: number;
  d1PagesWithoutSpansChirho?: unknown[];
}

interface RawHebrewSpanChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  validationStatusChirho: string;
  textChirho: string;
}

interface RawHebrewReportChirho {
  generatedAtChirho?: string;
  sourceFilterChirho?: string;
  sourceCountsChirho?: Record<string, number>;
  spanCountChirho?: number;
  tokenCountChirho?: number;
  allTokenValidatedSpanCountChirho?: number;
  partialTokenValidatedSpanCountChirho?: number;
  unvalidatedSpanCountChirho?: number;
  validatedTokenCountChirho?: number;
  spansChirho?: RawHebrewSpanChirho[];
}

interface ExpertPackManifestChirho {
  generatedAtChirho?: string;
  priorityItemsChirho?: unknown[];
  completeVisionCountsChirho?: Record<string, number>;
  completeVisionItemsChirho?: unknown[];
}

interface SpanChirho {
  scriptChirho: string;
  provenanceChirho?: string;
}

interface SpanLineChirho {
  spansChirho: SpanChirho[];
}

interface HumanValidationDbRowChirho {
  volume_chirho: number;
  page_chirho: number;
  line_index_chirho: number;
  segment_index_chirho: number;
  verdict_chirho: string;
  applied_at_chirho: string | null;
  schema_version_chirho: number;
}

interface HumanValidationSummaryChirho {
  currentSchema2RowsChirho: number;
  reviewedCleanRowsChirho: number;
  reviewedIssueRowsChirho: number;
  appliedRowsChirho: number;
  rawQueueCurrentRowsChirho: number;
  rawQueueCleanRowsChirho: number;
  rawQueueIssueRowsChirho: number;
  rawQueueAppliedRowsChirho: number;
  legacyCurrentRowsChirho: number;
}

interface CertificationStatusChirho {
  generatedAtChirho: string;
  artifactsChirho: {
    exportReportExistsChirho: boolean;
    rawHebrewReportExistsChirho: boolean;
    expertPackManifestExistsChirho: boolean;
    exportReportShapeOkChirho: boolean;
    rawHebrewReportShapeOkChirho: boolean;
    expertPackManifestShapeOkChirho: boolean;
  };
  structuralChirho: {
    exportGeneratedAtChirho: string | null;
    strictPassedChirho: boolean;
    issueCountChirho: number;
    unknownSpanCountChirho: number;
    d1GapPageCountChirho: number;
    hebrewSpanCountChirho: number;
    passCOcrHebrewSpanCountChirho: number;
    crnnValidatedHebrewSpanCountChirho: number;
  };
  rawHebrewChirho: {
    reportGeneratedAtChirho: string | null;
    sourceFilterChirho: string | null;
    reportSpanCountChirho: number;
    reportTokenCountChirho: number;
    unvalidatedSpanCountChirho: number;
    partialValidatedSpanCountChirho: number;
    allTokenValidatedSpanCountChirho: number;
    validatedTokenCountChirho: number;
    sourceCountsChirho: Record<string, number>;
    exportPassCOcrMatchesReportChirho: boolean;
  };
  visionTierChirho: {
    manifestGeneratedAtChirho: string | null;
    priorityItemCountChirho: number;
    completeVisionItemCountChirho: number;
    completeVisionCountsChirho: Record<string, number>;
  };
  latinSymbolVisionChirho: {
    explicitVisionItemCountChirho: number;
    explicitVisionCountsChirho: Record<string, number>;
    d1DerivedVisionWordCountChirho: number;
    d1DerivedVisionCountsChirho: Record<string, number>;
    includedInCompletionGateChirho: boolean;
  };
  humanValidationDbChirho: HumanValidationSummaryChirho;
  certificationCompleteChirho: boolean;
  remainingWorkChirho: string[];
}

function readJsonFileChirho<TChirho>(pathChirho: string, fallbackChirho: TChirho): TChirho {
  if (!existsSync(pathChirho)) return fallbackChirho;
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function spanKeyChirho(spanChirho: Pick<RawHebrewSpanChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return [
    spanChirho.volumeChirho,
    spanChirho.pageChirho,
    spanChirho.lineIndexChirho,
    spanChirho.segmentIndexChirho,
  ].join(":");
}

function rowKeyChirho(rowChirho: Pick<HumanValidationDbRowChirho, "volume_chirho" | "page_chirho" | "line_index_chirho" | "segment_index_chirho">): string {
  return [
    rowChirho.volume_chirho,
    rowChirho.page_chirho,
    rowChirho.line_index_chirho,
    rowChirho.segment_index_chirho,
  ].join(":");
}

function tableExistsChirho(dbChirho: Database, tableNameChirho: string): boolean {
  const rowChirho = dbChirho
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableNameChirho) as { name: string } | undefined;
  return rowChirho !== undefined;
}

function tableColumnsChirho(dbChirho: Database, tableNameChirho: string): string[] {
  if (!tableExistsChirho(dbChirho, tableNameChirho)) return [];
  return (dbChirho.query(`PRAGMA table_info(${tableNameChirho})`).all() as Array<{ name: string }>).map(
    (rowChirho) => rowChirho.name
  );
}

function validationRowsChirho(dbPathChirho: string): HumanValidationDbRowChirho[] {
  if (!existsSync(dbPathChirho)) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const columnsChirho = new Set(tableColumnsChirho(dbChirho, "pass_c_human_validations_chirho"));
    if (columnsChirho.size === 0) return [];
    const hasSchemaVersionChirho = columnsChirho.has("schema_version_chirho");
    const hasAppliedAtChirho = columnsChirho.has("applied_at_chirho");
    return dbChirho
      .query(`
        SELECT volume_chirho, page_chirho, line_index_chirho, segment_index_chirho,
               verdict_chirho,
               ${hasAppliedAtChirho ? "applied_at_chirho" : "NULL AS applied_at_chirho"},
               ${hasSchemaVersionChirho ? "schema_version_chirho" : "1 AS schema_version_chirho"}
          FROM pass_c_human_validations_chirho
         WHERE is_current_chirho = 1
           AND verdict_chirho <> 'undo-chirho'
         ORDER BY volume_chirho, page_chirho, line_index_chirho, segment_index_chirho`)
      .all() as HumanValidationDbRowChirho[];
  } finally {
    dbChirho.close();
  }
}

function summarizeHumanValidationsChirho(
  rowsChirho: HumanValidationDbRowChirho[],
  rawSpansChirho: RawHebrewSpanChirho[]
): HumanValidationSummaryChirho {
  const rawKeysChirho = new Set(rawSpansChirho.map(spanKeyChirho));
  const schema2RowsChirho = rowsChirho.filter((rowChirho) => rowChirho.schema_version_chirho >= 2);
  const rawRowsChirho = schema2RowsChirho.filter((rowChirho) => rawKeysChirho.has(rowKeyChirho(rowChirho)));
  return {
    currentSchema2RowsChirho: schema2RowsChirho.length,
    reviewedCleanRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-clean-chirho").length,
    reviewedIssueRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-issues-chirho").length,
    appliedRowsChirho: schema2RowsChirho.filter((rowChirho) => rowChirho.applied_at_chirho !== null).length,
    rawQueueCurrentRowsChirho: rawRowsChirho.length,
    rawQueueCleanRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-clean-chirho").length,
    rawQueueIssueRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.verdict_chirho === "reviewed-issues-chirho").length,
    rawQueueAppliedRowsChirho: rawRowsChirho.filter((rowChirho) => rowChirho.applied_at_chirho !== null).length,
    legacyCurrentRowsChirho: rowsChirho.filter((rowChirho) => rowChirho.schema_version_chirho < 2).length,
  };
}

function sortedDirNumbersChirho(rootChirho: string, reChirho: RegExp): number[] {
  if (!existsSync(rootChirho)) return [];
  return readdirSync(rootChirho)
    .map((nameChirho) => nameChirho.match(reChirho)?.[1])
    .filter((valueChirho): valueChirho is string => valueChirho !== undefined)
    .map((valueChirho) => Number.parseInt(valueChirho, 10))
    .sort((aChirho, bChirho) => aChirho - bChirho);
}

function lineFilePathsChirho(): string[] {
  const pathsChirho: string[] = [];
  for (const volumeChirho of sortedDirNumbersChirho(SPANS_ROOT_CHIRHO, VOL_DIR_RE_CHIRHO)) {
    const volumeDirChirho = join(SPANS_ROOT_CHIRHO, `vol-${volumeChirho}-chirho`);
    for (const pageChirho of sortedDirNumbersChirho(volumeDirChirho, PAGE_DIR_RE_CHIRHO)) {
      const pageDirChirho = join(volumeDirChirho, `page-${String(pageChirho).padStart(4, "0")}-chirho`);
      for (const lineChirho of sortedDirNumbersChirho(pageDirChirho, LINE_FILE_RE_CHIRHO)) {
        pathsChirho.push(join(pageDirChirho, `line-${String(lineChirho).padStart(3, "0")}-chirho.json`));
      }
    }
  }
  return pathsChirho;
}

function latinSymbolVisionCountsChirho(): Record<string, number> {
  const countsChirho: Record<string, number> = {};
  for (const pathChirho of lineFilePathsChirho()) {
    const lineChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho;
    for (const spanChirho of lineChirho.spansChirho) {
      if (spanChirho.provenanceChirho !== "vision-chirho") continue;
      if (EXPERT_REVIEW_SCRIPT_VALUES_CHIRHO.has(spanChirho.scriptChirho)) continue;
      countsChirho[spanChirho.scriptChirho] = (countsChirho[spanChirho.scriptChirho] ?? 0) + 1;
    }
  }
  return countsChirho;
}

function sumCountsChirho(countsChirho: Record<string, number>): number {
  return Object.values(countsChirho).reduce((sumChirho, countChirho) => sumChirho + countChirho, 0);
}

function latestLocalD1PathChirho(): string | null {
  if (!existsSync(LOCAL_D1_DIR_CHIRHO)) return null;
  const sqliteFilesChirho = readdirSync(LOCAL_D1_DIR_CHIRHO)
    .filter((fileChirho) => fileChirho.endsWith(".sqlite"))
    .map((fileChirho) => join(LOCAL_D1_DIR_CHIRHO, fileChirho))
    .sort((aChirho, bChirho) => statSync(bChirho).mtimeMs - statSync(aChirho).mtimeMs);
  return sqliteFilesChirho[0] ?? null;
}

function d1DerivedLatinSymbolVisionCountsChirho(): Record<string, number> {
  const dbPathChirho = latestLocalD1PathChirho();
  if (dbPathChirho === null) return {};
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowsChirho = dbChirho
      .query(`
        SELECT w.current_script_chirho AS current_script_chirho
          FROM words_chirho w
         WHERE w.current_source_chirho = 'vision-chirho'`)
      .all() as Array<{ current_script_chirho: string | null }>;
    const countsChirho: Record<string, number> = {};
    for (const rowChirho of rowsChirho) {
      const scriptChirho = rowChirho.current_script_chirho ?? "unknown-chirho";
      if (EXPERT_REVIEW_SCRIPT_VALUES_CHIRHO.has(scriptChirho)) continue;
      countsChirho[scriptChirho] = (countsChirho[scriptChirho] ?? 0) + 1;
    }
    return countsChirho;
  } finally {
    dbChirho.close();
  }
}

function buildStatusChirho(dbPathChirho: string): CertificationStatusChirho {
  const exportReportExistsChirho = existsSync(EXPORT_REPORT_PATH_CHIRHO);
  const rawHebrewReportExistsChirho = existsSync(RAW_HEBREW_REPORT_PATH_CHIRHO);
  const expertPackManifestExistsChirho = existsSync(EXPERT_PACK_MANIFEST_PATH_CHIRHO);
  const exportReportChirho = readJsonFileChirho<ExportReportChirho>(EXPORT_REPORT_PATH_CHIRHO, {});
  const rawReportChirho = readJsonFileChirho<RawHebrewReportChirho>(RAW_HEBREW_REPORT_PATH_CHIRHO, {});
  const expertManifestChirho = readJsonFileChirho<ExpertPackManifestChirho>(EXPERT_PACK_MANIFEST_PATH_CHIRHO, {});
  const exportReportShapeOkChirho =
    !exportReportExistsChirho ||
    (typeof exportReportChirho.strictPassedChirho === "boolean" &&
      typeof exportReportChirho.issueCountChirho === "number");
  const rawHebrewReportShapeOkChirho =
    !rawHebrewReportExistsChirho ||
    (Array.isArray(rawReportChirho.spansChirho) &&
      typeof rawReportChirho.sourceFilterChirho === "string");
  const expertPackManifestShapeOkChirho =
    !expertPackManifestExistsChirho ||
    (Array.isArray(expertManifestChirho.completeVisionItemsChirho) &&
      Array.isArray(expertManifestChirho.priorityItemsChirho));
  const rawSpansChirho = rawReportChirho.spansChirho ?? [];
  const humanSummaryChirho = summarizeHumanValidationsChirho(validationRowsChirho(dbPathChirho), rawSpansChirho);
  const structuralChirho = {
    exportGeneratedAtChirho: exportReportChirho.generatedAtChirho ?? null,
    strictPassedChirho: exportReportChirho.strictPassedChirho === true,
    issueCountChirho: exportReportChirho.issueCountChirho ?? 0,
    unknownSpanCountChirho: exportReportChirho.unknownSpanCountChirho ?? 0,
    d1GapPageCountChirho: exportReportChirho.d1PagesWithoutSpansChirho?.length ?? 0,
    hebrewSpanCountChirho: exportReportChirho.hebrewSpanCountChirho ?? 0,
    passCOcrHebrewSpanCountChirho: exportReportChirho.passCOcrHebrewSpanCountChirho ?? 0,
    crnnValidatedHebrewSpanCountChirho: exportReportChirho.crnnValidatedHebrewSpanCountChirho ?? 0,
  };
  const rawHebrewChirho = {
    reportGeneratedAtChirho: rawReportChirho.generatedAtChirho ?? null,
    sourceFilterChirho: rawReportChirho.sourceFilterChirho ?? null,
    reportSpanCountChirho: rawReportChirho.spanCountChirho ?? rawSpansChirho.length,
    reportTokenCountChirho: rawReportChirho.tokenCountChirho ?? 0,
    unvalidatedSpanCountChirho: rawReportChirho.unvalidatedSpanCountChirho ?? 0,
    partialValidatedSpanCountChirho: rawReportChirho.partialTokenValidatedSpanCountChirho ?? 0,
    allTokenValidatedSpanCountChirho: rawReportChirho.allTokenValidatedSpanCountChirho ?? 0,
    validatedTokenCountChirho: rawReportChirho.validatedTokenCountChirho ?? 0,
    sourceCountsChirho: rawReportChirho.sourceCountsChirho ?? {},
    exportPassCOcrMatchesReportChirho:
      structuralChirho.passCOcrHebrewSpanCountChirho === (rawReportChirho.spanCountChirho ?? rawSpansChirho.length),
  };
  const visionTierChirho = {
    manifestGeneratedAtChirho: expertManifestChirho.generatedAtChirho ?? null,
    priorityItemCountChirho: expertManifestChirho.priorityItemsChirho?.length ?? 0,
    completeVisionItemCountChirho: expertManifestChirho.completeVisionItemsChirho?.length ?? 0,
    completeVisionCountsChirho: expertManifestChirho.completeVisionCountsChirho ?? {},
  };
  const latinSymbolVisionCountsResultChirho = latinSymbolVisionCountsChirho();
  const d1DerivedLatinSymbolVisionCountsResultChirho = d1DerivedLatinSymbolVisionCountsChirho();
  const latinSymbolVisionChirho = {
    explicitVisionItemCountChirho: sumCountsChirho(latinSymbolVisionCountsResultChirho),
    explicitVisionCountsChirho: latinSymbolVisionCountsResultChirho,
    d1DerivedVisionWordCountChirho: sumCountsChirho(d1DerivedLatinSymbolVisionCountsResultChirho),
    d1DerivedVisionCountsChirho: d1DerivedLatinSymbolVisionCountsResultChirho,
    includedInCompletionGateChirho: true,
  };
  const remainingWorkChirho: string[] = [];
  if (!exportReportExistsChirho) {
    remainingWorkChirho.push("strict export report is missing; run export-markdown-chirho --all --strict");
  }
  if (!rawHebrewReportExistsChirho) {
    remainingWorkChirho.push("raw Hebrew validation report is missing; run validate-pass-c-hebrew-chirho --all");
  }
  if (!expertPackManifestExistsChirho) {
    remainingWorkChirho.push("expert confirmation manifest is missing; run make-expert-confirm-pack-chirho");
  }
  if (exportReportExistsChirho && !exportReportShapeOkChirho) {
    remainingWorkChirho.push("strict export report is malformed; regenerate export-markdown-chirho --all --strict");
  }
  if (rawHebrewReportExistsChirho && !rawHebrewReportShapeOkChirho) {
    remainingWorkChirho.push("raw Hebrew validation report is malformed; regenerate validate-pass-c-hebrew-chirho --all");
  }
  if (expertPackManifestExistsChirho && !expertPackManifestShapeOkChirho) {
    remainingWorkChirho.push("expert confirmation manifest is malformed; regenerate make-expert-confirm-pack-chirho");
  }
  if (!structuralChirho.strictPassedChirho || structuralChirho.issueCountChirho !== 0) {
    remainingWorkChirho.push("structural export strict gate is not clean");
  }
  if (structuralChirho.unknownSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.unknownSpanCountChirho} unknown span(s) remain`);
  }
  if (structuralChirho.d1GapPageCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.d1GapPageCountChirho} D1 page gap(s) remain`);
  }
  if (structuralChirho.passCOcrHebrewSpanCountChirho !== 0) {
    remainingWorkChirho.push(`${structuralChirho.passCOcrHebrewSpanCountChirho} raw Pass-C Hebrew span(s) still need human certification`);
  }
  if (visionTierChirho.completeVisionItemCountChirho !== 0) {
    remainingWorkChirho.push(`${visionTierChirho.completeVisionItemCountChirho} vision-tier non-Latin span(s) still need expert/human confirmation`);
  }
  const latinSymbolVisionDecisionCountChirho =
    latinSymbolVisionChirho.explicitVisionItemCountChirho + latinSymbolVisionChirho.d1DerivedVisionWordCountChirho;
  if (latinSymbolVisionDecisionCountChirho !== 0) {
    remainingWorkChirho.push(
      `${latinSymbolVisionDecisionCountChirho} Latin/symbol vision-tier span/word decision(s) still need proofread or explicit acceptance policy`
    );
  }
  if (!rawHebrewChirho.exportPassCOcrMatchesReportChirho) {
    remainingWorkChirho.push("raw Hebrew validation report count does not match the latest export report; regenerate validation artifacts");
  }
  const certificationCompleteChirho = remainingWorkChirho.length === 0;
  return {
    generatedAtChirho: new Date().toISOString(),
    artifactsChirho: {
      exportReportExistsChirho,
      rawHebrewReportExistsChirho,
      expertPackManifestExistsChirho,
      exportReportShapeOkChirho,
      rawHebrewReportShapeOkChirho,
      expertPackManifestShapeOkChirho,
    },
    structuralChirho,
    rawHebrewChirho,
    visionTierChirho,
    latinSymbolVisionChirho,
    humanValidationDbChirho: humanSummaryChirho,
    certificationCompleteChirho,
    remainingWorkChirho,
  };
}

function markdownChirho(statusChirho: CertificationStatusChirho): string {
  const remainingLinesChirho = statusChirho.remainingWorkChirho.length === 0
    ? ["- None."]
    : statusChirho.remainingWorkChirho.map((itemChirho) => `- ${itemChirho}`);
  const visionCountsChirho = Object.entries(statusChirho.visionTierChirho.completeVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const sourceCountsChirho = Object.entries(statusChirho.rawHebrewChirho.sourceCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const latinSymbolCountsChirho = Object.entries(statusChirho.latinSymbolVisionChirho.explicitVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  const d1LatinSymbolCountsChirho = Object.entries(statusChirho.latinSymbolVisionChirho.d1DerivedVisionCountsChirho)
    .map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`)
    .join(", ");
  return [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Transcription Certification Status Chirho",
    "",
    `Generated: ${statusChirho.generatedAtChirho}`,
    "",
    `Certification complete: ${statusChirho.certificationCompleteChirho ? "yes" : "no"}`,
    "",
    "## Structural Export",
    "",
    `- Export report exists: ${statusChirho.artifactsChirho.exportReportExistsChirho}`,
    `- Export report shape OK: ${statusChirho.artifactsChirho.exportReportShapeOkChirho}`,
    `- Strict passed: ${statusChirho.structuralChirho.strictPassedChirho}`,
    `- Issues: ${statusChirho.structuralChirho.issueCountChirho}`,
    `- Unknown spans: ${statusChirho.structuralChirho.unknownSpanCountChirho}`,
    `- D1 gap pages: ${statusChirho.structuralChirho.d1GapPageCountChirho}`,
    `- Hebrew spans: ${statusChirho.structuralChirho.hebrewSpanCountChirho}`,
    `- Raw Pass-C Hebrew spans: ${statusChirho.structuralChirho.passCOcrHebrewSpanCountChirho}`,
    "",
    "## Raw Hebrew Human Queue",
    "",
    `- Raw Hebrew report exists: ${statusChirho.artifactsChirho.rawHebrewReportExistsChirho}`,
    `- Raw Hebrew report shape OK: ${statusChirho.artifactsChirho.rawHebrewReportShapeOkChirho}`,
    `- Report spans: ${statusChirho.rawHebrewChirho.reportSpanCountChirho}`,
    `- Tokens: ${statusChirho.rawHebrewChirho.reportTokenCountChirho}`,
    `- Unvalidated spans: ${statusChirho.rawHebrewChirho.unvalidatedSpanCountChirho}`,
    `- Partial spans: ${statusChirho.rawHebrewChirho.partialValidatedSpanCountChirho}`,
    `- All-token spot checks: ${statusChirho.rawHebrewChirho.allTokenValidatedSpanCountChirho}`,
    `- Source counts before filter: ${sourceCountsChirho || "none"}`,
    `- Export/report count match: ${statusChirho.rawHebrewChirho.exportPassCOcrMatchesReportChirho}`,
    "",
    "## Human Validation DB",
    "",
    `- Current schema-v2 rows: ${statusChirho.humanValidationDbChirho.currentSchema2RowsChirho}`,
    `- Raw queue rows: ${statusChirho.humanValidationDbChirho.rawQueueCurrentRowsChirho}`,
    `- Raw queue clean rows: ${statusChirho.humanValidationDbChirho.rawQueueCleanRowsChirho}`,
    `- Raw queue issue rows: ${statusChirho.humanValidationDbChirho.rawQueueIssueRowsChirho}`,
    `- Raw queue applied rows: ${statusChirho.humanValidationDbChirho.rawQueueAppliedRowsChirho}`,
    `- Legacy current rows ignored by apply/certification: ${statusChirho.humanValidationDbChirho.legacyCurrentRowsChirho}`,
    "",
    "## Vision-Tier Expert Queue",
    "",
    `- Expert manifest exists: ${statusChirho.artifactsChirho.expertPackManifestExistsChirho}`,
    `- Expert manifest shape OK: ${statusChirho.artifactsChirho.expertPackManifestShapeOkChirho}`,
    `- Priority items: ${statusChirho.visionTierChirho.priorityItemCountChirho}`,
    `- Complete vision-tier items: ${statusChirho.visionTierChirho.completeVisionItemCountChirho}`,
    `- Counts: ${visionCountsChirho || "none"}`,
    "",
    "## Latin/Symbol Vision Scope",
    "",
    "These spans are not in the non-Latin expert pack, but they still matter for a project-wide flawless-transcription claim.",
    "",
    `- Included in completion gate: ${statusChirho.latinSymbolVisionChirho.includedInCompletionGateChirho}`,
    `- Explicit vision-tier Latin/symbol items: ${statusChirho.latinSymbolVisionChirho.explicitVisionItemCountChirho}`,
    `- Counts: ${latinSymbolCountsChirho || "none"}`,
    `- D1-derived Latin/symbol vision words: ${statusChirho.latinSymbolVisionChirho.d1DerivedVisionWordCountChirho}`,
    `- D1-derived counts: ${d1LatinSymbolCountsChirho || "none"}`,
    "",
    "## Remaining Work",
    "",
    ...remainingLinesChirho,
    "",
  ].join("\n");
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const strictChirho = argsChirho.includes("--strict");
  const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? PROGRESS_DB_PATH_CHIRHO;
  const outDirChirho = parseArgValueChirho(argsChirho, "out-dir") ?? OUT_DIR_CHIRHO;
  mkdirSync(outDirChirho, { recursive: true });
  const statusChirho = buildStatusChirho(dbPathChirho);
  writeFileSync(join(outDirChirho, "status-chirho.json"), `${JSON.stringify(statusChirho, null, 2)}\n`);
  writeFileSync(join(outDirChirho, "status-chirho.md"), markdownChirho(statusChirho));
  console.log(
    `[${MODULE_CHIRHO}] complete=${statusChirho.certificationCompleteChirho} ` +
      `strictMode=${strictChirho} ` +
      `strictExport=${statusChirho.structuralChirho.strictPassedChirho} ` +
      `rawHebrew=${statusChirho.structuralChirho.passCOcrHebrewSpanCountChirho} ` +
      `visionTier=${statusChirho.visionTierChirho.completeVisionItemCountChirho} ` +
      `report=${join(outDirChirho, "status-chirho.md")}`
  );
  if (strictChirho && !statusChirho.certificationCompleteChirho) process.exitCode = 1;
}

if (import.meta.main) mainChirho();
