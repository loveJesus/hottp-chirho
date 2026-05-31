// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Builds a reviewer packet for the remaining vision-tier transcription
// questions. Priority items are listed first, followed by a complete generated
// appendix of every non-Latin vision-tier span so machine text is never
// mistaken for human-confirmed text. Vision-tier includes explicit
// provenanceChirho="vision-chirho" spans plus D1 current_source_chirho
// vision words that resolve a Hebrew span by exact text or skeleton.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, relative } from "path";
import { Database } from "bun:sqlite";

const PROJECT_ROOT_CHIRHO = "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho";
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
  "expert-confirm-pack-chirho",
  "2026-05-31-chirho"
);
const IMAGE_DIR_CHIRHO = join(OUT_DIR_CHIRHO, "images-chirho");
const LINE_FILE_RE_CHIRHO = /^line-(\d+)-chirho\.json$/;
const PAGE_DIR_RE_CHIRHO = /^page-(\d+)-chirho$/;
const VOL_DIR_RE_CHIRHO = /^vol-(\d+)-chirho$/;
const REVIEW_SCRIPT_ORDER_CHIRHO = [
  "syriac-chirho",
  "arabic-chirho",
  "hebrew-chirho",
  "greek-chirho",
];
const REVIEW_SCRIPT_LABELS_CHIRHO: Record<string, string> = {
  "syriac-chirho": "Syriac reader",
  "arabic-chirho": "Arabist",
  "hebrew-chirho": "Hebrew/WLC reviewer",
  "greek-chirho": "Greek/textual reviewer",
};
const REVIEW_SCRIPTS_CHIRHO = new Set<string>(REVIEW_SCRIPT_ORDER_CHIRHO);

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

interface PriorityItemChirho {
  idChirho: string;
  reviewerChirho: string;
  priorityChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineStartChirho: number;
  lineEndChirho?: number;
  spanRefsChirho: string[];
  currentTextChirho: string;
  questionChirho: string;
  sourceNoteChirho?: string;
}

interface GeneratedImageChirho {
  lineIndexChirho: number;
  sourcePathChirho: string;
  packetPathChirho: string;
  markdownPathChirho: string;
}

interface PriorityManifestItemChirho extends PriorityItemChirho {
  imagesChirho: GeneratedImageChirho[];
}

interface VisionSpanItemChirho {
  idChirho: string;
  reviewerChirho: string;
  scriptChirho: string;
  visionSourceChirho: "explicit-span-chirho" | "d1-derived-chirho";
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  currentTextChirho: string;
  sourcePathChirho: string;
  packetPathChirho: string;
  markdownPathChirho: string;
  priorityMatchChirho: boolean;
}

interface D1VisionSourcesChirho {
  textSourceByExactTextChirho: Set<string>;
  textSourceByHebrewSkeletonChirho: Set<string>;
}

interface PacketManifestChirho {
  generatedAtChirho: string;
  strictExportStatusChirho: string;
  priorityItemsChirho: PriorityManifestItemChirho[];
  completeVisionCountsChirho: Record<string, number>;
  completeVisionItemsChirho: VisionSpanItemChirho[];
}

function paddedPageChirho(pageChirho: number): string {
  return String(pageChirho).padStart(4, "0");
}

function paddedLineChirho(lineChirho: number): string {
  return String(lineChirho).padStart(3, "0");
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
  return textChirho.trim().normalize("NFC");
}

