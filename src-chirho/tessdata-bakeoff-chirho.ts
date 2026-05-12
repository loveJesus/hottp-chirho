// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * One-page bake-off: compare tessdata_fast (homebrew default) against
 * tessdata_best (downloaded into workspace-chirho/tessdata-best-chirho) on a
 * single Barthélemy page, three configurations:
 *
 *   1. fast / -l fra              (current production)
 *   2. best / -l fra              (drop-in upgrade)
 *   3. best / -l fra+heb+grc+lat  (multi-script — what we actually want for
 *                                  the OT critical apparatus that mixes Hebrew,
 *                                  Greek, Latin, and French)
 *
 * Output: TSV-derived stats per config (word count, mean confidence, hebrew /
 * greek word counts) + side-by-side first-20-lines text dumps for eyeballing.
 *
 * Per AGENTS.md constraint: ONE page until it's working.
 */

import { runCmdChirho } from "./utils-chirho";

const PAGE_PATH_CHIRHO =
  "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/images-chirho/vol-1-chirho/page-0148-chirho.png";
const OUT_DIR_CHIRHO =
  "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/tessdata-bakeoff-chirho";
const TESSDATA_BEST_DIR_CHIRHO =
  "/Users/hallelujah/dev-chirho/friends-chirho/andrewbeth-chirho/hottp-chirho/workspace-chirho/tessdata-best-chirho";

interface TsvWordChirho {
  levelChirho: number;
  leftChirho: number;
  topChirho: number;
  widthChirho: number;
  heightChirho: number;
  confChirho: number;
  textChirho: string;
}

function parseTsvChirho(tsvChirho: string): TsvWordChirho[] {
  const rowsChirho = tsvChirho.split("\n");
  const outChirho: TsvWordChirho[] = [];
  for (let iChirho = 1; iChirho < rowsChirho.length; iChirho++) {
    const colsChirho = rowsChirho[iChirho]!.split("\t");
    if (colsChirho.length < 12) continue;
    const levelChirho = parseInt(colsChirho[0]!, 10);
    // level 5 = word
    if (levelChirho !== 5) continue;
    const textChirho = colsChirho[11]!.trim();
    if (textChirho === "") continue;
    outChirho.push({
      levelChirho,
      leftChirho: parseInt(colsChirho[6]!, 10),
      topChirho: parseInt(colsChirho[7]!, 10),
      widthChirho: parseInt(colsChirho[8]!, 10),
      heightChirho: parseInt(colsChirho[9]!, 10),
      confChirho: parseInt(colsChirho[10]!, 10),
      textChirho,
    });
  }
  return outChirho;
}

function classifyCharChirho(chChirho: string): string {
  const cChirho = chChirho.codePointAt(0)!;
  if (cChirho >= 0x0590 && cChirho <= 0x05ff) return "hebrew-chirho";
  if ((cChirho >= 0x0370 && cChirho <= 0x03ff) || (cChirho >= 0x1f00 && cChirho <= 0x1fff)) return "greek-chirho";
  if (cChirho >= 0x0700 && cChirho <= 0x074f) return "syriac-chirho";
  if (cChirho >= 0x0600 && cChirho <= 0x06ff) return "arabic-chirho";
  if ((cChirho >= 0x0041 && cChirho <= 0x024f) || (cChirho >= 0x1e00 && cChirho <= 0x1eff)) return "latin-chirho";
  return "other-chirho";
}

function wordScriptChirho(wordChirho: string): string {
  const countsChirho = new Map<string, number>();
  for (const chChirho of wordChirho) {
    const kChirho = classifyCharChirho(chChirho);
    if (kChirho === "other-chirho") continue;
    countsChirho.set(kChirho, (countsChirho.get(kChirho) ?? 0) + 1);
  }
  if (countsChirho.size === 0) return "other-chirho";
  return [...countsChirho.entries()].sort((aChirho, bChirho) => bChirho[1] - aChirho[1])[0]![0];
}

interface StatsChirho {
  configChirho: string;
  wallMsChirho: number;
  wordCountChirho: number;
  meanConfChirho: number;
  medianConfChirho: number;
  lowConfCountChirho: number; // conf < 60
  perScriptChirho: Record<string, number>;
  sampleTextChirho: string;
}

