// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for two vol 2 hidden קדש spans.
 *
 * Pass-C rendered the same Hebrew word as short Latin/symbol garbage on two
 * related lines. Claude caught that the word is קדש, not the nearby קֶשֶׁר that
 * could anchor the eye. The recovered consonants are stored as vision-chirho
 * only; exact pointing remains expert-tier.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-vol2-kadash-hidden-hebrew-2026-06-04-chirho";
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

interface RepairTargetChirho {
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  spanLinePathChirho: string;
  expectedRenderedChirho: string;
  repairedRenderedChirho: string;
  plannedSpansChirho: (appliedAtChirho: string, lineChirho: SpanLineChirho) => SpanChirho[];
  recoveredSegmentIndexChirho: number;
  garbleTextChirho: string;
  notesChirho: string;
}

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  linesChirho: Array<{
    volumeChirho: number;
    pageChirho: number;
    lineIndexChirho: number;
    stateChirho: string;
    spansChirho: Array<
      Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">
    >;
  }>;
}

const RECOVERED_KADASH_CHIRHO = "קדש";

function spanLinePathChirho(pageChirho: number, lineIndexChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "spans-chirho",
    "vol-2-chirho",
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function visionNotesChirho(specificNotesChirho: string): string {
  return `${specificNotesChirho} Claude and Codex second-witnessed the scanline as consonants קדש, explicitly correcting the anchoring risk from the nearby קֶשֶׁר. Stored consonants only as vision-chirho; exact vowels/marks and punctuation remain Hebrew/WLC expert-confirmation tier.`;
}

const REPAIR_TARGETS_CHIRHO: RepairTargetChirho[] = [
  {
    volumeChirho: 2,
    pageChirho: 150,
    lineIndexChirho: 13,
    spanLinePathChirho: spanLinePathChirho(150, 13),
    expectedRenderedChirho: "de remplacer les deux קֶשֶׁר du vs 12 par #1p, obtenant ainsi pour les vss 12-14 : (12)",
    repairedRenderedChirho: "de remplacer les deux קֶשֶׁר du vs 12 par קדש , obtenant ainsi pour les vss 12-14 : (12)",
    recoveredSegmentIndexChirho: 3,
    garbleTextChirho: "#1p,",
    notesChirho: visionNotesChirho(
      "Recovered the hidden Hebrew word after French 'par' on vol 2 p150 L13. The French context says to replace the two קֶשֶׁר readings with קדש, so this is not a duplicate קֶשֶׁר. The printed comma belongs to the resuming French punctuation span."
    ),
    plannedSpansChirho: (appliedAtChirho, lineChirho) => {
      const spansChirho = sortedSpansChirho(lineChirho);
      const prefixSpanChirho = spansChirho[0];
      const existingHebrewSpanChirho = spansChirho[1];
      if (prefixSpanChirho === undefined || existingHebrewSpanChirho === undefined) {
        throw new Error("vol 2 p150 L13 expected original prefix and Hebrew spans");
      }
      return [
        prefixSpanChirho,
        existingHebrewSpanChirho,
        {
          segmentIndexChirho: 2,
          xMinPxChirho: 462,
          widthPxChirho: 226,
          scriptChirho: "french-chirho",
          utf8TextChirho: "du vs 12 par",
        },
        {
          segmentIndexChirho: 3,
          xMinPxChirho: 688,
          widthPxChirho: 64,
          scriptChirho: "hebrew-chirho",
          utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_KADASH_CHIRHO),
          provenanceChirho: "vision-chirho",
          visionTranscribedAtChirho: appliedAtChirho,
          visionNotesChirho: REPAIR_TARGETS_CHIRHO[0]?.notesChirho,
        },
        {
          segmentIndexChirho: 4,
          xMinPxChirho: 752,
          widthPxChirho: 686,
          scriptChirho: "french-chirho",
          utf8TextChirho: ", obtenant ainsi pour les vss 12-14 : (12)",
        },
      ];
    },
  },
  {
    volumeChirho: 2,
    pageChirho: 151,
    lineIndexChirho: 37,
    spanLinePathChirho: spanLinePathChirho(151, 37),
    expectedRenderedChirho: "de #7p lié (comme ici) au hifil de ערץ Or la critique littéraire admet d'ordinaire que",
    repairedRenderedChirho: "de קדש lié (comme ici) au hifil de ערץ Or la critique littéraire admet d'ordinaire que",
    recoveredSegmentIndexChirho: 1,
    garbleTextChirho: "#7p",
    notesChirho: visionNotesChirho(
      "Recovered the hidden Hebrew word after French 'de' on vol 2 p151 L37. The scanline shows qof-dalet-shin before 'lié (comme ici) au hifil de ערץ', not קֶשֶׁר."
    ),
    plannedSpansChirho: (appliedAtChirho, lineChirho) => {
      const spansChirho = sortedSpansChirho(lineChirho);
      const existingArotsSpanChirho = spansChirho[1];
      const suffixSpanChirho = spansChirho[2];
      if (existingArotsSpanChirho === undefined || suffixSpanChirho === undefined) {
        throw new Error("vol 2 p151 L37 expected original ערץ and suffix spans");
      }
      return [
        {
          segmentIndexChirho: 0,
          xMinPxChirho: 0,
          widthPxChirho: 54,
          scriptChirho: "french-chirho",
          utf8TextChirho: "de",
        },
        {
          segmentIndexChirho: 1,
          xMinPxChirho: 54,
          widthPxChirho: 65,
          scriptChirho: "hebrew-chirho",
          utf8TextChirho: normalizeTextForStorageChirho(RECOVERED_KADASH_CHIRHO),
          provenanceChirho: "vision-chirho",
          visionTranscribedAtChirho: appliedAtChirho,
          visionNotesChirho: REPAIR_TARGETS_CHIRHO[1]?.notesChirho,
        },
        {
          segmentIndexChirho: 2,
          xMinPxChirho: 119,
          widthPxChirho: 478,
          scriptChirho: "french-chirho",
          utf8TextChirho: "lié (comme ici) au hifil de",
        },
        {
          ...existingArotsSpanChirho,
          segmentIndexChirho: 3,
          xMinPxChirho: 597,
          widthPxChirho: 81,
        },
        {
          ...suffixSpanChirho,
          segmentIndexChirho: 4,
          xMinPxChirho: 678,
          widthPxChirho: 767,
        },
      ];
    },
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

function renderedLineChirho(lineChirho: SpanLineChirho): string {
  return sortedSpansChirho(lineChirho)
    .map((spanChirho) => spanChirho.utf8TextChirho)
    .join(" ");
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

function validateTargetLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): void {
  if (
    lineChirho.volumeChirho !== targetChirho.volumeChirho ||
    lineChirho.pageChirho !== targetChirho.pageChirho ||
    lineChirho.lineIndexChirho !== targetChirho.lineIndexChirho
  ) {
    throw new Error(`span file is not vol ${targetChirho.volumeChirho} page ${targetChirho.pageChirho} line ${targetChirho.lineIndexChirho}`);
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

function stateForLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const renderedChirho = normalizeTextForStorageChirho(renderedLineChirho(lineChirho));
  if (renderedChirho === normalizeTextForStorageChirho(targetChirho.expectedRenderedChirho)) return "pre-repair-chirho";
  if (renderedChirho === normalizeTextForStorageChirho(targetChirho.repairedRenderedChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function buildPlannedLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  nextLineChirho.spansChirho = targetChirho.plannedSpansChirho(appliedAtChirho, lineChirho);
  validateTilingChirho(nextLineChirho);
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  return nextLineChirho;
}

function visionVerdictForTargetChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): VisionVerdictChirho {
  const recoveredSpanChirho = sortedSpansChirho(lineChirho).find(
    (spanChirho) =>
      spanChirho.segmentIndexChirho === targetChirho.recoveredSegmentIndexChirho &&
      spanChirho.scriptChirho === "hebrew-chirho" &&
      spanChirho.provenanceChirho === "vision-chirho"
  );
  if (recoveredSpanChirho === undefined) {
    throw new Error(`recovered vision Hebrew span missing on vol ${targetChirho.volumeChirho} p${targetChirho.pageChirho} L${targetChirho.lineIndexChirho}`);
  }
  return {
    volumeChirho: targetChirho.volumeChirho,
    pageChirho: targetChirho.pageChirho,
    lineIndexChirho: targetChirho.lineIndexChirho,
    segmentIndexChirho: targetChirho.recoveredSegmentIndexChirho,
    garbleTextChirho: targetChirho.garbleTextChirho,
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(recoveredSpanChirho.utf8TextChirho),
    notesChirho: recoveredSpanChirho.visionNotesChirho ?? targetChirho.notesChirho,
  };
}

function upsertVisionBackupChirho(linesChirho: Array<{ lineChirho: SpanLineChirho; targetChirho: RepairTargetChirho }>, appliedAtChirho: string): number {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !linesChirho.some(
        ({ targetChirho }) =>
          candidateChirho.volumeChirho === targetChirho.volumeChirho &&
          candidateChirho.pageChirho === targetChirho.pageChirho &&
          candidateChirho.lineIndexChirho === targetChirho.lineIndexChirho
      )
  );
  for (const { lineChirho, targetChirho } of linesChirho) {
    verdictsChirho.push(visionVerdictForTargetChirho(lineChirho, targetChirho));
  }
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return linesChirho.length;
}

function reportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  linesChirho: Array<{ lineChirho: SpanLineChirho; targetChirho: RepairTargetChirho; stateChirho: string }>
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    linesChirho: linesChirho.map(({ lineChirho, targetChirho, stateChirho }) => ({
      volumeChirho: targetChirho.volumeChirho,
      pageChirho: targetChirho.pageChirho,
      lineIndexChirho: targetChirho.lineIndexChirho,
      stateChirho,
      spansChirho: spanSummaryChirho(lineChirho),
    })),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const loadedLinesChirho = REPAIR_TARGETS_CHIRHO.map((targetChirho) => {
    const lineChirho = loadJsonChirho<SpanLineChirho>(targetChirho.spanLinePathChirho);
    validateTargetLineChirho(lineChirho, targetChirho);
    validateTilingChirho(lineChirho);
    const stateChirho = stateForLineChirho(lineChirho, targetChirho);
    return { lineChirho, targetChirho, stateChirho };
  });

  const unknownLineChirho = loadedLinesChirho.find(({ stateChirho }) => stateChirho === "unknown-chirho");
  if (unknownLineChirho !== undefined) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          "blocked-chirho",
          [
            `vol ${unknownLineChirho.targetChirho.volumeChirho} p${unknownLineChirho.targetChirho.pageChirho} line ${unknownLineChirho.targetChirho.lineIndexChirho} is not in the expected pre-repair or already-applied state; refusing to guess around current edits`,
            `rendered line: ${JSON.stringify(renderedLineChirho(unknownLineChirho.lineChirho))}`,
          ],
          loadedLinesChirho
        ),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  const plannedLinesChirho = loadedLinesChirho.map(({ lineChirho, targetChirho, stateChirho }) => ({
    lineChirho: stateChirho === "already-applied-chirho" ? lineChirho : buildPlannedLineChirho(lineChirho, targetChirho, appliedAtChirho),
    targetChirho,
    stateChirho,
  }));

  if (!applyChirho) {
    console.log(
      JSON.stringify(
        reportChirho(
          modeChirho,
          plannedLinesChirho.every(({ stateChirho }) => stateChirho === "already-applied-chirho") ? "already-applied-chirho" : "planned-chirho",
          ["ready to repair two hidden קדש spans as vision-chirho without certifying vowels or marks"],
          plannedLinesChirho
        ),
        null,
        2
      )
    );
    return;
  }

  for (const { lineChirho, targetChirho, stateChirho } of plannedLinesChirho) {
    if (stateChirho !== "already-applied-chirho") {
      writeJsonChirho(targetChirho.spanLinePathChirho, lineChirho);
    }
  }
  const upsertCountChirho = upsertVisionBackupChirho(
    plannedLinesChirho.map(({ lineChirho, targetChirho }) => ({ lineChirho, targetChirho })),
    appliedAtChirho
  );
  console.log(
    JSON.stringify(
      reportChirho(
        modeChirho,
        "applied-chirho",
        [`applied repair and upserted ${upsertCountChirho} durable vision verdicts for hidden קדש spans`],
        plannedLinesChirho
      ),
      null,
      2
    )
  );
}

mainChirho();
