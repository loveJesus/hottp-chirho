// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

// Builds a static reviewer packet for raw Pass-C Hebrew spans. This packet is
// not authoritative storage; it is a durable image+text aid for the live human
// validation queue.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "fs";
import { join, relative } from "path";

import { writeJsonAtomicChirho, writeTextAtomicChirho } from "../../src-chirho/atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import {
  packetImageHashesChirho,
  type PacketImageHashFieldsChirho,
} from "../../src-chirho/packet-image-fingerprint-chirho.ts";

const REPORT_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-validation-chirho",
  "pass-c-hebrew-validation-chirho.json"
);
const SPANS_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho");
const SCANLINES_ROOT_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "scanlines-chirho");
const OUT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-hebrew-human-pack-chirho",
  "2026-05-31-chirho"
);
const IMAGE_DIR_CHIRHO = join(OUT_DIR_CHIRHO, "images-chirho");

interface TokenWitnessChirho {
  sourceChirho: string;
  textChirho: string;
  confidenceChirho: number | null;
  cropChirho: string | null;
  gateReasonChirho: string | null;
  fileChirho: string | null;
}

interface TokenValidationChirho {
  tokenIndexChirho: number;
  skeletonChirho: string;
  witnessesChirho: TokenWitnessChirho[];
  validatedChirho: boolean;
}

interface DirectWordReadChirho {
  textChirho: string;
  confidenceChirho: number;
  cropChirho: string | null;
  wlcVerdictChirho: string | null;
  fileChirho: string | null;
}

interface HebrewSpanValidationChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  spanSourceChirho: string;
  textChirho: string;
  lineTextChirho: string;
  tokenSkeletonsChirho: string[];
  tokenValidationsChirho: TokenValidationChirho[];
  directWordReadsChirho: DirectWordReadChirho[];
  validationStatusChirho: string;
}

interface ValidationReportChirho {
  generatedAtChirho: string;
  directConfChirho: number;
  sourceFilterChirho: string;
  sourceCountsChirho: Record<string, number>;
  spanCountChirho: number;
  tokenCountChirho: number;
  allTokenValidatedSpanCountChirho: number;
  partialTokenValidatedSpanCountChirho: number;
  unvalidatedSpanCountChirho: number;
  validatedTokenCountChirho: number;
  spansChirho: HebrewSpanValidationChirho[];
}

interface SpanGeometryChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
}

interface SpanLineChirho {
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  spansChirho: SpanGeometryChirho[];
}

interface GeneratedImagesChirho extends PacketImageHashFieldsChirho {
  targetPathChirho: string;
  targetMarkdownPathChirho: string;
  linePathChirho: string;
  lineMarkdownPathChirho: string;
}

interface PacketItemChirho {
  idChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  validationStatusChirho: string;
  spanSourceChirho: string;
  textChirho: string;
  lineTextChirho: string;
  tokenSkeletonsChirho: string[];
  validatedTokenCountChirho: number;
  witnessCountChirho: number;
  directWordReadsChirho: DirectWordReadChirho[];
  targetPathChirho: string;
  targetMarkdownPathChirho: string;
  linePathChirho: string;
  lineMarkdownPathChirho: string;
}

interface PacketManifestChirho {
  generatedAtChirho: string;
  reportGeneratedAtChirho: string;
  sourceReportPathChirho: string;
  sourceFilterChirho: string;
  countsChirho: Record<string, number>;
  itemsChirho: PacketItemChirho[];
}

function paddedPageChirho(pageChirho: number): string {
  return String(pageChirho).padStart(4, "0");
}

function paddedLineChirho(lineChirho: number): string {
  return String(lineChirho).padStart(3, "0");
}

function spanIdChirho(spanChirho: Pick<HebrewSpanValidationChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return [
    `v${spanChirho.volumeChirho}`,
    `p${paddedPageChirho(spanChirho.pageChirho)}`,
    `l${paddedLineChirho(spanChirho.lineIndexChirho)}`,
    `s${spanChirho.segmentIndexChirho}`,
  ].join("-");
}

function spanLinePathChirho(spanChirho: Pick<HebrewSpanValidationChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho">): string {
  return join(
    SPANS_ROOT_CHIRHO,
    `vol-${spanChirho.volumeChirho}-chirho`,
    `page-${paddedPageChirho(spanChirho.pageChirho)}-chirho`,
    `line-${paddedLineChirho(spanChirho.lineIndexChirho)}-chirho.json`
  );
}

