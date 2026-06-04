// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Build a token-level validation report for Pass C Hebrew spans.
 *
 * The markdown exporter counts a Hebrew span as CRNN-validated when any token
 * skeleton has a page-level OCR suggestion witness. This script is stricter:
 * every Hebrew token in a Pass-C-OCR span must have an independent Hebrew OCR
 * witness to be "all-token validated".
 *
 * Inputs:
 *   workspace-chirho/spans-chirho/.../line-NNN-chirho.json
 *   local D1 ocr_suggestions_chirho
 *   optional dry-run triage JSONs from read_volume_page_chirho.py
 *
 * By default this reports only Hebrew spans whose text still comes from
 * Pass-C OCR. D1 canonical/vision/human word witnesses are used to exclude
 * already-resolved spans even when the span JSON has no explicit provenance.
 * Use --source=all to audit already reviewed spans alongside the raw Pass-C
 * text.
 *
 * Outputs:
 *   workspace-chirho/pass-c-hebrew-validation-chirho/pass-c-hebrew-validation-chirho.json
 *   workspace-chirho/pass-c-hebrew-validation-chirho/pass-c-hebrew-validation-chirho.md
 */

import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "fs";
import { basename, join } from "path";

import { writeJsonAtomicChirho, writeTextAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { renderSpanLineTextChirho } from "./span-line-text-chirho.ts";

const MODULE_CHIRHO = "validate-pass-c-hebrew-chirho";
const SPANS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const CONTEXT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "pass-c-context-chirho");
const DEFAULT_OUT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho"
);
const DEFAULT_TRIAGE_DIR_CHIRHO = join(DEFAULT_OUT_DIR_CHIRHO, "ocr-triage-chirho");
const LOCAL_D1_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "app-chirho",
  ".wrangler",
  "state",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject"
);
const PAGE_DIR_RE_CHIRHO = /^page-(\d+)-chirho$/;
const VOL_DIR_RE_CHIRHO = /^vol-(\d+)-chirho$/;
const LINE_FILE_RE_CHIRHO = /^line-(\d+)-chirho\.json$/;

interface CliOptionsChirho {
  allChirho: boolean;
  volumesChirho: number[];
  pageChirho?: number;
  outDirChirho: string;
  triageDirChirho: string;
  dbPathChirho?: string;
  directConfChirho: number;
  sourceFilterChirho: SourceFilterChirho;
}

type SourceFilterChirho =
  | "canonical-chirho"
  | "pass-c-ocr-chirho"
  | "vision-chirho"
  | "human-chirho"
  | "all-chirho";

type SpanSourceChirho =
  | "canonical-chirho"
  | "pass-c-ocr-chirho"
  | "vision-chirho"
  | "human-chirho"
  | "other-chirho";

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
}

interface SpanLineChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  spansChirho: SpanChirho[];
}

interface OcrWitnessChirho {
  sourceChirho: "d1-suggestion-chirho" | "triage-chirho" | "direct-crnn-read-chirho";
  textChirho: string;
  confidenceChirho: number | null;
  cropChirho: string | null;
  bucketChirho: string | null;
  gateReasonChirho: string | null;
  fileChirho: string | null;
}

interface RawReadChirho {
  textChirho: string;
  confidenceChirho: number;
  cropChirho: string | null;
  wlcVerdictChirho: string | null;
  fileChirho: string | null;
}

interface ContextWordChirho {
  wordIndexChirho: number;
  textChirho: string;
  xLocChirho: number;
  widthChirho: number;
  markerChirho?: string;
}

interface ContextLineChirho {
  lineIndexChirho: number;
  wordsChirho: ContextWordChirho[];
}

interface PageContextChirho {
  linesChirho: ContextLineChirho[];
}

interface D1TextSourcesChirho {
  textSourceByExactTextChirho: Map<string, SpanSourceChirho>;
  textSourceByHebrewSkeletonChirho: Map<string, SpanSourceChirho>;
}

interface TokenValidationChirho {
  tokenIndexChirho: number;
  skeletonChirho: string;
  witnessesChirho: OcrWitnessChirho[];
  validatedChirho: boolean;
}

interface HebrewSpanValidationChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  spanSourceChirho: SpanSourceChirho;
  textChirho: string;
  lineTextChirho: string;
  tokenSkeletonsChirho: string[];
  tokenValidationsChirho: TokenValidationChirho[];
  directWordReadsChirho: RawReadChirho[];
  validationStatusChirho:
    | "all-token-validated-chirho"
    | "partial-token-validated-chirho"
    | "unvalidated-chirho";
}

interface PageSummaryChirho extends TargetPageChirho {
  spanCountChirho: number;
  tokenCountChirho: number;
  allTokenValidatedSpanCountChirho: number;
  partialTokenValidatedSpanCountChirho: number;
  unvalidatedSpanCountChirho: number;
  validatedTokenCountChirho: number;
}

