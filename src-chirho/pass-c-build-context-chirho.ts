// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Phase A of Pass C v2 — for one page, run the deterministic classifier
 * (hunspell + citation + hyphenation + known_words_chirho) and write a single
 * context JSON file the agent will consume.
 *
 * The context tells the agent, for each line:
 *   - which line crop to open
 *   - the ordered word list with `markerChirho` = "FRENCH-AUTO" (deterministic)
 *     or "CANDIDATE" (needs agent verdict)
 *   - line crop dimensions (so the agent can output coords if it ever needs to)
 *
 * Output: workspace-chirho/pass-c-context-chirho/vol-N-chirho/page-NNNN-chirho.json
 *
 * CLI: bun src-chirho/pass-c-build-context-chirho.ts --vol=2 --page=150
 */

import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { eq, and } from "drizzle-orm";

import { PROJECT_ROOT_CHIRHO, SCANLINES_DIR_CHIRHO } from "./config-chirho.ts";
import { dbChirho, initDbChirho } from "./db-chirho.ts";
import { pagesChirho, scanlinesChirho } from "./schema-db-chirho.ts";
import {
  classifyPageChirho,
  type LineForClassifyChirho,
  type WordWithBboxChirho,
  type WordClassChirho,
} from "./classify-french-chirho.ts";

const CONTEXT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-context-chirho"
);

interface ContextWordChirho {
  wordIndexChirho: number;
  textChirho: string;
  /** Line-local x of the word's left edge, in pixels. */
  xLocChirho: number;
  /** Word width in pixels (xMax - xMin). */
  widthChirho: number;
  /** "FRENCH-AUTO" (no agent action needed) or "CANDIDATE" (classify me). */
  markerChirho: "FRENCH-AUTO" | "CANDIDATE";
  /** Why we auto-accepted (for transparency / debugging). */
  autoAcceptReasonChirho?: string;
  /** Deterministic script hint from PDF font analysis (digital PDFs only).
   *  When present, the agent should default to this script unless the line
   *  image clearly contradicts it (e.g. sigla shapes rendered in a Hebrew font). */
  scriptHintChirho?: string;
}

interface ContextLineChirho {
  lineIndexChirho: number;
  lineCropPathChirho: string;
  /** xMin of the line bbox in page-absolute pixels (for line-local conversion). */
  lineXMinPxChirho: number;
  /** Display dims of the line crop. */
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  wordsChirho: ContextWordChirho[];
  /** Convenience: just the indices of CANDIDATE words. */
  candidateIndicesChirho: number[];
}

interface PageContextChirho {
  schemaVersionChirho: 1;
  volumeChirho: number;
  pageChirho: number;
  pageIdChirho: number;
  totalLinesChirho: number;
  totalWordsChirho: number;
  totalCandidatesChirho: number;
  linesChirho: ContextLineChirho[];
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
  const pageRowChirho = pageRowsChirho[0]!;

  const scanlineRowsChirho = await dbChirho
    .select()
    .from(scanlinesChirho)
    .where(eq(scanlinesChirho.pageIdChirho, pageRowChirho.idChirho))
    .orderBy(scanlinesChirho.lineIndexChirho);

  const linesForClassifyChirho: LineForClassifyChirho[] = scanlineRowsChirho.map(
    (sChirho) => ({
      lineIndexChirho: sChirho.lineIndexChirho,
      wordsChirho: JSON.parse(sChirho.wordsJsonChirho ?? "[]") as WordWithBboxChirho[],
    })
  );

  const verdictsChirho = await classifyPageChirho(volChirho, linesForClassifyChirho);

  // Index verdicts by (line, word) for fast lookup while building per-line context.
  const verdictByKeyChirho = new Map<string, WordClassChirho>();
  for (const vChirho of verdictsChirho) {
    verdictByKeyChirho.set(
      `${vChirho.lineIndexChirho}:${vChirho.wordIndexChirho}`,
      vChirho
    );
  }