function scanlinePathChirho(spanChirho: Pick<HebrewSpanValidationChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho">): string {
  return join(
    SCANLINES_ROOT_CHIRHO,
    `vol-${spanChirho.volumeChirho}-chirho`,
    `page-${paddedPageChirho(spanChirho.pageChirho)}-chirho`,
    `line-${paddedLineChirho(spanChirho.lineIndexChirho)}-chirho.png`
  );
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

function drawRectangleArgChirho(xMinChirho: number, xMaxChirho: number, imageHeightChirho: number): string {
  return `rectangle ${Math.round(xMinChirho)},2 ${Math.round(xMaxChirho)},${Math.max(3, imageHeightChirho - 3)}`;
}

function imagePathsForSpanChirho(idChirho: string): { targetPathChirho: string; linePathChirho: string } {
  return {
    targetPathChirho: join(IMAGE_DIR_CHIRHO, `${idChirho}-target-chirho.png`),
    linePathChirho: join(IMAGE_DIR_CHIRHO, `${idChirho}-line-chirho.png`),
  };
}

function generateImagesChirho(spanChirho: HebrewSpanValidationChirho, lineChirho: SpanLineChirho): GeneratedImagesChirho {
  const geometryChirho = lineChirho.spansChirho.find(
    (candidateChirho) => candidateChirho.segmentIndexChirho === spanChirho.segmentIndexChirho
  );
  if (!geometryChirho) {
    throw new Error(`Missing span geometry for ${spanIdChirho(spanChirho)}`);
  }
  const sourceImagePathChirho = scanlinePathChirho(spanChirho);
  if (!existsSync(sourceImagePathChirho)) {
    throw new Error(`Missing scanline image for ${spanIdChirho(spanChirho)}: ${sourceImagePathChirho}`);
  }
  const imageSizeChirho = pngSizeChirho(sourceImagePathChirho);
  const scaleXChirho = imageSizeChirho.widthChirho / Math.max(1, lineChirho.lineWidthPxChirho);
  const spanXMinChirho = geometryChirho.xMinPxChirho * scaleXChirho;
  const spanXMaxChirho = (geometryChirho.xMinPxChirho + geometryChirho.widthPxChirho) * scaleXChirho;
  const cropXMinChirho = Math.round(clampChirho(spanXMinChirho - 180, 0, imageSizeChirho.widthChirho - 1));
  const cropXMaxChirho = Math.round(clampChirho(spanXMaxChirho + 180, cropXMinChirho + 1, imageSizeChirho.widthChirho));
  const cropWidthChirho = cropXMaxChirho - cropXMinChirho;
  const cropSpecChirho = `${cropWidthChirho}x${imageSizeChirho.heightChirho}+${cropXMinChirho}+0`;
  const idChirho = spanIdChirho(spanChirho);
  const pathsChirho = imagePathsForSpanChirho(idChirho);

  runMagickChirho([
    sourceImagePathChirho,
    "-fill",
    "rgba(210,63,49,0.14)",
    "-stroke",
    "#d23f31",
    "-strokewidth",
    "3",
    "-draw",
    drawRectangleArgChirho(spanXMinChirho, spanXMaxChirho, imageSizeChirho.heightChirho),
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
    drawRectangleArgChirho(spanXMinChirho - cropXMinChirho, spanXMaxChirho - cropXMinChirho, imageSizeChirho.heightChirho),
    pathsChirho.targetPathChirho,
  ]);

  return {
    ...packetImageHashesChirho({
      sourcePathChirho: sourceImagePathChirho,
      targetPathChirho: pathsChirho.targetPathChirho,
      linePathChirho: pathsChirho.linePathChirho,
    }),
    targetPathChirho: pathsChirho.targetPathChirho,
    targetMarkdownPathChirho: relative(OUT_DIR_CHIRHO, pathsChirho.targetPathChirho),
    linePathChirho: pathsChirho.linePathChirho,
    lineMarkdownPathChirho: relative(OUT_DIR_CHIRHO, pathsChirho.linePathChirho),
  };
}

function statusSortChirho(statusChirho: string): number {
  if (statusChirho === "unvalidated-chirho") return 0;
  if (statusChirho === "partial-token-validated-chirho") return 1;
  if (statusChirho === "all-token-validated-chirho") return 2;
  return 3;
}

function sortSpansChirho(spansChirho: HebrewSpanValidationChirho[]): HebrewSpanValidationChirho[] {
  return [...spansChirho].sort((aChirho, bChirho) =>
    statusSortChirho(aChirho.validationStatusChirho) - statusSortChirho(bChirho.validationStatusChirho) ||
    aChirho.volumeChirho - bChirho.volumeChirho ||
    aChirho.pageChirho - bChirho.pageChirho ||
    aChirho.lineIndexChirho - bChirho.lineIndexChirho ||
    aChirho.segmentIndexChirho - bChirho.segmentIndexChirho
  );
}

function loadSpanLineChirho(spanChirho: HebrewSpanValidationChirho): SpanLineChirho {
  return JSON.parse(readFileSync(spanLinePathChirho(spanChirho), "utf8")) as SpanLineChirho;
}

function countWitnessesChirho(spanChirho: HebrewSpanValidationChirho): number {
  return spanChirho.tokenValidationsChirho.reduce(
    (sumChirho, tokenChirho) => sumChirho + tokenChirho.witnessesChirho.length,
    0
  );
}

function countValidatedTokensChirho(spanChirho: HebrewSpanValidationChirho): number {
  return spanChirho.tokenValidationsChirho.filter((tokenChirho) => tokenChirho.validatedChirho).length;
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

function witnessSummaryChirho(itemChirho: PacketItemChirho): string {
  const directReadsChirho = itemChirho.directWordReadsChirho
    .map((readChirho) => `${readChirho.textChirho}@${readChirho.confidenceChirho.toFixed(3)} ${readChirho.wlcVerdictChirho ?? ""}`.trim())
    .join(" | ");
  const tokenWitnessesChirho = `${itemChirho.validatedTokenCountChirho}/${itemChirho.tokenSkeletonsChirho.length} tokens validated; ${itemChirho.witnessCountChirho} token witness(es)`;
  return directReadsChirho.length > 0 ? `${tokenWitnessesChirho}; direct reads: ${directReadsChirho}` : tokenWitnessesChirho;
}

function countsByStatusChirho(itemsChirho: PacketItemChirho[]): Record<string, number> {
  const countsChirho: Record<string, number> = {};
  for (const itemChirho of itemsChirho) {
    countsChirho[itemChirho.validationStatusChirho] = (countsChirho[itemChirho.validationStatusChirho] ?? 0) + 1;
  }
  return countsChirho;
}

function itemMarkdownChirho(itemChirho: PacketItemChirho): string[] {
  return [
    `### ${itemChirho.idChirho}`,
    "",
    `- Location: vol ${itemChirho.volumeChirho}, p${itemChirho.pageChirho}, L${itemChirho.lineIndexChirho} S${itemChirho.segmentIndexChirho}`,
    `- Status: ${itemChirho.validationStatusChirho}`,
    `- Current text: ${inlineTextChirho(itemChirho.textChirho)}`,
    `- Skeletons: ${itemChirho.tokenSkeletonsChirho.join(" ")}`,
    `- Witnesses: ${witnessSummaryChirho(itemChirho)}`,
    `- Line text: ${inlineTextChirho(itemChirho.lineTextChirho)}`,
    "",
    `![${itemChirho.idChirho} target](${itemChirho.targetMarkdownPathChirho})`,
    "",
    `![${itemChirho.idChirho} full line](${itemChirho.lineMarkdownPathChirho})`,
    "",
  ];
}

function markdownChirho(reportChirho: ValidationReportChirho, itemsChirho: PacketItemChirho[]): string {
  const countsChirho = countsByStatusChirho(itemsChirho);
  const sectionsChirho = [
    ["unvalidated-chirho", "Unvalidated Spans"],
    ["partial-token-validated-chirho", "Partially Validated Spans"],
    ["all-token-validated-chirho", "All-Token Validated Spot Checks"],
  ] as const;
  const linesChirho = [
    "<!-- For God so loved the world that he gave his only begotten Son,",
    "that whoever believes in him should not perish but have eternal life. John 3:16 -->",
    "",
    "# Pass-C Hebrew Human Review Packet Chirho",
    "",
    "This packet mirrors the live human validation queue for raw `pass-c-ocr-chirho` Hebrew spans. The red rectangle marks the span to compare against the printed line.",
    "",
    "Use the live validator to record verdicts; this packet is a durable image+text aid. A clean review means the current text matches the print exactly enough for human certification and requires the live validator's explicit clean-certification checkbox. If anything is wrong, use the relevant issue boxes in the live validator.",
    "",
    "Machine witnesses certify consonantal skeletons only; vowels, accents, meteg, and punctuation remain human responsibilities.",
    "",
    "Live validator command: `bun run pass-c-human-validate-chirho`",
    "",
    `Source report generated: ${reportChirho.generatedAtChirho}`,
    `Source filter: ${reportChirho.sourceFilterChirho}`,
    `Counts: total=${itemsChirho.length}, unvalidated=${countsChirho["unvalidated-chirho"] ?? 0}, partial=${countsChirho["partial-token-validated-chirho"] ?? 0}, all-token=${countsChirho["all-token-validated-chirho"] ?? 0}`,
    `Hebrew source counts before filter: ${Object.entries(reportChirho.sourceCountsChirho).map(([keyChirho, valueChirho]) => `${keyChirho}=${valueChirho}`).join(", ")}`,
    "",
  ];

  for (const [statusChirho, titleChirho] of sectionsChirho) {
    const sectionItemsChirho = itemsChirho.filter((itemChirho) => itemChirho.validationStatusChirho === statusChirho);
    linesChirho.push(`## ${titleChirho} (${sectionItemsChirho.length})`, "");
    for (const itemChirho of sectionItemsChirho) {
      linesChirho.push(...itemMarkdownChirho(itemChirho));
    }
  }
  return `${linesChirho.join("\n").trimEnd()}\n`;
}

function generatePackChirho(): void {
  if (!existsSync(REPORT_PATH_CHIRHO)) {
    throw new Error(`Validation report missing; run validate-pass-c-hebrew-chirho first: ${REPORT_PATH_CHIRHO}`);
  }
  rmSync(OUT_DIR_CHIRHO, { recursive: true, force: true });
  mkdirSync(IMAGE_DIR_CHIRHO, { recursive: true });
  const reportChirho = JSON.parse(readFileSync(REPORT_PATH_CHIRHO, "utf8")) as ValidationReportChirho;
  const itemsChirho = sortSpansChirho(reportChirho.spansChirho).map((spanChirho) => {
    const lineChirho = loadSpanLineChirho(spanChirho);
    const imagesChirho = generateImagesChirho(spanChirho, lineChirho);
    return {
      idChirho: spanIdChirho(spanChirho),
      volumeChirho: spanChirho.volumeChirho,
      pageChirho: spanChirho.pageChirho,
      lineIndexChirho: spanChirho.lineIndexChirho,
      segmentIndexChirho: spanChirho.segmentIndexChirho,
      validationStatusChirho: spanChirho.validationStatusChirho,
      spanSourceChirho: spanChirho.spanSourceChirho,
      textChirho: spanChirho.textChirho,
      lineTextChirho: spanChirho.lineTextChirho,
      tokenSkeletonsChirho: spanChirho.tokenSkeletonsChirho,
      validatedTokenCountChirho: countValidatedTokensChirho(spanChirho),
      witnessCountChirho: countWitnessesChirho(spanChirho),
      directWordReadsChirho: spanChirho.directWordReadsChirho,
      ...imagesChirho,
    };
  });
  const manifestChirho: PacketManifestChirho = {
    generatedAtChirho: new Date().toISOString(),
    reportGeneratedAtChirho: reportChirho.generatedAtChirho,
    sourceReportPathChirho: REPORT_PATH_CHIRHO,
    sourceFilterChirho: reportChirho.sourceFilterChirho,
    countsChirho: countsByStatusChirho(itemsChirho),
    itemsChirho,
  };
  writeJsonAtomicChirho(join(OUT_DIR_CHIRHO, "manifest-chirho.json"), manifestChirho);
  writeTextAtomicChirho(join(OUT_DIR_CHIRHO, "index-chirho.md"), markdownChirho(reportChirho, itemsChirho));
  console.log(`wrote ${itemsChirho.length} raw Hebrew review item(s) to ${OUT_DIR_CHIRHO}`);
}

generatePackChirho();