function readD1VisionSourcesChirho(): Map<string, D1VisionSourcesChirho> {
  const dbPathChirho = latestLocalD1PathChirho();
  const sourcesChirho = new Map<string, D1VisionSourcesChirho>();
  if (dbPathChirho === null) return sourcesChirho;
  const dbChirho = new Database(dbPathChirho, { readonly: true });
  try {
    const rowsChirho = dbChirho
      .query(
        `SELECT p.volume_number_chirho AS volume_chirho,
                p.page_number_chirho AS page_chirho,
                w.current_text_chirho AS current_text_chirho,
                w.current_script_chirho AS current_script_chirho
           FROM words_chirho w
           JOIN scanlines_chirho sl ON sl.id_chirho = w.scanline_id_chirho
           JOIN pages_chirho p ON p.id_chirho = sl.page_id_chirho
          WHERE w.current_source_chirho = 'vision-chirho'`
      )
      .all() as Array<{
        volume_chirho: number;
        page_chirho: number;
        current_text_chirho: string | null;
        current_script_chirho: string | null;
      }>;

    for (const rowChirho of rowsChirho) {
      const textChirho = normalizedExactTextChirho(rowChirho.current_text_chirho ?? "");
      if (textChirho.length === 0) continue;
      const keyChirho = targetKeyChirho(rowChirho.volume_chirho, rowChirho.page_chirho);
      const sourceChirho = sourcesChirho.get(keyChirho) ?? {
        textSourceByExactTextChirho: new Set<string>(),
        textSourceByHebrewSkeletonChirho: new Set<string>(),
      };
      sourceChirho.textSourceByExactTextChirho.add(textChirho);
      if (rowChirho.current_script_chirho === "hebrew-chirho") {
        const skeletonChirho = hebrewSkeletonChirho(textChirho);
        if (skeletonChirho.length > 0) sourceChirho.textSourceByHebrewSkeletonChirho.add(skeletonChirho);
      }
      sourcesChirho.set(keyChirho, sourceChirho);
    }
  } finally {
    dbChirho.close();
  }
  return sourcesChirho;
}

