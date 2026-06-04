// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Builds a review packet for Latin/symbol vision-tier decisions. These are
// outside the non-Latin expert pack but still block a project-wide flawless
// transcription claim until proofread or explicitly accepted by policy.

import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, relative } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { renderSpanLineTextChirho } from "../../src-chirho/span-line-text-chirho.ts";

const SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const LOCAL_D1_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "app-chirho",
  ".wrangler",
  "state",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject"
);
const OUT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "latin-symbol-vision-pack-chirho",
  "2026-05-31-chirho"
);
const IMAGE_DIR_CHIRHO = join(OUT_DIR_CHIRHO, "images-chirho");
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

interface D1VisionWordChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  wordIndexChirho: number;
  textChirho: string;
  scriptChirho: string;
  lineXMinChirho: number;
  lineYMinChirho: number;
  lineWidthChirho: number;
  lineHeightChirho: number;
  wordXMinChirho: number;
  wordYMinChirho: number;
  wordXMaxChirho: number;
  wordYMaxChirho: number;
}

interface ReviewItemChirho {
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
  targetPathChirho: string;
  targetMarkdownPathChirho: string;
  linePathChirho: string;
  lineMarkdownPathChirho: string;
}

interface PacketManifestChirho {
  generatedAtChirho: string;
  explicitSpanCountChirho: number;
  d1DerivedWordCountChirho: number;
  countsChirho: Record<string, number>;
  itemsChirho: ReviewItemChirho[];
}

