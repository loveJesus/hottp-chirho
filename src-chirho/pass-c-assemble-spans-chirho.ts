// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Phase C of Pass C v2 — assemble line spans deterministically.
 *
 * Inputs:
 *   - workspace-chirho/pass-c-context-chirho/vol-N-chirho/page-NNNN-chirho.json
 *     (per-word marker FRENCH-AUTO / CANDIDATE + tesseract bboxes from Phase A)
 *   - workspace-chirho/pass-c-verdicts-chirho/vol-N-chirho/page-NNNN-chirho/line-LLL-chirho.json
 *     (per-line candidate verdicts from the agent)
 *
 * For each line:
 *   1. Compute every word's scriptChirho:
 *        FRENCH-AUTO words → "french-chirho"
 *        CANDIDATE words   → agent verdict's scriptChirho
 *   2. Walk words left-to-right; group consecutive same-script words into spans.
 *   3. Tile [0, lineWidth] with no gaps/overlaps:
 *        span[0].xMin   = 0
 *        span[k].xMax   = span[k+1].xMin = first-word-of-next-span.xLoc
 *        span[last].xMax = lineWidth
 *   4. utf8 text:
 *        French span → " ".join(tesseract text of words in span)
 *        Non-French span → " ".join(agent utf8TextChirho of words in span)
 *
 * Side effect: agent verdicts with `addToKnownWordsChirho: true` insert into
 * known_words_chirho with status `agent-pending-chirho` (idempotent via
 * conflict-on-conflict-do-nothing semantics).
 *
 * Outputs:
 *   - workspace-chirho/spans-chirho/vol-N-chirho/page-NNNN-chirho/line-LLL-chirho.json
 *
 * CLI: bun src-chirho/pass-c-assemble-spans-chirho.ts --vol=2 --page=150
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";
import {
  initDbChirho,
  sqliteChirho,
  logStepStartChirho,
  logStepEndChirho,
} from "./db-chirho.ts";

const MODULE_CHIRHO = "pass-c-assemble-spans-chirho";
const AGENT_CODE_CHIRHO = "pass-c-assemble-spans-chirho";

function logChirhoLocalChirho(msgChirho: string): void {
  // eslint-disable-next-line no-console
  console.warn(`[${MODULE_CHIRHO}] ${msgChirho}`);
}

/**
 * RTL handling: agents tend to assign per-tesseract-bbox utf8 in visual
 * left-to-right order (word at lowest xMin gets the leftmost-rendering Hebrew
 * word). For Hebrew/Syriac/Arabic, semantic reading order is right-to-left,
 * so we REVERSE the per-word slice before joining — yielding utf8 in semantic
 * order, which the browser then bidi-renders back to match the source page.
 *
 * Empirically validated against vol 1 p148 line 41 ("ברית יהוה") and
 * vol 1 p149 line 36 ("בעברו בירדן נכרתו מי הירדן"). Single-word RTL spans
 * are unaffected (reversing a 1-element list is a no-op).
 */
const RTL_SCRIPTS_CHIRHO = new Set<string>([
  "hebrew-chirho",
  "syriac-chirho",
  "arabic-chirho",
]);

/** Leading/trailing punctuation we want to preserve on a non-French word's
 *  utf8 text from the ORIGINAL tesseract/pdftotext token. The agent often
 *  drops opening/closing quote marks when it transcribes; we restore them so
 *  citation text like "verschwört euch" keeps its quotes in the reconstruction. */
