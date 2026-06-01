// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, relative } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  assertCanonicalEquivalentChirho,
  isNfcTextChirho,
  normalizeTextForStorageChirho,
} from "./text-normalization-chirho.ts";

const DEFAULT_SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const VOL_DIR_RE_CHIRHO = /^vol-(\d+)-chirho$/;
const PAGE_DIR_RE_CHIRHO = /^page-(\d+)-chirho$/;
const LINE_FILE_RE_CHIRHO = /^line-(\d+)-chirho\.json$/;

export const SPAN_NFC_TEXT_FIELDS_CHIRHO = [
  "utf8TextChirho",
  "humanSuggestedTextChirho",
  "wlcSuggestedTextChirho",
] as const;

export type SpanNfcTextFieldNameChirho = (typeof SPAN_NFC_TEXT_FIELDS_CHIRHO)[number];

export interface SpanNfcFindingChirho {
  filePathChirho: string;
  relativePathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  scriptChirho: string | null;
  fieldNameChirho: SpanNfcTextFieldNameChirho;
  textChirho: string;
  normalizedTextChirho: string;
}

export interface SpanLikeChirho {
  segmentIndexChirho?: number;
  scriptChirho?: string;
  utf8TextChirho?: string;
  humanSuggestedTextChirho?: string;
  wlcSuggestedTextChirho?: string;
}

export interface SpanLineLikeChirho {
  volumeChirho?: number;
  pageChirho?: number;
  lineIndexChirho?: number;
  spansChirho?: SpanLikeChirho[];
}

function sortedDirNumbersChirho(rootChirho: string, reChirho: RegExp): number[] {
  if (!existsSync(rootChirho)) return [];
  return readdirSync(rootChirho)
    .map((nameChirho) => nameChirho.match(reChirho)?.[1])
    .filter((valueChirho): valueChirho is string => valueChirho !== undefined)
    .map((valueChirho) => Number.parseInt(valueChirho, 10))
    .sort((aChirho, bChirho) => aChirho - bChirho);
}

export function spanLinePathChirho(
  volumeChirho: number,
  pageChirho: number,
  lineIndexChirho: number,
  spansRootChirho = DEFAULT_SPANS_ROOT_CHIRHO
): string {
  return join(
    spansRootChirho,
    `vol-${volumeChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

export function scanSpanLinePathsChirho(spansRootChirho = DEFAULT_SPANS_ROOT_CHIRHO): string[] {
  const pathsChirho: string[] = [];
  for (const volumeChirho of sortedDirNumbersChirho(spansRootChirho, VOL_DIR_RE_CHIRHO)) {
    const volumeDirChirho = join(spansRootChirho, `vol-${volumeChirho}-chirho`);
    for (const pageChirho of sortedDirNumbersChirho(volumeDirChirho, PAGE_DIR_RE_CHIRHO)) {
      const pageDirChirho = join(volumeDirChirho, `page-${String(pageChirho).padStart(4, "0")}-chirho`);
      for (const lineIndexChirho of sortedDirNumbersChirho(pageDirChirho, LINE_FILE_RE_CHIRHO)) {
        pathsChirho.push(spanLinePathChirho(volumeChirho, pageChirho, lineIndexChirho, spansRootChirho));
      }
    }
  }
  return pathsChirho;
}

function readSpanLineLikeChirho(pathChirho: string): SpanLineLikeChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineLikeChirho;
}

export function scanNonNfcSpanTextFieldsChirho(spansRootChirho = DEFAULT_SPANS_ROOT_CHIRHO): SpanNfcFindingChirho[] {
  const findingsChirho: SpanNfcFindingChirho[] = [];
  for (const pathChirho of scanSpanLinePathsChirho(spansRootChirho)) {
    const lineChirho = readSpanLineLikeChirho(pathChirho);
    for (const spanChirho of lineChirho.spansChirho ?? []) {
      for (const fieldNameChirho of SPAN_NFC_TEXT_FIELDS_CHIRHO) {
        const textChirho = spanChirho[fieldNameChirho];
        if (typeof textChirho !== "string" || isNfcTextChirho(textChirho)) continue;
        const normalizedTextChirho = normalizeTextForStorageChirho(textChirho);
        assertCanonicalEquivalentChirho(textChirho, normalizedTextChirho);
        findingsChirho.push({
          filePathChirho: pathChirho,
          relativePathChirho: relative(PROJECT_ROOT_CHIRHO, pathChirho),
          volumeChirho: lineChirho.volumeChirho ?? 0,
          pageChirho: lineChirho.pageChirho ?? 0,
          lineIndexChirho: lineChirho.lineIndexChirho ?? 0,
          segmentIndexChirho: spanChirho.segmentIndexChirho ?? -1,
          scriptChirho: spanChirho.scriptChirho ?? null,
          fieldNameChirho,
          textChirho,
          normalizedTextChirho,
        });
      }
    }
  }
  return findingsChirho;
}

export function normalizeSpanLineTextFieldsChirho(lineChirho: SpanLineLikeChirho): number {
  let changedFieldCountChirho = 0;
  for (const spanChirho of lineChirho.spansChirho ?? []) {
    for (const fieldNameChirho of SPAN_NFC_TEXT_FIELDS_CHIRHO) {
      const textChirho = spanChirho[fieldNameChirho];
      if (typeof textChirho !== "string" || isNfcTextChirho(textChirho)) continue;
      const normalizedTextChirho = normalizeTextForStorageChirho(textChirho);
      assertCanonicalEquivalentChirho(textChirho, normalizedTextChirho);
      spanChirho[fieldNameChirho] = normalizedTextChirho;
      changedFieldCountChirho += 1;
    }
  }
  return changedFieldCountChirho;
}
