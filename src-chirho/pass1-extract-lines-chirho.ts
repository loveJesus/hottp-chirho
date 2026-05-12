// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Pass A — line extraction for human review.
 *
 * For each page:
 *   1. Render to 300 DPI PNG (pdftoppm)
 *   2. For scanned vols (1-4): deskew the PNG in place (ImageMagick)
 *   3. Get line bboxes in pixel coords of the final PNG:
 *        - Vol 5 (native digital): pdftotext bbox (exact)
 *        - Vols 1-4 (scanned): tesseract hOCR (image-derived)
 *   4. Upsert pages_chirho + replace scanlines_chirho rows
 *   5. Page status is set to "lines-extracted-chirho" — awaiting human approval
 *
 * No segment detection, no cropping of line strips, no OCR, no upload.
 * Lines get approved in bulk via the review UI (Pass B).
 *
 * CLI:
 *   bun src-chirho/pass1-extract-lines-chirho.ts --vol=5 --page=150
 *   bun src-chirho/pass1-extract-lines-chirho.ts --vol=1 --start=148 --end=152
 *   bun src-chirho/pass1-extract-lines-chirho.ts --pilot   (vols 1-5, pages 148-152)
 */

import { eq, and } from "drizzle-orm";
import { existsSync, unlinkSync } from "fs";