const PRESERVE_BOUNDARY_PUNCT_RE_CHIRHO = /^[«"'‘’“”\(\[\{]+|[«"'‘’“”\)\]\}]+$/gu;
function extractLeadingPunctChirho(textChirho: string): string {
  const matchChirho = textChirho.match(/^[«"'‘’“”\(\[\{]+/u);
  return matchChirho ? matchChirho[0] : "";
}
function extractTrailingPunctChirho(textChirho: string): string {
  const matchChirho = textChirho.match(/[«"'‘’“”\)\]\}]+$/u);
  return matchChirho ? matchChirho[0] : "";
}
// Reference to swallow the lint warning if the combined regex is unused.
void PRESERVE_BOUNDARY_PUNCT_RE_CHIRHO;

const CONTEXT_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-context-chirho"
);
const VERDICTS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "pass-c-verdicts-chirho"
);
const SPANS_DIR_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho"
);

interface ContextWordChirho {
  wordIndexChirho: number;
  textChirho: string;
  xLocChirho: number;
  widthChirho: number;
  markerChirho: "FRENCH-AUTO" | "CANDIDATE";
}

interface ContextLineChirho {
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  wordsChirho: ContextWordChirho[];
}

interface PageContextChirho {
  volumeChirho: number;
  pageChirho: number;
  pageIdChirho: number;
  linesChirho: ContextLineChirho[];
}

interface CandidateVerdictChirho {
  wordIndexChirho?: number;
  candidateIndexChirho?: number;
  scriptChirho: string;
  utf8TextChirho: string | null;
  addToKnownWordsChirho?: boolean;
  knownWordCategoryChirho?: string | null;
}

interface LineVerdictsChirho {
  lineIndexChirho: number;
  agentChirho?: string;
  candidateVerdictsChirho: CandidateVerdictChirho[];
}

interface OutSpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
}

interface OutLineChirho {
  schemaVersionChirho: 2;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  agentChirho: string;
  spansChirho: OutSpanChirho[];
}

function candidateWordIndexChirho(verdictChirho: CandidateVerdictChirho): number | null {
  return verdictChirho.wordIndexChirho ?? verdictChirho.candidateIndexChirho ?? null;
}

function assembleLineSpansChirho(
  ctxLineChirho: ContextLineChirho,
  verdictsByWordChirho: Map<number, CandidateVerdictChirho>,
  agentNameChirho: string,
  volumeChirho: number,
  pageChirho: number
): OutLineChirho {
  const wordsChirho = ctxLineChirho.wordsChirho;
  if (wordsChirho.length === 0) {
    return {
      schemaVersionChirho: 2,
      volumeChirho,
      pageChirho,
      lineIndexChirho: ctxLineChirho.lineIndexChirho,
      lineWidthPxChirho: ctxLineChirho.lineWidthPxChirho,
      lineHeightPxChirho: ctxLineChirho.lineHeightPxChirho,
      agentChirho: agentNameChirho,
      spansChirho: [
        {
          segmentIndexChirho: 0,
          xMinPxChirho: 0,
          widthPxChirho: ctxLineChirho.lineWidthPxChirho,
          scriptChirho: "french-chirho",
          utf8TextChirho: "",
        },
      ],
    };
  }

  // Per-word effective script
  const wordScriptsChirho: string[] = wordsChirho.map((wChirho) => {
    if (wChirho.markerChirho === "FRENCH-AUTO") return "french-chirho";
    const verdictChirho = verdictsByWordChirho.get(wChirho.wordIndexChirho);
    return verdictChirho?.scriptChirho ?? "unknown-chirho";
  });

  // Per-word effective text. For non-French words: take the agent's UTF-8
  // transcription, strip trailing French sentence punctuation (`.`, `,`, `;`,
  // `:`, `!`, `?`) that tesseract glued to the bbox, BUT restore any opening/
  // closing brackets/quote marks the original tesseract token had (the agent
  // often drops these when transcribing).
  const wordTextsChirho: string[] = wordsChirho.map((wChirho, iChirho) => {
    if (wordScriptsChirho[iChirho] === "french-chirho" || wChirho.markerChirho === "FRENCH-AUTO") {
      return wChirho.textChirho;
    }
    const verdictChirho = verdictsByWordChirho.get(wChirho.wordIndexChirho);
    if (verdictChirho?.scriptChirho === "symbol-chirho") {
      return (verdictChirho.utf8TextChirho ?? wChirho.textChirho).trim();
    }
    const agentRawChirho = verdictChirho?.utf8TextChirho ?? wChirho.textChirho;
    const strippedChirho = agentRawChirho
      .replace(/^[«"'‘’“”\(\[\{\s]+/u, "")
      .replace(/[.,;:!?\s]+$/u, "")
      .replace(/[«"'‘’“”\)\]\}]+$/u, "");
    const leadingPunctChirho = extractLeadingPunctChirho(wChirho.textChirho);
    const trailingPunctChirho = extractTrailingPunctChirho(wChirho.textChirho);
    return `${leadingPunctChirho}${strippedChirho}${trailingPunctChirho}`;
  });

  // Group consecutive same-script words into spans
  const spansChirho: OutSpanChirho[] = [];
  let curScriptChirho = wordScriptsChirho[0]!;
  let curStartIdxChirho = 0;
  const closeSpanChirho = (
    endExclusiveChirho: number,
    spanXMaxChirho: number
  ): void => {
    const spanXMinChirho =
      spansChirho.length === 0 ? 0 : wordsChirho[curStartIdxChirho]!.xLocChirho;
    let textsChirho = wordTextsChirho.slice(
      curStartIdxChirho,
      endExclusiveChirho
    );
    // RTL fix: agent's per-word utf8 is in semantic reading order. When we walk
    // L→R bbox-wise and the script is RTL, reverse the word slice so the joined
    // text reads right-to-left correctly.
    if (RTL_SCRIPTS_CHIRHO.has(curScriptChirho)) textsChirho = [...textsChirho].reverse();
    spansChirho.push({
      segmentIndexChirho: spansChirho.length,
      xMinPxChirho: spanXMinChirho,
      widthPxChirho: Math.max(1, spanXMaxChirho - spanXMinChirho),
      scriptChirho: curScriptChirho,
      utf8TextChirho: textsChirho.join(" ").trim(),
    });
  };
  for (let iChirho = 1; iChirho < wordsChirho.length; iChirho++) {
    if (wordScriptsChirho[iChirho] !== curScriptChirho) {
      closeSpanChirho(iChirho, wordsChirho[iChirho]!.xLocChirho);
      curScriptChirho = wordScriptsChirho[iChirho]!;
      curStartIdxChirho = iChirho;
    }
  }
  closeSpanChirho(wordsChirho.length, ctxLineChirho.lineWidthPxChirho);

  return {
    schemaVersionChirho: 2,
    volumeChirho,
    pageChirho,
    lineIndexChirho: ctxLineChirho.lineIndexChirho,
    lineWidthPxChirho: ctxLineChirho.lineWidthPxChirho,
    lineHeightPxChirho: ctxLineChirho.lineHeightPxChirho,
    agentChirho: agentNameChirho,
    spansChirho,
  };
}

/** Insert (or skip if already present) a known_words_chirho entry. */
function upsertKnownWordChirho(
  wordChirho: string,
  categoryChirho: string,
  volumeNumberChirho: number,
  sourcePageIdChirho: number,
  sourceLineIndexChirho: number,
  addedByChirho: string
): "inserted" | "exists" {
  const existsChirho = sqliteChirho
    .query(
      `SELECT id_chirho FROM known_words_chirho
       WHERE word_chirho = ? AND volume_number_chirho = ?`
    )
    .get(wordChirho, volumeNumberChirho);
  if (existsChirho) return "exists";
  sqliteChirho.run(
    `INSERT INTO known_words_chirho
       (word_chirho, category_chirho, volume_number_chirho, status_chirho,
        source_page_id_chirho, source_line_index_chirho, added_by_chirho)
     VALUES (?, ?, ?, 'agent-pending-chirho', ?, ?, ?)`,
    [
      wordChirho,
      categoryChirho,
      volumeNumberChirho,
      sourcePageIdChirho,
      sourceLineIndexChirho,
      addedByChirho,
    ]
  );
  return "inserted";
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

  const stepIdChirho = logStepStartChirho(
    AGENT_CODE_CHIRHO,
    `Pass C v2 assemble: vol ${volChirho} p${pageChirho}`
  );

  try {
    const contextPathChirho = join(
      CONTEXT_DIR_CHIRHO,
      `vol-${volChirho}-chirho`,
      `page-${String(pageChirho).padStart(4, "0")}-chirho.json`
    );
    if (!existsSync(contextPathChirho)) {
      throw new Error(
        `Context not found: ${contextPathChirho}. Run pass-c-build-context-chirho first.`
      );
    }
    const contextChirho: PageContextChirho = JSON.parse(
      readFileSync(contextPathChirho, "utf8")
    );

    const verdictsDirChirho = join(
      VERDICTS_DIR_CHIRHO,
      `vol-${volChirho}-chirho`,
      `page-${String(pageChirho).padStart(4, "0")}-chirho`
    );

    const spansDirChirho = join(
      SPANS_DIR_CHIRHO,
      `vol-${volChirho}-chirho`,
      `page-${String(pageChirho).padStart(4, "0")}-chirho`
    );
    if (!existsSync(spansDirChirho)) {
      mkdirSync(spansDirChirho, { recursive: true });
    } else {
      // Wipe stale per-line span files so a re-run with fewer lines doesn't
      // leave previous-run output behind (which would pollute reconstruction).
      for (const fnChirho of readdirSync(spansDirChirho)) {
        if (/^line-\d+-chirho\.json$/.test(fnChirho)) {
          rmSync(join(spansDirChirho, fnChirho));
        }
      }
    }

    let writtenChirho = 0;
    let missingVerdictsChirho = 0;
    let knownInsertedChirho = 0;
    let knownExistedChirho = 0;

    for (const lineChirho of contextChirho.linesChirho) {
      const verdictsPathChirho = join(
        verdictsDirChirho,
        `line-${String(lineChirho.lineIndexChirho).padStart(3, "0")}-chirho.json`
      );

      let verdictsChirho: LineVerdictsChirho;
      if (existsSync(verdictsPathChirho)) {
        try {
          const parsedChirho = JSON.parse(readFileSync(verdictsPathChirho, "utf8"));
          if (!parsedChirho || !Array.isArray(parsedChirho.candidateVerdictsChirho)) {
            logChirhoLocalChirho(
              `WARN: ${verdictsPathChirho} missing/invalid candidateVerdictsChirho — treating as empty`
            );
            verdictsChirho = {
              lineIndexChirho: lineChirho.lineIndexChirho,
              candidateVerdictsChirho: [],
            };
          } else {
            verdictsChirho = parsedChirho as LineVerdictsChirho;
          }
        } catch (errChirho) {
          logChirhoLocalChirho(
            `WARN: ${verdictsPathChirho} JSON parse failed (${errChirho}) — treating as empty`
          );
          verdictsChirho = {
            lineIndexChirho: lineChirho.lineIndexChirho,
            candidateVerdictsChirho: [],
          };
        }
      } else {
        // No verdicts file means the line had zero candidates — generate an
        // all-FRENCH placeholder so the visualizer still has spans for it.
        const candidateCountChirho = lineChirho.wordsChirho.filter(
          (wChirho) => wChirho.markerChirho === "CANDIDATE"
        ).length;
        if (candidateCountChirho > 0) missingVerdictsChirho++;
        verdictsChirho = {
          lineIndexChirho: lineChirho.lineIndexChirho,
          candidateVerdictsChirho: [],
        };
      }

      const verdictByWordChirho = new Map<number, CandidateVerdictChirho>();
      for (const vChirho of verdictsChirho.candidateVerdictsChirho) {
        const wordIndexChirho = candidateWordIndexChirho(vChirho);
        if (wordIndexChirho !== null) verdictByWordChirho.set(wordIndexChirho, vChirho);
      }

      const outChirho = assembleLineSpansChirho(
        lineChirho,
        verdictByWordChirho,
        verdictsChirho.agentChirho ?? "auto-french-chirho",
        contextChirho.volumeChirho,
        contextChirho.pageChirho
      );

      const outPathChirho = join(
        spansDirChirho,
        `line-${String(lineChirho.lineIndexChirho).padStart(3, "0")}-chirho.json`
      );
      await Bun.write(outPathChirho, JSON.stringify(outChirho, null, 2));
      writtenChirho++;

      // Auto-add to known_words_chirho where the agent confirmed a French word
      // hunspell missed (proper nouns, abbreviations, loanwords).
      for (const verdictChirho of verdictsChirho.candidateVerdictsChirho) {
        if (
          verdictChirho.scriptChirho === "french-chirho" &&
          verdictChirho.addToKnownWordsChirho === true
        ) {
          const wordIndexChirho = candidateWordIndexChirho(verdictChirho);
          if (wordIndexChirho === null) continue;
          const wordChirho = lineChirho.wordsChirho.find(
            (wChirho) => wChirho.wordIndexChirho === wordIndexChirho
          );
          if (!wordChirho) continue;
          const resultChirho = upsertKnownWordChirho(
            wordChirho.textChirho,
            verdictChirho.knownWordCategoryChirho ?? "unknown-chirho",
            contextChirho.volumeChirho,
            contextChirho.pageIdChirho,
            lineChirho.lineIndexChirho,
            verdictsChirho.agentChirho ?? "pass-c-v2-chirho"
          );
          if (resultChirho === "inserted") knownInsertedChirho++;
          else knownExistedChirho++;
        }
      }
    }

    console.log(
      `\nPass C v2 assemble — vol ${volChirho} p${pageChirho}\n` +
        `  Lines written: ${writtenChirho} / ${contextChirho.linesChirho.length}\n` +
        `  Missing verdict files (still classified all-french): ${missingVerdictsChirho}\n` +
        `  known_words_chirho inserted: ${knownInsertedChirho}, already-present: ${knownExistedChirho}\n` +
        `  Output dir: ${spansDirChirho}`
    );

    logStepEndChirho(
      stepIdChirho,
      `Wrote ${writtenChirho} span files, inserted ${knownInsertedChirho} known_words.`,
      `Pass C v2 spans assembled with ${missingVerdictsChirho} missing-verdict gaps.`
    );
  } catch (errChirho) {
    logStepEndChirho(stepIdChirho, `Error: ${errChirho}`, `Pass C v2 assembly failed.`);
    throw errChirho;
  }
}
