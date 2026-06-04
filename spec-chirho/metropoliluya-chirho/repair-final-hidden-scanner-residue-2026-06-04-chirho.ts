// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first cleanup for the last four hidden-Hebrew scanner candidates.
 *
 * Second-witness review confirmed these are not hidden Hebrew. They are:
 * - one French prose OCR line with Rahlfs + footnote 429 residue,
 * - three Greek apparatus lines where `.967 ≠ + ὁ θεός` was split/omitted.
 *
 * Every machine-corrected or reboxed span is stored as vision-tier so the
 * correction is visible to the right review lane rather than silently accepted.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-final-hidden-scanner-residue-2026-06-04-chirho";
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
  pathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
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

const RAHFLS_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-3-chirho",
  "page-0150-chirho",
  "line-016-chirho.json"
);
const L21_LINE_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho", "vol-3-chirho", "page-0152-chirho", "line-021-chirho.json");
const L22_LINE_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho", "vol-3-chirho", "page-0152-chirho", "line-022-chirho.json");
const L23_LINE_PATH_CHIRHO = join(PROJECT_ROOT_CHIRHO, "workspace-chirho", "spans-chirho", "vol-3-chirho", "page-0152-chirho", "line-023-chirho.json");

const RAHFLS_PRE_TEXT_CHIRHO = "certains choix de Rabhlfs, Ziegler a souvent laissé ces possibilités inexploitées{2?. Avant";
const RAHFLS_NEXT_TEXT_CHIRHO = "certains choix de Rahlfs, Ziegler a souvent laissé ces possibilités inexploitées429. Avant";
const RAHFLS_NOTES_CHIRHO =
  "Cleaned vol 3 p150 line 16 after second-witness scanline review: the print reads `Rahlfs` (no OCR-inserted b) and the residue `{2?` is the superscript footnote marker `429` before the period. Existing corpus convention stores footnote markers as plain trailing digits, e.g. `essentiels433.`. Stored as french-chirho vision-tier cleanup, not silently certified.";

const GREEK_PHRASE_CHIRHO = "λέγει κύριος";
const APPARATUS_SYMBOL_CHIRHO = ".967 ≠ +";
const GREEK_THEOS_CHIRHO = "ὁ θεός";
const GREEK_PHRASE_NOTES_CHIRHO =
  "Reboxed the Greek phrase `λέγει κύριος` after second-witness scanline review so the following `.967` apparatus siglum is no longer swallowed by this span. Stored as greek-chirho vision-tier; exact Greek text and geometry remain Greek expert-confirmation tier.";
const APPARATUS_SYMBOL_NOTES_CHIRHO =
  "Recovered the apparatus sequence `.967 ≠ +` after second-witness scanline review. The leading dot before 967 is printed, `≠ +` is printed, and the plus remains apparatus punctuation rather than part of the Greek article. Stored as symbol-chirho vision-tier for Latin/symbol proofing.";
const GREEK_THEOS_NOTES_CHIRHO =
  "Recovered Greek `ὁ θεός` after second-witness scanline review. The OCR read the rough-breathing omicron `ὁ` as `0`/`6`; the repaired span stores U+1F41 omicron with rough breathing plus `θεός` with final sigma. Stored as greek-chirho vision-tier for Greek expert confirmation.";

function loadJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-chirho-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function spanLinePathChirho(volumeChirho: number, pageChirho: number, lineIndexChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "spans-chirho",
    `vol-${volumeChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function sortedSpansChirho(lineChirho: SpanLineChirho): SpanChirho[] {
  return [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
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

function renderedLineChirho(lineChirho: SpanLineChirho): string {
  return sortedSpansChirho(lineChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join(" ");
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

function validateTargetLineChirho(lineChirho: SpanLineChirho, configChirho: RepairLineConfigChirho): void {
  if (
    lineChirho.volumeChirho !== configChirho.volumeChirho ||
    lineChirho.pageChirho !== configChirho.pageChirho ||
    lineChirho.lineIndexChirho !== configChirho.lineIndexChirho
  ) {
    throw new Error(`${configChirho.labelChirho} path is not vol ${configChirho.volumeChirho} page ${configChirho.pageChirho} line ${configChirho.lineIndexChirho}`);
  }
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of sortedSpansChirho(lineChirho).entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) {
      throw new Error(`segment index ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    }
    if (spanChirho.xMinPxChirho !== expectedXChirho) {
      throw new Error(`xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    }
    if (spanChirho.widthPxChirho <= 0) {
      throw new Error(`span ${indexChirho} has non-positive width ${spanChirho.widthPxChirho}`);
    }
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
  }
}

function spansEqualChirho(
  actualSpansChirho: SpanChirho[],
  expectedSpansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>,
  requireVisionChirho: boolean
): boolean {
  if (actualSpansChirho.length !== expectedSpansChirho.length) return false;
  return expectedSpansChirho.every((expectedSpanChirho, indexChirho) => {
    const actualSpanChirho = actualSpansChirho[indexChirho];
    const expectedProvenanceChirho = expectedSpanChirho.provenanceChirho;
    return (
      actualSpanChirho?.segmentIndexChirho === expectedSpanChirho.segmentIndexChirho &&
      actualSpanChirho?.xMinPxChirho === expectedSpanChirho.xMinPxChirho &&
      actualSpanChirho?.widthPxChirho === expectedSpanChirho.widthPxChirho &&
      actualSpanChirho?.scriptChirho === expectedSpanChirho.scriptChirho &&
      actualSpanChirho?.utf8TextChirho === normalizeTextForStorageChirho(expectedSpanChirho.utf8TextChirho) &&
      (!requireVisionChirho || expectedProvenanceChirho === undefined || actualSpanChirho?.provenanceChirho === expectedProvenanceChirho)
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

function verdictForSpanChirho(
  configChirho: RepairLineConfigChirho,
  segmentIndexChirho: number,
  garbleTextChirho: string,
  scriptChirho: string,
  notesChirho: string
): VisionVerdictChirho {
  const spanChirho = configChirho.nextSpansChirho.find((candidateChirho) => candidateChirho.segmentIndexChirho === segmentIndexChirho);
  if (spanChirho === undefined) throw new Error(`${configChirho.labelChirho} missing segment ${segmentIndexChirho}`);
  return {
    volumeChirho: configChirho.volumeChirho,
    pageChirho: configChirho.pageChirho,
    lineIndexChirho: configChirho.lineIndexChirho,
    segmentIndexChirho,
    garbleTextChirho,
    scriptChirho,
    utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
    notesChirho,
  };
}

function lineConfigForRahlfsChirho(appliedAtChirho: string): RepairLineConfigChirho {
  const nextSpanChirho = visionSpanChirho(
    {
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: 1274,
      scriptChirho: "french-chirho",
      utf8TextChirho: RAHFLS_NEXT_TEXT_CHIRHO,
    },
    appliedAtChirho,
    RAHFLS_NOTES_CHIRHO
  );
  const configChirho: RepairLineConfigChirho = {
    labelChirho: "vol3-p150-l16-chirho",
    pathChirho: RAHFLS_LINE_PATH_CHIRHO,
    volumeChirho: 3,
    pageChirho: 150,
    lineIndexChirho: 16,
    preSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 1274,
        scriptChirho: "french-chirho",
        utf8TextChirho: RAHFLS_PRE_TEXT_CHIRHO,
      },
    ],
    nextSpansChirho: [nextSpanChirho],
    verdictsChirho: [],
  };
  configChirho.verdictsChirho = [verdictForSpanChirho(configChirho, 0, "Rabhlfs / inexploitées{2?", "french-chirho", RAHFLS_NOTES_CHIRHO)];
  return configChirho;
}

function lineConfigForGreekApparatusChirho(
  appliedAtChirho: string,
  lineIndexChirho: number,
  pathChirho: string,
  lineWidthChirho: number,
  labelTextChirho: string,
  tailTextChirho: string,
  positionsChirho: {
    labelWidthChirho: number;
    phraseXChirho: number;
    phraseWidthChirho: number;
    symbolXChirho: number;
    symbolWidthChirho: number;
    theosXChirho: number;
    theosWidthChirho: number;
    tailXChirho: number;
    tailWidthChirho: number;
  },
  preSpansChirho: RepairLineConfigChirho["preSpansChirho"],
  symbolGarbleChirho: string,
  theosGarbleChirho: string
): RepairLineConfigChirho {
  const nextSpansChirho: SpanChirho[] = [
    {
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: positionsChirho.labelWidthChirho,
      scriptChirho: "french-chirho",
      utf8TextChirho: labelTextChirho,
    },
    visionSpanChirho(
      {
        segmentIndexChirho: 1,
        xMinPxChirho: positionsChirho.phraseXChirho,
        widthPxChirho: positionsChirho.phraseWidthChirho,
        scriptChirho: "greek-chirho",
        utf8TextChirho: GREEK_PHRASE_CHIRHO,
      },
      appliedAtChirho,
      GREEK_PHRASE_NOTES_CHIRHO
    ),
    visionSpanChirho(
      {
        segmentIndexChirho: 2,
        xMinPxChirho: positionsChirho.symbolXChirho,
        widthPxChirho: positionsChirho.symbolWidthChirho,
        scriptChirho: "symbol-chirho",
        utf8TextChirho: APPARATUS_SYMBOL_CHIRHO,
      },
      appliedAtChirho,
      APPARATUS_SYMBOL_NOTES_CHIRHO
    ),
    visionSpanChirho(
      {
        segmentIndexChirho: 3,
        xMinPxChirho: positionsChirho.theosXChirho,
        widthPxChirho: positionsChirho.theosWidthChirho,
        scriptChirho: "greek-chirho",
        utf8TextChirho: GREEK_THEOS_CHIRHO,
      },
      appliedAtChirho,
      GREEK_THEOS_NOTES_CHIRHO
    ),
    {
      segmentIndexChirho: 4,
      xMinPxChirho: positionsChirho.tailXChirho,
      widthPxChirho: positionsChirho.tailWidthChirho,
      scriptChirho: "french-chirho",
      utf8TextChirho: tailTextChirho,
    },
  ];
  const configChirho: RepairLineConfigChirho = {
    labelChirho: `vol3-p152-l${String(lineIndexChirho).padStart(3, "0")}-chirho`,
    pathChirho,
    volumeChirho: 3,
    pageChirho: 152,
    lineIndexChirho,
    preSpansChirho,
    nextSpansChirho,
    verdictsChirho: [],
  };
  configChirho.verdictsChirho = [
    verdictForSpanChirho(configChirho, 1, "old Greek span swallowed .967", "greek-chirho", GREEK_PHRASE_NOTES_CHIRHO),
    verdictForSpanChirho(configChirho, 2, symbolGarbleChirho, "symbol-chirho", APPARATUS_SYMBOL_NOTES_CHIRHO),
    verdictForSpanChirho(configChirho, 3, theosGarbleChirho, "greek-chirho", GREEK_THEOS_NOTES_CHIRHO),
  ];
  if (lineWidthChirho !== positionsChirho.tailXChirho + positionsChirho.tailWidthChirho) {
    throw new Error(`bad line config for line ${lineIndexChirho}: positions end at ${positionsChirho.tailXChirho + positionsChirho.tailWidthChirho}, expected ${lineWidthChirho}`);
  }
  return configChirho;
}

function repairConfigsChirho(appliedAtChirho: string): RepairLineConfigChirho[] {
  return [
    lineConfigForRahlfsChirho(appliedAtChirho),
    lineConfigForGreekApparatusChirho(
      appliedAtChirho,
      21,
      L21_LINE_PATH_CHIRHO,
      822,
      "f) en 45,18a:",
      "Cpl et rel.[6]",
      {
        labelWidthChirho: 195,
        phraseXChirho: 195,
        phraseWidthChirho: 193,
        symbolXChirho: 388,
        symbolWidthChirho: 137,
        theosXChirho: 525,
        theosWidthChirho: 119,
        tailXChirho: 644,
        tailWidthChirho: 178,
      },
      [
        { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 195, scriptChirho: "french-chirho", utf8TextChirho: "f) en 45,18a:" },
        { segmentIndexChirho: 1, xMinPxChirho: 195, widthPxChirho: 268, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
        { segmentIndexChirho: 2, xMinPxChirho: 463, widthPxChirho: 30, scriptChirho: "symbol-chirho", utf8TextChirho: "≠" },
        { segmentIndexChirho: 3, xMinPxChirho: 493, widthPxChirho: 66, scriptChirho: "french-chirho", utf8TextChirho: "+0" },
        { segmentIndexChirho: 4, xMinPxChirho: 559, widthPxChirho: 79, scriptChirho: "greek-chirho", utf8TextChirho: "θεός" },
        { segmentIndexChirho: 5, xMinPxChirho: 638, widthPxChirho: 184, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[6]" },
      ],
      "omitted .967 + fragmented ≠ / +0",
      "+0 / θεός"
    ),
    lineConfigForGreekApparatusChirho(
      appliedAtChirho,
      22,
      L22_LINE_PATH_CHIRHO,
      810,
      "g) en 46,1a:",
      "Cpl et rel.[7]",
      {
        labelWidthChirho: 184,
        phraseXChirho: 184,
        phraseWidthChirho: 193,
        symbolXChirho: 377,
        symbolWidthChirho: 146,
        theosXChirho: 523,
        theosWidthChirho: 108,
        tailXChirho: 631,
        tailWidthChirho: 179,
      },
      [
        { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 184, scriptChirho: "french-chirho", utf8TextChirho: "g) en 46,1a:" },
        { segmentIndexChirho: 1, xMinPxChirho: 184, widthPxChirho: 267, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
        { segmentIndexChirho: 2, xMinPxChirho: 451, widthPxChirho: 95, scriptChirho: "french-chirho", utf8TextChirho: "4 +6" },
        { segmentIndexChirho: 3, xMinPxChirho: 546, widthPxChirho: 79, scriptChirho: "greek-chirho", utf8TextChirho: "θεός" },
        { segmentIndexChirho: 4, xMinPxChirho: 625, widthPxChirho: 185, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[7]" },
      ],
      "omitted .967 / OCR 4 +6",
      "4 +6 / θεός"
    ),
    lineConfigForGreekApparatusChirho(
      appliedAtChirho,
      23,
      L23_LINE_PATH_CHIRHO,
      832,
      "h).en 46,16a:",
      "Cpl et rel.[8]",
      {
        labelWidthChirho: 204,
        phraseXChirho: 204,
        phraseWidthChirho: 193,
        symbolXChirho: 397,
        symbolWidthChirho: 128,
        theosXChirho: 525,
        theosWidthChirho: 128,
        tailXChirho: 653,
        tailWidthChirho: 179,
      },
      [
        { segmentIndexChirho: 0, xMinPxChirho: 0, widthPxChirho: 204, scriptChirho: "french-chirho", utf8TextChirho: "h).en 46,16a:" },
        { segmentIndexChirho: 1, xMinPxChirho: 204, widthPxChirho: 268, scriptChirho: "greek-chirho", utf8TextChirho: GREEK_PHRASE_CHIRHO },
        { segmentIndexChirho: 2, xMinPxChirho: 472, widthPxChirho: 30, scriptChirho: "symbol-chirho", utf8TextChirho: "≠" },
        { segmentIndexChirho: 3, xMinPxChirho: 502, widthPxChirho: 66, scriptChirho: "french-chirho", utf8TextChirho: "+6" },
        { segmentIndexChirho: 4, xMinPxChirho: 568, widthPxChirho: 79, scriptChirho: "greek-chirho", utf8TextChirho: "θεός" },
        { segmentIndexChirho: 5, xMinPxChirho: 647, widthPxChirho: 185, scriptChirho: "french-chirho", utf8TextChirho: "Cpl et rel.[8]" },
      ],
      "omitted .967 + fragmented ≠ / +6",
      "+6 / θεός"
    ),
  ];
}

function lineSummaryChirho(labelChirho: string, stateChirho: RepairLineSummaryChirho["stateChirho"], lineChirho: SpanLineChirho): RepairLineSummaryChirho {
  return {
    labelChirho,
    stateChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
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

function upsertVisionBackupChirho(configsChirho: RepairLineConfigChirho[], appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const replacementKeysChirho = new Set(
    configsChirho.flatMap((configChirho) =>
      configChirho.verdictsChirho.map(
        (verdictChirho) =>
          `${verdictChirho.volumeChirho}:${verdictChirho.pageChirho}:${verdictChirho.lineIndexChirho}:${verdictChirho.segmentIndexChirho}`
      )
    )
  );
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !replacementKeysChirho.has(`${candidateChirho.volumeChirho}:${candidateChirho.pageChirho}:${candidateChirho.lineIndexChirho}:${candidateChirho.segmentIndexChirho}`)
  );
  const nextVerdictsChirho = configsChirho.flatMap((configChirho) => configChirho.verdictsChirho);
  verdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return nextVerdictsChirho.length;
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const configsChirho = repairConfigsChirho(appliedAtChirho);
  const loadedLinesChirho = configsChirho.map((configChirho) => {
    if (configChirho.pathChirho !== spanLinePathChirho(configChirho.volumeChirho, configChirho.pageChirho, configChirho.lineIndexChirho)) {
      throw new Error(`unexpected span path for ${configChirho.labelChirho}`);
    }
    const lineChirho = loadJsonChirho<SpanLineChirho>(configChirho.pathChirho);
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
            "ready to clean final hidden-Hebrew scanner residue: Rahlfs/429 and three Greek apparatus `.967 ≠ + ὁ θεός` lines",
            "scanner should reach zero candidates after regeneration; changed spans remain vision-tier in Greek or Latin/symbol review lanes",
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
    if (itemChirho.stateChirho !== "already-applied-chirho") {
      writeJsonChirho(itemChirho.configChirho.pathChirho, itemChirho.plannedLineChirho);
    }
  }
  const upsertCountChirho = upsertVisionBackupChirho(configsChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [`applied final scanner-residue cleanup and upserted ${upsertCountChirho} durable vision verdicts`, "regenerate export/report/packs/scanner/status next"],
        loadedLinesChirho.map((itemChirho) => lineSummaryChirho(itemChirho.configChirho.labelChirho, "already-applied-chirho", itemChirho.plannedLineChirho))
      ),
      null,
      2
    )
  );
}

mainChirho();
