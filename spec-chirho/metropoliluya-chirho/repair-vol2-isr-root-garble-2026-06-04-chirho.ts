// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for two remaining vol 2 `?`-marked Hebrew root garbles.
 *
 * Both scanlines print the Hebrew root יסר, while OCR stored short Latin/digit
 * garbage (`7D?.` / `1D?`) inside French spans. The recovered root remains
 * vision-tier and needs Hebrew/WLC expert confirmation.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";

const MODULE_CHIRHO = "repair-vol2-isr-root-garble-2026-06-04-chirho";
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

interface TargetConfigChirho {
  labelChirho: string;
  pathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  oldTextChirho: string;
  nextSpansChirho: SpanChirho[];
  verdictChirho: VisionVerdictChirho;
}

interface TargetReportChirho {
  labelChirho: string;
  stateChirho: "pre-repair-chirho" | "already-applied-chirho" | "unknown-chirho";
  spansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho" | "provenanceChirho">>;
}

interface RepairReportChirho {
  moduleChirho: string;
  modeChirho: "dry-run-chirho" | "apply-chirho";
  statusChirho: "planned-chirho" | "applied-chirho" | "already-applied-chirho" | "blocked-chirho";
  messagesChirho: string[];
  targetsChirho: TargetReportChirho[];
}

function linePathChirho(pageChirho: number, lineIndexChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "spans-chirho",
    "vol-2-chirho",
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function notesChirho(descriptionChirho: string): string {
  return `${descriptionChirho} Stored as hebrew-chirho vision-tier, not certified; exact letters, vowels/marks, and punctuation/segmentation remain Hebrew/WLC expert-confirmation tier.`;
}

const TARGETS_CHIRHO: TargetConfigChirho[] = [
  {
    labelChirho: "vol2-p0148-l032-chirho",
    pathChirho: linePathChirho(148, 32),
    volumeChirho: 2,
    pageChirho: 148,
    lineIndexChirho: 32,
    oldTextChirho: "verbe 7D?.",
    nextSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 101,
        scriptChirho: "french-chirho",
        utf8TextChirho: "verbe",
      },
      {
        segmentIndexChirho: 1,
        xMinPxChirho: 101,
        widthPxChirho: 62,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "יסר.",
        provenanceChirho: "vision-chirho",
        visionNotesChirho: notesChirho("Recovered vol 2 p148 line 32 hidden Hebrew root from OCR `7D?.`; the scanline prints `יסר` followed by a period after French `verbe`."),
      },
    ],
    verdictChirho: {
      volumeChirho: 2,
      pageChirho: 148,
      lineIndexChirho: 32,
      segmentIndexChirho: 1,
      garbleTextChirho: "7D?.",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: "יסר.",
      notesChirho: notesChirho("Recovered vol 2 p148 line 32 hidden Hebrew root from OCR `7D?.`; the scanline prints `יסר` followed by a period after French `verbe`."),
    },
  },
  {
    labelChirho: "vol2-p0149-l006-chirho",
    pathChirho: linePathChirho(149, 6),
    volumeChirho: 2,
    pageChirho: 149,
    lineIndexChirho: 6,
    oldTextChirho: "radicale du parfait piél ait un séré”. Puis (94b) il hésite : “le futur de 1D? a parfois",
    nextSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 1236,
        scriptChirho: "french-chirho",
        utf8TextChirho: "radicale du parfait piél ait un séré”. Puis (94b) il hésite : “le futur de",
      },
      {
        segmentIndexChirho: 1,
        xMinPxChirho: 1236,
        widthPxChirho: 49,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "יסר",
        provenanceChirho: "vision-chirho",
        visionNotesChirho: notesChirho("Recovered vol 2 p149 line 6 hidden Hebrew root from OCR `1D?`; the scanline prints `יסר` after French `le futur de`."),
      },
      {
        segmentIndexChirho: 2,
        xMinPxChirho: 1285,
        widthPxChirho: 159,
        scriptChirho: "french-chirho",
        utf8TextChirho: "a parfois",
      },
    ],
    verdictChirho: {
      volumeChirho: 2,
      pageChirho: 149,
      lineIndexChirho: 6,
      segmentIndexChirho: 1,
      garbleTextChirho: "1D?",
      scriptChirho: "hebrew-chirho",
      utf8TextChirho: "יסר",
      notesChirho: notesChirho("Recovered vol 2 p149 line 6 hidden Hebrew root from OCR `1D?`; the scanline prints `יסר` after French `le futur de`."),
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

function spanSummaryChirho(lineChirho: SpanLineChirho): TargetReportChirho["spansChirho"] {
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
    if (spanChirho.segmentIndexChirho !== indexChirho) throw new Error(`segment index ${spanChirho.segmentIndexChirho} !== ${indexChirho}`);
    if (spanChirho.xMinPxChirho !== expectedXChirho) throw new Error(`xMin ${spanChirho.xMinPxChirho} !== expected ${expectedXChirho}`);
    if (spanChirho.widthPxChirho <= 0) throw new Error(`span ${indexChirho} has non-positive width`);
    expectedXChirho += spanChirho.widthPxChirho;
  }
  if (expectedXChirho !== lineChirho.lineWidthPxChirho) throw new Error(`spans end at ${expectedXChirho}, expected ${lineChirho.lineWidthPxChirho}`);
}

