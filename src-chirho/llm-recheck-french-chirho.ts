// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Context-aware French-token recheck — emits a prompt-bundle for a Claude
 * subagent (NOT a direct API call). Operator pipes the printed prompt into
 * an Agent invocation; the agent returns JSON verdicts which a follow-up
 * step applies back to the spans.
 *
 * Surfaces tokens currently classified as `french-chirho` whose surface form
 * is suspicious (hunspell miss + short / digit-punct mix), bundles each with
 * its sentence context, and prints a numbered prompt + the suspect list.
 *
 * CLI:
 *   bun src-chirho/llm-recheck-french-chirho.ts --vol=1 --pages=148-152
 *   bun src-chirho/llm-recheck-french-chirho.ts --vol=1 --page=150
 */

import { writeJsonAtomicChirho, writeTextAtomicChirho } from "./atomic-json-chirho.ts";
import { sqliteChirho } from "./db-chirho.ts";
import { findFrenchMissesChirho } from "./dict-check-chirho.ts";

const BATCH_SIZE_CHIRHO = 50;

interface SuspectChirho {
  pageNumberChirho: number;
  lineIndexChirho: number;
  segmentIdChirho: number;
  segmentTextChirho: string;
  suspectTokenChirho: string;
}

function isSuspectTokenChirho(tokChirho: string): boolean {
  if (tokChirho.length === 0) return false;
  if (tokChirho.length > 8) return false;
  // Has a digit AND a non-digit non-letter char
  const hasDigitChirho = /\d/.test(tokChirho);
  const hasPunctChirho = /[?°§|!#$@&()_*~`\\\/\[\]{}<>=+]/.test(tokChirho);
  const hasLetterChirho = /[A-Za-zÀ-ÿ]/.test(tokChirho);
  if (hasDigitChirho && hasPunctChirho) return true;
  if (hasDigitChirho && hasLetterChirho && tokChirho.length <= 5) return true;
  if (hasPunctChirho && hasLetterChirho && tokChirho.length <= 5) return true;
  if (/^[a-zA-Z]\d/.test(tokChirho)) return true;
  if (/^N°/.test(tokChirho)) return true;
  if (/^[A-Z][a-z]{1,3}\?$/.test(tokChirho)) return true;
  return false;
}

function tokenizeChirho(textChirho: string): string[] {
  return textChirho.split(/\s+/).filter((tChirho) => tChirho.length > 0);
}

async function gatherSuspectsChirho(
  volChirho: number,
  pagesChirho: number[]
): Promise<SuspectChirho[]> {
  const placeholdersChirho = pagesChirho.map(() => "?").join(",");
  const rowsChirho = sqliteChirho
    .prepare(
      `SELECT seg.id_chirho            AS segment_id_chirho,
              p.page_number_chirho     AS page_number_chirho,
              s.line_index_chirho      AS line_index_chirho,
              seg.accepted_text_chirho AS accepted_text_chirho,
              seg.pdftotext_chirho     AS pdftotext_chirho,
              seg.ocr_text_chirho      AS ocr_text_chirho
         FROM segments_chirho seg
         JOIN scanlines_chirho s ON s.id_chirho = seg.scanline_id_chirho
         JOIN pages_chirho p     ON p.id_chirho = s.page_id_chirho
        WHERE p.volume_number_chirho = ?
          AND p.page_number_chirho IN (${placeholdersChirho})
          AND seg.script_type_chirho = 'french-chirho'
        ORDER BY p.page_number_chirho, s.line_index_chirho, seg.segment_index_chirho`
    )
    .all(volChirho, ...pagesChirho) as Array<{
      segment_id_chirho: number;
      page_number_chirho: number;
      line_index_chirho: number;
      accepted_text_chirho: string | null;
      pdftotext_chirho: string | null;
      ocr_text_chirho: string | null;
    }>;

  const candidatesChirho: { segIdChirho: number; pageChirho: number; lineChirho: number; segTextChirho: string; tokensChirho: string[] }[] =
    [];
  const allTokensChirho: string[] = [];

  for (const rChirho of rowsChirho) {
    const segTextChirho = (rChirho.accepted_text_chirho ?? rChirho.ocr_text_chirho ?? rChirho.pdftotext_chirho ?? "").trim();
    if (!segTextChirho) continue;
    const tokensChirho = tokenizeChirho(segTextChirho).filter(isSuspectTokenChirho);
    if (tokensChirho.length === 0) continue;
    candidatesChirho.push({
      segIdChirho: rChirho.segment_id_chirho,
      pageChirho: rChirho.page_number_chirho,
      lineChirho: rChirho.line_index_chirho,
      segTextChirho,
      tokensChirho,
    });
    allTokensChirho.push(...tokensChirho);
  }

  const missesChirho = await findFrenchMissesChirho(allTokensChirho);

  const suspectsChirho: SuspectChirho[] = [];
  for (const cChirho of candidatesChirho) {
    for (const tokChirho of cChirho.tokensChirho) {
      if (!missesChirho.has(tokChirho)) continue;
      suspectsChirho.push({
        pageNumberChirho: cChirho.pageChirho,
        lineIndexChirho: cChirho.lineChirho,
        segmentIdChirho: cChirho.segIdChirho,
        segmentTextChirho: cChirho.segTextChirho,
        suspectTokenChirho: tokChirho,
      });
    }
  }
  return suspectsChirho;
}

function markTokenChirho(sentenceChirho: string, tokenChirho: string): string {
  const idxChirho = sentenceChirho.indexOf(tokenChirho);
  if (idxChirho < 0) return sentenceChirho;
  return (
    sentenceChirho.slice(0, idxChirho) +
    "**" +
    tokenChirho +
    "**" +
    sentenceChirho.slice(idxChirho + tokenChirho.length)
  );
}

function buildPromptChirho(itemsChirho: SuspectChirho[]): string {
  const promptItemsChirho = itemsChirho
    .map((sChirho, iChirho) => {
      const markedChirho = markTokenChirho(sChirho.segmentTextChirho, sChirho.suspectTokenChirho);
      return `${iChirho + 1}. ${markedChirho}`;
    })
    .join("\n");

  return `Each numbered line is a sentence from a French scholarly text (Barthélemy's Critique textuelle de l'Ancien Testament). ONE token per line is marked **between double-asterisks**. Decide whether that marked token is a plausible French/Latin/scholarly-citation token in that sentence, OR whether it is gibberish (likely Hebrew/Greek that was mangled by the publisher's font and embedded as Latin codepoints).

Examples of plausible French context: proper nouns, manuscript sigla like *M, [B], 4QSam, biblical refs like 6,18 or Jos 7,21, scholarly abbrevs, page numbers.
Examples of gibberish (non-french): short tokens like "1?", "N°?", "Van?", "73", "n°?" sandwiched between French words where Hebrew is expected (e.g. discussing a textual variant or quoting a Hebrew word).

Reply with ONLY a JSON array. One object per item, in the SAME ORDER as input:
[{"i":1,"verdict":"french|non-french|uncertain","note":"<≤8 word reason>"}, ...]

Items:
${promptItemsChirho}`;
}

if (import.meta.main) {
  const argsChirho = process.argv.slice(2);
  const volChirho = parseInt(
    argsChirho.find((aChirho) => aChirho.startsWith("--vol="))?.split("=")[1] ?? "1",
    10
  );
  const pageRangeChirho = argsChirho.find((aChirho) => aChirho.startsWith("--pages="))?.split("=")[1];
  const singlePageChirho = argsChirho.find((aChirho) => aChirho.startsWith("--page="))?.split("=")[1];
  let pagesChirho: number[] = [];
  if (singlePageChirho) {
    pagesChirho = [parseInt(singlePageChirho, 10)];
  } else if (pageRangeChirho) {
    const pageRangePartsChirho = pageRangeChirho.split("-");
    const aChirho = Number.parseInt(pageRangePartsChirho[0] ?? "", 10);
    const bChirho = Number.parseInt(pageRangePartsChirho[1] ?? pageRangePartsChirho[0] ?? "", 10);
    if (!Number.isInteger(aChirho) || !Number.isInteger(bChirho) || aChirho > bChirho) {
      throw new Error(`invalid --pages range: ${pageRangeChirho}`);
    }
    for (let pChirho = aChirho; pChirho <= bChirho; pChirho++) pagesChirho.push(pChirho);
  } else {
    console.error("Usage: --vol=N --pages=A-B  OR  --page=N");
    process.exit(1);
  }

  console.log(`[llm-recheck] vol ${volChirho} pages ${pagesChirho[0]}-${pagesChirho[pagesChirho.length - 1]}`);
  const suspectsChirho = await gatherSuspectsChirho(volChirho, pagesChirho);
  console.log(`[llm-recheck] Found ${suspectsChirho.length} suspect tokens`);

  if (suspectsChirho.length === 0) {
    console.log("Nothing to check.");
    process.exit(0);
  }

  const { mkdirSync, existsSync } = await import("fs");
  const { join } = await import("path");
  const outDirChirho = join(process.cwd(), "workspace-chirho", "llm-recheck-chirho");
  if (!existsSync(outDirChirho)) mkdirSync(outDirChirho, { recursive: true });

  for (let iChirho = 0; iChirho < suspectsChirho.length; iChirho += BATCH_SIZE_CHIRHO) {
    const batchChirho = suspectsChirho.slice(iChirho, iChirho + BATCH_SIZE_CHIRHO);
    const batchNumChirho = String(iChirho / BATCH_SIZE_CHIRHO + 1).padStart(3, "0");
    const promptChirho = buildPromptChirho(batchChirho);
    const metaChirho = batchChirho.map((sChirho, jChirho) => ({
      iChirho: jChirho + 1,
      pageNumberChirho: sChirho.pageNumberChirho,
      lineIndexChirho: sChirho.lineIndexChirho,
      segmentIdChirho: sChirho.segmentIdChirho,
      suspectTokenChirho: sChirho.suspectTokenChirho,
      segmentTextChirho: sChirho.segmentTextChirho,
    }));
    const promptPathChirho = join(outDirChirho, `vol-${volChirho}-batch-${batchNumChirho}-prompt-chirho.txt`);
    const metaPathChirho = join(outDirChirho, `vol-${volChirho}-batch-${batchNumChirho}-meta-chirho.json`);
    writeTextAtomicChirho(promptPathChirho, promptChirho);
    writeJsonAtomicChirho(metaPathChirho, metaChirho);
    console.log(`[llm-recheck] Batch ${batchNumChirho}: ${batchChirho.length} items → ${promptPathChirho}`);
  }
  console.log(`\nNext: pass each prompt file to a subagent. Save the agent's JSON-array reply alongside the prompt as ...-verdicts-chirho.json. Then run:\n  bun src-chirho/llm-recheck-apply-chirho.ts --vol=${volChirho}`);
}
