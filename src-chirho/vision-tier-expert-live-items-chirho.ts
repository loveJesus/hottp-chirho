// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Live discovery for non-Latin vision-tier items that need expert/human
 * confirmation before a flawless transcription claim.
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

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

export const VISION_TIER_EXPERT_SCRIPT_ORDER_CHIRHO = [
  "syriac-chirho",
  "arabic-chirho",
  "hebrew-chirho",
  "greek-chirho",
] as const;
export const VISION_TIER_EXPERT_SCRIPT_VALUES_CHIRHO = new Set<string>(
  VISION_TIER_EXPERT_SCRIPT_ORDER_CHIRHO
);
export const VISION_TIER_EXPERT_REVIEWER_LABELS_CHIRHO: Record<string, string> = {
  "syriac-chirho": "Syriac reader",
  "arabic-chirho": "Arabist",
  "hebrew-chirho": "Hebrew/WLC reviewer",
  "greek-chirho": "Greek/textual reviewer",
};

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
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  spansChirho: SpanChirho[];
}

interface D1VisionWordRowChirho {
  volumeChirho: number;
  pageChirho: number;
  textChirho: string | null;
  scriptChirho: string | null;
}

interface D1VisionSourcesChirho {
  textSourceByExactTextChirho: Set<string>;
  textSourceByHebrewSkeletonChirho: Set<string>;
}

export interface VisionTierExpertLiveItemChirho {
  idChirho: string;
  reviewerChirho: string;
  scriptChirho: string;
  visionSourceChirho: "explicit-span-chirho" | "d1-derived-chirho";
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  currentTextChirho: string;
  spanXMinPxChirho: number;
  spanWidthPxChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
}

export interface VisionTierExpertLiveSnapshotChirho {
  itemsChirho: VisionTierExpertLiveItemChirho[];
  d1ReadErrorChirho: string | null;
}

export function countVisionTierExpertByScriptChirho(
  itemsChirho: VisionTierExpertLiveItemChirho[]
): Record<string, number> {
  const countsChirho: Record<string, number> = {};
  for (const itemChirho of itemsChirho) {
    countsChirho[itemChirho.scriptChirho] = (countsChirho[itemChirho.scriptChirho] ?? 0) + 1;
  }
  return countsChirho;
}

function paddedPageChirho(pageChirho: number): string {
  return String(pageChirho).padStart(4, "0");
}

function paddedLineChirho(lineChirho: number): string {
  return String(lineChirho).padStart(3, "0");
}

function sortedDirNumbersChirho(rootChirho: string, reChirho: RegExp): number[] {
  if (!existsSync(rootChirho)) return [];
  return readdirSync(rootChirho)
    .map((nameChirho) => nameChirho.match(reChirho)?.[1])
    .filter((valueChirho): valueChirho is string => valueChirho !== undefined)
    .map((valueChirho) => Number.parseInt(valueChirho, 10))
    .sort((aChirho, bChirho) => aChirho - bChirho);
}

function lineFilePathChirho(volumeChirho: number, pageChirho: number, lineChirho: number): string {
  return join(
    SPANS_ROOT_CHIRHO,
    `vol-${volumeChirho}-chirho`,
    `page-${paddedPageChirho(pageChirho)}-chirho`,
    `line-${paddedLineChirho(lineChirho)}-chirho.json`
  );
}

function spanKeyChirho(volumeChirho: number, pageChirho: number, lineChirho: number, segmentChirho: number): string {
  return `v${volumeChirho}-p${paddedPageChirho(pageChirho)}-l${paddedLineChirho(lineChirho)}-s${segmentChirho}`;
}

function targetKeyChirho(volumeChirho: number, pageChirho: number): string {
  return `${volumeChirho}:${pageChirho}`;
}

function latestLocalD1PathChirho(): string | null {
  if (!existsSync(LOCAL_D1_DIR_CHIRHO)) return null;
  const sqliteFilesChirho = readdirSync(LOCAL_D1_DIR_CHIRHO)
    .filter((fileChirho) => fileChirho.endsWith(".sqlite"))
    .map((fileChirho) => join(LOCAL_D1_DIR_CHIRHO, fileChirho))
    .sort((aChirho, bChirho) => statSync(bChirho).mtimeMs - statSync(aChirho).mtimeMs);
  return sqliteFilesChirho[0] ?? null;
}

