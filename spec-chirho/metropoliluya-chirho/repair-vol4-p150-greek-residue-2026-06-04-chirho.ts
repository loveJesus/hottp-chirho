// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for vol 4 p150 Greek residue.
 *
 * Scanline review confirmed:
 * - line 18 `Le` is Greek `με`, and `[ Kai` is the apparatus sign plus `καὶ`;
 * - line 32 `660s pou et le` is Greek `ὁδοῖς μου` plus French `et le`,
 *   `𝔊pal` includes a printed colon, and `d` is Greek `ὁ`.
 *
 * Repaired spans remain vision-tier and require Greek or Latin/symbol review.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol4-p150-greek-residue-2026-06-04-chirho";
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const L18_PATH_CHIRHO = spanLinePathChirho(4, 150, 18);
const L32_PATH_CHIRHO = spanLinePathChirho(4, 150, 32);

const L18_SEG1_TEXT_CHIRHO = "με";
const L18_SEG3_TEXT_CHIRHO = "∫";
const L18_SEG4_TEXT_CHIRHO = "καὶ";
const L32_SEG1_TEXT_CHIRHO = "ὁδοῖς μου";
const L32_SEG2_TEXT_CHIRHO = "et le";
const L32_SEG3_TEXT_CHIRHO = "𝔊pal:";
const L32_SEG4_TEXT_CHIRHO = "ὁ";
const L32_SEG6_TEXT_CHIRHO = "ὁ";

const L18_SEG1_NOTES_CHIRHO =
  "Recovered vol 4 p150 line 18 Greek residue after scanline review: current OCR stored `Le` as French, but the print reads Greek `με` between `ἰσχυρὸς περιζωννύς` and `εὐπορίαν`. Stored as greek-chirho vision-tier; exact Greek text remains expert-confirmation tier.";
const L18_SEG3_NOTES_CHIRHO =
  "Split vol 4 p150 line 18 apparatus sign after scanline review: current OCR stored `[ Kai` as French, but the print shows the apparatus sign before Greek `καὶ`. Stored as symbol-chirho vision-tier for Latin/symbol proofing.";
const L18_SEG4_NOTES_CHIRHO =
  "Recovered vol 4 p150 line 18 Greek residue after scanline review: current OCR stored `[ Kai` as French, but the print reads Greek `καὶ` after the apparatus sign and before `ἔδωκεν τελείαν`. Stored as greek-chirho vision-tier; exact Greek text remains expert-confirmation tier.";
const L32_SEG1_NOTES_CHIRHO =
  "Recovered vol 4 p150 line 32 Greek residue after scanline review: current OCR stored the beginning of `660s pou et le` as French, but the print reads Greek `ὁδοῖς μου` after `ὁσιότητα ταῖς`. Stored as greek-chirho vision-tier; exact Greek text remains expert-confirmation tier.";
const L32_SEG3_NOTES_CHIRHO =
  "Cleaned vol 4 p150 line 32 symbol span after scanline review: the printed siglum reads `𝔊pal:` with a colon before the following Greek article. Stored as symbol-chirho vision-tier for Latin/symbol proofing.";
const L32_SEG4_NOTES_CHIRHO =
  "Recovered vol 4 p150 line 32 Greek article after scanline review: current OCR stored `d` as French, but the print reads Greek `ὁ` before `ἰσχυρὸς`. Stored as greek-chirho vision-tier; exact Greek text remains expert-confirmation tier.";
const L32_SEG6_NOTES_CHIRHO =
  "Migrated the existing vol 4 p150 line 32 vision-tier `ὁ` row from segment 5 to segment 6 after splitting preceding `ὁδοῖς μου et le` and adding the printed `𝔊pal:` colon; original OCR garble was `d`. Exact Greek remains expert-confirmation tier.";

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

