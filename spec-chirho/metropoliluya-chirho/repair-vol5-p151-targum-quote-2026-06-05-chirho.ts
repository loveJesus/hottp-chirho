// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for the vol 5 p151 Job 17:4 Targum quote.
 *
 * The line headed "Quant au 𝔗" is Targum/Aramaic-style Hebrew script.
 * Earlier RTL geometry cleanup left Hebrew/WLC-style words in the boxes.
 * This repair stores conservative consonantal Targum readings as vision-tier
 * text and routes exact Aramaic wording/vocalization/marks to expert review.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO } from "../../src-chirho/span-line-text-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-p151-targum-quote-2026-06-05-chirho";
const LINE_1_PATH_CHIRHO = spanLinePathChirho(5, 151, 1);
const LINE_2_PATH_CHIRHO = spanLinePathChirho(5, 151, 2);
const VISION_VERDICTS_BACKUP_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "spec-chirho",
  "metropoliluya-chirho",
  "vision-verdicts-backup-2026-05-31-chirho.json"
);
const APPLIED_STATUS_CHIRHO = "targum-quote-consonantal-repair-chirho";

const LINE_1_S3_TEXT_CHIRHO = "קבורין";
const LINE_1_S5_TEXT_CHIRHO = "יומי דעיכו";
const LINE_1_S7_TEXT_CHIRHO = "נפשי מתחבלא";
const LINE_2_S0_TEXT_CHIRHO = "מתקנן לי";
const LINE_1_S1_TEXT_CHIRHO = "𝔗";

const LINE_1_S1_NOTES_CHIRHO =
  "Repaired vol 5 p151 line 1 S1 witness siglum: the print reads `Quant au 𝔗`, not `Quant au 𝔐`. This keeps the witness label consistent with the Targum/Aramaic quote on the same line. Stored as vision-chirho and routed to Latin/symbol proofing; exact witness-siglum confirmation remains human-review tier.";
const LINE_1_S3_NOTES_CHIRHO =
  "Repaired vol 5 p151 line 1 S3 in the `Quant au 𝔗` Job 17:4 quote: the printed box reads Targum/Aramaic consonants `קבורין`, not Hebrew/WLC-style `קְבָרִ֣ים`. Stored consonants-only as vision-chirho; exact Aramaic spelling, vowels, and marks remain Targum/Hebrew-script expert-confirmation tier.";
const LINE_1_S5_NOTES_CHIRHO =
  "Repaired vol 5 p151 line 1 S5 in the `Quant au 𝔗` Job 17:4 quote: the printed middle phrase reads Targum/Aramaic consonants `יומי דעיכו`, not Hebrew/WLC-style `יָמַ֣י נִזְעָ֑כוּ`. Stored consonants-only as vision-chirho; exact Aramaic spelling, vowels, and marks remain Targum/Hebrew-script expert-confirmation tier.";
const LINE_1_S7_NOTES_CHIRHO =
  "Repaired vol 5 p151 line 1 S7 in the `Quant au 𝔗` Job 17:4 quote: the printed rightmost phrase reads Targum/Aramaic consonants `נפשי מתחבלא`, not Hebrew/WLC-style `רוּחִ֣י חֻ֭בָּלָה`. Stored consonants-only as vision-chirho; exact Aramaic spelling, vowels, and marks remain Targum/Hebrew-script expert-confirmation tier.";
const LINE_2_S0_NOTES_CHIRHO =
  "Repaired vol 5 p151 line 2 S0, the continuation of the `Quant au 𝔗` Job 17:4 quote: the scanline contains a Targum/Aramaic word before `לי`, visually read here as consonants `מתקנן לי`; the old raw span stored only `לִֽי`. Stored consonants-only as vision-chirho; exact Aramaic spelling (including any yod/nun distinction), vowels, marks, and punctuation relation to the following period remain expert-confirmation tier.";

interface SpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
  visionTranscribedAtChirho?: string;
  visionNotesChirho?: string;
  visionCorrectionStatusChirho?: string;
  [keyChirho: string]: unknown;
}

