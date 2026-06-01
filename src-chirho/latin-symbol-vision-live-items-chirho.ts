// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import { Database } from "bun:sqlite";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import { hashTextChirho, normalizeTextForStorageChirho } from "./text-normalization-chirho.ts";

export { hashTextChirho } from "./text-normalization-chirho.ts";

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
const NON_LATIN_EXPERT_SCRIPT_VALUES_CHIRHO = new Set([
  "hebrew-chirho",
  "greek-chirho",
  "arabic-chirho",
  "syriac-chirho",
]);

interface SpanChirho {
  segmentIndexChirho: number;
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

interface D1VisionWordRowChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  wordIndexChirho: number;
  textChirho: string | null;
  scriptChirho: string | null;
}

export interface LatinSymbolVisionLiveItemChirho {
  idChirho: string;
  itemKindChirho: "span-chirho" | "d1-word-chirho";
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number | null;
  wordIndexChirho: number | null;
  scriptChirho: string;
  textChirho: string;
  lineTextChirho: string;
  sourceChirho: "explicit-span-provenance-chirho" | "d1-current-source-chirho";
}

export interface LatinSymbolVisionLiveSnapshotChirho {
  itemsChirho: LatinSymbolVisionLiveItemChirho[];
  d1ReadErrorChirho: string | null;
}

export function countByScriptChirho(itemsChirho: LatinSymbolVisionLiveItemChirho[]): Record<string, number> {
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

function lineTextChirho(lineChirho: SpanLineChirho): string {
  return [...lineChirho.spansChirho]
    .sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho)
    .map((spanChirho) => normalizeTextForStorageChirho(spanChirho.utf8TextChirho))
    .join("");
}

function readSpanLineChirho(volumeChirho: number, pageChirho: number, lineChirho: number): SpanLineChirho {
  return JSON.parse(readFileSync(lineFilePathChirho(volumeChirho, pageChirho, lineChirho), "utf8")) as SpanLineChirho;
}

function readSpanLinesChirho(): SpanLineChirho[] {
  const linesChirho: SpanLineChirho[] = [];
  for (const volumeChirho of sortedDirNumbersChirho(SPANS_ROOT_CHIRHO, VOL_DIR_RE_CHIRHO)) {
    const volumeDirChirho = join(SPANS_ROOT_CHIRHO, `vol-${volumeChirho}-chirho`);
    for (const pageChirho of sortedDirNumbersChirho(volumeDirChirho, PAGE_DIR_RE_CHIRHO)) {
      const pageDirChirho = join(volumeDirChirho, `page-${paddedPageChirho(pageChirho)}-chirho`);
      for (const lineChirho of sortedDirNumbersChirho(pageDirChirho, LINE_FILE_RE_CHIRHO)) {
        linesChirho.push(readSpanLineChirho(volumeChirho, pageChirho, lineChirho));
      }
    }
  }
  return linesChirho;
}

function explicitSpanIdChirho(lineChirho: SpanLineChirho, spanChirho: SpanChirho): string {
  return [
    `v${lineChirho.volumeChirho}`,
    `p${paddedPageChirho(lineChirho.pageChirho)}`,
    `l${paddedLineChirho(lineChirho.lineIndexChirho)}`,
    `s${spanChirho.segmentIndexChirho}`,
  ].join("-");
}

function d1WordIdChirho(wordChirho: D1VisionWordRowChirho): string {
  return [
    `v${wordChirho.volumeChirho}`,
    `p${paddedPageChirho(wordChirho.pageChirho)}`,
    `l${paddedLineChirho(wordChirho.lineIndexChirho)}`,
    `w${wordChirho.wordIndexChirho}`,
  ].join("-");
}

function explicitSpanItemsChirho(): LatinSymbolVisionLiveItemChirho[] {
  const itemsChirho: LatinSymbolVisionLiveItemChirho[] = [];
  for (const lineChirho of readSpanLinesChirho()) {
    const textChirho = lineTextChirho(lineChirho);
    for (const spanChirho of lineChirho.spansChirho) {
      if (spanChirho.provenanceChirho !== "vision-chirho") continue;
      if (NON_LATIN_EXPERT_SCRIPT_VALUES_CHIRHO.has(spanChirho.scriptChirho)) continue;
      itemsChirho.push({
        idChirho: explicitSpanIdChirho(lineChirho, spanChirho),
        itemKindChirho: "span-chirho",
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        wordIndexChirho: null,
        scriptChirho: spanChirho.scriptChirho,
        textChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
        lineTextChirho: textChirho,
        sourceChirho: "explicit-span-provenance-chirho",
      });
    }
  }
  return itemsChirho;
}

