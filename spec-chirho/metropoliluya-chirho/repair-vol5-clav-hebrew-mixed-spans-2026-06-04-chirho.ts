// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repairs for vol 5 mixed `clav` apparatus + Hebrew spans.
 *
 * Three Hebrew spans contain witness sigla and Latin `clav` labels before the
 * actual Hebrew reading. This splits the labels/sigla into Latin/symbol
 * proofing lanes and leaves only the Hebrew word/phrase in Hebrew/WLC expert
 * review. No span is certified here.
 */

import { readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-clav-hebrew-mixed-spans-2026-06-04-chirho";
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

interface ReplacementSpanChirho {
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  notesChirho: string;
}

interface FollowingOverrideChirho {
  oldSegmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  utf8TextChirho?: string;
}

interface LineRepairChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  targetSegmentIndexChirho: number;
  oldSpanCountChirho: number;
  oldXMinPxChirho: number;
  oldWidthPxChirho: number;
  oldScriptChirho: string;
  oldTextChirho: string;
  replacementsChirho: ReplacementSpanChirho[];
  followingOverridesChirho?: FollowingOverrideChirho[];
  backupRowsChirho: VisionVerdictChirho[];
  removeBackupSegmentIndicesChirho: number[];
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

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "planned-chirho" | "applied-chirho" | "already-applied-chirho" | "blocked-chirho";
  messagesChirho: string[];
  linesChirho: Array<{
    volumeChirho: number;
    pageChirho: number;
    lineIndexChirho: number;
    stateChirho: string;
    spansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>;
  }>;
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
  return { volumeChirho, pageChirho, lineIndexChirho, segmentIndexChirho, garbleTextChirho, scriptChirho, utf8TextChirho, notesChirho };
}

