// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Pass A page geometry, shared by the working-set tool
 * (src-chirho/pass1-extract-lines-chirho.ts) and the full-corpus intake.
 *
 * Database-free on purpose: it renders, deskews and finds line boxes, and
 * the caller decides where results go. It lives in this directory because
 * src-chirho/ is over its entry budget.
 *
 * Workflow: spec-chirho/workflows-chirho/corpus-chirho/corpus-intake-workflow-chirho.md
 */

import { existsSync, unlinkSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO, RENDER_DPI_CHIRHO } from "../config-chirho.ts";
import { pdfPathChirho } from "../extract-text-chirho.ts";
import { PDFTOHTML_ZOOM_CHIRHO, extractFontAwareLinesChirho } from "../extract-text-fonts-chirho.ts";
import { runCmdChirho } from "../utils-chirho.ts";

/** Volumes whose PDFs are scanned — deskew + tesseract for geometry */
export const SCANNED_VOLS_CHIRHO = new Set<number>([1, 2, 3, 4]);

/**
 * Bump when line-box output changes, so the intake redoes pages made by
 * earlier code. 2: vol 5 boxes in true render pixels (were 1.5x too large).
 */
export const GEOMETRY_VERSION_CHIRHO = 2;

/**
 * Per-line vertical padding (px at 300 DPI), asymmetric:
 *   top    = cholam / polytonic accents / occasional Hebrew cantillation
 *            — usually close to the letter, small padding suffices
 *   bottom = patah / shewa / hatef / Hebrew cantillation stacked below,
 *            plus Latin/Hebrew descenders (g p q y, final kaf/nun/pe/tsadi,
 *            qoph tail) — needs more room
 * Slight overlap with adjacent lines is fine for overlay viewing and desirable
 * for per-line crops (each line keeps its own diacritics in-frame).
 */
export const LINE_PADDING_TOP_PX_CHIRHO = 6;
export const LINE_PADDING_BOTTOM_PX_CHIRHO = 12;

/**
 * Tesseract data + language stack.
 *
 * `tessdata-best-chirho` is the downloaded LSTM-best tier (3-9MB per script).
 * The page-0148 bake-off showed: best+multi recovers real Hebrew Unicode
 * tokens that fra-only produces as control-character garbage, raises mean
 * confidence 90.4 → 93.7, and drops <60-conf words from 22 → 3. See
 * `workspace-chirho/tessdata-bakeoff-chirho/SUMMARY.md`.
 *
 * `fra+heb+grc+lat` is the language stack — tesseract picks per-region.
 */
export const TESSDATA_BEST_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "tessdata-best-chirho"
);
export const TESSERACT_LANG_STACK_CHIRHO = "fra+heb+grc+lat";

export type ScriptHintChirho =
  | "latin-chirho"
  | "hebrew-chirho"
  | "greek-chirho"
  | "syriac-chirho"
  | "arabic-chirho"
  | "symbol-chirho";

export interface WordBboxChirho {
  textChirho: string;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  /** Optional deterministic script tag from PDF font analysis. Present for
   *  digital PDFs (vol 5); absent for tesseract-OCR'd scanned vols. When
   *  present and non-latin, the classifier short-circuits to candidate. */
  scriptHintChirho?: ScriptHintChirho;
}

export interface LineBboxChirho {
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  textChirho: string;
  /** Per-word bboxes in page-absolute pixel coords. Used downstream to anchor
   *  non-French span boundaries by gap analysis (Tesseract bboxes only cover
   *  Latin word bodies; Hebrew/Greek runs surface as wider-than-normal gaps). */
  wordsChirho: WordBboxChirho[];
}

/** Which reader produced a page's line boxes. */
export function geometrySourceChirho(volumeNumberChirho: number): string {
  return SCANNED_VOLS_CHIRHO.has(volumeNumberChirho)
    ? "tesseract-hocr-chirho"
    : "pdf-font-layer-chirho";
}

/** Deskew + trim an image in place. Safe to run on already-deskewed images. */
export async function deskewInPlaceChirho(imagePathChirho: string): Promise<void> {
  await runCmdChirho([
    "magick",
    imagePathChirho,
    "-deskew",
    "40%",
    "-trim",
    "+repage",
    imagePathChirho,
  ]);
}

/**
 * Render one PDF page to `outPathChirho` (a .png path) at the pipeline DPI,
 * replacing any earlier file, then deskew + trim it when the volume is
 * scanned. Same commands as the working-set Pass A.
 */
