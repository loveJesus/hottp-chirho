// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first split for vol 5 p51 line 4 mixed `voc: 𝔊 clav וְאֵל` span.
 *
 * The old Hebrew span mixed Latin apparatus labels, a Septuagint siglum, and
 * the actual Hebrew word. This keeps labels/sigla in Latin/symbol proofing and
 * routes only the Hebrew word to Hebrew/WLC expert confirmation.
 */

import { readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-p51-l4-voc-clav-hebrew-2026-06-04-chirho";
const LINE_PATH_CHIRHO = spanLinePathChirho(5, 51, 4);
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

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "planned-chirho" | "applied-chirho" | "already-applied-chirho" | "blocked-chirho";
  messagesChirho: string[];
  spansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>;
}

const VOC_NOTES_CHIRHO =
  "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: Latin apparatus label `voc:` belongs in Latin/symbol proofing, not the Hebrew expert item.";
const G_SIGLUM_NOTES_CHIRHO =
  "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: Septuagint siglum remains in the Latin/symbol review lane.";
const CLAV_NOTES_CHIRHO =
  "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: Latin apparatus label `clav` belongs in Latin/symbol proofing, not the Hebrew expert item.";
const HEBREW_NOTES_CHIRHO =
  "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: scanline shows the Hebrew word after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier.";

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

function spanSummaryChirho(lineChirho: SpanLineChirho): RepairReportChirho["spansChirho"] {
  return sortedSpansChirho(lineChirho).map((spanChirho) => ({
    segmentIndexChirho: spanChirho.segmentIndexChirho,
    xMinPxChirho: spanChirho.xMinPxChirho,
    widthPxChirho: spanChirho.widthPxChirho,
    scriptChirho: spanChirho.scriptChirho,
    utf8TextChirho: spanChirho.utf8TextChirho,
    provenanceChirho: spanChirho.provenanceChirho,
  }));
}