function lineConfig18Chirho(appliedAtChirho: string): LineConfigChirho {
  return {
    labelChirho: "vol4-p150-l018-chirho",
    pathChirho: L18_PATH_CHIRHO,
    volumeChirho: 4,
    pageChirho: 150,
    lineIndexChirho: 18,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 444, scriptChirho: "greek-chirho", utf8TextChirho: "ἰσχυρὸς περιζωννύς" },
      { segmentIndexChirho: 1, xMinPxChirho: 444, widthPxChirho: 75, scriptChirho: "french-chirho", utf8TextChirho: "Le" },
      { segmentIndexChirho: 2, xMinPxChirho: 519, widthPxChirho: 209, scriptChirho: "greek-chirho", utf8TextChirho: "εὐπορίαν" },
      { segmentIndexChirho: 3, xMinPxChirho: 728, widthPxChirho: 135, scriptChirho: "french-chirho", utf8TextChirho: "[ Kai" },
      { segmentIndexChirho: 4, xMinPxChirho: 863, widthPxChirho: 318, scriptChirho: "greek-chirho", utf8TextChirho: "ἔδωκεν τελείαν" },
    ],
    nextSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 444, scriptChirho: "greek-chirho", utf8TextChirho: "ἰσχυρὸς περιζωννύς" },
      visionSpanChirho({ segmentIndexChirho: 1, xMinPxChirho: 444, widthPxChirho: 75, scriptChirho: "greek-chirho", utf8TextChirho: L18_SEG1_TEXT_CHIRHO }, appliedAtChirho, L18_SEG1_NOTES_CHIRHO),
      { segmentIndexChirho: 2, xMinPxChirho: 519, widthPxChirho: 209, scriptChirho: "greek-chirho", utf8TextChirho: "εὐπορίαν" },
      visionSpanChirho({ segmentIndexChirho: 3, xMinPxChirho: 728, widthPxChirho: 72, scriptChirho: "symbol-chirho", utf8TextChirho: L18_SEG3_TEXT_CHIRHO }, appliedAtChirho, L18_SEG3_NOTES_CHIRHO),
      visionSpanChirho({ segmentIndexChirho: 4, xMinPxChirho: 800, widthPxChirho: 63, scriptChirho: "greek-chirho", utf8TextChirho: L18_SEG4_TEXT_CHIRHO }, appliedAtChirho, L18_SEG4_NOTES_CHIRHO),
      { segmentIndexChirho: 5, xMinPxChirho: 863, widthPxChirho: 318, scriptChirho: "greek-chirho", utf8TextChirho: "ἔδωκεν τελείαν" },
    ],
  };
}