function latestLocalD1PathChirho(): string | null {
  if (!existsSync(LOCAL_D1_DIR_CHIRHO)) return null;
  const sqliteFilesChirho = readdirSync(LOCAL_D1_DIR_CHIRHO)
    .filter((fileChirho) => fileChirho.endsWith(".sqlite"))
    .map((fileChirho) => join(LOCAL_D1_DIR_CHIRHO, fileChirho))
    .sort((aChirho, bChirho) => statSync(bChirho).mtimeMs - statSync(aChirho).mtimeMs);
  return sqliteFilesChirho[0] ?? null;
}

function d1VisionWordRowsChirho(): D1VisionWordRowChirho[] {
  const dbPathChirho = latestLocalD1PathChirho();
  if (dbPathChirho === null) return [];
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    return dbChirho
      .query(`
        SELECT p.volume_number_chirho AS volumeChirho,
               p.page_number_chirho AS pageChirho,
               sl.line_index_chirho AS lineIndexChirho,
               w.word_index_chirho AS wordIndexChirho,
               w.current_text_chirho AS textChirho,
               w.current_script_chirho AS scriptChirho
          FROM words_chirho w
          JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
          JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
         WHERE w.current_source_chirho = 'vision-chirho'
         ORDER BY p.volume_number_chirho, p.page_number_chirho, sl.line_index_chirho, w.word_index_chirho`)
      .all() as D1VisionWordRowChirho[];
  } finally {
    dbChirho.close();
  }
}

function d1WordItemsChirho(): LatinSymbolVisionLiveItemChirho[] {
  return d1VisionWordRowsChirho()
    .map((wordChirho): LatinSymbolVisionLiveItemChirho | null => {
      const scriptChirho = wordChirho.scriptChirho ?? "unknown-chirho";
      if (NON_LATIN_EXPERT_SCRIPT_VALUES_CHIRHO.has(scriptChirho)) return null;
      const lineChirho = readSpanLineChirho(wordChirho.volumeChirho, wordChirho.pageChirho, wordChirho.lineIndexChirho);
      return {
        idChirho: d1WordIdChirho(wordChirho),
        itemKindChirho: "d1-word-chirho",
        volumeChirho: wordChirho.volumeChirho,
        pageChirho: wordChirho.pageChirho,
        lineIndexChirho: wordChirho.lineIndexChirho,
        segmentIndexChirho: null,
        wordIndexChirho: wordChirho.wordIndexChirho,
        scriptChirho,
        textChirho: normalizeTextForStorageChirho(wordChirho.textChirho ?? ""),
        lineTextChirho: lineTextChirho(lineChirho),
        sourceChirho: "d1-current-source-chirho",
      };
    })
    .filter((itemChirho): itemChirho is LatinSymbolVisionLiveItemChirho => itemChirho !== null);
}

function scriptSortChirho(scriptChirho: string): number {
  if (scriptChirho === "french-chirho") return 0;
  if (scriptChirho === "latin-non-french-chirho") return 1;
  if (scriptChirho === "symbol-chirho") return 2;
  return 3;
}

function sortItemsChirho(itemsChirho: LatinSymbolVisionLiveItemChirho[]): LatinSymbolVisionLiveItemChirho[] {
  return [...itemsChirho].sort((aChirho, bChirho) =>
    scriptSortChirho(aChirho.scriptChirho) - scriptSortChirho(bChirho.scriptChirho) ||
    aChirho.volumeChirho - bChirho.volumeChirho ||
    aChirho.pageChirho - bChirho.pageChirho ||
    aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
    (aChirho.segmentIndexChirho ?? 9999) - (bChirho.segmentIndexChirho ?? 9999) ||
    (aChirho.wordIndexChirho ?? 9999) - (bChirho.wordIndexChirho ?? 9999)
  );
}

export function latinSymbolVisionLiveItemsChirho(): LatinSymbolVisionLiveItemChirho[] {
  return sortItemsChirho([...explicitSpanItemsChirho(), ...d1WordItemsChirho()]);
}

export function latinSymbolVisionLiveSnapshotChirho(): LatinSymbolVisionLiveSnapshotChirho {
  const explicitItemsChirho = explicitSpanItemsChirho();
  try {
    return {
      itemsChirho: sortItemsChirho([...explicitItemsChirho, ...d1WordItemsChirho()]),
      d1ReadErrorChirho: null,
    };
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    return {
      itemsChirho: sortItemsChirho(explicitItemsChirho),
      d1ReadErrorChirho: messageChirho,
    };
  }
}