function stateChirho(lineChirho: SpanLineChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const spansChirho = sortedSpansChirho(lineChirho);
  const span10Chirho = spansChirho[10];
  const span11Chirho = spansChirho[11];
  const span12Chirho = spansChirho[12];
  const span13Chirho = spansChirho[13];
  if (
    spansChirho.length === 11 &&
    span10Chirho?.segmentIndexChirho === 10 &&
    span10Chirho.xMinPxChirho === 1353 &&
    span10Chirho.widthPxChirho === 472 &&
    span10Chirho.scriptChirho === "hebrew-chirho" &&
    normalizeTextForStorageChirho(span10Chirho.utf8TextChirho) === "voc: 𝔊 clav וְאֵל"
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 14 &&
    span10Chirho?.segmentIndexChirho === 10 &&
    span10Chirho.xMinPxChirho === 1353 &&
    span10Chirho.widthPxChirho === 154 &&
    span10Chirho.scriptChirho === "latin-non-french-chirho" &&
    normalizeTextForStorageChirho(span10Chirho.utf8TextChirho) === "voc:" &&
    span11Chirho?.segmentIndexChirho === 11 &&
    span11Chirho.xMinPxChirho === 1507 &&
    span11Chirho.widthPxChirho === 71 &&
    span11Chirho.scriptChirho === "symbol-chirho" &&
    normalizeTextForStorageChirho(span11Chirho.utf8TextChirho) === "𝔊" &&
    span12Chirho?.segmentIndexChirho === 12 &&
    span12Chirho.xMinPxChirho === 1578 &&
    span12Chirho.widthPxChirho === 120 &&
    span12Chirho.scriptChirho === "latin-non-french-chirho" &&
    normalizeTextForStorageChirho(span12Chirho.utf8TextChirho) === "clav" &&
    span13Chirho?.segmentIndexChirho === 13 &&
    span13Chirho.xMinPxChirho === 1698 &&
    span13Chirho.widthPxChirho === 127 &&
    span13Chirho.scriptChirho === "hebrew-chirho" &&
    normalizeTextForStorageChirho(span13Chirho.utf8TextChirho) === "וְאֵל"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function replacementSpansChirho(appliedAtChirho: string): SpanChirho[] {
  return [
    {
      segmentIndexChirho: 10,
      xMinPxChirho: 1353,
      widthPxChirho: 154,
      scriptChirho: "latin-non-french-chirho",
      utf8TextChirho: "voc:",
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: VOC_NOTES_CHIRHO,
    },
    {
      segmentIndexChirho: 11,
      xMinPxChirho: 1507,
      widthPxChirho: 71,
      scriptChirho: "symbol-chirho",
      utf8TextChirho: "𝔊",
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: G_SIGLUM_NOTES_CHIRHO,
    },
    {
      segmentIndexChirho: 12,
      xMinPxChirho: 1578,
      widthPxChirho: 120,
      scriptChirho: "latin-non-french-chirho",
      utf8TextChirho: "clav",
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: CLAV_NOTES_CHIRHO,
    },
    {
      segmentIndexChirho: 13,
      xMinPxChirho: 1698,
      widthPxChirho: 127,
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: "וְאֵל",
      provenanceChirho: "vision-chirho",
      visionTranscribedAtChirho: appliedAtChirho,
      visionNotesChirho: HEBREW_NOTES_CHIRHO,
    },
  ];
}

function buildNextLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const nextSpansChirho = spansChirho.flatMap((spanChirho): SpanChirho[] => {
    if (spanChirho.segmentIndexChirho < 10) return [structuredClone(spanChirho)];
    if (spanChirho.segmentIndexChirho === 10) return replacementSpansChirho(appliedAtChirho);
    return [
      {
        ...structuredClone(spanChirho),
        segmentIndexChirho: spanChirho.segmentIndexChirho + 3,
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

function backupRowsChirho(): VisionVerdictChirho[] {
  return [
    {
      volumeChirho: 5,
      pageChirho: 51,
      lineIndexChirho: 4,
      segmentIndexChirho: 10,
      garbleTextChirho: "voc ( clav 4 31ù-5",
      scriptChirho: "latin-non-french-chirho",
      utf8TextChirho: "voc:",
      notesChirho: "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: Latin apparatus label `voc:` remains in Latin/symbol proofing.",
    },
    {
      volumeChirho: 5,
      pageChirho: 51,
      lineIndexChirho: 4,
      segmentIndexChirho: 11,
      garbleTextChirho: "voc ( clav 4 31ù-5",
      scriptChirho: "symbol-chirho",
      utf8TextChirho: "𝔊",
      notesChirho: "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: Septuagint siglum remains in Latin/symbol proofing.",
    },
    {
      volumeChirho: 5,
      pageChirho: 51,
      lineIndexChirho: 4,
      segmentIndexChirho: 12,
      garbleTextChirho: "voc ( clav 4 31ù-5",
      scriptChirho: "latin-non-french-chirho",
      utf8TextChirho: "clav",
      notesChirho: "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: Latin apparatus label `clav` remains in Latin/symbol proofing.",
    },
    {
      volumeChirho: 5,
      pageChirho: 51,
      lineIndexChirho: 4,
      segmentIndexChirho: 13,
      garbleTextChirho: "voc ( clav 4 31ù-5",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: "וְאֵל",
      notesChirho: "Split from old mixed Hebrew span `voc: 𝔊 clav וְאֵל`: the scanline shows the Hebrew word after the `clav` label. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier.",
    },
  ];
}

function reconcileBackupChirho(generatedAtChirho: string): void {
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = backupChirho.verdictsChirho ?? [];
  const targetKeysChirho = new Set(["5:51:4:10", "5:51:4:11", "5:51:4:12", "5:51:4:13"]);
  const firstTargetIndexChirho = verdictsChirho.findIndex((rowChirho) => targetKeysChirho.has(keyChirho(rowChirho)));
  const insertIndexChirho = firstTargetIndexChirho === -1 ? verdictsChirho.length : firstTargetIndexChirho;
  const filteredVerdictsChirho = verdictsChirho.filter((rowChirho) => !targetKeysChirho.has(keyChirho(rowChirho)));
  filteredVerdictsChirho.splice(insertIndexChirho, 0, ...backupRowsChirho());
  backupChirho.generatedAtChirho = generatedAtChirho;
  backupChirho.countChirho = filteredVerdictsChirho.length;
  backupChirho.verdictsChirho = filteredVerdictsChirho;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  lineChirho: SpanLineChirho
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    spansChirho: spanSummaryChirho(lineChirho),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.includes("--apply");
  const modeChirho = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const lineChirho = loadJsonChirho<SpanLineChirho>(LINE_PATH_CHIRHO);
  validateTilingChirho(lineChirho);
  const currentStateChirho = stateChirho(lineChirho);
  if (currentStateChirho === "unknown-chirho") {
    console.log(JSON.stringify(reportChirho(modeChirho, "blocked-chirho", ["line is neither the expected old mixed-span state nor the repaired state"], lineChirho), null, 2));
    process.exitCode = 1;
    return;
  }
  if (currentStateChirho === "already-applied-chirho") {
    if (applyChirho) reconcileBackupChirho(new Date().toISOString());
    console.log(JSON.stringify(reportChirho(modeChirho, "already-applied-chirho", ["mixed apparatus/Hebrew split is already applied"], lineChirho), null, 2));
    return;
  }
  const nextLineChirho = buildNextLineChirho(lineChirho, new Date().toISOString());
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho(modeChirho, "planned-chirho", ["ready to split S10 into Latin label, Septuagint siglum, Latin label, and Hebrew word; add --apply to write"], nextLineChirho), null, 2));
    return;
  }
  const appliedAtChirho = new Date().toISOString();
  const appliedLineChirho = buildNextLineChirho(lineChirho, appliedAtChirho);
  writeJsonChirho(LINE_PATH_CHIRHO, appliedLineChirho);
  reconcileBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", ["split S10 and reconciled durable vision backup; Hebrew word remains expert-pending"], appliedLineChirho), null, 2));
}

if (import.meta.main) mainChirho();