interface ImageGeometryChirho {
  xMinChirho: number;
  xMaxChirho: number;
  yMinChirho: number;
  yMaxChirho: number;
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

function scanlinePathChirho(volumeChirho: number, pageChirho: number, lineChirho: number): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${volumeChirho}-chirho`,
    `page-${paddedPageChirho(pageChirho)}-chirho`,
    `line-${paddedLineChirho(lineChirho)}-chirho.png`
  );
}

function lineTextChirho(lineChirho: SpanLineChirho): string {
  return renderSpanLineTextChirho(lineChirho);
}

function latestLocalD1PathChirho(): string | null {
  if (!existsSync(LOCAL_D1_DIR_CHIRHO)) return null;
  const sqliteFilesChirho = readdirSync(LOCAL_D1_DIR_CHIRHO)
    .filter((fileChirho) => fileChirho.endsWith(".sqlite"))
    .map((fileChirho) => join(LOCAL_D1_DIR_CHIRHO, fileChirho))
    .sort((aChirho, bChirho) => statSync(bChirho).mtimeMs - statSync(aChirho).mtimeMs);
  return sqliteFilesChirho[0] ?? null;
}

function pngSizeChirho(pathChirho: string): { widthChirho: number; heightChirho: number } {
  const bytesChirho = readFileSync(pathChirho);
  const signatureChirho = bytesChirho.subarray(0, 8).toString("hex");
  if (signatureChirho !== "89504e470d0a1a0a") {
    throw new Error(`Expected PNG image: ${pathChirho}`);
  }
  return {
    widthChirho: bytesChirho.readUInt32BE(16),
    heightChirho: bytesChirho.readUInt32BE(20),
  };
}

function clampChirho(valueChirho: number, minChirho: number, maxChirho: number): number {
  return Math.min(maxChirho, Math.max(minChirho, valueChirho));
}

function runMagickChirho(argsChirho: string[]): void {
  const procChirho = Bun.spawnSync(["magick", ...argsChirho], {
    stdout: "pipe",
    stderr: "pipe",
  });
  if (procChirho.exitCode !== 0) {
    const stderrChirho = new TextDecoder().decode(procChirho.stderr);
    throw new Error(`magick failed: ${stderrChirho}`);
  }
}

function drawRectangleArgChirho(geometryChirho: ImageGeometryChirho): string {
  return (
    `rectangle ${Math.round(geometryChirho.xMinChirho)},${Math.round(geometryChirho.yMinChirho)} ` +
    `${Math.round(geometryChirho.xMaxChirho)},${Math.round(geometryChirho.yMaxChirho)}`
  );
}

function explicitSpanIdChirho(lineChirho: SpanLineChirho, spanChirho: SpanChirho): string {
  return [
    `v${lineChirho.volumeChirho}`,
    `p${paddedPageChirho(lineChirho.pageChirho)}`,
    `l${paddedLineChirho(lineChirho.lineIndexChirho)}`,
    `s${spanChirho.segmentIndexChirho}`,
  ].join("-");
}

function d1WordIdChirho(wordChirho: D1VisionWordChirho): string {
  return [
    `v${wordChirho.volumeChirho}`,
    `p${paddedPageChirho(wordChirho.pageChirho)}`,
    `l${paddedLineChirho(wordChirho.lineIndexChirho)}`,
    `w${wordChirho.wordIndexChirho}`,
  ].join("-");
}

function imagePathsChirho(idChirho: string): { targetPathChirho: string; linePathChirho: string } {
  return {
    targetPathChirho: join(IMAGE_DIR_CHIRHO, `${idChirho}-target-chirho.png`),
    linePathChirho: join(IMAGE_DIR_CHIRHO, `${idChirho}-line-chirho.png`),
  };
}

function targetCropSpecChirho(geometryChirho: ImageGeometryChirho, imageWidthChirho: number, imageHeightChirho: number): string {
  const cropXMinChirho = Math.round(clampChirho(geometryChirho.xMinChirho - 180, 0, imageWidthChirho - 1));
  const cropXMaxChirho = Math.round(clampChirho(geometryChirho.xMaxChirho + 180, cropXMinChirho + 1, imageWidthChirho));
  return `${cropXMaxChirho - cropXMinChirho}x${imageHeightChirho}+${cropXMinChirho}+0`;
}

function shiftedGeometryForCropChirho(
  geometryChirho: ImageGeometryChirho,
  cropSpecChirho: string
): ImageGeometryChirho {
  const matchChirho = cropSpecChirho.match(/^\d+x\d+\+(\d+)\+0$/);
  if (!matchChirho) throw new Error(`unexpected crop spec: ${cropSpecChirho}`);
  const cropXMinChirho = Number.parseInt(matchChirho[1]!, 10);
  return {
    ...geometryChirho,
    xMinChirho: geometryChirho.xMinChirho - cropXMinChirho,
    xMaxChirho: geometryChirho.xMaxChirho - cropXMinChirho,
  };
}

function generateImagesChirho(
  idChirho: string,
  volumeChirho: number,
  pageChirho: number,
  lineIndexChirho: number,
  geometryChirho: ImageGeometryChirho
): Pick<ReviewItemChirho, "targetPathChirho" | "targetMarkdownPathChirho" | "linePathChirho" | "lineMarkdownPathChirho"> {
  const sourceImagePathChirho = scanlinePathChirho(volumeChirho, pageChirho, lineIndexChirho);
  if (!existsSync(sourceImagePathChirho)) {
    throw new Error(`missing scanline image for ${idChirho}: ${sourceImagePathChirho}`);
  }
  const imageSizeChirho = pngSizeChirho(sourceImagePathChirho);
  const pathsChirho = imagePathsChirho(idChirho);
  const safeGeometryChirho = {
    xMinChirho: clampChirho(geometryChirho.xMinChirho, 0, imageSizeChirho.widthChirho),
    xMaxChirho: clampChirho(geometryChirho.xMaxChirho, 1, imageSizeChirho.widthChirho),
    yMinChirho: clampChirho(geometryChirho.yMinChirho, 0, imageSizeChirho.heightChirho - 1),
    yMaxChirho: clampChirho(geometryChirho.yMaxChirho, 1, imageSizeChirho.heightChirho),
  };
  const cropSpecChirho = targetCropSpecChirho(safeGeometryChirho, imageSizeChirho.widthChirho, imageSizeChirho.heightChirho);
  runMagickChirho([
    sourceImagePathChirho,
    "-fill",
    "rgba(210,63,49,0.14)",
    "-stroke",
    "#d23f31",
    "-strokewidth",
    "3",
    "-draw",
    drawRectangleArgChirho(safeGeometryChirho),
    pathsChirho.linePathChirho,
  ]);
  runMagickChirho([
    sourceImagePathChirho,
    "-crop",
    cropSpecChirho,
    "+repage",
    "-fill",
    "rgba(210,63,49,0.14)",
    "-stroke",
    "#d23f31",
    "-strokewidth",
    "3",
    "-draw",
    drawRectangleArgChirho(shiftedGeometryForCropChirho(safeGeometryChirho, cropSpecChirho)),
    pathsChirho.targetPathChirho,
  ]);
  return {
    targetPathChirho: pathsChirho.targetPathChirho,
    targetMarkdownPathChirho: relative(OUT_DIR_CHIRHO, pathsChirho.targetPathChirho),
    linePathChirho: pathsChirho.linePathChirho,
    lineMarkdownPathChirho: relative(OUT_DIR_CHIRHO, pathsChirho.linePathChirho),
  };
}

function explicitSpanGeometryChirho(lineChirho: SpanLineChirho, spanChirho: SpanChirho): ImageGeometryChirho {
  const sourceImagePathChirho = scanlinePathChirho(lineChirho.volumeChirho, lineChirho.pageChirho, lineChirho.lineIndexChirho);
  const imageSizeChirho = pngSizeChirho(sourceImagePathChirho);
  const scaleXChirho = imageSizeChirho.widthChirho / Math.max(1, lineChirho.lineWidthPxChirho);
  return {
    xMinChirho: spanChirho.xMinPxChirho * scaleXChirho,
    xMaxChirho: (spanChirho.xMinPxChirho + spanChirho.widthPxChirho) * scaleXChirho,
    yMinChirho: 2,
    yMaxChirho: Math.max(3, imageSizeChirho.heightChirho - 3),
  };
}

function d1WordGeometryChirho(wordChirho: D1VisionWordChirho): ImageGeometryChirho {
  const sourceImagePathChirho = scanlinePathChirho(wordChirho.volumeChirho, wordChirho.pageChirho, wordChirho.lineIndexChirho);
  const imageSizeChirho = pngSizeChirho(sourceImagePathChirho);
  const scaleXChirho = imageSizeChirho.widthChirho / Math.max(1, wordChirho.lineWidthChirho);
  const scaleYChirho = imageSizeChirho.heightChirho / Math.max(1, wordChirho.lineHeightChirho);
  return {
    xMinChirho: (wordChirho.wordXMinChirho - wordChirho.lineXMinChirho) * scaleXChirho,
    xMaxChirho: (wordChirho.wordXMaxChirho - wordChirho.lineXMinChirho) * scaleXChirho,
    yMinChirho: (wordChirho.wordYMinChirho - wordChirho.lineYMinChirho) * scaleYChirho,
    yMaxChirho: (wordChirho.wordYMaxChirho - wordChirho.lineYMinChirho) * scaleYChirho,
  };
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

function discoverExplicitSpanItemsChirho(): ReviewItemChirho[] {
  const itemsChirho: ReviewItemChirho[] = [];
  for (const lineChirho of readSpanLinesChirho()) {
    const textChirho = lineTextChirho(lineChirho);
    for (const spanChirho of lineChirho.spansChirho) {
      if (spanChirho.provenanceChirho !== "vision-chirho") continue;
      if (NON_LATIN_EXPERT_SCRIPT_VALUES_CHIRHO.has(spanChirho.scriptChirho)) continue;
      const idChirho = explicitSpanIdChirho(lineChirho, spanChirho);
      const imagesChirho = generateImagesChirho(
        idChirho,
        lineChirho.volumeChirho,
        lineChirho.pageChirho,
        lineChirho.lineIndexChirho,
        explicitSpanGeometryChirho(lineChirho, spanChirho)
      );
      itemsChirho.push({
        idChirho,
        itemKindChirho: "span-chirho",
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        wordIndexChirho: null,
        scriptChirho: spanChirho.scriptChirho,
        textChirho: spanChirho.utf8TextChirho,
        lineTextChirho: textChirho,
        sourceChirho: "explicit-span-provenance-chirho",
        ...imagesChirho,
      });
    }
  }
  return itemsChirho;
}

function discoverD1WordRowsChirho(): D1VisionWordChirho[] {
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
               w.current_script_chirho AS scriptChirho,
               sl.x_min_chirho AS lineXMinChirho,
               sl.y_min_chirho AS lineYMinChirho,
               sl.width_chirho AS lineWidthChirho,
               sl.height_chirho AS lineHeightChirho,
               w.x_min_chirho AS wordXMinChirho,
               w.y_min_chirho AS wordYMinChirho,
               w.x_max_chirho AS wordXMaxChirho,
               w.y_max_chirho AS wordYMaxChirho
          FROM words_chirho w
          JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
          JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
         WHERE w.current_source_chirho = 'vision-chirho'
           AND w.current_script_chirho NOT IN ('hebrew-chirho', 'greek-chirho', 'arabic-chirho', 'syriac-chirho')
         ORDER BY p.volume_number_chirho, p.page_number_chirho, sl.line_index_chirho, w.word_index_chirho`)
      .all() as D1VisionWordChirho[];
  } finally {
    dbChirho.close();
  }
}

