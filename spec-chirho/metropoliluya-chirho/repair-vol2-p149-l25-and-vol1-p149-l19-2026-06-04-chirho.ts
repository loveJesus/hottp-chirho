// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for two second-witnessed low-residue lines:
 *
 * - vol 2 p149 line 25: split the mis-OCR `1?` into the Hebrew root `יסר`.
 * - vol 1 p149 line 19: correct the OCR brace in `(cf. vs 9},` to the
 *   printed closing parenthesis `(cf. vs 9),`.
 *
 * Both are machine-witnessed repairs and therefore remain vision-tier, not
 * human-certified.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol2-p149-l25-and-vol1-p149-l19-2026-06-04-chirho";
const VOL2_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-2-chirho",
  "page-0149-chirho",
  "line-025-chirho.json"
);
const VOL1_LINE_PATH_CHIRHO = join(
  PROJECT_ROOT_CHIRHO,
  "workspace-chirho",
  "spans-chirho",
  "vol-1-chirho",
  "page-0149-chirho",
  "line-019-chirho.json"
);
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

const VOL2_PRE_TEXT_CHIRHO = "la forme dérivée de 1? que le *M donne ici n’y a été lue que par la *V et le *T, alors";
const VOL2_FRENCH_BEFORE_CHIRHO = "la forme dérivée de";
const VOL2_HEBREW_TEXT_CHIRHO = "יסר";
const VOL2_FRENCH_AFTER_CHIRHO = "que le *M donne ici n’y a été lue que par la *V et le *T, alors";
const VOL2_HEBREW_NOTES_CHIRHO =
  "Recovered vol 2 p149 line 25 hidden Hebrew root from OCR `1?`. Claude and Codex independently read the scanline as bare consonantal `יסר` (yod-samekh-resh), the root behind the surrounding Isaiah 8:11 discussion. Stored as vision-chirho, consonants-only; exact letters/marks and segmentation remain Hebrew/WLC expert-confirmation tier.";

const VOL1_PRE_TEXT_CHIRHO =
  "s'étaient tenus les pieds des prêtres” (cf. vs 9}, au vs 8 “selon le nombre des tribus d'Is-";
const VOL1_CORRECTED_TEXT_CHIRHO =
  "s'étaient tenus les pieds des prêtres” (cf. vs 9), au vs 8 “selon le nombre des tribus d'Is-";
const VOL1_FRENCH_NOTES_CHIRHO =
  "Corrected vol 1 p149 line 19 OCR punctuation after second-witness scanline review: the print reads `(cf. vs 9),`, with a closing parenthesis balancing `(cf.`, not the stored brace `}`. Stored as french-chirho vision-tier cleanup; no other line text changed.";

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

function renderedLineChirho(lineChirho: SpanLineChirho): string {
  return sortedSpansChirho(lineChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join(" ");
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

function validateTargetLineChirho(lineChirho: SpanLineChirho, volumeChirho: number, pageChirho: number, lineIndexChirho: number): void {
  if (lineChirho.volumeChirho !== volumeChirho || lineChirho.pageChirho !== pageChirho || lineChirho.lineIndexChirho !== lineIndexChirho) {
    throw new Error(`span file is not vol ${volumeChirho} page ${pageChirho} line ${lineIndexChirho}`);
  }
}

function isVol2PreRepairLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 1 &&
    spansChirho[0]?.segmentIndexChirho === 0 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 1443 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === VOL2_PRE_TEXT_CHIRHO
  );
}

function isVol2AlreadyAppliedLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 3 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 340 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === VOL2_FRENCH_BEFORE_CHIRHO &&
    spansChirho[1]?.xMinPxChirho === 340 &&
    spansChirho[1]?.widthPxChirho === 70 &&
    spansChirho[1]?.scriptChirho === "hebrew-chirho" &&
    spansChirho[1]?.utf8TextChirho === VOL2_HEBREW_TEXT_CHIRHO &&
    spansChirho[1]?.provenanceChirho === "vision-chirho" &&
    spansChirho[2]?.xMinPxChirho === 410 &&
    spansChirho[2]?.widthPxChirho === 1033 &&
    spansChirho[2]?.scriptChirho === "french-chirho" &&
    spansChirho[2]?.utf8TextChirho === VOL2_FRENCH_AFTER_CHIRHO
  );
}

