// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for the remaining vol 3 p152 Greek apparatus cluster.
 *
 * Lines 18-20 carry the same printed `.967` apparatus family as nearby lines.
 * The current spans omit `.967` on all three lines; lines 19-20 also place the
 * Greek article `ὁ` in a symbol span, and line 20 glues `Cpl et` as `Cplet`.
 *
 * Repaired spans stay vision-tier so Greek and Latin/symbol reviewers still
 * confirm the text, apparatus, and geometry before certification.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol3-p152-greek-apparatus-cluster-2026-06-04-chirho";
const TARGET_VOLUME_CHIRHO = 3;
const TARGET_PAGE_CHIRHO = 152;
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);

const GREEK_PHRASE_CHIRHO = "λέγει κύριος";
const APPARATUS_SYMBOL_CHIRHO = ".967 ≠ +";
const GREEK_KYRIOS_CHIRHO = "κύριος";
const GREEK_THEOS_CHIRHO = "ὁ θεός";
const FRENCH_L20_TAIL_CHIRHO = "Cpl et rel.[5]";

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
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
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

interface RepairLineConfigChirho {
  labelChirho: string;
  lineIndexChirho: number;
  lineWidthChirho: number;
  preSpansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho">>;
  nextSpansChirho: SpanChirho[];
  verdictsChirho: VisionVerdictChirho[];
}