function scanlinePathChirho(volumeChirho: number, pageChirho: number, lineChirho: number): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${volumeChirho}-chirho`,
    `page-${paddedPageChirho(pageChirho)}-chirho`,
    `line-${paddedLineChirho(lineChirho)}-chirho.png`
  );
}

function packetImagePathChirho(volumeChirho: number, pageChirho: number, lineChirho: number): string {
  return join(
    IMAGE_DIR_CHIRHO,
    `vol-${volumeChirho}-page-${paddedPageChirho(pageChirho)}-line-${paddedLineChirho(lineChirho)}-chirho.png`
  );
}

function copyLineImageChirho(volumeChirho: number, pageChirho: number, lineChirho: number): GeneratedImageChirho {
  const sourcePathChirho = scanlinePathChirho(volumeChirho, pageChirho, lineChirho);
  const packetPathChirho = packetImagePathChirho(volumeChirho, pageChirho, lineChirho);
  if (!existsSync(sourcePathChirho)) {
    throw new Error(`missing scanline image: ${sourcePathChirho}`);
  }
  if (!existsSync(packetPathChirho)) {
    copyFileSync(sourcePathChirho, packetPathChirho);
  }
  return {
    lineIndexChirho: lineChirho,
    sourcePathChirho,
    packetPathChirho,
    markdownPathChirho: relative(OUT_DIR_CHIRHO, packetPathChirho),
  };
}

function linesForPriorityItemChirho(itemChirho: PriorityItemChirho): number[] {
  const endChirho = itemChirho.lineEndChirho ?? itemChirho.lineStartChirho;
  const linesChirho: number[] = [];
  for (let lineChirho = itemChirho.lineStartChirho; lineChirho <= endChirho; lineChirho++) {
    linesChirho.push(lineChirho);
  }
  return linesChirho;
}

function prioritySpanKeysChirho(itemsChirho: PriorityItemChirho[]): Set<string> {
  const keysChirho = new Set<string>();
  for (const itemChirho of itemsChirho) {
    for (const refChirho of itemChirho.spanRefsChirho) {
      const matchChirho = refChirho.match(/^L(\d+)\s+S(\d+)$/);
      if (!matchChirho) continue;
      keysChirho.add(
        spanKeyChirho(
          itemChirho.volumeChirho,
          itemChirho.pageChirho,
          Number.parseInt(matchChirho[1]!, 10),
          Number.parseInt(matchChirho[2]!, 10)
        )
      );
    }
  }
  return keysChirho;
}

function sortedDirNumbersChirho(rootChirho: string, reChirho: RegExp): number[] {
  return readdirSync(rootChirho)
    .map((nameChirho) => nameChirho.match(reChirho)?.[1])
    .filter((valueChirho): valueChirho is string => valueChirho !== undefined)
    .map((valueChirho) => Number.parseInt(valueChirho, 10))
    .sort((aChirho, bChirho) => aChirho - bChirho);
}

function readSpanLinesChirho(): SpanLineChirho[] {
  const linesChirho: SpanLineChirho[] = [];
  for (const volumeChirho of sortedDirNumbersChirho(SPANS_ROOT_CHIRHO, VOL_DIR_RE_CHIRHO)) {
    const volumeDirChirho = join(SPANS_ROOT_CHIRHO, `vol-${volumeChirho}-chirho`);
    for (const pageChirho of sortedDirNumbersChirho(volumeDirChirho, PAGE_DIR_RE_CHIRHO)) {
      const pageDirChirho = join(volumeDirChirho, `page-${paddedPageChirho(pageChirho)}-chirho`);
      const lineNumbersChirho = sortedDirNumbersChirho(pageDirChirho, LINE_FILE_RE_CHIRHO);
      for (const lineChirho of lineNumbersChirho) {
        const pathChirho = join(pageDirChirho, `line-${paddedLineChirho(lineChirho)}-chirho.json`);
        linesChirho.push(JSON.parse(readFileSync(pathChirho, "utf8")) as SpanLineChirho);
      }
    }
  }
  return linesChirho;
}

function scriptSortIndexChirho(scriptChirho: string): number {
  const indexChirho = REVIEW_SCRIPT_ORDER_CHIRHO.indexOf(scriptChirho);
  return indexChirho === -1 ? REVIEW_SCRIPT_ORDER_CHIRHO.length : indexChirho;
}

function visionSourceForSpanChirho(
  lineChirho: SpanLineChirho,
  spanChirho: SpanChirho,
  d1VisionSourcesChirho: Map<string, D1VisionSourcesChirho>
): "explicit-span-chirho" | "d1-derived-chirho" | null {
  if (spanChirho.provenanceChirho === "vision-chirho") return "explicit-span-chirho";
  if (spanChirho.scriptChirho !== "hebrew-chirho") return null;
  const sourceChirho = d1VisionSourcesChirho.get(targetKeyChirho(lineChirho.volumeChirho, lineChirho.pageChirho));
  if (!sourceChirho) return null;
  if (sourceChirho.textSourceByExactTextChirho.has(normalizedExactTextChirho(spanChirho.utf8TextChirho))) {
    return "d1-derived-chirho";
  }
  const tokenSkeletonsChirho = hebrewTokenSkeletonsChirho(spanChirho.utf8TextChirho);
  if (
    tokenSkeletonsChirho.length > 0 &&
    tokenSkeletonsChirho.every((skeletonChirho) =>
      sourceChirho.textSourceByHebrewSkeletonChirho.has(skeletonChirho)
    )
  ) {
    return "d1-derived-chirho";
  }
  return null;
}

function discoverVisionItemsChirho(priorityKeysChirho: Set<string>): VisionSpanItemChirho[] {
  const itemsChirho: VisionSpanItemChirho[] = [];
  const d1VisionSourcesChirho = readD1VisionSourcesChirho();
  for (const lineChirho of readSpanLinesChirho()) {
    for (const spanChirho of lineChirho.spansChirho) {
      if (!REVIEW_SCRIPTS_CHIRHO.has(spanChirho.scriptChirho)) continue;
      const visionSourceChirho = visionSourceForSpanChirho(lineChirho, spanChirho, d1VisionSourcesChirho);
      if (visionSourceChirho === null) continue;
      const idChirho = spanKeyChirho(
        lineChirho.volumeChirho,
        lineChirho.pageChirho,
        lineChirho.lineIndexChirho,
        spanChirho.segmentIndexChirho
      );
      const imageChirho = copyLineImageChirho(
        lineChirho.volumeChirho,
        lineChirho.pageChirho,
        lineChirho.lineIndexChirho
      );
      itemsChirho.push({
        idChirho,
        reviewerChirho: REVIEW_SCRIPT_LABELS_CHIRHO[spanChirho.scriptChirho] ?? "Reviewer",
        scriptChirho: spanChirho.scriptChirho,
        visionSourceChirho,
        volumeChirho: lineChirho.volumeChirho,
        pageChirho: lineChirho.pageChirho,
        lineIndexChirho: lineChirho.lineIndexChirho,
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        currentTextChirho: spanChirho.utf8TextChirho,
        sourcePathChirho: imageChirho.sourcePathChirho,
        packetPathChirho: imageChirho.packetPathChirho,
        markdownPathChirho: imageChirho.markdownPathChirho,
        priorityMatchChirho: priorityKeysChirho.has(idChirho),
      });
    }
  }

  return itemsChirho.sort((aChirho, bChirho) =>
    scriptSortIndexChirho(aChirho.scriptChirho) - scriptSortIndexChirho(bChirho.scriptChirho) ||
    aChirho.volumeChirho - bChirho.volumeChirho ||
    aChirho.pageChirho - bChirho.pageChirho ||
    aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
    aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );
}

function countByScriptChirho(itemsChirho: VisionSpanItemChirho[]): Record<string, number> {
  const countsChirho: Record<string, number> = {};
  for (const itemChirho of itemsChirho) {
    countsChirho[itemChirho.scriptChirho] = (countsChirho[itemChirho.scriptChirho] ?? 0) + 1;
  }
  return countsChirho;
}

function priorityMarkdownChirho(itemsChirho: PriorityManifestItemChirho[]): string[] {
  return itemsChirho.flatMap((itemChirho) => [
    `## ${itemChirho.priorityChirho}: ${itemChirho.idChirho}`,
    "",
    `- Reviewer: ${itemChirho.reviewerChirho}`,
    `- Location: vol ${itemChirho.volumeChirho}, p${itemChirho.pageChirho}, ${itemChirho.spanRefsChirho.join(", ")}`,
    `- Current text: ${itemChirho.currentTextChirho}`,
    `- Question: ${itemChirho.questionChirho}`,
    ...(itemChirho.sourceNoteChirho ? [`- Source note: ${itemChirho.sourceNoteChirho}`] : []),
    "",
    ...itemChirho.imagesChirho.flatMap((imageChirho) => [
      `![${itemChirho.idChirho} line ${imageChirho.lineIndexChirho}](${imageChirho.markdownPathChirho})`,
      "",
    ]),
  ]);
}