import { RENDER_DPI_CHIRHO } from "./config-chirho.ts";
import {
  dbChirho,
  initDbChirho,
  sqliteChirho,
  logStepStartChirho,
  logStepEndChirho,
} from "./db-chirho.ts";
import { pagesChirho } from "./schema-db-chirho.ts";
import { renderPageChirho, pageImagePathChirho } from "./render-pages-chirho.ts";
import {
  extractPlainTextChirho,
} from "./extract-text-chirho.ts";
import { extractFontAwareLinesChirho } from "./extract-text-fonts-chirho.ts";
import { runCmdChirho, logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "pass1-extract-lines-chirho";
const AGENT_CODE_CHIRHO = "pass1-extract-lines-chirho";

/** Volumes whose PDFs are scanned — deskew + tesseract for geometry */
const SCANNED_VOLS_CHIRHO = new Set<number>([1, 2, 3, 4]);

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
const LINE_PADDING_TOP_PX_CHIRHO = 6;
const LINE_PADDING_BOTTOM_PX_CHIRHO = 12;

/** Default pilot range: pages 148-152 across all 5 volumes (25 pages) */
const PILOT_VOLS_CHIRHO = [1, 2, 3, 4, 5] as const;
const PILOT_START_CHIRHO = 148;
const PILOT_END_CHIRHO = 152;

interface WordBboxChirho {
  textChirho: string;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  /** Optional deterministic script tag from PDF font analysis. Present for
   *  digital PDFs (vol 5); absent for tesseract-OCR'd scanned vols. When
   *  present and non-latin, the classifier short-circuits to candidate. */
  scriptHintChirho?: "latin-chirho" | "hebrew-chirho" | "greek-chirho" | "syriac-chirho" | "arabic-chirho" | "symbol-chirho";
}

interface LineBboxChirho {
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

/** Deskew + trim an image in place. Safe to run on already-deskewed images. */
async function deskewInPlaceChirho(imagePathChirho: string): Promise<void> {
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
 * Ensure the canonical page image on disk is rendered AND deskewed-if-scanned.
 * For scanned vols, we always delete then re-render to avoid stale non-deskewed
 * images from earlier runs.
 */
async function ensurePageImageChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<string> {
  const imagePathChirho = pageImagePathChirho(
    volumeNumberChirho,
    pageNumberChirho
  );

  if (SCANNED_VOLS_CHIRHO.has(volumeNumberChirho)) {
    if (existsSync(imagePathChirho)) {
      unlinkSync(imagePathChirho);
    }
    await renderPageChirho(volumeNumberChirho, pageNumberChirho);
    await deskewInPlaceChirho(imagePathChirho);
    logChirho(
      MODULE_CHIRHO,
      `Rendered + deskewed: vol ${volumeNumberChirho} p${pageNumberChirho}`
    );
  } else {
    await renderPageChirho(volumeNumberChirho, pageNumberChirho);
  }

  return imagePathChirho;
}

/**
 * Extract line bboxes in pixel coords from a rendered page image using tesseract hOCR.
 * Tesseract's transcription is stored per line as a rough "what did the image look like"
 * signal — correct French for most lines, garbled for non-French regions, useful for prescreen.
 */
async function tesseractLineBboxesChirho(
  imagePathChirho: string
): Promise<LineBboxChirho[]> {
  const stemChirho = imagePathChirho.replace(/\.png$/i, "-hocr-chirho");
  const hocrPathChirho = `${stemChirho}.hocr`;

  await runCmdChirho([
    "tesseract",
    imagePathChirho,
    stemChirho,
    "-l",
    "fra",
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
 */
async function fontAwareLineBboxesChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<LineBboxChirho[]> {
  const dpiScaleChirho = RENDER_DPI_CHIRHO / 72;
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

/** Process one page through Pass A */
async function pass1PageChirho(
  volumeNumberChirho: number,
  pageNumberChirho: number
): Promise<{ lineCountChirho: number }> {
  const stepIdChirho = logStepStartChirho(
    AGENT_CODE_CHIRHO,
    `Pass A: vol ${volumeNumberChirho} page ${pageNumberChirho}`
  );

  try {
    const imagePathChirho = await ensurePageImageChirho(
      volumeNumberChirho,
      pageNumberChirho
    );

    const rawBboxesChirho = SCANNED_VOLS_CHIRHO.has(volumeNumberChirho)
      ? await tesseractLineBboxesChirho(imagePathChirho)
      : await fontAwareLineBboxesChirho(volumeNumberChirho, pageNumberChirho);

    // Asymmetric vertical padding to catch Hebrew nikkud / descenders /
    // polytonic accents without over-padding the top.
    const lineBboxesChirho = rawBboxesChirho.map((lChirho) => ({
      ...lChirho,
      yMinChirho: Math.max(0, lChirho.yMinChirho - LINE_PADDING_TOP_PX_CHIRHO),
      yMaxChirho: lChirho.yMaxChirho + LINE_PADDING_BOTTOM_PX_CHIRHO,
    }));

    const frenchTextChirho = await extractPlainTextChirho(
      volumeNumberChirho,
      pageNumberChirho
    );

    // Upsert page
    const existingChirho = await dbChirho
      .select()
      .from(pagesChirho)
      .where(
        and(
          eq(pagesChirho.volumeNumberChirho, volumeNumberChirho),
          eq(pagesChirho.pageNumberChirho, pageNumberChirho)
        )
      )
      .limit(1);

    let pageIdChirho: number;
    if (existingChirho.length > 0) {
      pageIdChirho = existingChirho[0]!.idChirho;
      await dbChirho
        .update(pagesChirho)
        .set({
          frenchTextChirho,
          imagePathChirho,
          statusChirho: "lines-extracted-chirho",
          linesApprovedAtChirho: null,
          linesRejectionNoteChirho: null,
          updatedAtChirho: new Date().toISOString(),
        })
        .where(eq(pagesChirho.idChirho, pageIdChirho));
      // Replace scanlines for a clean re-extract (no segments yet, so no FK conflict)
      sqliteChirho.run(
        `DELETE FROM segments_chirho WHERE scanline_id_chirho IN
           (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ?)`,
        [pageIdChirho]
      );
      sqliteChirho.run(
        `DELETE FROM scanlines_chirho WHERE page_id_chirho = ?`,
        [pageIdChirho]
      );
    } else {
      const insertedChirho = await dbChirho
        .insert(pagesChirho)
        .values({
          volumeNumberChirho,
          pageNumberChirho,
          frenchTextChirho,
          imagePathChirho,
          statusChirho: "lines-extracted-chirho",
        })
        .returning();
      pageIdChirho = insertedChirho[0]!.idChirho;
    }

    // Insert scanline rows — pixel coords on the final (possibly deskewed) PNG.
    // words_json_chirho stores the per-word bboxes from tesseract (vols 1-4) or
    // pdftotext (vol 5) in page-absolute coords, used downstream by Pass C to
    // anchor non-French span boundaries via gap analysis.
    const insertStmtChirho = sqliteChirho.prepare(
      `INSERT INTO scanlines_chirho
        (page_id_chirho, line_index_chirho, x_min_chirho, y_min_chirho,
         width_chirho, height_chirho, pdftotext_chirho, words_json_chirho, status_chirho)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'extracted-chirho')`
    );

    for (let iChirho = 0; iChirho < lineBboxesChirho.length; iChirho++) {
      const lChirho = lineBboxesChirho[iChirho]!;
      insertStmtChirho.run(
        pageIdChirho,
        iChirho,
        lChirho.xMinChirho,
        lChirho.yMinChirho,
        Math.round(lChirho.xMaxChirho - lChirho.xMinChirho),
        Math.round(lChirho.yMaxChirho - lChirho.yMinChirho),
        lChirho.textChirho,
        JSON.stringify(lChirho.wordsChirho)
      );
    }

    logChirho(
      MODULE_CHIRHO,
      `Vol ${volumeNumberChirho} p${pageNumberChirho}: ${lineBboxesChirho.length} lines extracted`
    );

    logStepEndChirho(
      stepIdChirho,
      `Extracted ${lineBboxesChirho.length} lines`,
      `Pass A done — awaiting human approval of line boxes.`
    );

    return { lineCountChirho: lineBboxesChirho.length };
  } catch (errChirho) {
    logStepEndChirho(
      stepIdChirho,
      `Error: ${errChirho}`,
      `Pass A failed for vol ${volumeNumberChirho} p${pageNumberChirho}.`
    );
    throw errChirho;
  }
}

/** CLI entry */
if (import.meta.main) {
  const argsChirho = process.argv.slice(2);
  const isPilotChirho = argsChirho.includes("--pilot");

  const volArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--vol="))
    ?.split("=")[1];
  const pageArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--page="))
    ?.split("=")[1];
  const startArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--start="))
    ?.split("=")[1];
  const endArgChirho = argsChirho
    .find((aChirho) => aChirho.startsWith("--end="))
    ?.split("=")[1];

  initDbChirho();

  interface TargetChirho {
    volChirho: number;
    pageChirho: number;
  }
  const targetsChirho: TargetChirho[] = [];

  if (isPilotChirho) {
    for (const vChirho of PILOT_VOLS_CHIRHO) {
      for (
        let pChirho = PILOT_START_CHIRHO;
        pChirho <= PILOT_END_CHIRHO;
        pChirho++
      ) {
        targetsChirho.push({ volChirho: vChirho, pageChirho: pChirho });
      }
    }
  } else {
    const volChirho = parseInt(volArgChirho ?? "5", 10);
    if (pageArgChirho) {
      targetsChirho.push({
        volChirho,
        pageChirho: parseInt(pageArgChirho, 10),
      });
    } else if (startArgChirho && endArgChirho) {
      const startChirho = parseInt(startArgChirho, 10);
      const endChirho = parseInt(endArgChirho, 10);
      for (let pChirho = startChirho; pChirho <= endChirho; pChirho++) {
        targetsChirho.push({ volChirho, pageChirho: pChirho });
      }
    } else {
      console.error(
        "Usage:\n" +
          "  --pilot                       (vols 1-5, pages 148-152)\n" +
          "  --vol=N --page=X              (single page)\n" +
          "  --vol=N --start=X --end=Y     (page range within a vol)"
      );
      process.exit(1);
    }
  }

  let okChirho = 0;
  let failChirho = 0;
  let totalLinesChirho = 0;
  for (const tChirho of targetsChirho) {
    try {
      const rChirho = await pass1PageChirho(tChirho.volChirho, tChirho.pageChirho);
      okChirho++;
      totalLinesChirho += rChirho.lineCountChirho;
    } catch (errChirho) {
      failChirho++;
      logChirho(
        MODULE_CHIRHO,
        `FAILED vol ${tChirho.volChirho} p${tChirho.pageChirho}: ${errChirho}`
      );
    }
  }

  logChirho(
    MODULE_CHIRHO,
    `\nPass A complete: ${okChirho} pages ok, ${failChirho} failed, ${totalLinesChirho} lines total.`
  );
}
