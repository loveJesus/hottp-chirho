// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Combined classifier deciding whether each word in a page's tesseract/pdftotext
 * output is "french-chirho" (auto-accept, no agent review) or a "candidate" for
 * Pass C agent review.
 *
 * Cascade (first match wins; remaining words fall through to candidate set):
 *   1. Hunspell French dict (handles conjugations + accented forms via affix file)
 *   2. Citation/sigla regex (biblical book abbrevs, all-caps acronyms,
 *      letter+digit refs like J2/BH3, Qumran-style 4Q-h, chapter:verse like 8,12)
 *   3. Broader Latin Hunspell pass — for digital-PDF Latin font hints only,
 *      auto-accept obvious English/German/Latin scholarly prose as
 *      latin-non-french downstream. Latin proper is min-length guarded because
 *      short forms collide with mis-OCR'd non-Latin fragments.
 *   4. Hyphenation pair detection — a word ending "-" plus the first word of
 *      the next line concatenate into a real French word (e.g. "permuta-" +
 *      "tion" = permutation)
 *   5. known_words_chirho — dynamic dict the agent / human appends to during
 *      review; entries are global (volume_number_chirho = 0) or per-volume.
 *
 * Designed to run once per page: takes ALL words from ALL lines as input,
 * does a single hunspell batch (including hyphenation joins), returns a Set
 * of word-instances flagged as candidates.
 */

import { spawn } from "child_process";

import { dbChirho } from "./db-chirho.ts";
import { knownWordsChirho } from "./schema-db-chirho.ts";
import { eq, or } from "drizzle-orm";

/** Word entry as stored in scanlines_chirho.words_json_chirho. */
export interface WordWithBboxChirho {
  textChirho: string;
  xMinChirho: number;
  yMinChirho: number;
  xMaxChirho: number;
  yMaxChirho: number;
  /** Optional deterministic script tag from PDF font analysis. When present
   *  and non-latin, the classifier short-circuits straight to candidate. */
  scriptHintChirho?: string;
}

/** A line passed to the classifier, with its sequence-of-words. */
export interface LineForClassifyChirho {
  lineIndexChirho: number;
  wordsChirho: WordWithBboxChirho[];
}

/** Why a word landed where it landed. Useful for diagnostics. */
export type ClassifyReasonChirho =
  | "hunspell-chirho"
  | "citation-chirho"
  | "hyphenation-chirho"
  | "known-words-chirho"
  | "latin-hunspell-chirho"
  | "candidate-chirho";

/** Per-word classification result. */
export interface WordClassChirho {
  lineIndexChirho: number;
  wordIndexChirho: number;
  textChirho: string;
  reasonChirho: ClassifyReasonChirho;
}

/**
 * Citation / sigla patterns — ANY match auto-accepts as French even if hunspell
 * missed. Anchored to start/end. Order doesn't matter; first match wins.
 *
 * Coverage:
 *   - 1-3 letter capitalized abbrevs:  Is, Jr, Ez, Jb, Ps, Pr, Qo, Ct, Lm, Dn,
 *     Phm, Esd, Jos, etc.
 *   - All-caps 2-5 letter acronyms:    NEB, RL, BHS, BH2, BH3, LXX, TOB, NRSV
 *   - Letter+digit sigla:              J1, J2, J123, M1, BH2, M1a
 *   - Digit-led manuscript names:      1Q-a, 4Q-h, 4QSama, 4QIsa-a, 11QPs
 *   - Chapter:verse refs:              8,12; 17,1A; 8,12-14; 12.5
 */
const CITATION_PATTERNS_CHIRHO = [
  /^[A-Z][a-z]{0,2}$/,                    // Is, Jr, Ez, Esd, Phm
  /^[A-Z]{2,5}$/,                         // NEB, BHS, LXX, TOB
  /^[A-Z]+\d+[a-z]?$/,                    // J1, BH2, M1a
  /^\d+Q[A-Za-z\-]+$/,                    // 1Q-a, 4QSama, 4Q-h
  /^\d+(?:[,.\-:]\d+)*[A-Za-z]?(?:-[A-Za-z\d]+)?$/, // 8,12; 17,1A; 8,12-14
];