function completeVisionMarkdownChirho(itemsChirho: VisionSpanItemChirho[]): string[] {
  const linesChirho: string[] = [
    "## Complete Vision-Tier Appendix",
    "",
    "Every item below is vision-tier, not human-confirmed. Priority items are marked `yes` but are repeated here so this appendix is complete.",
    "",
  ];

  for (const scriptChirho of REVIEW_SCRIPT_ORDER_CHIRHO) {
    const scriptItemsChirho = itemsChirho.filter((itemChirho) => itemChirho.scriptChirho === scriptChirho);
    linesChirho.push(`### ${scriptChirho} (${scriptItemsChirho.length})`, "");
    for (const itemChirho of scriptItemsChirho) {
      linesChirho.push(
        `#### ${itemChirho.idChirho}`,
        "",
        `- Reviewer: ${itemChirho.reviewerChirho}`,
        `- Location: vol ${itemChirho.volumeChirho}, p${itemChirho.pageChirho}, L${itemChirho.lineIndexChirho} S${itemChirho.segmentIndexChirho}`,
        `- Priority section: ${itemChirho.priorityMatchChirho ? "yes" : "no"}`,
        `- Vision source: ${itemChirho.visionSourceChirho}`,
        `- Current text: ${itemChirho.currentTextChirho}`,
        "",
        `![${itemChirho.idChirho}](${itemChirho.markdownPathChirho})`,
        ""
      );
    }
  }

  return linesChirho;
}