function discoverD1WordItemsChirho(): ReviewItemChirho[] {
  return discoverD1WordRowsChirho().map((wordChirho) => {
    const linePathChirho = lineFilePathChirho(wordChirho.volumeChirho, wordChirho.pageChirho, wordChirho.lineIndexChirho);
    const lineChirho = JSON.parse(readFileSync(linePathChirho, "utf8")) as SpanLineChirho;
    const idChirho = d1WordIdChirho(wordChirho);
    const imagesChirho = generateImagesChirho(
      idChirho,
      wordChirho.volumeChirho,
      wordChirho.pageChirho,
      wordChirho.lineIndexChirho,
      d1WordGeometryChirho(wordChirho)
    );
    return {
      idChirho,
      itemKindChirho: "d1-word-chirho",
      volumeChirho: wordChirho.volumeChirho,
      pageChirho: wordChirho.pageChirho,
      lineIndexChirho: wordChirho.lineIndexChirho,
      segmentIndexChirho: null,
      wordIndexChirho: wordChirho.wordIndexChirho,
      scriptChirho: wordChirho.scriptChirho,
      textChirho: wordChirho.textChirho,
      lineTextChirho: lineTextChirho(lineChirho),
      sourceChirho: "d1-current-source-chirho",
      ...imagesChirho,
    };
  });
}

