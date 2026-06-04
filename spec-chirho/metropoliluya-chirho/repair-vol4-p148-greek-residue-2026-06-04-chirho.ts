// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 4 p148 Greek residue around Ps 18 / 2 Sam 22.
 *
 * Scanline review confirmed several French-looking residue spans are Greek:
 * - line 2 `Tût 6@` is `τῷ θεῷ`,
 * - line 9 `Kai` is `καὶ` and `8e pou` is `θεῷ μου`,
 * - line 10 `uové£wvos [` contains Greek `μονόζωνος` plus an apparatus sign.
 *
 * Repaired spans stay vision-tier and require expert confirmation.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol4-p148-greek-residue-2026-06-04-chirho";
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const L2_PATH_CHIRHO = spanLinePathChirho(4, 148, 2);
const L9_PATH_CHIRHO = spanLinePathChirho(4, 148, 9);
const L10_PATH_CHIRHO = spanLinePathChirho(4, 148, 10);

const L2_SEG2_TEXT_CHIRHO = "τῷ θεῷ";
const L9_SEG3_TEXT_CHIRHO = "καὶ";
const L9_SEG5_TEXT_CHIRHO = "θεῷ μου";
const L10_SEG2_TEXT_CHIRHO = "μονόζωνος";
const L10_SEG3_TEXT_CHIRHO = "∫";
const L10_SEG5_TEXT_CHIRHO = "τῷ";

const L2_SEG2_NOTES_CHIRHO =
  "Recovered vol 4 p148 line 2 Greek residue after scanline review: current OCR stored `Tût 6@` as French, but the scanline reads Greek `τῷ θεῷ` between `(καὶ) ἐν` and `μου ὑπερβήσομαι τεῖχος`. Stored as greek-chirho vision-tier; exact Greek text and punctuation remain Greek expert-confirmation tier.";
const L9_SEG3_NOTES_CHIRHO =
  "Recovered vol 4 p148 line 9 Greek residue after scanline review: current OCR stored `Kai` as French, but the scanline reads Greek `καὶ` after the apparatus sign. Stored as greek-chirho vision-tier; exact Greek text and punctuation remain Greek expert-confirmation tier.";
const L9_SEG5_NOTES_CHIRHO =
  "Recovered vol 4 p148 line 9 Greek residue after scanline review: current OCR stored `8e pou` as French, but the scanline reads Greek `θεῷ μου` between `ἐν` and `ἐξαλοῦμαι`. Stored as greek-chirho vision-tier; exact Greek text and punctuation remain Greek expert-confirmation tier.";
const L10_SEG2_NOTES_CHIRHO =
  "Recovered vol 4 p148 line 10 Greek residue after scanline review: current OCR stored `uové£wvos [` as French, but the scanline reads Greek `μονόζωνος` followed by an apparatus sign. Stored as greek-chirho vision-tier; exact Greek text remains Greek expert-confirmation tier.";
const L10_SEG3_NOTES_CHIRHO =
  "Split the printed apparatus sign from vol 4 p148 line 10 after scanline review. The old French residue `uové£wvos [` included Greek `μονόζωνος` plus this sign; the sign remains symbol-chirho vision-tier for Latin/symbol proofing.";
const L10_SEG5_NOTES_CHIRHO =
  "Migrated the existing vol 4 p148 line 10 vision-tier `τῷ` row from segment 4 to segment 5 after splitting preceding `μονόζωνος` and the apparatus sign into separate spans; original OCR garble was `T@`. Exact Greek remains expert-confirmation tier.";

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
  visionNotesChirho?: string;
  [keyChirho: string]: unknown;
}

interface SpanLineChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  spansChirho: SpanChirho[];
  [keyChirho: string]: unknown;
}

interface VisionVerdictChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  segmentIndexChirho: number;
  garbleTextChirho: string;
  scriptChirho: string;
  utf8TextChirho: string;
  notesChirho: string;
}

