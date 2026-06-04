// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repairs for remaining clear Greek/script-boundary residue.
 *
 * These lines already had visually recovered text, but some recovered Greek
 * remained embedded in French or symbol spans. This script splits only the
 * visible script boundaries and keeps every created span vision-tier.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-greek-script-boundaries-2026-06-04-chirho";
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);

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

interface SpanSpecChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionNotesChirho?: string;
}

interface LineConfigChirho {
  labelChirho: string;
  pathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  preSpansChirho: SpanSpecChirho[];
  nextSpansChirho: SpanSpecChirho[];
  backupRemoveKeysChirho: string[];
  backupRowsChirho: VisionVerdictChirho[];
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

function keyChirho(volumeChirho: number, pageChirho: number, lineIndexChirho: number, segmentIndexChirho: number): string {
  return `${volumeChirho}:${pageChirho}:${lineIndexChirho}:${segmentIndexChirho}`;
}

function spanMatchesSpecChirho(spanChirho: SpanChirho, specChirho: SpanSpecChirho): boolean {
  return (
    spanChirho.segmentIndexChirho === specChirho.segmentIndexChirho &&
    spanChirho.xMinPxChirho === specChirho.xMinPxChirho &&
    spanChirho.widthPxChirho === specChirho.widthPxChirho &&
    spanChirho.scriptChirho === specChirho.scriptChirho &&
    spanChirho.utf8TextChirho === normalizeTextForStorageChirho(specChirho.utf8TextChirho) &&
    (specChirho.provenanceChirho === undefined || spanChirho.provenanceChirho === specChirho.provenanceChirho)
  );
}

function lineMatchesSpecsChirho(lineChirho: SpanLineChirho, specsChirho: SpanSpecChirho[]): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return spansChirho.length === specsChirho.length && specsChirho.every((specChirho, indexChirho) => spanMatchesSpecChirho(spansChirho[indexChirho] as SpanChirho, specChirho));
}