export async function renderPageImageToPathChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number,
  outPathChirho: string
): Promise<void> {
  if (!outPathChirho.endsWith(".png")) {
    throw new Error(`render target must be a .png path: ${outPathChirho}`);
  }
  if (existsSync(outPathChirho)) unlinkSync(outPathChirho);
  // pdftoppm -singlefile writes <prefix>.png
  await runCmdChirho([
    "pdftoppm",
    "-f", String(pageNumberChirho),
    "-l", String(pageNumberChirho),
    "-r", String(RENDER_DPI_CHIRHO),
    "-png",
    "-singlefile",
    pdfPathChirho(volumeNumberChirho),
    outPathChirho.slice(0, -".png".length),
  ]);
  if (!existsSync(outPathChirho)) {
    throw new Error(`Rendered image not found at expected path: ${outPathChirho}`);
  }
  if (SCANNED_VOLS_CHIRHO.has(volumeNumberChirho)) {
    await deskewInPlaceChirho(outPathChirho);
  }
}

/**
 * Extract line bboxes in pixel coords from a rendered page image using tesseract hOCR.
 * Tesseract's transcription is stored per line as a rough "what did the image look like"
 * signal — correct French for most lines, garbled for non-French regions, useful for prescreen.
 */
export async function tesseractLineBboxesChirho(
  imagePathChirho: string
): Promise<LineBboxChirho[]> {
  const stemChirho = imagePathChirho.replace(/\.png$/i, "-hocr-chirho");
  const hocrPathChirho = `${stemChirho}.hocr`;

  await runCmdChirho([
    "tesseract",
    imagePathChirho,
    stemChirho,
    "--tessdata-dir",
    TESSDATA_BEST_DIR_CHIRHO,
    "-l",
    TESSERACT_LANG_STACK_CHIRHO,
    "--psm",
    "4",
    "-c",
    "tessedit_create_hocr=1",
  ]);

  const hocrChirho = await Bun.file(hocrPathChirho).text();
  try {
    unlinkSync(hocrPathChirho);
  } catch (_cleanupErrChirho) {
    // best-effort cleanup
  }

  return parseHocrLinesChirho(hocrChirho);
}

/**
 * Parse hOCR into a flat list of lines with bbox + aggregated text.
 * Tesseract emits each ocr_line span on its own line of XML, and nested ocrx_word
 * spans on their own lines too — so a scan that keeps track of "am I inside an
 * ocr_line and which one" is enough.
 */