const PRIORITY_ITEMS_CHIRHO: PriorityItemChirho[] = [
  {
    idChirho: "syriac-p69-job7-4-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "High",
    volumeChirho: 5,
    pageChirho: 69,
    lineStartChirho: 30,
    lineEndChirho: 31,
    spanRefsChirho: ["L30 S3", "L31 S0"],
    currentTextChirho: "ܘܡܳܫܰܚ / ܐ̱ܢܳܐ ܠܪܰܡܫܳܐ: ܘܫܳܟܶܒ ܐ̱ܢܳܐ. ܘܢܳܐܶܕ ܐ̱ܢܳܐ ܠܫܰܦܪܳܐ.",
    questionChirho: "Confirm exact Syriac letters, vowels, ̱ marks, punctuation, and the L30/L31 split against the printed Serto.",
    sourceNoteChirho: "The consonantal skeleton was cross-checked against Job 7:4 at https://www.peshitta.eu/ot/job/7.html, but the print remains the authority.",
  },
  {
    idChirho: "syriac-p50-job5-3-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 50,
    lineStartChirho: 4,
    lineEndChirho: 5,
    spanRefsChirho: ["L4 S8", "L5 S0"],
    currentTextChirho: "ܘܳܐܒܕܳܐ / ܕܰܝܪܶܗ ܡܶܢ ܫܶܠܝ",
    questionChirho: "Confirm exact Syriac letters and vowels for the Job 5:3 Peshitta citation.",
  },
  {
    idChirho: "syriac-p53-peshitta-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 53,
    lineStartChirho: 8,
    spanRefsChirho: ["L8 S1"],
    currentTextChirho: "ܘܠܗ ܢܫܩܠܘܢ ܙܝܢܬܢܐ",
    questionChirho: "Confirm exact Estrangela/Serto letters; both machine witnesses only certify script/context.",
  },
  {
    idChirho: "syriac-p66-job6-21-chirho",
    reviewerChirho: "Syriac reader",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 66,
    lineStartChirho: 19,
    lineEndChirho: 20,
    spanRefsChirho: ["L19 S5", "L20 S2"],
    currentTextChirho: "ܘܳܐܦ ܐܰܢܬܽܘܢ ܗܘܰܝܬܽܘܢ ܥܠܰܝ / ܛܥܢܐ",
    questionChirho: "Confirm exact Syriac letters and vowels for the Job 6:21 note and the short Ambrosianus word.",
  },
  {
    idChirho: "arabic-p55-final-letter-chirho",
    reviewerChirho: "Arabist",
    priorityChirho: "High",
    volumeChirho: 5,
    pageChirho: 55,
    lineStartChirho: 32,
    spanRefsChirho: ["L32 S1"],
    currentTextChirho: "ضِمَار",
    questionChirho: "Confirm the final letter: ضِمَار vs ضِمَام vs ضِمَاد. Do not silently change without review.",
  },
  {
    idChirho: "arabic-p64-wakhiyya-chirho",
    reviewerChirho: "Arabist",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 64,
    lineStartChirho: 16,
    spanRefsChirho: ["L16 S1"],
    currentTextChirho: "للمذيب من صاحبه الفضل / وخية الكافي يترك",
    questionChirho: "Confirm the word currently stored as وخية inside the Arabic line.",
  },
  {
    idChirho: "hebrew-p64-tushiyah-chirho",
    reviewerChirho: "Hebrew/WLC reviewer",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 64,
    lineStartChirho: 18,
    spanRefsChirho: ["L18 S3"],
    currentTextChirho: "תוּשִׁיּה",
    questionChirho: "Confirm the vocalization against the print/WLC question; earlier alternatives included תּוּשִׁיָּה.",
  },
  {
    idChirho: "aramaic-vol4-p148-targum-ps18-30-chirho",
    reviewerChirho: "Hebrew/Aramaic/Targum reviewer",
    priorityChirho: "Medium",
    volumeChirho: 4,
    pageChirho: 148,
    lineStartChirho: 6,
    lineEndChirho: 7,
    spanRefsChirho: ["L6 S3", "L7 S0"],
    currentTextChirho: "מְטוּל דִּבְמֵימְרָךְ / אַסְגֵּי מַשִּׁירְיָין / וּבְמֵימַר אֱלָהִי אֶכְבּוֹשׁ כְּרַכִּין תַּקִּיפִין",
    questionChirho: "Confirm exact Aramaic letters and niqqud against the vol-4 print. Claude/Codex agree on the consonants; vowels and shin/dagesh details remain vision-tier.",
    sourceNoteChirho: "Recovered from French-looking OCR garbage in vol 4 p148 lines 6-7 and marked vision-chirho, not human-chirho.",
  },
  {
    idChirho: "aramaic-vol4-p148-targum-2s22-30-chirho",
    reviewerChirho: "Hebrew/Aramaic/Targum reviewer",
    priorityChirho: "Medium",
    volumeChirho: 4,
    pageChirho: 148,
    lineStartChirho: 14,
    spanRefsChirho: ["L14 S5"],
    currentTextChirho: "אֲרֵי בְמֵימְרָךְ אַסְגִּי מַשְׁרִין / וּבְמֵימַר אֱלָהִי אֲכַבֵּשׁ כָּל כַרְכִין תַקִּיפִין",
    questionChirho: "Confirm exact Aramaic letters and niqqud against the full page print; the scanline crop clips part of the physical two-line citation.",
    sourceNoteChirho: "Consonants were second-witnessed; exact pointing, final-kaf sheva, and the lower continuation remain expert-review items.",
  },
  {
    idChirho: "aramaic-vol4-p151-targum-2s22-33-chirho",
    reviewerChirho: "Hebrew/Aramaic/Targum reviewer",
    priorityChirho: "Medium",
    volumeChirho: 4,
    pageChirho: 151,
    lineStartChirho: 1,
    lineEndChirho: 2,
    spanRefsChirho: ["L1 S3", "L2 S0"],
    currentTextChirho: "אֱלָהָא דְּסָעִיד לִי בְּחֵילָא / וּמְתַקַן שְׁלִים אוֹרְחִי.",
    questionChirho: "Confirm the yod in דְּסָעִיד and exact vocalization, especially בְּחֵילָא and וּמְתַקַן, against the print.",
    sourceNoteChirho: "Claude caught the yod in דסעיד before application; stored text remains vision-tier pending Targum-reader confirmation.",
  },
  {
    idChirho: "hebrew-vol4-p152-ps18-34-spelling-chirho",
    reviewerChirho: "Hebrew/WLC reviewer",
    priorityChirho: "Medium",
    volumeChirho: 4,
    pageChirho: 152,
    lineStartChirho: 4,
    lineEndChirho: 5,
    spanRefsChirho: ["L4 S1", "L5 S1"],
    currentTextChirho: "מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל בָּמֹתַי יַעֲמִידֵנִי. / בָּמֹתַי",
    questionChirho: "Confirm the Ps 18,34 spelling contrast: defective-vav בָּמֹתַי and plene-yod יַעֲמִידֵנִי, plus the French note's בָּמֹתַי.",
    sourceNoteChirho: "Claude second-witnessed the clipped continuation row; these matres are visually certain enough to store, but the broader Hebrew/WLC pass should confirm them.",
  },
  {
    idChirho: "hebrew-vol4-p152-2s22-34-spelling-chirho",
    reviewerChirho: "Hebrew/WLC reviewer",
    priorityChirho: "Medium",
    volumeChirho: 4,
    pageChirho: 152,
    lineStartChirho: 19,
    lineEndChirho: 20,
    spanRefsChirho: ["L19 S1", "L20 S0"],
    currentTextChirho: "מְשַׁוֶּה רַגְלַי כָּאַיָּלוֹת / וְעַל / בָּמוֹתַי יַעֲמִדֵנִי.",
    questionChirho: "Confirm the 2 S 22,34 spelling contrast: plene-vav בָּמוֹתַי and defective-yod יַעֲמִדֵנִי.",
    sourceNoteChirho: "Claude caught the plene-vav distinction before commit; the line is stored as vision-chirho and should not be silently normalized to the Ps form.",
  },
  {
    idChirho: "hebrew-p65-mas-chirho",
    reviewerChirho: "Hebrew/WLC reviewer",
    priorityChirho: "Medium",
    volumeChirho: 5,
    pageChirho: 65,
    lineStartChirho: 2,
    spanRefsChirho: ["L2 S5"],
    currentTextChirho: "מס",
    questionChirho: "Confirm this short Hebrew fragment during the WLC/human spot-check.",
  },
];