interface VisionVerdictsBackupChirho {
  generatedAtChirho?: string;
  countChirho?: number;
  verdictsChirho?: VisionVerdictChirho[];
  [keyChirho: string]: unknown;
}

interface LineConfigChirho {
  labelChirho: string;
  pathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  preSpansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho">>;
  nextSpansChirho: SpanChirho[];
}

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function sortedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
}

function normalizeSpanChirho(spanChirho: SpanChirho): SpanChirho {
  return {
    ...spanChirho,
    utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
  };
}

function visionSpanChirho(spanChirho: SpanChirho, appliedAtChirho: string, notesChirho: string): SpanChirho {
  return normalizeSpanChirho({
    ...spanChirho,
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: appliedAtChirho,
    visionNotesChirho: notesChirho,
  });
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortedSpansChirho(lineChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) throw new Error(`segment index ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    if (spanChirho.xMinPxChirho !== expectedXChirho) throw new Error(`xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    if (spanChirho.widthPxChirho <= 0) throw new Error(`span ${indexChirho} has non-positive width ${spanChirho.widthPxChirho}`);
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
}

function spansEqualChirho(
  actualSpansChirho: SpanChirho[],
  expectedSpansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>,
  requireProvenanceChirho: boolean
): boolean {
  if (actualSpansChirho.length !== expectedSpansChirho.length) return false;
  return expectedSpansChirho.every((expectedSpanChirho, indexChirho) => {
    const actualSpanChirho = actualSpansChirho[indexChirho];
    return (
      actualSpanChirho?.segmentIndexChirho === expectedSpanChirho.segmentIndexChirho &&
      actualSpanChirho?.xMinPxChirho === expectedSpanChirho.xMinPxChirho &&
      actualSpanChirho?.widthPxChirho === expectedSpanChirho.widthPxChirho &&
      actualSpanChirho?.scriptChirho === expectedSpanChirho.scriptChirho &&
      actualSpanChirho?.utf8TextChirho === normalizeTextForStorageChirho(expectedSpanChirho.utf8TextChirho) &&
      (!requireProvenanceChirho || expectedSpanChirho.provenanceChirho === undefined || actualSpanChirho?.provenanceChirho === expectedSpanChirho.provenanceChirho)
    );
  });
}

function stateChirho(lineChirho: SpanLineChirho, configChirho: LineConfigChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (
    lineChirho.volumeChirho !== configChirho.volumeChirho ||
    lineChirho.pageChirho !== configChirho.pageChirho ||
    lineChirho.lineIndexChirho !== configChirho.lineIndexChirho
  ) {
    return "unknown-chirho";
  }
  const spansChirho = sortedSpansChirho(lineChirho);
  if (spansEqualChirho(spansChirho, configChirho.preSpansChirho, false)) return "pre-repair-chirho";
  if (spansEqualChirho(spansChirho, configChirho.nextSpansChirho, true)) return "already-applied-chirho";
  return "unknown-chirho";
}

function lineConfig2Chirho(appliedAtChirho: string): LineConfigChirho {
  return {
    labelChirho: "vol4-p148-l002-chirho",
    pathChirho: L2_PATH_CHIRHO,
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 2,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 43, scriptChirho: "symbol-chirho", utf8TextChirho: "∫" },
      { segmentIndexChirho: 1, xMinPxChirho: 43, widthPxChirho: 196, scriptChirho: "greek-chirho", utf8TextChirho: "(καὶ) ἐν" },
      { segmentIndexChirho: 2, xMinPxChirho: 239, widthPxChirho: 180, scriptChirho: "french-chirho", utf8TextChirho: "Tût 6@" },
      { segmentIndexChirho: 3, xMinPxChirho: 419, widthPxChirho: 565, scriptChirho: "greek-chirho", utf8TextChirho: "μου ὑπερβήσομαι τεῖχος" },
      { segmentIndexChirho: 4, xMinPxChirho: 984, widthPxChirho: 191, scriptChirho: "french-chirho", utf8TextChirho: "GAL offre:" },
    ],
    nextSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 43, scriptChirho: "symbol-chirho", utf8TextChirho: "∫" },
      { segmentIndexChirho: 1, xMinPxChirho: 43, widthPxChirho: 196, scriptChirho: "greek-chirho", utf8TextChirho: "(καὶ) ἐν" },
      visionSpanChirho({ segmentIndexChirho: 2, xMinPxChirho: 239, widthPxChirho: 180, scriptChirho: "greek-chirho", utf8TextChirho: L2_SEG2_TEXT_CHIRHO }, appliedAtChirho, L2_SEG2_NOTES_CHIRHO),
      { segmentIndexChirho: 3, xMinPxChirho: 419, widthPxChirho: 565, scriptChirho: "greek-chirho", utf8TextChirho: "μου ὑπερβήσομαι τεῖχος" },
      { segmentIndexChirho: 4, xMinPxChirho: 984, widthPxChirho: 191, scriptChirho: "french-chirho", utf8TextChirho: "GAL offre:" },
    ],
  };
}

