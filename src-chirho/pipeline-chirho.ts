// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

import {
  PILOT_VOLUME_CHIRHO,
  PILOT_PAGE_START_CHIRHO,
  PILOT_PAGE_END_CHIRHO,
} from "./config-chirho.ts";
import {
  initDbChirho,
  dbChirho,
  logStepStartChirho,
  logStepEndChirho,
} from "./db-chirho.ts";
import { pagesChirho, snippetsChirho } from "./schema-db-chirho.ts";
import { extractPlainTextChirho } from "./extract-text-chirho.ts";
import { renderPageChirho } from "./render-pages-chirho.ts";
import { detectSnippetsChirho } from "./detect-snippets-chirho.ts";
import { cropAllSnippetsChirho } from "./crop-snippets-chirho.ts";
import { ocrAllSnippetsChirho } from "./ocr-snippets-chirho.ts";
import {
  ensureBucketChirho,
  uploadAllSnippetsChirho,
  uploadPageImageChirho,
} from "./upload-chirho.ts";
import { logChirho } from "./utils-chirho.ts";
import { eq, and } from "drizzle-orm";

const AGENT_CODE_CHIRHO = "pipeline-orchestrator-chirho";
const MODULE_CHIRHO = "pipeline-chirho";

/** Pipeline options */
interface PipelineOptionsChirho {
  volumeChirho: number;
  startPageChirho: number;
  endPageChirho: number;
  skipOcrChirho?: boolean;
  skipUploadChirho?: boolean;
}

/**
 * Run the full preprocessing pipeline for a range of pages.
 *
 * Steps per page:
 * 1. Extract plain French text (pdftotext)
 * 2. Render page to PNG (pdftoppm)
 * 3. Detect garbled non-French snippet regions (bbox analysis)
 * 4. Crop each snippet region from the page image
 * 5. OCR each snippet with Claude Vision
 * 6. Upload snippet images to R2
 * 7. Store all data in SQLite
 */
