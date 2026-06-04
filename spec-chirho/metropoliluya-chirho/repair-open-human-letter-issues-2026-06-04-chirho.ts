// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for the two open Pass-C human letter issues.
 *
 * The DB rows remain as append-only review records. This script only resolves
 * the live spans when the current text, flags, validation IDs, and geometry
 * still match the reviewed state exactly.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";
import { normalizeTextForStorageChirho } from "../../src-chirho/text-normalization-chirho.ts";

const MODULE_CHIRHO = "repair-open-human-letter-issues-2026-06-04-chirho";
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
  humanReviewStatusChirho?: string;
  humanIssueFlagsChirho?: string[];
  humanValidationIdChirho?: number;
  humanValidationVerdictChirho?: string;
  humanValidatedAtChirho?: string;
  humanValidationNotesChirho?: string;
  humanCorrectionStatusChirho?: string;
  humanCorrectionAppliedAtChirho?: string;
  humanCorrectedFromTextChirho?: string;
  humanCorrectionSourceChirho?: string;
  humanCorrectionIssueFlagsChirho?: string[];
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
  segmentIndexChirho: number;
  linePathChirho: string;
  expectedLineWidthChirho: number;
  expectedOriginalTextChirho: string;
  correctedTextChirho: string;
  expectedIssueFlagsChirho: string[];
  expectedValidationIdChirho: number;
  expectedHumanNotesChirho?: string;
  correctedProvenanceChirho: "human-chirho" | "vision-chirho";
  correctionStatusChirho: string;
  correctionSourceChirho: string;
  visionGarbleTextChirho?: string;
  visionNotesChirho?: string;
}

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "blocked-chirho" | "planned-chirho" | "applied-chirho" | "already-applied-chirho";
  messagesChirho: string[];
  targetsChirho: Array<{
    volumeChirho: number;
    pageChirho: number;
    lineIndexChirho: number;
    segmentIndexChirho: number;
    stateChirho: string;
    beforeTextChirho: string;
    afterTextChirho: string;
    provenanceChirho?: string;
  }>;
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

const REPAIR_TARGETS_CHIRHO: RepairTargetChirho[] = [
  {
    volumeChirho: 3,
    pageChirho: 151,
    lineIndexChirho: 46,
    segmentIndexChirho: 2,
    linePathChirho: spanLinePathChirho(3, 151, 46),
    expectedLineWidthChirho: 457,
    expectedOriginalTextChirho: "פְּאֵר",
    correctedTextChirho: "אתיק",
    expectedIssueFlagsChirho: ["letters-chirho", "vowels-chirho"],
    expectedValidationIdChirho: 4,
    correctedProvenanceChirho: "vision-chirho",
    correctionStatusChirho: "human-letter-issue-repaired-to-vision-chirho",
    correctionSourceChirho: "human-review-note-and-ezekiel-42-3-context-chirho",
    visionGarbleTextChirho: "פְּאֵר",
    visionNotesChirho:
      "Human review flagged the stored פְּאֵר as wrong letters/vowels. The crop and Ezekiel 42:3 context support consonants אתיק (aleph-tav-yod-qoph) for the MT word behind κατὰ στίχον / ἐστιχισμέναι. Stored consonants only as vision-chirho; exact vowels/marks remain Hebrew/WLC expert-confirmation tier.",
  },
  {
    volumeChirho: 5,
    pageChirho: 148,
    lineIndexChirho: 12,
    segmentIndexChirho: 1,
    linePathChirho: spanLinePathChirho(5, 148, 12),
    expectedLineWidthChirho: 2275,
    expectedOriginalTextChirho: "ב",
    correctedTextChirho: "ט",
    expectedIssueFlagsChirho: ["letters-chirho"],
    expectedValidationIdChirho: 10,
    expectedHumanNotesChirho: "its a tet",
    correctedProvenanceChirho: "human-chirho",
    correctionStatusChirho: "human-letter-correction-applied-chirho",
    correctionSourceChirho: "human-review-note-chirho",
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

function sameFlagsChirho(leftChirho: string[] | undefined, rightChirho: string[]): boolean {
  if (!Array.isArray(leftChirho) || leftChirho.length !== rightChirho.length) return false;
  return rightChirho.every((flagChirho) => leftChirho.includes(flagChirho));
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

function validateTargetLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): void {
  if (
    lineChirho.volumeChirho !== targetChirho.volumeChirho ||
    lineChirho.pageChirho !== targetChirho.pageChirho ||
    lineChirho.lineIndexChirho !== targetChirho.lineIndexChirho
  ) {
    throw new Error(`wrong line file for vol ${targetChirho.volumeChirho} p${targetChirho.pageChirho} L${targetChirho.lineIndexChirho}`);
  }
  if (lineChirho.lineWidthPxChirho !== targetChirho.expectedLineWidthChirho) {
    throw new Error(`line width ${lineChirho.lineWidthPxChirho} !== expected ${targetChirho.expectedLineWidthChirho}`);
  }
  validateTilingChirho(lineChirho);
}

function targetSpanChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): SpanChirho {
  const spanChirho = sortedSpansChirho(lineChirho).find(
    (candidateChirho) => candidateChirho.segmentIndexChirho === targetChirho.segmentIndexChirho
  );
  if (spanChirho === undefined) {
    throw new Error(`missing segment ${targetChirho.segmentIndexChirho} on vol ${targetChirho.volumeChirho} p${targetChirho.pageChirho} L${targetChirho.lineIndexChirho}`);
  }
  return spanChirho;
}

function stateForTargetChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho" {
  const spanChirho = targetSpanChirho(lineChirho, targetChirho);
  const currentTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
  if (
    currentTextChirho === normalizeTextForStorageChirho(targetChirho.expectedOriginalTextChirho) &&
    spanChirho.scriptChirho === "hebrew-chirho" &&
    spanChirho.humanReviewStatusChirho === "reviewed-issues-chirho" &&
    spanChirho.humanValidationIdChirho === targetChirho.expectedValidationIdChirho &&
    sameFlagsChirho(spanChirho.humanIssueFlagsChirho, targetChirho.expectedIssueFlagsChirho) &&
    (targetChirho.expectedHumanNotesChirho === undefined || spanChirho.humanValidationNotesChirho === targetChirho.expectedHumanNotesChirho)
  ) {
    return "pre-repair-chirho";
  }
  if (
    currentTextChirho === normalizeTextForStorageChirho(targetChirho.correctedTextChirho) &&
    spanChirho.humanReviewStatusChirho === "reviewed-corrected-chirho" &&
    spanChirho.humanCorrectionStatusChirho === targetChirho.correctionStatusChirho &&
    spanChirho.provenanceChirho === targetChirho.correctedProvenanceChirho
  ) {
    return "already-applied-chirho";
  }
  return "unknown-chirho";
}

function applyTargetChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho = structuredClone(lineChirho);
  const spanChirho = targetSpanChirho(nextLineChirho, targetChirho);
  const previousTextChirho = normalizeTextForStorageChirho(spanChirho.utf8TextChirho);
  spanChirho.utf8TextChirho = normalizeTextForStorageChirho(targetChirho.correctedTextChirho);
  spanChirho.provenanceChirho = targetChirho.correctedProvenanceChirho;
  spanChirho.humanReviewStatusChirho = "reviewed-corrected-chirho";
  spanChirho.humanIssueFlagsChirho = [];
  spanChirho.humanCorrectionStatusChirho = targetChirho.correctionStatusChirho;
  spanChirho.humanCorrectionAppliedAtChirho = appliedAtChirho;
  spanChirho.humanCorrectedFromTextChirho = previousTextChirho;
  spanChirho.humanCorrectionSourceChirho = targetChirho.correctionSourceChirho;
  spanChirho.humanCorrectionIssueFlagsChirho = targetChirho.expectedIssueFlagsChirho;
  if (targetChirho.correctedProvenanceChirho === "vision-chirho") {
    spanChirho.visionTranscribedAtChirho = appliedAtChirho;
    spanChirho.visionNotesChirho = targetChirho.visionNotesChirho;
  }
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTargetLineChirho(nextLineChirho, targetChirho);
  return nextLineChirho;
}

function visionVerdictChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): VisionVerdictChirho | null {
  if (targetChirho.correctedProvenanceChirho !== "vision-chirho") return null;
  const spanChirho = targetSpanChirho(lineChirho, targetChirho);
  if (spanChirho.provenanceChirho !== "vision-chirho") {
    throw new Error(`target span is not vision-chirho at vol ${targetChirho.volumeChirho} p${targetChirho.pageChirho} L${targetChirho.lineIndexChirho}`);
  }
  return {
    volumeChirho: targetChirho.volumeChirho,
    pageChirho: targetChirho.pageChirho,
    lineIndexChirho: targetChirho.lineIndexChirho,
    segmentIndexChirho: targetChirho.segmentIndexChirho,
    garbleTextChirho: targetChirho.visionGarbleTextChirho ?? targetChirho.expectedOriginalTextChirho,
    scriptChirho: "hebrew-chirho",
    utf8TextChirho: normalizeTextForStorageChirho(spanChirho.utf8TextChirho),
    notesChirho: spanChirho.visionNotesChirho ?? targetChirho.visionNotesChirho ?? "",
  };
}