function lineConfig9Chirho(appliedAtChirho: string): LineConfigChirho {
  return {
    labelChirho: "vol4-p148-l009-chirho",
    pathChirho: L9_PATH_CHIRHO,
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 9,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 58, scriptChirho: "french-chirho", utf8TextChirho: "10" },
      { segmentIndexChirho: 1, xMinPxChirho: 58, widthPxChirho: 284, scriptChirho: "greek-chirho", utf8TextChirho: "πεφραγμένος" },
      { segmentIndexChirho: 2, xMinPxChirho: 342, widthPxChirho: 32, scriptChirho: "symbol-chirho", utf8TextChirho: "∫" },
      { segmentIndexChirho: 3, xMinPxChirho: 374, widthPxChirho: 84, scriptChirho: "french-chirho", utf8TextChirho: "Kai" },
      { segmentIndexChirho: 4, xMinPxChirho: 458, widthPxChirho: 66, scriptChirho: "greek-chirho", utf8TextChirho: "ἐν" },
      { segmentIndexChirho: 5, xMinPxChirho: 524, widthPxChirho: 182, scriptChirho: "french-chirho", utf8TextChirho: "8e pou" },
      { segmentIndexChirho: 6, xMinPxChirho: 706, widthPxChirho: 451, scriptChirho: "greek-chirho", utf8TextChirho: "ἐξαλοῦμαι ὡς μόσχος" },
      { segmentIndexChirho: 7, xMinPxChirho: 1157, widthPxChirho: 80, scriptChirho: "french-chirho", utf8TextChirho: "et le" },
    ],
    nextSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 58, scriptChirho: "french-chirho", utf8TextChirho: "10" },
      { segmentIndexChirho: 1, xMinPxChirho: 58, widthPxChirho: 284, scriptChirho: "greek-chirho", utf8TextChirho: "πεφραγμένος" },
      { segmentIndexChirho: 2, xMinPxChirho: 342, widthPxChirho: 32, scriptChirho: "symbol-chirho", utf8TextChirho: "∫" },
      visionSpanChirho({ segmentIndexChirho: 3, xMinPxChirho: 374, widthPxChirho: 84, scriptChirho: "greek-chirho", utf8TextChirho: L9_SEG3_TEXT_CHIRHO }, appliedAtChirho, L9_SEG3_NOTES_CHIRHO),
      { segmentIndexChirho: 4, xMinPxChirho: 458, widthPxChirho: 66, scriptChirho: "greek-chirho", utf8TextChirho: "ἐν" },
      visionSpanChirho({ segmentIndexChirho: 5, xMinPxChirho: 524, widthPxChirho: 182, scriptChirho: "greek-chirho", utf8TextChirho: L9_SEG5_TEXT_CHIRHO }, appliedAtChirho, L9_SEG5_NOTES_CHIRHO),
      { segmentIndexChirho: 6, xMinPxChirho: 706, widthPxChirho: 451, scriptChirho: "greek-chirho", utf8TextChirho: "ἐξαλοῦμαι ὡς μόσχος" },
      { segmentIndexChirho: 7, xMinPxChirho: 1157, widthPxChirho: 80, scriptChirho: "french-chirho", utf8TextChirho: "et le" },
    ],
  };
}

