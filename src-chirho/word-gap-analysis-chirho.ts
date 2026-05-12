// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Diagnostic: for one volume/page, classify each word in each scanline as
 * Latin (low garbled score) vs garbled-Latin (likely non-French glyphs that
 * Tesseract misread). Print:
 *   - per-line word listing with garbled scores
 *   - aggregate histograms: word widths, gaps between consecutive words,
 *     garbled-score distribution
 * Use the result to pick thresholds for automatic non-French span detection
 * (Pass C anchors).
 *
 * CLI: bun src-chirho/word-gap-analysis-chirho.ts --vol=2 --page=150
 */

import { eq, and } from "drizzle-orm";

import { dbChirho, initDbChirho } from "./db-chirho.ts";
import { pagesChirho, scanlinesChirho } from "./schema-db-chirho.ts";
import { computeGarbledScoreChirho } from "./extract-text-chirho.ts";

interface WordChirho {
  textChirho: string;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
}

const GARBLED_THRESHOLD_CHIRHO = 0.4;

/** Print a coarse histogram of an integer-valued sample */
function histogramChirho(
  samplesChirho: number[],
  bucketSizeChirho: number,
  labelChirho: string
): void {
  if (samplesChirho.length === 0) {
    console.log(`  ${labelChirho}: <no samples>`);
    return;
  }
  const bucketsChirho = new Map<number, number>();
  for (const sChirho of samplesChirho) {
    const bChirho = Math.floor(sChirho / bucketSizeChirho) * bucketSizeChirho;
    bucketsChirho.set(bChirho, (bucketsChirho.get(bChirho) ?? 0) + 1);
  }
  const keysChirho = [...bucketsChirho.keys()].sort((aChirho, bChirho) => aChirho - bChirho);
  const maxCountChirho = Math.max(...bucketsChirho.values());
  console.log(`  ${labelChirho} (n=${samplesChirho.length}, bucket=${bucketSizeChirho}px):`);
  for (const kChirho of keysChirho) {
    const cChirho = bucketsChirho.get(kChirho)!;
    const barChirho = "█".repeat(Math.round((cChirho / maxCountChirho) * 40));
    console.log(`    ${String(kChirho).padStart(4)}-${String(kChirho + bucketSizeChirho - 1).padStart(4)} | ${String(cChirho).padStart(3)} | ${barChirho}`);
  }
}

if (import.meta.main) {
  initDbChirho();
  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ??
      "2",
    10
  );
  const pageChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1] ??
      "150",
    10
  );

  const pageRowsChirho = await dbChirho
    .select()
    .from(pagesChirho)
    .where(
      and(
        eq(pagesChirho.volumeNumberChirho, volChirho),
        eq(pagesChirho.pageNumberChirho, pageChirho)
      )
    )
    .limit(1);

  if (pageRowsChirho.length === 0) {
    console.error(`No page row for vol ${volChirho} p${pageChirho}`);
    process.exit(1);
  }

  const scanlineRowsChirho = await dbChirho
    .select()
    .from(scanlinesChirho)
    .where(eq(scanlinesChirho.pageIdChirho, pageRowsChirho[0]!.idChirho))
    .orderBy(scanlinesChirho.lineIndexChirho);

  const allWidthsChirho: number[] = [];
  const allGapsChirho: number[] = [];
  const allScoresPctChirho: number[] = [];
  const garbledWidthsChirho: number[] = [];
  const cleanWidthsChirho: number[] = [];

  console.log(`\n# Word/gap analysis — vol ${volChirho} p${pageChirho} — ${scanlineRowsChirho.length} lines\n`);

  let linesWithGarbledChirho = 0;
  let totalGarbledChirho = 0;

  for (const scanlineChirho of scanlineRowsChirho) {
    const wordsChirho: WordChirho[] = JSON.parse(
      scanlineChirho.wordsJsonChirho ?? "[]"
    );
    if (wordsChirho.length === 0) continue;

    const lineXMinChirho = Number(scanlineChirho.xMinChirho ?? 0);
    let lineGarbledCountChirho = 0;
    const wordSummariesChirho: string[] = [];

    for (let iChirho = 0; iChirho < wordsChirho.length; iChirho++) {
      const wChirho = wordsChirho[iChirho]!;
      const widthChirho = wChirho.xMaxChirho - wChirho.xMinChirho;
      const scoreChirho = computeGarbledScoreChirho(wChirho.textChirho);
      const isGarbledChirho = scoreChirho >= GARBLED_THRESHOLD_CHIRHO;

      allWidthsChirho.push(widthChirho);
      allScoresPctChirho.push(Math.round(scoreChirho * 100));
      if (isGarbledChirho) {
        garbledWidthsChirho.push(widthChirho);
        lineGarbledCountChirho++;
      } else {
        cleanWidthsChirho.push(widthChirho);
      }

      if (iChirho > 0) {
        const prevChirho = wordsChirho[iChirho - 1]!;
        const gapChirho = wChirho.xMinChirho - prevChirho.xMaxChirho;
        if (gapChirho > 0) allGapsChirho.push(gapChirho);
      }

      // Line-local x for readability
      const xLocChirho = wChirho.xMinChirho - lineXMinChirho;
      const flagChirho = isGarbledChirho ? "G" : " ";
      wordSummariesChirho.push(
        `${flagChirho} ${String(xLocChirho).padStart(4)}+${String(widthChirho).padStart(3)} s=${scoreChirho.toFixed(2)} "${wChirho.textChirho}"`
      );
    }

    if (lineGarbledCountChirho > 0) {
      linesWithGarbledChirho++;
      totalGarbledChirho += lineGarbledCountChirho;
      console.log(
        `Line ${String(scanlineChirho.lineIndexChirho).padStart(3)} — ${lineGarbledCountChirho} garbled / ${wordsChirho.length} words:`
      );
      for (const sChirho of wordSummariesChirho) console.log(`    ${sChirho}`);
      console.log("");
    }
  }

  console.log("# Aggregates\n");
  console.log(
    `  Lines with at least one garbled word: ${linesWithGarbledChirho} / ${scanlineRowsChirho.length}`
  );
  console.log(`  Total garbled words: ${totalGarbledChirho}`);
  console.log(`  Total clean Latin words: ${cleanWidthsChirho.length}`);

  console.log("\n## Word width distribution (clean Latin)");
  histogramChirho(cleanWidthsChirho, 20, "px");

  console.log("\n## Word width distribution (garbled — likely non-French glyphs)");
  histogramChirho(garbledWidthsChirho, 20, "px");

  console.log("\n## Inter-word gap distribution (all consecutive pairs)");
  histogramChirho(allGapsChirho, 5, "px");

  console.log("\n## Garbled-score distribution (×100)");
  histogramChirho(allScoresPctChirho, 5, "score×100");
}