function generatePacketChirho(): void {
  mkdirSync(IMAGE_DIR_CHIRHO, { recursive: true });

  const priorityItemsChirho: PriorityManifestItemChirho[] = PRIORITY_ITEMS_CHIRHO.map((itemChirho) => ({
    ...itemChirho,
    imagesChirho: linesForPriorityItemChirho(itemChirho).map((lineChirho) =>
      copyLineImageChirho(itemChirho.volumeChirho, itemChirho.pageChirho, lineChirho)
    ),
  }));
  const completeVisionItemsChirho = discoverVisionItemsChirho(prioritySpanKeysChirho(PRIORITY_ITEMS_CHIRHO));
  const completeVisionCountsChirho = countByScriptChirho(completeVisionItemsChirho);

  const markdownChirho = [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Expert Confirm Packet Chirho, 2026-05-31",
    "",
    "Use this packet to confirm vision-tier text against the printed line images. Keep machine provenance unless an expert/human reviewer explicitly certifies the text.",
    "",
    "The strict Markdown export currently passes with `issues=0`, `unknownSpans=0`, and `d1GapPages=0`; these questions are semantic review items, not structural export blockers.",
    "",
    "The first section is a priority subset. The appendix is complete for non-Latin machine-read spans: " +
      REVIEW_SCRIPT_ORDER_CHIRHO.map((scriptChirho) => `${scriptChirho}=${completeVisionCountsChirho[scriptChirho] ?? 0}`).join(", ") +
      ".",
    "",
    "# Priority Review Items",
    "",
    ...priorityMarkdownChirho(priorityItemsChirho),
    ...completeVisionMarkdownChirho(completeVisionItemsChirho),
  ].join("\n");

  const manifestChirho: PacketManifestChirho = {
    generatedAtChirho: new Date().toISOString(),
    strictExportStatusChirho: "issues=0; unknownSpans=0; d1GapPages=0",
    priorityItemsChirho,
    completeVisionCountsChirho,
    completeVisionItemsChirho,
  };

  writeFileSync(join(OUT_DIR_CHIRHO, "manifest-chirho.json"), `${JSON.stringify(manifestChirho, null, 2)}\n`);
  writeFileSync(join(OUT_DIR_CHIRHO, "index-chirho.md"), `${markdownChirho.trimEnd()}\n`);
  console.log(
    `wrote ${priorityItemsChirho.length} priority item(s) and ${completeVisionItemsChirho.length} complete vision item(s) to ${OUT_DIR_CHIRHO}`
  );
}

generatePacketChirho();
