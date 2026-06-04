// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first split for vol 5 p58 line 2 mixed Targum/Hebrew span.
 *
 * The old symbol span `𝔗 מִּיהֶם` mixed a Targum witness siglum with a pointed
 * Hebrew variant reading. This keeps the siglum in the Latin/symbol lane and
 * routes the Hebrew word to Hebrew/WLC expert review without certification.
 */

import { readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-p58-l2-targum-hebrew-2026-06-04-chirho";
const LINE_PATH_CHIRHO = spanLinePathChirho(5, 58, 2);
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

const SYMBOL_NOTES_CHIRHO =
  "Split from old mixed symbol span `𝔗 מִּיהֶם`: the Targum siglum remains in the Latin/symbol review lane while the following Hebrew variant reading is routed separately to Hebrew/WLC expert confirmation.";
const HEBREW_NOTES_CHIRHO =
  "Split from old mixed symbol span `𝔗 מִּיהֶם`: scanline shows this pointed Hebrew variant reading after the Targum siglum. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier.";

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
  if (
    spansChirho.length === 13 &&
    span10Chirho?.segmentIndexChirho === 10 &&
    span10Chirho.xMinPxChirho === 1342 &&
    span10Chirho.widthPxChirho === 261 &&
    span10Chirho.scriptChirho === "symbol-chirho" &&
    normalizeTextForStorageChirho(span10Chirho.utf8TextChirho) === "𝔗 מִּיהֶם"
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 14 &&
    span10Chirho?.segmentIndexChirho === 10 &&
    span10Chirho.xMinPxChirho === 1342 &&
    span10Chirho.widthPxChirho === 53 &&
    span10Chirho.scriptChirho === "symbol-chirho" &&
    normalizeTextForStorageChirho(span10Chirho.utf8TextChirho) === "𝔗" &&
    span11Chirho?.segmentIndexChirho === 11 &&
    span11Chirho.xMinPxChirho === 1395 &&
    span11Chirho.widthPxChirho === 208 &&
    span11Chirho.scriptChirho === "hebrew-chirho" &&
    normalizeTextForStorageChirho(span11Chirho.utf8TextChirho) === "מִּיהֶם"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function buildNextLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const nextSpansChirho = spansChirho.flatMap((spanChirho): SpanChirho[] => {
    if (spanChirho.segmentIndexChirho < 10) return [structuredClone(spanChirho)];
    if (spanChirho.segmentIndexChirho === 10) {
      return [
        {
          ...structuredClone(spanChirho),
          widthPxChirho: 53,
          scriptChirho: "symbol-chirho",
          utf8TextChirho: "𝔗",
          provenanceChirho: "vision-chirho",
          visionTranscribedAtChirho: spanChirho.visionTranscribedAtChirho ?? appliedAtChirho,
          visionNotesChirho: SYMBOL_NOTES_CHIRHO,
        },
        {
          segmentIndexChirho: 11,
          xMinPxChirho: 1395,
          widthPxChirho: 208,
          scriptChirho: "hebrew-chirho",
          utf8TextChirho: "מִּיהֶם",
          provenanceChirho: "vision-chirho",
          visionTranscribedAtChirho: appliedAtChirho,
          visionNotesChirho: HEBREW_NOTES_CHIRHO,
        },
      ];
    }
    return [
      {
        ...structuredClone(spanChirho),
        segmentIndexChirho: spanChirho.segmentIndexChirho + 1,
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
      pageChirho: 58,
      lineIndexChirho: 2,
      segmentIndexChirho: 10,
      garbleTextChirho: "*: ,6ù. 0ı",
      scriptChirho: "symbol-chirho",
      utf8TextChirho: "𝔗",
      notesChirho: "Split from old mixed span `𝔗 מִּיהֶם`: the Targum siglum remains in the Latin/symbol review lane.",
    },
    {
      volumeChirho: 5,
      pageChirho: 58,
      lineIndexChirho: 2,
      segmentIndexChirho: 11,
      garbleTextChirho: "Hebrew variant embedded in old S10 `𝔗 מִּיהֶם`",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: "מִּיהֶם",
      notesChirho:
        "Split from old mixed symbol span `𝔗 מִּיהֶם`: the scanline shows this pointed Hebrew variant reading after the Targum siglum. Stored as vision-chirho; exact letters and pointing remain Hebrew/WLC expert-confirmation tier.",
    },
    {
      volumeChirho: 5,
      pageChirho: 58,
      lineIndexChirho: 2,
      segmentIndexChirho: 13,
      garbleTextChirho: "(",
      scriptChirho: "symbol-chirho",
      utf8TextChirho: "𝔊",
      notesChirho: "CTAT siglum: Septuagint/Greek (U+1D50A)",
    },
  ];
}

function reconcileBackupChirho(generatedAtChirho: string): void {
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const oldKeysChirho = new Set(["5:58:2:10", "5:58:2:11", "5:58:2:12", "5:58:2:13"]);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter((rowChirho) => !oldKeysChirho.has(keyChirho(rowChirho)));
  verdictsChirho.push(...backupRowsChirho());
  backupChirho.generatedAtChirho = generatedAtChirho;
  backupChirho.countChirho = verdictsChirho.length;
  backupChirho.verdictsChirho = verdictsChirho;
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
    console.log(JSON.stringify(reportChirho(modeChirho, "already-applied-chirho", ["mixed Targum/Hebrew split is already applied"], lineChirho), null, 2));
    return;
  }
  const nextLineChirho = buildNextLineChirho(lineChirho, new Date().toISOString());
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho(modeChirho, "planned-chirho", ["ready to split S10 into Targum siglum and Hebrew variant; add --apply to write"], nextLineChirho), null, 2));
    return;
  }
  const appliedAtChirho = new Date().toISOString();
  const appliedLineChirho = buildNextLineChirho(lineChirho, appliedAtChirho);
  writeJsonChirho(LINE_PATH_CHIRHO, appliedLineChirho);
  reconcileBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", ["split S10 and reconciled durable vision backup; Hebrew variant remains expert-pending"], appliedLineChirho), null, 2));
}

if (import.meta.main) mainChirho();
