// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first splits for vol 5 label + non-Latin vision spans.
 *
 * These repairs remove French/Latin apparatus labels from Greek/Hebrew expert
 * spans so the expert queue asks only about the non-Latin text itself. The
 * label text remains vision-tier and moves to French/Latin proofing. No span is
 * certified here.
 */

import { readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-label-nonlatin-splits-2026-06-04-chirho";
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

interface SpanSpecChirho {
  fromOldSegmentIndexChirho: number;
  segmentIndexChirho: number;
  xMinPxChirho: number;
  widthPxChirho: number;
  scriptChirho: string;
  utf8TextChirho: string;
  provenanceChirho?: string;
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

interface LineRepairChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  oldSpansChirho: SpanSpecChirho[];
  newSpansChirho: SpanSpecChirho[];
  backupRowsChirho: VisionVerdictChirho[];
  removeBackupSegmentIndicesChirho: number[];
}

interface LineReportChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  stateChirho: "pre-apply-chirho" | "already-applied-chirho" | "unknown-chirho";
  spansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>;
}

function spanChirho(
  fromOldSegmentIndexChirho: number,
  segmentIndexChirho: number,
  xMinPxChirho: number,
  widthPxChirho: number,
  scriptChirho: string,
  utf8TextChirho: string,
  provenanceChirho?: string
): SpanSpecChirho {
  return { fromOldSegmentIndexChirho, segmentIndexChirho, xMinPxChirho, widthPxChirho, scriptChirho, utf8TextChirho, provenanceChirho };
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
    pageChirho: 53,
    lineIndexChirho: 34,
    oldSpansChirho: [
      spanChirho(0, 0, 0, 1325, "greek-chirho", "homéotéleuton: πρὸς [ἐνόπλους ... ἀπὸ] ἐνόπλων"),
      spanChirho(1, 1, 1325, 196, "french-chirho", ". (A.S.)"),
    ],
    newSpansChirho: [
      spanChirho(0, 0, 0, 432, "french-chirho", "homéotéleuton:", "vision-chirho"),
      spanChirho(0, 1, 432, 893, "greek-chirho", "πρὸς [ἐνόπλους ... ἀπὸ] ἐνόπλων", "vision-chirho"),
      spanChirho(1, 2, 1325, 196, "french-chirho", ". (A.S.)"),
    ],
    backupRowsChirho: [
      rowChirho(5, 53, 34, 0, "homéotéleuton -#./ ['(3-25G/...;-.] '(3-2Q(", "french-chirho", "homéotéleuton:", "Split from old mixed Greek span `homéotéleuton: πρὸς [ἐνόπλους ... ἀπὸ] ἐνόπλων`: French apparatus label remains in Latin/French proofing."),
      rowChirho(5, 53, 34, 1, "homéotéleuton -#./ ['(3-25G/...;-.] '(3-2Q(", "greek-chirho", "πρὸς [ἐνόπλους ... ἀπὸ] ἐνόπλων", "Split from old mixed Greek span `homéotéleuton: πρὸς [ἐνόπλους ... ἀπὸ] ἐνόπλων`: Greek phrase remains vision-tier for Greek expert confirmation."),
    ],
    removeBackupSegmentIndicesChirho: [0, 1, 2],
  },
  {
    volumeChirho: 5,
    pageChirho: 55,
    lineIndexChirho: 13,
    oldSpansChirho: [
      spanChirho(0, 0, 0, 251, "french-chirho", "sens du"),
      spanChirho(1, 1, 251, 387, "hebrew-chirho", "bilittère צן"),
      spanChirho(2, 2, 638, 1637, "french-chirho", ". Mais il ne précise pas ce sens. Les glossaires se"),
    ],
    newSpansChirho: [
      spanChirho(0, 0, 0, 251, "french-chirho", "sens du"),
      spanChirho(1, 1, 251, 296, "french-chirho", "bilittère", "vision-chirho"),
      spanChirho(1, 2, 547, 63, "hebrew-chirho", "צן", "vision-chirho"),
      spanChirho(2, 3, 610, 1665, "french-chirho", ". Mais il ne précise pas ce sens. Les glossaires se"),
    ],
    backupRowsChirho: [
      rowChirho(5, 55, 13, 1, "bilittère NI", "french-chirho", "bilittère", "Split from old mixed Hebrew span `bilittère צן`: French descriptor remains in Latin/French proofing."),
      rowChirho(5, 55, 13, 2, "bilittère NI", "hebrew-chirho", "צן", "Split from old mixed Hebrew span `bilittère צן`: Hebrew biliteral root remains vision-tier for Hebrew/WLC expert confirmation."),
    ],
    removeBackupSegmentIndicesChirho: [1, 2, 3],
  },
  {
    volumeChirho: 5,
    pageChirho: 65,
    lineIndexChirho: 24,
    oldSpansChirho: [
      spanChirho(0, 0, 0, 217, "hebrew-chirho", "וַתִּירְאוּ"),
      spanChirho(1, 1, 217, 299, "french-chirho", ", avec un"),
      spanChirho(2, 2, 516, 306, "hebrew-chirho", "ketib לֹא"),
      spanChirho(3, 3, 822, 243, "french-chirho", "pour le"),
      spanChirho(4, 4, 1065, 219, "hebrew-chirho", "qeré לוֹ"),
      spanChirho(5, 5, 1284, 21, "french-chirho", "."),
    ],
    newSpansChirho: [
      spanChirho(0, 0, 0, 217, "hebrew-chirho", "וַתִּירְאוּ"),
      spanChirho(1, 1, 217, 299, "french-chirho", ", avec un"),
      spanChirho(2, 2, 516, 185, "latin-non-french-chirho", "ketib", "vision-chirho"),
      spanChirho(2, 3, 701, 121, "hebrew-chirho", "לֹא", "vision-chirho"),
      spanChirho(3, 4, 822, 243, "french-chirho", "pour le"),
      spanChirho(4, 5, 1065, 118, "latin-non-french-chirho", "qeré", "vision-chirho"),
      spanChirho(4, 6, 1183, 101, "hebrew-chirho", "לוֹ", "vision-chirho"),
      spanChirho(5, 7, 1284, 21, "french-chirho", "."),
    ],
    backupRowsChirho: [
      rowChirho(5, 65, 24, 2, "ketib Ä4", "latin-non-french-chirho", "ketib", "Split from old mixed Hebrew span `ketib לֹא`: ketib label remains in Latin/symbol proofing."),
      rowChirho(5, 65, 24, 3, "ketib Ä4", "hebrew-chirho", "לֹא", "Split from old mixed Hebrew span `ketib לֹא`: Hebrew ketib form remains vision-tier for Hebrew/WLC expert confirmation."),
      rowChirho(5, 65, 24, 5, "qeré ˚4", "latin-non-french-chirho", "qeré", "Split from old mixed Hebrew span `qeré לוֹ`: qeré label remains in Latin/symbol proofing."),
      rowChirho(5, 65, 24, 6, "qeré ˚4", "hebrew-chirho", "לוֹ", "Split from old mixed Hebrew span `qeré לוֹ`: Hebrew qeré form remains vision-tier for Hebrew/WLC expert confirmation."),
    ],
    removeBackupSegmentIndicesChirho: [2, 3, 4, 5, 6, 7],
  },
  {
    volumeChirho: 5,
    pageChirho: 67,
    lineIndexChirho: 4,
    oldSpansChirho: [
      spanChirho(0, 0, 0, 408, "french-chirho", "portent en"),
      spanChirho(1, 1, 408, 111, "latin-non-french-chirho", "mp"),
      spanChirho(2, 2, 519, 667, "french-chirho", "une indication de"),
      spanChirho(3, 3, 1186, 289, "hebrew-chirho", "qeré לֹא"),
      spanChirho(4, 4, 1475, 796, "french-chirho", ". Cependant, on répète"),
    ],
    newSpansChirho: [
      spanChirho(0, 0, 0, 408, "french-chirho", "portent en"),
      spanChirho(1, 1, 408, 111, "latin-non-french-chirho", "mp"),
      spanChirho(2, 2, 519, 667, "french-chirho", "une indication de"),
      spanChirho(3, 3, 1186, 168, "latin-non-french-chirho", "qeré", "vision-chirho"),
      spanChirho(3, 4, 1354, 121, "hebrew-chirho", "לֹא", "vision-chirho"),
      spanChirho(4, 5, 1475, 796, "french-chirho", ". Cependant, on répète"),
    ],
    backupRowsChirho: [
      rowChirho(5, 67, 4, 3, "qeré Ä4", "latin-non-french-chirho", "qeré", "Split from old mixed Hebrew span `qeré לֹא`: qeré label remains in Latin/symbol proofing."),
      rowChirho(5, 67, 4, 4, "qeré Ä4", "hebrew-chirho", "לֹא", "Split from old mixed Hebrew span `qeré לֹא`: Hebrew qeré form remains vision-tier for Hebrew/WLC expert confirmation."),
    ],
    removeBackupSegmentIndicesChirho: [3, 4, 5],
  },
  {
    volumeChirho: 5,
    pageChirho: 67,
    lineIndexChirho: 5,
    oldSpansChirho: [
      spanChirho(0, 0, 0, 1333, "french-chirho", "d'ordinaire que les ‘orientaux’ ont ici un"),
      spanChirho(1, 1, 1333, 305, "hebrew-chirho", "ketib לֹא"),
      spanChirho(2, 2, 1638, 202, "french-chirho", "et un"),
      spanChirho(3, 3, 1840, 235, "hebrew-chirho", "qeré לֹו"),
      spanChirho(4, 4, 2075, 196, "french-chirho", ", alors"),
    ],
    newSpansChirho: [
      spanChirho(0, 0, 0, 1333, "french-chirho", "d'ordinaire que les ‘orientaux’ ont ici un"),
      spanChirho(1, 1, 1333, 191, "latin-non-french-chirho", "ketib", "vision-chirho"),
      spanChirho(1, 2, 1524, 114, "hebrew-chirho", "לֹא", "vision-chirho"),
      spanChirho(2, 3, 1638, 202, "french-chirho", "et un"),
      spanChirho(3, 4, 1840, 139, "latin-non-french-chirho", "qeré", "vision-chirho"),
      spanChirho(3, 5, 1979, 96, "hebrew-chirho", "לֹו", "vision-chirho"),
      spanChirho(4, 6, 2075, 196, "french-chirho", ", alors"),
    ],
    backupRowsChirho: [
      rowChirho(5, 67, 5, 1, "ketib 14", "latin-non-french-chirho", "ketib", "Split from old mixed Hebrew span `ketib לֹא`: ketib label remains in Latin/symbol proofing."),
      rowChirho(5, 67, 5, 2, "ketib 14", "hebrew-chirho", "לֹא", "Split from old mixed Hebrew span `ketib לֹא`: Hebrew ketib form remains vision-tier for Hebrew/WLC expert confirmation."),
      rowChirho(5, 67, 5, 4, "qeré 54", "latin-non-french-chirho", "qeré", "Split from old mixed Hebrew span `qeré לֹו`: qeré label remains in Latin/symbol proofing."),
      rowChirho(5, 67, 5, 5, "qeré 54", "hebrew-chirho", "לֹו", "Split from old mixed Hebrew span `qeré לֹו`: Hebrew qeré form remains vision-tier for Hebrew/WLC expert confirmation."),
    ],
    removeBackupSegmentIndicesChirho: [1, 2, 3, 4, 5, 6],
  },
  {
    volumeChirho: 5,
    pageChirho: 67,
    lineIndexChirho: 6,
    oldSpansChirho: [
      spanChirho(0, 0, 0, 1149, "french-chirho", "que les ‘occidentaux’ auraient un"),
      spanChirho(1, 1, 1149, 202, "latin-non-french-chirho", "ketib"),
      spanChirho(2, 2, 1351, 102, "french-chirho", "et"),
      spanChirho(3, 3, 1453, 252, "hebrew-chirho", "qeré לֹו"),
      spanChirho(4, 4, 1705, 570, "french-chirho", ". C'est ainsi que"),
    ],
    newSpansChirho: [
      spanChirho(0, 0, 0, 1149, "french-chirho", "que les ‘occidentaux’ auraient un"),
      spanChirho(1, 1, 1149, 202, "latin-non-french-chirho", "ketib"),
      spanChirho(2, 2, 1351, 102, "french-chirho", "et"),
      spanChirho(3, 3, 1453, 134, "latin-non-french-chirho", "qeré", "vision-chirho"),
      spanChirho(3, 4, 1587, 118, "hebrew-chirho", "לֹו", "vision-chirho"),
      spanChirho(4, 5, 1705, 570, "french-chirho", ". C'est ainsi que"),
    ],
    backupRowsChirho: [
      rowChirho(5, 67, 6, 3, "qeré 54", "latin-non-french-chirho", "qeré", "Split from old mixed Hebrew span `qeré לֹו`: qeré label remains in Latin/symbol proofing."),
      rowChirho(5, 67, 6, 4, "qeré 54", "hebrew-chirho", "לֹו", "Split from old mixed Hebrew span `qeré לֹו`: Hebrew qeré form remains vision-tier for Hebrew/WLC expert confirmation."),
    ],
    removeBackupSegmentIndicesChirho: [3, 4, 5],
  },
];