function countByScriptChirho(itemsChirho: ReviewItemChirho[]): Record<string, number> {
  const countsChirho: Record<string, number> = {};
  for (const itemChirho of itemsChirho) {
    countsChirho[itemChirho.scriptChirho] = (countsChirho[itemChirho.scriptChirho] ?? 0) + 1;
  }
  return countsChirho;
}

function escapeHtmlChirho(textChirho: string): string {
  return textChirho
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineTextChirho(textChirho: string): string {
  return `<span dir="auto">${escapeHtmlChirho(textChirho)}</span>`;
}

function scriptSortChirho(scriptChirho: string): number {
  if (scriptChirho === "french-chirho") return 0;
  if (scriptChirho === "latin-non-french-chirho") return 1;
  if (scriptChirho === "symbol-chirho") return 2;
  return 3;
}

function sortItemsChirho(itemsChirho: ReviewItemChirho[]): ReviewItemChirho[] {
  return [...itemsChirho].sort((aChirho, bChirho) =>
    scriptSortChirho(aChirho.scriptChirho) - scriptSortChirho(bChirho.scriptChirho) ||
    aChirho.volumeChirho - bChirho.volumeChirho ||
    aChirho.pageChirho - bChirho.pageChirho ||
    aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
    (aChirho.segmentIndexChirho ?? 9999) - (bChirho.segmentIndexChirho ?? 9999) ||
    (aChirho.wordIndexChirho ?? 9999) - (bChirho.wordIndexChirho ?? 9999)
  );
}

function itemMarkdownChirho(itemChirho: ReviewItemChirho): string[] {
  const localRefChirho = itemChirho.itemKindChirho === "span-chirho"
    ? `S${itemChirho.segmentIndexChirho}`
    : `W${itemChirho.wordIndexChirho}`;
  return [
    `#### ${itemChirho.idChirho}`,
    "",
    `- Source: ${itemChirho.sourceChirho}`,
    `- Location: vol ${itemChirho.volumeChirho}, p${itemChirho.pageChirho}, L${itemChirho.lineIndexChirho} ${localRefChirho}`,
    `- Script: ${itemChirho.scriptChirho}`,
    `- Current text: ${inlineTextChirho(itemChirho.textChirho)}`,
    `- Line text: ${inlineTextChirho(itemChirho.lineTextChirho)}`,
    "",
    `![${itemChirho.idChirho} target](${itemChirho.targetMarkdownPathChirho})`,
    "",
    `![${itemChirho.idChirho} full line](${itemChirho.lineMarkdownPathChirho})`,
    "",
  ];
}

function markdownChirho(itemsChirho: ReviewItemChirho[], countsChirho: Record<string, number>): string {
  const linesChirho = [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Latin/Symbol Vision Review Packet Chirho",
    "",
    "This packet covers Latin, French, and symbol text that entered the transcription through a vision-tier decision. These items are outside the non-Latin expert pack, but they still block a project-wide flawless-transcription claim until proofread or explicitly accepted by policy.",
    "",
    "Use this as a read-only proofing aid. It does not apply verdicts or change span provenance.",
    "",
    `Counts: ${Object.entries(countsChirho).map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`).join(", ")}`,
    `Total decisions: ${itemsChirho.length}`,
    "",
  ];

  const scriptsChirho = ["french-chirho", "latin-non-french-chirho", "symbol-chirho"];
  for (const scriptChirho of scriptsChirho) {
    const scriptItemsChirho = itemsChirho.filter((itemChirho) => itemChirho.scriptChirho === scriptChirho);
    linesChirho.push(`## ${scriptChirho} (${scriptItemsChirho.length})`, "");
    for (const itemChirho of scriptItemsChirho) {
      linesChirho.push(...itemMarkdownChirho(itemChirho));
    }
  }
  return `${linesChirho.join("\n").trimEnd()}\n`;
}