interface SpanLineChirho {
  schemaVersionChirho: number;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  lineWidthPxChirho: number;
  lineHeightPxChirho: number;
  lineTextOrderChirho?: string;
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

function spanByIndexChirho(lineChirho: SpanLineChirho, segmentIndexChirho: number): SpanChirho {
  const spanChirho = sortedSpansChirho(lineChirho).find((candidateChirho) => candidateChirho.segmentIndexChirho === segmentIndexChirho);
  if (spanChirho === undefined) throw new Error(`missing segment ${segmentIndexChirho}`);
  return spanChirho;
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

function validateLineIdentityChirho(lineChirho: SpanLineChirho, lineIndexChirho: number, widthChirho: number): void {
  if (lineChirho.volumeChirho !== 5 || lineChirho.pageChirho !== 151 || lineChirho.lineIndexChirho !== lineIndexChirho) {
    throw new Error(`target line identity mismatch for line ${lineIndexChirho}`);
  }
  if (lineChirho.lineWidthPxChirho !== widthChirho) {
    throw new Error(`line ${lineIndexChirho} width ${lineChirho.lineWidthPxChirho} !== expected ${widthChirho}`);
  }
  validateTilingChirho(lineChirho);
}

function textChirho(spanChirho: SpanChirho): string {
  return normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
}

function currentPreRepairChirho(line1Chirho: SpanLineChirho, line2Chirho: SpanLineChirho): boolean {
  validateLineIdentityChirho(line1Chirho, 1, 2050);
  validateLineIdentityChirho(line2Chirho, 2, 317);
  return (
    line1Chirho.lineTextOrderChirho === RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO &&
    textChirho(spanByIndexChirho(line1Chirho, 1)) === "𝔐" &&
    textChirho(spanByIndexChirho(line1Chirho, 3)) === LINE_1_S3_TEXT_CHIRHO &&
    textChirho(spanByIndexChirho(line1Chirho, 5)) === LINE_1_S5_TEXT_CHIRHO &&
    textChirho(spanByIndexChirho(line1Chirho, 7)) === LINE_1_S7_TEXT_CHIRHO &&
    textChirho(spanByIndexChirho(line2Chirho, 0)) === LINE_2_S0_TEXT_CHIRHO &&
    textChirho(spanByIndexChirho(line2Chirho, 1)) === "."
  );
}

function currentAlreadyAppliedChirho(line1Chirho: SpanLineChirho, line2Chirho: SpanLineChirho): boolean {
  validateLineIdentityChirho(line1Chirho, 1, 2050);
  validateLineIdentityChirho(line2Chirho, 2, 317);
  const s3Chirho = spanByIndexChirho(line1Chirho, 3);
  const s5Chirho = spanByIndexChirho(line1Chirho, 5);
  const s7Chirho = spanByIndexChirho(line1Chirho, 7);
  const s1Chirho = spanByIndexChirho(line1Chirho, 1);
  const s0Chirho = spanByIndexChirho(line2Chirho, 0);
  return (
    line1Chirho.lineTextOrderChirho === RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO &&
    textChirho(s1Chirho) === LINE_1_S1_TEXT_CHIRHO &&
    textChirho(s3Chirho) === LINE_1_S3_TEXT_CHIRHO &&
    textChirho(s5Chirho) === LINE_1_S5_TEXT_CHIRHO &&
    textChirho(s7Chirho) === LINE_1_S7_TEXT_CHIRHO &&
    textChirho(s0Chirho) === LINE_2_S0_TEXT_CHIRHO &&
    s1Chirho.provenanceChirho === "vision-chirho" &&
    s3Chirho.provenanceChirho === "vision-chirho" &&
    s5Chirho.provenanceChirho === "vision-chirho" &&
    s7Chirho.provenanceChirho === "vision-chirho" &&
    s0Chirho.provenanceChirho === "vision-chirho" &&
    s1Chirho.visionCorrectionStatusChirho === APPLIED_STATUS_CHIRHO &&
    s3Chirho.visionCorrectionStatusChirho === APPLIED_STATUS_CHIRHO &&
    s5Chirho.visionCorrectionStatusChirho === APPLIED_STATUS_CHIRHO &&
    s7Chirho.visionCorrectionStatusChirho === APPLIED_STATUS_CHIRHO &&
    s0Chirho.visionCorrectionStatusChirho === APPLIED_STATUS_CHIRHO
  );
}

function stateChirho(line1Chirho: SpanLineChirho, line2Chirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  if (currentPreRepairChirho(line1Chirho, line2Chirho)) return "pre-repair-chirho";
  if (currentAlreadyAppliedChirho(line1Chirho, line2Chirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function markVisionChirho(spanChirho: SpanChirho, textValueChirho: string, notesChirho: string, appliedAtChirho: string): void {
  spanChirho.utf8TextChirho = normalizeTextForStorageChirho(textValueChirho);
  spanChirho.provenanceChirho = "vision-chirho";
  spanChirho.visionTranscribedAtChirho = appliedAtChirho;
  spanChirho.visionCorrectionStatusChirho = APPLIED_STATUS_CHIRHO;
  spanChirho.visionNotesChirho = notesChirho;
}

function plannedLinesChirho(line1Chirho: SpanLineChirho, line2Chirho: SpanLineChirho, appliedAtChirho: string): [SpanLineChirho, SpanLineChirho] {
  const nextLine1Chirho = structuredClone(line1Chirho);
  const nextLine2Chirho = structuredClone(line2Chirho);
  nextLine1Chirho.lineTextOrderChirho = RTL_RUNS_LOGICAL_LINE_TEXT_ORDER_CHIRHO;
  markVisionChirho(spanByIndexChirho(nextLine1Chirho, 1), LINE_1_S1_TEXT_CHIRHO, LINE_1_S1_NOTES_CHIRHO, appliedAtChirho);
  markVisionChirho(spanByIndexChirho(nextLine1Chirho, 3), LINE_1_S3_TEXT_CHIRHO, LINE_1_S3_NOTES_CHIRHO, appliedAtChirho);
  markVisionChirho(spanByIndexChirho(nextLine1Chirho, 5), LINE_1_S5_TEXT_CHIRHO, LINE_1_S5_NOTES_CHIRHO, appliedAtChirho);
  markVisionChirho(spanByIndexChirho(nextLine1Chirho, 7), LINE_1_S7_TEXT_CHIRHO, LINE_1_S7_NOTES_CHIRHO, appliedAtChirho);
  markVisionChirho(spanByIndexChirho(nextLine2Chirho, 0), LINE_2_S0_TEXT_CHIRHO, LINE_2_S0_NOTES_CHIRHO, appliedAtChirho);
  normalizeSpanLineTextFieldsChirho(nextLine1Chirho);
  normalizeSpanLineTextFieldsChirho(nextLine2Chirho);
  validateLineIdentityChirho(nextLine1Chirho, 1, 2050);
  validateLineIdentityChirho(nextLine2Chirho, 2, 317);
  return [nextLine1Chirho, nextLine2Chirho];
}

function visionVerdictsChirho(line1Chirho: SpanLineChirho, line2Chirho: SpanLineChirho): VisionVerdictChirho[] {
  return [
    {
      volumeChirho: 5,
      pageChirho: 151,
      lineIndexChirho: 1,
      segmentIndexChirho: 1,
      garbleTextChirho: "raw symbol text `𝔐` in a printed `Quant au 𝔗` Targum/Aramaic quote",
      scriptChirho: "symbol-chirho",
      utf8TextChirho: textChirho(spanByIndexChirho(line1Chirho, 1)),
      notesChirho: spanByIndexChirho(line1Chirho, 1).visionNotesChirho ?? LINE_1_S1_NOTES_CHIRHO,
    },
    {
      volumeChirho: 5,
      pageChirho: 151,
      lineIndexChirho: 1,
      segmentIndexChirho: 3,
      garbleTextChirho: "previous vision-tier text `קְבָרִ֣ים` in a Targum/Aramaic 𝔗 quote",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: textChirho(spanByIndexChirho(line1Chirho, 3)),
      notesChirho: spanByIndexChirho(line1Chirho, 3).visionNotesChirho ?? LINE_1_S3_NOTES_CHIRHO,
    },
    {
      volumeChirho: 5,
      pageChirho: 151,
      lineIndexChirho: 1,
      segmentIndexChirho: 5,
      garbleTextChirho: "raw Pass-C text `יָמַ֣י נִזְעָ֑כוּ` in a Targum/Aramaic 𝔗 quote",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: textChirho(spanByIndexChirho(line1Chirho, 5)),
      notesChirho: spanByIndexChirho(line1Chirho, 5).visionNotesChirho ?? LINE_1_S5_NOTES_CHIRHO,
    },
    {
      volumeChirho: 5,
      pageChirho: 151,
      lineIndexChirho: 1,
      segmentIndexChirho: 7,
      garbleTextChirho: "previous vision-tier text `רוּחִ֣י חֻ֭בָּלָה` in a Targum/Aramaic 𝔗 quote",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: textChirho(spanByIndexChirho(line1Chirho, 7)),
      notesChirho: spanByIndexChirho(line1Chirho, 7).visionNotesChirho ?? LINE_1_S7_NOTES_CHIRHO,
    },
    {
      volumeChirho: 5,
      pageChirho: 151,
      lineIndexChirho: 2,
      segmentIndexChirho: 0,
      garbleTextChirho: "raw Pass-C text `לִֽי` omitted the preceding Targum/Aramaic word",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: textChirho(spanByIndexChirho(line2Chirho, 0)),
      notesChirho: spanByIndexChirho(line2Chirho, 0).visionNotesChirho ?? LINE_2_S0_NOTES_CHIRHO,
    },
  ];
}

function upsertVisionBackupChirho(line1Chirho: SpanLineChirho, line2Chirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const nextVerdictsChirho = visionVerdictsChirho(line1Chirho, line2Chirho);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !nextVerdictsChirho.some(
        (verdictChirho) =>
          candidateChirho.volumeChirho === verdictChirho.volumeChirho &&
          candidateChirho.pageChirho === verdictChirho.pageChirho &&
          candidateChirho.lineIndexChirho === verdictChirho.lineIndexChirho &&
          candidateChirho.segmentIndexChirho === verdictChirho.segmentIndexChirho
      )
  );
  verdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return nextVerdictsChirho.length;
}

function reportSpanChirho(lineChirho: SpanLineChirho, segmentIndexChirho: number): unknown {
  const spanChirho = spanByIndexChirho(lineChirho, segmentIndexChirho);
  return {
    lineIndexChirho: lineChirho.lineIndexChirho,
    segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho ?? null,
  };
}

function reportChirho(
  modeChirho: string,
  statusChirho: string,
  messagesChirho: string[],
  line1Chirho: SpanLineChirho,
  line2Chirho: SpanLineChirho
): unknown {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    spansChirho: [
      reportSpanChirho(line1Chirho, 1),
      reportSpanChirho(line1Chirho, 3),
      reportSpanChirho(line1Chirho, 5),
      reportSpanChirho(line1Chirho, 7),
      reportSpanChirho(line2Chirho, 0),
    ],
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const line1Chirho = loadJsonChirho<SpanLineChirho>(LINE_1_PATH_CHIRHO);
  const line2Chirho = loadJsonChirho<SpanLineChirho>(LINE_2_PATH_CHIRHO);
  const stateValueChirho = stateChirho(line1Chirho, line2Chirho);
  if (stateValueChirho === "unknown-chirho") {
    console.log(JSON.stringify(reportChirho(modeChirho, "blocked-chirho", ["target lines are not in the expected pre-repair or already-applied state"], line1Chirho, line2Chirho), null, 2));
    process.exitCode = 1;
    return;
  }
  const [nextLine1Chirho, nextLine2Chirho] = stateValueChirho === "already-applied-chirho"
    ? [line1Chirho, line2Chirho]
    : plannedLinesChirho(line1Chirho, line2Chirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          stateValueChirho === "already-applied-chirho" ? "already-applied-chirho" : "planned-chirho",
          ["ready to replace the witness siglum and Hebrew/WLC-style text with conservative Targum/Aramaic vision-tier text"],
          nextLine1Chirho,
          nextLine2Chirho
        ),
        null,
        2
      )
    );
    return;
  }
  if (stateValueChirho !== "already-applied-chirho") {
    writeJsonChirho(LINE_1_PATH_CHIRHO, nextLine1Chirho);
    writeJsonChirho(LINE_2_PATH_CHIRHO, nextLine2Chirho);
  }
  const upsertedChirho = upsertVisionBackupChirho(nextLine1Chirho, nextLine2Chirho, appliedAtChirho);
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", [`applied repair and upserted ${upsertedChirho} vision backup row(s)`], nextLine1Chirho, nextLine2Chirho), null, 2));
}

mainChirho();