interface ValidationReportChirho {
  generatedAtChirho: string;
  sourceDirChirho: string;
  triageDirChirho: string;
  d1DbPathChirho: string | null;
  directConfChirho: number;
  sourceFilterChirho: SourceFilterChirho;
  sourceCountsChirho: Record<string, number>;
  spanCountChirho: number;
  tokenCountChirho: number;
  allTokenValidatedSpanCountChirho: number;
  partialTokenValidatedSpanCountChirho: number;
  unvalidatedSpanCountChirho: number;
  validatedTokenCountChirho: number;
  pageSummariesChirho: PageSummaryChirho[];
  spansChirho: HebrewSpanValidationChirho[];
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

function parseNumberChirho(valueChirho: string | undefined, defaultChirho: number, labelChirho: string): number {
  if (valueChirho === undefined) return defaultChirho;
  const parsedChirho = Number.parseFloat(valueChirho);
  if (!Number.isFinite(parsedChirho)) {
    throw new Error(`${labelChirho} must be numeric; got ${valueChirho}`);
  }
  return parsedChirho;
}

function parseSourceFilterChirho(valueChirho: string | undefined): SourceFilterChirho {
  if (valueChirho === undefined || valueChirho === "pass-c-ocr" || valueChirho === "pass-c-ocr-chirho") {
    return "pass-c-ocr-chirho";
  }
  if (valueChirho === "canonical" || valueChirho === "canonical-chirho") return "canonical-chirho";
  if (valueChirho === "vision" || valueChirho === "vision-chirho") return "vision-chirho";
  if (valueChirho === "human" || valueChirho === "human-chirho") return "human-chirho";
  if (valueChirho === "all" || valueChirho === "all-chirho") return "all-chirho";
  throw new Error(`--source must be pass-c-ocr, canonical, vision, human, or all; got ${valueChirho}`);
}

function parseVolumeListChirho(valueChirho: string | undefined): number[] {
  if (valueChirho === undefined || valueChirho.trim().length === 0) return [];
  return valueChirho
    .split(",")
    .map((partChirho) => parsePositiveIntChirho(partChirho.trim(), "vols"))
    .filter((volumeChirho): volumeChirho is number => volumeChirho !== undefined);
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
  const allChirho = argsChirho.includes("--all");
  const volumeChirho = parsePositiveIntChirho(parseArgValueChirho(argsChirho, "vol"), "vol");
  const volumesChirho = parseVolumeListChirho(parseArgValueChirho(argsChirho, "vols"));
  const pageChirho = parsePositiveIntChirho(parseArgValueChirho(argsChirho, "page"), "page");
  const outDirChirho = parseArgValueChirho(argsChirho, "out-dir") ?? DEFAULT_OUT_DIR_CHIRHO;
  const triageDirChirho = parseArgValueChirho(argsChirho, "triage-dir") ?? DEFAULT_TRIAGE_DIR_CHIRHO;
  const dbPathChirho = parseArgValueChirho(argsChirho, "db") ?? latestLocalD1PathChirho();
  const directConfChirho = parseNumberChirho(parseArgValueChirho(argsChirho, "direct-conf"), 0.9, "direct-conf");
  const sourceFilterChirho = parseSourceFilterChirho(parseArgValueChirho(argsChirho, "source"));

  if (!allChirho && volumeChirho === undefined && volumesChirho.length === 0) {
    throw new Error("Pass --all, --vol=N, or --vols=N,N");
  }
  if (pageChirho !== undefined && volumeChirho === undefined && volumesChirho.length !== 1) {
    throw new Error("--page requires exactly one --vol or --vols entry");
  }
  if (dbPathChirho !== undefined && !existsSync(dbPathChirho)) {
    throw new Error(`D1 sqlite database not found: ${dbPathChirho}`);
  }

  return {
    allChirho,
    volumesChirho: volumeChirho !== undefined ? [volumeChirho] : volumesChirho,
    pageChirho,
    outDirChirho,
    triageDirChirho,
    dbPathChirho,
    directConfChirho,
    sourceFilterChirho,
  };
}

function ensureDirChirho(pathChirho: string): void {
  if (!existsSync(pathChirho)) mkdirSync(pathChirho, { recursive: true });
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

function targetKeyChirho(targetChirho: TargetPageChirho): string {
  return `${targetChirho.volumeChirho}:${targetChirho.pageChirho}`;
}

function witnessKeyChirho(targetChirho: TargetPageChirho, skeletonChirho: string): string {
  return `${targetKeyChirho(targetChirho)}:${skeletonChirho}`;
}

function discoverTargetsChirho(optionsChirho: CliOptionsChirho): TargetPageChirho[] {
  const volumeNumbersChirho = optionsChirho.allChirho
    ? readdirSync(SPANS_DIR_CHIRHO)
        .map(parseVolumeDirNameChirho)
        .filter((volumeChirho): volumeChirho is number => volumeChirho !== null)
    : optionsChirho.volumesChirho;
  const targetsChirho: TargetPageChirho[] = [];

  for (const volumeChirho of [...new Set(volumeNumbersChirho)].sort((aChirho, bChirho) => aChirho - bChirho)) {
    const volumeDirChirho = join(SPANS_DIR_CHIRHO, `vol-${volumeChirho}-chirho`);
    if (!existsSync(volumeDirChirho)) continue;
    const pageNumbersChirho = optionsChirho.pageChirho !== undefined
      ? [optionsChirho.pageChirho]
      : readdirSync(volumeDirChirho)
          .map(parsePageDirNameChirho)
          .filter((pageChirho): pageChirho is number => pageChirho !== null)
          .sort((aChirho, bChirho) => aChirho - bChirho);
    for (const pageChirho of pageNumbersChirho) targetsChirho.push({ volumeChirho, pageChirho });
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

function rawReadKeyChirho(targetChirho: TargetPageChirho, lineIndexChirho: number, wordIndexChirho: number): string {
  return `${targetKeyChirho(targetChirho)}:${lineIndexChirho}:${wordIndexChirho}`;
}

function readSpanLinesChirho(targetChirho: TargetPageChirho): SpanLineChirho[] {
  const dirChirho = pageDirChirho(targetChirho);
  if (!existsSync(dirChirho)) return [];
  return readdirSync(dirChirho)
    .map((fileChirho) => ({
      fileChirho,
      lineIndexChirho: parseLineFileNameChirho(fileChirho),
    }))
    .filter((itemChirho): itemChirho is { fileChirho: string; lineIndexChirho: number } =>
      itemChirho.lineIndexChirho !== null
    )
    .sort((aChirho, bChirho) => aChirho.lineIndexChirho - bChirho.lineIndexChirho)
    .map((itemChirho) =>
      JSON.parse(readFileSync(join(dirChirho, itemChirho.fileChirho), "utf8")) as SpanLineChirho
    );
}

function readPageContextChirho(targetChirho: TargetPageChirho): PageContextChirho | null {
  const pathChirho = contextPathChirho(targetChirho);
  if (!existsSync(pathChirho)) return null;
  return JSON.parse(readFileSync(pathChirho, "utf8")) as PageContextChirho;
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
  return textChirho.trim().normalize("NFC");
}

function trustedSourceChirho(sourceChirho: string | null | undefined): SpanSourceChirho | null {
  if (
    sourceChirho === "canonical-chirho" ||
    sourceChirho === "vision-chirho" ||
    sourceChirho === "human-chirho"
  ) {
    return sourceChirho;
  }
  return null;
}

function sourcePriorityChirho(sourceChirho: SpanSourceChirho): number {
  if (sourceChirho === "human-chirho") return 3;
  if (sourceChirho === "vision-chirho") return 2;
  if (sourceChirho === "canonical-chirho") return 1;
  return 0;
}

function setSourceChirho(mapChirho: Map<string, SpanSourceChirho>, keyChirho: string, sourceChirho: SpanSourceChirho): void {
  const existingChirho = mapChirho.get(keyChirho);
  if (existingChirho === undefined || sourcePriorityChirho(sourceChirho) > sourcePriorityChirho(existingChirho)) {
    mapChirho.set(keyChirho, sourceChirho);
  }
}

function spanSourceChirho(
  targetChirho: TargetPageChirho,
  spanChirho: SpanChirho,
  tokenSkeletonsChirho: string[],
  d1TextSourcesChirho: Map<string, D1TextSourcesChirho>
): SpanSourceChirho {
  if (spanChirho.provenanceChirho === "vision-chirho") return "vision-chirho";
  if (spanChirho.provenanceChirho === "human-chirho") return "human-chirho";
  const pageSourcesChirho = d1TextSourcesChirho.get(targetKeyChirho(targetChirho));
  if (pageSourcesChirho) {
    const exactSourceChirho = pageSourcesChirho.textSourceByExactTextChirho.get(
      normalizedExactTextChirho(spanChirho.utf8TextChirho)
    );
    if (exactSourceChirho) return exactSourceChirho;

    const tokenSourcesChirho = tokenSkeletonsChirho
      .map((skeletonChirho) => pageSourcesChirho.textSourceByHebrewSkeletonChirho.get(skeletonChirho))
      .filter((sourceChirho): sourceChirho is SpanSourceChirho => sourceChirho !== undefined);
    if (tokenSkeletonsChirho.length > 0 && tokenSourcesChirho.length === tokenSkeletonsChirho.length) {
      if (tokenSourcesChirho.includes("human-chirho")) return "human-chirho";
      if (tokenSourcesChirho.includes("vision-chirho")) return "vision-chirho";
      if (tokenSourcesChirho.every((sourceChirho) => sourceChirho === "canonical-chirho")) return "canonical-chirho";
    }
  }
  if (spanChirho.scriptChirho === "hebrew-chirho") return "pass-c-ocr-chirho";
  return "other-chirho";
}

function sourceIncludedChirho(sourceChirho: SpanSourceChirho, filterChirho: SourceFilterChirho): boolean {
  return filterChirho === "all-chirho" || sourceChirho === filterChirho;
}

function addSourceCountChirho(countsChirho: Record<string, number>, sourceChirho: SpanSourceChirho): void {
  countsChirho[sourceChirho] = (countsChirho[sourceChirho] ?? 0) + 1;
}

function lineTextChirho(lineChirho: SpanLineChirho): string {
  return renderSpanLineTextChirho(lineChirho);
}

function addWitnessChirho(
  witnessesBySkeletonChirho: Map<string, OcrWitnessChirho[]>,
  targetChirho: TargetPageChirho,
  textChirho: string,
  witnessChirho: OcrWitnessChirho
): void {
  const skeletonsChirho = hebrewTokenSkeletonsChirho(textChirho);
  for (const skeletonChirho of skeletonsChirho) {
    const keyChirho = witnessKeyChirho(targetChirho, skeletonChirho);
    const existingChirho = witnessesBySkeletonChirho.get(keyChirho) ?? [];
    existingChirho.push(witnessChirho);
    witnessesBySkeletonChirho.set(keyChirho, existingChirho);
  }
}

function readD1SuggestionWitnessesChirho(
  dbPathChirho: string | undefined,
  targetsChirho: TargetPageChirho[]
): Map<string, OcrWitnessChirho[]> {
  const witnessesBySkeletonChirho = new Map<string, OcrWitnessChirho[]>();
  if (dbPathChirho === undefined) return witnessesBySkeletonChirho;
  const targetKeysChirho = new Set(targetsChirho.map(targetKeyChirho));
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowsChirho = dbChirho
      .query(
        `SELECT p.volume_number_chirho AS volume_chirho,
                p.page_number_chirho AS page_chirho,
                s.suggested_text_chirho AS suggested_text_chirho,
                s.confidence_chirho AS confidence_chirho,
                s.crop_chirho AS crop_chirho,
                s.bucket_chirho AS bucket_chirho
           FROM ocr_suggestions_chirho s
           JOIN pages_chirho p ON p.id_chirho = s.page_id_chirho
          WHERE s.bucket_chirho IN ('AUTO', 'REVIEW')`
      )
      .all() as Array<{
        volume_chirho: number;
        page_chirho: number;
        suggested_text_chirho: string;
        confidence_chirho: number;
        crop_chirho: string | null;
        bucket_chirho: string | null;
      }>;
    for (const rowChirho of rowsChirho) {
      const targetChirho = {
        volumeChirho: rowChirho.volume_chirho,
        pageChirho: rowChirho.page_chirho,
      };
      if (!targetKeysChirho.has(targetKeyChirho(targetChirho))) continue;
      addWitnessChirho(witnessesBySkeletonChirho, targetChirho, rowChirho.suggested_text_chirho, {
        sourceChirho: "d1-suggestion-chirho",
        textChirho: rowChirho.suggested_text_chirho,
        confidenceChirho: rowChirho.confidence_chirho,
        cropChirho: rowChirho.crop_chirho,
        bucketChirho: rowChirho.bucket_chirho,
        gateReasonChirho: null,
        fileChirho: null,
      });
    }
  } finally {
    dbChirho.close();
  }
  return witnessesBySkeletonChirho;
}

function readD1TextSourcesChirho(
  dbPathChirho: string | undefined,
  targetsChirho: TargetPageChirho[]
): Map<string, D1TextSourcesChirho> {
  const sourcesByTargetChirho = new Map<string, D1TextSourcesChirho>();
  if (dbPathChirho === undefined) return sourcesByTargetChirho;
  const targetKeysChirho = new Set(targetsChirho.map(targetKeyChirho));
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowsChirho = dbChirho
      .query(
        `SELECT p.volume_number_chirho AS volume_chirho,
                p.page_number_chirho AS page_chirho,
                w.current_text_chirho AS current_text_chirho,
                w.current_script_chirho AS current_script_chirho,
                w.current_source_chirho AS current_source_chirho
           FROM words_chirho w
           JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
           JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho`
      )
      .all() as Array<{
        volume_chirho: number;
        page_chirho: number;
        current_text_chirho: string | null;
        current_script_chirho: string | null;
        current_source_chirho: string | null;
      }>;

    for (const rowChirho of rowsChirho) {
      const targetChirho = {
        volumeChirho: rowChirho.volume_chirho,
        pageChirho: rowChirho.page_chirho,
      };
      const targetKeyValueChirho = targetKeyChirho(targetChirho);
      if (!targetKeysChirho.has(targetKeyValueChirho)) continue;
      const sourceChirho = trustedSourceChirho(rowChirho.current_source_chirho);
      if (!sourceChirho) continue;
      const textChirho = normalizedExactTextChirho(rowChirho.current_text_chirho ?? "");
      if (textChirho.length === 0) continue;

      const targetSourcesChirho = sourcesByTargetChirho.get(targetKeyValueChirho) ?? {
        textSourceByExactTextChirho: new Map<string, SpanSourceChirho>(),
        textSourceByHebrewSkeletonChirho: new Map<string, SpanSourceChirho>(),
      };
      setSourceChirho(targetSourcesChirho.textSourceByExactTextChirho, textChirho, sourceChirho);
      if (rowChirho.current_script_chirho === "hebrew-chirho") {
        const skeletonChirho = hebrewSkeletonChirho(textChirho);
        if (skeletonChirho.length > 0) {
          setSourceChirho(targetSourcesChirho.textSourceByHebrewSkeletonChirho, skeletonChirho, sourceChirho);
        }
      }
      sourcesByTargetChirho.set(targetKeyValueChirho, targetSourcesChirho);
    }
  } finally {
    dbChirho.close();
  }
  return sourcesByTargetChirho;
}

function parseTriageTargetChirho(fileNameChirho: string): TargetPageChirho | null {
  const matchChirho = fileNameChirho.match(/vol-?(\d+).*p(?:age-?)?0*(\d+)/i);
  if (!matchChirho) return null;
  return {
    volumeChirho: Number.parseInt(matchChirho[1]!, 10),
    pageChirho: Number.parseInt(matchChirho[2]!, 10),
  };
}

function readTriageWitnessesChirho(
  triageDirChirho: string,
  targetsChirho: TargetPageChirho[]
): Map<string, OcrWitnessChirho[]> {
  const witnessesBySkeletonChirho = new Map<string, OcrWitnessChirho[]>();
  if (!existsSync(triageDirChirho)) return witnessesBySkeletonChirho;
  const targetKeysChirho = new Set(targetsChirho.map(targetKeyChirho));
  const filesChirho = readdirSync(triageDirChirho)
    .filter((fileChirho) => fileChirho.endsWith(".json"))
    .sort();

  for (const fileChirho of filesChirho) {
    const targetChirho = parseTriageTargetChirho(fileChirho);
    if (!targetChirho || !targetKeysChirho.has(targetKeyChirho(targetChirho))) continue;
    const pathChirho = join(triageDirChirho, fileChirho);
    const parsedChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as {
      recordsChirho?: Array<{
        readingChirho?: string;
        predChirho?: string;
        confChirho?: number;
        cropChirho?: string;
        bucketChirho?: string;
        isHebrewChirho?: boolean;
        tessHebrewChirho?: boolean;
        gateReasonChirho?: string;
      }>;
      predsChirho?: Array<{
        readingChirho?: string;
        predChirho?: string;
        confChirho?: number;
        cropChirho?: string;
        bucketChirho?: string;
        isHebrewChirho?: boolean;
        tessHebrewChirho?: boolean;
        gateReasonChirho?: string;
      }>;
    };
    const recordsChirho = parsedChirho.recordsChirho ?? parsedChirho.predsChirho ?? [];
    for (const recordChirho of recordsChirho) {
      const isHebrewChirho = recordChirho.isHebrewChirho ?? recordChirho.tessHebrewChirho ?? false;
      if (!isHebrewChirho) continue;
      const textChirho = recordChirho.readingChirho ?? recordChirho.predChirho ?? "";
      if (hebrewSkeletonChirho(textChirho).length === 0) continue;
      addWitnessChirho(witnessesBySkeletonChirho, targetChirho, textChirho, {
        sourceChirho: "triage-chirho",
        textChirho,
        confidenceChirho: recordChirho.confChirho ?? null,
        cropChirho: recordChirho.cropChirho ?? null,
        bucketChirho: recordChirho.bucketChirho ?? null,
        gateReasonChirho: recordChirho.gateReasonChirho ?? null,
        fileChirho: basename(pathChirho),
      });
    }
  }

  return witnessesBySkeletonChirho;
}

function readRawReadsChirho(
  triageDirChirho: string,
  targetsChirho: TargetPageChirho[]
): Map<string, RawReadChirho> {
  const readsChirho = new Map<string, RawReadChirho>();
  if (!existsSync(triageDirChirho)) return readsChirho;
  const targetKeysChirho = new Set(targetsChirho.map(targetKeyChirho));
  const filesChirho = readdirSync(triageDirChirho)
    .filter((fileChirho) => fileChirho.endsWith(".json"))
    .sort();

  for (const fileChirho of filesChirho) {
    const targetChirho = parseTriageTargetChirho(fileChirho);
    if (!targetChirho || !targetKeysChirho.has(targetKeyChirho(targetChirho))) continue;
    const pathChirho = join(triageDirChirho, fileChirho);
    const parsedChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as {
      allReadsChirho?: Array<{
        readingChirho?: string;
        confChirho?: number;
        cropChirho?: string;
        lineIndexChirho?: number;
        wordIndexChirho?: number;
        wlcVerdictChirho?: string;
      }>;
    };
    for (const recordChirho of parsedChirho.allReadsChirho ?? []) {
      if (recordChirho.lineIndexChirho === undefined || recordChirho.wordIndexChirho === undefined) continue;
      readsChirho.set(rawReadKeyChirho(targetChirho, recordChirho.lineIndexChirho, recordChirho.wordIndexChirho), {
        textChirho: recordChirho.readingChirho ?? "",
        confidenceChirho: recordChirho.confChirho ?? 0,
        cropChirho: recordChirho.cropChirho ?? null,
        wlcVerdictChirho: recordChirho.wlcVerdictChirho ?? null,
        fileChirho: basename(pathChirho),
      });
    }
  }

  return readsChirho;
}

function mergeWitnessMapsChirho(
  targetChirho: Map<string, OcrWitnessChirho[]>,
  sourceChirho: Map<string, OcrWitnessChirho[]>
): void {
  for (const [keyChirho, witnessesChirho] of sourceChirho.entries()) {
    targetChirho.set(keyChirho, [...(targetChirho.get(keyChirho) ?? []), ...witnessesChirho]);
  }
}

function contextWordsForSpanChirho(
  contextChirho: PageContextChirho | null,
  lineIndexChirho: number,
  spanChirho: SpanChirho
): ContextWordChirho[] {
  const lineChirho = contextChirho?.linesChirho.find((itemChirho) => itemChirho.lineIndexChirho === lineIndexChirho);
  if (!lineChirho) return [];
  const spanStartChirho = spanChirho.xMinPxChirho;
  const spanEndChirho = spanChirho.xMinPxChirho + spanChirho.widthPxChirho;
  return lineChirho.wordsChirho
    .filter((wordChirho) => {
      const centerChirho = wordChirho.xLocChirho + wordChirho.widthChirho / 2;
      return centerChirho >= spanStartChirho && centerChirho <= spanEndChirho;
    })
    .sort((aChirho, bChirho) => {
      if (spanChirho.scriptChirho === "hebrew-chirho") {
        return bChirho.xLocChirho - aChirho.xLocChirho || bChirho.wordIndexChirho - aChirho.wordIndexChirho;
      }
      return aChirho.wordIndexChirho - bChirho.wordIndexChirho;
    });
}

function directReadWitnessesForSpanChirho(
  targetChirho: TargetPageChirho,
  lineIndexChirho: number,
  spanChirho: SpanChirho,
  tokenSkeletonsChirho: string[],
  contextChirho: PageContextChirho | null,
  rawReadsChirho: Map<string, RawReadChirho>,
  minConfidenceChirho: number
): { tokenWitnessesChirho: Map<number, OcrWitnessChirho[]>; directWordReadsChirho: RawReadChirho[] } {
  const tokenWitnessesChirho = new Map<number, OcrWitnessChirho[]>();
  const contextWordsChirho = contextWordsForSpanChirho(contextChirho, lineIndexChirho, spanChirho);
  const directWordReadsChirho = contextWordsChirho
    .map((wordChirho) => rawReadsChirho.get(rawReadKeyChirho(targetChirho, lineIndexChirho, wordChirho.wordIndexChirho)))
    .filter((readChirho): readChirho is RawReadChirho => readChirho !== undefined);

  if (contextWordsChirho.length !== tokenSkeletonsChirho.length) {
    return { tokenWitnessesChirho, directWordReadsChirho };
  }

  const unusedReadIndexesChirho = new Set<number>(directWordReadsChirho.map((_readChirho, indexChirho) => indexChirho));
  for (let tokenIndexChirho = 0; tokenIndexChirho < tokenSkeletonsChirho.length; tokenIndexChirho++) {
    const matchingReadIndexChirho = [...unusedReadIndexesChirho].find((readIndexChirho) => {
      const readChirho = directWordReadsChirho[readIndexChirho]!;
      return (
        readChirho.confidenceChirho >= minConfidenceChirho &&
        hebrewSkeletonChirho(readChirho.textChirho) === tokenSkeletonsChirho[tokenIndexChirho]
      );
    });
    if (matchingReadIndexChirho === undefined) continue;
    unusedReadIndexesChirho.delete(matchingReadIndexChirho);
    const readChirho = directWordReadsChirho[matchingReadIndexChirho]!;
    tokenWitnessesChirho.set(tokenIndexChirho, [{
      sourceChirho: "direct-crnn-read-chirho",
      textChirho: readChirho.textChirho,
      confidenceChirho: readChirho.confidenceChirho,
      cropChirho: readChirho.cropChirho,
      bucketChirho: null,
      gateReasonChirho: readChirho.wlcVerdictChirho,
      fileChirho: readChirho.fileChirho,
    }]);
  }

  return { tokenWitnessesChirho, directWordReadsChirho };
}

function buildValidationReportChirho(optionsChirho: CliOptionsChirho): ValidationReportChirho {
  const targetsChirho = discoverTargetsChirho(optionsChirho);
  const witnessesBySkeletonChirho = readD1SuggestionWitnessesChirho(optionsChirho.dbPathChirho, targetsChirho);
  const d1TextSourcesChirho = readD1TextSourcesChirho(optionsChirho.dbPathChirho, targetsChirho);
  mergeWitnessMapsChirho(
    witnessesBySkeletonChirho,
    readTriageWitnessesChirho(optionsChirho.triageDirChirho, targetsChirho)
  );
  const rawReadsChirho = readRawReadsChirho(optionsChirho.triageDirChirho, targetsChirho);

  const spansChirho: HebrewSpanValidationChirho[] = [];
  const sourceCountsChirho: Record<string, number> = {};
  const pageSummariesChirho = new Map<string, PageSummaryChirho>();
  for (const targetChirho of targetsChirho) {
    const contextChirho = readPageContextChirho(targetChirho);
    const summaryChirho: PageSummaryChirho = {
      ...targetChirho,
      spanCountChirho: 0,
      tokenCountChirho: 0,
      allTokenValidatedSpanCountChirho: 0,
      partialTokenValidatedSpanCountChirho: 0,
      unvalidatedSpanCountChirho: 0,
      validatedTokenCountChirho: 0,
    };
    for (const lineChirho of readSpanLinesChirho(targetChirho)) {
      const lineTextValueChirho = lineTextChirho(lineChirho);
      for (const spanChirho of lineChirho.spansChirho) {
        if (spanChirho.scriptChirho !== "hebrew-chirho") continue;
        const tokenSkeletonsChirho = hebrewTokenSkeletonsChirho(spanChirho.utf8TextChirho);
        if (tokenSkeletonsChirho.length === 0) continue;
        const spanSourceValueChirho = spanSourceChirho(
          targetChirho,
          spanChirho,
          tokenSkeletonsChirho,
          d1TextSourcesChirho
        );
        addSourceCountChirho(sourceCountsChirho, spanSourceValueChirho);
        if (!sourceIncludedChirho(spanSourceValueChirho, optionsChirho.sourceFilterChirho)) continue;
        const directReadResultChirho = directReadWitnessesForSpanChirho(
          targetChirho,
          lineChirho.lineIndexChirho,
          spanChirho,
          tokenSkeletonsChirho,
          contextChirho,
          rawReadsChirho,
          optionsChirho.directConfChirho
        );
        const tokenValidationsChirho = tokenSkeletonsChirho.map((skeletonChirho, tokenIndexChirho) => {
          const witnessesChirho = [
            ...(directReadResultChirho.tokenWitnessesChirho.get(tokenIndexChirho) ?? []),
            ...(witnessesBySkeletonChirho.get(witnessKeyChirho(targetChirho, skeletonChirho)) ?? []),
          ];
          return {
            tokenIndexChirho,
            skeletonChirho,
            witnessesChirho,
            validatedChirho: witnessesChirho.length > 0,
          };
        });
        const validatedTokenCountChirho = tokenValidationsChirho.filter(
          (tokenChirho) => tokenChirho.validatedChirho
        ).length;
        const validationStatusChirho =
          validatedTokenCountChirho === tokenValidationsChirho.length
            ? "all-token-validated-chirho"
            : validatedTokenCountChirho > 0
              ? "partial-token-validated-chirho"
              : "unvalidated-chirho";

        summaryChirho.spanCountChirho++;
        summaryChirho.tokenCountChirho += tokenValidationsChirho.length;
        summaryChirho.validatedTokenCountChirho += validatedTokenCountChirho;
        if (validationStatusChirho === "all-token-validated-chirho") {
          summaryChirho.allTokenValidatedSpanCountChirho++;
        } else if (validationStatusChirho === "partial-token-validated-chirho") {
          summaryChirho.partialTokenValidatedSpanCountChirho++;
        } else {
          summaryChirho.unvalidatedSpanCountChirho++;
        }

        spansChirho.push({
          ...targetChirho,
          lineIndexChirho: lineChirho.lineIndexChirho,
          segmentIndexChirho: spanChirho.segmentIndexChirho,
          spanSourceChirho: spanSourceValueChirho,
          textChirho: spanChirho.utf8TextChirho,
          lineTextChirho: lineTextValueChirho,
          tokenSkeletonsChirho,
          tokenValidationsChirho,
          directWordReadsChirho: directReadResultChirho.directWordReadsChirho,
          validationStatusChirho,
        });
      }
    }
    if (summaryChirho.spanCountChirho > 0) {
      pageSummariesChirho.set(targetKeyChirho(targetChirho), summaryChirho);
    }
  }

  const pageSummaryValuesChirho = [...pageSummariesChirho.values()].sort(
    (aChirho, bChirho) =>
      aChirho.volumeChirho - bChirho.volumeChirho || aChirho.pageChirho - bChirho.pageChirho
  );

  return {
    generatedAtChirho: new Date().toISOString(),
    sourceDirChirho: SPANS_DIR_CHIRHO,
    triageDirChirho: optionsChirho.triageDirChirho,
    d1DbPathChirho: optionsChirho.dbPathChirho ?? null,
    directConfChirho: optionsChirho.directConfChirho,
    sourceFilterChirho: optionsChirho.sourceFilterChirho,
    sourceCountsChirho,
    spanCountChirho: spansChirho.length,
    tokenCountChirho: spansChirho.reduce((sumChirho, spanChirho) => sumChirho + spanChirho.tokenSkeletonsChirho.length, 0),
    allTokenValidatedSpanCountChirho: spansChirho.filter(
      (spanChirho) => spanChirho.validationStatusChirho === "all-token-validated-chirho"
    ).length,
    partialTokenValidatedSpanCountChirho: spansChirho.filter(
      (spanChirho) => spanChirho.validationStatusChirho === "partial-token-validated-chirho"
    ).length,
    unvalidatedSpanCountChirho: spansChirho.filter(
      (spanChirho) => spanChirho.validationStatusChirho === "unvalidated-chirho"
    ).length,
    validatedTokenCountChirho: spansChirho.reduce(
      (sumChirho, spanChirho) =>
        sumChirho + spanChirho.tokenValidationsChirho.filter((tokenChirho) => tokenChirho.validatedChirho).length,
      0
    ),
    pageSummariesChirho: pageSummaryValuesChirho,
    spansChirho,
  };
}

function markdownReportChirho(reportChirho: ValidationReportChirho): string {
  const linesChirho = [
    "<!--",
    "For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16",
    "-->",
    "",
    "# Pass C Hebrew Validation Chirho",
    "",
    `Generated: ${reportChirho.generatedAtChirho}`,
    "",
    "## Summary",
    "",
    `- Spans: ${reportChirho.spanCountChirho}`,
    `- Tokens: ${reportChirho.tokenCountChirho}`,
    `- All-token validated spans: ${reportChirho.allTokenValidatedSpanCountChirho}`,
    `- Partial-token validated spans: ${reportChirho.partialTokenValidatedSpanCountChirho}`,
    `- Unvalidated spans: ${reportChirho.unvalidatedSpanCountChirho}`,
    `- Validated tokens: ${reportChirho.validatedTokenCountChirho}/${reportChirho.tokenCountChirho}`,
    `- Direct CRNN confidence floor: ${reportChirho.directConfChirho}`,
    `- Source filter: ${reportChirho.sourceFilterChirho}`,
    `- Hebrew source counts before filter: ${Object.entries(reportChirho.sourceCountsChirho).map(([sourceChirho, countChirho]) => `${sourceChirho}=${countChirho}`).join(", ")}`,
    "",
    "## Pages",
    "",
    "| Volume | Page | Spans | Tokens | All | Partial | Unvalidated | Validated Tokens |",
    "|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...reportChirho.pageSummariesChirho.map(
      (pageChirho) =>
        `| ${pageChirho.volumeChirho} | ${pageChirho.pageChirho} | ${pageChirho.spanCountChirho} | ${pageChirho.tokenCountChirho} | ${pageChirho.allTokenValidatedSpanCountChirho} | ${pageChirho.partialTokenValidatedSpanCountChirho} | ${pageChirho.unvalidatedSpanCountChirho} | ${pageChirho.validatedTokenCountChirho} |`
    ),
    "",
    "## Review Queue",
    "",
    "| Status | Source | Volume | Page | Line | Segment | Text | Skeletons | Witnesses |",
    "|---|---|---:|---:|---:|---:|---|---|---|",
  ];

  for (const spanChirho of reportChirho.spansChirho.filter(
    (itemChirho) => itemChirho.validationStatusChirho !== "all-token-validated-chirho"
  )) {
    const witnessCountChirho = spanChirho.tokenValidationsChirho.reduce(
      (sumChirho, tokenChirho) => sumChirho + tokenChirho.witnessesChirho.length,
      0
    );
    linesChirho.push(
      `| ${spanChirho.validationStatusChirho} | ${spanChirho.spanSourceChirho} | ${spanChirho.volumeChirho} | ${spanChirho.pageChirho} | ${spanChirho.lineIndexChirho} | ${spanChirho.segmentIndexChirho} | ${spanChirho.textChirho.replaceAll("|", "\\|")} | ${spanChirho.tokenSkeletonsChirho.join(" ")} | ${witnessCountChirho} |`
    );
  }

  linesChirho.push("");
  return linesChirho.join("\n");
}

function mainChirho(): void {
  const optionsChirho = parseCliOptionsChirho(Bun.argv.slice(2));
  ensureDirChirho(optionsChirho.outDirChirho);
  const reportChirho = buildValidationReportChirho(optionsChirho);
  const jsonPathChirho = join(optionsChirho.outDirChirho, "pass-c-hebrew-validation-chirho.json");
  const markdownPathChirho = join(optionsChirho.outDirChirho, "pass-c-hebrew-validation-chirho.md");
  writeJsonAtomicChirho(jsonPathChirho, reportChirho);
  writeTextAtomicChirho(markdownPathChirho, markdownReportChirho(reportChirho));
  console.log(
    `[${MODULE_CHIRHO}] spans=${reportChirho.spanCountChirho}, ` +
      `tokens=${reportChirho.tokenCountChirho}, ` +
      `all=${reportChirho.allTokenValidatedSpanCountChirho}, ` +
      `partial=${reportChirho.partialTokenValidatedSpanCountChirho}, ` +
      `unvalidated=${reportChirho.unvalidatedSpanCountChirho}, ` +
      `validatedTokens=${reportChirho.validatedTokenCountChirho}/${reportChirho.tokenCountChirho}, ` +
      `source=${reportChirho.sourceFilterChirho}`
  );
  console.log(`[${MODULE_CHIRHO}] report=${jsonPathChirho}`);
}

mainChirho();