function lineConfig10Chirho(appliedAtChirho: string): LineConfigChirho {
  return {
    labelChirho: "vol4-p148-l010-chirho",
    pathChirho: L10_PATH_CHIRHO,
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho: 10,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 115, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔊pal" },
      { segmentIndexChirho: 1, xMinPxChirho: 115, widthPxChirho: 485, scriptChirho: "greek-chirho", utf8TextChirho: "ὅτι ἐν σοὶ δραμοῦμαι" },
      { segmentIndexChirho: 2, xMinPxChirho: 600, widthPxChirho: 270, scriptChirho: "french-chirho", utf8TextChirho: "uové£wvos [" },
      { segmentIndexChirho: 3, xMinPxChirho: 870, widthPxChirho: 162, scriptChirho: "greek-chirho", utf8TextChirho: "καὶ ἐν" },
      { segmentIndexChirho: 4, xMinPxChirho: 1032, widthPxChirho: 80, scriptChirho: "greek-chirho", utf8TextChirho: L10_SEG5_TEXT_CHIRHO },
      { segmentIndexChirho: 5, xMinPxChirho: 1112, widthPxChirho: 69, scriptChirho: "greek-chirho", utf8TextChirho: "θεῷ" },
    ],
    nextSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 115, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔊pal" },
      { segmentIndexChirho: 1, xMinPxChirho: 115, widthPxChirho: 485, scriptChirho: "greek-chirho", utf8TextChirho: "ὅτι ἐν σοὶ δραμοῦμαι" },
      visionSpanChirho({ segmentIndexChirho: 2, xMinPxChirho: 600, widthPxChirho: 205, scriptChirho: "greek-chirho", utf8TextChirho: L10_SEG2_TEXT_CHIRHO }, appliedAtChirho, L10_SEG2_NOTES_CHIRHO),
      visionSpanChirho({ segmentIndexChirho: 3, xMinPxChirho: 805, widthPxChirho: 65, scriptChirho: "symbol-chirho", utf8TextChirho: L10_SEG3_TEXT_CHIRHO }, appliedAtChirho, L10_SEG3_NOTES_CHIRHO),
      { segmentIndexChirho: 4, xMinPxChirho: 870, widthPxChirho: 162, scriptChirho: "greek-chirho", utf8TextChirho: "καὶ ἐν" },
      visionSpanChirho({ segmentIndexChirho: 5, xMinPxChirho: 1032, widthPxChirho: 80, scriptChirho: "greek-chirho", utf8TextChirho: L10_SEG5_TEXT_CHIRHO }, appliedAtChirho, L10_SEG5_NOTES_CHIRHO),
      { segmentIndexChirho: 6, xMinPxChirho: 1112, widthPxChirho: 69, scriptChirho: "greek-chirho", utf8TextChirho: "θεῷ" },
    ],
  };
}

function configsChirho(appliedAtChirho: string): LineConfigChirho[] {
  return [lineConfig2Chirho(appliedAtChirho), lineConfig9Chirho(appliedAtChirho), lineConfig10Chirho(appliedAtChirho)];
}