function matchesCitationChirho(textChirho: string): boolean {
  for (const patternChirho of CITATION_PATTERNS_CHIRHO) {
    if (patternChirho.test(textChirho)) return true;
  }
  return false;
}

/**
 * Tokens that LOOK like garbled non-Latin glyphs even though hunspell would
 * tolerate them as numbers/punctuation. Forces them through to the agent so
 * Hebrew/Greek/etc. that tesseract or pdftotext fragmented into digits/control
 * chars don't slip past the candidate filter.
 *
 * Examples we want to flag (real failures observed on vol 1 p149):
 *   "17922", "772", "122," — pure-digit Hebrew-rendered-as-Latin
 *   "?n?n", "On?"           — control-char-laden tesseract output for Hebrew
 *   "0C", "Í!"             — vol 5 fragmented Hebrew (font-aware path also catches)
 *
 * What we DON'T want to flag (citation regex runs first):
 *   "1Q-a", "BH3", "8,12", "8" — citation patterns
 */
const SUSPICIOUS_NONLATIN_PATTERNS_CHIRHO: RegExp[] = [
  /^\d{4,}[,.;:]?$/,        // 4+ pure digits, optional trailing punct
  /[?$#&%@]/,               // control-ish chars rarely in real French text
  /^[a-zA-Z]\d/,            // letter then digit (e.g. "J0C", "n7")
];
function isSuspiciousNonLatinChirho(textChirho: string): boolean {
  for (const patChirho of SUSPICIOUS_NONLATIN_PATTERNS_CHIRHO) {
    if (patChirho.test(textChirho)) return true;
  }
  return false;
}

/**
 * Strip leading/trailing non-letter/non-digit characters so the hunspell miss-set
 * lookup sees the same token hunspell saw internally. Hunspell's tokenizer
 * splits on punctuation: a token like `Fallstrick"'.` becomes [`Fallstrick`, `'.`]
 * and only those fragments appear in the `-l` output. Without this strip, our
 * lookup with the glued original would silently match nothing → false-accept.
 *
 * Internal apostrophes (qu'il, s'en) and internal hyphens (Tur-Sinai) are
 * preserved because they sit between letters, not at the boundaries.
 */
function sanitizeForHunspellChirho(textChirho: string): string {
  return textChirho
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "");
}

/**
 * Spawn hunspell once with `-l` (list-only-misses), pipe ALL words on the page,
 * return the set of strings that hunspell DID NOT recognize.
 */
const FRENCH_HUNSPELL_LANG_CHIRHO = "fr";
const BROADER_LATIN_HUNSPELL_LANG_CHIRHO = "en_US,en_GB,de_DE";
const LATIN_LANGUAGE_HUNSPELL_LANG_CHIRHO = "la";
const LATIN_LANGUAGE_MIN_LENGTH_CHIRHO = 4;