function lineConfig32Chirho(appliedAtChirho: string): LineConfigChirho {
  return {
    labelChirho: "vol4-p150-l032-chirho",
    pathChirho: L32_PATH_CHIRHO,
    volumeChirho: 4,
    pageChirho: 150,
    lineIndexChirho: 32,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 313, scriptChirho: "greek-chirho", utf8TextChirho: "ὁσιότητα ταῖς" },
      { segmentIndexChirho: 1, xMinPxChirho: 313, widthPxChirho: 315, scriptChirho: "french-chirho", utf8TextChirho: "660s pou et le" },
      { segmentIndexChirho: 2, xMinPxChirho: 628, widthPxChirho: 108, scriptChirho: "symbol-chirho", utf8TextChirho: "𝔊pal" },
      { segmentIndexChirho: 3, xMinPxChirho: 736, widthPxChirho: 45, scriptChirho: "french-chirho", utf8TextChirho: "d" },
      { segmentIndexChirho: 4, xMinPxChirho: 781, widthPxChirho: 178, scriptChirho: "greek-chirho", utf8TextChirho: "ἰσχυρὸς" },
      { segmentIndexChirho: 5, xMinPxChirho: 959, widthPxChirho: 45, scriptChirho: "greek-chirho", utf8TextChirho: L32_SEG6_TEXT_CHIRHO },
      { segmentIndexChirho: 6, xMinPxChirho: 1004, widthPxChirho: 177, scriptChirho: "greek-chirho", utf8TextChirho: "κραταιῶν" },
    ],
    nextSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 313, scriptChirho: "greek-chirho", utf8TextChirho: "ὁσιότητα ταῖς" },
      visionSpanChirho({ segmentIndexChirho: 1, xMinPxChirho: 313, widthPxChirho: 190, scriptChirho: "greek-chirho", utf8TextChirho: L32_SEG1_TEXT_CHIRHO }, appliedAtChirho, L32_SEG1_NOTES_CHIRHO),
      { segmentIndexChirho: 2, xMinPxChirho: 503, widthPxChirho: 125, scriptChirho: "french-chirho", utf8TextChirho: L32_SEG2_TEXT_CHIRHO },
      visionSpanChirho({ segmentIndexChirho: 3, xMinPxChirho: 628, widthPxChirho: 108, scriptChirho: "symbol-chirho", utf8TextChirho: L32_SEG3_TEXT_CHIRHO }, appliedAtChirho, L32_SEG3_NOTES_CHIRHO),
      visionSpanChirho({ segmentIndexChirho: 4, xMinPxChirho: 736, widthPxChirho: 45, scriptChirho: "greek-chirho", utf8TextChirho: L32_SEG4_TEXT_CHIRHO }, appliedAtChirho, L32_SEG4_NOTES_CHIRHO),
      { segmentIndexChirho: 5, xMinPxChirho: 781, widthPxChirho: 178, scriptChirho: "greek-chirho", utf8TextChirho: "ἰσχυρὸς" },
      visionSpanChirho({ segmentIndexChirho: 6, xMinPxChirho: 959, widthPxChirho: 45, scriptChirho: "greek-chirho", utf8TextChirho: L32_SEG6_TEXT_CHIRHO }, appliedAtChirho, L32_SEG6_NOTES_CHIRHO),
      { segmentIndexChirho: 7, xMinPxChirho: 1004, widthPxChirho: 177, scriptChirho: "greek-chirho", utf8TextChirho: "κραταιῶν" },
    ],
  };
}

function configsChirho(appliedAtChirho: string): LineConfigChirho[] {
  return [lineConfig18Chirho(appliedAtChirho), lineConfig32Chirho(appliedAtChirho)];
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
    pageChirho: 150,
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
  const replacementKeysChirho = new Set(["4:150:18:1", "4:150:18:3", "4:150:18:4", "4:150:32:1", "4:150:32:3", "4:150:32:4", "4:150:32:5", "4:150:32:6"]);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictValueChirho) =>
      !replacementKeysChirho.has(
        `${verdictValueChirho.volumeChirho}:${verdictValueChirho.pageChirho}:${verdictValueChirho.lineIndexChirho}:${verdictValueChirho.segmentIndexChirho}`
      )
  );
  verdictsChirho.push(
    verdictChirho(18, 1, "Le", "greek-chirho", L18_SEG1_TEXT_CHIRHO, L18_SEG1_NOTES_CHIRHO),
    verdictChirho(18, 3, "[", "symbol-chirho", L18_SEG3_TEXT_CHIRHO, L18_SEG3_NOTES_CHIRHO),
    verdictChirho(18, 4, "Kai", "greek-chirho", L18_SEG4_TEXT_CHIRHO, L18_SEG4_NOTES_CHIRHO),
    verdictChirho(32, 1, "660s pou", "greek-chirho", L32_SEG1_TEXT_CHIRHO, L32_SEG1_NOTES_CHIRHO),
    verdictChirho(32, 3, "𝔊pal", "symbol-chirho", L32_SEG3_TEXT_CHIRHO, L32_SEG3_NOTES_CHIRHO),
    verdictChirho(32, 4, "d", "greek-chirho", L32_SEG4_TEXT_CHIRHO, L32_SEG4_NOTES_CHIRHO),
    verdictChirho(32, 6, "d", "greek-chirho", L32_SEG6_TEXT_CHIRHO, L32_SEG6_NOTES_CHIRHO)
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
