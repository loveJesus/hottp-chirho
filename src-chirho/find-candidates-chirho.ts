// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * For one volume/page, run the full classifier (hunspell + citation regex +
 * hyphenation + known_words_chirho) and print:
 *   - Each candidate word that needs Pass C agent review (with its line, x, width)
 *   - Aggregate counts: how many words auto-accepted via each rule, how many
 *     remain as candidates
 *
 * CLI: bun src-chirho/find-candidates-chirho.ts --vol=2 --page=150
 */

import { eq, and } from "drizzle-orm";

import { dbChirho, initDbChirho } from "./db-chirho.ts";
import { pagesChirho, scanlinesChirho } from "./schema-db-chirho.ts";
import {
  classifyPageChirho,
  type LineForClassifyChirho,
  type WordWithBboxChirho,
  type ClassifyReasonChirho,
} from "./classify-french-chirho.ts";

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

  const linesForClassifyChirho: LineForClassifyChirho[] = scanlineRowsChirho.map(
    (sChirho) => ({
      lineIndexChirho: sChirho.lineIndexChirho,
      wordsChirho: JSON.parse(sChirho.wordsJsonChirho ?? "[]") as WordWithBboxChirho[],
    })
  );

  const classificationsChirho = await classifyPageChirho(
    volChirho,
    linesForClassifyChirho
  );

  // Index words by (line, word_idx) so we can fetch x/width when printing
  const wordIndexChirho = new Map<string, WordWithBboxChirho>();
  const lineXMinChirho = new Map<number, number>();
  for (const sChirho of scanlineRowsChirho) {
    lineXMinChirho.set(sChirho.lineIndexChirho, Number(sChirho.xMinChirho ?? 0));
    const wordsChirho: WordWithBboxChirho[] = JSON.parse(
      sChirho.wordsJsonChirho ?? "[]"
    );
    for (let wiChirho = 0; wiChirho < wordsChirho.length; wiChirho++) {
      wordIndexChirho.set(
        `${sChirho.lineIndexChirho}:${wiChirho}`,
        wordsChirho[wiChirho]!
      );
    }
  }

  const reasonCountsChirho: Record<ClassifyReasonChirho, number> = {
    "hunspell-chirho": 0,
    "citation-chirho": 0,
    "hyphenation-chirho": 0,
    "known-words-chirho": 0,
    "latin-hunspell-chirho": 0,
    "candidate-chirho": 0,
  };
  const candidatesByLineChirho = new Map<number, typeof classificationsChirho>();

  for (const cChirho of classificationsChirho) {
    reasonCountsChirho[cChirho.reasonChirho]++;
    if (cChirho.reasonChirho === "candidate-chirho") {
      const arrChirho = candidatesByLineChirho.get(cChirho.lineIndexChirho) ?? [];
      arrChirho.push(cChirho);
      candidatesByLineChirho.set(cChirho.lineIndexChirho, arrChirho);
    }
  }

  console.log(
    `\n# Candidate analysis — vol ${volChirho} p${pageChirho} — ${scanlineRowsChirho.length} lines, ${classificationsChirho.length} words\n`
  );

  const sortedLinesChirho = [...candidatesByLineChirho.keys()].sort(
    (aChirho, bChirho) => aChirho - bChirho
  );
  for (const lineIxChirho of sortedLinesChirho) {
    const candsChirho = candidatesByLineChirho.get(lineIxChirho)!;
    console.log(`Line ${String(lineIxChirho).padStart(3)} — ${candsChirho.length} candidate(s):`);
    for (const cChirho of candsChirho) {
      const wChirho = wordIndexChirho.get(
        `${cChirho.lineIndexChirho}:${cChirho.wordIndexChirho}`
      )!;
      const xLocChirho =
        wChirho.xMinChirho - (lineXMinChirho.get(cChirho.lineIndexChirho) ?? 0);
      const widthChirho = wChirho.xMaxChirho - wChirho.xMinChirho;
      console.log(
        `    ${String(xLocChirho).padStart(4)}+${String(widthChirho).padStart(3)}px  "${cChirho.textChirho}"`
      );
    }
  }

  console.log("\n# Aggregates\n");
  console.log(`  Total words:           ${classificationsChirho.length}`);
  console.log(`  Hunspell French:       ${reasonCountsChirho["hunspell-chirho"]}`);
  console.log(`  Citation/sigla regex:  ${reasonCountsChirho["citation-chirho"]}`);
  console.log(`  Hyphenation pairs:     ${reasonCountsChirho["hyphenation-chirho"]}`);
  console.log(`  known_words_chirho:    ${reasonCountsChirho["known-words-chirho"]}`);
  console.log(`  Broader Latin:        ${reasonCountsChirho["latin-hunspell-chirho"]}`);
  console.log(`  CANDIDATES (agent):    ${reasonCountsChirho["candidate-chirho"]}`);
  const acceptedChirho =
    classificationsChirho.length - reasonCountsChirho["candidate-chirho"];
  console.log(
    `  Auto-accepted total:   ${acceptedChirho} (${((acceptedChirho / classificationsChirho.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `  Lines with candidates: ${candidatesByLineChirho.size} / ${scanlineRowsChirho.length}`
  );
}