async function hunspellMissesForDictionaryChirho(
  dictionaryChirho: string,
  wordsChirho: string[]
): Promise<Set<string>> {
  const uniqueChirho = [...new Set(wordsChirho.filter((wChirho) => wChirho.length > 0))];
  if (uniqueChirho.length === 0) return new Set();

  return new Promise((resolveChirho, rejectChirho) => {
    const procChirho = spawn(
      "hunspell",
      ["-d", dictionaryChirho, "-i", "UTF-8", "-l"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    let outChirho = "";
    let errChirho = "";
    procChirho.stdout.on("data", (chunkChirho: Buffer) => {
      outChirho += chunkChirho.toString("utf8");
    });
    procChirho.stderr.on("data", (chunkChirho: Buffer) => {
      errChirho += chunkChirho.toString("utf8");
    });
    procChirho.on("error", rejectChirho);
    procChirho.on("close", (codeChirho) => {
      if (codeChirho !== 0) {
        rejectChirho(
          new Error(
            `hunspell ${codeChirho} for dictionary ${dictionaryChirho}: ${errChirho}`
          )
        );
        return;
      }
      resolveChirho(
        new Set(outChirho.split("\n").filter((lChirho) => lChirho.length > 0))
      );
    });
    procChirho.stdin.write(
      uniqueChirho.map(sanitizeForHunspellChirho).join("\n") + "\n"
    );
    procChirho.stdin.end();
  });
}

/**
 * Pre-scan: identify (line N last word ends in '-') paired with (line N+1 first
 * word) such that joining the stem ("permuta") + first ("tion") forms a real
 * French word ("permutation"). Returns the set of (lineIndex, wordIndex) pairs
 * to auto-accept as `hyphenation-chirho`.
 */
function findHyphenationPairsChirho(
  linesChirho: LineForClassifyChirho[],
  hunspellAcceptedChirho: (sChirho: string) => boolean
): Set<string> {
  const pairsChirho = new Set<string>();
  for (let iChirho = 0; iChirho < linesChirho.length - 1; iChirho++) {
    const lineChirho = linesChirho[iChirho]!;
    const nextLineChirho = linesChirho[iChirho + 1]!;
    if (lineChirho.wordsChirho.length === 0) continue;
    if (nextLineChirho.wordsChirho.length === 0) continue;

    const lastWordChirho = lineChirho.wordsChirho[lineChirho.wordsChirho.length - 1]!;
    const lastTextChirho = lastWordChirho.textChirho;
    if (!lastTextChirho.endsWith("-")) continue;

    const stemChirho = lastTextChirho.slice(0, -1);
    if (stemChirho.length === 0) continue;

    const nextFirstWordChirho = nextLineChirho.wordsChirho[0]!;
    const joinedChirho = stemChirho + nextFirstWordChirho.textChirho;

    if (hunspellAcceptedChirho(joinedChirho)) {
      pairsChirho.add(`${lineChirho.lineIndexChirho}:${lineChirho.wordsChirho.length - 1}`);
      pairsChirho.add(`${nextLineChirho.lineIndexChirho}:0`);
    }
  }
  return pairsChirho;
}

/**
 * Load the dynamic known-words dict for a given volume (and globals).
 * Returns a Set of normalized (lowercased) word strings for fast lookup.
 */
async function loadKnownWordsChirho(volumeNumberChirho: number): Promise<Set<string>> {
  const rowsChirho = await dbChirho
    .select({ wordChirho: knownWordsChirho.wordChirho })
    .from(knownWordsChirho)
    .where(
      or(
        eq(knownWordsChirho.volumeNumberChirho, 0),
        eq(knownWordsChirho.volumeNumberChirho, volumeNumberChirho)
      )
    );
  return new Set(rowsChirho.map((rChirho) => rChirho.wordChirho));
}

/**
 * Classify every word in every line of a page. Returns one entry per word.
 */
export async function classifyPageChirho(
  volumeNumberChirho: number,
  linesChirho: LineForClassifyChirho[]
): Promise<WordClassChirho[]> {
  // Collect all words + all hyphenation-join candidates for ONE batched
  // hunspell call.
  const wordsForHunspellChirho: string[] = [];
  for (const lineChirho of linesChirho) {
    for (const wChirho of lineChirho.wordsChirho) {
      wordsForHunspellChirho.push(wChirho.textChirho);
    }
  }
  for (let iChirho = 0; iChirho < linesChirho.length - 1; iChirho++) {
    const curChirho = linesChirho[iChirho]!;
    const nxtChirho = linesChirho[iChirho + 1]!;
    if (curChirho.wordsChirho.length === 0 || nxtChirho.wordsChirho.length === 0) continue;
    const lastChirho = curChirho.wordsChirho[curChirho.wordsChirho.length - 1]!;
    if (!lastChirho.textChirho.endsWith("-")) continue;
    const stemChirho = lastChirho.textChirho.slice(0, -1);
    wordsForHunspellChirho.push(stemChirho + nxtChirho.wordsChirho[0]!.textChirho);
  }

  const missSetChirho = await hunspellMissesForDictionaryChirho(
    FRENCH_HUNSPELL_LANG_CHIRHO,
    wordsForHunspellChirho
  );
  const broaderLatinMissSetChirho = await hunspellMissesForDictionaryChirho(
    BROADER_LATIN_HUNSPELL_LANG_CHIRHO,
    [...missSetChirho]
  );
  const latinLanguageMissSetChirho = await hunspellMissesForDictionaryChirho(
    LATIN_LANGUAGE_HUNSPELL_LANG_CHIRHO,
    [...missSetChirho]
  );
  const hunspellAcceptedChirho = (sChirho: string) =>
    !missSetChirho.has(sanitizeForHunspellChirho(sChirho));

  const hyphenationSetChirho = findHyphenationPairsChirho(
    linesChirho,
    hunspellAcceptedChirho
  );

  const knownWordsSetChirho = await loadKnownWordsChirho(volumeNumberChirho);

  const resultChirho: WordClassChirho[] = [];
  for (const lineChirho of linesChirho) {
    for (let wiChirho = 0; wiChirho < lineChirho.wordsChirho.length; wiChirho++) {
      const wChirho = lineChirho.wordsChirho[wiChirho]!;
      const sanitizedChirho = sanitizeForHunspellChirho(wChirho.textChirho);
      let reasonChirho: ClassifyReasonChirho;
      // Highest-priority short-circuit: if the PDF font analysis already
      // tagged this word as a non-Latin script, it goes straight to the agent.
      // (Latin and missing hints fall through to the normal cascade.)
      if (
        wChirho.scriptHintChirho &&
        wChirho.scriptHintChirho !== "latin-chirho" &&
        wChirho.scriptHintChirho !== "symbol-chirho"
      ) {
        reasonChirho = "candidate-chirho";
      } else if (matchesCitationChirho(wChirho.textChirho) || matchesCitationChirho(sanitizedChirho)) {
        // Citation patterns run BEFORE the suspicious-token check so things like
        // 1Q-a / 4QSama / BH3 (matching citation) don't get pushed to the agent.
        reasonChirho = "citation-chirho";
      } else if (isSuspiciousNonLatinChirho(wChirho.textChirho)) {
        // Hunspell silently tolerates pure-digit tokens and control-char-laden
        // tokens, but those are usually fragmented non-Latin glyphs we WANT
        // the agent to look at.
        reasonChirho = "candidate-chirho";
      } else if (!missSetChirho.has(sanitizedChirho)) {
        reasonChirho = "hunspell-chirho";
      } else if (
        wChirho.scriptHintChirho === "latin-chirho" &&
        (!broaderLatinMissSetChirho.has(sanitizedChirho) ||
          (sanitizedChirho.length >= LATIN_LANGUAGE_MIN_LENGTH_CHIRHO &&
            !latinLanguageMissSetChirho.has(sanitizedChirho)))
      ) {
        reasonChirho = "latin-hunspell-chirho";
      } else if (hyphenationSetChirho.has(`${lineChirho.lineIndexChirho}:${wiChirho}`)) {
        reasonChirho = "hyphenation-chirho";
      } else if (knownWordsSetChirho.has(wChirho.textChirho)) {
        reasonChirho = "known-words-chirho";
      } else {
        reasonChirho = "candidate-chirho";
      }
      resultChirho.push({
        lineIndexChirho: lineChirho.lineIndexChirho,
        wordIndexChirho: wiChirho,
        textChirho: wChirho.textChirho,
        reasonChirho,
      });
    }
  }
  return resultChirho;
}