function stripHebrewMarksChirho(textChirho: string): string {
  return textChirho.normalize("NFKD").replace(/[\u0591-\u05C7]/g, "");
}

function hebrewSkeletonChirho(textChirho: string): string {
  return stripHebrewMarksChirho(textChirho).replace(/[^\u05D0-\u05EA]/g, "");
}

function hebrewTokenSkeletonsChirho(textChirho: string): string[] {
  const tokenMatchesChirho = textChirho.match(/[\u0591-\u05C7\u05D0-\u05EA]+/g) ?? [];
  return tokenMatchesChirho.map(hebrewSkeletonChirho).filter((tokenChirho) => tokenChirho.length > 0);
}

function normalizedExactTextChirho(textChirho: string): string {
  return normalizeTextForStorageChirho(textChirho.trim());
}

function readSpanLinesChirho(): SpanLineChirho[] {
  const linesChirho: SpanLineChirho[] = [];
  for (const volumeChirho of sortedDirNumbersChirho(SPANS_ROOT_CHIRHO, VOL_DIR_RE_CHIRHO)) {
    const volumeDirChirho = join(SPANS_ROOT_CHIRHO, `vol-${volumeChirho}-chirho`);
    for (const pageChirho of sortedDirNumbersChirho(volumeDirChirho, PAGE_DIR_RE_CHIRHO)) {
      const pageDirChirho = join(volumeDirChirho, `page-${paddedPageChirho(pageChirho)}-chirho`);
      for (const lineChirho of sortedDirNumbersChirho(pageDirChirho, LINE_FILE_RE_CHIRHO)) {
        linesChirho.push(JSON.parse(readFileSync(lineFilePathChirho(volumeChirho, pageChirho, lineChirho), "utf8")) as SpanLineChirho);
      }
    }
  }
  return linesChirho;
}

function d1VisionRowsChirho(): D1VisionWordRowChirho[] {
  const dbPathChirho = latestLocalD1PathChirho();
  if (dbPathChirho === null) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    return dbChirho
      .query(
        `SELECT p.volume_number_chirho AS volumeChirho,
                p.page_number_chirho AS pageChirho,
                w.current_text_chirho AS textChirho,
                w.current_script_chirho AS scriptChirho
           FROM words_chirho w
           JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
           JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
          WHERE w.current_source_chirho = 'vision-chirho'`
      )
      .all() as D1VisionWordRowChirho[];
  } finally {
    dbChirho.close();
  }
}

function d1VisionSourcesChirho(): Map<string, D1VisionSourcesChirho> {
  const sourcesChirho = new Map<string, D1VisionSourcesChirho>();
  for (const rowChirho of d1VisionRowsChirho()) {
    const textChirho = normalizedExactTextChirho(rowChirho.textChirho ?? "");
    if (textChirho.length === 0) continue;
    const keyChirho = targetKeyChirho(rowChirho.volumeChirho, rowChirho.pageChirho);
    const sourceChirho = sourcesChirho.get(keyChirho) ?? {
      textSourceByExactTextChirho: new Set<string>(),
      textSourceByHebrewSkeletonChirho: new Set<string>(),
    };
    sourceChirho.textSourceByExactTextChirho.add(textChirho);
    if (rowChirho.scriptChirho === "hebrew-chirho") {
      const skeletonChirho = hebrewSkeletonChirho(textChirho);
      if (skeletonChirho.length > 0) sourceChirho.textSourceByHebrewSkeletonChirho.add(skeletonChirho);
    }
    sourcesChirho.set(keyChirho, sourceChirho);
  }
  return sourcesChirho;
}