function validateTargetLineChirho(lineChirho: SpanLineChirho, configChirho: TargetConfigChirho): void {
  if (
    lineChirho.volumeChirho !== configChirho.volumeChirho ||
    lineChirho.pageChirho !== configChirho.pageChirho ||
    lineChirho.lineIndexChirho !== configChirho.lineIndexChirho
  ) {
    throw new Error(`${configChirho.labelChirho} loaded wrong span line`);
  }
}

function samePlannedSpansChirho(spansChirho: SpanChirho[], configChirho: TargetConfigChirho): boolean {
  if (spansChirho.length !== configChirho.nextSpansChirho.length) return false;
  return configChirho.nextSpansChirho.every((expectedChirho, indexChirho) => {
    const actualChirho = spansChirho[indexChirho];
    return (
      actualChirho?.segmentIndexChirho === expectedChirho.segmentIndexChirho &&
      actualChirho.xMinPxChirho === expectedChirho.xMinPxChirho &&
      actualChirho.widthPxChirho === expectedChirho.widthPxChirho &&
      actualChirho.scriptChirho === expectedChirho.scriptChirho &&
      actualChirho.utf8TextChirho === expectedChirho.utf8TextChirho &&
      (expectedChirho.provenanceChirho === undefined || actualChirho.provenanceChirho === expectedChirho.provenanceChirho)
    );
  });
}