function isVol1PreRepairLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 1 &&
    spansChirho[0]?.segmentIndexChirho === 0 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 1446 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === VOL1_PRE_TEXT_CHIRHO
  );
}

function isVol1AlreadyAppliedLineChirho(lineChirho: SpanLineChirho): boolean {
  const spansChirho = sortedSpansChirho(lineChirho);
  return (
    spansChirho.length === 1 &&
    spansChirho[0]?.segmentIndexChirho === 0 &&
    spansChirho[0]?.xMinPxChirho === 0 &&
    spansChirho[0]?.widthPxChirho === 1446 &&
    spansChirho[0]?.scriptChirho === "french-chirho" &&
    spansChirho[0]?.utf8TextChirho === VOL1_CORRECTED_TEXT_CHIRHO &&
    spansChirho[0]?.provenanceChirho === "vision-chirho"
  );
}

function stateForVol2LineChirho(lineChirho: SpanLineChirho): RepairLineSummaryChirho["stateChirho"] {
  if (isVol2PreRepairLineChirho(lineChirho)) return "pre-repair-chirho";
  if (isVol2AlreadyAppliedLineChirho(lineChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function stateForVol1LineChirho(lineChirho: SpanLineChirho): RepairLineSummaryChirho["stateChirho"] {
  if (isVol1PreRepairLineChirho(lineChirho)) return "pre-repair-chirho";
  if (isVol1AlreadyAppliedLineChirho(lineChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildVol2LineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    {
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: 340,
      scriptChirho: "french-chirho",
      utf8TextChirho: VOL2_FRENCH_BEFORE_CHIRHO,
    },
    {
      segmentIndexChirho: 1,
      xMinPxChirho: 340,
      widthPxChirho: 70,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(VOL2_HEBREW_TEXT_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: VOL2_HEBREW_NOTES_CHIRHO,
    },
    {
      segmentIndexChirho: 2,
      xMinPxChirho: 410,
      widthPxChirho: 1033,
      scriptChirho: "french-chirho",
      utf8TextChirho: VOL2_FRENCH_AFTER_CHIRHO,
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function buildVol1LineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = [
    {
      ...sortedSpansChirho(lineChirho)[0],
      segmentIndexChirho: 0,
      xMinPxChirho: 0,
      widthPxChirho: 1446,
      scriptChirho: "french-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(VOL1_CORRECTED_TEXT_CHIRHO),
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: VOL1_FRENCH_NOTES_CHIRHO,
    },
  ];
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictsForLinesChirho(vol2LineChirho: SpanLineChirho, vol1LineChirho: SpanLineChirho): VisionVerdictChirho[] {
  const vol2HebrewSpanChirho = sortedSpansChirho(vol2LineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 1 && spanChirho.scriptChirho === "hebrew-chirho" && spanChirho.provenanceChirho === "vision-chirho"
  );
  const vol1FrenchSpanChirho = sortedSpansChirho(vol1LineChirho).find(
    (spanChirho) => spanChirho.segmentIndexChirho === 0 && spanChirho.scriptChirho === "french-chirho" && spanChirho.provenanceChirho === "vision-chirho"
  );
  if (vol2HebrewSpanChirho === undefined) throw new Error("vol 2 p149 L25 vision Hebrew span missing");
  if (vol1FrenchSpanChirho === undefined) throw new Error("vol 1 p149 L19 vision French span missing");
  return [
    {
      volumeChirho: 2,
      pageChirho: 149,
      lineIndexChirho: 25,
      segmentIndexChirho: 1,
      garbleTextChirho: "1?",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(vol2HebrewSpanChirho.utf8TextChirho),
      notesChirho: vol2HebrewSpanChirho.visionNotesChirho ?? VOL2_HEBREW_NOTES_CHIRHO,
    },
    {
      volumeChirho: 1,
      pageChirho: 149,
      lineIndexChirho: 19,
      segmentIndexChirho: 0,
      garbleTextChirho: "vs 9},",
      scriptChirho: "french-chirho",
      utf8TextChirho: normalizeTextForStorageChirho(vol1FrenchSpanChirho.utf8TextChirho),
      notesChirho: vol1FrenchSpanChirho.visionNotesChirho ?? VOL1_FRENCH_NOTES_CHIRHO,
    },
  ];
}

function upsertVisionBackupChirho(vol2LineChirho: SpanLineChirho, vol1LineChirho: SpanLineChirho, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !(
        (candidateChirho.volumeChirho === 2 &&
          candidateChirho.pageChirho === 149 &&
          candidateChirho.lineIndexChirho === 25 &&
          candidateChirho.segmentIndexChirho === 1) ||
        (candidateChirho.volumeChirho === 1 &&
          candidateChirho.pageChirho === 149 &&
          candidateChirho.lineIndexChirho === 19 &&
          candidateChirho.segmentIndexChirho === 0)
      )
  );
  const nextVerdictsChirho = visionVerdictsForLinesChirho(vol2LineChirho, vol1LineChirho);
  verdictsChirho.push(...nextVerdictsChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
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

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  vol2LineChirho: SpanLineChirho,
  vol2StateChirho: RepairLineSummaryChirho["stateChirho"],
  vol1LineChirho: SpanLineChirho,
  vol1StateChirho: RepairLineSummaryChirho["stateChirho"]
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    linesChirho: [
      lineSummaryChirho("vol2-p149-l25-chirho", vol2StateChirho, vol2LineChirho),
      lineSummaryChirho("vol1-p149-l19-chirho", vol1StateChirho, vol1LineChirho),
    ],
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const vol2LineChirho = loadJsonChirho<SpanLineChirho>(VOL2_LINE_PATH_CHIRHO);
  const vol1LineChirho = loadJsonChirho<SpanLineChirho>(VOL1_LINE_PATH_CHIRHO);
  validateTargetLineChirho(vol2LineChirho, 2, 149, 25);
  validateTargetLineChirho(vol1LineChirho, 1, 149, 19);
  validateTilingChirho(vol2LineChirho);
  validateTilingChirho(vol1LineChirho);

  const vol2StateChirho = stateForVol2LineChirho(vol2LineChirho);
  const vol1StateChirho = stateForVol1LineChirho(vol1LineChirho);
  if (vol2StateChirho === "unknown-chirho" || vol1StateChirho === "unknown-chirho") {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          "blocked-chirho",
          [
            "one or both target lines are not in the expected pre-repair or already-applied state; refusing to guess around current edits",
            `vol2 rendered line: ${JSON.stringify(renderedLineChirho(vol2LineChirho))}`,
            `vol1 rendered line: ${JSON.stringify(renderedLineChirho(vol1LineChirho))}`,
          ],
          vol2LineChirho,
          vol2StateChirho,
          vol1LineChirho,
          vol1StateChirho
        ),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  const plannedVol2LineChirho =
    vol2StateChirho === "already-applied-chirho" ? vol2LineChirho : buildVol2LineChirho(vol2LineChirho, appliedAtChirho);
  const plannedVol1LineChirho =
    vol1StateChirho === "already-applied-chirho" ? vol1LineChirho : buildVol1LineChirho(vol1LineChirho, appliedAtChirho);
  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          vol2StateChirho === "already-applied-chirho" && vol1StateChirho === "already-applied-chirho"
            ? "already-applied-chirho"
            : "planned-chirho",
          [
            "ready to split vol 2 p149 L25 hidden Hebrew root יסר and correct vol 1 p149 L19 closing parenthesis punctuation",
            "both repairs remain vision-tier until the appropriate review lane accepts or confirms them",
          ],
          plannedVol2LineChirho,
          vol2StateChirho,
          plannedVol1LineChirho,
          vol1StateChirho
        ),
        null,
        2
      )
    );
    return;
  }

  if (vol2StateChirho !== "already-applied-chirho") {
    writeJsonChirho(VOL2_LINE_PATH_CHIRHO, plannedVol2LineChirho);
  }
  if (vol1StateChirho !== "already-applied-chirho") {
    writeJsonChirho(VOL1_LINE_PATH_CHIRHO, plannedVol1LineChirho);
  }
  const upsertCountChirho = upsertVisionBackupChirho(plannedVol2LineChirho, plannedVol1LineChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [`applied both repairs and upserted ${upsertCountChirho} durable vision verdicts`, "regenerate export/report/packs/status next"],
        plannedVol2LineChirho,
        "already-applied-chirho",
        plannedVol1LineChirho,
        "already-applied-chirho"
      ),
      null,
      2
    )
  );
}

mainChirho();
