// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Hunspell-backed French dictionary check.
 *
 * `findFrenchMissesChirho(words)` spawns hunspell once with `-d fr -l`, pipes
 * every word in a single batch, and returns the set of words it considers
 * NOT in the French dictionary. Hunspell handles conjugations, accents, and
 * apostrophe contractions natively via the affix file.
 *
 * Words considered "matched" (returned absent from the miss-set):
 *   - Real French entries (with their inflected forms)
 *   - Pure-numeric/punctuation-only tokens (hunspell silently accepts)
 *   - Single uppercase letters wrapped in punctuation (e.g. *M, [B])
 *
 * Words returned as MISSED are candidates for non-French script identification:
 *   - OCR-of-Hebrew-as-Latin gibberish (wyin7., #pnÿ, ...)
 *   - Foreign tongues (German Verschwürer, English Lowth)
 *   - Proper nouns the dictionary doesn't have (Brockington, Wildberger)
 *   - Manuscript sigla (1Q-a, 4QSama, MurXII)
 *
 * The agent reviews the misses; whatever it tags as `french-chirho` (because
 * it's a proper noun the dict didn't know) gets fed back into the
 * `known_words_chirho` table so future pages auto-accept it.
 */

import { spawn } from "child_process";

const HUNSPELL_LANG_CHIRHO = "fr";

/**
 * Spawn `hunspell -d fr -l`, pipe in the unique words, return the misses.
 * Empty input → empty Set; no spawn cost.
 */
export async function findFrenchMissesChirho(
  wordsChirho: string[]
): Promise<Set<string>> {
  const uniqueChirho = [...new Set(wordsChirho.filter((wChirho) => wChirho.length > 0))];
  if (uniqueChirho.length === 0) return new Set();

  return new Promise((resolveChirho, rejectChirho) => {
    const procChirho = spawn(
      "hunspell",
      ["-d", HUNSPELL_LANG_CHIRHO, "-i", "UTF-8", "-l"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    let stdoutChirho = "";
    let stderrChirho = "";

    procChirho.stdout.on("data", (chunkChirho: Buffer) => {
      stdoutChirho += chunkChirho.toString("utf8");
    });
    procChirho.stderr.on("data", (chunkChirho: Buffer) => {
      stderrChirho += chunkChirho.toString("utf8");
    });

    procChirho.on("error", rejectChirho);
    procChirho.on("close", (codeChirho) => {
      if (codeChirho !== 0) {
        rejectChirho(
          new Error(`hunspell exited with code ${codeChirho}: ${stderrChirho}`)
        );
        return;
      }
      const missesChirho = new Set(
        stdoutChirho.split("\n").filter((lChirho) => lChirho.length > 0)
      );
      resolveChirho(missesChirho);
    });

    // Hunspell -a/-l mode treats lines starting with command chars
    // (*, +, -, @, ~, ^, &, ?, !, #, %) as control instructions. Strip these
    // leading chars so a token like "*M" is checked as plain "M" (which the
    // sigla-as-French convention wants accepted anyway), and "#pnÿ" becomes
    // "pnÿ" which still won't be French and stays in the miss-set.
    const sanitizedChirho = uniqueChirho.map((wChirho) =>
      wChirho.replace(/^[*+\-@~^&?!#%]+/, "")
    );

    procChirho.stdin.write(sanitizedChirho.join("\n") + "\n");
    procChirho.stdin.end();
  });
}

/** CLI: pipe words via stdin or pass on argv */
if (import.meta.main) {
  const argChirho = process.argv.slice(2);
  let wordsChirho: string[];
  if (argChirho.length > 0) {
    wordsChirho = argChirho;
  } else {
    wordsChirho = (await Bun.stdin.text())
      .split(/\s+/)
      .map((wChirho) => wChirho.trim())
      .filter((wChirho) => wChirho.length > 0);
  }
  const missesChirho = await findFrenchMissesChirho(wordsChirho);
  console.log(`Checked ${wordsChirho.length} words; ${missesChirho.size} misses:`);
  for (const wChirho of missesChirho) console.log(`  ${wChirho}`);
}