function stateChirho(lineChirho: SpanLineChirho, configChirho: TargetConfigChirho): TargetReportChirho["stateChirho"] {
  const spansChirho = sortedSpansChirho(lineChirho);
  if (spansChirho.length === 1 && spansChirho[0]?.scriptChirho === "french-chirho" && spansChirho[0]?.utf8TextChirho === configChirho.oldTextChirho) {
    return "pre-repair-chirho";
  }
  if (samePlannedSpansChirho(spansChirho, configChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function plannedLineChirho(lineChirho: SpanLineChirho, configChirho: TargetConfigChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho: SpanLineChirho = {
    ...lineChirho,
    spansChirho: configChirho.nextSpansChirho.map((spanChirho) =>
      spanChirho.provenanceChirho === "vision-chirho"
        ? { ...spanChirho, visionTranscribedAtChirho: appliedAtChirho }
        : { ...spanChirho }
    ),
  };
  normalizeSpanLineTextFieldsChirho(nextLineChirho);
  validateTilingChirho(nextLineChirho);
  return nextLineChirho;
}

function writeBackupChirho(appliedAtChirho: string): void {
  if (!existsSync(VISION_VERDICTS_BACKUP_PATH_CHIRHO)) throw new Error(`vision verdict backup missing: ${VISION_VERDICTS_BACKUP_PATH_CHIRHO}`);
  const backupChirho = loadJsonChirho<VisionVerdictsBackupChirho>(VISION_VERDICTS_BACKUP_PATH_CHIRHO);
  const verdictsChirho = (backupChirho.verdictsChirho ?? []).filter(
    (candidateChirho) =>
      !TARGETS_CHIRHO.some(
        (configChirho) =>
          candidateChirho.volumeChirho === configChirho.verdictChirho.volumeChirho &&
          candidateChirho.pageChirho === configChirho.verdictChirho.pageChirho &&
          candidateChirho.lineIndexChirho === configChirho.verdictChirho.lineIndexChirho &&
          candidateChirho.segmentIndexChirho === configChirho.verdictChirho.segmentIndexChirho
      )
  );
  verdictsChirho.push(...TARGETS_CHIRHO.map((configChirho) => configChirho.verdictChirho));
  backupChirho.generatedAtChirho = appliedAtChirho;
  backupChirho.verdictsChirho = verdictsChirho;
  backupChirho.countChirho = verdictsChirho.length;
  writeJsonChirho(VISION_VERDICTS_BACKUP_PATH_CHIRHO, backupChirho);
}

function reportChirho(paramsChirho: {
  applyChirho: boolean;
  statusChirho: RepairReportChirho["statusChirho"];
  messagesChirho: string[];
  targetsChirho: TargetReportChirho[];
}): RepairReportChirho {
  return {
    moduleChirho: MODULE_CHIRHO,
    modeChirho: paramsChirho.applyChirho ? "apply-chirho" : "dry-run-chirho",
    statusChirho: paramsChirho.statusChirho,
    messagesChirho: paramsChirho.messagesChirho,
    targetsChirho: paramsChirho.targetsChirho,
  };
}

function mainChirho(): void {
  const applyChirho = process.argv.includes("--apply");
  const appliedAtChirho = new Date().toISOString();
  const loadedChirho = TARGETS_CHIRHO.map((configChirho) => {
    const lineChirho = loadJsonChirho<SpanLineChirho>(configChirho.pathChirho);
    validateTargetLineChirho(lineChirho, configChirho);
    validateTilingChirho(lineChirho);
    const stateValueChirho = stateChirho(lineChirho, configChirho);
    const nextLineChirho = stateValueChirho === "pre-repair-chirho"
      ? plannedLineChirho(lineChirho, configChirho, appliedAtChirho)
      : lineChirho;
    return { configChirho, lineChirho, nextLineChirho, stateValueChirho };
  });
  if (loadedChirho.some((itemChirho) => itemChirho.stateValueChirho === "unknown-chirho")) {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "blocked-chirho",
      messagesChirho: ["one or more lines are neither in the expected pre-repair state nor already applied"],
      targetsChirho: loadedChirho.map((itemChirho) => ({
        labelChirho: itemChirho.configChirho.labelChirho,
        stateChirho: itemChirho.stateValueChirho,
        spansChirho: spanSummaryChirho(itemChirho.lineChirho),
      })),
    }), null, 2));
    process.exitCode = 1;
    return;
  }
  if (loadedChirho.every((itemChirho) => itemChirho.stateValueChirho === "already-applied-chirho")) {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "already-applied-chirho",
      messagesChirho: ["both יסר root garble repairs are already applied"],
      targetsChirho: loadedChirho.map((itemChirho) => ({
        labelChirho: itemChirho.configChirho.labelChirho,
        stateChirho: itemChirho.stateValueChirho,
        spansChirho: spanSummaryChirho(itemChirho.lineChirho),
      })),
    }), null, 2));
    return;
  }
  const targetReportsChirho = loadedChirho.map((itemChirho) => ({
    labelChirho: itemChirho.configChirho.labelChirho,
    stateChirho: itemChirho.stateValueChirho,
    spansChirho: spanSummaryChirho(itemChirho.nextLineChirho),
  }));
  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "planned-chirho",
      messagesChirho: ["ready to split remaining vol 2 יסר root OCR garbles into Hebrew vision-tier spans"],
      targetsChirho: targetReportsChirho,
    }), null, 2));
    return;
  }
  for (const itemChirho of loadedChirho) {
    if (itemChirho.stateValueChirho === "pre-repair-chirho") writeJsonChirho(itemChirho.configChirho.pathChirho, itemChirho.nextLineChirho);
  }
  writeBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(reportChirho({
    applyChirho,
    statusChirho: "applied-chirho",
    messagesChirho: ["applied remaining vol 2 יסר root garble repairs; regenerate export, packs, scanners, and status"],
    targetsChirho: targetReportsChirho,
  }), null, 2));
}

if (import.meta.main) mainChirho();