async function runConfigChirho(
  configChirho: string,
  langChirho: string,
  tessdataDirChirho: string | null
): Promise<StatsChirho> {
  const stemChirho = `${OUT_DIR_CHIRHO}/${configChirho}`;
  // `-c tessedit_create_tsv=1` instead of the `tsv` configfile shorthand so we
  // don't need a `configs/` dir under tessdata-best-chirho (the downloaded best
  // tier ships only .traineddata, no configs).
  const argsChirho = [
    "tesseract",
    PAGE_PATH_CHIRHO,
    stemChirho,
    "-l",
    langChirho,
    "--psm",
    "4",
    "-c",
    "tessedit_create_tsv=1",
  ];
  if (tessdataDirChirho) {
    argsChirho.splice(3, 0, "--tessdata-dir", tessdataDirChirho);
  }
  const t0Chirho = Date.now();
  await runCmdChirho(argsChirho);
  const wallMsChirho = Date.now() - t0Chirho;

  const tsvChirho = await Bun.file(`${stemChirho}.tsv`).text();
  const wordsChirho = parseTsvChirho(tsvChirho);
  const confsChirho = wordsChirho.map((wChirho) => wChirho.confChirho).filter((cChirho) => cChirho >= 0);
  const meanConfChirho =
    confsChirho.length === 0 ? 0 : confsChirho.reduce((aChirho, bChirho) => aChirho + bChirho, 0) / confsChirho.length;
  const sortedChirho = [...confsChirho].sort((aChirho, bChirho) => aChirho - bChirho);
  const medianConfChirho = sortedChirho.length === 0 ? 0 : sortedChirho[Math.floor(sortedChirho.length / 2)]!;
  const lowConfCountChirho = confsChirho.filter((cChirho) => cChirho < 60).length;
  const perScriptChirho: Record<string, number> = {};
  for (const wChirho of wordsChirho) {
    const sChirho = wordScriptChirho(wChirho.textChirho);
    perScriptChirho[sChirho] = (perScriptChirho[sChirho] ?? 0) + 1;
  }
  const sampleTextChirho = wordsChirho
    .slice(0, 40)
    .map((wChirho) => wChirho.textChirho)
    .join(" ");

  return {
    configChirho,
    wallMsChirho,
    wordCountChirho: wordsChirho.length,
    meanConfChirho: Math.round(meanConfChirho * 10) / 10,
    medianConfChirho,
    lowConfCountChirho,
    perScriptChirho,
    sampleTextChirho,
  };
}

async function mainChirho(): Promise<void> {
  const configsChirho: { configChirho: string; langChirho: string; tessdataDirChirho: string | null }[] = [
    { configChirho: "fast-fra-chirho", langChirho: "fra", tessdataDirChirho: null },
    { configChirho: "best-fra-chirho", langChirho: "fra", tessdataDirChirho: TESSDATA_BEST_DIR_CHIRHO },
    {
      configChirho: "best-multi-chirho",
      langChirho: "fra+heb+grc+lat",
      tessdataDirChirho: TESSDATA_BEST_DIR_CHIRHO,
    },
  ];

  const statsChirho: StatsChirho[] = [];
  for (const cfgChirho of configsChirho) {
    console.log(`[bakeoff-chirho] running ${cfgChirho.configChirho}…`);
    statsChirho.push(await runConfigChirho(cfgChirho.configChirho, cfgChirho.langChirho, cfgChirho.tessdataDirChirho));
  }

  console.log("\n=== bake-off summary ===");
  console.log("page:", PAGE_PATH_CHIRHO);
  for (const sChirho of statsChirho) {
    console.log(`\n[${sChirho.configChirho}]`);
    console.log(`  wall-time: ${sChirho.wallMsChirho} ms`);
    console.log(`  words:     ${sChirho.wordCountChirho}`);
    console.log(`  mean conf: ${sChirho.meanConfChirho}`);
    console.log(`  median:    ${sChirho.medianConfChirho}`);
    console.log(`  <60 conf:  ${sChirho.lowConfCountChirho}`);
    console.log(`  scripts:   ${JSON.stringify(sChirho.perScriptChirho)}`);
    console.log(`  sample:    ${sChirho.sampleTextChirho.slice(0, 220)}`);
  }

  await Bun.write(`${OUT_DIR_CHIRHO}/summary-chirho.json`, JSON.stringify(statsChirho, null, 2));
  console.log(`\nwrote ${OUT_DIR_CHIRHO}/summary-chirho.json`);
}

mainChirho().catch((errChirho) => {
  console.error(errChirho);
  process.exit(1);
});