const REPAIRS_CHIRHO: LineRepairChirho[] = [
  {
    volumeChirho: 5,
    pageChirho: 65,
    lineIndexChirho: 21,
    targetSegmentIndexChirho: 10,
    oldSpanCountChirho: 13,
    oldXMinPxChirho: 1430,
    oldWidthPxChirho: 373,
    oldScriptChirho: "hebrew-chirho",
    oldTextChirho: "𝔊 𝔖 clav לִי",
    replacementsChirho: [
      {
        segmentIndexChirho: 10,
        xMinPxChirho: 1430,
        widthPxChirho: 125,
        scriptChirho: "symbol-chirho",
        utf8TextChirho: "𝔊 𝔖",
        notesChirho: "Split from old mixed Hebrew span `𝔊 𝔖 clav לִי`: witness sigla remain in Latin/symbol proofing.",
      },
      {
        segmentIndexChirho: 11,
        xMinPxChirho: 1555,
        widthPxChirho: 135,
        scriptChirho: "latin-non-french-chirho",
        utf8TextChirho: "clav",
        notesChirho: "Split from old mixed Hebrew span `𝔊 𝔖 clav לִי`: Latin apparatus label `clav` remains in Latin/symbol proofing.",
      },
      {
        segmentIndexChirho: 12,
        xMinPxChirho: 1690,
        widthPxChirho: 113,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "לִי",
        notesChirho: "Split from old mixed Hebrew span `𝔊 𝔖 clav לִי`: scanline shows the Hebrew reading after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier.",
      },
    ],
    backupRowsChirho: [
      rowChirho(5, 65, 21, 10, "() clav .4", "symbol-chirho", "𝔊 𝔖", "Split from old mixed Hebrew span `𝔊 𝔖 clav לִי`: witness sigla remain in Latin/symbol proofing."),
      rowChirho(5, 65, 21, 11, "() clav .4", "latin-non-french-chirho", "clav", "Split from old mixed Hebrew span `𝔊 𝔖 clav לִי`: Latin apparatus label `clav` remains in Latin/symbol proofing."),
      rowChirho(5, 65, 21, 12, "() clav .4", "hebrew-chirho", "לִי", "Split from old mixed Hebrew span `𝔊 𝔖 clav לִי`: scanline shows the Hebrew reading after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier."),
      rowChirho(5, 65, 21, 14, "''", "symbol-chirho", "𝔙", "Fraktur V = Vulgate siglum after 'lic:'. U+1D599."),
    ],
    removeBackupSegmentIndicesChirho: [10, 11, 12, 13, 14],
  },
  {
    volumeChirho: 5,
    pageChirho: 68,
    lineIndexChirho: 25,
    targetSegmentIndexChirho: 9,
    oldSpanCountChirho: 12,
    oldXMinPxChirho: 1446,
    oldWidthPxChirho: 384,
    oldScriptChirho: "hebrew-chirho",
    oldTextChirho: "𝔊 clav וּמֵתִי →",
    replacementsChirho: [
      {
        segmentIndexChirho: 9,
        xMinPxChirho: 1446,
        widthPxChirho: 74,
        scriptChirho: "symbol-chirho",
        utf8TextChirho: "𝔊",
        notesChirho: "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: Septuagint siglum remains in Latin/symbol proofing.",
      },
      {
        segmentIndexChirho: 10,
        xMinPxChirho: 1520,
        widthPxChirho: 130,
        scriptChirho: "latin-non-french-chirho",
        utf8TextChirho: "clav",
        notesChirho: "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: Latin apparatus label `clav` remains in Latin/symbol proofing.",
      },
      {
        segmentIndexChirho: 11,
        xMinPxChirho: 1650,
        widthPxChirho: 150,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "וּמֵתִי",
        notesChirho: "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: scanline shows the Hebrew reading after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier.",
      },
      {
        segmentIndexChirho: 12,
        xMinPxChirho: 1800,
        widthPxChirho: 100,
        scriptChirho: "symbol-chirho",
        utf8TextChirho: "→",
        notesChirho: "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: arrow marker is apparatus punctuation and remains in Latin/symbol proofing.",
      },
    ],
    followingOverridesChirho: [
      {
        oldSegmentIndexChirho: 10,
        xMinPxChirho: 1900,
        widthPxChirho: 138,
      },
    ],
    backupRowsChirho: [
      rowChirho(5, 68, 25, 9, "( clav .>85", "symbol-chirho", "𝔊", "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: Septuagint siglum remains in Latin/symbol proofing."),
      rowChirho(5, 68, 25, 10, "( clav .>85", "latin-non-french-chirho", "clav", "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: Latin apparatus label `clav` remains in Latin/symbol proofing."),
      rowChirho(5, 68, 25, 11, "( clav .>85", "hebrew-chirho", "וּמֵתִי", "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: scanline shows the Hebrew reading after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier."),
      rowChirho(5, 68, 25, 12, "( clav .>85", "symbol-chirho", "→", "Split from old mixed Hebrew span `𝔊 clav וּמֵתִי →`: arrow marker is apparatus punctuation and remains in Latin/symbol proofing."),
      rowChirho(5, 68, 25, 14, "''", "symbol-chirho", "𝔙", "Vulgate siglum U+1D519; appears after 'lic:' in image"),
    ],
    removeBackupSegmentIndicesChirho: [9, 10, 11, 12, 13, 14],
  },
  {
    volumeChirho: 5,
    pageChirho: 68,
    lineIndexChirho: 26,
    targetSegmentIndexChirho: 6,
    oldSpanCountChirho: 7,
    oldXMinPxChirho: 1375,
    oldWidthPxChirho: 446,
    oldScriptChirho: "hebrew-chirho",
    oldTextChirho: "𝔖 clav וְשָׁכַבְתִּי",
    replacementsChirho: [
      {
        segmentIndexChirho: 6,
        xMinPxChirho: 1375,
        widthPxChirho: 65,
        scriptChirho: "symbol-chirho",
        utf8TextChirho: "𝔖",
        notesChirho: "Split from old mixed Hebrew span `𝔖 clav וְשָׁכַבְתִּי`: Syriac/Peshitta siglum remains in Latin/symbol proofing.",
      },
      {
        segmentIndexChirho: 7,
        xMinPxChirho: 1440,
        widthPxChirho: 140,
        scriptChirho: "latin-non-french-chirho",
        utf8TextChirho: "clav",
        notesChirho: "Split from old mixed Hebrew span `𝔖 clav וְשָׁכַבְתִּי`: Latin apparatus label `clav` remains in Latin/symbol proofing.",
      },
      {
        segmentIndexChirho: 8,
        xMinPxChirho: 1580,
        widthPxChirho: 241,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "וְשָׁכַבְתִּי",
        notesChirho: "Split from old mixed Hebrew span `𝔖 clav וְשָׁכַבְתִּי`: scanline shows the Hebrew reading after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier.",
      },
    ],
    backupRowsChirho: [
      rowChirho(5, 68, 26, 6, ") clav .>%!›5", "symbol-chirho", "𝔖", "Split from old mixed Hebrew span `𝔖 clav וְשָׁכַבְתִּי`: Syriac/Peshitta siglum remains in Latin/symbol proofing."),
      rowChirho(5, 68, 26, 7, ") clav .>%!›5", "latin-non-french-chirho", "clav", "Split from old mixed Hebrew span `𝔖 clav וְשָׁכַבְתִּי`: Latin apparatus label `clav` remains in Latin/symbol proofing."),
      rowChirho(5, 68, 26, 8, ") clav .>%!›5", "hebrew-chirho", "וְשָׁכַבְתִּי", "Split from old mixed Hebrew span `𝔖 clav וְשָׁכַבְתִּי`: scanline shows the Hebrew reading after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier."),
    ],
    removeBackupSegmentIndicesChirho: [6, 7, 8],
  },
];

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
    if (spanChirho.segmentIndexChirho !== indexChirho) throw new Error(`segment ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    if (spanChirho.xMinPxChirho !== expectedXChirho) throw new Error(`xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    if (spanChirho.widthPxChirho <= 0) throw new Error(`span ${indexChirho} has non-positive width`);
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) throw new Error(`line ends at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
}

function spanSummaryChirho(lineChirho: SpanLineChirho): RepairReportChirho["linesChirho"][number]["spansChirho"] {
  return sortedSpansChirho(lineChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function linePathChirho(repairChirho: LineRepairChirho): string {
  return spanLinePathChirho(repairChirho.volumeChirho, repairChirho.pageChirho, repairChirho.lineIndexChirho);
}

function stateChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const spansChirho = sortedSpansChirho(lineChirho);
  const oldSpanChirho = spansChirho[repairChirho.targetSegmentIndexChirho];
  if (
    spansChirho.length === repairChirho.oldSpanCountChirho &&
    oldSpanChirho?.segmentIndexChirho === repairChirho.targetSegmentIndexChirho &&
    oldSpanChirho.xMinPxChirho === repairChirho.oldXMinPxChirho &&
    oldSpanChirho.widthPxChirho === repairChirho.oldWidthPxChirho &&
    oldSpanChirho.scriptChirho === repairChirho.oldScriptChirho &&
    normalizeTextForStorageChirho(oldSpanChirho.utf8TextChirho) === repairChirho.oldTextChirho
  ) {
    return "pre-repair-chirho";
  }
  const expectedSpanCountChirho = repairChirho.oldSpanCountChirho + repairChirho.replacementsChirho.length - 1;
  if (spansChirho.length !== expectedSpanCountChirho) return "unknown-chirho";
  const replacementsMatchChirho = repairChirho.replacementsChirho.every((replacementChirho) => {
    const spanChirho = spansChirho[replacementChirho.segmentIndexChirho];
    return (
      spanChirho?.segmentIndexChirho === replacementChirho.segmentIndexChirho &&
      spanChirho.xMinPxChirho === replacementChirho.xMinPxChirho &&
      spanChirho.widthPxChirho === replacementChirho.widthPxChirho &&
      spanChirho.scriptChirho === replacementChirho.scriptChirho &&
      normalizeTextForStorageChirho(spanChirho.utf8TextChirho) === replacementChirho.utf8TextChirho
    );
  });
  if (!replacementsMatchChirho) return "unknown-chirho";
  return "already-applied-chirho";
}

function buildReplacementSpansChirho(repairChirho: LineRepairChirho, appliedAtChirho: string): SpanChirho[] {
  return repairChirho.replacementsChirho.map((replacementChirho) => ({
    segmentIndexChirho: replacementChirho.segmentIndexChirho,
    xMinPxChirho: replacementChirho.xMinPxChirho,
    widthPxChirho: replacementChirho.widthPxChirho,
    scriptChirho: replacementChirho.scriptChirho,
    utf8TextChirho: replacementChirho.utf8TextChirho,
    provenanceChirho: "vision-chirho",
    visionTranscribedAtChirho: appliedAtChirho,
    visionNotesChirho: replacementChirho.notesChirho,
  }));
}

function followingOverrideForChirho(repairChirho: LineRepairChirho, oldSegmentIndexChirho: number): FollowingOverrideChirho | undefined {
  return repairChirho.followingOverridesChirho?.find((overrideChirho) => overrideChirho.oldSegmentIndexChirho === oldSegmentIndexChirho);
}

function buildNextLineChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho, appliedAtChirho: string): SpanLineChirho {
  const shiftChirho = repairChirho.replacementsChirho.length - 1;
  const nextSpansChirho = sortedSpansChirho(lineChirho).flatMap((spanChirho): SpanChirho[] => {
    if (spanChirho.segmentIndexChirho < repairChirho.targetSegmentIndexChirho) return [structuredClone(spanChirho)];
    if (spanChirho.segmentIndexChirho === repairChirho.targetSegmentIndexChirho) return buildReplacementSpansChirho(repairChirho, appliedAtChirho);
    const overrideChirho = followingOverrideForChirho(repairChirho, spanChirho.segmentIndexChirho);
    return [
      {
        ...structuredClone(spanChirho),
        segmentIndexChirho: spanChirho.segmentIndexChirho + shiftChirho,
        xMinPxChirho: overrideChirho?.xMinPxChirho ?? spanChirho.xMinPxChirho,
        widthPxChirho: overrideChirho?.widthPxChirho ?? spanChirho.widthPxChirho,
        utf8TextChirho: overrideChirho?.utf8TextChirho ?? spanChirho.utf8TextChirho,
      },
    ];
  });
  const nextLineChirho: SpanLineChirho = {
    ...structuredClone(lineChirho),
    spansChirho: nextSpansChirho,
  };
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function keyChirho(rowChirho: Pick<VisionVerdictChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return `${rowChirho.volumeChirho}:${rowChirho.pageChirho}:${rowChirho.lineIndexChirho}:${rowChirho.segmentIndexChirho}`;
}

function repairBackupKeysChirho(repairChirho: LineRepairChirho): Set<string> {
  return new Set(
    repairChirho.removeBackupSegmentIndicesChirho.map(
      (segmentIndexChirho) => `${repairChirho.volumeChirho}:${repairChirho.pageChirho}:${repairChirho.lineIndexChirho}:${segmentIndexChirho}`
    )
  );
}

function reconcileBackupChirho(generatedAtChirho: string): void {
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  let verdictsChirho = backupChirho.verdictsChirho ?? [];
  for (const repairChirho of REPAIRS_CHIRHO) {
    const keysChirho = repairBackupKeysChirho(repairChirho);
    const firstTargetIndexChirho = verdictsChirho.findIndex((rowChirho) => keysChirho.has(keyChirho(rowChirho)));
    const insertIndexChirho = firstTargetIndexChirho === -1 ? verdictsChirho.length : firstTargetIndexChirho;
    verdictsChirho = verdictsChirho.filter((rowChirho) => !keysChirho.has(keyChirho(rowChirho)));
    verdictsChirho.splice(insertIndexChirho, 0, ...repairChirho.backupRowsChirho);
  }
  backupChirho.generatedAtChirho = generatedAtChirho;
  backupChirho.countChirho = verdictsChirho.length;
  backupChirho.verdictsChirho = verdictsChirho;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  linesChirho: RepairReportChirho["linesChirho"]
): RepairReportChirho {
  return { moduleChirho: MODULE_CHIRHO, modeChirho, statusChirho, messagesChirho, linesChirho };
}

function loadRepairLineChirho(repairChirho: LineRepairChirho): SpanLineChirho {
  const lineChirho = loadJsonChirho<SpanLineChirho>(linePathChirho(repairChirho));
  validateTilingChirho(lineChirho);
  return lineChirho;
}

function reportLineChirho(repairChirho: LineRepairChirho, stateValueChirho: string, lineChirho: SpanLineChirho): RepairReportChirho["linesChirho"][number] {
  return {
    volumeChirho: repairChirho.volumeChirho,
    pageChirho: repairChirho.pageChirho,
    lineIndexChirho: repairChirho.lineIndexChirho,
    stateChirho: stateValueChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.includes("--apply");
  const modeChirho = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const lineReportsChirho: RepairReportChirho["linesChirho"] = [];
  const plannedWritesChirho: Array<{ repairChirho: LineRepairChirho; lineChirho: SpanLineChirho }> = [];
  for (const repairChirho of REPAIRS_CHIRHO) {
    const lineChirho = loadRepairLineChirho(repairChirho);
    const currentStateChirho = stateChirho(lineChirho, repairChirho);
    if (currentStateChirho === "unknown-chirho") {
      lineReportsChirho.push(reportLineChirho(repairChirho, currentStateChirho, lineChirho));
      console.log(JSON.stringify(reportChirho(modeChirho, "blocked-chirho", ["at least one line is neither the expected old mixed-span state nor the repaired state"], lineReportsChirho), null, 2));
      process.exitCode = 1;
      return;
    }
    if (currentStateChirho === "pre-repair-chirho") {
      const nextLineChirho = buildNextLineChirho(lineChirho, repairChirho, appliedAtChirho);
      plannedWritesChirho.push({ repairChirho, lineChirho: nextLineChirho });
      lineReportsChirho.push(reportLineChirho(repairChirho, applyChirho ? "applied-chirho" : "planned-chirho", nextLineChirho));
    } else {
      lineReportsChirho.push(reportLineChirho(repairChirho, currentStateChirho, lineChirho));
    }
  }
  if (plannedWritesChirho.length === 0) {
    if (applyChirho) reconcileBackupChirho(appliedAtChirho);
    console.log(JSON.stringify(reportChirho(modeChirho, "already-applied-chirho", ["all mixed `clav` Hebrew splits are already applied"], lineReportsChirho), null, 2));
    return;
  }
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho(modeChirho, "planned-chirho", ["ready to split mixed `clav` Hebrew spans; add --apply to write"], lineReportsChirho), null, 2));
    return;
  }
  for (const plannedWriteChirho of plannedWritesChirho) {
    writeJsonChirho(linePathChirho(plannedWriteChirho.repairChirho), plannedWriteChirho.lineChirho);
  }
  reconcileBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", ["split mixed `clav` Hebrew spans and reconciled durable vision backup"], lineReportsChirho), null, 2));
}

if (import.meta.main) mainChirho();