function buildLineChirho(lineChirho: SpanLineChirho, configChirho: LineConfigChirho): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = configChirho.nextSpansChirho.map(normalizeSpanChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function verdictChirho(
  lineIndexChirho: number,
  segmentIndexChirho: number,
  garbleTextChirho: string,
  scriptChirho: string,
  utf8TextChirho: string,
  notesChirho: string
): VisionVerdictChirho {
  return {
    volumeChirho: 4,
    pageChirho: 148,
    lineIndexChirho,
    segmentIndexChirho,
    garbleTextChirho,
    scriptChirho,
    utf8TextChirho: normalizeTextForStorageChirho(utf8TextChirho),
    notesChirho,
  };
}

function upsertBackupChirho(appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const replacementKeysChirho = new Set(["4:148:2:2", "4:148:9:3", "4:148:9:5", "4:148:10:2", "4:148:10:3", "4:148:10:4", "4:148:10:5"]);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictValueChirho) =>
      !replacementKeysChirho.has(
        `${verdictValueChirho.volumeChirho}:${verdictValueChirho.pageChirho}:${verdictValueChirho.lineIndexChirho}:${verdictValueChirho.segmentIndexChirho}`
      )
  );
  verdictsChirho.push(
    verdictChirho(2, 2, "Tût 6@", "greek-chirho", L2_SEG2_TEXT_CHIRHO, L2_SEG2_NOTES_CHIRHO),
    verdictChirho(9, 3, "Kai", "greek-chirho", L9_SEG3_TEXT_CHIRHO, L9_SEG3_NOTES_CHIRHO),
    verdictChirho(9, 5, "8e pou", "greek-chirho", L9_SEG5_TEXT_CHIRHO, L9_SEG5_NOTES_CHIRHO),
    verdictChirho(10, 2, "uové£wvos", "greek-chirho", L10_SEG2_TEXT_CHIRHO, L10_SEG2_NOTES_CHIRHO),
    verdictChirho(10, 3, "[", "symbol-chirho", L10_SEG3_TEXT_CHIRHO, L10_SEG3_NOTES_CHIRHO),
    verdictChirho(10, 5, "T@", "greek-chirho", L10_SEG5_TEXT_CHIRHO, L10_SEG5_NOTES_CHIRHO)
  );
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const configsValueChirho = configsChirho(appliedAtChirho);
  const summariesChirho = [];
  const plannedLinesChirho = new Map<string, SpanLineChirho>();
  let blockedChirho = false;
  for (const configChirho of configsValueChirho) {
    const lineChirho = loadJsonChirho<SpanLineChirho>(configChirho.pathChirho);
    validateTilingChirho(lineChirho);
    const stateValueChirho = stateChirho(lineChirho, configChirho);
    if (stateValueChirho === "unknown-chirho") blockedChirho = true;
    const nextLineChirho = stateValueChirho === "pre-repair-chirho" ? buildLineChirho(lineChirho, configChirho) : lineChirho;
    plannedLinesChirho.set(configChirho.pathChirho, nextLineChirho);
    summariesChirho.push({
      labelChirho: configChirho.labelChirho,
      stateChirho: stateValueChirho,
      spansChirho: sortedSpansChirho(nextLineChirho).map((spanChirho) => ({
        segmentIndexChirho: spanChirho.segmentIndexChirho,
        xMinPxChirho: spanChirho.xMinPxChirho,
        widthPxChirho: spanChirho.widthPxChirho,
        scriptChirho: spanChirho.scriptChirho,
        utf8TextChirho: spanChirho.utf8TextChirho,
        provenanceChirho: spanChirho.provenanceChirho,
      })),
    });
  }
  if (blockedChirho) {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, statusChirho: "blocked-chirho", linesChirho: summariesChirho }, null, 2));
    process.exitCode = 1;
    return;
  }
  if (!applyChirho) {
    console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "dry-run-chirho", statusChirho: "planned-chirho", linesChirho: summariesChirho }, null, 2));
    return;
  }
  for (const configChirho of configsValueChirho) {
    const nextLineChirho = plannedLinesChirho.get(configChirho.pathChirho);
    if (nextLineChirho === undefined) throw new Error(`missing planned line for ${configChirho.labelChirho}`);
    writeJsonChirho(configChirho.pathChirho, nextLineChirho);
  }
  upsertBackupChirho(appliedAtChirho);
  console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "apply-chirho", statusChirho: "applied-chirho", linesChirho: summariesChirho }, null, 2));
}

mainChirho();