function generatePackChirho(): void {
  mkdirSync(IMAGE_DIR_CHIRHO, { recursive: true });
  const explicitItemsChirho = discoverExplicitSpanItemsChirho();
  const d1ItemsChirho = discoverD1WordItemsChirho();
  const itemsChirho = sortItemsChirho([...explicitItemsChirho, ...d1ItemsChirho]);
  const countsChirho = countByScriptChirho(itemsChirho);
  const manifestChirho: PacketManifestChirho = {
    generatedAtChirho: new Date().toISOString(),
    explicitSpanCountChirho: explicitItemsChirho.length,
    d1DerivedWordCountChirho: d1ItemsChirho.length,
    countsChirho,
    itemsChirho,
  };
  writeFileSync(join(OUT_DIR_CHIRHO, "manifest-chirho.json"), `${JSON.stringify(manifestChirho, null, 2)}\n`);
  writeFileSync(join(OUT_DIR_CHIRHO, "index-chirho.md"), markdownChirho(itemsChirho, countsChirho));
  console.log(
    `wrote ${itemsChirho.length} Latin/symbol vision review item(s) ` +
      `(${explicitItemsChirho.length} explicit span, ${d1ItemsChirho.length} D1 word) to ${OUT_DIR_CHIRHO}`
  );
}

generatePackChirho();
