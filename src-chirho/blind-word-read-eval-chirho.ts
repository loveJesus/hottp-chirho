// For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

/**
 * Blind vision-reader evaluation against the non-circular gold set.
 *
 * Protocol (designed so the reader NEVER sees a label before reading):
 *   1. `sample` writes a blind item list (crop paths only, no gold text, no
 *      tesseract text) drawn deterministically from the GOLD_STRICT tier.
 *   2. The reader (human or vision model) looks at each crop and records a
 *      reading into a JSON array of { cropChirho, readingChirho }.
 *   3. `score` joins the locked readings with the manifest and prints
 *      consonantal exact-match and character accuracy — comparable to the
 *      CRNN's held-out gold numbers (char 0.978 / exact 0.911).
 *
 *   bun run src-chirho/blind-word-read-eval-chirho.ts sample --count-chirho=40
 *   bun run src-chirho/blind-word-read-eval-chirho.ts score --reads-chirho=<path>
 *
 * A second reader whose context has already seen the first reader's answers is
 * no longer blind on those crops, so `--exclude-chirho=<sample|reads json,...>`
 * removes already-read crops from the pool and `--label-chirho=<name>` keeps the
 * disjoint sample in its own file.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { writeJsonAtomicChirho } from "./atomic-json-chirho.ts";
import { PROJECT_ROOT_CHIRHO } from "./config-chirho.ts";

const MANIFEST_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "gold-set-chirho", "manifest-chirho.json");
const OUTPUT_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "blind-vision-eval-chirho");

interface GoldEntryChirho {
  cropChirho: string;
  goldConsonantsChirho: string;
  tierChirho: string;
  pageChirho?: number | string;
}

interface BlindItemChirho {
  indexChirho: number;
  cropChirho: string;
}

interface ReaderRecordChirho {
  cropChirho: string;
  readingChirho: string;
}

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | undefined {
  const prefixChirho = `--${nameChirho}=`;
  return argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho))?.slice(prefixChirho.length);
}

function loadGoldStrictChirho(): GoldEntryChirho[] {
  const manifestChirho = JSON.parse(readFileSync(MANIFEST_PATH_CHIRHO, "utf8")) as { goldChirho: GoldEntryChirho[] };
  return manifestChirho.goldChirho.filter((entryChirho) => entryChirho.tierChirho === "GOLD_STRICT");
}

const CROPS_DIR_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "hebrew-corpus-chirho");

function resolveCropPathChirho(cropChirho: string): string {
  if (cropChirho.startsWith("/")) return cropChirho;
  if (cropChirho.includes("/")) return join(PROJECT_ROOT_CHIRHO, cropChirho);
  return join(CROPS_DIR_CHIRHO, cropChirho);
}

// Hebrew consonantal skeleton: keep letters, drop points/accents/punctuation,
// and fold final forms to base forms — the same convention the gold set and
// the CRNN scoring use (hebrewSkeleton), so exact-match is comparable.
const FINAL_FORM_FOLDS_CHIRHO: Record<string, string> = {
  "ך": "כ",
  "ם": "מ",
  "ן": "נ",
  "ף": "פ",
  "ץ": "צ",
};

function consonantsChirho(textChirho: string): string {
  return textChirho
    .normalize("NFC")
    .split("")
    .map((chChirho) => FINAL_FORM_FOLDS_CHIRHO[chChirho] ?? chChirho)
    .filter((chChirho) => chChirho >= "א" && chChirho <= "ת")
    .join("");
}

function levenshteinChirho(aChirho: string, bChirho: string): number {
  const rowsChirho = aChirho.length + 1;
  const colsChirho = bChirho.length + 1;
  const distChirho: number[] = Array.from({ length: colsChirho }, (unusedChirho, jChirho) => jChirho);
  for (let iChirho = 1; iChirho < rowsChirho; iChirho += 1) {
    let previousDiagonalChirho = distChirho[0]!;
    distChirho[0] = iChirho;
    for (let jChirho = 1; jChirho < colsChirho; jChirho += 1) {
      const savedChirho = distChirho[jChirho]!;
      const substitutionCostChirho = aChirho[iChirho - 1] === bChirho[jChirho - 1] ? 0 : 1;
      distChirho[jChirho] = Math.min(
        distChirho[jChirho]! + 1,
        distChirho[jChirho - 1]! + 1,
        previousDiagonalChirho + substitutionCostChirho
      );
      previousDiagonalChirho = savedChirho;
    }
  }
  return distChirho[colsChirho - 1]!;
}

function loadExcludedCropsChirho(pathsCsvChirho: string | undefined): Set<string> {
  const excludedChirho = new Set<string>();
  if (pathsCsvChirho === undefined) return excludedChirho;
  const pathsChirho = pathsCsvChirho
    .split(",")
    .map((partChirho) => partChirho.trim())
    .filter((partChirho) => partChirho.length > 0);
  for (const pathChirho of pathsChirho) {
    const parsedChirho = JSON.parse(readFileSync(pathChirho, "utf8")) as unknown;
    const recordsChirho: { cropChirho?: unknown }[] = Array.isArray(parsedChirho)
      ? (parsedChirho as { cropChirho?: unknown }[])
      : ((parsedChirho as { itemsChirho?: { cropChirho?: unknown }[] }).itemsChirho ?? []);
    const beforeChirho = excludedChirho.size;
    for (const recordChirho of recordsChirho) {
      if (typeof recordChirho.cropChirho === "string") excludedChirho.add(recordChirho.cropChirho);
    }
    if (excludedChirho.size === beforeChirho) throw new Error(`exclusion file contributed no crops: ${pathChirho}`);
  }
  return excludedChirho;
}

function sampleChirho(argsChirho: string[]): void {
  const countChirho = Number.parseInt(parseArgValueChirho(argsChirho, "count-chirho") ?? "40", 10);
  const excludedCropsChirho = loadExcludedCropsChirho(parseArgValueChirho(argsChirho, "exclude-chirho"));
  const labelChirho = parseArgValueChirho(argsChirho, "label-chirho");
  if (labelChirho !== undefined && !/^[a-z0-9-]+$/.test(labelChirho)) {
    throw new Error("--label-chirho must be lowercase letters, digits or hyphens");
  }
  const goldChirho = loadGoldStrictChirho()
    .filter((entryChirho) => existsSync(resolveCropPathChirho(entryChirho.cropChirho)))
    .filter((entryChirho) => !excludedCropsChirho.has(entryChirho.cropChirho))
    .sort((aChirho, bChirho) => aChirho.cropChirho.localeCompare(bChirho.cropChirho));
  if (goldChirho.length === 0) throw new Error("no GOLD_STRICT entries with existing crops");
  if (goldChirho.length < countChirho) throw new Error("pool smaller than requested count after exclusions");
  const strideChirho = Math.max(1, Math.floor(goldChirho.length / countChirho));
  const itemsChirho: BlindItemChirho[] = [];
  for (let iChirho = 0; iChirho < goldChirho.length && itemsChirho.length < countChirho; iChirho += strideChirho) {
    itemsChirho.push({
      indexChirho: itemsChirho.length,
      cropChirho: goldChirho[iChirho]!.cropChirho,
    });
  }
  const outputNameChirho =
    labelChirho === undefined
      ? `blind-sample-${itemsChirho.length}-chirho.json`
      : `blind-sample-${itemsChirho.length}-${labelChirho}-chirho.json`;
  const outputPathChirho = join(OUTPUT_DIR_CHIRHO, outputNameChirho);
  writeJsonAtomicChirho(outputPathChirho, {
    protocolChirho: "blind: crop paths only; labels stay in the manifest until score time",
    strictPoolChirho: goldChirho.length,
    excludedCropsChirho: excludedCropsChirho.size,
    itemsChirho,
  });
  console.log(
    `pool=${goldChirho.length} excluded=${excludedCropsChirho.size} sampled=${itemsChirho.length} -> ${outputPathChirho}`
  );
  for (const itemChirho of itemsChirho) {
    console.log(`${itemChirho.indexChirho}\t${resolveCropPathChirho(itemChirho.cropChirho)}`);
  }
}

function scoreChirho(argsChirho: string[]): void {
  const readsPathChirho = parseArgValueChirho(argsChirho, "reads-chirho");
  if (readsPathChirho === undefined) throw new Error("score requires --reads-chirho=<readings json>");
  const readsChirho = JSON.parse(readFileSync(readsPathChirho, "utf8")) as ReaderRecordChirho[];
  const goldByCropChirho = new Map(loadGoldStrictChirho().map((entryChirho) => [entryChirho.cropChirho, entryChirho]));
  let exactChirho = 0;
  let charNumeratorChirho = 0;
  let charDenominatorChirho = 0;
  console.log("idx\tverdict\tgold\tread");
  for (const [indexChirho, readChirho] of readsChirho.entries()) {
    const goldChirho = goldByCropChirho.get(readChirho.cropChirho);
    if (goldChirho === undefined) throw new Error(`no GOLD_STRICT entry for ${readChirho.cropChirho}`);
    const goldConsChirho = consonantsChirho(goldChirho.goldConsonantsChirho);
    const readConsChirho = consonantsChirho(readChirho.readingChirho);
    const distanceChirho = levenshteinChirho(goldConsChirho, readConsChirho);
    const isExactChirho = distanceChirho === 0;
    if (isExactChirho) exactChirho += 1;
    charNumeratorChirho += Math.max(goldConsChirho.length, readConsChirho.length) - distanceChirho;
    charDenominatorChirho += Math.max(goldConsChirho.length, readConsChirho.length);
    console.log(`${indexChirho}\t${isExactChirho ? "EXACT" : `dist=${distanceChirho}`}\t${goldConsChirho}\t${readConsChirho}`);
  }
  const exactRateChirho = exactChirho / readsChirho.length;
  const charRateChirho = charNumeratorChirho / charDenominatorChirho;
  console.log(
    `n=${readsChirho.length} exact=${exactChirho} exactRate=${exactRateChirho.toFixed(3)} charAccuracy=${charRateChirho.toFixed(3)} (CRNN held-out gold: exact 0.911 / char 0.978)`
  );
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const modeChirho = argsChirho[0];
  if (modeChirho === "sample") {
    sampleChirho(argsChirho);
    return;
  }
  if (modeChirho === "score") {
    scoreChirho(argsChirho);
    return;
  }
  throw new Error("mode must be sample or score");
}

mainChirho();
