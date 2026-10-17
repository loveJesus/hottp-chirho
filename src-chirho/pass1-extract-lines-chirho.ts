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
import {
  SCANNED_VOLS_CHIRHO,
  deskewInPlaceChirho,
  pageLineBboxesChirho,
} from "./corpus-intake-chirho/page-geometry-chirho.ts";
import { logChirho } from "./utils-chirho.ts";

const MODULE_CHIRHO = "pass1-extract-lines-chirho";
const AGENT_CODE_CHIRHO = "pass1-extract-lines-chirho";

/** Default pilot range: pages 148-152 across all 5 volumes (25 pages) */
const PILOT_VOLS_CHIRHO = [1, 2, 3, 4, 5] as const;
const PILOT_START_CHIRHO = 148;
const PILOT_END_CHIRHO = 152;

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

    // Padded line boxes: tesseract hOCR on scanned vols, the PDF font layer on vol 5.
    const lineBboxesChirho = await pageLineBboxesChirho(
      volumeNumberChirho,
      pageNumberChirho,
      imagePathChirho
    );

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

      // Safety: refuse to re-OCR a page that has any human-confirmed word — we
      // would otherwise silently wipe the human's edits. Events also block
      // deletion because of the words/scanlines FKs, so any non-zero event
      // count is a hard stop.
      const confirmedChirho = sqliteChirho
        .query(
          `SELECT COUNT(*) AS c_chirho FROM words_chirho
             WHERE scanline_id_chirho IN
               (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ?)
               AND is_human_confirmed_chirho = 1`
        )
        .get(pageIdChirho) as { c_chirho: number } | undefined;
      const eventsChirho = sqliteChirho
        .query(`SELECT COUNT(*) AS c_chirho FROM events_chirho WHERE page_id_chirho = ?`)
        .get(pageIdChirho) as { c_chirho: number } | undefined;
      if ((confirmedChirho?.c_chirho ?? 0) > 0 || (eventsChirho?.c_chirho ?? 0) > 0) {
        throw new Error(
          `Refusing to re-OCR vol ${volumeNumberChirho} p${pageNumberChirho}: ` +
            `${confirmedChirho?.c_chirho ?? 0} human-confirmed word(s), ` +
            `${eventsChirho?.c_chirho ?? 0} event(s). Reset by hand or pick a different page.`
        );
      }

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
      // Cascade-delete in FK order:
      //   events → words → bhs/lxx matches → segments → scanlines.
      // (events for this page are already zero by the guard above, but the
      // explicit DELETE keeps the statement safe if the guard ever loosens.)
      sqliteChirho.run(`DELETE FROM events_chirho WHERE page_id_chirho = ?`, [pageIdChirho]);
      sqliteChirho.run(
        `DELETE FROM words_chirho WHERE scanline_id_chirho IN
           (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ?)`,
        [pageIdChirho]
      );
      const segIdSubqChirho = `(SELECT id_chirho FROM segments_chirho WHERE scanline_id_chirho IN
           (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ?))`;
      sqliteChirho.run(`DELETE FROM bhs_matches_chirho WHERE segment_id_chirho IN ${segIdSubqChirho}`, [pageIdChirho]);
      sqliteChirho.run(`DELETE FROM lxx_matches_chirho WHERE segment_id_chirho IN ${segIdSubqChirho}`, [pageIdChirho]);
      sqliteChirho.run(
        `DELETE FROM verse_context_chirho WHERE scanline_id_chirho IN
           (SELECT id_chirho FROM scanlines_chirho WHERE page_id_chirho = ?)`,
        [pageIdChirho]
      );
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