function visionSourceForSpanChirho(
  lineChirho: SpanLineChirho,
  spanChirho: SpanChirho,
  d1SourcesChirho: Map<string, D1VisionSourcesChirho>
): "explicit-span-chirho" | "d1-derived-chirho" | null {
  if (spanChirho.provenanceChirho === "vision-chirho") return "explicit-span-chirho";
  if (spanChirho.scriptChirho !== "hebrew-chirho") return null;
  const sourceChirho = d1SourcesChirho.get(targetKeyChirho(lineChirho.volumeChirho, lineChirho.pageChirho));
  if (!sourceChirho) return null;
  if (sourceChirho.textSourceByExactTextChirho.has(normalizedExactTextChirho(spanChirho.utf8TextChirho))) {
    return "d1-derived-chirho";
  }
  const tokenSkeletonsChirho = hebrewTokenSkeletonsChirho(spanChirho.utf8TextChirho);
  if (
    tokenSkeletonsChirho.length > 0 &&
    tokenSkeletonsChirho.every((skeletonChirho) => sourceChirho.textSourceByHebrewSkeletonChirho.has(skeletonChirho))
  ) {
    return "d1-derived-chirho";
  }
  return null;
}

function scriptSortIndexChirho(scriptChirho: string): number {
  const indexChirho = VISION_TIER_EXPERT_SCRIPT_ORDER_CHIRHO.indexOf(
    scriptChirho as (typeof VISION_TIER_EXPERT_SCRIPT_ORDER_CHIRHO)[number]
  );
  return indexChirho === -1 ? VISION_TIER_EXPERT_SCRIPT_ORDER_CHIRHO.length : indexChirho;
}

function sortItemsChirho(itemsChirho: VisionTierExpertLiveItemChirho[]): VisionTierExpertLiveItemChirho[] {
  return [...itemsChirho].sort((aChirho, bChirho) =>
    scriptSortIndexChirho(aChirho.scriptChirho) - scriptSortIndexChirho(bChirho.scriptChirho) ||
    aChirho.volumeChirho - bChirho.volumeChirho ||
    aChirho.pageChirho - bChirho.pageChirho ||
    aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
    aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );
}

function discoverVisionTierItemsChirho(
  d1SourcesChirho: Map<string, D1VisionSourcesChirho>
): VisionTierExpertLiveItemChirho[] {
  const itemsChirho: VisionTierExpertLiveItemChirho[] = [];
  for (const lineChirho of readSpanLinesChirho()) {
    for (const spanChirho of lineChirho.spansChirho) {
      if (!VISION_TIER_EXPERT_SCRIPT_VALUES_CHIRHO.has(spanChirho.scriptChirho)) continue;
      const visionSourceChirho = visionSourceForSpanChirho(lineChirho, spanChirho, d1SourcesChirho);
      if (visionSourceChirho === null) continue;
      itemsChirho.push({
        idChirho: spanKeyChirho(
          lineChirho.volumeChirho,
          lineChirho.pageChirho,
          lineChirho.lineIndexChirho,
          spanChirho.segmentIndexChirho
        ),
        reviewerChirho: VISION_TIER_EXPERT_REVIEWER_LABELS_CHIRHO[spanChirho.scriptChirho] ?? "Reviewer",
        scriptChirho: spanChirho.scriptChirho,
        visionSourceChirho,
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        currentTextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
        spanXMinPxChirho: spanChirho.xMinPxChirho,
        spanWidthPxChirho: spanChirho.widthPxChirho,
        lineWidthPxChirho: lineChirho.lineWidthPxChirho,
        lineHeightPxChirho: lineChirho.lineHeightPxChirho,
      });
    }
  }
  return sortItemsChirho(itemsChirho);
}

export function visionTierExpertLiveItemsChirho(): VisionTierExpertLiveItemChirho[] {
  return discoverVisionTierItemsChirho(d1VisionSourcesChirho());
}

export function visionTierExpertLiveSnapshotChirho(): VisionTierExpertLiveSnapshotChirho {
  try {
    return {
      itemsChirho: visionTierExpertLiveItemsChirho(),
      d1ReadErrorChirho: null,
    };
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    return {
      itemsChirho: discoverVisionTierItemsChirho(new Map()),
      d1ReadErrorChirho: messageChirho,
    };
  }
}