function upsertVisionBackupChirho(
  linesChirho: Array<{ lineChirho: SpanLineChirho; targetChirho: RepairTargetChirho }>,
  appliedAtChirho: string
): number {
  const verdictsToUpsertChirho = linesChirho
    .map(({ lineChirho, targetChirho }) => visionVerdictChirho(lineChirho, targetChirho))
    .filter((verdictChirho): verdictChirho is VisionVerdictChirho => verdictChirho !== null);
  if (verdictsToUpsertChirho.length === 0) return 0;
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) {
    throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  }
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !verdictsToUpsertChirho.some(
        (verdictChirho) =>
          candidateChirho.volumeChirho === verdictChirho.volumeChirho &&
          candidateChirho.pageChirho === verdictChirho.pageChirho &&
          candidateChirho.lineIndexChirho === verdictChirho.lineIndexChirho &&
          candidateChirho.segmentIndexChirho === verdictChirho.segmentIndexChirho
      )
  );
  verdictsChirho.push(...verdictsToUpsertChirho);
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
  return verdictsToUpsertChirho.length;
}

function repairReportChirho(
  modeChirho: RepairReportChirho["modeChirho"],
  statusChirho: RepairReportChirho["statusChirho"],
  messagesChirho: string[],
  entriesChirho: Array<{ lineChirho: SpanLineChirho; targetChirho: RepairTargetChirho; stateChirho: string }>
): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho,
    statusChirho,
    messagesChirho,
    targetsChirho: entriesChirho.map(({ lineChirho, targetChirho, stateChirho }) => {
      const spanChirho = targetSpanChirho(lineChirho, targetChirho);
      return {
        volumeChirho: targetChirho.volumeChirho,
        pageChirho: targetChirho.pageChirho,
        lineIndexChirho: targetChirho.lineIndexChirho,
        segmentIndexChirho: targetChirho.segmentIndexChirho,
        stateChirho,
        beforeTextChirho: targetChirho.expectedOriginalTextChirho,
        afterTextChirho: spanChirho.utf8TextChirho,
        provenanceChirho: spanChirho.provenanceChirho,
      };
    }),
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.slice(2).includes("--apply");
  const modeChirho: RepairReportChirho["modeChirho"] = applyChirho ? "apply-chirho" : "dry-run-chirho";
  const appliedAtChirho = new Date().toISOString();
  const entriesChirho = REPAIR_TARGETS_CHIRHO.map((targetChirho) => {
    const lineChirho = loadJsonChirho<SpanLineChirho>(targetChirho.linePathChirho);
    validateTargetLineChirho(lineChirho, targetChirho);
    const stateChirho = stateForTargetChirho(lineChirho, targetChirho);
    return { lineChirho, targetChirho, stateChirho };
  });

  const unknownEntryChirho = entriesChirho.find(({ stateChirho }) => stateChirho === "unknown-chirho");
  if (unknownEntryChirho !== undefined) {
    console.log(
      JSON.stringify(
        repairReportChirho(
          modeChirho,
          "blocked-chirho",
          [
            `vol ${unknownEntryChirho.targetChirho.volumeChirho} p${unknownEntryChirho.targetChirho.pageChirho} line ${unknownEntryChirho.targetChirho.lineIndexChirho} segment ${unknownEntryChirho.targetChirho.segmentIndexChirho} is not in the expected reviewed-issue or already-applied state`,
          ],
          entriesChirho
        ),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  const plannedEntriesChirho = entriesChirho.map(({ lineChirho, targetChirho, stateChirho }) => ({
    lineChirho: stateChirho === "already-applied-chirho" ? lineChirho : applyTargetChirho(lineChirho, targetChirho, appliedAtChirho),
    targetChirho,
    stateChirho,
  }));

  if (!applyChirho) {
    console.log(
      JSON.stringify(
        repairReportChirho(
          modeChirho,
          plannedEntriesChirho.every(({ stateChirho }) => stateChirho === "already-applied-chirho") ? "already-applied-chirho" : "planned-chirho",
          [
            "ready to resolve two open human letter issues: vol3 p151 L46 becomes vision-tier אתיק, vol5 p148 L12 becomes human-corrected ט",
          ],
          plannedEntriesChirho
        ),
        null,
        2
      )
    );
    return;
  }

  for (const { lineChirho, targetChirho, stateChirho } of plannedEntriesChirho) {
    if (stateChirho === "already-applied-chirho") continue;
    writeJsonChirho(targetChirho.linePathChirho, lineChirho);
  }
  const upsertedVisionCountChirho = upsertVisionBackupChirho(plannedEntriesChirho, appliedAtChirho);
  console.log(
    JSON.stringify(
      repairReportChirho(
        modeChirho,
        "applied-chirho",
        [`applied repairs; upserted ${upsertedVisionCountChirho} vision backup row(s)`],
        plannedEntriesChirho.map((entryChirho) => ({ ...entryChirho, stateChirho: "already-applied-chirho" }))
      ),
      null,
      2
    )
  );
}

mainChirho();