  const contextLinesChirho: ContextLineChirho[] = [];
  let totalWordsChirho = 0;
  let totalCandidatesChirho = 0;
  for (const sChirho of scanlineRowsChirho) {
    const wordsChirho: WordWithBboxChirho[] = JSON.parse(
      sChirho.wordsJsonChirho ?? "[]"
    );
    const lineXMinChirho = Number(sChirho.xMinChirho ?? 0);
    const lineWidthChirho = Number(sChirho.widthChirho ?? 0);
    const lineYMinChirho = Number(sChirho.yMinChirho ?? 0);
    const lineHeightChirho = Number(sChirho.heightChirho ?? 0);

    const ctxWordsChirho: ContextWordChirho[] = [];
    const candidateIdxsChirho: number[] = [];
    for (let wiChirho = 0; wiChirho < wordsChirho.length; wiChirho++) {
      const wChirho = wordsChirho[wiChirho]!;
      const verdictChirho = verdictByKeyChirho.get(
        `${sChirho.lineIndexChirho}:${wiChirho}`
      );
      const isCandChirho = verdictChirho?.reasonChirho === "candidate-chirho";
      if (isCandChirho) candidateIdxsChirho.push(wiChirho);
      ctxWordsChirho.push({
        wordIndexChirho: wiChirho,
        textChirho: wChirho.textChirho,
        xLocChirho: Math.round(wChirho.xMinChirho - lineXMinChirho),
        widthChirho: Math.round(wChirho.xMaxChirho - wChirho.xMinChirho),
        markerChirho: isCandChirho ? "CANDIDATE" : "FRENCH-AUTO",
        autoAcceptReasonChirho: isCandChirho
          ? undefined
          : verdictChirho?.reasonChirho,
        scriptHintChirho: (wChirho as { scriptHintChirho?: string }).scriptHintChirho,
      });
    }
    totalWordsChirho += ctxWordsChirho.length;
    totalCandidatesChirho += candidateIdxsChirho.length;

    const lineCropPathChirho = join(
      SCANLINES_DIR_CHIRHO,
      `vol-${volChirho}-chirho`,
      `page-${String(pageChirho).padStart(4, "0")}-chirho`,
      `line-${String(sChirho.lineIndexChirho).padStart(3, "0")}-chirho.png`
    );

    contextLinesChirho.push({
      lineIndexChirho: sChirho.lineIndexChirho,
      lineCropPathChirho,
      lineXMinPxChirho: Math.round(lineXMinChirho),
      lineWidthPxChirho: Math.round(lineWidthChirho),
      lineHeightPxChirho: Math.round(lineHeightChirho),
      wordsChirho: ctxWordsChirho,
      candidateIndicesChirho: candidateIdxsChirho,
    });
  }

  const contextChirho: PageContextChirho = {
    schemaVersionChirho: 1,
    volumeChirho: volChirho,
    pageChirho: pageChirho,
    pageIdChirho: pageRowChirho.idChirho,
    totalLinesChirho: scanlineRowsChirho.length,
    totalWordsChirho,
    totalCandidatesChirho,
    linesChirho: contextLinesChirho,
  };

  const outDirChirho = join(
    CONTEXT_DIR_CHIRHO,
    `vol-${volChirho}-chirho`
  );
  if (!existsSync(outDirChirho)) mkdirSync(outDirChirho, { recursive: true });
  const outPathChirho = join(
    outDirChirho,
    `page-${String(pageChirho).padStart(4, "0")}-chirho.json`
  );
  await Bun.write(outPathChirho, JSON.stringify(contextChirho, null, 2));

  console.log(
    `Context written: ${outPathChirho}\n  ${contextChirho.totalLinesChirho} lines, ${contextChirho.totalWordsChirho} words, ${contextChirho.totalCandidatesChirho} candidates needing agent classification`
  );
}