async function runPipelineChirho(optionsChirho: PipelineOptionsChirho): Promise<void> {
  const {
    volumeChirho,
    startPageChirho,
    endPageChirho,
    skipOcrChirho = false,
    skipUploadChirho = false,
  } = optionsChirho;

  logChirho(
    MODULE_CHIRHO,
    `Starting pipeline: vol ${volumeChirho}, pages ${startPageChirho}-${endPageChirho}`
  );
  logChirho(
    MODULE_CHIRHO,
    `Options: OCR=${!skipOcrChirho}, Upload=${!skipUploadChirho}`
  );

  // Initialize database (must happen before logging)
  initDbChirho();
  const initStepChirho = logStepStartChirho(
    AGENT_CODE_CHIRHO,
    "Initialize database and create tables"
  );
  logStepEndChirho(
    initStepChirho,
    "Database initialized with all tables",
    "DB ready for pipeline data"
  );

  // Ensure R2 bucket exists (if uploading)
  if (!skipUploadChirho) {
    const bucketStepChirho = logStepStartChirho(
      AGENT_CODE_CHIRHO,
      "Ensure R2 bucket exists"
    );
    try {
      await ensureBucketChirho();
      logStepEndChirho(
        bucketStepChirho,
        "R2 bucket verified/created",
        "Ready for uploads"
      );
    } catch (errorChirho) {
      logStepEndChirho(
        bucketStepChirho,
        `R2 bucket error: ${errorChirho}`,
        "Will skip uploads"
      );
      logChirho(
        MODULE_CHIRHO,
        `Warning: R2 bucket setup failed, skipping uploads`
      );
    }
  }

  let totalSnippetsChirho = 0;
  let totalPagesProcessedChirho = 0;

  for (
    let pageNumChirho = startPageChirho;
    pageNumChirho <= endPageChirho;
    pageNumChirho++
  ) {
    const pageStepChirho = logStepStartChirho(
      AGENT_CODE_CHIRHO,
      `Process page ${pageNumChirho} of vol ${volumeChirho}`
    );

    try {
      logChirho(
        MODULE_CHIRHO,
        `\n${"=".repeat(60)}\n  Processing vol ${volumeChirho} page ${pageNumChirho}\n${"=".repeat(60)}`
      );

      // Step 1: Extract plain text
      const frenchTextChirho = await extractPlainTextChirho(
        volumeChirho,
        pageNumChirho
      );

      // Step 2: Render page to image
      const imagePathChirho = await renderPageChirho(
        volumeChirho,
        pageNumChirho
      );

      // Step 3: Detect garbled snippet regions
      const detectedChirho = await detectSnippetsChirho(
        volumeChirho,
        pageNumChirho
      );

      logChirho(
        MODULE_CHIRHO,
        `Page ${pageNumChirho}: ${detectedChirho.snippetsChirho.length} snippet regions found`
      );

      // Step 4: Crop snippets
      const croppedChirho = await cropAllSnippetsChirho(
        imagePathChirho,
        volumeChirho,
        pageNumChirho,
        detectedChirho.snippetsChirho,
        detectedChirho.pageWidthChirho,
        detectedChirho.pageHeightChirho
      );

      // Step 5: OCR snippets (optional)
      let ocrResultsChirho: Awaited<ReturnType<typeof ocrAllSnippetsChirho>> =
        [];
      if (!skipOcrChirho && croppedChirho.length > 0) {
        logChirho(
          MODULE_CHIRHO,
          `OCR-ing ${croppedChirho.length} snippets...`
        );
        ocrResultsChirho = await ocrAllSnippetsChirho(croppedChirho);
      }

      // Step 6: Upload to R2 (optional)
      let r2KeysChirho = new Map<number, string>();
      if (!skipUploadChirho) {
        try {
          await uploadPageImageChirho(
            imagePathChirho,
            volumeChirho,
            pageNumChirho
          );
          r2KeysChirho = await uploadAllSnippetsChirho(
            croppedChirho,
            volumeChirho,
            pageNumChirho
          );
        } catch (uploadErrorChirho) {
          logChirho(
            MODULE_CHIRHO,
            `Upload failed for page ${pageNumChirho}: ${uploadErrorChirho}`
          );
        }
      }

      // Step 7: Store in database
      // Upsert page record
      const existingPagesChirho = await dbChirho
        .select()
        .from(pagesChirho)
        .where(
          and(
            eq(pagesChirho.volumeNumberChirho, volumeChirho),
            eq(pagesChirho.pageNumberChirho, pageNumChirho)
          )
        );

      let pageIdChirho: number;

      if (existingPagesChirho.length > 0) {
        pageIdChirho = existingPagesChirho[0]!.idChirho;
        await dbChirho
          .update(pagesChirho)
          .set({
            frenchTextChirho: frenchTextChirho,
            imagePathChirho: imagePathChirho,
            snippetCountChirho: detectedChirho.snippetsChirho.length,
            statusChirho: skipOcrChirho ? "cropped-chirho" : "ocr-done-chirho",
            updatedAtChirho: new Date().toISOString(),
          })
          .where(eq(pagesChirho.idChirho, pageIdChirho));
      } else {
        const insertedChirho = await dbChirho
          .insert(pagesChirho)
          .values({
            volumeNumberChirho: volumeChirho,
            pageNumberChirho: pageNumChirho,
            frenchTextChirho: frenchTextChirho,
            imagePathChirho: imagePathChirho,
            snippetCountChirho: detectedChirho.snippetsChirho.length,
            statusChirho: skipOcrChirho ? "cropped-chirho" : "ocr-done-chirho",
          })
          .returning();
        pageIdChirho = insertedChirho[0]!.idChirho;
      }

      // Insert snippet records
      for (const croppedItemChirho of croppedChirho) {
        const ocrMatchChirho = ocrResultsChirho.find(
          (rChirho) =>
            rChirho.snippetIndexChirho === croppedItemChirho.snippetIndexChirho
        );

        await dbChirho.insert(snippetsChirho).values({
          pageIdChirho: pageIdChirho,
          snippetIndexChirho: croppedItemChirho.snippetIndexChirho,
          xMinChirho: croppedItemChirho.regionChirho.xMinChirho,
          yMinChirho: croppedItemChirho.regionChirho.yMinChirho,
          xMaxChirho: croppedItemChirho.regionChirho.xMaxChirho,
          yMaxChirho: croppedItemChirho.regionChirho.yMaxChirho,
          garbledTextChirho: croppedItemChirho.regionChirho.garbledTextChirho,
          imagePathChirho: croppedItemChirho.imagePathChirho,
          r2KeyChirho: r2KeysChirho.get(croppedItemChirho.snippetIndexChirho) ?? null,
          suggestedTextChirho: ocrMatchChirho?.suggestedTextChirho ?? null,
          scriptTypeChirho:
            ocrMatchChirho?.scriptTypeChirho ??
            croppedItemChirho.regionChirho.scriptTypeChirho,
          statusChirho: ocrMatchChirho ? "ocr-done-chirho" : "cropped-chirho",
        });
      }

      totalSnippetsChirho += detectedChirho.snippetsChirho.length;
      totalPagesProcessedChirho++;

      logStepEndChirho(
        pageStepChirho,
        `Page ${pageNumChirho}: ${detectedChirho.snippetsChirho.length} snippets processed`,
        `Extraction, rendering, detection, cropping${skipOcrChirho ? "" : ", OCR"}${skipUploadChirho ? "" : ", upload"} completed`
      );
    } catch (errorChirho) {
      logStepEndChirho(
        pageStepChirho,
        `Page ${pageNumChirho} failed: ${errorChirho}`,
        "Error during processing, continuing to next page"
      );
      logChirho(
        MODULE_CHIRHO,
        `ERROR on page ${pageNumChirho}: ${errorChirho}`
      );
    }
  }

  // Final summary
  const summaryStepChirho = logStepStartChirho(
    AGENT_CODE_CHIRHO,
    "Pipeline summary"
  );
  const summaryChirho = `Processed ${totalPagesProcessedChirho} pages, ${totalSnippetsChirho} total snippets`;
  logStepEndChirho(
    summaryStepChirho,
    summaryChirho,
    "Pipeline complete. Review snippets in the SvelteKit app or directly in SQLite."
  );

  logChirho(MODULE_CHIRHO, `\n${"=".repeat(60)}`);
  logChirho(MODULE_CHIRHO, `  PIPELINE COMPLETE`);
  logChirho(MODULE_CHIRHO, `  ${summaryChirho}`);
  logChirho(MODULE_CHIRHO, `${"=".repeat(60)}\n`);
}

