// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

/**
 * Dry-run-first repair for short question-mark garbles adjacent to Hebrew.
 *
 * The hidden-Hebrew scanner can now flag short `D?` / `On?` style OCR tokens
 * when they sit next to a Hebrew span. These two lines were visually inspected
 * against the scanlines and are repaired as vision-tier only, not certified.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

import { PROJECT_ROOT_CHIRHO } from "../../src-chirho/config-chirho.ts";
import { normalizeSpanLineTextFieldsChirho } from "../../src-chirho/span-nfc-chirho.ts";

const MODULE_CHIRHO = "repair-short-question-hebrew-garbles-2026-06-04-chirho";
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
  labelChirho: string;
  pathChirho: string;
  volumeChirho: number;
  pageChirho: number;
  lineIndexChirho: number;
  oldSpansChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho">>;
  nextSpansChirho: SpanChirho[];
  verdictsChirho: VisionVerdictChirho[];
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

function linePathChirho(volumeChirho: number, pageChirho: number, lineIndexChirho: number): string {
  return join(
    PROJECT_ROOT_CHIRHO,
    "workspace-chirho",
    "spans-chirho",
    `vol-${volumeChirho}-chirho`,
    `page-${String(pageChirho).padStart(4, "0")}-chirho`,
    `line-${String(lineIndexChirho).padStart(3, "0")}-chirho.json`
  );
}

function notesChirho(descriptionChirho: string): string {
  return `${descriptionChirho} Stored as vision-chirho, not certified; exact letters, vowels/marks, punctuation, and segmentation remain Hebrew/WLC expert-confirmation tier.`;
}

const TARGETS_CHIRHO: RepairTargetChirho[] = [
  {
    labelChirho: "vol1-p0150-l036-chirho",
    pathChirho: linePathChirho(1, 150, 36),
    volumeChirho: 1,
    pageChirho: 150,
    lineIndexChirho: 36,
    oldSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 849,
        scriptChirho: "french-chirho",
        utf8TextChirho: "plément d'objet étant explicité ensuite en On?",
      },
      {
        segmentIndexChirho: 1,
        xMinPxChirho: 849,
        widthPxChirho: 413,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "רשמתם את מחנה ישראל",
      },
      {
        segmentIndexChirho: 2,
        xMinPxChirho: 1262,
        widthPxChirho: 172,
        scriptChirho: "french-chirho",
        utf8TextChirho: "En ce cas,",
      },
    ],
    nextSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 690,
        scriptChirho: "french-chirho",
        utf8TextChirho: "plément d'objet étant explicité ensuite en",
      },
      {
        segmentIndexChirho: 1,
        xMinPxChirho: 690,
        widthPxChirho: 572,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "ורשמתם את מחנה ישראל לחרם.",
        provenanceChirho: "vision-chirho",
        visionNotesChirho: notesChirho("Repaired vol 1 p150 line 36 split-through-Hebrew phrase: the scanline prints the bare Hebrew phrase `ורשמתם את מחנה ישראל לחרם.` after French `ensuite en`; old OCR left `לחרם` in the French span as `On?` and started the Hebrew span at `רשמתם`."),
      },
      {
        segmentIndexChirho: 2,
        xMinPxChirho: 1262,
        widthPxChirho: 172,
        scriptChirho: "french-chirho",
        utf8TextChirho: "En ce cas,",
      },
    ],
    verdictsChirho: [
      {
        volumeChirho: 1,
        pageChirho: 150,
        lineIndexChirho: 36,
        segmentIndexChirho: 1,
        garbleTextChirho: "On? + too-narrow Hebrew span `רשמתם את מחנה ישראל`",
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "ורשמתם את מחנה ישראל לחרם.",
        notesChirho: notesChirho("Repaired vol 1 p150 line 36 split-through-Hebrew phrase: the scanline prints the bare Hebrew phrase `ורשמתם את מחנה ישראל לחרם.` after French `ensuite en`; old OCR left `לחרם` in the French span as `On?` and started the Hebrew span at `רשמתם`."),
      },
    ],
  },
  {
    labelChirho: "vol2-p0149-l028-chirho",
    pathChirho: linePathChirho(2, 149, 28),
    volumeChirho: 2,
    pageChirho: 149,
    lineIndexChirho: 28,
    oldSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 868,
        scriptChirho: "french-chirho",
        utf8TextChirho: "même verbe). La construction du verbe D? avec",
      },
      {
        segmentIndexChirho: 1,
        xMinPxChirho: 868,
        widthPxChirho: 52,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "יסר",
      },
      {
        segmentIndexChirho: 2,
        xMinPxChirho: 920,
        widthPxChirho: 522,
        scriptChirho: "french-chirho",
        utf8TextChirho: "serait un hapax, alors que celle",
      },
    ],
    nextSpansChirho: [
      {
        segmentIndexChirho: 0,
        xMinPxChirho: 0,
        widthPxChirho: 700,
        scriptChirho: "french-chirho",
        utf8TextChirho: "même verbe). La construction du verbe",
      },
      {
        segmentIndexChirho: 1,
        xMinPxChirho: 700,
        widthPxChirho: 66,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "יסר",
        provenanceChirho: "vision-chirho",
        visionNotesChirho: notesChirho("Repaired vol 2 p149 line 28 split-through-Hebrew phrase: the scanline prints `du verbe יסר avec מן`; old OCR stored the first Hebrew word as French `D?` and put the old `יסר` span over the later `מן` word."),
      },
      {
        segmentIndexChirho: 2,
        xMinPxChirho: 766,
        widthPxChirho: 92,
        scriptChirho: "french-chirho",
        utf8TextChirho: "avec",
      },
      {
        segmentIndexChirho: 3,
        xMinPxChirho: 858,
        widthPxChirho: 52,
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "מן",
        provenanceChirho: "vision-chirho",
        visionNotesChirho: notesChirho("Repaired vol 2 p149 line 28 split-through-Hebrew phrase: this boxed word is `מן`, while the old span text over this box was `יסר`."),
      },
      {
        segmentIndexChirho: 4,
        xMinPxChirho: 910,
        widthPxChirho: 532,
        scriptChirho: "french-chirho",
        utf8TextChirho: "serait un hapax, alors que celle",
      },
    ],
    verdictsChirho: [
      {
        volumeChirho: 2,
        pageChirho: 149,
        lineIndexChirho: 28,
        segmentIndexChirho: 1,
        garbleTextChirho: "D?",
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "יסר",
        notesChirho: notesChirho("Repaired vol 2 p149 line 28 split-through-Hebrew phrase: the scanline prints `du verbe יסר avec מן`; old OCR stored the first Hebrew word as French `D?`."),
      },
      {
        volumeChirho: 2,
        pageChirho: 149,
        lineIndexChirho: 28,
        segmentIndexChirho: 3,
        garbleTextChirho: "old segment 1 text `יסר` over printed `מן`",
        scriptChirho: "hebrew-chirho",
        utf8TextChirho: "מן",
        notesChirho: notesChirho("Repaired vol 2 p149 line 28 split-through-Hebrew phrase: the scanline prints `מן` after French `avec`, while the old span text over this box was `יסר`."),
      },
    ],
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

function validateTargetLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): void {
  if (
    lineChirho.volumeChirho !== targetChirho.volumeChirho ||
    lineChirho.pageChirho !== targetChirho.pageChirho ||
    lineChirho.lineIndexChirho !== targetChirho.lineIndexChirho
  ) {
    throw new Error(`${targetChirho.labelChirho} loaded wrong span line`);
  }
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

function sameShapeChirho(
  spansChirho: SpanChirho[],
  expectedChirho: Array<Pick<SpanChirho, "segmentIndexChirho" | "xMinPxChirho" | "widthPxChirho" | "scriptChirho" | "utf8TextChirho">>
): boolean {
  if (spansChirho.length !== expectedChirho.length) return false;
  return expectedChirho.every((expectedSpanChirho, indexChirho) => {
    const actualChirho = spansChirho[indexChirho];
    return (
      actualChirho?.segmentIndexChirho === expectedSpanChirho.segmentIndexChirho &&
      actualChirho.xMinPxChirho === expectedSpanChirho.xMinPxChirho &&
      actualChirho.widthPxChirho === expectedSpanChirho.widthPxChirho &&
      actualChirho.scriptChirho === expectedSpanChirho.scriptChirho &&
      actualChirho.utf8TextChirho === expectedSpanChirho.utf8TextChirho
    );
  });
}

function samePlannedSpansChirho(spansChirho: SpanChirho[], targetChirho: RepairTargetChirho): boolean {
  if (!sameShapeChirho(spansChirho, targetChirho.nextSpansChirho)) return false;
  return targetChirho.nextSpansChirho.every((expectedChirho, indexChirho) => {
    const actualChirho = spansChirho[indexChirho];
    return expectedChirho.provenanceChirho === undefined || actualChirho?.provenanceChirho === expectedChirho.provenanceChirho;
  });
}

function stateForTargetChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho): TargetReportChirho["stateChirho"] {
  const spansChirho = sortedSpansChirho(lineChirho);
  if (sameShapeChirho(spansChirho, targetChirho.oldSpansChirho)) return "pre-repair-chirho";
  if (samePlannedSpansChirho(spansChirho, targetChirho)) return "already-applied-chirho";
  return "unknown-chirho";
}

function plannedLineChirho(lineChirho: SpanLineChirho, targetChirho: RepairTargetChirho, appliedAtChirho: string): SpanLineChirho {
  const nextLineChirho: SpanLineChirho = {
    ...lineChirho,
    spansChirho: targetChirho.nextSpansChirho.map((spanChirho) =>
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
      !TARGETS_CHIRHO.some((targetChirho) =>
        targetChirho.verdictsChirho.some(
          (verdictChirho) =>
            candidateChirho.volumeChirho === verdictChirho.volumeChirho &&
            candidateChirho.pageChirho === verdictChirho.pageChirho &&
            candidateChirho.lineIndexChirho === verdictChirho.lineIndexChirho &&
            candidateChirho.segmentIndexChirho === verdictChirho.segmentIndexChirho
        )
      )
  );
  verdictsChirho.push(...TARGETS_CHIRHO.flatMap((targetChirho) => targetChirho.verdictsChirho));
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
  const loadedChirho = TARGETS_CHIRHO.map((targetChirho) => {
    const lineChirho = loadJsonChirho<SpanLineChirho>(targetChirho.pathChirho);
    validateTargetLineChirho(lineChirho, targetChirho);
    validateTilingChirho(lineChirho);
    const stateChirho = stateForTargetChirho(lineChirho, targetChirho);
    const nextLineChirho = stateChirho === "pre-repair-chirho" ? plannedLineChirho(lineChirho, targetChirho, appliedAtChirho) : lineChirho;
    return { targetChirho, lineChirho, nextLineChirho, stateChirho };
  });

  if (loadedChirho.some((itemChirho) => itemChirho.stateChirho === "unknown-chirho")) {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "blocked-chirho",
      messagesChirho: ["one or more lines are neither in the expected pre-repair state nor already applied"],
      targetsChirho: loadedChirho.map((itemChirho) => ({
        labelChirho: itemChirho.targetChirho.labelChirho,
        stateChirho: itemChirho.stateChirho,
        spansChirho: spanSummaryChirho(itemChirho.lineChirho),
      })),
    }), null, 2));
    process.exitCode = 1;
    return;
  }

  if (loadedChirho.every((itemChirho) => itemChirho.stateChirho === "already-applied-chirho")) {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "already-applied-chirho",
      messagesChirho: ["short question-mark Hebrew garble repairs are already applied"],
      targetsChirho: loadedChirho.map((itemChirho) => ({
        labelChirho: itemChirho.targetChirho.labelChirho,
        stateChirho: itemChirho.stateChirho,
        spansChirho: spanSummaryChirho(itemChirho.lineChirho),
      })),
    }), null, 2));
    return;
  }

  const targetReportsChirho = loadedChirho.map((itemChirho) => ({
    labelChirho: itemChirho.targetChirho.labelChirho,
    stateChirho: itemChirho.stateChirho,
    spansChirho: spanSummaryChirho(itemChirho.nextLineChirho),
  }));

  if (!applyChirho) {
    console.log(JSON.stringify(reportChirho({
      applyChirho,
      statusChirho: "planned-chirho",
      messagesChirho: ["ready to repair two short question-mark Hebrew garbles as vision-tier spans"],
      targetsChirho: targetReportsChirho,
    }), null, 2));
    return;
  }

  for (const itemChirho of loadedChirho) {
    if (itemChirho.stateChirho === "pre-repair-chirho") writeJsonChirho(itemChirho.targetChirho.pathChirho, itemChirho.nextLineChirho);
  }
  writeBackupChirho(appliedAtChirho);
  console.log(JSON.stringify(reportChirho({
    applyChirho,
    statusChirho: "applied-chirho",
    messagesChirho: ["applied short question-mark Hebrew garble repairs; regenerate export, packs, scanners, and status"],
    targetsChirho: targetReportsChirho,
  }), null, 2));
}

if (import.meta.main) mainChirho();