function buildLineFromSpecsChirho(lineChirho: SpanLineChirho, specsChirho: SpanSpecChirho[], appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho: SpanLineChirho = {
    ...structuredClone(lineChirho),
    spansChirho: specsChirho.map((specChirho) => {
      const spanChirho: SpanChirho = {
        segmentIndexChirho: specChirho.segmentIndexChirho,
        xMinPxChirho: specChirho.xMinPxChirho,
        widthPxChirho: specChirho.widthPxChirho,
        scriptChirho: specChirho.scriptChirho,
        utf8TextChirho: normalizeTextForStorageChirho(specChirho.utf8TextChirho),
      };
      if (specChirho.provenanceChirho !== undefined) spanChirho.provenanceChirho = specChirho.provenanceChirho;
      if (specChirho.provenanceChirho === "vision-chirho") spanChirho.visionTranscribedAtChirho = appliedAtChirho;
      if (specChirho.visionNotesChirho !== undefined) spanChirho.visionNotesChirho = specChirho.visionNotesChirho;
      return spanChirho;
    }),
  };
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function stateChirho(lineChirho: SpanLineChirho, configChirho: LineConfigChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (lineChirho.volumeChirho !== configChirho.volumeChirho || lineChirho.pageChirho !== configChirho.pageChirho || lineChirho.lineIndexChirho !== configChirho.lineIndexChirho) {
    return "unknown-chirho";
  }
  if (lineMatchesSpecsChirho(lineChirho, configChirho.preSpansChirho)) return "pre-repair-chirho";
  if (lineMatchesSpecsChirho(lineChirho, configChirho.nextSpansChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function rowChirho(
  volumeChirho: number,
  pageChirho: number,
  lineIndexChirho: number,
  segmentIndexChirho: number,
  garbleTextChirho: string,
  scriptChirho: string,
  utf8TextChirho: string,
  notesChirho: string
): VisionVerdictChirho {
  return {
    volumeChirho,
    pageChirho,
    lineIndexChirho,
    segmentIndexChirho,
    garbleTextChirho,
    scriptChirho,
    utf8TextChirho: normalizeTextForStorageChirho(utf8TextChirho),
    notesChirho,
  };
}

function configsChirho(): LineConfigChirho[] {
  const line5FrenchStartNotesChirho =
    "Split vol 3 p148 line 5 old mixed French/Greek vision span; French text before the printed Greek word is preserved as vision-tier because the span boundary was machine repaired.";
  const line5GreekNotesChirho =
    "Split vol 3 p148 line 5 old mixed span so printed Greek `κλήρῳ` has its own greek-chirho vision-tier span. The word was previously recovered from OCR garble inside a French span; exact Greek remains expert-confirmation tier.";
  const line5FrenchTailNotesChirho =
    "Split vol 3 p148 line 5 old mixed French/Greek vision span; French text after `κλήρῳ` is preserved as vision-tier because the span boundary was machine repaired.";
  const line51GreekAilamNotesChirho =
    "Split vol 3 p150 line 51 old mixed French/Greek vision span so `αιλαμ` has its own greek-chirho span. Text is preserved from the prior visual recovery; exact Greek remains expert-confirmation tier.";
  const line51FrenchMiddleNotesChirho =
    "Split vol 3 p150 line 51 old mixed French/Greek vision span; French parenthetical text `(au lieu de` is preserved as vision-tier because the span boundary was machine repaired.";
  const line51GreekKaiNotesChirho =
    "Split vol 3 p150 line 51 old mixed French/Greek vision span so `καὶ αἰλαμμω` has its own greek-chirho span. Text is preserved from the prior visual recovery; exact Greek remains expert-confirmation tier.";
  const line51FrenchTailNotesChirho =
    "Split vol 3 p150 line 51 old mixed French/Greek vision span; French text `que Rahlfs (=` is preserved as vision-tier because the span boundary was machine repaired.";
  const line31SymbolNotesChirho =
    "Split vol 4 p150 line 31 old mixed symbol/Greek span so the apparatus mark `∫` stands alone as symbol-chirho vision-tier.";
  const line31GreekNotesChirho =
    "Split vol 4 p150 line 31 old mixed symbol/Greek span so printed Greek `καὶ` has its own greek-chirho vision-tier span before `διδοὺς`; exact Greek remains expert-confirmation tier.";

  return [
    {
      labelChirho: "vol3-p148-l005-chirho",
      pathChirho: spanLinePathChirho(3, 148, 5),
      volumeChirho: 3,
      pageChirho: 148,
      lineIndexChirho: 5,
      preSpansChirho: [
        {
          segmentIndexChirho: 0,
          xMinPxChirho: 0,
          widthPxChirho: 1243,
          scriptChirho: "french-chirho",
          utf8TextChirho: "Barberini achève par κλήρῳ un alinéa qui a commencé au début du vs 4, et par",
          provenanceChirho: "vision-chirho",
        },
        { segmentIndexChirho: 1, xMinPxChirho: 1243, widthPxChirho: 35, scriptChirho: "greek-chirho", utf8TextChirho: "ἐν" },
      ],
      nextSpansChirho: [
        {
          segmentIndexChirho: 0,
          xMinPxChirho: 0,
          widthPxChirho: 360,
          scriptChirho: "french-chirho",
          utf8TextChirho: "Barberini achève par",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line5FrenchStartNotesChirho,
        },
        {
          segmentIndexChirho: 1,
          xMinPxChirho: 360,
          widthPxChirho: 210,
          scriptChirho: "greek-chirho",
          utf8TextChirho: "κλήρῳ",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line5GreekNotesChirho,
        },
        {
          segmentIndexChirho: 2,
          xMinPxChirho: 570,
          widthPxChirho: 673,
          scriptChirho: "french-chirho",
          utf8TextChirho: "un alinéa qui a commencé au début du vs 4, et par",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line5FrenchTailNotesChirho,
        },
        { segmentIndexChirho: 3, xMinPxChirho: 1243, widthPxChirho: 35, scriptChirho: "greek-chirho", utf8TextChirho: "ἐν" },
      ],
      backupRemoveKeysChirho: [keyChirho(3, 148, 5, 0), keyChirho(3, 148, 5, 1), keyChirho(3, 148, 5, 2)],
      backupRowsChirho: [
        rowChirho(3, 148, 5, 0, "Barberini achève par", "french-chirho", "Barberini achève par", line5FrenchStartNotesChirho),
        rowChirho(3, 148, 5, 1, "k\\pw", "greek-chirho", "κλήρῳ", line5GreekNotesChirho),
        rowChirho(3, 148, 5, 2, "un alinéa qui a commencé au début du vs 4, et par", "french-chirho", "un alinéa qui a commencé au début du vs 4, et par", line5FrenchTailNotesChirho),
      ],
    },
    {
      labelChirho: "vol3-p150-l051-chirho",
      pathChirho: spanLinePathChirho(3, 150, 51),
      volumeChirho: 3,
      pageChirho: 150,
      lineIndexChirho: 51,
      preSpansChirho: [
        { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 564, scriptChirho: "french-chirho", utf8TextChirho: "palimpseste de Würzburg) de la leçon" },
        { segmentIndexChirho: 1, xMinPxChirho: 564, widthPxChirho: 62, scriptChirho: "greek-chirho", utf8TextChirho: "τοῦ" },
        {
          segmentIndexChirho: 2,
          xMinPxChirho: 626,
          widthPxChirho: 652,
          scriptChirho: "french-chirho",
          utf8TextChirho: "αιλαμ (au lieu de καὶ αἰλαμμω que Rahlfs (=",
          provenanceChirho: "vision-chirho",
        },
      ],
      nextSpansChirho: [
        { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 564, scriptChirho: "french-chirho", utf8TextChirho: "palimpseste de Würzburg) de la leçon" },
        { segmentIndexChirho: 1, xMinPxChirho: 564, widthPxChirho: 62, scriptChirho: "greek-chirho", utf8TextChirho: "τοῦ" },
        {
          segmentIndexChirho: 2,
          xMinPxChirho: 626,
          widthPxChirho: 129,
          scriptChirho: "greek-chirho",
          utf8TextChirho: "αιλαμ",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line51GreekAilamNotesChirho,
        },
        {
          segmentIndexChirho: 3,
          xMinPxChirho: 755,
          widthPxChirho: 215,
          scriptChirho: "french-chirho",
          utf8TextChirho: "(au lieu de",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line51FrenchMiddleNotesChirho,
        },
        {
          segmentIndexChirho: 4,
          xMinPxChirho: 970,
          widthPxChirho: 250,
          scriptChirho: "greek-chirho",
          utf8TextChirho: "καὶ αἰλαμμω",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line51GreekKaiNotesChirho,
        },
        {
          segmentIndexChirho: 5,
          xMinPxChirho: 1220,
          widthPxChirho: 58,
          scriptChirho: "french-chirho",
          utf8TextChirho: "que Rahlfs (=",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line51FrenchTailNotesChirho,
        },
      ],
      backupRemoveKeysChirho: [keyChirho(3, 150, 51, 2), keyChirho(3, 150, 51, 3), keyChirho(3, 150, 51, 4), keyChirho(3, 150, 51, 5)],
      backupRowsChirho: [
        rowChirho(3, 150, 51, 2, "aurai", "greek-chirho", "αιλαμ", line51GreekAilamNotesChirho),
        rowChirho(3, 150, 51, 3, "(au lieu de", "french-chirho", "(au lieu de", line51FrenchMiddleNotesChirho),
        rowChirho(3, 150, 51, 4, "Kai at\\apyiw", "greek-chirho", "καὶ αἰλαμμω", line51GreekKaiNotesChirho),
        rowChirho(3, 150, 51, 5, "que Rahlfs (=", "french-chirho", "que Rahlfs (=", line51FrenchTailNotesChirho),
      ],
    },
    {
      labelChirho: "vol4-p150-l031-chirho",
      pathChirho: spanLinePathChirho(4, 150, 31),
      volumeChirho: 4,
      pageChirho: 150,
      lineIndexChirho: 31,
      preSpansChirho: [
        { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 284, scriptChirho: "french-chirho", utf8TextChirho: "Gant porte: Ô" },
        { segmentIndexChirho: 1, xMinPxChirho: 284, widthPxChirho: 113, scriptChirho: "greek-chirho", utf8TextChirho: "θεὸς" },
        { segmentIndexChirho: 2, xMinPxChirho: 397, widthPxChirho: 46, scriptChirho: "greek-chirho", utf8TextChirho: "ὁ", provenanceChirho: "vision-chirho" },
        { segmentIndexChirho: 3, xMinPxChirho: 443, widthPxChirho: 505, scriptChirho: "greek-chirho", utf8TextChirho: "περιτιθείς μοι δύναμιν" },
        { segmentIndexChirho: 4, xMinPxChirho: 948, widthPxChirho: 112, scriptChirho: "symbol-chirho", utf8TextChirho: "∫ καὶ" },
        { segmentIndexChirho: 5, xMinPxChirho: 1060, widthPxChirho: 121, scriptChirho: "greek-chirho", utf8TextChirho: "διδοὺς" },
      ],
      nextSpansChirho: [
        { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 284, scriptChirho: "french-chirho", utf8TextChirho: "Gant porte: Ô" },
        { segmentIndexChirho: 1, xMinPxChirho: 284, widthPxChirho: 113, scriptChirho: "greek-chirho", utf8TextChirho: "θεὸς" },
        { segmentIndexChirho: 2, xMinPxChirho: 397, widthPxChirho: 46, scriptChirho: "greek-chirho", utf8TextChirho: "ὁ", provenanceChirho: "vision-chirho" },
        { segmentIndexChirho: 3, xMinPxChirho: 443, widthPxChirho: 505, scriptChirho: "greek-chirho", utf8TextChirho: "περιτιθείς μοι δύναμιν" },
        {
          segmentIndexChirho: 4,
          xMinPxChirho: 948,
          widthPxChirho: 52,
          scriptChirho: "symbol-chirho",
          utf8TextChirho: "∫",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line31SymbolNotesChirho,
        },
        {
          segmentIndexChirho: 5,
          xMinPxChirho: 1000,
          widthPxChirho: 60,
          scriptChirho: "greek-chirho",
          utf8TextChirho: "καὶ",
          provenanceChirho: "vision-chirho",
          visionNotesChirho: line31GreekNotesChirho,
        },
        { segmentIndexChirho: 6, xMinPxChirho: 1060, widthPxChirho: 121, scriptChirho: "greek-chirho", utf8TextChirho: "διδοὺς" },
      ],
      backupRemoveKeysChirho: [keyChirho(4, 150, 31, 4), keyChirho(4, 150, 31, 5)],
      backupRowsChirho: [
        rowChirho(4, 150, 31, 4, "∫ καὶ", "symbol-chirho", "∫", line31SymbolNotesChirho),
        rowChirho(4, 150, 31, 5, "∫ καὶ", "greek-chirho", "καὶ", line31GreekNotesChirho),
      ],
    },
  ];
}

function upsertBackupChirho(configsValueChirho: LineConfigChirho[], appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const replacementKeysChirho = new Set(configsValueChirho.flatMap((configChirho) => [...configChirho.backupRemoveKeysChirho, ...configChirho.backupRowsChirho.map((rowValueChirho) => keyChirho(rowValueChirho.volumeChirho, rowValueChirho.pageChirho, rowValueChirho.lineIndexChirho, rowValueChirho.segmentIndexChirho))]));
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) => !replacementKeysChirho.has(keyChirho(verdictChirho.volumeChirho, verdictChirho.pageChirho, verdictChirho.lineIndexChirho, verdictChirho.segmentIndexChirho))
  );
  for (const configChirho of configsValueChirho) verdictsChirho.push(...configChirho.backupRowsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const configsValueChirho = configsChirho();
  const plannedLinesChirho = new Map<string, SpanLineChirho>();
  const summariesChirho = [];
  let blockedChirho = false;
  for (const configChirho of configsValueChirho) {
    const lineChirho = loadJsonChirho<SpanLineChirho>(configChirho.pathChirho);
    validateTilingChirho(lineChirho);
    const stateValueChirho = stateChirho(lineChirho, configChirho);
    if (stateValueChirho === "unknown-chirho") blockedChirho = true;
    const nextLineChirho = stateValueChirho === "pre-repair-chirho" ? buildLineFromSpecsChirho(lineChirho, configChirho.nextSpansChirho, appliedAtChirho) : lineChirho;
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
  upsertBackupChirho(configsValueChirho, appliedAtChirho);
  console.log(JSON.stringify({ moduleChirho: MODULE_CHIRHO, modeChirho: "apply-chirho", statusChirho: "applied-chirho", linesChirho: summariesChirho }, null, 2));
}

mainChirho();