export function parseHocrLinesChirho(hocrChirho: string): LineBboxChirho[] {
  const linesChirho: LineBboxChirho[] = [];
  const rowsChirho = hocrChirho.split("\n");

  let currentChirho: LineBboxChirho | null = null;

  const lineStartRegexChirho =
    /<span class=['"]ocr_line['"][^>]*title=['"]bbox (\d+) (\d+) (\d+) (\d+)[^'"]*['"]/;
  // Capture both bbox (groups 1-4) and word text (group 5)
  const wordRegexChirho =
    /<span class=['"]ocrx_word['"][^>]*title=['"]bbox (\d+) (\d+) (\d+) (\d+)[^'"]*['"][^>]*>([^<]*)<\/span>/;

  for (const rowChirho of rowsChirho) {
    const lineMChirho = rowChirho.match(lineStartRegexChirho);
    if (lineMChirho) {
      if (currentChirho) {
        currentChirho.textChirho = decodeHtmlChirho(
          currentChirho.wordsChirho
            .map((wChirho) => wChirho.textChirho)
            .join(" ")
        );
        linesChirho.push(currentChirho);
      }
      currentChirho = {
        xMinChirho: parseInt(lineMChirho[1]!, 10),
        yMinChirho: parseInt(lineMChirho[2]!, 10),
        xMaxChirho: parseInt(lineMChirho[3]!, 10),
        yMaxChirho: parseInt(lineMChirho[4]!, 10),
        textChirho: "",
        wordsChirho: [],
      };
      continue;
    }

    if (currentChirho) {
      const wordMChirho = rowChirho.match(wordRegexChirho);
      if (wordMChirho) {
        currentChirho.wordsChirho.push({
          textChirho: decodeHtmlChirho(wordMChirho[5]!),
          xMinChirho: parseInt(wordMChirho[1]!, 10),
          yMinChirho: parseInt(wordMChirho[2]!, 10),
          xMaxChirho: parseInt(wordMChirho[3]!, 10),
          yMaxChirho: parseInt(wordMChirho[4]!, 10),
        });
      }
    }
  }

  if (currentChirho) {
    currentChirho.textChirho = decodeHtmlChirho(
      currentChirho.wordsChirho
        .map((wChirho) => wChirho.textChirho)
        .join(" ")
    );
    linesChirho.push(currentChirho);
  }

  return linesChirho;
}

/** Minimal HTML entity decode for tesseract output */
function decodeHtmlChirho(sChirho: string): string {
  return sChirho
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Vol 5 (and any digital PDF with embedded fonts) path — use pdftohtml -xml
 * with font-fullname so each text block carries its font family. Hebrew /
 * Greek / Syriac runs are then identified deterministically by font name and
 * merged into opaque blocks (one "word" per non-Latin run); Latin blocks are
 * split into words on whitespace as usual.
 *
 * Output is in render pixels. The working set's vol 5 rows were made with
 * RENDER_DPI/72 and so sit 1.5x too large; the reader and
 * read_volume_page_chirho.py detect that per page (boxes overflowing the
 * image) and rescale only those, so boxes in true pixels display as-is.
 */
export async function fontAwareLineBboxesChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<LineBboxChirho[]> {
  const dpiScaleChirho = RENDER_DPI_CHIRHO / (72 * PDFTOHTML_ZOOM_CHIRHO);
  const linesChirho = await extractFontAwareLinesChirho(
    volumeNumberChirho,
    pageNumberChirho,
    dpiScaleChirho
  );

  return linesChirho.map((lChirho) => ({
    xMinChirho: Math.round(lChirho.xMinChirho),
    yMinChirho: Math.round(lChirho.yMinChirho),
    xMaxChirho: Math.round(lChirho.xMaxChirho),
    yMaxChirho: Math.round(lChirho.yMaxChirho),
    textChirho: lChirho.wordsChirho.map((wChirho) => wChirho.textChirho).join(" "),
    wordsChirho: lChirho.wordsChirho.map((wChirho) => ({
      textChirho: wChirho.textChirho,
      xMinChirho: Math.round(wChirho.xMinChirho),
      yMinChirho: Math.round(wChirho.yMinChirho),
      xMaxChirho: Math.round(wChirho.xMaxChirho),
      yMaxChirho: Math.round(wChirho.yMaxChirho),
      scriptHintChirho: wChirho.scriptHintChirho,
    })),
  }));
}

/**
 * Asymmetric vertical padding to catch Hebrew nikkud / descenders /
 * polytonic accents without over-padding the top.
 */
export function padLineBboxesChirho(linesChirho: LineBboxChirho[]): LineBboxChirho[] {
  return linesChirho.map((lChirho) => ({
    ...lChirho,
    yMinChirho: Math.max(0, lChirho.yMinChirho - LINE_PADDING_TOP_PX_CHIRHO),
    yMaxChirho: lChirho.yMaxChirho + LINE_PADDING_BOTTOM_PX_CHIRHO,
  }));
}

/**
 * Line boxes must lie on the page image; only the bottom padding may run
 * past its lower edge. A box outside means a coordinate-unit error (the old
 * vol 5 scale was one), so callers refuse the page instead of storing it.
 */
export function lineBoxOutsideImageChirho(
  linesChirho: LineBboxChirho[],
  imageWidthChirho: number,
  imageHeightChirho: number
): LineBboxChirho | null {
  const edgeSlackPxChirho = 2;
  return (
    linesChirho.find(
      (lChirho) =>
        lChirho.xMinChirho < -edgeSlackPxChirho ||
        lChirho.yMinChirho < -edgeSlackPxChirho ||
        lChirho.xMaxChirho > imageWidthChirho + edgeSlackPxChirho ||
        lChirho.yMaxChirho > imageHeightChirho + LINE_PADDING_BOTTOM_PX_CHIRHO + edgeSlackPxChirho
    ) ?? null
  );
}

/**
 * Padded line boxes for a page whose image is already rendered at
 * `imagePathChirho`: tesseract hOCR on scanned volumes, the PDF font layer
 * on born-digital vol 5.
 */
export async function pageLineBboxesChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number,
  imagePathChirho: string
): Promise<LineBboxChirho[]> {
  const rawChirho = SCANNED_VOLS_CHIRHO.has(volumeNumberChirho)
    ? await tesseractLineBboxesChirho(imagePathChirho)
    : await fontAwareLineBboxesChirho(volumeNumberChirho, pageNumberChirho);
  return padLineBboxesChirho(rawChirho);
}