interface RepairLineSummaryChirho {
  labelChirho: string;
  stateChirho: "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho";
  spansChirho: Array<
    Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
  >;
}

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  linesChirho: RepairLineSummaryChirho[];
}

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function linePathChirho(lineIndexChirho: number): string {
  return spanLinePathChirho(TARGET_VOLUME_CHIRHO, TARGET_PAGE_CHIRHO, lineIndexChirho);
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

function notesChirho(lineIndexChirho: number, textChirho: string, detailChirho: string): string {
  return `Repaired vol 3 p152 line ${lineIndexChirho} Greek apparatus cluster after scanline review: the print reads ${textChirho}. ${detailChirho} Stored as vision-tier for the appropriate Greek or Latin/symbol review lane, not certified.`;
}

function verdictForSpanChirho(
  configChirho: RepairLineConfigChirho,
  segmentIndexChirho: number,
  garbleTextChirho: string,
  scriptChirho: string,
  notesValueChirho: string
): VisionVerdictChirho {
  const spanChirho = configChirho.nextSpansChirho.find((candidateChirho) => candidateChirho.segmentIndexChirho === segmentIndexChirho);
  if (spanChirho === undefined) throw new Error(`${configChirho.labelChirho} missing segment ${segmentIndexChirho}`);
  return {
    volumeChirho: TARGET_VOLUME_CHIRHO,
    pageChirho: TARGET_PAGE_CHIRHO,
    lineIndexChirho: configChirho.lineIndexChirho,
    segmentIndexChirho,
    garbleTextChirho,
    scriptChirho,
    utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
    notesChirho: notesValueChirho,
  };
}

function configsChirho(appliedAtChirho: string): RepairLineConfigChirho[] {
  const l18TextChirho = "`λέγει κύριος .967 ≠ + κύριος Cpl et rel.[3]`";
  const l18PhraseNotesChirho = notesChirho(18, l18TextChirho, "The old Greek phrase box swallowed `.967`.");
  const l18SymbolNotesChirho = notesChirho(18, l18TextChirho, "Recovered `.967 ≠ +`; the previous split omitted `.967` and stored `+` as French text.");
  const l18KyriosNotesChirho = notesChirho(18, l18TextChirho, "Reboxed the following `κύριος` after merging the apparatus operator span.");
  const l18NextSpansChirho: SpanChirho[] = [
    { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 201, scriptChirho: "french-chirho", utf8TextChirho: "c) en 44,15d:" },
    visionSpanChirho({ segmentIndexChirho: 1, xMinPxChirho: 201, widthPxChirho: 193, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO }, appliedAtChirho, l18PhraseNotesChirho),
    visionSpanChirho({ segmentIndexChirho: 2, xMinPxChirho: 394, widthPxChirho: 134, scriptChirho: "symbol-chirho", utf8TextChirho: APPARATUS_SYMBOL_CHIRHO }, appliedAtChirho, l18SymbolNotesChirho),
    visionSpanChirho({ segmentIndexChirho: 3, xMinPxChirho: 528, widthPxChirho: 109, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_KYRIOS_CHIRHO }, appliedAtChirho, l18KyriosNotesChirho),
    { segmentIndexChirho: 4, xMinPxChirho: 637, widthPxChirho: 184, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[3]" },
  ];
  const l18ConfigChirho: RepairLineConfigChirho = {
    labelChirho: "vol3-p152-l018-chirho",
    lineIndexChirho: 18,
    lineWidthChirho: 821,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 201, scriptChirho: "french-chirho", utf8TextChirho: "c) en 44,15d:" },
      { segmentIndexChirho: 1, xMinPxChirho: 201, widthPxChirho: 268, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
      { segmentIndexChirho: 2, xMinPxChirho: 469, widthPxChirho: 30, scriptChirho: "symbol-chirho", utf8TextChirho: "≠" },
      { segmentIndexChirho: 3, xMinPxChirho: 499, widthPxChirho: 29, scriptChirho: "french-chirho", utf8TextChirho: "+" },
      { segmentIndexChirho: 4, xMinPxChirho: 528, widthPxChirho: 109, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_KYRIOS_CHIRHO },
      { segmentIndexChirho: 5, xMinPxChirho: 637, widthPxChirho: 184, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[3]" },
    ],
    nextSpansChirho: l18NextSpansChirho,
    verdictsChirho: [],
  };
  l18ConfigChirho.verdictsChirho = [
    verdictForSpanChirho(l18ConfigChirho, 1, "old Greek span swallowed .967", "greek-chirho", l18PhraseNotesChirho),
    verdictForSpanChirho(l18ConfigChirho, 2, "omitted .967 and split ≠ / +", "symbol-chirho", l18SymbolNotesChirho),
    verdictForSpanChirho(l18ConfigChirho, 3, "renumbered/reboxed κύριος after apparatus merge", "greek-chirho", l18KyriosNotesChirho),
  ];

  const l19TextChirho = "`λέγει κύριος .967 ≠ + ὁ θεός Cpl et rel.[4]`";
  const l19PhraseNotesChirho = notesChirho(19, l19TextChirho, "The old Greek phrase box swallowed `.967`.");
  const l19SymbolNotesChirho = notesChirho(19, l19TextChirho, "Recovered `.967 ≠ +`; the old symbol span omitted `.967` and included Greek `ὁ`.");
  const l19TheosNotesChirho = notesChirho(19, l19TextChirho, "Reboxed `ὁ θεός` as Greek text instead of splitting `ὁ` into the symbol span.");
  const l19NextSpansChirho: SpanChirho[] = [
    { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 183, scriptChirho: "french-chirho", utf8TextChirho: "d) en 45,9c:" },
    visionSpanChirho({ segmentIndexChirho: 1, xMinPxChirho: 183, widthPxChirho: 193, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO }, appliedAtChirho, l19PhraseNotesChirho),
    visionSpanChirho({ segmentIndexChirho: 2, xMinPxChirho: 376, widthPxChirho: 149, scriptChirho: "symbol-chirho", utf8TextChirho: APPARATUS_SYMBOL_CHIRHO }, appliedAtChirho, l19SymbolNotesChirho),
    visionSpanChirho({ segmentIndexChirho: 3, xMinPxChirho: 525, widthPxChirho: 100, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_THEOS_CHIRHO }, appliedAtChirho, l19TheosNotesChirho),
    { segmentIndexChirho: 4, xMinPxChirho: 625, widthPxChirho: 184, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[4]" },
  ];
  const l19ConfigChirho: RepairLineConfigChirho = {
    labelChirho: "vol3-p152-l019-chirho",
    lineIndexChirho: 19,
    lineWidthChirho: 809,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 183, scriptChirho: "french-chirho", utf8TextChirho: "d) en 45,9c:" },
      { segmentIndexChirho: 1, xMinPxChirho: 183, widthPxChirho: 268, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
      { segmentIndexChirho: 2, xMinPxChirho: 451, widthPxChirho: 96, scriptChirho: "symbol-chirho", utf8TextChirho: "≠ + ὁ" },
      { segmentIndexChirho: 3, xMinPxChirho: 547, widthPxChirho: 78, scriptChirho: "greek-chirho", utf8TextChirho: "θεός" },
      { segmentIndexChirho: 4, xMinPxChirho: 625, widthPxChirho: 184, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[4]" },
    ],
    nextSpansChirho: l19NextSpansChirho,
    verdictsChirho: [],
  };
  l19ConfigChirho.verdictsChirho = [
    verdictForSpanChirho(l19ConfigChirho, 1, "old Greek span swallowed .967", "greek-chirho", l19PhraseNotesChirho),
    verdictForSpanChirho(l19ConfigChirho, 2, "omitted .967 and included Greek ὁ", "symbol-chirho", l19SymbolNotesChirho),
    verdictForSpanChirho(l19ConfigChirho, 3, "split ὁ away from θεός", "greek-chirho", l19TheosNotesChirho),
  ];

  const l20TextChirho = "`λέγει κύριος .967 ≠ + ὁ θεός Cpl et rel.[5]`";
  const l20PhraseNotesChirho = notesChirho(20, l20TextChirho, "The old Greek phrase box swallowed `.967`.");
  const l20SymbolNotesChirho = notesChirho(20, l20TextChirho, "Recovered `.967 ≠ +`; the old symbol span omitted `.967` and included Greek `ὁ`.");
  const l20TheosNotesChirho = notesChirho(20, l20TextChirho, "Reboxed `ὁ θεός` as Greek text instead of splitting `ὁ` into the symbol span.");
  const l20TailNotesChirho = notesChirho(20, l20TextChirho, "Cleaned the French apparatus tail from `Cplet rel.[5]` into `Cpl et rel.[5]`.");
  const l20NextSpansChirho: SpanChirho[] = [
    { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 199, scriptChirho: "french-chirho", utf8TextChirho: "e) en 45,15c:" },
    visionSpanChirho({ segmentIndexChirho: 1, xMinPxChirho: 199, widthPxChirho: 193, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO }, appliedAtChirho, l20PhraseNotesChirho),
    visionSpanChirho({ segmentIndexChirho: 2, xMinPxChirho: 392, widthPxChirho: 149, scriptChirho: "symbol-chirho", utf8TextChirho: APPARATUS_SYMBOL_CHIRHO }, appliedAtChirho, l20SymbolNotesChirho),
    visionSpanChirho({ segmentIndexChirho: 3, xMinPxChirho: 541, widthPxChirho: 100, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_THEOS_CHIRHO }, appliedAtChirho, l20TheosNotesChirho),
    visionSpanChirho({ segmentIndexChirho: 4, xMinPxChirho: 641, widthPxChirho: 185, scriptChirho: "french-chirho", utf8TextChirho: FRENCH_L20_TAIL_CHIRHO }, appliedAtChirho, l20TailNotesChirho),
  ];
  const l20ConfigChirho: RepairLineConfigChirho = {
    labelChirho: "vol3-p152-l020-chirho",
    lineIndexChirho: 20,
    lineWidthChirho: 826,
    preSpansChirho: [
      { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 199, scriptChirho: "french-chirho", utf8TextChirho: "e) en 45,15c:" },
      { segmentIndexChirho: 1, xMinPxChirho: 199, widthPxChirho: 269, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
      { segmentIndexChirho: 2, xMinPxChirho: 468, widthPxChirho: 95, scriptChirho: "symbol-chirho", utf8TextChirho: "≠ + ὁ" },
      { segmentIndexChirho: 3, xMinPxChirho: 563, widthPxChirho: 78, scriptChirho: "greek-chirho", utf8TextChirho: "θεός" },
      { segmentIndexChirho: 4, xMinPxChirho: 641, widthPxChirho: 96, scriptChirho: "latin-non-french-chirho", utf8TextChirho: "Cplet" },
      { segmentIndexChirho: 5, xMinPxChirho: 737, widthPxChirho: 89, scriptChirho: "french-chirho", utf8TextChirho: "rel.[5]" },
    ],
    nextSpansChirho: l20NextSpansChirho,
    verdictsChirho: [],
  };
  l20ConfigChirho.verdictsChirho = [
    verdictForSpanChirho(l20ConfigChirho, 1, "old Greek span swallowed .967", "greek-chirho", l20PhraseNotesChirho),
    verdictForSpanChirho(l20ConfigChirho, 2, "omitted .967 and included Greek ὁ", "symbol-chirho", l20SymbolNotesChirho),
    verdictForSpanChirho(l20ConfigChirho, 3, "split ὁ away from θεός", "greek-chirho", l20TheosNotesChirho),
    verdictForSpanChirho(l20ConfigChirho, 4, "Cplet rel.[5]", "french-chirho", l20TailNotesChirho),
  ];

  return [l18ConfigChirho, l19ConfigChirho, l20ConfigChirho];
}

function validateTargetLineChirho(lineChirho: SpanLineChirho, configChirho: RepairLineConfigChirho): void {
  if (
    lineChirho.volumeChirho !== TARGET_VOLUME_CHIRHO ||
    lineChirho.pageChirho !== TARGET_PAGE_CHIRHO ||
    lineChirho.lineIndexChirho !== configChirho.lineIndexChirho ||
    lineChirho.lineWidthPxChirho !== configChirho.lineWidthChirho
  ) {
    throw new Error(`${configChirho.labelChirho} path is not the expected target line`);
  }
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
  requireExpectedProvenanceChirho: boolean
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
      (!requireExpectedProvenanceChirho || expectedSpanChirho.provenanceChirho === undefined || actualSpanChirho?.provenanceChirho === expectedSpanChirho.provenanceChirho)
    );
  });
}

function stateForLineChirho(lineChirho: SpanLineChirho, configChirho: RepairLineConfigChirho): RepairLineSummaryChirho["stateChirho"] {
  const spansChirho = sortedSpansChirho(lineChirho);
  if (spansEqualChirho(spansChirho, configChirho.preSpansChirho, false)) return "pre-repair-chirho";
  if (spansEqualChirho(spansChirho, configChirho.nextSpansChirho, true)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildLineChirho(lineChirho: SpanLineChirho, configChirho: RepairLineConfigChirho): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = configChirho.nextSpansChirho.map(normalizeSpanChirho);
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function spanSummaryChirho(lineChirho: SpanLineChirho): RepairLineSummaryChirho["spansChirho"] {
  return sortedSpansChirho(lineChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  summariesChirho: RepairLineSummaryChirho[]
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    linesChirho: summariesChirho,
  };
}

function upsertVisionBackupChirho(configsValueChirho: RepairLineConfigChirho[], appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const nextVerdictsChirho = configsValueChirho.flatMap((configChirho) => configChirho.verdictsChirho);
  const replacementKeysChirho = new Set(
    nextVerdictsChirho.map((verdictChirho) => `${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}`)
  );
  const keptVerdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (verdictChirho) => !replacementKeysChirho.has(`${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}`)
  );
  keptVerdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = keptVerdictsChirho;
  backupChirho.countChirho = keptVerdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return nextVerdictsChirho.length;
}

function lineSummaryChirho(labelChirho: string, stateChirho: RepairLineSummaryChirho["stateChirho"], lineChirho: SpanLineChirho): RepairLineSummaryChirho {
  return {
    labelChirho,
    stateChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
}

function renderedLineChirho(lineChirho: SpanLineChirho): string {
  return sortedSpansChirho(lineChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join(" ");
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const configsValueChirho = configsChirho(appliedAtChirho);
  const loadedLinesChirho = configsValueChirho.map((configChirho) => {
    const lineChirho = loadJsonChirho<SpanLineChirho>(linePathChirho(configChirho.lineIndexChirho));
    validateTargetLineChirho(lineChirho, configChirho);
    validateTilingChirho(lineChirho);
    const stateChirho = stateForLineChirho(lineChirho, configChirho);
    const plannedLineChirho = stateChirho === "already-applied-chirho" ? lineChirho : buildLineChirho(lineChirho, configChirho);
    return { configChirho, lineChirho, plannedLineChirho, stateChirho };
  });
  const unknownLinesChirho = loadedLinesChirho.filter((itemChirho) => itemChirho.stateChirho === "unknown-chirho");
  if (unknownLinesChirho.length > 0) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          "blocked-chirho",
          [
            "one or more target lines are not in the expected pre-repair or already-applied state; refusing to guess around current edits",
            ...unknownLinesChirho.map((itemChirho) => `${itemChirho.configChirho.labelChirho}: ${JSON.stringify(renderedLineChirho(itemChirho.lineChirho))}`),
          ],
          loadedLinesChirho.map((itemChirho) => lineSummaryChirho(itemChirho.configChirho.labelChirho, itemChirho.stateChirho, itemChirho.lineChirho))
        ),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          loadedLinesChirho.every((itemChirho) => itemChirho.stateChirho === "already-applied-chirho") ? "already-applied-chirho" : "planned-chirho",
          [
            "ready to repair vol 3 p152 lines 18-20 Greek apparatus cluster",
            "changed spans remain vision-tier and require Greek or Latin/symbol review",
          ],
          loadedLinesChirho.map((itemChirho) => lineSummaryChirho(itemChirho.configChirho.labelChirho, itemChirho.stateChirho, itemChirho.plannedLineChirho))
        ),
        null,
        2
      )
    );
    return;
  }

  for (const itemChirho of loadedLinesChirho) {
    if (itemChirho.stateChirho !== "already-applied-chirho") writeJsonChirho(linePathChirho(itemChirho.configChirho.lineIndexChirho), itemChirho.plannedLineChirho);
  }
  const upsertCountChirho = upsertVisionBackupChirho(configsValueChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [`applied vol 3 p152 Greek apparatus cluster repair and upserted ${upsertCountChirho} durable vision verdicts`, "regenerate export/report/packs/status next"],
        loadedLinesChirho.map((itemChirho) => lineSummaryChirho(itemChirho.configChirho.labelChirho, "already-applied-chirho", itemChirho.plannedLineChirho))
      ),
      null,
      2
    )
  );
}

mainChirho();
