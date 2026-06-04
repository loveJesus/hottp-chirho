// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first split for vol 5 p51 line 5 mixed apparatus span.
 *
 * The old symbol span `σ′ 𝔙 𝔗 מְ` mixed witness sigla with a pointed Hebrew
 * partial. This keeps the sigla in the Latin/symbol lane and routes the Hebrew
 * partial to the Hebrew/WLC expert lane without certifying either item.
 */

import { readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho, spanLinePathChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol5-p51-l5-mixed-sigla-hebrew-2026-06-04-chirho";
const LINE_PATH_CHIRHO = spanLinePathChirho(5, 51, 5);
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
  "Split from old mixed symbol span `σ′ 𝔙 𝔗 מְ`: the Greek/witness sigla remain in the Latin/symbol review lane while the following Hebrew partial is routed separately to Hebrew/WLC expert confirmation.";
const HEBREW_NOTES_CHIRHO =
  "Split from old mixed symbol span `σ′ 𝔙 𝔗 מְ`: scanline shows this pointed Hebrew partial as a distinct final token after the sigla. Stored as vision-chirho; exact role of the partial form and pointing remain Hebrew/WLC expert-confirmation tier.";

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
  const span8Chirho = spansChirho[8];
  const span9Chirho = spansChirho[9];
  if (
    spansChirho.length === 12 &&
    span8Chirho?.segmentIndexChirho === 8 &&
    span8Chirho.xMinPxChirho === 1175 &&
    span8Chirho.widthPxChirho === 309 &&
    span8Chirho.scriptChirho === "symbol-chirho" &&
    normalizeTextForStorageChirho(span8Chirho.utf8TextChirho) === "σ′ 𝔙 𝔗 מְ"
  ) {
    return "pre-repair-chirho";
  }
  if (
    spansChirho.length === 13 &&
    span8Chirho?.segmentIndexChirho === 8 &&
    span8Chirho.xMinPxChirho === 1175 &&
    span8Chirho.widthPxChirho === 190 &&
    span8Chirho.scriptChirho === "symbol-chirho" &&
    normalizeTextForStorageChirho(span8Chirho.utf8TextChirho) === "σ′ 𝔙 𝔗" &&
    span9Chirho?.segmentIndexChirho === 9 &&
    span9Chirho.xMinPxChirho === 1365 &&
    span9Chirho.widthPxChirho === 119 &&
    span9Chirho.scriptChirho === "hebrew-chirho" &&
    normalizeTextForStorageChirho(span9Chirho.utf8TextChirho) === "מְ"
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function buildNextLineChirho(lineChirho: SpanLineChirho, appliedAtChirho: string): SpanLineChirho {
  const spansChirho = sortedSpansChirho(lineChirho);
  const nextSpansChirho = spansChirho.flatMap((spanChirho): SpanChirho[] => {
    if (spanChirho.segmentIndexChirho < 8) return [structuredClone(spanChirho)];
    if (spanChirho.segmentIndexChirho === 8) {
      return [
        {
          ...structuredClone(spanChirho),
          widthPxChirho: 190,
          scriptChirho: "symbol-chirho",
          utf8TextChirho: "σ′ 𝔙 𝔗",
          provenanceChirho: "vision-chirho",
          visionTranscribedAtChirho: spanChirho.visionTranscribedAtChirho ?? appliedAtChirho,
          visionNotesChirho: SYMBOL_NOTES_CHIRHO,
        },
        {
          segmentIndexChirho: 9,
          xMinPxChirho: 1365,
          widthPxChirho: 119,
          scriptChirho: "hebrew-chirho",
          utf8TextChirho: "מְ",
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
      pageChirho: 51,
      lineIndexChirho: 5,
      segmentIndexChirho: 8,
      garbleTextChirho: "#$ '*-8",
      scriptChirho: "symbol-chirho",
      utf8TextChirho: "σ′ 𝔙 𝔗",
      notesChirho:
        "Split from the old mixed span `σ′ 𝔙 𝔗 מְ`: the Greek/Symmachus siglum σ′ plus Vulgate 𝔙 and Targum 𝔗 witness sigla remain in the Latin/symbol review lane.",
    },
    {
      volumeChirho: 5,
      pageChirho: 51,
      lineIndexChirho: 5,
      segmentIndexChirho: 9,
      garbleTextChirho: "Hebrew partial embedded in old S8 `σ′ 𝔙 𝔗 מְ`",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: "מְ",
      notesChirho:
        "Split from the old mixed symbol span `σ′ 𝔙 𝔗 מְ`: the scanline shows pointed Hebrew partial `מְ` as a distinct final token after the sigla. Stored as vision-chirho; exact role of the partial form and pointing remain Hebrew/WLC expert-confirmation tier.",
    },
    {
      volumeChirho: 5,
      pageChirho: 51,
      lineIndexChirho: 5,
      segmentIndexChirho: 12,
      garbleTextChirho: "styl )",
      scriptChirho: "latin-non-french-chirho",
      utf8TextChirho: "styl: 𝔖",
      notesChirho: "Mixed: Latin abbreviation 'styl:' (stylistique/stylistic) and Syriac/Peshitta siglum 𝔖",
    },
  ];
}

function reconcileBackupChirho(generatedAtChirho: string): void {
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const oldKeysChirho = new Set(["5:51:5:8", "5:51:5:9", "5:51:5:11", "5:51:5:12"]);
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
    console.log(JSON.stringify(reportChirho(modeChirho, "already-applied-chirho", ["mixed sigla/Hebrew split is already applied"], lineChirho), null, 2));
    return;
  }
  const nextLineChirho = buildNextLineChirho(lineChirho, new Date().toISOString());
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho(modeChirho, "planned-chirho", ["ready to split S8 into symbol sigla and Hebrew partial; add --apply to write"], nextLineChirho), null, 2));
    return;
  }
  const appliedAtChirho = new Date().toISOString();
  const appliedLineChirho = buildNextLineChirho(lineChirho, appliedAtChirho);
  writeJsonChirho(LINE_PATH_CHIRHO, appliedLineChirho);
  reconcileBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(reportChirho(modeChirho, "applied-chirho", ["split S8 and reconciled durable vision backup; new Hebrew partial remains expert-pending"], appliedLineChirho), null, 2));
}

if (import.meta.main) mainChirho();