function readJsonChirho<TChirho>(pathChirho: string): TChirho {
  return JSON.parse(readFileSync(pathChirho, "utf8")) as TChirho;
}

function writeJsonAtomicChirho(pathChirho: string, valueChirho: unknown): void {
  const tempPathChirho = `${pathChirho}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tempPathChirho, `${JSON.stringify(valueChirho, null, 2)}\n`);
  renameSync(tempPathChirho, pathChirho);
}

function sameSpanFieldsChirho(spanChirho: SpanChirho, specChirho: SpanSpecChirho): boolean {
  return (
    spanChirho.segmentIndexChirho === specChirho.segmentIndexChirho &&
    spanChirho.xMinPxChirho === specChirho.xMinPxChirho &&
    spanChirho.widthPxChirho === specChirho.widthPxChirho &&
    spanChirho.scriptChirho === specChirho.scriptChirho &&
    normalizeTextForStorageChirho(spanChirho.utf8TextChirho) === normalizeTextForStorageChirho(specChirho.utf8TextChirho) &&
    (specChirho.provenanceChirho === undefined || spanChirho.provenanceChirho === specChirho.provenanceChirho)
  );
}

function lineMatchesChirho(lineChirho: SpanLineChirho, specsChirho: SpanSpecChirho[]): boolean {
  if (lineChirho.spansChirho.length !== specsChirho.length) return false;
  return specsChirho.every((specChirho, indexChirho) => {
    const spanChirho = lineChirho.spansChirho[indexChirho];
    return spanChirho !== undefined && sameSpanFieldsChirho(spanChirho, specChirho);
  });
}

function stateForLineChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho): LineReportChirho["stateChirho"] {
  if (lineMatchesChirho(lineChirho, repairChirho.oldSpansChirho)) return "pre-apply-chirho";
  if (lineMatchesChirho(lineChirho, repairChirho.newSpansChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function validateTilingChirho(lineChirho: SpanLineChirho): void {
  const spansChirho = [...lineChirho.spansChirho].sort((aChirho, bChirho) => aChirho.segmentIndexChirho - bChirho.segmentIndexChirho);
  let expectedXChirho = 0;
  for (const [indexChirho, spanChirho] of spansChirho.entries()) {
    if (spanChirho.segmentIndexChirho !== indexChirho) {
      throw new Error(`segment-index-gap-chirho at v${lineChirho.volumeChirho} p${lineChirho.pageChirho} L${lineChirho.lineIndexChirho}: expected ${indexChirho}, got ${spanChirho.segmentIndexChirho}`);
    }
    if (spanChirho.widthPxChirho <= 0) {
      throw new Error(`non-positive-width-chirho at v${lineChirho.volumeChirho} p${lineChirho.pageChirho} L${lineChirho.lineIndexChirho} S${spanChirho.segmentIndexChirho}`);
    }
    if (spanChirho.xMinPxChirho !== expectedXChirho) {
      throw new Error(`span-tiling-gap-chirho at v${lineChirho.volumeChirho} p${lineChirho.pageChirho} L${lineChirho.lineIndexChirho} S${spanChirho.segmentIndexChirho}: expected x ${expectedXChirho}, got ${spanChirho.xMinPxChirho}`);
    }
    expectedXChirho = spanChirho.xMinPxChirho + spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) {
    throw new Error(`line-width-mismatch-chirho at v${lineChirho.volumeChirho} p${lineChirho.pageChirho} L${lineChirho.lineIndexChirho}: expected end ${lineChirho.lineWidthPxChirho}, got ${expectedXChirho}`);
  }
}

function buildNewSpansChirho(lineChirho: SpanLineChirho, repairChirho: LineRepairChirho): SpanChirho[] {
  const oldBySegmentChirho = new Map(lineChirho.spansChirho.map((spanChirho) => [spanChirho.segmentIndexChirho, spanChirho]));
  return repairChirho.newSpansChirho.map((specChirho) => {
    const sourceChirho = oldBySegmentChirho.get(specChirho.fromOldSegmentIndexChirho);
    if (sourceChirho === undefined) {
      throw new Error(`missing source segment ${specChirho.fromOldSegmentIndexChirho} for v${repairChirho.volumeChirho} p${repairChirho.pageChirho} L${repairChirho.lineIndexChirho}`);
    }
    const spanChirho: SpanChirho = {
      ...sourceChirho,
      segmentIndexChirho: specChirho.segmentIndexChirho,
      xMinPxChirho: specChirho.xMinPxChirho,
      widthPxChirho: specChirho.widthPxChirho,
      scriptChirho: specChirho.scriptChirho,
      utf8TextChirho: normalizeTextForStorageChirho(specChirho.utf8TextChirho),
    };
    if (specChirho.provenanceChirho !== undefined) spanChirho.provenanceChirho = specChirho.provenanceChirho;
    return spanChirho;
  });
}

function lineReportChirho(repairChirho: LineRepairChirho, lineChirho: SpanLineChirho): LineReportChirho {
  return {
    volumeChirho: repairChirho.volumeChirho,
    pageChirho: repairChirho.pageChirho,
    lineIndexChirho: repairChirho.lineIndexChirho,
    stateChirho: stateForLineChirho(lineChirho, repairChirho),
    spansChirho: lineChirho.spansChirho.map((spanChirho) => ({
      segmentIndexChirho: spanChirho.segmentIndexChirho,
      xMinPxChirho: spanChirho.xMinPxChirho,
      widthPxChirho: spanChirho.widthPxChirho,
      scriptChirho: spanChirho.scriptChirho,
      utf8TextChirho: spanChirho.utf8TextChirho,
      provenanceChirho: spanChirho.provenanceChirho,
    })),
  };
}

function backupKeyChirho(rowChirho: Pick<VisionVerdictChirho, "volumeChirho" | "pageChirho" | "lineIndexChirho" | "segmentIndexChirho">): string {
  return `${rowChirho.volumeChirho}:${rowChirho.pageChirho}:${rowChirho.lineIndexChirho}:${rowChirho.segmentIndexChirho}`;
}

function reconcileBackupChirho(): void {
  const backupChirho = readJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  if (!Array.isArray(backupChirho.verdictsChirho)) {
    throw new Error("vision verdict backup is malformed: verdictsChirho is not an array");
  }
  const removeKeysChirho = new Set<string>();
  const replacementRowsByGroupKeyChirho = new Map<string, VisionVerdictChirho[]>();
  const removeKeyToGroupKeyChirho = new Map<string, string>();
  for (const repairChirho of REPAIRS_CHIRHO) {
    const groupRemoveKeysChirho: string[] = [];
    for (const segmentIndexChirho of repairChirho.removeBackupSegmentIndicesChirho) {
      const keyChirho = backupKeyChirho({
        volumeChirho: repairChirho.volumeChirho,
        pageChirho: repairChirho.pageChirho,
        lineIndexChirho: repairChirho.lineIndexChirho,
        segmentIndexChirho,
      });
      removeKeysChirho.add(keyChirho);
      groupRemoveKeysChirho.push(keyChirho);
    }
    const firstBackupRowChirho = repairChirho.backupRowsChirho[0];
    if (firstBackupRowChirho === undefined) {
      throw new Error(`repair has no backup rows for v${repairChirho.volumeChirho} p${repairChirho.pageChirho} L${repairChirho.lineIndexChirho}`);
    }
    const firstExistingKeyChirho =
      backupChirho.verdictsChirho.map(backupKeyChirho).find((keyChirho) => groupRemoveKeysChirho.includes(keyChirho)) ??
      backupKeyChirho(firstBackupRowChirho);
    replacementRowsByGroupKeyChirho.set(firstExistingKeyChirho, repairChirho.backupRowsChirho);
    for (const keyChirho of groupRemoveKeysChirho) removeKeyToGroupKeyChirho.set(keyChirho, firstExistingKeyChirho);
  }
  const insertRowsChirho = REPAIRS_CHIRHO.flatMap((repairChirho) => repairChirho.backupRowsChirho);
  const insertKeysChirho = new Set(insertRowsChirho.map(backupKeyChirho));
  const insertedGroupsChirho = new Set<string>();
  const reconciledRowsChirho: VisionVerdictChirho[] = [];
  for (const rowValueChirho of backupChirho.verdictsChirho) {
    const keyChirho = backupKeyChirho(rowValueChirho);
    const groupKeyChirho = removeKeyToGroupKeyChirho.get(keyChirho);
    if (groupKeyChirho !== undefined) {
      if (!insertedGroupsChirho.has(groupKeyChirho)) {
        reconciledRowsChirho.push(...(replacementRowsByGroupKeyChirho.get(groupKeyChirho) ?? []));
        insertedGroupsChirho.add(groupKeyChirho);
      }
      continue;
    }
    if (insertKeysChirho.has(keyChirho)) continue;
    reconciledRowsChirho.push(rowValueChirho);
  }
  for (const [groupKeyChirho, rowsChirho] of replacementRowsByGroupKeyChirho) {
    if (insertedGroupsChirho.has(groupKeyChirho)) continue;
    reconciledRowsChirho.push(...rowsChirho);
  }
  backupChirho.verdictsChirho = reconciledRowsChirho;
  backupChirho.countChirho = reconciledRowsChirho.length;
  backupChirho.generatedAtChirho = new Date().toISOString();
  writeJsonAtomicChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function reportChirho(
  modeChirho: "dry-run-chirho" | "apply-chirho",
  statusChirho: "planned-chirho" | "applied-chirho" | "already-applied-chirho" | "blocked-chirho",
  messagesChirho: string[],
  linesChirho: LineReportChirho[]
): unknown {
  return { moduleChirho: MODULE_CHIRHO, modeChirho, statusChirho, messagesChirho, linesChirho };
}

function mainChirho(): void {
  const applyChirho = process.argv.includes("--apply");
  const modeChirho = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const lineEntriesChirho = REPAIRS_CHIRHO.map((repairChirho) => {
    const pathChirho = spanLinePathChirho(repairChirho.volumeChirho, repairChirho.pageChirho, repairChirho.lineIndexChirho);
    const lineChirho = readJsonChirho<SpanLineChirho>(pathChirho);
    validateTilingChirho(lineChirho);
    return { repairChirho, pathChirho, lineChirho };
  });
  const lineReportsChirho = lineEntriesChirho.map((entryChirho) => lineReportChirho(entryChirho.repairChirho, entryChirho.lineChirho));
  if (lineReportsChirho.some((lineChirho) => lineChirho.stateChirho === "unknown-chirho")) {
    console.log(JSON.stringify(reportChirho(modeChirho, "blocked-chirho", ["at least one line is neither the expected old mixed-label state nor the repaired state"], lineReportsChirho), null, 2));
    process.exit(1);
  }
  if (lineReportsChirho.every((lineChirho) => lineChirho.stateChirho === "already-applied-chirho")) {
    if (applyChirho) reconcileBackupChirho();
    console.log(JSON.stringify(reportChirho(modeChirho, "already-applied-chirho", ["all label/non-Latin splits are already applied"], lineReportsChirho), null, 2));
    return;
  }
  if (lineReportsChirho.some((lineChirho) => lineChirho.stateChirho !== "pre-apply-chirho")) {
    console.log(JSON.stringify(reportChirho(modeChirho, "blocked-chirho", ["mixed old/repaired state; refusing partial apply"], lineReportsChirho), null, 2));
    process.exit(1);
  }
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho(modeChirho, "planned-chirho", ["ready to split label/non-Latin spans; add --apply to write"], lineReportsChirho), null, 2));
    return;
  }
  for (const entryChirho of lineEntriesChirho) {
    entryChirho.lineChirho.spansChirho = buildNewSpansChirho(entryChirho.lineChirho, entryChirho.repairChirho);
    normalizeSpanLineTextFieldsChirho(entryChirho.lineChirho);
    validateTilingChirho(entryChirho.lineChirho);
    writeJsonAtomicChirho(entryChirho.pathChirho, entryChirho.lineChirho);
  }
  reconcileBackupChirho();
  const appliedReportsChirho = REPAIRS_CHIRHO.map((repairChirho) => {
    const lineChirho = readJsonChirho<SpanLineChirho>(spanLinePathChirho(repairChirho.volumeChirho, repairChirho.pageChirho, repairChirho.lineIndexChirho));
    validateTilingChirho(lineChirho);
    return lineReportChirho(repairChirho, lineChirho);
  });
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", ["split label/non-Latin spans and reconciled durable vision backup"], appliedReportsChirho), null, 2));
}

mainChirho();