/** CLI entry point */
if (import.meta.main) {
  const argsChirho = process.argv.slice(2);

  const volumeChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? String(PILOT_VOLUME_CHIRHO),
    10
  );
  const startPageChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--start="))?.split("=")[1] ?? String(PILOT_PAGE_START_CHIRHO),
    10
  );
  const endPageChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--end="))?.split("=")[1] ?? String(PILOT_PAGE_END_CHIRHO),
    10
  );
  const skipOcrChirho = argsChirho.includes("--skip-ocr");
  const skipUploadChirho = argsChirho.includes("--skip-upload");

  console.log(`
╔══════════════════════════════════════════════════════════╗
║  HOTTP Barthélemy Transcription Pipeline                ║
║  For God so loved the world...                          ║
╠══════════════════════════════════════════════════════════╣
║  Volume: ${String(volumeChirho).padEnd(48)}║
║  Pages:  ${String(startPageChirho).padEnd(5)}- ${String(endPageChirho).padEnd(42)}║
║  OCR:    ${(skipOcrChirho ? "SKIP" : "ON").padEnd(48)}║
║  Upload: ${(skipUploadChirho ? "SKIP" : "ON").padEnd(48)}║
╚══════════════════════════════════════════════════════════╝
`);

  await runPipelineChirho({
    volumeChirho,
    startPageChirho,
    endPageChirho,
    skipOcrChirho,
    skipUploadChirho,
  });
}
